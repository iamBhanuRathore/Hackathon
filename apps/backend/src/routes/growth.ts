import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GrowthEngineData,
  OpportunityLeakage,
  PrescriptiveDirective,
  RetailerRecord,
  ManagedEntityType,
  DataMutationResponse
} from '../../../../packages/shared/contracts/growth-engine';
import { ApiResponse } from '../../../../packages/shared/contracts/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/growth_engine_data.json');
const BACKUP_FILE = path.resolve(__dirname, '../data/growth_engine_data.backup.json');
const FRONTEND_DATA_FILE = path.resolve(__dirname, '../../../frontend/src/data/growth_engine_data.json');

let inMemoryData: GrowthEngineData | null = null;

function ensureBackup(data: GrowthEngineData) {
  if (!fs.existsSync(BACKUP_FILE)) {
    try {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log('📦 Created initial backup: growth_engine_data.backup.json');
    } catch (e) {
      console.warn('Could not create backup file:', e);
    }
  }
}

export function loadEngineData(): GrowthEngineData {
  if (inMemoryData) {
    return inMemoryData;
  }
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error('Engine dataset not found. Please run scripts/build_engine_data.py first.');
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  inMemoryData = JSON.parse(raw) as GrowthEngineData;
  ensureBackup(inMemoryData);
  return inMemoryData;
}

function persistData(data: GrowthEngineData) {
  inMemoryData = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    if (fs.existsSync(path.dirname(FRONTEND_DATA_FILE))) {
      fs.writeFileSync(FRONTEND_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error persisting engine data to disk:', err);
  }
}

/**
 * Real-time dynamic recalculation of engine KPIs across all dimensions
 */
export function recalculateEngineKPIs(data: any) {
  // 1. Retailers & Silent Churn Dynamics
  if (Array.isArray(data.retailers)) {
    const silentChurners = data.retailers.filter((r: any) => 
      (Number(r.days_since_last_order) > 60 || r.status === 'Dormant') && r.status !== 'Inactive'
    );
    const silentChurnRev = silentChurners.reduce((acc: number, r: any) => acc + (Number(r.sales_value_12m) || 0), 0);
    data.kpis.silent_churn_outlets_count = silentChurners.length;
    data.kpis.silent_churn_annual_rev_at_risk = Math.round(silentChurnRev);
    data.kpis.silent_churn_monthly_run_rate_at_risk = Math.round(silentChurnRev / 12);
    data.metadata.total_outlets_audited = data.retailers.length;
  }

  // 2. Opportunity Leakages & Ghost Stockouts
  if (Array.isArray(data.leakages)) {
    const ghostItems = data.leakages.filter((l: any) => l.category === 'GHOST_STOCKOUT');
    data.kpis.ghost_stockouts_count = ghostItems.length;
    data.kpis.ghost_stockouts_value = Math.round(ghostItems.reduce((acc: number, l: any) => acc + (Number(l.revenue_at_risk) || 0), 0));
  }

  // 3. Trade Schemes & Promos
  if (Array.isArray(data.schemes) && data.schemes.length > 0) {
    const totalEligible = data.schemes.reduce((acc: number, s: any) => acc + (Number(s.eligible) || 0), 0);
    const totalRedeemed = data.schemes.reduce((acc: number, s: any) => acc + (Number(s.redeemed) || 0), 0);
    const totalLift = data.schemes.reduce((acc: number, s: any) => acc + (Number(s.sales_lift) || 0), 0);
    data.kpis.schemes_redemption_rate = totalEligible > 0 ? Number(((totalRedeemed / totalEligible) * 100).toFixed(1)) : 0;
    data.kpis.schemes_total_lift = Math.round(totalLift);
  }

  // 4. Sales Reps & Strike Rates
  if (Array.isArray(data.reps) && data.reps.length > 0) {
    const totalVisits = data.reps.reduce((acc: number, r: any) => acc + (Number(r.total_visits) || 0), 0);
    const totalOrders = data.reps.reduce((acc: number, r: any) => acc + (Number(r.orders) || 0), 0);
    data.kpis.total_rep_visits = totalVisits;
    data.kpis.rep_strike_rate = totalVisits > 0 ? Number(((totalOrders / totalVisits) * 100).toFixed(1)) : 0;
    data.kpis.drive_by_visits_count = data.reps.reduce((acc: number, r: any) => acc + (Number(r.drive_by_stops) || 0), 0);
    data.kpis.non_gps_visits_count = data.reps.reduce((acc: number, r: any) => acc + (Number(r.non_gps_visits) || 0), 0);
  }

  data.metadata.generated_at = new Date().toISOString();
}

function getEntityKey(entityType: ManagedEntityType): string {
  switch (entityType) {
    case 'retailers': return 'retailer_id';
    case 'leakages': return 'id';
    case 'directives': return 'directive_id';
    case 'schemes': return 'scheme_id';
    case 'reps': return 'rep_id';
  }
}

export function handleGetSummary(): ApiResponse {
  const data = loadEngineData();
  return {
    success: true,
    data: {
      metadata: data.metadata,
      kpis: data.kpis,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

export function handleGetLeakages(category?: string, severity?: string): ApiResponse<{ leakages: OpportunityLeakage[]; total: number }> {
  const data = loadEngineData();
  let items = data.leakages || [];

  if (category && category !== 'ALL') {
    items = items.filter(l => l.category === category);
  }
  if (severity && severity !== 'ALL') {
    items = items.filter(l => l.severity === severity);
  }

  return {
    success: true,
    data: {
      leakages: items,
      total: items.length,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

export function handleGetDirectives(): ApiResponse<PrescriptiveDirective[]> {
  const data = loadEngineData();
  return {
    success: true,
    data: data.directives || [],
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

export function handleGetTerritories(): ApiResponse {
  const data = loadEngineData();
  return {
    success: true,
    data: data.territories || [],
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

export function handleGetCategories(): ApiResponse {
  const data = loadEngineData();
  return {
    success: true,
    data: data.categories || [],
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

export function handleGetSchemes(): ApiResponse {
  const data = loadEngineData();
  return {
    success: true,
    data: data.schemes || [],
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

export function handleGetReps(): ApiResponse {
  const data = loadEngineData();
  return {
    success: true,
    data: data.reps || [],
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

export function handleGetRetailers(search?: string, tier?: string, status?: string): ApiResponse<{ retailers: RetailerRecord[]; total: number }> {
  const data = loadEngineData();
  let items = data.retailers || [];

  if (tier && tier !== 'ALL') {
    items = items.filter(r => r.tier === tier);
  }
  if (status && status !== 'ALL') {
    items = items.filter(r => r.status === status);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(r =>
      r.retailer_name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.rep_name.toLowerCase().includes(q) ||
      r.retailer_id.toLowerCase().includes(q)
    );
  }

  return {
    success: true,
    data: {
      retailers: items,
      total: items.length
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    },
  };
}

/**
 * Generic Entity List / Query Endpoint
 */
export function handleListEntities(entityType: ManagedEntityType, search?: string): ApiResponse<{ items: any[]; total: number }> {
  const data = loadEngineData();
  const list: any[] = (data as any)[entityType] || [];
  let filtered = list;

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = list.filter(item => {
      const serialized = JSON.stringify(item).toLowerCase();
      return serialized.includes(q);
    });
  }

  return {
    success: true,
    data: {
      items: filtered,
      total: filtered.length
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
    }
  };
}

/**
 * Real-time Entity Creation (ADD)
 */
export function handleCreateEntity(entityType: ManagedEntityType, payload: any): ApiResponse<DataMutationResponse> {
  const data = loadEngineData();
  const list: any[] = (data as any)[entityType] || [];
  const keyField = getEntityKey(entityType);

  // Auto-generate ID if omitted
  if (!payload[keyField]) {
    const prefixMap: Record<ManagedEntityType, string> = {
      retailers: 'RET_LIVE_',
      leakages: 'LEAK_LIVE_',
      directives: 'DIR_LIVE_',
      schemes: 'SCH_LIVE_',
      reps: 'SP_LIVE_'
    };
    payload[keyField] = `${prefixMap[entityType]}${Date.now().toString().slice(-6)}`;
  }

  // Type-specific field sanitation and defaults
  if (entityType === 'retailers') {
    payload.credit_limit = Number(payload.credit_limit) || 50000;
    payload.sales_value_12m = Number(payload.sales_value_12m) || 0;
    payload.orders_12m = Number(payload.orders_12m) || 0;
    payload.days_since_last_order = Number(payload.days_since_last_order) || 0;
    payload.status = payload.status || (payload.days_since_last_order > 60 ? 'Dormant' : 'Active');
    payload.tier = payload.tier || 'B';
    payload.last_order_date = payload.last_order_date || new Date().toISOString().split('T')[0];
  } else if (entityType === 'leakages') {
    payload.revenue_at_risk = Number(payload.revenue_at_risk) || 0;
    payload.severity = payload.severity || 'HIGH';
    payload.category = payload.category || 'GHOST_STOCKOUT';
  } else if (entityType === 'directives') {
    payload.priority = payload.priority || 'P1_HIGH';
    payload.revenue_impact_inr = Number(payload.revenue_impact_inr) || 50000;
  } else if (entityType === 'schemes') {
    payload.eligible = Number(payload.eligible) || 100;
    payload.redeemed = Number(payload.redeemed) || 0;
    payload.scheme_cost = Number(payload.scheme_cost) || 0;
    payload.sales_lift = Number(payload.sales_lift) || 0;
    payload.redemption_rate = payload.eligible > 0 ? Number(((payload.redeemed / payload.eligible) * 100).toFixed(1)) : 0;
    payload.roi_ratio = payload.scheme_cost > 0 ? Number((payload.sales_lift / payload.scheme_cost).toFixed(2)) : 0;
  } else if (entityType === 'reps') {
    payload.total_visits = Number(payload.total_visits) || 0;
    payload.orders = Number(payload.orders) || 0;
    payload.order_value = Number(payload.order_value) || 0;
    payload.drive_by_stops = Number(payload.drive_by_stops) || 0;
    payload.non_gps_visits = Number(payload.non_gps_visits) || 0;
    payload.strike_rate = payload.total_visits > 0 ? Number(((payload.orders / payload.total_visits) * 100).toFixed(1)) : 0;
    payload.is_anomaly = payload.drive_by_stops > 100 || payload.strike_rate < 25;
  }

  // Prepend new record so it appears immediately at the top
  list.unshift(payload);
  (data as any)[entityType] = list;

  // Recalculate KPIs in real-time
  recalculateEngineKPIs(data);
  persistData(data);

  console.log(`[Growth Engine] Added record to ${entityType} (ID: ${payload[keyField]}). KPIs recalculated.`);

  return {
    success: true,
    data: {
      action: 'CREATE',
      entityType,
      record: payload,
      recalculatedKpis: data.kpis,
      summary: {
        totalRecords: list.length,
        updatedAt: new Date().toISOString()
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `mut_create_${Date.now()}`
    }
  };
}

/**
 * Real-time Entity Modification (EDIT)
 */
export function handleUpdateEntity(entityType: ManagedEntityType, id: string, payload: any): ApiResponse<DataMutationResponse> {
  const data = loadEngineData();
  const list: any[] = (data as any)[entityType] || [];
  const keyField = getEntityKey(entityType);

  const index = list.findIndex(item => String(item[keyField]) === String(id));
  if (index === -1) {
    throw new Error(`Entity ${entityType} with ID '${id}' not found`);
  }

  const existing = list[index];
  const updated = { ...existing, ...payload, [keyField]: id };

  // Type specific recalculations
  if (entityType === 'retailers') {
    if (updated.credit_limit !== undefined) updated.credit_limit = Number(updated.credit_limit);
    if (updated.sales_value_12m !== undefined) updated.sales_value_12m = Number(updated.sales_value_12m);
    if (updated.orders_12m !== undefined) updated.orders_12m = Number(updated.orders_12m);
    if (updated.days_since_last_order !== undefined) {
      updated.days_since_last_order = Number(updated.days_since_last_order);
      if (updated.status === 'Active' && updated.days_since_last_order > 60) {
        updated.status = 'Dormant';
      }
    }
  } else if (entityType === 'leakages') {
    if (updated.revenue_at_risk !== undefined) updated.revenue_at_risk = Number(updated.revenue_at_risk);
  } else if (entityType === 'schemes') {
    const eligible = Number(updated.eligible) || 0;
    const redeemed = Number(updated.redeemed) || 0;
    const cost = Number(updated.scheme_cost) || 0;
    const lift = Number(updated.sales_lift) || 0;
    updated.redemption_rate = eligible > 0 ? Number(((redeemed / eligible) * 100).toFixed(1)) : 0;
    updated.roi_ratio = cost > 0 ? Number((lift / cost).toFixed(2)) : 0;
  } else if (entityType === 'reps') {
    const visits = Number(updated.total_visits) || 0;
    const orders = Number(updated.orders) || 0;
    updated.strike_rate = visits > 0 ? Number(((orders / visits) * 100).toFixed(1)) : 0;
    updated.is_anomaly = Number(updated.drive_by_stops) > 100 || updated.strike_rate < 25;
  }

  list[index] = updated;
  (data as any)[entityType] = list;

  // Recalculate KPIs in real-time
  recalculateEngineKPIs(data);
  persistData(data);

  console.log(`[Growth Engine] Updated record in ${entityType} (ID: ${id}). KPIs recalculated.`);

  return {
    success: true,
    data: {
      action: 'UPDATE',
      entityType,
      record: updated,
      recalculatedKpis: data.kpis,
      summary: {
        totalRecords: list.length,
        updatedAt: new Date().toISOString()
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `mut_update_${Date.now()}`
    }
  };
}

/**
 * Real-time Entity Deletion (DELETE)
 */
export function handleDeleteEntity(entityType: ManagedEntityType, id: string): ApiResponse<DataMutationResponse> {
  const data = loadEngineData();
  const list: any[] = (data as any)[entityType] || [];
  const keyField = getEntityKey(entityType);

  const index = list.findIndex(item => String(item[keyField]) === String(id));
  if (index === -1) {
    throw new Error(`Entity ${entityType} with ID '${id}' not found`);
  }

  const removed = list.splice(index, 1)[0];
  (data as any)[entityType] = list;

  // Recalculate KPIs in real-time
  recalculateEngineKPIs(data);
  persistData(data);

  console.log(`[Growth Engine] Deleted record from ${entityType} (ID: ${id}). KPIs recalculated.`);

  return {
    success: true,
    data: {
      action: 'DELETE',
      entityType,
      record: removed,
      recalculatedKpis: data.kpis,
      summary: {
        totalRecords: list.length,
        updatedAt: new Date().toISOString()
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `mut_delete_${Date.now()}`
    }
  };
}

/**
 * Reset Data to Backup or Original Pipeline State
 */
export function handleResetData(): ApiResponse<{ message: string; kpis: any }> {
  if (fs.existsSync(BACKUP_FILE)) {
    const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
    inMemoryData = JSON.parse(raw);
    persistData(inMemoryData!);
  }
  return {
    success: true,
    data: {
      message: 'Engine dataset restored to initial state',
      kpis: inMemoryData?.kpis
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `reset_${Date.now()}`
    }
  };
}
