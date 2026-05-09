# Moirai Website (Moirai Studio Pro Visualization)
[![Deploy static content to Pages](https://github.com/WojciechHupert/Moirai_Website/actions/workflows/deploy.yml/badge.svg)](https://github.com/WojciechHupert/Moirai_Website/actions/workflows/deploy.yml)

[**Live Demo**](https://WojciechHupert.github.io/Moirai_Website/)

This repository contains the web-based visualization and administrative interface for the **Lelit Distrikt 2** project and its **Moirai Engine**.

## Vision

Moirai is a clinical, high-performance cognitive persistence engine designed to manage the "threads of life" for subjects within the Lelit Distrikt simulation. This website serves as the primary observation layer—Moirai Studio—allowing researchers and administrators to audit shared truths, memory propagation, and the evolution of digital consciousness.

## Core Components

### 1. Moirai Engine (Persistence)
A dual-layer memory model that separates canonical historical truth from volatile, humanized recall. It ensures that subjects remember their past with the nuance, emotion, and occasional drift characteristic of human thought.

### 2. Moirai Studio (Visualization)
- **3D Social Network:** An immersive force-directed graph visualizing real-time relationship shifts and social clusters.
- **Metro System Map:** A technical schematic of the memory processing pipeline, from sensory ingestion to social propagation.
- **Administrative Suite:** Diagnostic tools for monitoring neural vitals and historical integrity.

## Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Visualization:** [react-force-graph-3d](https://github.com/vasturiano/react-force-graph)
- **3D Engine:** [Three.js](https://threejs.org/)
- **Data Flow:** [XYFlow (@xyflow/react)](https://xyflow.com/)
- **Styling:** Vanilla CSS (Brutalist/Clinical Aesthetic)

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

### Build

Build for production:

```bash
npm run build
```

## Project Structure

- `src/`: Main application logic.
  - `ForceGraph.jsx`: The core 3D social network visualization.
  - `system.jsx`: React Flow implementation for the system architecture.
  - `style.css`: Global design system and typography.
  - `system.css`: Layout and component styles for the system page.
- `public/`: Static assets (Logos, Illustrations, Social Previews).
- `references/`: Detailed project specifications and "Source of Truth" documents.

---

*Created by: Wojciech Hupert // Shapeseeds*
*This project is part of the Lelit Distrikt 2 ecosystem.*

