import {categories,dimension,sizeBand} from './orbit-catalogue.js';
export const sizes={tiny:'Under 10 cm',small:'10 cm–1 m',medium:'1–10 m',large:'10 m or more',unknown:'Unknown size'};
export function launchYear(row){const match=/^(\d{4})(?:\s|$)/.exec(row.launch||'');return match?match[1]:'Unknown';}
export function groupKey(row,mode){return mode==='year'?launchYear(row):mode==='size'?sizeBand(dimension(row)):row.category in categories?row.category:'unknown';}
export function aggregate(rows,mode){
 const bins=new Map();
 for(const row of rows){const key=groupKey(row,mode),category=row.category in categories?row.category:'unknown';if(!bins.has(key))bins.set(key,Object.fromEntries(Object.keys(categories).map(k=>[k,0])));bins.get(key)[category]++;}
 const keys=mode==='type'?Object.keys(categories):mode==='size'?Object.keys(sizes):[...bins.keys()].sort((a,b)=>a==='Unknown'?1:b==='Unknown'?-1:Number(a)-Number(b));
 return keys.map(key=>({key,label:mode==='type'?categories[key].label:mode==='size'?sizes[key]:key,counts:bins.get(key)||Object.fromEntries(Object.keys(categories).map(k=>[k,0]))})).map(b=>({...b,total:Object.values(b.counts).reduce((a,b)=>a+b,0)}));
}
