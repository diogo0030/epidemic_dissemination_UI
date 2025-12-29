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

// Helper para fundir mensagens sem duplicados
function mergeMessages(target: NodeData, source: NodeData) {
  // Simplesmente copiamos as que não temos.
  // Num cenário real usaríamos IDs únicos de msg.
  const existingSubjects = new Set(target.storedMessages.map(m => m.subject));
  for (const msg of source.storedMessages) {
    if (!existingSubjects.has(msg.subject)) {
      target.storedMessages.push({
        ...msg,
        timestamp: Date.now(), // tempo de recepção
        round: msg.round + 1, // +1 hop/round? simplificado
        sourceId: source.id // quem enviou
      });
    }
  }
}

/** Gossip cada INFECTIVE escolhe um vizinho aleatório e tenta infectá-lo */
function stepGossip(nodes: NodeData[], edges: EdgeData[]): StepResult {
  const neighbors = buildNeighbors(edges);
  // Deep copy de nodes é tricky por causa do array de mensagens.
  // Vamos fazer map manual
  const nextNodes = nodes.map((n) => ({
    ...n,
    storedMessages: n.storedMessages.map(m => ({ ...m }))
  }));

  let messagesSent = 0;

  //identifica todos os nós INFECTIVE originais.
  const infectiveIds = nodes
    .filter((n) => n.state === "INFECTIVE")
    .map((n) => n.id);

  //Cada nó INFECTIVE escolhe UM vizinho aleatório.
  for (const id of infectiveIds) {
    const neigh = neighbors.get(id);
    if (!neigh || neigh.length === 0) continue;

    const targetId = neigh[Math.floor(Math.random() * neigh.length)];

    // Obter referencias para os nós no novo estado
    const sourceNode = nextNodes.find((n) => n.id === id)!;
    const targetNode = nextNodes.find((n) => n.id === targetId)!;

    if (!targetNode) continue;

    // Se o target for suscetível, infecta
    if (targetNode.state === "SUSCEPTIBLE") {
      targetNode.state = "INFECTIVE";
      mergeMessages(targetNode, sourceNode);
      messagesSent++;
    }
    // Se já for INFECTIVE, em Gossip puro normalmente ignora-se ou conta-se msg redudante.
    // Vamos assumir que enviamos a msg na mesma para atualizar tabela (Push)
    // Se quisermos strict gossip (só infeta suscetiveis), mantemos o if acima. 
    // O user quer ver mensagens, por isso se o target ja tiver a msg nao faz nada.
  }

  return { nodes: nextNodes, messagesSent };
}

/** Anti-entropy  cada nó fala com 1 vizinho; se um souber, o outro aprende */
function stepAntiEntropy(nodes: NodeData[], edges: EdgeData[]): StepResult {
  const neighbors = buildNeighbors(edges);

  const nextNodes = nodes.map((n) => ({
    ...n,
    storedMessages: n.storedMessages.map(m => ({ ...m }))
  }));

  let messagesSent = 0;

  for (const n of nodes) {
    const neigh = neighbors.get(n.id);
    if (!neigh || neigh.length === 0) continue;

    const partnerId = neigh[Math.floor(Math.random() * neigh.length)];

    const a = nextNodes.find((x) => x.id === n.id)!;
    const b = nextNodes.find((x) => x.id === partnerId)!;

    // Push-Pull logic simplificada: Se um tem e outro não, passa.
    if (a.state === "INFECTIVE" && b.state === "SUSCEPTIBLE") {
      b.state = "INFECTIVE";
      mergeMessages(b, a);
      messagesSent++;
    } else if (b.state === "INFECTIVE" && a.state === "SUSCEPTIBLE") {
      a.state = "INFECTIVE";
      mergeMessages(a, b);
      messagesSent++;
    }
  }

  return { nodes: nextNodes, messagesSent };
}

//nodes = estado dos nós no início da ronda (não mexemos aqui, só lemos).
//nextNodes = cópia de nodes que vamos alterar para construir o estado da próxima ronda.
