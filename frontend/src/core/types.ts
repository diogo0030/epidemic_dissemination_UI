// src/types.ts
export type Algorithm = "gossip" | "anti_entropy";

export type DisseminationMode = "push" | "pull" | "push_pull";

export type Topology = "ring" | "star" | "tree" | "bus" | "random";

export type NodeState = "SUSCEPTIBLE" | "INFECTIVE" | "REMOVED";

export interface SimulationConfig {
  topology: Topology;
  nodeCount: number;
  algorithm: Algorithm;
  mode: DisseminationMode;
  sourceNodeCount: number;
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

export interface MessageRun {
  id: string;           // ex: "msg-1", "A", "42"...
  label: string;        // texto da tab, ex: "Mensagem 1"
  nodes: NodeData[];    // cópia do array de NodeData para esta mensagem
  round: number;        // número de rondas já feitas
  messages: number;     // nº de mensagens enviadas nesta simulação
}