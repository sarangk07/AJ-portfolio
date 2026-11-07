import React, { useRef, useEffect, useState } from 'react';

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec4 uImageRect;
uniform vec2 uMouse;
uniform vec2 uVelocity;
uniform vec2 uDirection;
uniform float uMotion;
uniform float uActivity;
uniform float uHover;
uniform float uTime;
uniform float uStrength;
uniform float uRadius;
uniform float uTrail;
uniform float uRipple;
uniform float uFlow;
uniform float uRefraction;
uniform float uVelocityAmount;
uniform float uDrift;

varying vec2 vUv;

vec4 sampleCanvas(vec2 canvasUv) {
    vec2 uv = (canvasUv - uImageRect.xy) / max(uImageRect.zw, vec2(0.00001));
    float inside =
        step(0.0, uv.x) * step(uv.x, 1.0) *
        step(0.0, uv.y) * step(uv.y, 1.0);

    if (inside < 0.5) return vec4(0.0);
    return texture2D(uTexture, uv);
}

float bell(float x) {
    x = clamp(x, 0.0, 1.0);
    return x * x * (3.0 - 2.0 * x);
}

float smoother01(float x) {
    x = clamp(x, 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

vec2 safeNormalize(vec2 v) {
    float len = max(length(v), 0.00001);
    return v / len;
}

void main() {
    vec2 p = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 pIso = vec2(p.x * aspect, p.y);
    vec2 mouseIso = vec2(uMouse.x * aspect, uMouse.y);
    vec2 velIso = uVelocity;

    float hover = smoother01(uHover);
    float motion = smoother01(uMotion) * hover;
    float activity = smoother01(clamp(uActivity, 0.0, 1.0)) * hover;

    vec2 dir = safeNormalize(uDirection + vec2(0.000001, 0.0));
    vec2 normal = vec2(-dir.y, dir.x);

    vec2 rel = pIso - mouseIso;
    float along = dot(rel, dir);
    float across = dot(rel, normal);
    float radius = max(uRadius, 0.01);
    float amp = uStrength / max(uResolution.y, 1.0);

    float trailLength = radius * mix(0.7, 3.0, clamp(uTrail, 0.0, 1.5) / 1.5);
    float crossFalloff = exp(-pow(abs(across) / max(radius * 0.65, 0.001), 2.1));
    float behind = exp(-pow(max(-along, 0.0) / max(trailLength, 0.001), 1.35));
    float ahead = exp(-pow(max(along, 0.0) / max(radius * 0.82, 0.001), 2.0));

    float dist = length(rel);
    float contact = 1.0 - smoothstep(radius * 0.08, radius, dist);
    contact = bell(contact);

    float wake = crossFalloff * mix(ahead * 0.24, behind, step(along, 0.0));
    float field = max(contact * 0.72, wake * (0.34 + 0.66 * motion)) * activity;

    float speed = length(velIso);
    float velocityWeight = (0.25 + 0.75 * motion) * clamp(uVelocityAmount, 0.0, 1.6);
    vec2 drag = -dir * amp * uFlow * field * (0.28 + 0.52 * velocityWeight + 0.20 * speed);

    vec2 radial = safeNormalize(rel);
    float centerFade = smoothstep(radius * 0.12, radius * 0.30, dist);
    vec2 lens = -radial * amp * uRefraction * contact * centerFade * (0.28 + 0.32 * motion) * activity;

    float tail = clamp(max(-along, 0.0) / max(trailLength, 0.001), 0.0, 1.0);
    float rippleEnvelope = wake * exp(-tail * 1.05) * (0.35 + 0.65 * motion) * activity;
    float ripplePhase = tail * 11.2 - uTime * (2.2 + uDrift * 1.0) + across * 2.8;
    float ripples = sin(ripplePhase) * 0.5 + sin(ripplePhase * 0.55 + 0.9) * 0.5;
    vec2 rippleOffset = normal * ripples * amp * uRipple * rippleEnvelope * 0.40;

    vec2 warpedIso = pIso + drag + lens + rippleOffset;
    vec2 warpedUv = vec2(warpedIso.x / aspect, warpedIso.y);

    vec4 color = sampleCanvas(warpedUv);
    if (color.a < 0.001) {
        color.rgb = vec3(0.0);
    }

    gl_FragColor = color;
}
`;

export default function HeroTitleLiquid() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [webGlReady, setWebGlReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let gl;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    } catch {
      return;
    }
    if (!gl) return;

    // Compile shaders
    const createShader = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    // Quad geometry
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uniforms = {
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uImageRect: gl.getUniformLocation(program, 'uImageRect'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uVelocity: gl.getUniformLocation(program, 'uVelocity'),
      uDirection: gl.getUniformLocation(program, 'uDirection'),
      uMotion: gl.getUniformLocation(program, 'uMotion'),
      uActivity: gl.getUniformLocation(program, 'uActivity'),
      uHover: gl.getUniformLocation(program, 'uHover'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uStrength: gl.getUniformLocation(program, 'uStrength'),
      uRadius: gl.getUniformLocation(program, 'uRadius'),
      uTrail: gl.getUniformLocation(program, 'uTrail'),
      uRipple: gl.getUniformLocation(program, 'uRipple'),
      uFlow: gl.getUniformLocation(program, 'uFlow'),
      uRefraction: gl.getUniformLocation(program, 'uRefraction'),
      uVelocityAmount: gl.getUniformLocation(program, 'uVelocityAmount'),
      uDrift: gl.getUniformLocation(program, 'uDrift'),
      uTexture: gl.getUniformLocation(program, 'uTexture')
    };

    // Load SVG Texture
    const texture = gl.createTexture();
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = '/images/paul-michel-banner.svg';

    let textureLoaded = false;
    image.onload = () => {
      if (disposed) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        textureLoaded = true;
        setWebGlReady(true);
        wakeLoop();
      } catch (err) {
        console.warn('Hero title texture upload aborted:', err);
      }
    };

    // Interaction tracking state (Framer-grade physics)
    const targetMouse = [0.5, 0.5];
    const smoothedMouse = [0.5, 0.5];
    const velocity = [0, 0];
    const direction = [1, 0];
    let isDirectionInit = false;
    let motionVal = 0;
    let activityVal = 0;
    let hoverVal = 0;
    let isHovered = false;
    let lastMoveTime = 0;
    let fadeStartTime = 0;
    let fadeStartVal = 0;
    let lastRenderTime = performance.now();
    let animFrame = null;
    let isIntersecting = true;
    let containerWidth = container.clientWidth || 1000;
    let containerHeight = container.clientHeight || 200;

    const wakeLoop = () => {
      if (!isIntersecting || animFrame) return;
      lastRenderTime = performance.now();
      animFrame = requestAnimationFrame(render);
    };

    const getNormalizedPos = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientX == null || rect.width <= 0 || rect.height <= 0) return null;
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, 1.0 - (clientY - rect.top) / rect.height)); // WebGL inverted Y
      return [x, y];
    };

    const handlePointerMove = (e) => {
      const pos = getNormalizedPos(e);
      if (!pos) return;
      targetMouse[0] = pos[0];
      targetMouse[1] = pos[1];
      isHovered = true;
      lastMoveTime = performance.now();
      wakeLoop();
    };

    const handlePointerEnter = (e) => {
      const pos = getNormalizedPos(e);
      if (pos) {
        targetMouse[0] = pos[0];
        targetMouse[1] = pos[1];
        smoothedMouse[0] = pos[0];
        smoothedMouse[1] = pos[1];
      }
      velocity[0] = 0;
      velocity[1] = 0;
      isDirectionInit = false;
      motionVal = 0;
      activityVal = 0;
      fadeStartTime = 0;
      fadeStartVal = 0;
      isHovered = true;
      lastMoveTime = performance.now();
      wakeLoop();
    };

    const handlePointerLeave = () => {
      isHovered = false;
      wakeLoop();
    };

    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    // Track visibility: pause rendering when scrolled off screen
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = !!entry?.isIntersecting;
          if (isIntersecting) {
            wakeLoop();
          } else if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
          }
        },
        { threshold: 0.01 }
      );
      io.observe(container);
    }

    // Cache dimensions without reading DOM inside animation frame
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          containerWidth = entry.contentRect.width;
          containerHeight = entry.contentRect.height;
          wakeLoop();
        }
      });
      ro.observe(container);
    }

    // Animation Loop
    const startTime = performance.now();

    const render = (now) => {
      animFrame = null;
      if (disposed || !isIntersecting) return;

      if (!textureLoaded) {
        animFrame = requestAnimationFrame(render);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = containerWidth || 1000;
      const height = containerHeight || 200;

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastRenderTime) / 1000));
      lastRenderTime = now;

      // Soft spring interpolation for mouse
      const springResponse = 4.8;
      const springCoeff = 1 - Math.exp(-springResponse * dt);
      const prevX = smoothedMouse[0];
      const prevY = smoothedMouse[1];
      smoothedMouse[0] += (targetMouse[0] - smoothedMouse[0]) * springCoeff;
      smoothedMouse[1] += (targetMouse[1] - smoothedMouse[1]) * springCoeff;

      // Physical velocity calculation scaled by container size
      const targetVx = Math.min(1.8, Math.max(-1.8, ((smoothedMouse[0] - prevX) * width) / dt / 900));
      const targetVy = Math.min(1.8, Math.max(-1.8, ((smoothedMouse[1] - prevY) * height) / dt / 900));
      const velCoeff = 1 - Math.exp(-8.0 * dt);
      velocity[0] += (targetVx - velocity[0]) * velCoeff;
      velocity[1] += (targetVy - velocity[1]) * velCoeff;

      // Direction smoothing
      const speed = Math.hypot(velocity[0], velocity[1]);
      if (speed > 0.025) {
        const nx = velocity[0] / speed;
        const ny = velocity[1] / speed;
        if (!isDirectionInit) {
          direction[0] = nx;
          direction[1] = ny;
          isDirectionInit = true;
        } else {
          const dirCoeff = 1 - Math.exp(-5.0 * dt);
          direction[0] += (nx - direction[0]) * dirCoeff;
          direction[1] += (ny - direction[1]) * dirCoeff;
          const dirLen = Math.max(1e-5, Math.hypot(direction[0], direction[1]));
          direction[0] /= dirLen;
          direction[1] /= dirLen;
        }
      }

      // Motion magnitude
      const normSpeed = Math.min(1, Math.max(0, (speed - 0.035) / 0.50));
      const targetMotion = normSpeed * normSpeed * (3.0 - 2.0 * normSpeed);
      const motionRate = targetMotion > motionVal ? 7.5 : 4.0;
      motionVal += (targetMotion - motionVal) * (1 - Math.exp(-motionRate * dt));
      if (targetMotion === 0 && motionVal < 0.002) motionVal = 0;

      // Activity with smooth, elegant fadeout (~0.95 seconds)
      const isMoving = isHovered && (now - lastMoveTime < 80);
      if (isMoving) {
        fadeStartTime = 0;
        fadeStartVal = 0;
        activityVal += (1.0 - activityVal) * (1 - Math.exp(-14.0 * dt));
      } else {
        if (fadeStartTime === 0) {
          fadeStartTime = now;
          fadeStartVal = activityVal;
        }
        const fadeProgress = Math.min(1, Math.max(0, (now - fadeStartTime) / 950));
        const fadeCurve = fadeProgress * fadeProgress * (3.0 - 2.0 * fadeProgress);
        activityVal = fadeStartVal * (1.0 - fadeCurve);
        if (fadeProgress >= 1) activityVal = 0;
      }

      // Hover transition
      const targetHover = isHovered ? 1.0 : 0.0;
      const hoverRate = targetHover > hoverVal ? 6.5 : 4.5;
      hoverVal += (targetHover - hoverVal) * (1 - Math.exp(-hoverRate * dt));
      if (!isHovered && hoverVal < 0.001) hoverVal = 0;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Match SVG aspect ratio in canvas
      const imageAspect = 1470 / 250;
      const canvasAspect = width / Math.max(height, 1);
      let rectX = 0,
        rectY = 0,
        rectW = 1,
        rectH = 1;

      if (canvasAspect > imageAspect) {
        rectW = imageAspect / canvasAspect;
        rectX = (1 - rectW) / 2;
      } else {
        rectH = canvasAspect / imageAspect;
        rectY = (1 - rectH) / 2;
      }

      const t = (now - startTime) / 1000;

      // Balanced soft parameters:
      // strength: 25.0 * scaleMultiplier (visible, organic, silky - not harsh or tearing)
      // radius: 0.38 (cushioned, smooth fluid wake)
      // flow: 0.60 (gentle viscous draw)
      // ripple: 0.70 (soft sinusoidal wave roll)
      // refraction: 0.25 (crystal clean fluid lensing)
      const scaleMultiplier = Math.min(1.4, Math.max(0.85, width / 1100));
      const softStrength = 25.0 * scaleMultiplier;

      gl.uniform2f(uniforms.uResolution, width, height);
      gl.uniform4f(uniforms.uImageRect, rectX, rectY, rectW, rectH);
      gl.uniform2f(uniforms.uMouse, smoothedMouse[0], smoothedMouse[1]);
      gl.uniform2f(uniforms.uVelocity, velocity[0], velocity[1]);
      gl.uniform2f(uniforms.uDirection, direction[0], direction[1]);
      gl.uniform1f(uniforms.uMotion, Math.min(1.0, motionVal));
      gl.uniform1f(uniforms.uActivity, Math.min(1.0, activityVal));
      gl.uniform1f(uniforms.uHover, Math.min(1.0, hoverVal));
      gl.uniform1f(uniforms.uTime, t);
      gl.uniform1f(uniforms.uStrength, softStrength);
      gl.uniform1f(uniforms.uRadius, 0.38);
      gl.uniform1f(uniforms.uTrail, 0.85);
      gl.uniform1f(uniforms.uRipple, 0.70);
      gl.uniform1f(uniforms.uFlow, 0.60);
      gl.uniform1f(uniforms.uRefraction, 0.25);
      gl.uniform1f(uniforms.uVelocityAmount, 0.68);
      gl.uniform1f(uniforms.uDrift, 0.26);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.uTexture, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Keep animating if hover, movement, settling, or actively hovered
      const isActive = activityVal > 0.0005 || hoverVal > 0.0005 || isHovered;
      if (isActive) {
        animFrame = requestAnimationFrame(render);
      }
    };

    wakeLoop();

    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      if (animFrame) cancelAnimationFrame(animFrame);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      try {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buffer);
        gl.deleteTexture(texture);
      } catch {}
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-liquid-title-container">
      {/* Crisp vector fallback / baseline image */}
      <img
        src="/images/paul-michel-banner.svg"
        alt="Paul Michel"
        className="hero-liquid-fallback"
        style={{ opacity: webGlReady ? 0 : 1 }}
      />
      {/* Interactive WebGL Ripple Canvas */}
      <canvas
        ref={canvasRef}
        className="hero-liquid-canvas"
        style={{ opacity: webGlReady ? 1 : 0 }}
      />
    </div>
  );
}
