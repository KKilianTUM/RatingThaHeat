const STORAGE_KEY = "th_activities_v1";

const seedActivities = [
  {
    id: generateId(),
    title: "Marienplatz Walk",
    category: "city",
    location: "Karlsplatz, Munich",
    datetime: "2026-04-10T17:00",
    capacity: 15,
    joined: 6,
    description: "Relaxed evening city walk for newcomers. We’ll explore old town, take photos, and share local tips.",
    userJoined: false
  },
  {
    id: generateId(),
    title: "Beginner Badminton",
    category: "sports",
    location: "Olympiapark Hall",
    datetime: "2026-04-12T18:30",
    capacity: 12,
    joined: 9,
    description: "Friendly badminton session for all levels. Bring water and indoor shoes. Rackets can be shared.",
    userJoined: false
  },
  {
    id: generateId(),
    title: "German A1 Speaking Circle",
    category: "learning",
    location: "Public Library Room 2",
    datetime: "2026-04-14T16:00",
    capacity: 20,
    joined: 11,
    description: "Practice basic German in a supportive small-group format with mini games and roleplay.",
    userJoined: false
  }
];

let activities = loadActivities();
const grid = document.getElementById("activityGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const createModal = document.getElementById("createModal");
const detailsModal = document.getElementById("detailsModal");
const detailsContent = document.getElementById("detailsContent");
const toast = document.getElementById("toast");
const openCreateBtn = document.getElementById("openCreateBtn");
const closeCreateBtn = document.getElementById("closeCreateBtn");
const closeDetailsBtn = document.getElementById("closeDetailsBtn");
const createForm = document.getElementById("createForm");

let lastFocusedElement = null;

openCreateBtn.addEventListener("click", () => openModal(createModal, openCreateBtn));
closeCreateBtn.addEventListener("click", () => closeModal(createModal));
closeDetailsBtn.addEventListener("click", () => closeModal(detailsModal));

createForm.addEventListener("submit", onCreateActivity);
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);

createModal.addEventListener("click", (e) => { if (e.target === createModal) closeModal(createModal); });
detailsModal.addEventListener("click", (e) => { if (e.target === detailsModal) closeModal(detailsModal); });
document.addEventListener("keydown", onGlobalKeydown);

render();

function loadActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...seedActivities];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...seedActivities];
  } catch {
    return [...seedActivities];
  }
}

function saveActivities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = activities.filter(a => {
    const matchesCategory = category === "all" || a.category === category;
    const hay = `${a.title} ${a.location} ${a.description}`.toLowerCase();
    const matchesSearch = !q || hay.includes(q);
    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p>No activities found. Try another search.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(cardTemplate).join("");
  bindCardActions();
}

function cardTemplate(a) {
  const percent = Math.min(100, Math.round((a.joined / a.capacity) * 100));
  const isFull = a.joined >= a.capacity;

  return `
    <article class="card" data-id="${a.id}">
      <h3>${escapeHtml(a.title)}</h3>
      <div class="meta">${formatCategory(a.category)} • ${formatDate(a.datetime)}</div>
      <div class="meta">📍 ${escapeHtml(a.location)}</div>

      <div class="progress-wrap"><div class="progress" style="width:${percent}%"></div></div>
      <div class="meta">${a.joined}/${a.capacity} participants</div>

      <div class="actions">
        <button class="btn btn-secondary details-btn">Details</button>
        ${
          a.userJoined
            ? `<button class="btn btn-danger leave-btn">Leave</button>`
            : `<button class="btn btn-primary join-btn" ${isFull ? "disabled" : ""}>${isFull ? "Full" : "Join"}</button>`
        }
      </div>
    </article>
  `;
}

function bindCardActions() {
  document.querySelectorAll(".details-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest(".card").dataset.id;
      const act = activities.find(x => x.id === id);
      openDetails(act);
    });
  });

  document.querySelectorAll(".join-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest(".card").dataset.id;
      joinActivity(id);
    });
  });

  document.querySelectorAll(".leave-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest(".card").dataset.id;
      leaveActivity(id);
    });
  });
}

function joinActivity(id) {
  const act = activities.find(x => x.id === id);
  if (!act) return;
  if (act.userJoined) return showToast("You already joined this activity.");
  if (act.joined >= act.capacity) return showToast("This activity is already full.");

  act.userJoined = true;
  act.joined += 1;
  saveActivities();
  render();
  showToast(`Joined: ${act.title}`);
}

function leaveActivity(id) {
  const act = activities.find(x => x.id === id);
  if (!act || !act.userJoined) return;

  act.userJoined = false;
  act.joined = Math.max(0, act.joined - 1);
  saveActivities();
  render();
  showToast(`You left: ${act.title}`);
}

function onCreateActivity(e) {
  e.preventDefault();
  const fd = new FormData(e.target);

  const newItem = {
    id: generateId(),
    title: String(fd.get("title") || "").trim(),
    category: String(fd.get("category") || ""),
    location: String(fd.get("location") || "").trim(),
    datetime: String(fd.get("datetime") || ""),
    capacity: Number(fd.get("capacity") || 10),
    joined: 0,
    description: String(fd.get("description") || "").trim(),
    userJoined: false
  };

  if (newItem.title.length < 3) return showToast("Title too short.");
  if (newItem.description.length < 20) return showToast("Description is too short (minimum 20 characters).");
  if (!newItem.datetime) return showToast("Please choose date and time.");
  if (!Number.isFinite(newItem.capacity) || newItem.capacity < 2) return showToast("Capacity must be at least 2.");

  activities.unshift(newItem);
  saveActivities();
  e.target.reset();
  closeModal(createModal);
  render();
  showToast("Activity created successfully.");
}

function openDetails(a) {
  if (!a) {
    showToast("Activity details are unavailable.");
    return;
  }

  detailsContent.innerHTML = `
    <p><strong>${escapeHtml(a.title)}</strong></p>
    <p>${formatCategory(a.category)} • ${formatDate(a.datetime)}</p>
    <p>📍 ${escapeHtml(a.location)}</p>
    <p>${escapeHtml(a.description)}</p>
    <p><strong>Participants:</strong> ${a.joined}/${a.capacity}</p>
  `;
  openModal(detailsModal);
}

function openModal(el, triggerEl = document.activeElement) {
  lastFocusedElement = triggerEl;
  el.classList.remove("hidden");
  const firstFocusable = el.querySelector("input, select, textarea, button");
  if (firstFocusable) firstFocusable.focus();
}
function closeModal(el) {
  el.classList.add("hidden");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatCategory(c) {
  return ({ city: "City", sports: "Sports", learning: "Learning", social: "Social" }[c] || "Other");
}
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `act_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function onGlobalKeydown(e) {
  if (e.key !== "Escape") return;
  if (!detailsModal.classList.contains("hidden")) {
    closeModal(detailsModal);
    return;
  }
  if (!createModal.classList.contains("hidden")) {
    closeModal(createModal);
  }
}
