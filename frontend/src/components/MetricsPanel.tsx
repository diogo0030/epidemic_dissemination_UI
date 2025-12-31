
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
        <h2>Métricas</h2>
        <button className="icon-button" onClick={onViewProgress} title="View Graph">
          📈
        </button>
      </div>
      <div className="metrics-list">
        <div className="metrics-row">
          <span>Ronds:</span>
          <span className="metrics-value">{round}</span>
        </div>
        <div className="metrics-row">
          <span>Mensagens Enviadas:</span>
          <span className="metrics-value">{messages}</span>
        </div>
        <div className="metrics-row">
          <span>Nós Informados:</span>
          <span className="metrics-value">
            {informed} / {totalNodes}
          </span>
        </div>
      </div>
    </>
  );
}
