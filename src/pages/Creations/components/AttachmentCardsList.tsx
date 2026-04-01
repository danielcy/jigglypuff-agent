import React from 'react';
import { Card } from 'antd';
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
  if (materials.length === 0) return null;

  const getCoverUrl = (mat: any) => {
    return mat.coverUrl || mat.url;
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {materials.map((mat) => (
        <Card
          key={mat.id}
          size="small"
          className={styles.card}
          hoverable
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
  );
};
