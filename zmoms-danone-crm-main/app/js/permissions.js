/**
 * ZMOMS × DANONE CRM
 * Role-Based Access Control (RBAC) - bản demo frontend
 *
 * Roles:
 * admin, sales, midwife, shop, danone
 */

const CRM_ROLE_PERMISSIONS = {
  admin: {
    label: "Quản Lý Zmoms (Admin)",
    description: "Toàn quyền điều hành & kiểm soát",
    avatar: "AD",
    color: "#0066CC",
    defaultTab: "dashboard",
    tabs: [
      "dashboard",
      "customers",
      "orders",
      "shops",
      "hospitals",
      "webinars",
      "spas",
      "midwives",
      "kpi",
      "danone-portal",
    ],
    actions: [
      "export",
      "createOrder",
      "updateOrder",
      "settings",
      "updateKpi",
      "updateHospital",
    ],
  },

  sales: {
    label: "Chuyên Viên Sales / CSKH",
    description: "Lên đơn & theo dõi hoa hồng",
    avatar: "SA",
    color: "#FF5A5F",
    defaultTab: "dashboard",
    tabs: ["dashboard", "customers", "orders", "kpi"],
    actions: ["createOrder", "updateOrder"],
  },

  midwife: {
    label: "Nữ Hộ Sinh (Midwife)",
    description: "Chăm sóc & tư vấn 1-1 tại nhà",
    avatar: "HS",
    color: "#10B981",
    defaultTab: "midwives",
    tabs: ["hospitals", "webinars", "midwives"],
    actions: [],
  },

  shop: {
    label: "Cổng Cửa Hàng (Shop MBI)",
    description: "Theo dõi và xử lý đơn hàng của Shop",
    avatar: "MB",
    color: "#8B5CF6",
    defaultTab: "shops",
    tabs: ["shops"],
    actions: ["updateOrder"],
  },

  danone: {
    label: "Đối Tác Danone Aptamil",
    description: "Cổng điều hành & giám sát SLA",
    avatar: "DA",
    color: "#0077CC",
    defaultTab: "danone-portal",
    tabs: [
      "dashboard",
      "customers",
      "orders",
      "shops",
      "hospitals",
      "danone-portal",
    ],
    actions: ["export"],
  },
};

// Kiểm tra quyền tab
function canAccessTab(tab) {
  const permissions = CRM_ROLE_PERMISSIONS[appState.currentRole];
  return Boolean(permissions && permissions.tabs.includes(tab));
}

// Kiểm tra quyền thao tác
function hasPermission(action) {
  const permissions = CRM_ROLE_PERMISSIONS[appState.currentRole];
  return Boolean(permissions && permissions.actions.includes(action));
}

// Chọn tab mặc định hợp lệ
function getDefaultTab(role) {
  const permissions = CRM_ROLE_PERMISSIONS[role];

  if (!permissions) return "dashboard";

  if (permissions.tabs.includes(permissions.defaultTab)) {
    return permissions.defaultTab;
  }

  return permissions.tabs[0] || "dashboard";
}

// Cập nhật thông tin vai trò ở sidebar
function updateRoleProfile(role) {
  const permissions = CRM_ROLE_PERMISSIONS[role];
  if (!permissions) return;

  const nameEl = document.getElementById("currentRoleName");
  const descEl = document.getElementById("currentRoleDesc");
  const avatarEl = document.getElementById("currentRoleAvatar");

  if (nameEl) nameEl.textContent = permissions.label;
  if (descEl) descEl.textContent = permissions.description;

  if (avatarEl) {
    avatarEl.textContent = permissions.avatar;
    avatarEl.style.background = permissions.color;
  }
}

// Áp dụng quyền lên giao diện
function applyRolePermissions(role) {
  const permissions = CRM_ROLE_PERMISSIONS[role];

  if (!permissions) {
    console.error("Vai trò không hợp lệ:", role);
    return;
  }

  // Hiển thị/ẩn menu theo quyền
  document.querySelectorAll(".nav-menu .nav-item").forEach((item) => {
    const allowed = permissions.tabs.includes(item.dataset.tab);
    item.hidden = !allowed;
    item.classList.toggle("active", item.dataset.tab === appState.currentTab);
  });

  // Ẩn tiêu đề nhóm menu nếu không còn mục nào được phép
  document.querySelectorAll(".nav-menu .nav-category").forEach((category) => {
    let next = category.nextElementSibling;
    let hasVisibleItem = false;

    while (next && !next.classList.contains("nav-category")) {
      if (next.classList.contains("nav-item") && !next.hidden) {
        hasVisibleItem = true;
        break;
      }
      next = next.nextElementSibling;
    }

    category.hidden = !hasVisibleItem;
  });

  // Ẩn các nút thao tác theo quyền
  const actionElements = [
    ["btnExportCSV", "export"],
    ["btnOpenNewOrder", "createOrder"],
    ["btnOpenTargetSettings", "settings"],
    ["btnOpenLiveKpiModal", "updateKpi"],
  ];

  actionElements.forEach(([id, action]) => {
    const element = document.getElementById(id);
    if (element) element.hidden = !hasPermission(action);
  });

  // Bộ chuyển vai trò chỉ dành cho demo.
  // Tài khoản thường không được tự đổi vai trò.
  const roleSwitcher = document.querySelector(".role-switcher-container");

  if (roleSwitcher) {
    roleSwitcher.hidden = role !== "admin";
  }

  updateRoleProfile(role);
}

// Chuyển sang tab hợp lệ nếu tab hiện tại không được phép
function ensureAllowedTab() {
  if (canAccessTab(appState.currentTab)) return true;

  appState.currentTab = getDefaultTab(appState.currentRole);
  return false;
}

// Kiểm tra quyền trước khi chạy thao tác
function requirePermission(action) {
  if (hasPermission(action)) return true;

  if (typeof showToast === "function") {
    showToast("Bạn không có quyền thực hiện thao tác này.", "danger");
  }

  return false;
}
