import React from 'react';
import ChatContainer from './components/ChatContainer';
import { useSessionUUID } from './hooks/useSessionUUID';

function App() {
  const { sessionUUID, loading, error } = useSessionUUID();

  if (loading) {
    return <div className="App"><p>Loading session...</p></div>;
  }
  if (error) {
    return <div className="App"><p className="error">Session error: {error}</p></div>;
  }

  return (
    <div className="App">
      {/* Pass sessionUUID as a prop to ChatContainer for downstream use */}
      <ChatContainer sessionUUID={sessionUUID} />
    </div>
  );
}

export default App;