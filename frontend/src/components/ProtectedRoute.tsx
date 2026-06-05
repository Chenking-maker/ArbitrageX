import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';

/**
 * 受保护路由组件
 * 需要登录才能访问，未登录时重定向到登录页
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在验证登录状态，显示加载屏幕
  if (isLoading) {
    return <LoadingScreen message="正在验证登录状态..." />;
  }

  // 如果未登录，重定向到登录页，并记住当前路径
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录，渲染子路由
  return <Outlet />;
}

/**
 * 公开路由组件
 * 已登录用户不能访问，会自动重定向到首页
 */
export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // 如果正在验证登录状态，显示加载屏幕
  if (isLoading) {
    return <LoadingScreen message="正在检查登录状态..." />;
  }

  // 如果已登录，重定向到首页
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 未登录，渲染子路由
  return <Outlet />;
}
