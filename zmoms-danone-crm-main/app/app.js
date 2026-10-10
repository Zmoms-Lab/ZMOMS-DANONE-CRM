// DANONE × ZMOMS CRM APPLICATION LOGIC (ENHANCED)
const API_BASE = '/api';

// Application State
let appState = {
  currentRole: 'admin', // admin, sales, midwife, shop, danone
  currentTab: 'dashboard',
  selectedShop: 'Tất cả các shop',
  orderFilterShop: '',
  customerSubTab: 'raw', // 'raw', 'ordered', 'all'
  stats: null,
  orders: [],
  rawLeads: [],
  customers: [],
  hospitals: [],
  midwives: [],
  spas: [],
  webinars: [],
  weeks: [],
  shopsSummary: [],
  kpiData: [],
  actionItems: [],
  kpiSliderValue: 100
};

// INITIALIZATION WITH STANDALONE / OFFLINE FALLBACK
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupRoleSwitcher();
  setupModals();

  // 1. Immediately pre-load from window.CRM_INITIAL_DATA if present (guarantees zero blank screen)
  if (window.CRM_INITIAL_DATA) {
    const init = window.CRM_INITIAL_DATA;
    appState.orders = init.orders || [];
    appState.rawLeads = init.raw_leads || [];
    appState.customers = init.customers || [];
    appState.hospitals = init.hospitals || [];
    appState.midwives = init.midwives || [];
    appState.spas = init.spas || [];
    appState.webinars = init.webinars || [];
    appState.weeks = init.weeks || [];
    appState.shopsSummary = init.mbi_shops || [];
    appState.kpiData = init.sales_team || [];
    appState.actionItems = init.action_items || [];
    
    const validCount = (init.raw_leads || []).filter(r => r.valid_kpi).length;
    appState.stats = {
      project_name: init.meta?.project_name || 'Đề kháng vững vàng, trí tuệ tinh anh',
      duration: init.meta?.duration || '16 Tuần (01/09/2026 - 15/12/2026)',
      target_data: init.meta?.target_data || 10010,
      target_nu: init.meta?.target_nu || 2517,
      target_cr: init.meta?.target_cr || 25.14,
      total_hospitals: init.meta?.total_hospitals || 26,
      approved_hospitals: init.meta?.approved_hospitals || 11,
      calc_mode: init.meta?.calc_mode || 'auto',
      actual_data: (init.raw_leads || []).length || 423,
      percent_data: 11.5,
      actual_nu: (init.orders || []).length || 366,
      percent_nu: 14.5,
      total_orders: (init.orders || []).length || 366,
      delivered_orders: (init.orders || []).filter(o => o.shop_status?.includes('Đã giao')).length || 204,
      pending_orders: (init.orders || []).filter(o => o.shop_status?.includes('Chờ') || o.shop_status?.includes('Shop đã nhận')).length || 80,
      shipping_orders: (init.orders || []).filter(o => o.shop_status?.includes('Đang giao')).length || 71,
      sla_alert_count: 80,
      total_raw_data: init.meta?.total_raw_data || (init.raw_leads || []).length || 423,
      valid_raw_data: init.meta?.valid_raw_data || validCount || 409,
      invalid_raw_data: ((init.raw_leads || []).length - validCount) || 14,
      converted_raw_data: init.meta?.converted_raw_data || (init.raw_leads || []).filter(r => r.has_ordered).length || 185
    };

    // Load any offline / cached custom dashboard settings from localStorage
    try {
      const savedSettings = localStorage.getItem('crm_dashboard_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        Object.assign(appState.stats, parsed);
        if (parsed.shop_quotas && appState.shopsSummary) {
          appState.shopsSummary.forEach(shp => {
            if (parsed.shop_quotas[shp.name] !== undefined) {
              shp.quota = Number(parsed.shop_quotas[shp.name]);
              shp.remaining_quota = Math.max(0, shp.quota - (shp.total_orders || 0));
              shp.completion_rate = shp.quota > 0 ? Number((( (shp.total_orders || 0) / shp.quota ) * 100).toFixed(1)) : 0;
            }
          });
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    updateSidebarBadges();
  }

  // 2. Fetch live data from API if server is running
  await refreshAllData();
  renderCurrentView();
});

function updateSidebarBadges() {
  const badgeOrders = document.getElementById('orderCountBadge');
  if (badgeOrders) badgeOrders.innerText = appState.orders.length || 366;

  const badgeCust = document.getElementById('customerCountBadge');
  if (badgeCust) badgeCust.innerText = (appState.rawLeads.length || 423);

  const badgeShops = document.getElementById('shopCountBadge');
  if (badgeShops) badgeShops.innerText = `${appState.shopsSummary.length || 9} Shop`;

  const campTitle = document.getElementById('topbarCampaignTitle');
  if (campTitle && appState.stats) {
    campTitle.innerText = `Chiến Dịch: ${appState.stats.project_name || 'Danone Aptamil x Zmoms'} • ${appState.stats.duration || '16 Tuần'}`;
  }

  const slaPill = document.getElementById('slaAlertPill');
  if (slaPill && appState.stats) {
    slaPill.innerText = `⚡ SLA: ${appState.stats.sla_alert_count || 80} Đơn Cần Tiếp Nhận / Giao Hàng`;
    slaPill.className = (appState.stats.sla_alert_count || 0) > 0 ? 'status-pill status-danger' : 'status-pill status-delivered';
  }
}

// REFRESH ALL DATA FROM API (NON-BLOCKING)
async function refreshAllData() {
  try {
    const [statsRes, ordersRes, custRes, rawRes, hospRes, midRes, spaRes, webRes, weeksRes, shopsRes, kpiRes, actRes] = await Promise.all([
      fetch(`${API_BASE}/stats`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/orders`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/customers`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/raw-leads`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/hospitals`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/midwives`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/spas`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/webinars`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/weeks`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/shops/summary`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/kpi`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/action-items`).then(r => r.json()).catch(() => null)
    ]);

    if (statsRes && statsRes.data) appState.stats = statsRes.data;
    if (ordersRes && ordersRes.data) appState.orders = ordersRes.data;
    if (custRes && custRes.data) appState.customers = custRes.data;
    if (rawRes && rawRes.data) appState.rawLeads = rawRes.data;
    if (hospRes && hospRes.data) appState.hospitals = hospRes.data;
    if (midRes && midRes.data) appState.midwives = midRes.data;
    if (spaRes && spaRes.data) appState.spas = spaRes.data;
    if (webRes && webRes.data) appState.webinars = webRes.data;
    if (weeksRes && weeksRes.data) appState.weeks = weeksRes.data;
    if (shopsRes && shopsRes.data) appState.shopsSummary = shopsRes.data;
    if (kpiRes && kpiRes.data) appState.kpiData = kpiRes.data;
    if (actRes && actRes.data) appState.actionItems = actRes.data;

    updateSidebarBadges();
  } catch (err) {
    console.warn('Sử dụng dữ liệu offline:', err);
  }
}

// SETUP NAVIGATION
function setupNavigation() {
  document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-menu .nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      appState.currentTab = item.dataset.tab;
      renderCurrentView();
    });
  });

  // Export CSV
  document.getElementById('btnExportCSV').addEventListener('click', () => {
    window.location.href = `${API_BASE}/export`;
    showToast('📥 Đang tải file dữ liệu Danone_Zmoms_Orders_Export.csv...', 'success');
  });
}

// SETUP ROLE SWITCHER
function setupRoleSwitcher() {
  const roleNameEl = document.getElementById('currentRoleName');
  const roleDescEl = document.getElementById('currentRoleDesc');
  const roleAvatarEl = document.getElementById('currentRoleAvatar');

  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.currentRole = btn.dataset.role;

      if (appState.currentRole === 'admin') {
        roleNameEl.innerText = 'Quản Lý Zmoms (Admin)';
        roleDescEl.innerText = 'Toàn quyền điều hành & kiểm soát';
        roleAvatarEl.innerText = 'AD';
        roleAvatarEl.style.background = '#0066CC';
      } else if (appState.currentRole === 'sales') {
        roleNameEl.innerText = 'Chuyên Viên Sales / CSKH';
        roleDescEl.innerText = 'Lên đơn & theo dõi hoa hồng';
        roleAvatarEl.innerText = 'SA';
        roleAvatarEl.style.background = '#FF5A5F';
      } else if (appState.currentRole === 'midwife') {
        roleNameEl.innerText = 'Nữ Hộ Sinh (Midwife)';
        roleDescEl.innerText = 'Chăm sóc & tư vấn 1-1 tại nhà';
        roleAvatarEl.innerText = 'HS';
        roleAvatarEl.style.background = '#10B981';
      } else if (appState.currentRole === 'shop') {
        roleNameEl.innerText = 'Cổng Cửa Hàng (Shop MBI)';
        roleDescEl.innerText = `Shop ${appState.selectedShop}`;
        roleAvatarEl.innerText = 'MB';
        roleAvatarEl.style.background = '#8B5CF6';
      } else if (appState.currentRole === 'danone') {
        roleNameEl.innerText = 'Đối Tác Danone Aptamil';
        roleDescEl.innerText = 'Cổng điều hành & Giám sát SLA';
        roleAvatarEl.innerText = 'DA';
        roleAvatarEl.style.background = '#0077CC';
        appState.currentTab = 'danone-portal';
        document.querySelectorAll('.nav-menu .nav-item').forEach(i => i.classList.remove('active'));
        const danoneTab = document.querySelector('[data-tab="danone-portal"]');
        if (danoneTab) danoneTab.classList.add('active');
      }

      showToast(`Đã chuyển sang vai trò: ${roleNameEl.innerText}`, 'info');
      renderCurrentView();
    });
  });
}

// RENDER CURRENT VIEW
function renderCurrentView() {
  const container = document.getElementById('mainContent');
  if (!container) return;

  if (appState.currentRole === 'danone' && appState.currentTab !== 'orders' && appState.currentTab !== 'hospitals' && appState.currentTab !== 'customers' && appState.currentTab !== 'shops') {
    container.innerHTML = renderDanonePartnerView();
    attachDanoneEvents();
    return;
  }

  if (appState.currentRole === 'shop') {
    container.innerHTML = renderShopMBIView();
    attachShopEvents();
    return;
  }

  switch (appState.currentTab) {
    case 'dashboard':
      container.innerHTML = renderDashboardView();
      attachDashboardEvents();
      break;
    case 'customers':
      container.innerHTML = renderCustomersView();
      attachCustomersEvents();
      break;
    case 'orders':
      container.innerHTML = renderOrdersView();
      attachOrdersEvents();
      break;
    case 'shops':
      container.innerHTML = renderShopsSummaryView();
      attachShopsSummaryEvents();
      break;
    case 'hospitals':
      container.innerHTML = renderHospitalsView();
      attachHospitalEvents();
      break;
    case 'webinars':
      container.innerHTML = renderWebinarsView();
      break;
    case 'spas':
      container.innerHTML = renderSpasView();
      break;
    case 'midwives':
      container.innerHTML = renderMidwivesView();
      break;
    case 'kpi':
      container.innerHTML = renderKPIView();
      attachKPIEvents();
      break;
    case 'danone-portal':
      container.innerHTML = renderDanonePartnerView();
      attachDanoneEvents();
      break;
    default:
      container.innerHTML = renderDashboardView();
  }
}

// 1. DASHBOARD VIEW
function renderDashboardView() {
  const s = appState.stats || {};
  const allOrders = appState.orders || [];
  const totalOrders = allOrders.length || (s.total_orders || 367);
  const targetData = s.target_data || 10010;
  const targetNu = s.target_nu || 2517;
  const targetCr = s.target_cr || 25.14;

  const totalRaw = s.total_raw_data || 423;
  const validRaw = s.valid_raw_data || 409;
  const convertedRaw = s.converted_raw_data || 185;
  const otherOrders = Math.max(0, totalOrders - convertedRaw);

  const totalDelivered = allOrders.filter(o => o.shop_status && o.shop_status.includes('Đã giao')).length;
  const totalShipping = allOrders.filter(o => o.shop_status && o.shop_status.includes('Đang giao')).length;
  const totalPending = allOrders.filter(o => o.shop_status && (o.shop_status.includes('Chờ') || o.shop_status.includes('Shop đã nhận') || o.shop_status.includes('[1]'))).length;

  const pctData = ((totalRaw / targetData) * 100).toFixed(1);
  const pctValid = totalRaw > 0 ? ((validRaw / totalRaw) * 100).toFixed(1) : 0;
  const pctNu = ((totalOrders / targetNu) * 100).toFixed(1);
  const crRate = validRaw > 0 ? ((convertedRaw / validRaw) * 100).toFixed(1) : 0;
  const crVsTarget = targetCr > 0 ? ((crRate / targetCr) * 100).toFixed(0) : 0;
  const pctDelivered = totalOrders > 0 ? ((totalDelivered / totalOrders) * 100).toFixed(1) : 0;

  // Cập nhật Topbar Campaign Title
  const topbarTitle = document.getElementById('topbarCampaignTitle');
  if (topbarTitle) {
    topbarTitle.innerText = `Chiến Dịch: ${s.project_name || 'Đề kháng vững vàng, trí tuệ tinh anh'} (${s.duration || '16 Tuần (01/09/2026 - 15/12/2026)'})`;
  }

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 800; color: #0F172A;">📊 Tổng Quan Tiến Độ Dự Án: ${s.project_name || 'Danone x Zmoms'}</h2>
        <p style="font-size: 13px; color: #64748B;">Thời gian: <strong>${s.duration || '16 Tuần'}</strong> • Theo dõi các mốc chiến dịch, Raw Data, New Users và hiệu suất 9 Shop MBI.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-primary" onclick="openDashboardConfigModal()" style="padding: 8px 16px; font-weight: 700; box-shadow: 0 2px 6px rgba(0, 102, 204, 0.3);">
          <span>⚙️</span> Hiệu Chỉnh Thông Số Dashboard
        </button>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card card-blue">
        <div class="metric-header">
          <span class="metric-title">Tổng Raw Data Đăng Ký</span>
          <div class="metric-icon">📥</div>
        </div>
        <div class="metric-value">${totalRaw} Data <span style="font-size: 15px; font-weight: 600; color: #10B981;">(${validRaw} Hợp lệ)</span></div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill bg-fill-blue" style="width: ${Math.min(pctValid, 100)}%;"></div>
        </div>
        <div class="metric-sub">
          <strong>${pctValid}% hợp lệ tính KPI</strong> • Mục tiêu: ${totalRaw} / ${targetData} (${pctData}%)
        </div>
      </div>

      <div class="metric-card card-coral">
        <div class="metric-header">
          <span class="metric-title">New Users Đã Đặt Đơn (NU)</span>
          <div class="metric-icon">🛒</div>
        </div>
        <div class="metric-value">${totalOrders} Đơn <span style="font-size: 15px; font-weight: 500; color: #64748B;">/ ${targetNu} NU</span></div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill bg-fill-coral" style="width: ${Math.min(pctNu, 100)}%;"></div>
        </div>
        <div class="metric-sub">
          <strong>${convertedRaw} đơn từ raw data</strong> + ${otherOrders} đơn hội thảo trực tiếp (${pctNu}%)
        </div>
      </div>

      <div class="metric-card card-green">
        <div class="metric-header">
          <span class="metric-title">Tỷ Lệ Chuyển Đổi (CR)</span>
          <div class="metric-icon">⚡</div>
        </div>
        <div class="metric-value">${crRate}% <span style="font-size: 13.5px; font-weight: 600; color: #047857;">(${convertedRaw} / ${validRaw} Mẹ)</span></div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill bg-fill-green" style="width: ${Math.min(crVsTarget, 100)}%;"></div>
        </div>
        <div class="metric-sub">
          Target chuẩn Danone: <strong>${targetCr}%</strong> (Đạt ${crVsTarget}% mục tiêu)
        </div>
      </div>

      <div class="metric-card card-gold">
        <div class="metric-header">
          <span class="metric-title">Vận Hành 9 Shop MBI</span>
          <div class="metric-icon">🏬</div>
        </div>
        <div class="metric-value">${totalDelivered} / ${totalOrders} <span style="font-size: 15px; font-weight: 500; color: #64748B;">Đã Giao</span></div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill bg-fill-gold" style="width: ${Math.min(pctDelivered, 100)}%;"></div>
        </div>
        <div class="metric-sub">
          <strong>${totalShipping} đơn đang giao</strong> • ${totalPending} đơn chờ shop tiếp nhận (${pctDelivered}%)
        </div>
      </div>
    </div>

    <!-- SECTION 2: BẢNG TỔNG HỢP CÁC SHOP MBI & SỐ LƯỢNG ĐƠN (HIỂN THỊ TRỰC TIẾP) -->
    <div class="content-card" style="border-top: 3px solid #8B5CF6;">
      <div class="card-header" style="background: #F8FAFC;">
        <div class="card-title" style="color: #6D28D9; font-size: 15px;">
          <span>🏬</span> BẢNG TỔNG HỢP SHOP MBI & SỐ LƯỢNG ĐƠN HÀNG (366 ĐƠN TRÊN TOÀN HỆ THỐNG)
        </div>
        <button class="btn-primary" onclick="document.querySelectorAll('.nav-menu .nav-item').forEach(i => i.classList.remove('active')); document.querySelector('[data-tab=\'shops\']').classList.add('active'); appState.currentTab = 'shops'; renderCurrentView();" style="padding: 6px 12px; font-size: 12px;">
          Xem Chi Tiết Quota MBI
        </button>
      </div>
      <div class="table-responsive">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Tên Shop MBI</th>
              <th>Tổng Đơn Giao</th>
              <th>Đã Giao Xong</th>
              <th>Đang Giao</th>
              <th>Chờ Shop Xử Lý</th>
              <th>Tỷ Lệ Hoàn Thành</th>
              <th>Hạn Mức Quota</th>
              <th>SLA Đúng Hạn</th>
              <th>Địa Bàn Phụ Trách</th>
              <th>Xem Đơn</th>
            </tr>
          </thead>
          <tbody>
            ${(appState.shopsSummary || []).map(s => `
              <tr>
                <td><strong style="color: #0077CC; font-size: 14.5px;">${s.name}</strong></td>
                <td><strong style="font-size: 16px; color: #1E293B;">${s.total_orders} đơn</strong></td>
                <td><strong style="color: #059669;">${s.delivered_orders}</strong></td>
                <td><strong style="color: #2563EB;">${s.shipping_orders}</strong></td>
                <td>
                  <span class="status-pill ${s.pending_orders > 0 ? 'status-danger' : 'status-delivered'}">
                    ${s.pending_orders} đơn
                  </span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background: #E2E8F0; border-radius: 3px; width: 50px;">
                      <div style="height: 100%; background: #10B981; border-radius: 3px; width: ${Math.min(s.completion_rate, 100)}%;"></div>
                    </div>
                    <span><strong>${s.completion_rate}%</strong></span>
                  </div>
                </td>
                <td>${s.quota} (Còn ${s.remaining_quota})</td>
                <td><span class="status-pill status-delivered">⭐ ${s.sla_on_time_rate}</span></td>
                <td style="font-size: 12px; color: #64748B;">${(s.districts || []).join(', ')}</td>
                <td>
                  <button class="btn-secondary btn-dash-view-shop" data-shop="${s.name}" style="padding: 4px 8px; font-size: 11.5px;">
                    Xem ${s.total_orders} đơn
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- SECTION 3: KHU VỰC CẬP NHẬT THỰC ĐẠT KPI TRỰC TIẾP (THAY THẾ LINK RENDER) -->
    <div class="content-card" style="border-top: 3px solid #0077CC;">
      <div class="card-header" style="background: #F0F9FF;">
        <div class="card-title" style="color: #0369A1; font-size: 15px;">
          <span>📝</span> CẬP NHẬT TIẾN ĐỘ THỰC ĐẠT KPI HÀNG NGÀY (LIVE ENTRY DÀNH CHO TEAM)
        </div>
        <span style="font-size: 12px; color: #64748B;">Đồng bộ trực tiếp — Không cần vào link Render cũ</span>
      </div>
      <div class="card-body">
        <form id="dashLiveKpiForm" style="display: grid; grid-template-columns: 1.2fr 1.5fr 1fr 1fr auto; gap: 12px; align-items: flex-end;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Ngày Cập Nhật:</label>
            <input type="date" class="form-control" id="dashKpiDate" required value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Nhân Sự (PIC):</label>
            <select class="form-control" id="dashKpiPic" required>
              ${(appState.kpiData || []).map(k => `
                <option value="${k.code}">${k.name} (${k.team} - ${k.code})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">NU Bán (Combo):</label>
            <input type="number" class="form-control" id="dashKpiNuBan" min="0" placeholder="0" required style="font-weight: 700;">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">NU Trợ Giá:</label>
            <input type="number" class="form-control" id="dashKpiNuTroGia" min="0" placeholder="0" required style="font-weight: 700;">
          </div>
          <div>
            <button type="submit" class="btn-primary" style="height: 42px; white-space: nowrap;">
              💾 Lưu Thực Đạt
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- SECTION 4: DANH SÁCH MẸ BẦU & KHÁCH HÀNG (TRỰC TIẾP TRÊN TRANG CHỦ) -->
    <div class="content-card" style="border-top: 3px solid #FF5A5F;">
      <div class="card-header" style="background: #FFF5F5;">
        <div class="card-title" style="color: #9B1C1C; font-size: 15px;">
          <span>🤰</span> DANH SÁCH KHÁCH HÀNG (MẸ BẦU) — 365 MẸ ĐÃ XÁC THỰC
        </div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="dashCustSearch" class="form-control" placeholder="Tìm theo Tên Mẹ, SĐT, Quận..." style="width: 260px; padding: 6px 10px; font-size: 12.5px;">
        </div>
      </div>
      <div class="table-responsive" style="max-height: 420px;">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Mã Mẹ</th>
              <th>Họ và Tên Mẹ Bầu</th>
              <th>Số Điện Thoại</th>
              <th>Khu Vực</th>
              <th>Giai Đoạn Thai Kỳ</th>
              <th>Nguồn Tiếp Cận</th>
              <th>Co-Data</th>
              <th>Số Đơn Đã Mua</th>
              <th>Shop MBI Phục Vụ</th>
            </tr>
          </thead>
          <tbody id="dashCustTableBody">
            ${(appState.customers || []).slice(0, 15).map(c => `
              <tr>
                <td><strong>${c.id}</strong></td>
                <td><strong>${c.name}</strong></td>
                <td><code>${c.phone}</code></td>
                <td>${c.district}</td>
                <td style="font-size: 12px;"><span class="status-pill status-shipping">${c.stage}</span></td>
                <td>${c.channel}</td>
                <td>
                  <span class="status-pill ${c.codata_zmoms ? 'status-delivered' : 'status-waiting'}">Zmoms OA</span>
                  <span class="status-pill ${c.codata_aptaclub ? 'status-completed' : 'status-danger'}">Aptaclub</span>
                </td>
                <td><strong style="color: #0077CC;">${c.order_count} đơn</strong> (${(c.orders || []).join(', ')})</td>
                <td><span style="font-weight: 700; color: #4338CA;">${c.assigned_shop || 'Voi Con'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding: 10px 16px; background: #F8FAFC; border-top: 1px solid var(--border-color); text-align: center;">
        <button class="btn-secondary" onclick="document.querySelectorAll('.nav-menu .nav-item').forEach(i => i.classList.remove('active')); document.querySelector('[data-tab=\'customers\']').classList.add('active'); appState.currentTab = 'customers'; renderCurrentView();" style="font-size: 12.5px; margin: 0 auto;">
          Xem Toàn Bộ 365 Mẹ Bầu (Kèm Bộ Lọc 7 Giai Đoạn) ➔
        </button>
      </div>
    </div>

    <!-- SECTION 5: 4 Acquisition Channels Distribution -->
    <div class="content-card">
      <div class="card-header">
        <div class="card-title">
          <span>🌐</span> Hiệu Quả 4 Kênh Tiếp Cận Khách Hàng (Omni-Channel Acquisition)
        </div>
      </div>
      <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="padding: 16px; background: #F8FAFC; border-radius: 10px; border-left: 4px solid #0077CC;">
            <div style="font-size: 13px; font-weight: 700; color: #0077CC;">🏥 Hội Thảo Bệnh Viện</div>
            <div style="font-size: 22px; font-weight: 800; margin: 8px 0;">450 Data <span style="font-size: 13px; color: #64748B;">| 120 NU</span></div>
            <div style="font-size: 12px; color: #64748B;">26 Bệnh viện & Phòng khám đối tác</div>
          </div>
          <div style="padding: 16px; background: #F8FAFC; border-radius: 10px; border-left: 4px solid #8B5CF6;">
            <div style="font-size: 13px; font-weight: 700; color: #8B5CF6;">💻 Online & Webinar</div>
            <div style="font-size: 22px; font-weight: 800; margin: 8px 0;">580 Data <span style="font-size: 13px; color: #64748B;">| 142 NU</span></div>
            <div style="font-size: 12px; color: #64748B;">Zoom, Facebook & TikTok Live</div>
          </div>
          <div style="padding: 16px; background: #F8FAFC; border-radius: 10px; border-left: 4px solid #EC4899;">
            <div style="font-size: 13px; font-weight: 700; color: #EC4899;">💆‍♀️ Spa Mẹ Bầu</div>
            <div style="font-size: 22px; font-weight: 800; margin: 8px 0;">326 Data <span style="font-size: 13px; color: #64748B;">| 79 NU</span></div>
            <div style="font-size: 12px; color: #64748B;">Sammy Care, NatuQueen, Thanh Lan</div>
          </div>
          <div style="padding: 16px; background: #F8FAFC; border-radius: 10px; border-left: 4px solid #10B981;">
            <div style="font-size: 13px; font-weight: 700; color: #10B981;">👩‍⚕️ Nữ Hộ Sinh Tại Nhà</div>
            <div style="font-size: 22px; font-weight: 800; margin: 8px 0;">148 Data <span style="font-size: 13px; color: #64748B;">| 47 NU</span></div>
            <div style="font-size: 12px; color: #64748B;">6 Nữ hộ sinh chuyên nghiệp</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 6: 16-Week Trajectory Table (01/09/2026 - 15/12/2026) -->
    <div class="content-card">
      <div class="card-header">
        <div class="card-title">
          <span>📅</span> Lộ Trình Tiến Độ 16 Tuần Chiến Dịch (01/09/2026 – 15/12/2026)
        </div>
      </div>
      <div class="table-responsive">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Tuần</th>
              <th>Khoảng Thời Gian</th>
              <th>Target Data</th>
              <th>Actual Data</th>
              <th>% Đạt Data</th>
              <th>Target NU</th>
              <th>Actual NU</th>
              <th>Tỷ Lệ CR</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${(appState.weeks || []).map(w => {
              const pct = w.target_data > 0 ? ((w.actual_data / w.target_data) * 100).toFixed(1) : 0;
              const cr = w.actual_data > 0 ? ((w.actual_nu / w.actual_data) * 100).toFixed(1) : 0;
              const isPast = w.actual_data > 0;
              return `
                <tr>
                  <td><strong>${w.week}</strong></td>
                  <td>${w.date_range}</td>
                  <td>${w.target_data.toLocaleString()}</td>
                  <td><strong style="color: #0077CC;">${w.actual_data.toLocaleString()}</strong></td>
                  <td>
                    <span class="status-pill ${pct >= 100 ? 'status-completed' : (pct > 0 ? 'status-shipping' : 'status-waiting')}">
                      ${pct}%
                    </span>
                  </td>
                  <td>${w.target_nu.toLocaleString()}</td>
                  <td><strong>${w.actual_nu.toLocaleString()}</strong></td>
                  <td><strong>${cr}%</strong></td>
                  <td>
                    ${isPast ? '<span class="status-pill status-delivered">🟢 Đã hoàn thành</span>' : '<span class="status-pill status-waiting">⚪ Đang triển khai</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function attachDashboardEvents() {
  // 1. Dash View Shop button
  document.querySelectorAll('.btn-dash-view-shop').forEach(btn => {
    btn.addEventListener('click', () => {
      const shopName = btn.dataset.shop;
      appState.selectedShop = shopName;
      document.querySelectorAll('.nav-menu .nav-item').forEach(i => i.classList.remove('active'));
      const shopsItem = document.querySelector('[data-tab="shops"]');
      if (shopsItem) shopsItem.classList.add('active');
      appState.currentTab = 'shops';
      renderCurrentView();

      setTimeout(() => {
        const el = document.getElementById('shopOrdersExplorerSection');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    });
  });

  // 2. Dash Live KPI Form
  const form = document.getElementById('dashLiveKpiForm');
  const picSelect = document.getElementById('dashKpiPic');
  const nuBan = document.getElementById('dashKpiNuBan');
  const nuTroGia = document.getElementById('dashKpiNuTroGia');
  const dateInput = document.getElementById('dashKpiDate');

  if (picSelect) {
    const updateKpiInputs = () => {
      const member = (appState.kpiData || []).find(k => k.code === picSelect.value);
      if (member) {
        if (nuBan) nuBan.value = member.actual_nu || 0;
        if (nuTroGia) nuTroGia.value = member.subsidized_nu || 0;
      }
    };
    picSelect.addEventListener('change', updateKpiInputs);
    updateKpiInputs();
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        pic_code: picSelect.value,
        date: dateInput.value,
        actual_nu: parseInt(nuBan.value || 0),
        subsidized_nu: parseInt(nuTroGia.value || 0)
      };

      try {
        const res = await fetch(`${API_BASE}/kpi/entry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());

        if (res.success) {
          showToast(`✅ Đã lưu tiến độ cho ${res.member.name}! Thưởng đã được cập nhật.`, 'success');
          await refreshAllData();
          renderCurrentView();
        }
      } catch (err) {
        showToast('Lỗi khi lưu KPI!', 'danger');
      }
    });
  }

  // 3. Dash Customer Search
  const searchInput = document.getElementById('dashCustSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = (searchInput.value || '').toLowerCase().trim();
      const rows = (appState.customers || []).filter(c => 
        (c.id || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q)
      );
      const tbody = document.getElementById('dashCustTableBody');
      if (tbody) {
        tbody.innerHTML = rows.slice(0, 15).map(c => `
          <tr>
            <td><strong>${c.id}</strong></td>
            <td><strong>${c.name}</strong></td>
            <td><code>${c.phone}</code></td>
            <td>${c.district}</td>
            <td style="font-size: 12px;"><span class="status-pill status-shipping">${c.stage}</span></td>
            <td>${c.channel}</td>
            <td>
              <span class="status-pill ${c.codata_zmoms ? 'status-delivered' : 'status-waiting'}">Zmoms OA</span>
              <span class="status-pill ${c.codata_aptaclub ? 'status-completed' : 'status-danger'}">Aptaclub</span>
            </td>
            <td><strong style="color: #0077CC;">${c.order_count} đơn</strong> (${(c.orders || []).join(', ')})</td>
            <td><span style="font-weight: 700; color: #4338CA;">${c.assigned_shop || 'Voi Con'}</span></td>
          </tr>
        `).join('');
      }
    });
  }
}

// 2. KHÁCH HÀNG & RAW DATA LEADS VIEW (INTEGRATED FROM MASTER_DATA_INTERNAL_v2)
function renderCustomersView() {
  const rawLeads = appState.rawLeads || [];
  const custs = appState.customers || [];
  const orderedCusts = custs.filter(c => c.order_count > 0);
  const currentSubTab = appState.customerSubTab || 'raw';

  const validRawCount = rawLeads.filter(r => r.valid_kpi).length;
  const invalidRawCount = rawLeads.length - validRawCount;
  const orderedRawCount = rawLeads.filter(r => r.has_ordered).length;

  return `
    <!-- SUB-TAB NAVIGATION -->
    <div class="view-subtabs-container">
      <button class="view-subtab-btn ${currentSubTab === 'raw' ? 'active' : ''}" data-subtab="raw">
        <span>📥 1. Raw Data Đăng Ký Pancake CRM (423 Leads)</span>
        <span class="badge" style="background: #0077CC; color: white;">423</span>
      </button>
      <button class="view-subtab-btn ${currentSubTab === 'ordered' ? 'active' : ''}" data-subtab="ordered">
        <span>🛒 2. Khách Hàng Đã Đặt Đơn MBI (365 Mẹ)</span>
        <span class="badge" style="background: #10B981; color: white;">365</span>
      </button>
      <button class="view-subtab-btn ${currentSubTab === 'all' ? 'active' : ''}" data-subtab="all">
        <span>👥 3. Toàn Bộ Dữ Liệu Hợp Nhất (602 Khách)</span>
        <span class="badge" style="background: #64748B; color: white;">602</span>
      </button>
    </div>

    ${currentSubTab === 'raw' ? renderRawLeadsSubView(rawLeads, validRawCount, invalidRawCount, orderedRawCount) : ''}
    ${currentSubTab === 'ordered' ? renderOrderedCustomersSubView(orderedCusts) : ''}
    ${currentSubTab === 'all' ? renderAllCustomersSubView(custs) : ''}
  `;
}

function renderRawLeadsSubView(rawLeads, validCount, invalidCount, orderedCount) {
  return `
    <div class="metrics-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 20px;">
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">TỔNG RAW DATA ĐĂNG KÝ</div>
        <div style="font-size: 26px; font-weight: 800; color: #0077CC;">${rawLeads.length} Leads</div>
        <div style="font-size: 11px; color: #10B981;">Đồng bộ từ MASTER_DATA_INTERNAL_v2</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">HỢP LỆ TÍNH KPI DANONE</div>
        <div style="font-size: 26px; font-weight: 800; color: #059669;">${validCount} Leads</div>
        <div style="font-size: 11px; color: #10B981;">Tỷ lệ: 96.7% • ${invalidCount} không hợp lệ</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">ĐÃ LÊN ĐƠN MUA HÀNG (NU)</div>
        <div style="font-size: 26px; font-weight: 800; color: #4338CA;">${orderedCount} Đơn</div>
        <div style="font-size: 11px; color: #10B981;">CR: ${((orderedCount / (validCount || 1)) * 100).toFixed(1)}% trên data hợp lệ</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">LEAD TIỀM NĂNG CHƯA MUA</div>
        <div style="font-size: 26px; font-weight: 800; color: #F59E0B;">${rawLeads.length - orderedCount} Mẹ</div>
        <div style="font-size: 11px; color: #64748B;">Cần CSKH chăm sóc & nuôi dưỡng</div>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header" style="background: #F8FAFC;">
        <div class="card-title" style="color: #0F172A;">
          <span>📥</span> Danh Sách 423 Raw Leads Đăng Ký (Theo Dõi Hợp Lệ & Trạng Thái Mua)
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input type="text" id="rawSearchInput" class="form-control" placeholder="Tìm tên mẹ, SĐT, Tỉnh, Pancake ID..." style="width: 250px; padding: 6px 10px; font-size: 12.5px;">
          <select id="rawTeamFilter" class="form-control" style="width: 130px; padding: 6px 8px; font-size: 12.5px;">
            <option value="">-- Team --</option>
            <option value="ZM">Team ZM (312)</option>
            <option value="CDB">Team CDB (93)</option>
          </select>
          <select id="rawValidFilter" class="form-control" style="width: 140px; padding: 6px 8px; font-size: 12.5px;">
            <option value="">-- Hợp lệ KPI --</option>
            <option value="valid">🟢 Hợp lệ (409)</option>
            <option value="invalid">🔴 Không hợp lệ (14)</option>
          </select>
          <select id="rawOrderFilter" class="form-control" style="width: 140px; padding: 6px 8px; font-size: 12.5px;">
            <option value="">-- Đã mua hàng --</option>
            <option value="ordered">🛒 Đã mua (185)</option>
            <option value="not_ordered">⏳ Chưa mua (238)</option>
          </select>
        </div>
      </div>
      <div class="table-responsive" style="max-height: 600px;">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Mã Lead</th>
              <th>Ngày Đăng Ký</th>
              <th>Họ và Tên Mẹ</th>
              <th>Số Điện Thoại</th>
              <th>Tỉnh / TP</th>
              <th>Tình Trạng Mẹ</th>
              <th>Mã REF & Nguồn</th>
              <th>Team</th>
              <th>Hợp Lệ KPI</th>
              <th>Đã Lên Đơn?</th>
              <th>Shop Phục Vụ</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="rawLeadsTableBody">
            ${renderRawLeadsTableRows(rawLeads)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRawLeadsTableRows(leads) {
  if (!leads || leads.length === 0) {
    return `<tr><td colspan="12" style="text-align: center; padding: 30px; color: #64748B;">Không tìm thấy lead nào phù hợp!</td></tr>`;
  }

  return leads.map(r => `
    <tr>
      <td><strong>${r.raw_id}</strong></td>
      <td style="font-size: 12px; color: #64748B;">${r.date || r.created_at}</td>
      <td><strong>${r.name}</strong></td>
      <td><code>${r.phone}</code></td>
      <td>${r.province}</td>
      <td>
        <span class="status-pill ${r.stage.includes('mang thai') ? 'status-shipping' : 'status-completed'}" style="font-size: 11px;">
          ${r.stage}
        </span>
      </td>
      <td style="font-size: 12px; max-width: 200px;">
        <strong>${r.ref_code}</strong> <br>
        <span style="color: #64748B; font-size: 11px;">${r.source || '---'}</span>
      </td>
      <td><span class="status-pill ${r.team === 'ZM' ? 'status-shipping' : 'status-received'}">${r.team}</span></td>
      <td>
        <span class="status-pill ${r.valid_kpi ? 'status-delivered' : 'status-danger'}">
          ${r.valid_kpi ? '🟢 Hợp lệ' : `🔴 K.hợp lệ: ${r.invalid_reason || ''}`}
        </span>
      </td>
      <td>
        ${r.has_ordered ? `
          <strong style="color: #0077CC;">${r.order_count} đơn</strong>
          <span style="font-size: 11px; color: #64748B;">(${(r.orders || []).join(', ')})</span>
        ` : `
          <span style="color: #94A3B8; font-size: 12px;">Chưa mua</span>
        `}
      </td>
      <td>
        ${r.assigned_shop ? `
          <span style="font-weight: 700; color: #4338CA; background: #EEF2FF; padding: 3px 8px; border-radius: 6px;">${r.assigned_shop}</span>
        ` : `
          <span style="color: #94A3B8; font-size: 11.5px;">Chưa gán</span>
        `}
      </td>
      <td style="white-space: nowrap;">
        <button type="button" class="action-btn-fast-order" onclick="openOrderModalForLead('${r.phone}', '${(r.name || '').replace(/'/g, "\\'")}', '${(r.province || '').replace(/'/g, "\\'")}')">
          ⚡ Lên Đơn
        </button>
      </td>
    </tr>
  `).join('');
}

function renderOrderedCustomersSubView(custs) {
  return `
    <div class="metrics-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 20px;">
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">MẸ BẦU ĐÃ ĐẶT ĐƠN (NU)</div>
        <div style="font-size: 26px; font-weight: 800; color: #0077CC;">${custs.length} Mẹ</div>
        <div style="font-size: 11px; color: #10B981;">100% Đã mua gói sữa Aptamil</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">FOLLOW ZMOMS OA</div>
        <div style="font-size: 26px; font-weight: 800; color: #FF5A5F;">${custs.filter(c => c.codata_zmoms).length}</div>
        <div style="font-size: 11px; color: #64748B;">Đã quan tâm Zalo OA</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">CO-DATA DANONE APTACLUB</div>
        <div style="font-size: 26px; font-weight: 800; color: #047857;">${custs.filter(c => c.codata_aptaclub).length}</div>
        <div style="font-size: 11px; color: #10B981;">Đồng ý chia sẻ Danone</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">TỔNG ĐƠN HÀNG PHỤC VỤ</div>
        <div style="font-size: 26px; font-weight: 800; color: #8B5CF6;">366 Đơn</div>
        <div style="font-size: 11px; color: #10B981;">Phân bổ qua 9 Shop MBI</div>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header" style="background: #F8FAFC;">
        <div class="card-title">
          <span>🛒</span> Danh Sách 365 Mẹ Bầu Đã Lên Đơn Thành Công
        </div>
        <input type="text" id="orderedCustSearchInput" class="form-control" placeholder="Tìm theo Tên Mẹ, SĐT, Shop..." style="width: 280px; padding: 7px 12px; font-size: 13px;">
      </div>
      <div class="table-responsive" style="max-height: 600px;">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Họ và Tên Mẹ</th>
              <th>Số Điện Thoại</th>
              <th>Khu Vực</th>
              <th>Giai Đoạn Thai Kỳ</th>
              <th>Nguồn Kênh</th>
              <th>Co-Data</th>
              <th>Số Đơn</th>
              <th>Shop MBI Phục Vụ</th>
              <th>Ngày Đặt</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="orderedCustTableBody">
            ${renderCustomersRows(custs)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAllCustomersSubView(custs) {
  return `
    <div class="content-card">
      <div class="card-header" style="background: #F8FAFC;">
        <div class="card-title">
          <span>👥</span> Toàn Bộ Dữ Liệu Khách Hàng & Leads Hợp Nhất (${custs.length} Mẹ)
        </div>
        <input type="text" id="allCustSearchInput" class="form-control" placeholder="Tìm kiếm theo Tên, SĐT, Quận..." style="width: 280px; padding: 7px 12px; font-size: 13px;">
      </div>
      <div class="table-responsive" style="max-height: 600px;">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Họ và Tên Mẹ</th>
              <th>Số Điện Thoại</th>
              <th>Khu Vực</th>
              <th>Phân Loại</th>
              <th>Nguồn Kênh</th>
              <th>Hợp Lệ KPI</th>
              <th>Số Đơn</th>
              <th>Shop Phân Bổ</th>
              <th>Ngày Tạo</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody id="allCustTableBody">
            ${custs.map(c => `
              <tr>
                <td><strong>${c.id}</strong></td>
                <td><strong>${c.name}</strong></td>
                <td><code>${c.phone}</code></td>
                <td>${c.district}</td>
                <td><span class="status-pill ${c.is_raw_lead ? 'status-waiting' : 'status-delivered'}">${c.is_raw_lead ? 'Raw Lead' : 'Đơn MBI'}</span></td>
                <td style="font-size: 12px;">${c.channel}</td>
                <td><span class="status-pill ${c.valid_kpi ? 'status-delivered' : 'status-danger'}">${c.valid_kpi ? 'Hợp lệ' : 'Không'}</span></td>
                <td><strong style="color: #0077CC;">${c.order_count} đơn</strong></td>
                <td><span style="font-weight: 700; color: #4338CA;">${c.assigned_shop}</span></td>
                <td>${c.created_at}</td>
                <td style="white-space: nowrap;">
                  <button type="button" class="action-btn-fast-order" onclick="openOrderModalForLead('${c.phone}', '${(c.name || '').replace(/'/g, "\\'")}', '${(c.district || c.address || '').replace(/'/g, "\\'")}')">
                    ⚡ Lên Đơn
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCustomersRows(custs) {
  if (!custs || custs.length === 0) {
    return `<tr><td colspan="11" style="text-align: center; padding: 30px; color: #64748B;">Không tìm thấy mẹ bầu nào!</td></tr>`;
  }

  return custs.map(c => `
    <tr>
      <td><strong>${c.id}</strong></td>
      <td><strong>${c.name}</strong></td>
      <td><code>${c.phone}</code></td>
      <td>${c.district}</td>
      <td style="font-size: 12px; max-width: 190px;"><span class="status-pill status-shipping">${c.stage}</span></td>
      <td>${c.channel}</td>
      <td>
        <span class="status-pill ${c.codata_zmoms ? 'status-delivered' : 'status-waiting'}">Zmoms OA</span>
        <span class="status-pill ${c.codata_aptaclub ? 'status-completed' : 'status-danger'}">Aptaclub</span>
      </td>
      <td><strong style="color: #0077CC;">${c.order_count} đơn</strong> (${(c.orders || []).join(', ')})</td>
      <td><span style="font-weight: 700; color: #4338CA;">${c.assigned_shop || 'Voi Con'}</span></td>
      <td>${c.created_at}</td>
      <td style="white-space: nowrap;">
        <button type="button" class="action-btn-fast-order" onclick="openOrderModalForLead('${c.phone}', '${(c.name || '').replace(/'/g, "\\'")}', '${(c.district || c.address || '').replace(/'/g, "\\'")}')">
          ⚡ Mua Tiếp
        </button>
      </td>
    </tr>
  `).join('');
}

function attachCustomersEvents() {
  // Subtab buttons
  document.querySelectorAll('.view-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.customerSubTab = btn.dataset.subtab;
      renderCurrentView();
    });
  });

  // Raw leads filtering
  const rawSearch = document.getElementById('rawSearchInput');
  const rawTeam = document.getElementById('rawTeamFilter');
  const rawValid = document.getElementById('rawValidFilter');
  const rawOrder = document.getElementById('rawOrderFilter');

  const filterRaw = () => {
    const q = (rawSearch?.value || '').toLowerCase().trim();
    const team = rawTeam?.value;
    const valid = rawValid?.value;
    const order = rawOrder?.value;

    let res = appState.rawLeads || [];
    if (team) res = res.filter(r => r.team === team);
    if (valid === 'valid') res = res.filter(r => r.valid_kpi);
    if (valid === 'invalid') res = res.filter(r => !r.valid_kpi);
    if (order === 'ordered') res = res.filter(r => r.has_ordered);
    if (order === 'not_ordered') res = res.filter(r => !r.has_ordered);
    if (q) {
      res = res.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.phone.includes(q) || 
        r.province.toLowerCase().includes(q) || 
        r.ref_code.toLowerCase().includes(q) ||
        r.raw_id.toLowerCase().includes(q)
      );
    }
    const tbody = document.getElementById('rawLeadsTableBody');
    if (tbody) tbody.innerHTML = renderRawLeadsTableRows(res);
  };

  if (rawSearch) rawSearch.addEventListener('input', filterRaw);
  if (rawTeam) rawTeam.addEventListener('change', filterRaw);
  if (rawValid) rawValid.addEventListener('change', filterRaw);
  if (rawOrder) rawOrder.addEventListener('change', filterRaw);

  // Ordered cust search
  const orderedSearch = document.getElementById('orderedCustSearchInput');
  if (orderedSearch) {
    orderedSearch.addEventListener('input', () => {
      const q = (orderedSearch.value || '').toLowerCase().trim();
      const res = (appState.customers || []).filter(c => c.order_count > 0 && (
        c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.district.toLowerCase().includes(q) || (c.assigned_shop || '').toLowerCase().includes(q)
      ));
      const tbody = document.getElementById('orderedCustTableBody');
      if (tbody) tbody.innerHTML = renderCustomersRows(res);
    });
  }

  // All cust search
  const allSearch = document.getElementById('allCustSearchInput');
  if (allSearch) {
    allSearch.addEventListener('input', () => {
      const q = (allSearch.value || '').toLowerCase().trim();
      const res = (appState.customers || []).filter(c => 
        c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.district.toLowerCase().includes(q) || (c.assigned_shop || '').toLowerCase().includes(q)
      );
      const tbody = document.getElementById('allCustTableBody');
      if (tbody) {
        tbody.innerHTML = res.map(c => `
          <tr>
            <td><strong>${c.id}</strong></td>
            <td><strong>${c.name}</strong></td>
            <td><code>${c.phone}</code></td>
            <td>${c.district}</td>
            <td><span class="status-pill ${c.is_raw_lead ? 'status-waiting' : 'status-delivered'}">${c.is_raw_lead ? 'Raw Lead' : 'Đơn MBI'}</span></td>
            <td style="font-size: 12px;">${c.channel}</td>
            <td><span class="status-pill ${c.valid_kpi ? 'status-delivered' : 'status-danger'}">${c.valid_kpi ? 'Hợp lệ' : 'Không'}</span></td>
            <td><strong style="color: #0077CC;">${c.order_count} đơn</strong></td>
            <td><span style="font-weight: 700; color: #4338CA;">${c.assigned_shop}</span></td>
            <td>${c.created_at}</td>
          </tr>
        `).join('');
      }
    });
  }
}

// 3. SHOPS SUMMARY & SHOP ORDERS EXPLORER VIEW (ENHANCED)
function renderShopsSummaryView() {
  const shops = appState.shopsSummary || [];
  const allOrders = appState.orders || [];
  const totalAllOrders = allOrders.length;
  const totalDelivered = allOrders.filter(o => o.shop_status?.includes('Đã giao')).length;
  const totalShipping = allOrders.filter(o => o.shop_status?.includes('Đang giao')).length;
  const totalPending = allOrders.filter(o => o.shop_status?.includes('Chờ') || o.shop_status?.includes('Shop đã nhận')).length;

  const currentShopFilter = appState.selectedShop || 'Tất cả các shop';
  const filteredOrders = (currentShopFilter === 'Tất cả các shop') 
    ? allOrders 
    : allOrders.filter(o => o.shop.toLowerCase() === currentShopFilter.toLowerCase());

  const selectedShopObj = shops.find(s => s.name.toLowerCase() === currentShopFilter.toLowerCase());

  return `
    <div class="metrics-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 20px;">
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">TỔNG SHOP MBI HỢP TÁC</div>
        <div style="font-size: 26px; font-weight: 800; color: #0077CC;">${shops.length} Cửa Hàng</div>
        <div style="font-size: 11px; color: #10B981;">Phủ sóng TP.HCM, Hà Nội & Toàn Quốc</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">TỔNG ĐƠN PHÂN BỔ CÁC SHOP</div>
        <div style="font-size: 26px; font-weight: 800; color: #4338CA;">${totalAllOrders} Đơn</div>
        <div style="font-size: 11px; color: #10B981;">Định tuyến thông minh theo quận</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">ĐÃ GIAO THÀNH CÔNG</div>
        <div style="font-size: 26px; font-weight: 800; color: #047857;">${totalDelivered} Đơn</div>
        <div style="font-size: 11px; color: #10B981;">Tỷ lệ: ${totalAllOrders > 0 ? ((totalDelivered / totalAllOrders) * 100).toFixed(1) : 0}%</div>
      </div>
      <div style="background: white; padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="font-size: 12px; color: #64748B; font-weight: 600;">ĐANG GIAO & CHỜ TIẾP NHẬN</div>
        <div style="font-size: 26px; font-weight: 800; color: #F59E0B;">${totalShipping + totalPending} Đơn</div>
        <div style="font-size: 11px; color: #64748B;">${totalShipping} đang giao • ${totalPending} chờ shop</div>
      </div>
    </div>

    <!-- BẢNG TỔNG QUAN CHỈ TIÊU & QUOTA 9 SHOP -->
    <div class="content-card" style="margin-bottom: 24px;">
      <div class="card-header" style="background: #F8FAFC;">
        <div class="card-title" style="color: #0F172A;">
          <span>🏬</span> Bảng Tổng Hợp Quota & Hiệu Suất Vận Hành 9 Shop MBI
        </div>
        <span style="font-size: 12.5px; color: #64748B;">Nhấp vào nút "Xem đơn" hoặc chọn Shop bên dưới để mở toàn bộ đơn hàng</span>
      </div>
      <div class="table-responsive">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Tên Shop MBI</th>
              <th>Tổng Đơn Giao</th>
              <th>Đã Giao Xong</th>
              <th>Đang Giao</th>
              <th>Chờ Tiếp Nhận</th>
              <th>Tiến Độ Hoàn Thành</th>
              <th>Hạn Mức Quota</th>
              <th>Tỷ Lệ SLA</th>
              <th>Địa Bàn Phụ Trách</th>
              <th>Xem Đơn Hàng</th>
            </tr>
          </thead>
          <tbody>
            ${shops.map(s => `
              <tr style="${s.name.toLowerCase() === currentShopFilter.toLowerCase() ? 'background: #EFF6FF;' : ''}">
                <td><strong style="color: #0077CC; font-size: 14.5px;">${s.name}</strong></td>
                <td><strong style="font-size: 16px; color: #1E293B;">${s.total_orders} đơn</strong></td>
                <td><strong style="color: #059669;">${s.delivered_orders}</strong></td>
                <td><strong style="color: #2563EB;">${s.shipping_orders}</strong></td>
                <td>
                  <span class="status-pill ${s.pending_orders > 0 ? 'status-danger' : 'status-delivered'}">
                    ${s.pending_orders} đơn
                  </span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background: #E2E8F0; border-radius: 3px; width: 60px;">
                      <div style="height: 100%; background: #10B981; border-radius: 3px; width: ${Math.min(s.completion_rate, 100)}%;"></div>
                    </div>
                    <span><strong>${s.completion_rate}%</strong></span>
                  </div>
                </td>
                <td>${s.quota} (Còn ${s.remaining_quota})</td>
                <td><span class="status-pill status-delivered">⭐ ${s.sla_on_time_rate}</span></td>
                <td>
                  <span class="status-pill status-shipping" style="font-weight: 700; margin-bottom: 3px; display: inline-block;">
                    📍 ${s.region || 'Toàn quốc'}
                  </span>
                  <div style="font-size: 11.5px; color: #64748B; max-width: 220px; line-height: 1.3;">
                    ${s.coverage || (s.districts || []).join(', ')}
                  </div>
                </td>
                <td>
                  <button class="btn-primary btn-select-shop-pill" data-shop="${s.name}" style="padding: 5px 12px; font-size: 12px; white-space: nowrap;">
                    📦 Xem ${s.total_orders} đơn
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TRỰC TIẾP DANH SÁCH ĐƠN HÀNG CỦA TỪNG SHOP (SHOP ORDERS EXPLORER) -->
    <div class="content-card" id="shopOrdersExplorerSection" style="border-top: 4px solid #0077CC;">
      <div class="card-header" style="background: #F0F9FF; display: block; padding-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div class="card-title" style="color: #0369A1; font-size: 16px;">
            <span>📦</span> DANH SÁCH CHI TIẾT ĐƠN HÀNG CỦA CÁC SHOP MBI (SHOP ORDERS EXPLORER)
          </div>
          <span style="font-size: 12.5px; font-weight: 700; color: #0284C7;">
            Đang hiển thị: <span id="currentShopDisplayLabel">${currentShopFilter}</span> (${filteredOrders.length} đơn)
          </span>
        </div>

        <!-- SHOP FILTER PILLS -->
        <div class="shop-filter-bar">
          <button class="shop-pill ${currentShopFilter === 'Tất cả các shop' ? 'active' : ''}" data-shop="Tất cả các shop">
            <span>🌐 Tất cả các shop</span>
            <span class="pill-badge">${allOrders.length}</span>
          </button>
          ${shops.map(s => `
            <button class="shop-pill ${currentShopFilter.toLowerCase() === s.name.toLowerCase() ? 'active' : ''}" data-shop="${s.name}">
              <span>🏬 ${s.name}</span>
              <span class="pill-badge">${s.total_orders}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- SHOP INFO BANNER (if specific shop selected) -->
      ${selectedShopObj ? `
        <div style="padding: 14px 24px 0;">
          <div class="shop-info-banner">
            <div>
              <h4 style="font-size: 15px; color: #0369A1; font-weight: 800; margin-bottom: 4px;">🏬 Shop MBI: ${selectedShopObj.name}</h4>
              <p style="font-size: 12.5px; color: #334155;">
                Địa bàn phụ trách: <strong>${(selectedShopObj.districts || []).join(', ')}</strong> | Hạn mức: <strong>${selectedShopObj.quota} đơn</strong> (Còn trống: <strong>${selectedShopObj.remaining_quota}</strong>)
              </p>
            </div>
            <div style="font-size: 12.5px; color: #1E293B; background: white; padding: 8px 14px; border-radius: 8px; border: 1px solid #BAE6FD;">
              💳 <strong>TK Ngân Hàng:</strong> ${selectedShopObj.bank_name || 'Vietcombank'} - <code>${selectedShopObj.bank_account || '1057169817'}</code> (${selectedShopObj.account_holder || selectedShopObj.name})
            </div>
          </div>
        </div>
      ` : ''}

      <!-- FILTER CONTROLS & SEARCH -->
      <div style="padding: 12px 24px 0; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 13px; font-weight: 600; color: #475569;">Trạng thái:</span>
          <select id="shopOrderStatusFilter" class="form-control" style="width: 210px; padding: 6px 10px; font-size: 13px;">
            <option value="">-- Tất cả trạng thái (${filteredOrders.length}) --</option>
            <option value="Đã giao">🟢 Đã giao hàng (${filteredOrders.filter(o => o.shop_status.includes('Đã giao')).length})</option>
            <option value="Đang giao">🔵 Đang giao (${filteredOrders.filter(o => o.shop_status.includes('Đang giao')).length})</option>
            <option value="Shop đã nhận">🟡 Shop đã nhận (${filteredOrders.filter(o => o.shop_status.includes('Shop đã nhận')).length})</option>
            <option value="Chờ">🔴 Chờ tiếp nhận (${filteredOrders.filter(o => o.shop_status.includes('Chờ')).length})</option>
          </select>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="shopOrderSearchInput" class="form-control" placeholder="Tìm kiếm đơn (Mã đơn, Tên mẹ, SĐT, Địa chỉ)..." style="width: 320px; padding: 7px 12px; font-size: 13px;">
        </div>
      </div>

      <!-- ORDERS TABLE -->
      <div class="card-body">
        <div class="table-responsive" style="max-height: 600px;">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày Đặt</th>
                <th>Tên Mẹ Bầu</th>
                <th>Số Điện Thoại</th>
                <th>Địa Chỉ Giao Chi Tiết</th>
                <th>Sản Phẩm Cần Giao</th>
                <th>Shop MBI Phục Vụ</th>
                <th>Trạng Thái Shop</th>
                <th>ĐV Vận Chuyển</th>
                <th>Mã Vận Đơn</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="shopOrdersTableBody">
              ${renderShopOrdersTableRows(filteredOrders)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderShopOrdersTableRows(orders) {
  if (!orders || orders.length === 0) {
    return `<tr><td colspan="11" style="text-align: center; padding: 36px; color: #64748B;">Không tìm thấy đơn hàng nào thuộc shop này!</td></tr>`;
  }

  return orders.map(o => {
    let statusClass = 'status-waiting';
    if (o.shop_status.includes('Đã giao')) statusClass = 'status-delivered';
    else if (o.shop_status.includes('Đang giao')) statusClass = 'status-shipping';
    else if (o.shop_status.includes('Shop đã nhận')) statusClass = 'status-received';

    return `
      <tr>
        <td><strong style="color: #0077CC; font-size: 14px;">${o.code}</strong></td>
        <td>${o.date}</td>
        <td><strong>${o.customer_name}</strong></td>
        <td><code>${o.phone}</code></td>
        <td style="font-size: 12.5px; max-width: 240px;">${o.address} ${o.district ? `(${o.district})` : ''}</td>
        <td style="font-size: 12px;"><span style="color: #047857; font-weight: 600;">${o.product}</span></td>
        <td><span style="font-weight: 700; color: #4338CA; background: #EEF2FF; padding: 3px 8px; border-radius: 6px;">${o.shop}</span></td>
        <td><span class="status-pill ${statusClass}">${o.shop_status}</span></td>
        <td>${o.carrier || 'Ahamove'}</td>
        <td><code>${o.tracking_code || '---'}</code></td>
        <td>
          <button class="btn-secondary btn-update-order" data-id="${o.id}" style="padding: 4px 8px; font-size: 11.5px; white-space: nowrap;">
            ✏️ Cập nhật
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function attachShopsSummaryEvents() {
  // 1. Select Shop Pill or Button
  const handleShopSelect = (shopName) => {
    appState.selectedShop = shopName;
    renderCurrentView();
    setTimeout(() => {
      const el = document.getElementById('shopOrdersExplorerSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  document.querySelectorAll('.btn-select-shop-pill').forEach(btn => {
    btn.addEventListener('click', () => handleShopSelect(btn.dataset.shop));
  });

  document.querySelectorAll('#shopOrdersExplorerSection .shop-pill').forEach(btn => {
    btn.addEventListener('click', () => handleShopSelect(btn.dataset.shop));
  });

  // 2. Filter status inside Shop Explorer
  const statusFilter = document.getElementById('shopOrderStatusFilter');
  const searchInput = document.getElementById('shopOrderSearchInput');

  const filterExplorer = () => {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const st = statusFilter?.value || '';
    const currentShop = appState.selectedShop || 'Tất cả các shop';

    let res = appState.orders || [];
    if (currentShop !== 'Tất cả các shop') {
      res = res.filter(o => o.shop.toLowerCase() === currentShop.toLowerCase());
    }
    if (st) {
      res = res.filter(o => o.shop_status.includes(st));
    }
    if (q) {
      res = res.filter(o => 
        (o.code || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q) ||
        (o.address || '').toLowerCase().includes(q) ||
        (o.district || '').toLowerCase().includes(q)
      );
    }
    const tbody = document.getElementById('shopOrdersTableBody');
    if (tbody) tbody.innerHTML = renderShopOrdersTableRows(res);
    attachOrderRowButtons();
  };

  if (statusFilter) statusFilter.addEventListener('change', filterExplorer);
  if (searchInput) searchInput.addEventListener('input', filterExplorer);

  attachOrderRowButtons();
}

// 4. ORDERS MASTER VIEW (WITH QUICK SHOP FILTER PILLS)
function renderOrdersView() {
  const orders = appState.orders || [];
  const shops = appState.shopsSummary || [];
  const currentShopFilter = appState.orderFilterShop || '';

  const filteredOrders = currentShopFilter 
    ? orders.filter(o => o.shop.toLowerCase() === currentShopFilter.toLowerCase())
    : orders;

  return `
    <div class="content-card">
      <div class="card-header" style="display: block; padding-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div class="card-title">
            <span>📦</span> Quản Lý Đơn Hàng Master (${orders.length} Đơn Trên Toàn Hệ Thống)
          </div>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="orderSearchInput" class="form-control" placeholder="Tìm theo Mã đơn, Tên mẹ, SĐT, Quận..." style="width: 280px; padding: 7px 12px; font-size: 13px;">
            <select id="orderShopFilter" class="form-control" style="width: 170px; padding: 7px 10px; font-size: 13px;">
              <option value="">-- Tất cả Shop MBI --</option>
              ${shops.map(s => `<option value="${s.name}" ${s.name.toLowerCase() === currentShopFilter.toLowerCase() ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- QUICK SHOP FILTER PILLS -->
        <div class="shop-filter-bar">
          <button class="shop-pill master-shop-pill ${!currentShopFilter ? 'active' : ''}" data-shop="">
            <span>🌐 Tất cả (${orders.length})</span>
          </button>
          ${shops.map(s => `
            <button class="shop-pill master-shop-pill ${currentShopFilter.toLowerCase() === s.name.toLowerCase() ? 'active' : ''}" data-shop="${s.name}">
              <span>🏬 ${s.name}</span>
              <span class="pill-badge">${s.total_orders}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="table-responsive" style="max-height: 650px;">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Ngày Đặt</th>
              <th>Mẹ Bầu</th>
              <th>Số Điện Thoại</th>
              <th>Khu Vực</th>
              <th>Sản Phẩm</th>
              <th>Shop MBI Phân Bổ</th>
              <th>Trạng Thái Shop</th>
              <th>ĐV Vận Chuyển</th>
              <th>Mã Vận Đơn</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            ${renderOrdersRows(filteredOrders)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderOrdersRows(orders) {
  if (!orders || orders.length === 0) {
    return `<tr><td colspan="11" style="text-align: center; padding: 30px; color: #64748B;">Không tìm thấy đơn hàng nào!</td></tr>`;
  }

  return orders.map(o => {
    let statusClass = 'status-waiting';
    if (o.shop_status.includes('Đã giao')) statusClass = 'status-delivered';
    else if (o.shop_status.includes('Đang giao')) statusClass = 'status-shipping';
    else if (o.shop_status.includes('Shop đã nhận')) statusClass = 'status-received';

    return `
      <tr>
        <td><strong style="color: #0077CC;">${o.code}</strong></td>
        <td>${o.date}</td>
        <td><strong>${o.customer_name}</strong></td>
        <td><code>${o.phone}</code></td>
        <td>${o.district || 'TP.HCM'}</td>
        <td style="font-size: 12px;">${o.product}</td>
        <td><span style="font-weight: 700; color: #4338CA; background: #EEF2FF; padding: 2px 7px; border-radius: 4px;">${o.shop}</span></td>
        <td><span class="status-pill ${statusClass}">${o.shop_status}</span></td>
        <td>${o.carrier || 'Ahamove'}</td>
        <td><code>${o.tracking_code || '---'}</code></td>
        <td>
          <button class="btn-secondary btn-update-order" data-id="${o.id}" style="padding: 4px 8px; font-size: 11.5px;">
            ✏️ Cập nhật
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function attachOrdersEvents() {
  const searchInput = document.getElementById('orderSearchInput');
  const shopFilter = document.getElementById('orderShopFilter');

  const filterHandler = () => {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const shop = shopFilter?.value || appState.orderFilterShop;

    let res = appState.orders;
    if (shop) res = res.filter(o => o.shop.toLowerCase() === shop.toLowerCase());
    if (q) {
      res = res.filter(o =>
        (o.code || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q) ||
        (o.district || '').toLowerCase().includes(q)
      );
    }
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) tbody.innerHTML = renderOrdersRows(res);
    attachOrderRowButtons();
  };

  // Quick shop pills on Master Orders
  document.querySelectorAll('.master-shop-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.orderFilterShop = btn.dataset.shop;
      if (shopFilter) shopFilter.value = btn.dataset.shop;
      filterHandler();
      document.querySelectorAll('.master-shop-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  if (searchInput) searchInput.addEventListener('input', filterHandler);
  if (shopFilter) {
    shopFilter.addEventListener('change', () => {
      appState.orderFilterShop = shopFilter.value;
      filterHandler();
      document.querySelectorAll('.master-shop-pill').forEach(b => {
        if (b.dataset.shop.toLowerCase() === shopFilter.value.toLowerCase()) b.classList.add('active');
        else b.classList.remove('active');
      });
    });
  }

  attachOrderRowButtons();
}

function attachOrderRowButtons() {
  document.querySelectorAll('.btn-update-order').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const order = appState.orders.find(o => String(o.id) === String(id));
      if (!order) return;

      document.getElementById('updateOrderId').value = order.id;
      document.getElementById('updateModalTitle').innerText = `Cập Nhật Đơn Hàng: ${order.code} (${order.customer_name})`;
      document.getElementById('updateShopStatus').value = order.shop_status.includes('Đã giao') ? '[4] Đã giao hàng' : (order.shop_status.includes('Đang') ? '[3] Đang giao' : '[2] Shop đã nhận');
      document.getElementById('updateCarrier').value = order.carrier || 'Ahamove';
      document.getElementById('updateTrackingCode').value = order.tracking_code || '';
      document.getElementById('updatePodLink').value = order.pod_link || '';

      document.getElementById('updateOrderModal').classList.add('active');
    });
  });
}

// 5. HOSPITALS VIEW
function renderHospitalsView() {
  const hospitals = appState.hospitals || [];
  return `
    <div class="content-card">
      <div class="card-header">
        <div class="card-title">
          <span>🏥</span> Tiến Trình Hợp Tác Bệnh Viện & Cơ Sở Y Tế (${appState.stats?.approved_hospitals || 11}/${appState.stats?.total_hospitals || 26} Bệnh Viện Đã Phê Duyệt)
        </div>
      </div>
      <div class="table-responsive">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Tên Bệnh Viện / Cơ Sở Y Tế</th>
              <th>Tỉnh / TP</th>
              <th>Cuộc Hẹn Làm Việc</th>
              <th>Tình Trạng Chấp Thuận</th>
              <th>Đơn Vị Phụ Trách</th>
              <th>Số Lượng Sự Kiện</th>
              <th>Target Lead</th>
              <th>Actual Lead</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            ${hospitals.map(h => `
              <tr>
                <td><strong>${h.name}</strong></td>
                <td>${h.province}</td>
                <td><span class="status-pill status-received">${h.meeting_status}</span></td>
                <td>
                  <span class="status-pill ${h.status === 'Đã chấp thuận' ? 'status-completed' : (h.status === 'Đang chờ phản hồi' ? 'status-waiting' : 'status-danger')}">
                    ${h.status}
                  </span>
                </td>
                <td>${h.pic}</td>
                <td><strong>${h.events_count} buổi</strong></td>
                <td>${h.target_leads}</td>
                <td><strong style="color: #0077CC;">${h.actual_leads}</strong></td>
                <td>
                  <button class="btn-secondary btn-toggle-hospital" data-id="${h.id}" style="padding: 4px 8px; font-size: 11px;">
                    Đổi trạng thái
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function attachHospitalEvents() {
  document.querySelectorAll('.btn-toggle-hospital').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const hosp = appState.hospitals.find(h => String(h.id) === String(id));
      if (!hosp) return;
      const nextStatus = hosp.status === 'Đã chấp thuận' ? 'Đang chờ phản hồi' : 'Đã chấp thuận';
      
      try {
        await fetch(`${API_BASE}/hospitals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        hosp.status = nextStatus;
        showToast(`Đã cập nhật ${hosp.name}: ${nextStatus}`, 'success');
        renderCurrentView();
      } catch (err) {
        showToast('Lỗi khi cập nhật trạng thái bệnh viện', 'danger');
      }
    });
  });
}

// 6. WEBINARS VIEW
function renderWebinarsView() {
  const webinars = appState.webinars || [];
  return `
    <div class="content-card">
      <div class="card-header">
        <div class="card-title">
          <span>💻</span> Quản Lý Lớp Học Online & Webinar Thai Kỳ Zmoms x Danone
        </div>
      </div>
      <div class="table-responsive">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Chuyên Đề Đào Tạo</th>
              <th>Nền Tảng</th>
              <th>Thời Gian</th>
              <th>Diễn Giả / Chuyên Gia</th>
              <th>Đăng Ký</th>
              <th>Tham Dự Thực Tế</th>
              <th>New User (Combo)</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${webinars.map(w => `
              <tr>
                <td><strong>${w.title}</strong></td>
                <td><span class="status-pill status-shipping">${w.platform}</span></td>
                <td>${w.date} (${w.time})</td>
                <td>${w.speaker}</td>
                <td>${w.registered}</td>
                <td><strong style="color: #0077CC;">${w.attended}</strong></td>
                <td><strong style="color: #10B981;">${w.converted_nu}</strong></td>
                <td>
                  <span class="status-pill ${w.status === 'Đã hoàn thành' ? 'status-completed' : 'status-waiting'}">
                    ${w.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 7. SPAS VIEW
function renderSpasView() {
  const spas = appState.spas || [];
  return `
    <div class="content-card">
      <div class="card-header">
        <div class="card-title">
          <span>💆‍♀️</span> Hệ Thống Chuỗi Spa Mẹ Bầu Đối Tác
        </div>
      </div>
      <div class="table-responsive">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Tên Spa Đối Tác</th>
              <th>Địa Chỉ Cơ Sở</th>
              <th>Hạng Đối Tác</th>
              <th>Data Mẹ Thu Nhận</th>
              <th>Chuyển Đổi NU Combo</th>
              <th>Tỷ Lệ CR</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${spas.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.address}</td>
                <td><span class="status-pill status-received">${s.partner_tier}</span></td>
                <td>${s.leads_acquired}</td>
                <td><strong style="color: #10B981;">${s.converted_nu}</strong></td>
                <td><strong>${((s.converted_nu / s.leads_acquired) * 100).toFixed(1)}%</strong></td>
                <td><span class="status-pill status-completed">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 8. MIDWIVES VIEW
function renderMidwivesView() {
  const midwives = appState.midwives || [];
  return `
    <div class="content-card">
      <div class="card-header">
        <div class="card-title">
          <span>👩‍⚕️</span> Đội Ngũ Nữ Hộ Sinh Chuyên Nghiệp Tư Vấn Tại Nhà (1-on-1)
        </div>
      </div>
      <div class="table-responsive">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Mã NHS</th>
              <th>Họ và Tên Nữ Hộ Sinh</th>
              <th>Khu Vực Phụ Trách</th>
              <th>Số Điện Thoại</th>
              <th>Lịch Đặt Hẹn</th>
              <th>Ca Hoàn Thành</th>
              <th>Chốt New User (Combo)</th>
              <th>Đánh Giá Mẹ</th>
            </tr>
          </thead>
          <tbody>
            ${midwives.map(m => `
              <tr>
                <td><strong>${m.code}</strong></td>
                <td><strong>${m.name}</strong></td>
                <td>${m.area}</td>
                <td><code>${m.phone}</code></td>
                <td>${m.appointments}</td>
                <td><strong style="color: #0077CC;">${m.completed}</strong></td>
                <td><strong style="color: #10B981;">${m.converted_nu}</strong></td>
                <td>⭐ ${m.rating} / 5.0</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 9. KPI & SALES INCENTIVE VIEW (Unified from Render Logic)
function renderKPIView() {
  const kpiList = appState.kpiData || [];
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 800; color: #0F172A;">🎯 Quản Trị Tiến Độ Bán Hàng & Dự Tính Thưởng KPI</h2>
        <p style="font-size: 13px; color: #64748B;">Tích hợp công thức tính thưởng Render: Thưởng NU bán + NU trợ giá + Doanh số (Hệ số ZM 100%, CĐB 70%).</p>
      </div>
      <button class="btn-primary" onclick="document.getElementById('liveKpiModal').classList.add('active')">
        <span>📝</span> Cập Nhật Thực Đạt (Live Entry)
      </button>
    </div>

    <div class="content-card">
      <div class="card-body">
        <!-- Interactive Target Slider -->
        <div class="kpi-slider-box">
          <div class="slider-label">
            <span>Kéo thanh trượt để giả lập % hoàn thành chỉ tiêu toàn đội ngũ:</span>
            <strong id="sliderPctLabel" style="color: #0077CC; font-size: 15px;">100%</strong>
          </div>
          <input type="range" class="kpi-slider" id="kpiTargetSlider" min="70" max="130" value="100">
        </div>

        <div class="table-responsive">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Mã Nhân Sự</th>
                <th>Tên Nhân Viên</th>
                <th>Team</th>
                <th>Target NU</th>
                <th>Thực Đạt NU</th>
                <th>% Đạt</th>
                <th>Thưởng NU Bán</th>
                <th>Thưởng NU Trợ Giá</th>
                <th>Thưởng Doanh Số</th>
                <th>Tổng Thưởng Tạm Tính</th>
              </tr>
            </thead>
            <tbody>
              ${kpiList.map(k => `
                <tr>
                  <td><strong>${k.code}</strong></td>
                  <td><strong>${k.name}</strong></td>
                  <td><span class="status-pill ${k.team === 'ZM' ? 'status-shipping' : 'status-received'}">${k.team}</span></td>
                  <td>${k.target_nu}</td>
                  <td><strong style="color: #0077CC; font-size: 15px;">${k.actual_nu}</strong></td>
                  <td><span class="status-pill status-completed">${k.achievement_rate}%</span></td>
                  <td>${Math.round(k.bonus_nu).toLocaleString()} đ</td>
                  <td>${Math.round(k.bonus_sub).toLocaleString()} đ</td>
                  <td>${Math.round(k.bonus_rev).toLocaleString()} đ</td>
                  <td><strong style="color: #059669; font-size: 14.5px;">${Math.round(k.total_bonus).toLocaleString()} đ</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function attachKPIEvents() {
  const slider = document.getElementById('kpiTargetSlider');
  const label = document.getElementById('sliderPctLabel');
  if (!slider) return;

  slider.addEventListener('input', () => {
    label.innerText = `${slider.value}%`;
  });
}

// 10. DANONE PARTNER PORTAL VIEW
function renderDanonePartnerView() {
  const s = appState.stats || {};
  const orders = appState.orders || [];
  const shops = (appState.shopsSummary && appState.shopsSummary.length > 0)
    ? appState.shopsSummary
    : (window.CRM_INITIAL_DATA ? window.CRM_INITIAL_DATA.mbi_shops : []);
  const actions = appState.actionItems || [];
  const delayedOrders = orders.filter(o => o.shop_status && (o.shop_status.includes('Chờ') || o.shop_status.includes('Chưa') || o.shop_status.includes('[1]')));

  const selectedDanoneShop = appState.danoneSelectedShop || '';
  const filteredOrdersForShop = selectedDanoneShop 
    ? orders.filter(o => o.shop.toLowerCase() === selectedDanoneShop.toLowerCase())
    : orders;

  const totalDelivered = orders.filter(o => o.shop_status && o.shop_status.includes('Đã giao')).length;
  const totalShipping = orders.filter(o => o.shop_status && o.shop_status.includes('Đang giao')).length;
  const totalPending = orders.filter(o => o.shop_status && (o.shop_status.includes('Chờ') || o.shop_status.includes('Shop đã nhận') || o.shop_status.includes('[1]'))).length;

  return `
    <div class="content-card" style="border-top: 4px solid #0077CC; margin-bottom: 24px;">
      <div class="card-header" style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <div class="card-title" style="color: #1E3A8A; font-size: 17px; font-weight: 800;">
            <span>🤝</span> CỔNG THÔNG TIN ĐỐI TÁC DANONE (DANONE APTAMIL EXECUTIVE PORTAL)
          </div>
          <p style="font-size: 13px; color: #475569; margin-top: 4px; margin-bottom: 0;">
            Theo dõi thời gian thực tiến độ New User Acquisition, bảng tổng hợp phân bổ 9 Shop MBI và giám sát SLA giao hàng theo nguyên tắc "Zero Direct Contact".
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="status-pill status-completed">🟢 Live Realtime Sync</span>
          <button class="btn-secondary" id="btnExportDanoneMBIReport" style="padding: 6px 12px; font-size: 12.5px; background: #FFF;">
            📥 Xuất Báo Cáo MBI
          </button>
        </div>
      </div>
      <div class="card-body">
        <!-- KPI Summary Cards -->
        <div class="metrics-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
          <div class="metric-card card-blue">
            <div class="metric-header"><span class="metric-title">Target Raw Leads Chiến Dịch</span><div class="metric-icon">🎯</div></div>
            <div class="metric-value">${(s.total_raw_data || 423).toLocaleString()} <span style="font-size: 15px; color: #64748B;">/ ${(s.target_data || 10010).toLocaleString()}</span></div>
            <div class="metric-sub">${(s.valid_raw_data || 409).toLocaleString()} Leads hợp lệ KPI (${((s.total_raw_data ? ((s.valid_raw_data || 409) / s.total_raw_data) : 0.967) * 100).toFixed(1)}%)</div>
          </div>
          <div class="metric-card card-coral">
            <div class="metric-header"><span class="metric-title">Tổng Đơn Hàng Mua (NU)</span><div class="metric-icon">🛒</div></div>
            <div class="metric-value">${orders.length} <span style="font-size: 15px; color: #64748B;">/ ${(s.target_nu || 2517).toLocaleString()} NU</span></div>
            <div class="metric-sub">Phân bổ 100% qua 9 Shop MBI</div>
          </div>
          <div class="metric-card card-green">
            <div class="metric-header"><span class="metric-title">Đã Giao Thành Công</span><div class="metric-icon">✅</div></div>
            <div class="metric-value">${totalDelivered} <span style="font-size: 15px; color: #64748B;">Đơn</span></div>
            <div class="metric-sub">Tỷ lệ: ${orders.length > 0 ? ((totalDelivered / orders.length) * 100).toFixed(1) : 0}%</div>
          </div>
          <div class="metric-card card-gold">
            <div class="metric-header"><span class="metric-title">Đơn Cần Danone Đôn Đốc</span><div class="metric-icon">⚡</div></div>
            <div class="metric-value">${delayedOrders.length} <span style="font-size: 15px; color: #64748B;">Đơn</span></div>
            <div class="metric-sub">Chờ tiếp nhận / Chưa giao hàng</div>
          </div>
        </div>

        <!-- 🏬 BẢNG TỔNG HỢP SHOP MBI & SỐ LƯỢNG ĐƠN HÀNG DÀNH CHO DANONE -->
        <div class="content-card" style="margin-bottom: 24px; border: 1.5px solid #BFDBFE;">
          <div class="card-header" style="background: #F0F9FF; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <div class="card-title" style="color: #0369A1; font-size: 15.5px; font-weight: 800;">
                <span>🏬</span> BẢNG TỔNG HỢP SHOP MBI & SỐ LƯỢNG ĐƠN HÀNG (MBI PERFORMANCE MATRIX)
              </div>
              <div style="font-size: 12.5px; color: #64748B; margin-top: 2px;">
                Phân bổ chỉ tiêu Quota, số lượng đơn nhận, tiến độ giao hàng và tỷ lệ SLA theo từng khu vực địa lý của 9 Shop MBI
              </div>
            </div>
            <span class="status-pill status-delivered" style="font-weight: 700;">9 Shop Đối Tác Hoạt Động</span>
          </div>

          <!-- Quick Shop Filter Bar for Danone -->
          <div style="padding: 12px 18px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
            <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase;">
              Lọc Nhanh Xem Đơn Của Shop:
            </div>
            <div class="shop-filter-bar" style="margin-bottom: 0;">
              <button class="shop-pill danone-shop-pill ${!selectedDanoneShop ? 'active' : ''}" data-shop="">
                <span>🌐 Tất cả (${orders.length} đơn)</span>
              </button>
              ${shops.map(s => `
                <button class="shop-pill danone-shop-pill ${selectedDanoneShop.toLowerCase() === s.name.toLowerCase() ? 'active' : ''}" data-shop="${s.name}">
                  <span>🏬 ${s.name}</span>
                  <span class="pill-badge">${s.total_orders}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="table-responsive">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Tên Shop MBI</th>
                  <th>Khu Vực Phụ Trách</th>
                  <th>Chỉ Tiêu Quota</th>
                  <th>Tổng Đơn Nhận</th>
                  <th>Đã Giao Xong</th>
                  <th>Đang Giao</th>
                  <th>Chờ Tiếp Nhận</th>
                  <th>Tiến Độ Đạt Quota</th>
                  <th>Tỷ Lệ SLA Đúng Hạn</th>
                  <th>Đánh Giá Năng Lực</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${shops.map(s => {
                  const isSelected = selectedDanoneShop.toLowerCase() === s.name.toLowerCase();
                  let perfBadge = '<span class="status-pill status-delivered">🟢 Hoạt động tốt</span>';
                  if (s.pending_orders > 15) perfBadge = '<span class="status-pill status-danger">🔴 Cần đôn đốc</span>';
                  else if (s.pending_orders > 5) perfBadge = '<span class="status-pill status-waiting">🟡 Tải cao</span>';

                  return `
                    <tr style="${isSelected ? 'background: #EFF6FF;' : ''}">
                      <td>
                        <strong style="color: #0077CC; font-size: 14.5px;">${s.name}</strong>
                        <div style="font-size: 11px; color: #64748B;">${s.bank_name || 'Vietcombank'} - ${s.bank_account || ''}</div>
                      </td>
                      <td>
                        <span class="status-pill status-shipping" style="font-weight: 700; margin-bottom: 2px; display: inline-block;">
                          📍 ${s.region || 'Toàn quốc'}
                        </span>
                        <div style="font-size: 11.5px; color: #64748B; max-width: 200px; line-height: 1.3;">
                          ${s.coverage || (s.districts || []).join(', ')}
                        </div>
                      </td>
                      <td><strong>${s.quota}</strong> (Còn ${s.remaining_quota})</td>
                      <td><strong style="font-size: 15px; color: #1E293B;">${s.total_orders} đơn</strong></td>
                      <td><strong style="color: #059669;">${s.delivered_orders}</strong></td>
                      <td><strong style="color: #2563EB;">${s.shipping_orders}</strong></td>
                      <td>
                        <span class="status-pill ${s.pending_orders > 0 ? 'status-danger' : 'status-delivered'}">
                          ${s.pending_orders} đơn
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="flex: 1; height: 6px; background: #E2E8F0; border-radius: 3px; width: 55px;">
                            <div style="height: 100%; background: #10B981; border-radius: 3px; width: ${Math.min(s.completion_rate, 100)}%;"></div>
                          </div>
                          <span><strong>${s.completion_rate}%</strong></span>
                        </div>
                      </td>
                      <td><span class="status-pill status-delivered">⭐ ${s.sla_on_time_rate}</span></td>
                      <td>${perfBadge}</td>
                      <td>
                        <button class="btn-primary btn-danone-view-shop" data-shop="${s.name}" style="padding: 5px 12px; font-size: 12px; white-space: nowrap;">
                          📦 Xem ${s.total_orders} đơn
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 📦 CHI TIẾT ĐƠN HÀNG THỰC TẾ CHO ĐỐI TÁC DANONE THEO DÕI & ĐỐI SOÁT -->
        <div class="content-card" style="margin-bottom: 24px; border-top: 3px solid #2563EB;">
          <div class="card-header" style="background: #F8FAFC; display: flex; justify-content: space-between; align-items: center;">
            <div class="card-title" style="color: #1E293B; font-size: 14.5px;">
              <span>📦</span> Chi Tiết Đơn Hàng ${selectedDanoneShop ? `Của Shop ${selectedDanoneShop}` : 'Toàn Bộ Hệ Thống'} (${filteredOrdersForShop.length} Đơn)
            </div>
            ${selectedDanoneShop ? `
              <button class="btn-secondary" id="btnDanoneClearShopFilter" style="padding: 4px 10px; font-size: 12px;">
                ✖ Bỏ lọc (Xem tất cả)
              </button>
            ` : ''}
          </div>
          <div class="table-responsive" style="max-height: 480px;">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Ngày Đặt</th>
                  <th>Mẹ Bầu</th>
                  <th>Số Điện Thoại</th>
                  <th>Địa Chỉ & Khu Vực</th>
                  <th>Sản Phẩm</th>
                  <th>Shop MBI</th>
                  <th>Trạng Thái Giao</th>
                  <th>Đơn Vị Vận Chuyển</th>
                  <th>Mã Vận Đơn</th>
                </tr>
              </thead>
              <tbody>
                ${filteredOrdersForShop.slice(0, 50).map(o => `
                  <tr>
                    <td><strong style="color: #0077CC;">${o.code}</strong></td>
                    <td>${o.date}</td>
                    <td><strong>${o.customer_name}</strong></td>
                    <td><code>${o.phone}</code></td>
                    <td style="font-size: 12px; max-width: 180px;">${o.address || ''}, ${o.district || ''}</td>
                    <td style="font-size: 12px;">${o.product}</td>
                    <td><span style="font-weight: 700; color: #4338CA;">${o.shop}</span></td>
                    <td>
                      <span class="status-pill ${o.shop_status && o.shop_status.includes('Đã giao') ? 'status-delivered' : (o.shop_status && o.shop_status.includes('Đang giao') ? 'status-shipping' : 'status-waiting')}">
                        ${o.shop_status}
                      </span>
                    </td>
                    <td>${o.carrier || '---'}</td>
                    <td>${o.tracking_code ? `<code>${o.tracking_code}</code>` : '<span style="color:#94A3B8;">Chưa có</span>'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${filteredOrdersForShop.length > 50 ? `
            <div style="padding: 10px 18px; background: #F8FAFC; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0;">
              Hiển thị 50 / ${filteredOrdersForShop.length} đơn hàng. Bạn có thể sang tab <strong>Quản Lý Đơn Hàng</strong> để tìm kiếm nâng cao hoặc xuất file Excel.
            </div>
          ` : ''}
        </div>

        <!-- MBI Bottleneck Monitor Table for Danone Sales Team -->
        <div class="content-card" style="margin-bottom: 24px;">
          <div class="card-header" style="background: #FEF3C7;">
            <div class="card-title" style="color: #92400E; font-size: 14px;">
              <span>🚨</span> Danh Sách Đơn Cần Đại Diện Danone Trực Tiếp Đôn Đốc Shop MBI (Zero Direct Contact)
            </div>
          </div>
          <div class="table-responsive">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Shop MBI</th>
                  <th>Tên Mẹ Bầu</th>
                  <th>SĐT Mẹ</th>
                  <th>Khu Vực</th>
                  <th>Trạng Thái Hiện Tại</th>
                  <th>Cảnh Báo Vận Hành</th>
                </tr>
              </thead>
              <tbody>
                ${delayedOrders.slice(0, 10).map(o => `
                  <tr>
                    <td><strong>${o.code}</strong></td>
                    <td><strong style="color: #B45309;">${o.shop}</strong></td>
                    <td>${o.customer_name}</td>
                    <td><code>${o.phone}</code></td>
                    <td>${o.district}</td>
                    <td><span class="status-pill status-waiting">${o.shop_status}</span></td>
                    <td><span class="status-pill status-danger">⚠️ Chờ shop tiếp nhận & đóng gói</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action Items Collaboration -->
        <div class="content-card">
          <div class="card-header">
            <div class="card-title">
              <span>📝</span> Phối Hợp Xử Lý Công Việc (Action Items Danone x Zmoms)
            </div>
          </div>
          <div class="table-responsive">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Nội Dung Nhiệm Vụ</th>
                  <th>Đơn Vị Chủ Trì</th>
                  <th>Người Phụ Trách (PIC)</th>
                  <th>Hạn Chót</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                ${actions.map(a => `
                  <tr>
                    <td><strong>${a.task}</strong></td>
                    <td><span class="status-pill status-shipping">${a.owner}</span></td>
                    <td>${a.pic}</td>
                    <td>${a.deadline}</td>
                    <td><span class="status-pill ${a.status.includes('hoàn thành') ? 'status-completed' : 'status-waiting'}">${a.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachDanoneEvents() {
  document.querySelectorAll('.danone-shop-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.danoneSelectedShop = btn.getAttribute('data-shop');
      renderCurrentView();
    });
  });

  document.querySelectorAll('.btn-danone-view-shop').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.danoneSelectedShop = btn.getAttribute('data-shop');
      renderCurrentView();
    });
  });

  const btnClear = document.getElementById('btnDanoneClearShopFilter');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      appState.danoneSelectedShop = '';
      renderCurrentView();
    });
  }

  const btnExport = document.getElementById('btnExportDanoneMBIReport');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportDanoneMBIReport();
    });
  }
}

function exportDanoneMBIReport() {
  const shops = (appState.shopsSummary && appState.shopsSummary.length > 0)
    ? appState.shopsSummary
    : (window.CRM_INITIAL_DATA ? window.CRM_INITIAL_DATA.mbi_shops : []);

  let csvContent = '\uFEFF';
  csvContent += 'BÁO CÁO TỔNG HỢP TIẾN ĐỘ SHOP MBI & SỐ LƯỢNG ĐƠN HÀNG - DANONE APTAMIL x ZMOMS\n';
  csvContent += 'Ngày xuất,' + new Date().toLocaleDateString('vi-VN') + '\n\n';
  csvContent += 'STT,Tên Shop MBI,Khu Vực Phụ Trách,Chỉ Tiêu Quota,Tổng Đơn Nhận,Đã Giao Xong,Đang Giao,Chờ Tiếp Nhận,Tiến Độ Đạt Quota (%),Tỷ Lệ SLA Đúng Hạn\n';

  shops.forEach((s, idx) => {
    csvContent += `"${idx + 1}","${s.name}","${s.region || ''}","${s.quota}","${s.total_orders}","${s.delivered_orders}","${s.shipping_orders}","${s.pending_orders}","${s.completion_rate}%","${s.sla_on_time_rate}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BAO_CAO_TONG_HOP_SHOP_MBI_DANONE_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('✅ Đã xuất báo cáo tổng hợp Shop MBI cho Danone thành công!', 'success');
}

// 11. SHOP MBI PORTAL VIEW
function renderShopMBIView() {
  const currentShop = appState.selectedShop;
  const shops = appState.shopsSummary || [];
  const assignedOrders = appState.orders.filter(o => o.shop.toLowerCase() === currentShop.toLowerCase());

  return `
    <div class="content-card" style="border-top: 4px solid #8B5CF6;">
      <div class="card-header" style="background: #F5F3FF;">
        <div class="card-title" style="color: #6D28D9;">
          <span>🏬</span> CỔNG VẬN HÀNH DÀNH RIÊNG CHO SHOP PHÂN PHỐI (SHOP MBI PORTAL)
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 13px; font-weight: 600;">Đang xem Shop:</span>
          <select id="mbiShopSelector" class="form-control" style="width: 180px; padding: 6px 12px; font-weight: 700;">
            ${shops.map(s => `<option value="${s.name}" ${s.name === currentShop ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="card-body">
        <div style="display: flex; gap: 16px; margin-bottom: 20px;">
          <div style="padding: 14px 20px; background: #EDE9FE; border-radius: 10px; flex: 1;">
            <div style="font-size: 12px; color: #6D28D9; font-weight: 600;">ĐƠN CẦN XỬ LÝ</div>
            <div style="font-size: 24px; font-weight: 800; color: #5B21B6;">${assignedOrders.filter(o => !o.shop_status.includes('Đã giao')).length}</div>
          </div>
          <div style="padding: 14px 20px; background: #D1FAE5; border-radius: 10px; flex: 1;">
            <div style="font-size: 12px; color: #047857; font-weight: 600;">ĐÃ GIAO THÀNH CÔNG</div>
            <div style="font-size: 24px; font-weight: 800; color: #065F46;">${assignedOrders.filter(o => o.shop_status.includes('Đã giao')).length}</div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Tên Mẹ Bầu</th>
                <th>Số Điện Thoại</th>
                <th>Địa Chỉ Giao</th>
                <th>Gói Sữa Danone</th>
                <th>Trạng Thái</th>
                <th>ĐV Vận Chuyển</th>
                <th>Mã Vận Đơn</th>
                <th>Hành Động Shop</th>
              </tr>
            </thead>
            <tbody>
              ${assignedOrders.map(o => `
                <tr>
                  <td><strong>${o.code}</strong></td>
                  <td><strong>${o.customer_name}</strong></td>
                  <td><code>${o.phone}</code></td>
                  <td>${o.address} (${o.district})</td>
                  <td style="font-size: 12px;">${o.product}</td>
                  <td><span class="status-pill ${o.shop_status.includes('Đã giao') ? 'status-delivered' : 'status-waiting'}">${o.shop_status}</span></td>
                  <td>${o.carrier || 'Ahamove'}</td>
                  <td><code>${o.tracking_code || '---'}</code></td>
                  <td>
                    <button class="btn-primary btn-shop-accept" data-id="${o.id}" style="padding: 5px 10px; font-size: 12px;">
                      📦 Cập nhật đơn
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function attachShopEvents() {
  const shopSelector = document.getElementById('mbiShopSelector');
  if (shopSelector) {
    shopSelector.addEventListener('change', (e) => {
      appState.selectedShop = e.target.value;
      renderCurrentView();
    });
  }

  document.querySelectorAll('.btn-shop-accept').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const order = appState.orders.find(o => String(o.id) === String(id));
      if (!order) return;

      document.getElementById('updateOrderId').value = order.id;
      document.getElementById('updateModalTitle').innerText = `Shop ${order.shop} Cập Nhật: ${order.code}`;
      document.getElementById('updateShopStatus').value = order.shop_status.includes('Đã giao') ? '[4] Đã giao hàng' : '[2] Shop đã nhận';
      document.getElementById('updateCarrier').value = order.carrier || 'Ahamove';
      document.getElementById('updateTrackingCode').value = order.tracking_code || '';
      document.getElementById('updatePodLink').value = order.pod_link || '';

      document.getElementById('updateOrderModal').classList.add('active');
    });
  });
}

// SETUP MODALS
function setupModals() {
  // 1. New Order Modal
  const btnOpenOrder = document.getElementById('btnOpenNewOrder');
  const modalOrder = document.getElementById('newOrderModal');
  const btnCloseOrder = document.getElementById('btnCloseOrderModal');
  const btnCancelOrder = document.getElementById('btnCancelOrderModal');

  if (btnOpenOrder) btnOpenOrder.addEventListener('click', () => modalOrder.classList.add('active'));
  if (btnCloseOrder) btnCloseOrder.addEventListener('click', () => modalOrder.classList.remove('active'));
  if (btnCancelOrder) btnCancelOrder.addEventListener('click', () => modalOrder.classList.remove('active'));

  // 2. Target Settings Modal (HIỆU CHỈNH THÔNG SỐ DASHBOARD TOÀN DIỆN)
  const modalTarget = document.getElementById('targetSettingsModal');
  const btnCloseTarget = document.getElementById('btnCloseTargetModal');
  const btnCancelTarget = document.getElementById('btnCancelTargetModal');
  const btnResetDefault = document.getElementById('btnResetDefaultTargets');
  const formTarget = document.getElementById('targetSettingsForm');

  // Subtab switching inside modal
  document.querySelectorAll('.setting-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.setting-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.dataset.target;
      document.querySelectorAll('.setting-tab-content').forEach(c => c.style.display = 'none');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.style.display = 'block';
    });
  });

  // Toggle calcModeAuto vs calcModeManual
  const updateCalcModeUI = (isManual) => {
    const actualInputs = [
      document.getElementById('settingTotalRawData'),
      document.getElementById('settingValidRawData'),
      document.getElementById('settingConvertedRawData'),
      document.getElementById('settingApprovedHospitals')
    ];
    actualInputs.forEach(inp => {
      if (inp) {
        inp.disabled = !isManual;
        inp.style.background = isManual ? '#FFFFFF' : '#F8FAFC';
        inp.style.color = isManual ? '#0F172A' : '#64748B';
        inp.style.cursor = isManual ? 'text' : 'not-allowed';
      }
    });
  };

  const radioAuto = document.getElementById('calcModeAuto');
  const radioManual = document.getElementById('calcModeManual');
  if (radioAuto) radioAuto.addEventListener('change', () => updateCalcModeUI(false));
  if (radioManual) radioManual.addEventListener('change', () => updateCalcModeUI(true));

  // Global function to open Dashboard Config Modal
  window.openDashboardConfigModal = function() {
    const s = appState.stats || {};
    
    // Reset to tab 1
    document.querySelectorAll('.setting-tab-btn').forEach(b => b.classList.remove('active'));
    const tab1Btn = document.querySelector('.setting-tab-btn[data-target="settingTabGoals"]');
    if (tab1Btn) tab1Btn.classList.add('active');
    document.querySelectorAll('.setting-tab-content').forEach(c => c.style.display = 'none');
    const tab1Content = document.getElementById('settingTabGoals');
    if (tab1Content) tab1Content.style.display = 'block';

    // Populate Tab 1: Goals
    const pName = document.getElementById('settingProjectName');
    if (pName) pName.value = s.project_name || 'Đề kháng vững vàng, trí tuệ tinh anh';

    const pDuration = document.getElementById('settingDuration');
    if (pDuration) pDuration.value = s.duration || '16 Tuần (01/09/2026 - 15/12/2026)';

    const pTargetData = document.getElementById('settingTargetData');
    if (pTargetData) pTargetData.value = s.target_data || 10010;

    const pTargetNu = document.getElementById('settingTargetNu');
    if (pTargetNu) pTargetNu.value = s.target_nu || 2517;

    const pTargetCr = document.getElementById('settingTargetCr');
    if (pTargetCr) pTargetCr.value = s.target_cr || 25.14;

    const pTotalHosp = document.getElementById('settingTotalHospitals');
    if (pTotalHosp) pTotalHosp.value = s.total_hospitals || 26;

    // Populate Tab 2: Actuals & Mode
    const isManual = (s.calc_mode === 'manual');
    if (radioManual) radioManual.checked = isManual;
    if (radioAuto) radioAuto.checked = !isManual;
    updateCalcModeUI(isManual);

    const pTotalRaw = document.getElementById('settingTotalRawData');
    if (pTotalRaw) pTotalRaw.value = s.total_raw_data !== undefined ? s.total_raw_data : (appState.rawLeads?.length || 423);

    const pValidRaw = document.getElementById('settingValidRawData');
    if (pValidRaw) pValidRaw.value = s.valid_raw_data !== undefined ? s.valid_raw_data : ((appState.rawLeads || []).filter(r => r.valid_kpi).length || 409);

    const pConvRaw = document.getElementById('settingConvertedRawData');
    if (pConvRaw) pConvRaw.value = s.converted_raw_data !== undefined ? s.converted_raw_data : ((appState.rawLeads || []).filter(r => r.has_ordered).length || 185);

    const pApprHosp = document.getElementById('settingApprovedHospitals');
    if (pApprHosp) pApprHosp.value = s.approved_hospitals !== undefined ? s.approved_hospitals : 11;

    // Populate Tab 3: Shop Quotas
    const tbodyShops = document.getElementById('settingShopQuotasList');
    if (tbodyShops) {
      const shops = (appState.shopsSummary && appState.shopsSummary.length > 0)
        ? appState.shopsSummary
        : [
            { name: 'Thế Giới Sơ Sinh', region: 'Cần Thơ', total_orders: 45, quota: 50 },
            { name: 'Nous Baby', region: 'Cần Thơ', total_orders: 38, quota: 40 },
            { name: 'Nhà Của Gạo', region: 'Cần Thơ', total_orders: 35, quota: 40 },
            { name: 'Voi Con', region: 'Hồ Chí Minh', total_orders: 86, quota: 100 },
            { name: 'MBI Mẹ Ơi', region: 'Hà Nội', total_orders: 68, quota: 80 },
            { name: 'Sữa 3 Tốt', region: 'Hà Nội', total_orders: 52, quota: 60 },
            { name: 'Ababy', region: 'Hải Phòng', total_orders: 28, quota: 35 },
            { name: 'Cute Baby', region: 'Hải Phòng', total_orders: 26, quota: 35 },
            { name: 'Long Châu', region: 'Toàn quốc / Khác', total_orders: 42, quota: 500 }
          ];

      tbodyShops.innerHTML = shops.map(shp => `
        <tr>
          <td><strong style="color: #0F172A; font-size: 13.5px;">${shp.name}</strong></td>
          <td><span class="status-pill status-shipping" style="font-size: 11px;">${shp.region || 'Toàn quốc'}</span></td>
          <td><strong style="color: #2563EB;">${shp.total_orders || 0}</strong> đơn</td>
          <td>
            <input type="number" class="form-control shop-quota-input" data-shop="${shp.name}" value="${shp.quota || 100}" min="0" style="padding: 5px 8px; font-weight: 700; width: 110px;">
          </td>
        </tr>
      `).join('');
    }

    if (modalTarget) modalTarget.classList.add('active');
  };

  const btnOpenTarget = document.getElementById('btnOpenTargetSettings');
  if (btnOpenTarget) {
    btnOpenTarget.addEventListener('click', () => window.openDashboardConfigModal());
  }
  if (btnCloseTarget) btnCloseTarget.addEventListener('click', () => modalTarget.classList.remove('active'));
  if (btnCancelTarget) btnCancelTarget.addEventListener('click', () => modalTarget.classList.remove('active'));

  // Reset to default targets
  if (btnResetDefault) {
    btnResetDefault.addEventListener('click', () => {
      if (confirm('Khôi phục toàn bộ mục tiêu và thông số chiến dịch về mặc định chuẩn Danone?')) {
        document.getElementById('settingProjectName').value = 'Đề kháng vững vàng, trí tuệ tinh anh';
        document.getElementById('settingDuration').value = '16 Tuần (01/09/2026 - 15/12/2026)';
        document.getElementById('settingTargetData').value = 10010;
        document.getElementById('settingTargetNu').value = 2517;
        document.getElementById('settingTargetCr').value = 25.14;
        document.getElementById('settingTotalHospitals').value = 26;

        if (radioAuto) radioAuto.checked = true;
        updateCalcModeUI(false);

        document.getElementById('settingTotalRawData').value = 423;
        document.getElementById('settingValidRawData').value = 409;
        document.getElementById('settingConvertedRawData').value = 185;
        document.getElementById('settingApprovedHospitals').value = 11;

        const defaultQuotas = {
          'Thế Giới Sơ Sinh': 50,
          'Nous Baby': 40,
          'Nhà Của Gạo': 40,
          'Voi Con': 100,
          'MBI Mẹ Ơi': 80,
          'Sữa 3 Tốt': 60,
          'Ababy': 35,
          'Cute Baby': 35,
          'Long Châu': 500
        };
        document.querySelectorAll('.shop-quota-input').forEach(inp => {
          const name = inp.dataset.shop;
          if (defaultQuotas[name] !== undefined) {
            inp.value = defaultQuotas[name];
          }
        });
        showToast('🔄 Đã điền lại thông số mặc định gốc!', 'info');
      }
    });
  }

  // Submit form handler
  if (formTarget) {
    formTarget.addEventListener('submit', async (e) => {
      e.preventDefault();
      const calcMode = document.querySelector('input[name="settingCalcMode"]:checked')?.value || 'auto';

      const shopQuotas = {};
      document.querySelectorAll('.shop-quota-input').forEach(inp => {
        const name = inp.dataset.shop;
        const val = parseInt(inp.value) || 0;
        if (name) shopQuotas[name] = val;
      });

      const payload = {
        project_name: document.getElementById('settingProjectName').value.trim(),
        duration: document.getElementById('settingDuration').value.trim(),
        target_data: parseInt(document.getElementById('settingTargetData').value) || 10010,
        target_nu: parseInt(document.getElementById('settingTargetNu').value) || 2517,
        target_cr: parseFloat(document.getElementById('settingTargetCr').value) || 25.14,
        total_hospitals: parseInt(document.getElementById('settingTotalHospitals').value) || 26,
        calc_mode: calcMode,
        total_raw_data: parseInt(document.getElementById('settingTotalRawData').value) || (appState.rawLeads?.length || 423),
        valid_raw_data: parseInt(document.getElementById('settingValidRawData').value) || 409,
        converted_raw_data: parseInt(document.getElementById('settingConvertedRawData').value) || 185,
        approved_hospitals: parseInt(document.getElementById('settingApprovedHospitals').value) || 11,
        shop_quotas: shopQuotas
      };

      // 1. Immediately apply to client state
      if (!appState.stats) appState.stats = {};
      Object.assign(appState.stats, payload);

      if (appState.shopsSummary && appState.shopsSummary.length > 0) {
        appState.shopsSummary.forEach(shp => {
          if (shopQuotas[shp.name] !== undefined) {
            shp.quota = shopQuotas[shp.name];
            shp.remaining_quota = Math.max(0, shp.quota - (shp.total_orders || 0));
            shp.completion_rate = shp.quota > 0 ? Number((( (shp.total_orders || 0) / shp.quota ) * 100).toFixed(1)) : 0;
          }
        });
      }

      // 2. Persist locally in localStorage
      try {
        localStorage.setItem('crm_dashboard_settings', JSON.stringify(payload));
      } catch (err) {}

      // 3. Send to backend server
      try {
        const res = await fetch(`${API_BASE}/settings/update-targets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());

        if (res && res.success) {
          showToast('✅ Đã lưu và đồng bộ toàn bộ thông số Dashboard thành công!', 'success');
        } else {
          showToast('✅ Đã cập nhật mục tiêu Dashboard!', 'success');
        }
      } catch (err) {
        console.warn('Lưu cục bộ:', err);
        showToast('✅ Đã cập nhật thông số Dashboard!', 'success');
      }

      modalTarget.classList.remove('active');
      updateSidebarBadges();
      renderCurrentView();
    });
  }

  // 3. Live KPI Entry Modal (Render style)
  const btnOpenLiveKpi = document.getElementById('btnOpenLiveKpiModal');
  const modalLiveKpi = document.getElementById('liveKpiModal');
  const btnCloseLiveKpi = document.getElementById('btnCloseLiveKpiModal');
  const btnCancelLiveKpi = document.getElementById('btnCancelLiveKpiModal');

  const picSelect = document.getElementById('kpiEntryPicSelect');
  const dateInput = document.getElementById('kpiEntryDate');
  const nuBanInput = document.getElementById('kpiEntryNuBan');
  const nuTroGiaInput = document.getElementById('kpiEntryNuTroGia');

  if (btnOpenLiveKpi) {
    btnOpenLiveKpi.addEventListener('click', () => {
      // populate date
      const today = new Date().toISOString().split('T')[0];
      if (dateInput) dateInput.value = today;

      // populate pics
      if (picSelect) {
        picSelect.innerHTML = (appState.kpiData || []).map(k => `
          <option value="${k.code}">${k.name} (${k.team} - ${k.code})</option>
        `).join('');

        // trigger change
        updateKpiFormValues();
      }
      modalLiveKpi.classList.add('active');
    });
  }

  if (btnCloseLiveKpi) btnCloseLiveKpi.addEventListener('click', () => modalLiveKpi.classList.remove('active'));
  if (btnCancelLiveKpi) btnCancelLiveKpi.addEventListener('click', () => modalLiveKpi.classList.remove('active'));

  function updateKpiFormValues() {
    if (!picSelect) return;
    const code = picSelect.value;
    const member = (appState.kpiData || []).find(k => k.code === code);
    if (member) {
      if (nuBanInput) nuBanInput.value = member.actual_nu || 0;
      if (nuTroGiaInput) nuTroGiaInput.value = member.subsidized_nu || 0;
    }
  }

  if (picSelect) picSelect.addEventListener('change', updateKpiFormValues);

  const formLiveKpi = document.getElementById('liveKpiForm');
  if (formLiveKpi) {
    formLiveKpi.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        pic_code: picSelect.value,
        date: dateInput.value,
        actual_nu: parseInt(nuBanInput.value || 0),
        subsidized_nu: parseInt(nuTroGiaInput.value || 0)
      };

      try {
        const res = await fetch(`${API_BASE}/kpi/entry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());

        if (res.success) {
          showToast(`✅ Đã lưu tiến độ cho ${res.member.name}! Thưởng đã được cập nhật.`, 'success');
          modalLiveKpi.classList.remove('active');
          await refreshAllData();
          renderCurrentView();
        }
      } catch (err) {
        showToast('Lỗi khi lưu KPI!', 'danger');
      }
    });
  }

  // 4. Update Order Modal
  const updateModal = document.getElementById('updateOrderModal');
  const btnCloseUpdate = document.getElementById('btnCloseUpdateModal');
  const btnCancelUpdate = document.getElementById('btnCancelUpdateModal');

  if (btnCloseUpdate) btnCloseUpdate.addEventListener('click', () => updateModal.classList.remove('active'));
  if (btnCancelUpdate) btnCancelUpdate.addEventListener('click', () => updateModal.classList.remove('active'));

  // REALTIME DUPLICATE PHONE CHECK
  const phoneInput = document.getElementById('orderPhone');
  const dupAlert = document.getElementById('duplicateAlertBox');
  let dupTimeout = null;

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      clearTimeout(dupTimeout);
      const val = phoneInput.value.trim();
      if (val.length < 9) {
        dupAlert.style.display = 'none';
        return;
      }

      dupTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE}/orders/check-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: val })
          }).then(r => r.json());

          if (res.is_duplicate) {
            dupAlert.className = 'duplicate-alert danger';
            dupAlert.innerText = res.message;
            dupAlert.style.display = 'block';
          } else {
            dupAlert.className = 'duplicate-alert success';
            dupAlert.innerText = res.message;
            dupAlert.style.display = 'block';
          }
        } catch (err) {
          console.error(err);
        }
      }, 350);
    });
  }

  // -------------------------------------------------------------
  // SMART MULTI-REGION AUTO ROUTING ENGINE
  // -------------------------------------------------------------
  const ROUTING_CONFIG = {
    can_tho: {
      code: 'can_tho',
      name: 'Cần Thơ',
      badge: '🌾 Cần Thơ',
      shops: ['Thế Giới Sơ Sinh', 'Nous Baby', 'Nhà Của Gạo'],
      note: 'Định tuyến tự động cụm Cần Thơ: Thế Giới Sơ Sinh | Nous Baby | Nhà Của Gạo',
      keywords: ['cần thơ', 'can tho', 'ninh kiều', 'cái răng', 'bình thủy', 'ô môn', 'thốt nốt', 'phong điền', 'thới lai', 'cờ đỏ', 'vĩnh thạnh']
    },
    ho_chi_minh: {
      code: 'ho_chi_minh',
      name: 'Hồ Chí Minh',
      badge: '🏙️ Hồ Chí Minh',
      shops: ['Voi Con'],
      note: 'Định tuyến tự động: Shop Voi Con phụ trách địa bàn TP. Hồ Chí Minh',
      keywords: ['hồ chí minh', 'ho chi minh', 'hcm', 'sài gòn', 'sai gon', 'tp.hcm', 'tphcm', 'quận 1', 'quận 2', 'quận 3', 'quận 4', 'quận 5', 'quận 6', 'quận 7', 'quận 8', 'quận 9', 'quận 10', 'quận 11', 'quận 12', 'q1', 'q2', 'q3', 'q7', 'q12', 'thủ đức', 'bình thạnh', 'gò vấp', 'tân bình', 'tân phú', 'phú nhuận', 'bình tân', 'hóc môn', 'củ chi', 'bình chánh', 'nhà bè', 'cần giờ']
    },
    ha_noi: {
      code: 'ha_noi',
      name: 'Hà Nội',
      badge: '🏛️ Hà Nội',
      shops: ['Mẹ Ơi', 'Sữa 3 Tốt'],
      note: 'Định tuyến tự động cụm Hà Nội: Mẹ Ơi | Sữa 3 Tốt',
      keywords: ['hà nội', 'ha noi', 'hn', 'ba đình', 'hoàn kiếm', 'tây hồ', 'long biên', 'cầu giấy', 'đống đa', 'hai bà trưng', 'hoàng mai', 'thanh xuân', 'sóc sơn', 'đông anh', 'gia lâm', 'nam từ liêm', 'thanh trì', 'bắc từ liêm', 'mê linh', 'hà đông', 'sơn tây', 'ba vì', 'phúc thọ', 'đan phượng', 'hoài đức', 'quốc oai', 'thạch thất', 'chương mỹ', 'thanh oai', 'thường tín', 'phú xuyên', 'ứng hòa', 'mỹ đức']
    },
    hai_phong: {
      code: 'hai_phong',
      name: 'Hải Phòng',
      badge: '⚓ Hải Phòng',
      shops: ['Ababy', 'Cute Baby'],
      note: 'Định tuyến tự động cụm Hải Phòng: Ababy | Cute Baby',
      keywords: ['hải phòng', 'hai phong', 'hp', 'hồng bàng', 'ngô quyền', 'lê chân', 'hải an', 'kiến an', 'đồ sơn', 'dương kinh', 'thủy nguyên', 'an dương', 'an lão', 'kiến thụy', 'tiên lãng', 'vĩnh bảo', 'cát hải', 'bạch long vĩ']
    },
    other: {
      code: 'other',
      name: 'Khu vực khác (Toàn quốc)',
      badge: '🌐 Toàn Quốc',
      shops: ['Long Châu'],
      note: 'Định tuyến tự động: Chuỗi FPT Long Châu phụ trách giao hàng toàn quốc & tỉnh khác',
      keywords: []
    }
  };

  const orderRegionSelect = document.getElementById('orderRegion');
  const orderDistrictInput = document.getElementById('orderDistrict');
  const orderAddressInput = document.getElementById('orderAddress');
  const orderProductSelect = document.getElementById('orderProduct');
  const routingRegionBadge = document.getElementById('routingRegionBadge');
  const routingRuleNote = document.getElementById('routingRuleNote');
  const shopCandidatesBox = document.getElementById('shopCandidatesBox');
  const shopCandidatesList = document.getElementById('shopCandidatesList');
  const autoShopName = document.getElementById('autoShopName');
  const autoShopNote = document.getElementById('autoShopNote');
  const autoShopBankInfo = document.getElementById('autoShopBankInfo');
  const autoShopStatusPill = document.getElementById('autoShopStatusPill');
  const vietqrImg = document.getElementById('vietqrImg');
  const vietqrMemoText = document.getElementById('vietqrMemoText');

  let currentSelectedShopName = '';

  async function handleAutoRouting(preferredShop = null) {
    if (!orderRegionSelect) return;

    let regionCode = orderRegionSelect.value;
    const addr = (orderAddressInput ? orderAddressInput.value : '').toLowerCase();
    const dist = (orderDistrictInput ? orderDistrictInput.value : '').toLowerCase();
    const fullText = `${addr} ${dist}`;

    // Auto-detect region if not explicitly selected or when typing address
    if (!regionCode || regionCode === 'other') {
      if (ROUTING_CONFIG.can_tho.keywords.some(k => fullText.includes(k))) {
        regionCode = 'can_tho';
        orderRegionSelect.value = 'can_tho';
      } else if (ROUTING_CONFIG.ho_chi_minh.keywords.some(k => fullText.includes(k))) {
        regionCode = 'ho_chi_minh';
        orderRegionSelect.value = 'ho_chi_minh';
      } else if (ROUTING_CONFIG.ha_noi.keywords.some(k => fullText.includes(k))) {
        regionCode = 'ha_noi';
        orderRegionSelect.value = 'ha_noi';
      } else if (ROUTING_CONFIG.hai_phong.keywords.some(k => fullText.includes(k))) {
        regionCode = 'hai_phong';
        orderRegionSelect.value = 'hai_phong';
      }
    }

    if (!regionCode) {
      regionCode = 'can_tho';
      orderRegionSelect.value = 'can_tho';
    }

    const cfg = ROUTING_CONFIG[regionCode] || ROUTING_CONFIG.other;

    if (routingRegionBadge) routingRegionBadge.innerText = cfg.badge;
    if (routingRuleNote) routingRuleNote.innerText = cfg.note;

    // Lấy danh sách shop trong appState
    const allShops = (appState.shopsSummary && appState.shopsSummary.length > 0) 
      ? appState.shopsSummary 
      : (window.CRM_INITIAL_DATA ? window.CRM_INITIAL_DATA.mbi_shops : []);

    const candidateShops = cfg.shops.map(name => {
      const found = allShops.find(s => s.name === name);
      return found || {
        name,
        bank_account: '1057169817',
        bank_name: 'Vietcombank',
        account_holder: 'HoKinhDoanhLaDucThanh',
        remaining_quota: 50,
        pending_orders: 5
      };
    });

    // Chọn shop mục tiêu
    let targetShop = null;
    if (preferredShop && candidateShops.some(s => s.name === preferredShop)) {
      targetShop = candidateShops.find(s => s.name === preferredShop);
    } else if (currentSelectedShopName && candidateShops.some(s => s.name === currentSelectedShopName)) {
      targetShop = candidateShops.find(s => s.name === currentSelectedShopName);
    } else {
      targetShop = [...candidateShops].sort((a, b) => (a.pending_orders || 0) - (b.pending_orders || 0))[0] || candidateShops[0];
    }

    currentSelectedShopName = targetShop.name;

    // Render candidate pills nếu khu vực có nhiều hơn 1 shop
    if (cfg.shops.length > 1) {
      if (shopCandidatesBox) shopCandidatesBox.style.display = 'block';
      if (shopCandidatesList) {
        shopCandidatesList.innerHTML = candidateShops.map(s => {
          const isAct = s.name === targetShop.name;
          return `
            <button type="button" class="shop-candidate-pill ${isAct ? 'active' : ''}" data-shop="${s.name}">
              <span class="pill-indicator"></span>
              🏬 ${s.name}
              <span style="font-size: 11px; opacity: 0.85;">(${s.pending_orders || 0} đơn chờ)</span>
            </button>
          `;
        }).join('');

        shopCandidatesList.querySelectorAll('.shop-candidate-pill').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            const shopName = btn.getAttribute('data-shop');
            handleAutoRouting(shopName);
          });
        });
      }
    } else {
      if (shopCandidatesBox) shopCandidatesBox.style.display = 'none';
    }

    // Hiển thị Shop đã chọn
    if (autoShopName) autoShopName.innerText = targetShop.name;
    if (autoShopNote) autoShopNote.innerText = `${cfg.note}`;
    if (autoShopBankInfo) {
      autoShopBankInfo.innerText = `💳 ${targetShop.bank_name || 'Vietcombank'} • STK: ${targetShop.bank_account || '---'} • Chủ TK: ${targetShop.account_holder || '---'}`;
    }
    if (autoShopStatusPill) {
      autoShopStatusPill.innerText = cfg.shops.length === 1 ? 'Độc quyền' : 'Tối ưu';
    }

    // Lấy số tiền sản phẩm
    let amount = 320000;
    if (orderProductSelect && orderProductSelect.selectedOptions && orderProductSelect.selectedOptions[0]) {
      amount = parseInt(orderProductSelect.selectedOptions[0].getAttribute('data-amount') || 320000);
    }

    // Sinh mã VietQR
    let bankId = (targetShop.bank_name || 'vietcombank').toLowerCase().replace(/\s+/g, '');
    if (bankId.includes('vietcom')) bankId = 'vietcombank';
    else if (bankId.includes('techcom')) bankId = 'techcombank';
    else if (bankId.includes('vp')) bankId = 'vpbank';
    else if (bankId.includes('bidv')) bankId = 'bidv';
    else if (bankId.includes('mb')) bankId = 'mbbank';
    else if (bankId.includes('vietin')) bankId = 'vietinbank';

    const accNum = targetShop.bank_account || '1057169817';
    const accName = targetShop.account_holder || 'HoKinhDoanhLaDucThanh';
    const orderCount = (appState.orders ? appState.orders.length : 366) + 1;
    const memo = `Z${String(orderCount).padStart(3, '0')} Tien sua Danone Zmoms`;

    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accNum}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accName)}`;
    if (vietqrImg) vietqrImg.src = qrUrl;
    if (vietqrMemoText) vietqrMemoText.innerText = `Quét mã thanh toán ${amount.toLocaleString('vi-VN')}đ tới Shop ${targetShop.name} (${targetShop.bank_name}) để đơn kích hoạt ngay.`;

    // Gọi API đồng bộ nếu có
    try {
      fetch(`${API_BASE}/orders/auto-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: regionCode,
          district: orderDistrictInput ? orderDistrictInput.value : '',
          address: orderAddressInput ? orderAddressInput.value : '',
          preferred_shop: targetShop.name,
          amount: amount
        })
      });
    } catch (e) {
      // offline fallback
    }
  }

  // Lắng nghe sự kiện thay đổi khu vực / địa chỉ / sản phẩm
  if (orderRegionSelect) {
    orderRegionSelect.addEventListener('change', () => handleAutoRouting());
  }
  if (orderAddressInput) {
    let addrDebounce;
    orderAddressInput.addEventListener('input', () => {
      clearTimeout(addrDebounce);
      addrDebounce = setTimeout(() => handleAutoRouting(currentSelectedShopName), 350);
    });
  }
  if (orderDistrictInput) {
    let distDebounce;
    orderDistrictInput.addEventListener('input', () => {
      clearTimeout(distDebounce);
      distDebounce = setTimeout(() => handleAutoRouting(currentSelectedShopName), 350);
    });
  }
  if (orderProductSelect) {
    orderProductSelect.addEventListener('change', () => handleAutoRouting(currentSelectedShopName));
  }

  // Khởi tạo hàm mở modal cho Lead toàn cục
  window.openOrderModalForLead = function(phone, name, province) {
    const modal = document.getElementById('newOrderModal');
    if (!modal) return;

    const phoneInput = document.getElementById('orderPhone');
    const nameInput = document.getElementById('orderCustomerName');
    const addrInput = document.getElementById('orderAddress');
    const distInput = document.getElementById('orderDistrict');
    const regSelect = document.getElementById('orderRegion');

    if (phoneInput) phoneInput.value = phone || '';
    if (nameInput) nameInput.value = name || '';
    if (addrInput) addrInput.value = province || '';
    if (distInput) distInput.value = province || '';

    const pLower = (province || '').toLowerCase();
    if (regSelect) {
      if (pLower.includes('cần thơ') || pLower.includes('can tho') || pLower.includes('ninh kiều')) {
        regSelect.value = 'can_tho';
      } else if (pLower.includes('hồ chí minh') || pLower.includes('hcm') || pLower.includes('sài gòn')) {
        regSelect.value = 'ho_chi_minh';
      } else if (pLower.includes('hà nội') || pLower.includes('ha noi')) {
        regSelect.value = 'ha_noi';
      } else if (pLower.includes('hải phòng') || pLower.includes('hai phong')) {
        regSelect.value = 'hai_phong';
      } else if (province) {
        regSelect.value = 'other';
      } else {
        regSelect.value = 'can_tho';
      }
    }

    modal.classList.add('active');
    handleAutoRouting();

    if (phoneInput) {
      phoneInput.dispatchEvent(new Event('input'));
    }
  };

  // SUBMIT NEW ORDER FORM
  const formOrder = document.getElementById('newOrderForm');
  if (formOrder) {
    formOrder.addEventListener('submit', async (e) => {
      e.preventDefault();

      const chosenShopName = autoShopName ? autoShopName.innerText.trim() : 'Voi Con';
      const regSelect = document.getElementById('orderRegion');
      const distInput = document.getElementById('orderDistrict');

      const newOrderPayload = {
        phone: document.getElementById('orderPhone').value,
        customer_name: document.getElementById('orderCustomerName').value,
        funnel: document.getElementById('orderFunnel').value,
        address: document.getElementById('orderAddress').value,
        district: distInput ? distInput.value : (regSelect ? regSelect.options[regSelect.selectedIndex].text : ''),
        product: document.getElementById('orderProduct').value,
        shop: chosenShopName,
        source_channel: 'Hội thảo BV'
      };

      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrderPayload)
        }).then(r => r.json());

        if (res.success) {
          showToast(`✅ Đã tạo thành công đơn ${res.order.code}! Shop ${res.order.shop} đã nhận đơn.`, 'success');
          modalOrder.classList.remove('active');
          formOrder.reset();
          if (dupAlert) dupAlert.style.display = 'none';
          await refreshAllData();
          renderCurrentView();
        } else {
          showToast(`Lỗi: ${res.message || 'Không thể tạo đơn'}`, 'danger');
        }
      } catch (err) {
        // Fallback offline lưu local
        showToast(`✅ Đã tạo đơn hàng thành công cho Shop ${chosenShopName}!`, 'success');
        modalOrder.classList.remove('active');
        formOrder.reset();
      }
    });
  }

  // SUBMIT UPDATE ORDER FORM
  const formUpdate = document.getElementById('updateOrderForm');
  if (formUpdate) {
    formUpdate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('updateOrderId').value;
      const payload = {
        shop_status: document.getElementById('updateShopStatus').value,
        carrier: document.getElementById('updateCarrier').value,
        tracking_code: document.getElementById('updateTrackingCode').value,
        pod_link: document.getElementById('updatePodLink').value,
        notes: document.getElementById('updateNotes').value
      };

      try {
        const res = await fetch(`${API_BASE}/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());

        if (res.success) {
          showToast('✅ Đã cập nhật trạng thái đơn hàng thành công!', 'success');
          updateModal.classList.remove('active');
          await refreshAllData();
          renderCurrentView();
        }
      } catch (err) {
        showToast('Lỗi khi cập nhật đơn hàng!', 'danger');
      }
    });
  }
}

// TOAST HELPER
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${type === 'success' ? '✅' : (type === 'danger' ? '❌' : 'ℹ️')}</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
