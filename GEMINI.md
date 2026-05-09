# Gemini Project Instructions - Moirai Website

These instructions are foundational for any agent working on the Moirai Website project.

## Project Context

The Moirai Website is a visualization layer for the **Moirai Engine**, which handles cognitive persistence for NPCs in the **Lelit Distrikt 2** simulation (Unreal Engine 5.7).

## Architectural Guidelines

- **Visualization:** Use `react-force-graph-3d` for the primary social network visualization.
- **Styling:** Prefer Vanilla CSS (see `src/style.css`, `src/system.css`).
- **Dependencies:** Always check `package.json` before adding new libraries. The project currently uses React 19 and Vite 8.
- **Integration:** The website is designed to interact with a shared SQLite database and local AI inference (Ollama).

## Key Files & Paths

- `src/ForceGraph.jsx`: The primary 3D graph implementation.
- `src/GraphApp.jsx`: React entry point for the graph.
- `references/project-source-of-truth.md`: The canonical document for project state.
- `references/moirai-continuity-specification.md`: The core logic specification for the Moirai Engine.

## Workflows

- **Testing:** Ensure that graph performance is maintained, especially with large node counts. Bloom effects should be used sparingly to keep GPU load reasonable.
- **Documentation:** Keep `README.md` and `references/` updated as the project evolves.

## External Resources

- [React Force Graph Documentation](https://github.com/vasturiano/react-force-graph)
