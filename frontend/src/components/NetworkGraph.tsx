import { useRef, useEffect, useMemo, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { NodeData, EdgeData, Topology } from '../core/types';

interface Props {
    nodes: NodeData[];
    edges: EdgeData[];
    selectedNodeId: number | null;
    currentTopology: Topology | null;
    onNodeClick: (id: number) => void;
}

export function NetworkGraph({ nodes, edges, selectedNodeId, onNodeClick }: Props) {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;

        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        // Initial size
        updateDimensions();

        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Prepare graph data
    const graphData = useMemo(() => {
        return {
            nodes: nodes.map(n => ({
                val: 1, // size
                ...n
            })),
            links: edges.map(e => ({
                source: e.from,
                target: e.to
            }))
        };
    }, [nodes, edges]);

    // Adjust camera when nodes change significantly using the new dimensions
    useEffect(() => {
        if (nodes.length > 0 && fgRef.current && dimensions.width > 0) {
            // Wait a tick for graph to render with new data then zoom
            setTimeout(() => {
                fgRef.current?.zoomToFit(400, 20);
            }, 500);
        }
    }, [nodes.length, dimensions.width, dimensions.height]);



    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            {dimensions.width > 0 && (
                <ForceGraph2D
                    ref={fgRef}
                    graphData={graphData}
                    nodeLabel="id"
                    // nodeColor is ignored if nodeCanvasObject is defined, but good for fallback
                    nodeRelSize={6}
                    linkColor={() => "#cbd5e1"} // Slate-300
                    backgroundColor="#ffffff" // White
                    onNodeClick={(node) => onNodeClick(node.id as number)}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.id;
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;

                        // Determine colors based on state (matching GraphView.tsx style)
                        let fill = "#ffffff";
                        let stroke = "#64748b"; // Slate-500
                        let textColor = "#1e293b"; // Slate-800

                        if (node.state === "INFECTIVE") {
                            fill = "#4f83ff"; // Blue from GraphView
                            stroke = "#2563eb"; // Darker blue border
                            textColor = "#ffffff";
                        } else if (node.state === "REMOVED") {
                            fill = "#ef4444"; // Red (GraphView had Red for Removed)
                            stroke = "#b91c1c";
                            textColor = "#ffffff";
                        } else if (node.id === selectedNodeId) {
                            stroke = "#2563eb"; // Blue border for selected
                        }

                        const r = 5; // Radius

                        // Draw Circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fillStyle = fill;
                        ctx.fill();
                        ctx.lineWidth = 1 / globalScale;
                        ctx.strokeStyle = stroke;
                        ctx.stroke();

                        // Draw Text
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = textColor;
                        ctx.fillText(label, node.x, node.y);
                    }}
                    nodePointerAreaPaint={(node: any, color, ctx) => {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    width={dimensions.width}
                    height={dimensions.height}
                    cooldownTicks={0} // Disable force engine to prevent blinking on updates
                    onEngineStop={() => { }}
                    enableNodeDrag={false} // optional: if positions are fixed
                />
            )}
        </div>
    );
}

