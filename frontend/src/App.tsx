// src/App.tsx
import { useState, useRef, useEffect } from "react";
import "./App.css";
import { ConfigPanel } from "./components/ConfigPanel";
import { GraphView } from "./components/GraphView";
import { MetricsPanel } from "./components/MetricsPanel";
import type {
  NodeData,
  EdgeData,
  SimulationConfig,
  Algorithm,
} from "./core/types";
import { requestTopology } from "./services/topologyService";
import {
  infectInitialNodes,
  simulateOneRound,
} from "./core/simulation";

function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [round, setRound] = useState(0);
  const [messages, setMessages] = useState(0);
  const [informed, setInformed] = useState(0);
  const [totalNodes, setTotalNodes] = useState(0);
  const [currentAlgorithm, setCurrentAlgorithm] =
    useState<Algorithm | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  // refs para o play automático
  const playIntervalRef = useRef<number | null>(null);
  const nodesRef = useRef<NodeData[]>([]);
  const edgesRef = useRef<EdgeData[]>([]);
  const totalNodesRef = useRef<number>(0);

  // manter refs atualizados
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    totalNodesRef.current = totalNodes;
  }, [totalNodes]);

  const canSimulate = !!currentAlgorithm && nodes.length > 0;

  // START SIMULATION (quando clicas no botão grande "Start")
  const handleStartSimulation = async (config: SimulationConfig) => {
    // parar qualquer animação antiga
    setIsPlaying(false);

    const { nodes, edges } = await requestTopology(config);

    const infected = infectInitialNodes(nodes);

    setNodes(infected);
    setEdges(edges);
    setRound(0);
    setMessages(0);

    const informedCount = infected.filter(
      (n) => n.state !== "SUSCEPTIBLE"
    ).length;
    setInformed(informedCount);
    setTotalNodes(config.nodeCount);
    setCurrentAlgorithm(config.algorithm);
  };

  // executa UMA ronda
  const runOneRound = () => {
    if (!currentAlgorithm) return;
    if (nodesRef.current.length === 0) return;

    const { nodes: newNodes, messagesSent } = simulateOneRound(
      nodesRef.current,
      edgesRef.current,
      currentAlgorithm
    );

    setNodes(newNodes);
    setRound((r) => r + 1);
    setMessages((m) => m + messagesSent);

    const informedCount = newNodes.filter(
      (n) => n.state !== "SUSCEPTIBLE"
    ).length;
    setInformed(informedCount);

    // se já todos informados, para o play
    if (
      informedCount === totalNodesRef.current &&
      totalNodesRef.current > 0
    ) {
      setIsPlaying(false);
    }
  };

  // PLAY / PAUSE / STEP handlers
  const handlePlay = () => {
    if (!canSimulate) return;
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStep = () => {
    runOneRound();
  };

  // gerir o setInterval do Play
  useEffect(() => {
    if (isPlaying) {
      // 800ms por ronda (ajusta à vontade)
      playIntervalRef.current = window.setInterval(() => {
        runOneRound();
      }, 800);
    } else {
      if (playIntervalRef.current !== null) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    // limpar ao desmontar componente
    return () => {
      if (playIntervalRef.current !== null) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentAlgorithm]); // depende do estado de play e algoritmo

  return (
    <div className="app">
      <header className="app-header">
        <h1>Epidemic Dissemination Simulator</h1>
      </header>

      <main className="app-main">
        {/* Coluna esquerda: Config + Métricas */}
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

        {/* Coluna direita: Grafo */}
        <div className="graph-column">
          <div className="panel graph-panel">
            <div className="graph-panel-header">
              <div className="graph-header-left">
                <h2>Topologia da Rede</h2>
                {currentAlgorithm && (
                  <span className="algo-badge">
                    Algoritmo:&nbsp;
                    {currentAlgorithm === "gossip"
                      ? "Gossip"
                      : "Anti-entropy"}
                  </span>
                )}
              </div>

              <div className="graph-controls">
  <button
    className={`icon-button ${isPlaying ? "icon-button--active" : ""}`}
    onClick={handlePlay}
    disabled={isPlaying || !canSimulate}
  >
    ▶
  </button>
  <button
    className={`icon-button ${!isPlaying && canSimulate ? "icon-button--idle" : ""}`}
    onClick={handlePause}
    disabled={!isPlaying}
  >
    ⏸
  </button>
  <button
    className="icon-button"
    onClick={handleStep}
    disabled={!canSimulate}
  >
    ⏭
  </button>
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
