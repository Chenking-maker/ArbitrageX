import client from './client';
import type {
  ReferralStats,
  CommissionRecord,
  ReferralRanking,
} from '../types';

export async function getReferralStats(): Promise<ReferralStats> {
  const res = await client.get<ReferralStats>('/referral/stats');
  return res.data;
}

export async function getCommissionRecords(): Promise<CommissionRecord[]> {
  const res = await client.get<CommissionRecord[]>('/referral/commissions');
  return res.data;
}

export async function getReferralRanking(): Promise<ReferralRanking[]> {
  const res = await client.get<ReferralRanking[]>('/referral/ranking');
  return res.data;
}

export async function withdrawCommission(amount: number): Promise<void> {
  await client.post('/referral/withdraw', { amount });
}
