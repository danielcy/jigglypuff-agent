import React, { useEffect, useState } from 'react';
import {
  Card,
  List,
  Avatar,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Empty,
  Upload,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { Pet } from '../../types';
import { petApi } from '../../services/api';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';

const API_BASE_URL = 'http://localhost:3001';

const PetsPage: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const [form] = Form.useForm();

  const loadPets = async () => {
    setLoading(true);
    try {
      const data = await petApi.getAll();
      setPets(data);
    } catch (error) {
      message.error('加载宠物列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleAdd = () => {
    setEditingPet(null);
    form.resetFields();
    setAvatarKey(prev => prev + 1);
    setModalVisible(true);
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    form.setFieldsValue(pet);
    setAvatarKey(prev => prev + 1);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await petApi.delete(id);
      message.success('删除成功');
      loadPets();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPet) {
        await petApi.update(editingPet.id, values);
        message.success('更新成功');
      } else {
        await petApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadPets();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  const handleUploadChange = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploading(false);
      const url = `${API_BASE_URL}${info.file.response.data.url}`;
      form.setFieldValue('avatar', url);
      message.success('上传成功');
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('上传失败');
    }
  };

  const getAvatar = () => {
    const avatar = form.getFieldValue('avatar');
    if (!avatar) {
      return (
        <div>
          {uploading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>上传照片</div>
        </div>
      );
    }
    return (
      <div style={{ width: '100%', maxHeight: 200, overflow: 'hidden' }}>
        <img
          src={avatar}
          alt="avatar"
          style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }}
        />
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>宠物管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加宠物
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
        dataSource={pets}
        loading={loading}
        locale={{ emptyText: <Empty description="还没有添加宠物哦" /> }}
        renderItem={pet => (
          <List.Item>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <div style={{ paddingBottom: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden' }}>
                  {pet.avatar ? (
                    <div
                      style={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={pet.avatar}
                        alt={pet.name}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        preview={true}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5',
                      }}
                    >
                      <UserOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                    </div>
                  )}
                </div>
              }
              actions={[
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(pet)}
                >
                  编辑
                </Button>,
                <Popconfirm
                  title="确定要删除这只宠物吗？"
                  onConfirm={() => handleDelete(pet.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                avatar={<Avatar src={pet.avatar || undefined} icon={!pet.avatar ? <UserOutlined /> : undefined} />}
                title={pet.name}
                description={
                  <Space direction="vertical" size={0}>
                    {pet.breed && <div>品种: {pet.breed}</div>}
                    {pet.age !== undefined && <div>年龄: {pet.age} 岁</div>}
                    {pet.description && <div style={{ marginTop: 8 }}>{pet.description}</div>}
                  </Space>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingPet ? '编辑宠物信息' : '添加宠物'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingPet ? '保存' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="宠物姓名"
            rules={[{ required: true, message: '请输入宠物姓名' }]}
          >
            <Input placeholder="请输入宠物姓名" />
          </Form.Item>

          <Form.Item name="avatar" label="照片">
            <Upload
              key={avatarKey}
              name="file"
              action={`${API_BASE_URL}/api/upload`}
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={file => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  message.error('只能上传 JPG/PNG 图片!');
                }
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error('图片大小不能超过 5MB!');
                }
                return isJpgOrPng && isLt5M;
              }}
              onChange={handleUploadChange}
            >
              {getAvatar()}
            </Upload>
          </Form.Item>

          <Form.Item name="breed" label="品种">
            <Input placeholder="请输入品种" />
          </Form.Item>

          <Form.Item name="age" label="年龄">
            <InputNumber
              min={0}
              step={0.5}
              placeholder="年龄"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="description" label="简介">
            <Input.TextArea placeholder="简单介绍一下你的宠物吧" rows={3} />
          </Form.Item>

          <Form.Item name="portrait" label="AI 画像">
            <Input.TextArea placeholder="AI 自动总结的宠物画像，也可以手动编辑" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PetsPage;
