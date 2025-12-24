//builda o script para mandar a intterface
import type { SimulationConfig } from "./types";

export function buildScript(config: SimulationConfig): string {
  // UI_start;<Port>;<Count>;<Sources>;<Topology>;<Algorithm>;<Mode>
  const address = typeof window !== "undefined" ? (window.location.port || "80") : "0";
  return `UI_start;${address};${config.nodeCount};${config.sourceNodeCount};${config.topology};${config.algorithm};${config.mode}`;
}
