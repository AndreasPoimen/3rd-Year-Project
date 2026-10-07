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
 return {date,today,wednesday,due,validDate,validate,eventKey,title,label,action};
})();
