// src/App.tsx
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { ConfigPanel } from "./components/ConfigPanel";
import { NetworkGraph } from "./components/NetworkGraph";
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
  SupervisorStartMessage,
  SupervisorInfectionMessage,
  SupervisorRemotionMessage,
  SupervisorStartRoundMessage,
  NodeState
} from "./core/types";
import { SupervisorService } from "./services/SupervisorService";
import { layoutNodes } from "./core/graphLayout";
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

  // Create a ref for the handler to ensure the subscription always calls the latest version (avoiding stale closures)
  const handleSupervisorMessageRef = useRef<(msg: SupervisorMessage) => void>(() => { });

  // Update the ref on every render
  useEffect(() => {
    handleSupervisorMessageRef.current = handleSupervisorMessage;
  });

  // Connect on mount
  useEffect(() => {
    SupervisorService.getInstance().connect();
    // Subscribe to messages using the ref
    const unsubscribe = SupervisorService.getInstance().subscribe((msg: SupervisorMessage) => {
      try {
        if (handleSupervisorMessageRef.current) {
          handleSupervisorMessageRef.current(msg);
        }
      } catch (err) {
        console.error("Error handling Supervisor message:", err);
      }
    });
    return () => {
      console.log("App Unmounting - Disconnecting Service");
      unsubscribe();
      SupervisorService.getInstance().disconnect();
    };
  }, []);

  // START SIMULATION
  const handleStartSimulation = async (config: SimulationConfig) => {
    // 0. Reset previous state
    handleStop(); // Stop local UI state
    setMessageRuns([]);
    setEdges([]);
    setTotalNodes(0);
    setActiveMessageId(null);
    setSelectedNodeId(null);

    setIsPlaying(true);
    setCurrentAlgorithm(config.algorithm);
    setCurrentTopology(config.topology);

    // 1. Send START message to Supervisor via WebSocket
    if (!config.topology) return;

    const startMsg: SupervisorStartMessage = {
      direction: "ui_to_supervisor",
      messageType: "start_system",
      addr: "127.0.0.1:0", // Backend Address.parse requires "IP:Port" format
      N: config.nodeCount,
      sourceNodes: config.sourceNodeCount,
      topology: config.topology,
      protocol: config.algorithm,
      mode: config.mode,
      deployment: config.deployment
    };

    console.log("Sending START:", startMsg);
    SupervisorService.getInstance().sendCommand(startMsg);
  };

  // STOP 
  const handleStop = () => {
    setIsPlaying(false);
    // Optional: Send STOP message to backend?
    // SupervisorService.getInstance().sendCommand({ ... end msg ... });
  };

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
      case "start_round":
        handleStartRound(msg);
        break;
    }
  };

  // Store base layout for spawning new runs
  const [baseNodes, setBaseNodes] = useState<NodeData[]>([]);

  const handleStructuralInfos = (msg: SupervisorStructuralMessage) => {
    console.log("Received Structural Infos:", msg);
    const nodeCount = msg.nodes.length;
    setTotalNodes(nodeCount);

    const newEdges: EdgeData[] = [];
    const seenEdges = new Set<string>();

    // Identify all unique subjects in the initial configuration
    const subjects = new Set<string>();
    msg.nodes.forEach(n => {
      if (n.subject) subjects.add(n.subject);

      n.neighbors.forEach(neighId => {
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

    // For layout, we use our generator since backend doesn't send coords
    const layout = layoutNodes(currentTopology || "ring", nodeCount);

    // Create base nodes (SUSCEPTIBLE)
    const initialNodes: NodeData[] = msg.nodes.map((n) => {
      const pos = layout.find(l => l.id === n.id) || { x: 0, y: 0 };
      return {
        id: n.id,
        x: pos.x,
        y: pos.y,
        state: "SUSCEPTIBLE",
        storedMessages: []
      };
    });
    setBaseNodes(initialNodes);

    // Create initial runs for each detected subject
    const initialRuns: MessageRun[] = [];
    if (subjects.size > 0) {
      subjects.forEach(subj => {
        // Clone base nodes and apply initial infection for this subject
        const runNodes = initialNodes.map(n => {
          const originalNode = msg.nodes.find(on => on.id === n.id);
          if (originalNode && originalNode.subject === subj) {
            return {
              ...n,
              state: "INFECTIVE" as NodeState,
              storedMessages: [{
                subject: subj,
                sourceId: -1,
                round: 0,
                timestamp: Date.now()
              }]
            };
          }
          return n;
        });

        initialRuns.push({
          id: `${subj}-${msg.nodes.find(n => n.subject === subj)?.id ?? '?'}`,
          label: `${subj} (Source: ${msg.nodes.find(n => n.subject === subj)?.id ?? '?'})`,
          nodes: runNodes,
          round: 0,
          messages: 0,
          history: [{ round: 0, infected: runNodes.filter(n => n.state === "INFECTIVE").length }]
        });
      });
    } else {
      // Fallback if no subject yet (just graph structure)
      initialRuns.push({
        id: "default",
        label: "Topology View",
        nodes: initialNodes,
        round: 0,
        messages: 0,
        history: [{ round: 0, infected: 0 }]
      });
    }

    setMessageRuns(initialRuns);
    setActiveMessageId(initialRuns[0].id);
  };

  const handleInfectionUpdate = (msg: SupervisorInfectionMessage) => {
    // console.log("Infection Update:", msg);

    setMessageRuns(prevRuns => {
      // Use Subject + SourceID to identify the Run uniquely
      const runId = `${msg.subject}-${msg.sourceId}`;

      let runIndex = prevRuns.findIndex(r => r.id === runId);
      let runToUpdate: MessageRun;

      if (runIndex === -1) {
        // New subject appeared! Create a new run/separator
        // console.log("New Subject detected:", runId);

        // Use baseNodes if available, otherwise try to clone from existing (risky if existing is dirty)
        // We really should use the clean baseNodes state.
        const base = baseNodes.length > 0 ? baseNodes : (prevRuns[0]?.nodes.map(n => ({ ...n, state: 'SUSCEPTIBLE' as NodeState, storedMessages: [] })) || []);

        runToUpdate = {
          id: runId,
          label: `${msg.subject} (Source: ${msg.sourceId})`,
          nodes: base,
          round: 0,
          messages: 0,
          history: [{ round: 0, infected: 0 }]
        };
        // We will append this new run
      } else {
        runToUpdate = prevRuns[runIndex];
      }

      // Update nodes in this run
      const newNodes = runToUpdate.nodes.map(n => {
        if (n.id === msg.updated_node_id) {
          // Only update if not already infective (or strictly follow logic)
          // But we must add the message to history regardless
          // const alreadyInfected = n.state === "INFECTIVE";
          // Preserve REMOVED state if already removed
          const newState: NodeState = n.state === "REMOVED" ? "REMOVED" : "INFECTIVE";

          return {
            ...n,
            state: newState,
            storedMessages: [...n.storedMessages, {
              subject: msg.subject,
              sourceId: msg.sourceId,
              round: runToUpdate.round,
              timestamp: msg.timestamp,
              data: msg.data
            }]
          };
        }
        return n;
      });



      const updatedRun = {
        ...runToUpdate,
        nodes: newNodes,
        messages: runToUpdate.messages + 1,
        history: runToUpdate.history
      };

      if (runIndex === -1) {
        // Append new run
        // If we had a default empty run, maybe replace it if it has 0 infections? 
        // User asked for "separators for each new id", so appending is safer purely for visualization.
        return [...prevRuns, updatedRun];
      } else {
        // Update existing run
        const newRuns = [...prevRuns];
        newRuns[runIndex] = updatedRun;
        return newRuns;
      }
    });
  };

  const handleStartRound = (msg: SupervisorStartRoundMessage) => {
    // console.log("Round Started:", msg);
    setMessageRuns(prev => {
      // If we have no runs, we can't really track rounds per message run yet unless we have a global counter
      // But we will iterate all runs and increment their round counter
      if (prev.length === 0) return prev;

      return prev.map(run => ({
        ...run,
        round: run.round + 1,
        // Update history with current infection state for this new round
        history: [...run.history, { round: run.round + 1, infected: run.nodes.filter(n => n.state === "INFECTIVE").length }]
      }));
    });
  };

  const handleRemotionUpdate = (msg: SupervisorRemotionMessage) => {
    setMessageRuns(prev => {
      const runId = `${msg.subject}-${msg.sourceId}`;
      const runIndex = prev.findIndex(r => r.id === runId);
      if (runIndex === -1) return prev;

      const run = prev[runIndex];
      const newNodes = run.nodes.map(n => {
        if (n.id === msg.updated_node_id) {
          const newState: NodeState = "REMOVED";
          return { ...n, state: newState };
        }
        return n;
      });

      const newRuns = [...prev];
      newRuns[runIndex] = { ...run, nodes: newNodes };
      return newRuns;
    });
  };

  const activeRun = messageRuns.find(r => r.id === activeMessageId) || messageRuns[0];
  const displayNodes = activeRun ? activeRun.nodes : [];

  let selectedNode: NodeData | null = null;
  if (selectedNodeId !== null && activeRun) {
    selectedNode = activeRun.nodes.find(n => n.id === selectedNodeId) || null;
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
                  <h2>Network Visualization</h2>
                  {currentAlgorithm && (
                    <span className="algo-badge">
                      {currentAlgorithm ? currentAlgorithm.replace(/_/g, ' ').toUpperCase() : ''}
                    </span>
                  )}
                  <span className="algo-badge" style={{ marginLeft: '10px', backgroundColor: isPlaying ? '#2ecc71' : '#e74c3c' }}>
                    {isPlaying ? "● LIVE" : "○ STOPPED"}
                  </span>
                </div>

                <div className="graph-controls">
                  <button
                    className="icon-button"
                    onClick={handleStop}
                    title="Stop Simulation"
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
                <NetworkGraph
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
      </main>

      <PercentageChart
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        data={activeRun ? activeRun.history : []}
        totalNodes={totalNodes}
      />
    </div>
  );
}

export default App;
