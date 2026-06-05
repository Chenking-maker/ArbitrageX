import client from './client';
import type { FundingRate } from '../types';

export async function getFundingRates(): Promise<FundingRate[]> {
  const res = await client.get<FundingRate[]>('/funding/rates');
  return res.data;
}
