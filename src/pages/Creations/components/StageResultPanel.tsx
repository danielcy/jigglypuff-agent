import React from 'react';
import { Card, Tag, Typography } from 'antd';
import type { Creation } from '../../../types';
import styles from './StageResultPanel.module.css';

const { Text } = Typography;

interface StageResultPanelProps {
  creation: Creation;
}

const stageLabels: Record<NonNullable<Creation['currentStage']>, string> = {
  idle: '未开始',
  analysis: '爆款分析',
  scripting: '脚本创作',
  shotting: '分镜设计',
  done: '已完成',
};

export const StageResultPanel: React.FC<StageResultPanelProps> = ({ creation }) => {
  return (
    <div className={styles.container}>
      <Card size="small" title="创作状态" className={styles.card}>
        <div className={styles.row}>
          <Text type="secondary">当前阶段：</Text>
          <Tag color="blue">{stageLabels[creation.currentStage]}</Tag>
        </div>
        <div className={styles.row}>
          <Text type="secondary">状态：</Text>
          <Tag color={creation.status === 'completed' ? 'green' : creation.status === 'in_progress' ? 'blue' : 'default'}>
            {creation.status === 'draft' ? '草稿' : creation.status === 'in_progress' ? '进行中' : '已完成'}
          </Tag>
        </div>
        {creation.analysisResult && (
          <div className={styles.row}>
            <Text type="secondary">✅ 爆款分析已完成</Text>
          </div>
        )}
        {creation.script && (
          <div className={styles.row}>
            <Text type="secondary">✅ 脚本已完成 ({creation.script.scenes.length} 个场景)</Text>
          </div>
        )}
        {creation.shots && (
          <div className={styles.row}>
            <Text type="secondary">✅ 分镜已完成 ({creation.shots.shots.length} 个分镜)</Text>
          </div>
        )}
      </Card>
    </div>
  );
};
