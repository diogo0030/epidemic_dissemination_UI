
interface Props {
  round: number;
  messages: number;
  informed: number;
  totalNodes: number;
  onViewProgress: () => void;
}

export function MetricsPanel({ round, messages, informed, totalNodes, onViewProgress }: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Metrics</h2>
      </div>
      <div className="metrics-list">
        <div className="metrics-row">
          <span>Rounds:</span>
          <span className="metrics-value">{round}</span>
        </div>
        <div className="metrics-row">
          <span>Messages Sent:</span>
          <span className="metrics-value">{messages}</span>
        </div>
        <div className="metrics-row">
          <span>Informed Nodes:</span>
          <span className="metrics-value">
            {informed} / {totalNodes}
          </span>
        </div>
      </div>
      <button className="primary-button" style={{ marginTop: '1rem', width: '100%' }} onClick={onViewProgress}>
        View Infection Chart
      </button>
    </>
  );
}
