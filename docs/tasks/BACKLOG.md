# Project Backlog & Machine-Readable Task Matrix

> **Agent Protocol:**
> 1. Find your role's tasks (`TASK-P1-*`, `TASK-P2-*`, `TASK-P3-*`, `TASK-P4-*`, `TASK-P5-*`).
> 2. Ensure dependencies are satisfied before beginning implementation.
> 3. Update task status from `[ ]` (Pending) to `[/]` (In Progress) and finally `[x]` (Completed).
> 4. Record the Git commit or PR hash next to the task upon completion.

---

## Sprint 0: Foundation & Environment (All Roles)

| Task ID | Role | Title | Status | Dependencies | Owner | Notes / Deliverables |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `TASK-P4-001` | `P4` | Setup monorepo package structure & shared contracts | [x] | None | Infra Lead | `packages/shared/contracts/` initialized |
| `TASK-P4-002` | `P4` | Create local Docker Compose orchestrator | [x] | `TASK-P4-001` | Infra Lead | `infra/docker-compose.yml` & `.env.example` |
| `TASK-P4-003` | `P4` | Setup validation script (`verify-setup.sh`) | [x] | `TASK-P4-001` | Infra Lead | `./scripts/verify-setup.sh` executable |
| `TASK-P1-001` | `P1` | Scaffold Frontend client application | [x] | `TASK-P4-001` | Frontend Lead | `apps/frontend/` initialized |
| `TASK-P2-001` | `P2` | Scaffold Backend API server | [x] | `TASK-P4-001` | Backend Lead | `apps/backend/` initialized |
| `TASK-P3-001` | `P3` | Scaffold AI Service & Agent Engine | [x] | `TASK-P4-001` | AI Lead | `apps/ai-service/` initialized |
| `TASK-P5-001` | `P5` | Setup E2E Test harness & QA verification suite | [x] | `TASK-P1-001`, `TASK-P2-001` | QA Lead | `tests/` initialized |

---

## Sprint 1: Data Unification & Opportunity Loss Detection Engine (Real Hackathon Data)

### P1: Frontend Team (`apps/frontend/`)
- [x] `TASK-P1-101`: Build Executive Leakage Dashboard & Revenue-at-Risk Cockpit
  - **Inputs:** `packages/shared/contracts/growth-engine.ts`, `apps/frontend/src/data/growth_engine_data.json`
  - **Outputs:** `apps/frontend/src/index.html`, `apps/frontend/src/styles.css`, `apps/frontend/src/app.js`
  - **Validation:** Renders Ghost Stockouts (₹51.66L), Silent Churn (₹17.20Cr), Rep Drain (4,623 visits), and Aged Inventory (16,086 units).
- [x] `TASK-P1-102`: Build Field Rep Daily Beat & Prescriptive Action Sheet
  - **Inputs:** `packages/shared/contracts/growth-engine.ts`
  - **Outputs:** `apps/frontend/src/features/field/BeatSheet.js`, WhatsApp dispatch modal in `apps/frontend/src/app.js`
  - **Validation:** Renders prioritized outlet visit cards with SKU pitch quantities and working WhatsApp push modal.
- [x] `TASK-P1-103`: Interactive Chart.js Visual Suite & Executive White Theme
  - **Inputs:** Chart.js CDN, `engineData` telemetry across territories, categories, leakages, inventory, reps, and schemes.
  - **Outputs:** `apps/frontend/src/index.html`, `apps/frontend/src/styles.css`, `apps/frontend/src/app.js`
  - **Validation:** 6 interactive responsive charts: Territory Grouped Bars, Category Revenue Doughnut, Opportunity Loss Vectors, Stock Health Profile, Rep Strike Rate vs Drive-Bys, and Scheme Commercial ROI. Full executive white theme with high-contrast palette and tab-switch auto-resizing.
- [x] `TASK-P1-104`: Territory & Category Table Polish, Progress Bar Gradient Rendering & Height Balance
  - **Inputs:** User feedback on visual voids, broken inline progress bar widths, and text wrapping.
  - **Outputs:** `apps/frontend/src/styles.css`, `apps/frontend/src/index.html`, `apps/frontend/src/app.js`
  - **Validation:** Fixed progress bar rendering with `display: block` and multi-stop gradients (emerald/amber/rose); resolved Bhubaneswar (T12) wrap with `.td-territory` badge; eliminated 400px whitespace void with embedded Category Concentration & Rebalancing Takeaway card.


### P2: Backend Team (`apps/backend/`)
- [x] `TASK-P2-101`: Ingestion Pipeline & Relational Schema for 8 Core Hackathon Datasets
  - **Inputs:** `1_Sales_Orders.xlsx`, `2_Distributor_Stock.xlsx`, `3_Retailer_Sales.xlsx`, `4_Field_Visits.xlsx`, `5_Retailer_Master.xlsx`, `6_Schemes_Promotions.xlsx`, `7_SKU_Master.xlsx`, `Data_Dictionary.xlsx`
  - **Outputs:** `scripts/build_engine_data.py`, `apps/backend/src/data/growth_engine_data.json`
  - **Validation:** Clean joins across 17,479 orders, 17,360 stock snapshots, 3,000 retailers, 18,286 visits.
- [x] `TASK-P2-102`: Core Opportunity Loss Engine & REST API Router
  - **Inputs:** Cleaned multi-echelon transactions and stock levels
  - **Outputs:** `apps/backend/src/routes/growth.ts`, updated `apps/backend/src/server.ts`
  - **Validation:** Endpoints active at `/api/v1/engine/summary`, `/leakages`, `/directives`, `/territories`, `/categories`, `/reps`, `/schemes`.
- [x] `TASK-P2-103`: Real-Time Data Mutation Engine & Dynamic KPI Recalculation (CRUD & Retailers)
  - **Inputs:** `RetailerRecord`, `ManagedEntityType`, `DataMutationResponse` contracts in `growth-engine.ts`.
  - **Outputs:** `apps/backend/src/routes/growth.ts`, `apps/backend/src/server.ts`
  - **Validation:** Added in-memory caching with automatic disk persistence, automatic initial backup (`growth_engine_data.backup.json`), live dynamic recalculation of all KPIs (silent churn, ghost stockouts, strike rates, scheme lifts), and endpoints `/api/v1/engine/retailers`, `/api/v1/data/:entity`, `/api/v1/data/:entity/:id`, and `/api/v1/data/reset`.


### P3: AI & Intelligence Team (`apps/ai-service/`)
- [x] `TASK-P3-101`: Prescriptive Action Generation Pipeline (LLM Directive Layer)
  - **Inputs:** Deterministic JSON leakage payloads from Backend (`P2`)
  - **Outputs:** `apps/ai-service/src/server.ts`, live AI copilot in `apps/frontend/src/app.js`
  - **Validation:** Port 5050 inference endpoint answering Ghost Stockout, Silent Churn, and Rep compliance directives.
- [ ] `TASK-P3-102`: Autonomous Trade Scheme Recommender
  - **Inputs:** Retailer category sales history and available promotion catalog
  - **Outputs:** `apps/ai-service/src/agents/scheme-optimizer.ts`
  - **Validation:** Predicts redemption lift for dormant Tier A/B accounts.

### P4: DevOps & Shared Infra (`packages/shared/`, `infra/`)
- [x] `TASK-P4-101`: Define Growth Engine Contracts & DTOs
  - **Inputs:** Data dictionary and schema specifications
  - **Outputs:** `packages/shared/contracts/growth-engine.ts`, exported in `packages/shared/contracts/index.ts`
  - **Validation:** Full TypeScript types for Master Data, Invoices, Inventory, SFA logs, and Directives.
- [x] `TASK-P4-102`: Data Pipeline & Multi-Service Runner
  - **Inputs:** 8 Hackathon Excel datasets
  - **Outputs:** `scripts/build_engine_data.py`, `apps/frontend/server.js`
  - **Validation:** Services verified on Ports 3000 (Web), 8000 (API), 5050 (AI Engine).

### P5: Product & QA (`tests/`, `docs/`)
- [x] `TASK-P5-101`: Leakage Detection Accuracy & Revenue Calculation Verification
  - **Inputs:** 17,479 sales orders and distributor inventory records
  - **Outputs:** Verified calculation: ₹51.66L Ghost Stockouts (542 lines), ₹17.20Cr Silent Churn (1,381 stores).
- [x] `TASK-P5-102`: A/B Testing Measurement Framework & Interactive Simulator
  - **Inputs:** Control vs Treatment territory design across 12 sales territories
  - **Outputs:** `docs/specs/AB_TESTING_FRAMEWORK.md`, interactive `#pane-measurement` tab in `apps/frontend/src/index.html`
  - **Validation:** Difference-in-Differences (DiD) econometric specification, interactive 4-lever topline lift simulator, and 30-60-90 day execution roadmap.
