import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Typography,
  Spin,
} from 'antd';
import { SendOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { ChatMessage, LibraryMaterial } from '../../../types';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ToolCallView } from './ToolCallView';
import { SelectedMaterialsBar } from './SelectedMaterialsBar';
import { MaterialSelectModal } from './MaterialSelectModal';
import styles from './ChatWindow.module.css';

const { Text } = Typography;

interface ChatWindowProps {
  creationId: string;
  petIds: string[];
  messages: ChatMessage[];
  loading: boolean;
  connected: boolean;
  onSendMessage: (message: string, attachments?: LibraryMaterial[]) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  creationId,
  petIds,
  messages,
  loading,
  connected: _connected,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<LibraryMaterial[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleOpenMaterialModal = () => {
    setMaterialModalVisible(true);
  };

  const handleCloseMaterialModal = () => {
    setMaterialModalVisible(false);
  };

  const handleConfirmMaterialSelect = (selected: LibraryMaterial[]) => {
    setSelectedMaterials(selected);
  };

  const handleRemoveMaterial = (id: number) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed && selectedMaterials.length === 0) return;
    onSendMessage(trimmed, selectedMaterials);
    setInputValue('');
    setSelectedMaterials([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
          {/* 新增: 已选素材条 */}
          <SelectedMaterialsBar
            selected={selectedMaterials}
            onRemove={handleRemoveMaterial}
          />
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
              {/* 修改: Upload 按钮改为 导入素材 */}
              <Button
                className={styles.uploadButton}
                icon={<FolderOpenOutlined />}
                disabled={loading}
                onClick={handleOpenMaterialModal}
              />
              <Button
                className={styles.sendButton}
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={(!inputValue.trim() && selectedMaterials.length === 0) || loading}
                loading={loading}
              />
            </div>
          </div>
        </div>
        {/* 新增: 素材选择弹窗 */}
        <MaterialSelectModal
          open={materialModalVisible}
          onCancel={handleCloseMaterialModal}
          onConfirm={handleConfirmMaterialSelect}
          existingSelected={selectedMaterials}
          creationId={creationId}
          petIds={petIds}
        />
      </div>
    </Card>
  );
};
