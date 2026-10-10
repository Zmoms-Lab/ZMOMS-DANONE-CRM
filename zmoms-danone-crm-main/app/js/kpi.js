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
