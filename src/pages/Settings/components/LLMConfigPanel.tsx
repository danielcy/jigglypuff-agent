import { useState } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
  Tag,
  Empty,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { LLMConfig, LLMProvider } from '../../../types';
import { llmConfigApi } from '../../../services/api';

const providerDefaultBaseUrls: Record<LLMProvider, string> = {
  openai: '',
  siliconflow: 'https://api.siliconflow.cn/v1',
  volcengine: 'https://ark.cn-beijing.volces.com/api/v3',
  volcengineCoding: 'https://ark.cn-beijing.volces.com/api/coding/v3',
};

const providerOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: '硅基流动', value: 'siliconflow' },
  { label: '火山引擎', value: 'volcengine' },
  { label: '火山引擎Coding', value: 'volcengineCoding' },
];

const providerColors: Record<LLMProvider, string> = {
  openai: 'blue',
  siliconflow: 'green',
  volcengine: 'orange',
  volcengineCoding: 'purple',
};

interface LLMConfigPanelProps {
  llmConfigs: LLMConfig[];
  loading: boolean;
  onRefresh: () => void;
}

export default function LLMConfigPanel({ llmConfigs, loading, onRefresh }: LLMConfigPanelProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [form] = Form.useForm();

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    form.setFieldsValue({ isDefault: false });
    setModalVisible(true);
  };

  const handleEdit = (config: LLMConfig) => {
    setEditingConfig(config);
    form.setFieldsValue(config);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await llmConfigApi.delete(id);
      message.success('删除成功');
      onRefresh();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await llmConfigApi.setDefault(id);
      message.success('设置默认成功');
      onRefresh();
    } catch (error) {
      message.error('设置失败');
      console.error(error);
    }
  };

  const handleTest = async (config: LLMConfig) => {
    setTesting(config.id);
    try {
      const result = await llmConfigApi.testConnection({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        modelName: config.modelName,
      });
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('测试失败');
      console.error(error);
    } finally {
      setTesting(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingConfig) {
        await llmConfigApi.update(editingConfig.id, values);
        message.success('更新成功');
      } else {
        await llmConfigApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>大模型设置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加配置
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
        dataSource={llmConfigs}
        loading={loading}
        locale={{ emptyText: <Empty description="还没有添加大模型配置" /> }}
        renderItem={config => (
          <List.Item>
            <Card
              title={
                <Space>
                  {config.modelName}
                  {config.isDefault && <Tag color="green">默认</Tag>}
                </Space>
              }
              extra={
                <Tag color={providerColors[config.provider]}>
                  {providerOptions.find(o => o.value === config.provider)?.label}
                </Tag>
              }
              actions={[
                <Button
                  type="text"
                  icon={<ApiOutlined />}
                  loading={testing === config.id}
                  onClick={() => handleTest(config)}
                >
                  测试连接
                </Button>,
                !config.isDefault && (
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    onClick={() => handleSetDefault(config.id)}
                  >
                    设为默认
                  </Button>
                ),
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(config)}
                >
                  编辑
                </Button>,
                <Popconfirm
                  title="确定要删除这个配置吗？"
                  onConfirm={() => handleDelete(config.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ].filter(Boolean)}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <strong>API 地址:</strong>
                  <div style={{ wordBreak: 'break-all' }}>{config.baseUrl}</div>
                </div>
                <div>
                  <strong>API Key:</strong> {maskApiKey(config.apiKey)}
                </div>
                <div>
                  <strong>最大输出Token:</strong> {config.maxTokens ?? 32000}
                </div>
              </Space>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingConfig ? '编辑配置' : '添加配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingConfig ? '保存' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="provider"
            label="服务商"
            rules={[{ required: true, message: '请选择服务商' }]}
          >
            <Select placeholder="请选择服务商">
              {providerOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.provider !== curr.provider}
          >
            {({ getFieldValue, setFieldsValue }) => {
              const provider = getFieldValue('provider') as LLMProvider;
              const isDisabled = provider === 'siliconflow' || provider === 'volcengine';
              if (provider && providerDefaultBaseUrls[provider]) {
                setFieldsValue({ baseUrl: providerDefaultBaseUrls[provider] });
              } else if (!provider) {
                setFieldsValue({ baseUrl: '' });
              }
              return (
                <Form.Item
                  name="baseUrl"
                  label="API 地址"
                  rules={[{ required: true, message: '请输入 API 地址' }]}
                >
                  <Input
                    placeholder="https://api.openai.com/v1"
                    disabled={isDisabled}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="请输入 API Key" />
          </Form.Item>

          <Form.Item
            name="modelName"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="gpt-4o" />
          </Form.Item>

          <Form.Item
            name="maxTokens"
            label="最大输出Token"
            initialValue={32000}
            rules={[{ required: true, message: '请输入最大输出Token数' }]}
          >
            <Input type="number" placeholder="32000" />
          </Form.Item>

          <Form.Item
            name="isDefault"
            label="默认配置"
            valuePropName="checked"
          >
            <Switch disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
