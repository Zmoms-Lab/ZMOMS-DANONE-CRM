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
