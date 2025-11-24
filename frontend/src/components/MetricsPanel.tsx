
interface Props {
  round: number;
  messages: number;
  informed: number;
  totalNodes: number;
}

export function MetricsPanel({ round, messages, informed, totalNodes }: Props) {
  return (
    <>
      <h2>Métricas</h2>
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
