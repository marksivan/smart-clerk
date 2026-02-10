// --- HELPER ---
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

// --- UNIT SPECIFIC FIELDS ---
function loadUnit() {
  const unit = getVal("unit");
  const section = document.getElementById("unitSection");
  section.innerHTML = "";

  if (unit === "obgyn") {
    section.innerHTML = `
      <h3>Obstetric History</h3>
      <input id="gravida" placeholder="Gravida"><br>
      <input id="para" placeholder="Para"><br>
      <input id="ga" placeholder="Estimated Gestational Age (weeks)"><br>
      <input id="edd" placeholder="Estimated Date of Delivery(weeks)"><br>

    `;
  }

  if (unit === "cardio") {
    section.innerHTML = `
      <h3>Cardiology Specific</h3>
      <textarea id="cardioHx" placeholder="Chest pain, dyspnea, orthopnea, PND"></textarea><br>
    `;
  }

  document.getElementById("impression").dispatchEvent(new Event("input"));
}

document.getElementById("unit").addEventListener("change", loadUnit);

// --- ANALYZE ---
function analyze() {
  let alertMsg = "";
  let summary = "";

  // Biodata
  summary += `BIODATA\nName: ${getVal("name")}, Age: ${getVal("age")}, Sex: ${getVal("sex")}\nAddress: ${getVal("address")}, Occupation: ${getVal("occupation")}\n\n`;

  // History
  summary += `HISTORY\nPC: ${getVal("pc")} \nodq: ${getVal("odq")}\nHPC: ${getVal("hpc")}\nPMH: ${getVal("pmh")}\nDrugs: ${getVal("drugHx")}, Allergy: ${getVal("allergyHx")}\nFamily: ${getVal("familyHx")}, Social: ${getVal("socialHx")}\nROS: ${getVal("ros")}\n\n`;

  // Physical
  summary += `PHYSICAL EXAM\nGeneral: ${getVal("generalExam")}\nVitals - BP: ${getVal("bp")}, Pulse: ${getVal("pulse")}, RR: ${getVal("rr")}, Temp: ${getVal("temp")}\nSystemic Exam: ${getVal("systemicExam")}\n\n`;

  // Alerts: Vitals
  const bp = getVal("bp");
  const pulse = parseInt(getVal("pulse")) || 0;
  if(bp){ const systolic = parseInt(bp.split("/")[0]); if(systolic>=140) alertMsg += "⚠️ Hypertension detected\n"; }
  if(pulse>100) alertMsg += "⚠️ Tachycardia\n";

  // Unit-specific
  const unit = getVal("unit");
  if(unit==="obgyn"){
    const ga = parseInt(getVal("ga"))||0;
    summary += `OB HX: G${getVal("gravida")} P${getVal("para")}, GA: ${ga} weeks\n`;
    if(ga && ga<37) alertMsg+="⚠️ Preterm pregnancy\n";
  }
  if(unit==="cardio") summary+=`Cardiology Hx: ${getVal("cardioHx")}\n`;

  // Labs
  checkLabs();

  // Impression
  const impression = getVal("impression");
  summary += `\nIMPRESSION / DIAGNOSIS: ${impression}\n`;

  document.getElementById("alert").innerText=alertMsg+document.getElementById("alert").innerText;
  document.getElementById("summary").value=summary;
}

// --- SUGGESTED PLAN ---
const impressionField = document.getElementById("impression");
const planField = document.getElementById("plan");
impressionField.addEventListener("input", updatePlan);

function updatePlan(){
  const unit = getVal("unit");
  const impression = getVal("impression").toLowerCase();
  let suggestedPlan="";

  if(impression){
    if(unit==="medicine"){
      if(impression.includes("hypertension")) suggestedPlan="1. Start antihypertensive therapy\n2. Lifestyle modification\n3. Monitor BP regularly";
      else if(impression.includes("diabetes")) suggestedPlan="1. Blood sugar monitoring\n2. Start/adjust hypoglycemic agents\n3. Dietary advice";
      else suggestedPlan="1. Investigations as appropriate\n2. Symptomatic treatment\n3. Follow-up";
    }
    if(unit==="obgyn"){
      if(impression.includes("preterm labour") || impression.includes("preterm labor")) suggestedPlan="1. Administer tocolytics\n2. Steroids for fetal lung maturity\n3. Monitor maternal vitals and contractions";
      else suggestedPlan="1. Routine antenatal care\n2. Investigations as indicated\n3. Follow-up";
    }
    if(unit==="cardio"){
      if(impression.includes("heart failure")) suggestedPlan="1. Start diuretics\n2. ACE inhibitors/ARBs\n3. Monitor vitals and fluid status";
      else suggestedPlan="1. ECG & echocardiography\n2. Symptomatic treatment\n3. Follow-up";
    }
  } else suggestedPlan="Enter impression to get suggested plan";

  planField.value=suggestedPlan;
}

// --- LAB ALERTS ---
const labIds=["alt","ast","creatinine","urea","hb","wbc","platelets","urine_protein","urine_glucose"];
labIds.forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener("input",checkLabs);
});

function checkLabs(){
  let labAlert="";
  const alt=parseFloat(getVal("alt"))||0;
  const ast=parseFloat(getVal("ast"))||0;
  const creatinine=parseFloat(getVal("creatinine"))||0;
  const urea=parseFloat(getVal("urea"))||0;
  const hb=parseFloat(getVal("hb"))||0;
  const wbc=parseFloat(getVal("wbc"))||0;
  const platelets=parseFloat(getVal("platelets"))||0;
  const urine_protein=parseFloat(getVal("urine_protein"))||0;
  const urine_glucose=parseFloat(getVal("urine_glucose"))||0;

  if(alt && (alt<7||alt>56)) labAlert+="⚠️ ALT abnormal\n";
  if(ast && (ast<10||ast>40)) labAlert+="⚠️ AST abnormal\n";
  if(creatinine && (creatinine<0.6||creatinine>1.3)) labAlert+="⚠️ Creatinine abnormal\n";
  if(urea && (urea<2.5||urea>7.1)) labAlert+="⚠️ Urea abnormal\n";
  if(hb && (hb<12||hb>17)) labAlert+="⚠️ Hemoglobin abnormal\n";
  if(wbc && (wbc<4||wbc>11)) labAlert+="⚠️ WBC abnormal\n";
  if(platelets && (platelets<150||platelets>400)) labAlert+="⚠️ Platelets abnormal\n";
  if(urine_protein && urine_protein>20) labAlert+="⚠️ Urine protein positive\n";
  if(urine_glucose && urine_glucose>20) labAlert+="⚠️ Urine glucose positive\n";

  const existingAlerts=document.getElementById("alert");
  let oldText=existingAlerts.innerText.split("\n").filter(line=>!line.includes("ALT")&&!line.includes("AST")&&!line.includes("Creatinine")&&!line.includes("Urea")&&!line.includes("Hemoglobin")&&!line.includes("WBC")&&!line.includes("Platelets")&&!line.includes("Urine")).join("\n");
  existingAlerts.innerText=oldText+(oldText?"\n":"")+labAlert;
}

// --- LOCALSTORAGE ---
function savePatient(){
  const patient={};
  const fields=["name","age","sex","address","occupation","pc","hpc","pmh","drugHx","allergyHx","familyHx","socialHx","ros","generalExam","bp","pulse","rr","temp","systemicExam","unit","gravida","para","ga","cardioHx","impression","plan","alt","ast","creatinine","urea","hb","wbc","platelets","urine_protein","urine_glucose"];
  fields.forEach(f=>patient[f]=getVal(f));
  let patients=JSON.parse(localStorage.getItem("patients"))||[];
  patients.push(patient);
  localStorage.setItem("patients",JSON.stringify(patients));
  alert("✅ Patient saved!");
  loadPatients();
}

function loadPatients(){
  const patients=JSON.parse(localStorage.getItem("patients"))||[];
  const list=document.getElementById("patientList");
  list.innerHTML='<option value="">--Select Patient--</option>';
  patients.forEach((p,i)=>{
    const option=document.createElement("option");
    option.value=i;
    option.text=`${p.name} (${p.age})`;
    list.appendChild(option);
  });
}

function loadPatientFromList(){
  const index=document.getElementById("patientList").value;
  if(index==="") return;
  const patients=JSON.parse(localStorage.getItem("patients"))||[];
  const p=patients[index];
  for(let key in p){
    const el=document.getElementById(key);
    if(el) el.value=p[key];
  }
  loadUnit();
  analyze();
}
function insertPhysicalTemplate() {
  const template = `
GENERAL EXAM:  A middle aged m/f not in any respiratory distres or pain, pale-,jaundice-,fever-,hydration status fair,pedal edema-
- Appearance: 
- Consciousness: 
- Nutrition: 
- Hydration: 
- Pallor: 
- Jaundice: 
- Cyanosis: 
- Oedema: 
- Lymphadenopathy: 

SYSTEMIC EXAM:
- Cardiovascular:BP  PR- regular and of good volume, S1 And S2 present, no murmurs
- Respiratory: Chest moves symmetrically,no scars,
- Abdomen:Full , moves with respiration, no scarifications, no organomegally
- CNS: 
- Musculoskeletal: 
- Skin: 
- Others: 
`;

  document.getElementById("generalExam").value = template;
  document.getElementById("systemicExam").value = ""; // Optional: empty or add systemic template
}


function clearPatients(){
  if(confirm("Are you sure you want to delete all saved patients?")){
    localStorage.removeItem("patients");
    loadPatients();
    alert("All patients cleared!");
  }
}

// --- INITIALIZE ---
window.onload=loadPatients;
