// src/core/graphLayout.ts
import type { NodeData, Topology } from "./types";

// Nós em círculo – uso para ring, star, random
function generateCircularNodes(n: number): NodeData[] {
  const cx = 250;
  const cy = 250;
  const radius = 220;

  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return {
      id: i,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      state: "SUSCEPTIBLE",
      storedMessages: [],
    };
  });
}



// Layout estrela: nó 0 no centro, outros à volta
function generateStarNodes(n: number): NodeData[] {
  const cx = 250;
  const cy = 250;
  const radius = 220;

  const nodes: NodeData[] = [];

  // 1. Nó 0 no centro
  nodes.push({
    id: 0,
    x: cx,
    y: cy,
    state: "SUSCEPTIBLE",
    storedMessages: [],
  });

  if (n <= 1) return nodes;

  // 2. Restantes (1..n-1) em círculo
  const remaining = n - 1;
  for (let i = 1; i < n; i++) {
    // distribuir uniformemente
    // i vai de 1 a n-1. Queremos angulos baseados em 0..(remaining-1)
    const angle = (2 * Math.PI * (i - 1)) / remaining;
    nodes.push({
      id: i,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      state: "SUSCEPTIBLE",
      storedMessages: [],
    });
  }

  return nodes;
}

/**
 * Funções de layout que só calculam x,y para cada topologia.
 * As arestas (edges) são tratadas noutro lado.
 */
export function layoutNodes(topology: Topology, n: number): NodeData[] {
  switch (topology) {
    case "ring":
    case "full mesh":
    case "partial mesh":
      return generateCircularNodes(n);

    case "star":
      return generateStarNodes(n);

    default:
      return generateCircularNodes(n);
  }
}
