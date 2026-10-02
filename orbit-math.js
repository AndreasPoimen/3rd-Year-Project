import * as satellite from './vendor/orbits/satellite.es.js';
export const EARTH_RADIUS=6378.137;
export function parseRow(row){
 if(typeof row.tle1!=='string'||typeof row.tle2!=='string'||!row.tle1.startsWith('1 ')||!row.tle2.startsWith('2 '))throw Error('Invalid TLE');
 const rec=satellite.twoline2satrec(row.tle1,row.tle2),year=Number(row.tle1.slice(18,20)),day=Number(row.tle1.slice(20,32));
 const epoch=Date.UTC(year<57?2000+year:1900+year,0,1)+(day-1)*86400000;
 const meanMotion=Number(row.tle2.slice(52,63)),eccentricity=Number('0.'+row.tle2.slice(26,33).trim()),inclination=Number(row.tle2.slice(8,16));
 if(!Number.isFinite(epoch)||!(meanMotion>0)||!Number.isFinite(inclination))throw Error('Invalid orbital elements');
 const a=Math.cbrt(398600.4418/(meanMotion*2*Math.PI/86400)**2),period=1440/meanMotion;
 const regime=eccentricity>.25?'heo':a-EARTH_RADIUS<2000?'leo':Math.abs(period-1436)<40?'geo':'meo';
 return {row,rec,epoch,meanMotion,eccentricity,inclination,period,regime,name:String(row.tle0||'Unnamed object').replace(/^0\s+/,''),id:String(row.norad_cat_id)};
}
export function position(item,time){
 try{const date=new Date(time),pv=satellite.propagate(item.rec,date);if(!pv?.position||!pv.velocity||![pv.position.x,pv.position.y,pv.position.z].every(Number.isFinite))return null;const gmst=satellite.gstime(date),ecf=satellite.eciToEcf(pv.position,gmst),geo=satellite.eciToGeodetic(pv.position,gmst);if(geo.height<0)return null;return {xyz:[ecf.x/EARTH_RADIUS,ecf.z/EARTH_RADIUS,-ecf.y/EARTH_RADIUS],altitude:geo.height,speed:Math.hypot(pv.velocity.x,pv.velocity.y,pv.velocity.z),lat:geo.latitude*180/Math.PI,lon:geo.longitude*180/Math.PI};}catch{return null;}
}
export function orbit(item,time){const points=[],rotation=satellite.gstime(new Date(time));for(let i=0;i<=180;i++){try{const pv=satellite.propagate(item.rec,new Date(time+i*item.period*60000/180));if(!pv?.position)return [];const q=satellite.eciToEcf(pv.position,rotation);if(![q.x,q.y,q.z].every(Number.isFinite))return [];points.push([q.x/EARTH_RADIUS,q.z/EARTH_RADIUS,-q.y/EARTH_RADIUS]);}catch{return [];}}return points;}
