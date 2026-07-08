/**
 * Clinician-reviewed sample knowledge for MVP demonstration.
 * Not exhaustive. All outputs remain decision support.
 */
(function (global) {
  "use strict";

  const knowledge = {
    version: "demo-1.0.0",
    disclaimer:
      "Decision support — clinician verification required. Sample content for demonstration only.",

    symptoms: [
      { id: "cough", label: "Cough", aliases: ["coughing"] },
      { id: "fever", label: "Fever", aliases: ["pyrexia", "high temperature"] },
      { id: "sob", label: "Shortness of breath", aliases: ["dyspnea", "short of breath", "breathlessness"] },
      { id: "chest_pain", label: "Chest pain", aliases: ["pleuritic pain", "chest discomfort"] },
      { id: "sputum", label: "Sputum production", aliases: ["phlegm", "productive cough"] },
      { id: "hemoptysis", label: "Hemoptysis", aliases: ["coughing blood", "blood in sputum"] },
      { id: "chills", label: "Chills", aliases: ["rigors"] },
      { id: "wheeze", label: "Wheeze", aliases: ["wheezing"] },
      { id: "abdominal_pain", label: "Abdominal pain", aliases: ["belly pain", "stomach pain"] },
      { id: "vomiting", label: "Vomiting", aliases: ["emesis"] },
      { id: "dysuria", label: "Dysuria", aliases: ["painful urination", "burning urine"] },
      { id: "headache", label: "Headache", aliases: [] },
      { id: "diarrhea", label: "Diarrhea", aliases: ["loose stools"] },
      { id: "confusion", label: "Confusion", aliases: ["altered mental status"] },
      { id: "weight_loss", label: "Weight loss", aliases: [] },
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
        symptomIds: ["cough", "fever", "chest_pain"],
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
        symptomIds: ["fever", "cough"],
        text: "Are there chills or rigors?",
        category: "associated",
      },
      {
        id: "q_tb_contact",
        symptomIds: ["cough", "fever", "weight_loss"],
        text: "Any recent contact with someone who has tuberculosis, or known TB exposure?",
        category: "risk",
      },
      {
        id: "q_smoking",
        symptomIds: ["cough", "sob", "wheeze"],
        text: "Does the patient smoke or have a smoking history?",
        category: "risk",
      },
      {
        id: "q_recent_abx",
        symptomIds: ["cough", "fever"],
        text: "Any recent antibiotic use or hospitalization?",
        category: "risk",
      },
      {
        id: "q_pregnancy",
        symptomIds: ["fever", "cough", "abdominal_pain", "vomiting"],
        text: "If applicable: is the patient pregnant?",
        category: "risk",
        sex: "female",
      },
      {
        id: "q_confusion",
        symptomIds: ["fever", "cough", "sob"],
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
    knowledge.symptoms.forEach(function (s) {
      const terms = [s.label].concat(s.aliases || []).map(normalizeText);
      terms.forEach(function (term) {
        if (!term) return;
        if (text.indexOf(term) !== -1 || term.indexOf(text) === 0 || text.indexOf(term.split(" ")[0]) !== -1) {
          if (!matches.some(function (m) { return m.id === s.id; })) {
            matches.push({ id: s.id, label: s.label });
          }
        }
      });
    });
    // Partial prefix match for typing
    if (text.length >= 3) {
      knowledge.symptoms.forEach(function (s) {
        const label = normalizeText(s.label);
        if (label.indexOf(text) === 0 || text.indexOf(label.slice(0, text.length)) === 0) {
          if (!matches.some(function (m) { return m.id === s.id; })) {
            matches.push({ id: s.id, label: s.label });
          }
        }
        (s.aliases || []).forEach(function (a) {
          const al = normalizeText(a);
          if (al.indexOf(text) === 0) {
            if (!matches.some(function (m) { return m.id === s.id; })) {
              matches.push({ id: s.id, label: s.label });
            }
          }
        });
      });
    }
    return matches;
  }

  function generateQuestions(findingIds, patient) {
    const ids = findingIds || [];
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
        });
      }
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
