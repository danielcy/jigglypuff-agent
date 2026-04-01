import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  SearchOutlined,
  InboxOutlined,
  EditOutlined,
  SettingOutlined,
  FireOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      key: '/pets',
      icon: <UserOutlined />,
      label: '宠物管理',
    },
    {
      key: '/inspiration',
      icon: <SearchOutlined />,
      label: '爆款搜索',
    },
    {
      key: '/hot-topics',
      icon: <FireOutlined />,
      label: '大家都在拍',
    },
    {
      key: '/materials',
      icon: <InboxOutlined />,
      label: '素材库',
    },
    {
      key: '/creations',
      icon: <EditOutlined />,
      label: '创作中心',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'center',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff0f6',
          }}
        >
          {collapsed ? (
            <Avatar
              size={32}
              style={{ backgroundColor: '#ffadd2', color: '#fff' }}
            >
              胖
            </Avatar>
          ) : (
            <Title
              level={4}
              style={{
                margin: 0,
                color: '#eb2f96',
                fontSize: 18,
              }}
            >
              JigglyPuff
            </Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ border: 'none' }}
          items={menuItems.map(item => ({
            ...item,
            key: item.key,
            label: <Link to={item.key}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div></div>
          <div>
            <Avatar style={{ backgroundColor: '#ffadd2' }} icon={<UserOutlined />} />
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
