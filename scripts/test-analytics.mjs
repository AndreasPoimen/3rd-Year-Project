import assert from 'node:assert/strict';
import fs from 'node:fs';
import {aggregate,launchYear,groupKey} from '../orbit-analytics-data.js';
const rows=JSON.parse(fs.readFileSync(new URL('../orbit-data/gcat-catalogue.json',import.meta.url))).rows;
for(const mode of ['year','type','size']){
 const bins=aggregate(rows,mode); assert.equal(bins.reduce((s,b)=>s+b.total,0),rows.length);
 for(const b of bins) assert.equal(b.total,rows.filter(r=>groupKey(r,mode)===b.key).length);
}
assert.equal(launchYear({launch:'-'}),'Unknown');assert.equal(launchYear({launch:'2020 Jan 01'}),'2020');
const fixture=[{category:'debris',length:null,launch:'-'},{category:'active',length:.1,launch:'2020 Jan 01'},{category:'inactive',length:10,launch:'2020 Jan 01'}];
assert.equal(aggregate(fixture,'size').find(b=>b.key==='unknown').total,1);
assert.equal(aggregate(fixture,'size').find(b=>b.key==='small').total,1);
assert.equal(aggregate(fixture,'size').find(b=>b.key==='large').total,1);
console.log(`Passed: all ${rows.length} records accounted for in each chart; launch-year and size boundaries verified.`);
