import React from 'react';
import { FaPaperPlane, FaStop, FaTrash, FaRobot, FaUser } from 'react-icons/fa';
import { streamText } from '../../lib/geminiClient';
import { FORCED_MODEL } from '../../lib/geminiClient';

export default function Chatbot() {
  const [messages, setMessages] = React.useState([
    { 
      role: 'assistant', 
      text: 'Hello! I\'m your health assistant. I can help answer general health questions and provide information. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const model = FORCED_MODEL || 'gemini-2.5-flash';
  const buffer = React.useRef('');
  const stopFlag = React.useRef({ stopped: false });
  const listRef = React.useRef(null);

  React.useEffect(() => {
    // Auto-scroll to bottom whenever messages change
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  function clearChat() {
    setMessages([
      { 
        role: 'assistant', 
        text: 'Chat cleared! How can I help you today?',
        timestamp: new Date()
      }
    ]);
  }

  async function onSend(e) {
    e.preventDefault();
    if (loading) return;
    const text = input.trim();
    if (!text) return;

    setMessages(m => [...m, { role: 'user', text, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    // Build a simple prompt from history
    const prompt = messages
      .concat({ role: 'user', text })
      .filter(m => m.role !== 'system')
      .map(m => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n') + '\nASSISTANT:';

    buffer.current = '';
    stopFlag.current.stopped = false;

    // Placeholder assistant message at the end
    const assistantIndex = messages.length + 1;
    setMessages(m => [...m, { role: 'assistant', text: '', timestamp: new Date() }]);

    try {
      await streamText(
        prompt,
        chunk => {
          buffer.current += chunk;
          setMessages(m =>
            m.map((msg, i) =>
              i === assistantIndex ? { ...msg, text: buffer.current } : msg
            )
          );
        },
        model,
        {
          maxOutputTokens: 400, // keep answers concise
          temperature: 0.7,
          shouldStop: () => stopFlag.current.stopped
        }
      );
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages(m =>
        m.map((msg, i) =>
          i === assistantIndex
            ? { ...msg, text: `(error getting response)` }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function onStop() {
    // Signal the stream loop to stop on next chunk
    stopFlag.current.stopped = true;
    setLoading(false);
  }

  function onKeyDown(e) {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  }

  return (
    <section className="appointments-pane">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Chatbot</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {loading && (
            <button type="button" className="btn secondary" onClick={onStop}>Stop</button>
          )}
          <button type="button" className="btn secondary" onClick={clearChat}>Clear</button>
        </div>
      </div>
      <p className="hint">Information only; not a diagnosis.</p>

      <div style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: '60vh' // fixed height so footer input is always visible
      }}>
        <div
          ref={listRef}
          style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
        >
          {messages.filter(m => m.role !== 'system').map((m, i) => (
            <div key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--color-3)' : 'var(--color-bg-light)',
                color: 'var(--color-text-dark)',
                padding: '0.6rem 0.8rem',
                borderRadius: 10,
                maxWidth: '70%',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 6px var(--shadow-light)'
              }}>
              {m.text || (loading && m.role === 'assistant' ? '...' : '')}
            </div>
          ))}
        </div>

        <form onSubmit={onSend} style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading && !stopFlag.current.stopped}
            placeholder="Ask something..."
            rows={2}
            style={{
              flex: 1,
              padding: '0.6rem 0.8rem',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              resize: 'none'
            }}
          />
          <button type="submit" disabled={loading} className="btn primary">Send</button>
        </form>
      </div>
    </section>
  );
}