import React, { useState } from 'react';
import { Typography, Collapse } from 'antd';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../../../types';
import { AttachmentCardsList } from './AttachmentCardsList';
import styles from './ChatMessage.module.css';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

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
  const [expanded, setExpanded] = useState(false);

  const isUser = message.role === 'user';
  const isCard = message.role === 'card';

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

  if (isCard) {
    // Card messages (tool call / tool result) - compact collapsible style
    if (message.toolName === 'tool_result' && message.content.length > 100) {
      // Tool result with long content - collapsible
      const summary = message.content.slice(0, 100) + '...';
      return (
        <div className={`${styles.message} ${styles.card}`}>
          <div
            className={styles.cardHeader}
            onClick={() => setExpanded(!expanded)}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              ✅ 工具执行完成
            </Text>
            {expanded ? <DownOutlined /> : <RightOutlined />}
          </div>
          {expanded && (
            <div className={styles.cardContent}>
              <pre className={styles.resultPre}>{message.content}</pre>
            </div>
          )}
        </div>
      );
    }

    // Short content or tool call - always show
    return (
      <div className={`${styles.message} ${styles.card}`}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {message.content}
        </Text>
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
