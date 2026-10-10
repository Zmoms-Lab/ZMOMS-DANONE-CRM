function setupNavigation() {
  document.querySelectorAll(".nav-menu .nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const tab = item.dataset.tab;

      if (!canAccessTab(tab)) {
        showToast("Bạn không có quyền truy cập chức năng này.", "danger");
        return;
      }

      appState.currentTab = tab;

      document
        .querySelectorAll(".nav-menu .nav-item")
        .forEach((i) => i.classList.toggle("active", i === item));

      renderCurrentView();
    });
  });

  const exportBtn = document.getElementById("btnExportCSV");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      if (!requirePermission("export")) return;

      window.location.href = `${API_BASE}/export`;
      showToast(
        "📥 Đang tải file dữ liệu Danone_Zmoms_Orders_Export.csv...",
        "success",
      );
    });
  }
}

function setupRoleSwitcher() {
  document.querySelectorAll(".role-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Chỉ cho phép Admin sử dụng bộ chuyển vai trò demo
      if (appState.currentRole !== "admin") return;

      const nextRole = btn.dataset.role;

      if (!CRM_ROLE_PERMISSIONS[nextRole]) return;

      appState.currentRole = nextRole;
      appState.currentTab = getDefaultTab(nextRole);

      document.querySelectorAll(".role-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });

      applyRolePermissions(nextRole);

      showToast(
        `Đã chuyển sang vai trò: ${CRM_ROLE_PERMISSIONS[nextRole].label}`,
        "info",
      );

      renderCurrentView();
    });
  });
}

function renderCurrentView() {
  const container = document.getElementById("mainContent");
  if (!container) return;

  // 1. Kiểm tra vai trò hợp lệ
  if (
    typeof CRM_ROLE_PERMISSIONS === "undefined" ||
    !CRM_ROLE_PERMISSIONS[appState.currentRole]
  ) {
    appState.currentRole = "admin";
  }

  const role = appState.currentRole;

  // 2. Lấy tab mặc định của vai trò
  const defaultTab =
    typeof getDefaultTab === "function" ? getDefaultTab(role) : "dashboard";

  // 3. Chặn truy cập tab không có quyền
  if (
    typeof canAccessTab === "function" &&
    !canAccessTab(appState.currentTab)
  ) {
    appState.currentTab = defaultTab;
  }

  // 4. Cập nhật menu và thông tin vai trò
  if (typeof applyRolePermissions === "function") {
    applyRolePermissions(role);
  }

  document.querySelectorAll(".nav-menu .nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === appState.currentTab);
  });

  // 5. Shop MBI: chỉ hiển thị giao diện riêng của Shop
  if (role === "shop") {
    container.innerHTML = renderShopMBIView();

    if (typeof attachShopEvents === "function") {
      attachShopEvents();
    }

    return;
  }

  // 6. Danone: hiển thị cổng đối tác ở tab riêng
  // Các tab dữ liệu chỉ mở khi được khai báo trong permissions.js.
  if (role === "danone" && appState.currentTab === "danone-portal") {
    container.innerHTML = renderDanonePartnerView();

    if (typeof attachDanoneEvents === "function") {
      attachDanoneEvents();
    }

    return;
  }

  // 7. Render theo tab hiện tại
  switch (appState.currentTab) {
    case "dashboard":
      container.innerHTML = renderDashboardView();
      if (typeof attachDashboardEvents === "function") {
        attachDashboardEvents();
      }
      break;

    case "customers":
      container.innerHTML = renderCustomersView();
      if (typeof attachCustomersEvents === "function") {
        attachCustomersEvents();
      }
      break;

    case "orders":
      container.innerHTML = renderOrdersView();
      if (typeof attachOrdersEvents === "function") {
        attachOrdersEvents();
      }
      break;

    case "shops":
      container.innerHTML = renderShopsSummaryView();
      if (typeof attachShopsSummaryEvents === "function") {
        attachShopsSummaryEvents();
      }
      break;

    case "hospitals":
      container.innerHTML = renderHospitalsView();
      if (typeof attachHospitalEvents === "function") {
        attachHospitalEvents();
      }
      break;

    case "webinars":
      container.innerHTML = renderWebinarsView();
      break;

    case "spas":
      container.innerHTML = renderSpasView();
      break;

    case "midwives":
      container.innerHTML = renderMidwivesView();
      break;

    case "kpi":
      container.innerHTML = renderKPIView();
      if (typeof attachKPIEvents === "function") {
        attachKPIEvents();
      }
      break;

    case "danone-portal":
      container.innerHTML = renderDanonePartnerView();
      if (typeof attachDanoneEvents === "function") {
        attachDanoneEvents();
      }
      break;

    default:
      // Không cho phép rơi vào tab không xác định
      appState.currentTab = defaultTab;

      // Render tab mặc định ngay, không gọi đệ quy
      if (appState.currentTab === "shops" && role === "shop") {
        container.innerHTML = renderShopMBIView();
        if (typeof attachShopEvents === "function") {
          attachShopEvents();
        }
      } else if (appState.currentTab === "danone-portal" && role === "danone") {
        container.innerHTML = renderDanonePartnerView();
        if (typeof attachDanoneEvents === "function") {
          attachDanoneEvents();
        }
      } else {
        container.innerHTML = renderDashboardView();
        if (typeof attachDashboardEvents === "function") {
          attachDashboardEvents();
        }
      }
  }
}

// 1. DASHBOARD VIEW
