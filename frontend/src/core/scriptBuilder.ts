//builda o script para mandar a intterface
import type { SimulationConfig } from "./types";

export function buildScript(config: SimulationConfig): string {
  // Mapear algoritmo interno para o protocolo
  const protocol = config.algorithm === "gossip" ? "gossip" : "anti-entropy";

  // Endereço (default para localhost se não houver port)
  const port = typeof window !== "undefined" ? (window.location.port || "80") : "0";
  const addr = `127.0.0.1:${port}`;

  const message: import("./types").SupervisorStartMessage = {
    direction: "ui_to_supervisor",
    messageType: "start",
    addr: addr,
    N: config.nodeCount,
    sourceNodes: config.sourceNodeCount,
    topology: config.topology,
    protocol: protocol,
    mode: config.mode
  };

  return JSON.stringify(message, null, 2);
}

export function buildEndScript(): string {
  const message: import("./types").SupervisorEndMessage = {
    direction: "ui_to_supervisor",
    messageType: "end"
  };
  return JSON.stringify(message, null, 2);
}
