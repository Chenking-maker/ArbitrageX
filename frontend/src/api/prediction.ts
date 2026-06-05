import client from './client';
import type { ArbitrageOpportunity } from '../types';

export async function getArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  const res = await client.get<ArbitrageOpportunity[]>('/prediction/arbitrage');
  return res.data;
}

export async function executeArbitrage(id: string): Promise<void> {
  await client.post(`/prediction/arbitrage/${id}/execute`);
}
