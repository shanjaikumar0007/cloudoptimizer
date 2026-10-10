import { DashboardStats, Resource, ResourceFormData } from '../types';

const API_BASE = 'https://cloudoptimizer-api.onrender.com/api';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Unable to connect to the backend. Please check your internet connection and try again.'
    );
  }

  const responseText = await response.text();

  let result: any = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = responseText;
    }
  }

  if (!response.ok) {
    const message =
      typeof result === 'object' && result?.detail
        ? result.detail
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return result as T;
}

export function computeLocalClassification(
  cpu: number,
  mem: number,
  storage: number,
  net: number
) {
  const avg = (cpu + mem + storage + net) / 4;

  if (avg < 15) return 'Idle' as const;
  if (avg < 40) return 'Underutilized' as const;
  if (avg < 80) return 'Active' as const;

  return 'High Utilization' as const;
}

export function computeLocalRecommendation(res: Resource) {
  const status = computeLocalClassification(
    res.cpu_utilization,
    res.memory_utilization,
    res.storage_utilization,
    res.network_utilization
  );

  const monthlyCost = Number((res.hourly_cost * 730).toFixed(2));

  const avg = Number(
    (
      (res.cpu_utilization +
        res.memory_utilization +
        res.storage_utilization +
        res.network_utilization) /
      4
    ).toFixed(1)
  );

  if (status === 'Idle') {
    return {
      action: 'STOP_RESOURCE' as const,
      status: 'Idle' as const,
      reason: `Average utilization is critically low at ${avg}% (Idle threshold < 15%). Immediate decommission or stop suggested.`,
      savings: monthlyCost,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  }

  if (status === 'Underutilized') {
    const savings = Number((monthlyCost * 0.4).toFixed(2));

    return {
      action: 'CONSIDER_RESIZE' as const,
      status: 'Underutilized' as const,
      reason: `Resource average utilization is ${avg}%, consistently below 40%. Downsize instance type to save ~40% cost.`,
      savings,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  }

  if (status === 'High Utilization') {
    return {
      action: 'KEEP_RESOURCE' as const,
      status: 'High Utilization' as const,
      reason: `High utilization at ${avg}%. Resource is heavily loaded. Consider scaling horizontally or adding alerting.`,
      savings: 0,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  }

  return {
    action: 'KEEP_RESOURCE' as const,
    status: 'Active' as const,
    reason: `Resource operating within healthy boundaries (${avg}% avg utilization). No action required.`,
    savings: 0,
    monthly_cost: monthlyCost,
    avg_utilization: avg,
  };
}

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiRequest<DashboardStats>('/dashboard');
  },

  async getResources(): Promise<Resource[]> {
    return apiRequest<Resource[]>('/resources');
  },

  async createResource(data: ResourceFormData): Promise<Resource> {
    return apiRequest<Resource>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateResource(
    resourceId: string,
    updates: Partial<ResourceFormData>
  ): Promise<Resource> {
    return apiRequest<Resource>(
      `/resources/${encodeURIComponent(resourceId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
  },

  async deleteResource(
    resourceId: string
  ): Promise<{ message: string; resource_id: string }> {
    return apiRequest<{ message: string; resource_id: string }>(
      `/resources/${encodeURIComponent(resourceId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  async simulateWorkload(
    resourceId: string,
    targetState: 'spike' | 'idle' | 'nominal' | 'underutilized'
  ): Promise<Resource> {
    return apiRequest<Resource>(
      `/resources/${encodeURIComponent(resourceId)}/simulate`,
      {
        method: 'POST',
        body: JSON.stringify({ targetState }),
      }
    );
  },

  async reseedFleet(): Promise<{ message: string; count: number }> {
    return apiRequest<{ message: string; count: number }>('/seed', {
      method: 'POST',
    });
  },

  async testClassification(
    cpu: number,
    mem: number,
    storage: number,
    net: number
  ) {
    return apiRequest('/test/classify', {
      method: 'POST',
      body: JSON.stringify({
        cpu,
        memory: mem,
        storage,
        network: net,
      }),
    });
  },
};