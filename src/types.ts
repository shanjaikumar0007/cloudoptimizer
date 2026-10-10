export type ResourceStatus = 'Idle' | 'Underutilized' | 'Active' | 'High Utilization';
export type RecommendationAction = 'STOP_RESOURCE' | 'CONSIDER_RESIZE' | 'KEEP_RESOURCE';

export interface Recommendation {
  action: RecommendationAction;
  status: ResourceStatus;
  reason: string;
  savings: number;
  monthly_cost: number;
  avg_utilization?: number;
}

export interface Resource {
  id: number;
  resource_id: string;
  name: string;
  type: string;
  provider: 'AWS' | 'Azure' | 'GCP' | string;
  region: string;
  cpu_utilization: number;
  memory_utilization: number;
  storage_utilization: number;
  network_utilization: number;
  hourly_cost: number;
  updated_at?: string;
  recommendation?: Recommendation;
}

export interface DashboardStats {
  total_resources: number;
  idle_resources: number;
  underutilized_resources: number;
  active_resources: number;
  high_utilization_resources: number;
  estimated_monthly_cost: number;
  potential_savings: number;
}

export interface ResourceFormData {
  resource_id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  cpu_utilization: number;
  memory_utilization: number;
  storage_utilization: number;
  network_utilization: number;
  hourly_cost: number;
}
