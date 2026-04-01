import React, { useEffect, useState } from 'react';
import { Tabs, Table, Switch, Button, Space, message, Spin } from 'antd';
import type { LLMConfig, MCPConfig, CreationTool } from '../../types';
import { llmConfigApi, mcpConfigApi, creationToolApi } from '../../services/api';
import LLMConfigPanel from './components/LLMConfigPanel';
import MCPConfigPanel from './components/MCPConfigPanel';
import { SyncOutlined } from '@ant-design/icons';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('llm');
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([]);
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [creationTools, setCreationTools] = useState<CreationTool[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);

  const loadLLMConfigs = async () => {
    setLlmLoading(true);
    try {
      const data = await llmConfigApi.getAll();
      setLlmConfigs(data);
    } catch (error) {
      console.error('加载大模型配置列表失败', error);
    } finally {
      setLlmLoading(false);
    }
  };

  const loadMCPConfigs = async () => {
    try {
      const data = await mcpConfigApi.getAll();
      setMcpConfigs(data);
    } catch (error) {
      console.error('加载MCP配置列表失败', error);
    }
  };

  const loadCreationTools = async () => {
    setToolsLoading(true);
    try {
      const response = await creationToolApi.list();
      setCreationTools(response);
    } catch (error) {
      console.error('加载创作工具配置失败', error);
    } finally {
      setToolsLoading(false);
    }
  };

  const handleToolEnabledChange = async (tool: CreationTool, enabled: boolean) => {
    try {
      await creationToolApi.update(tool.id, { enabled });
      message.success('更新成功');
      loadCreationTools();
    } catch (error) {
      message.error('更新失败');
    }
  };

  useEffect(() => {
    loadLLMConfigs();
    loadMCPConfigs();
    loadCreationTools();
  }, []);

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="大模型配置" key="llm">
          <LLMConfigPanel
            llmConfigs={llmConfigs}
            loading={llmLoading}
            onRefresh={loadLLMConfigs}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="MCP 配置" key="mcp">
          <MCPConfigPanel
            mcpConfigs={mcpConfigs}
            onRefresh={loadMCPConfigs}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="创作工具配置" key="creation-tools">
          <div style={{ marginTop: 16 }}>
            <Space style={{ marginBottom: 16 }}>
              <Button icon={<SyncOutlined />} onClick={loadCreationTools} loading={toolsLoading}>
                刷新
              </Button>
            </Space>
            <Spin spinning={toolsLoading}>
              <Table
                dataSource={creationTools}
                rowKey="id"
                pagination={false}
              >
                <Table.Column
                  title="工具名称"
                  dataIndex="toolName"
                  width={150}
                />
                <Table.Column
                  title="启用"
                  dataIndex="enabled"
                  width={100}
                  render={(enabled: boolean, record: CreationTool) => (
                    <Switch
                      checked={enabled}
                      onChange={(checked) => handleToolEnabledChange(record, checked)}
                    />
                  )}
                />
                <Table.Column
                  title="创建时间"
                  dataIndex="createdAt"
                  width={180}
                  render={(date: Date) => date.toLocaleString()}
                />
                <Table.Column
                  title="更新时间"
                  dataIndex="updatedAt"
                  width={180}
                  render={(date: Date) => date.toLocaleString()}
                />
              </Table>
            </Spin>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
