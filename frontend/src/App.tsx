import React from 'react';
import ChatContainer from './components/ChatContainer';
import { useSessionUUID } from './hooks/useSessionUUID';

function App() {
  const sessionUUID = useSessionUUID();

  return (
    <div className="App">
      {/* Pass sessionUUID as a prop to ChatContainer for downstream use */}
      <ChatContainer sessionUUID={sessionUUID} />
    </div>
  );
}

export default App;