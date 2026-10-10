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
