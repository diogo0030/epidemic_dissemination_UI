// src/core/simulation.ts
import type { Algorithm, NodeData, EdgeData } from "./types";



//esta funçao marca o no zero como infetado e o resto como suscetiveis
export function infectInitialNodes(nodes: NodeData[]): NodeData[] {
  if (nodes.length === 0) return nodes;

  const originId = 0; // por agora o nó 0 é o originador
  return nodes.map((n) =>
    n.id === originId
      ? { ...n, state: "INFECTIVE" }
      : { ...n, state: "SUSCEPTIBLE" }
  );
}

//builda um mapa de vizinhos quando usamos neighbors.get(3) sao todos os vizinhos do no 3
function buildNeighbors(edges: EdgeData[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const e of edges) {
    if (!map.has(e.from)) map.set(e.from, []);
    if (!map.has(e.to)) map.set(e.to, []);
    map.get(e.from)!.push(e.to);
    map.get(e.to)!.push(e.from);
  }
  return map;
}

export interface StepResult {
  nodes: NodeData[];
  messagesSent: number;
}

/**
 * Dá UMA ronda da simulação, consoante o algoritmo escolhido.
 */
export function simulateOneRound(
  nodes: NodeData[],
  edges: EdgeData[],
  algorithm: Algorithm
): StepResult {
  switch (algorithm) {
    case "gossip":
      return stepGossip(nodes, edges);
    case "anti_entropy":
      return stepAntiEntropy(nodes, edges);
  }
}

/** Gossip cada INFECTIVE escolhe um vizinho aleatório e tenta infectá-lo */
function stepGossip(nodes: NodeData[], edges: EdgeData[]): StepResult {
  const neighbors = buildNeighbors(edges);
  const nextNodes = nodes.map((n) => ({ ...n }));
  let messagesSent = 0;

//dentifica todos os nós INFECTIVE.
  const infectiveIds = nodes
    .filter((n) => n.state === "INFECTIVE")
    .map((n) => n.id);
//Cada nó INFECTIVE escolhe UM vizinho aleatório.
//paraa caada id dos infetafos
  for (const id of infectiveIds) {
    const neigh = neighbors.get(id);
    if (!neigh || neigh.length === 0) continue;

    const targetId = neigh[Math.floor(Math.random() * neigh.length)]; // escolhe um vizinho random 
    const target = nextNodes.find((n) => n.id === targetId);
    if (!target) continue;

//Se esse vizinho ainda é SUSCEPTIBLE, passa a INFECTIVE (fica “infectado”) e contamos 1 mensagem.
    if (target.state === "SUSCEPTIBLE") {
      target.state = "INFECTIVE";
      messagesSent++;
    }
  }

  return { nodes: nextNodes, messagesSent };
}

/** Anti-entropy  cada nó fala com 1 vizinho; se um souber, o outro aprende */
function stepAntiEntropy(nodes: NodeData[], edges: EdgeData[]): StepResult {
  const neighbors = buildNeighbors(edges);
  const nextNodes = nodes.map((n) => ({ ...n }));
  let messagesSent = 0;
// para cada no n 
  for (const n of nodes) {
    const neigh = neighbors.get(n.id);
    if (!neigh || neigh.length === 0) continue;

    const partnerId = neigh[Math.floor(Math.random() * neigh.length)]; // escolhe um vizinho random
    const a = nextNodes.find((x) => x.id === n.id)!; 
    const b = nextNodes.find((x) => x.id === partnerId)!;
    //
    if (a.state === "INFECTIVE" && b.state === "SUSCEPTIBLE") {
      b.state = "INFECTIVE";
      messagesSent++;
    } else if (b.state === "INFECTIVE" && a.state === "SUSCEPTIBLE") {
      a.state = "INFECTIVE";
      messagesSent++;
    }
  }

  return { nodes: nextNodes, messagesSent };
}

//nodes = estado dos nós no início da ronda (não mexemos aqui, só lemos).
//nextNodes = cópia de nodes que vamos alterar para construir o estado da próxima ronda.
