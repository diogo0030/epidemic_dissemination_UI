import type { NodeData, EdgeData, Topology } from "./types";

// Nós em círculo – uso para ring, star, random
function generateCircularNodes(n: number): NodeData[] {
  const cx = 250;
  const cy = 250;
  const radius = 180;

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
        y: 60 + level * levelHeight,
        state: "SUSCEPTIBLE",
      });
    });
  });

  return nodes;
}

export function generateMockGraph(topology: Topology, n: number): {
  nodes: NodeData[];
  edges: EdgeData[];
} {
  let nodes: NodeData[] = [];
  const edges: EdgeData[] = [];

  switch (topology) {
    case "ring": {
      nodes = generateCircularNodes(n);
      for (let i = 0; i < n; i++) {
        edges.push({ from: i, to: (i + 1) % n });
      }
      break;
    }

    case "star": {
      nodes = generateCircularNodes(n);
      // nó 0 é o centro
      for (let i = 1; i < n; i++) {
        edges.push({ from: 0, to: i });
      }
      break;
    }

    case "bus": {
      // vou modelar bus como uma linha backbone
      nodes = Array.from({ length: n }, (_, i) => ({
        id: i,
        x: 50 + (400 * i) / Math.max(1, n - 1),
        y: 250,
        state: "SUSCEPTIBLE",
      }));
      for (let i = 0; i < n - 1; i++) {
        edges.push({ from: i, to: i + 1 });
      }
      break;
    }

    case "tree": {
      // árvore binária
      nodes = generateTreeNodes(n);
      for (let i = 0; i < n; i++) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n) edges.push({ from: i, to: left });
        if (right < n) edges.push({ from: i, to: right });
      }
      break;
    }

    case "random": {
      nodes = generateCircularNodes(n);
      // garantir conectividade com uma linha base
      for (let i = 0; i < n - 1; i++) {
        edges.push({ from: i, to: i + 1 });
      }
      // adicionar arestas extra aleatórias
      const p = 0.2; // probabilidade de ligar um par (ajusta se quiseres)
      for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
          if (Math.random() < p) {
            edges.push({ from: i, to: j });
          }
        }
      }
      break;
    }
  }

  return { nodes, edges };
}
