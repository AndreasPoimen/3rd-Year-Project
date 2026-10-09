'use strict';
// UI protection complements the database's editor-only save RPC and SELECT-only grants.
(() => {
  if (OrbitalCloud.canEdit()) return;
  const actions = [
    '#mainAction','#editSubsystem','#removeSubsystem','#undoSubsystem','#outlineUndo',
    '[data-command="add"]','[data-command="layout"]','[data-command="undo"]','[data-port]','[data-rewire]',
    '#newDeck','#starterDeck','#deckSave','#deleteDeck','#addSlide','#duplicateSlide','#removeSlide','#slideUp','#slideDown',
    '#editPaper','#noteForm button','#paperStatus button','[data-view="import"]',
    '#addCompany','#editCompany','#removeCompany','[data-review]','[data-dismiss]','[data-decision]',
    '#add-meeting-task','[data-complete-task]','#task-remove',
    'label:has(#file)','label:has(#importDesign)','label:has(#deckImport)'
  ].join(',');
  const forms = '#importForm,#noteForm,#paperStatus,#slideForm,.project-form,.subsystem-form,.node-form,.edge-form,.connect-form,#companyForm,#reviewForm,#meeting-task-form';
  const fields = '#file,#importDesign,#deckImport,#deckTitle,' + forms.split(',').flatMap(s=>[s+' input',s+' textarea',s+' select',s+' button']).join(',');
  const blocked = actions+','+fields;
  let observer;
  function protect() {
    observer?.disconnect();
    document.querySelectorAll(actions).forEach(el=>{el.hidden=true;if('disabled' in el)el.disabled=true;});
    document.querySelectorAll(fields).forEach(el=>{
      if(el.matches('textarea,input:not([type="file"]):not([type="checkbox"]):not([type="color"])'))el.readOnly=true;
      else el.disabled=true;
      el.setAttribute('aria-readonly','true');
    });
    observer?.observe(document.body,{childList:true,subtree:true});
  }
  document.body.classList.add('viewer-access');
  const style=document.createElement('style');
  style.textContent=`.viewer-access :is(${actions}){display:none!important}.viewer-access .node-grip{cursor:pointer}.viewer-access input[readonly],.viewer-access textarea[readonly]{opacity:.85}`;
  document.head.append(style);
  const notice=document.createElement('p');notice.id='viewer-notice';notice.className='note';notice.textContent='Viewer access · Read-only. You can browse, search, present and export. Only owners and editors can change shared content.';
  document.querySelector('#cloud-bar').after(notice);
  // Capture runs before any page handlers, including newly rendered controls.
  for(const type of ['click','dblclick','beforeinput','input','change','submit','drop','dragstart']) {
    document.addEventListener(type,e=>{
      if(e.target.closest?.(type==='submit'?forms:blocked)){
        e.preventDefault();e.stopImmediatePropagation();protect();
      }
    },true);
  }
  observer=new MutationObserver(protect);
  protect();
})();
