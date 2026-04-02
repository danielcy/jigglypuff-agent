import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Typography,
  Tag,
  Descriptions,
  Space,
  Alert,
  Image,
  Row,
  Col,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { Creation, HotVideoAnalysis, Script, ShotList, CreationProduct } from '../../../types';
import styles from './ProjectDetail.module.css';

const { TextArea } = Input;
const { Text } = Typography;

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const getFullUrl = (url?: string) => {
  if (!url) return '';
  // If it's already a full URL (starts with http), use it directly
  if (url.startsWith('http')) return url;
  // Otherwise, it's a relative path from backend - add backend prefix
  return `${backendUrl}${url}`;
};

interface ProjectDetailProps {
  creation: Creation;
  onUpdate: (updates: Partial<Creation>) => Promise<void>;
  loading: boolean;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  creation,
  onUpdate,
  loading,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<'analysis' | 'script' | 'shots' | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    form.setFieldsValue({
      title: creation.title,
      content: creation.content || '',
    });
  }, [creation.id, form, creation]);

  const handleStartEdit = (type: 'analysis' | 'script' | 'shots') => {
    let data = null;
    if (type === 'analysis') data = creation.analysisResult;
    if (type === 'script') data = creation.script;
    if (type === 'shots') data = creation.shots;
    setEditValue(JSON.stringify(data, null, 2));
    setEditing(type);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      const parsed = JSON.parse(editValue);
      const updates: Partial<Creation> = {};
      if (editing === 'analysis') updates.analysisResult = parsed;
      if (editing === 'script') updates.script = parsed;
      if (editing === 'shots') updates.shots = parsed;
      await onUpdate(updates);
      setEditing(null);
      setEditValue('');
    } catch (error) {
      alert('JSON 格式错误，请检查后重试：' + (error as Error).message);
    }
  };

  const handleSave = async () => {
    const values = form.getFieldsValue();
    setSaving(true);
    try {
      await onUpdate({
        title: values.title,
        content: values.content,
      });
    } finally {
      setSaving(false);
    }
  };

  const [editingAnalysisField, setEditingAnalysisField] = useState<{path: string[], field: string} | null>(null);

  // 小巧的编辑图标样式
  const editIconStyle = {
    color: '#1890ff',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '16px',
  };

  const handleAnalysisFieldEdit = (
    _analysis: HotVideoAnalysis,
    path: 'hotReasons' | 'copyAdvice',
    field: string,
    currentValue: string
  ) => {
    setEditingAnalysisField({path: [path], field});
    setEditValue(currentValue);
  };

  const handleAnalysisFieldSave = () => {
    if (!editingAnalysisField || !creation.analysisResult) return;
    try {
      const updatedAnalysis = {...creation.analysisResult};
      const path = editingAnalysisField.path[0];
      (updatedAnalysis[path as keyof HotVideoAnalysis] as any)[editingAnalysisField.field] = editValue;
      if (editingAnalysisField.field === 'tags') {
        (updatedAnalysis[path as keyof HotVideoAnalysis] as any)[editingAnalysisField.field] = editValue.split(',').map(t => t.trim()).filter(t => t);
      }
      const updatedAnalysisData: HotVideoAnalysis = {
        ...updatedAnalysis,
        revisedAt: new Date(),
      };
      onUpdate({ analysisResult: updatedAnalysisData });
      setEditingAnalysisField(null);
      setEditValue('');
    } catch (error) {
      alert('保存失败：' + (error as Error).message);
    }
  };

  const handleAnalysisFieldCancel = () => {
    setEditingAnalysisField(null);
    setEditValue('');
  };

  const renderAnalysis = (analysis: HotVideoAnalysis) => {
    if (editing === 'analysis') {
      return (
        <div className={styles.content}>
          <Alert
            message="编辑 JSON"
            description="直接修改 JSON 数据，保存后生效"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <TextArea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={30}
            placeholder="{"
          />
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" onClick={handleSaveEdit} loading={saving}>
                保存
              </Button>
              <Button onClick={handleCancelEdit}>
                取消
              </Button>
            </Space>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.content}>
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <Button size="small" onClick={() => handleStartEdit('analysis')}>
            编辑 JSON（高级）
          </Button>
        </div>
        <Descriptions title="视频信息" column={1} size="small">
          <Descriptions.Item label="视频标题">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span>{analysis.title}</span>
              <EditOutlined
                style={editIconStyle}
                onClick={() => {
                  handleAnalysisFieldEdit(analysis, 'hotReasons' as any, 'title', analysis.title);
                }}
              />
            </div>
          </Descriptions.Item>
        </Descriptions>

        <Text strong>热门原因</Text>
        <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
          <Descriptions.Item label="内容">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ flex: 1 }}>{analysis.hotReasons.content}</span>
              <EditOutlined
                style={editIconStyle}
                onClick={() => handleAnalysisFieldEdit(analysis, 'hotReasons', 'content', analysis.hotReasons.content)}
              />
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="风格">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ flex: 1 }}>{analysis.hotReasons.style}</span>
              <EditOutlined
                style={editIconStyle}
                onClick={() => handleAnalysisFieldEdit(analysis, 'hotReasons', 'style', analysis.hotReasons.style)}
              />
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="结构">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ flex: 1 }}>{analysis.hotReasons.structure}</span>
              <EditOutlined
                style={editIconStyle}
                onClick={() => handleAnalysisFieldEdit(analysis, 'hotReasons', 'structure', analysis.hotReasons.structure)}
              />
            </div>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 12 }}>
          <Text strong>标签</Text>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
              <Space size={[4, 4]} wrap>
                {analysis.hotReasons.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
              <EditOutlined
                style={editIconStyle}
                onClick={() => handleAnalysisFieldEdit(analysis, 'hotReasons', 'tags', analysis.hotReasons.tags.join(', '))}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Text strong>复刻建议</Text>
          <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="核心概念">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ flex: 1 }}>{analysis.copyAdvice.concept}</span>
                <EditOutlined
                  style={editIconStyle}
                  onClick={() => handleAnalysisFieldEdit(analysis, 'copyAdvice', 'concept', analysis.copyAdvice.concept)}
                />
              </div>
            </Descriptions.Item>
          </Descriptions>
          {analysis.copyAdvice.adjustments.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{flex: 1}}>
                  <Text type="secondary">调整建议：</Text>
                  <ul>
                    {analysis.copyAdvice.adjustments.map((adj, i) => (
                      <li key={i}>{adj}</li>
                    ))}
                  </ul>
                </div>
                <EditOutlined
                  style={editIconStyle}
                  onClick={() => handleAnalysisFieldEdit(analysis, 'copyAdvice', 'adjustments', analysis.copyAdvice.adjustments.join('\n'))}
                />
              </div>
            </div>
          )}
          {analysis.copyAdvice.keyPoints.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{flex: 1}}>
                  <Text type="secondary">关键点：</Text>
                  <ul>
                    {analysis.copyAdvice.keyPoints.map((kp, i) => (
                      <li key={i}>{kp}</li>
                    ))}
                  </ul>
                </div>
                <EditOutlined
                  style={editIconStyle}
                  onClick={() => handleAnalysisFieldEdit(analysis, 'copyAdvice', 'keyPoints', analysis.copyAdvice.keyPoints.join('\n'))}
                />
              </div>
            </div>
          )}
          {editingAnalysisField && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <TextArea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={4}
                placeholder="输入新值"
              />
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Space>
                  <Button size="small" type="primary" onClick={handleAnalysisFieldSave} loading={saving}>
                    保存
                  </Button>
                  <Button size="small" onClick={handleAnalysisFieldCancel}>
                    取消
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const [editingScriptField, setEditingScriptField] = useState<{sceneIndex: number, field: string} | null>(null);

  const handleScriptFieldEdit = (sceneIndex: number, field: string, currentValue: string) => {
    setEditingScriptField({sceneIndex, field});
    setEditValue(currentValue);
  };

  const handleScriptFieldSave = () => {
    if (!editingScriptField || !creation.script) return;
    try {
      const updatedScenes = [...creation.script.scenes];
      (updatedScenes[editingScriptField.sceneIndex] as any)[editingScriptField.field] = editValue;
      if (editingScriptField.field === 'duration') {
        (updatedScenes[editingScriptField.sceneIndex] as any)[editingScriptField.field] = parseFloat(editValue);
      }
      const updatedScriptData: Script = {
        ...creation.script,
        scenes: updatedScenes,
        revisedAt: new Date(),
      };
      onUpdate({ script: updatedScriptData });
      setEditingScriptField(null);
      setEditValue('');
    } catch (error) {
      alert('保存失败：' + (error as Error).message);
    }
  };

  const handleScriptFieldCancel = () => {
    setEditingScriptField(null);
    setEditValue('');
  };

  const renderScript = (script: Script) => {
    if (editing === 'script') {
      return (
        <div className={styles.content}>
          <Alert
            message="编辑 JSON"
            description="直接修改 JSON 数据，保存后生效"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <TextArea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={30}
            placeholder="{"
          />
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" onClick={handleSaveEdit} loading={saving}>
                保存
              </Button>
              <Button onClick={handleCancelEdit}>
                取消
              </Button>
            </Space>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.content}>
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <Button size="small" onClick={() => handleStartEdit('script')}>
            编辑 JSON（高级）
          </Button>
        </div>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="标题">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span>{script.title}</span>
              <EditOutlined
                style={editIconStyle}
                onClick={() => handleScriptFieldEdit(-1, 'title', script.title)}
              />
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="描述">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ flex: 1 }}>{script.description}</span>
              <EditOutlined
                style={editIconStyle}
                onClick={() => handleScriptFieldEdit(-1, 'description', script.description)}
              />
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="总时长">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{script.totalDuration} 秒</span>
              <EditOutlined
                style={editIconStyle}
                onClick={() => handleScriptFieldEdit(-1, 'totalDuration', String(script.totalDuration))}
              />
            </div>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <Text strong>场景列表</Text>
          {script.scenes.map((scene, index) => (
            <Card
              key={scene.id}
              size="small"
              title={`场景 ${scene.sceneNo}: ${scene.title}`}
              style={{ marginTop: 8 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="时长">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{scene.duration} 秒</span>
                    <EditOutlined
                      style={editIconStyle}
                      onClick={() => handleScriptFieldEdit(index, 'duration', String(scene.duration))}
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="标题">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ flex: 1 }}>{scene.title}</span>
                    <EditOutlined
                      style={editIconStyle}
                      onClick={() => handleScriptFieldEdit(index, 'title', scene.title)}
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="内容">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ flex: 1 }}>{scene.description}</span>
                    <EditOutlined
                      style={editIconStyle}
                      onClick={() => handleScriptFieldEdit(index, 'description', scene.description)}
                    />
                  </div>
                </Descriptions.Item>
                {scene.dialogue && (
                  <Descriptions.Item label="台词/旁白">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ flex: 1 }}>{scene.dialogue}</span>
                      <EditOutlined
                        style={editIconStyle}
                        onClick={() => handleScriptFieldEdit(index, 'dialogue', (scene.dialogue || ''))}
                      />
                    </div>
                  </Descriptions.Item>
                )}
                {scene.bgmSuggestion && (
                  <Descriptions.Item label="BGM 建议">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ flex: 1 }}>{scene.bgmSuggestion}</span>
                      <EditOutlined
                        style={editIconStyle}
                        onClick={() => handleScriptFieldEdit(index, 'bgmSuggestion', (scene.bgmSuggestion || ''))}
                      />
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
              {editingScriptField && editingScriptField.sceneIndex === index && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <TextArea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                    placeholder="输入新值"
                  />
                  <div style={{ marginTop: 8, textAlign: 'right' }}>
                    <Space>
                      <Button size="small" type="primary" onClick={handleScriptFieldSave} loading={saving}>
                        保存
                      </Button>
                      <Button size="small" onClick={handleScriptFieldCancel}>
                        取消
                      </Button>
                    </Space>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {script.tags.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>标签</Text>
            <div style={{ marginTop: 8 }}>
              <Space size={[4, 4]} wrap>
                {script.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </div>
    );
  };

  const [editingShot, setEditingShot] = useState<{shotIndex: number, field: string} | null>(null);

  const handleShotFieldEdit = (shotIndex: number, field: string, currentValue: string) => {
    setEditingShot({shotIndex, field});
    setEditValue(currentValue);
  };

  const handleShotFieldSave = () => {
    if (!editingShot || !creation.shots) return;
    try {
      const updatedShots = [...creation.shots.shots];
      (updatedShots[editingShot.shotIndex] as any)[editingShot.field] = editValue;
      if (editingShot.field === 'duration') {
        (updatedShots[editingShot.shotIndex] as any)[editingShot.field] = parseFloat(editValue);
      }
      const updatedShotsData: ShotList = {
        ...creation.shots,
        shots: updatedShots,
        revisedAt: new Date(),
      };
      onUpdate({ shots: updatedShotsData });
      setEditingShot(null);
      setEditValue('');
    } catch (error) {
      alert('保存失败：' + (error as Error).message);
    }
  };

  const handleShotFieldCancel = () => {
    setEditingShot(null);
    setEditValue('');
  };

  const renderShots = (shots: ShotList) => {
    if (editing === 'shots') {
      return (
        <div className={styles.content}>
          <Alert
            message="编辑 JSON"
            description="直接修改 JSON 数据，保存后生效"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <TextArea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={30}
            placeholder="{"
          />
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" onClick={handleSaveEdit} loading={saving}>
                保存
              </Button>
              <Button onClick={handleCancelEdit}>
                取消
              </Button>
            </Space>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.content}>
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <Button size="small" onClick={() => handleStartEdit('shots')}>
            编辑 JSON（高级）
          </Button>
        </div>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="总时长">{shots.totalDuration} 秒</Descriptions.Item>
          <Descriptions.Item label="分镜数">{shots.shots.length}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <Text strong>分镜列表</Text>
          {shots.shots.map((shot, index) => (
            <Card
              key={shot.id}
              size="small"
              title={`分镜 ${shot.shotNo}`}
              style={{ marginTop: 8 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="时长">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{shot.duration} 秒</span>
                    <EditOutlined
                      style={editIconStyle}
                      onClick={() => handleShotFieldEdit(index, 'duration', String(shot.duration))}
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="景别">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{shot.shotSize}</span>
                    <EditOutlined
                      style={editIconStyle}
                      onClick={() => handleShotFieldEdit(index, 'shotSize', shot.shotSize)}
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="运镜">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{shot.cameraMovement}</span>
                    <EditOutlined
                      style={editIconStyle}
                      onClick={() => handleShotFieldEdit(index, 'cameraMovement', shot.cameraMovement)}
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="画面描述">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ flex: 1 }}>{shot.description}</span>
                    <EditOutlined
                      style={editIconStyle}
                      onClick={() => handleShotFieldEdit(index, 'description', shot.description)}
                    />
                  </div>
                </Descriptions.Item>
                {shot.dialogue !== undefined && (
                  <Descriptions.Item label="台词/旁白">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ flex: 1 }}>{shot.dialogue}</span>
                      <EditOutlined
                        style={editIconStyle}
                        onClick={() => handleShotFieldEdit(index, 'dialogue', (shot.dialogue || ''))}
                      />
                    </div>
                  </Descriptions.Item>
                )}
                {shot.soundEffect !== undefined && (
                  <Descriptions.Item label="音效">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ flex: 1 }}>{shot.soundEffect}</span>
                      <EditOutlined
                        style={editIconStyle}
                        onClick={() => handleShotFieldEdit(index, 'soundEffect', (shot.soundEffect || ''))}
                      />
                    </div>
                  </Descriptions.Item>
                )}
                {shot.bgm !== undefined && (
                  <Descriptions.Item label="BGM">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ flex: 1 }}>{shot.bgm}</span>
                      <EditOutlined
                        style={editIconStyle}
                        onClick={() => handleShotFieldEdit(index, 'bgm', (shot.bgm || ''))}
                      />
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
              {editingShot && editingShot.shotIndex === index && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <TextArea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                    placeholder="输入新值"
                  />
                  <div style={{ marginTop: 8, textAlign: 'right' }}>
                    <Space>
                      <Button size="small" type="primary" onClick={handleShotFieldSave} loading={saving}>
                        保存
                      </Button>
                      <Button size="small" onClick={handleShotFieldCancel}>
                        取消
                      </Button>
                    </Space>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const tabItems: Array<{
    key: string;
    label: string;
    children: React.ReactNode;
  }> = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className={styles.content}>
          <Form form={form} layout="vertical" disabled={loading}>
            <Form.Item
              name="title"
              label="项目标题"
              rules={[{ required: true, message: '请输入项目标题' }]}
            >
              <Input placeholder="输入项目标题" />
            </Form.Item>
            <Form.Item name="content" label="备注">
              <TextArea rows={6} placeholder="添加项目备注..." />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
              >
                保存
              </Button>
            </Form.Item>
          </Form>

          <Descriptions column={1} size="small">
            <Descriptions.Item label="创建时间">
              {new Date(creation.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(creation.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
  ];

  if (creation.analysisResult) {
    tabItems.push({
      key: 'analysis',
      label: '爆款分析',
      children: renderAnalysis(creation.analysisResult),
    });
  }

  if (creation.script) {
    tabItems.push({
      key: 'script',
      label: '脚本',
      children: renderScript(creation.script),
    });
  }

  if (creation.shots) {
    tabItems.push({
      key: 'shots',
      label: '分镜',
      children: renderShots(creation.shots),
    });
  }

  const renderProducts = (products: CreationProduct[]) => {
    return (
      <div className={styles.content}>
        <Row gutter={[16, 16]}>
          {products.map((product) => (
            <Col xs={24} sm={12} md={12} lg={8} key={product.id}>
              <Card
                size="small"
                title={product.type === 'image' ? '图片' : '视频'}
                hoverable
                style={{ height: '100%' }}
              >
                {product.type === 'image' ? (
                  <Image
                    src={getFullUrl(product.url)}
                    alt={product.prompt}
                    width="100%"
                    preview={{
                      mask: '查看原图',
                    }}
                  />
                ) : (
                  <video
                    src={getFullUrl(product.url)}
                    controls
                    style={{ width: '100%', maxHeight: 200 }}
                  />
                )}
                <div style={{ marginTop: 12 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {product.prompt.length > 100
                      ? `${product.prompt.slice(0, 100)}...`
                      : product.prompt}
                  </Typography.Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(product.generatedAt).toLocaleString()}
                  </Typography.Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  if (creation.products && creation.products.length > 0) {
    tabItems.push({
      key: 'products',
      label: `产物 (${creation.products.length})`,
      children: renderProducts(creation.products),
    });
  }

  return (
    <div className={styles.container}>
      <Card
        title={`项目详情：${creation.title}`}
        className={styles.card}
      >
        <Tabs defaultActiveKey="basic" items={tabItems} />
      </Card>
    </div>
  );
};
