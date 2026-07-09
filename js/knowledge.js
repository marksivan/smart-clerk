/**
 * Smart Clerking Assistant knowledge pack
 * Version: demo-2.0.0
 *
 * Clinician-facing decision support only. Demonstration content; not exhaustive
 * or validated for clinical deployment. No output is a confirmed diagnosis.
 * No medication doses are generated. Local protocols and clinician review apply.
 *
 * Backward-compatible public API:
 * suggestSymptoms, generateQuestions, analyzeDifferentials, evaluateRedFlags,
 * evaluateLabAlerts, draftPlanForCondition, labelForSymptom
 */
(function (global) {
  "use strict";

  const knowledge = {
    version: "demo-2.0.0",
    lastReviewed: null,
    reviewStatus: "awaiting-clinician-review",
    intendedPopulation: "adult demonstration only",
    configuredRegion: "not configured",
    clinicalOwner: null,

    disclaimer:
      "Decision support — clinician verification required. Demonstration content only; not a confirmed diagnosis or prescription.",

    labDisclaimer:
      "Reference intervals vary by laboratory, method, age, sex, pregnancy status, units, and local policy. Configure ranges before clinical use.",

    sources: [
      {
        id: "who_pneumonia",
        organization: "World Health Organization",
        title: "Pneumonia",
        url: "https://www.who.int/health-topics/pneumonia",
        scope: "General symptom context",
      },
      {
        id: "who_tb",
        organization: "World Health Organization",
        title: "Tuberculosis",
        url: "https://www.who.int/news-room/fact-sheets/detail/tuberculosis",
        scope: "General TB symptom screening",
      },
      {
        id: "who_malaria",
        organization: "World Health Organization",
        title: "Malaria",
        url: "https://www.who.int/news-room/fact-sheets/detail/malaria",
        scope: "General malaria symptom and severity context",
      },
      {
        id: "cdc_sepsis",
        organization: "US CDC",
        title: "About Sepsis",
        url: "https://www.cdc.gov/sepsis/about/index.html",
        scope: "General emergency context",
      },
    ],

    symptoms: [
      s("fever", "Fever", "general", [
        "pyrexia",
        "high temperature",
        "feeling hot",
      ]),
      s("chills", "Chills", "general", ["rigors", "shivering"]),
      s("fatigue", "Fatigue", "general", [
        "tiredness",
        "extreme tiredness",
      ]),
      s("weakness", "Generalized weakness", "general", [
        "weak",
        "body weakness",
      ]),
      s("malaise", "Malaise", "general", ["feeling unwell"]),
      s("reduced_appetite", "Reduced appetite", "general", [
        "poor appetite",
        "loss of appetite",
      ]),
      s("weight_loss", "Weight loss", "general", [
        "losing weight",
        "unintentional weight loss",
      ]),
      s("night_sweats", "Night sweats", "general", [
        "sweating at night",
      ]),
      s(
        "dehydration",
        "Dehydration",
        "general",
        ["dry mouth", "very thirsty"],
        "sign"
      ),
      s("dizziness", "Dizziness", "general", [
        "lightheadedness",
        "feeling faint",
      ]),
      s("syncope", "Fainting", "general", [
        "syncope",
        "passed out",
        "loss of consciousness",
      ]),
      s(
        "confusion",
        "Confusion",
        "general",
        ["altered mental status", "disorientation"],
        "sign"
      ),
      s(
        "drowsiness",
        "Drowsiness",
        "general",
        ["very sleepy", "reduced alertness"],
        "sign"
      ),
      s("insomnia", "Insomnia / sleep difficulty", "general", [
        "sleeping",
        "can't sleep",
        "cannot sleep",
        "poor sleep",
        "sleeplessness",
        "difficulty sleeping",
        "trouble sleeping",
        "unable to sleep",
      ]),

      s("cough", "Cough", "respiratory", ["coughing"]),
      s("dry_cough", "Dry cough", "respiratory", [
        "nonproductive cough",
      ]),
      s("productive_cough", "Productive cough", "respiratory", [
        "wet cough",
        "cough with phlegm",
      ]),
      s("sputum", "Sputum production", "respiratory", [
        "phlegm",
        "mucus from chest",
      ]),
      s("hemoptysis", "Hemoptysis", "respiratory", [
        "coughing blood",
        "blood in sputum",
        "blood-streaked sputum",
      ]),
      s("sob", "Shortness of breath", "respiratory", [
        "dyspnea",
        "breathlessness",
        "difficulty breathing",
        "short of breath",
      ]),
      s("wheeze", "Wheeze", "respiratory", ["wheezing"]),
      s(
        "stridor",
        "Stridor",
        "respiratory",
        ["noisy breathing"],
        "sign"
      ),
      s(
        "pleuritic_chest_pain",
        "Pleuritic chest pain",
        "respiratory",
        ["sharp pain on breathing", "pain worse with inspiration"]
      ),
      s("orthopnea", "Orthopnea", "respiratory", [
        "breathless lying flat",
        "needs pillows to breathe",
      ]),
      s("pnd", "Paroxysmal nocturnal dyspnea", "respiratory", [
        "wakes breathless at night",
      ]),
      s("exercise_intolerance", "Exercise intolerance", "respiratory", [
        "reduced effort tolerance",
      ]),
      s("sore_throat", "Sore throat", "respiratory", [
        "throat pain",
      ]),
      s("nasal_congestion", "Nasal congestion", "respiratory", [
        "blocked nose",
        "stuffy nose",
      ]),
      s(
        "low_spo2",
        "Reduced oxygen saturation",
        "respiratory",
        ["low oxygen", "hypoxia"],
        "sign"
      ),
      s(
        "tachypnea",
        "Tachypnea",
        "respiratory",
        ["fast breathing", "rapid breathing"],
        "sign"
      ),
      s(
        "cyanosis",
        "Cyanosis",
        "respiratory",
        ["blue lips", "bluish fingers"],
        "sign"
      ),

      s("chest_pain", "Chest pain", "cardiovascular", [
        "chest discomfort",
        "central chest pain",
      ]),
      s(
        "exertional_chest_pain",
        "Exertional chest pain",
        "cardiovascular",
        ["chest pain on exertion"]
      ),
      s("palpitations", "Palpitations", "cardiovascular", [
        "racing heart",
        "heart pounding",
      ]),
      s(
        "peripheral_edema",
        "Peripheral edema",
        "cardiovascular",
        ["leg swelling", "swollen feet", "ankle swelling"],
        "sign"
      ),
      s("diaphoresis", "Diaphoresis", "cardiovascular", [
        "sweating",
        "cold sweat",
      ]),

      s("abdominal_pain", "Abdominal pain", "gastrointestinal", [
        "belly pain",
        "stomach pain",
      ]),
      s("epigastric_pain", "Epigastric pain", "gastrointestinal", [
        "upper abdominal pain",
      ]),
      s(
        "right_upper_pain",
        "Right upper abdominal pain",
        "gastrointestinal",
        ["right upper quadrant pain", "ruq pain"]
      ),
      s(
        "right_lower_pain",
        "Right lower abdominal pain",
        "gastrointestinal",
        ["right lower quadrant pain", "rlq pain"]
      ),
      s("nausea", "Nausea", "gastrointestinal", ["feeling sick"]),
      s("vomiting", "Vomiting", "gastrointestinal", [
        "emesis",
        "throwing up",
      ]),
      s("hematemesis", "Hematemesis", "gastrointestinal", [
        "vomiting blood",
        "blood in vomit",
        "coffee-ground vomit",
      ]),
      s("diarrhea", "Diarrhea", "gastrointestinal", [
        "loose stools",
        "watery stool",
      ]),
      s("constipation", "Constipation", "gastrointestinal", [
        "difficulty passing stool",
      ]),
      s("blood_in_stool", "Blood in stool", "gastrointestinal", [
        "bloody stool",
        "rectal bleeding",
      ]),
      s("melena", "Black stool", "gastrointestinal", [
        "melena",
        "tarry stool",
      ]),
      s(
        "abdominal_distension",
        "Abdominal distension",
        "gastrointestinal",
        ["bloated abdomen", "swollen abdomen"],
        "sign"
      ),
      s(
        "jaundice",
        "Jaundice",
        "gastrointestinal",
        ["yellow eyes", "yellow skin"],
        "sign"
      ),

      s("dysuria", "Dysuria", "urinary", [
        "painful urination",
        "burning urine",
      ]),
      s("frequency", "Urinary frequency", "urinary", [
        "passing urine often",
      ]),
      s("urgency", "Urinary urgency", "urinary", [
        "urgent need to urinate",
      ]),
      s("hematuria", "Hematuria", "urinary", [
        "blood in urine",
        "red urine",
      ]),
      s("flank_pain", "Flank pain", "urinary", [
        "loin pain",
        "side pain",
      ]),
      s("suprapubic_pain", "Suprapubic pain", "urinary", [
        "lower abdominal bladder pain",
      ]),
      s("reduced_urine", "Reduced urine output", "urinary", [
        "oliguria",
        "not passing much urine",
      ]),
      s("urinary_retention", "Urinary retention", "urinary", [
        "unable to pass urine",
      ]),

      s("headache", "Headache", "neurological", ["head pain"]),
      s(
        "thunderclap_headache",
        "Sudden severe headache",
        "neurological",
        ["worst headache", "thunderclap headache"]
      ),
      s(
        "unilateral_weakness",
        "One-sided weakness",
        "neurological",
        ["unilateral weakness", "weakness on one side"],
        "sign"
      ),
      s(
        "facial_droop",
        "Facial droop",
        "neurological",
        ["face drooping"],
        "sign"
      ),
      s(
        "speech_difficulty",
        "Speech difficulty",
        "neurological",
        ["slurred speech", "unable to speak"],
        "sign"
      ),
      s(
        "seizure",
        "Seizure",
        "neurological",
        ["convulsion", "fit"],
        "sign"
      ),
      s("neck_stiffness", "Neck stiffness", "neurological", [
        "stiff neck",
      ]),
      s("photophobia", "Photophobia", "neurological", [
        "light sensitivity",
      ]),
      s("visual_disturbance", "Visual disturbance", "neurological", [
        "blurred vision",
        "vision changes",
      ]),

      s("polydipsia", "Excessive thirst", "endocrine", [
        "polydipsia",
        "very thirsty",
      ]),
      s(
        "polyuria",
        "Frequent large-volume urination",
        "endocrine",
        ["polyuria", "passing lots of urine"]
      ),
      s(
        "tremor",
        "Tremor",
        "endocrine",
        ["shaking hands"],
        "sign"
      ),

      s("rash", "Rash", "skin", ["skin rash"], "sign"),
      s("itching", "Itching", "skin", ["pruritus", "itchy skin"]),
      s("hives", "Hives", "skin", ["urticaria", "welts"], "sign"),
      s(
        "facial_swelling",
        "Facial swelling",
        "allergy",
        ["swollen face"],
        "sign"
      ),
      s(
        "lip_swelling",
        "Lip swelling",
        "allergy",
        ["swollen lips"],
        "sign"
      ),
      s(
        "tongue_swelling",
        "Tongue swelling",
        "allergy",
        ["swollen tongue"],
        "sign"
      ),
      s(
        "petechiae",
        "Non-blanching or petechial rash",
        "skin",
        ["petechiae", "non blanching rash"],
        "sign"
      ),

      s(
        "pregnancy",
        "Pregnancy",
        "obstetric",
        ["pregnant"],
        "risk_factor"
      ),
      s("missed_period", "Missed period", "obstetric", [
        "late period",
        "amenorrhea",
      ]),
      s("vaginal_bleeding", "Vaginal bleeding", "obstetric", [
        "bleeding in pregnancy",
      ]),
      s("pelvic_pain", "Pelvic pain", "obstetric", [
        "lower pelvic pain",
      ]),
      s(
        "reduced_fetal_movement",
        "Reduced fetal movement",
        "obstetric",
        ["baby moving less"]
      ),
    ],

    questions: [
      q(
        "q_main_problem",
        [],
        "What is the main problem today?",
        "general",
        "free_text",
        30
      ),
      q(
        "q_onset_general",
        [],
        "When did the current problem begin?",
        "onset",
        "duration",
        40
      ),
      q(
        "q_course_general",
        [],
        "Is it improving, worsening, unchanged, or fluctuating?",
        "course",
        "single_choice",
        35,
        ["Improving", "Worsening", "Unchanged", "Fluctuating"]
      ),
      q(
        "q_severity_general",
        [],
        "How severe is the problem, and how is it affecting normal activities?",
        "severity",
        "free_text",
        40
      ),
      q(
        "q_prior_episode",
        [],
        "Has this happened before?",
        "history",
        "boolean",
        20
      ),
      q(
        "q_recent_care",
        [],
        "Has the patient already received treatment or recently attended another facility?",
        "history",
        "free_text",
        20
      ),
      q(
        "q_allergies_general",
        [],
        "Are there any medication or food allergies?",
        "safety",
        "free_text",
        80
      ),
      q(
        "q_meds_general",
        [],
        "What medications is the patient currently taking?",
        "history",
        "free_text",
        25
      ),

      q(
        "q_cough_onset",
        ["cough", "dry_cough", "productive_cough"],
        "When did the cough begin, and was the onset sudden or gradual?",
        "onset",
        "free_text",
        50
      ),
      q(
        "q_cough_type",
        ["cough"],
        "Is the cough dry or productive?",
        "character",
        "single_choice",
        50,
        ["Dry", "Productive", "Mixed", "Unsure"]
      ),
      q(
        "q_sputum_color",
        ["productive_cough", "sputum"],
        "What is the sputum color, amount, and smell?",
        "character",
        "free_text",
        40
      ),
      q(
        "q_hemoptysis",
        ["cough", "sputum", "productive_cough", "hemoptysis"],
        "Is there blood in the sputum or coughing of blood?",
        "red_flag",
        "boolean",
        100
      ),
      q(
        "q_hemoptysis_amount",
        ["hemoptysis"],
        "How much blood was coughed up (streaks, teaspoon, or larger volume)?",
        "severity",
        "free_text",
        90
      ),
      q(
        "q_hemoptysis_onset",
        ["hemoptysis"],
        "When did coughing blood begin? First episode or recurrent?",
        "onset",
        "free_text",
        80
      ),
      q(
        "q_hemoptysis_associated",
        ["hemoptysis"],
        "Any fever, night sweats, weight loss, chest pain, or shortness of breath with the hemoptysis?",
        "associated",
        "free_text",
        75
      ),
      q(
        "q_hemoptysis_source",
        ["hemoptysis"],
        "Is the blood definitely from the chest/airway, or could it be from the nose, mouth, or stomach?",
        "character",
        "free_text",
        70
      ),
      q(
        "q_hemoptysis_redflag",
        ["hemoptysis"],
        "Any large-volume bleeding, dizziness, or difficulty breathing right now?",
        "red_flag",
        "boolean",
        100
      ),
      q(
        "q_sob",
        ["cough", "fever", "chest_pain", "sputum"],
        "Is there shortness of breath at rest or on exertion?",
        "associated",
        "single_choice",
        80,
        ["None", "On exertion", "At rest", "Severe"]
      ),
      q(
        "q_speak_sentences",
        ["sob"],
        "Can the patient speak in full sentences without stopping for breath?",
        "red_flag",
        "boolean",
        100
      ),
      q(
        "q_pleuritic",
        ["cough", "sob", "chest_pain"],
        "Is the chest pain sharp and worse with deep breathing or coughing?",
        "associated",
        "boolean",
        60
      ),
      q(
        "q_wheeze",
        ["cough", "sob"],
        "Is there wheezing or a history of similar attacks?",
        "associated",
        "boolean",
        55
      ),
      q(
        "q_orthopnea",
        ["sob", "peripheral_edema"],
        "Is breathing worse when lying flat? How many pillows are needed?",
        "associated",
        "free_text",
        55
      ),
      q(
        "q_pnd",
        ["sob", "orthopnea"],
        "Does the patient wake from sleep because of breathlessness?",
        "associated",
        "boolean",
        55
      ),
      q(
        "q_smoking",
        ["cough", "sob", "wheeze", "chest_pain"],
        "Does the patient currently smoke or have a previous smoking history?",
        "risk",
        "free_text",
        35
      ),
      q(
        "q_tb_contact",
        ["cough", "fever", "weight_loss", "night_sweats", "hemoptysis"],
        "Any known tuberculosis contact, previous TB, or prolonged exposure to someone with chronic cough?",
        "risk",
        "free_text",
        70
      ),
      q(
        "q_cough_duration_tb",
        ["cough", "weight_loss", "night_sweats"],
        "Has the cough lasted two weeks or longer?",
        "risk",
        "boolean",
        70
      ),
      q(
        "q_recent_immobility",
        ["sob", "chest_pain", "pleuritic_chest_pain"],
        "Any recent surgery, prolonged immobility, long travel, pregnancy/postpartum state, or previous blood clot?",
        "risk",
        "free_text",
        75
      ),
      q(
        "q_unilateral_leg",
        ["sob", "chest_pain"],
        "Is there new one-sided leg pain or swelling?",
        "red_flag",
        "boolean",
        85
      ),

      q(
        "q_fever_measured",
        ["fever"],
        "Was the temperature measured? What was the highest reading?",
        "character",
        "free_text",
        45
      ),
      q(
        "q_fever_duration",
        ["fever"],
        "How long has the fever been present, and is it continuous or intermittent?",
        "onset",
        "free_text",
        45
      ),
      q(
        "q_fever_rigors",
        ["fever"],
        "Are there chills, rigors, or drenching sweats?",
        "associated",
        "multiple_choice",
        40,
        ["Chills", "Rigors", "Sweats", "None"]
      ),
      q(
        "q_fever_source",
        ["fever"],
        "Are there respiratory, urinary, abdominal, skin, joint, or neurological symptoms?",
        "associated",
        "free_text",
        45
      ),
      q(
        "q_fever_travel",
        ["fever", "chills", "headache"],
        "Any recent travel, mosquito exposure, unsafe water, or contact with an unwell person?",
        "exposure",
        "free_text",
        40
      ),
      q(
        "q_fever_immunosuppression",
        ["fever"],
        "Is the patient immunosuppressed, living with HIV, receiving chemotherapy/steroids, or otherwise high risk?",
        "risk",
        "free_text",
        70
      ),
      q(
        "q_fever_confusion",
        ["fever"],
        "Has there been confusion, extreme drowsiness, seizure, or fainting?",
        "red_flag",
        "boolean",
        100
      ),
      q(
        "q_fever_urine",
        ["fever"],
        "Is urine output reduced?",
        "red_flag",
        "boolean",
        80
      ),

      q(
        "q_cp_site",
        ["chest_pain", "exertional_chest_pain", "pleuritic_chest_pain"],
        "Where exactly is the chest pain?",
        "character",
        "free_text",
        50
      ),
      q(
        "q_cp_onset",
        ["chest_pain"],
        "Did the chest pain begin suddenly or gradually?",
        "onset",
        "single_choice",
        70,
        ["Sudden", "Gradual", "Unsure"]
      ),
      q(
        "q_cp_character",
        ["chest_pain"],
        "How would the patient describe the pain: pressure, tightness, burning, sharp, tearing, or another quality?",
        "character",
        "free_text",
        60
      ),
      q(
        "q_cp_radiation",
        ["chest_pain"],
        "Does the pain spread to the arm, jaw, shoulder, back, or abdomen?",
        "red_flag",
        "multiple_choice",
        80,
        ["Arm", "Jaw", "Shoulder", "Back", "Abdomen", "No radiation"]
      ),
      q(
        "q_cp_exertional",
        ["chest_pain"],
        "Is the pain brought on by exertion and relieved by rest?",
        "risk",
        "boolean",
        75
      ),
      q(
        "q_cp_assoc",
        ["chest_pain"],
        "Is there sweating, nausea, breathlessness, palpitations, or fainting?",
        "red_flag",
        "multiple_choice",
        85,
        [
          "Sweating",
          "Nausea",
          "Breathlessness",
          "Palpitations",
          "Fainting",
          "None",
        ]
      ),

      q(
        "q_abdo_site",
        ["abdominal_pain"],
        "Where exactly is the abdominal pain, and has it moved?",
        "character",
        "free_text",
        55
      ),
      q(
        "q_abdo_onset",
        ["abdominal_pain"],
        "Did the pain begin suddenly or gradually?",
        "onset",
        "single_choice",
        65,
        ["Sudden", "Gradual", "Unsure"]
      ),
      q(
        "q_abdo_character",
        ["abdominal_pain"],
        "Is the pain sharp, cramping, burning, colicky, or constant?",
        "character",
        "free_text",
        45
      ),
      q(
        "q_abdo_food",
        ["abdominal_pain", "epigastric_pain"],
        "Is the pain related to meals, alcohol, or anti-inflammatory medicines?",
        "risk",
        "free_text",
        35
      ),
      q(
        "q_abdo_bowel",
        ["abdominal_pain"],
        "Any diarrhea, constipation, blood in stool, black stool, or inability to pass stool or gas?",
        "red_flag",
        "multiple_choice",
        85,
        [
          "Diarrhea",
          "Constipation",
          "Blood in stool",
          "Black stool",
          "Cannot pass stool/gas",
          "None",
        ]
      ),
      q(
        "q_abdo_urinary",
        ["abdominal_pain"],
        "Any painful urination, frequency, blood in urine, or flank pain?",
        "associated",
        "multiple_choice",
        45,
        [
          "Painful urination",
          "Frequency",
          "Blood in urine",
          "Flank pain",
          "None",
        ]
      ),
      q(
        "q_abdo_pregnancy",
        ["abdominal_pain", "pelvic_pain", "vomiting"],
        "If pregnancy is possible: when was the last menstrual period, and is there vaginal bleeding?",
        "risk",
        "free_text",
        80,
        null,
        "female"
      ),
      q(
        "q_abdo_rigidity",
        ["abdominal_pain"],
        "Is the abdomen rigid, severely tender, or painful with movement?",
        "red_flag",
        "boolean",
        100
      ),
      q(
        "q_vomit_contents",
        ["vomiting"],
        "What does the vomit contain: food, bile, blood, or coffee-ground material?",
        "red_flag",
        "multiple_choice",
        85,
        ["Food", "Bile", "Fresh blood", "Coffee-ground material", "Other"]
      ),
      q(
        "q_vomit_fluids",
        ["vomiting", "diarrhea"],
        "Can the patient keep fluids down, and is urine output normal?",
        "red_flag",
        "free_text",
        85
      ),
      q(
        "q_diarrhea_character",
        ["diarrhea"],
        "How frequent are the stools, and are they watery, bloody, black, or mixed with mucus?",
        "red_flag",
        "free_text",
        75
      ),
      q(
        "q_diarrhea_exposure",
        ["diarrhea"],
        "Any recent travel, unsafe water, suspicious food, sick contacts, antibiotics, or hospital admission?",
        "exposure",
        "free_text",
        45
      ),

      q(
        "q_dysuria_onset",
        ["dysuria"],
        "When did painful urination begin?",
        "onset",
        "duration",
        40
      ),
      q(
        "q_uti_lower",
        ["dysuria", "frequency", "urgency"],
        "Is there urinary frequency, urgency, or suprapubic pain?",
        "associated",
        "multiple_choice",
        45,
        ["Frequency", "Urgency", "Suprapubic pain", "None"]
      ),
      q(
        "q_uti_upper",
        ["dysuria", "fever", "flank_pain"],
        "Is there fever, chills, flank pain, nausea, or vomiting?",
        "red_flag",
        "multiple_choice",
        75,
        ["Fever", "Chills", "Flank pain", "Nausea", "Vomiting", "None"]
      ),
      q(
        "q_uti_blood",
        ["dysuria", "flank_pain"],
        "Is there visible blood in the urine?",
        "red_flag",
        "boolean",
        65
      ),
      q(
        "q_uti_risk",
        ["dysuria", "frequency", "flank_pain"],
        "Any pregnancy, diabetes, urinary catheter, kidney stones, recurrent UTI, or urinary procedure?",
        "risk",
        "free_text",
        55
      ),

      q(
        "q_headache_onset",
        ["headache", "thunderclap_headache"],
        "Did the headache reach maximum intensity suddenly?",
        "red_flag",
        "boolean",
        100
      ),
      q(
        "q_headache_worst",
        ["headache"],
        "Is this the first severe headache or the worst headache the patient has experienced?",
        "red_flag",
        "boolean",
        95
      ),
      q(
        "q_headache_meningeal",
        ["headache", "fever"],
        "Is there fever, neck stiffness, photophobia, rash, confusion, or seizure?",
        "red_flag",
        "multiple_choice",
        100,
        [
          "Fever",
          "Neck stiffness",
          "Photophobia",
          "Rash",
          "Confusion",
          "Seizure",
          "None",
        ]
      ),
      q(
        "q_headache_focal",
        ["headache", "confusion"],
        "Is there weakness, facial droop, numbness, speech difficulty, or visual loss?",
        "red_flag",
        "multiple_choice",
        100,
        [
          "Weakness",
          "Facial droop",
          "Numbness",
          "Speech difficulty",
          "Visual loss",
          "None",
        ]
      ),
      q(
        "q_headache_context",
        ["headache"],
        "Any recent head injury, pregnancy/postpartum state, severe hypertension, anticoagulant use, or cancer history?",
        "risk",
        "free_text",
        75
      ),

      q(
        "q_sleep_onset",
        ["insomnia"],
        "What sleep problem is present — difficulty falling asleep, staying asleep, or early waking?",
        "onset",
        "free_text",
        50
      ),
      q(
        "q_sleep_duration",
        ["insomnia"],
        "How long has the sleep difficulty lasted? How many hours of sleep per night?",
        "character",
        "free_text",
        45
      ),
      q(
        "q_sleep_associated",
        ["insomnia", "fatigue"],
        "Any snoring, witnessed apneas, daytime sleepiness, mood change, or stimulant/caffeine use?",
        "associated",
        "free_text",
        45
      ),
      q(
        "q_sleep_pain",
        ["insomnia", "headache", "chest_pain", "abdominal_pain"],
        "Is pain, breathlessness, nocturia, or other symptoms waking the patient at night?",
        "associated",
        "free_text",
        50
      ),

      q(
        "q_rash_onset",
        ["rash", "hives"],
        "When did the rash start, where did it begin, and is it spreading?",
        "onset",
        "free_text",
        40
      ),
      q(
        "q_rash_character",
        ["rash"],
        "Is the rash itchy, painful, blistering, peeling, or involving the mouth or eyes?",
        "red_flag",
        "multiple_choice",
        75,
        [
          "Itchy",
          "Painful",
          "Blistering",
          "Peeling",
          "Mouth/eye involvement",
          "None",
        ]
      ),
      q(
        "q_rash_exposure",
        ["rash", "hives"],
        "Any new medicine, food, insect sting, chemical, or skin contact exposure?",
        "exposure",
        "free_text",
        55
      ),
      q(
        "q_anaphylaxis",
        ["hives", "facial_swelling", "lip_swelling", "tongue_swelling"],
        "Is there difficulty breathing, throat tightness, faintness, or rapid progression?",
        "red_flag",
        "boolean",
        100
      ),

      q(
        "q_pregnancy",
        [
          "fever",
          "abdominal_pain",
          "vomiting",
          "pelvic_pain",
          "vaginal_bleeding",
        ],
        "Is the patient pregnant or could pregnancy be possible?",
        "risk",
        "boolean",
        70,
        null,
        "female"
      ),
      q(
        "q_pregnancy_bleeding",
        ["pregnancy", "vaginal_bleeding", "pelvic_pain"],
        "If pregnant: is there heavy bleeding, severe pain, fainting, leaking fluid, contractions, or reduced fetal movement?",
        "red_flag",
        "free_text",
        100,
        null,
        "female"
      ),
    ],

    diseases: [
      d(
        "pneumonia",
        "Pneumonia",
        "respiratory",
        [
          ["cough", 3],
          ["fever", 3],
          ["sob", 3],
          ["productive_cough", 2],
          ["sputum", 2],
          ["pleuritic_chest_pain", 2],
          ["chills", 1],
          ["fatigue", 1],
          ["tachypnea", 3],
          ["low_spo2", 4],
          ["confusion", 2],
        ],
        [],
        ["who_pneumonia"],
        [
          "Respiratory rate and work of breathing",
          "Oxygen saturation",
          "Chest expansion and air entry",
          "Added breath sounds",
          "Temperature, pulse and blood pressure",
          "Mental status and hydration",
        ],
        [
          "Oxygen saturation",
          "Chest imaging if indicated",
          "Full blood count if indicated",
          "Other tests per local pneumonia pathway",
        ],
        p(
          [
            "Assess airway, breathing, circulation, and severity",
            "Record complete vital signs including oxygen saturation",
          ],
          ["Investigate according to local protocol"],
          ["Supportive care as clinically indicated"],
          [
            "Escalate urgently if hypoxia, hypotension, confusion, or severe respiratory distress",
          ],
          ["Arrange review and return precautions"]
        )
      ),

      d(
        "viral_uri",
        "Viral respiratory infection",
        "respiratory",
        [
          ["cough", 2],
          ["dry_cough", 2],
          ["fever", 1],
          ["sore_throat", 2],
          ["nasal_congestion", 2],
          ["fatigue", 1],
        ],
        [
          ["hemoptysis", 4],
          ["low_spo2", 4],
          ["confusion", 4],
        ],
        [],
        [
          "General appearance",
          "Temperature",
          "Respiratory effort",
          "Chest examination if lower respiratory features",
        ],
        [
          "Testing only when indicated by severity, epidemiology, or local protocol",
        ],
        p(
          ["Assess severity and exclude red flags"],
          ["Tests only if clinically indicated"],
          ["Supportive care and hydration"],
          ["Escalate if deterioration or red flags"],
          ["Provide return precautions"]
        )
      ),

      d(
        "acute_bronchitis",
        "Acute bronchitis",
        "respiratory",
        [
          ["cough", 3],
          ["productive_cough", 2],
          ["sputum", 1],
          ["wheeze", 1],
        ],
        [
          ["low_spo2", 3],
          ["confusion", 3],
        ],
        [],
        [
          "Respiratory rate",
          "Oxygen saturation",
          "Chest examination",
        ],
        [
          "Further investigation if severe, prolonged, or pneumonia cannot be excluded",
        ],
        p(
          ["Assess severity and exclude pneumonia or other serious causes"],
          ["Investigate only when indicated"],
          ["Supportive care"],
          ["Escalate for respiratory distress or hypoxia"],
          ["Review if persistent or worsening"]
        )
      ),

      d(
        "asthma_exacerbation",
        "Asthma exacerbation",
        "respiratory",
        [
          ["wheeze", 4],
          ["sob", 4],
          ["cough", 2],
          ["exercise_intolerance", 2],
        ],
        [["fever", 1]],
        [],
        [
          "Ability to speak",
          "Respiratory rate and effort",
          "Oxygen saturation",
          "Air entry and wheeze",
          "Peak flow where appropriate",
        ],
        [
          "Peak flow where appropriate",
          "Other investigations based on severity and alternatives",
        ],
        p(
          [
            "Assess airway and breathing urgency",
            "Review usual asthma treatment and triggers",
          ],
          ["Investigate according to severity"],
          ["Supportive care per approved asthma protocol"],
          [
            "Escalate for exhaustion, silent chest, cyanosis, or severe distress",
          ],
          ["Arrange follow-up and inhaler review"]
        )
      ),

      d(
        "tb",
        "Tuberculosis (consider)",
        "infectious",
        [
          ["cough", 2],
          ["weight_loss", 4],
          ["night_sweats", 4],
          ["fever", 2],
          ["hemoptysis", 4],
          ["fatigue", 2],
          ["sputum", 2],
        ],
        [],
        ["who_tb"],
        [
          "General and nutritional status",
          "Respiratory examination",
          "Lymph node examination where relevant",
        ],
        [
          "Follow local TB testing pathway",
          "Sputum or other tests per facility guidance",
          "Chest imaging where indicated",
        ],
        p(
          [
            "Apply appropriate infection-control precautions where indicated",
          ],
          ["Follow local TB evaluation pathway"],
          ["Supportive care as clinically indicated"],
          [
            "Escalate for major hemoptysis or respiratory compromise",
          ],
          [
            "Follow notification and contact procedures where applicable",
          ]
        )
      ),

      d(
        "pulmonary_embolism",
        "Pulmonary embolism (consider urgently)",
        "cardiovascular",
        [
          ["sob", 4],
          ["pleuritic_chest_pain", 4],
          ["chest_pain", 2],
          ["hemoptysis", 2],
          ["syncope", 3],
        ],
        [],
        [],
        [
          "Airway and breathing",
          "Oxygen saturation",
          "Pulse and blood pressure",
          "Leg examination for asymmetry or swelling",
        ],
        [
          "Urgent facility-approved PE assessment pathway",
          "ECG and imaging/laboratory testing as locally indicated",
        ],
        p(
          ["Urgently assess stability and clinical probability"],
          ["Use facility-approved diagnostic pathway"],
          ["Provide supportive care"],
          ["Emergency escalation if unstable"],
          ["Document risk factors and clinician decision"]
        )
      ),

      d(
        "heart_failure",
        "Heart failure",
        "cardiovascular",
        [
          ["sob", 4],
          ["orthopnea", 4],
          ["pnd", 4],
          ["peripheral_edema", 3],
          ["exercise_intolerance", 2],
        ],
        [],
        [],
        [
          "Oxygen saturation",
          "Lung crackles",
          "Peripheral edema",
          "Jugular venous pressure where appropriate",
          "Heart sounds and rhythm",
          "Blood pressure",
        ],
        [
          "ECG",
          "Chest imaging",
          "Renal function and other tests per local protocol",
        ],
        p(
          ["Assess severity and precipitating cause"],
          ["Investigate according to local heart-failure pathway"],
          ["Supportive care and monitoring"],
          ["Escalate for severe respiratory distress, shock, or hypoxia"],
          ["Arrange follow-up and medication review"]
        )
      ),

      d(
        "acute_coronary_syndrome",
        "Acute coronary syndrome (consider urgently)",
        "cardiovascular",
        [
          ["chest_pain", 4],
          ["exertional_chest_pain", 4],
          ["diaphoresis", 3],
          ["sob", 2],
          ["syncope", 2],
        ],
        [],
        [],
        [
          "Airway, breathing, circulation",
          "Pulse and blood pressure",
          "Cardiovascular examination",
        ],
        [
          "Urgent ECG",
          "Cardiac biomarkers and other tests per approved pathway",
        ],
        p(
          ["Urgent clinician review and ACS pathway"],
          ["Obtain required investigations promptly"],
          ["Supportive care per facility protocol"],
          ["Emergency escalation if unstable"],
          ["Document time course and risk factors"]
        )
      ),

      d(
        "gastroenteritis",
        "Gastroenteritis / infectious diarrheal illness",
        "gastrointestinal",
        [
          ["diarrhea", 4],
          ["vomiting", 3],
          ["abdominal_pain", 2],
          ["fever", 1],
          ["dehydration", 3],
        ],
        [
          ["hematemesis", 3],
          ["melena", 3],
        ],
        [],
        ["Hydration status", "Vital signs", "Abdominal examination"],
        [
          "Stool or blood tests if severe, prolonged, bloody, immunocompromised, or outbreak-related",
        ],
        p(
          ["Assess hydration and red flags"],
          ["Investigate when clinically indicated"],
          ["Fluid and supportive care as appropriate"],
          ["Escalate for severe dehydration, shock, or major bleeding"],
          ["Provide hygiene and return advice"]
        )
      ),

      d(
        "appendicitis",
        "Appendicitis (consider)",
        "gastrointestinal",
        [
          ["abdominal_pain", 2],
          ["right_lower_pain", 5],
          ["nausea", 2],
          ["vomiting", 2],
          ["fever", 1],
          ["reduced_appetite", 2],
        ],
        [],
        [],
        [
          "General appearance",
          "Abdominal tenderness, guarding, rebound",
          "Hydration",
          "Pregnancy assessment where relevant",
        ],
        [
          "Pregnancy test where relevant",
          "Laboratory and imaging assessment per local surgical pathway",
        ],
        p(
          ["Urgent clinical and surgical assessment where suspected"],
          ["Investigate according to local pathway"],
          ["Supportive care while awaiting review"],
          ["Escalate for peritonism, shock, or deterioration"],
          ["Document onset and migration of pain"]
        )
      ),

      d(
        "bowel_obstruction",
        "Bowel obstruction (consider urgently)",
        "gastrointestinal",
        [
          ["abdominal_pain", 3],
          ["vomiting", 3],
          ["constipation", 3],
          ["abdominal_distension", 4],
        ],
        [],
        [],
        [
          "Abdominal distension and tenderness",
          "Guarding or peritonism",
          "Hernia examination where appropriate",
          "Hydration and vital signs",
        ],
        ["Urgent imaging and laboratory tests per surgical protocol"],
        p(
          ["Urgent surgical assessment"],
          ["Investigate per local obstruction pathway"],
          ["Supportive care and monitoring"],
          [
            "Emergency escalation for peritonism, shock, or perforation concern",
          ],
          ["Document last stool/flatus and previous surgery"]
        )
      ),

      d(
        "upper_gi_bleed",
        "Upper gastrointestinal bleeding (consider urgently)",
        "gastrointestinal",
        [
          ["hematemesis", 5],
          ["melena", 5],
          ["dizziness", 2],
          ["syncope", 3],
          ["epigastric_pain", 1],
        ],
        [],
        [],
        [
          "Airway and circulation",
          "Pulse and blood pressure",
          "Perfusion and mental state",
          "Abdominal examination",
        ],
        [
          "Urgent facility GI-bleed pathway",
          "Blood count and other tests as approved",
        ],
        p(
          ["Urgently assess hemodynamic stability"],
          ["Activate local GI-bleed investigation pathway"],
          ["Supportive care and monitoring"],
          ["Emergency escalation if unstable or ongoing bleeding"],
          ["Review medication and bleeding risk"]
        )
      ),

      d(
        "lower_uti",
        "Lower urinary tract infection",
        "urinary",
        [
          ["dysuria", 4],
          ["frequency", 3],
          ["urgency", 3],
          ["suprapubic_pain", 2],
        ],
        [
          ["flank_pain", 1],
          ["confusion", 2],
        ],
        [],
        [
          "Vital signs",
          "Suprapubic tenderness",
          "Assessment for upper-tract features",
        ],
        ["Urinalysis or urine testing according to local protocol"],
        p(
          ["Assess for complicated or upper-tract infection"],
          ["Test according to local protocol"],
          ["Hydration and symptom support"],
          [
            "Escalate if systemic illness, pregnancy, obstruction, or deterioration",
          ],
          [
            "Clinician-approved antimicrobial decision per local guidance",
          ]
        )
      ),

      d(
        "pyelonephritis",
        "Pyelonephritis",
        "urinary",
        [
          ["dysuria", 2],
          ["fever", 3],
          ["flank_pain", 5],
          ["chills", 2],
          ["vomiting", 2],
        ],
        [],
        [],
        [
          "Vital signs",
          "Hydration",
          "Flank or costovertebral tenderness",
          "Assessment for sepsis",
        ],
        [
          "Urine testing/culture and other tests per local protocol",
        ],
        p(
          ["Assess severity and sepsis risk"],
          ["Investigate according to upper-UTI pathway"],
          ["Supportive care and hydration as appropriate"],
          [
            "Escalate for instability, pregnancy, obstruction, or inability to tolerate fluids",
          ],
          [
            "Clinician-approved antimicrobial decision per local guidance",
          ]
        )
      ),

      d(
        "renal_colic",
        "Renal colic / urinary stone",
        "urinary",
        [
          ["flank_pain", 5],
          ["hematuria", 3],
          ["nausea", 2],
          ["vomiting", 2],
        ],
        [],
        [],
        [
          "Vital signs",
          "Abdominal and flank examination",
          "Assessment for infection or obstruction",
        ],
        [
          "Urinalysis",
          "Pregnancy testing where relevant",
          "Imaging according to local pathway",
        ],
        p(
          ["Assess pain, infection, obstruction, and renal risk"],
          ["Investigate per local stone pathway"],
          ["Supportive care"],
          [
            "Urgent escalation for sepsis, solitary kidney, anuria, or uncontrolled symptoms",
          ],
          ["Arrange follow-up"]
        )
      ),

      d(
        "malaria",
        "Malaria (consider according to exposure and local epidemiology)",
        "infectious",
        [
          ["fever", 4],
          ["chills", 3],
          ["headache", 2],
          ["fatigue", 2],
          ["vomiting", 1],
          ["confusion", 4],
          ["seizure", 4],
          ["sob", 2],
          ["jaundice", 2],
          ["reduced_urine", 3],
        ],
        [],
        ["who_malaria"],
        [
          "Vital signs",
          "Mental status",
          "Hydration",
          "Respiratory status",
          "Jaundice and pallor",
        ],
        [
          "Malaria testing according to local protocol",
          "Other tests based on severity",
        ],
        p(
          ["Assess severity and epidemiological risk"],
          ["Prompt testing per local malaria guidance"],
          ["Supportive care as indicated"],
          [
            "Urgent escalation for confusion, seizure, respiratory difficulty, shock, jaundice, or reduced urine output",
          ],
          [
            "Treatment only after clinician confirmation and approved protocol",
          ]
        )
      ),

      d(
        "sepsis_syndrome",
        "Sepsis syndrome / serious infection (consider urgently)",
        "infectious",
        [
          ["fever", 2],
          ["confusion", 5],
          ["sob", 2],
          ["reduced_urine", 4],
          ["weakness", 2],
          ["drowsiness", 4],
          ["tachypnea", 3],
          ["low_spo2", 3],
        ],
        [],
        ["cdc_sepsis"],
        [
          "Airway, breathing, circulation",
          "Complete vital signs",
          "Mental status",
          "Perfusion",
          "Urine output",
          "Potential infection source",
        ],
        ["Facility-approved sepsis pathway and investigations"],
        p(
          [
            "Immediate clinician review and facility sepsis screening",
          ],
          ["Urgent investigations per local protocol"],
          ["Supportive care and monitoring"],
          [
            "Emergency escalation for instability or organ-dysfunction features",
          ],
          ["Document source, time course, and response"]
        )
      ),

      d(
        "meningitis",
        "Meningitis / encephalitis (consider urgently)",
        "neurological",
        [
          ["fever", 3],
          ["headache", 3],
          ["neck_stiffness", 5],
          ["photophobia", 2],
          ["confusion", 4],
          ["seizure", 4],
          ["petechiae", 4],
        ],
        [],
        [],
        [
          "Airway and consciousness",
          "Neurological examination",
          "Neck stiffness",
          "Rash assessment",
          "Vital signs",
        ],
        ["Urgent facility neurological/infectious pathway"],
        p(
          ["Immediate clinician review"],
          ["Urgent investigation per local protocol"],
          ["Supportive care and monitoring"],
          [
            "Emergency escalation for reduced consciousness, seizure, shock, or non-blanching rash",
          ],
          [
            "Apply infection-control measures where indicated",
          ]
        )
      ),

      d(
        "stroke",
        "Stroke or transient ischemic event (consider urgently)",
        "neurological",
        [
          ["unilateral_weakness", 5],
          ["facial_droop", 5],
          ["speech_difficulty", 5],
          ["visual_disturbance", 2],
          ["confusion", 2],
        ],
        [],
        [],
        [
          "Rapid focused neurological assessment",
          "Time last known well",
          "Glucose and vital signs",
        ],
        ["Urgent stroke pathway and imaging"],
        p(
          ["Activate urgent stroke assessment"],
          ["Obtain required investigations promptly"],
          ["Supportive care and monitoring"],
          ["Emergency escalation"],
          ["Document exact onset or last-known-well time"]
        )
      ),

      d(
        "migraine",
        "Migraine / primary headache",
        "neurological",
        [
          ["headache", 3],
          ["photophobia", 2],
          ["nausea", 2],
          ["vomiting", 1],
          ["visual_disturbance", 1],
        ],
        [
          ["thunderclap_headache", 5],
          ["unilateral_weakness", 5],
          ["confusion", 4],
          ["neck_stiffness", 4],
        ],
        [],
        [
          "Neurological examination",
          "Vital signs",
          "Eye examination where appropriate",
        ],
        ["Further tests only if red flags or atypical features"],
        p(
          ["Exclude secondary headache red flags"],
          ["Investigate if clinically indicated"],
          ["Supportive care per local headache protocol"],
          [
            "Escalate for sudden onset, focal deficit, seizure, fever/meningism, or altered consciousness",
          ],
          ["Arrange follow-up if recurrent"]
        )
      ),

      d(
        "anaphylaxis",
        "Anaphylaxis (consider immediately)",
        "allergy",
        [
          ["hives", 2],
          ["facial_swelling", 3],
          ["lip_swelling", 4],
          ["tongue_swelling", 5],
          ["sob", 5],
          ["wheeze", 3],
          ["syncope", 3],
        ],
        [],
        [],
        [
          "Airway",
          "Breathing",
          "Circulation",
          "Skin and mucosal findings",
          "Vital signs",
        ],
        [
          "No investigation should delay emergency assessment and treatment",
        ],
        p(
          [
            "Immediate emergency assessment and facility anaphylaxis protocol",
          ],
          ["Do not delay urgent care for investigations"],
          ["Supportive care and continuous monitoring"],
          ["Emergency escalation"],
          ["Document suspected trigger and allergy status"]
        )
      ),
    ],

    redFlags: [
      rf(
        "rf_rr_high",
        "Markedly elevated respiratory rate",
        "urgent",
        function (ctx) {
          const value = num(ctx.vitals && ctx.vitals.rr);
          return value !== null && value >= 30;
        },
        "Respiratory rate is at or above the demonstration threshold.",
        "Immediate clinician review; apply facility respiratory/sepsis protocol."
      ),

      rf(
        "rf_spo2_low",
        "Reduced oxygen saturation",
        "emergency",
        function (ctx) {
          const value = num(
            ctx.vitals &&
              (ctx.vitals.spo2 || ctx.vitals.oxygenSaturation)
          );
          return value !== null && value < 92;
        },
        "Oxygen saturation is below the demonstration threshold.",
        "Immediate clinician review and facility emergency protocol."
      ),

      rf(
        "rf_pulse_high",
        "Marked tachycardia",
        "urgent",
        function (ctx) {
          const value = num(ctx.vitals && ctx.vitals.pulse);
          return value !== null && value > 120;
        },
        "Pulse is above the demonstration threshold.",
        "Urgent clinician review and reassessment of circulation."
      ),

      rf(
        "rf_bp_low",
        "Hypotension",
        "emergency",
        function (ctx) {
          const value = sys(ctx);
          return value !== null && value < 90;
        },
        "Systolic blood pressure is below the demonstration threshold.",
        "Immediate clinician review and facility emergency protocol."
      ),

      rf(
        "rf_bp_high",
        "Severe hypertension",
        "urgent",
        function (ctx) {
          const value = sys(ctx);
          return value !== null && value >= 180;
        },
        "Systolic blood pressure is at or above the demonstration threshold.",
        "Urgent clinician review, especially with neurological, cardiac, renal, or visual symptoms."
      ),

      rf(
        "rf_temp_high",
        "Very high fever",
        "urgent",
        function (ctx) {
          const value = num(ctx.vitals && ctx.vitals.temp);
          return value !== null && value >= 39.5;
        },
        "Temperature is at or above the demonstration threshold.",
        "Urgent clinician assessment and evaluation for severe infection."
      ),

      rf(
        "rf_confusion",
        "Altered consciousness or confusion",
        "emergency",
        function (ctx) {
          return (
            hf(ctx, "confusion", "confirmed") ||
            hf(ctx, "drowsiness", "confirmed")
          );
        },
        "New altered mental status is documented.",
        "Immediate clinician review and emergency assessment."
      ),

      rf(
        "rf_seizure",
        "Seizure",
        "emergency",
        function (ctx) {
          return hf(ctx, "seizure", "confirmed");
        },
        "A seizure is documented.",
        "Immediate clinician review and emergency protocol."
      ),

      rf(
        "rf_focal_neuro",
        "New focal neurological deficit",
        "emergency",
        function (ctx) {
          return [
            "unilateral_weakness",
            "facial_droop",
            "speech_difficulty",
          ].some(function (id) {
            return hf(ctx, id, "confirmed");
          });
        },
        "A new focal neurological finding is documented.",
        "Activate urgent stroke/neurological pathway."
      ),

      rf(
        "rf_thunderclap",
        "Sudden severe headache",
        "emergency",
        function (ctx) {
          return hf(ctx, "thunderclap_headache", "confirmed");
        },
        "A sudden severe headache is documented.",
        "Immediate clinician review and emergency neurological assessment."
      ),

      rf(
        "rf_hemoptysis",
        "Hemoptysis",
        "urgent",
        function (ctx) {
          return hf(ctx, "hemoptysis", "confirmed");
        },
        "Coughing blood or blood-streaked sputum is documented.",
        "Urgent clinician review; escalate immediately if major or associated with instability."
      ),

      rf(
        "rf_stridor",
        "Stridor or threatened airway",
        "emergency",
        function (ctx) {
          return hf(ctx, "stridor", "confirmed");
        },
        "Noisy upper-airway breathing is documented.",
        "Immediate airway assessment and emergency protocol."
      ),

      rf(
        "rf_cyanosis",
        "Cyanosis",
        "emergency",
        function (ctx) {
          return hf(ctx, "cyanosis", "confirmed");
        },
        "Bluish discoloration is documented.",
        "Immediate clinician review and emergency respiratory assessment."
      ),

      rf(
        "rf_severe_sob",
        "Severe breathing difficulty",
        "emergency",
        function (ctx) {
          const rr = num(ctx.vitals && ctx.vitals.rr);
          return (
            hf(ctx, "sob", "confirmed") &&
            rr !== null &&
            rr >= 28
          );
        },
        "Breathlessness with a high respiratory rate is documented.",
        "Immediate clinician review and facility emergency protocol."
      ),

      rf(
        "rf_hematemesis",
        "Vomiting blood",
        "emergency",
        function (ctx) {
          return hf(ctx, "hematemesis", "confirmed");
        },
        "Hematemesis is documented.",
        "Urgent hemodynamic assessment and GI-bleed pathway."
      ),

      rf(
        "rf_melena",
        "Black tarry stool",
        "urgent",
        function (ctx) {
          return hf(ctx, "melena", "confirmed");
        },
        "Possible gastrointestinal bleeding is documented.",
        "Urgent clinician review and assessment for instability."
      ),

      rf(
        "rf_anaphylaxis",
        "Possible airway-threatening allergic reaction",
        "emergency",
        function (ctx) {
          const swelling =
            hf(ctx, "tongue_swelling", "confirmed") ||
            hf(ctx, "lip_swelling", "confirmed") ||
            hf(ctx, "facial_swelling", "confirmed");

          const breathingOrCirculation =
            hf(ctx, "sob", "confirmed") ||
            hf(ctx, "wheeze", "confirmed") ||
            hf(ctx, "syncope", "confirmed");

          return swelling && breathingOrCirculation;
        },
        "Swelling with breathing or circulatory symptoms is documented.",
        "Immediate emergency assessment and facility anaphylaxis protocol."
      ),

      rf(
        "rf_petechiae_fever",
        "Fever with non-blanching rash",
        "emergency",
        function (ctx) {
          return (
            hf(ctx, "fever", "confirmed") &&
            hf(ctx, "petechiae", "confirmed")
          );
        },
        "Fever and a non-blanching/petechial rash are documented.",
        "Immediate clinician review and emergency assessment."
      ),

      rf(
        "rf_reduced_urine",
        "Markedly reduced urine output",
        "urgent",
        function (ctx) {
          return hf(ctx, "reduced_urine", "confirmed");
        },
        "Reduced urine output is documented.",
        "Urgent clinician review and assessment of perfusion, renal function, and obstruction."
      ),

      rf(
        "rf_pregnancy_bleeding",
        "Bleeding or severe pain in possible pregnancy",
        "emergency",
        function (ctx) {
          return (
            hf(ctx, "vaginal_bleeding", "confirmed") &&
            (
              hf(ctx, "pregnancy", "confirmed") ||
              hf(ctx, "missed_period", "confirmed") ||
              hf(ctx, "pelvic_pain", "confirmed")
            )
          );
        },
        "Possible pregnancy with vaginal bleeding and/or pelvic pain is documented.",
        "Immediate obstetric/gynecological assessment."
      ),

      rf(
        "rf_fetal_movement",
        "Reduced fetal movement",
        "urgent",
        function (ctx) {
          return hf(ctx, "reduced_fetal_movement", "confirmed");
        },
        "Reduced fetal movement is documented.",
        "Urgent obstetric assessment according to local protocol."
      ),

      rf(
        "rf_allergy",
        "Documented medication or serious allergy",
        "urgent",
        function (ctx) {
          const allergyText = String(
            (ctx.history && ctx.history.allergyHx) || ""
          ).trim();

          return (
            allergyText.length > 0 &&
            !/^(nil|none|nkda|no known allergies)$/i.test(allergyText)
          );
        },
        "An allergy is recorded.",
        "Verify the allergy before any medication is selected."
      ),
    ],

    labAlerts: [
      lab(
        "alt",
        "ALT outside demo reference interval",
        "U/L",
        7,
        56
      ),
      lab(
        "ast",
        "AST outside demo reference interval",
        "U/L",
        10,
        40
      ),
      lab(
        "creatinine",
        "Creatinine outside demo reference interval",
        "mg/dL",
        0.6,
        1.3
      ),
      lab(
        "urea",
        "Urea outside demo reference interval",
        "mmol/L",
        2.5,
        7.1
      ),
      lab(
        "hb",
        "Hemoglobin outside demo reference interval",
        "g/dL",
        12,
        17
      ),
      lab(
        "wbc",
        "WBC outside demo reference interval",
        "10^9/L",
        4,
        11
      ),
      lab(
        "platelets",
        "Platelets outside demo reference interval",
        "10^9/L",
        150,
        400
      ),
      {
        id: "urine_protein",
        label: "Urine protein above demo threshold",
        unit: "mg/dL",
        min: null,
        max: 20,
        aboveOnly: true,
        demoOnly: true,
      },
      {
        id: "urine_glucose",
        label: "Urine glucose above demo threshold",
        unit: "mg/dL",
        min: null,
        max: 20,
        aboveOnly: true,
        demoOnly: true,
      },
    ],
  };

  function s(id, label, category, aliases, type) {
    return {
      id: id,
      label: label,
      category: category,
      aliases: aliases || [],
      type: type || "symptom",
      searchable: true,
    };
  }

  function q(
    id,
    symptomIds,
    text,
    category,
    responseType,
    priority,
    options,
    sex
  ) {
    return {
      id: id,
      symptomIds: symptomIds || [],
      text: text,
      category: category,
      responseType: responseType || "free_text",
      priority: priority || 0,
      options: options || null,
      sex: sex || null,
    };
  }

  function d(
    id,
    label,
    category,
    supportPairs,
    contradictPairs,
    sourceIds,
    exams,
    investigations,
    planTemplate
  ) {
    return {
      id: id,
      label: label,
      category: category,

      support: (supportPairs || []).map(function (item) {
        return {
          symptomId: item[0],
          weight: item[1],
          rationale: "Relevant finding for " + label,
        };
      }),

      contradict: (contradictPairs || []).map(function (item) {
        return {
          symptomId: item[0],
          weight: item[1],
          rationale: "Finding makes this condition less typical",
        };
      }),

      sourceIds: sourceIds || [],
      suggestedExamination: exams || [],

      suggestedInvestigations: (investigations || []).map(function (
        investigationLabel
      ) {
        return {
          label: investigationLabel,
          rationale: "Consider if clinically indicated",
          urgency: "context_dependent",
          localProtocolRequired: true,
        };
      }),

      planTemplate: planTemplate,
      demoOnly: true,
    };
  }

  function p(
    immediateActions,
    investigations,
    supportiveCare,
    escalation,
    followUp
  ) {
    return {
      immediateActions: immediateActions || [],
      assessment: [],
      investigations: investigations || [],
      supportiveCare: supportiveCare || [],
      monitoring: [],
      escalation: escalation || [],
      followUp: followUp || [],
      patientAdvice: [],
    };
  }

  function rf(
    id,
    label,
    severity,
    test,
    reason,
    suggestedAction
  ) {
    return {
      id: id,
      label: label,
      severity: severity,
      test: test,
      reason: reason,
      suggestedAction: suggestedAction,
      configurable: true,
    };
  }

  function lab(id, label, unit, min, max) {
    return {
      id: id,
      label: label,
      unit: unit,
      min: min,
      max: max,
      aboveOnly: false,
      demoOnly: true,
    };
  }

  function hf(ctx, symptomId, status) {
    return ((ctx && ctx.findings) || []).some(function (finding) {
      return (
        finding.symptomId === symptomId &&
        (!status || finding.status === status)
      );
    });
  }

  function norm(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function num(value) {
    if (value === "" || value == null) {
      return null;
    }

    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function sys(ctx) {
    const bp = String(
      (ctx.vitals && ctx.vitals.bp) || ""
    ).trim();

    const first = parseInt(bp.split("/")[0], 10);
    return Number.isFinite(first) ? first : null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function resolveSymptomId(labelOrId) {
    const raw = norm(labelOrId);
    if (!raw) {
      return null;
    }

    const byId = knowledge.symptoms.find(function (item) {
      return item.id === raw || norm(item.id) === raw;
    });
    if (byId) {
      return byId.id;
    }

    const exact = knowledge.symptoms.find(function (item) {
      const terms = [item.label]
        .concat(item.aliases || [])
        .map(norm);
      return terms.indexOf(raw) !== -1;
    });
    if (exact) {
      return exact.id;
    }

    const suggested = suggestSymptoms(raw);
    return suggested.length ? suggested[0].id : null;
  }

  function suggestSymptoms(freeText) {
    const text = norm(freeText);

    if (!text) {
      return [];
    }

    const scored = [];

    knowledge.symptoms.forEach(function (item) {
      const label = norm(item.label);
      const aliases = (item.aliases || []).map(norm);

      let score = 0;
      let matchedTerm = "";
      let matchType = "";

      if (text === label) {
        score = 100;
        matchedTerm = item.label;
        matchType = "exact_label";
      } else if (aliases.indexOf(text) !== -1) {
        score = 95;
        matchedTerm = item.aliases[aliases.indexOf(text)];
        matchType = "exact_alias";
      } else {
        [label].concat(aliases).forEach(function (term) {
          if (!term) {
            return;
          }

          if (
            text.indexOf(term) !== -1 &&
            term.length >= 4 &&
            score < 80
          ) {
            score = 80;
            matchedTerm = term;
            matchType = "phrase";
          } else if (
            text.length >= 3 &&
            term.indexOf(text) === 0 &&
            score < 60
          ) {
            score = 60;
            matchedTerm = term;
            matchType = "prefix";
          }
        });
      }

      if (score) {
        scored.push({
          id: item.id,
          label: item.label,
          category: item.category,
          matchedTerm: matchedTerm,
          matchType: matchType,
          score: score,
        });
      }
    });

    return scored
      .sort(function (a, b) {
        return (
          b.score - a.score ||
          a.label.localeCompare(b.label)
        );
      })
      .slice(0, 12);
  }

  function generateQuestions(
    findingIds,
    patient,
    answers,
    options
  ) {
    const ids = (findingIds || [])
      .map(function (id) {
        return resolveSymptomId(id) || id;
      })
      .filter(Boolean);
    const currentPatient = patient || {};
    const currentAnswers = answers || {};
    const settings = options || {};

    const maxQuestions = Number.isFinite(settings.maxQuestions)
      ? settings.maxQuestions
      : 20;

    const includeGeneral = settings.includeGeneral !== false;
    const includeAnswered = settings.includeAnswered === true;
    const sex = String(currentPatient.sex || "").toLowerCase();

    const seen = {};
    const output = [];

    knowledge.questions.forEach(function (item) {
      const isGeneral =
        !item.symptomIds || item.symptomIds.length === 0;

      if (isGeneral && !includeGeneral) {
        return;
      }

      if (
        !isGeneral &&
        !item.symptomIds.some(function (id) {
          return ids.indexOf(id) !== -1;
        })
      ) {
        return;
      }

      if (
        !includeAnswered &&
        Object.prototype.hasOwnProperty.call(
          currentAnswers,
          item.id
        )
      ) {
        return;
      }

      if (
        item.sex === "female" &&
        !(sex === "female" || sex === "f")
      ) {
        return;
      }

      const key = norm(item.text);

      if (seen[key]) {
        return;
      }

      seen[key] = true;

      output.push({
        id: item.id,
        questionText: item.text,
        category: item.category,
        priority: item.priority || 0,
        responseType: item.responseType || "free_text",
        options: item.options
          ? item.options.slice()
          : null,
        triggeredBy: isGeneral
          ? ["general"]
          : item.symptomIds.filter(function (id) {
              return ids.indexOf(id) !== -1;
            }),
        reason: isGeneral
          ? "General clerking and safety review"
          : "Relevant to selected symptom(s)",
        symptomIds: (item.symptomIds || []).slice(),
      });
    });

    return output
      .sort(function (a, b) {
        const urgentA =
          a.category === "red_flag" ||
          a.category === "safety"
            ? 1
            : 0;

        const urgentB =
          b.category === "red_flag" ||
          b.category === "safety"
            ? 1
            : 0;

        return (
          urgentB - urgentA ||
          b.priority - a.priority
        );
      })
      .slice(0, maxQuestions);
  }

  function analyzeDifferentials(ctx) {
    const confirmed = (
      (ctx && ctx.findings) || []
    )
      .filter(function (finding) {
        return finding.status === "confirmed";
      })
      .map(function (finding) {
        return finding.symptomId;
      });

    const denied = (
      (ctx && ctx.findings) || []
    )
      .filter(function (finding) {
        return finding.status === "denied";
      })
      .map(function (finding) {
        return finding.symptomId;
      });

    return knowledge.diseases
      .map(function (item) {
        const supportingFindings = [];
        const contradictingFindings = [];
        const missingCriticalFindings = [];

        let score = 0;
        let possibleMaximum = 0;

        (item.support || []).forEach(function (evidence) {
          possibleMaximum += evidence.weight;

          if (
            confirmed.indexOf(evidence.symptomId) !== -1
          ) {
            score += evidence.weight;

            supportingFindings.push({
              symptomId: evidence.symptomId,
              label: labelForSymptom(evidence.symptomId),
              weight: evidence.weight,
              rationale: evidence.rationale,
            });
          } else if (
            denied.indexOf(evidence.symptomId) !== -1
          ) {
            score -= evidence.weight * 0.6;

            contradictingFindings.push({
              symptomId: evidence.symptomId,
              label: labelForSymptom(evidence.symptomId),
              weight: evidence.weight * 0.6,
              rationale:
                "A supportive feature was denied",
            });
          } else if (evidence.weight >= 4) {
            missingCriticalFindings.push({
              symptomId: evidence.symptomId,
              label: labelForSymptom(evidence.symptomId),
              weight: evidence.weight,
            });
          }
        });

        (item.contradict || []).forEach(function (evidence) {
          if (
            confirmed.indexOf(evidence.symptomId) !== -1
          ) {
            score -= evidence.weight;

            contradictingFindings.push({
              symptomId: evidence.symptomId,
              label: labelForSymptom(evidence.symptomId),
              weight: evidence.weight,
              rationale: evidence.rationale,
            });
          }
        });

        const normalizedScore = possibleMaximum
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  (score / possibleMaximum) * 100
                )
              )
            )
          : 0;

        let matchLabel = "lower relative match";

        if (normalizedScore >= 55) {
          matchLabel = "higher relative match";
        } else if (normalizedScore >= 25) {
          matchLabel = "moderate relative match";
        }

        return {
          id: item.id,
          label: item.label,
          rawScore: score,

          // Retained for compatibility with the current UI.
          score: score,

          normalizedScore: normalizedScore,
          matchLabel: matchLabel,
          supportingFindings: supportingFindings,
          contradictingFindings: contradictingFindings,
          missingCriticalFindings: missingCriticalFindings,

          // Retained for compatibility.
          missingFindings: missingCriticalFindings.map(
            function (entry) {
              return entry.symptomId;
            }
          ),

          uncertaintyReason:
            missingCriticalFindings.length > 0
              ? "Important findings remain unconfirmed."
              : "Relative match only; clinician assessment is required.",

          planTemplate: clone(item.planTemplate),
          suggestedExamination: (
            item.suggestedExamination || []
          ).slice(),

          suggestedInvestigations: (
            item.suggestedInvestigations || []
          ).map(function (investigation) {
            return Object.assign({}, investigation);
          }),

          sourceIds: (item.sourceIds || []).slice(),
          status: "suggested",
        };
      })
      .filter(function (candidate) {
        return (
          candidate.rawScore > 0 ||
          candidate.supportingFindings.length > 0
        );
      })
      .sort(function (a, b) {
        return b.rawScore - a.rawScore;
      })
      .map(function (candidate, index) {
        candidate.rank = index + 1;
        return candidate;
      });
  }

  function evaluateRedFlags(ctx) {
    return knowledge.redFlags
      .filter(function (item) {
        try {
          return Boolean(item.test(ctx || {}));
        } catch (error) {
          return false;
        }
      })
      .map(function (item) {
        return {
          id: item.id,
          label: item.label,
          severity: item.severity,
          reason: item.reason,
          suggestedAction: item.suggestedAction,
        };
      });
  }

  function evaluateLabAlerts(
    labs,
    configuredRanges
  ) {
    const data = labs || {};
    const ranges = configuredRanges || {};
    const alerts = [];

    knowledge.labAlerts.forEach(function (rule) {
      const raw = data[rule.id];

      if (raw === "" || raw == null) {
        return;
      }

      const value = parseFloat(raw);

      if (!Number.isFinite(value)) {
        return;
      }

      const override = ranges[rule.id] || {};

      const minimum =
        override.min != null
          ? override.min
          : rule.min;

      const maximum =
        override.max != null
          ? override.max
          : rule.max;

      let abnormal = false;

      if (rule.aboveOnly) {
        abnormal =
          maximum != null && value > maximum;
      } else {
        abnormal =
          (minimum != null && value < minimum) ||
          (maximum != null && value > maximum);
      }

      if (abnormal) {
        alerts.push({
          id: "lab_" + rule.id,
          label: rule.label,
          value: value,
          unit: override.unit || rule.unit || "",
          min: minimum,
          max: maximum,
          demoReferenceUsed: !ranges[rule.id],
          note: knowledge.labDisclaimer,
        });
      }
    });

    return alerts;
  }

  function draftPlanForCondition(conditionId) {
    const item = knowledge.diseases.find(
      function (condition) {
        return condition.id === conditionId;
      }
    );

    if (!item) {
      return [
        "Assess severity and red flags",
        "Investigations as clinically appropriate and per local protocol",
        "Supportive care",
        "Follow-up or escalation according to clinical status",
      ];
    }

    const structured = clone(item.planTemplate);
    const flattened = [];

    Object.keys(structured).forEach(function (section) {
      (structured[section] || []).forEach(
        function (entry) {
          flattened.push(entry);
        }
      );
    });

    // The existing UI can continue treating this as an array.
    // Newer UI code can access plan.structured.
    flattened.structured = structured;

    return flattened;
  }

  function labelForSymptom(id) {
    const item = knowledge.symptoms.find(
      function (symptom) {
        return symptom.id === id;
      }
    );

    return item ? item.label : id;
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

  if (
    typeof module !== "undefined" &&
    module.exports
  ) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : global);