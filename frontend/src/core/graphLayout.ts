// src/core/graphLayout.ts
import type { NodeData, Topology } from "./types";

// Nós em círculo – uso para ring, star, random
function generateCircularNodes(n: number): NodeData[] {
  const cx = 250;
  const cy = 215;
  const radius = 160;

  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return {
      id: i,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      state: "SUSCEPTIBLE",
    };
  });
}

// Layout em camadas para árvore binária
function generateTreeNodes(n: number): NodeData[] {
  const levels: number[][] = [];
  for (let i = 0; i < n; i++) {
    const level = Math.floor(Math.log2(i + 1));
    if (!levels[level]) levels[level] = [];
    levels[level].push(i);
  }

  const maxWidth = 500;
  const levelHeight = 80;

  const nodes: NodeData[] = [];
  levels.forEach((ids, level) => {
    const gap = maxWidth / (ids.length + 1);
    ids.forEach((id, idx) => {
      nodes.push({
        id,
        x: gap * (idx + 1),
        y: 60 + levelHeight * level,
        state: "SUSCEPTIBLE",
      });
    });
  });

  return nodes;
}

/**
 * Funções de layout que só calculam x,y para cada topologia.
 * As arestas (edges) são tratadas noutro lado.
 */
export function layoutNodes(topology: Topology, n: number): NodeData[] {
  switch (topology) {
    case "ring":
    case "star":
    case "random":
      return generateCircularNodes(n);

    case "bus":
      // linha horizontal (tipo bus)
      return Array.from({ length: n }, (_, i) => ({
        id: i,
        x: 50 + (400 * i) / Math.max(1, n - 1),
        y: 215,
        state: "SUSCEPTIBLE",
      }));

    case "tree":
      return generateTreeNodes(n);
  }
}
