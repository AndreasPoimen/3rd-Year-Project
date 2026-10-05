/* Presentation-only organisation. Existing nodes and their event handlers stay intact. */
(()=>{
 'use strict';
 const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>[...r.querySelectorAll(s)];
 const motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const remembered=new Map();
 function reveal(el){if(el&&motion())el.animate([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});}
 function fold(nodes,label,{open=false,before=nodes[0]}={}){
  nodes=nodes.filter(Boolean);if(!nodes.length||!before)return;
  const d=document.createElement('details');d.className='workspace-fold';d.open=open;
  const s=document.createElement('summary');s.textContent=label;d.append(s);before.before(d);
  const box=document.createElement('div');box.className='fold-content';d.append(box);nodes.forEach(n=>box.append(n));
  d.addEventListener('toggle',()=>{if(d.open)reveal(box);});return d;
 }
 function tabs(host,id,groups){
  if(!host||$('#'+id,host))return;
  groups=groups.map(g=>({...g,nodes:g.nodes.filter(Boolean)})).filter(g=>g.nodes.length);
  if(groups.length<2)return;
  const nav=document.createElement('div');nav.id=id;nav.className='workspace-tabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',id.replace(/-/g,' '));
  groups[0].nodes[0].before(nav);
  const panels=[],buttons=[];let active=remembered.get(id)||0;if(active>=groups.length)active=0;
  groups.forEach((g,i)=>{
   const p=document.createElement('section');p.className='workspace-pane';p.id=id+'-panel-'+i;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',id+'-tab-'+i);p.tabIndex=0;
   nav.after(p);groups[i].nodes.forEach(n=>p.append(n));panels.push(p);
   const b=document.createElement('button');b.type='button';b.id=id+'-tab-'+i;b.textContent=g.label;b.setAttribute('role','tab');b.setAttribute('aria-controls',p.id);nav.append(b);buttons.push(b);
   b.onclick=()=>select(i,true);
   b.onkeydown=e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%groups.length;else if(e.key==='ArrowLeft')n=(i+groups.length-1)%groups.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=groups.length-1;else return;e.preventDefault();select(n,true);buttons[n].focus();};
  });
  function select(i,animate=false){active=i;remembered.set(id,i);panels.forEach((p,j)=>{p.hidden=i!==j;buttons[j].setAttribute('aria-selected',String(i===j));buttons[j].tabIndex=i===j?0:-1;});if(animate)reveal(panels[i]);
   // Graphs created in a hidden panel need their first fit after becoming visible.
   if(!panels[i].dataset.measured){requestAnimationFrame(()=>{all('[data-command="fit"]',panels[i]).forEach(b=>b.click());panels[i].dataset.measured='true';});}
   window.dispatchEvent(new Event('resize'));
  }
  select(active);return {select,panels,buttons};
 }
 function shell(){
  const bar=$('#cloud-bar');if(bar&&!bar.querySelector('.account-menu')){const buttons=all(':scope > button',bar);if(buttons.length){const d=fold(buttons,'Account & sync');d.classList.add('account-menu');}}
  // Password control is inserted asynchronously by the existing account module.
  if(bar?.querySelector('.account-menu'))all(':scope > button',bar).forEach(b=>$('.fold-content',bar).append(b));
  const shortcuts=$('.workspace-shortcuts');if(shortcuts&&!shortcuts.closest('details'))fold([shortcuts],'Team links');
  const foot=$('aside .aside-bottom');if(foot&&!foot.dataset.tidy){foot.dataset.tidy='true';const actions=all(':scope > button,:scope > .filebtn',foot);if(actions.length)fold(actions,'Import & export');}
  const research=$('.research-nav');if(research&&research.closest('aside')){$('main .heading').after(research);research.classList.add('workspace-research-tabs');}
  const notice=$('main > .notice');if(notice)fold([notice],'About this workspace');
 }
 function design(){const host=$('#designContent');if(!host)return;
  if(document.body.dataset.page==='overview'&&$('.project-intro',host)&&!$('#project-views',host)){
   const intro=$('.project-intro',host),facts=$('.brief-facts',intro);if(facts)fold([facts],'Objectives & scope');
   tabs(host,'project-views',[{label:'Mission',nodes:[intro]},{label:'Architecture',nodes:[$('.workspace-heading',host),$('.boundary-label',host),$('#blockGraph',host)]},{label:'Decisions & assumptions',nodes:[$('.grid',host),$('.revision-help',host)]}]);
  }
  if(document.body.dataset.page==='subsystems'){
   const picker=$('.subsystem-picker',host);if(picker&&!picker.closest('details'))fold([picker],'Switch subsystem');
   const actions=$('.workspace-actions',host);if(actions&&!actions.closest('details'))fold([actions],'Manage subsystem');
   const ref=$('.subsystem-reference',host);if(ref&&!ref.closest('details'))fold([ref],'Linked research & architecture');
  }
 }
 function presentation(){const host=$('#presentationStudio');if(!host)return;
  const tools=$('.deck-tools',host);if(tools&&!tools.closest('details'))fold([tools],'Choose or import a presentation');
  const actions=$('.deck-actions',host);if(actions&&!actions.dataset.tidy){actions.dataset.tidy='true';fold([$('#htmlExport',host),$('#jsonExport',host),$('#deleteDeck',host)].filter(Boolean),'Export & manage');}
  const work=$('.slide-work',host);if(work&&!$('#slide-work-views',work))tabs(work,'slide-work-views',[{label:'Preview',nodes:[$('#slidePreview',work)]},{label:'Edit slide',nodes:[$('#slideForm',work),$('.slide-actions',work)]}]);
 }
 function industry(){if(!$('#industryCharts')||$('#industry-views'))return;
  const views=tabs($('main'),'industry-views',[{label:'Sectors',nodes:[$('#industryCharts')]},{label:'Companies',nodes:[$('#industryFilters'),$('.company-list-heading'),$('#companyCards')]},{label:'Updates to review',nodes:[$('.industry-updates')]}]);
  if(!views)return;
  // Capture the target before the existing renderer replaces its chart nodes.
  function showCompanies(e){if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;if(e.target.closest('[data-sector],[data-evidence]'))setTimeout(()=>{views.select(1,true);views.buttons[1].focus();},0);}
  $('#industryCharts').addEventListener('click',showCompanies,true);$('#industryCharts').addEventListener('keydown',showCompanies,true);
 }
 function orbits(){if(!$('.orbit-layout')||$('#orbit-views'))return;
  const main=$('main'),layout=$('.orbit-layout');
  tabs(main,'orbit-views',[{label:'Live orbit',nodes:[$('#categoryLegend'),$('#metadataStatus'),layout]},{label:'Object catalogue',nodes:[$('.extended-catalogue')]},{label:'Sources & coverage',nodes:['orbitStatus','catalogueAge','coverageCount','mapStatus','invalidCount'].map(id=>$('#'+id)).concat($('.orbit-sources'))}]);
  const chart=$('#orbitAnalytics'),matches=$('#chartMatches');const d=fold([chart],'Population charts · linked to the globe');
  if(d){matches.hidden=!d.open;d.addEventListener('toggle',()=>matches.hidden=!d.open);}
  const controls=$('.orbit-controls'),sections=all(':scope > section',controls);const filters=sections.find(s=>s.contains($('#satSearch')));
  if(filters){const sizeNodes=['sizeBasis','objectSize','includeEstimates'].map(id=>$('#'+id));const nodes=[];sizeNodes.forEach(el=>{if(el.id==='includeEstimates')nodes.push(el.closest('label'));else {const label=el.previousElementSibling;if(label?.tagName==='LABEL')nodes.push(label);nodes.push(el);}});const note=$('.orbit-note',filters);if(note)nodes.push(note);fold(nodes,'Size & dimension filters');}
  const selected=sections.find(s=>s.contains($('#satName')));if(selected){const extra=['satMetaSource','satEpoch','satLatLon','satProvider','satAge','sourceLink'].map(id=>$('#'+id));fold(extra,'Orbital elements & source');}
 }
 function animateChanges(){document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&motion())b.animate([{filter:'brightness(1)'},{filter:'brightness(1.22)'},{filter:'brightness(1)'}],{duration:200});});
  document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0||a.target||a.hasAttribute('download'))return;const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname!==location.pathname){document.body.classList.add('workspace-navigating');setTimeout(()=>document.body.classList.remove('workspace-navigating'),4000);}});
  addEventListener('pageshow',()=>document.body.classList.remove('workspace-navigating'));
  const observer=new MutationObserver(records=>{for(const r of records)if(r.type==='attributes'&&r.attributeName==='open'&&r.target.open)reveal(r.target);});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 }
 function enhance(){shell();design();presentation();industry();orbits();}
 function start(){document.body.classList.add('workspace-minimal');enhance();animateChanges();
  let timer;new MutationObserver(records=>{if(records.some(r=>r.target.matches?.('main,body,#designContent,#presentationStudio,#cloud-bar')||[...r.addedNodes].some(n=>n.id==='cloud-bar'))){clearTimeout(timer);timer=setTimeout(enhance,0);}if(!document.activeElement?.matches('input,textarea,select'))for(const target of new Set(records.map(r=>r.target)))if(target.matches?.('#content,#teamContent'))reveal(target);}).observe(document.body,{childList:true,subtree:true});
  // Cross-panel search reveals the panel containing the first highlighted result.
  $('#designSearch')?.addEventListener('input',()=>setTimeout(()=>{const hit=$('#designContent .tabmatch');if(hit){const p=hit.closest('[role="tabpanel"]');if(p)document.getElementById(p.getAttribute('aria-labelledby'))?.click();let parent=hit.parentElement;while(parent&&parent.id!=='designContent'){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}}},0));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
