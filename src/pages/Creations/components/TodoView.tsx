import React from 'react';
import { Collapse, Typography, Tag, Spin } from 'antd';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import styles from './TodoView.module.css';
import type { TodoItem } from '../../../types';

const { Text } = Typography;

interface TodoViewProps {
  todos: TodoItem[];
}

export const TodoView: React.FC<TodoViewProps> = ({ todos }) => {
  const completedCount = todos.filter(t => t.status === 'completed').length;
  const totalCount = todos.length;

  const getStatusIcon = (status: TodoItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className={styles.iconCompleted}>
            <CheckOutlined />
          </span>
        );
      case 'in_progress':
        return (
          <span className={styles.iconInProgress}>
            <Spin indicator={<LoadingOutlined spin />} size="small" />
          </span>
        );
      default:
        return <span className={styles.iconPending} />;
    }
  };

  const header = (
    <div className={styles.header}>
      <Tag color="purple">计划进度</Tag>
      <Text strong className={styles.progress}>
        {completedCount}/{totalCount} 已完成
      </Text>
    </div>
  );

  return (
    <Collapse
      className={styles.collapse}
      defaultActiveKey={['1']}
      ghost
      size="small"
    >
      <Collapse.Panel key="1" header={header}>
        <div className={styles.list}>
          {todos.map(todo => (
            <div key={todo.id} className={styles.todoItem}>
              {getStatusIcon(todo.status)}
              <Text
                className={todo.status === 'completed' ? styles.contentCompleted : styles.content}
              >
                {todo.content}
              </Text>
            </div>
          ))}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
};
