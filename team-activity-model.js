/* Shared task and activity helpers; no database side effects. */
window.MidasTaskModel=(()=>{
 const date=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const today=()=>date(new Date());
 function wednesday(now=new Date()){const d=new Date(now);d.setDate(d.getDate()+(3-d.getDay()+7)%7);return date(d);}
 function due(task,now=today()){return task.completed?'Completed':task.deadline<now?'Overdue':task.deadline===now?'Due today':'Upcoming';}
 function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T12:00:00');return Number.isFinite(d.getTime())&&date(d)===value;}
 function validate(t){if(!t.title?.trim())return 'Give the task a title.';if(t.title.length>160)return 'Keep the title under 160 characters.';if(!validDate(t.meeting)||!validDate(t.deadline))return 'Choose valid meeting and deadline dates.';return '';}
 const eventKey=r=>`${r.kind}/${r.id}/${r.revision}`;
 function title(r){return r.data?.title||r.data?.name||r.data?.project?.title||r.id;}
 function label(r){return r.kind==='diagram'&&r.id.startsWith('task-')?'Task':r.kind==='diagram'&&r.id.startsWith('deck-')?'Presentation':r.kind==='diagram'&&r.id.startsWith('industry-')?'Industry':({paper:'Literature',project:'Project design',note:'Research note',subsystem:'Subsystem',connection:'Connection'})[r.kind]||'Project item';}
 function action(r){return r.deleted?'Removed':r.revision===1?'Added':'Updated';}
 const quietMs=120000;
 // Ignore graph layout/colour, but retain text, nodes, edges and all other content.
 function meaningful(value){
  if(Array.isArray(value))return value.map(meaningful);
  if(!value||typeof value!=='object')return value;
  const graphNode=typeof value.id==='string'&&typeof value.title==='string'&&Number.isFinite(value.x)&&Number.isFinite(value.y);
  const subsystem=typeof value.id==='string'&&value.graph&&Array.isArray(value.graph.nodes);
  return Object.fromEntries(Object.keys(value).sort().filter(k=>!(graphNode&&['x','y','color'].includes(k))&&!(subsystem&&k==='color')).map(k=>[k,meaningful(value[k])]));
 }
 const sameSession=(a,b)=>a.kind===b.kind&&a.id===b.id&&a.updated_by===b.updated_by&&Math.abs(Date.parse(a.updated_at)-Date.parse(b.updated_at))<=quietMs;
 function activity(rows,baselines=new Map(),now=Date.now()){
  const items=new Map();for(const r of rows){const key=r.kind+'/'+r.id;if(!items.has(key))items.set(key,[]);items.get(key).push(r);}
  const result=[];
  for(const list of items.values()){
   list.sort((a,b)=>a.revision-b.revision);let batch=[],previous;
   const finish=()=>{
    if(!batch.length)return;const first=batch[0],last=batch.at(-1),before=previous||baselines.get(eventKey(first));
    const settled=now-Date.parse(last.updated_at)>=quietMs;
    const changed=before?(before.deleted!==last.deleted||JSON.stringify(meaningful(before.data))!==JSON.stringify(meaningful(last.data))):!last.deleted;
    if(settled&&changed)result.push({...last,_firstRevision:first.revision,_count:batch.length,_before:before||null,_added:first.revision===1&&!last.deleted});
    previous=last;batch=[];
   };
   for(const row of list){if(batch.length&&(!sameSession(batch.at(-1),row)||row.revision!==batch.at(-1).revision+1))finish();batch.push(row);}finish();
  }
  return result.sort((a,b)=>b.updated_at.localeCompare(a.updated_at)||eventKey(b).localeCompare(eventKey(a)));
 }
 return {date,today,wednesday,due,validDate,validate,eventKey,title,label,action,quietMs,meaningful,sameSession,activity};
})();
