// src/components/ConfigPanel.tsx
import { useState } from "react";
import type { Algorithm, Topology, SimulationConfig, DisseminationMode } from "../core/types";

interface Props {
  onStartSimulation: (config: SimulationConfig) => void;
}

export function ConfigPanel({ onStartSimulation }: Props) {
  const [topology, setTopology] = useState<Topology>("ring");
  const [nodeCount, setNodeCount] = useState(10);
  const [sourceNodeCount, setSourceNodeCount] = useState(1);
  const [algorithm, setAlgorithm] = useState<Algorithm>("gossip_blind_coin");
  const [mode, setMode] = useState<DisseminationMode>("push");
  const [deployment, setDeployment] = useState<"local" | "distributed">("local");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nodeCount <= 0) return;

    onStartSimulation({
      topology,
      nodeCount,
      sourceNodeCount,
      algorithm,
      mode,
      deployment,
    });
  };

  return (
    <>
      <h2>Simulation Configuration</h2>
      <form onSubmit={handleSubmit} className="config-form">
        <div className="form-group">
          <label className="form-label">Topology</label>
          <select
            className="form-control"
            value={topology}
            onChange={(e) => setTopology(e.target.value as Topology)}
          >
            <option value="ring">Ring</option>
            <option value="star">Star</option>
            <option value="full mesh">Full Mesh</option>
            <option value="partial mesh">Partial Mesh</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Node Count</label>
          <input
            className="form-control"
            type="number"
            min={1}
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Source Node Count</label>
          <input
            className="form-control"
            type="number"
            min={1}
            max={nodeCount}
            value={sourceNodeCount}
            onChange={(e) => setSourceNodeCount(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Dissemination Algorithm</label>
          <select
            className="form-control"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
          >
            <option value="gossip_blind_coin">Gossip Blind Coin</option>
            <option value="gossip_feedback_coin">Gossip Feedback Coin</option>
            <option value="anti_entropy">Anti-entropy</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Mode</label>
          <select
            className="form-control"
            value={mode}
            onChange={(e) => setMode(e.target.value as DisseminationMode)}
          >
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="pushpull">Push and Pull</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Deployment</label>
          <select
            className="form-control"
            value={deployment}
            onChange={(e) => setDeployment(e.target.value as "local" | "distributed")}
          >
            <option value="local">Local</option>
            <option value="distributed">Distributed</option>
          </select>
        </div>

        <button type="submit" className="primary-button">
          Start
        </button>
      </form>
    </>
  );
}
