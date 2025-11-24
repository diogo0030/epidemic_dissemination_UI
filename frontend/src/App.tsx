// src/App.tsx
import { useState } from "react";
import "./App.css";
import { ConfigPanel } from "./components/ConfigPanel";
import { GraphView } from "./components/GraphView";
import type { NodeData, EdgeData, SimulationConfig,Algorithm } from "./types";
import { buildScript } from "./scriptBuilder";
import { generateMockGraph } from "./graphMock";
import { MetricsPanel } from "./components/MetricsPanel";


function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [lastScript, setLastScript] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [messages, setMessages] = useState(0);
  const [informed, setInformed] = useState(0);
  const [totalNodes, setTotalNodes] = useState(0);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<Algorithm | null>(null);



  const handleStartSimulation = async (config: SimulationConfig) => {
    const script = buildScript(config);
    setLastScript(script);

    const { nodes: mockNodes, edges: mockEdges } = generateMockGraph(
      config.topology,
      config.nodeCount
    );

    setNodes(mockNodes);
    setEdges(mockEdges);
    setRound(0);
    setMessages(0);
    setInformed(0);
    setTotalNodes(config.nodeCount);
    setCurrentAlgorithm(config.algorithm);

  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Epidemic Dissemination Simulator</h1>
      </header>

      <main className="app-main">
  {/* Coluna esquerda: config + métricas */}
  <div className="left-column">
    <div className="panel">
      <ConfigPanel onStartSimulation={handleStartSimulation} />
    </div>

    <div className="panel">
      <MetricsPanel
        round={round}
        messages={messages}
        informed={informed}
        totalNodes={totalNodes}
      />
    </div>
  </div>

        {/* Coluna direita: Topologia da Rede a ocupar a altura toda */}
        <div className="graph-column">
          <div className="panel graph-panel">
            <div className="graph-panel-header">
  <div className="graph-header-left">
    <h2>Topologia da Rede</h2>
    {currentAlgorithm && (
      <span className="algo-badge">
        Algoritmo:&nbsp;
        {currentAlgorithm === "gossip" ? "Gossip" : "Anti-entropy"}
      </span>
    )}
  </div>

  <div className="graph-controls">
    <button disabled>▶</button>
    <button disabled>⏸</button>
    <button disabled>⏭</button>
  </div>
</div>

            <div className="graph-panel-body">
              <GraphView nodes={nodes} edges={edges} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


export default App;


