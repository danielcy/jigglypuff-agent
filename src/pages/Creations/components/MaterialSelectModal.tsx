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
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { LibraryMaterial, MaterialCategory } from '../../../types';
import { materialApi, materialCategoryApi } from '../../../services/api';
import styles from './MaterialSelectModal.module.css';

const { useBreakpoint } = Grid;

interface MaterialSelectModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (selected: LibraryMaterial[]) => void;
  existingSelected: LibraryMaterial[];
}

export const MaterialSelectModal: React.FC<MaterialSelectModalProps> = ({
  open,
  onCancel,
  onConfirm,
  existingSelected,
}) => {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(existingSelected.map(m => m.id))
  );
  const [loading, setLoading] = useState(false);
  const { } = useBreakpoint();

  useEffect(() => {
    if (open) {
      loadCategories();
      loadMaterials();
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

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await materialApi.getAll(selectedCategoryId || undefined);
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [selectedCategoryId]);

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
    const selected = materials.filter(m => selectedIds.has(m.id));
    onConfirm(selected);
    onCancel();
  };

  const getCoverUrl = (mat: LibraryMaterial) => {
    return mat.type === 'image'
      ? mat.metadata.imageUrl!
      : mat.metadata.coverUrl!;
  };


  return (
    <Modal
      title="选择素材"
      open={open}
      onCancel={onCancel}
      width={800}
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

      <Spin spinning={loading}>
        {materials.length === 0 ? (
          <Empty description="暂无素材" />
        ) : (
          <div className={styles.grid}>
            {materials.map(mat => (
              <Card
                key={mat.id}
                hoverable
                className={`${styles.card} ${selectedIds.has(mat.id) ? styles.selected : ''}`}
                onClick={() => toggleSelect(mat)}
              >
                <div className={styles.imageWrapper}>
                  <img src={getCoverUrl(mat)} alt={mat.name} />
                  <div className={styles.previewButton} onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 打开预览
                    window.open(getCoverUrl(mat), '_blank');
                  }}>
                    <EyeOutlined />
                  </div>
                </div>
                <div className={styles.name}>{mat.name}</div>
              </Card>
            ))}
          </div>
        )}
      </Spin>
    </Modal>
  );
};
