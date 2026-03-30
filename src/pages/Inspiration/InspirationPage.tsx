import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Form,
  message,
  Tag,
  Empty,
  Spin,
  Pagination,
  Modal,
  Progress,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { TrendingVideo, Resource, ResourceStatus } from '../../types';
import { trendingVideoApi, resourceApi } from '../../services/api';

const platformOptions = [
  { label: 'B站', value: 'bilibili' },
  { label: '小红书', value: 'xiaohongshu'},
];

const STORAGE_KEY = 'jigglypuff_last_search_result';

interface SavedSearchState {
  videos: TrendingVideo[];
  pagination: { current: number; pageSize: number; total: number };
  formValues: { keyword: string; platforms: string[] };
}

const InspirationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<TrendingVideo | null>(null);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [form] = Form.useForm();

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const startPolling = useCallback(() => {
    stopPolling();
    pollingIntervalRef.current = setInterval(async () => {
      if (!currentVideo) return;
      try {
        const resource = await resourceApi.getStatus(currentVideo.platform, currentVideo.id);
        setCurrentResource(resource);
        if (resource.status === 'done' || resource.status === 'error') {
          stopPolling();
          setResourceLoading(false);
        }
      } catch (error) {
        console.error('Polling failed, will retry next interval:', error);
      }
    }, 3000);
  }, [currentVideo]);

  const openDetailModal = async (video: TrendingVideo) => {
    setCurrentVideo(video);
    setModalVisible(true);
    setResourceLoading(true);
    
    try {
      const resource = await resourceApi.getOrCreate({
        platform: video.platform,
        itemId: video.id,
        originalUrl: video.originalUrl || '',
      });
      setCurrentResource(resource);
      
      if (resource.status === 'empty' || resource.status === 'downloading') {
        startPolling();
      } else {
        setResourceLoading(false);
      }
    } catch (error) {
      message.error('获取资源信息失败');
      console.error(error);
      setResourceLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentVideo(null);
    setCurrentResource(null);
    stopPolling();
    setResourceLoading(false);
  };

  const handleRetry = async () => {
    if (!currentVideo || !currentResource) return;
    setResourceLoading(true);
    try {
      const resource = await resourceApi.retry(currentVideo.platform, currentVideo.id);
      setCurrentResource(resource);
      startPolling();
      message.success('已重新开始下载');
    } catch (error) {
      message.error('重试失败');
      console.error(error);
      setResourceLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: SavedSearchState = JSON.parse(saved);
        setVideos(data.videos);
        setPagination(data.pagination);
        form.setFieldsValue(data.formValues);
      } catch (e) {
        console.error('Failed to restore saved search state', e);
      }
    }
  }, [form]);

  const saveToStorage = (videos: TrendingVideo[], pagination: { current: number; pageSize: number; total: number }, formValues: any) => {
    const data: SavedSearchState = { videos, pagination, formValues };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getProxiedImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('/') || url.includes(window.location.hostname)) {
      return url;
    }
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    return `${backendUrl}/api/proxy/image?url=${encodeURIComponent(url)}`;
  };

  const handleSearch = async (values: any, page?: number) => {
    setLoading(true);
    try {
      const { keyword, platforms } = values;
      const result = await trendingVideoApi.searchV2({
        keyword,
        platforms: platforms || [],
      });
      setVideos(result);
      const newPagination = {
        current: page || 1,
        pageSize: 12,
        total: result.length,
      };
      setPagination(newPagination);
      saveToStorage(result, newPagination, values);
      message.success(`获取成功，共 ${result.length} 个结果`);
    } catch (error) {
      message.error('搜索失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onTableChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
    }));
  };

  const currentVideos = videos.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card title="爆款搜索" style={{ flexShrink: 0 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={values => handleSearch(values, 1)}
          initialValues={{
            keyword: '',
            platforms: [],
          }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            rowGap: '16px',
          }}
        >
          <Form.Item name="keyword" rules={[{ required: true, message: '请输入搜索关键词' }]}>
            <Input
              placeholder="输入搜索关键词"
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
            />
          </Form.Item>

          <Form.Item name="platforms">
            <Select
              mode="multiple"
              placeholder="选择平台"
              options={platformOptions}
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<ReloadOutlined />} loading={loading}>
              搜索
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <div style={{ marginTop: 16, flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <Spin spinning={loading} description="搜索中...">
          {videos.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}>
                {currentVideos.map(video => (
                  <div key={video.id}>
                    <Card
                      hoverable
                      cover={
                        <div style={{ display: 'block', width: '100%', cursor: 'pointer' }} onClick={() => openDetailModal(video)}>
                          <img alt={video.title} src={getProxiedImageUrl(video.coverUrl)} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'inherit' }} />
                        </div>
                      }
                      actions={[
                        <Button type="text" icon={<EyeOutlined />} onClick={() => openDetailModal(video)}>查看详情</Button>,
                      ]}
                      onClick={() => openDetailModal(video)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Meta
                        title={
                          <span style={{ cursor: 'pointer' }} onClick={() => openDetailModal(video)}>
                            {video.title}
                          </span>
                        }
                        description={
                          <div>
                            <div>
                              <Tag color={video.platform === 'bilibili' ? 'blue' : 'red'}>
                                {platformOptions.find(p => p.value === video.platform)?.label}
                              </Tag>
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <strong>作者:</strong> {video.author}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <strong>播放量:</strong> {video.views} | <strong>点赞:</strong> {video.likes}
                              {video.collects !== undefined && (
                                <> | <strong>收藏:</strong> {video.collects}</>
                              )}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, textAlign: 'right', paddingBottom: 8 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={onTableChange}
                />
              </div>
            </>
          ) : (
            <Empty description="暂无数据，试试搜索其他关键词吧" />
          )}
        </Spin>
      </div>

      <Modal
        title={currentVideo?.title || '视频详情'}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={640}
        destroyOnClose
        style={{ maxHeight: '80vh' }}
        bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflowY: 'auto' }}
      >
        {currentResource && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p><strong>平台：</strong> {platformOptions.find(p => p.value === currentVideo?.platform)?.label}</p>
              <p><strong>作者：</strong> {currentVideo?.author}</p>
              {currentVideo?.description && <p><strong>描述：</strong> {currentVideo.description}</p>}
            </div>

            {currentResource.status === 'downloading' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin spinning={resourceLoading} tip="下载中..." />
                <div style={{ marginTop: 16 }}>
                  <Progress percent={100} status="active" />
                </div>
                <p style={{ marginTop: 16, color: '#999' }}>视频正在下载中，请稍候...</p>
              </div>
            )}

            {currentResource.status === 'error' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: '#ff4d4f', marginBottom: 16 }}>下载失败</p>
                {currentResource.error && (
                  <p style={{ color: '#999', fontSize: 12, marginBottom: 16, maxHeight: 200, overflow: 'auto' }}>
                    {currentResource.error}
                  </p>
                )}
                <Button type="primary" onClick={handleRetry} loading={resourceLoading}>
                  重新下载
                </Button>
              </div>
            )}

            {currentResource.status === 'done' && currentResource.url && (
              <div style={{ maxHeight: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <video
                  src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}${currentResource.url}`}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 8 }}
                />
              </div>
            )}

            {currentResource.status === 'empty' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin spinning={resourceLoading} tip="准备下载..." />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InspirationPage;
