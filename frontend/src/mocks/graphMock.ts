// src/mocks/graphMock.ts
import type { NodeData, EdgeData, Topology } from "../core/types";
import { layoutNodes } from "../core/graphLayout";

export function generateMockGraph(
  topology: Topology,
  n: number
): { nodes: NodeData[]; edges: EdgeData[] } {
  // coordenadas calculadas pelo layout "real"
  const nodes = layoutNodes(topology, n);
  const edges: EdgeData[] = [];

  switch (topology) {
    case "ring": {
      for (let i = 0; i < n; i++) {
        edges.push({ from: i, to: (i + 1) % n });
      }
      break;
    }

    case "star": {
      // nó 0 é o centro
      for (let i = 1; i < n; i++) {
        edges.push({ from: 0, to: i });
      }
      break;
    }

    case "bus": {
      for (let i = 0; i < n - 1; i++) {
        edges.push({ from: i, to: i + 1 });
      }
      break;
    }

    case "tree": {
      // árvore binária indexada
      for (let i = 0; i < n; i++) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < n) edges.push({ from: i, to: left });
        if (right < n) edges.push({ from: i, to: right });
      }
      break;
    }

    case "random": {
      // garantir conectividade com uma linha base
      for (let i = 0; i < n - 1; i++) {
        edges.push({ from: i, to: i + 1 });
      }
      // adicionar arestas extra aleatórias
      const p = 0.2; // probabilidade de ligar um par
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
