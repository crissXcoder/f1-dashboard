import { getData } from '@/shared/config/fetcher';
import type { GetMetricsResponse } from '@/shared/types/dto';

export async function getMetrics(): Promise<GetMetricsResponse> {
    return getData<GetMetricsResponse>('/metrics');
}
