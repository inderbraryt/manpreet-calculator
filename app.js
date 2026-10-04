/**
 * PhysioCare - Physiotherapy Visit Tracker
 * Application Logic & Dynamic Calculation Engine
 */

// Default State matching the user's reference screenshot
const DEFAULT_PATIENTS = {
  "Sukhpal Kaur": {
    name: "Sukhpal Kaur",
    perVisitCost: 300,
    notes: "Initial Assessment + Manual Therapy + Exercise Therapy + Follow Up Session",
    visits: [
      { id: "v1", date: "2025-10-01", formattedDate: "01 Oct 2025", visitNo: 1, amount: 300, status: "completed" },
      { id: "v2", date: "2025-10-03", formattedDate: "03 Oct 2025", visitNo: 2, amount: 300, status: "completed" },
      { id: "v3", date: "2025-10-06", formattedDate: "06 Oct 2025", visitNo: 3, amount: 300, status: "completed" },
      { id: "v4", date: "2025-10-09", formattedDate: "09 Oct 2025", visitNo: 4, amount: 300, status: "completed" },
      { id: "v5", date: "2025-10-12", formattedDate: "12 Oct 2025", visitNo: 5, amount: 300, status: "completed" }
    ]
  },
  "Manpreet Singh": {
    name: "Manpreet Singh",
    perVisitCost: 350,
    notes: "Cervical Spondylosis Rehabilitation + Posture Correction",
    visits: [
      { id: "m1", date: "2025-10-02", formattedDate: "02 Oct 2025", visitNo: 1, amount: 350, status: "completed" },
      { id: "m2", date: "2025-10-05", formattedDate: "05 Oct 2025", visitNo: 2, amount: 350, status: "completed" },
      { id: "m3", date: "2025-10-08", formattedDate: "08 Oct 2025", visitNo: 3, amount: 350, status: "completed" }
    ]
  }
};

const STORAGE_KEYS = {
  PATIENTS: "physiocare_patients_data_v2",
  ACTIVE_PATIENT: "physiocare_active_patient_v2",
  SETTINGS: "physiocare_clinic_settings_v2"
};

// Application State
let patients = {};
let activePatientName = "Sukhpal Kaur";
let clinicSettings = {
  clinicName: "PhysioCare Clinic",
  defaultFee: 300,
  currency: "₹"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadDataFromStorage();
  initClock();
  initDatePickerDefault();
  renderApp();
  setupPatientInputListeners();
});

/* ==========================================================================
   Data Management & Storage
   ========================================================================== */
function loadDataFromStorage() {
  try {
    const savedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (savedPatients) {
      patients = JSON.parse(savedPatients);
    } else {
      patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
      savePatientsToStorage();
    }

    const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT);
    if (savedActive && patients[savedActive]) {
      activePatientName = savedActive;
    } else {
      activePatientName = Object.keys(patients)[0] || "Sukhpal Kaur";
    }

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      clinicSettings = JSON.parse(savedSettings);
    }
  } catch (err) {
    console.error("Error loading data from local storage:", err);
    patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
    activePatientName = "Sukhpal Kaur";
  }
}

function savePatientsToStorage() {
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT, activePatientName);
}

function saveClinicSettings() {
  const clinicName = document.getElementById("setting-clinic-name").value.trim() || "PhysioCare Clinic";
  const defaultFee = parseFloat(document.getElementById("setting-default-fee").value) || 300;
  const currency = document.getElementById("setting-currency").value.trim() || "₹";

  clinicSettings = { clinicName, defaultFee, currency };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(clinicSettings));
  showToast("Clinic settings saved successfully!", "toast-success");
  renderApp();
}

function loadSampleData() {
  if (confirm("Reset to default sample data (Sukhpal Kaur with 5 visits)?")) {
    patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
    activePatientName = "Sukhpal Kaur";
    savePatientsToStorage();
    renderApp();
    showToast("Sample data restored!", "toast-info");
  }
}

function wipeAllData() {
  if (confirm("Are you sure you want to erase all patient records?")) {
    patients = {};
    activePatientName = "";
    savePatientsToStorage();
    renderApp();
    showToast("All data cleared.", "toast-info");
  }
}

/* ==========================================================================
   Core Operations: Add Entry & Dynamic Calculation
   ========================================================================== */

/**
 * Handles adding an entry.
 * Automatically adds to patient notes / visits list, increments visit count,
 * and recalculates final total amount automatically.
 */
function handleAddEntry(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById("patient-name-input");
  const costInput = document.getElementById("visit-cost-input");
  const dateInput = document.getElementById("visit-date-input");
  const sessionNoteInput = document.getElementById("visit-session-type");

  const name = nameInput.value.trim();
  const cost = parseFloat(costInput.value) || 300;
  const visitDate = dateInput.value || new Date().toISOString().split("T")[0];
  const sessionNote = sessionNoteInput ? sessionNoteInput.value.trim() : "";

  if (!name) {
    showToast("Please enter a patient name.", "toast-info");
    nameInput.focus();
    return;
  }

  // If patient doesn't exist, create new patient record
  if (!patients[name]) {
    patients[name] = {
      name: name,
      perVisitCost: cost,
      notes: sessionNote || "Initial Assessment & Consultation",
      visits: []
    };
  }

  const patient = patients[name];
  patient.perVisitCost = cost; // update fee if changed

  // Calculate next visit number automatically
  const nextVisitNo = patient.visits.length + 1;
  const formattedDate = formatDateDisplay(visitDate);

  // Append new visit entry
  patient.visits.push({
    id: "v_" + Date.now(),
    date: visitDate,
    formattedDate: formattedDate,
    visitNo: nextVisitNo,
    amount: cost,
    status: "completed",
    sessionNote: sessionNote
  });

  // Automatically update notes if note was added with session
  if (sessionNote) {
    if (!patient.notes.toLowerCase().includes(sessionNote.toLowerCase())) {
      patient.notes = patient.notes ? `${patient.notes} + ${sessionNote}` : sessionNote;
    }
  }

  activePatientName = name;
  savePatientsToStorage();

  // Clear session note input for next entry
  if (sessionNoteInput) sessionNoteInput.value = "";

  renderApp();
  showToast(`Visit #${nextVisitNo} added for ${name}!`, "toast-success");
}

/**
 * Render the entire UI: Sheet, Table, Visit Count, and Total Amount
 */
function renderApp() {
  const patient = patients[activePatientName] || {
    name: activePatientName || "No Patient Selected",
    perVisitCost: clinicSettings.defaultFee,
    notes: "No clinical notes yet.",
    visits: []
  };

  const currency = clinicSettings.currency || "₹";

  // 1. Update Add Entry Form inputs
  document.getElementById("patient-name-input").value = patient.name || "";
  document.getElementById("visit-cost-input").value = patient.perVisitCost || clinicSettings.defaultFee;

  // 2. Update Patient Details Sheet Info
  document.getElementById("display-patient-name").textContent = patient.name || "—";
  document.getElementById("display-visit-cost").textContent = `${currency}${patient.perVisitCost || 0}`;
  
  // Update Visit Count Badge (e.g. "Visits: 5")
  const totalVisits = patient.visits.length;
  document.getElementById("badge-visit-count").textContent = totalVisits;

  // 3. Render Visits Table Rows
  const tbody = document.getElementById("visits-tbody");
  tbody.innerHTML = "";

  if (totalVisits === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding: 20px 10px; color:#94a3b8; font-style:italic;">
          No visit entries logged yet.<br>Click "<strong>+ Add Entry</strong>" to record visit.
        </td>
      </tr>
    `;
  } else {
    patient.visits.forEach((v, index) => {
      // Keep numbering clean 1..N
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-medium">${v.formattedDate || formatDateDisplay(v.date)}</td>
        <td class="td-center">${index + 1}</td>
        <td class="td-center font-semibold">${v.amount}</td>
        <td class="td-right">
          <span class="status-badge-check" title="Visit Completed">
            <i class="fa-solid fa-check"></i>
          </span>
          <button class="btn-del-visit" title="Delete visit" onclick="deleteVisit('${v.id || index}')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // 4. Update Notes
  document.getElementById("display-patient-notes").textContent = patient.notes || "No notes entered.";
  document.getElementById("edit-patient-notes").value = patient.notes || "";

  // 5. Calculate Final Grand Total Automatically
  // Total Amount = Sum of all visits (or visitsCount * perVisitCost)
  let grandTotal = 0;
  patient.visits.forEach(v => {
    grandTotal += (parseFloat(v.amount) || patient.perVisitCost || 0);
  });

  const formattedTotal = Number(grandTotal).toLocaleString("en-IN");
  document.getElementById("grand-total-display").textContent = formattedTotal;

  // Dynamic formula sub-text: e.g. "(5 Visits × ₹300)"
  const formulaSub = document.getElementById("total-formula-display");
  if (totalVisits > 0) {
    formulaSub.textContent = `(${totalVisits} Visits × ${currency}${patient.perVisitCost})`;
  } else {
    formulaSub.textContent = `(0 Visits × ${currency}${patient.perVisitCost})`;
  }

  // 6. Update Home / Directory list
  renderPatientDirectory();
  renderPatientDropdown();
}

/**
 * Delete a specific visit entry
 */
function deleteVisit(visitId) {
  const patient = patients[activePatientName];
  if (!patient) return;

  patient.visits = patient.visits.filter((v, idx) => v.id !== visitId && String(idx) !== String(visitId));
  
  // Re-index visit numbers
  patient.visits.forEach((v, idx) => {
    v.visitNo = idx + 1;
  });

  savePatientsToStorage();
  renderApp();
  showToast("Visit removed.", "toast-info");
}

/**
 * Clear all visits for the active patient
 */
function clearPatientVisits() {
  const patient = patients[activePatientName];
  if (!patient || patient.visits.length === 0) {
    showToast("No visits to clear.", "toast-info");
    return;
  }

  if (confirm(`Clear all ${patient.visits.length} visits for ${patient.name}?`)) {
    patient.visits = [];
    savePatientsToStorage();
    renderApp();
    showToast("All visits cleared.", "toast-info");
  }
}

/**
 * Quick prompt to add a new patient
 */
function promptAddNewPatient() {
  const newName = prompt("Enter new patient name:");
  if (!newName || !newName.trim()) return;

  const trimmed = newName.trim();
  if (!patients[trimmed]) {
    patients[trimmed] = {
      name: trimmed,
      perVisitCost: clinicSettings.defaultFee || 300,
      notes: "Initial Consultation",
      visits: []
    };
  }

  activePatientName = trimmed;
  savePatientsToStorage();
  switchTab("tracker");
  renderApp();
  showToast(`Switched to patient: ${trimmed}`, "toast-success");
}

/* ==========================================================================
   Notes Inline Editor
   ========================================================================== */
function toggleEditNotes() {
  const displayP = document.getElementById("display-patient-notes");
  const editTextarea = document.getElementById("edit-patient-notes");
  const actionBar = document.getElementById("notes-action-bar");

  displayP.classList.add("hidden");
  editTextarea.classList.remove("hidden");
  actionBar.classList.remove("hidden");
  editTextarea.focus();
}

function cancelEditNotes() {
  const displayP = document.getElementById("display-patient-notes");
  const editTextarea = document.getElementById("edit-patient-notes");
  const actionBar = document.getElementById("notes-action-bar");

  displayP.classList.remove("hidden");
  editTextarea.classList.add("hidden");
  actionBar.classList.add("hidden");
}

function savePatientNotes() {
  const patient = patients[activePatientName];
  if (!patient) return;

  const newNotes = document.getElementById("edit-patient-notes").value.trim();
  patient.notes = newNotes;
  savePatientsToStorage();
  cancelEditNotes();
  renderApp();
  showToast("Notes updated!", "toast-success");
}

/* ==========================================================================
   Patient Autocomplete & Dropdown
   ========================================================================== */
function setupPatientInputListeners() {
  const nameInput = document.getElementById("patient-name-input");
  const costInput = document.getElementById("visit-cost-input");

  nameInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (patients[val]) {
      activePatientName = val;
      costInput.value = patients[val].perVisitCost;
      renderApp();
    }
  });

  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("patient-dropdown-menu");
    const dropdownBtn = document.getElementById("btn-patient-dropdown");
    if (!dropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}

function togglePatientDropdown() {
  const menu = document.getElementById("patient-dropdown-menu");
  menu.classList.toggle("show");
}

function renderPatientDropdown() {
  const menu = document.getElementById("patient-dropdown-menu");
  menu.innerHTML = "";

  const names = Object.keys(patients);
  if (names.length === 0) {
    menu.innerHTML = `<div class="patient-dropdown-item">No saved patients</div>`;
    return;
  }

  names.forEach(name => {
    const p = patients[name];
    const item = document.createElement("div");
    item.className = "patient-dropdown-item";
    item.innerHTML = `
      <span><strong>${p.name}</strong> (${p.visits.length} visits)</span>
      <span>${clinicSettings.currency}${p.perVisitCost}</span>
    `;
    item.onclick = () => {
      activePatientName = name;
      savePatientsToStorage();
      renderApp();
      menu.classList.remove("show");
    };
    menu.appendChild(item);
  });
}

/* ==========================================================================
   Patient Directory (Home Tab)
   ========================================================================== */
function renderPatientDirectory() {
  const list = document.getElementById("patients-directory-list");
  if (!list) return;

  list.innerHTML = "";
  const names = Object.keys(patients);

  if (names.length === 0) {
    list.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:30px;">No patients recorded yet.</div>`;
    return;
  }

  names.forEach(name => {
    const p = patients[name];
    const totalAmount = p.visits.reduce((acc, v) => acc + (parseFloat(v.amount) || p.perVisitCost || 0), 0);
    const card = document.createElement("div");
    card.className = `patient-dir-card ${name === activePatientName ? 'selected' : ''}`;
    card.innerHTML = `
      <div>
        <div class="dir-card-name">${p.name}</div>
        <div class="dir-card-meta">${p.visits.length} Visits • Fee: ${clinicSettings.currency}${p.perVisitCost}</div>
      </div>
      <div class="dir-card-right">
        <div class="dir-card-amount">${clinicSettings.currency}${Number(totalAmount).toLocaleString('en-IN')}</div>
        <small style="color:#94a3b8; font-size:10px;">Total Billed</small>
      </div>
    `;
    card.onclick = () => {
      activePatientName = name;
      savePatientsToStorage();
      switchTab("tracker");
      renderApp();
    };
    list.appendChild(card);
  });
}

function filterPatientCards() {
  const query = document.getElementById("patient-search-input").value.toLowerCase();
  const cards = document.querySelectorAll(".patient-dir-card");
  cards.forEach(c => {
    const nameText = c.querySelector(".dir-card-name").textContent.toLowerCase();
    c.style.display = nameText.includes(query) ? "flex" : "none";
  });
}

/* ==========================================================================
   Tab Navigation
   ========================================================================== */
function switchTab(tabId) {
  document.querySelectorAll(".tab-view").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
  
  // Remove glow bar from previous
  const glow = document.querySelector(".active-glow-bar");
  if (glow) glow.remove();

  let targetTab, targetNav;
  if (tabId === "home") {
    targetTab = document.getElementById("tab-home");
    targetNav = document.getElementById("nav-btn-home");
  } else if (tabId === "settings") {
    targetTab = document.getElementById("tab-settings");
    targetNav = document.getElementById("nav-btn-settings");
  } else {
    targetTab = document.getElementById("tab-tracker");
    targetNav = document.getElementById("nav-btn-notes");
  }

  if (targetTab) targetTab.classList.add("active");
  if (targetNav) {
    targetNav.classList.add("active");
    const bar = document.createElement("div");
    bar.className = "active-glow-bar";
    targetNav.appendChild(bar);
  }

  // Scroll to top of container
  const container = document.getElementById("screen-container");
  if (container) container.scrollTop = 0;
}

/* ==========================================================================
   Receipt & Share Actions
   ========================================================================== */
function exportPatientReceipt() {
  const patient = patients[activePatientName];
  if (!patient) return;

  const totalAmount = patient.visits.reduce((acc, v) => acc + (parseFloat(v.amount) || patient.perVisitCost || 0), 0);
  const currency = clinicSettings.currency || "₹";

  let rowsHtml = "";
  patient.visits.forEach((v, idx) => {
    rowsHtml += `
      <tr>
        <td>${v.formattedDate || v.date}</td>
        <td style="text-align:center;">Visit #${idx + 1}</td>
        <td style="text-align:right;">${currency}${v.amount}</td>
      </tr>
    `;
  });

  const printArea = document.getElementById("receipt-print-area");
  printArea.innerHTML = `
    <div class="receipt-clinic-head">
      <div class="receipt-clinic-name">${clinicSettings.clinicName}</div>
      <div style="font-size: 11px; color: #475569;">Physiotherapy Treatment & Visit Summary</div>
    </div>

    <div class="receipt-patient-block">
      <div><strong>Patient Name:</strong> ${patient.name}</div>
      <div><strong>Per Visit Cost:</strong> ${currency}${patient.perVisitCost}</div>
      <div><strong>Total Sessions:</strong> ${patient.visits.length}</div>
      <div><strong>Date Generated:</strong> ${formatDateDisplay(new Date().toISOString().split("T")[0])}</div>
    </div>

    <table class="receipt-table">
      <thead>
        <tr>
          <th>Date</th>
          <th style="text-align:center;">Session</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="3" style="text-align:center;">No sessions recorded</td></tr>`}
      </tbody>
    </table>

    <div class="receipt-total-row">
      <span>Total Calculated Fee:</span>
      <span style="color:#1d72dd;">${currency}${Number(totalAmount).toLocaleString('en-IN')}</span>
    </div>

    <div style="margin-top: 12px; font-size: 11.5px; color:#475569; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
      <strong>Clinical Notes:</strong><br>
      <em>${patient.notes || "None"}</em>
    </div>
  `;

  document.getElementById("receipt-modal").classList.remove("hidden");
}

function closeReceiptModal() {
  document.getElementById("receipt-modal").classList.add("hidden");
}

function shareToWhatsApp() {
  const patient = patients[activePatientName];
  if (!patient) return;

  const totalAmount = patient.visits.reduce((acc, v) => acc + (parseFloat(v.amount) || patient.perVisitCost || 0), 0);
  const currency = clinicSettings.currency || "₹";

  let msg = `*${clinicSettings.clinicName} - Visit Summary*\n`;
  msg += `*Patient Name:* ${patient.name}\n`;
  msg += `*Total Visits:* ${patient.visits.length}\n`;
  msg += `*Per Visit Fee:* ${currency}${patient.perVisitCost}\n`;
  msg += `--------------------------\n`;
  msg += `*Total Amount:* ${currency}${Number(totalAmount).toLocaleString('en-IN')}\n`;
  msg += `*Notes:* ${patient.notes || 'N/A'}\n\n`;
  msg += `Thank you for choosing ${clinicSettings.clinicName}!`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

/* ==========================================================================
   Utility Functions
   ========================================================================== */
function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function initDatePickerDefault() {
  const dateInput = document.getElementById("visit-date-input");
  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
}

function initClock() {
  const clockEl = document.getElementById("clock-display");
  function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    let mins = now.getMinutes();
    hours = hours % 12 || 12;
    mins = mins < 10 ? "0" + mins : mins;
    if (clockEl) clockEl.textContent = `${hours}:${mins}`;
  }
  updateTime();
  setInterval(updateTime, 30000);
}

function showToast(message, type = "toast-info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}
