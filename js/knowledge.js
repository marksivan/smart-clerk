/**
 * Clinician-reviewed sample knowledge for MVP demonstration.
 * Not exhaustive. All outputs remain decision support.
 */
(function (global) {
  "use strict";

  const knowledge = {
    version: "demo-1.1.0",
    disclaimer:
      "Decision support — clinician verification required. Sample content for demonstration only.",

    symptoms: [
      { id: "cough", label: "Cough", aliases: ["coughing"] },
      { id: "fever", label: "Fever", aliases: ["pyrexia", "high temperature"] },
      { id: "sob", label: "Shortness of breath", aliases: ["dyspnea", "short of breath", "breathlessness"] },
      { id: "chest_pain", label: "Chest pain", aliases: ["pleuritic pain", "chest discomfort"] },
      { id: "sputum", label: "Sputum production", aliases: ["phlegm", "productive cough"] },
      { id: "hemoptysis", label: "Hemoptysis", aliases: ["coughing blood", "blood in sputum", "blood when coughing"] },
      { id: "chills", label: "Chills", aliases: ["rigors"] },
      { id: "wheeze", label: "Wheeze", aliases: ["wheezing"] },
      { id: "abdominal_pain", label: "Abdominal pain", aliases: ["belly pain", "stomach pain"] },
      { id: "vomiting", label: "Vomiting", aliases: ["emesis"] },
      { id: "dysuria", label: "Dysuria", aliases: ["painful urination", "burning urine"] },
      { id: "headache", label: "Headache", aliases: ["head pain", "migraine"] },
      { id: "diarrhea", label: "Diarrhea", aliases: ["loose stools", "diarrhoea", "watery stool"] },
      { id: "confusion", label: "Confusion", aliases: ["altered mental status"] },
      { id: "weight_loss", label: "Weight loss", aliases: [] },
      { id: "insomnia", label: "Insomnia / sleep difficulty", aliases: ["sleeping", "can't sleep", "cannot sleep", "poor sleep", "sleeplessness", "difficulty sleeping", "trouble sleeping"] },
      { id: "fatigue", label: "Fatigue", aliases: ["tiredness", "weakness", "malaise"] },
      { id: "nausea", label: "Nausea", aliases: ["feeling sick", "queasy"] },
      { id: "dizziness", label: "Dizziness", aliases: ["lightheaded", "vertigo"] },
      { id: "neck_stiffness", label: "Neck stiffness", aliases: ["stiff neck", "nuchal rigidity"] },
      { id: "photophobia", label: "Photophobia", aliases: ["light sensitivity", "sensitive to light"] },
      { id: "night_sweats", label: "Night sweats", aliases: ["sweating at night"] },
    ],

    questions: [
      {
        id: "q_cough_onset",
        symptomIds: ["cough"],
        text: "When did the cough begin?",
        category: "onset",
      },
      {
        id: "q_cough_type",
        symptomIds: ["cough"],
        text: "Is the cough dry or productive?",
        category: "character",
      },
      {
        id: "q_sputum_color",
        symptomIds: ["cough", "sputum"],
        text: "What is the sputum color? Any blood?",
        category: "character",
      },
      {
        id: "q_sob",
        symptomIds: ["cough", "fever", "chest_pain", "sob", "hemoptysis"],
        text: "Is there shortness of breath at rest or on exertion?",
        category: "associated",
      },
      {
        id: "q_pleuritic",
        symptomIds: ["cough", "chest_pain"],
        text: "Is there pleuritic (sharp, worse on inspiration) chest pain?",
        category: "associated",
      },
      {
        id: "q_chills",
        symptomIds: ["fever", "cough", "headache"],
        text: "Are there chills or rigors?",
        category: "associated",
      },
      {
        id: "q_tb_contact",
        symptomIds: ["cough", "fever", "weight_loss", "hemoptysis", "night_sweats"],
        text: "Any recent contact with someone who has tuberculosis, or known TB exposure?",
        category: "risk",
      },
      {
        id: "q_smoking",
        symptomIds: ["cough", "sob", "wheeze", "hemoptysis"],
        text: "Does the patient smoke or have a smoking history?",
        category: "risk",
      },
      {
        id: "q_recent_abx",
        symptomIds: ["cough", "fever", "diarrhea"],
        text: "Any recent antibiotic use or hospitalization?",
        category: "risk",
      },
      {
        id: "q_pregnancy",
        symptomIds: ["fever", "cough", "abdominal_pain", "vomiting", "diarrhea", "headache", "nausea"],
        text: "If applicable: is the patient pregnant?",
        category: "risk",
        sex: "female",
      },
      {
        id: "q_confusion",
        symptomIds: ["fever", "cough", "sob", "headache", "confusion"],
        text: "Any confusion or altered consciousness?",
        category: "red_flag",
      },
      {
        id: "q_dysuria_onset",
        symptomIds: ["dysuria", "abdominal_pain"],
        text: "When did painful urination begin? Any frequency, urgency, or flank pain?",
        category: "onset",
      },
      {
        id: "q_vomit_blood",
        symptomIds: ["vomiting", "abdominal_pain"],
        text: "Any blood in vomit, black stools, or severe abdominal rigidity?",
        category: "red_flag",
      },
      {
        id: "q_diarrhea_blood",
        symptomIds: ["diarrhea"],
        text: "Any blood in stool, severe dehydration, or inability to keep fluids down?",
        category: "red_flag",
      },
      {
        id: "q_diarrhea_onset",
        symptomIds: ["diarrhea"],
        text: "When did the diarrhea begin? How many stools per day?",
        category: "onset",
      },
      {
        id: "q_diarrhea_character",
        symptomIds: ["diarrhea"],
        text: "Are the stools watery, mucoid, or bloody? Any foul smell?",
        category: "character",
      },
      {
        id: "q_diarrhea_associated",
        symptomIds: ["diarrhea"],
        text: "Any associated fever, abdominal pain, vomiting, or travel history?",
        category: "associated",
      },
      {
        id: "q_diarrhea_intake",
        symptomIds: ["diarrhea", "vomiting"],
        text: "Is the patient able to take oral fluids? Any reduced urine output?",
        category: "severity",
      },
      {
        id: "q_headache_onset",
        symptomIds: ["headache"],
        text: "When did the headache begin? Sudden or gradual onset?",
        category: "onset",
      },
      {
        id: "q_headache_character",
        symptomIds: ["headache"],
        text: "Where is the headache located? Is it throbbing, pressure-like, or sharp?",
        category: "character",
      },
      {
        id: "q_headache_severity",
        symptomIds: ["headache"],
        text: "How severe is the headache (mild / moderate / severe)? Any worst-ever headache?",
        category: "severity",
      },
      {
        id: "q_headache_associated",
        symptomIds: ["headache"],
        text: "Any nausea, vomiting, visual changes, or photophobia with the headache?",
        category: "associated",
      },
      {
        id: "q_headache_neck",
        symptomIds: ["headache", "neck_stiffness", "fever"],
        text: "Any neck stiffness, fever, or rash?",
        category: "red_flag",
      },
      {
        id: "q_headache_neuro",
        symptomIds: ["headache"],
        text: "Any weakness, numbness, speech difficulty, seizure, or loss of consciousness?",
        category: "red_flag",
      },
      {
        id: "q_hemoptysis_amount",
        symptomIds: ["hemoptysis"],
        text: "How much blood was coughed up (streaks, teaspoon, or larger volume)?",
        category: "severity",
      },
      {
        id: "q_hemoptysis_onset",
        symptomIds: ["hemoptysis"],
        text: "When did coughing blood begin? First episode or recurrent?",
        category: "onset",
      },
      {
        id: "q_hemoptysis_associated",
        symptomIds: ["hemoptysis"],
        text: "Any fever, night sweats, weight loss, chest pain, or shortness of breath with the hemoptysis?",
        category: "associated",
      },
      {
        id: "q_hemoptysis_source",
        symptomIds: ["hemoptysis"],
        text: "Is the blood definitely from the chest/airway, or could it be from the nose, mouth, or stomach?",
        category: "character",
      },
      {
        id: "q_hemoptysis_risk",
        symptomIds: ["hemoptysis"],
        text: "Any known lung disease, anticoagulation, recent procedure, or TB exposure?",
        category: "risk",
      },
      {
        id: "q_hemoptysis_redflag",
        symptomIds: ["hemoptysis"],
        text: "Any large-volume bleeding, dizziness, or difficulty breathing right now?",
        category: "red_flag",
      },
      {
        id: "q_sleep_onset",
        symptomIds: ["insomnia"],
        text: "What sleep problem is present — difficulty falling asleep, staying asleep, or early waking?",
        category: "onset",
      },
      {
        id: "q_sleep_duration",
        symptomIds: ["insomnia"],
        text: "How long has the sleep difficulty lasted? How many hours of sleep per night?",
        category: "character",
      },
      {
        id: "q_sleep_associated",
        symptomIds: ["insomnia", "fatigue"],
        text: "Any snoring, witnessed apneas, daytime sleepiness, mood change, or stimulant/caffeine use?",
        category: "associated",
      },
      {
        id: "q_sleep_pain",
        symptomIds: ["insomnia", "headache", "chest_pain", "abdominal_pain"],
        text: "Is pain, breathlessness, nocturia, or other symptoms waking the patient at night?",
        category: "associated",
      },
      {
        id: "q_fatigue_onset",
        symptomIds: ["fatigue"],
        text: "When did the fatigue begin? Is it progressive?",
        category: "onset",
      },
      {
        id: "q_nausea_onset",
        symptomIds: ["nausea", "vomiting"],
        text: "When did nausea begin? Any relation to meals?",
        category: "onset",
      },
      {
        id: "q_dizziness_onset",
        symptomIds: ["dizziness"],
        text: "Is the dizziness spinning (vertigo) or lightheaded? Any syncope?",
        category: "character",
      },
    ],

    diseases: [
      {
        id: "pneumonia",
        label: "Pneumonia",
        support: ["cough", "fever", "sob", "chest_pain", "sputum", "chills"],
        contradict: ["hemoptysis"],
        planTemplate: [
          "Consider chest examination priorities (air entry, crackles, dullness)",
          "Consider investigations per local protocol (e.g. CXR, FBC, SpO2)",
          "Assess severity using facility-approved criteria",
          "Supportive care and monitoring as indicated",
          "Escalate if red flags present — follow facility emergency procedures",
        ],
      },
      {
        id: "viral_uri",
        label: "Viral respiratory infection",
        support: ["cough", "fever", "chills"],
        contradict: ["hemoptysis", "confusion"],
        planTemplate: [
          "Supportive care and hydration",
          "Review red flags and return precautions",
          "Investigations only if indicated by severity or risk",
          "Follow-up as clinically appropriate",
        ],
      },
      {
        id: "bronchitis",
        label: "Acute bronchitis",
        support: ["cough", "sputum", "wheeze"],
        contradict: ["confusion"],
        planTemplate: [
          "Supportive care",
          "Review need for further investigation based on severity",
          "Smoking cessation advice if relevant",
          "Follow-up if symptoms worsen or persist",
        ],
      },
      {
        id: "tb",
        label: "Tuberculosis (consider)",
        support: ["cough", "fever", "weight_loss", "hemoptysis"],
        contradict: [],
        planTemplate: [
          "Follow local TB screening and notification protocols",
          "Consider sputum testing per facility guidelines",
          "Assess contacts as per public health guidance",
          "Do not start TB therapy without clinician approval and protocol",
        ],
      },
      {
        id: "asthma_infect",
        label: "Asthma-related infection / exacerbation",
        support: ["cough", "wheeze", "sob"],
        contradict: [],
        planTemplate: [
          "Assess airway and breathing urgency",
          "Review usual asthma medications",
          "Investigations and treatment per local asthma protocol",
          "Escalate if severe respiratory distress",
        ],
      },
      {
        id: "uti",
        label: "Urinary tract infection",
        support: ["dysuria", "fever", "abdominal_pain"],
        contradict: [],
        planTemplate: [
          "Consider urine testing per local protocol",
          "Assess for upper tract / pyelonephritis features",
          "Hydration and symptomatic care as appropriate",
          "Antimicrobials only after clinician approval per guidelines",
        ],
      },
      {
        id: "gastro",
        label: "Gastroenteritis / GI cause",
        support: ["abdominal_pain", "vomiting", "diarrhea"],
        contradict: [],
        planTemplate: [
          "Assess hydration and red flags",
          "Oral or IV fluids as clinically indicated",
          "Investigations if severe, prolonged, or bloody stools",
          "Reassess differentials if urinary or other symptoms present",
        ],
      },
      {
        id: "malaria_resp",
        label: "Malaria with respiratory symptoms (consider)",
        support: ["fever", "chills", "sob", "headache"],
        contradict: [],
        planTemplate: [
          "Consider malaria testing where endemic / per local protocol",
          "Assess severity and need for urgent care",
          "Do not delay emergency care for unstable patients",
          "Treatment only after clinician confirmation and approved protocol",
        ],
      },
    ],

    redFlags: [
      {
        id: "rf_rr_high",
        label: "Elevated respiratory rate",
        test: function (ctx) {
          const rr = parseFloat(ctx.vitals && ctx.vitals.rr);
          return rr && rr >= 30;
        },
      },
      {
        id: "rf_pulse_high",
        label: "Tachycardia",
        test: function (ctx) {
          const p = parseFloat(ctx.vitals && ctx.vitals.pulse);
          return p && p > 120;
        },
      },
      {
        id: "rf_bp_high",
        label: "Severe hypertension (systolic)",
        test: function (ctx) {
          const bp = (ctx.vitals && ctx.vitals.bp) || "";
          const sys = parseInt(String(bp).split("/")[0], 10);
          return sys && sys >= 180;
        },
      },
      {
        id: "rf_bp_low",
        label: "Hypotension (systolic)",
        test: function (ctx) {
          const bp = (ctx.vitals && ctx.vitals.bp) || "";
          const sys = parseInt(String(bp).split("/")[0], 10);
          return sys && sys < 90;
        },
      },
      {
        id: "rf_temp_high",
        label: "High fever",
        test: function (ctx) {
          const t = parseFloat(ctx.vitals && ctx.vitals.temp);
          return t && t >= 39.5;
        },
      },
      {
        id: "rf_confusion",
        label: "Altered consciousness / confusion",
        test: function (ctx) {
          return hasFinding(ctx, "confusion", "confirmed");
        },
      },
      {
        id: "rf_hemoptysis",
        label: "Hemoptysis",
        test: function (ctx) {
          return hasFinding(ctx, "hemoptysis", "confirmed");
        },
      },
      {
        id: "rf_sob_severe",
        label: "Severe breathing difficulty",
        test: function (ctx) {
          return hasFinding(ctx, "sob", "confirmed") && parseFloat(ctx.vitals && ctx.vitals.rr) >= 28;
        },
      },
      {
        id: "rf_allergy",
        label: "Documented serious allergy — verify before any medication",
        test: function (ctx) {
          const a = (ctx.history && ctx.history.allergyHx) || "";
          return a.trim().length > 0 && !/^nil$|^none$|^nkda$/i.test(a.trim());
        },
      },
    ],

    labAlerts: [
      { id: "alt", label: "ALT abnormal", min: 7, max: 56 },
      { id: "ast", label: "AST abnormal", min: 10, max: 40 },
      { id: "creatinine", label: "Creatinine abnormal", min: 0.6, max: 1.3 },
      { id: "urea", label: "Urea abnormal", min: 2.5, max: 7.1 },
      { id: "hb", label: "Hemoglobin abnormal", min: 12, max: 17 },
      { id: "wbc", label: "WBC abnormal", min: 4, max: 11 },
      { id: "platelets", label: "Platelets abnormal", min: 150, max: 400 },
      { id: "urine_protein", label: "Urine protein positive", min: null, max: 20, aboveOnly: true },
      { id: "urine_glucose", label: "Urine glucose positive", min: null, max: 20, aboveOnly: true },
    ],
  };

  function hasFinding(ctx, symptomId, status) {
    const findings = (ctx && ctx.findings) || [];
    return findings.some(function (f) {
      return f.symptomId === symptomId && (!status || f.status === status);
    });
  }

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function suggestSymptoms(freeText) {
    const text = normalizeText(freeText);
    if (!text) return [];
    const matches = [];
    function pushMatch(s) {
      if (!matches.some(function (m) {
        return m.id === s.id;
      })) {
        matches.push({ id: s.id, label: s.label });
      }
    }
    knowledge.symptoms.forEach(function (s) {
      const terms = [s.label].concat(s.aliases || []).map(normalizeText);
      terms.forEach(function (term) {
        if (!term) return;
        if (
          text === term ||
          text.indexOf(term) !== -1 ||
          term.indexOf(text) === 0
        ) {
          pushMatch(s);
        }
      });
    });
    // Partial prefix match for typing
    if (text.length >= 3 && !matches.length) {
      knowledge.symptoms.forEach(function (s) {
        const label = normalizeText(s.label);
        if (label.indexOf(text) === 0) pushMatch(s);
        (s.aliases || []).forEach(function (a) {
          const al = normalizeText(a);
          if (al.indexOf(text) === 0) pushMatch(s);
        });
      });
    }
    return matches;
  }

  /**
   * Resolve a free-text label to a known symptom id when possible.
   */
  function resolveSymptomId(labelOrId) {
    const raw = normalizeText(labelOrId);
    if (!raw) return null;
    const byId = knowledge.symptoms.find(function (s) {
      return s.id === raw || normalizeText(s.id) === raw;
    });
    if (byId) return byId.id;
    const exact = knowledge.symptoms.find(function (s) {
      const terms = [s.label].concat(s.aliases || []).map(normalizeText);
      return terms.indexOf(raw) !== -1;
    });
    if (exact) return exact.id;
    const suggested = suggestSymptoms(raw);
    return suggested.length ? suggested[0].id : null;
  }

  function generateQuestions(findingIds, patient) {
    const ids = (findingIds || [])
      .map(function (id) {
        return resolveSymptomId(id) || id;
      })
      .filter(Boolean);
    const sex = ((patient && patient.sex) || "").toLowerCase();
    const seen = {};
    const out = [];
    knowledge.questions.forEach(function (q) {
      if (q.sex && sex && q.sex !== sex && sex !== "f" && sex !== "female") return;
      const overlap = (q.symptomIds || []).some(function (sid) {
        return ids.indexOf(sid) !== -1;
      });
      if (overlap && !seen[q.id]) {
        seen[q.id] = true;
        out.push({
          id: q.id,
          questionText: q.text,
          category: q.category,
          symptomIds: q.symptomIds.slice(),
          generationSource: "system",
        });
      }
    });
    // Prefer red flags first, then onset/character, then the rest
    const order = {
      red_flag: 0,
      onset: 1,
      character: 2,
      severity: 3,
      associated: 4,
      risk: 5,
      caution: 6,
    };
    out.sort(function (a, b) {
      const ao = order[a.category] != null ? order[a.category] : 9;
      const bo = order[b.category] != null ? order[b.category] : 9;
      return ao - bo;
    });
    return out;
  }

  function analyzeDifferentials(ctx) {
    const confirmed = ((ctx && ctx.findings) || [])
      .filter(function (f) {
        return f.status === "confirmed";
      })
      .map(function (f) {
        return f.symptomId;
      });
    const denied = ((ctx && ctx.findings) || [])
      .filter(function (f) {
        return f.status === "denied";
      })
      .map(function (f) {
        return f.symptomId;
      });

    const ranked = knowledge.diseases
      .map(function (d) {
        const supporting = (d.support || []).filter(function (s) {
          return confirmed.indexOf(s) !== -1;
        });
        const contradicting = (d.contradict || []).filter(function (s) {
          return confirmed.indexOf(s) !== -1;
        });
        const missing = (d.support || []).filter(function (s) {
          return confirmed.indexOf(s) === -1 && denied.indexOf(s) === -1;
        });
        const deniedSupport = (d.support || []).filter(function (s) {
          return denied.indexOf(s) !== -1;
        });
        let score = supporting.length * 2 - contradicting.length - deniedSupport.length * 0.5;
        return {
          id: d.id,
          label: d.label,
          score: score,
          supportingFindings: supporting,
          contradictingFindings: contradicting.concat(deniedSupport),
          missingFindings: missing,
          planTemplate: (d.planTemplate || []).slice(),
          status: "suggested",
        };
      })
      .filter(function (c) {
        return c.score > 0 || c.supportingFindings.length > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .map(function (c, i) {
        c.rank = i + 1;
        return c;
      });

    return ranked;
  }

  function evaluateRedFlags(ctx) {
    return knowledge.redFlags
      .filter(function (rf) {
        try {
          return rf.test(ctx);
        } catch (e) {
          return false;
        }
      })
      .map(function (rf) {
        return { id: rf.id, label: rf.label };
      });
  }

  function evaluateLabAlerts(labs) {
    labs = labs || {};
    const alerts = [];
    knowledge.labAlerts.forEach(function (rule) {
      const raw = labs[rule.id];
      if (raw === "" || raw == null) return;
      const val = parseFloat(raw);
      if (isNaN(val)) return;
      if (rule.aboveOnly) {
        if (val > rule.max) alerts.push({ id: "lab_" + rule.id, label: rule.label });
      } else if (val < rule.min || val > rule.max) {
        alerts.push({ id: "lab_" + rule.id, label: rule.label });
      }
    });
    return alerts;
  }

  function draftPlanForCondition(conditionId) {
    const d = knowledge.diseases.find(function (x) {
      return x.id === conditionId;
    });
    if (!d) {
      return [
        "Investigations as clinically appropriate",
        "Supportive care",
        "Follow-up / escalation per facility protocol",
      ];
    }
    return (d.planTemplate || []).slice();
  }

  function labelForSymptom(id) {
    const s = knowledge.symptoms.find(function (x) {
      return x.id === id;
    });
    return s ? s.label : id;
  }

  const api = {
    knowledge: knowledge,
    suggestSymptoms: suggestSymptoms,
    resolveSymptomId: resolveSymptomId,
    generateQuestions: generateQuestions,
    analyzeDifferentials: analyzeDifferentials,
    evaluateRedFlags: evaluateRedFlags,
    evaluateLabAlerts: evaluateLabAlerts,
    draftPlanForCondition: draftPlanForCondition,
    labelForSymptom: labelForSymptom,
  };

  global.SmartClerkingKnowledge = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : global);
