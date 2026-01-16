// src/App.tsx
import { useState, useEffect } from "react";
import "./App.css";
import { ConfigPanel } from "./components/ConfigPanel";
import { GraphView } from "./components/GraphView";
import { MetricsPanel } from "./components/MetricsPanel";
import type {
  EdgeData,
  SimulationConfig,
  Algorithm,
  Topology,
  MessageRun,
  NodeData,
  SupervisorMessage,
  SupervisorStructuralMessage,
  SupervisorInfectionMessage,
  SupervisorRemotionMessage,
  NodeState
} from "./core/types";
import { requestTopology } from "./services/topologyService";
import { MockSocketService } from "./services/mockSocketService"; // NEW
import { layoutNodes } from "./core/graphLayout"; // Needed for positioning
import { TabBar } from "./components/TabBar";
import { NodeGrid } from "./components/NodeGrid";
import { NodeDetails } from "./components/NodeDetails";
import { PercentageChart } from "./components/PercentageChart";

function App() {
  const [messageRuns, setMessageRuns] = useState<MessageRun[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isChartOpen, setIsChartOpen] = useState(false);

  // Visual state
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);

  // Config state
  const [currentAlgorithm, setCurrentAlgorithm] = useState<Algorithm | null>(null);
  const [currentTopology, setCurrentTopology] = useState<Topology>("ring");

  const [isPlaying, setIsPlaying] = useState(false);

  // START SIMULATION
  const handleStartSimulation = async (config: SimulationConfig) => {
    // 0. Resetar estado anterior se existir
    handleStop();
    setMessageRuns([]);
    setEdges([]);
    setTotalNodes(0);
    setActiveMessageId(null);
    setSelectedNodeId(null);

    setIsPlaying(true);
    setCurrentAlgorithm(config.algorithm);
    setCurrentTopology(config.topology); // Guardar para saber o layout

    // 1. Enviar mensagem de INTENÇÃO de inicio (log apenas por enquanto)
    await requestTopology(config);

    // 2. Conectar ao Mock Socket para começar a receber eventos
    MockSocketService.getInstance().connect();
  };

  // STOP 
  const handleStop = () => {
    setIsPlaying(false);
    MockSocketService.getInstance().disconnect();
  };

  // Socket Event Handler
  useEffect(() => {
    const unsubscribe = MockSocketService.getInstance().subscribe((msg: SupervisorMessage) => {
      handleSupervisorMessage(msg);
    });
    return () => unsubscribe();
  }, [currentTopology]); // Re-bind se a topologia mudar (necessário para layout?)

  const handleSupervisorMessage = (msg: SupervisorMessage) => {
    switch (msg.messageType) {
      case "structural_infos":
        handleStructuralInfos(msg);
        break;
      case "infection_update":
        handleInfectionUpdate(msg);
        break;
      case "remotion_update":
        handleRemotionUpdate(msg);
        break;
    }
  };

  const handleStructuralInfos = (msg: SupervisorStructuralMessage) => {
    const nodeCount = msg.nodes.length;
    setTotalNodes(nodeCount);

    // 1. Calcular arestas a partir da lista de vizinhos
    const newEdges: EdgeData[] = [];
    // Usar um set para evitar duplicados se o backend mandar redundante (0->1 e 1->0)
    const seenEdges = new Set<string>();

    msg.nodes.forEach(n => {
      n.neighbors.forEach(neighId => {
        // Normalizar chave "min-max" para não duplicar
        const from = Math.min(n.id, neighId);
        const to = Math.max(n.id, neighId);
        const key = `${from}-${to}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          newEdges.push({ from, to });
        }
      });
    });
    setEdges(newEdges);

    // 2. Calcular posições (Layout)
    // O backend não manda X,Y, então usamos o nosso layout generator
    const layout = layoutNodes(currentTopology || "ring", nodeCount);

    // 3. Criar os nós iniciais misturando o layout com os dados do supervisor
    const initialNodes: NodeData[] = msg.nodes.map((n) => {
      const pos = layout.find(l => l.id === n.id) || { x: 0, y: 0 };
      const state: NodeState = n.subject ? "INFECTIVE" : "SUSCEPTIBLE";
      return {
        id: n.id,
        x: pos.x,
        y: pos.y,
        state: state,
        storedMessages: n.subject ? [{
          subject: n.subject,
          sourceId: -1,
          round: 0,
          timestamp: Date.now()
        }] : []
      };
    });

    // 4. Criar a "Run" base
    const newRun: MessageRun = {
      id: "supervisor-run",
      label: "Live Simulation",
      nodes: initialNodes,
      round: 0,
      messages: 0,
      history: [{ round: 0, infected: initialNodes.filter(n => n.state === "INFECTIVE").length }]
    };

    setMessageRuns([newRun]);
    setActiveMessageId(newRun.id);
  };

  const handleInfectionUpdate = (msg: SupervisorInfectionMessage) => {
    setMessageRuns(prev => {
      // Atualizar APENAS a run "live"
      // Num cenário real poderiamos ter ID da run na mensagem
      const runIndex = prev.findIndex(r => r.id === "supervisor-run");
      if (runIndex === -1) return prev;

      const run = prev[runIndex];
      const newNodes = run.nodes.map(n => {
        if (n.id === msg.updated_node_id) {
          const newState: NodeState = "INFECTIVE";
          return {
            ...n,
            state: newState,
            storedMessages: [...n.storedMessages, {
              subject: msg.subject,
              sourceId: msg.sourceId,
              round: 0, // Backend não manda round aqui?
              timestamp: msg.timestamp
            }]
          };
        }
        return n;
      });

      // Recalcular stats
      const infectedCount = newNodes.filter(n => n.state !== ("SUSCEPTIBLE" as NodeState)).length;

      return [
        {
          ...run,
          nodes: newNodes,
          messages: run.messages + 1,
          history: [...run.history, { round: run.history.length, infected: infectedCount }]
        }
      ];
    });
  };

  const handleRemotionUpdate = (msg: SupervisorRemotionMessage) => {
    setMessageRuns(prev => {
      const runIndex = prev.findIndex(r => r.id === "supervisor-run");
      if (runIndex === -1) return prev;

      const run = prev[runIndex];
      const newNodes = run.nodes.map(n => {
        if (n.id === msg.updated_node_id) {
          const newState: NodeState = "REMOVED";
          return { ...n, state: newState };
        }
        return n;
      });

      return [{ ...run, nodes: newNodes }];
    });
  };

  // ... (manter resto da UI) ...

  const activeRun = messageRuns.find(r => r.id === activeMessageId) || messageRuns[0];
  const displayNodes = activeRun ? activeRun.nodes : [];

  // Recalculo do nó selecionado
  let selectedNode: NodeData | null = null;
  if (selectedNodeId !== null && activeRun) {
    selectedNode = activeRun.nodes.find(n => n.id === selectedNodeId) || null;
  }

  const displayRound = activeRun ? activeRun.history.length : 0; // Usar length do historico como proxy de tempo
  const displayMessages = activeRun ? activeRun.messages : 0;
  const displayInformed = activeRun
    ? activeRun.nodes.filter(n => n.state !== "SUSCEPTIBLE").length
    : 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Epidemic Dissemination Simulator</h1>
      </header>

      <main className="app-main">
        <div className="app-top">
          <div className="left-column">
            <div className="panel">
              <ConfigPanel onStartSimulation={handleStartSimulation} />
            </div>

            <div className="panel">
              <MetricsPanel
                round={displayRound}
                messages={displayMessages}
                informed={displayInformed}
                totalNodes={totalNodes}
                onViewProgress={() => setIsChartOpen(true)}
              />
            </div>
          </div>

          <div className="graph-column">
            <div className="panel graph-panel">
              <div className="graph-panel-header">
                <div className="graph-header-left">
                  <h2>Network Topology</h2>
                  {currentAlgorithm && (
                    <span className="algo-badge">
                      Algorithm:&nbsp;
                      {currentAlgorithm === "gossip"
                        ? "Gossip"
                        : "Anti-entropy"}
                    </span>
                  )}
                  <span className="algo-badge" style={{ marginLeft: '10px', backgroundColor: isPlaying ? '#2ecc71' : '#e74c3c' }}>
                    {isPlaying ? "● LIVE" : "○ STOPPED"}
                  </span>
                </div>

                <div className="graph-controls">
                  {/* Simplificar controlos para STOP apenas */}
                  <button
                    className={`icon-button ${isPlaying ? "icon-button--active" : ""}`}
                    onClick={() => { }}
                    disabled={true}
                    title="Controlled by Supervisor"
                  >
                    ▶
                  </button>
                  <button
                    className="icon-button"
                    onClick={handleStop}
                    title="Stop / Disconnect"
                  >
                    ⏹
                  </button>
                </div>
              </div>


              {messageRuns.length > 0 && (
                <TabBar
                  tabs={messageRuns.map(r => ({ id: r.id, label: r.label }))}
                  activeTab={activeMessageId || ""}
                  onTabClick={setActiveMessageId}
                />
              )}

              <div className="graph-panel-body">
                <GraphView
                  nodes={displayNodes}
                  edges={edges}
                  selectedNodeId={selectedNodeId}
                  currentTopology={currentTopology}
                  onNodeClick={setSelectedNodeId}
                />
              </div>
            </div>
          </div>
        </div>

        {messageRuns.length > 0 && (
          <section className="app-bottom">
            <div className="panel grid-panel">
              <NodeGrid
                nodes={displayNodes}
                selectedNodeId={selectedNodeId}
                onNodeSelect={setSelectedNodeId}
              />
            </div>
            <div className="panel details-panel">
              <NodeDetails node={selectedNode} />
            </div>
          </section>
        )}
      </main >

      <PercentageChart
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        data={activeRun ? activeRun.history : []}
        totalNodes={totalNodes}
      />
    </div >
  );
}

export default App;
