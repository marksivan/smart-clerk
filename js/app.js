/**
 * Smart Clerking Assistant — UI controller
 */
(function () {
  "use strict";

  const Store = window.SmartClerkingStore;
  const Knowledge = window.SmartClerkingKnowledge;

  const state = {
    patientId: null,
    encounterId: null,
    findings: [],
    questionAnswers: [],
    conditionCandidates: [],
    selectedConditionId: null,
    lastSavedAt: null,
    dirty: false,
  };

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

  function markDirty() {
    state.dirty = true;
    updateSaveStatus();
  }

  function updateSaveStatus() {
    const el = $("saveStatus");
    if (!el) return;
    if (state.lastSavedAt) {
      const t = new Date(state.lastSavedAt);
      el.textContent =
        (state.dirty ? "Unsaved changes · " : "Saved on this device · ") +
        t.toLocaleString();
      el.classList.toggle("unsaved", state.dirty);
    } else {
      el.textContent = state.dirty ? "Unsaved changes" : "Not saved yet";
      el.classList.toggle("unsaved", state.dirty);
    }
  }

  function updateStoreMeta() {
    const meta = Store.getMeta();
    $("storeMeta").textContent =
      "Storage key: " +
      meta.storageKey +
      " · schema v" +
      meta.schemaVersion +
      " · " +
      meta.patientCount +
      " patients · " +
      meta.encounterCount +
      " encounters";
  }

  // --- Patient UI ---
  function refreshPatientList(selectedId) {
    const list = $("patientList");
    const patients = Store.patientStore.getAll().sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    list.innerHTML = '<option value="">— Select patient —</option>';
    patients.forEach(function (p) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent =
        p.name +
        (p.age ? " (" + p.age + ")" : "") +
        (p.localPatientId ? " · " + p.localPatientId : "");
      list.appendChild(opt);
    });
    if (selectedId) list.value = selectedId;
  }

  function refreshEncounterList(patientId, selectedId) {
    const list = $("encounterList");
    list.innerHTML = '<option value="">— No encounters —</option>';
    if (!patientId) return;
    const encounters = Store.encounterStore.getByPatientId(patientId);
    if (!encounters.length) {
      list.innerHTML = '<option value="">— No encounters yet —</option>';
      return;
    }
    list.innerHTML = '<option value="">— Select encounter —</option>';
    encounters.forEach(function (e) {
      const opt = document.createElement("option");
      opt.value = e.id;
      const when = e.updatedAt ? new Date(e.updatedAt).toLocaleString() : "draft";
      const pc = (e.presentingComplaint || "Encounter").slice(0, 40);
      opt.textContent = when + " · " + pc + " · " + (e.status || "draft");
      list.appendChild(opt);
    });
    if (selectedId) list.value = selectedId;
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
    setVal("age", p.age);
    setVal("dob", p.dob);
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
    $("duplicateWarning").classList.add("hidden");
  }

  function savePatient(force) {
    const patient = readPatientFromForm();
    if (!patient.name) {
      alert("Patient name is required.");
      return null;
    }
    const result = Store.patientStore.save(patient, { force: !!force });
    if (!result.ok && result.reason === "duplicate") {
      const names = result.duplicates
        .map(function (d) {
          return d.name + (d.age ? " (" + d.age + ")" : "");
        })
        .join(", ");
      $("duplicateWarning").classList.remove("hidden");
      $("duplicateWarning").innerHTML =
        "Possible duplicate patient(s): <strong>" +
        names +
        "</strong>. " +
        '<button type="button" id="btnForceSave" class="btn-secondary">Save anyway</button> ' +
        "or select the existing record.";
      $("btnForceSave").onclick = function () {
        savePatient(true);
      };
      return null;
    }
    if (!result.ok) {
      alert("Could not save patient: " + (result.reason || "unknown"));
      return null;
    }
    $("duplicateWarning").classList.add("hidden");
    state.patientId = result.patient.id;
    refreshPatientList(state.patientId);
    refreshEncounterList(state.patientId, state.encounterId);
    state.lastSavedAt = result.patient.updatedAt;
    state.dirty = false;
    updateSaveStatus();
    updateStoreMeta();
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
  }

  function clearEncounterForm() {
    state.encounterId = null;
    state.findings = [];
    state.questionAnswers = [];
    state.conditionCandidates = [];
    state.selectedConditionId = null;
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
      '<p class="muted">No questions yet. Enter symptoms and press Generate questions.</p>';
    $("differentialPanel").innerHTML =
      '<p class="muted">Press Analyze after recording findings.</p>';
    $("alertBox").textContent = "";
  }

  function setPlanStatus(status, approvedAt) {
    const el = $("planStatus");
    el.dataset.status = status;
    el.dataset.approvedAt = approvedAt || "";
    el.textContent =
      "Plan status: " +
      status +
      (approvedAt ? " · " + new Date(approvedAt).toLocaleString() : "");
  }

  function saveEncounter() {
    if (!state.patientId) {
      const p = savePatient(false);
      if (!p) return;
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
    state.lastSavedAt = result.encounter.updatedAt;
    state.dirty = false;
    updateSaveStatus();
    refreshEncounterList(state.patientId, state.encounterId);
    updateStoreMeta();
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
        '<div><label for="ga">Estimated gestational age (weeks)</label><input id="ga"></div>' +
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
      chip.innerHTML =
        "<strong>" +
        escapeHtml(f.label) +
        "</strong> " +
        '<em>' +
        escapeHtml(f.status) +
        "</em> " +
        '<button type="button" data-idx="' +
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
  function generateQuestions() {
    // Seed findings from PC text if empty
    if (!state.findings.length && getVal("pc")) {
      Knowledge.suggestSymptoms(getVal("pc")).forEach(function (m) {
        addSymptom(m.label, m.id, "confirmed");
      });
    }
    const ids = state.findings
      .filter(function (f) {
        return f.status === "confirmed" && f.symptomId;
      })
      .map(function (f) {
        return f.symptomId;
      });
    const patient = state.patientId
      ? Store.patientStore.getById(state.patientId)
      : readPatientFromForm();
    const questions = Knowledge.generateQuestions(ids, patient);
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
      div.innerHTML =
        '<p class="q-text"><span class="q-cat">' +
        escapeHtml(qa.category || "") +
        "</span> " +
        escapeHtml(qa.questionText) +
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
      qa.answer = qa.answer || "skipped";
      markDirty();
      renderQuestions();
      return;
    }
    // Heuristic: map question text keywords to findings
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
    qa.answer =
      (ans === "yes" ? "Present" : "Denied") +
      (qa.answer && qa.answer.indexOf("Present") === -1 && qa.answer.indexOf("Denied") === -1
        ? " — " + qa.answer
        : "");
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
    renderDifferentials();
    refreshAlerts();
    buildSummary();
    markDirty();
  }

  function renderDifferentials() {
    const panel = $("differentialPanel");
    if (!state.conditionCandidates.length) {
      panel.innerHTML =
        '<p class="muted">No ranked conditions yet. Confirm symptoms and press Analyze.</p>';
      return;
    }
    panel.innerHTML =
      '<p class="ds-banner">Decision support — clinician verification required. Not a diagnosis.</p>';
    state.conditionCandidates.forEach(function (c) {
      const div = document.createElement("div");
      div.className =
        "diff-item" + (state.selectedConditionId === c.id ? " selected" : "");
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
      div.innerHTML =
        "<header><strong>#" +
        c.rank +
        " " +
        escapeHtml(c.label) +
        "</strong> <span class=\"score\">score " +
        c.score +
        '</span></header>' +
        "<p><em>Supports:</em> " +
        escapeHtml(support || "—") +
        "</p>" +
        "<p><em>Against / denied:</em> " +
        escapeHtml(contra || "—") +
        "</p>" +
        "<p><em>Still missing:</em> " +
        escapeHtml(missing || "—") +
        "</p>" +
        '<button type="button" class="btn-secondary select-cond" data-id="' +
        escapeHtml(c.id) +
        '">Select for focused plan</button>';
      panel.appendChild(div);
    });
    panel.querySelectorAll(".select-cond").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.selectedConditionId = btn.getAttribute("data-id");
        state.conditionCandidates.forEach(function (c) {
          c.status = c.id === state.selectedConditionId ? "selected" : "suggested";
        });
        const selected = state.conditionCandidates.find(function (c) {
          return c.id === state.selectedConditionId;
        });
        if (selected) {
          setVal("impression", selected.label + " (working — verify)");
        }
        renderDifferentials();
        markDirty();
      });
    });
  }

  function draftPlan() {
    if (!state.selectedConditionId) {
      alert("Select a condition from the differential first.");
      return;
    }
    const items = Knowledge.draftPlanForCondition(state.selectedConditionId);
    setVal("planDraft", items.join("\n"));
    setPlanStatus("draft", null);
    markDirty();
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
      ", Age: " +
      (p.age || "") +
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
      "Findings: " +
      state.findings
        .map(function (f) {
          return f.label + " [" + f.status + "]";
        })
        .join("; ") +
      "\n\n";
    s += "HISTORY\n";
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
    s += "EXAM\n";
    s += "General: " + getVal("generalExam") + "\n";
    s += "Systemic: " + getVal("systemicExam") + "\n";
    s +=
      "Vitals — BP: " +
      getVal("bp") +
      ", Pulse: " +
      getVal("pulse") +
      ", RR: " +
      getVal("rr") +
      ", Temp: " +
      getVal("temp") +
      "\n\n";
    if (alerts.length) {
      s += "ALERTS\n";
      alerts.forEach(function (a) {
        s += "- " + a.label + "\n";
      });
      s += "\n";
    }
    s += "DIFFERENTIAL (decision support)\n";
    state.conditionCandidates.forEach(function (c) {
      s +=
        "#" +
        c.rank +
        " " +
        c.label +
        " (score " +
        c.score +
        ")" +
        (c.status === "selected" ? " [SELECTED]" : "") +
        "\n";
    });
    s += "\nIMPRESSION: " + getVal("impression") + "\n";
    s +=
      "PLAN (" +
      ($("planStatus").dataset.status || "draft") +
      "):\n" +
      getVal("planDraft") +
      "\n";
    if (getVal("planEdits")) s += "Clinician edits: " + getVal("planEdits") + "\n";
    if (getVal("planApprover")) s += "Approved by: " + getVal("planApprover") + "\n";
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
              "Replace will overwrite all local patients and encounters. Have you exported a backup? Continue?"
            )
          ) {
            return;
          }
        }
        const report = Store.importAll(data, mode);
        const el = $("importReport");
        el.classList.remove("hidden");
        el.textContent = JSON.stringify(report, null, 2);
        refreshPatientList(state.patientId);
        refreshEncounterList(state.patientId, state.encounterId);
        updateStoreMeta();
        if (!report.ok) alert("Import failed validation. See report.");
        else alert("Import complete. See report for added/updated/skipped counts.");
      } catch (err) {
        alert("Invalid JSON backup: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function resetDemo() {
    if (
      !confirm(
        "Reset will delete all local patients and encounters on this device.\n\nHave you exported a JSON backup?\n\nPress OK only if you have a backup or accept permanent data loss."
      )
    ) {
      return;
    }
    if (!confirm("Final confirmation: reset all demo data now?")) return;
    Store.resetAll();
    clearPatientForm();
    clearEncounterForm();
    refreshPatientList();
    refreshEncounterList(null);
    state.lastSavedAt = null;
    state.dirty = false;
    updateSaveStatus();
    updateStoreMeta();
    alert("Demo data reset.");
  }

  // --- Events ---
  function bind() {
    $("btnSearch").addEventListener("click", function () {
      const q = getVal("searchQuery");
      const results = Store.patientStore.search(q);
      const list = $("patientList");
      list.innerHTML = '<option value="">— Select patient —</option>';
      results.forEach(function (p) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name + (p.age ? " (" + p.age + ")" : "");
        list.appendChild(opt);
      });
    });

    $("patientList").addEventListener("change", function () {
      const id = getVal("patientList");
      if (!id) return;
      const p = Store.patientStore.getById(id);
      if (!p) return;
      state.patientId = p.id;
      fillPatientForm(p);
      clearEncounterForm();
      refreshEncounterList(p.id);
      state.dirty = false;
      updateSaveStatus();
    });

    $("encounterList").addEventListener("change", function () {
      const id = getVal("encounterList");
      if (!id) return;
      const e = Store.encounterStore.getById(id);
      if (!e) return;
      state.encounterId = e.id;
      fillEncounterForm(e);
      state.lastSavedAt = e.updatedAt;
      state.dirty = false;
      updateSaveStatus();
    });

    $("btnNewPatient").addEventListener("click", function () {
      clearPatientForm();
      clearEncounterForm();
      refreshEncounterList(null);
      $("patientList").value = "";
      markDirty();
    });

    $("btnSavePatient").addEventListener("click", function () {
      savePatient(false);
    });

    $("btnNewEncounter").addEventListener("click", function () {
      if (!state.patientId) {
        alert("Save or select a patient first.");
        return;
      }
      clearEncounterForm();
      $("encounterList").value = "";
      markDirty();
    });

    $("btnSaveEncounter").addEventListener("click", saveEncounter);
    $("unit").addEventListener("change", function () {
      loadUnitFields();
      markDirty();
    });

    $("btnAddSymptom").addEventListener("click", function () {
      const text = getVal("symptomInput").trim();
      if (!text) return;
      const matches = Knowledge.suggestSymptoms(text);
      const match = matches.find(function (m) {
        return normalize(m.label) === normalize(text);
      }) || matches[0];
      if (match && normalize(match.label) === normalize(text)) {
        addSymptom(match.label, match.id, "confirmed");
      } else if (match) {
        addSymptom(match.label, match.id, "confirmed");
      } else {
        addSymptom(text, null, "confirmed");
      }
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
    $("btnReset").addEventListener("click", resetDemo);

    $("dismissPrivacy").addEventListener("click", function () {
      $("privacyBanner").classList.add("hidden");
      try {
        localStorage.setItem("smartClerking:privacyDismissed", "1");
      } catch (e) {}
    });

    // Autosave draft every 30s if dirty
    setInterval(function () {
      if (state.dirty && state.patientId) {
        saveEncounter();
      }
    }, 30000);

    // Mark dirty on common inputs
    document.querySelectorAll("input, textarea, select").forEach(function (el) {
      if (el.id === "patientList" || el.id === "encounterList" || el.id === "searchQuery")
        return;
      el.addEventListener("input", markDirty);
      el.addEventListener("change", markDirty);
    });

    ["bp", "pulse", "rr", "temp", "allergyHx"]
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
    if (localStorage.getItem("smartClerking:privacyDismissed") === "1") {
      $("privacyBanner").classList.add("hidden");
    }
    bind();
    refreshPatientList();
    updateStoreMeta();
    updateSaveStatus();
    refreshAlerts();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
