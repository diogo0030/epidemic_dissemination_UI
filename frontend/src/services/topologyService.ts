
import type { SimulationConfig, NodeData, EdgeData } from "../core/types";
import { buildScript } from "../core/scriptBuilder";
import { generateMockGraph } from "../mocks/graphMock";
// no futuro: import { layoutNodes } from "../core/graphLayout";

export interface TopologyResult {
  nodes: NodeData[];
  edges: EdgeData[];
}

/**
 * Função que a UI chama para obter o grafo.
 */
export async function requestTopology(
  config: SimulationConfig
): Promise<TopologyResult> {
  const script = buildScript(config);
  console.log("JSON Message enviado para a interface:\n", script);

  // ===== MOCK =====
  // Por agora ignoramos o servidor e usamos o grafo local
  const { nodes, edges } = generateMockGraph(config.topology, config.nodeCount);
  // =================

  // (quando tiverem servidor, esta parte fica mais ou menos assim:)
  // const res = await fetch("http://localhost:8080/api/topology", {
  //   method: "POST",
  //   headers: { "Content-Type": "text/plain" },
  //   body: script,
  // });
  // const json = await res.json(); // edges vindas do supervisor
  // const nodes = layoutNodes(config.topology, config.nodeCount);
  // const edges = json.edges;

  return { nodes, edges };
}
