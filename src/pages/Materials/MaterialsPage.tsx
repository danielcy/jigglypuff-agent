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
  Upload,
  Image,
} from 'antd';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { MaterialCategory, LibraryMaterial, MaterialMetadata, LibraryMaterialType } from '../../types';
import { materialCategoryApi, materialApi } from '../../services/api';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const MaterialsPage: React.FC = () => {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<LibraryMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<LibraryMaterial | null>(null);
  const [uploading, setUploading] = useState(false);
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
    materialForm.resetFields();

    if (material) {
      materialForm.setFieldsValue(material);
    } else {
      materialForm.setFieldsValue({
        name: '',
        description: '',
        category_id: selectedCategoryId || undefined,
        tags: '',
        type: 'image' as const,
        source: 'manual' as const,
      });
    }
    setMaterialModalVisible(true);
  };

  const closeMaterialModal = () => {
    setMaterialModalVisible(false);
    setEditingMaterial(null);
    materialForm.resetFields();
  };

  const openPreviewModal = (material: LibraryMaterial) => {
    setPreviewMaterial(material);
    setPreviewModalVisible(true);
  };

  const closePreviewModal = () => {
    setPreviewModalVisible(false);
    setPreviewMaterial(null);
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      message.error('只能上传图片或视频文件');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleImageUploadChange = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploading(false);
      const url = info.file.response.data.url;
      materialForm.setFieldValue('imageUrl', url);
      message.success('上传成功');
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('上传失败');
    }
  };

  const handleCoverUploadChange = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploading(false);
      const url = info.file.response.data.url;
      materialForm.setFieldValue('coverUrl', url);
      message.success('封面上传成功');
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('上传失败');
    }
  };

  const handleVideoUploadChange = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploading(false);
      const url = info.file.response.data.url;
      materialForm.setFieldValue('videoUrl', url);
      message.success('视频上传成功');
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('上传失败');
    }
  };

  const handleMaterialSubmit = async () => {
    try {
      const values = await materialForm.validateFields();
      const metadata: MaterialMetadata = {};

      if (values.type === 'image') {
        if (!values.imageUrl) {
          message.error('请上传图片');
          return;
        }
        metadata.imageUrl = values.imageUrl;
      }

      if (values.type === 'video') {
        if (!values.coverUrl) {
          message.error('请上传封面图');
          return;
        }
        if (!values.videoUrl) {
          message.error('请上传视频');
          return;
        }
        metadata.coverUrl = values.coverUrl;
        metadata.videoUrl = values.videoUrl;
      }

      const data = {
        ...values,
        metadata: JSON.stringify(metadata),
      };

      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, data);
        message.success('更新成功');
      } else {
        await materialApi.create(data);
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

  const parseMetadata = (metadata: string | Record<string, any>): MaterialMetadata => {
    if (typeof metadata === 'object') {
      return metadata as MaterialMetadata;
    }
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  const getBackendUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  };

  const splitTags = (tags?: string | string[]): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  };

  const renderImageUpload = () => {
    const imageUrl = materialForm.getFieldValue('imageUrl');
    return (
      <Upload
        name="file"
        action={`${backendUrl}/api/upload`}
        beforeUpload={beforeUpload}
        onChange={handleImageUploadChange}
        showUploadList={false}
      >
        {imageUrl ? (
          <div style={{ marginBottom: 8 }}>
            <Image
              src={`${backendUrl}${imageUrl}`}
              alt="已上传"
              style={{ maxWidth: 200, maxHeight: 150, objectFit: 'contain', border: '1px solid #eee', borderRadius: 4 }}
              preview={true}
            />
            <br />
            <Button style={{ marginTop: 8 }} onClick={() => materialForm.setFieldValue('imageUrl', '')}>重新上传</Button>
          </div>
        ) : (
          <Button loading={uploading} icon={<UploadOutlined />}>点击上传图片</Button>
        )}
      </Upload>
    );
  };

  const renderCoverUpload = () => {
    const coverUrl = materialForm.getFieldValue('coverUrl');
    return (
      <Upload
        name="file"
        action={`${backendUrl}/api/upload`}
        beforeUpload={beforeUpload}
        onChange={handleCoverUploadChange}
        showUploadList={false}
      >
        {coverUrl ? (
          <div style={{ marginBottom: 8 }}>
            <Image
              src={`${backendUrl}${coverUrl}`}
              alt="已上传封面"
              style={{ maxWidth: 200, maxHeight: 150, objectFit: 'contain', border: '1px solid #eee', borderRadius: 4 }}
              preview={true}
            />
            <br />
            <Button style={{ marginTop: 8 }} onClick={() => materialForm.setFieldValue('coverUrl', '')}>重新上传</Button>
          </div>
        ) : (
          <Button loading={uploading} icon={<UploadOutlined />}>点击上传封面图</Button>
        )}
      </Upload>
    );
  };

  const renderVideoUpload = () => {
    const videoUrl = materialForm.getFieldValue('videoUrl');
    return (
      <Upload
        name="file"
        action={`${backendUrl}/api/upload`}
        beforeUpload={beforeUpload}
        onChange={handleVideoUploadChange}
        showUploadList={false}
      >
        {videoUrl ? (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 12, color: '#666' }}>已上传: {videoUrl}</p>
            <Button onClick={() => materialForm.setFieldValue('videoUrl', '')}>重新上传</Button>
          </div>
        ) : (
          <Button loading={uploading} icon={<UploadOutlined />}>点击上传视频</Button>
        )}
      </Upload>
    );
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
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个类目吗？删除后类目下所有素材都会被删除，此操作不可撤销。"
                      onConfirm={e => {
                        e?.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={e => e.stopPropagation()}
                      >
                        删除
                      </Button>
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
                      onClick={() => openPreviewModal(material)}
                      cover={
                        imageUrl ? (
                          <div style={{ height: 200, overflow: 'hidden', backgroundColor: '#f5f5f5', cursor: 'pointer' }}>
                            <img
                              alt={material.name}
                              src={imageUrl.startsWith('/') ? `${backendUrl}${imageUrl}` : imageUrl}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{ height: 200, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', cursor: 'pointer' }}>
                            无封面
                          </div>
                        )
                      }
                      actions={[
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={e => {
                            e?.stopPropagation();
                            openMaterialModal(material);
                          }}
                        >
                          编辑
                        </Button>,
                        <Popconfirm
                          title="确定要删除这个素材吗？"
                          onConfirm={e => {
                            e?.stopPropagation();
                            handleDeleteMaterial(material.id);
                          }}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={e => e.stopPropagation()}
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
        confirmLoading={uploading}
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
            name="type"
            label="素材类型"
            rules={[{ required: true, message: '请选择素材类型' }]}
          >
            <Select placeholder="请选择素材类型">
              <Select.Option value="image">图片</Select.Option>
              <Select.Option value="video">视频</Select.Option>
            </Select>
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

          {/* Hidden fields to store uploaded URLs and other required fields */}
          <Form.Item name="imageUrl" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="coverUrl" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="videoUrl" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="source" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={() => true}
          >
            {() => {
              const type = materialForm.getFieldValue('type') as LibraryMaterialType;
              if (type === 'image') {
                return (
                  <Form.Item label="图片">
                    {renderImageUpload()}
                  </Form.Item>
                );
              }
              if (type === 'video') {
                return (
                  <>
                    <Form.Item label="封面图">
                      {renderCoverUpload()}
                    </Form.Item>
                    <Form.Item label="视频">
                      {renderVideoUpload()}
                    </Form.Item>
                  </>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={previewMaterial?.name}
        open={previewModalVisible}
        onCancel={closePreviewModal}
        footer={null}
        width={640}
        destroyOnClose
        style={{ maxHeight: '80vh' }}
        bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflowY: 'auto' }}
      >
        {previewMaterial && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p><strong>名称：</strong> {previewMaterial.name}</p>
              {previewMaterial.description && <p><strong>描述：</strong> {previewMaterial.description}</p>}
              <p><strong>类型：</strong> {previewMaterial.type === 'image' ? '图片' : '视频'}</p>
              <p><strong>标签：</strong> {previewMaterial.tags || '无'}</p>
            </div>

            <div style={{ maxHeight: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {(() => {
                const metadata = parseMetadata(previewMaterial.metadata);
                const backendUrl = getBackendUrl();

                if (previewMaterial.type === 'image') {
                  const imageUrl = metadata.imageUrl;
                  if (!imageUrl) return null;
                  return (
                    <Image
                      src={imageUrl.startsWith('/') ? `${backendUrl}${imageUrl}` : imageUrl}
                      alt={previewMaterial.name}
                      style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 8 }}
                    />
                  );
                }

                if (previewMaterial.type === 'video') {
                  const videoUrl = metadata.videoUrl;
                  if (!videoUrl) return null;
                  return (
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 8 }}
                    />
                  );
                }

                return null;
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaterialsPage;
