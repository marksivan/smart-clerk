/**
 * Smart Clerking Assistant — UI controller
 */
(function () {
  "use strict";

  const Store = window.SmartClerkingStore;
  const Knowledge = window.SmartClerkingKnowledge;

  const state = {
    page: "patients",
    patientId: null,
    encounterId: null,
    encounterStarted: false,
    findings: [],
    questionAnswers: [],
    conditionCandidates: [],
    selectedConditionId: null,
    patientSavedAt: null,
    encounterSavedAt: null,
    lastBackupAt: null,
    dirty: false,
    ageFromDob: false,
    stage: "history",
    editingNewPatient: false,
    modalOpen: null,
    lastFocused: null,
  };

  const LAST_BACKUP_KEY = "smartClerking:lastBackupAt";
  const ONBOARDING_KEY = "smartClerking:onboardingDismissed";

  function $(id) {
    return document.getElementById(id);
  }

  function getVal(id) {
    const el = $(id);
    return el ? el.value : "";
  }

  function setVal(id, value) {
    const el = $(id);
    if (el) el.value = value == null ? "" : value;
  }

  function setDisabled(id, disabled, title) {
    const el = $(id);
    if (!el) return;
    el.disabled = !!disabled;
    if (title != null) el.title = title;
  }

  function formatTime(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return String(iso);
    }
  }

  function markDirty() {
    state.dirty = true;
    updateSaveStatus();
    updateActionGates();
  }

  function updateSaveStatus() {
    const patientLine = $("savePatientLine");
    const encounterLine = $("saveEncounterLine");
    const changeLine = $("saveChangeLine");
    if (!patientLine) return;

    if (!state.patientId) {
      patientLine.textContent = "Patient: not selected";
    } else {
      const p = Store.patientStore.getById(state.patientId);
      const name = p && p.name ? p.name : "Selected";
      patientLine.textContent = "Patient: " + name;
    }

    if (!state.encounterStarted) {
      encounterLine.textContent = "Encounter: none";
    } else if (state.encounterSavedAt && !state.dirty) {
      encounterLine.textContent = "Encounter: saved";
    } else if (state.dirty) {
      encounterLine.textContent = "Encounter: draft";
    } else {
      encounterLine.textContent = "Encounter: active";
    }

    if (state.dirty) {
      changeLine.textContent = "Unsaved changes";
      changeLine.classList.add("unsaved");
      changeLine.classList.remove("muted");
    } else if (state.encounterSavedAt || state.patientSavedAt) {
      changeLine.textContent = "Saved";
      changeLine.classList.remove("unsaved");
      changeLine.classList.add("muted");
    } else {
      changeLine.textContent = "No unsaved changes";
      changeLine.classList.remove("unsaved");
      changeLine.classList.add("muted");
    }

    updateLastBackupLine();
  }

  function updateLastBackupLine() {
    const el = $("lastBackupLine");
    if (!el) return;
    if (state.lastBackupAt) {
      el.textContent = "Last backup downloaded: " + formatTime(state.lastBackupAt);
    } else {
      el.textContent = "No backup downloaded yet in this browser session.";
    }
  }

  function updateStoreMeta() {
    const meta = Store.getMeta();
    const el = $("storeMeta");
    if (!el) return;
    el.textContent =
      "Application: " +
      (Store.APPLICATION_NAME || "Smart Clerking Assistant") +
      " · version " +
      (Store.APPLICATION_VERSION || "—") +
      " · storage key: " +
      meta.storageKey +
      " · schema v" +
      meta.schemaVersion +
      " · " +
      meta.patientCount +
      " patients · " +
      meta.encounterCount +
      " encounters";
  }

  function showPage(page) {
    state.page = page || "patients";
    ["patients", "help", "settings"].forEach(function (name) {
      const el = $("page" + name.charAt(0).toUpperCase() + name.slice(1));
      if (!el) return;
      const active = name === state.page;
      if (active) {
        el.hidden = false;
        el.removeAttribute("hidden");
        el.classList.add("active");
        el.style.display = "";
      } else {
        el.hidden = true;
        el.setAttribute("hidden", "hidden");
        el.classList.remove("active");
        el.style.display = "none";
      }
    });
    document.querySelectorAll(".top-nav-btn").forEach(function (btn) {
      const active = btn.getAttribute("data-page") === state.page;
      btn.classList.toggle("active", active);
      if (active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    if (state.page === "settings") {
      updateStoreMeta();
      updateLastBackupLine();
    }
    // Ensure no modal is left covering the page when navigating
    if (state.page !== "patients" && state.modalOpen === "onboardingModal") {
      dismissOnboarding();
    }
  }

  function confirmedSymptoms() {
    return state.findings.filter(function (f) {
      return f.status === "confirmed";
    });
  }

  function planIsApproved() {
    const el = $("planStatus");
    return el && el.dataset.status === "approved";
  }

  function updateActionGates() {
    const hasPatient = !!state.patientId;
    const hasEncounter = !!state.encounterStarted;
    const hasSymptoms = confirmedSymptoms().length > 0;
    const hasSelection = !!state.selectedConditionId;
    const hasImpression = !!getVal("impression").trim() || hasSelection;
    const hasPlan = !!getVal("planDraft").trim();
    const hasApprover = !!(getVal("planApprover").trim() || getVal("clinicianName").trim());
    const approved = planIsApproved();
    const showEmptyHint = !hasPatient && !state.editingNewPatient;

    if ($("patientsHome")) {
      $("patientsHome").classList.toggle("hidden", hasEncounter);
    }
    if ($("patientEmptyState")) {
      $("patientEmptyState").classList.toggle("hidden", !showEmptyHint);
    }
    if ($("patientFormBlock")) {
      const showForm = hasPatient || state.editingNewPatient;
      $("patientFormBlock").classList.toggle("hidden", !showForm);
    }
    if ($("patientFormHint")) {
      $("patientFormHint").textContent = hasPatient
        ? "Selected patient details. Save after edits, then start or open an encounter."
        : state.editingNewPatient
          ? "Enter the new patient details, then press Save patient."
          : "Fill in details below to create a patient, or click a search result to open one.";
    }

    // Button hierarchy: after patient saved, Start encounter is primary
    const startBtn = $("btnNewEncounter");
    const saveBtn = $("btnSavePatient");
    if (startBtn && saveBtn) {
      if (hasPatient && !state.dirty) {
        startBtn.className = "btn-primary";
        saveBtn.className = "btn-secondary";
      } else {
        startBtn.className = "btn-secondary";
        saveBtn.className = "btn-primary";
      }
    }

    setDisabled(
      "btnNewEncounter",
      !hasPatient,
      hasPatient ? "Start a new encounter for this patient" : "Save or select a patient first"
    );
    setDisabled(
      "btnNewEncounterEmpty",
      !hasPatient,
      hasPatient ? "Start a new encounter for this patient" : "Save or select a patient first"
    );

    if ($("encounterWorkspace")) {
      $("encounterWorkspace").classList.toggle("hidden", !hasEncounter);
    }

    setDisabled(
      "btnGenerateQuestions",
      !hasEncounter || !hasSymptoms,
      !hasEncounter
        ? "Start an encounter first"
        : hasSymptoms
          ? "Generate follow-up questions"
          : "Confirm at least one symptom first"
    );
    setDisabled(
      "btnAnalyze",
      !hasEncounter || !hasSymptoms,
      !hasEncounter
        ? "Start an encounter first"
        : hasSymptoms
          ? "Analyze confirmed findings"
          : "Confirm at least one symptom first"
    );
    setDisabled(
      "btnDraftPlan",
      !hasSelection && !hasImpression,
      hasSelection || hasImpression
        ? "Draft plan from selected condition"
        : "Select a condition candidate first"
    );
    setDisabled(
      "btnApprovePlan",
      !hasPlan || !hasApprover,
      !hasPlan ? "Enter or draft plan items first" : "Enter approving clinician name"
    );
    setDisabled(
      "btnSaveEncounter",
      !hasEncounter,
      hasEncounter ? "Save encounter to this device" : "Start an encounter first"
    );

    updateStageAvailability(hasSymptoms, hasImpression, hasPlan, approved);
    updatePatientContext();
    updatePatientSummaryCard();
    refreshEncounterCards();
    refreshRecentPatients();
    updateHistoryCompletion();
  }

  function updateStageAvailability(hasSymptoms, hasImpression, hasPlan, approved) {
    const gates = {
      history: { enabled: true, reason: "" },
      examination: { enabled: true, reason: "" },
      assessment: {
        enabled: hasSymptoms,
        reason: hasSymptoms ? "" : "Confirm at least one symptom in History first",
      },
      plan: {
        enabled: hasImpression,
        reason: hasImpression ? "" : "Select or enter a working impression in Assessment first",
      },
      summary: {
        enabled: approved || hasPlan,
        reason: approved || hasPlan ? "" : "Draft or approve a plan first",
      },
    };

    document.querySelectorAll(".stage-tab").forEach(function (tab) {
      const stage = tab.getAttribute("data-stage");
      const gate = gates[stage] || { enabled: true, reason: "" };
      tab.disabled = !gate.enabled;
      tab.title = gate.enabled
        ? stage.charAt(0).toUpperCase() + stage.slice(1)
        : gate.reason;
    });

    if ($("stageSelect")) {
      Array.prototype.forEach.call($("stageSelect").options, function (opt) {
        const gate = gates[opt.value] || { enabled: true };
        opt.disabled = !gate.enabled;
      });
    }

    // Progress dots
    setProgressDot("history", !!getVal("pc").trim() || confirmedSymptoms().length > 0);
    setProgressDot(
      "examination",
      !!(getVal("generalExam").trim() || getVal("bp").trim() || getVal("pulse").trim())
    );
    setProgressDot("assessment", hasImpression || state.conditionCandidates.length > 0);
    setProgressDot("plan", hasPlan);
    setProgressDot("summary", approved);
  }

  function setProgressDot(stage, done) {
    document.querySelectorAll('[data-progress="' + stage + '"]').forEach(function (el) {
      el.classList.toggle("done", !!done);
    });
  }

  function updateHistoryCompletion() {
    setCompleteDot("pc", !!getVal("pc").trim());
    setCompleteDot("symptoms", confirmedSymptoms().length > 0);
    setCompleteDot(
      "questions",
      state.questionAnswers.some(function (q) {
        return q.answer && q.answer !== "skipped";
      })
    );
    setCompleteDot("hpc", !!(getVal("hpc").trim() || getVal("odq").trim()));
    setCompleteDot("background", !!getVal("pastMedicalSurgicalHistory").trim());
    setCompleteDot("meds", !!(getVal("drugHx").trim() || getVal("allergyHx").trim()));
    setCompleteDot("family", !!(getVal("familyHx").trim() || getVal("socialHx").trim()));
    setCompleteDot("ros", !!getVal("ros").trim());
  }

  function setCompleteDot(key, done) {
    document.querySelectorAll('[data-complete="' + key + '"]').forEach(function (el) {
      el.classList.toggle("done", !!done);
    });
  }

  function patientDemographics(p) {
    const sex = p.sex
      ? p.sex.charAt(0).toUpperCase() + p.sex.slice(1)
      : "";
    const ageBit = p.age
      ? p.age + " years"
      : p.dob
        ? "DOB " + p.dob
        : "Age unknown";
    return [sex, ageBit].filter(Boolean).join(", ");
  }

  function latestAllergyNote(patientId) {
    const encounters = Store.encounterStore.getByPatientId(patientId);
    for (let i = 0; i < encounters.length; i++) {
      const hx = encounters[i].history || {};
      if (hx.allergyHx && String(hx.allergyHx).trim()) {
        return String(hx.allergyHx).trim();
      }
    }
    return "";
  }

  function updatePatientSummaryCard() {
    const card = $("patientSummaryCard");
    if (!card) return;
    if (!state.patientId) {
      card.innerHTML =
        '<p class="muted">Select or create a patient to see a summary here.</p>';
      return;
    }
    const p = Store.patientStore.getById(state.patientId) || readPatientFromForm();
    const encounters = Store.encounterStore.getByPatientId(state.patientId);
    const last = encounters.length
      ? encounters[0].updatedAt || encounters[0].createdAt
      : null;
    const allergy = latestAllergyNote(state.patientId);
    card.innerHTML =
      '<p class="ps-name">' +
      escapeHtml(p.name || "Unnamed") +
      "</p>" +
      '<p class="ps-row">' +
      escapeHtml(p.localPatientId ? "ID: " + p.localPatientId : "No local ID") +
      "</p>" +
      '<p class="ps-row">' +
      escapeHtml(patientDemographics(p)) +
      "</p>" +
      (p.phone
        ? '<p class="ps-row">Phone: ' + escapeHtml(p.phone) + "</p>"
        : "") +
      '<p class="ps-muted">' +
      escapeHtml(
        last
          ? "Last encounter: " + formatTime(last)
          : "No encounters yet"
      ) +
      "</p>" +
      '<p class="ps-muted">' +
      encounters.length +
      " previous encounter" +
      (encounters.length === 1 ? "" : "s") +
      "</p>" +
      (allergy
        ? '<p class="ps-allergy">Allergies: ' + escapeHtml(allergy) + "</p>"
        : '<p class="ps-muted">Allergies: none recorded</p>');
  }

  function updatePatientContext() {
    const el = $("patientContext");
    if (!el) return;
    if (!state.patientId) {
      el.textContent = "No patient selected";
      el.className = "patient-context muted";
      return;
    }
    const p = Store.patientStore.getById(state.patientId) || readPatientFromForm();
    const encounters = Store.encounterStore.getByPatientId(state.patientId);
    const allergy = latestAllergyNote(state.patientId);
    el.className = "patient-context patient-summary-inline";
    el.innerHTML =
      "<strong>" +
      escapeHtml(p.name || "Unnamed") +
      "</strong><br>" +
      escapeHtml(
        [
          p.localPatientId && "ID: " + p.localPatientId,
          patientDemographics(p),
          p.phone && "Phone: " + p.phone,
          encounters.length +
            " previous encounter" +
            (encounters.length === 1 ? "" : "s"),
        ]
          .filter(Boolean)
          .join(" · ")
      ) +
      (allergy
        ? "<br><span class=\"ps-allergy\" style=\"display:inline-block;margin-top:0.35rem\">Allergies: " +
          escapeHtml(allergy) +
          "</span>"
        : "");
  }

  function refreshRecentPatients() {
    const box = $("recentPatients");
    if (!box) return;
    const all = Store.patientStore.getAll().slice();
    all.sort(function (a, b) {
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
    const recent = all.slice(0, 8);
    if (!recent.length) {
      box.innerHTML = '<p class="muted">No recent patients yet.</p>';
      return;
    }
    box.innerHTML = "";
    recent.forEach(function (p) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "recent-item";
      const encCount = Store.encounterStore.getByPatientId(p.id).length;
      btn.innerHTML =
        "<strong>" +
        escapeHtml(p.name || "Unnamed") +
        "</strong><span>" +
        escapeHtml(
          [
            p.localPatientId && "ID " + p.localPatientId,
            patientDemographics(p),
            encCount + " encounter" + (encCount === 1 ? "" : "s"),
          ]
            .filter(Boolean)
            .join(" · ")
        ) +
        "</span>";
      btn.addEventListener("click", function () {
        selectPatient(p.id);
      });
      box.appendChild(btn);
    });
  }

  // --- Age / DOB ---
  function ageFromDateOfBirth(dobStr) {
    if (!dobStr) return "";
    const dob = new Date(dobStr + "T00:00:00");
    if (isNaN(dob.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 0 || age > 130) return "";
    return String(age);
  }

  function onDobChange() {
    const dob = getVal("dob");
    const calculated = ageFromDateOfBirth(dob);
    const hint = $("ageHint");
    if (calculated) {
      setVal("age", calculated);
      state.ageFromDob = true;
      $("age").readOnly = true;
      hint.textContent = "Calculated age from date of birth: " + calculated;
      hint.classList.remove("warn");
    } else {
      state.ageFromDob = false;
      $("age").readOnly = false;
      hint.textContent = "Enter DOB to calculate age, or estimated age if DOB unknown.";
      hint.classList.remove("warn");
    }
    markDirty();
  }

  function onAgeManual() {
    if (state.ageFromDob && getVal("dob")) {
      const calc = ageFromDateOfBirth(getVal("dob"));
      if (getVal("age") !== calc) {
        $("ageHint").textContent =
          "Age differs from DOB calculation (" + calc + "). Clear DOB to keep estimated age.";
        $("ageHint").classList.add("warn");
      }
    } else {
      $("ageHint").textContent = "Estimated age (DOB unknown).";
      $("ageHint").classList.remove("warn");
    }
    markDirty();
  }

  // --- Vitals validation ---
  function validateBp() {
    const raw = getVal("bp").trim();
    const err = $("bpError");
    if (!raw) {
      err.classList.add("hidden");
      return true;
    }
    const ok = /^\d{2,3}\s*\/\s*\d{2,3}$/.test(raw);
    err.classList.toggle("hidden", ok);
    return ok;
  }

  // --- Stages ---
  function canEnterStage(stage) {
    const hasSymptoms = confirmedSymptoms().length > 0;
    const hasImpression =
      !!getVal("impression").trim() || !!state.selectedConditionId;
    const hasPlan = !!getVal("planDraft").trim();
    const approved = planIsApproved();
    if (stage === "assessment" && !hasSymptoms) return false;
    if (stage === "plan" && !hasImpression) return false;
    if (stage === "summary" && !(approved || hasPlan)) return false;
    return true;
  }

  function showStage(stage) {
    if (!state.encounterStarted) return;
    if (!canEnterStage(stage)) {
      const reasons = {
        assessment: "Confirm at least one symptom in History before Assessment.",
        plan: "Select or enter a working impression before Plan.",
        summary: "Draft or approve a plan before Summary.",
      };
      if (reasons[stage]) alert(reasons[stage]);
      return;
    }
    state.stage = stage;
    document.querySelectorAll(".stage-tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-stage") === stage);
    });
    document.querySelectorAll("[data-stage-panel]").forEach(function (panel) {
      panel.classList.toggle(
        "hidden",
        panel.getAttribute("data-stage-panel") !== stage
      );
    });
    if ($("stageSelect")) $("stageSelect").value = stage;
    updateHistoryCompletion();
  }

  // --- Patient search ---
  function lastEncounterDate(patientId) {
    const list = Store.encounterStore.getByPatientId(patientId);
    if (!list.length) return "";
    return list[0].updatedAt || list[0].createdAt || "";
  }

  function renderSearchResults(patients, query) {
    const box = $("searchResults");
    if (!patients.length) {
      box.innerHTML =
        '<p class="search-empty">No matching patients. Try another name, ID, or phone — or create a new patient.</p>';
      return;
    }
    box.innerHTML = "";
    const qNorm = normalize(query || "");
    patients.forEach(function (p) {
      const last = lastEncounterDate(p.id);
      const encCount = Store.encounterStore.getByPatientId(p.id).length;
      const exact =
        qNorm &&
        (normalize(p.name) === qNorm ||
          normalize(p.localPatientId) === qNorm ||
          normalize(p.phone) === qNorm);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "search-result";
      row.setAttribute("role", "option");
      row.innerHTML =
        "<div><div class=\"sr-name\">" +
        escapeHtml(p.name || "Unnamed") +
        (exact ? ' <span class="tag-confirmed">Exact match</span>' : "") +
        "</div>" +
        "<div class=\"sr-meta\">" +
        escapeHtml(
          [
            p.localPatientId ? "ID " + p.localPatientId : null,
            p.dob ? "DOB " + p.dob : p.age ? "Age " + p.age : null,
            p.sex,
            p.phone,
            last ? "Last encounter " + formatTime(last) : "No encounters",
            encCount + " encounter" + (encCount === 1 ? "" : "s"),
          ]
            .filter(Boolean)
            .join(" · ")
        ) +
        "</div></div>" +
        '<span class="sr-action">Open</span>';
      row.addEventListener("click", function () {
        selectPatient(p.id);
        box.innerHTML = "";
        setVal("searchQuery", "");
      });
      box.appendChild(row);
    });
  }

  function runSearch() {
    const q = getVal("searchQuery");
    const box = $("searchResults");
    if (!q.trim()) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = '<p class="search-loading">Searching…</p>';
    const results = Store.patientStore.search(q);
    renderSearchResults(results, q);
  }

  function selectPatient(id) {
    const p = Store.patientStore.getById(id);
    if (!p) return;
    state.patientId = p.id;
    state.patientSavedAt = p.updatedAt;
    state.editingNewPatient = false;
    fillPatientForm(p);
    clearEncounterForm(true);
    refreshEncounterList(p.id);
    state.dirty = false;
    showPage("patients");
    updateSaveStatus();
    updateActionGates();
  }

  function refreshEncounterList(patientId, selectedId) {
    const list = $("encounterList");
    if (list) {
      list.innerHTML = '<option value="">—</option>';
      if (patientId) {
        Store.encounterStore.getByPatientId(patientId).forEach(function (e) {
          const opt = document.createElement("option");
          opt.value = e.id;
          opt.textContent = e.id;
          list.appendChild(opt);
        });
        if (selectedId) list.value = selectedId;
      }
    }
    refreshEncounterCards();
  }

  function refreshEncounterCards() {
    const empty = $("encountersEmpty");
    const cards = $("encounterCards");
    const emptyText = $("encountersEmptyText");
    const emptyBtn = $("btnNewEncounterEmpty");
    if (!empty || !cards) return;

    if (!state.patientId) {
      empty.classList.remove("hidden");
      cards.classList.add("hidden");
      emptyText.textContent = "Select a patient to view encounters.";
      emptyBtn.classList.add("hidden");
      return;
    }

    const encounters = Store.encounterStore.getByPatientId(state.patientId);
    if (!encounters.length) {
      empty.classList.remove("hidden");
      cards.classList.add("hidden");
      emptyText.textContent = "No encounters recorded for this patient.";
      emptyBtn.classList.remove("hidden");
      emptyBtn.disabled = false;
      return;
    }

    empty.classList.add("hidden");
    cards.classList.remove("hidden");
    let html =
      '<table class="encounter-table" role="table"><thead><tr>' +
      "<th>Date</th><th>Unit</th><th>Complaint</th><th>Working diagnosis</th><th>Status</th><th>Modified</th><th></th>" +
      "</tr></thead><tbody>";
    encounters.forEach(function (e) {
      const when = e.createdAt || e.updatedAt;
      const modified = e.updatedAt || e.createdAt;
      const impression = e.impression || "—";
      const rawStatus =
        (e.plan && e.plan.approvalStatus) || e.status || "draft";
      const planStatus =
        rawStatus === "approved"
          ? "Approved"
          : rawStatus === "draft"
            ? "Draft"
            : String(rawStatus);
      html +=
        "<tr role=\"listitem\">" +
        '<td class="enc-date">' +
        escapeHtml(when ? formatTime(when) : "—") +
        "</td>" +
        "<td>" +
        escapeHtml(e.unit || "—") +
        "</td>" +
        '<td class="enc-complaint">' +
        escapeHtml((e.presentingComplaint || "Encounter").slice(0, 60)) +
        "</td>" +
        "<td>" +
        escapeHtml(String(impression).slice(0, 60)) +
        "</td>" +
        '<td class="enc-status">' +
        escapeHtml(planStatus) +
        "</td>" +
        '<td class="enc-modified">' +
        escapeHtml(modified ? formatTime(modified) : "—") +
        "</td>" +
        '<td><button type="button" class="btn-secondary open-encounter" data-id="' +
        escapeHtml(e.id) +
        '">Open</button></td>' +
        "</tr>";
    });
    html += "</tbody></table>";
    cards.innerHTML = html;
    cards.querySelectorAll(".open-encounter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openEncounter(btn.getAttribute("data-id"));
      });
    });
  }

  function openEncounter(id) {
    const e = Store.encounterStore.getById(id);
    if (!e) return;
    state.encounterId = e.id;
    state.encounterSavedAt = e.updatedAt;
    fillEncounterForm(e);
    state.dirty = false;
    showPage("patients");
    updateSaveStatus();
    updateActionGates();
    showStage(state.stage || "history");
    if ($("encounterWorkspace")) {
      $("encounterWorkspace").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function readPatientFromForm() {
    return {
      id: state.patientId || undefined,
      name: getVal("name").trim(),
      localPatientId: getVal("localPatientId").trim(),
      age: getVal("age").trim(),
      dob: getVal("dob").trim(),
      sex: getVal("sex"),
      phone: getVal("phone").trim(),
      address: getVal("address").trim(),
      occupation: getVal("occupation").trim(),
    };
  }

  function fillPatientForm(p) {
    setVal("name", p.name);
    setVal("localPatientId", p.localPatientId);
    setVal("dob", p.dob);
    if (p.dob) {
      const calc = ageFromDateOfBirth(p.dob);
      setVal("age", calc || p.age);
      state.ageFromDob = !!calc;
      $("age").readOnly = !!calc;
      $("ageHint").textContent = calc
        ? "Calculated age from date of birth: " + calc
        : "Enter DOB to calculate age, or estimated age if DOB unknown.";
    } else {
      setVal("age", p.age);
      state.ageFromDob = false;
      $("age").readOnly = false;
      $("ageHint").textContent = p.age
        ? "Estimated age (DOB unknown)."
        : "Enter DOB to calculate age, or estimated age if DOB unknown.";
    }
    setVal("sex", p.sex);
    setVal("phone", p.phone);
    setVal("address", p.address);
    setVal("occupation", p.occupation);
  }

  function clearPatientForm() {
    ["name", "localPatientId", "age", "dob", "sex", "phone", "address", "occupation"].forEach(
      function (id) {
        setVal(id, "");
      }
    );
    state.patientId = null;
    state.patientSavedAt = null;
    state.editingNewPatient = true;
    state.ageFromDob = false;
    $("age").readOnly = false;
    $("ageHint").textContent =
      "Enter DOB to calculate age, or estimated age if DOB unknown.";
    $("duplicateWarning").classList.add("hidden");
    $("searchResults").innerHTML = "";
  }

  function savePatient(force) {
    const patient = readPatientFromForm();
    if (!patient.name) {
      alert("Patient name is required.");
      return null;
    }
    if (patient.dob && patient.age) {
      const calc = ageFromDateOfBirth(patient.dob);
      if (calc && calc !== String(patient.age)) {
        if (
          !confirm(
            "Age (" +
              patient.age +
              ") does not match date of birth (calculated " +
              calc +
              "). Save anyway using DOB-calculated age?"
          )
        ) {
          return null;
        }
        patient.age = calc;
        setVal("age", calc);
      }
    }
    const result = Store.patientStore.save(patient, { force: !!force });
    if (!result.ok && result.reason === "duplicate") {
      const box = $("duplicateWarning");
      box.classList.remove("hidden");
      box.innerHTML =
        "<strong>Possible duplicate patient(s):</strong><ul>" +
        result.duplicates
          .map(function (d) {
            const last = lastEncounterDate(d.id);
            return (
              "<li><button type=\"button\" class=\"linkish pick-dup\" data-id=\"" +
              escapeHtml(d.id) +
              "\">" +
              escapeHtml(d.name) +
              "</button> — " +
              escapeHtml(
                [
                  d.localPatientId && "ID " + d.localPatientId,
                  d.dob ? "DOB " + d.dob : d.age ? "Age " + d.age : null,
                  d.sex,
                  d.phone,
                  last ? "Last " + formatTime(last) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              ) +
              "</li>"
            );
          })
          .join("") +
        "</ul>" +
        '<button type="button" id="btnForceSave" class="btn-secondary">Save as new patient anyway</button>';
      $("btnForceSave").onclick = function () {
        savePatient(true);
      };
      box.querySelectorAll(".pick-dup").forEach(function (btn) {
        btn.addEventListener("click", function () {
          selectPatient(btn.getAttribute("data-id"));
          box.classList.add("hidden");
        });
      });
      return null;
    }
    if (!result.ok) {
      alert("Could not save patient: " + (result.reason || "unknown"));
      return null;
    }
    $("duplicateWarning").classList.add("hidden");
    state.patientId = result.patient.id;
    state.patientSavedAt = result.patient.updatedAt;
    state.editingNewPatient = false;
    refreshEncounterList(state.patientId, state.encounterId);
    state.dirty = state.encounterStarted ? state.dirty : false;
    updateSaveStatus();
    updateStoreMeta();
    updateActionGates();
    return result.patient;
  }

  // --- Encounter ---
  function readEncounterFromForm() {
    const planLines = getVal("planDraft")
      .split("\n")
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);

    return {
      id: state.encounterId || undefined,
      patientId: state.patientId,
      clinicianName: getVal("clinicianName").trim(),
      unit: getVal("unit"),
      status: "draft",
      presentingComplaint: getVal("pc"),
      history: {
        hpc: getVal("hpc"),
        odq: getVal("odq"),
        pastMedicalSurgicalHistory: getVal("pastMedicalSurgicalHistory"),
        drugHx: getVal("drugHx"),
        allergyHx: getVal("allergyHx"),
        familyHx: getVal("familyHx"),
        socialHx: getVal("socialHx"),
        ros: getVal("ros"),
        cardioHx: getVal("cardioHx"),
        obstetric: {
          gravida: getVal("gravida"),
          para: getVal("para"),
          ga: getVal("ga"),
          edd: getVal("edd"),
        },
      },
      examination: {
        generalExam: getVal("generalExam"),
        systemicExam: getVal("systemicExam"),
      },
      vitals: {
        bp: getVal("bp"),
        pulse: getVal("pulse"),
        rr: getVal("rr"),
        temp: getVal("temp"),
      },
      labs: {
        alt: getVal("alt"),
        ast: getVal("ast"),
        creatinine: getVal("creatinine"),
        urea: getVal("urea"),
        hb: getVal("hb"),
        wbc: getVal("wbc"),
        platelets: getVal("platelets"),
        urine_protein: getVal("urine_protein"),
        urine_glucose: getVal("urine_glucose"),
      },
      findings: state.findings.slice(),
      questionAnswers: state.questionAnswers.slice(),
      conditionCandidates: state.conditionCandidates.slice(),
      impression: getVal("impression"),
      plan: {
        draftItems: planLines,
        clinicianEdits: getVal("planEdits"),
        approvalStatus: $("planStatus").dataset.status || "draft",
        approvedBy: getVal("planApprover"),
        approvedAt: $("planStatus").dataset.approvedAt || null,
      },
      alerts: collectAlerts(),
    };
  }

  function fillEncounterForm(e) {
    state.encounterStarted = true;
    setVal("clinicianName", e.clinicianName);
    setVal("unit", e.unit);
    setVal("pc", e.presentingComplaint);
    const h = e.history || {};
    setVal("hpc", h.hpc);
    setVal("odq", h.odq);
    setVal("pastMedicalSurgicalHistory", h.pastMedicalSurgicalHistory);
    setVal("drugHx", h.drugHx);
    setVal("allergyHx", h.allergyHx);
    setVal("familyHx", h.familyHx);
    setVal("socialHx", h.socialHx);
    setVal("ros", h.ros);
    loadUnitFields();
    setVal("cardioHx", h.cardioHx);
    if (h.obstetric) {
      setVal("gravida", h.obstetric.gravida);
      setVal("para", h.obstetric.para);
      setVal("ga", h.obstetric.ga);
      setVal("edd", h.obstetric.edd);
    }
    const ex = e.examination || {};
    setVal("generalExam", ex.generalExam);
    setVal("systemicExam", ex.systemicExam);
    const v = e.vitals || {};
    setVal("bp", v.bp);
    setVal("pulse", v.pulse);
    setVal("rr", v.rr);
    setVal("temp", v.temp);
    const labs = e.labs || {};
    Object.keys(labs).forEach(function (k) {
      setVal(k, labs[k]);
    });
    setVal("impression", e.impression);
    const plan = e.plan || {};
    setVal("planDraft", (plan.draftItems || []).join("\n"));
    setVal("planEdits", plan.clinicianEdits || "");
    setVal("planApprover", plan.approvedBy || "");
    setPlanStatus(plan.approvalStatus || "draft", plan.approvedAt);

    state.findings = (e.findings || []).slice();
    state.questionAnswers = (e.questionAnswers || []).slice();
    state.conditionCandidates = (e.conditionCandidates || []).slice();
    const selected = state.conditionCandidates.find(function (c) {
      return c.status === "selected";
    });
    state.selectedConditionId = selected ? selected.id : null;

    renderSymptomChips();
    renderQuestions();
    renderDifferentials();
    refreshAlerts();
    buildSummary();
    showStage(state.stage || "history");
    updateActionGates();
  }

  function clearEncounterForm(keepPatient) {
    state.encounterId = null;
    state.encounterStarted = false;
    state.encounterSavedAt = null;
    state.findings = [];
    state.questionAnswers = [];
    state.conditionCandidates = [];
    state.selectedConditionId = null;
    state.stage = "history";
    [
      "clinicianName",
      "unit",
      "pc",
      "hpc",
      "odq",
      "pastMedicalSurgicalHistory",
      "drugHx",
      "allergyHx",
      "familyHx",
      "socialHx",
      "ros",
      "generalExam",
      "systemicExam",
      "bp",
      "pulse",
      "rr",
      "temp",
      "alt",
      "ast",
      "creatinine",
      "urea",
      "hb",
      "wbc",
      "platelets",
      "urine_protein",
      "urine_glucose",
      "impression",
      "planDraft",
      "planEdits",
      "planApprover",
      "summary",
    ].forEach(function (id) {
      setVal(id, "");
    });
    $("unitSection").innerHTML = "";
    setPlanStatus("draft", null);
    renderSymptomChips();
    $("questionsPanel").innerHTML =
      '<p class="muted">No questions yet. Confirm symptoms, then generate questions.</p>';
    $("differentialPanel").innerHTML =
      '<p class="muted">Press Analyze after recording findings.</p>';
    $("alertBox").textContent = "";
    $("bpError").classList.add("hidden");
    if (!keepPatient) {
      /* noop */
    }
    updateActionGates();
  }

  function startNewEncounter() {
    if (!state.patientId) {
      alert("Select or save a patient first.");
      return;
    }
    clearEncounterForm(true);
    state.encounterStarted = true;
    state.dirty = true;
    showPage("patients");
    showStage("history");
    updateSaveStatus();
    updateActionGates();
    if ($("encounterWorkspace")) {
      $("encounterWorkspace").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setPlanStatus(status, approvedAt) {
    const el = $("planStatus");
    el.dataset.status = status;
    el.dataset.approvedAt = approvedAt || "";
    const tag =
      status === "approved"
        ? " · Approved"
        : status === "draft"
          ? " · Pending review"
          : "";
    el.textContent =
      "Plan status: " +
      status +
      tag +
      (approvedAt ? " · " + formatTime(approvedAt) : "");
  }

  function saveEncounter() {
    if (!state.patientId) {
      const p = savePatient(false);
      if (!p) return;
    }
    if (!state.encounterStarted) {
      alert("Start an encounter first.");
      return;
    }
    if (!validateBp()) {
      alert("Fix blood pressure format (e.g. 120/80) before saving.");
      showStage("examination");
      return;
    }
    const encounter = readEncounterFromForm();
    if (!encounter.patientId) {
      alert("Save or select a patient first.");
      return;
    }
    const result = Store.encounterStore.save(encounter);
    if (!result.ok) {
      alert("Could not save encounter: " + (result.reason || "unknown"));
      return;
    }
    state.encounterId = result.encounter.id;
    state.encounterSavedAt = result.encounter.updatedAt;
    state.dirty = false;
    updateSaveStatus();
    refreshEncounterList(state.patientId, state.encounterId);
    updateStoreMeta();
    updateActionGates();
  }

  function loadUnitFields() {
    const unit = getVal("unit");
    const section = $("unitSection");
    section.innerHTML = "";
    if (unit === "obgyn") {
      section.innerHTML =
        "<h3>Obstetric history</h3>" +
        '<div class="grid-2">' +
        '<div><label for="gravida">Gravida</label><input id="gravida"></div>' +
        '<div><label for="para">Para</label><input id="para"></div>' +
        '<div><label for="ga">Estimated gestational age (weeks)</label><input id="ga" type="number"></div>' +
        '<div><label for="edd">Estimated date of delivery</label><input id="edd" type="date"></div>' +
        "</div>";
    }
    if (unit === "cardio") {
      section.innerHTML =
        "<h3>Cardiology-specific</h3>" +
        '<label for="cardioHx">Chest pain, dyspnea, orthopnea, PND</label>' +
        '<textarea id="cardioHx" rows="2"></textarea>';
    }
  }

  // --- Symptoms ---
  function renderSymptomChips() {
    const box = $("symptomChips");
    if (!state.findings.length) {
      box.innerHTML = '<span class="muted">No confirmed symptoms yet.</span>';
      return;
    }
    box.innerHTML = "";
    state.findings.forEach(function (f, idx) {
      const chip = document.createElement("span");
      chip.className = "chip chip-" + (f.status || "confirmed");
      const tag =
        f.status === "denied"
          ? '<span class="tag-rejected">Rejected / denied</span>'
          : '<span class="tag-confirmed">Confirmed by clinician</span>';
      chip.innerHTML =
        "<strong>" +
        escapeHtml(f.label) +
        "</strong> " +
        tag +
        ' <button type="button" data-idx="' +
        idx +
        '" class="chip-remove" aria-label="Remove">×</button>';
      box.appendChild(chip);
    });
    box.querySelectorAll(".chip-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const i = parseInt(btn.getAttribute("data-idx"), 10);
        state.findings.splice(i, 1);
        renderSymptomChips();
        markDirty();
      });
    });
  }

  function addSymptom(label, symptomId, status) {
    status = status || "confirmed";
    if (!symptomId && Knowledge.resolveSymptomId) {
      symptomId = Knowledge.resolveSymptomId(label);
      if (symptomId) {
        const known = Knowledge.labelForSymptom(symptomId);
        if (known) label = known;
      }
    }
    const existing = state.findings.find(function (f) {
      return (
        (symptomId && f.symptomId === symptomId) ||
        normalize(f.label) === normalize(label)
      );
    });
    if (existing) {
      existing.status = status;
      existing.label = label;
      if (symptomId) existing.symptomId = symptomId;
    } else {
      state.findings.push({
        id: Store.uuid(),
        symptomId: symptomId || null,
        type: "symptom",
        label: label,
        status: status,
        onset: "",
        severity: "",
        source: "manual",
      });
    }
    renderSymptomChips();
    markDirty();
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateSymptomSuggestions() {
    const text = getVal("symptomInput") || getVal("pc");
    const matches = Knowledge.suggestSymptoms(text);
    const dl = $("symptomSuggestions");
    dl.innerHTML = "";
    matches.forEach(function (m) {
      const opt = document.createElement("option");
      opt.value = m.label;
      dl.appendChild(opt);
    });
  }

  // --- Questions ---
  function resolveFindingIds() {
    // Backfill symptomId for free-text chips using knowledge aliases
    state.findings.forEach(function (f) {
      if (!f.symptomId && f.label && Knowledge.resolveSymptomId) {
        const resolved = Knowledge.resolveSymptomId(f.label);
        if (resolved) {
          f.symptomId = resolved;
          const known = Knowledge.labelForSymptom(resolved);
          if (known) f.label = known;
        }
      }
    });
    renderSymptomChips();
    return state.findings
      .filter(function (f) {
        return f.status === "confirmed";
      })
      .map(function (f) {
        return f.symptomId || f.label;
      })
      .filter(Boolean);
  }

  function generateQuestions() {
    if (!confirmedSymptoms().length) {
      alert("Confirm at least one symptom first.");
      return;
    }
    if (!state.findings.length && getVal("pc")) {
      Knowledge.suggestSymptoms(getVal("pc")).forEach(function (m) {
        addSymptom(m.label, m.id, "confirmed");
      });
    }
    const ids = resolveFindingIds();
    const patient = state.patientId
      ? Store.patientStore.getById(state.patientId)
      : readPatientFromForm();
    const questions = Knowledge.generateQuestions(ids, patient);
    if (!questions.length) {
      const labels = confirmedSymptoms()
        .map(function (f) {
          return f.label;
        })
        .join(", ");
      $("questionsPanel").innerHTML =
        '<p class="muted">No follow-up questions are mapped yet for: <strong>' +
        escapeHtml(labels || "current symptoms") +
        "</strong>. Add more known symptoms from autocomplete, or enter history manually below.</p>";
      markDirty();
      return;
    }
    state.questionAnswers = questions.map(function (q) {
      const prev = state.questionAnswers.find(function (a) {
        return a.questionId === q.id;
      });
      return {
        id: prev ? prev.id : Store.uuid(),
        questionId: q.id,
        questionText: q.questionText,
        category: q.category,
        answer: prev ? prev.answer : "",
        findingIds: prev ? prev.findingIds : [],
      };
    });
    renderQuestions();
    markDirty();
    updateHistoryCompletion();
  }

  function renderQuestions() {
    const panel = $("questionsPanel");
    if (!state.questionAnswers.length) {
      panel.innerHTML =
        '<p class="muted">No questions generated for the current symptoms.</p>';
      return;
    }
    panel.innerHTML = "";
    state.questionAnswers.forEach(function (qa, idx) {
      const div = document.createElement("div");
      div.className = "question-item";
      const answered = qa.answer && qa.answer !== "skipped";
      const statusTag = !qa.answer
        ? '<span class="tag-system">Suggested by system</span>'
        : qa.answer === "skipped"
          ? '<span class="tag-rejected">Skipped</span>'
          : '<span class="tag-confirmed">Answered by clinician</span>';
      div.innerHTML =
        '<p class="q-text"><span class="q-cat">' +
        escapeHtml(qa.category || "") +
        "</span> " +
        escapeHtml(qa.questionText) +
        " " +
        statusTag +
        "</p>" +
        '<div class="q-actions">' +
        '<button type="button" data-idx="' +
        idx +
        '" data-ans="yes" class="btn-secondary q-btn">Yes / present</button>' +
        '<button type="button" data-idx="' +
        idx +
        '" data-ans="no" class="btn-secondary q-btn">No / denied</button>' +
        '<button type="button" data-idx="' +
        idx +
        '" data-ans="skip" class="btn-secondary q-btn">Skip</button>' +
        "</div>" +
        '<input class="q-note" data-idx="' +
        idx +
        '" placeholder="Answer notes" value="' +
        escapeHtml(qa.answer || "") +
        '">';
      if (answered) div.classList.add("answered");
      panel.appendChild(div);
    });
    panel.querySelectorAll(".q-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const i = parseInt(btn.getAttribute("data-idx"), 10);
        const ans = btn.getAttribute("data-ans");
        applyQuestionAnswer(i, ans);
      });
    });
    panel.querySelectorAll(".q-note").forEach(function (input) {
      input.addEventListener("input", function () {
        const i = parseInt(input.getAttribute("data-idx"), 10);
        state.questionAnswers[i].answer = input.value;
        markDirty();
      });
    });
  }

  function applyQuestionAnswer(index, ans) {
    const qa = state.questionAnswers[index];
    if (!qa) return;
    if (ans === "skip") {
      qa.answer = "skipped";
      markDirty();
      renderQuestions();
      return;
    }
    const text = (qa.questionText || "").toLowerCase();
    const map = [
      { key: "shortness of breath", id: "sob", label: "Shortness of breath" },
      { key: "pleuritic", id: "chest_pain", label: "Pleuritic chest pain" },
      { key: "chest pain", id: "chest_pain", label: "Chest pain" },
      { key: "chills", id: "chills", label: "Chills" },
      { key: "blood", id: "hemoptysis", label: "Hemoptysis" },
      { key: "wheez", id: "wheeze", label: "Wheeze" },
      { key: "confusion", id: "confusion", label: "Confusion" },
      { key: "productive", id: "sputum", label: "Sputum production" },
      { key: "sputum", id: "sputum", label: "Sputum production" },
      { key: "weight loss", id: "weight_loss", label: "Weight loss" },
      { key: "painful urination", id: "dysuria", label: "Dysuria" },
      { key: "dysuria", id: "dysuria", label: "Dysuria" },
    ];
    let matched = null;
    for (let i = 0; i < map.length; i++) {
      if (text.indexOf(map[i].key) !== -1) {
        matched = map[i];
        break;
      }
    }
    if (matched) {
      addSymptom(matched.label, matched.id, ans === "yes" ? "confirmed" : "denied");
    }
    qa.answer = ans === "yes" ? "Present" : "Denied";
    markDirty();
    renderQuestions();
  }

  // --- Analyze ---
  function collectAlerts() {
    const ctx = {
      vitals: {
        bp: getVal("bp"),
        pulse: getVal("pulse"),
        rr: getVal("rr"),
        temp: getVal("temp"),
      },
      history: {
        allergyHx: getVal("allergyHx"),
      },
      findings: state.findings,
      labs: {
        alt: getVal("alt"),
        ast: getVal("ast"),
        creatinine: getVal("creatinine"),
        urea: getVal("urea"),
        hb: getVal("hb"),
        wbc: getVal("wbc"),
        platelets: getVal("platelets"),
        urine_protein: getVal("urine_protein"),
        urine_glucose: getVal("urine_glucose"),
      },
    };
    const unit = getVal("unit");
    const flags = Knowledge.evaluateRedFlags(ctx);
    const labs = Knowledge.evaluateLabAlerts(ctx.labs);
    if (unit === "obgyn") {
      const ga = parseInt(getVal("ga"), 10);
      if (ga && ga < 37) flags.push({ id: "rf_preterm", label: "Preterm pregnancy (GA < 37)" });
    }
    return flags.concat(labs);
  }

  function refreshAlerts() {
    const alerts = collectAlerts();
    const box = $("alertBox");
    if (!alerts.length) {
      box.textContent = "No automated alerts from current structured values.";
      box.classList.remove("has-alerts");
      return;
    }
    box.classList.add("has-alerts");
    box.innerHTML =
      "<strong>Attention — follow facility escalation procedures:</strong><ul>" +
      alerts
        .map(function (a) {
          return "<li>" + escapeHtml(a.label) + "</li>";
        })
        .join("") +
      "</ul>";
  }

  function analyze() {
    if (!confirmedSymptoms().length) {
      alert("Confirm at least one symptom before analyzing.");
      return;
    }
    const ctx = {
      findings: state.findings,
      vitals: {
        bp: getVal("bp"),
        pulse: getVal("pulse"),
        rr: getVal("rr"),
        temp: getVal("temp"),
      },
      history: { allergyHx: getVal("allergyHx") },
    };
    state.conditionCandidates = Knowledge.analyzeDifferentials(ctx);
    const generatedAt = Store.nowIso();
    state.conditionCandidates.forEach(function (c) {
      c.generationSource = "system";
      c.generatedAt = generatedAt;
      c.clinicianAction = c.clinicianAction || null;
      c.status = c.status || "suggested";
    });
    renderDifferentials();
    refreshAlerts();
    buildSummary();
    showStage("assessment");
    markDirty();
    updateActionGates();
  }

  function renderDifferentials() {
    const panel = $("differentialPanel");
    if (!state.conditionCandidates.length) {
      panel.innerHTML =
        '<p class="muted">No ranked conditions yet. Confirm symptoms and press Analyze.</p>';
      return;
    }
    panel.innerHTML =
      '<p class="ds-banner">Decision support — clinician verification required. These are condition candidates, not diagnoses.</p>';
    state.conditionCandidates.forEach(function (c) {
      const div = document.createElement("div");
      const isSelected = state.selectedConditionId === c.id;
      const isRejected = c.status === "rejected";
      div.className =
        "diff-item" +
        (isSelected ? " selected" : "") +
        (isRejected ? " rejected" : "");
      const support = (c.supportingFindings || [])
        .map(function (id) {
          return Knowledge.labelForSymptom(id);
        })
        .join(", ");
      const contra = (c.contradictingFindings || [])
        .map(function (id) {
          return Knowledge.labelForSymptom(id);
        })
        .join(", ");
      const missing = (c.missingFindings || [])
        .slice(0, 4)
        .map(function (id) {
          return Knowledge.labelForSymptom(id);
        })
        .join(", ");
      let statusTag = '<span class="tag-system">Suggested by system</span>';
      if (isSelected) {
        statusTag = '<span class="tag-confirmed">Accepted by clinician</span>';
      } else if (isRejected) {
        statusTag = '<span class="tag-rejected">Rejected</span>';
      } else if (c.status === "edited") {
        statusTag = '<span class="tag-clinician">Edited by clinician</span>';
      }
      div.innerHTML =
        "<header><strong>#" +
        c.rank +
        " " +
        escapeHtml(c.label) +
        "</strong> " +
        statusTag +
        ' <span class="score">score ' +
        c.score +
        "</span></header>" +
        "<p><em>Supports:</em> " +
        escapeHtml(support || "—") +
        "</p>" +
        "<p><em>Against / denied:</em> " +
        escapeHtml(contra || "—") +
        "</p>" +
        "<p><em>Still missing:</em> " +
        escapeHtml(missing || "—") +
        "</p>" +
        '<div class="diff-actions">' +
        '<button type="button" class="btn-secondary select-cond" data-id="' +
        escapeHtml(c.id) +
        '">Accept as working impression</button>' +
        '<button type="button" class="btn-secondary reject-cond" data-id="' +
        escapeHtml(c.id) +
        '">Reject</button>' +
        "</div>";
      panel.appendChild(div);
    });
    panel.querySelectorAll(".select-cond").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.selectedConditionId = btn.getAttribute("data-id");
        state.conditionCandidates.forEach(function (c) {
          if (c.id === state.selectedConditionId) {
            c.status = "selected";
            c.clinicianAction = "accepted";
            c.actionAt = Store.nowIso();
          } else if (c.status === "selected") {
            c.status = "suggested";
          }
        });
        const selected = state.conditionCandidates.find(function (c) {
          return c.id === state.selectedConditionId;
        });
        if (selected) {
          setVal(
            "impression",
            selected.label + " (working impression — clinician to verify)"
          );
        }
        renderDifferentials();
        markDirty();
        updateActionGates();
      });
    });
    panel.querySelectorAll(".reject-cond").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-id");
        state.conditionCandidates.forEach(function (c) {
          if (c.id === id) {
            c.status = "rejected";
            c.clinicianAction = "rejected";
            c.actionAt = Store.nowIso();
          }
        });
        if (state.selectedConditionId === id) {
          state.selectedConditionId = null;
        }
        renderDifferentials();
        markDirty();
        updateActionGates();
      });
    });
  }

  function draftPlan() {
    if (!state.selectedConditionId) {
      alert("Select a condition candidate from Assessment first.");
      showStage("assessment");
      return;
    }
    const items = Knowledge.draftPlanForCondition(state.selectedConditionId);
    setVal("planDraft", items.join("\n"));
    setPlanStatus("draft", null);
    markDirty();
    updateActionGates();
  }

  function approvePlan() {
    const by = getVal("planApprover").trim() || getVal("clinicianName").trim();
    if (!by) {
      alert("Enter the approving clinician name.");
      return;
    }
    if (!getVal("planDraft").trim()) {
      alert("Plan is empty. Draft or enter plan items first.");
      return;
    }
    setVal("planApprover", by);
    const at = Store.nowIso();
    setPlanStatus("approved", at);
    markDirty();
    updateActionGates();
  }

  function buildSummary() {
    const p = state.patientId
      ? Store.patientStore.getById(state.patientId)
      : readPatientFromForm();
    const alerts = collectAlerts();
    let s = "";
    s += "SMART CLERKING ASSISTANT — ENCOUNTER SUMMARY\n";
    s += "Decision support — clinician verification required\n\n";
    s += "BIODATA\n";
    s +=
      "Name: " +
      (p.name || "") +
      ", DOB: " +
      (p.dob || "—") +
      ", Age: " +
      (p.age || "") +
      (p.dob ? " (from DOB)" : p.age ? " (estimated)" : "") +
      ", Sex: " +
      (p.sex || "") +
      "\n";
    s +=
      "Local ID: " +
      (p.localPatientId || "") +
      ", Phone: " +
      (p.phone || "") +
      "\n";
    s += "Address: " + (p.address || "") + ", Occupation: " + (p.occupation || "") + "\n\n";
    s += "ENCOUNTER\n";
    s += "Clinician: " + getVal("clinicianName") + ", Unit: " + getVal("unit") + "\n";
    s += "PC: " + getVal("pc") + "\n";
    s +=
      "Findings (clinician-confirmed / denied):\n" +
      state.findings
        .map(function (f) {
          return (
            "  - " +
            f.label +
            " [" +
            (f.status === "denied" ? "Rejected / denied" : "Confirmed by clinician") +
            "]"
          );
        })
        .join("\n") +
      "\n\n";
    s += "HISTORY (clinician-entered)\n";
    s += "HPC: " + getVal("hpc") + "\n";
    s += "ODQ: " + getVal("odq") + "\n";
    s += "PM/SH: " + getVal("pastMedicalSurgicalHistory") + "\n";
    s +=
      "Drugs: " +
      getVal("drugHx") +
      "; Allergy: " +
      getVal("allergyHx") +
      "\n";
    s +=
      "Family: " +
      getVal("familyHx") +
      "; Social: " +
      getVal("socialHx") +
      "\n";
    s += "ROS: " + getVal("ros") + "\n\n";
    s += "EXAM (clinician-entered)\n";
    s += "General: " + getVal("generalExam") + "\n";
    s += "Systemic: " + getVal("systemicExam") + "\n";
    s +=
      "Vitals — BP: " +
      getVal("bp") +
      " mmHg, Pulse: " +
      getVal("pulse") +
      " beats/min, RR: " +
      getVal("rr") +
      " breaths/min, Temp: " +
      getVal("temp") +
      " °C\n\n";
    if (alerts.length) {
      s += "ALERTS (system)\n";
      alerts.forEach(function (a) {
        s += "- " + a.label + "\n";
      });
      s += "\n";
    }
    s += "CONDITION CANDIDATES (suggested by system — not a diagnosis)\n";
    state.conditionCandidates.forEach(function (c) {
      let label = "suggested";
      if (c.status === "selected") label = "ACCEPTED BY CLINICIAN";
      else if (c.status === "rejected") label = "REJECTED";
      else if (c.status === "edited") label = "EDITED BY CLINICIAN";
      s +=
        "#" +
        c.rank +
        " " +
        c.label +
        " (score " +
        c.score +
        ") [" +
        label +
        "]\n";
    });
    s += "\nWORKING IMPRESSION (clinician-approved): " + getVal("impression") + "\n";
    s +=
      "PLAN (" +
      ($("planStatus").dataset.status || "draft") +
      "):\n" +
      "[Suggested by system — editable]\n" +
      getVal("planDraft") +
      "\n";
    if (getVal("planEdits")) {
      s += "[Edited by clinician]\n" + getVal("planEdits") + "\n";
    }
    if (getVal("planApprover")) {
      s +=
        "[Approved] Approved by: " +
        getVal("planApprover") +
        ($("planStatus").dataset.approvedAt
          ? " at " + formatTime($("planStatus").dataset.approvedAt)
          : "") +
        "\n";
    }
    setVal("summary", s);
  }

  // --- Backup ---
  function exportBackup() {
    const data = Store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "smart-clerking-backup-" +
      new Date().toISOString().replace(/[:.]/g, "-") +
      ".json";
    a.click();
    URL.revokeObjectURL(url);
    state.lastBackupAt = Store.nowIso();
    try {
      localStorage.setItem(LAST_BACKUP_KEY, state.lastBackupAt);
    } catch (e) {}
    updateSaveStatus();
    updateLastBackupLine();
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        const mode = confirm(
          "OK = merge into existing records.\nCancel = replace all local records (destructive)."
        )
          ? "merge"
          : "replace";
        if (mode === "replace") {
          if (
            !confirm(
              "Replace will overwrite all local patients and encounters. Have you downloaded a backup? Continue?"
            )
          ) {
            return;
          }
        }
        const report = Store.importAll(data, mode);
        const el = $("importReport");
        el.classList.remove("hidden");
        el.textContent = JSON.stringify(report, null, 2);
        if (state.patientId) refreshEncounterList(state.patientId, state.encounterId);
        updateStoreMeta();
        updateActionGates();
        if (!report.ok) {
          alert(
            "Restore failed validation.\n" +
              (report.validation && report.validation.errors
                ? report.validation.errors.join("\n")
                : "See report.")
          );
        } else {
          const converted =
            report.validation && report.validation.converted
              ? "\nConverted: " + report.validation.converted
              : "";
          alert(
            "Restore complete." +
              converted +
              "\nAdded: " +
              report.added +
              ", Updated: " +
              report.updated +
              ", Skipped: " +
              report.skipped +
              ", Invalid: " +
              report.invalid
          );
        }
      } catch (err) {
        alert("Invalid backup file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function getFocusable(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    state.lastFocused = document.activeElement;
    state.modalOpen = id;
    modal.classList.remove("hidden");
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    const focusables = getFocusable(modal);
    if (focusables.length) focusables[0].focus();
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("hidden");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    if (state.modalOpen === id) state.modalOpen = null;
    if (state.lastFocused && state.lastFocused.focus) {
      try {
        state.lastFocused.focus();
      } catch (e) {}
    }
  }

  function openDeleteModal() {
    const meta = Store.getMeta();
    $("deleteCountText").textContent =
      "This will permanently delete " +
      meta.patientCount +
      " patient(s) and " +
      meta.encounterCount +
      " encounter(s) stored in this browser.";
    setVal("deleteConfirmInput", "");
    $("btnDeleteConfirm").disabled = true;
    openModal("deleteModal");
  }

  function performDeleteAll() {
    Store.resetAll();
    state.editingNewPatient = false;
    clearPatientForm();
    state.editingNewPatient = false;
    clearEncounterForm(false);
    refreshEncounterList(null);
    state.dirty = false;
    updateSaveStatus();
    updateStoreMeta();
    updateActionGates();
    closeModal("deleteModal");
    showPage("settings");
    alert("All locally saved records were deleted.");
  }

  function dismissOnboarding() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch (e) {}
    closeModal("onboardingModal");
  }

  // --- Events ---
  function bind() {
    // Event delegation so nav keeps working even if buttons are re-rendered
    document.addEventListener("click", function (ev) {
      const navBtn = ev.target.closest && ev.target.closest(".top-nav-btn");
      if (navBtn) {
        ev.preventDefault();
        showPage(navBtn.getAttribute("data-page"));
        return;
      }
      const how = ev.target.closest && ev.target.closest("#btnHowItWorks");
      if (how) {
        ev.preventDefault();
        showPage("help");
      }
    });

    if ($("btnFocusSearch")) {
      $("btnFocusSearch").addEventListener("click", function () {
        $("searchQuery").focus();
      });
    }
    if ($("btnCreateFromEmpty")) {
      $("btnCreateFromEmpty").addEventListener("click", function () {
        $("btnNewPatient").click();
      });
    }
    if ($("btnCancelPatient")) {
      $("btnCancelPatient").addEventListener("click", function () {
        if (state.patientId) {
          const p = Store.patientStore.getById(state.patientId);
          if (p) fillPatientForm(p);
          state.dirty = false;
          updateSaveStatus();
          updateActionGates();
        } else {
          clearPatientForm();
          state.editingNewPatient = false;
          updateActionGates();
          updateSaveStatus();
        }
      });
    }

    if ($("btnOnboardingHelp")) {
      $("btnOnboardingHelp").addEventListener("click", function () {
        dismissOnboarding();
        showPage("help");
      });
    }
    if ($("btnOnboardingDismiss")) {
      $("btnOnboardingDismiss").addEventListener("click", dismissOnboarding);
    }

    $("btnSearch").addEventListener("click", runSearch);
    $("searchQuery").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        runSearch();
      }
    });
    $("searchQuery").addEventListener("input", function () {
      if (getVal("searchQuery").trim().length >= 2) runSearch();
      if (!getVal("searchQuery").trim()) $("searchResults").innerHTML = "";
    });

    $("btnNewPatient").addEventListener("click", function () {
      clearPatientForm();
      clearEncounterForm(false);
      refreshEncounterList(null);
      state.dirty = false;
      showPage("patients");
      updateSaveStatus();
      updateActionGates();
      $("name").focus();
    });

    $("btnSavePatient").addEventListener("click", function () {
      savePatient(false);
    });

    $("btnNewEncounter").addEventListener("click", startNewEncounter);
    $("btnNewEncounterEmpty").addEventListener("click", startNewEncounter);
    $("btnBackToPatient").addEventListener("click", function () {
      if (state.dirty) {
        if (!confirm("Leave encounter without saving unsaved changes?")) return;
      }
      clearEncounterForm(true);
      refreshEncounterList(state.patientId);
      updateSaveStatus();
      updateActionGates();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    $("btnSaveEncounter").addEventListener("click", saveEncounter);
    $("unit").addEventListener("change", function () {
      loadUnitFields();
      markDirty();
    });

    $("dob").addEventListener("change", onDobChange);
    $("dob").addEventListener("input", onDobChange);
    $("age").addEventListener("input", onAgeManual);
    $("bp").addEventListener("input", function () {
      validateBp();
      refreshAlerts();
      markDirty();
    });

    $("btnAddSymptom").addEventListener("click", function () {
      const text = getVal("symptomInput").trim();
      if (!text) return;
      const matches = Knowledge.suggestSymptoms(text);
      const match =
        matches.find(function (m) {
          return normalize(m.label) === normalize(text);
        }) || matches[0];
      if (match) addSymptom(match.label, match.id, "confirmed");
      else addSymptom(text, null, "confirmed");
      setVal("symptomInput", "");
    });

    $("symptomInput").addEventListener("input", updateSymptomSuggestions);
    $("pc").addEventListener("input", function () {
      updateSymptomSuggestions();
      markDirty();
    });

    $("btnGenerateQuestions").addEventListener("click", generateQuestions);
    $("btnAnalyze").addEventListener("click", analyze);
    $("btnDraftPlan").addEventListener("click", draftPlan);
    $("btnApprovePlan").addEventListener("click", approvePlan);
    $("btnBuildSummary").addEventListener("click", buildSummary);
    $("btnPrintSummary").addEventListener("click", function () {
      buildSummary();
      const w = window.open("", "_blank");
      w.document.write(
        "<pre style='font-family:Georgia,serif;white-space:pre-wrap;padding:24px'>" +
          escapeHtml(getVal("summary")) +
          "</pre>"
      );
      w.document.close();
      w.print();
    });

    $("btnExamTemplate").addEventListener("click", function () {
      setVal(
        "generalExam",
        "Appearance:\nConsciousness:\nNutrition:\nHydration:\nPallor:\nJaundice:\nCyanosis:\nOedema:\nLymphadenopathy:"
      );
      setVal(
        "systemicExam",
        "Cardiovascular:\nRespiratory:\nAbdomen:\nCNS:\nMusculoskeletal:\nSkin:\nOthers:"
      );
      markDirty();
    });

    $("btnExport").addEventListener("click", exportBackup);
    $("importFile").addEventListener("change", function (ev) {
      const file = ev.target.files && ev.target.files[0];
      if (file) importBackup(file);
      ev.target.value = "";
    });
    $("btnReset").addEventListener("click", openDeleteModal);
    $("btnDeleteCancel").addEventListener("click", function () {
      closeModal("deleteModal");
    });
    $("deleteConfirmInput").addEventListener("input", function () {
      $("btnDeleteConfirm").disabled =
        getVal("deleteConfirmInput").trim() !== "DELETE ALL RECORDS";
    });
    $("btnDeleteConfirm").addEventListener("click", function () {
      if (getVal("deleteConfirmInput").trim() !== "DELETE ALL RECORDS") return;
      performDeleteAll();
    });

    document.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        const which = el.getAttribute("data-close");
        if (which === "onboarding") dismissOnboarding();
        if (which === "delete") closeModal("deleteModal");
      });
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && state.modalOpen) {
        if (state.modalOpen === "onboardingModal") dismissOnboarding();
        else if (state.modalOpen === "deleteModal") closeModal("deleteModal");
      }
      if (ev.key === "Tab" && state.modalOpen) {
        const modal = $(state.modalOpen);
        const focusables = getFocusable(modal);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    });

    document.querySelectorAll(".stage-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        if (tab.disabled) return;
        showStage(tab.getAttribute("data-stage"));
      });
    });
    if ($("stageSelect")) {
      $("stageSelect").addEventListener("change", function () {
        const next = getVal("stageSelect");
        if (!canEnterStage(next)) {
          $("stageSelect").value = state.stage;
          return;
        }
        showStage(next);
      });
    }
    document.querySelectorAll(".stage-next").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const next = btn.getAttribute("data-next");
        if (!canEnterStage(next)) {
          showStage(next); // will alert
          return;
        }
        showStage(next);
      });
    });
    document.querySelectorAll(".stage-prev").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showStage(btn.getAttribute("data-prev"));
      });
    });

    setInterval(function () {
      if (state.dirty && state.patientId && state.encounterStarted) {
        saveEncounter();
      }
    }, 30000);

    document.querySelectorAll("input, textarea, select").forEach(function (el) {
      if (
        el.id === "encounterList" ||
        el.id === "searchQuery" ||
        el.id === "importFile" ||
        el.id === "deleteConfirmInput" ||
        el.id === "stageSelect"
      ) {
        return;
      }
      el.addEventListener("input", function () {
        markDirty();
        updateActionGates();
      });
      el.addEventListener("change", function () {
        markDirty();
        updateActionGates();
      });
    });

    ["pulse", "rr", "temp", "allergyHx"]
      .concat([
        "alt",
        "ast",
        "creatinine",
        "urea",
        "hb",
        "wbc",
        "platelets",
        "urine_protein",
        "urine_glucose",
      ])
      .forEach(function (id) {
        const el = $(id);
        if (el) el.addEventListener("input", refreshAlerts);
      });
  }

  function init() {
    Store.migrateFromLegacyKeyIfNeeded();
    try {
      state.lastBackupAt = localStorage.getItem(LAST_BACKUP_KEY) || null;
    } catch (e) {
      state.lastBackupAt = null;
    }
    // Force-hide modals before binding in case CSS cache is stale
    ["onboardingModal", "deleteModal"].forEach(function (id) {
      const el = $(id);
      if (el) {
        el.classList.add("hidden");
        el.style.display = "none";
        el.setAttribute("aria-hidden", "true");
      }
    });
    bind();
    showPage("patients");
    updateStoreMeta();
    updateSaveStatus();
    updateActionGates();
    refreshAlerts();
    refreshEncounterList(null);
    try {
      if (localStorage.getItem(ONBOARDING_KEY) !== "1") {
        openModal("onboardingModal");
      }
    } catch (e) {}
  }

  window.addEventListener("DOMContentLoaded", init);
})();
