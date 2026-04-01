import React from 'react';
import { Collapse, Typography, Tag } from 'antd';
import { TodoView } from './TodoView';
import styles from './ToolCallView.module.css';
import type { TodoItem } from '../../../types';

const { Text } = Typography;

interface ToolCallViewProps {
  toolName: string;
  result?: any;
}

export const ToolCallView: React.FC<ToolCallViewProps> = ({ toolName, result }) => {
  // Special handling for todo_write - render beautiful todo list
  if (toolName === 'todo_write') {
    let parsedResult: any = result;
    // If result is a JSON string, parse it first
    if (typeof result === 'string') {
      try {
        parsedResult = JSON.parse(result);
      } catch (e) {
        // If parsing fails, fall through to default rendering
      }
    }
    if (parsedResult && Array.isArray(parsedResult.todos)) {
      return <TodoView todos={parsedResult.todos as TodoItem[]} />;
    }
  }

  // Default rendering for other tools
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Tag color="blue">工具调用</Tag>
          <Text strong>{toolName}</Text>
        </div>
      </div>
      <Collapse ghost size="small">
        {result !== undefined && (
          <Collapse.Panel header="结果" key="result">
            <pre className={styles.pre}>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
          </Collapse.Panel>
        )}
      </Collapse>
    </div>
  );
};
