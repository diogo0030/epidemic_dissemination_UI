
import type { NodeData, EdgeData } from "../core/types";

interface Props {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNodeId: number | null;
  onNodeClick: (id: number) => void;
}

export function GraphView({ nodes, edges, selectedNodeId, onNodeClick }: Props) {
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

  // Calcular raio dinâmico
  const count = nodes.length;
  // Perímetro aproximado para r=220 é 2*PI*220 ~= 1380px
  // Queremos que N bolas caibam no perímetro sem tocar.
  // Formula: (Perimetro / N) / 2.5 (fator de folga)
  // Max 16px, Min 2px
  const circumference = 1380;
  const spacePerNode = circumference / (count > 0 ? count : 1);
  const dynamicRadius = Math.max(2, Math.min(16, spacePerNode / 2.5));

  const showLabel = dynamicRadius >= 10;

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
            strokeWidth={1}
          />
        );
      })}

      {/* nós */}
      {nodes.map((n) => {
        const isSelected = selectedNodeId === n.id;
        return (
          <g
            key={n.id}
            onClick={() => onNodeClick(n.id)}
            style={{ cursor: "pointer" }}
          >
            {isSelected && (
              <circle
                cx={n.x} cy={n.y} r={dynamicRadius + 4}
                fill="none" stroke="#2563eb" strokeWidth={2} opacity={0.5}
              />
            )}

            <circle
              cx={n.x}
              cy={n.y}
              r={dynamicRadius}
              fill={stateColor(n.state)}
              stroke={isSelected ? "#2563eb" : "#64748b"}
              strokeWidth={isSelected ? 2 : (dynamicRadius < 6 ? 0.5 : 1)}
            >
              <title>Node {n.id} ({n.state})</title>
            </circle>
            {showLabel && (
              <text
                x={n.x}
                y={n.y + dynamicRadius / 3}
                textAnchor="middle"
                fontSize={dynamicRadius * 0.8}
                fill="#0f172a"
                style={{ pointerEvents: "none" }}
              >
                {n.id}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
