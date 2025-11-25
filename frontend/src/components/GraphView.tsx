
import type { NodeData, EdgeData } from "../core/types";

interface Props {
  nodes: NodeData[];
  edges: EdgeData[];
}

export function GraphView({ nodes, edges }: Props) {
  const stateColor = (state: NodeData["state"]) => {
    switch (state) {
      case "SUSCEPTIBLE":
        return "#ffffff";
      case "INFECTIVE":
        return "#4f83ff";
      case "REMOVED":
        return "#ff0000ff";
      default:
        return "#ffffff";
    }
  };

  return (
    <svg
      className="graph-svg"
      width="100%"
      height="100%"
      viewBox="0 0 500 500"
      preserveAspectRatio="xMidYMid meet"
      style={{ borderRadius: 12 }}
    >
      {/* arestas */}
      {edges.map((e, idx) => {
        const from = nodes.find((n) => n.id === e.from);
        const to = nodes.find((n) => n.id === e.to);
        if (!from || !to) return null;
        return (
          <line
            key={idx}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#e2e8f0"
          />
        );
      })}

      {/* nós */}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle
            cx={n.x}
            cy={n.y}
            r={16}
            fill={stateColor(n.state)}
            stroke="#64748b"
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontSize="12"
            fill="#0f172a"
          >
            {n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}
