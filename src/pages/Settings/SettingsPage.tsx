import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import type { LLMConfig, MCPConfig } from '../../types';
import { llmConfigApi, mcpConfigApi } from '../../services/api';
import LLMConfigPanel from './components/LLMConfigPanel';
import MCPConfigPanel from './components/MCPConfigPanel';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('llm');
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([]);
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);

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

  useEffect(() => {
    loadLLMConfigs();
    loadMCPConfigs();
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
      </Tabs>
    </div>
  );
};

export default SettingsPage;
