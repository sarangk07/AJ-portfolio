import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

const ViewportDistortionContext = createContext(null);

export function useViewportDistortion() {
  return useContext(ViewportDistortionContext);
}

// Global Store matching Framer's architecture
const store = {
  elements: new Map(),
  listeners: new Set(),
  canvasReady: false,
  appearEnabled: false,
  effectEnabled: true,
  owner: null,
  sequence: 0
};

function notifyListeners() {
  store.listeners.forEach((fn) => fn());
}

function registerElement(id, node, options) {
  const existing = store.elements.get(id);
  if (existing) {
    const changed = existing.options.src !== options.src;
    existing.node = node;
    existing.options = options;
    if (changed) existing.ready = false;
  } else {
    store.elements.set(id, {
      id,
      node,
      options,
      sequence: store.sequence++,
      ready: false
    });
  }
  notifyListeners();
}

function unregisterElement(id) {
  if (store.elements.delete(id)) {
    notifyListeners();
  }
}

function useIsItemReady(id) {
  const [ready, setReady] = useState(() => {
    const it = store.elements.get(id);
    return !!(store.canvasReady && it?.ready);
  });

  useEffect(() => {
    const check = () => {
      const it = store.elements.get(id);
      const isR = !!(store.canvasReady && it?.ready);
      setReady((prev) => (prev !== isR ? isR : prev));
    };
    store.listeners.add(check);
    check();
    return () => store.listeners.delete(check);
  }, [id]);

  return ready;
}

const VERTEX_SHADER = `
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

uniform vec2 uViewport;
uniform float uVisibleViewportHeight;
uniform float uViewportTopInCanvas;
uniform vec4 uRect;
uniform float uStrength;
uniform float uZoneStart;
uniform float uCurve;
uniform float uVelocity;
uniform float uScrollBoost;
uniform float uScrollLag;
uniform float uVerticalBend;
uniform float uEdgeReach;
uniform float uEdgeFalloff;
uniform float uBottomNarrowing;
uniform float uBottomNarrowStart;
uniform float uBottomNarrowSmoothness;

varying vec2 vUv;
varying vec2 vLocalPx;
varying float vViewportY;
varying float vEdgeMask;
varying float vDeformationZone;
varying float vXNormalized;

float smootherstep01(float value) {
    float t = clamp(value, 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
    vec2 screen = uRect.xy + aPosition * uRect.zw;

    float viewportHeight = max(uVisibleViewportHeight, 1.0);
    float viewportHalfWidth = max(uViewport.x * 0.5, 1.0);
    float visibleScreenY = screen.y - uViewportTopInCanvas;

    float viewportY = clamp(visibleScreenY / viewportHeight, 0.0, 1.0);
    float zone = smoothstep(uZoneStart, 1.0, viewportY);
    zone = pow(zone, max(uCurve, 0.001));

    float safeNarrowStart = clamp(uBottomNarrowStart, uZoneStart + 0.001, 0.995);
    float taperT = clamp(
        (viewportY - safeNarrowStart) / max(1.0 - safeNarrowStart, 0.001),
        0.0,
        1.0
    );

    float smoothness = clamp(uBottomNarrowSmoothness, 0.0, 1.0);
    float slowT = pow(taperT, mix(1.25, 2.6, smoothness));
    float bottomTaper = smootherstep01(slowT);

    float deformationZone = zone - bottomTaper * uBottomNarrowing;

    float xFromCenter = screen.x - viewportHalfWidth;
    float xNormalized = xFromCenter / viewportHalfWidth;

    float clampedViewportX = clamp(screen.x, 0.0, uViewport.x);
    float distanceToEdge = min(clampedViewportX, uViewport.x - clampedViewportX);
    float edgeReachPx = max(uEdgeReach * uViewport.x, 1.0);
    float edgeProgress = clamp(1.0 - distanceToEdge / edgeReachPx, 0.0, 1.0);

    float edgeMask = smoothstep(0.0, 1.0, edgeProgress);
    edgeMask = pow(edgeMask, max(uEdgeFalloff, 0.001));

    float amount = uStrength + abs(uVelocity) * uScrollBoost;
    float horizontalShift = xFromCenter * deformationZone * amount * edgeMask;
    screen.x += horizontalShift;

    screen.y += deformationZone * edgeMask * uVelocity * uScrollLag;
    screen.y += deformationZone * edgeMask * abs(xNormalized) * uVerticalBend;

    vec2 clip = vec2(
        screen.x / uViewport.x * 2.0 - 1.0,
        1.0 - screen.y / uViewport.y * 2.0
    );

    gl_Position = vec4(clip, 0.0, 1.0);
    vUv = aUv;
    vLocalPx = aPosition * uRect.zw;
    vViewportY = viewportY;
    vEdgeMask = edgeMask;
    vDeformationZone = deformationZone;
    vXNormalized = xNormalized;
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform float uUseTexture;
uniform vec4 uColor;
uniform vec2 uImageSize;
uniform vec2 uBoxSize;
uniform float uFit;
uniform vec2 uPosition;
uniform float uRadius;
uniform float uOpacity;
uniform float uHoverScale;
uniform vec2 uHoverOrigin;
uniform float uGlossEnabled;
uniform float uGlossOpacity;
uniform float uGlossStart;
uniform float uGlossWidth;
uniform float uGlossSoftness;
uniform float uGlossTilt;

varying vec2 vUv;
varying vec2 vLocalPx;
varying float vViewportY;
varying float vEdgeMask;
varying float vDeformationZone;
varying float vXNormalized;

float roundedRectMask(vec2 point, vec2 size, float radius) {
    float safeRadius = min(radius, min(size.x, size.y) * 0.5);
    vec2 halfSize = size * 0.5;
    vec2 q = abs(point - halfSize) - (halfSize - vec2(safeRadius));
    float distanceToEdge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - safeRadius;
    return 1.0 - smoothstep(-0.75, 0.75, distanceToEdge);
}

float smootherstepFrag(float value) {
    float t = clamp(value, 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    vec4 pixel;

    if (uUseTexture > 0.5) {
        vec2 box = max(uBoxSize, vec2(1.0));
        vec2 image = max(uImageSize, vec2(1.0));
        float boxAspect = box.x / box.y;
        float imageAspect = image.x / image.y;

        float safeHoverScale = max(uHoverScale, 1.0);
        vec2 uv = uHoverOrigin + (vUv - uHoverOrigin) / safeHoverScale;

        // 0 = cover
        if (uFit < 0.5) {
            vec2 visibleFraction = vec2(1.0);
            if (imageAspect > boxAspect) {
                visibleFraction.x = boxAspect / imageAspect;
            } else {
                visibleFraction.y = imageAspect / boxAspect;
            }
            uv = uv * visibleFraction + (vec2(1.0) - visibleFraction) * uPosition;
        }

        pixel = texture2D(uTexture, uv);
    } else {
        pixel = uColor;
    }

    if (uGlossEnabled > 0.5) {
        float glossStart = clamp(uGlossStart, 0.0, 0.96);
        float glossSpan = clamp(uGlossWidth, 0.05, 0.55);
        float glossSoft = clamp(uGlossSoftness, 0.01, 0.25);

        float yShift = vXNormalized * uGlossTilt * 0.06;
        float top = clamp(glossStart + yShift, 0.0, 0.98);
        float bottom = clamp(top + glossSpan, top + 0.001, 1.0);
        float span = max(bottom - top, 0.001);
        float verticalPos = clamp((vViewportY - top) / span, 0.0, 1.0);

        float shoulder = clamp(glossSoft / span, 0.03, 0.48);
        float enter = smootherstepFrag(clamp(verticalPos / shoulder, 0.0, 1.0));
        float leave = 1.0 - smootherstepFrag(clamp((verticalPos - (1.0 - shoulder)) / shoulder, 0.0, 1.0));
        float envelope = enter * leave;

        float bell = sin(verticalPos * 3.14159265359);
        bell = pow(max(bell, 0.0), mix(2.2, 0.9, glossSoft / 0.25));
        float verticalLight = mix(envelope, bell, 0.65);

        float bendStrength = smootherstepFrag(clamp((max(vDeformationZone, 0.0) - 0.01) / 0.22, 0.0, 1.0));
        float edgePresence = smootherstepFrag(clamp((vEdgeMask - 0.02) / 0.78, 0.0, 1.0));
        float centerSoft = 0.82 + 0.18 * (1.0 - abs(vXNormalized));

        float core = verticalLight * bendStrength * mix(0.42, 1.0, edgePresence) * centerSoft;
        float aura = envelope * bendStrength * (0.18 + 0.24 * edgePresence);
        float lighting = core + aura;

        float glossAmount = clamp(lighting * uGlossOpacity, 0.0, 1.0);
        float dither = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
        glossAmount = clamp(glossAmount + dither * (0.55 + 0.45 * glossAmount), 0.0, 1.0);
        pixel.rgb = pixel.rgb + (vec3(1.0) - pixel.rgb) * glossAmount;
    }

    float cornerMask = roundedRectMask(vLocalPx, uBoxSize, uRadius);
    pixel.a *= cornerMask * uOpacity;

    if (pixel.a <= 0.001) discard;
    gl_FragColor = pixel;
}
`;

function createSubdividedPlane(cols = 12, rows = 60) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      positions.push(c / cols, r / rows);
      uvs.push(c / cols, r / rows);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p1 = r * (cols + 1) + c;
      const p2 = p1 + 1;
      const p3 = p1 + cols + 1;
      const p4 = p3 + 1;
      indices.push(p1, p3, p2, p2, p3, p4);
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices)
  };
}

class ViewportWarpRenderer {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.disposed = false;
    this.animationFrame = 0;
    this.textures = new Map();
    this.lastScrollY = window.scrollY;
    this.lastTime = performance.now();
    this.velocity = 0;
    this.velocityFrameScale = 1;
    this.geometryCache = new Map();
    this.pointerX = -1e5;
    this.pointerY = -1e5;
    this.pointerActive = false;
    this.hoverStates = new Map();
    this.canvasAnchorTop = 0;
    this.canvasAnchorInitialized = false;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false
    });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;

    const createShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    this.program = program;

    this.positionLocation = gl.getAttribLocation(program, 'aPosition');
    this.uvLocation = gl.getAttribLocation(program, 'aUv');

    const getU = (name) => gl.getUniformLocation(program, name);
    this.uniforms = {
      viewport: getU('uViewport'),
      visibleViewportHeight: getU('uVisibleViewportHeight'),
      viewportTopInCanvas: getU('uViewportTopInCanvas'),
      rect: getU('uRect'),
      strength: getU('uStrength'),
      zoneStart: getU('uZoneStart'),
      curve: getU('uCurve'),
      velocity: getU('uVelocity'),
      scrollBoost: getU('uScrollBoost'),
      scrollLag: getU('uScrollLag'),
      verticalBend: getU('uVerticalBend'),
      edgeReach: getU('uEdgeReach'),
      edgeFalloff: getU('uEdgeFalloff'),
      bottomNarrowing: getU('uBottomNarrowing'),
      bottomNarrowStart: getU('uBottomNarrowStart'),
      bottomNarrowSmoothness: getU('uBottomNarrowSmoothness'),
      glossEnabled: getU('uGlossEnabled'),
      glossOpacity: getU('uGlossOpacity'),
      glossStart: getU('uGlossStart'),
      glossWidth: getU('uGlossWidth'),
      glossSoftness: getU('uGlossSoftness'),
      glossTilt: getU('uGlossTilt'),
      hoverScale: getU('uHoverScale'),
      hoverOrigin: getU('uHoverOrigin'),
      texture: getU('uTexture'),
      useTexture: getU('uUseTexture'),
      color: getU('uColor'),
      imageSize: getU('uImageSize'),
      boxSize: getU('uBoxSize'),
      fit: getU('uFit'),
      position: getU('uPosition'),
      radius: getU('uRadius'),
      opacity: getU('uOpacity')
    };

    const mesh = createSubdividedPlane(12, 60);
    this.indexCount = mesh.indices.length;

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

    this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    this.lastScrollActivityTime = performance.now();
    this.lenisAttached = false;

    // Event listeners
    this.handleScroll = () => {
      this.lastScrollActivityTime = performance.now();
      this.wakeRenderer();
    };

    this.handlePointerMove = (e) => {
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.pointerActive = true;
      this.wakeRenderer();
    };

    this.handlePointerLeave = () => {
      this.pointerActive = false;
      this.pointerX = -1e5;
      this.pointerY = -1e5;
      this.wakeRenderer();
    };

    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
    window.addEventListener('resize', this.handleScroll, { passive: true });

    // Sync with Lenis instance
    const attachLenis = () => {
      if (window.__lenisInstance && !this.lenisAttached) {
        window.__lenisInstance.on('scroll', this.handleScroll);
        this.lenisAttached = true;
        if (this.lenisInterval) {
          clearInterval(this.lenisInterval);
          this.lenisInterval = null;
        }
      }
    };
    attachLenis();
    if (!this.lenisAttached) {
      this.lenisInterval = setInterval(attachLenis, 300);
    }

    this.handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
      } else {
        this.lastScrollActivityTime = performance.now();
        this.wakeRenderer();
      }
    };
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.wakeRenderer();
  }

  wakeRenderer() {
    if (this.disposed || document.hidden || this.animationFrame) return;
    this.animationFrame = requestAnimationFrame(this.render.bind(this));
  }

  createTexture(src) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

    const record = { src, texture: tex, width: 1, height: 1, ready: false };
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const upload = (sourceImg) => {
      if (this.disposed) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceImg);
        record.width = sourceImg.naturalWidth || sourceImg.width || 1;
        record.height = sourceImg.naturalHeight || sourceImg.height || 1;
        record.ready = true;
        this.syncReadyFlags();
        this.wakeRenderer();
      } catch (err) {
        console.warn('WebGL texture upload error:', err);
      }
    };

    img.onload = () => upload(img);
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => upload(fallbackImg);
      fallbackImg.src = src;
    };
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      upload(img);
    }

    return record;
  }

  acquireTexture(src) {
    let rec = this.textures.get(src);
    if (!rec) {
      rec = this.createTexture(src);
      this.textures.set(src, rec);
    }
    return rec;
  }

  syncReadyFlags() {
    let anyReady = false;
    for (const item of store.elements.values()) {
      const tex = this.textures.get(item.options.src);
      if (tex && tex.ready) {
        item.ready = true;
        anyReady = true;
      }
    }
    store.canvasReady = anyReady;
    notifyListeners();
  }

  getHoverProgress(id, isActive, now) {
    let state = this.hoverStates.get(id);
    const target = isActive ? 1 : 0;
    if (!state) {
      state = { value: 0, from: 0, to: target, startTime: now };
      this.hoverStates.set(id, state);
    }
    if (state.to !== target) {
      state.from = state.value;
      state.to = target;
      state.startTime = now;
    }
    const duration = 650;
    const progress = Math.min(1, Math.max(0, (now - state.startTime) / duration));
    state.value = state.from + (state.to - state.from) * progress;
    return state.value;
  }

  render(now) {
    this.animationFrame = 0;
    if (this.disposed) return;

    const gl = this.gl;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.settings.maxDpr || 1.35);

    const canvasW = Math.round(vpW * dpr);
    const canvasH = Math.round(vpH * dpr);
    if (this.canvas.width !== canvasW || this.canvas.height !== canvasH) {
      this.canvas.width = canvasW;
      this.canvas.height = canvasH;
      this.canvas.style.width = `${vpW}px`;
      this.canvas.style.height = `${vpH}px`;
      gl.viewport(0, 0, canvasW, canvasH);
    }

    // Calculate scroll velocity
    const pageY = window.scrollY || window.pageYOffset || 0;
    const dt = Math.max(1, Math.min(now - this.lastTime, 100));
    const dScroll = pageY - this.lastScrollY;
    const rawVel = dScroll / dt;
    this.velocity += ((rawVel / 1.8) - this.velocity) * 0.2;
    if (Math.abs(this.velocity) < 0.001) this.velocity = 0;
    this.lastScrollY = pageY;
    this.lastTime = now;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    // Bind mesh geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.enableVertexAttribArray(this.uvLocation);
    gl.vertexAttribPointer(this.uvLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // Set viewport uniforms
    gl.uniform2f(this.uniforms.viewport, vpW, vpH);
    gl.uniform1f(this.uniforms.visibleViewportHeight, vpH);
    gl.uniform1f(this.uniforms.viewportTopInCanvas, 0);
    gl.uniform1f(this.uniforms.zoneStart, this.settings.zoneStart);
    gl.uniform1f(this.uniforms.curve, this.settings.curve);
    gl.uniform1f(this.uniforms.velocity, this.velocity);
    gl.uniform1f(this.uniforms.edgeReach, this.settings.edgeReach);
    gl.uniform1f(this.uniforms.edgeFalloff, this.settings.edgeFalloff);
    gl.uniform1f(this.uniforms.bottomNarrowing, this.settings.bottomNarrowing);
    gl.uniform1f(this.uniforms.bottomNarrowStart, this.settings.bottomNarrowStart);
    gl.uniform1f(this.uniforms.bottomNarrowSmoothness, this.settings.bottomNarrowSmoothness);
    gl.uniform1f(this.uniforms.glossEnabled, this.settings.glossEnabled ? 1 : 0);
    gl.uniform1f(this.uniforms.glossOpacity, this.settings.glossOpacity);
    gl.uniform1f(this.uniforms.glossStart, this.settings.glossStart);
    gl.uniform1f(this.uniforms.glossWidth, this.settings.glossWidth);
    gl.uniform1f(this.uniforms.glossSoftness, this.settings.glossSoftness);
    gl.uniform1f(this.uniforms.glossTilt, this.settings.glossTilt);
    gl.uniform1i(this.uniforms.texture, 0);

    const items = Array.from(store.elements.values()).filter((e) => e.options.enabled && e.node.isConnected);

    for (const item of items) {
      const rect = item.node.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vpH + 100 || rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      const texRec = this.acquireTexture(item.options.src);
      if (!texRec || !texRec.ready) {
        continue;
      }

      const b = item.options.distortion || 1;
      gl.uniform4f(this.uniforms.rect, rect.left, rect.top, rect.width, rect.height);
      gl.uniform1f(this.uniforms.strength, this.settings.strength * b);
      gl.uniform1f(this.uniforms.scrollBoost, this.settings.scrollBoost * b);
      gl.uniform1f(this.uniforms.scrollLag, this.settings.scrollLag * b);
      gl.uniform1f(this.uniforms.verticalBend, this.settings.verticalBend * b);
      gl.uniform2f(this.uniforms.boxSize, rect.width, rect.height);
      gl.uniform2f(this.uniforms.position, 0.5, 0.5);
      gl.uniform1f(this.uniforms.radius, item.options.radius || 14);
      gl.uniform1f(this.uniforms.opacity, 1.0);

      const isHovered =
        this.pointerActive &&
        this.pointerX >= rect.left &&
        this.pointerX <= rect.right &&
        this.pointerY >= rect.top &&
        this.pointerY <= rect.bottom;
      const hoverProgress = this.getHoverProgress(item.id, isHovered, now);
      const hoverScale = 1 + (this.settings.hoverZoomAmount || 0.06) * hoverProgress;

      gl.uniform1f(this.uniforms.hoverScale, hoverScale);
      gl.uniform2f(this.uniforms.hoverOrigin, 0.5, 0.5);
      gl.uniform1f(this.uniforms.fit, 0); // cover

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texRec.texture);
      gl.uniform1f(this.uniforms.useTexture, 1);
      gl.uniform2f(this.uniforms.imageSize, texRec.width, texRec.height);

      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    // Keep animating if moving, hovering, or recent scroll activity
    const isMoving = Math.abs(this.velocity) > 0.001;
    const isPointerMoving = this.pointerActive;
    const isRecentlyScrolled = (now - this.lastScrollActivityTime) < 350;
    const isHoverAnimating = Array.from(this.hoverStates.values()).some((s) => Math.abs(s.value - s.to) > 0.001);

    if (isMoving || isPointerMoving || isRecentlyScrolled || isHoverAnimating) {
      this.animationFrame = requestAnimationFrame(this.render.bind(this));
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('resize', this.handleScroll);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (window.__lenisInstance && this.lenisAttached) {
      window.__lenisInstance.off('scroll', this.handleScroll);
    }
    if (this.lenisInterval) {
      clearInterval(this.lenisInterval);
    }
    for (const t of this.textures.values()) {
      this.gl.deleteTexture(t.texture);
    }
    this.textures.clear();
    this.gl.deleteBuffer(this.positionBuffer);
    this.gl.deleteBuffer(this.uvBuffer);
    this.gl.deleteBuffer(this.indexBuffer);
    this.gl.deleteProgram(this.program);
  }
}

export const SETTINGS = {
  strength: 0.075,
  zoneStart: 0.64,
  curve: 1.75,
  scrollBoost: 0.075,
  scrollLag: 5.0,
  verticalBend: 5.0,
  edgeReach: 0.32,
  edgeFalloff: 1.35,
  bottomNarrowing: 0.08,
  bottomNarrowStart: 0.82,
  bottomNarrowSmoothness: 1.0,
  glossEnabled: true,
  glossOpacity: 0.04,
  glossStart: 0.82,
  glossWidth: 0.38,
  glossSoftness: 0.25,
  glossTilt: 0.0,
  hoverZoomEnabled: true,
  hoverZoomAmount: 0.06,
  maxDpr: 1.35
};

export function ViewportDistortionProvider({ children }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      rendererRef.current = new ViewportWarpRenderer(canvas, SETTINGS);
    } catch (err) {
      console.warn('WebGL Viewport Distortion initialization failed:', err);
    }

    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  const contextValue = useMemo(() => ({
    register: registerElement,
    unregister: unregisterElement
  }), []);

  return (
    <ViewportDistortionContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
              zIndex: 5,
              background: 'transparent'
            }}
          />,
          document.body
        )}
    </ViewportDistortionContext.Provider>
  );
}

// ViewportImage component matching Framer's ViewportImage
export function ViewportImage({
  src,
  alt = '',
  radius = 14,
  fit = 'cover',
  className = '',
  children
}) {
  const nodeRef = useRef(null);
  const [itemId] = useState(() => `vp-img-${Math.random().toString(36).slice(2)}`);
  const isReady = useIsItemReady(itemId);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    registerElement(itemId, el, {
      src,
      radius,
      fit,
      enabled: true,
      distortion: 1
    });

    return () => unregisterElement(itemId);
  }, [itemId, src, radius, fit]);

  return (
    <div
      ref={nodeRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: `${radius}px`,
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: fit,
          opacity: isReady ? 0 : 1,
          transition: 'opacity 150ms ease-out',
          userSelect: 'none'
        }}
      />
      {children}
    </div>
  );
}
