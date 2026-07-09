/**
 * Smart Clerking Assistant — versioned localStorage service.
 * All persistence goes through this module. No clinical rules here.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "smartClerking:v1";
  const SCHEMA_VERSION = 2;
  const APPLICATION_NAME = "Smart Clerking Assistant";
  const APPLICATION_VERSION = "0.3.0";

  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function emptyStore() {
    return {
      application: APPLICATION_NAME,
      applicationVersion: APPLICATION_VERSION,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: null,
      patients: [],
      encounters: [],
      knowledgeVersion: null,
    };
  }

  function readRaw() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyStore();
      const parsed = JSON.parse(raw);
      return migrate(parsed);
    } catch (err) {
      console.error("localStore read failed", err);
      return emptyStore();
    }
  }

  function writeRaw(store) {
    const copy = Object.assign({}, store, {
      application: APPLICATION_NAME,
      applicationVersion: APPLICATION_VERSION,
      schemaVersion: SCHEMA_VERSION,
    });
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    return copy;
  }

  /**
   * Migrate older shapes (including legacy `patients` array) into current schema.
   * Schema v2 adds firstName / middleName / lastName and unique 6-digit local IDs.
   */
  function migrate(data) {
    if (!data || typeof data !== "object") return emptyStore();

    // Legacy prototype: bare array under key "patients"
    if (Array.isArray(data)) {
      return migratePatientNameFields(migrateLegacyPatientsArray(data));
    }

    if (!data.schemaVersion) {
      // Possibly old object without version
      if (Array.isArray(data.patients) && !data.encounters) {
        return migratePatientNameFields(migrateLegacyPatientsArray(data.patients));
      }
      data.schemaVersion = 1;
    }

    if (data.schemaVersion > SCHEMA_VERSION) {
      throw new Error(
        "Backup schemaVersion " +
          data.schemaVersion +
          " is newer than this app (" +
          SCHEMA_VERSION +
          ")."
      );
    }

    data.patients = Array.isArray(data.patients) ? data.patients : [];
    data.encounters = Array.isArray(data.encounters) ? data.encounters : [];

    // Always normalize name parts / local IDs (safe for v1 imports and partial records)
    data = migratePatientNameFields(data);
    data.schemaVersion = SCHEMA_VERSION;
    return data;
  }

  function splitFullName(fullName) {
    const parts = String(fullName || "")
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .filter(Boolean);
    if (!parts.length) {
      return { firstName: "", middleName: "", lastName: "" };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], middleName: "", lastName: "" };
    }
    if (parts.length === 2) {
      return { firstName: parts[0], middleName: "", lastName: parts[1] };
    }
    return {
      firstName: parts[0],
      middleName: parts.slice(1, -1).join(" "),
      lastName: parts[parts.length - 1],
    };
  }

  function composeDisplayName(patient) {
    const first = String(patient.firstName || "").trim();
    const middle = String(patient.middleName || "").trim();
    const last = String(patient.lastName || "").trim();
    const composed = [first, middle, last].filter(Boolean).join(" ");
    if (composed) return composed;
    return String(patient.name || "").trim();
  }

  function normalizeLocalPatientId(value) {
    const digits = String(value == null ? "" : value).replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length >= 6) return digits.slice(-6);
    return digits.padStart(6, "0");
  }

  function isValidLocalPatientId(value) {
    return /^\d{6}$/.test(String(value || ""));
  }

  function localIdTaken(localId, store, excludePatientId) {
    const id = normalizeLocalPatientId(localId);
    if (!id) return false;
    return (store.patients || []).some(function (p) {
      if (excludePatientId && p.id === excludePatientId) return false;
      return normalizeLocalPatientId(p.localPatientId) === id;
    });
  }

  function generateUniqueLocalPatientId(store, excludePatientId) {
    const used = {};
    (store.patients || []).forEach(function (p) {
      if (excludePatientId && p.id === excludePatientId) return;
      const id = normalizeLocalPatientId(p.localPatientId);
      if (id) used[id] = true;
    });
    // Prefer crypto when available; fall back to Math.random
    for (let attempt = 0; attempt < 5000; attempt++) {
      let n;
      if (global.crypto && typeof global.crypto.getRandomValues === "function") {
        const buf = new Uint32Array(1);
        global.crypto.getRandomValues(buf);
        n = buf[0] % 1000000;
      } else {
        n = Math.floor(Math.random() * 1000000);
      }
      const candidate = String(n).padStart(6, "0");
      if (!used[candidate]) return candidate;
    }
    throw new Error("Could not allocate a unique 6-digit patient ID.");
  }

  function migratePatientNameFields(store) {
    const copy = Object.assign({}, store);
    copy.patients = (store.patients || []).map(function (p) {
      const next = Object.assign({}, p);
      const hasParts =
        String(next.firstName || "").trim() || String(next.lastName || "").trim();
      if (!hasParts) {
        const split = splitFullName(next.name);
        next.firstName = split.firstName;
        next.middleName = split.middleName;
        next.lastName = split.lastName;
      } else {
        next.firstName = String(next.firstName || "").trim();
        next.middleName = String(next.middleName || "").trim();
        next.lastName = String(next.lastName || "").trim();
      }
      next.name = composeDisplayName(next) || String(next.name || "").trim();
      next.localPatientId = normalizeLocalPatientId(next.localPatientId);
      return next;
    });

    // Ensure every patient has a unique 6-digit local ID after migration
    const seen = {};
    copy.patients.forEach(function (p, index) {
      let id = normalizeLocalPatientId(p.localPatientId);
      if (!isValidLocalPatientId(id) || seen[id]) {
        const others = copy.patients.filter(function (_x, i) {
          return i !== index;
        });
        id = generateUniqueLocalPatientId({ patients: others }, p.id);
      }
      seen[id] = true;
      p.localPatientId = id;
      p.name = composeDisplayName(p) || p.name;
    });

    copy.schemaVersion = SCHEMA_VERSION;
    return copy;
  }

  function migrateLegacyPatientsArray(arr) {
    const store = emptyStore();
    const ts = nowIso();
    arr.forEach(function (row) {
      if (!row || typeof row !== "object") return;
      const patientId = uuid();
      const name = row.name || "Unknown";
      store.patients.push({
        id: patientId,
        localPatientId: row.localPatientId || "",
        firstName: "",
        middleName: "",
        lastName: "",
        name: name,
        dob: row.dob || "",
        age: row.age != null ? String(row.age) : "",
        sex: row.sex || "",
        phone: row.phone || "",
        address: row.address || "",
        occupation: row.occupation || "",
        createdAt: ts,
        updatedAt: ts,
      });
      store.encounters.push(legacyRowToEncounter(row, patientId, ts));
    });
    return store;
  }

  function legacyRowToEncounter(row, patientId, ts) {
    const past =
      row.pastMedicalSurgicalHistory ||
      row.pmsh ||
      row.pmh ||
      "";
    return {
      id: uuid(),
      patientId: patientId,
      clinicianName: row.clinicianName || "",
      unit: row.unit || "",
      status: "draft",
      presentingComplaint: row.pc || row.presentingComplaint || "",
      history: {
        hpc: row.hpc || "",
        odq: row.odq || "",
        pastMedicalSurgicalHistory: past,
        drugHx: row.drugHx || "",
        allergyHx: row.allergyHx || "",
        familyHx: row.familyHx || "",
        socialHx: row.socialHx || "",
        ros: row.ros || "",
        cardioHx: row.cardioHx || "",
        obstetric: {
          gravida: row.gravida || "",
          para: row.para || "",
          ga: row.ga || "",
          edd: row.edd || "",
        },
      },
      examination: {
        generalExam: row.generalExam || "",
        systemicExam: row.systemicExam || "",
      },
      vitals: {
        bp: row.bp || "",
        pulse: row.pulse || "",
        rr: row.rr || "",
        temp: row.temp || "",
      },
      labs: {
        alt: row.alt || "",
        ast: row.ast || "",
        creatinine: row.creatinine || "",
        urea: row.urea || "",
        hb: row.hb || "",
        wbc: row.wbc || "",
        platelets: row.platelets || "",
        urine_protein: row.urine_protein || "",
        urine_glucose: row.urine_glucose || "",
      },
      findings: [],
      questionAnswers: [],
      conditionCandidates: [],
      plan: {
        draftItems: row.plan ? String(row.plan).split("\n").filter(Boolean) : [],
        clinicianEdits: "",
        approvalStatus: "draft",
        approvedBy: "",
        approvedAt: null,
      },
      impression: row.impression || "",
      alerts: [],
      createdAt: ts,
      updatedAt: ts,
    };
  }

  function normalizeName(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function findDuplicatePatients(patient, store) {
    const storeData = store || readRaw();
    const name = normalizeName(composeDisplayName(patient) || patient.name);
    const first = normalizeName(patient.firstName);
    const last = normalizeName(patient.lastName);
    const phone = String(patient.phone || "").trim();
    const localId = normalizeLocalPatientId(patient.localPatientId);
    const dob = String(patient.dob || "").trim();
    const age = String(patient.age || "").trim();

    return storeData.patients.filter(function (p) {
      if (patient.id && p.id === patient.id) return false;
      if (
        localId &&
        isValidLocalPatientId(localId) &&
        normalizeLocalPatientId(p.localPatientId) === localId
      ) {
        return true;
      }
      const pName = normalizeName(composeDisplayName(p) || p.name);
      const pFirst = normalizeName(p.firstName);
      const pLast = normalizeName(p.lastName);
      const sameName =
        (name && pName === name) ||
        (first && last && pFirst === first && pLast === last);
      if (phone && p.phone && p.phone === phone && sameName) return true;
      if (sameName) {
        if (dob && p.dob && p.dob === dob) return true;
        if (age && p.age && String(p.age) === age) return true;
        if (!dob && !age && !phone && !localId) return true;
      }
      return false;
    });
  }

  const patientStore = {
    getAll: function () {
      return readRaw().patients.slice();
    },
    getById: function (id) {
      return readRaw().patients.find(function (p) {
        return p.id === id;
      }) || null;
    },
    search: function (query) {
      const q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) return patientStore.getAll();
      const qDigits = q.replace(/\D/g, "");
      return readRaw().patients.filter(function (p) {
        const display = composeDisplayName(p) || p.name || "";
        const first = String(p.firstName || "").toLowerCase();
        const middle = String(p.middleName || "").toLowerCase();
        const last = String(p.lastName || "").toLowerCase();
        const localId = normalizeLocalPatientId(p.localPatientId);
        return (
          display.toLowerCase().indexOf(q) !== -1 ||
          first.indexOf(q) !== -1 ||
          middle.indexOf(q) !== -1 ||
          last.indexOf(q) !== -1 ||
          (localId && localId.indexOf(qDigits || q) !== -1) ||
          (p.phone && p.phone.toLowerCase().indexOf(q) !== -1) ||
          (p.dob && p.dob.toLowerCase().indexOf(q) !== -1) ||
          (p.age && String(p.age).toLowerCase().indexOf(q) !== -1)
        );
      });
    },
    allocateLocalPatientId: function (excludePatientId) {
      return generateUniqueLocalPatientId(readRaw(), excludePatientId);
    },
    save: function (patient, options) {
      options = options || {};
      const store = readRaw();
      const ts = nowIso();

      const firstName = String(patient.firstName || "").trim();
      const middleName = String(patient.middleName || "").trim();
      let lastName = String(patient.lastName || "").trim();
      let resolvedFirst = firstName;
      let resolvedMiddle = middleName;
      let resolvedLast = lastName;

      if (!resolvedFirst && !resolvedLast && patient.name) {
        const split = splitFullName(patient.name);
        resolvedFirst = split.firstName;
        resolvedMiddle = split.middleName;
        resolvedLast = split.lastName;
      }

      let displayName = composeDisplayName({
        firstName: resolvedFirst,
        middleName: resolvedMiddle,
        lastName: resolvedLast,
        name: patient.name,
      });
      if (!displayName) {
        displayName = String(patient.name || "").trim();
      }

      let localPatientId = normalizeLocalPatientId(patient.localPatientId);
      if (!isValidLocalPatientId(localPatientId) || localIdTaken(localPatientId, store, patient.id)) {
        if (patient.id && isValidLocalPatientId(localPatientId) && localIdTaken(localPatientId, store, patient.id)) {
          return {
            ok: false,
            reason: "duplicate_local_id",
            message: "Local patient ID " + localPatientId + " is already in use.",
          };
        }
        // New patients (or missing/invalid IDs): allocate a unique 6-digit ID
        localPatientId = generateUniqueLocalPatientId(store, patient.id);
      }

      const normalizedPatient = Object.assign({}, patient, {
        firstName: resolvedFirst,
        middleName: resolvedMiddle,
        lastName: resolvedLast,
        name: displayName,
        localPatientId: localPatientId,
      });

      const duplicates = findDuplicatePatients(normalizedPatient, store);
      if (duplicates.length && !options.force && !patient.id) {
        return { ok: false, reason: "duplicate", duplicates: duplicates };
      }

      if (patient.id) {
        const idx = store.patients.findIndex(function (p) {
          return p.id === patient.id;
        });
        if (idx === -1) {
          return { ok: false, reason: "not_found" };
        }
        const updated = Object.assign({}, store.patients[idx], normalizedPatient, {
          id: patient.id,
          updatedAt: ts,
        });
        store.patients[idx] = updated;
        writeRaw(store);
        return { ok: true, patient: updated, created: false };
      }

      const usedStructuredNames = !!(
        String(patient.firstName || "").trim() ||
        String(patient.lastName || "").trim()
      );
      if (usedStructuredNames && (!resolvedFirst || !resolvedLast)) {
        return {
          ok: false,
          reason: "validation",
          message: "First name and last name are required.",
        };
      }
      if (!resolvedFirst) {
        return {
          ok: false,
          reason: "validation",
          message: "Patient name is required.",
        };
      }

      const created = {
        id: uuid(),
        localPatientId: localPatientId,
        firstName: resolvedFirst,
        middleName: resolvedMiddle,
        lastName: resolvedLast,
        name: displayName,
        dob: patient.dob || "",
        age: patient.age != null ? String(patient.age) : "",
        sex: patient.sex || "",
        phone: patient.phone || "",
        address: patient.address || "",
        occupation: patient.occupation || "",
        createdAt: ts,
        updatedAt: ts,
      };
      store.patients.push(created);
      writeRaw(store);
      return { ok: true, patient: created, created: true };
    },
    update: function (id, patch) {
      return patientStore.save(Object.assign({}, patch, { id: id }));
    },
  };

  const encounterStore = {
    getAll: function () {
      return readRaw().encounters.slice();
    },
    getById: function (id) {
      return readRaw().encounters.find(function (e) {
        return e.id === id;
      }) || null;
    },
    getByPatientId: function (patientId) {
      return readRaw().encounters
        .filter(function (e) {
          return e.patientId === patientId;
        })
        .sort(function (a, b) {
          return String(b.updatedAt).localeCompare(String(a.updatedAt));
        });
    },
    save: function (encounter) {
      const store = readRaw();
      const ts = nowIso();
      if (encounter.id) {
        const idx = store.encounters.findIndex(function (e) {
          return e.id === encounter.id;
        });
        if (idx === -1) return { ok: false, reason: "not_found" };
        const updated = Object.assign({}, store.encounters[idx], encounter, {
          updatedAt: ts,
        });
        store.encounters[idx] = updated;
        writeRaw(store);
        return { ok: true, encounter: updated, created: false };
      }
      const created = Object.assign({}, createEmptyEncounter(encounter.patientId), encounter, {
        id: uuid(),
        createdAt: ts,
        updatedAt: ts,
      });
      store.encounters.push(created);
      writeRaw(store);
      return { ok: true, encounter: created, created: true };
    },
    update: function (id, patch) {
      return encounterStore.save(Object.assign({}, patch, { id: id }));
    },
  };

  function createEmptyEncounter(patientId) {
    return {
      id: null,
      patientId: patientId || null,
      clinicianName: "",
      unit: "",
      status: "draft",
      presentingComplaint: "",
      history: {
        hpc: "",
        odq: "",
        pastMedicalSurgicalHistory: "",
        drugHx: "",
        allergyHx: "",
        familyHx: "",
        socialHx: "",
        ros: "",
        cardioHx: "",
        obstetric: { gravida: "", para: "", ga: "", edd: "" },
      },
      examination: { generalExam: "", systemicExam: "" },
      vitals: { bp: "", pulse: "", rr: "", temp: "" },
      labs: {
        alt: "",
        ast: "",
        creatinine: "",
        urea: "",
        hb: "",
        wbc: "",
        platelets: "",
        urine_protein: "",
        urine_glucose: "",
      },
      findings: [],
      questionAnswers: [],
      conditionCandidates: [],
      plan: {
        draftItems: [],
        clinicianEdits: "",
        approvalStatus: "draft",
        approvedBy: "",
        approvedAt: null,
      },
      impression: "",
      alerts: [],
      createdAt: null,
      updatedAt: null,
    };
  }

  function exportAll() {
    const store = readRaw();
    return {
      application: APPLICATION_NAME,
      applicationVersion: APPLICATION_VERSION,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: nowIso(),
      patients: store.patients,
      encounters: store.encounters,
      knowledgeVersion: store.knowledgeVersion || null,
    };
  }

  function validateBackup(data) {
    const report = {
      valid: true,
      errors: [],
      warnings: [],
      converted: null,
      patients: 0,
      encounters: 0,
    };
    if (!data || typeof data !== "object") {
      report.valid = false;
      report.errors.push("Backup is not a JSON object.");
      return report;
    }
    if (data.application && data.application !== APPLICATION_NAME) {
      report.warnings.push(
        "Unexpected application field: " + data.application + " (expected " + APPLICATION_NAME + ")."
      );
    }
    if (data.schemaVersion == null) {
      report.errors.push("Missing schemaVersion.");
      report.valid = false;
    } else if (Number(data.schemaVersion) > SCHEMA_VERSION) {
      report.errors.push(
        "Unsupported newer schemaVersion: " +
          data.schemaVersion +
          " (this app supports up to " +
          SCHEMA_VERSION +
          ")."
      );
      report.valid = false;
    } else if (Number(data.schemaVersion) < SCHEMA_VERSION) {
      report.converted =
        "schema v" + data.schemaVersion + " → v" + SCHEMA_VERSION;
      report.warnings.push(
        "Older schemaVersion " +
          data.schemaVersion +
          " will be migrated to " +
          SCHEMA_VERSION +
          "."
      );
    }
    if (!Array.isArray(data.patients)) {
      report.errors.push("patients must be an array.");
      report.valid = false;
    } else {
      report.patients = data.patients.length;
      data.patients.forEach(function (p, i) {
        if (!p || !p.id || !(p.name || (p.firstName && p.lastName))) {
          report.errors.push("Patient at index " + i + " missing id or name.");
          report.valid = false;
        }
      });
    }
    if (!Array.isArray(data.encounters)) {
      report.errors.push("encounters must be an array.");
      report.valid = false;
    } else {
      report.encounters = data.encounters.length;
      const patientIds = {};
      (data.patients || []).forEach(function (p) {
        if (p && p.id) patientIds[p.id] = true;
      });
      data.encounters.forEach(function (e, i) {
        if (!e || !e.id || !e.patientId) {
          report.errors.push("Encounter at index " + i + " missing id or patientId.");
          report.valid = false;
        } else if (!patientIds[e.patientId]) {
          report.errors.push(
            "Encounter " + e.id + " references missing patient " + e.patientId
          );
          report.valid = false;
        }
      });
    }
    return report;
  }

  function importAll(data, mode) {
    mode = mode || "merge"; // merge | replace
    const validation = validateBackup(data);
    if (!validation.valid) {
      return {
        ok: false,
        validation: validation,
        added: 0,
        updated: 0,
        skipped: 0,
        invalid: validation.errors.length,
        duplicates: 0,
      };
    }

    const incoming = migrate(data);
    const report = {
      ok: true,
      validation: validation,
      added: 0,
      updated: 0,
      skipped: 0,
      invalid: 0,
      duplicates: 0,
    };

    if (mode === "replace") {
      writeRaw({
        application: APPLICATION_NAME,
        applicationVersion: APPLICATION_VERSION,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: incoming.exportedAt || nowIso(),
        patients: incoming.patients,
        encounters: incoming.encounters,
        knowledgeVersion: incoming.knowledgeVersion || null,
      });
      report.added = incoming.patients.length + incoming.encounters.length;
      return report;
    }

    const store = readRaw();
    const patientIndex = {};
    store.patients.forEach(function (p, i) {
      patientIndex[p.id] = i;
    });
    incoming.patients.forEach(function (p) {
      if (!p || !p.id) {
        report.invalid++;
        return;
      }
      if (patientIndex[p.id] != null) {
        const existing = store.patients[patientIndex[p.id]];
        if (String(p.updatedAt || "") > String(existing.updatedAt || "")) {
          store.patients[patientIndex[p.id]] = p;
          report.updated++;
        } else {
          report.skipped++;
          report.duplicates++;
        }
      } else {
        store.patients.push(p);
        patientIndex[p.id] = store.patients.length - 1;
        report.added++;
      }
    });

    const encounterIndex = {};
    store.encounters.forEach(function (e, i) {
      encounterIndex[e.id] = i;
    });
    incoming.encounters.forEach(function (e) {
      if (!e || !e.id || !e.patientId) {
        report.invalid++;
        return;
      }
      if (patientIndex[e.patientId] == null) {
        report.invalid++;
        return;
      }
      if (encounterIndex[e.id] != null) {
        const existing = store.encounters[encounterIndex[e.id]];
        if (String(e.updatedAt || "") > String(existing.updatedAt || "")) {
          store.encounters[encounterIndex[e.id]] = e;
          report.updated++;
        } else {
          report.skipped++;
          report.duplicates++;
        }
      } else {
        store.encounters.push(e);
        encounterIndex[e.id] = store.encounters.length - 1;
        report.added++;
      }
    });

    writeRaw(store);
    return report;
  }

  function resetAll() {
    writeRaw(emptyStore());
  }

  function getMeta() {
    const store = readRaw();
    return {
      schemaVersion: store.schemaVersion,
      patientCount: store.patients.length,
      encounterCount: store.encounters.length,
      storageKey: STORAGE_KEY,
    };
  }

  // One-time migration from legacy key "patients"
  function migrateFromLegacyKeyIfNeeded() {
    try {
      const legacy = global.localStorage.getItem("patients");
      if (!legacy) return { migrated: false };
      const existing = global.localStorage.getItem(STORAGE_KEY);
      if (existing) return { migrated: false, reason: "v1_exists" };
      const arr = JSON.parse(legacy);
      if (!Array.isArray(arr)) return { migrated: false, reason: "not_array" };
      const migrated = migratePatientNameFields(migrateLegacyPatientsArray(arr));
      writeRaw(migrated);
      return {
        migrated: true,
        patients: migrated.patients.length,
        encounters: migrated.encounters.length,
      };
    } catch (err) {
      console.error("Legacy migration failed", err);
      return { migrated: false, error: String(err) };
    }
  }

  const api = {
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    APPLICATION_NAME: APPLICATION_NAME,
    APPLICATION_VERSION: APPLICATION_VERSION,
    uuid: uuid,
    nowIso: nowIso,
    migrate: migrate,
    migrateFromLegacyKeyIfNeeded: migrateFromLegacyKeyIfNeeded,
    patientStore: patientStore,
    encounterStore: encounterStore,
    createEmptyEncounter: createEmptyEncounter,
    findDuplicatePatients: findDuplicatePatients,
    composeDisplayName: composeDisplayName,
    splitFullName: splitFullName,
    normalizeLocalPatientId: normalizeLocalPatientId,
    generateUniqueLocalPatientId: function (excludePatientId) {
      return generateUniqueLocalPatientId(readRaw(), excludePatientId);
    },
    exportAll: exportAll,
    importAll: importAll,
    validateBackup: validateBackup,
    resetAll: resetAll,
    getMeta: getMeta,
    // Test helpers
    _readRaw: readRaw,
    _writeRaw: writeRaw,
    _emptyStore: emptyStore,
  };

  global.SmartClerkingStore = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : global);
