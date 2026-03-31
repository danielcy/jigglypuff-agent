import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Empty,
  Spin,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { MaterialCategory, LibraryMaterial, MaterialMetadata } from '../../types';
import { materialCategoryApi, materialApi } from '../../services/api';

const MaterialsPage: React.FC = () => {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<LibraryMaterial | null>(null);
  const [categoryForm] = Form.useForm();
  const [materialForm] = Form.useForm();

  const loadCategories = useCallback(async () => {
    try {
      const data = await materialCategoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      message.error('加载类目失败');
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await materialApi.getAll(selectedCategoryId || undefined);
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
      message.error('加载素材失败');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadMaterials();
  }, [selectedCategoryId, loadMaterials]);

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? null : categoryId);
  };

  const openCategoryModal = (category?: MaterialCategory) => {
    setEditingCategory(category || null);
    categoryForm.setFieldsValue(category || { name: '', description: '' });
    setCategoryModalVisible(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalVisible(false);
    setEditingCategory(null);
    categoryForm.resetFields();
  };

  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields();
      if (editingCategory) {
        await materialCategoryApi.update(editingCategory.id, values);
        message.success('更新成功');
      } else {
        await materialCategoryApi.create(values);
        message.success('创建成功');
      }
      closeCategoryModal();
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      message.error('保存失败');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await materialCategoryApi.delete(id);
      message.success('删除成功');
      if (selectedCategoryId === id) {
        setSelectedCategoryId(null);
      }
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      message.error('删除失败');
    }
  };

  const openMaterialModal = (material?: LibraryMaterial) => {
    setEditingMaterial(material || null);
    materialForm.setFieldsValue(material || {
      name: '',
      description: '',
      category_id: selectedCategoryId || undefined,
      tags: '',
      type: 'image' as const,
      source: 'manual' as const,
      metadata: '',
    });
    setMaterialModalVisible(true);
  };

  const closeMaterialModal = () => {
    setMaterialModalVisible(false);
    setEditingMaterial(null);
    materialForm.resetFields();
  };

  const handleMaterialSubmit = async () => {
    try {
      const values = await materialForm.validateFields();
      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, values);
        message.success('更新成功');
      } else {
        await materialApi.create(values);
        message.success('创建成功');
      }
      closeMaterialModal();
      loadMaterials();
    } catch (error) {
      console.error('Failed to save material:', error);
      message.error('保存失败');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      await materialApi.delete(id);
      message.success('删除成功');
      loadMaterials();
    } catch (error) {
      console.error('Failed to delete material:', error);
      message.error('删除失败');
    }
  };

  const parseMetadata = (metadata: string): MaterialMetadata => {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  };

  const splitTags = (tags?: string): string[] => {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  };

  return (
    <div style={{ height: '100%', display: 'flex', gap: 16 }}>
      <Card
        title="素材类目"
        style={{ width: 280, flexShrink: 0, height: '100%', overflowY: 'auto' }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openCategoryModal()}
          >
            新增
          </Button>
        }
      >
        {categories.length === 0 ? (
          <Empty description="暂无类目" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map(category => (
              <Card
                key={category.id}
                size="small"
                hoverable
                onClick={() => handleCategoryClick(category.id)}
                style={{
                  borderColor: selectedCategoryId === category.id ? '#1890ff' : undefined,
                  backgroundColor: selectedCategoryId === category.id ? '#e6f7ff' : undefined,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{category.name}</span>
                  <div>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={e => {
                        e.stopPropagation();
                        openCategoryModal(category);
                      }}
                    />
                    <Popconfirm
                      title="确定要删除这个类目吗？删除后类目下所有素材都会被删除，此操作不可撤销。"
                      onConfirm={e => {
                        e?.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      okText="确定删除"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={e => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>
                </div>
                {category.description && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {category.description}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <Card
          title={selectedCategoryId ? `素材列表 - ${categories.find(c => c.id === selectedCategoryId)?.name}` : '全部素材'}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openMaterialModal()}
              disabled={!selectedCategoryId}
            >
              新增素材
            </Button>
          }
        >
          <Spin spinning={loading}>
            {materials.length === 0 ? (
              <Empty description={selectedCategoryId ? "该类目下暂无素材" : "暂无素材"} />
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {materials.map(material => {
                  const metadata = parseMetadata(material.metadata);
                  const tags = splitTags(material.tags);
                  const imageUrl = metadata.coverUrl || metadata.imageUrl;
                  const backendUrl = getBackendUrl();

                  return (
                    <Card
                      key={material.id}
                      hoverable
                      cover={
                        imageUrl ? (
                          <div style={{ height: 200, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                            <img
                              alt={material.name}
                              src={imageUrl.startsWith('/') ? `${backendUrl}${imageUrl}` : imageUrl}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{ height: 200, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                            无封面
                          </div>
                        )
                      }
                      actions={[
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => openMaterialModal(material)}
                        >
                          编辑
                        </Button>,
                        <Popconfirm
                          title="确定要删除这个素材吗？"
                          onConfirm={() => handleDeleteMaterial(material.id)}
                          okText="确定删除"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                          >
                            删除
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <Card.Meta
                        title={material.name}
                        description={
                          <div>
                            {material.description && (
                              <div style={{ marginBottom: 8 }}>
                                {material.description}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {tags.map(tag => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  );
                })}
              </div>
            )}
          </Spin>
        </Card>
      </div>

      <Modal
        title={editingCategory ? '编辑类目' : '新增类目'}
        open={categoryModalVisible}
        onCancel={closeCategoryModal}
        onOk={handleCategorySubmit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item
            name="name"
            label="类目名称"
            rules={[{ required: true, message: '请输入类目名称' }]}
          >
            <Input placeholder="请输入类目名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="类目描述"
          >
            <Input.TextArea placeholder="请输入类目描述（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingMaterial ? '编辑素材' : '新增素材'}
        open={materialModalVisible}
        onCancel={closeMaterialModal}
        onOk={handleMaterialSubmit}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={materialForm} layout="vertical">
          <Form.Item
            name="name"
            label="素材名称"
            rules={[{ required: true, message: '请输入素材名称' }]}
          >
            <Input placeholder="请输入素材名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="素材描述"
          >
            <Input.TextArea placeholder="请输入素材描述（可选）" rows={3} />
          </Form.Item>
          <Form.Item
            name="category_id"
            label="所属类目"
            rules={[{ required: true, message: '请选择类目' }]}
          >
            <Select placeholder="请选择类目">
              {categories.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签"
          >
            <Input placeholder="多个标签用逗号分隔（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialsPage;
