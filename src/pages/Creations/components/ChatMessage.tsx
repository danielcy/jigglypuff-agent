import React from 'react';
import { Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../../../types';
import styles from './ChatMessage.module.css';

const { Text } = Typography;

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className={`${styles.message} ${styles.user}`}>
        <div className={`${styles.content} ${styles.userContent}`}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          {message.toolName && (
            <div className={styles.toolName}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tool: {message.toolName}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message: no bubble, full width markdown rendering
  return (
    <div className={`${styles.message} ${styles.assistantFullWidth}`}>
      <div className={styles.assistantMarkdown}>
        <ReactMarkdown>{message.content}</ReactMarkdown>
        {message.toolName && (
          <div className={styles.toolName}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tool: {message.toolName}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
