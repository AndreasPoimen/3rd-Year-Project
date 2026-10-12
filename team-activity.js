(()=>{
 'use strict';
 const M=window.MidasTaskModel,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let started=false;
 async function start(){
  if(started)return;started=true;
  const client=window.OrbitalCloud?.teamClient?.()||window.supabase?.createClient(window.ORBITAL_CLOUD_CONFIG.url,window.ORBITAL_CLOUD_CONFIG.publishableKey);
  if(!client)return;
  const {data,error}=await client.auth.getSession();if(error||!data.session)return;
  const user=data.session.user,{data:role,error:roleError}=await client.rpc('of_my_role');if(roleError||!['owner','editor','viewer'].includes(role))return;
  const editable=role!=='viewer',storageKey='midas-activity-'+user.id;
  let preferences={};try{preferences=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{}
  const store=()=>{try{localStorage.setItem(storageKey,JSON.stringify(preferences));}catch{}};
  let historyRows=new Map(),baselines=new Map(),knownGroups=new Set(),historyDepth=100;
  let tasks=new Map(),events=[],tab='tasks',filter='open',query='',meeting='',draft=null,draftDirty=false,saving=false,loading=false,refreshAgain=false,initialized=false,latestKnown='',older=false,more=true,timer,toastTimer;
  const dock=document.createElement('div');dock.id='team-dock';dock.setAttribute('aria-label','Meeting tasks and notifications');
  dock.innerHTML='<div id="task-bubbles" aria-label="Upcoming task bubbles"></div><div class="team-dock-actions"><button id="task-launch" aria-label="Open meeting tasks">✓ <span>Tasks</span><b id="task-badge">0</b></button><button id="activity-launch" aria-label="Open notifications">&#128276; <span>Updates</span><b id="activity-badge">0</b></button><button id="bubble-toggle" aria-label="Hide floating task bubbles">Hide bubbles</button></div>';
  document.body.append(dock);
  const drawer=document.createElement('dialog');drawer.id='team-drawer';drawer.innerHTML='<header class="task-drawer-header"><div><small>MIDAS / TEAM SPACE</small><h2>Meeting actions</h2></div><button id="task-close" aria-label="Close task panel">×</button></header><div class="task-drawer-tabs"><button data-task-tab="tasks">Meeting tasks</button><button data-task-tab="activity">Notifications</button></div><p id="task-message" role="status"></p><div id="task-drawer-content"></div>';
  document.body.append(drawer);
  const toast=document.createElement('button');toast.id='activity-toast';toast.hidden=true;toast.setAttribute('aria-live','polite');document.body.append(toast);
  const $=s=>drawer.querySelector(s),body=$('#task-drawer-content'),message=t=>$('#task-message').textContent=t;
  const unread=r=>r.updated_at>(preferences.seenThrough||'')&&!(preferences.read||[]).includes(M.eventKey(r));
  const activeTasks=()=>[...tasks.values()].filter(r=>!r.deleted).sort((a,b)=>Number(!!a.data.completed)-Number(!!b.data.completed)||String(a.data.deadline).localeCompare(String(b.data.deadline))||String(a.id).localeCompare(String(b.id)));
  function notify(text){toast.textContent=text+' · View updates';toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,7000);}
  function badges(){const list=activeTasks().filter(r=>!r.data.completed),count=events.filter(unread).length;document.getElementById('task-badge').textContent=list.length;document.getElementById('activity-badge').textContent=count>=100?'99+':count;document.getElementById('activity-launch').classList.toggle('has-unread',!!count);
   const bubbles=document.getElementById('task-bubbles');bubbles.hidden=!!preferences.hideBubbles;bubbles.innerHTML=list.slice(0,3).map((r,i)=>`<div class="task-bubble ${M.due(r.data)==='Overdue'?'overdue':''}" style="--float-delay:${-i*1.7}s"><button data-open-task="${esc(r.id)}" title="${esc(r.data.title)}"><span>${esc(r.data.title)}</span><small>${esc(M.due(r.data))} · ${esc(r.data.deadline)}</small></button>${editable?`<button class="bubble-done" data-complete-task="${esc(r.id)}" aria-label="Complete ${esc(r.data.title)}">✓</button>`:''}</div>`).join('');
   document.getElementById('bubble-toggle').textContent=preferences.hideBubbles?'Show bubbles':'Hide bubbles';document.getElementById('bubble-toggle').setAttribute('aria-label',preferences.hideBubbles?'Show floating task bubbles':'Hide floating task bubbles');
  }
  function render(){if(draft)return;drawer.querySelectorAll('[data-task-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.taskTab===tab)));
   if(tab==='activity'){renderActivity();return;}
   body.innerHTML=`<div class="task-top"><p>Capture decisions and actions from your Wednesday meetings. Deadlines use your device’s local date.</p>${editable?'<button id="add-meeting-task" class="primary">＋ Add task</button>':'<p>Viewer access · tasks are read-only.</p>'}</div><div class="task-filters"><label>Show<select id="task-filter"><option value="open">Open tasks</option><option value="overdue">Overdue</option><option value="completed">Completed</option><option value="all">All tasks</option></select></label><label>Meeting date<input id="meeting-filter" type="date"></label><label class="task-search">Search tasks<input id="task-search" type="search" placeholder="Task, assignee or notes"></label><button id="task-reset">Clear filters</button></div><div id="task-list"></div><button id="task-refresh">Refresh tasks & updates</button>`;
   $('#task-filter').value=filter;$('#meeting-filter').value=meeting;$('#task-search').value=query;
   $('#add-meeting-task')?.addEventListener('click',()=>editTask());$('#task-refresh').onclick=()=>refresh();
   $('#task-filter').onchange=e=>{filter=e.target.value;renderList();};$('#meeting-filter').onchange=e=>{meeting=e.target.value;renderList();};$('#task-search').oninput=e=>{query=e.target.value;renderList();};$('#task-reset').onclick=()=>{filter='open';meeting=query='';render();};renderList();
  }
  function renderList(){const list=activeTasks().filter(r=>(filter==='all'||filter==='completed'&&r.data.completed||filter==='open'&&!r.data.completed||filter==='overdue'&&M.due(r.data)==='Overdue')&&(!meeting||r.data.meeting===meeting)&&`${r.data.title} ${r.data.assignee||''} ${r.data.notes||''}`.toLowerCase().includes(query.toLowerCase()));
   $('#task-list').innerHTML=list.map(r=>`<article class="meeting-task ${r.data.completed?'task-completed':''}"><div><span class="task-state">${esc(M.due(r.data))}</span><h3>${esc(r.data.title)}</h3><p>${esc(r.data.assignee||'Unassigned')} · Due ${esc(r.data.deadline)}</p><small>Meeting ${esc(r.data.meeting)}</small></div><div class="task-row-actions"><button data-open-task="${esc(r.id)}">${editable?'View / edit':'View task'}</button>${editable?`<button data-complete-task="${esc(r.id)}">${r.data.completed?'Reopen':'✓ Complete'}</button>`:''}</div></article>`).join('')||'<p class="task-empty">No tasks in this view. Add a meeting action or change the filters.</p>';
  }
  function closeDraft(){if(draftDirty&&!confirm('Discard the unsaved task edits?'))return false;draft=null;draftDirty=false;return true;}
  function open(which='tasks'){if(saving)return;if(!closeDraft())return;tab=which;render();if(!drawer.open)drawer.showModal();}
  function close(){if(saving){message('Wait for the task to finish saving.');return;}if(closeDraft())drawer.close();}
  function editTask(id){if(saving||!closeDraft())return;const row=id?tasks.get(id):null;if(id&&!row){message('This task is no longer available. Refresh the task list.');return;}
   draft={id:row?.id||'task-'+crypto.randomUUID(),revision:row?.revision||0,data:structuredClone(row?.data||{title:'',assignee:'',meeting:M.wednesday(),deadline:M.wednesday(),notes:'',completed:false,createdAt:new Date().toISOString()})};draftDirty=false;tab='tasks';if(!drawer.open)drawer.showModal();message('');
   body.innerHTML=`<button id="task-back">← Back to tasks</button><h3>${row?'Meeting action':'New meeting action'}</h3><form id="meeting-task-form"><label>Task title<input name="title" maxlength="160" required value="${esc(draft.data.title)}" ${editable?'':'readonly'}></label><label>Assigned to<input name="assignee" maxlength="100" placeholder="Teammate or working group" value="${esc(draft.data.assignee)}" ${editable?'':'readonly'}></label><div class="task-dates"><label>Meeting date<input name="meeting" type="date" required value="${esc(draft.data.meeting)}" ${editable?'':'readonly'}></label><label>Deadline<input name="deadline" type="date" required value="${esc(draft.data.deadline)}" ${editable?'':'readonly'}></label></div><p class="task-hint">New tasks start with the next Wednesday meeting. You can adjust either date.</p><label>Details / outcome<textarea name="notes" rows="5" maxlength="5000" ${editable?'':'readonly'}>${esc(draft.data.notes)}</textarea></label>${editable?`<label class="task-check"><input name="completed" type="checkbox" ${draft.data.completed?'checked':''}> Completed</label><button class="primary" type="submit">Save shared task</button>`:''}</form>${editable&&row?'<button id="task-remove" class="task-remove">Remove task</button>':''}<p id="task-save-error" role="alert"></p>`;
   drawer.querySelectorAll('[data-task-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.taskTab==='tasks')));
   $('#task-back').onclick=()=>{if(!saving&&closeDraft())render();};$('#meeting-task-form').oninput=()=>draftDirty=true;
   $('#meeting-task-form').onsubmit=async e=>{e.preventDefault();if(!editable||saving)return;const f=new FormData(e.target),task={...draft.data,title:String(f.get('title')).trim(),assignee:String(f.get('assignee')).trim(),meeting:f.get('meeting'),deadline:f.get('deadline'),notes:String(f.get('notes')),completed:f.has('completed')};const error=M.validate(task);if(error){$('#task-save-error').textContent=error;return;}if(await save(draft.id,task,draft.revision)){draft=null;draftDirty=false;render();message('Task saved for the team.');}};
   $('#task-remove')?.addEventListener('click',async()=>{if(!saving&&confirm('Remove this task for the team? Its saved versions remain in History & restore.')){if(await save(draft.id,draft.data,draft.revision,true)){draft=null;draftDirty=false;render();message('Task removed. Its history is retained.');}}});
  }
  async function save(id,task,revision,deleted=false){if(!editable||saving)return false;saving=true;drawer.querySelectorAll('button').forEach(b=>b.disabled=true);try{const {data,error}=await client.rpc('of_save_entity',{p_kind:'diagram',p_id:id,p_data:task,p_expected_revision:revision,p_deleted:deleted});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row?.id)throw Error('The server did not confirm this save.');tasks.set(row.id,row);badges();return true;}catch(e){const text=e.code==='40001'?'A teammate changed this task. Your edits are still here. Copy anything you need, then go back and refresh before editing again.':'Could not save: '+e.message;if(!drawer.open){tab='tasks';render();drawer.showModal();}message(text);if($('#task-save-error'))$('#task-save-error').textContent=text;return false;}finally{saving=false;drawer.querySelectorAll('button').forEach(b=>b.disabled=false);refresh();}}
  async function complete(id){const row=tasks.get(id);if(!row||saving||!editable)return;if(draft&&!closeDraft())return;const next={...row.data,completed:!row.data.completed};if(await save(id,next,row.revision)){if(drawer.open)render();message(next.completed?'Task completed.':'Task reopened.');}}
  function renderActivity(){body.innerHTML=`<div class="task-top"><p>Significant changes appear after 2 minutes without further saves to that item. Related edits are grouped; bubble position and colour changes are quiet. Full save history remains in History & restore. Read markers stay on this browser.</p><button id="activity-read-all">Mark all loaded updates read</button><button id="activity-refresh">Refresh</button></div><div id="activity-list">${events.map(r=>`<button class="activity-row ${unread(r)?'unread':''}" data-event="${esc(M.eventKey(r))}"><span>${esc(M.label(r))} · ${esc(r._added?'Added':M.action(r))}</span><strong>${esc(M.title(r))}</strong><small>${r.updated_by===user.id?'You':'Teammate'} · ${esc(new Date(r.updated_at).toLocaleString())} · ${r._count>1?r._count+' saves grouped': '1 saved change'}</small></button>`).join('')||'<p class="task-empty">No settled significant changes yet.</p>'}</div><button id="activity-older" ${more?'':'disabled'}>${more?'Load older updates':'All available updates loaded'}</button>`;
   $('#activity-refresh').onclick=()=>refresh();$('#activity-read-all').onclick=()=>{preferences.seenThrough=events.reduce((a,r)=>r.updated_at>a?r.updated_at:a,preferences.seenThrough||'');preferences.read=[];store();badges();renderActivity();};$('#activity-older').onclick=loadOlder;
  }
  async function inspect(key){const r=events.find(r=>M.eventKey(r)===key);if(!r)return;if(!closeDraft())return;preferences.read=[...new Set([...(preferences.read||[]),key])].slice(-1000);store();badges();
   body.innerHTML='<button id="activity-back">← Back to notifications</button><h3 id="activity-title"></h3><p id="activity-meta"></p><p id="activity-diff">Loading the previous saved version…</p><pre id="activity-before"></pre><details><summary>Full saved version</summary><pre id="activity-json"></pre></details>';
   $('#activity-title').textContent=M.title(r);$('#activity-meta').textContent=`${M.label(r)} · ${M.action(r)} · ${new Date(r.updated_at).toLocaleString()} · ${r._count} saved change(s), revisions ${r._firstRevision}-${r.revision}`;$('#activity-json').textContent=JSON.stringify(r.data,null,2);$('#activity-back').onclick=()=>{renderActivity();};
   const target=$('#activity-diff'),diff=$('#activity-before');
   try{let prev=r._before;
    if(!target.isConnected)return;
    if(r._added){target.textContent='New item added. The saved contents are below.';diff.textContent=JSON.stringify(r.data,null,2);}else if(!prev){target.textContent='Previous version unavailable. The full saved version is still available below.';}else{const keys=[...new Set([...Object.keys(M.meaningful(prev.data)||{}),...Object.keys(M.meaningful(r.data)||{})])].filter(k=>JSON.stringify(M.meaningful(prev.data)?.[k])!==JSON.stringify(M.meaningful(r.data)?.[k]));target.textContent=r.deleted?'Item removed.':prev.deleted?'Item restored.':keys.length?`${keys.length} changed field(s).`:'No content fields changed.';diff.textContent=keys.map(k=>`${k}\nBefore: ${JSON.stringify(M.meaningful(prev.data)?.[k],null,2)??'(not set)'}\nAfter: ${JSON.stringify(M.meaningful(r.data)?.[k],null,2)??'(removed)'}`).join('\n\n');}
   }catch{if(target.isConnected)target.textContent='Could not load the previous version. The saved version below remains available.';}
  }
  async function historyPage(offset){const {data,error}=await client.from('of_history').select('*').order('updated_at',{ascending:false}).order('kind').order('id').order('revision',{ascending:false}).range(offset,offset+99);if(error)throw error;return data;}
  // Complete sessions across page boundaries, and retain the preceding saved version
  // so a layout-only session (or an edit followed by undo) can be omitted accurately.
  async function settleHistory(){
   const earliest=new Map();for(const r of historyRows.values()){const k=r.kind+'/'+r.id;if(!earliest.has(k)||r.revision<earliest.get(k).revision)earliest.set(k,r);}
   for(let first of earliest.values()){
    while(first.revision>1&&!baselines.has(M.eventKey(first))){
     const {data,error}=await client.from('of_history').select('*').eq('kind',first.kind).eq('id',first.id).lt('revision',first.revision).order('revision',{ascending:false}).limit(100);if(error)throw error;
     if(!data.length)break;let boundary=false;
     for(const prior of data){
      if(prior.revision!==first.revision-1||!M.sameSession(prior,first)){baselines.set(M.eventKey(first),prior);boundary=true;break;}
      historyRows.set(M.eventKey(prior),prior);first=prior;
     }
     if(boundary)break;
    }
   }
   events=M.activity([...historyRows.values()],baselines);
  }
  async function loadOlder(){if(older||loading)return;older=true;$('#activity-older').disabled=true;try{historyDepth+=100;let page=[];for(let offset=0;offset<historyDepth;offset+=100){page=await historyPage(offset);for(const r of page)historyRows.set(M.eventKey(r),r);if(page.length<100)break;}more=page.length===100;await settleHistory();for(const r of events)knownGroups.add(M.eventKey(r));renderActivity();badges();}catch(e){message('Could not load older updates: '+e.message);$('#activity-older')?.removeAttribute('disabled');}finally{older=false;if(refreshAgain){refreshAgain=false;refresh();}}}
  async function refresh(){if(loading||saving||older){refreshAgain=true;return;}loading=true;
   try{const all=[];for(let offset=0;;offset+=500){const {data,error}=await client.from('of_entities').select('*').eq('kind','diagram').like('id','task-%').order('id').range(offset,offset+499);if(error)throw error;all.push(...data);if(data.length<500)break;}tasks=new Map(all.map(r=>[r.id,r]));let page=await historyPage(0),head=page;for(const r of page)historyRows.set(M.eventKey(r),r);
    // Catch bursts larger than one page while another member is importing or editing.
    for(let offset=100;initialized&&page.length===100&&page.at(-1).updated_at>latestKnown;offset+=100){page=await historyPage(offset);for(const r of page)historyRows.set(M.eventKey(r),r);}
    if(!initialized)more=head.length===100;await settleHistory();
    const newest=head[0]?.updated_at||'';
    if(!initialized){if(!Object.prototype.hasOwnProperty.call(preferences,'seenThrough')){preferences.seenThrough=events[0]?.updated_at||'';store();}initialized=true;}
    else{const fresh=events.filter(r=>!knownGroups.has(M.eventKey(r))&&unread(r));if(fresh.length)notify(fresh.length===1?`${fresh[0]._added?'Added':M.action(fresh[0])}: ${M.title(fresh[0])}`:`${fresh.length} significant project updates`);}
    for(const r of events)knownGroups.add(M.eventKey(r));latestKnown=newest>latestKnown?newest:latestKnown;
    badges();document.getElementById('task-launch').removeAttribute('title');if($('#task-message').textContent.startsWith('Could not refresh team activity:'))message('');if(drawer.open&&!draft&&!body.querySelector('#activity-json')){if(tab==='tasks'&&$('#task-list'))renderList();else render();}
   }catch(e){message('Could not refresh team activity: '+e.message);document.getElementById('task-launch').title='Activity unavailable. Open and refresh to retry.';}finally{loading=false;if(refreshAgain){refreshAgain=false;setTimeout(refresh,600);}}
  }
  document.getElementById('task-launch').onclick=()=>open('tasks');document.getElementById('activity-launch').onclick=()=>open('activity');toast.onclick=()=>{toast.hidden=true;open('activity');};
  document.getElementById('bubble-toggle').onclick=()=>{preferences.hideBubbles=!preferences.hideBubbles;store();badges();};
  drawer.addEventListener('click',e=>{const b=e.target.closest('[data-open-task],[data-complete-task],[data-event],[data-task-tab]');if(!b)return;if(b.dataset.openTask)editTask(b.dataset.openTask);else if(b.dataset.completeTask)complete(b.dataset.completeTask);else if(b.dataset.event)inspect(b.dataset.event);else open(b.dataset.taskTab);});
  dock.addEventListener('click',e=>{const b=e.target.closest('[data-open-task],[data-complete-task]');if(b?.dataset.openTask)editTask(b.dataset.openTask);if(b?.dataset.completeTask)complete(b.dataset.completeTask);});
  $('#task-close').onclick=close;drawer.addEventListener('cancel',e=>{e.preventDefault();close();});
  window.addEventListener('beforeunload',e=>{if(draftDirty||saving){e.preventDefault();e.returnValue='';}});
  window.MidasTasks={exportTasks:()=>[...tasks.values()].map(r=>({...structuredClone(r.data),id:r.id,revision:r.revision,deleted:r.deleted}))};render();await refresh();
  const channel=client.channel('midas-activity-'+crypto.randomUUID()).on('postgres_changes',{event:'*',schema:'public',table:'of_entities'},()=>{clearTimeout(timer);timer=setTimeout(refresh,450);}).subscribe();
  window.addEventListener('storage',e=>{if(e.key===storageKey){try{preferences=JSON.parse(e.newValue||'{}');badges();if(drawer.open&&tab==='activity'&&!body.querySelector('#activity-json'))renderActivity();}catch{}}});
  const poll=setInterval(()=>{if(!document.hidden)refresh();},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){clearInterval(poll);clearTimeout(timer);drawer.close();drawer.remove();dock.remove();toast.remove();client.removeChannel(channel);}});
 }
 if(window.OrbitalCloud?.teamClient||document.querySelector('.orbit-layout'))start().catch(()=>{});else window.addEventListener('orbital-cloud-ready',()=>start().catch(()=>{}),{once:true});
})();
