import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, message, Spin } from 'antd';
import type { Creation, Pet } from '../../types';
import { creationApi, petApi } from '../../services/api';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { ChatWindow } from './components/ChatWindow';
import { useCreationChat } from './hooks/useCreationChat';
import styles from './CreationsPage.module.css';

interface CreationForm {
  title: string;
  petIds: string[];
}

const CreationsPage: React.FC = () => {
  const [creations, setCreations] = useState<Array<Pick<Creation, 'id' | 'title' | 'status' | 'currentStage' | 'createdAt' | 'updatedAt'>>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [form] = Form.useForm<CreationForm>();

  const loadCreations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await creationApi.list();
      setCreations(data);
    } catch (error) {
      message.error('加载创作列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCreation = useCallback(async (id: string) => {
    try {
      const data = await creationApi.getById(id);
      setSelectedCreation(data);
    } catch (error) {
      message.error('加载创作详情失败');
    }
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const creation = await creationApi.create({
        title: values.title,
        petIds: values.petIds || [],
        materialIds: [],
      });
      setCreations([...creations, {
        id: creation.id,
        title: creation.title,
        status: creation.status,
        currentStage: creation.currentStage,
        createdAt: creation.createdAt,
        updatedAt: creation.updatedAt,
      }]);
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      setSelectedId(creation.id);
      setSelectedCreation(creation);
    } catch (error) {
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  }, [form, creations]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await creationApi.delete(id);
      setCreations(creations.filter(c => c.id !== id));
      message.success('删除成功');
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedCreation(null);
      }
    } catch (error) {
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  }, [creations, selectedId]);

  const handleUpdate = useCallback(async (updates: Partial<Creation>) => {
    if (!selectedId) return;
    try {
      setLoading(true);
      const updated = await creationApi.update(selectedId, updates);
      setSelectedCreation(updated);
      loadCreations();
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  }, [selectedId, loadCreations]);

  const {
    messages,
    loading: chatLoading,
    connected,
    sendMessage,
  } = useCreationChat({
    creationId: selectedId || '',
    initialMessages: selectedCreation?.chatHistory || [],
    onComplete: () => {
      // Reload the full creation detail to get newly added products from creation_products table
      if (selectedId) {
        loadCreation(selectedId);
      }
      loadCreations();
    },
  });

  useEffect(() => {
    loadCreations();
    const loadPets = async () => {
      try {
        const data = await petApi.getAll();
        setPets(data);
      } catch (error) {
        console.error('Failed to load pets', error);
      }
    };
    loadPets();
  }, [loadCreations]);

  useEffect(() => {
    if (selectedId) {
      loadCreation(selectedId);
    } else {
      setSelectedCreation(null);
    }
  }, [selectedId, loadCreation]);

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <ProjectList
          creations={creations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={() => setCreateModalVisible(true)}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
      <div className={styles.right}>
        {selectedCreation && selectedId ? (
          <div className={styles.split}>
            <div className={styles.detail}>
              <ProjectDetail
                creation={selectedCreation}
                onUpdate={handleUpdate}
                loading={loading}
              />
            </div>
            <div className={styles.chat}>
              <ChatWindow
                creationId={selectedId}
                petIds={selectedCreation.petIds}
                messages={messages}
                loading={chatLoading}
                connected={connected}
                onSendMessage={sendMessage}
              />
            </div>
          </div>
        ) : (
          <div className={styles.chatFull}>
            请选择项目
          </div>
        )}
      </div>
      <Modal
        title="新建创作项目"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="项目标题"
            rules={[{ required: true, message: '请输入项目标题' }]}
          >
            <Input placeholder="输入项目标题" />
          </Form.Item>
          <Form.Item
            name="petIds"
            label="关联宠物"
          >
            <Select
              mode="multiple"
              placeholder="选择关联的宠物"
              allowClear
              style={{ width: '100%' }}
            >
              {pets.map(pet => (
                <Select.Option key={pet.id} value={pet.id}>
                  {pet.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      {loading && (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default CreationsPage;
