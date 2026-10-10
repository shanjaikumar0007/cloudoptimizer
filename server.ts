import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ResourceRecord {
  id: number;
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
  updated_at: string;
}

// Initial seed resources matching Stage 5 specification + extended fleet
const INITIAL_RESOURCES: ResourceRecord[] = [
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

let resourcesStore: ResourceRecord[] = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
let nextId = 7;

// Rule engine functions matching backend/app/services.py
function classifyResource(cpu: number, mem: number, storage: number, net: number): string {
  const avg = (cpu + mem + storage + net) / 4.0;
  if (avg < 15.0) return 'Idle';
  if (avg < 40.0) return 'Underutilized';
  if (avg < 80.0) return 'Active';
  return 'High Utilization';
}

function generateRecommendation(res: ResourceRecord) {
  const status = classifyResource(
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
      action: 'STOP_RESOURCE',
      status: 'Idle',
      reason: `Average utilization is critically low at ${avg}% (Idle threshold < 15%). Immediate decommission or stop suggested.`,
      savings: monthlyCost,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  } else if (status === 'Underutilized') {
    const savings = Number((monthlyCost * 0.4).toFixed(2));
    return {
      action: 'CONSIDER_RESIZE',
      status: 'Underutilized',
      reason: `Resource average utilization is ${avg}%, consistently below 40%. Downsize instance type to save ~40% cost.`,
      savings: savings,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  } else if (status === 'High Utilization') {
    return {
      action: 'KEEP_RESOURCE',
      status: 'High Utilization',
      reason: `High utilization at ${avg}%. Resource is heavily loaded. Consider scaling horizontally or adding alerting.`,
      savings: 0.0,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  } else {
    return {
      action: 'KEEP_RESOURCE',
      status: 'Active',
      reason: `Resource operating within healthy boundaries (${avg}% avg utilization). No action required.`,
      savings: 0.0,
      monthly_cost: monthlyCost,
      avg_utilization: avg,
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // REST API Routes
  app.get('/api/dashboard', (req: Request, res: Response) => {
    const totalCost = resourcesStore.reduce((acc, r) => acc + r.hourly_cost * 730.0, 0);
    const classifications = resourcesStore.map((r) =>
      classifyResource(r.cpu_utilization, r.memory_utilization, r.storage_utilization, r.network_utilization)
    );

    const idleCount = classifications.filter((c) => c === 'Idle').length;
    const underutilizedCount = classifications.filter((c) => c === 'Underutilized').length;
    const activeCount = classifications.filter((c) => c === 'Active').length;
    const highCount = classifications.filter((c) => c === 'High Utilization').length;

    const potentialSavings = resourcesStore.reduce(
      (acc, r) => acc + generateRecommendation(r).savings,
      0
    );

    res.json({
      total_resources: resourcesStore.length,
      idle_resources: idleCount,
      underutilized_resources: underutilizedCount,
      active_resources: activeCount,
      high_utilization_resources: highCount,
      estimated_monthly_cost: Number(totalCost.toFixed(2)),
      potential_savings: Number(potentialSavings.toFixed(2)),
    });
  });

  app.get('/api/resources', (req: Request, res: Response) => {
    const enriched = resourcesStore.map((r) => ({
      ...r,
      recommendation: generateRecommendation(r),
    }));
    res.json(enriched);
  });

  app.get('/api/resources/:id', (req: Request, res: Response) => {
    const idParam = req.params.id;
    const item = resourcesStore.find((r) => r.resource_id === idParam || String(r.id) === idParam);
    if (!item) {
      res.status(404).json({ detail: `Resource '${idParam}' not found` });
      return;
    }
    res.json({
      ...item,
      recommendation: generateRecommendation(item),
    });
  });

  app.post('/api/resources', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.resource_id || !body.name) {
      res.status(400).json({ detail: 'resource_id and name are required' });
      return;
    }
    if (resourcesStore.some((r) => r.resource_id === body.resource_id)) {
      res.status(400).json({ detail: `Resource ID '${body.resource_id}' already exists` });
      return;
    }

    const newResource: ResourceRecord = {
      id: nextId++,
      resource_id: String(body.resource_id).trim(),
      name: String(body.name).trim(),
      type: body.type || 'VM',
      provider: body.provider || 'AWS',
      region: body.region || 'us-east-1',
      cpu_utilization: Math.min(100, Math.max(0, Number(body.cpu_utilization || 0))),
      memory_utilization: Math.min(100, Math.max(0, Number(body.memory_utilization || 0))),
      storage_utilization: Math.min(100, Math.max(0, Number(body.storage_utilization || 0))),
      network_utilization: Math.min(100, Math.max(0, Number(body.network_utilization || 0))),
      hourly_cost: Math.max(0, Number(body.hourly_cost || 0)),
      updated_at: new Date().toISOString(),
    };

    resourcesStore.push(newResource);
    res.status(201).json({
      ...newResource,
      recommendation: generateRecommendation(newResource),
    });
  });

  app.put('/api/resources/:id', (req: Request, res: Response) => {
    const idParam = req.params.id;
    const index = resourcesStore.findIndex((r) => r.resource_id === idParam || String(r.id) === idParam);
    if (index === -1) {
      res.status(404).json({ detail: `Resource '${idParam}' not found` });
      return;
    }

    const current = resourcesStore[index];
    const body = req.body;
    const updated: ResourceRecord = {
      ...current,
      name: body.name !== undefined ? body.name : current.name,
      type: body.type !== undefined ? body.type : current.type,
      provider: body.provider !== undefined ? body.provider : current.provider,
      region: body.region !== undefined ? body.region : current.region,
      cpu_utilization: body.cpu_utilization !== undefined ? Math.min(100, Math.max(0, Number(body.cpu_utilization))) : current.cpu_utilization,
      memory_utilization: body.memory_utilization !== undefined ? Math.min(100, Math.max(0, Number(body.memory_utilization))) : current.memory_utilization,
      storage_utilization: body.storage_utilization !== undefined ? Math.min(100, Math.max(0, Number(body.storage_utilization))) : current.storage_utilization,
      network_utilization: body.network_utilization !== undefined ? Math.min(100, Math.max(0, Number(body.network_utilization))) : current.network_utilization,
      hourly_cost: body.hourly_cost !== undefined ? Math.max(0, Number(body.hourly_cost)) : current.hourly_cost,
      updated_at: new Date().toISOString(),
    };

    resourcesStore[index] = updated;
    res.json({
      ...updated,
      recommendation: generateRecommendation(updated),
    });
  });

  // DELETE /api/resources/{id}
  app.delete('/api/resources/:id', (req: Request, res: Response) => {
    const idParam = req.params.id;
    const index = resourcesStore.findIndex((r) => r.resource_id === idParam || String(r.id) === idParam);
    if (index === -1) {
      res.status(404).json({ detail: `Resource '${idParam}' not found` });
      return;
    }

    const removed = resourcesStore.splice(index, 1)[0];
    res.json({
      message: `Resource '${removed.resource_id}' deleted successfully`,
      resource_id: removed.resource_id,
    });
  });

  // Sudden Workload Spike Simulator endpoint
  app.post('/api/resources/:id/simulate', (req: Request, res: Response) => {
    const idParam = req.params.id;
    const index = resourcesStore.findIndex((r) => r.resource_id === idParam || String(r.id) === idParam);
    if (index === -1) {
      res.status(404).json({ detail: `Resource '${idParam}' not found` });
      return;
    }

    const { targetState } = req.body; // 'spike' | 'idle' | 'nominal'
    const current = resourcesStore[index];

    let cpu = current.cpu_utilization;
    let mem = current.memory_utilization;
    let storage = current.storage_utilization;
    let net = current.network_utilization;

    if (targetState === 'spike') {
      cpu = 92.0;
      mem = 88.0;
      storage = 82.0;
      net = 85.0;
    } else if (targetState === 'idle') {
      cpu = 7.0;
      mem = 10.0;
      storage = 9.0;
      net = 5.0;
    } else if (targetState === 'underutilized') {
      cpu = 25.0;
      mem = 30.0;
      storage = 20.0;
      net = 25.0;
    } else {
      cpu = 60.0;
      mem = 55.0;
      storage = 50.0;
      net = 52.0;
    }

    const updated: ResourceRecord = {
      ...current,
      cpu_utilization: cpu,
      memory_utilization: mem,
      storage_utilization: storage,
      network_utilization: net,
      updated_at: new Date().toISOString(),
    };

    resourcesStore[index] = updated;
    res.json({
      ...updated,
      recommendation: generateRecommendation(updated),
    });
  });

  app.get('/api/recommendations', (req: Request, res: Response) => {
    const recs = resourcesStore
      .map((r) => {
        const rec = generateRecommendation(r);
        return {
          resource_id: r.resource_id,
          name: r.name,
          provider: r.provider,
          type: r.type,
          hourly_cost: r.hourly_cost,
          ...rec,
        };
      })
      .filter((rec) => rec.action !== 'KEEP_RESOURCE');
    res.json(recs);
  });

  // Re-seed fleet
  app.post('/api/seed', (req: Request, res: Response) => {
    resourcesStore = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    res.json({ message: 'Fleet reseeded to default benchmark workloads', count: resourcesStore.length });
  });

  // Classify unit test endpoint
  app.post('/api/test/classify', (req: Request, res: Response) => {
    const { cpu, memory, storage, network } = req.body;
    const classification = classifyResource(Number(cpu), Number(memory), Number(storage), Number(network));
    res.json({
      cpu,
      memory,
      storage,
      network,
      average: ((Number(cpu) + Number(memory) + Number(storage) + Number(network)) / 4.0).toFixed(1),
      classification,
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Optimizer Server running on port ${PORT}`);
  });
}

startServer();
