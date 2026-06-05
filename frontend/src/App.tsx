import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { Strategies } from './pages/Strategies';
import { Trades } from './pages/Trades';
import { Referral } from './pages/Referral';
import { Settings } from './pages/Settings';

/**
 * 应用布局包装器
 */
function AppLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

/**
 * 应用路由配置
 */
function AppRoutes() {
  return (
    <Routes>
      {/* 公开页面 - 登录/注册/OAuth回调 */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      {/* 受保护页面 - 需要登录 */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="strategies" element={<Strategies />} />
          <Route path="trades" element={<Trades />} />
          <Route path="referral" element={<Referral />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * 根应用组件
 */
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
