# Paul Michel — Creative Director & Art Director Portfolio

A high-performance portfolio website inspired by [paul-michel.framer.website](https://paul-michel.framer.website/), built with **React**, **Vite**, **WebGL (Viewport Warp Distortion & Liquid Title Shaders)**, and **Lenis Smooth Scroll**.

---

## 📁 Project Structure

```text
├── public/
│   └── images/               <-- 🖼️ ALL WEBSITE IMAGES LIVE HERE
│       ├── syndicate.jpg
│       ├── beyond-the-screen.jpg
│       ├── about-portrait-1.jpg
│       ├── about-portrait-2.jpg
│       └── ...
├── src/
│   ├── components/           <-- WebGL & UI components (ViewportDistortion, HeroTitleLiquid, TextRing3D, etc.)
│   ├── data/
│   │   └── projects.js       <-- ⚙️ CENTRAL CONTENT & IMAGE CONFIGURATION
│   ├── pages/                <-- HomePage, WorkPage, AboutPage, ProjectDetailPage
│   ├── App.jsx               <-- Main router & state manager
│   └── index.css             <-- Global typography & styling
└── README.md
```

---

## 🖼️ How to Change Website Images

There are **two simple ways** to swap the images with your own:

### Method 1: Drop-In Replacement (Zero Code Required)
The fastest and easiest way:
1. Name your new images with the **exact same filename** (e.g. `syndicate.jpg`, `about-portrait-1.jpg`).
2. Drop them into the `public/images/` folder, replacing the old ones.
3. The website will automatically display your new images immediately!

### Method 2: Custom Filenames (Via Config File)
If your images have different names (e.g., `my-project-1.png`):
1. Place your new images into `public/images/`.
2. Open [`src/data/projects.js`](src/data/projects.js).
3. Update the `image` or `gallery` path to your new file name (e.g. `image: '/images/my-project-1.png'`).

---

## 📋 Image Reference Guide

| Section | Image File Path | Recommended Size / Aspect Ratio | Description |
| :--- | :--- | :--- | :--- |
| **Home & Work Cards** | `/images/syndicate.jpg` | ~1600 × 1400 (aspect ~1.12:1) | Syndicate project card cover |
| **Home & Work Cards** | `/images/beyond-the-screen.jpg` | ~1600 × 1400 (aspect ~1.12:1) | Beyond the Screen card cover |
| **Home & Work Cards** | `/images/machines-children.jpg` | ~1600 × 1400 (aspect ~1.12:1) | Machine's Children card cover |
| **Home & Work Cards** | `/images/medium-scene.jpg` | ~1600 × 1400 (aspect ~1.12:1) | Medium Scene card cover |
| **Home & Work Cards** | `/images/kaleidoscope.jpg` | ~1600 × 1400 (aspect ~1.12:1) | Kaleidoscope card cover |
| **Home & Work Cards** | `/images/camera-rx.jpg` | ~1600 × 1400 (aspect ~1.12:1) | Camera RX card cover |
| **About Page (Top Right)** | `/images/about-portrait-1.jpg` | ~1000 × 1200 (vertical portrait) | Portrait photo next to the Bio card |
| **About Page (Bottom)** | `/images/about-portrait-2.jpg` | ~1920 × 960 (wide landscape 16:8) | Full-width studio environment photo |
| **Work Page Hero (3D Cylinder)** | `/images/slide-1.jpg` to `slide-10.jpg` | ~800 × 1000 | 10 rotating slides in the 3D cylinder |
| **Project Details Gallery** | `/images/syndicate-gallery-1.jpg` to `5` | ~1600 × 1000 (landscape) | Detail page showcase gallery images |
| **Hero & Footer Brand Title** | `/images/paul-michel-banner.svg` | SVG vector | Main name banner used in liquid ripple WebGL |

---

## ✍️ How to Change Project Details & Texts

All projects, descriptions, tags, clients, services, and experience entries are centralized in:
👉 [`src/data/projects.js`](src/data/projects.js)

To add or edit a project, simply update the JSON objects inside the `projects` array:
```javascript
{
  id: 'my-project',
  slug: 'my-project',
  title: 'My Project Name',
  tags: ['Branding', 'Art Direction'],
  image: '/images/my-cover.jpg',
  year: '2026',
  client: 'Client Name',
  overview: 'Short overview text...',
  extended: 'Longer project background narrative...',
  services: ['Branding', 'Web Design'],
  gallery: [
    '/images/my-cover.jpg',
    '/images/mockup-1.jpg',
    '/images/mockup-2.jpg'
  ],
  liveUrl: 'https://example.com'
}
```

---

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production deployment
npm run build
```
