(function(root){
 'use strict';
 const text=value=>String(value??'').replace(/\r\n?/g,'\n').replace(/[\\`*_{}\[\]<>#|!]/g,'\\$&').replace(/\n/g,'\n\n');
 const line=value=>text(value).replace(/\s+/g,' ').trim();
 function fence(value,language){const content=String(value),runs=content.match(/`+/g)||[];const marks='`'.repeat(Math.max(3,...runs.map(s=>s.length+1)));return marks+language+'\n'+content+'\n'+marks;}
 function generate(papers,stages=[],date=new Date()){
  const list=[...papers].sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
  const out=['# M.I.D.A.S. literature library','','Material Identification and Debris Assimilation System','',`Exported: ${date.toISOString()}`,`Records: ${list.length}`,'','This snapshot includes the entire loaded library, regardless of search or filters. Summaries and metadata are team records, not independently verified publication details. Missing information is left unrecorded.',''];
  if(!list.length)out.push('The literature library is empty.');
  for(const [i,p] of list.entries()){
   out.push(`## ${i+1}. ${line(p.title||'Untitled')}`,'');
   const fields={Authors:p.authors,Year:p.year,URL:p.url,DOI:p.doi,Journal:p.journal,'Conference / book':p.booktitle,Publisher:p.publisher,'Reading status':p.status,Topics:(p.topics||[p.topic]).filter(Boolean).join('; '),Keywords:(p.keywords||[]).join('; '),'System stages':(p.stages||[]).map(id=>stages.find(s=>s.id===id)?.title||id).join('; '),Citations:p.citationRaw||p.citations,'Citation source':p.citationSource,'Workbook relevance':p.sourceRelevance,Provenance:p.provenance};
   for(const [label,value] of Object.entries(fields))if(value!==undefined&&value!==null&&value!=='')out.push(`- **${label}:** ${line(value)}`);
   out.push('','### Summary','',p.summary?text(p.summary):'No summary recorded.','');
   if(root.MidasReferences){out.push('### Reference','',text(root.MidasReferences.reference(p)),'','### BibTeX','',fence(root.MidasReferences.bibtex(p),'bibtex'),'');}
   out.push('### Complete record','', 'Original fields, including workbook sheet references, duplicate-row metadata and any custom fields:','',fence(JSON.stringify(p,null,2),'json'),'');
  }
  return out.join('\n')+'\n';
 }
 const api={generate};root.MidasMarkdown=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
