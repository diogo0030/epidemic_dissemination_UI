//builda o script para mandar a intterface
import type { SimulationConfig } from "./types";

export function buildScript(config: SimulationConfig): string {
  return [
    `TOPOLOGY ${config.topology}`,
    `NODES ${config.nodeCount}`,
    `ALGORITHM ${config.algorithm}`,
  ].join("\n");
}
