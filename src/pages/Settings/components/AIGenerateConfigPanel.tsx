import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, message, Space } from 'antd';
import { SyncOutlined, SaveOutlined } from '@ant-design/icons';
import { creationToolApi } from '../../../services/api';
import type { CreationTool } from '../../../types';

// Predefined models
const IMAGE_MODELS = [
  { label: 'doubao-seedream-5-0-260128', value: 'doubao-seedream-5-0-260128' },
];

const VIDEO_MODELS = [
  { label: 'doubao-seedance-1-5-pro-251215', value: 'doubao-seedance-1-5-pro-251215' },
];

interface AIGenerateConfigPanelProps {
  onRefresh: () => void;
}

export const AIGenerateConfigPanel: React.FC<AIGenerateConfigPanelProps> = ({ onRefresh }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<CreationTool[]>([]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await creationToolApi.list();
      const imageTool = data.find(t => t.toolName === 'generate_image');
      const videoTool = data.find(t => t.toolName === 'generate_video');
      setTools(data);

      // Set form values
      const values: any = {};
      if (imageTool?.config) {
        values.imageModel = imageTool.config.model;
        values.imageApiKey = imageTool.config.apiKey;
      } else {
        values.imageModel = IMAGE_MODELS[0].value;
      }
      if (videoTool?.config) {
        values.videoModel = videoTool.config.model;
        values.videoApiKey = videoTool.config.apiKey;
      } else {
        values.videoModel = VIDEO_MODELS[0].value;
      }
      form.setFieldsValue(values);
    } catch (error) {
      console.error('加载AI生成配置失败', error);
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const saveConfigs = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      // Find image tool
      const imageTool = tools.find(t => t.toolName === 'generate_image');
      if (imageTool) {
        await creationToolApi.update(imageTool.id, {
          enabled: !!values.imageApiKey,
          config: {
            model: values.imageModel,
            apiKey: values.imageApiKey,
          },
        });
      }

      // Find video tool
      const videoTool = tools.find(t => t.toolName === 'generate_video');
      if (videoTool) {
        await creationToolApi.update(videoTool.id, {
          enabled: !!values.videoApiKey,
          config: {
            model: values.videoModel,
            apiKey: values.videoApiKey,
          },
        });
      }

      message.success('保存成功');
      loadConfigs();
      onRefresh();
    } catch (error) {
      console.error('保存AI生成配置失败', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<SyncOutlined />} onClick={loadConfigs} loading={loading}>
          刷新
        </Button>
      </Space>

      <Form
        form={form}
        layout="vertical"
        disabled={loading}
      >
        <Card title="图像生成 (Seedream)" style={{ marginBottom: 16 }}>
          <Form.Item
            name="imageModel"
            label="模型"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select options={IMAGE_MODELS} />
          </Form.Item>

          <Form.Item
            name="imageApiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="输入 Volcengine API Key" />
          </Form.Item>
        </Card>

        <Card title="视频生成 (Seedance)" style={{ marginBottom: 16 }}>
          <Form.Item
            name="videoModel"
            label="模型"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select options={VIDEO_MODELS} />
          </Form.Item>

          <Form.Item
            name="videoApiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="输入 Volcengine API Key" />
          </Form.Item>
        </Card>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={saveConfigs}
          loading={loading}
        >
          保存配置
        </Button>
      </Form>
    </div>
  );
};

export default AIGenerateConfigPanel;
