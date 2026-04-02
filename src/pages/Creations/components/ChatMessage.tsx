import React from 'react';
import { Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../../../types';
import { AttachmentCardsList } from './AttachmentCardsList';
import styles from './ChatMessage.module.css';

const { Text } = Typography;

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Custom image component to limit maximum size
const CustomImage = (props: any) => {
  return (
    <img
      {...props}
      style={{
        maxWidth: '50%',
        maxHeight: '50vh',
        width: 'auto',
        height: 'auto',
      }}
    />
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className={`${styles.message} ${styles.user}`}>
        <div className={`${styles.content} ${styles.userContent}`}>
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentCardsList
              materials={message.attachments}
            />
          )}
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

  const processContent = (content: string) => {
    // 正则匹配类似"/products/1775122548795-11864080.png", 为它们加上HOST前缀
    // Match any image/video extension: png, jpg, jpeg, webp, mp4, etc.
    return content.replace(/\/products\/[0-9]+-[0-9]+\.[a-z0-9]+/g, (match) => {
      return `${backendUrl}${match}`;
    });
  };

  return (
    <div className={`${styles.message} ${styles.assistantFullWidth}`}>
      <div className={styles.assistantMarkdown}>
        <ReactMarkdown components={{ img: CustomImage }}>
          {processContent(message.content)}
        </ReactMarkdown>
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
