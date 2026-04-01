import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage, Creation } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

interface UseCreationChatOptions {
  creationId: string;
  agentType?: 'lead' | 'hot_analyze' | 'script' | 'shot';
  initialMessages?: ChatMessage[];
  onComplete?: (creation: Creation) => void;
}

export const useCreationChat = ({ creationId, agentType, initialMessages, onComplete }: UseCreationChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback((message: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setConnected(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const url = `${backendUrl}/api/creations/${creationId}/chat?message=${encodeURIComponent(message)}${agentType ? `&agentType=${agentType}` : ''}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[Chat SSE] Connected');
    };

    eventSource.addEventListener('step', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Chat SSE] Step:', data);
        if (data.content) {
          // Add assistant step message
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant' && data.streaming) {
              // Update last assistant message if streaming
              return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + data.content }];
            } else {
              // Add new assistant message
              const assistantMessage: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date(),
              };
              return [...prev, assistantMessage];
            }
          });
        }
      } catch (e) {
        console.error('[Chat SSE] Failed to parse step event', e);
      }
    });

    eventSource.addEventListener('result', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Chat SSE] Result:', data);
        if (data.type === 'complete' && data.creation) {
          setMessages(data.creation.chatHistory || []);
          onComplete?.(data.creation);
          setLoading(false);
          setConnected(false);
          eventSource.close();
        }
      } catch (e) {
        console.error('[Chat SSE] Failed to parse result event', e);
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.error('[Chat SSE] Error:', event);
      setLoading(false);
      setConnected(false);
      eventSource.close();
    });

    eventSource.addEventListener('message', () => {
      setLoading(false);
    });
  }, [creationId, agentType, onComplete]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      setLoading(false);
    }
  }, []);

  // Update messages when initialMessages changes (when loading a new creation)
  useEffect(() => {
    if (initialMessages) {
      console.log('[Chat SSE] Setting initial messages:', initialMessages);
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const sendMessage = async (message: string): Promise<void> => {
    connect(message);
  };

  return {
    messages,
    loading,
    connected,
    sendMessage,
    disconnect,
    setMessages,
  };
};
