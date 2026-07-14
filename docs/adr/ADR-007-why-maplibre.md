# ADR-007: Selection of MapLibre GL for Hyperlocal Map Visualizations

## Status
Accepted (Phase 2+)

## Context
JobNest displays job locations, distances, and clusters on interactive maps. We need a vector rendering engine that is highly performant and open-source.

We evaluated Google Maps JavaScript API vs Mapbox GL JS vs MapLibre GL.

## Decision
We chose **MapLibre GL** as our map provider.

## Consequences
*   **Cost Control**: MapLibre is a fully open-source fork of Mapbox GL, meaning there are no commercial license fees or vendor lock-in.
*   **Vector Engine**: Utilizes WebGL for smooth, GPU-accelerated rendering.
*   **Performance**: Minimizes main thread blockage during pin clustering.
