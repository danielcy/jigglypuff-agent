import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Typography,
  Upload,
  message,
  Spin,
} from 'antd';
import { SendOutlined, UploadOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import type { ChatMessage } from '../../../types';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ToolCallView } from './ToolCallView';
import styles from './ChatWindow.module.css';

const { Text } = Typography;

interface ChatWindowProps {
  creationId: string;
  messages: ChatMessage[];
  loading: boolean;
  connected: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  loading,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isLt100M = file.size / 1024 / 1024 < 100 * 1024;
    if (!isLt100M) {
      message.error('File must be smaller than 100MB');
    }
    return isLt100M;
  };

  const renderMessageItem = (message: ChatMessage) => {
    if (message.role === 'tool') {
      return (
        <ToolCallView
          toolName={message.toolName!}
          result={message.content}
        />
      );
    }
    return <ChatMessageComponent message={message} />;
  };

  return (
    <Card
      className={styles.container}
      title="Agent 交互"
      extra={loading && <Spin size="small" />}
    >
      <div className={styles.realContainer}>
        <div className={styles.messages}>
          {messages.filter(m => m.role !== 'system').length === 0 && !loading && (
            <div className={styles.empty}>
              <Text type="secondary">发送消息开始创作...</Text>
            </div>
          )}
          <List
            dataSource={messages.filter(m => m.role !== 'system')}
            renderItem={renderMessageItem}
            itemLayout="vertical"
            pagination={false}
          />
          {loading && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Spin size="small" />
              <Text type="secondary" style={{ marginLeft: 8 }}>AI 正在思考中...</Text>
            </div>
          )}
          <div ref={messagesEndRef} style={{height: 80}} />
        </div>
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <Input.TextArea
              className={styles.textArea}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息，按 Enter 发送，Shift + Enter 换行..."
              disabled={loading}
              autoSize={{ minRows: 1, maxRows: 6 }}
            />
            <div className={styles.actions}>
              <Upload
                action={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/upload`}
                beforeUpload={beforeUpload}
                disabled={loading}
                showUploadList={false}
              >
                <Button
                  className={styles.uploadButton}
                  icon={<UploadOutlined />}
                  disabled={loading}
                />
              </Upload>
              <Button
                className={styles.sendButton}
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
