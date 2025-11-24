// src/types.ts
export type Algorithm = "gossip" | "anti_entropy";

export type Topology = "ring" | "star" | "tree" | "bus" | "random";

export type NodeState = "SUSCEPTIBLE" | "INFECTIVE" | "REMOVED";

export interface SimulationConfig {
  topology: Topology;
  nodeCount: number;
  algorithm: Algorithm;
}

export interface NodeData {
  id: number;
  x: number;
  y: number;
  state: NodeState;
}

export interface EdgeData {
  from: number;
  to: number;
}

// exemplo de resposta do backend
export interface GraphResponse {
  nodes: { id: number }[];
  edges: { from: number; to: number }[];
}
