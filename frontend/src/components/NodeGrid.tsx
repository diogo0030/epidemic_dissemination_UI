// src/components/NodeGrid.tsx
import type { NodeData } from "../core/types";
import "./NodeGrid.css";

interface Props {
    nodes: NodeData[];
    selectedNodeId: number | null;
    onNodeSelect: (id: number) => void;
}

export function NodeGrid({ nodes, selectedNodeId, onNodeSelect }: Props) {
    if (nodes.length === 0) {
        return null;
    }

    // Se forem muitos nós, mostramos uma grelha compacta
    // Se forem poucos (<20), mostramos maior
    const isCompact = nodes.length > 50;

    return (
        <div className="node-grid-container">
            <div className="grid-header">Node Monitor ({nodes.length})</div>
            <div className={`node-grid ${isCompact ? "compact" : ""}`}>
                {nodes.map((n) => {
                    const isSelected = selectedNodeId === n.id;
                    const isInfective = n.state === "INFECTIVE";

                    let statusClass = "status-susceptible";
                    if (n.state === "INFECTIVE") statusClass = "status-infective";
                    if (n.state === "REMOVED") statusClass = "status-removed";

                    return (
                        <div
                            key={n.id}
                            className={`node-card ${statusClass} ${isSelected ? "selected" : ""}`}
                            onClick={() => onNodeSelect(n.id)}
                        >
                            <div className="node-card-id">Node {n.id}</div>
                            <div className="node-card-meta">
                                {isInfective ? `(1)` : `(0)`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
