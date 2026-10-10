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
