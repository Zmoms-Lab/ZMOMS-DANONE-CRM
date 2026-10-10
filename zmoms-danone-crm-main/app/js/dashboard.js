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
