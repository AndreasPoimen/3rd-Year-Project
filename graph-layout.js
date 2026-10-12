'use strict';
// Layered left-to-right layout. Edges, IDs and content are never changed.
window.MidasGraphLayout = function(graph, width=220, height=108) {
 const nodes=graph.nodes, index=new Map(nodes.map((n,i)=>[n.id,i])), out=new Map(nodes.map(n=>[n.id,[]])), incoming=new Map(nodes.map(n=>[n.id,[]])), neighbours=new Map(nodes.map(n=>[n.id,[]]));
 for(const e of graph.edges){if(!index.has(e.from)||!index.has(e.to)||e.from===e.to)continue;if(out.get(e.from).includes(e.to))continue;out.get(e.from).push(e.to);incoming.get(e.to).push(e.from);neighbours.get(e.from).push(e.to);neighbours.get(e.to).push(e.from);}
 const byIndex=(a,b)=>index.get(a)-index.get(b), visited=new Set(), components=[];
 for(const n of nodes){if(visited.has(n.id))continue;const component=[],queue=[n.id];visited.add(n.id);for(let i=0;i<queue.length;i++){const id=queue[i];component.push(id);for(const next of neighbours.get(id))if(!visited.has(next)){visited.add(next);queue.push(next);}}components.push(component);}
 const positions=new Map();let top=90,feedback=0;
 for(const component of components){
  // DFS removes only back edges from the layout calculation. Feedback connectors
  // remain in the actual graph. Begin with real roots; use a stable fallback for cycles.
  const colour=new Map(),forward=new Map(component.map(id=>[id,[]])),parents=new Map(component.map(id=>[id,[]]));
  const roots=component.slice().sort((a,b)=>incoming.get(a).length-incoming.get(b).length||out.get(b).length-out.get(a).length||byIndex(a,b));
  function walk(id){colour.set(id,1);for(const next of out.get(id).slice().sort(byIndex)){if(colour.get(next)===1){feedback++;continue;}forward.get(id).push(next);parents.get(next).push(id);if(!colour.has(next))walk(next);}colour.set(id,2);}
  for(const id of roots)if(!colour.has(id))walk(id);
  const degree=new Map(component.map(id=>[id,parents.get(id).length])),rank=new Map(component.map(id=>[id,0])),queue=component.filter(id=>!degree.get(id)).sort(byIndex);
  for(let i=0;i<queue.length;i++)for(const next of forward.get(queue[i])){rank.set(next,Math.max(rank.get(next),rank.get(queue[i])+1));degree.set(next,degree.get(next)-1);if(!degree.get(next))queue.push(next);}
  const layers=[];for(const id of component){const r=rank.get(id);(layers[r]||= []).push(id);}layers.forEach(layer=>layer.sort(byIndex));
  const order=new Map();const number=()=>layers.forEach(layer=>layer.forEach((id,i)=>order.set(id,i)));number();
  const mean=(ids,map,fallback)=>ids.length?ids.reduce((sum,id)=>sum+map.get(id),0)/ids.length:fallback;
  // Alternate sweeps keep branches next to their parents and reduce crossings.
  for(let pass=0;pass<8;pass++){
   const down=pass%2===0;
   for(let k=down?1:layers.length-2;down?k<layers.length:k>=0;k+=down?1:-1){const links=down?parents:forward;layers[k].sort((a,b)=>mean(links.get(a),order,order.get(a))-mean(links.get(b),order,order.get(b))||byIndex(a,b));number();}
  }
  const pitch=height+85,maxCount=Math.max(...layers.map(l=>l.length)),ys=new Map();
  layers.forEach(layer=>layer.forEach((id,i)=>ys.set(id,top+(maxCount-layer.length)*pitch/2+i*pitch)));
  for(let pass=0;pass<12;pass++){
   const down=pass%2===0,links=down?parents:forward;
   for(let k=down?1:layers.length-2;down?k<layers.length:k>=0;k+=down?1:-1){
    const layer=layers[k],desired=layer.map(id=>mean(links.get(id),ys,ys.get(id))),placed=[];
    for(let i=0;i<layer.length;i++)placed[i]=Math.max(desired[i],i?placed[i-1]+pitch:top);
    const excess=placed.reduce((sum,y,i)=>sum+y-desired[i],0)/layer.length;
    const shift=Math.min(excess,placed[0]-top);layer.forEach((id,i)=>ys.set(id,placed[i]-shift));
   }
  }
  for(const id of component)positions.set(id,{x:90+rank.get(id)*(width+155),y:Math.round(ys.get(id))});
  top=Math.max(...component.map(id=>positions.get(id).y))+height+160;
 }
 return {positions,feedback};
};
