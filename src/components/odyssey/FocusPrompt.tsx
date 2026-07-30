interface FocusPromptProps {
  onResume: () => void;
}

export function FocusPrompt({ onResume }: FocusPromptProps) {
  return (
    <button className="odx-focus" onClick={onResume}>
      <span className="odx-focus__mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <strong>RE-ENGAGE NEURAL LINK</strong>
      <small>Click to return control to LYRA</small>
    </button>
  );
}

