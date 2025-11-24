
interface Props {
  logs: string[];
}

export function LogPanel({ logs }: Props) {
  return (
    <div className="panel">
      <h2>Log</h2>
      <div
        style={{
          maxHeight: 200,
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        {logs.length === 0 && <p>(sem eventos ainda)</p>}
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    </div>
  );
}
