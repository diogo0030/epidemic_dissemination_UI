// src/components/PercentageChart.tsx
import { useEffect, useRef } from "react";
import "./PercentageChart.css";

interface DataPoint {
    round: number;
    infected: number;
}

interface Props {
    data: DataPoint[];
    totalNodes: number;
    isOpen: boolean;
    onClose: () => void;
}

export function PercentageChart({ data, totalNodes, isOpen, onClose }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Dimensões do gráfico SVG
    const width = 600;
    const height = 300;
    const padding = 40;

    // Escalas
    const maxRound = data.length > 0 ? data[data.length - 1].round : 10;
    const maxInfected = totalNodes > 0 ? totalNodes : 100;

    const xScale = (round: number) => padding + (round / maxRound) * (width - 2 * padding);
    const yScale = (infected: number) => height - padding - (infected / maxInfected) * (height - 2 * padding);

    // Gerar path da linha
    const pathData = data
        .map((d, i) => {
            const x = xScale(d.round);
            const y = yScale(d.infected);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");

    return (
        <dialog ref={dialogRef} className="chart-modal" onClick={(e) => {
            // Fechar se clicar no backdrop
            if (e.target === dialogRef.current) onClose();
        }}>
            <div className="chart-container">
                <div className="chart-header">
                    <h3>Dissemination Progress</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="chart-body">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="chart-svg">
                        {/* Eixos */}
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />
                        <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#ccc" />

                        {/* Grid Lines Y (25%, 50%, 75%, 100%) */}
                        {[0.25, 0.5, 0.75, 1].map(p => {
                            const y = yScale(maxInfected * p);
                            return (
                                <g key={p}>
                                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f0f0f0" strokeDasharray="4" />
                                    <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#999">
                                        {Math.round(p * 100)}%
                                    </text>
                                </g>
                            );
                        })}

                        {/* Linha de dados */}
                        <path d={pathData} fill="none" stroke="#2563eb" strokeWidth="2" />

                        {/* Pontos */}
                        {data.map((d) => (
                            <circle
                                key={d.round}
                                cx={xScale(d.round)}
                                cy={yScale(d.infected)}
                                r="3"
                                fill="#2563eb"
                                fillOpacity="0.8"
                            >
                                <title>Round {d.round}: {d.infected} infected</title>
                            </circle>
                        ))}
                    </svg>
                </div>
                <div className="chart-footer">
                    <span>Rorunds: {maxRound}</span>
                    <span>Total Infected: {data.length > 0 ? data[data.length - 1].infected : 0} / {totalNodes}</span>
                </div>
            </div>
        </dialog>
    );
}
