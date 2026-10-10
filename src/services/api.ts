import { DashboardStats, Resource, ResourceFormData } from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

// Fallback initial benchmark data in case of offline / edge state
const FALLBACK_SEEDS: Resource[] = [
  {
    id: 1,
    resource_id: 'vm-001',
    name: 'Prod-Web-Server',
    type: 'VM',
    provider: 'AWS',
    region: 'us-east-1',
    cpu_utilization: 72.0,
    memory_utilization: 68.0,
    storage_utilization: 55.0,
    network_utilization: 64.0,
    hourly_cost: 0.12,
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    resource_id: 'vm-002',
    name: 'Dev-Test-DB',
    type: 'VM',
    provider: 'Azure',
    region: 'west-us',
    cpu_utilization: 8.0,
    memory_utilization: 12.0,
    storage_utilization: 10.0,
    network_utilization: 5.0,
    hourly_cost: 0.08,
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    resource_id: 'vm-003',
    name: 'Staging-API-Worker',
    type: 'VM',
    provider: 'AWS',
    region: 'us-west-2',
    cpu_utilization: 28.0,
    memory_utilization: 34.0,
    storage_utilization: 22.0,
    network_utilization: 18.0,
    hourly_cost: 0.24,
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    resource_id: 'vm-004',
    name: 'BigData-Node',
    type: 'VM',
    provider: 'GCP',
    region: 'europe-west1',
    cpu_utilization: 86.0,
    memory_utilization: 82.0,
    storage_utilization: 70.0,
    network_utilization: 78.0,
    hourly_cost: 0.45,
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    resource_id: 'vm-005',
    name: 'Analytics-Batch-Runner',
    type: 'VM',
    provider: 'GCP',
    region: 'us-central1',
    cpu_utilization: 6.0,
    memory_utilization: 14.0,
    storage_utilization: 8.0,
    network_utilization: 4.0,
    hourly_cost: 0.32,
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    resource_id: 'vm-006',
    name: 'Cache-Redis-Cluster',
    type: 'Cache',
    provider: 'AWS',
    region: 'eu-central-1',
    cpu_utilization: 32.0,
    memory_utilization: 38.0,
    storage_utilization: 15.0,
    network_utilization: 25.0,
    hourly_cost: 0.18,
    updated_at: new Date().toISOString(),
  },
];

export function computeLocalClassification(cpu: number, mem: number, storage: number, net: number) {
  const avg = (cpu + mem + storage + net) / 4.0;
  if (avg < 15.0) return 'Idle' as const;
  if (avg < 40.0) return 'Underutilized' as const;
  if (avg < 80.0) return 'Active' as const;
  return 'High Utilization' as const;
}

export function computeLocalRecommendation(res: Resource) {
  const status = computeLocalClassification(
    res.cpu_utilization,
    res.memory_utilization,
    res.storage_utilization,
    res.network_utilization
  );
  const monthlyCost = Number((res.hourly_cost * 730.0).toFixed(2));
  const avg = Number(
    ((res.cpu_utilization + res.memory_utilization + res.storage_utilization + res.network_utilization) / 4.0).toFixed(1)
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
  } else if (status === 'Underutilized') {
    const savings = Number((monthlyCost * 0.4).toFixed(2));
    return {
      action: 'CONSIDER_RESIZE' as const,
      status: 'Underutilized' as const,
      reason: `Resource average utilization is ${avg}%, consistently below 40%. Downsize instance type to save ~40% cost.`,
      savings: savings,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  } else if (status === 'High Utilization') {
    return {
      action: 'KEEP_RESOURCE' as const,
      status: 'High Utilization' as const,
      reason: `High utilization at ${avg}%. Resource is heavily loaded. Consider scaling horizontally or adding alerting.`,
      savings: 0.0,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  } else {
    return {
      action: 'KEEP_RESOURCE' as const,
      status: 'Active' as const,
      reason: `Resource operating within healthy boundaries (${avg}% avg utilization). No action required.`,
      savings: 0.0,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  }
}

function getLocalFleet(): Resource[] {
  try {
    const raw = localStorage.getItem('cloud_optimizer_fleet');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return FALLBACK_SEEDS.map((r) => ({ ...r, recommendation: computeLocalRecommendation(r) }));
}

function setLocalFleet(fleet: Resource[]) {
  try {
    localStorage.setItem('cloud_optimizer_fleet', JSON.stringify(fleet));
  } catch (e) {
    // ignore
  }
}

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // fallback to local calculation
    }
    const fleet = getLocalFleet();
    const totalCost = fleet.reduce((acc, r) => acc + r.hourly_cost * 730.0, 0);
    const classifications = fleet.map((r) =>
      computeLocalClassification(r.cpu_utilization, r.memory_utilization, r.storage_utilization, r.network_utilization)
    );
    const potentialSavings = fleet.reduce((acc, r) => acc + computeLocalRecommendation(r).savings, 0);

    return {
      total_resources: fleet.length,
      idle_resources: classifications.filter((c) => c === 'Idle').length,
      underutilized_resources: classifications.filter((c) => c === 'Underutilized').length,
      active_resources: classifications.filter((c) => c === 'Active').length,
      high_utilization_resources: classifications.filter((c) => c === 'High Utilization').length,
      estimated_monthly_cost: Number(totalCost.toFixed(2)),
      potential_savings: Number(potentialSavings.toFixed(2)),
    };
  },

  async getResources(): Promise<Resource[]> {
    try {
      const res = await fetch(`${API_BASE}/resources`);
      if (res.ok) {
        const data = await res.json();
        setLocalFleet(data);
        return data;
      }
    } catch (e) {
      // fallback
    }
    return getLocalFleet();
  },

  async createResource(data: ResourceFormData): Promise<Resource> {
    try {
      const res = await fetch(`${API_BASE}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create resource');
    } catch (e: any) {
      if (e.message && e.message.includes('already exists')) {
        throw e;
      }
      // Offline fallback
      const fleet = getLocalFleet();
      if (fleet.some((r) => r.resource_id === data.resource_id)) {
        throw new Error(`Resource ID '${data.resource_id}' already exists`);
      }
      const newRes: Resource = {
        id: Date.now(),
        ...data,
        updated_at: new Date().toISOString(),
      };
      newRes.recommendation = computeLocalRecommendation(newRes);
      const updatedFleet = [...fleet, newRes];
      setLocalFleet(updatedFleet);
      return newRes;
    }
  },

  async updateResource(resourceId: string, updates: Partial<ResourceFormData>): Promise<Resource> {
    try {
      const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // fallback
    }
    const fleet = getLocalFleet();
    const index = fleet.findIndex((r) => r.resource_id === resourceId);
    if (index === -1) throw new Error(`Resource '${resourceId}' not found`);
    const updated = {
      ...fleet[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    updated.recommendation = computeLocalRecommendation(updated);
    fleet[index] = updated;
    setLocalFleet(fleet);
    return updated;
  },

  async deleteResource(resourceId: string): Promise<{ message: string; resource_id: string }> {
    try {
      const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const fleet = getLocalFleet().filter((r) => r.resource_id !== resourceId);
        setLocalFleet(fleet);
        return await res.json();
      }
    } catch (e) {
      // fallback
    }
    const fleet = getLocalFleet().filter((r) => r.resource_id !== resourceId);
    setLocalFleet(fleet);
    return { message: `Resource '${resourceId}' deleted successfully`, resource_id: resourceId };
  },

  async simulateWorkload(
    resourceId: string,
    targetState: 'spike' | 'idle' | 'nominal' | 'underutilized'
  ): Promise<Resource> {
    try {
      const res = await fetch(`${API_BASE}/resources/${resourceId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // fallback
    }
    const fleet = getLocalFleet();
    const index = fleet.findIndex((r) => r.resource_id === resourceId);
    if (index === -1) throw new Error(`Resource '${resourceId}' not found`);

    let cpu = 60;
    let mem = 55;
    let storage = 50;
    let net = 52;
    if (targetState === 'spike') {
      cpu = 92;
      mem = 88;
      storage = 82;
      net = 85;
    } else if (targetState === 'idle') {
      cpu = 7;
      mem = 10;
      storage = 9;
      net = 5;
    } else if (targetState === 'underutilized') {
      cpu = 25;
      mem = 30;
      storage = 20;
      net = 25;
    }

    const updated: Resource = {
      ...fleet[index],
      cpu_utilization: cpu,
      memory_utilization: mem,
      storage_utilization: storage,
      network_utilization: net,
      updated_at: new Date().toISOString(),
    };
    updated.recommendation = computeLocalRecommendation(updated);
    fleet[index] = updated;
    setLocalFleet(fleet);
    return updated;
  },

  async reseedFleet(): Promise<{ message: string; count: number }> {
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const fresh = FALLBACK_SEEDS.map((r) => ({ ...r, recommendation: computeLocalRecommendation(r) }));
        setLocalFleet(fresh);
        return data;
      }
    } catch (e) {
      // fallback
    }
    const fresh = FALLBACK_SEEDS.map((r) => ({ ...r, recommendation: computeLocalRecommendation(r) }));
    setLocalFleet(fresh);
    return { message: 'Fleet reseeded to default benchmark workloads', count: fresh.length };
  },

  async testClassification(cpu: number, mem: number, storage: number, net: number) {
    try {
      const res = await fetch(`${API_BASE}/test/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpu, memory: mem, storage, network: net }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // fallback
    }
    const cls = computeLocalClassification(cpu, mem, storage, net);
    return {
      cpu,
      memory: mem,
      storage,
      network: net,
      average: ((cpu + mem + storage + net) / 4.0).toFixed(1),
      classification: cls,
    };
  },
};
