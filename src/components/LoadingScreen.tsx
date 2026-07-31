export function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      color: '#65f1dd',
      background: '#031923',
      font: '700 10px Inter, Arial, sans-serif',
      letterSpacing: '.2em',
    }}>
      DESCENDING TO PELAGOS…
    </div>
  );
}
