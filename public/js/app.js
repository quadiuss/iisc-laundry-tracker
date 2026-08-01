
// public/js/app.js
// Handles: checking if this device already has a saved identity,
// rendering the machine dashboard, subscribing to live updates,
// and calling the toggle function.

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const machineGrid = document.getElementById("machine-grid");
const welcomeText = document.getElementById("welcome-text");
const dashboardError = document.getElementById("dashboard-error");

function getIdentity() {
  const name = localStorage.getItem("laundry_name");
  const phone = localStorage.getItem("laundry_phone");
  return name && phone ? { name, phone } : null;
}

function showDashboard(name) {
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  welcomeText.textContent = name ? `Hi, ${name}` : "";
}

function showLogin() {
  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMachines(machines) {
  machineGrid.innerHTML = "";

  machines
    .sort((a, b) => a.id - b.id)
    .forEach((m) => {
      const card = document.createElement("div");
      card.className = `machine-card ${m.status}`;

      const lastUsedText = m.last_used_by
        ? `Last used by ${m.last_used_by} at ${formatTime(m.last_used_at)}`
        : "Not used yet";

      const callLink = m.last_used_by && m.last_used_phone
        ? `<a class="call-link" href="tel:${m.last_used_phone}">📞 Call ${m.last_used_by}</a>`
        : "";

      const actionLabel = m.status === "available" ? "Mark as In Use" : "Mark as Available";

      card.innerHTML = `
        <h2 class="machine-name">${m.name}</h2>
        <span class="status-badge ${m.status}">${m.status === "available" ? "Available" : "In Use"}</span>
        <p class="last-used">${lastUsedText}</p>
        ${callLink}
        <button class="toggle-btn ${m.status}" data-id="${m.id}">${actionLabel}</button>
      `;

      card.querySelector(".toggle-btn").addEventListener("click", (e) => handleToggle(e, m.id));
      machineGrid.appendChild(card);
    });
}

async function handleToggle(e, machineId) {
  dashboardError.textContent = "";
  const identity = getIdentity();
  if (!identity) {
    showLogin();
    return;
  }

  const btn = e.target;
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Updating...";

  try {
    const res = await fetch("/.netlify/functions/toggle-machine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId, name: identity.name, phone: identity.phone }),
    });

    const result = await res.json();

    if (!res.ok) {
      dashboardError.textContent = result.error || "Something went wrong.";
    }
    // No need to manually re-render here — the Realtime subscription
    // below will receive the DB change and update the UI for everyone,
    // including this browser.
  } catch (err) {
    dashboardError.textContent = "Network error. Please try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function loadMachines() {
  const { data, error } = await supabaseClient.from("machines").select("*");

  if (error) {
    console.error("Supabase error loading machines:", error);
    dashboardError.textContent = "Could not load machines: " + error.message;
    machineGrid.innerHTML = "";
    return;
  }

  if (!data || data.length === 0) {
    dashboardError.textContent =
      "No machines found. Check: (1) public/js/supabaseClient.js has your real Supabase URL + anon key, not the placeholder, and (2) run 'select * from public.machines;' in Supabase to confirm rows exist.";
    machineGrid.innerHTML = "";
    return;
  }

  dashboardError.textContent = "";
  renderMachines(data);
}

function subscribeToRealtimeUpdates() {
  supabaseClient
    .channel("machines-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "machines" },
      () => {
        // Any insert/update on machines -> just reload the full list.
        // Simple and always-correct, and the table is tiny.
        loadMachines();
      }
    )
    .subscribe();
}

document.getElementById("btn-logout").addEventListener("click", () => {
  localStorage.removeItem("laundry_name");
  localStorage.removeItem("laundry_phone");
  showLogin();
});

window.addEventListener("app:logged-in", (e) => {
  showDashboard(e.detail.name);
  loadMachines();
});

// On page load, check if this device already has a saved identity
(function init() {
  const identity = getIdentity();
  if (identity) {
    showDashboard(identity.name);
    loadMachines();
  } else {
    showLogin();
  }
  subscribeToRealtimeUpdates();
})();
