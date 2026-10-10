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
