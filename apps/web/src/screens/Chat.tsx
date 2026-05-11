import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatSession, useCreateChatSession, useSendChatMessage } from '@sprout/api-client';

import { Button } from '../components/Button';
import styles from './Chat.module.css';

const GREETING = "Hey — I'm Sprout. What did you do in the garden today?";

export const ChatScreen = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const threadRef = useRef<HTMLDivElement | null>(null);

  const createSession = useCreateChatSession();
  const session = useChatSession(sessionId ?? '', { enabled: Boolean(sessionId) });
  const sendMessage = useSendChatMessage();

  const messages = session.data?.messages?.filter((m) => m.role !== 'system') ?? [];

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, sendMessage.isPending]);

  const send = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMessage.isPending || createSession.isPending) return;
    setDraft('');
    try {
      let id = sessionId;
      if (!id) {
        const created = await createSession.mutateAsync();
        id = created.id;
        setSessionId(id);
      }
      await sendMessage.mutateAsync({ id, content: trimmed });
    } catch {
      setDraft(trimmed);
    }
  };

  const busy = sendMessage.isPending || createSession.isPending;

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Chat</p>
        <h1 className={styles.title}>
          Talk it out with <em>Sprout</em>.
        </h1>
      </header>

      <div className={styles.thread} ref={threadRef}>
        {messages.length === 0 && !busy && <div className={styles.assistant}>{GREETING}</div>}
        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className={styles.user}>
              {message.content}
            </div>
          ) : (
            <div key={message.id} className={`${styles.assistant} ${styles.markdown}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          ),
        )}
        {busy && <div className={styles.assistant}>Sprout is thinking…</div>}
        {(sendMessage.isError || createSession.isError) && (
          <div className={styles.assistant}>
            Sorry — that message didn&rsquo;t go through. Try again?
          </div>
        )}
      </div>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className={styles.input}
          placeholder="What did you plant, water, or notice?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="tomato" disabled={!draft.trim() || busy}>
          Send
        </Button>
      </form>
    </div>
  );
};
