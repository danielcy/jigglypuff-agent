import React from 'react';
import {
  List,
  Button,
  Typography,
  Popconfirm,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { Creation } from '../../../types';
import styles from './ProjectList.module.css';

const { Text } = Typography;

interface ProjectListProps {
  creations: Array<Pick<Creation, 'id' | 'title' | 'status' | 'currentStage' | 'createdAt' | 'updatedAt'>>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  creations,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  loading,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text strong style={{ fontSize: 16 }}>创作项目</Text>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onCreate}>
          新建项目
        </Button>
      </div>
      <div className={styles.content}>
        {creations.length === 0 ? (
          <Empty description="暂无创作项目，点击上方新建项目开始" />
        ) : (
          <List
            loading={loading}
            dataSource={creations}
            renderItem={(item) => (
              <List.Item
                className={`${styles.item} ${selectedId === item.id ? styles.selected : ''}`}
                onClick={() => onSelect(item.id)}
              >
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <Text strong ellipsis style={{ maxWidth: 140 }}>
                      {item.title}
                    </Text>
                    <Popconfirm
                      title="确定删除此项目吗？"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        onDelete(item.id);
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>
                  <div className={styles.itemFooter}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};
