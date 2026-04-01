import React, { useState } from 'react';
import { Card, Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import styles from './AttachmentCardsList.module.css';

interface AttachmentCardsListProps {
  materials: Array<{
    id: number;
    name: string;
    url: string;
    type: 'image' | 'video';
    coverUrl?: string;
  }>;
  onRemove?: (id: number) => void;
  className?: string;
}

export const AttachmentCardsList: React.FC<AttachmentCardsListProps> = ({
  materials,
  onRemove,
  className,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<any>(null);

  if (materials.length === 0) return null;

  const getCoverUrl = (mat: any) => {
    // coverUrl might be at top level (from SelectedMaterialsBar) or in metadata (from saved chat history)
    return mat.coverUrl || (mat.metadata && mat.metadata.coverUrl) || mat.url;
  };

  const getContentUrl = (mat: any) => {
    // content url is: top level url (converted base64 or direct url)
    return mat.url || (mat.metadata && mat.metadata.videoUrl) || (mat.metadata && mat.metadata.imageUrl);
  };

  const openPreview = (mat: any) => {
    if (onRemove) {
      // in edit mode, don't preview on card click (remove button handles remove)
      return;
    }
    setPreviewMaterial(mat);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewMaterial(null);
  };

  return (
    <>
      <div className={`${styles.container} ${className || ''}`}>
        {materials.map((mat) => (
          <Card
            key={mat.id}
            size="small"
            className={styles.card}
            hoverable
            onClick={() => openPreview(mat)}
          >
            <div className={styles.imageWrapper}>
              <img src={getCoverUrl(mat)} alt={mat.name} />
              {onRemove && (
                <div
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(mat.id);
                  }}
                >
                  <CloseOutlined />
                </div>
              )}
            </div>
            <div className={styles.name}>{mat.name}</div>
          </Card>
        ))}
      </div>

      <Modal
        title={previewMaterial?.name}
        open={previewOpen}
        onCancel={closePreview}
        footer={null}
        width={previewMaterial?.type === 'video' ? 800 : 600}
        destroyOnClose
      >
        {previewMaterial && (
          previewMaterial.type === 'image' ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src={getContentUrl(previewMaterial)}
                alt={previewMaterial.name}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <video
                src={getContentUrl(previewMaterial)}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            </div>
          )
        )}
      </Modal>
    </>
  );
};
