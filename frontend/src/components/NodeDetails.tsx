// src/components/NodeDetails.tsx
import type { NodeData } from "../core/types";
import "./NodeDetails.css";

interface Props {
    node: NodeData | null;
}

export function NodeDetails({ node }: Props) {
    if (!node) {
        return (
            <div className="node-details-empty">
                <p>Selecione um nó para ver os detalhes</p>
            </div>
        );
    }

    return (
        <div className="node-details-panel">
            <div className="details-header">
                <div className="details-title">
                    Node {node.id} Details
                </div>
                <span className={`status-badge ${node.state.toLowerCase()}`}>
                    {node.state}
                </span>
            </div>

            {/* Stats Summary */}
            <div className="details-stats">
                <div className="stat-item">
                    <label>Unique Messages</label>
                    <span>{node.storedMessages.length}</span>
                </div>
                <div className="stat-item">
                    <label>Position</label>
                    <span>{Math.round(node.x)}, {Math.round(node.y)}</span>
                </div>
            </div>

            <div className="messages-table-container">
                <h4>Stored Messages</h4>
                <table className="messages-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Source ID</th>
                            <th>Round</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {node.storedMessages.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="empty-row">No messages stored.</td>
                            </tr>
                        ) : (
                            node.storedMessages.map((msg, idx) => (
                                <tr key={idx}>
                                    <td>{msg.subject}</td>
                                    <td>{msg.sourceId}</td>
                                    <td>{msg.round}</td>
                                    <td>{msg.timestamp}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
