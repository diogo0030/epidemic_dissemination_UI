// src/types.ts
export type Algorithm = "gossip_blind_coin" | "gossip_feedback_coin" | "anti_entropy";

export type DisseminationMode = "push" | "pull" | "pushpull";

export type Topology = "ring" | "star" | "full mesh" | "partial mesh";

export type NodeState = "SUSCEPTIBLE" | "INFECTIVE" | "REMOVED";

export interface SimulationConfig {
  topology: Topology;
  nodeCount: number;
  algorithm: Algorithm;
  mode: DisseminationMode;
  deployment: "local" | "distributed";
  sourceNodeCount: number;
}

export interface StoredMessage {
  subject: string;
  timestamp: number;
  sourceId: number;
  round: number;
  data?: any;
}

export interface NodeData {
  id: number;
  x: number;
  y: number;
  state: NodeState;
  storedMessages: StoredMessage[];
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
  history: { round: number; infected: number }[]; // histórico para o gráfico
}

export interface SupervisorStartMessage {
  direction: "ui_to_supervisor";
  messageType: "start_system";
  addr: string;
  N: number;
  sourceNodes: number;
  topology: Topology;
  protocol: Algorithm;
  mode: DisseminationMode;
  deployment: "local" | "distributed";
}

export interface SupervisorEndMessage {
  direction: "ui_to_supervisor";
  messageType: "end_system";
}

// Inbound Messages (Supervisor -> UI)

export interface SupervisorNodeDef {
  id: number;
  neighbors: number[];
  subject?: string;
}

export interface SupervisorStructuralMessage {
  direction: "supervisor_to_ui";
  messageType: "structural_infos";
  nodes: SupervisorNodeDef[];
}

export interface SupervisorInfectionMessage {
  direction: "supervisor_to_ui";
  messageType: "infection_update";
  updated_node_id: number;
  infecting_node_id: number;
  subject: string;
  sourceId: number;
  timestamp: number;
  data?: any;
}

export interface SupervisorRemotionMessage {
  direction: "supervisor_to_ui";
  messageType: "remotion_update";
  updated_node_id: number;
  subject: string;
  sourceId: number;
  timestamp: number;
}

export interface SupervisorStartRoundMessage {
  direction: "supervisor_to_ui";
  messageType: "start_round";
}

export type SupervisorMessage =
  | SupervisorStructuralMessage
  | SupervisorInfectionMessage
  | SupervisorRemotionMessage
  | SupervisorStartRoundMessage;