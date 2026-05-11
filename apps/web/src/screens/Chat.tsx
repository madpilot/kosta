import { useEffect, useRef, useState } from 'react';
import { useChatSession, useCreateChatSession, useSendChatMessage } from '@sprout/api-client';

import { Button } from '../components/Button';
import styles from './Chat.module.css';

const GREETING = "Hey — I'm Sprout. What did you do in the garden today?";

export const ChatScreen = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const threadRef = useRef<HTMLDivElement | null>(null);

  const createSession = useCreateChatSession();
  const createMutate = createSession.mutate;
  useEffect(() => {
    if (!sessionId) {
      createMutate(undefined, {
        onSuccess: (session) => setSessionId(session.id),
      });
    }
  }, [sessionId, createMutate]);

  const session = useChatSession(sessionId ?? '', { enabled: Boolean(sessionId) });
  const sendMessage = useSendChatMessage();

  const messages = session.data?.messages?.filter((m) => m.role !== 'system') ?? [];

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, sendMessage.isPending]);

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed || !sessionId || sendMessage.isPending) return;
    sendMessage.mutate({ id: sessionId, content: trimmed });
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

      <div className={styles.thread} ref={threadRef}>
        {messages.length === 0 && !sendMessage.isPending && (
          <div className={styles.assistant}>{GREETING}</div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === 'user' ? styles.user : styles.assistant}
          >
            {message.content}
          </div>
        ))}
        {sendMessage.isPending && <div className={styles.assistant}>Sprout is thinking…</div>}
        {sendMessage.isError && (
          <div className={styles.assistant}>
            Sorry — that message didn&rsquo;t go through. Try again?
          </div>
        )}
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
          disabled={!sessionId}
        />
        <Button type="submit" variant="tomato" disabled={!sessionId || sendMessage.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
};
