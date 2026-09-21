"use strict";

const VERSION = "2026.09.21-v2";
const STORAGE_KEY = "malawi-solar-ahp-survey-v2";
const CR_LIMIT = 0.10;
const INTENSITIES = [
  [2,"Slightly more important"], [3,"Moderately more important"],
  [4,"Between moderately and strongly more important"], [5,"Strongly more important"],
  [6,"Between strongly and very strongly more important"], [7,"Very strongly more important"],
  [8,"Between very strongly and extremely more important"], [9,"Extremely more important"]
];

const BLOCKS = [
  {
    id: "dim", short: "Dimensions", title: "Sustainability dimensions",
    intro: "Compare the six broad dimensions for sustaining standalone solar PV systems throughout their intended service life. Judge importance, not Malawi’s current performance.",
    items: [
      ["d1", "Technical Performance", "Whether the system is correctly designed, built to recognised standards and capable of sustained autonomous operation."],
      ["d2", "Economic and Financial Viability", "Whether the project is affordable, financially sustainable across its lifecycle and able to produce economic or cost-saving value."],
      ["d3", "Social Acceptability and Equity", "Whether the project responds to user and community needs, distributes benefits fairly and is perceived as inclusive and legitimate."],
      ["d4", "Organisational and Maintenance Capacity", "Whether governance, skills, finance, spare parts, monitoring and service arrangements exist for long-term operation."],
      ["d5", "Environmental Appropriateness and Circularity", "Whether the project is suitably located, limits environmental harm and provides for batteries, equipment and other end-of-life materials."],
      ["d6", "Policy and Regulatory Alignment", "Whether deployment is lawful, standards-compliant and consistent with national energy priorities and institutional responsibilities."]
    ]
  },
  {
    id: "tech", short: "Technical", title: "Technical Performance subcriteria",
    intro: "Keep Technical Performance fixed as the parent dimension. Compare the contribution of each subcriterion to long-term technical sustainability.",
    items: [
      ["c11","System Sizing and Load Matching","Whether PV-array, battery and charge-controller capacities match actual and expected loads. For health centres and schools, this includes vaccine refrigeration, ICT and lighting. Undersizing can accelerate battery deterioration; oversizing increases capital cost."],
      ["c12","Component Quality and Standards","Whether modules, batteries, inverters and wiring meet recognised IEC, Lighting Global and MERA requirements. Substandard components can reduce service life, safety and user confidence."],
      ["c13","Installation Quality and Safety","Whether installation meets electrical-safety requirements and uses appropriate orientation, tilt, mounting and earthing. Poor workmanship can reduce output and create hazards."],
      ["c14","Reliability and Autonomy","Whether the system can maintain the required energy service through seasonal changes without external backup, including adequate battery autonomy during Malawi’s rainy season."],
      ["c15","Monitoring and Diagnostics","Whether operators can observe system performance and identify faults using data logging, alarms or simpler indicators such as battery-voltage information."]]
  },
  {
    id: "econ", short: "Economic", title: "Economic and Financial Viability subcriteria",
    intro: "Compare importance within the economic and financial dimension. Consider costs and value over the project life, not only initial affordability.",
    items: [
      ["c21","Capital Affordability","The upfront system cost relative to the resources of the intended beneficiary. Many Malawian institutional systems depend on grants or public funding, while unsubsidised systems remain unaffordable for many households."],
      ["c22","Lifecycle Cost","Total ownership cost, including battery replacement, degradation, maintenance labour and decommissioning. A project may fail when the first battery set reaches end of life if replacement costs were omitted."],
      ["c23","Operation and Maintenance Financing","Whether a continuing revenue source or budget exists for routine operation and maintenance after initial project funding ends."],
      ["c24","Productive-Use or Cost-Saving Value","Whether electricity supports income-generating activity or replaces spending on fuels and services, such as phone charging, irrigation, cold storage, kerosene or diesel."]]
  },
  {
    id: "social", short: "Social", title: "Social Acceptability and Equity subcriteria",
    intro: "Compare importance within the social dimension, considering users, institutions and communities affected by standalone solar PV projects.",
    items: [
      ["c31","Needs Alignment","The degree to which the system and its services correspond with priorities expressed by users, such as refrigeration in health centres, ICT power in schools, or household lighting and charging."],
      ["c32","Stakeholder Participation","The extent to which users, local leaders and community bodies participate in planning, design, siting, governance and tariff decisions."],
      ["c33","Gender and Inclusion","Whether women, young people and persons with disabilities have fair access to energy services, decision-making roles and associated economic opportunities."],
      ["c34","User Training and Awareness","Whether users understand normal operation, system limits and basic troubleshooting, including how overloading and deep battery discharge affect service life."],
      ["c35","Perceived Legitimacy and Satisfaction","How users judge project fairness, transparency, service quality and responsiveness, including confidence in leadership, fees and reporting."]]
  },
  {
    id: "org", short: "Organisation", title: "Organisational and Maintenance Capacity subcriteria",
    intro: "Compare importance within organisational and maintenance capacity. Focus on arrangements that keep systems functional and accountable after installation.",
    items: [
      ["c41","Governance Clarity","Whether ownership, responsibilities, decision authority and accountability are clearly assigned to the managing entity, government, communities and implementing organisations."],
      ["c42","Local Technical Capacity","Whether trained personnel are available within a practical distance to perform preventive maintenance, diagnose faults and undertake routine repairs."],
      ["c43","Spare-Parts and Service Infrastructure","Whether replacement components and repair services are affordable and obtainable within a workable time, including at rural sites distant from urban suppliers."],
      ["c44","Monitoring, Evaluation and Learning","Whether the managing organisation records performance, obtains user feedback, documents failures and uses those records to improve practice after donor reporting ends."],
      ["c45","Financial Management Accountability","Whether the managing entity collects revenue, keeps transparent accounts, maintains O&M reserves and reports financial information to stakeholders."]]
  },
  {
    id: "env", short: "Environment", title: "Environmental Appropriateness and Circularity subcriteria",
    intro: "Compare importance within environmental appropriateness and circularity across the full system lifecycle.",
    items: [
      ["c51","Solar Resource and Site Suitability","Whether irradiation and local conditions support sustained generation, considering shading, roof condition, orientation and flood exposure."],
      ["c52","Lifecycle Environmental Impacts","Environmental effects of manufacture, transport, operation and end of life, including avoided kerosene or diesel and the embodied and transport impacts of imported equipment."],
      ["c53","Battery and E-Waste Management","Whether a workable route exists for collecting, storing and managing spent batteries and electronic equipment, including risks from unsafe lead-acid battery disposal."],
      ["c54","Land-Use and Ecosystem Sensitivity","Whether ground-mounted systems compete with agriculture, customary land uses or sensitive ecosystems; rooftop and ground-mounted systems have different land implications."]]
  },
  {
    id: "policy", short: "Policy", title: "Policy and Regulatory Alignment subcriteria",
    intro: "Compare importance within policy and regulatory alignment, including approvals, standards and institutional responsibilities.",
    items: [
      ["c61","Licensing and Permitting Fit","Whether the regulatory route is clear and proportionate, including applicable generation licences, exemptions and environmental permissions."],
      ["c62","Standards and Certification Compliance","Whether equipment and installation practice meet applicable standards and whether compliance and installer competence can be verified."],
      ["c63","Alignment with National Energy Priorities","Whether the project is consistent with the National Energy Policy, SE4ALL commitments and Malawi 2063, including implementation and budget alignment."],
      ["c64","Institutional Coordination and Reporting","Whether MERA, the Department of Energy, councils and environmental authorities coordinate effectively and whether project information enters national reporting systems."]]
  }
];

const MODULES_BY_STAKEHOLDER = {
  government: ["org","env","policy"], academia: ["tech","env","policy"],
  ngo: ["econ","social","org"], private: ["tech","econ"], community: ["social","org"]
};

const STEPS = [{id:"intro", short:"Start", title:"Instructions and profile"}, ...BLOCKS, {id:"submit", short:"Submit", title:"Final review"}];
const RI = { 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24 };

const blankState = () => ({
  step: 0,
  startedAt: new Date().toISOString(),
  consent: "",
  profile: {respondent_code:"", stakeholder_group:"", organisation:"", job_role:"", energy_experience:"", sector_involvement:"", decision_role:"", time_commitment:"", conflict_interest:"", ahp_familiarity:"", district:""},
  answers: {},
  comments: "",
  submitted: false
});

let state = loadState();
let validationMessage = "";
const screen = document.getElementById("screen");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.profile && saved.answers ? {...blankState(), ...saved} : blankState();
  } catch (_) { return blankState(); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const el = document.getElementById("saveState");
  el.textContent = "Draft saved on this device";
  window.setTimeout(() => { el.textContent = "Responses save automatically"; }, 1300);
}

function pairKey(blockId, i, j) { return `${blockId}_${i+1}_${j+1}`; }

function pairsFor(block) {
  const pairs = [];
  for (let i=0; i<block.items.length; i++) {
    for (let j=i+1; j<block.items.length; j++) pairs.push({i,j,key:pairKey(block.id,i,j)});
  }
  return pairs;
}

function numericAnswer(key) {
  const code = state.answers[key];
  if (!code) return null;
  if (code === "eq") return 1;
  const modern = /^([ab])([2-9])$/.exec(code);
  if (modern) return modern[1] === "a" ? Number(modern[2]) : 1/Number(modern[2]);
  const legacy = /^([np])([2-9])$/.exec(code);
  if (legacy) return legacy[1] === "p" ? Number(legacy[2]) : 1/Number(legacy[2]);
  return null;
}

function applicableBlocks() {
  const assigned = MODULES_BY_STAKEHOLDER[state.profile.stakeholder_group] || [];
  return [BLOCKS[0], ...BLOCKS.slice(1).filter(b => assigned.includes(b.id))];
}

function visibleStepIndices() {
  const indices=[0,1];
  for (let i=1;i<BLOCKS.length;i++) if (applicableBlocks().some(b=>b.id===BLOCKS[i].id)) indices.push(i+1);
  indices.push(STEPS.length-1);
  return [...new Set(indices)];
}

function buildPartialMatrix(block) {
  const n = block.items.length;
  const matrix = Array.from({length:n}, (_,i) => Array.from({length:n},(_,j)=> i===j ? 1 : null));
  for (const p of pairsFor(block)) {
    const v = numericAnswer(p.key);
    if (v !== null) { matrix[p.i][p.j]=v; matrix[p.j][p.i]=1/v; }
  }
  return matrix;
}

function crForMatrix(matrix) {
  const n=matrix.length;
  const gm=matrix.map(row=>Math.pow(row.reduce((a,b)=>a*b,1),1/n));
  const sum=gm.reduce((a,b)=>a+b,0);
  const weights=gm.map(x=>x/sum);
  const lambda=matrix.map((row,i)=>row.reduce((s,aij,j)=>s+aij*weights[j],0)/weights[i]);
  const lambdaMax=lambda.reduce((a,b)=>a+b,0)/n;
  const ci=(lambdaMax-n)/(n-1);
  return {weights,lambdaMax,ci,cr:Math.max(0,ci/(RI[n]||1))};
}

function analyseMatrix(block) {
  const n = block.items.length;
  const pairs = pairsFor(block);
  const answered = pairs.filter(p => numericAnswer(p.key) !== null).length;
  const matrix = buildPartialMatrix(block);
  const triads = [];
  for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) for (let k=j+1;k<n;k++) {
    if (matrix[i][j] && matrix[j][k] && matrix[i][k]) {
      const implied = matrix[i][j] * matrix[j][k];
      const observed = matrix[i][k];
      const factor = Math.max(implied/observed, observed/implied);
      triads.push({i,j,k,factor});
    }
  }
  const worstTriad = triads.sort((a,b)=>b.factor-a.factor)[0] || null;
  if (answered < pairs.length) return {complete:false, answered, total:pairs.length, worstTriad, matrix};

  const {weights,lambdaMax,ci,cr}=crForMatrix(matrix);
  const mismatches = pairs.map(p => {
    const observed = matrix[p.i][p.j];
    const implied = weights[p.i]/weights[p.j];
    const revised=matrix.map(row=>[...row]);
    revised[p.i][p.j]=implied; revised[p.j][p.i]=1/implied;
    const revisedCr=crForMatrix(revised).cr;
    return {...p, factor:Math.max(observed/implied, implied/observed), revisedCr, crReduction:cr-revisedCr};
  }).sort((a,b)=>b.crReduction-a.crReduction || b.factor-a.factor);
  return {complete:true, answered, total:pairs.length, matrix, weights, lambdaMax, ci, cr, worstPair:mismatches[0], worstTriad};
}

function blockPassed(block) {
  const a = analyseMatrix(block);
  return a.complete && a.cr <= CR_LIMIT;
}

function eligibilityStatus() {
  const p=state.profile;
  const answered=[p.energy_experience,p.sector_involvement,p.decision_role,p.time_commitment,p.conflict_interest].every(Boolean);
  if (!answered) return {decided:false,eligible:false,reason:"Complete the eligibility questions."};
  if (p.energy_experience === "lt2") return {decided:true,eligible:false,reason:"Paper Two requires at least two years of relevant off-grid solar PV experience."};
  if (p.sector_involvement !== "yes") return {decided:true,eligible:false,reason:"Eligible respondents must have current or recent involvement in standalone solar PV design, implementation, regulation, financing or governance."};
  if (p.decision_role !== "yes") return {decided:true,eligible:false,reason:"Eligible respondents must hold a decision-making or advisory role relevant to the sector."};
  if (p.time_commitment !== "yes") return {decided:true,eligible:false,reason:"The protocol requires sufficient time to complete the assigned comparison modules."};
  if (p.conflict_interest === "yes") return {decided:true,eligible:false,reason:"The protocol excludes respondents with a relevant project-level conflict of interest."};
  return {decided:true,eligible:true,reason:"Eligibility requirements are satisfied."};
}

function introValid() {
  const p=state.profile;
  return state.consent === "yes" && eligibilityStatus().eligible && p.respondent_code.trim() && p.stakeholder_group && p.job_role.trim() && p.ahp_familiarity;
}

function maxUnlockedPosition() {
  if (!introValid()) return 0;
  let unlocked=1;
  for (const block of applicableBlocks()) {
    if (blockPassed(block)) unlocked += 1;
    else break;
  }
  return Math.min(unlocked,visibleStepIndices().length-1);
}

function completedComparisons() {
  return Object.values(state.answers).filter(Boolean).length;
}

function overallPercent() {
  const profilePart = introValid() ? 8 : 0;
  const keys=new Set(applicableBlocks().flatMap(b=>pairsFor(b).map(p=>p.key)));
  const completed=[...keys].filter(k=>numericAnswer(k)!==null).length;
  const comparisonPart = keys.size ? completed/keys.size*84 : 0;
  const submitPart = state.submitted ? 8 : 0;
  return Math.round(Math.min(100, profilePart + comparisonPart + submitPart));
}

function renderNav() {
  const nav=document.getElementById("stepNav");
  const visible=visibleStepIndices(), unlocked=maxUnlockedPosition();
  nav.innerHTML=visible.map((absolute,position)=>{
    const step=STEPS[absolute];
    const complete = absolute===0 ? introValid() : absolute<=BLOCKS.length ? blockPassed(BLOCKS[absolute-1]) : state.submitted;
    return `<button class="nav-step ${absolute===state.step?'active':''}" data-step="${absolute}" ${position>unlocked?'disabled':''} aria-current="${absolute===state.step?'step':'false'}">
      <span class="nav-index">${position+1}</span><span class="nav-label">${escapeHtml(step.short)}</span><span class="nav-check">${complete?'✓':''}</span>
    </button>`;
  }).join("");
  nav.querySelectorAll("button:not([disabled])").forEach(btn=>btn.addEventListener("click",()=>{
    collectVisibleFields(); state.step=Number(btn.dataset.step); validationMessage=""; saveState(); render(); window.scrollTo({top:0,behavior:"smooth"});
  }));
  const pct=overallPercent();
  document.getElementById("completionValue").textContent=`${pct}%`;
  document.getElementById("completionRing").style.background=`radial-gradient(circle at center, white 62%, transparent 64%), conic-gradient(var(--teal) ${pct*3.6}deg, #dde8e9 0deg)`;
  document.getElementById("overallProgress").style.width=`${pct}%`;
}

function renderIntro() {
  const p=state.profile;
  return `<div class="workspace-header">
    <p class="section-kicker">Before you begin</p>
    <h1>Make each comparison as an expert judgement</h1>
    <p class="lead">This questionnaire estimates the relative importance of sustainability criteria for standalone solar photovoltaic projects in Malawi. Completion normally takes 45–60 minutes.</p>
  </div>
  <div class="instruction-grid">
    <article class="info-card"><h2>How to compare</h2><ul>
      <li>Judge long-term importance, not present performance or ease of measurement.</li>
      <li>First identify whether A or B is more important, or whether they are equal.</li>
      <li>Equal importance is recorded as 1. If one term is more important, rate the strength from 2 to 9.</li>
      <li>The reverse entry is calculated automatically. For example, A = 5 relative to B means B = 1/5 relative to A.</li>
      <li>Select the ? beside any term to read its Paper Two definition before judging it.</li>
    </ul></article>
    <article class="info-card"><h2>What the consistency feedback means</h2><p>Formal CR requires every comparison in a section. Before then, the page checks completed three-item cycles and warns when they conflict. Once the matrix is complete, CR updates instantly. CR ≤ 0.10 is required to continue.</p></article>
    <article class="info-card example-card"><h2>Worked example</h2><p>If Technical Performance is strongly more important than Environmental Appropriateness, select Technical Performance and intensity 5. The webpage records the reverse comparison automatically as 1/5.</p></article>
    <article class="info-card"><h2>How to respond to a warning</h2><p>Read the named comparisons again and look for an unintended logical cycle. Correct an accidental or misunderstood response. Do not alter a considered judgement solely to force CR below the threshold.</p></article>
  </div>
  <div class="consent-box">
    <h2>Voluntary participation</h2>
    <p>Your responses will be analysed in aggregate. You may stop before submission. A draft is retained only in this browser until you submit or clear it.</p>
    <label class="consent-option"><input type="radio" name="consent" value="yes" ${state.consent==='yes'?'checked':''}> <span>I have read the information and consent to participate.</span></label>
    <label class="consent-option"><input type="radio" name="consent" value="no" ${state.consent==='no'?'checked':''}> <span>I do not consent.</span></label>
  </div>
  ${state.consent==='no'?'<p class="validation-summary">You have chosen not to participate. Close the page or change the selection if this was accidental.</p>':''}
  <div class="eligibility-panel">
    <p class="section-kicker">Eligibility screening</p>
    <h2>Paper Two respondent requirements</h2>
    <p>Proceed only if you have at least two years of relevant experience, current or recent off-grid solar involvement, a decision-making or advisory role, enough time for your assigned modules, and no relevant project-level conflict.</p>
    <div class="field-grid">
      ${selectField("energy_experience","Relevant off-grid solar PV experience",p.energy_experience,[["","Select one"],["lt2","Fewer than 2 years"],["2_4","2–4 years"],["5_9","5–9 years"],["10_14","10–14 years"],["15plus","15 years or more"]],true)}
      ${selectField("sector_involvement","Current or recent involvement in standalone solar PV design, implementation, regulation, financing or governance",p.sector_involvement,[["","Select one"],["yes","Yes"],["no","No"]],true)}
      ${selectField("decision_role","Do you hold a relevant decision-making or advisory role?",p.decision_role,[["","Select one"],["yes","Yes"],["no","No"]],true)}
      ${selectField("time_commitment","Can you commit enough time to complete the assigned modules?",p.time_commitment,[["","Select one"],["yes","Yes"],["no","No"]],true)}
      ${selectField("conflict_interest","Are you currently tendering for, supplying, or otherwise materially interested in a specific project being evaluated through this study?",p.conflict_interest,[["","Select one"],["no","No"],["yes","Yes"]],true)}
    </div>
    ${eligibilityNotice()}
  </div>
  <div class="field-grid" style="margin-top:1.4rem">
    ${field("respondent_code","Respondent code",p.respondent_code,"Use the code assigned by the research team; do not enter your name.",true)}
    ${selectField("stakeholder_group","Stakeholder group",p.stakeholder_group,[["","Select one"],["government","Government or regulatory body"],["academia","Academic or research institution"],["ngo","NGO or development partner"],["private","Private-sector actor"],["community","Community representative"]],true)}
    ${field("organisation","Organisation or institution",p.organisation,"Optional; leave blank if disclosure could identify you.",false)}
    ${field("job_role","Professional role or area of responsibility",p.job_role,"Do not enter a personal name.",true)}
    ${selectField("ahp_familiarity","Familiarity with AHP",p.ahp_familiarity,[["","Select one"],["none","No prior familiarity"],["basic","Basic familiarity"],["used","Have used AHP before"],["expert","Advanced or expert experience"]],true)}
    ${field("district","District or principal area of work",p.district,"Optional.",false)}
  </div>
  ${p.stakeholder_group?`<div class="module-assignment"><strong>Your assigned modules:</strong> Sustainability dimensions, ${applicableBlocks().slice(1).map(b=>escapeHtml(b.title)).join(", ")}.</div>`:""}
  ${validationMessage?`<p class="validation-summary" role="alert">${escapeHtml(validationMessage)}</p>`:""}`;
}

function eligibilityNotice() {
  const e=eligibilityStatus();
  if (!e.decided) return '<p class="eligibility-status neutral">Complete all five screening questions.</p>';
  return `<p class="eligibility-status ${e.eligible?'eligible':'ineligible'}"><strong>${e.eligible?'Eligible to continue':'Not eligible for this questionnaire'}.</strong> ${escapeHtml(e.reason)}</p>`;
}

function field(name,label,value,hint,required,type="text") {
  return `<div class="field"><label class="${required?'required':''}" for="${name}">${escapeHtml(label)}</label><input id="${name}" name="${name}" type="${type}" value="${escapeAttr(value)}" ${required?'required':''}>${hint?`<span class="hint">${escapeHtml(hint)}</span>`:''}</div>`;
}

function selectField(name,label,value,options,required) {
  return `<div class="field"><label class="${required?'required':''}" for="${name}">${escapeHtml(label)}</label><select id="${name}" name="${name}" ${required?'required':''}>${options.map(([v,l])=>`<option value="${escapeAttr(v)}" ${v===value?'selected':''}>${escapeHtml(l)}</option>`).join('')}</select></div>`;
}

function triadText(block, triad) {
  if (!triad) return "No completed three-item cycle is available yet.";
  const names=[triad.i,triad.j,triad.k].map(i=>block.items[i][1]);
  if (triad.factor <= 2) return `The completed three-item comparisons are reasonably coherent. Largest cycle mismatch: ${triad.factor.toFixed(2)}×.`;
  return `Preliminary warning: review the comparisons among ${names.join(", ")}. Their implied cycle differs by ${triad.factor.toFixed(2)}×. This is an early diagnostic, not the formal CR.`;
}

function renderFeedback(block, a) {
  if (!a.complete) {
    const warn=a.worstTriad && a.worstTriad.factor>2;
    return `<section class="feedback-panel ${warn?'partial-warning':''}" aria-live="polite">
      <div class="cr-value"><strong>—</strong><span>Formal CR pending</span></div>
      <div class="feedback-copy"><h2>${a.total-a.answered} comparison${a.total-a.answered===1?'':'s'} still required</h2>
        <p>Formal CR is not mathematically interpretable until this matrix is complete.</p>
        <p class="diagnostic">${escapeHtml(triadText(block,a.worstTriad))}</p>
      </div></section>`;
  }
  const pass=a.cr<=CR_LIMIT;
  const pair=a.worstPair;
  const pairName=`${block.items[pair.i][1]} versus ${block.items[pair.j][1]}`;
  return `<section class="feedback-panel ${pass?'pass':'fail'}" aria-live="assertive">
    <div class="cr-value"><strong>${a.cr.toFixed(3)}</strong><span>Consistency ratio</span></div>
    <div class="feedback-copy"><h2>${pass?'Consistency check passed':'Consistency check not passed'}</h2>
      <p>${pass?'CR is within the acceptable maximum of 0.10. You may continue.':'CR exceeds 0.10, meaning that some priorities conflict with the pattern of the complete set.'}</p>
      <p class="diagnostic">Largest mismatch: ${escapeHtml(pairName)} (${pair.factor.toFixed(2)}× from the ratio implied by the other judgements).</p>
      ${pass?'':`<p>Re-read that comparison and comparisons involving the same two items. Look for an accidental reversal, an extreme value chosen in error, or a cycle such as A &gt; B, B &gt; C and C &gt; A. Revise only where the new answer better represents your judgement.</p><button class="review-problem" type="button" data-review-problem>Review highlighted comparison</button>`}
      ${renderWeights(block,a.weights)}
    </div></section>`;
}

function renderWeights(block, weights) {
  if (!weights) return "";
  const max=Math.max(...weights);
  return `<div class="weights"><h2>Current local priorities</h2>${weights.map((w,i)=>`<div class="weight-row"><span>${escapeHtml(block.items[i][1])}</span><div class="weight-track"><span style="width:${(w/max*100).toFixed(1)}%"></span></div><span class="weight-number">${(w*100).toFixed(1)}%</span></div>`).join('')}</div>`;
}

function renderBlock(block, index) {
  const pairs=pairsFor(block);
  const a=analyseMatrix(block);
  return `<div class="workspace-header"><p class="section-kicker">Section ${index+1} of ${BLOCKS.length}</p><h1>${escapeHtml(block.title)}</h1><p class="lead">${escapeHtml(block.intro)}</p></div>
    <div class="matrix-topline"><p><strong>Remember:</strong> A is named first. Select a reciprocal value when A is less important than B.</p><span class="counter">${a.answered} / ${a.total} answered</span></div>
    ${renderFeedback(block,a)}
    <div class="comparison-list">${pairs.map((p,k)=>renderComparison(block,p,k,a)).join('')}</div>
    ${validationMessage?`<p class="validation-summary" role="alert">${escapeHtml(validationMessage)}</p>`:""}`;
}

function decodeAnswer(code) {
  if (code === "eq") return {direction:"equal",intensity:"1"};
  let m=/^([ab])([2-9])$/.exec(code||"");
  if (m) return {direction:m[1],intensity:m[2]};
  m=/^([np])([2-9])$/.exec(code||"");
  if (m) return {direction:m[1]==="p"?"a":"b",intensity:m[2]};
  return {direction:"",intensity:""};
}

function termHelp(item,side) {
  return `<span class="term-with-help"><span><strong>${side}</strong> · ${escapeHtml(item[1])}</span><details class="term-help"><summary aria-label="Explain ${escapeAttr(item[1])}">?</summary><div><strong>${escapeHtml(item[1])}</strong><p>${escapeHtml(item[2])}</p></div></details></span>`;
}

function renderComparison(block,p,k,analysis) {
  const itemA=block.items[p.i], itemB=block.items[p.j], selected=state.answers[p.key]||"", decoded=decodeAnswer(selected);
  const problem=analysis.complete && analysis.cr>CR_LIMIT && analysis.worstPair?.key===p.key;
  const missing=!selected;
  return `<article class="comparison-card ${problem?'inconsistent':''} ${missing?'missing-response':''}" ${problem?'id="problem-comparison"':''}>
    <div class="comparison-heading"><span class="comparison-number">Comparison ${k+1}</span>${problem?'<span class="problem-badge">Largest CR sensitivity</span>':missing?'<span class="missing-badge">Response required</span>':''}</div>
    <p class="comparison-question">Which criterion is more important for this assessment, and by what intensity?</p>
    <div class="term-row">${termHelp(itemA,"A")}${termHelp(itemB,"B")}</div>
    <div class="judgement-controls">
      <label>More important criterion<select data-direction="${p.key}" aria-label="More important criterion for comparison ${k+1}">
        <option value="">Select A, B or equal</option><option value="a" ${decoded.direction==='a'?'selected':''}>A — ${escapeHtml(itemA[1])}</option><option value="equal" ${decoded.direction==='equal'?'selected':''}>1 — Equal importance</option><option value="b" ${decoded.direction==='b'?'selected':''}>B — ${escapeHtml(itemB[1])}</option>
      </select></label>
      <label>Intensity on the 1–9 scale<select data-intensity="${p.key}" ${decoded.direction==='equal'?'disabled':''} aria-label="Importance intensity for comparison ${k+1}">
        <option value="">${decoded.direction==='equal'?'1 — Equal importance':'Select intensity'}</option>${INTENSITIES.map(([v,l])=>`<option value="${v}" ${String(v)===decoded.intensity?'selected':''}>${v} — ${escapeHtml(l)}</option>`).join('')}
      </select></label>
    </div>
    <p class="reciprocal-note">${decoded.direction==='a'?`Recorded as ${decoded.intensity || '…'} for A relative to B; the reverse will be 1/${decoded.intensity || '…'}.`:decoded.direction==='b'?`Recorded as ${decoded.intensity || '…'} for B relative to A; A relative to B will be 1/${decoded.intensity || '…'}.`:decoded.direction==='equal'?'Recorded as 1 in both directions.':'Select the more important criterion first; the reciprocal is calculated automatically.'}</p>
  </article>`;
}

function renderSubmit() {
  const assigned=applicableBlocks(), allPass=assigned.every(blockPassed);
  return `<div class="workspace-header"><p class="section-kicker">Final review</p><h1>Review and submit your judgements</h1><p class="lead">All seven matrices must be complete and have CR ≤ 0.10. Passing the test indicates coherence; it does not make a judgement objectively correct.</p></div>
    <div class="submission-card ${allPass?'success':''}"><h2>${allPass?'All consistency checks passed':'Some sections still require attention'}</h2>
      ${assigned.map(b=>{const a=analyseMatrix(b);return `<p><strong>${escapeHtml(b.short)}:</strong> ${a.complete?`CR = ${a.cr.toFixed(3)} ${a.cr<=CR_LIMIT?'✓':'— revise'}`:`${a.answered}/${a.total} answered`}</p>`}).join('')}
    </div>
    <div class="field full"><label for="comments">Comments on the criteria, instructions or comparisons</label><textarea id="comments" name="comments" placeholder="Optional: explain any ambiguous or missing criterion.">${escapeHtml(state.comments)}</textarea></div>
    <p class="hint">When you submit, the deployed Netlify site will store the response in its Forms area. You can also download a JSON research record as a backup.</p>
    <a href="#" id="downloadBackup" class="download-link">Download my response record</a>
    ${state.submitted?'<div class="submission-card success" role="status"><h2>Response submitted</h2><p>Thank you. This response has been recorded.</p><button class="button secondary" id="newResponse" type="button">Start a new response</button></div>':''}
    ${validationMessage?`<p class="validation-summary" role="alert">${escapeHtml(validationMessage)}</p>`:""}`;
}

function render() {
  renderNav();
  if (state.step===0) screen.innerHTML=renderIntro();
  else if (state.step<=BLOCKS.length) screen.innerHTML=renderBlock(BLOCKS[state.step-1],state.step-1);
  else screen.innerHTML=renderSubmit();
  wireScreen();
  backButton.disabled=visibleStepIndices().indexOf(state.step)<=0 || state.submitted;
  nextButton.textContent=state.step===STEPS.length-1 ? (state.submitted?"Submitted":"Submit response") : "Continue";
  nextButton.disabled=state.submitted;
}

function wireScreen() {
  if (state.step===0) {
    screen.querySelectorAll("input,select").forEach(el=>el.addEventListener("change",()=>{
      collectVisibleFields(); saveState(); validationMessage=""; render();
    }));
    screen.querySelectorAll('input[type="text"]').forEach(el=>el.addEventListener("input",()=>{state.profile[el.name]=el.value;saveState();}));
  } else if (state.step<=BLOCKS.length) {
    screen.querySelectorAll("[data-direction]").forEach(el=>el.addEventListener("change",()=>updateJudgement(el.dataset.direction,"direction",el.value)));
    screen.querySelectorAll("[data-intensity]").forEach(el=>el.addEventListener("change",()=>updateJudgement(el.dataset.intensity,"intensity",el.value)));
    screen.querySelector("[data-review-problem]")?.addEventListener("click",()=>document.getElementById("problem-comparison")?.scrollIntoView({behavior:"smooth",block:"center"}));
  } else {
    document.getElementById("comments")?.addEventListener("input",e=>{state.comments=e.target.value;saveState();});
    document.getElementById("downloadBackup")?.addEventListener("click",e=>{e.preventDefault();downloadBackup();});
    document.getElementById("newResponse")?.addEventListener("click",startNewResponse);
  }
}

function updateJudgement(key,part,value) {
  const directionControl=screen.querySelector(`[data-direction="${key}"]`);
  const intensityControl=screen.querySelector(`[data-intensity="${key}"]`);
  const current={
    direction: part==="direction" ? value : (directionControl?.value || decodeAnswer(state.answers[key]||"").direction),
    intensity: part==="intensity" ? value : (intensityControl?.value || decodeAnswer(state.answers[key]||"").intensity)
  };
  if (part==="direction" && value==="equal") current.intensity="1";
  if (part==="direction" && value!=="equal" && current.intensity==="1") current.intensity="";
  if (!current.direction || (current.direction!=="equal" && !current.intensity)) {
    delete state.answers[key];
    if (intensityControl) intensityControl.disabled=!current.direction || current.direction==="equal";
    saveState();
    return;
  }
  state.answers[key]=current.direction==="equal"?"eq":`${current.direction}${current.intensity}`;
  validationMessage=""; saveState(); render();
}

function collectVisibleFields() {
  if (state.step===0) {
    const consent=screen.querySelector('input[name="consent"]:checked');
    state.consent=consent?.value||state.consent;
    Object.keys(state.profile).forEach(k=>{const el=document.getElementById(k);if(el)state.profile[k]=el.value;});
  }
  if (state.step===STEPS.length-1) { const c=document.getElementById("comments"); if(c) state.comments=c.value; }
}

backButton.addEventListener("click",()=>{collectVisibleFields();const visible=visibleStepIndices(),pos=visible.indexOf(state.step);state.step=visible[Math.max(0,pos-1)];validationMessage="";saveState();render();window.scrollTo({top:0,behavior:"smooth"});});
nextButton.addEventListener("click",async()=>{
  collectVisibleFields();
  if (state.step===0) {
    if (!introValid()) {validationMessage="Please provide consent and complete every required profile field before continuing.";render();return;}
  } else if (state.step<=BLOCKS.length) {
    const block=BLOCKS[state.step-1], a=analyseMatrix(block);
    if (!a.complete) {validationMessage=`Complete the remaining ${a.total-a.answered} comparison${a.total-a.answered===1?'':'s'} before continuing.`;render();return;}
    if (a.cr>CR_LIMIT) {validationMessage=`The section cannot be completed while CR is ${a.cr.toFixed(3)}. Review the diagnostic above and revise the relevant comparisons.`;render();return;}
  } else { await submitSurvey(); return; }
  const visible=visibleStepIndices(),pos=visible.indexOf(state.step);
  state.step=visible[Math.min(visible.length-1,pos+1)];validationMessage="";saveState();render();window.scrollTo({top:0,behavior:"smooth"});
});

document.getElementById("clearDraft").addEventListener("click",()=>{
  if (window.confirm("Clear every response saved on this device? This cannot be undone.")) {localStorage.removeItem(STORAGE_KEY);state=blankState();validationMessage="";render();}
});

function researchRecord() {
  const analyses={};
  for (const block of applicableBlocks()) {
    const a=analyseMatrix(block);
    analyses[block.id]={cr:a.complete?a.cr:null, lambdaMax:a.complete?a.lambdaMax:null, ci:a.complete?a.ci:null, weights:a.complete?Object.fromEntries(block.items.map((item,i)=>[item[0],a.weights[i]])):null};
  }
  return {instrumentVersion:VERSION, startedAt:state.startedAt, submittedAt:new Date().toISOString(), profile:state.profile, assignedModules:applicableBlocks().map(b=>b.id), answers:state.answers, analyses, comments:state.comments};
}

function startNewResponse() {
  if (!window.confirm("Start a new questionnaire? The submitted response will remain in Netlify Forms, but the saved answers on this device will be cleared.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state=blankState();
  validationMessage="";
  render();
  window.scrollTo({top:0,behavior:"smooth"});
}

function downloadBackup() {
  const blob=new Blob([JSON.stringify(researchRecord(),null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url;a.download=`AHP_${safeFilename(state.profile.respondent_code||'response')}.json`;a.click();URL.revokeObjectURL(url);
}

async function submitSurvey() {
  if (!applicableBlocks().every(blockPassed)) {validationMessage="Return to any assigned section without a passed consistency check before submitting.";render();return;}
  nextButton.disabled=true;nextButton.textContent="Submitting…";
  const record=researchRecord();
  const submissionId=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload={
    "form-name":"ahp-survey", consent:state.consent, ...state.profile, comments:state.comments,
    assigned_modules:record.assignedModules.join(","),
    responses_json:JSON.stringify(record.answers),
    weights_json:JSON.stringify(Object.fromEntries(Object.entries(record.analyses).map(([k,v])=>[k,v.weights]))),
    cr_json:JSON.stringify(Object.fromEntries(Object.entries(record.analyses).map(([k,v])=>[k,v.cr]))),
    started_at:record.startedAt, submitted_at:record.submittedAt, instrument_version:VERSION, submission_id:submissionId
  };
  try {
    const netlifyForm=document.getElementById("netlifySurveyForm");
    if(!netlifyForm)throw new Error("the deployed Netlify form schema is missing");
    for(const [name,rawValue] of Object.entries(payload)){
      const control=netlifyForm.elements.namedItem(name);
      if(control)control.value=rawValue==null?"":String(rawValue);
    }
    const formData=new FormData(netlifyForm);
    const encoded=new URLSearchParams();
    for(const [name,formValue] of formData.entries())encoded.append(name,String(formValue));
    if(!encoded.get("responses_json")||!encoded.get("cr_json")||!encoded.get("submission_id"))throw new Error("the submission payload failed its local completeness check");
    const response=await fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:encoded.toString()});
    if (!response.ok) {const detail=await response.text().catch(()=>"");throw new Error(`Netlify returned ${response.status}${detail?`: ${detail.slice(0,120)}`:""}`);}
    state.submitted=true;saveState();validationMessage="";render();window.scrollTo({top:0,behavior:"smooth"});
  } catch (error) {
    validationMessage=`The response could not be submitted (${error.message}). Confirm that the form “ahp-survey” appears in Netlify Forms and that the current package was redeployed after Forms detection was enabled. You may download the response record as a backup.`;
    nextButton.disabled=false;nextButton.textContent="Submit response";render();
  }
}

function safeFilename(v){return String(v).replace(/[^a-z0-9_-]+/gi,"_").slice(0,60);}
function escapeHtml(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function escapeAttr(v){return escapeHtml(v);}

render();
