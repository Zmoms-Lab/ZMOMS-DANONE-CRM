const DEMO_ACCOUNTS = {
  admin: {
    password: "Admin@123",
    role: "admin",
  },
  sales: {
    password: "Sales@123",
    role: "sales",
  },
  midwife: {
    password: "Midwife@123",
    role: "midwife",
  },
  shop: {
    password: "Shop@123",
    role: "shop",
  },
  danone: {
    password: "Danone@123",
    role: "danone",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage = window.location.pathname.endsWith("/login.html");
  const validRoles = Object.keys(DEMO_ACCOUNTS);
  const savedRole = sessionStorage.getItem("crm_demo_role");

  if (isLoginPage && savedRole && validRoles.includes(savedRole)) {
    window.location.replace("index.html");
    return;
  }

  if (!isLoginPage && (!savedRole || !validRoles.includes(savedRole))) {
    sessionStorage.removeItem("crm_demo_role");
    window.location.replace("login.html");
    return;
  }

  const form = document.getElementById("loginForm");
  const accountInput = document.getElementById("demoAccount");
  const passwordInput = document.getElementById("demoPassword");
  const errorElement = document.getElementById("loginError");
  const togglePassword = document.getElementById("togglePassword");
  const logoutButton = document.getElementById("btnLogout");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      sessionStorage.removeItem("crm_demo_role");
      window.location.replace("login.html");
    });
  }

  if (!form || !accountInput || !passwordInput) return;

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const showPassword = passwordInput.type === "password";
      passwordInput.type = showPassword ? "text" : "password";
      togglePassword.textContent = showPassword ? "Ẩn" : "Hiện";
      togglePassword.setAttribute(
        "aria-label",
        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
      );
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const account = accountInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const selectedAccount = DEMO_ACCOUNTS[account];

    if (errorElement) {
      errorElement.hidden = true;
      errorElement.textContent = "";
    }

    if (!selectedAccount || password !== selectedAccount.password) {
      if (errorElement) {
        errorElement.textContent = "Tài khoản hoặc mật khẩu không chính xác.";
        errorElement.hidden = false;
      } else {
        alert("Tài khoản hoặc mật khẩu không chính xác.");
      }

      passwordInput.focus();
      return;
    }

    sessionStorage.setItem("crm_demo_role", selectedAccount.role);
    window.location.replace("index.html");
  });
});
