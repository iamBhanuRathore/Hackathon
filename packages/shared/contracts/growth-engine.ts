/**
 * Shared Growth Engine Contracts & Opportunity Loss Data Models
 * Domain: Sales, Distribution, Inventory, Retailer, and Field Force
 */

export type LeakageCategory =
  | 'GHOST_STOCKOUT'
  | 'SUPPLY_CHAIN_STOCKOUT'
  | 'SILENT_CHURN'
  | 'FIELD_FORCE_DRAIN'
  | 'AGED_INVENTORY_LOCKUP'
  | 'SCHEME_MISALLOCATION';

export type LeakageSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface OpportunityLeakage {
  id: string;
  category: LeakageCategory;
  severity: LeakageSeverity;
  entity_id: string;
  entity_name: string;
  territory: string;
  distributor_id: string;
  sku_code: string;
  product_category: string;
  revenue_at_risk: number;
  root_cause: string;
  what_to_do: string;
  why_it_matters: string;
  metric_to_track: string;
}

export type DirectivePriority = 'P0_URGENT' | 'P1_HIGH' | 'P2_NORMAL';

export interface PrescriptiveDirective {
  directive_id: string;
  type: 'STOCKOUT_PREVENTION' | 'CHURN_RECOVERY' | 'ROUTE_AUDIT' | 'SCHEME_OPTIMIZATION';
  priority: DirectivePriority;
  store_id: string;
  store_name: string;
  territory: string;
  action_title: string;
  recommended_action: string;
  commercial_rationale: string;
  revenue_impact_inr: number;
  whatsapp_message: string;
}

export interface EngineKPIs {
  total_ordered_value: number;
  total_delivered_value: number;
  direct_lost_sales: number;
  overall_fill_rate: number;
  ghost_stockouts_value: number;
  ghost_stockouts_count: number;
  total_distributor_stock_value: number;
  stock_on_hand_units: number;
  aged_90_plus_units: number;
  aged_180_plus_units: number;
  silent_churn_outlets_count: number;
  silent_churn_annual_rev_at_risk: number;
  silent_churn_monthly_run_rate_at_risk: number;
  total_rep_visits: number;
  rep_strike_rate: number;
  non_gps_visits_count: number;
  drive_by_visits_count: number;
  schemes_redemption_rate: number;
  schemes_total_lift: number;
}

export interface TerritoryMetric {
  territory_id: string;
  territory_name: string;
  order_value: number;
  delivered_value: number;
  lost_value: number;
  fill_rate: number;
}

export interface CategoryMetric {
  category: string;
  order_value: number;
  delivered_value: number;
  lost_value: number;
  fill_rate: number;
}

export interface SchemePerformance {
  scheme_id: string;
  scheme_name: string;
  category: string;
  eligible: number;
  redeemed: number;
  redemption_rate: number;
  scheme_cost: number;
  sales_lift: number;
  roi_ratio: number;
}

export interface RepProductivity {
  rep_id: string;
  rep_name: string;
  city: string;
  total_visits: number;
  orders: number;
  order_value: number;
  strike_rate: number;
  drive_by_stops: number;
  non_gps_visits: number;
  is_anomaly: boolean;
}

export interface GrowthEngineData {
  metadata: {
    title: string;
    period: string;
    generated_at: string;
    total_outlets_audited: number;
    total_skus: number;
    total_territories: number;
    total_orders: number;
  };
  kpis: EngineKPIs;
  leakages: OpportunityLeakage[];
  directives: PrescriptiveDirective[];
  territories: TerritoryMetric[];
  categories: CategoryMetric[];
  schemes: SchemePerformance[];
  reps: RepProductivity[];
  retailers?: RetailerRecord[];
}

export interface RetailerRecord {
  retailer_id: string;
  retailer_name: string;
  retailer_type: string;
  tier: 'A' | 'B' | 'C';
  city: string;
  distributor_name: string;
  rep_name: string;
  credit_limit: number;
  last_order_date: string;
  days_since_last_order: number;
  sales_value_12m: number;
  orders_12m: number;
  status: 'Active' | 'Dormant' | 'Inactive';
}

export type ManagedEntityType = 'retailers' | 'leakages' | 'directives' | 'schemes' | 'reps';

export interface DataMutationResponse<T = any> {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: ManagedEntityType;
  record?: T;
  recalculatedKpis: EngineKPIs;
  summary: {
    totalRecords: number;
    updatedAt: string;
  };
}

