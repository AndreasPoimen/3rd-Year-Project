export const categories={active:{label:'Active satellite',color:'#56e5ac'},inactive:{label:'Inactive satellite',color:'#7da9ff'},debris:{label:'Debris fragment',color:'#ff7188'},rocket:{label:'Rocket body',color:'#ffb45e'},component:{label:'Detached component',color:'#d49aff'},unknown:{label:'Unknown type / status',color:'#a6b2c0'}};
export function category(code){return ({A:'active',P:'inactive',D:'debris',R:'rocket',C:'component'})[code]||'unknown';}
export function dimension(meta,basis='length'){const value=meta?.[basis];return Number.isFinite(value)&&value>0?value:null;}
export function sizeBand(value){return value===null?'unknown':value<.1?'tiny':value<1?'small':value<10?'medium':'large';}
export function matches(meta,filters){const value=dimension(meta,filters.basis);return (filters.type==='all'||(meta?.category||'unknown')===filters.type)&&(filters.size==='all'||sizeBand(value)===filters.size)&&(filters.estimates||!(meta?.[filters.basis+'Estimated']));}
export function dimensionLabel(meta,basis='length'){const value=dimension(meta,basis);return value===null?'Unknown':`${value} m${meta[basis+'Estimated']?' (estimated)':''}`;}
