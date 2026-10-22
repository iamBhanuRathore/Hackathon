import http from 'http';
import { handleHealthCheck } from './routes/health';
import { proxyAIInference } from './routes/ai';
import {
  handleGetSummary,
  handleGetLeakages,
  handleGetDirectives,
  handleGetTerritories,
  handleGetCategories,
  handleGetSchemes,
  handleGetReps,
  handleGetRetailers,
  handleListEntities,
  handleCreateEntity,
  handleUpdateEntity,
  handleDeleteEntity,
  handleResetData
} from './routes/growth';
import { ManagedEntityType } from '../../../packages/shared/contracts/growth-engine';
import { AIInferenceRequest } from '../../../packages/shared/contracts/ai';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Healthcheck Route
  if (pathname === '/health' && req.method === 'GET') {
    const health = handleHealthCheck();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
    return;
  }

  // AI Inference Proxy Route
  if (pathname === '/api/ai/infer' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req) as AIInferenceRequest;
      const result = await proxyAIInference(payload);
      res.writeHead(result.success ? 200 : 502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: { code: 'INVALID_JSON', message: err.message },
        meta: { timestamp: new Date().toISOString(), requestId: `err_${Date.now()}` }
      }));
    }
    return;
  }

  // --- Growth Engine Core REST Routes ---
  if (pathname === '/api/v1/engine/summary' && req.method === 'GET') {
    try {
      const resp = handleGetSummary();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/engine/leakages' && req.method === 'GET') {
    try {
      const cat = url.searchParams.get('category') || undefined;
      const sev = url.searchParams.get('severity') || undefined;
      const resp = handleGetLeakages(cat, sev);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/engine/directives' && req.method === 'GET') {
    try {
      const resp = handleGetDirectives();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/engine/territories' && req.method === 'GET') {
    try {
      const resp = handleGetTerritories();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/engine/categories' && req.method === 'GET') {
    try {
      const resp = handleGetCategories();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/engine/schemes' && req.method === 'GET') {
    try {
      const resp = handleGetSchemes();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/engine/reps' && req.method === 'GET') {
    try {
      const resp = handleGetReps();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/engine/retailers' && req.method === 'GET') {
    try {
      const search = url.searchParams.get('search') || undefined;
      const tier = url.searchParams.get('tier') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const resp = handleGetRetailers(search, tier, status);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  if (pathname === '/api/v1/directives/dispatch' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          directiveId: payload.directiveId,
          status: 'DISPATCHED_TO_WHATSAPP',
          recipientPhone: payload.phone || '+91-9876543210',
          dispatchedAt: new Date().toISOString()
        },
        meta: { timestamp: new Date().toISOString(), requestId: `disp_${Date.now()}` }
      }));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: err.message } }));
    }
    return;
  }

  // --- Real-Time Data Management CRUD Routes ---
  // 1. Reset endpoint
  if (pathname === '/api/v1/data/reset' && req.method === 'POST') {
    try {
      const resp = handleResetData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { message: e.message } }));
    }
    return;
  }

  // 2. Generic Query / Create: /api/v1/data/:entity
  const entityMatch = pathname.match(/^\/api\/v1\/data\/(retailers|leakages|directives|schemes|reps)$/);
  if (entityMatch) {
    const entityType = entityMatch[1] as ManagedEntityType;

    if (req.method === 'GET') {
      try {
        const search = url.searchParams.get('search') || undefined;
        const resp = handleListEntities(entityType, search);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resp));
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message: e.message } }));
      }
      return;
    }

    if (req.method === 'POST') {
      try {
        const payload = await readJsonBody(req);
        const resp = handleCreateEntity(entityType, payload);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resp));
      } catch (e: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message: e.message } }));
      }
      return;
    }
  }

  // 3. Entity Item Update / Delete: /api/v1/data/:entity/:id
  const itemMatch = pathname.match(/^\/api\/v1\/data\/(retailers|leakages|directives|schemes|reps)\/([^/]+)$/);
  if (itemMatch) {
    const entityType = itemMatch[1] as ManagedEntityType;
    const id = decodeURIComponent(itemMatch[2]);

    if (req.method === 'PUT') {
      try {
        const payload = await readJsonBody(req);
        const resp = handleUpdateEntity(entityType, id, payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resp));
      } catch (e: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message: e.message } }));
      }
      return;
    }

    if (req.method === 'DELETE') {
      try {
        const resp = handleDeleteEntity(entityType, id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resp));
      } catch (e: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message: e.message } }));
      }
      return;
    }
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${url.pathname} not found` },
    meta: { timestamp: new Date().toISOString(), requestId: `404_${Date.now()}` }
  }));
});

server.listen(PORT, () => {
  console.log(`[Backend Core] Server active at http://localhost:${PORT}`);
});
