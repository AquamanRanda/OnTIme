'use client';

import { useEffect, useState } from 'react';

export default function WebSocketTestPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('🧪 Starting WebSocket test...');
    
    const ws = new WebSocket('wss://ontime.alpha.theesports.club/ws');
    
    ws.onopen = () => {
      console.log('🟢 WebSocket connected');
      setConnected(true);
      
      // Try different message formats
      setTimeout(() => {
        console.log('📤 Sending test messages...');
        try {
          ws.send(JSON.stringify({ type: 'poll' }));
          ws.send(JSON.stringify({ topic: 'get-runtime', payload: {} }));
          ws.send('poll');
        } catch (error) {
          console.error('💥 Error sending messages:', error);
        }
      }, 1000);
    };
    
    ws.onmessage = (event) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔌 [${timestamp}] Raw message:`, event.data);
      
      setMessages(prev => [...prev, `[${timestamp}] ${event.data}`]);
      
      // Try to parse and process
      try {
        const parsed = JSON.parse(event.data);
        console.log('📋 Parsed message:', parsed);
        
        // Check for topic/type fields
        if (parsed.topic) {
          console.log('✅ Has topic:', parsed.topic, typeof parsed.topic);
        }
        if (parsed.type) {
          console.log('✅ Has type:', parsed.type, typeof parsed.type);
        }
        
        // Try toLowerCase on different fields
        if (parsed.topic && typeof parsed.topic === 'string') {
          console.log('🔤 Topic toLowerCase:', parsed.topic.toLowerCase());
        }
        if (parsed.type && typeof parsed.type === 'string') {
          console.log('🔤 Type toLowerCase:', parsed.type.toLowerCase());
        }
        
      } catch (parseError) {
        console.error('💥 Parse error:', parseError);
      }
    };
    
    ws.onerror = (error) => {
      console.error('🔴 WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('🔴 WebSocket closed');
      setConnected(false);
    };
    
    return () => {
      console.log('🧹 Cleaning up WebSocket...');
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test</h1>
      
      <div className={`mb-4 px-4 py-2 rounded ${connected ? 'bg-green-900' : 'bg-red-900'}`}>
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-xl mb-4">Messages ({messages.length}):</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm font-mono bg-gray-700 p-2 rounded">
              {msg}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        Check console for detailed logs and error traces.
      </div>
    </div>
  );
} 