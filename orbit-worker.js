import {parseRow,position} from './orbit-math.js';
let items=[];
self.onmessage=({data})=>{
 if(data.type==='load'){items=data.rows.map(r=>{try{return parseRow(r);}catch{return null;}});self.postMessage({type:'ready'});return;}
 const coordinates=new Float32Array(items.length*3),valid=new Uint8Array(items.length);items.forEach((item,i)=>{const p=item&&position(item,data.time);if(p){coordinates.set(p.xyz,i*3);valid[i]=1;}});self.postMessage({type:'positions',coordinates,valid,time:data.time},[coordinates.buffer,valid.buffer]);
};
