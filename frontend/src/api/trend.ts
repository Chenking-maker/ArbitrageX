import client from './client';
import type { ProfitDataPoint } from '../types';

export async function getProfitHistory(days: number = 7): Promise<ProfitDataPoint[]> {
  const res = await client.get<ProfitDataPoint[]>('/trend/profit', { params: { days } });
  return res.data;
}
