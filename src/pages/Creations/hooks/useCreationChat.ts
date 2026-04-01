import { useState, useEffect, useCallback, useRef } from 'react';
import { message as antMessage } from 'antd';
import type { ChatMessage, Creation, LibraryMaterial } from '../../../types';
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
  const connectedRef = useRef(false);

  const connect = useCallback((message: string, attachments?: LibraryMaterial[]) => {
    connectedRef.current = true;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      attachments: attachments?.map(mat => ({
        id: mat.id,
        name: mat.name,
        url: mat.type === 'image' ? mat.metadata.imageUrl! : mat.metadata.videoUrl!,
        type: mat.type,
      })),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setConnected(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const url = `${backendUrl}/api/creations/${creationId}/chat`;

    // POST with body
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        attachments,
        agentType,
      }),
      credentials: 'include',
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error, status = ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let buffer = '';
      const decoder = new TextDecoder();
      let eventName: string | null = null;

      const processLine = () => {
        const newlinePos = buffer.indexOf('\n');
        if (newlinePos === -1) return;

        const line = buffer.slice(0, newlinePos);
        buffer = buffer.slice(newlinePos + 1);

        if (line.startsWith('event: ')) {
          eventName = line.slice('event: '.length);
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice('data: '.length);
          if (!dataStr || !eventName) return;
          try {
            const data = JSON.parse(dataStr);
            console.log('[Stream]', eventName, data);
            if (eventName === 'step') {
              if (data.content) {
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === 'assistant' && data.streaming) {
                    return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + data.content }];
                  } else {
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
            }
            if (eventName === 'result') {
              console.log('[Stream] Result', data);
              if (data.type === 'complete' && data.creation) {
                setMessages(data.creation.chatHistory || []);
                onComplete?.(data.creation);
                setLoading(false);
                setConnected(false);
                connectedRef.current = false;
              }
            }
            if (eventName === 'error') {
              console.error('[Stream] Error', data);
              antMessage.error(data.message || 'Unknown error');
              setLoading(false);
              setConnected(false);
              connectedRef.current = false;
            }
          } catch (e) {
            console.error('[Stream] Failed to parse SSE line', e, line);
          }
        }
      };

      const read = () => {
        if (connectedRef.current === false) return;
        reader.read().then(({ done, value }) => {
          if (done) {
            console.log('[Stream] Complete');
            setLoading(false);
            setConnected(false);
            connectedRef.current = false;
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          while (buffer.includes('\n')) {
            processLine();
          }
          read();
        }).catch(err => {
          console.error('[Stream] Read error', err);
          setLoading(false);
          setConnected(false);
          connectedRef.current = false;
        });
      };

      read();
    })
    .catch(error => {
      console.error('[Stream] Connection error', error);
      antMessage.error('连接失败: ' + error.message);
      setLoading(false);
      setConnected(false);
      connectedRef.current = false;
    });
  }, [creationId, agentType, onComplete]);

  const disconnect = useCallback(() => {
    connectedRef.current = false;
    setConnected(false);
    setLoading(false);
  }, []);

  // Update messages when initialMessages changes (when loading a new creation)
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      console.log('[Chat SSE] Setting initial messages:', initialMessages);
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const sendMessage = async (message: string, attachments?: LibraryMaterial[]): Promise<void> => {
    connect(message, attachments);
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
