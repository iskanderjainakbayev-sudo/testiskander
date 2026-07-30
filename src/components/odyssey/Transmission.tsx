interface TransmissionProps {
  message: string | null;
}

export function Transmission({ message }: TransmissionProps) {
  if (!message) return null;

  return (
    <aside className="odx-transmission" role="status" aria-live="polite">
      <div className="odx-transmission__wave" aria-hidden="true">
        {Array.from({ length: 17 }, (_, index) => <i key={index} />)}
      </div>
      <div>
        <span>INCOMING // UNKNOWN ORIGIN</span>
        <p>“{message}”</p>
      </div>
    </aside>
  );
}

