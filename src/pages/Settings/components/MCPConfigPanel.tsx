import { useState } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Tag,
  Switch,
} from 'antd';
import {
  ApiOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ExportOutlined,
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { MCPConfig, MCPPlatform, Tool } from '../../../types';
import { mcpConfigApi } from '../../../services/api';

const platformOptions = [
  { label: 'B站', value: 'bilibili', githubUrl: 'https://github.com/adoresever/bilibili-mcp' },
  { label: '小红书', value: 'xiaohongshu', githubUrl: 'https://github.com/xpzouying/xiaohongshu-mcp' },
];

const platformColors: Record<MCPPlatform, string> = {
  bilibili: 'pink',
  xiaohongshu: 'red',
};

const platformGithubUrls: Record<MCPPlatform, string> = {
  bilibili: 'https://github.com/adoresever/bilibili-mcp',
  xiaohongshu: 'https://github.com/xpzouying/xiaohongshu-mcp',
};

interface MCPConfigPanelProps {
  mcpConfigs: MCPConfig[];
  onRefresh: () => void;
}

export default function MCPConfigPanel({ mcpConfigs, onRefresh }: MCPConfigPanelProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testServerUrl, setTestServerUrl] = useState('');
  const [currentPlatform, setCurrentPlatform] = useState<MCPPlatform | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolParams, setToolParams] = useState<string>('{}');
  const [callLoading, setCallLoading] = useState(false);
  const [callResult, setCallResult] = useState<string>('');
  const [loginStatusLoading, setLoginStatusLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<{ loggedIn: boolean; message: string } | null>(null);
  const [form] = Form.useForm();

  const getMcpConfigByPlatform = (platform: MCPPlatform): Partial<MCPConfig> => {
    return mcpConfigs.find(c => c.platform === platform) || {
      serverUrl: '',
      enabled: true,
    };
  };

  const isJsonWithImage = (result: string): boolean => {
    try {
      const data = JSON.parse(result);
      return checkForImageData(data);
    } catch {
      return false;
    }
  };

  const checkForImageData = (data: any): boolean => {
    if (Array.isArray(data)) {
      return data.some(item => checkForImageData(item));
    }
    if (typeof data === 'object' && data !== null) {
      if (data.type === 'image' && typeof data.data === 'string') {
        return true;
      }
      return Object.values(data).some(value => checkForImageData(value));
    }
    return false;
  };

  const extractImages = (result: string): string[] => {
    const images: string[] = [];
    try {
      const data = JSON.parse(result);
      collectImageData(data, images);
    } catch {}
    return images;
  };

  const collectImageData = (data: any, images: string[]): void => {
    if (Array.isArray(data)) {
      data.forEach(item => collectImageData(item, images));
    } else if (typeof data === 'object' && data !== null) {
      if (data.type === 'image' && typeof data.data === 'string') {
        images.push(data.data);
      }
      Object.values(data).forEach(value => collectImageData(value, images));
    }
  };

  const formatJsonForDisplay = (jsonStr: string): string => {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      try {
        const unescaped = jsonStr.replace(/\\\\(.)/g, '$1');
        const parsed = JSON.parse(unescaped);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return jsonStr.replace(/\\\\(.)/g, '$1');
      }
    }
  };

  const handleSave = async (platform: MCPPlatform) => {
    setSaving(platform);
    try {
      const values = form.getFieldValue(platform);
      const existingConfig = mcpConfigs.find(c => c.platform === platform);

      if (existingConfig) {
        await mcpConfigApi.update(existingConfig.id, values);
        message.success('保存成功');
      } else {
        await mcpConfigApi.create({
          ...values,
          platform,
          deployType: 'manual',
          enabled: values.enabled ?? true,
        });
        message.success('保存成功');
      }
      onRefresh();
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    } finally {
      setSaving(null);
    }
  };

  const handleStart = async (id: string) => {
    try {
      const result = await mcpConfigApi.startServer(id);
      if (result.success) {
        message.success(result.message);
        onRefresh();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('启动失败');
      console.error(error);
    }
  };

  const handleStop = async (id: string) => {
    try {
      const result = await mcpConfigApi.stopServer(id);
      if (result.success) {
        message.success(result.message);
        onRefresh();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('停止失败');
      console.error(error);
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await mcpConfigApi.toggleEnabled(id, enabled);
      message.success(enabled ? '已启用' : '已禁用');
      onRefresh();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  const openTestModal = async (platform: MCPPlatform) => {
    const values = form.getFieldValue(platform);
    const serverUrl = values.serverUrl;
    if (!serverUrl) {
      message.error('请先填写服务地址');
      return;
    }
    setCurrentPlatform(platform);
    setTestServerUrl(serverUrl);
    setTools([]);
    setSelectedTool(null);
    setToolParams('{}');
    setCallResult('');
    setLoginStatus(null);
    setTestModalVisible(true);
    await loadTools(serverUrl);
    await checkLoginStatus(platform, serverUrl);
  };

  const loadTools = async (serverUrl: string) => {
    setToolsLoading(true);
    try {
      const response = await mcpConfigApi.listTools(serverUrl);
      if (response.success) {
        setTools(response.tools);
      } else {
        message.error(response.message || '获取工具列表失败');
      }
    } catch (error) {
      message.error('获取工具列表失败');
      console.error(error);
    } finally {
      setToolsLoading(false);
    }
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    const defaultParams: Record<string, any> = {};
    if (tool.inputSchema && tool.inputSchema.properties) {
      Object.keys(tool.inputSchema.properties).forEach(key => {
        defaultParams[key] = '';
      });
    }
    setToolParams(JSON.stringify(defaultParams, null, 2));
    setCallResult('');
  };

  const handleCallTool = async () => {
    if (!selectedTool) return;
    setCallLoading(true);
    setCallResult('');
    try {
      let params: Record<string, any>;
      try {
        params = JSON.parse(toolParams);
      } catch (e) {
        message.error('JSON 格式错误，请检查参数');
        return;
      }
      const response = await mcpConfigApi.callTool(testServerUrl, selectedTool.name, params);
      if (response.success) {
        setCallResult(JSON.stringify(response.result, null, 2));
        message.success('工具调用成功');
      } else {
        setCallResult(JSON.stringify(response, null, 2));
        message.error(response.message || '工具调用失败');
      }
    } catch (error) {
      message.error('工具调用失败');
      console.error(error);
      setCallResult(String(error));
    } finally {
      setCallLoading(false);
    }
  };

  const checkLoginStatus = async (platform: MCPPlatform, serverUrl: string) => {
    if (platform !== 'xiaohongshu') {
      setLoginStatus(null);
      return;
    }

    setLoginStatusLoading(true);
    setLoginStatus(null);

    try {
      const response = await mcpConfigApi.callTool(serverUrl, 'check_login_status', {});
      if (response.success) {
        const resultStr = JSON.stringify(response.result, null, 2);
        setCallResult(resultStr);

        const isLoggedIn = !resultStr.includes('未登录');
        setLoginStatus({
          loggedIn: isLoggedIn,
          message: isLoggedIn ? '✅ 已登录' : '❌ 未登录',
        });
      } else {
        setLoginStatus({
          loggedIn: false,
          message: `检查失败: ${response.message}`,
        });
      }
    } catch (error) {
      console.error(error);
      setLoginStatus({
        loggedIn: false,
        message: `检查失败: ${(error as Error).message}`,
      });
    } finally {
      setLoginStatusLoading(false);
    }
  };

  const manuallyGetQRCode = () => {
    const tool = tools.find(t => t.name === 'get_login_qrcode');
    if (tool) {
      handleToolSelect(tool);
      setTimeout(async () => {
        await handleCallTool();
      }, 500);
    }
  };

  const refreshLoginStatus = async () => {
    if (currentPlatform && testServerUrl) {
      await checkLoginStatus(currentPlatform, testServerUrl);
    }
  };

  const closeTestModal = () => {
    setTestModalVisible(false);
    setTestServerUrl('');
    setCurrentPlatform(null);
    setTools([]);
    setSelectedTool(null);
    setToolParams('{}');
    setCallResult('');
    setLoginStatus(null);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>MCP 配置</h2>
        <p style={{ color: '#666' }}>配置各平台的 MCP 服务地址，用于获取平台数据</p>
      </div>

      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
          {(['bilibili', 'xiaohongshu'] as const).map(platform => {
            const config = getMcpConfigByPlatform(platform);
            const platformLabel = platformOptions.find(o => o.value === platform)?.label;
            const platformColor = platformColors[platform];
            const existingConfig = mcpConfigs.find(c => c.platform === platform);

            return (
              <Card
                key={platform}
                title={
                  <Space>
                    {platformLabel}
                    <a href={platformGithubUrls[platform]} target="_blank" rel="noopener noreferrer">
                      <ExportOutlined style={{ fontSize: 14, color: '#1890ff' }} />
                    </a>
                    {existingConfig && (existingConfig.enabled ? <Tag color="green">已启用</Tag> : <Tag color="gray">已禁用</Tag>)}
                  </Space>
                }
                extra={<Tag color={platformColor}>{platformLabel}</Tag>}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                actions={[
                  <Button
                    type="text"
                    icon={<ApiOutlined />}
                    loading={saving === platform}
                    onClick={() => openTestModal(platform)}
                  >
                    测试连接
                  </Button>,
                  existingConfig && existingConfig.enabled ? (
                    <Button
                      type="text"
                      icon={<PauseCircleOutlined />}
                      onClick={() => handleStop(existingConfig.id)}
                    >
                      停止
                    </Button>
                  ) : existingConfig ? (
                    <Button
                      type="text"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleStart(existingConfig.id)}
                    >
                      启动
                    </Button>
                  ) : null,
                  <Button
                    type="text"
                    loading={saving === platform}
                    onClick={() => handleSave(platform)}
                  >
                    保存
                  </Button>,
                ].filter(Boolean)}
              >
                <div style={{ flex: 1 }}>
                  <Form.Item
                    name={[platform, 'serverUrl']}
                    label="服务地址"
                    rules={[{ required: true, message: '请输入服务地址' }]}
                    initialValue={config.serverUrl}
                  >
                    <Input placeholder="http://localhost:8001" />
                  </Form.Item>

                  {existingConfig && (
                    <Form.Item
                      name={[platform, 'enabled']}
                      label="启用"
                      valuePropName="checked"
                      initialValue={config.enabled}
                    >
                      <Switch onChange={(checked) => handleToggleEnabled(existingConfig.id, checked)} />
                    </Form.Item>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Form>

      <Modal
        title={`MCP 测试 - ${testServerUrl}`}
        open={testModalVisible}
        onCancel={closeTestModal}
        footer={null}
        width={900}
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        styles={{ body: { maxHeight: 'calc(100vh - 280px)', overflow: 'auto', paddingBottom: 0 } }}
      >
        <div style={{ display: 'flex', gap: 16, height: '100%', minHeight: 0, paddingBottom: loginStatus || loginStatusLoading ? 60 : 0 }}>
          <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>工具列表 ({tools.length}):</strong>
            </div>
            <List
              loading={toolsLoading}
              dataSource={tools}
              locale={{ emptyText: '暂无工具' }}
              renderItem={tool => (
                <List.Item
                  onClick={() => handleToolSelect(tool)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedTool?.name === tool.name ? '#f0f5ff' : 'transparent',
                    padding: '8px 12px',
                  }}
                >
                  <div>
                    <div><strong>{tool.name}</strong></div>
                    {tool.description && <div style={{ color: '#666', fontSize: 12 }}>{tool.description}</div>}
                  </div>
                </List.Item>
              )}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedTool ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: 0 }}>调用工具: {selectedTool.name}</h4>
                  {selectedTool.description && (
                    <p style={{ color: '#666', margin: '8px 0 0 0' }}>{selectedTool.description}</p>
                  )}
                  {selectedTool.inputSchema && selectedTool.inputSchema.properties && (
                    <div style={{ marginTop: 12 }}>
                      <strong>参数说明:</strong>
                      <ul style={{ paddingLeft: 20, margin: '8px 0 0 0' }}>
                        {Object.entries(selectedTool.inputSchema.properties).map(([key, schema]) => (
                          <li key={key}>
                            <code>{key}</code>: {schema.description || schema.type}
                            {selectedTool.inputSchema.required?.includes(key) && <strong style={{ color: 'red' }}> (必填)</strong>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Form.Item label="参数 (JSON)">
                  <Input.TextArea
                    value={toolParams}
                    onChange={(e) => setToolParams(e.target.value)}
                    rows={8}
                    placeholder="{}"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    onClick={handleCallTool}
                    loading={callLoading}
                    block
                  >
                    调用工具
                  </Button>
                </Form.Item>

                {callResult && (
                  <>
                    <Form.Item label="调用结果">
                      <div style={{
                        position: 'relative',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        backgroundColor: '#f6f8fa',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          padding: '4px 8px',
                          borderBottom: '1px solid #d9d9d9',
                          backgroundColor: '#fafbfc',
                        }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(callResult);
                              message.success('已复制到剪贴板');
                            }}
                          >
                            复制
                          </Button>
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: 12,
                          overflow: 'auto',
                          maxHeight: isJsonWithImage(callResult) ? 200 : 300,
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}>
                          <code>{formatJsonForDisplay(callResult)}</code>
                        </pre>
                      </div>
                    </Form.Item>
                    {extractImages(callResult).map((base64, index) => (
                      <Form.Item key={index} label={`图片 ${index + 1}`}>
                        <img
                          src={`data:image/png;base64,${base64}`}
                          alt="MCP Result Image"
                          style={{ maxWidth: '100%', maxHeight: 400, border: '1px solid #f0f0f0', borderRadius: 4 }}
                        />
                      </Form.Item>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                请从左侧选择一个工具
              </div>
            )}
          </div>
        </div>

        {currentPlatform === 'xiaohongshu' && (
          <div style={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            marginTop: 16,
            padding: '12px 16px',
            backgroundColor: loginStatus?.loggedIn ? '#f6ffed' : '#fff2f0',
            borderTop: '1px solid #e8e8e8',
            borderRadius: '4px 4px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
               {loginStatusLoading ? (
                 <span style={{ color: '#1890ff' }}>正在检查登录状态...</span>
               ) : loginStatus ? (
                 <>
                   <span style={{ fontWeight: 500, color: loginStatus.loggedIn ? '#52c41a' : '#ff4d4f' }}>
                     {loginStatus.message}
                   </span>
                   {!loginStatus.loggedIn && tools.find(t => t.name === 'get_login_qrcode') && (
                     <span style={{ marginLeft: 12 }}>
                       <a
                         href="#"
                         onClick={(e) => {
                           e.preventDefault();
                           manuallyGetQRCode();
                         }}
                       >
                         点击获取登录二维码
                       </a>
                     </span>
                   )}
                 </>
               ) : null}
             </div>
             <Button
               icon={<ReloadOutlined />}
               size="small"
               onClick={refreshLoginStatus}
               loading={loginStatusLoading}
             >
               刷新状态
             </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
