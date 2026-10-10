const API_BASE = "/api";

let appState = {
  currentRole: sessionStorage.getItem("crm_demo_role") || "",
  currentTab: "dashboard",
  selectedShop: "Tất cả các shop",
  orderFilterShop: "",
  customerSubTab: "raw",
  stats: null,
  orders: [],
  rawLeads: [],
  customers: [],
  hospitals: [],
  midwives: [],
  spas: [],
  webinars: [],
  weeks: [],
  shopsSummary: [],
  kpiData: [],
  actionItems: [],
  kpiSliderValue: 100,
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const demoRole = sessionStorage.getItem("crm_demo_role");
    const validRoles = ["admin", "sales", "midwife", "shop", "danone"];

    if (
      !validRoles.includes(demoRole) ||
      (typeof CRM_ROLE_PERMISSIONS !== "undefined" &&
        !CRM_ROLE_PERMISSIONS[demoRole])
    ) {
      sessionStorage.removeItem("crm_demo_role");
      window.location.replace("login.html");
      return;
    }

    appState.currentRole = demoRole;

    if (typeof setupNavigation === "function") {
      setupNavigation();
    }

    if (typeof setupRoleSwitcher === "function") {
      setupRoleSwitcher();
    }

    if (typeof setupModals === "function") {
      setupModals();
    }

    loadInitialData();
    normalizeCurrentRole();
    setDefaultTabForCurrentRole();

    if (typeof renderCurrentView === "function") {
      renderCurrentView();
    }

    await refreshAllData();

    if (typeof renderCurrentView === "function") {
      renderCurrentView();
    }
  } catch (error) {
    console.error("CRM initialization error:", error);

    if (typeof showToast === "function") {
      showToast("Không thể khởi tạo đầy đủ giao diện CRM.", "danger");
    }
  }
});

function loadInitialData() {
  const init = window.CRM_INITIAL_DATA;

  if (!init) {
    return;
  }

  appState.orders = Array.isArray(init.orders) ? init.orders : [];
  appState.rawLeads = Array.isArray(init.raw_leads) ? init.raw_leads : [];
  appState.customers = Array.isArray(init.customers) ? init.customers : [];
  appState.hospitals = Array.isArray(init.hospitals) ? init.hospitals : [];
  appState.midwives = Array.isArray(init.midwives) ? init.midwives : [];
  appState.spas = Array.isArray(init.spas) ? init.spas : [];
  appState.webinars = Array.isArray(init.webinars) ? init.webinars : [];
  appState.weeks = Array.isArray(init.weeks) ? init.weeks : [];
  appState.shopsSummary = Array.isArray(init.mbi_shops) ? init.mbi_shops : [];
  appState.kpiData = Array.isArray(init.sales_team) ? init.sales_team : [];
  appState.actionItems = Array.isArray(init.action_items)
    ? init.action_items
    : [];

  const validCount = appState.rawLeads.filter((lead) => lead.valid_kpi).length;

  const orderedCount = appState.orders.length;

  const deliveredCount = appState.orders.filter((order) =>
    order.shop_status?.includes("Đã giao"),
  ).length;

  const pendingCount = appState.orders.filter(
    (order) =>
      order.shop_status?.includes("Chờ") ||
      order.shop_status?.includes("Shop đã nhận"),
  ).length;

  const shippingCount = appState.orders.filter((order) =>
    order.shop_status?.includes("Đang giao"),
  ).length;

  appState.stats = {
    project_name:
      init.meta?.project_name || "Đề kháng vững vàng, trí tuệ tinh anh",
    duration: init.meta?.duration || "16 Tuần (01/09/2026 - 15/12/2026)",
    target_data: init.meta?.target_data || 10010,
    target_nu: init.meta?.target_nu || 2517,
    target_cr: init.meta?.target_cr || 25.14,
    total_hospitals: init.meta?.total_hospitals || 26,
    approved_hospitals: init.meta?.approved_hospitals || 11,
    calc_mode: init.meta?.calc_mode || "auto",
    actual_data: appState.rawLeads.length || 423,
    percent_data: 11.5,
    actual_nu: orderedCount || 366,
    percent_nu: 14.5,
    total_orders: orderedCount || 366,
    delivered_orders: deliveredCount || 204,
    pending_orders: pendingCount || 80,
    shipping_orders: shippingCount || 71,
    sla_alert_count: 80,
    total_raw_data:
      init.meta?.total_raw_data || appState.rawLeads.length || 423,
    valid_raw_data: init.meta?.valid_raw_data || validCount || 409,
    invalid_raw_data: appState.rawLeads.length - validCount || 14,
    converted_raw_data:
      init.meta?.converted_raw_data ||
      appState.rawLeads.filter((lead) => lead.has_ordered).length ||
      185,
  };

  loadSavedDashboardSettings();
  updateSidebarBadges();
}

function loadSavedDashboardSettings() {
  try {
    const savedSettings = localStorage.getItem("crm_dashboard_settings");

    if (!savedSettings || !appState.stats) {
      return;
    }

    const parsed = JSON.parse(savedSettings);
    Object.assign(appState.stats, parsed);

    if (parsed.shop_quotas && Array.isArray(appState.shopsSummary)) {
      appState.shopsSummary.forEach((shop) => {
        if (parsed.shop_quotas[shop.name] === undefined) {
          return;
        }

        shop.quota = Number(parsed.shop_quotas[shop.name]);

        shop.remaining_quota = Math.max(
          0,
          shop.quota - (shop.total_orders || 0),
        );

        shop.completion_rate =
          shop.quota > 0
            ? Number((((shop.total_orders || 0) / shop.quota) * 100).toFixed(1))
            : 0;
      });
    }
  } catch (error) {
    console.warn("LocalStorage settings error:", error);
  }
}

function updateSidebarBadges() {
  const badgeOrders = document.getElementById("orderCountBadge");
  const badgeCustomers = document.getElementById("customerCountBadge");
  const badgeShops = document.getElementById("shopCountBadge");
  const campaignTitle = document.getElementById("topbarCampaignTitle");
  const slaPill = document.getElementById("slaAlertPill");

  if (badgeOrders) {
    badgeOrders.innerText = appState.orders.length || 366;
  }

  if (badgeCustomers) {
    badgeCustomers.innerText = appState.rawLeads.length || 423;
  }

  if (badgeShops) {
    badgeShops.innerText = `${appState.shopsSummary.length || 9} Shop`;
  }

  if (campaignTitle && appState.stats) {
    campaignTitle.innerText = `Chiến Dịch: ${
      appState.stats.project_name || "Danone Aptamil x Zmoms"
    } • ${appState.stats.duration || "16 Tuần"}`;
  }

  if (slaPill && appState.stats) {
    const alertCount = Number(appState.stats.sla_alert_count || 0);

    slaPill.innerText = `⚡ SLA: ${alertCount} Đơn Cần Tiếp Nhận / Giao Hàng`;

    slaPill.className =
      alertCount > 0
        ? "status-pill status-danger"
        : "status-pill status-delivered";
  }
}

async function fetchApiData(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API ${endpoint} returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Không tải được ${endpoint}:`, error);
    return null;
  }
}

async function refreshAllData() {
  const endpoints = [
    "/stats",
    "/orders",
    "/customers",
    "/raw-leads",
    "/hospitals",
    "/midwives",
    "/spas",
    "/webinars",
    "/weeks",
    "/shops/summary",
    "/kpi",
    "/action-items",
  ];

  const results = await Promise.all(
    endpoints.map((endpoint) => fetchApiData(endpoint)),
  );

  const [
    statsRes,
    ordersRes,
    customersRes,
    rawRes,
    hospitalsRes,
    midwivesRes,
    spasRes,
    webinarsRes,
    weeksRes,
    shopsRes,
    kpiRes,
    actionItemsRes,
  ] = results;

  if (statsRes?.data && typeof statsRes.data === "object") {
    appState.stats = statsRes.data;
  }

  if (Array.isArray(ordersRes?.data)) {
    appState.orders = ordersRes.data;
  }

  if (Array.isArray(customersRes?.data)) {
    appState.customers = customersRes.data;
  }

  if (Array.isArray(rawRes?.data)) {
    appState.rawLeads = rawRes.data;
  }

  if (Array.isArray(hospitalsRes?.data)) {
    appState.hospitals = hospitalsRes.data;
  }

  if (Array.isArray(midwivesRes?.data)) {
    appState.midwives = midwivesRes.data;
  }

  if (Array.isArray(spasRes?.data)) {
    appState.spas = spasRes.data;
  }

  if (Array.isArray(webinarsRes?.data)) {
    appState.webinars = webinarsRes.data;
  }

  if (Array.isArray(weeksRes?.data)) {
    appState.weeks = weeksRes.data;
  }

  if (Array.isArray(shopsRes?.data)) {
    appState.shopsSummary = shopsRes.data;
  }

  if (Array.isArray(kpiRes?.data)) {
    appState.kpiData = kpiRes.data;
  }

  if (Array.isArray(actionItemsRes?.data)) {
    appState.actionItems = actionItemsRes.data;
  }

  updateSidebarBadges();
}

function normalizeCurrentRole() {
  const validRoles = ["admin", "sales", "midwife", "shop", "danone"];

  if (!validRoles.includes(appState.currentRole)) {
    sessionStorage.removeItem("crm_demo_role");
    window.location.replace("login.html");
    return;
  }

  if (
    typeof CRM_ROLE_PERMISSIONS !== "undefined" &&
    !CRM_ROLE_PERMISSIONS[appState.currentRole]
  ) {
    sessionStorage.removeItem("crm_demo_role");
    window.location.replace("login.html");
  }
}

function setDefaultTabForCurrentRole() {
  if (typeof getDefaultTab === "function") {
    appState.currentTab = getDefaultTab(appState.currentRole);
    return;
  }

  const fallbackTabs = {
    admin: "dashboard",
    sales: "dashboard",
    midwife: "midwives",
    shop: "shops",
    danone: "danone-portal",
  };

  appState.currentTab = fallbackTabs[appState.currentRole] || "dashboard";
}

function canOpenTab(tab) {
  if (typeof canAccessTab === "function") {
    return canAccessTab(tab);
  }

  const fallbackPermissions = {
    admin: [
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
    sales: ["dashboard", "customers", "orders", "kpi"],
    midwife: ["hospitals", "webinars", "midwives"],
    shop: ["shops"],
    danone: [
      "dashboard",
      "customers",
      "orders",
      "shops",
      "hospitals",
      "danone-portal",
    ],
  };

  return (fallbackPermissions[appState.currentRole] || []).includes(tab);
}

function showPermissionDenied(message) {
  if (typeof showToast === "function") {
    showToast(
      message || "Bạn không có quyền thực hiện thao tác này.",
      "danger",
    );
  } else {
    console.warn(message || "Permission denied.");
  }
}
