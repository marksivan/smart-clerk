/**
 * Node-based tests for SmartClerkingStore (no browser required).
 * Run: node tests/storage.test.js
 */
const assert = require("assert");
const path = require("path");

// Minimal localStorage polyfill
function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      map.set(String(k), String(v));
    },
    removeItem(k) {
      map.delete(k);
    },
    clear() {
      map.clear();
    },
  };
}

global.localStorage = createMemoryStorage();
global.window = global;
global.crypto = {
  randomUUID() {
    return "00000000-0000-4000-8000-" + String(Math.random()).slice(2, 14).padEnd(12, "0");
  },
};

const Store = require(path.join(__dirname, "..", "js", "localStore.js"));
const Knowledge = require(path.join(__dirname, "..", "js", "knowledge.js"));

let passed = 0;
function test(name, fn) {
  try {
    global.localStorage.clear();
    // reset store by writing empty
    Store._writeRaw(Store._emptyStore());
    fn();
    passed++;
    console.log("✓ " + name);
  } catch (err) {
    console.error("✗ " + name);
    console.error(err);
    process.exitCode = 1;
  }
}

test("empty store has schemaVersion 2", () => {
  const meta = Store.getMeta();
  assert.strictEqual(meta.schemaVersion, 2);
  assert.strictEqual(meta.patientCount, 0);
});

test("create patient with UUID and timestamps", () => {
  const r = Store.patientStore.save({ name: "Ama Mensah", age: "34", sex: "female" });
  assert.ok(r.ok);
  assert.ok(r.patient.id);
  assert.ok(r.patient.createdAt);
  assert.ok(r.patient.updatedAt);
  assert.strictEqual(r.patient.firstName, "Ama");
  assert.strictEqual(r.patient.lastName, "Mensah");
  assert.ok(/^\d{6}$/.test(r.patient.localPatientId));
  assert.strictEqual(Store.patientStore.getAll().length, 1);
});

test("create patient with first/middle/last name fields", () => {
  const r = Store.patientStore.save({
    firstName: "Kwame",
    middleName: "Nkrumah",
    lastName: "Asante",
    age: "50",
  });
  assert.ok(r.ok);
  assert.strictEqual(r.patient.firstName, "Kwame");
  assert.strictEqual(r.patient.middleName, "Nkrumah");
  assert.strictEqual(r.patient.lastName, "Asante");
  assert.strictEqual(r.patient.name, "Kwame Nkrumah Asante");
  assert.ok(/^\d{6}$/.test(r.patient.localPatientId));
});

test("local patient IDs are unique 6-digit values", () => {
  const a = Store.patientStore.save({ firstName: "A", lastName: "One" }).patient;
  const b = Store.patientStore.save({ firstName: "B", lastName: "Two" }).patient;
  assert.ok(/^\d{6}$/.test(a.localPatientId));
  assert.ok(/^\d{6}$/.test(b.localPatientId));
  assert.notStrictEqual(a.localPatientId, b.localPatientId);
  // Explicit collision attempt
  const clash = Store.patientStore.save({
    firstName: "C",
    lastName: "Three",
    localPatientId: a.localPatientId,
  });
  assert.ok(clash.ok);
  assert.notStrictEqual(clash.patient.localPatientId, a.localPatientId);
});

test("search by first name, last name, or local ID", () => {
  const p = Store.patientStore.save({
    firstName: "Ama",
    lastName: "Mensah",
    phone: "0244111222",
  }).patient;
  assert.strictEqual(Store.patientStore.search("ama").length, 1);
  assert.strictEqual(Store.patientStore.search("mensah").length, 1);
  assert.strictEqual(Store.patientStore.search(p.localPatientId).length, 1);
  assert.strictEqual(Store.patientStore.search("zzz").length, 0);
});

test("update patient by id does not duplicate", () => {
  const r = Store.patientStore.save({ name: "Ama Mensah", age: "34" });
  const u = Store.patientStore.update(r.patient.id, {
    age: "35",
    firstName: "Ama",
    lastName: "Mensah",
  });
  assert.ok(u.ok);
  assert.strictEqual(Store.patientStore.getAll().length, 1);
  assert.strictEqual(Store.patientStore.getById(r.patient.id).age, "35");
});

test("duplicate patient warning", () => {
  Store.patientStore.save({ name: "Kofi Asante", age: "40" });
  const dup = Store.patientStore.save({ name: "Kofi Asante", age: "40" });
  assert.strictEqual(dup.ok, false);
  assert.strictEqual(dup.reason, "duplicate");
  const forced = Store.patientStore.save({ name: "Kofi Asante", age: "40" }, { force: true });
  assert.ok(forced.ok);
  assert.strictEqual(Store.patientStore.getAll().length, 2);
});

test("schema v1 patients migrate to first/last name and 6-digit IDs", () => {
  // Bypass writeRaw schema stamping so we can simulate a stored v1 payload
  global.localStorage.setItem(
    Store.STORAGE_KEY,
    JSON.stringify({
      application: "Smart Clerking Assistant",
      applicationVersion: "0.2.0",
      schemaVersion: 1,
      patients: [
        {
          id: "p1",
          name: "Ama Mensah",
          localPatientId: "SC-1",
          age: "34",
          sex: "female",
          phone: "",
          address: "",
          occupation: "",
          dob: "",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      encounters: [],
    })
  );
  const meta = Store.getMeta();
  assert.strictEqual(meta.schemaVersion, 2);
  const p = Store.patientStore.getById("p1");
  assert.ok(p);
  assert.strictEqual(p.firstName, "Ama");
  assert.strictEqual(p.lastName, "Mensah");
  assert.ok(/^\d{6}$/.test(p.localPatientId));
});

test("encounters link to patient and do not create new patients", () => {
  const p = Store.patientStore.save({ name: "Ama Mensah", age: "34" }).patient;
  const e1 = Store.encounterStore.save({
    patientId: p.id,
    presentingComplaint: "cough and fever",
  });
  const e2 = Store.encounterStore.save({
    patientId: p.id,
    presentingComplaint: "follow-up",
  });
  assert.ok(e1.ok && e2.ok);
  assert.strictEqual(Store.patientStore.getAll().length, 1);
  assert.strictEqual(Store.encounterStore.getByPatientId(p.id).length, 2);
});

test("export and import merge report", () => {
  const p = Store.patientStore.save({ name: "Demo Patient", age: "20" }).patient;
  Store.encounterStore.save({ patientId: p.id, presentingComplaint: "fever" });
  const backup = Store.exportAll();
  assert.strictEqual(backup.schemaVersion, 2);
  assert.strictEqual(backup.application, "Smart Clerking Assistant");
  assert.ok(backup.applicationVersion);
  assert.ok(backup.exportedAt);

  Store.resetAll();
  assert.strictEqual(Store.getMeta().patientCount, 0);

  const report = Store.importAll(backup, "merge");
  assert.ok(report.ok);
  assert.ok(report.added >= 2);
  assert.strictEqual(Store.getMeta().patientCount, 1);
});

test("import rejects unsupported newer schema with clear error", () => {
  const report = Store.importAll(
    {
      application: "Smart Clerking Assistant",
      schemaVersion: 99,
      patients: [],
      encounters: [],
    },
    "merge"
  );
  assert.strictEqual(report.ok, false);
  assert.ok(
    report.validation.errors.some(function (e) {
      return /Unsupported newer schemaVersion/.test(e);
    })
  );
});

test("import replace mode", () => {
  Store.patientStore.save({ name: "Old", age: "1" });
  const other = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    patients: [
      {
        id: "p1",
        name: "New",
        age: "2",
        localPatientId: "",
        dob: "",
        sex: "",
        phone: "",
        address: "",
        occupation: "",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      },
    ],
    encounters: [],
  };
  const report = Store.importAll(other, "replace");
  assert.ok(report.ok);
  assert.strictEqual(Store.patientStore.getAll()[0].name, "New");
});

test("invalid import rejected", () => {
  const report = Store.importAll({ schemaVersion: 1, patients: "nope" }, "merge");
  assert.strictEqual(report.ok, false);
  assert.ok(report.validation.errors.length);
});

test("broken patient-encounter link rejected", () => {
  const report = Store.importAll(
    {
      schemaVersion: 1,
      patients: [],
      encounters: [
        {
          id: "e1",
          patientId: "missing",
          presentingComplaint: "x",
        },
      ],
    },
    "merge"
  );
  assert.strictEqual(report.ok, false);
});

test("legacy patients array migration", () => {
  const migrated = Store.migrate([
    { name: "Legacy", age: "50", pc: "cough", pmh: "asthma", unit: "medicine" },
  ]);
  assert.strictEqual(migrated.patients.length, 1);
  assert.strictEqual(migrated.encounters.length, 1);
  assert.strictEqual(
    migrated.encounters[0].history.pastMedicalSurgicalHistory,
    "asthma"
  );
  assert.notStrictEqual(migrated.patients[0].id, "Legacy");
});

test("legacy key migration helper", () => {
  global.localStorage.clear();
  global.localStorage.setItem(
    "patients",
    JSON.stringify([{ name: "FromLegacy", age: "22", pmsh: "HTN" }])
  );
  const result = Store.migrateFromLegacyKeyIfNeeded();
  assert.ok(result.migrated);
  assert.strictEqual(Store.patientStore.getAll()[0].name, "FromLegacy");
  assert.strictEqual(
    Store.encounterStore.getAll()[0].history.pastMedicalSurgicalHistory,
    "HTN"
  );
});

test("reset clears data", () => {
  Store.patientStore.save({ name: "X", age: "1" });
  Store.resetAll();
  assert.strictEqual(Store.getMeta().patientCount, 0);
  assert.strictEqual(Store.getMeta().encounterCount, 0);
});

test("patient search by name and phone", () => {
  Store.patientStore.save({ name: "Ama Mensah", phone: "0244111222", age: "30" });
  Store.patientStore.save({ name: "Kofi Boateng", phone: "0200000000", age: "40" });
  assert.strictEqual(Store.patientStore.search("ama").length, 1);
  assert.strictEqual(Store.patientStore.search("0244").length, 1);
  assert.strictEqual(Store.patientStore.search("zzz").length, 0);
});

test("knowledge: symptom suggest and differential", () => {
  const suggestions = Knowledge.suggestSymptoms("short of br");
  assert.ok(suggestions.some((s) => s.id === "sob"));

  const qs = Knowledge.generateQuestions(["cough", "fever"], { sex: "female" });
  assert.ok(qs.length > 0);

  // Multi-symptom packs should return more than a single diarrhea red-flag
  const multi = Knowledge.generateQuestions(
    ["headache", "diarrhea", "hemoptysis"],
    { sex: "female" }
  );
  assert.ok(
    multi.length >= 8,
    "expected rich question set for headache+diarrhea+hemoptysis, got " + multi.length
  );
  assert.ok(multi.some((q) => /headache/i.test(q.questionText)));
  assert.ok(
    multi.some((q) => /blood|hemoptysis|coughed|sputum/i.test(q.questionText))
  );
  assert.ok(multi.some((q) => /diarrhea|stool/i.test(q.questionText)));

  // Free-text alias "sleeping" should resolve to insomnia questions
  assert.ok(typeof Knowledge.resolveSymptomId === "function");
  assert.strictEqual(Knowledge.resolveSymptomId("sleeping"), "insomnia");
  const sleepQs = Knowledge.generateQuestions(["sleeping"], {});
  assert.ok(sleepQs.length >= 2, "sleeping should map to insomnia questions");

  const ranked = Knowledge.analyzeDifferentials({
    findings: [
      { symptomId: "cough", status: "confirmed" },
      { symptomId: "fever", status: "confirmed" },
      { symptomId: "sob", status: "confirmed" },
      { symptomId: "chest_pain", status: "confirmed" },
    ],
  });
  assert.ok(ranked.length);
  assert.ok(ranked[0].label);
  assert.ok(ranked[0].supportingFindings.length);

  const flags = Knowledge.evaluateRedFlags({
    vitals: { rr: "32", pulse: "80", bp: "120/80", temp: "37" },
    findings: [],
    history: { allergyHx: "" },
  });
  assert.ok(flags.some((f) => f.id === "rf_rr_high"));
});

test("newer schemaVersion rejected", () => {
  assert.throws(() => {
    Store.migrate({ schemaVersion: 99, patients: [], encounters: [] });
  });
});

console.log("\n" + passed + " tests passed");
