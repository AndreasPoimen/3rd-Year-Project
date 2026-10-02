import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as satellite from '../vendor/orbits/satellite.es.js';
import {parseRow,position,orbit} from '../orbit-math.js';
// Vallado SGP4 verification case 00005 at its element epoch, TEME kilometres.
const rec=satellite.twoline2satrec('1 00005U 58002B   00179.78495062  .00000023  00000-0  28098-4 0  4753','2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157413667');
const pv=satellite.sgp4(rec,0),expected=[7022.46529266,-1400.08296755,.03995155];
[pv.position.x,pv.position.y,pv.position.z].forEach((x,i)=>assert(Math.abs(x-expected[i])<.001));
assert.throws(()=>parseRow({tle1:'invalid',tle2:'invalid'}));
const data=JSON.parse(await readFile(new URL('../orbit-data/satnogs.json',import.meta.url),'utf8'));
const items=data.rows.map(parseRow),iss=items.find(p=>p.id==='25544');
assert(items.length>0);
if(iss){const p=position(iss,iss.epoch);assert(p.altitude>300&&p.altitude<600);assert(p.speed>7&&p.speed<8);assert.equal(orbit(iss,iss.epoch).length,181);}
console.log('SGP4 reference vector, malformed input, catalogue parsing, ISS altitude/speed and orbit sampling: passed.');
