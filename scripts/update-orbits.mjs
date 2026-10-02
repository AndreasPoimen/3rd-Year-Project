import {readFile,writeFile,rename} from 'node:fs/promises';
import {parseRow} from '../orbit-math.js';
const path=new URL('../orbit-data/satnogs.json',import.meta.url);
const statusPath=new URL('../orbit-data/update-status.json',import.meta.url);
const source='https://db.satnogs.org/api/tle/?format=json';
let previous={};try{previous=JSON.parse(await readFile(statusPath,'utf8'));}catch{}
if(previous.blocked){throw Error('Provider access paused after refusal. Review provider policy and remove blocked status before resuming.');}
try{
 const response=await fetch(source,{headers:{'User-Agent':'MIDAS-Educational-Orbit-Viewer/1.0 (github.com/AndreasPoimen/3rd-Year-Project)'},signal:AbortSignal.timeout(60000)});
 if(!response.ok){const err=new Error('Provider HTTP '+response.status);err.blocked=[401,403,429].includes(response.status);throw err;}
 const rows=await response.json();
 if(!Array.isArray(rows)||!rows.length)throw Error('Provider did not return a nonempty catalogue');
 for(const row of rows)parseRow(row);
 const data={source,attribution:'SatNOGS DB / Libre Space Foundation',license:'https://creativecommons.org/licenses/by-sa/4.0/',modifications:'Original records wrapped with retrieval and licence metadata. Positions and filtering calculated separately by MIDAS.',fetchedAt:new Date().toISOString(),rows};
 const temp=new URL('../orbit-data/satnogs.tmp',import.meta.url);
 await writeFile(temp,JSON.stringify(data));await rename(temp,path);
 await writeFile(statusPath,JSON.stringify({checkedAt:data.fetchedAt,ok:true,records:rows.length,blocked:false},null,2));
 console.log('Updated '+rows.length+' real orbital records.');
}catch(error){
 await writeFile(statusPath,JSON.stringify({checkedAt:new Date().toISOString(),ok:false,blocked:!!error.blocked,error:error.message},null,2));
 console.error(error.message+'; last good catalogue preserved.');process.exitCode=1;
}
