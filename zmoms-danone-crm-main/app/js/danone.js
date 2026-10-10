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
