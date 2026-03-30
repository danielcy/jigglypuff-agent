import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import MainLayout from './components/Layout/MainLayout';
import PetsPage from './pages/Pets/PetsPage';
import InspirationPage from './pages/Inspiration/InspirationPage';
import HotTopicsPage from './pages/HotTopics/HotTopicsPage';
import MaterialsPage from './pages/Materials/MaterialsPage';
import CreationsPage from './pages/Creations/CreationsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import { initDatabase } from './database/db';
import './App.css';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        message.error('数据库初始化失败');
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" tip="初始化中..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/pets" replace />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/inspiration" element={<InspirationPage />} />
          <Route path="/hot-topics" element={<HotTopicsPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/creations" element={<CreationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;
