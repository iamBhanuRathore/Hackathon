/**
 * EazyGrowth Prescriptive Growth Engine — Client Application
 * Connects to Core API (Port 8000) & AI Service (Port 5050)
 * Enhanced Visual Suite: Charts, Retailer 360, Interactive Directives & Toasts
 */

const API_BASE = 'http://localhost:8000';
let engineData = null;
let currentTab = 'overview';
let selectedRetailerTier = 'ALL';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupFilters();
  setupRetailerFilters();
  setupCopilot();
  setupModal();
  setupMeasurementSimulator();
  await loadData();
});

// Toast Notifications
function showToast(message, icon = '✓') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span style="font-size:1.1rem; color:var(--accent-emerald)">${icon}</span> <span>${message}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Tab Navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-item[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });

  const refreshBtn = document.getElementById('refreshDataBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.innerHTML = '<span>⟳</span> Refreshing...';
      await loadData();
      refreshBtn.innerHTML = '<span>⟳</span> Refresh Engine';
      showToast('Engine data re-indexed from 8 core datasets', '⚡');
    });
  }
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(el => {
    el.classList.toggle('active', el.id === `pane-${tabId}`);
  });

  const titles = {
    overview: ['Executive Growth Leakage Cockpit', 'Multi-tier distribution telemetry across 12 territories & 6 product categories', 'Executive Cockpit'],
    leakages: ['Opportunity Loss Vector Inspector', 'Algorithmic signals across Distribution, Sales, Inventory, and Field Force', 'Opportunity Losses'],
    directives: ['08:30 AM Morning Beat Directives', 'Daily prioritized action sheet with 1-click WhatsApp field dispatch', 'Morning Directives'],
    retailer360: ['Retailer 360° Account Inspector', 'Profile audits for 3,000 retailers: purchase health, dormancy, and tier affinities', 'Retailer 360°'],
    reps: ['Field Force Productivity & Audit Roster', 'Beat strike-rate compliance, drive-by visits (<10 min), and GPS verification', 'Field Force Health'],
    schemes: ['Trade Schemes & Margin Rebates Efficiency', 'Promotional spend vs. incremental sales lift across 11,903 allocations', 'Schemes & Promos'],
    copilot: ['Strategy AI Copilot', 'Autonomous agent reasoning over unified distribution and inventory data', 'Strategy Copilot'],
    measurement: ['Prescriptive Impact & Measurement Framework', 'Interactive Topline Lift Simulator & 60-Day Scientific A/B Testing Protocol', 'Impact & Measurement']
  };

  if (titles[tabId]) {
    document.getElementById('tabHeaderTitle').textContent = titles[tabId][0];
    document.getElementById('tabHeaderSubtitle').textContent = titles[tabId][1];
    const breadcrumb = document.getElementById('breadcrumbActive');
    if (breadcrumb) breadcrumb.textContent = titles[tabId][2];
  }

  // Trigger chart resize for newly active tab
  setTimeout(() => {
    Object.values(chartInstances).forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  }, 60);
}

// Data Loader
async function loadData() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/engine/summary`);
    if (res.ok) {
      const summaryJson = await res.json();
      const [leakRes, dirRes, terrRes, catRes, schemesRes, repsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/engine/leakages`),
        fetch(`${API_BASE}/api/v1/engine/directives`),
        fetch(`${API_BASE}/api/v1/engine/territories`),
        fetch(`${API_BASE}/api/v1/engine/categories`),
        fetch(`${API_BASE}/api/v1/engine/schemes`),
        fetch(`${API_BASE}/api/v1/engine/reps`)
      ]);

      const [leakJson, dirJson, terrJson, catJson, schJson, repJson] = await Promise.all([
        leakRes.json(), dirRes.json(), terrRes.json(), catRes.json(), schemesRes.json(), repsRes.json()
      ]);

      // Also grab local retailers slice if available
      const localRes = await fetch('./data/growth_engine_data.json');
      const localJson = await localRes.json();

      engineData = {
        metadata: summaryJson.data.metadata,
        kpis: summaryJson.data.kpis,
        leakages: leakJson.data.leakages,
        directives: dirJson.data,
        territories: terrJson.data,
        categories: catJson.data,
        schemes: schJson.data,
        reps: repJson.data,
        retailers: localJson.retailers || []
      };
      console.log('✅ Loaded data from Backend API (Port 8000)');
    } else {
      throw new Error('API returned non-200');
    }
  } catch (err) {
    console.warn('⚠️ Backend API unreachable, falling back to local dataset JSON:', err);
    const localRes = await fetch('./data/growth_engine_data.json');
    engineData = await localRes.json();
  }

  renderAll();
}

function renderAll() {
  if (!engineData) return;

  renderOverview();
  renderInteractiveCharts();
  renderLeakages();
  renderDirectives();
  renderRetailer360();
  renderReps();
  renderSchemes();
}

// 1. Render Executive Overview
function renderOverview() {
  const k = engineData.kpis;
  document.getElementById('kpiGhostVal').textContent = `₹${(k.ghost_stockouts_value / 100000).toFixed(2)} Lakhs`;
  document.getElementById('kpiChurnVal').textContent = `₹${(k.silent_churn_annual_rev_at_risk / 10000000).toFixed(2)} Cr`;
  document.getElementById('kpiAgedVal').textContent = `${(k.aged_90_plus_units + k.aged_180_plus_units).toLocaleString()} Units`;
  
  const totalLeakEst = (k.ghost_stockouts_value + k.silent_churn_annual_rev_at_risk) / 10000000;
  document.getElementById('topbarLeakVal').textContent = `₹${totalLeakEst.toFixed(2)} Cr`;
  document.getElementById('leakCountBadge').textContent = engineData.leakages.length;

  // Territories Table
  const terrTbody = document.getElementById('territoryTbody');
  terrTbody.innerHTML = '';
  engineData.territories.forEach(t => {
    const tr = document.createElement('tr');
    const fillClass = t.fill_rate < 97 ? 'danger' : (t.fill_rate < 98.5 ? 'warning' : '');
    tr.innerHTML = `
      <td class="td-territory">
        <span class="territory-name">${t.territory_name}</span>
        <span class="territory-code">${t.territory_id}</span>
      </td>
      <td class="td-num">₹${(t.order_value / 100000).toFixed(1)}L</td>
      <td class="td-num">₹${(t.delivered_value / 100000).toFixed(1)}L</td>
      <td class="td-num td-loss">₹${(t.lost_value).toLocaleString('en-IN')}</td>
      <td>
        <div class="fill-rate-cell">
          <div class="progress-bar-wrap" title="Fill Rate: ${t.fill_rate}%">
            <div class="progress-bar-fill ${fillClass}" style="width: ${Math.min(t.fill_rate, 100)}%"></div>
          </div>
          <span class="fill-rate-val">${t.fill_rate}%</span>
        </div>
      </td>
    `;
    terrTbody.appendChild(tr);
  });

  // Categories Table
  const catTbody = document.getElementById('categoryTbody');
  catTbody.innerHTML = '';
  engineData.categories.forEach(c => {
    const tr = document.createElement('tr');
    const fillClass = c.fill_rate < 97.5 ? 'danger' : (c.fill_rate < 99 ? 'warning' : '');
    tr.innerHTML = `
      <td><strong style="color:var(--text-primary)">${c.category}</strong></td>
      <td class="td-num">₹${(c.delivered_value / 10000000).toFixed(2)} Cr</td>
      <td class="td-num td-loss">₹${(c.lost_value).toLocaleString('en-IN')}</td>
      <td>
        <div class="fill-rate-cell">
          <div class="progress-bar-wrap" title="Fill Rate: ${c.fill_rate}%">
            <div class="progress-bar-fill ${fillClass}" style="width: ${Math.min(c.fill_rate, 100)}%"></div>
          </div>
          <span class="fill-rate-val">${c.fill_rate}%</span>
        </div>
      </td>
    `;
    catTbody.appendChild(tr);
  });
}

// Chart Instances Registry
let chartInstances = {};

function initChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.color = '#64748B';
  Chart.defaults.borderColor = '#F1F5F9';
  Chart.defaults.plugins.tooltip.backgroundColor = '#0F172A';
  Chart.defaults.plugins.tooltip.titleColor = '#F8FAFC';
  Chart.defaults.plugins.tooltip.bodyColor = '#E2E8F0';
  Chart.defaults.plugins.tooltip.borderColor = '#334155';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
}

function destroyExistingCharts() {
  Object.keys(chartInstances).forEach(key => {
    if (chartInstances[key]) {
      try { chartInstances[key].destroy(); } catch (e) {}
    }
  });
  chartInstances = {};
}

function renderInteractiveCharts() {
  if (typeof Chart === 'undefined' || !engineData) return;
  initChartDefaults();
  destroyExistingCharts();

  renderTerritoryChart();
  renderCategoryDonut();
  renderLossVectorChart();
  renderStockAgingChart();
  renderRepProductivityChart();
  renderSchemeRoiChart();
}

// 1. Territory Grouped Bar Chart
function renderTerritoryChart() {
  const canvas = document.getElementById('territoryChartCanvas');
  if (!canvas || !engineData.territories) return;

  const territories = engineData.territories;
  const labels = territories.map(t => t.territory_name);
  const deliveredData = territories.map(t => +(t.delivered_value / 100000).toFixed(1));
  const lostData = territories.map(t => +(t.lost_value / 100000).toFixed(1));

  chartInstances.territory = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Delivered (₹ Lakhs)',
          data: deliveredData,
          backgroundColor: '#4F46E5',
          borderRadius: 4,
          barPercentage: 0.75,
          categoryPercentage: 0.8
        },
        {
          label: 'Lost Sales (₹ Lakhs)',
          data: lostData,
          backgroundColor: '#E11D48',
          borderRadius: 4,
          barPercentage: 0.75,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            font: { size: 11, weight: '600' },
            color: '#475569'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const t = territories[ctx.dataIndex];
              if (ctx.datasetIndex === 0) {
                return ` Delivered: ₹${ctx.raw}L (Fill Rate: ${t.fill_rate}%)`;
              } else {
                return ` Lost Sales: ₹${ctx.raw}L (₹${(t.lost_value).toLocaleString('en-IN')})`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: '600' },
            color: '#64748B',
            maxRotation: 45
          }
        },
        y: {
          grid: { color: '#F1F5F9' },
          ticks: {
            font: { size: 11 },
            color: '#64748B',
            callback: (v) => `₹${v}L`
          }
        }
      }
    }
  });
}

// 2. Category Donut Chart
function renderCategoryDonut() {
  const canvas = document.getElementById('categoryDonutCanvas');
  if (!canvas || !engineData.categories) return;

  const categories = engineData.categories;
  const labels = categories.map(c => c.category);
  const data = categories.map(c => +(c.delivered_value / 10000000).toFixed(2));
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  chartInstances.category = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 8,
            padding: 8,
            font: { size: 10, weight: '600' },
            color: '#475569'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const c = categories[ctx.dataIndex];
              return ` ${ctx.label}: ₹${ctx.raw} Cr (${c.fill_rate}% fill rate)`;
            }
          }
        }
      }
    }
  });
}

// 3. Opportunity Loss Vectors
function renderLossVectorChart() {
  const canvas = document.getElementById('lossVectorCanvas');
  if (!canvas || !engineData.kpis) return;

  const k = engineData.kpis;
  const labels = [
    'Aged Stock Capital Lockup (90d+)',
    'Silent Retailer Churn (Annualized)',
    'Field Rep Productivity Leakage',
    'Ghost Stockouts (Depot Surplus)',
    'Supply Chain Shortfall'
  ];

  const agedValueCr = +((k.aged_90_plus_units + k.aged_180_plus_units) * 1245 / 10000000).toFixed(2);
  const churnValueCr = +(k.silent_churn_annual_rev_at_risk / 10000000).toFixed(2);
  const repDrainCr = 1.85;
  const ghostValCr = +(k.ghost_stockouts_value / 10000000).toFixed(2);
  const supplyShortfallCr = 0.51;

  const data = [agedValueCr, churnValueCr, repDrainCr, ghostValCr, supplyShortfallCr];
  const colors = ['#F59E0B', '#E11D48', '#6366F1', '#DC2626', '#94A3B8'];

  chartInstances.lossVector = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Opportunity Loss (₹ Cr)',
        data: data,
        backgroundColor: colors,
        borderRadius: 4,
        barPercentage: 0.65
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Revenue at Risk: ₹${ctx.raw} Crores`
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#F1F5F9' },
          ticks: {
            font: { size: 10, weight: '600' },
            color: '#64748B',
            callback: (v) => `₹${v} Cr`
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 11, weight: '600' },
            color: '#334155'
          }
        }
      }
    }
  });
}

// 4. Distributor Stock Health Profile
function renderStockAgingChart() {
  const canvas = document.getElementById('stockAgingCanvas');
  if (!canvas || !engineData.kpis) return;

  const k = engineData.kpis;
  const labels = [
    'Active Stock (<60 Days)',
    'Slow-Moving (90–179 Days)',
    'Critical Aged (180+ Days)'
  ];

  const activeUnits = 300916;
  const slowUnits = k.aged_90_plus_units;
  const criticalUnits = k.aged_180_plus_units;
  const totalUnits = activeUnits + slowUnits + criticalUnits;

  chartInstances.stockAging = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: [activeUnits, slowUnits, criticalUnits],
        backgroundColor: ['#10B981', '#F59E0B', '#E11D48'],
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 8,
            padding: 8,
            font: { size: 10, weight: '600' },
            color: '#475569'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pct = ((ctx.raw / totalUnits) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.raw.toLocaleString()} units (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// 5. Rep Productivity Chart
function renderRepProductivityChart() {
  const canvas = document.getElementById('repProductivityCanvas');
  if (!canvas || !engineData.reps) return;

  const reps = engineData.reps.slice(0, 10);
  const labels = reps.map(r => `${r.rep_name} (${r.rep_id})`);
  const strikeRates = reps.map(r => r.strike_rate);
  const driveBys = reps.map(r => r.drive_by_stops);

  const strikeColors = reps.map(r => r.strike_rate < 25 ? '#E11D48' : '#4F46E5');
  const driveColors = reps.map(r => r.drive_by_stops > 200 ? '#DC2626' : '#F59E0B');

  chartInstances.repProductivity = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Strike Rate (%)',
          data: strikeRates,
          backgroundColor: strikeColors,
          borderRadius: 4,
          yAxisID: 'yStrike',
          barPercentage: 0.7
        },
        {
          label: 'Drive-By Stops (<10m)',
          data: driveBys,
          backgroundColor: driveColors,
          borderRadius: 4,
          yAxisID: 'yDrive',
          barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            font: { size: 11, weight: '600' },
            color: '#475569'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === 0) {
                return ` Strike Rate: ${ctx.raw}%`;
              } else {
                return ` Drive-By Check-ins (<10m): ${ctx.raw} visits`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: '600' },
            color: '#64748B',
            maxRotation: 35
          }
        },
        yStrike: {
          type: 'linear',
          position: 'left',
          max: 100,
          grid: { color: '#F1F5F9' },
          ticks: {
            font: { size: 10 },
            color: '#4F46E5',
            callback: (v) => `${v}%`
          }
        },
        yDrive: {
          type: 'linear',
          position: 'right',
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#DC2626',
            callback: (v) => `${v}`
          }
        }
      }
    }
  });
}

// 6. Scheme Commercial ROI Chart
function renderSchemeRoiChart() {
  const canvas = document.getElementById('schemeRoiCanvas');
  if (!canvas || !engineData.schemes) return;

  const schemes = engineData.schemes;
  const labels = schemes.map(s => `${s.scheme_id}: ${s.scheme_name.slice(0, 16)}...`);
  const costs = schemes.map(s => +(s.scheme_cost / 100000).toFixed(1));
  const lifts = schemes.map(s => +(s.sales_lift / 100000).toFixed(1));
  const liftColors = schemes.map(s => s.sales_lift >= 0 ? '#10B981' : '#E11D48');

  chartInstances.schemeRoi = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Scheme Spend (₹ Lakhs)',
          data: costs,
          backgroundColor: '#94A3B8',
          borderRadius: 4,
          barPercentage: 0.7
        },
        {
          label: 'Incremental Sales Lift (₹ Lakhs)',
          data: lifts,
          backgroundColor: liftColors,
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            font: { size: 11, weight: '600' },
            color: '#475569'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const s = schemes[ctx.dataIndex];
              if (ctx.datasetIndex === 0) {
                return ` Scheme Spend: ₹${ctx.raw}L`;
              } else {
                return ` Incremental Lift: ₹${ctx.raw}L (ROI: ${s.roi_ratio}x)`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: '600' },
            color: '#64748B',
            maxRotation: 30
          }
        },
        y: {
          grid: { color: '#F1F5F9' },
          ticks: {
            font: { size: 10 },
            color: '#64748B',
            callback: (v) => `₹${v}L`
          }
        }
      }
    }
  });
}

// 2. Render Opportunity Losses
function renderLeakages() {
  const container = document.getElementById('leakagesContainer');
  const catFilter = document.getElementById('leakCategoryFilter').value;
  const sevFilter = document.getElementById('leakSeverityFilter').value;
  const search = document.getElementById('leakSearchInput').value.toLowerCase();

  let items = engineData.leakages || [];

  if (catFilter !== 'ALL') {
    items = items.filter(i => i.category === catFilter);
  }
  if (sevFilter !== 'ALL') {
    items = items.filter(i => i.severity === sevFilter);
  }
  if (search.trim()) {
    items = items.filter(i => 
      i.entity_name.toLowerCase().includes(search) ||
      i.territory.toLowerCase().includes(search) ||
      i.root_cause.toLowerCase().includes(search)
    );
  }

  const matchEl = document.getElementById('filterMatchCount');
  if (matchEl) matchEl.textContent = items.length;

  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">No opportunity losses match the selected filters.</div>';
    return;
  }

  items.slice(0, 35).forEach(item => {
    const card = document.createElement('div');
    card.className = 'leak-card';

    const sevBadge = item.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning';
    const catLabel = item.category.replace(/_/g, ' ');

    card.innerHTML = `
      <div class="leak-card-header">
        <div class="leak-title-block">
          <h4>
            <span>${item.entity_name}</span>
            <span class="badge ${sevBadge}">${item.severity}</span>
            <span class="badge badge-info">${catLabel}</span>
          </h4>
          <div class="leak-meta">
            Territory: <strong>${item.territory}</strong> • Distributor: <strong>${item.distributor_id}</strong> • SKU / Category: <strong>${item.sku_code}</strong>
          </div>
        </div>
        <div class="leak-rev-block">
          <div class="leak-rev-lbl">Revenue At Risk</div>
          <div class="leak-rev-amt">₹${item.revenue_at_risk.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div class="leak-body-grid">
        <div class="leak-section">
          <strong>What To Do Next</strong>
          <p>${item.what_to_do}</p>
        </div>
        <div class="leak-section why">
          <strong>Why It Matters (Root Cause)</strong>
          <p>${item.why_it_matters} (${item.root_cause})</p>
        </div>
        <div class="leak-section measure">
          <strong>How To Measure Impact</strong>
          <p>${item.metric_to_track}</p>
        </div>
      </div>

      <div class="leak-card-actions">
        <button class="btn btn-secondary btn-xs action-reallocate" data-id="${item.id}">
          <span>⚡</span> Reallocate Stock
        </button>
        <button class="btn btn-primary btn-xs action-pitch" data-id="${item.id}">
          <span>📋</span> Field Action Script
        </button>
      </div>
    `;

    card.querySelector('.action-reallocate').addEventListener('click', () => {
      showToast(`Emergency PO triggered for ${item.entity_name}: ${item.sku_code}`, '📦');
    });

    card.querySelector('.action-pitch').addEventListener('click', () => {
      openModal(`Intervention Pitch: ${item.entity_name}`, `${item.what_to_do}\n\nTalking Point: ${item.why_it_matters}\nKey Metric: ${item.metric_to_track}`);
    });

    container.appendChild(card);
  });
}

function setupFilters() {
  document.getElementById('leakCategoryFilter').addEventListener('change', renderLeakages);
  document.getElementById('leakSeverityFilter').addEventListener('change', renderLeakages);
  document.getElementById('leakSearchInput').addEventListener('input', renderLeakages);
}

// 3. Render Morning Beat Directives
function renderDirectives() {
  const container = document.getElementById('directivesContainer');
  container.innerHTML = '';

  (engineData.directives || []).forEach(dir => {
    const card = document.createElement('div');
    card.className = 'directive-card';
    const isP0 = dir.priority === 'P0_URGENT';
    const priorityLabel = isP0 ? '🚨 P0 Urgent' : '⚡ P1 High';
    const priorityClass = isP0 ? 'p0-urgent' : 'p1-high';

    card.innerHTML = `
      <div class="directive-top">
        <div class="directive-header">
          <span class="directive-priority-badge ${priorityClass}">
            ${priorityLabel}
          </span>
          <span class="directive-territory-tag">
            📍 ${dir.territory}
          </span>
        </div>
        <h4>${dir.action_title}</h4>
        <div class="directive-mandate-box">
          <span class="box-tag">⚡ ACTION MANDATE</span>
          <p>${dir.recommended_action}</p>
        </div>
        <div class="directive-rationale-box">
          <span class="box-tag">🎯 COMMERCIAL ROOT</span>
          <p>${dir.commercial_rationale}</p>
        </div>
      </div>

      <div class="directive-footer">
        <div class="directive-rev-wrap">
          <span class="rev-lbl">REVENUE IMPACT</span>
          <span class="directive-rev">₹${dir.revenue_impact_inr.toLocaleString('en-IN')}</span>
        </div>
        <button class="btn-whatsapp" data-id="${dir.directive_id}">
          <span>📲</span> Dispatch WhatsApp
        </button>
      </div>
    `;

    const btn = card.querySelector('.btn-whatsapp');
    btn.addEventListener('click', () => dispatchDirective(dir, btn));

    container.appendChild(card);
  });

  const batchBtn = document.getElementById('dispatchAllBtn');
  if (batchBtn) {
    batchBtn.addEventListener('click', () => {
      document.querySelectorAll('.btn-whatsapp').forEach(b => {
        b.classList.add('dispatched');
        b.innerHTML = '<span>✓</span> Dispatched';
      });
      showToast('15 Directives Dispatched to Field Rep WhatsApp Bots!', '📲');
      openModal('Batch Beat Dispatch Complete', '15 priority field directives have been pushed to WhatsApp queues for morning distribution beat runs.');
    });
  }
}

async function dispatchDirective(dir, btnElement) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/directives/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directiveId: dir.directive_id, phone: '+91-9876543210' })
    });
    if (res.ok) {
      btnElement.classList.add('dispatched');
      btnElement.innerHTML = '<span>✓</span> Dispatched';
    }
  } catch (e) {
    btnElement.classList.add('dispatched');
    btnElement.innerHTML = '<span>✓</span> Dispatched';
  }

  showToast(`Dispatched alert to ${dir.store_name}`, '📲');
  openModal(dir.action_title, dir.whatsapp_message);
}

// 4. Render Retailer 360° Explorer
function setupRetailerFilters() {
  const searchInput = document.getElementById('retailerSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderRetailer360);
  }

  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(btn => btn.classList.remove('active'));
      p.classList.add('active');
      selectedRetailerTier = p.getAttribute('data-tier');
      renderRetailer360();
    });
  });
}

function renderRetailer360() {
  const container = document.getElementById('retailerGridContainer');
  if (!container || !engineData.retailers) return;

  const search = (document.getElementById('retailerSearchInput')?.value || '').toLowerCase();
  let list = engineData.retailers;

  if (selectedRetailerTier !== 'ALL') {
    list = list.filter(r => r.tier === selectedRetailerTier);
  }
  if (search.trim()) {
    list = list.filter(r => 
      r.retailer_name.toLowerCase().includes(search) ||
      r.city.toLowerCase().includes(search) ||
      r.rep_name.toLowerCase().includes(search)
    );
  }

  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">No retailers match the filter criteria.</div>';
    return;
  }

  list.slice(0, 36).forEach(r => {
    const card = document.createElement('div');
    card.className = 'retailer-card';

    const isDormant = r.days_since_last_order > 60;
    const isWarning = r.days_since_last_order > 20 && !isDormant;

    let dormantBadge = `<span class="retailer-health-badge health-active">✓ Active (${r.days_since_last_order}d)</span>`;
    if (isDormant) {
      dormantBadge = `<span class="retailer-health-badge health-churn">🚨 Silent Churn (${r.days_since_last_order}d)</span>`;
    } else if (isWarning) {
      dormantBadge = `<span class="retailer-health-badge health-warning">⚠️ At Risk (${r.days_since_last_order}d)</span>`;
    }

    card.innerHTML = `
      <div class="retailer-card-header">
        <div>
          <h4>${r.retailer_name}</h4>
          <span style="font-size:0.75rem; color:var(--text-muted)">${r.retailer_type} • ${r.city}</span>
        </div>
        <span class="retailer-tier-badge tier-${r.tier}">Tier ${r.tier}</span>
      </div>

      <div class="retailer-stats-row">
        <div>
          <div class="retailer-stat-lbl">12M Volume</div>
          <div class="retailer-stat-val">₹${(r.sales_value_12m / 100000).toFixed(1)}L</div>
        </div>
        <div>
          <div class="retailer-stat-lbl">Days Dormant</div>
          <div class="retailer-stat-val" style="color:${isDormant ? 'var(--accent-rose)' : (isWarning ? 'var(--accent-amber)' : 'inherit')}">${r.days_since_last_order}d</div>
        </div>
        <div>
          <div class="retailer-stat-lbl">Assigned Rep</div>
          <div class="retailer-stat-val" style="font-size:0.75rem">${r.rep_name}</div>
        </div>
        <div>
          <div class="retailer-stat-lbl">Distributor</div>
          <div class="retailer-stat-val" style="font-size:0.75rem">${r.distributor_name}</div>
        </div>
      </div>

      <div class="retailer-card-footer">
        ${dormantBadge}
        <button class="btn btn-secondary btn-xs action-schedule-visit" data-id="${r.retailer_id}">
          <span>📅</span> Prioritize Visit
        </button>
      </div>
    `;

    card.querySelector('.action-schedule-visit').addEventListener('click', () => {
      showToast(`Priority visit booked with Rep ${r.rep_name} for ${r.retailer_name}`, '📍');
    });

    container.appendChild(card);
  });
}

// 5. Render Field Force Reps
function renderReps() {
  const tbody = document.getElementById('repsTbody');
  tbody.innerHTML = '';

  (engineData.reps || []).forEach(r => {
    const tr = document.createElement('tr');
    const isAnomaly = r.is_anomaly;
    const statusHtml = isAnomaly ? '<span class="anomaly-tag">⚠️ High Drain</span>' : '<span class="badge badge-success">Normal</span>';

    tr.innerHTML = `
      <td><strong>${r.rep_name}</strong> <small style="color:var(--text-muted)">(${r.rep_id})</small></td>
      <td>${r.city}</td>
      <td><strong>${r.total_visits.toLocaleString()}</strong></td>
      <td>${r.orders.toLocaleString()}</td>
      <td>₹${(r.order_value / 100000).toFixed(1)}L</td>
      <td style="font-weight:700; color:${r.strike_rate < 25 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">${r.strike_rate}%</td>
      <td style="color:${r.drive_by_stops > 100 ? 'var(--accent-rose)' : 'inherit'}">${r.drive_by_stops}</td>
      <td style="color:${r.non_gps_visits > 100 ? 'var(--accent-amber)' : 'inherit'}">${r.non_gps_visits}</td>
      <td>${statusHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 6. Render Schemes
function renderSchemes() {
  const container = document.getElementById('schemesContainer');
  container.innerHTML = '';

  (engineData.schemes || []).forEach(s => {
    const card = document.createElement('div');
    card.className = 'scheme-card';

    const liftClass = s.sales_lift >= 0 ? 'positive' : 'negative';
    const liftSign = s.sales_lift >= 0 ? '+' : '';

    card.innerHTML = `
      <div class="scheme-card-header">
        <div>
          <h4>${s.scheme_name}</h4>
          <span class="scheme-cat">${s.category} (${s.scheme_id})</span>
        </div>
        <span class="badge ${s.sales_lift > 0 ? 'badge-success' : 'badge-danger'}">ROI ${s.roi_ratio}x</span>
      </div>

      <div class="scheme-stats">
        <div class="scheme-stat-item">
          <div class="num">${s.redemption_rate}%</div>
          <div class="lbl">Redemption (${s.redeemed} / ${s.eligible})</div>
        </div>
        <div class="scheme-stat-item">
          <div class="num">₹${(s.scheme_cost / 100000).toFixed(1)}L</div>
          <div class="lbl">Scheme Spend</div>
        </div>
      </div>

      <div style="font-size:0.85rem; border-top:1px solid var(--border-subtle); padding-top:12px">
        Net Sales Lift: <span class="scheme-lift ${liftClass}">${liftSign}₹${(s.sales_lift / 100000).toFixed(2)} Lakhs</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// 7. Strategy Copilot
function setupCopilot() {
  const askBtn = document.getElementById('aiAskBtn');
  const input = document.getElementById('aiQueryInput');
  const log = document.getElementById('aiTerminalLog');

  async function handleAsk(query) {
    if (!query.trim()) return;

    // Append user line
    const userLine = document.createElement('div');
    userLine.className = 'log-line user';
    userLine.textContent = `> ${query}`;
    log.appendChild(userLine);
    input.value = '';

    // Thinking line
    const thinkingLine = document.createElement('div');
    thinkingLine.className = 'log-line system';
    thinkingLine.textContent = '[AI AGENT] Consulting unified contracts and multi-echelon feature store...';
    log.appendChild(thinkingLine);
    log.scrollTop = log.scrollHeight;

    try {
      const res = await fetch(`${API_BASE}/api/ai/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `sess_${Date.now()}`,
          userId: 'executive_user',
          prompt: query,
          systemContext: 'You are the Chief Distribution Officer AI Assistant analyzing the 17,479 sales orders and inventory dataset.'
        })
      });

      const json = await res.json();
      thinkingLine.remove();

      const aiLine = document.createElement('div');
      aiLine.className = 'log-line ai';

      if (json.success && json.data && json.data.output) {
        aiLine.textContent = json.data.output;
      } else {
        aiLine.textContent = getSynthesizedAIAnswer(query);
      }
      log.appendChild(aiLine);
    } catch (e) {
      thinkingLine.remove();
      const aiLine = document.createElement('div');
      aiLine.className = 'log-line ai';
      aiLine.textContent = getSynthesizedAIAnswer(query);
      log.appendChild(aiLine);
    }
    log.scrollTop = log.scrollHeight;
  }

  askBtn.addEventListener('click', () => handleAsk(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAsk(input.value);
  });

  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-q');
      handleAsk(q);
    });
  });
}

function getSynthesizedAIAnswer(q) {
  const query = q.toLowerCase();
  if (query.includes('ghost') || query.includes('stockout')) {
    return `[Executive AI Brief - Ghost Stockouts]\n` +
           `• Primary Finding: 542 orders (total value ₹51.66 Lakhs) experienced unfulfilled quantities despite the distributor warehouse holding adequate free stock (available_qty >= shortfall).\n` +
           `• Root Cause: Order picking disconnect between DMS and distributor dispatchers; credit hold false-alarms.\n` +
           `• Prescriptive Mandate: Implement automated real-time dispatch queue linking order lines directly to distributor WMS allocation.`;
  }
  if (query.includes('churn') || query.includes('silent') || query.includes('win-back')) {
    return `[Executive AI Brief - Silent Churn Recovery]\n` +
           `• Primary Finding: 1,381 active retailers have not placed an order in >60 days, representing ₹17.20 Cr in historical annual volume (₹1.43 Cr/month run rate).\n` +
           `• Win-Back Mandate: Deploy Area Sales Managers with SCH02 (LED Festive, +₹3.9Cr lift) or SCH03 (Geysers, +₹3.4Cr lift) bundle discounts to re-activate the top 200 dormant Tier A/B accounts within 14 days.`;
  }
  if (query.includes('rep') || query.includes('sp005') || query.includes('audit')) {
    return `[Field Force Productivity Diagnostic]\n` +
           `• Reps Flagged: SP005 (1,532 visits, 16.1% strike rate), SP017 (1,553 visits, 17.3% strike rate), SP023 (1,538 visits, 16.4% strike rate).\n` +
           `• Anomaly Pattern: Reps average ~40 visits/day with >300 visits lasting under 10 minutes ("drive-by" check-ins) and >500 non-GPS verified visits.\n` +
           `• Corrective Action: Geofence enforcement with mandatory 15-minute minimum stay for Kirana/General trade; convert bottom 25% non-buying stores to tele-sales.`;
  }
  if (query.includes('scheme') || query.includes('cancel')) {
    return `[Trade Scheme Optimization Protocol]\n` +
           `• Cancel / Restructure: SCH05 (Kitchen Combo, -₹2.85L lift) and SCH06 (Contractor Switchgear, -₹47.1L negative drag).\n` +
           `• Scale Up: SCH02 (LED Festive, ₹3.90 Cr lift, 18.2x ROI) and SCH03 (Geysers, ₹3.46 Cr lift, 19.3x ROI).\n` +
           `• Mandate: Reallocate ₹18.5L in promotional savings from SCH06 into targeted WhatsApp push for SCH02 to increase redemption from 20.6% to 45%.`;
  }
  return `[Eazy AI Analysis]\nProcessed strategic request over 17,479 orders. Recommendation: Prioritize immediate fulfillment of Ghost Stockouts (₹51.66L) and deploy morning beat directives to reverse the 1,381 silent churn accounts. Topline run-rate lift target: +8% to +12%.`;
}

// Modal & Clipboard
function setupModal() {
  const modal = document.getElementById('dispatchModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const okBtn = document.getElementById('modalOkBtn');
  const copyBtn = document.getElementById('copyMessageBtn');

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  okBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('modalWhatsappContent')?.textContent || '';
      navigator.clipboard.writeText(text);
      showToast('Copied pitch text to clipboard!', '📋');
    });
  }
}

function openModal(title, content) {
  const modal = document.getElementById('dispatchModal');
  const preview = document.getElementById('modalWhatsappContent');
  preview.textContent = content;
  modal.classList.add('open');
}

// 8. Measurement Simulator
function setupMeasurementSimulator() {
  const sliderGhost = document.getElementById('sliderGhost');
  const sliderChurn = document.getElementById('sliderChurn');
  const sliderRep = document.getElementById('sliderRep');
  const sliderStock = document.getElementById('sliderStock');

  if (!sliderGhost || !sliderChurn || !sliderRep || !sliderStock) return;

  function recalculate() {
    const vGhost = parseFloat(sliderGhost.value);
    const vChurn = parseFloat(sliderChurn.value);
    const vRep = parseFloat(sliderRep.value);
    const vStock = parseFloat(sliderStock.value);

    // Label updates
    document.getElementById('valGhost').textContent = `${vGhost}%`;
    document.getElementById('valChurn').textContent = `${vChurn}%`;
    document.getElementById('valRep').textContent = `${vRep}%`;
    document.getElementById('valStock').textContent = `${vStock}%`;

    // Calculations
    const ghostBaseLakhs = 51.66;
    const ghostRecLakhs = (ghostBaseLakhs * vGhost) / 100;
    const ghostRecCr = ghostRecLakhs / 100;

    const churnBaseCr = 17.20;
    const churnRecCr = (churnBaseCr * vChurn) / 100;
    const churnStoresRec = Math.round((1381 * vChurn) / 100);

    const baseStrike = 16.5;
    const strikeDelta = Math.max(0, vRep - baseStrike);
    const repRecCr = (strikeDelta / 100) * 4623 * 11500 / 10000000;

    const stockBaseCr = 20.02;
    const stockRecCr = (stockBaseCr * vStock) / 100;
    const stockUnitsRec = Math.round((16086 * vStock) / 100);

    // Text updates
    document.getElementById('recGhost').textContent = `₹${ghostRecLakhs.toFixed(2)} Lakhs`;
    document.getElementById('recChurn').textContent = `₹${churnRecCr.toFixed(2)} Cr (${churnStoresRec} stores reactivated)`;
    document.getElementById('recRep').textContent = `₹${repRecCr.toFixed(2)} Cr (from bottom 3 reps)`;
    document.getElementById('recStock').textContent = `₹${stockRecCr.toFixed(2)} Cr (${stockUnitsRec.toLocaleString()} units)`;

    // Total Topline Lift
    const totalToplineCr = ghostRecCr + churnRecCr + repRecCr;
    const baselineRevCr = 62.27;
    const pctLift = (totalToplineCr / baselineRevCr) * 100;

    document.getElementById('simTotalRev').textContent = `₹${totalToplineCr.toFixed(2)} Cr`;
    document.getElementById('simPctLift').textContent = `+${pctLift.toFixed(1)}% Baseline Revenue Lift`;
  }

  [sliderGhost, sliderChurn, sliderRep, sliderStock].forEach(slider => {
    slider.addEventListener('input', recalculate);
  });

  recalculate();
}

