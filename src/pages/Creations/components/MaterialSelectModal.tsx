import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Select,
  Grid,
  Card,
  Empty,
  Spin,
  message,
  Tabs,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { LibraryMaterial, MaterialCategory, CreationProduct, Pet } from '../../../types';
import { materialApi, materialCategoryApi, petApi, creationApi } from '../../../services/api';
import styles from './MaterialSelectModal.module.css';

const { useBreakpoint } = Grid;

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

type TabKey = 'library' | 'products' | 'pets';

interface MaterialSelectModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (selected: LibraryMaterial[]) => void;
  existingSelected: LibraryMaterial[];
  creationId: string | null;
  petIds: string[];
}

// Convert CreationProduct to LibraryMaterial format for compatibility
const convertProductToLibrary = (product: CreationProduct): LibraryMaterial => {
  return {
    id: Number(product.id) || Date.now() + Math.round(Math.random() * 1E9),
    type: product.type,
    source: 'agent',
    metadata: product.type === 'image'
      ? { imageUrl: product.url }
      : { coverUrl: product.url, videoUrl: product.url },
    name: product.type === 'image' ? 'AI 生成图片' : 'AI 生成视频',
    description: product.prompt,
    categoryId: 0,
    createdAt: new Date().toISOString(),
  };
};

// Convert Pet to LibraryMaterial format for compatibility
const convertPetToLibrary = (pet: Pet): LibraryMaterial => {
  return {
    id: Number(pet.id) || Date.now() + Math.round(Math.random() * 1E9),
    type: 'image',
    source: 'agent',
    metadata: { imageUrl: pet.avatar || pet.portrait || '' },
    name: `${pet.name} - 宠物头像`,
    description: pet.description || '',
    categoryId: 0,
    createdAt: new Date().toISOString(),
  };
};

export const MaterialSelectModal: React.FC<MaterialSelectModalProps> = ({
  open,
  onCancel,
  onConfirm,
  existingSelected,
  creationId,
  petIds,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('library');
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [libraryMaterials, setLibraryMaterials] = useState<LibraryMaterial[]>([]);
  const [productMaterials, setProductMaterials] = useState<LibraryMaterial[]>([]);
  const [petMaterials, setPetMaterials] = useState<LibraryMaterial[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(existingSelected.map(m => m.id))
  );
  const [loading, setLoading] = useState(false);
  const { } = useBreakpoint();

  useEffect(() => {
    if (open) {
      loadCategories();
      loadTabData('library');
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const data = await materialCategoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const loadTabData = async (tab: TabKey) => {
    setLoading(true);
    try {
      if (tab === 'library') {
        const data = await materialApi.getAll(selectedCategoryId || undefined);
        setLibraryMaterials(data);
      } else if (tab === 'products' && creationId) {
        const creation = await creationApi.getById(creationId);
        if (creation.products) {
          const converted = creation.products.map(convertProductToLibrary);
          setProductMaterials(converted);
        } else {
          setProductMaterials([]);
        }
      } else if (tab === 'pets' && petIds.length > 0) {
        const allPets = await petApi.getAll();
        const filteredPets = allPets.filter(p => petIds.includes(p.id));
        const converted = filteredPets.map(convertPetToLibrary);
        setPetMaterials(converted);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, selectedCategoryId, creationId, petIds]);

  const toggleSelect = (material: LibraryMaterial) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(material.id)) {
      newIds.delete(material.id);
    } else {
      // 检查最大数量
      if (newIds.size >= 5) {
        message.warning('最多只能选择 5 个素材');
        return;
      }
      newIds.add(material.id);
    }
    setSelectedIds(newIds);
  };

  const handleConfirm = () => {
    let allMaterials: LibraryMaterial[] = [];
    if (activeTab === 'library') {
      allMaterials = libraryMaterials.filter(m => selectedIds.has(m.id));
    } else if (activeTab === 'products') {
      allMaterials = productMaterials.filter(m => selectedIds.has(m.id));
    } else {
      allMaterials = petMaterials.filter(m => selectedIds.has(m.id));
    }
    onConfirm(allMaterials);
    onCancel();
  };

  const getFullUrl = (url?: string) => {
    if (!url) return '';
    // If it's already a full URL (starts with http), use it directly
    if (url.startsWith('http')) return url;
    // Otherwise, it's a relative path from backend upload - add backend prefix
    return `${backendUrl}${url}`;
  };

  const getCoverUrl = (mat: LibraryMaterial) => {
    return mat.type === 'image'
      ? getFullUrl(mat.metadata.imageUrl)
      : getFullUrl(mat.metadata.coverUrl);
  };

  // 单独的卡片组件处理加载错误状态（Hook 不能在循环内使用）
  const MaterialCard = ({ material }: { material: LibraryMaterial }) => {
    const [hasError, setHasError] = useState(false);
    const coverUrl = getCoverUrl(material);

    return (
      <Card
        key={material.id}
        hoverable
        className={`${styles.card} ${selectedIds.has(material.id) ? styles.selected : ''}`}
        onClick={() => toggleSelect(material)}
      >
        <div className={styles.imageWrapper}>
          {!hasError && coverUrl && (
            <img
              src={coverUrl}
              alt={material.name}
              onError={() => setHasError(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          {hasError && material.type === 'video' && (
            // 图片加载失败 → 说明 coverUrl 是视频文件，用 video 标签显示第一帧
            <video
              src={coverUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              muted
              preload="metadata"
            />
          )}
          {(hasError && material.type !== 'video') || !coverUrl && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                color: '#999',
              }}
            >
              无封面
            </div>
          )}
          {(coverUrl || (hasError && material.type === 'video')) && (
            <div className={styles.previewButton} onClick={(e) => {
              e.stopPropagation();
              // 预览时：图片直接打开，视频打开视频文件
              const previewUrl = material.type === 'image'
                ? getCoverUrl(material)
                : (material.metadata.videoUrl || material.metadata.coverUrl);
              window.open(getFullUrl(previewUrl), '_blank');
            }}>
              <EyeOutlined />
            </div>
          )}
        </div>
        <div className={styles.name}>{material.name}</div>
      </Card>
    );
  };

  const currentMaterials = activeTab === 'library'
    ? libraryMaterials
    : activeTab === 'products'
      ? productMaterials
      : petMaterials;

  return (
    <Modal
      title="选择素材"
      open={open}
      onCancel={onCancel}
      width={800}
      style={{ maxHeight: '70vh' }}
      bodyStyle={{ maxHeight: 'calc(70vh - 108px)', overflowY: 'auto' }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>已选择: {selectedIds.size} / 5</span>
          <div>
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={handleConfirm} disabled={selectedIds.size === 0}>
              确认
            </Button>
          </div>
        </div>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as TabKey)}
        style={{ marginBottom: 16 }}
        items={[
          { key: 'library', label: '素材库' },
          { key: 'products', label: '当前产物' },
          { key: 'pets', label: '宠物头像' },
        ]}
      />

      {activeTab === 'library' && (
        <div style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="选择分类"
            style={{ width: 200 }}
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            options={[
              { label: '全部', value: null },
              ...categories.map(c => ({ label: c.name, value: c.id })),
            ]}
          />
        </div>
      )}

      <Spin spinning={loading}>
        {currentMaterials.length === 0 ? (
          <Empty description="暂无素材" />
        ) : (
          <div className={styles.grid}>
            {currentMaterials.map(mat => (
              <MaterialCard key={mat.id} material={mat} />
            ))}
          </div>
        )}
      </Spin>
    </Modal>
  );
};
