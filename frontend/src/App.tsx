// src/App.tsx
import { useState, useRef, useEffect } from "react";
import "./App.css";
import { ConfigPanel } from "./components/ConfigPanel";
import { GraphView } from "./components/GraphView";
import { MetricsPanel } from "./components/MetricsPanel";
import type {
  EdgeData,
  SimulationConfig,
  Algorithm,
} from "./core/types";
import { requestTopology } from "./services/topologyService";
import {
  simulateOneRound,
} from "./core/simulation";
import type { MessageRun, NodeData } from "./core/types";
import { TabBar } from "./components/TabBar";
import { NodeGrid } from "./components/NodeGrid";
import { NodeDetails } from "./components/NodeDetails";

function App() {
  const [messageRuns, setMessageRuns] = useState<MessageRun[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);
  const [currentAlgorithm, setCurrentAlgorithm] =
    useState<Algorithm | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  // refs para o play automático
  const playIntervalRef = useRef<number | null>(null);
  const messageRunsRef = useRef<MessageRun[]>([]);
  const edgesRef = useRef<EdgeData[]>([]);
  const totalNodesRef = useRef<number>(0);

  // manter refs atualizados
  useEffect(() => {
    messageRunsRef.current = messageRuns;
  }, [messageRuns]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    totalNodesRef.current = totalNodes;
  }, [totalNodes]);

  const canSimulate = !!currentAlgorithm && messageRuns.length > 0;

  // START SIMULATION (quando clicas no botão grande "Start")
  const handleStartSimulation = async (config: SimulationConfig) => {
    // parar qualquer animação antiga
    setIsPlaying(false);

    const { nodes: initialNodes, edges } = await requestTopology(config);

    // MOCK: Criar múltiplas mensagens para simular concorrência
    // Vamos criar "N" runs com base no sourceNodeCount, ou só fixo para demo
    const newRuns: MessageRun[] = [];


    // Para simplificar, vamos criar 2 mensagens fictícias agora
    const runCount = 2;

    for (let i = 0; i < runCount; i++) {
      // Cada run começa com um deep copy dos nós iniciais limpos
      const runNodes: NodeData[] = initialNodes.map(n => ({ ...n, state: "SUSCEPTIBLE", storedMessages: [] }));

      // Infetar o nó de origem desta mensagem (mock: nó 0 para msg 1, nó 1 para msg 2, etc, wrap around)
      const originId = i % runNodes.length;
      runNodes[originId].state = "INFECTIVE";

      // MOCK: Adicionar mensagem inicial ao nó origem
      runNodes[originId].storedMessages.push({
        subject: `Mock Message ${i + 1}`,
        sourceId: 999, // Supervisor
        round: 0,
        timestamp: Date.now()
      });

      newRuns.push({
        id: `msg-${i + 1}`,
        label: `Mensagem ${i + 1}`,
        nodes: runNodes,
        round: 0,
        messages: 0
      });
    }

    setMessageRuns(newRuns);
    setActiveMessageId(newRuns[0].id);
    setEdges(edges);
    setTotalNodes(config.nodeCount);
    setCurrentAlgorithm(config.algorithm);
  };

  // executa UMA ronda
  // executa UMA ronda para TODAS as mensagens ativas
  const runOneRound = () => {
    if (!currentAlgorithm) return;
    if (messageRunsRef.current.length === 0) return;

    const nextRuns = messageRunsRef.current.map((run) => {
      // Se esta mensagem já infetou tudos, maybe parar? Mas por agora continua a simular
      // Verificar se já todos sabem para otimizar? opcional.

      const { nodes: newNodes, messagesSent } = simulateOneRound(
        run.nodes,
        edgesRef.current,
        currentAlgorithm
      );

      return {
        ...run,
        nodes: newNodes,
        round: run.round + 1,
        messages: run.messages + messagesSent
      };
    });

    setMessageRuns(nextRuns);

    // Verificar condicao de paragem global? Só se todas acabarem.
    // Para simplicidade, deixamos correr ate o user fazer pause.
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

  // Derived state para a UI baseada na tab ativa
  const activeRun = messageRuns.find(r => r.id === activeMessageId) || messageRuns[0];

  const displayNodes = activeRun ? activeRun.nodes : [];

  // Obter o nó selecionado da run ativa (para mostrar no painel de detalhes)
  // Obter o nó selecionado da run ativa (para mostrar no painel de detalhes)
  // Mas queremos mostrar as mensagens de TODAS as runs, não só da ativa.
  let selectedNode: NodeData | null = null;

  if (selectedNodeId !== null && activeRun) {
    const nodeInActiveRun = activeRun.nodes.find(n => n.id === selectedNodeId);
    if (nodeInActiveRun) {
      // Base: nó visual da Tab ativa (para cor/estado)
      selectedNode = { ...nodeInActiveRun };

      // Agregação: Juntar mensagens de todas as tabs/runs
      const allMessages = messageRuns.flatMap(run => {
        const n = run.nodes.find(node => node.id === selectedNodeId);
        return n ? n.storedMessages : [];
      });

      // Ordenar por timestamp
      selectedNode.storedMessages = allMessages.sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  const displayRound = activeRun ? activeRun.round : 0;
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
          {/* Coluna esquerda: Config + Métricas */}
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
                  onNodeClick={setSelectedNodeId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secção inferior: Monitor de Nós */}
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
    </div >
  );
}

export default App;
