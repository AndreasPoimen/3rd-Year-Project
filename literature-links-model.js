'use strict';
window.MidasLiteratureLinks={
 list:p=>Array.isArray(p.subsystemLinks)?p.subsystemLinks.filter(l=>l&&typeof l.systemId==='string'&&(l.nodeId==null||typeof l.nodeId==='string')):[],
 matches(p,systemId,nodeId){return this.list(p).some(l=>l.systemId===systemId&&(nodeId===undefined||(l.nodeId||null)===(nodeId||null)));},
 set(p,system,node,enabled){const nodeId=node?.id||null;const rest=this.list(p).filter(l=>!(l.systemId===system.id&&(l.nodeId||null)===nodeId));if(enabled)rest.push({systemId:system.id,nodeId,systemTitle:system.title,nodeTitle:node?.title||null});return rest;},
 describe(link,design){const s=design.subsystems.find(s=>s.id===link.systemId),n=s?.graph.nodes.find(n=>n.id===link.nodeId);return (s?.title||link.systemTitle||'Removed subsystem')+(link.nodeId?' / '+(n?.title||link.nodeTitle||'Removed component'):' / Whole subsystem')+(!s||(link.nodeId&&!n)?' (removed from design)':'');}
};
