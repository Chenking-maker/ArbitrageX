import client from './client';
import type { Trade, DashboardStats } from '../types';

export async function getTrades(params?: {
  strategy?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ trades: Trade[]; total: number }> {
  const res = await client.get('/trades', { params });
  return res.data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await client.get<DashboardStats>('/dashboard/stats');
  return res.data;
}
