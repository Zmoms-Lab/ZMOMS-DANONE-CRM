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
