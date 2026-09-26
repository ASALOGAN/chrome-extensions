const environmentSelect = document.getElementById("environment");
const userSelect = document.getElementById("user");
const accountGroup = document.getElementById("accountGroup");
const loginServerLabel = environmentSelect.previousElementSibling;
const userIdGroup = document.getElementById("userIdGroup");
const userIdSelect = document.getElementById("userId");
const redirectSelect = document.getElementById("redirect");
const redirectGroup = document.getElementById("redirectGroup");
const redirectInput = document.getElementById("redirectInput");
const addRedirectButton = document.getElementById("addRedirectButton");
const loginButton = document.getElementById("loginButton");
const status = document.getElementById("status");
const manageAccountsButton = document.getElementById("manageAccountsButton");
const loginView = document.getElementById("loginView");
const manageView = document.getElementById("manageView");
const backButton = document.getElementById("backButton");
const accountForm = document.getElementById("accountForm");
const manageServer = document.getElementById("manageServer");
const serverNameInput = document.getElementById("serverName");
const serverUrlInput = document.getElementById("serverUrl");
const createServerButton = document.getElementById("createServerButton");
const createServerForm = document.getElementById("createServerForm");
const saveServerButton = document.getElementById("saveServerButton");
const accountFields = document.getElementById("accountFields");
const serverPicker = manageServer.parentElement;
const serverLabel = document.querySelector('label[for="manageServer"]');
const serverOr = document.getElementById("serverOr");
const openDeleteButton = document.getElementById("openDeleteButton");
const deleteTab = document.getElementById("deleteTab");
const deleteView = document.getElementById("deleteView");
const deleteServerSelect = document.getElementById("deleteServerSelect");
const deleteTypeSelect = document.getElementById("deleteTypeSelect");
const deleteUserSelect = document.getElementById("deleteUserSelect");
const accountPassword = document.getElementById("accountPassword");
const togglePassword = document.getElementById("togglePassword");
const credentialConsent = document.getElementById("credentialConsent");
const accountsTab = document.getElementById("accountsTab");
const redirectsTab = document.getElementById("redirectsTab");
const redirectsView = document.getElementById("redirectsView");
const redirectServer = document.getElementById("redirectServer");
const savedRedirects = document.getElementById("savedRedirects");
const standaloneRedirect = document.getElementById("standaloneRedirect");
const saveStandaloneRedirect = document.getElementById("saveStandaloneRedirect");
const deleteStandaloneRedirect = document.getElementById("deleteStandaloneRedirect");
const manageUser = document.getElementById("manageUser");
const deleteServerButton = document.getElementById("deleteServerButton");
const deleteUserButton = document.getElementById("deleteUserButton");
const deleteRedirectButton = document.getElementById("deleteRedirectButton");

function normalizeServerUrl(value) {
  const input = value.trim();
  if (!/^https?:\/\//i.test(input)) {
    throw new Error("Server URL must start with http:// or https://");
  }
  const url = new URL(input);
  return url.origin;
}

async function getServers() {
  const stored = await chrome.storage.local.get("servers");
  return stored.servers || {};
}

async function saveServers(servers) {
  await chrome.storage.local.set({ servers });
}

async function loadEnvironments() {
  const environments = await getServers();

  environmentSelect.innerHTML = "";

  if (!Object.keys(environments).length) {
    loginServerLabel.hidden = true;
    environmentSelect.hidden = true;
    loginButton.disabled = true;
    loginButton.hidden = true;
    accountGroup.hidden = true;
    openDeleteButton.hidden = true;
    status.textContent = "No servers available. Add a server in Manage accounts.";
    return;
  }

  Object.entries(environments).forEach(([environmentId, environment]) => {
    const option = document.createElement("option");

    option.value = environmentId;
    option.textContent = environment.name;

    environmentSelect.appendChild(option);
  });
}

async function loadUsers() {
  const environments = await getServers();
  const environmentId = environmentSelect.value;
  const environment = environments[environmentId];

  userSelect.innerHTML = "";
  userIdGroup.hidden = true;
  redirectGroup.hidden = true;

  if (!environment) {
    accountGroup.hidden = true;
    loginButton.disabled = true;
    return;
  }

  accountGroup.hidden = false;
  loginServerLabel.hidden = false;
  environmentSelect.hidden = false;
  loginButton.disabled = true;
  loginButton.hidden = false;
  openDeleteButton.hidden = false;

  userSelect.appendChild(new Option("Select account type", ""));

  const users = Object.entries(environment.users);
  [...new Set(users.map(([, user]) => user.type || user.name.split(" - ")[0] || "Account"))].forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;

    userSelect.appendChild(option);
  });
  await loadUserIds();
  await loadRedirects();
}

async function loadRedirects(serverId = environmentSelect.value) {
  const servers = await getServers();
  const redirects = servers[serverId]?.redirects || servers[serverId]?.redirectLinks || [];
  redirectSelect.innerHTML = '<option value="">No redirect</option>';
  redirects.forEach((redirect) => {
    const option = document.createElement("option");
    option.value = redirect;
    option.textContent = redirect;
    redirectSelect.appendChild(option);
  });
  redirectGroup.hidden = redirects.length === 0;
}

async function loadUserIds() {
  const servers = await getServers();
  const server = servers[environmentSelect.value];
  const users = Object.entries(server?.users || {}).filter(([, user]) => (user.type || user.name.split(" - ")[0] || "Account") === userSelect.value);
  userIdSelect.innerHTML = "";
  users.forEach(([id, user]) => { const option = document.createElement("option"); option.value = id; option.textContent = user.username; userIdSelect.appendChild(option); });
  userIdGroup.hidden = users.length <= 1;
  if (users.length === 1) {
    userIdSelect.value = users[0][0];
    loginButton.disabled = false;
  } else {
    userIdSelect.insertBefore(new Option("Select user", ""), userIdSelect.firstChild);
    userIdSelect.value = "";
    loginButton.disabled = true;
  }
  if (!userSelect.value) loginButton.disabled = true;
}

environmentSelect.addEventListener("change", async () => {
  await loadUsers();
  await loadRedirects(environmentSelect.value);
});
userSelect.addEventListener("change", loadUserIds);
userIdSelect.addEventListener("change", () => { loginButton.disabled = !userIdSelect.value; });

addRedirectButton.addEventListener("click", async () => {
  const value = redirectInput.value.trim();
  const serverId = manageServer.value;
  if (!serverId || !value) { status.textContent = "Select a server and enter a redirect."; return; }
  const servers = await getServers();
  const server = servers[serverId];
  server.redirects ||= [];
  const redirect = value.startsWith("/") ? value : `/${value}`;
  const existed = server.redirects.includes(redirect);
  if (!existed) {
    server.redirects.push(redirect);
    await saveServers(servers);
  }
  redirectInput.value = "";
  status.textContent = existed ? "Redirect already exists." : "Redirect saved.";
  await loadRedirects(manageServer.value);
});

loadEnvironments().then(loadUsers);

manageAccountsButton.addEventListener("click", () => {
  loginView.hidden = true;
  manageView.hidden = false;
  loadManageServers();
});

accountsTab.addEventListener("click", async () => { accountForm.hidden = false; redirectsView.hidden = true; deleteView.hidden = true; accountsTab.classList.add("active"); redirectsTab.classList.remove("active"); deleteTab.classList.remove("active"); await loadManageServers(); });
redirectsTab.addEventListener("click", async () => { accountForm.hidden = true; redirectsView.hidden = false; deleteView.hidden = true; redirectsTab.classList.add("active"); accountsTab.classList.remove("active"); deleteTab.classList.remove("active"); await loadRedirectServers(); });
deleteTab.addEventListener("click", async () => { accountForm.hidden = true; redirectsView.hidden = true; deleteView.hidden = false; deleteTab.classList.add("active"); accountsTab.classList.remove("active"); redirectsTab.classList.remove("active"); await loadDeleteServers(); });
openDeleteButton.addEventListener("click", async () => { loginView.hidden = true; manageView.hidden = false; deleteTab.click(); });

async function loadDeleteServers() {
  const servers = await getServers();
  deleteServerSelect.innerHTML = "";
  Object.entries(servers).forEach(([id, server]) => deleteServerSelect.appendChild(new Option(server.name, id)));
  await loadDeleteUsers();
}
async function loadDeleteUsers() {
  const servers = await getServers();
  const users = Object.entries(servers[deleteServerSelect.value]?.users || {});
  deleteTypeSelect.innerHTML = "";
  [...new Set(users.map(([, user]) => user.type || user.name.split(" - ")[0] || "Account"))].forEach((type) => deleteTypeSelect.appendChild(new Option(type, type)));
  deleteUserSelect.innerHTML = "";
  users.filter(([, user]) => (user.type || user.name.split(" - ")[0] || "Account") === deleteTypeSelect.value).forEach(([id, user]) => deleteUserSelect.appendChild(new Option(user.username || user.name, id)));
}
deleteServerSelect.addEventListener("change", loadDeleteUsers);
deleteTypeSelect.addEventListener("change", loadDeleteUsers);
document.getElementById("deleteServerAction").addEventListener("click", async () => { if (!deleteServerSelect.value || !confirm("Delete this server and all its users?")) return; const servers = await getServers(); delete servers[deleteServerSelect.value]; await saveServers(servers); await loadDeleteServers(); await loadEnvironments(); await loadUsers(); });
document.getElementById("deleteUserAction").addEventListener("click", async () => { if (!deleteServerSelect.value || !deleteUserSelect.value || !confirm("Delete this user?")) return; const servers = await getServers(); delete servers[deleteServerSelect.value].users[deleteUserSelect.value]; await saveServers(servers); await loadDeleteUsers(); await loadEnvironments(); await loadUsers(); });
togglePassword.addEventListener("click", () => { const visible = accountPassword.type === "text"; accountPassword.type = visible ? "password" : "text"; togglePassword.textContent = visible ? "◉" : "◌"; togglePassword.setAttribute("aria-label", visible ? "Show password" : "Hide password"); togglePassword.title = visible ? "Show password" : "Hide password"; });

async function loadRedirectServers() {
  const servers = await getServers();
  redirectServer.innerHTML = "";
  Object.entries(servers).forEach(([id, server]) => redirectServer.appendChild(new Option(server.name, id)));
  await loadStandaloneRedirects();
}

async function loadStandaloneRedirects() {
  const servers = await getServers();
  savedRedirects.innerHTML = "";
  (servers[redirectServer.value]?.redirects || []).forEach((redirect) => savedRedirects.appendChild(new Option(redirect, redirect)));
}

redirectServer.addEventListener("change", loadStandaloneRedirects);
saveStandaloneRedirect.addEventListener("click", async () => {
  const value = standaloneRedirect.value.trim();
  const servers = await getServers();
  const server = servers[redirectServer.value];
  if (!server || !value) return;
  server.redirects ||= [];
  const redirect = value.startsWith("/") ? value : `/${value}`;
  if (!server.redirects.includes(redirect)) { server.redirects.push(redirect); await saveServers(servers); }
  standaloneRedirect.value = "";
  await loadStandaloneRedirects();
  await loadRedirects(environmentSelect.value);
});
deleteStandaloneRedirect.addEventListener("click", async () => {
  const servers = await getServers();
  const server = servers[redirectServer.value];
  if (!server || !savedRedirects.value || !confirm("Delete this redirect?")) return;
  server.redirects = (server.redirects || []).filter((redirect) => redirect !== savedRedirects.value);
  await saveServers(servers);
  await loadStandaloneRedirects();
});

async function loadManageServers(selectedId = "") {
  const servers = await getServers();
  const hasServers = Object.keys(servers).length > 0;
  manageServer.hidden = false;
  serverLabel.hidden = false;
  manageServer.innerHTML = '<option value="">Add a new server</option>';
  Object.entries(servers).forEach(([id, server]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = server.name;
    manageServer.appendChild(option);
  });
  manageServer.value = selectedId;
  accountFields.hidden = !selectedId;
  createServerButton.hidden = Boolean(selectedId);
  serverOr.hidden = Boolean(selectedId) || !hasServers;
  createServerForm.hidden = true;
  deleteServerButton.hidden = !selectedId;
  serverLabel.hidden = !hasServers;
  manageServer.hidden = !hasServers;
  redirectsTab.hidden = !hasServers;
  deleteTab.hidden = !hasServers;
  if (!hasServers) {
    accountsTab.hidden = false;
    accountFields.hidden = true;
    createServerButton.hidden = false;
    serverOr.hidden = true;
  }
  await loadManageUsers();
}

manageServer.addEventListener("change", async () => {
  const servers = await getServers();
  const server = servers[manageServer.value];
  serverNameInput.value = server?.name || "";
  serverUrlInput.value = server?.loginUrl || "";
  serverNameInput.readOnly = Boolean(server);
  serverUrlInput.readOnly = Boolean(server);
  accountFields.hidden = !manageServer.value;
  createServerButton.hidden = Boolean(manageServer.value);
  deleteServerButton.hidden = !manageServer.value;
  await loadManageUsers();
});

async function loadManageUsers() {
  const servers = await getServers();
  manageUser.innerHTML = "";
  Object.entries(servers[manageServer.value]?.users || {}).forEach(([id, user]) => {
    manageUser.appendChild(new Option(user.username || user.name, id));
  });
}

deleteServerButton.addEventListener("click", async () => {
  const id = manageServer.value;
  if (!id || !confirm("Delete this server and all its users?")) return;
  const servers = await getServers();
  delete servers[id];
  await saveServers(servers);
  await loadManageServers();
  await loadEnvironments();
  await loadUsers();
  status.textContent = "Server deleted.";
});

deleteUserButton.addEventListener("click", async () => {
  const serverId = manageServer.value;
  const userId = manageUser.value;
  if (!serverId || !userId || !confirm("Delete this user?")) return;
  const servers = await getServers();
  delete servers[serverId].users[userId];
  await saveServers(servers);
  await loadManageUsers();
  await loadEnvironments();
  await loadUsers();
  status.textContent = "User deleted.";
});

deleteRedirectButton.addEventListener("click", async () => {
  const serverId = manageServer.value;
  const redirect = redirectSelect.value;
  if (!serverId || !redirect || !confirm("Delete this redirect?")) return;
  const servers = await getServers();
  servers[serverId].redirects = (servers[serverId].redirects || []).filter((item) => item !== redirect);
  await saveServers(servers);
  await loadRedirects();
  status.textContent = "Redirect deleted.";
});

createServerButton.addEventListener("click", () => {
  manageServer.hidden = true;
  serverLabel.hidden = true;
  createServerButton.hidden = true;
  serverOr.hidden = true;
  createServerForm.hidden = false;
  accountFields.hidden = true;
  serverNameInput.value = "";
  serverUrlInput.value = "";
  serverNameInput.readOnly = false;
  serverUrlInput.readOnly = false;
});

saveServerButton.addEventListener("click", async () => {
  const name = serverNameInput.value.trim();
  let url;
  try { url = normalizeServerUrl(serverUrlInput.value); } catch (error) { status.textContent = error.message; status.classList.add("error"); return; }
  if (!name || !url) { status.textContent = "Enter a server name and URL."; return; }
  const servers = await getServers();
  const duplicate = Object.entries(servers).find(([, server]) =>
    server.name.toLowerCase() === name.toLowerCase() || server.loginUrl.replace(/\/$/, "") === url,
  );
  if (duplicate) {
    await loadManageServers(duplicate[0]);
    createServerForm.hidden = true;
    status.textContent = "That server already exists and was selected.";
    return;
  }
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  servers[id] = { name, loginUrl: url, users: {}, redirects: [] };
  await saveServers(servers);
  await loadManageServers(id);
  manageServer.hidden = false;
  serverNameInput.value = "";
  serverUrlInput.value = "";
  status.textContent = "Server created.";
});

backButton.addEventListener("click", () => {
  status.textContent = "";
  status.classList.remove("error");
  manageView.hidden = true;
  loginView.hidden = false;
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!credentialConsent.checked) {
    status.textContent = "Please confirm local credential storage before saving.";
    status.classList.add("error");
    return;
  }
  const values = Object.fromEntries(new FormData(accountForm));
  const stored = await chrome.storage.local.get("servers");
  const servers = stored.servers || {};
  const serverId = manageServer.value;
  if (!serverId || !servers[serverId]) { status.textContent = "Select or create a server first."; return; }
  const server = servers[serverId];
  const accountId = `${values.accountType.toLowerCase()}-${values.accountUsername.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const encryptedPassword = await encryptPassword(values.accountPassword);
  server.users[accountId] = { name: `${values.accountType} - ${values.accountUsername}`, type: values.accountType, username: values.accountUsername, password: encryptedPassword };
  await chrome.storage.local.set({ servers });
  await loadManageServers(serverId);
  accountForm.reset();
  status.textContent = "Account saved locally.";
  status.classList.remove("error");
  setTimeout(() => { status.textContent = ""; }, 2500);
  await loadEnvironments();
  await loadUsers();
  backButton.click();
});

loginButton.addEventListener("click", async () => {
  const environmentId = environmentSelect.value;
  const selectedType = userSelect.value;

  const environments = await getServers();
  const environment = environments[environmentId];

  const matchingUsers = Object.entries(environment?.users || {}).filter(([, candidate]) => (candidate.type || candidate.name.split(" - ")[0] || "Account") === selectedType);
  const userId = userIdGroup.hidden ? matchingUsers[0]?.[0] : userIdSelect.value;
  const user = environment?.users?.[userId];

  if (!environment || !user) {
    status.textContent = "Invalid environment or user.";
    return;
  }

  status.textContent = "Opening login page...";

  if (!user.password) {
    status.textContent = "Login cancelled.";
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "START_LOGIN",
      loginUrl: environment.loginUrl,
      environmentId,
      userId,
      username: user.username,
      redirect: redirectSelect.value,
    });

    console.log("START_LOGIN response:", response);

    if (!response?.success) {
      throw new Error(response?.error || "Unable to start login.");
    }

    status.textContent = "Logging in...";
  } catch (error) {
    console.error("Login failed:", error);

    status.textContent = error.message || "Unable to login.";
  }
});
