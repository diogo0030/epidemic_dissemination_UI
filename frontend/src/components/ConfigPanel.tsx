// src/components/ConfigPanel.tsx
import { useState } from "react";
import type { Algorithm, Topology, SimulationConfig, DisseminationMode } from "../core/types";

interface Props {
  onStartSimulation: (config: SimulationConfig) => void;
}

export function ConfigPanel({ onStartSimulation }: Props) {
  const [topology, setTopology] = useState<Topology>("ring");
  const [nodeCount, setNodeCount] = useState(10);
  const [algorithm, setAlgorithm] = useState<Algorithm>("gossip");
  const [mode, setMode] = useState<DisseminationMode>("push");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nodeCount <= 0) return;

    onStartSimulation({
      topology,
      nodeCount,
      algorithm,
      mode,
    });
  };

  return (
    <>
      <h2>Configuração da Simulação</h2>
      <form onSubmit={handleSubmit} className="config-form">
        <div className="form-group">
          <label className="form-label">Topologia</label>
          <select
            className="form-control"
            value={topology}
            onChange={(e) => setTopology(e.target.value as Topology)}
          >
            <option value="ring">Ring</option>
            <option value="star">Star</option>
            <option value="tree">Tree</option>
            <option value="bus">Bus</option>
            <option value="random">Random</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Número de nós</label>
          <input
            className="form-control"
            type="number"
            min={1}
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Algoritmo de Disseminação</label>
          <select
            className="form-control"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
          >
            <option value="gossip">Gossip</option>
            <option value="anti_entropy">Anti-entropy</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Modo</label>
          <select
            className="form-control"
            value={mode}
            onChange={(e) => setMode(e.target.value as DisseminationMode)}
          >
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="push_pull">Push and Pull</option>
          </select>
        </div>

        <button type="submit" className="primary-button">
          Start
        </button>
      </form>
    </>
  );
}
