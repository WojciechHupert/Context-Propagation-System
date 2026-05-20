# CPS Website
[![Deploy static content to Pages](https://github.com/WojciechHupert/Moirai_Website/actions/workflows/deploy.yml/badge.svg)](https://github.com/WojciechHupert/Moirai_Website/actions/workflows/deploy.yml)

[**Live Demo**](https://WojciechHupert.github.io/Moirai_Website/)

This folder contains the public website for the **CPS (Context Propagation System) Engine**.

Local project-root path: `CPS-Website/`

## Vision

CPS is an exploratory infrastructure for social memory: a prototype for worlds where information has consequences. It explores what happens when information does not disappear after a conversation, but enters a shared social memory that can propagate, mutate, be constrained, and later be recalled inside artificial social environments.

Lelit Distrikt is one bounded visual endpoint for experiencing CPS through characters, atmosphere, and authored conversational theatre. It is not the system itself, and the current technical focus is not a game, a full society simulator, or an open-ended living world.

This website explains the public CPS concept, system architecture, use cases, and visual language. CPS Studio is the separate proof and inspection surface for local runtime validation and administration.

The internal operations app is separate: `tools/CPS_Studio/frontend-v3/` is CPS Studio for local runtime inspection and administration. It is not this public website.

## Core Component

### CPS Engine (Persistence)
A dual-layer memory model that separates canonical historical truth from volatile, humanized recall. CPS is responsible for making memory socially consequential by giving information lineage, containment rules, propagation paths, and the possibility of later recall with drift.

Lelit Distrikt v1 remains a bounded demonstrator rather than a general life simulator. Its small cast and authored frame exist to make CPS inspectable, not to imply a complete society model.


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
*This project is part of the Lelit Distrikt ecosystem.*
<!-- Triggering deployment redeployment -->

