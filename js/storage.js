export const STORAGE_KEY='husbandBonk_v2';
export function createState(){return {schemaVersion:2,sessionHits:0,alertHits:0,lifetimeHits:0,alertCount:0,highestSessionHits:0,sessionAcknowledged:false,alertAcknowledged:false,alertMessageIndex:null,sharePending:false,unlockedAchievements:[],lastHitAt:null,settings:{reduceMotion:false}};}
function integer(value,max=Number.MAX_SAFE_INTEGER){return Number.isSafeInteger(value)&&value>=0?Math.min(value,max):0;}
function normalize(data){
  const state=createState();
  for(const key of ['sessionHits','alertHits','lifetimeHits','alertCount','highestSessionHits'])state[key]=integer(data[key]);
  state.highestSessionHits=Math.max(state.highestSessionHits,state.sessionHits);
  state.lifetimeHits=Math.max(state.lifetimeHits,state.sessionHits,state.alertHits);
  state.sessionAcknowledged=state.sessionHits>=30&&data.sessionAcknowledged===true;
  state.alertAcknowledged=state.alertHits>=100&&data.alertAcknowledged===true;
  state.sharePending=state.alertHits>=100&&data.sharePending===true;
  state.alertMessageIndex=Number.isInteger(data.alertMessageIndex)&&data.alertMessageIndex>=0?data.alertMessageIndex:null;
  state.unlockedAchievements=[...new Set((Array.isArray(data.unlockedAchievements)?data.unlockedAchievements:[]).filter(n=>[300,500,1000].includes(n)))];
  state.lastHitAt=typeof data.lastHitAt==='string'?data.lastHitAt:null;
  state.settings.reduceMotion=data.settings?.reduceMotion===true;return state;
}
export function migrateLegacy(data){
  const hits=integer(data.totalHits);const state=createState();
  state.alertHits=Math.min(hits,100);state.sessionHits=Math.min(hits,30);
  state.lifetimeHits=Math.max(integer(data.lifetimeHits),hits);
  state.alertCount=integer(data.alertCount);state.highestSessionHits=state.sessionHits;
  state.lastHitAt=typeof data.lastHitAt==='string'?data.lastHitAt:null;
  state.settings.reduceMotion=data.settings?.reduceMotion===true;
  state.unlockedAchievements=[300,500,1000].filter(n=>state.lifetimeHits>=n);
  return state;
}
export function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){const data=JSON.parse(raw);return data?.schemaVersion===2?normalize(data):createState();}
    const legacy=localStorage.getItem('husbandBonk_v1');
    if(legacy){const data=JSON.parse(legacy);if(data&&typeof data==='object'&&'totalHits' in data){const state=migrateLegacy(data);saveState(state);return state;}}
  }catch{}
  return createState();
}
export function saveState(state){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
