"use strict";

function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));}
function pairs(items){const output=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)output.push([items[i],items[j]]);return output;}

const root=document.getElementById("questionnairePreview");
root.innerHTML=window.FRAMEWORK.map((block,index)=>{
  const comparisons=pairs(block.items);
  return `<section class="preview-block">
    <p class="section-kicker">${index===0?"Common module":`Specialist module ${index}`}</p>
    <h2>${escapeHtml(block.code)} ${escapeHtml(block.name)}</h2>
    <p>${escapeHtml(block.definition)}</p>
    <div class="preview-items">${block.items.map(item=>`<article class="preview-item"><strong>${escapeHtml(item[0].toUpperCase())} ${escapeHtml(item[1])}</strong><span>${escapeHtml(item[2])}</span></article>`).join("")}</div>
    <h3>${comparisons.length} pairwise comparisons</h3>
    <p>For each comparison, the respondent selects A, B or equal importance, then assigns an intensity from 2 to 9 when A or B is preferred. The reciprocal value is generated automatically.</p>
    <ol class="preview-comparisons">${comparisons.map(([a,b])=>`<li><strong>${escapeHtml(a[1])}</strong> compared with <strong>${escapeHtml(b[1])}</strong></li>`).join("")}</ol>
  </section>`;
}).join("");
