import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import tokens from '@sprout/shared/tokens';

import { Button } from '../components/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// The chat REST endpoints aren't yet exposed via the oRPC router so this
// is a local-only sketch. When `chat` is added to AppRouter the hook from
// @sprout/api-client will replace this state.
export default function ChatScreen() {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.thread}>
        {messages.map((message, i) => (
          <View
            key={i}
            style={[styles.bubble, message.role === 'user' ? styles.user : styles.assistant]}
          >
            <Text style={message.role === 'user' ? styles.userText : styles.assistantText}>
              {message.content}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="What did you plant, water, or notice?"
          placeholderTextColor={tokens.color.inkMute}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Button variant="tomato" onPress={send}>
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  thread: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: tokens.color.forest[500],
    borderBottomRightRadius: 6,
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.cream,
    borderBottomLeftRadius: 6,
  },
  userText: { color: tokens.color.cream, fontSize: 15 },
  assistantText: { color: tokens.color.ink, fontSize: 15 },
  composer: {
    flexDirection: 'row',
    gap: tokens.space.sm,
    padding: tokens.space.md,
    backgroundColor: tokens.color.forest[700],
  },
  input: {
    flex: 1,
    backgroundColor: tokens.color.cream,
    borderRadius: tokens.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: tokens.color.ink,
    fontSize: 14,
  },
});
