"use strict";
const RI={3:.58,4:.90,5:1.12,6:1.24};
let lastResults=null;
let refreshing=false;
let graphicMode="unweighted";

document.getElementById("csvFile").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{const rows=parseCSV(await file.text()); analyseRows(rows,{source:"CSV backup"});}
  catch(err){document.getElementById("ownerStatus").innerHTML=`<span class="flag warn">Import failed</span> ${escapeHtml(err.message)}`;}
});
document.getElementById("exportResults").addEventListener("click",exportResults);
document.getElementById("refreshLive").addEventListener("click",loadLiveSubmissions);
document.getElementById("showUnweighted").addEventListener("click",()=>{graphicMode="unweighted";renderFrameworkGraphic();});
document.getElementById("showWeighted").addEventListener("click",()=>{graphicMode="weighted";renderFrameworkGraphic();});
document.getElementById("downloadFrameworkSvg").addEventListener("click",downloadFrameworkSvg);
document.getElementById("downloadFrameworkPng").addEventListener("click",downloadFrameworkPng);
renderFrameworkGraphic();
loadLiveSubmissions();
setInterval(loadLiveSubmissions,15000);

async function loadLiveSubmissions(){
  if(refreshing)return;
  refreshing=true;
  const button=document.getElementById("refreshLive");
  button.disabled=true;
  try{
    const response=await fetch("/.netlify/functions/survey-submissions",{credentials:"same-origin",headers:{Accept:"application/json"}});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.setup||payload.detail||payload.error||`Live feed returned ${response.status}.`);
    const rows=(payload.submissions||[]).map(item=>({...item.data,__submission_id:item.id,__created_at:item.created_at}));
    const updated=new Date(payload.retrievedAt||Date.now());
    document.getElementById("liveDetail").textContent=`Last checked ${updated.toLocaleTimeString()} · refreshes every 15 seconds`;
    if(!rows.length){
      lastResults=null;
      document.getElementById("exportResults").disabled=true;
      document.getElementById("ownerStatus").innerHTML='<span class="flag ok">Connected</span> No verified submissions are currently available.';
      document.getElementById("ownerResults").innerHTML='<div class="result-block missing"><h2>No verified forms available</h2><p>The dashboard is connected. If a response was just submitted, check Netlify Forms → Spam submissions and mark a genuine response as verified. Otherwise, a completed verified response will appear here automatically.</p></div>';
      return;
    }
    analyseRows(rows,{source:"Live Netlify Forms",retrievedAt:payload.retrievedAt,truncated:payload.truncated});
  }catch(error){
    document.getElementById("liveDetail").textContent="Live connection unavailable";
    document.getElementById("ownerStatus").innerHTML=`<span class="flag warn">Connection problem</span> ${escapeHtml(error.message)} The CSV backup remains available below.`;
  }finally{
    refreshing=false;
    button.disabled=false;
  }
}

function parseCSV(text){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(quoted){if(c==='"'&&n==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(field);field="";}else if(c==='\n'){row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";}else field+=c;}
  if(field||row.length){row.push(field.replace(/\r$/,""));rows.push(row);}
  if(rows.length<2)throw new Error("The CSV contains no submission rows.");
  const headers=rows[0].map(h=>h.replace(/^\uFEFF/,"").trim());
  return rows.slice(1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
}
function field(row,name){const key=Object.keys(row).find(k=>k.toLowerCase()===name||k.toLowerCase().endsWith(`.${name}`));return key?row[key]:"";}
function jsonField(row,name){const v=field(row,name);if(!v)return null;try{return JSON.parse(v);}catch{return null;}}
function pairKey(id,i,j){return `${id}_${i+1}_${j+1}`;}
function pairs(block){const out=[];for(let i=0;i<block.items.length;i++)for(let j=i+1;j<block.items.length;j++)out.push({i,j,key:pairKey(block.id,i,j)});return out;}
function value(code){if(code==='eq')return 1;let m=/^([ab])([2-9])$/.exec(code||"");if(m)return m[1]==='a'?+m[2]:1/+m[2];m=/^([np])([2-9])$/.exec(code||"");return m?(m[1]==='p'?+m[2]:1/+m[2]):null;}
function matrixStats(matrix){const n=matrix.length,gm=matrix.map(r=>Math.pow(r.reduce((a,b)=>a*b,1),1/n)),sum=gm.reduce((a,b)=>a+b,0),weights=gm.map(x=>x/sum),lambda=matrix.map((r,i)=>r.reduce((s,a,j)=>s+a*weights[j],0)/weights[i]),lmax=lambda.reduce((a,b)=>a+b,0)/n,ci=(lmax-n)/(n-1),cr=Math.max(0,ci/(RI[n]||1));return{weights,cr,lmax,ci};}
function individualCr(block,answers){const n=block.items.length,m=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:null));for(const p of pairs(block)){const v=value(answers[p.key]);if(v===null)return null;m[p.i][p.j]=v;m[p.j][p.i]=1/v;}return matrixStats(m).cr;}
function aggregate(block,records){const ps=pairs(block),logs=Object.fromEntries(ps.map(p=>[p.key,[]]));let validMatrices=0;for(const r of records){const answers=r.answers||{},reported=r.cr?.[block.id],computed=individualCr(block,answers),cr=Number.isFinite(+reported)?+reported:computed;if(cr===null||cr>.10)continue;let complete=true;for(const p of ps)if(value(answers[p.key])===null)complete=false;if(!complete)continue;validMatrices++;for(const p of ps)logs[p.key].push(Math.log(value(answers[p.key])));}const coverage=ps.map(p=>({p,count:logs[p.key].length})),missing=coverage.filter(x=>x.count===0);if(missing.length)return{block,validMatrices,coverage,missing,complete:false,weights:null,cr:null};const n=block.items.length,m=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:null));for(const {p} of coverage){const arr=logs[p.key],v=Math.exp(arr.reduce((a,b)=>a+b,0)/arr.length);m[p.i][p.j]=v;m[p.j][p.i]=1/v;}return{block,validMatrices,coverage,missing:[],complete:true,...matrixStats(m)};}
function analyseRows(rows,meta={}){const records=rows.map(row=>({row,answers:jsonField(row,"responses_json"),cr:jsonField(row,"cr_json"),stakeholder:field(row,"stakeholder_group"),respondent:field(row,"respondent_code")||field(row,"respondent_id")||"Not supplied",organisation:field(row,"organisation")||field(row,"organization")||"Not supplied",submittedAt:field(row,"__created_at")})).filter(r=>r.answers);if(!records.length)throw new Error("No readable responses_json records were found.");const results=window.FRAMEWORK.map(b=>aggregate(b,records));const dim=results[0],dimensionWeight={};if(dim.complete)dim.block.items.forEach((x,i)=>dimensionWeight[x[0]]=dim.weights[i]);const rowsOut=[];for(const result of results.slice(1)){const dCode=result.block.code.toLowerCase();result.block.items.forEach((item,i)=>rowsOut.push({dimension:result.block.name,code:item[0],criterion:item[1],local:result.complete?result.weights[i]:null,global:result.complete&&dimensionWeight[dCode]!=null?result.weights[i]*dimensionWeight[dCode]:null,n:result.validMatrices,status:result.complete?"Calculated":"Missing data"}));}lastResults={records:records.length,generatedAt:new Date().toISOString(),results,criteria:rowsOut,recent:records.slice().sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt))).slice(0,10).map(r=>({respondent:r.respondent,stakeholder:r.stakeholder||"Not supplied",organisation:r.organisation,submittedAt:r.submittedAt}))};localStorage.setItem("ahpAggregatedFramework",JSON.stringify(lastResults));renderResults(lastResults);document.getElementById("exportResults").disabled=false;const label=meta.source||"Survey data";document.getElementById("ownerStatus").innerHTML=`<span class="flag ok">Updated</span> ${escapeHtml(label)}: ${records.length} readable submission${records.length===1?'':'s'}${meta.truncated?' (display limited to the newest 1,000)':''}.`;}
function renderResults(data){renderFrameworkGraphic();const flagged=data.results.filter(r=>!r.complete).length,validTotal=data.results.reduce((s,r)=>s+r.validMatrices,0),recent=data.recent||[];document.getElementById("ownerResults").innerHTML=`<div class="metric-grid"><div class="metric"><strong>${data.records}</strong>submissions</div><div class="metric"><strong>${data.results.length-flagged}/${data.results.length}</strong>weighted modules</div><div class="metric"><strong>${validTotal}</strong>valid matrices</div><div class="metric"><strong>${flagged}</strong>modules flagged</div></div>${recent.length?`<h2>Latest submitted forms</h2><div class="table-scroll"><table class="coverage-table recent-table"><thead><tr><th>Submitted</th><th>Respondent</th><th>Stakeholder group</th><th>Organisation</th></tr></thead><tbody>${recent.map(r=>`<tr><td>${r.submittedAt?escapeHtml(new Date(r.submittedAt).toLocaleString()):'CSV import'}</td><td>${escapeHtml(r.respondent)}</td><td>${escapeHtml(r.stakeholder)}</td><td>${escapeHtml(r.organisation)}</td></tr>`).join('')}</tbody></table></div>`:''}<h2>Coverage and group consistency</h2><div class="table-scroll"><table class="coverage-table"><thead><tr><th>Module</th><th>Valid matrices</th><th>Pair coverage</th><th>Group CR</th><th>Status</th></tr></thead><tbody>${data.results.map(r=>{const counts=r.coverage.map(x=>x.count),range=counts.length?`${Math.min(...counts)}–${Math.max(...counts)}`:"0";return`<tr><td>${escapeHtml(r.block.name)}</td><td>${r.validMatrices}</td><td>${range} per pair</td><td>${r.cr==null?'Not available':r.cr.toFixed(3)}</td><td><span class="flag ${r.complete?'ok':'warn'}">${r.complete?'Calculated':`${r.missing.length} pair${r.missing.length===1?'':'s'} missing`}</span></td></tr>`}).join('')}</tbody></table></div><h2 style="margin-top:1.4rem">Framework produced from expert input</h2>${data.results.map(r=>resultBlock(r,data.results[0])).join('')}`;}
function resultBlock(r,dim){const dimensionMap={tech:'d1',econ:'d2',social:'d3',org:'d4',env:'d5',policy:'d6'},dIndex=dim.block.items.findIndex(x=>x[0]===dimensionMap[r.block.id]),dWeight=r.block.id==='dim'?null:(dim.complete&&dIndex>=0?dim.weights[dIndex]:null);return `<section class="result-block ${r.complete?'':'missing'}"><h3>${escapeHtml(r.block.name)}</h3>${r.complete?`<p><span class="flag ok">Expert weights calculated</span> Group CR: ${r.cr.toFixed(3)}; valid matrices: ${r.validMatrices}.</p><div class="weights">${r.block.items.map((item,i)=>{const local=r.weights[i],global=r.block.id==='dim'?local:(dWeight==null?null:dWeight*local);return`<div class="weight-row"><span>${escapeHtml(item[1])}</span><div class="weight-track"><span style="width:${(local/Math.max(...r.weights)*100).toFixed(1)}%"></span></div><span class="weight-number">${(local*100).toFixed(1)}%${r.block.id==='dim'?'':global==null?' · global unavailable':` · G ${(global*100).toFixed(2)}%`}</span></div>`}).join('')}</div>`:`<p><span class="flag warn">No complete group result</span> ${r.missing.length?`No valid expert value was available for: ${r.missing.map(x=>`${r.block.items[x.p.i][1]} versus ${r.block.items[x.p.j][1]}`).join('; ')}.`:'No valid matrices were provided.'}</p>`}</section>`;}

function wrapSvgText(text,max=25){const words=String(text).split(/\s+/),lines=[];let line="";for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>max&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines.slice(0,3);}
function svgText(lines,x,y,opts={}){const anchor=opts.anchor||"middle",size=opts.size||17,weight=opts.weight||600,fill=opts.fill||"#092f38",gap=opts.gap||20;return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines.map((line,i)=>`<tspan x="${x}" dy="${i?gap:0}">${escapeXml(line)}</tspan>`).join("")}</text>`;}
function renderFrameworkGraphic(){
  const root=window.FRAMEWORK?.[0];if(!root)return;
  const width=1800,height=1010,colWidth=274,gap=18,startX=33,dimY=150,dimH=112,itemY=320,itemH=104,itemGap=24;
  const colors=["#176b87","#c76c17","#9c3f78","#5d4e9b","#23856d","#9a6730"];
  const dimResult=lastResults?.results?.[0],weighted=graphicMode==="weighted";
  let svg=`<svg id="frameworkSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" aria-labelledby="frameworkTitle frameworkDesc"><title id="frameworkTitle">Malawi standalone solar PV sustainability framework</title><desc id="frameworkDesc">A hierarchy with one goal, six sustainability dimensions and twenty-seven subcriteria.</desc><rect width="100%" height="100%" fill="#ffffff"/><style>.line{stroke:#8aa1a5;stroke-width:2;fill:none}.dim{stroke-width:2}.criterion{fill:#fff;stroke-width:2}.pending{fill:#687b80}.weight{font:700 15px Arial,Helvetica,sans-serif}</style>`;
  svg+=`<rect x="590" y="24" width="620" height="78" rx="16" fill="#092f38"/>${svgText(["Sustainable standalone solar PV projects in Malawi"],900,70,{size:24,weight:700,fill:"#ffffff"})}`;
  svg+=`<path class="line" d="M900 102 V126 M${startX+colWidth/2} 126 H${startX+5*(colWidth+gap)+colWidth/2}"/>`;
  root.items.forEach((dimension,index)=>{
    const block=window.FRAMEWORK[index+1],x=startX+index*(colWidth+gap),cx=x+colWidth/2,color=colors[index];
    const dimensionWeight=weighted&&dimResult?.complete?dimResult.weights[index]:null;
    const moduleResult=lastResults?.results?.[index+1];
    const titleLines=wrapSvgText(`${block.code} ${dimension[1]}`,26),spineX=x-10,branchY=dimY+dimH+24,lastItemCenter=itemY+(block.items.length-1)*(itemH+itemGap)+itemH/2;
    svg+=`<path class="line" d="M${cx} 126 V${dimY}"/><rect class="dim" x="${x}" y="${dimY}" width="${colWidth}" height="${dimH}" rx="13" fill="${color}" stroke="${color}"/>`;
    svg+=svgText(titleLines,cx,177,{size:17,weight:700,fill:"#ffffff",gap:19});
    svg+=svgText([dimensionWeight==null?(weighted?"Weight pending":"Unweighted"):`Weight ${(dimensionWeight*100).toFixed(1)}%`],cx,246,{size:14,weight:700,fill:dimensionWeight==null&&weighted?"#ffe0a3":"#ffffff"});
    svg+=`<path class="line" d="M${cx} ${dimY+dimH} V${branchY} H${spineX} V${lastItemCenter}"/>`;
    block.items.forEach((item,itemIndex)=>{
      const y=itemY+itemIndex*(itemH+itemGap),local=weighted&&moduleResult?.complete?moduleResult.weights[itemIndex]:null,global=local!=null&&dimensionWeight!=null?local*dimensionWeight:null;
      svg+=`<path class="line" d="M${spineX} ${y+itemH/2} H${x}"/><rect class="criterion" x="${x}" y="${y}" width="${colWidth}" height="${itemH}" rx="11" stroke="${color}"/>`;
      svg+=svgText(wrapSvgText(`${item[0].toUpperCase()} ${item[1]}`,28),cx,y+28,{size:15,weight:700,fill:"#092f38",gap:17});
      const label=!weighted?"Unweighted":local==null?"Weight pending":`Local ${(local*100).toFixed(1)}% · Global ${(global*100).toFixed(2)}%`;
      svg+=svgText([label],cx,y+88,{size:13,weight:700,fill:local==null?"#687b80":color});
    });
  });
  svg+=`<text x="40" y="985" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#526a70">${weighted?"Expert-weighted view: geometric aggregation of valid matrices with CR ≤ 0.10.":"Proposed source framework: weights are intentionally not assigned."}</text></svg>`;
  document.getElementById("frameworkGraphic").innerHTML=svg;
  document.getElementById("graphicStatus").textContent=weighted?(lastResults?"Showing the latest expert-weighted hierarchy; unavailable modules remain flagged.":"Expert-weighted view selected; weights will appear after valid submissions are available."):"Showing the complete proposed unweighted hierarchy.";
  document.getElementById("showUnweighted").classList.toggle("active",!weighted);
  document.getElementById("showWeighted").classList.toggle("active",weighted);
}
function frameworkSvgBlob(){const svg=document.getElementById("frameworkSvg");if(!svg)return null;return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`],{type:"image/svg+xml;charset=utf-8"});}
function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function downloadFrameworkSvg(){const blob=frameworkSvgBlob();if(blob)saveBlob(blob,`Malawi_Solar_PV_Framework_${graphicMode}.svg`);}
function downloadFrameworkPng(){const blob=frameworkSvgBlob();if(!blob)return;const url=URL.createObjectURL(blob),image=new Image();image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=3600;canvas.height=2020;const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);canvas.toBlob(out=>{if(out)saveBlob(out,`Malawi_Solar_PV_Framework_${graphicMode}_high_resolution.png`);},"image/png");};image.src=url;}
function exportResults(){if(!lastResults)return;const lines=[["Dimension","Code","Criterion","Local weight","Global weight","Valid matrices","Status"],...lastResults.criteria.map(r=>[r.dimension,r.code,r.criterion,r.local??"",r.global??"",r.n,r.status])];const csv=lines.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AHP_aggregated_framework.csv';a.click();URL.revokeObjectURL(url);}
function escapeHtml(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function escapeXml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));}
