import { useState } from 'react';

import { Button } from '../components/Button';
import styles from './Chat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// The chat REST endpoints aren't yet exposed via the oRPC router so this is
// a local-only sketch. When `chat` is added to AppRouter the hook from
// @sprout/api-client will replace this state.
export const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey — I'm Sprout. What did you do in the garden today?",
    },
  ]);
  const [draft, setDraft] = useState('');

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { role: 'user', content: draft.trim() }]);
    setDraft('');
  };

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Chat</p>
        <h1 className={styles.title}>
          Talk it out with <em>Sprout</em>.
        </h1>
      </header>

      <div className={styles.thread}>
        {messages.map((message, i) => (
          <div key={i} className={message.role === 'user' ? styles.user : styles.assistant}>
            {message.content}
          </div>
        ))}
      </div>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className={styles.input}
          placeholder="What did you plant, water, or notice?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="tomato">
          Send
        </Button>
      </form>
    </div>
  );
};
