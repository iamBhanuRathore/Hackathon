# API & Data Contracts Specification

> **Rule:** Code follows contracts. Contracts never follow code.

This document serves as the human-readable index for all machine-executable contracts residing in [`packages/shared/contracts/`](file:///Users/bhanurathore/projects/hack/packages/shared/contracts).

---

## 1. Contract Lifecycle Workflow

```
1. Proposal (P1 / P2 / P3)
   └── Propose change in docs/CONTRACTS.md & packages/shared/contracts/

2. Review (P4 Infra & P5 QA)
   └── Verify backward compatibility and type safety

3. Implementation
   ├── P2 updates Backend endpoints
   ├── P1 updates Frontend UI consumption
   └── P3 updates AI Engine tools/prompts

4. Automated Verification
   └── ./scripts/verify-setup.sh validates contract consistency
```

---

## 2. Core Service Contracts

### A. Standard API Response Wrapper
All endpoints exposed by `apps/backend/` must conform to:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### B. AI Engine Prompt / Inference Request
When Backend invokes the AI Engine (`apps/ai-service/`):

```typescript
export interface AIInferenceRequest {
  prompt: string;
  systemContext?: string;
  sessionId: string;
  userId: string;
  tools?: string[];
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

export interface AIInferenceResponse {
  sessionId: string;
  output: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### C. Authentication & User Profile
Shared contract between Frontend and Backend:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member' | 'guest';
  createdAt: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
}
```

### D. Growth Engine Dynamic Data & Mutation Contracts
Contract defined in [`packages/shared/contracts/growth-engine.ts`](file:///Users/bhanurathore/projects/hack/packages/shared/contracts/growth-engine.ts):

```typescript
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
```

#### Real-time Mutation & Query Endpoints:
- `GET /api/v1/engine/retailers?search=&tier=&status=` — Query audited retailer universe
- `GET /api/v1/data/:entity?search=` — Query entities (`retailers`, `leakages`, `directives`, `schemes`, `reps`)
- `POST /api/v1/data/:entity` — Real-time entity creation with auto ID & live KPI recalculation
- `PUT /api/v1/data/:entity/:id` — Live record edit with automatic KPI re-computation & disk persistence
- `DELETE /api/v1/data/:entity/:id` — Live record deletion with dynamic rollback & metric refresh
- `POST /api/v1/data/reset` — Restore dataset to initial verified benchmark backup

---

## 3. Versioning & Breaking Changes
- Contracts are versioned incrementally.
- Breaking field modifications (deleting fields or altering existing data types) require incrementing major version (e.g. `v1` to `v2`) or adding optional fields.
- Stale fields must be marked with `@deprecated` in JSDoc before removal.
