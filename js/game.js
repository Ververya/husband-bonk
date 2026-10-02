import {loadState,saveState,createState} from './storage.js';
import {mountCharacter,renderCharacter} from './character.js';
import {createEffects} from './effects.js';
import {milestones,initialDialogue,alertWarning,continueDialogue} from '../data/dialogues.js';
import {alerts} from '../data/alerts.js';
import {achievements} from '../data/achievements.js';
import {openLineShare,webShare,copyMessage,husbandAlertShareMessage} from './share.js';

const $=id=>document.getElementById(id);
let state=loadState();
let combo=0,comboTimer=null,statusTimer=null,achievementTimer=null;
let storageFailed=false;
let shareCycle=0;
const achievementQueue=[];
const media=matchMedia('(prefers-reduced-motion: reduce)');
const effects=createEffects($('effects'));
mountCharacter($('character'));
function reduced(){return state.settings.reduceMotion||media.matches;}
function persist(){storageFailed=!saveState(state);if(storageFailed){clearTimeout(statusTimer);$('status').classList.remove('fading');$('status').textContent='瀏覽器無法儲存；本次紀錄僅保留到頁面關閉。';}}
function render(){
  const over=state.sessionHits>=30&&state.sessionAcknowledged;
  $('count').textContent=state.sessionHits;
  $('count-limit').textContent=over?' BONKS':' / 30';
  $('session-mode').textContent=over?'OVER BONK MODE':'30 下，一次小小紓壓';
  $('progress').setAttribute('aria-valuenow',Math.min(state.sessionHits,30));
  $('progress').setAttribute('aria-valuetext',`${state.sessionHits} BONKS${over?'，OVER BONK MODE':''}`);
  $('progress-fill').style.width=`${Math.min(state.sessionHits/30,1)*100}%`;
  $('alert-count').textContent=state.alertHits>=100?'🚨 100+':`${state.alertHits} / 100`;
  $('alert-progress').setAttribute('aria-valuenow',Math.min(state.alertHits,100));
  $('alert-progress').setAttribute('aria-valuetext',`${state.alertHits} 下累積欠揍值`);
  $('alert-progress-fill').style.width=`${Math.min(state.alertHits,100)}%`;
  $('notify').hidden=state.alertHits<100;
  $('husband').setAttribute('aria-label',`BONK 老公一下，本次 ${state.sessionHits} 下，累積警戒 ${state.alertHits} 下`);
  renderCharacter($('character'),state.sessionHits);
  document.body.classList.toggle('reduced',reduced());
  $('reduce-motion').checked=state.settings.reduceMotion;
  $('stat-lifetime').textContent=state.lifetimeHits;
  $('stat-alerts').textContent=state.alertCount;
  $('stat-highest').textContent=state.highestSessionHits;
}
function clearCombo(){clearTimeout(comboTimer);comboTimer=null;combo=0;$('combo').textContent='';}
function status(text){
  if(storageFailed)return;
  clearTimeout(statusTimer);$('status').classList.remove('fading');$('status').textContent=text;
  statusTimer=setTimeout(()=>{$('status').classList.add('fading');statusTimer=null;},1500);
}
function showRage(afterAlert=false){
  if(document.querySelector('dialog[open]'))return;
  $('rage-title').textContent=afterAlert?'還要繼續嗎？':'本次已成功揍老公 30 下。';
  $('rage-question').textContent=afterAlert?'本次怒氣還在，妳決定。':'有舒服一點嗎？';
  $('release').textContent=afterAlert?'😌 今天先放過他':'😌 舒服一點了';
  $('continue-session').textContent=afterAlert?'😑 我還沒完':'😑 還沒。';
  $('rage-dialog').showModal();effects.celebrate(reduced());clearCombo();
}
function alertMessage(){return alerts[state.alertMessageIndex]||alerts[0];}
function showAlert(){
  if(document.querySelector('dialog[open]'))return;
  if(!Number.isInteger(state.alertMessageIndex)||!alerts[state.alertMessageIndex]){
    state.alertMessageIndex=Math.floor(Math.random()*alerts.length);persist();
  }
  $('alert-message').textContent=alertMessage();
  $('share-complete').hidden=!state.sharePending;
  $('share-status').textContent=state.sharePending?'分享後請按「我已完成分享」。尚未送出也可以先保留。':'請自行選擇收件人與送出。開啟分享不會清除計數。';
  $('copy-text').hidden=true;
  $('alert-dialog').showModal();effects.celebrate(reduced());clearCombo();
}
function pendingEvent(){
  if(state.alertHits>=100&&!state.alertAcknowledged)showAlert();
  else if(state.sessionHits>=30&&!state.sessionAcknowledged)showRage();
}
function displayAchievement(){
  if(document.hidden||achievementTimer||!achievementQueue.length)return;
  $('achievement').textContent=achievementQueue.shift();$('achievement').hidden=false;
  achievementTimer=setTimeout(()=>{$('achievement').hidden=true;achievementTimer=null;displayAchievement();},2200);
}
function unlockAchievements(){
  for(const item of achievements){
    if(state.lifetimeHits>=item.hits&&!state.unlockedAchievements.includes(item.hits)){
      state.unlockedAchievements.push(item.hits);achievementQueue.push(item.title);
    }
  }
  displayAchievement();
}
function hit(event){
  if(document.hidden||document.querySelector('dialog[open]'))return;
  state.sessionHits=Math.min(Number.MAX_SAFE_INTEGER,state.sessionHits+1);
  state.alertHits=Math.min(Number.MAX_SAFE_INTEGER,state.alertHits+1);
  state.lifetimeHits=Math.min(Number.MAX_SAFE_INTEGER,state.lifetimeHits+1);
  state.highestSessionHits=Math.max(state.highestSessionHits,state.sessionHits);
  state.lastHitAt=new Date().toISOString();unlockAchievements();persist();render();
  combo++;clearTimeout(comboTimer);
  $('combo').textContent=combo>=5?`${combo} COMBO`:'';
  comboTimer=setTimeout(clearCombo,1200);
  if(state.alertHits===99)$('speech').textContent=alertWarning;
  else if(milestones[state.sessionHits])$('speech').textContent=milestones[state.sessionHits];
  const rect=$('effects').getBoundingClientRect();
  const x=event.detail&&Number.isFinite(event.clientX)?event.clientX-rect.left:rect.width/2;
  const y=event.detail&&Number.isFinite(event.clientY)?event.clientY-rect.top:150;
  effects.hit(Math.max(40,Math.min(rect.width-40,x)),Math.max(50,Math.min(rect.height-50,y)),reduced());
  effects.animate($('character'),'bonk',reduced());effects.animate($('game'),'shake',reduced());effects.animate($('count'),'pop',reduced());
  pendingEvent();
}
function resetSession(){
  clearCombo();effects.clear();state.sessionHits=0;state.sessionAcknowledged=false;
  persist();render();$('speech').textContent=initialDialogue;status('好，今天先放過他。');$('husband').focus();
}
function acknowledgeRage(){state.sessionAcknowledged=true;persist();render();$('speech').textContent=continueDialogue;$('husband').focus();}
function keepAlert(){
  state.alertAcknowledged=true;persist();$('alert-dialog').close();render();
  pendingEvent();if(!document.querySelector('dialog[open]'))$('husband').focus();
}
function clearAlert(shared){
  shareCycle++;
  state.alertHits=0;state.alertAcknowledged=false;state.alertMessageIndex=null;state.sharePending=false;
  if(shared)state.alertCount++;
  persist();$('alert-dialog').close();render();
  if(state.sessionHits>=30)showRage(true);else {$('husband').focus();status(shared?'警告已分享，本次怒氣保留。':'這次算了，重新累積。');}
}
function markSharePending(){if(state.alertHits<100)return;state.sharePending=true;persist();$('share-complete').hidden=false;$('share-status').textContent='請在分享介面自行選擇收件人與送出；完成後再按「我已完成分享」。';}
async function copyAlert(){
  const cycle=shareCycle;
  const copied=await copyMessage(husbandAlertShareMessage());
  if(cycle!==shareCycle||state.alertHits<100)return;
  $('copy-text').value=husbandAlertShareMessage();$('copy-text').hidden=copied;
  if(!copied){$('copy-text').focus();$('copy-text').select();}
  markSharePending();$('share-status').textContent=copied?'訊息已複製；尚未送出。貼上並分享完成後再確認。':'請手動複製上方訊息；完成分享後再確認。';
}
async function useWebShare(){
  const cycle=shareCycle;
  const result=await webShare(husbandAlertShareMessage());
  if(cycle!==shareCycle||state.alertHits<100)return;
  if(result==='offline'){$('share-status').textContent='先幫妳留著。等有網路再傳給他。';return;}
  if(result==='cancelled'){$('share-status').textContent='已取消分享，累積警戒值保留。';return;}
  if(result==='handed-off')markSharePending();else await copyAlert();
}
$('husband').addEventListener('click',hit);
$('husband').addEventListener('contextmenu',event=>event.preventDefault());
$('release').addEventListener('click',()=>{$('rage-dialog').close();resetSession();});
$('continue-session').addEventListener('click',()=>{$('rage-dialog').close();acknowledgeRage();});
$('rage-dialog').addEventListener('cancel',event=>{event.preventDefault();$('rage-dialog').close();acknowledgeRage();});
$('alert-dialog').addEventListener('cancel',event=>{event.preventDefault();keepAlert();});
$('keep-alert').addEventListener('click',keepAlert);
$('notify').addEventListener('click',showAlert);
$('line-share').addEventListener('click',async()=>{
  const result=openLineShare(husbandAlertShareMessage());
  if(result==='offline')$('share-status').textContent='先幫妳留著。等有網路再傳給他。';
  else if(result==='opened')markSharePending();else await useWebShare();
});
$('web-share').addEventListener('click',useWebShare);
$('copy-message').addEventListener('click',copyAlert);
$('share-complete').addEventListener('click',()=>{if(state.sharePending&&state.alertHits>=100)clearAlert(true);});
$('forgive-alert').addEventListener('click',()=>{if(confirm('這次算了，將累積警戒值歸零？本次怒氣與終生紀錄會保留。'))clearAlert(false);});
$('settings-button').addEventListener('click',()=>{render();$('settings-dialog').showModal();});
$('close-settings').addEventListener('click',()=>{$('settings-dialog').close();});
$('reduce-motion').addEventListener('change',()=>{state.settings.reduceMotion=$('reduce-motion').checked;effects.clear();persist();render();});
media.addEventListener('change',()=>{effects.clear();render();});
$('reset').addEventListener('click',()=>{$('reset-dialog').showModal();});
$('cancel-reset').addEventListener('click',()=>{$('reset-dialog').close();});
$('confirm-reset').addEventListener('click',()=>{$('reset-dialog').close();$('settings-dialog').close();resetSession();});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){clearCombo();effects.clear();clearTimeout(statusTimer);statusTimer=null;clearTimeout(achievementTimer);achievementTimer=null;$('achievement').hidden=true;}
  else displayAchievement();
});
render();persist();
$('speech').textContent=state.alertHits===99?alertWarning:milestones[state.sessionHits]||initialDialogue;
pendingEvent();

if(new URLSearchParams(location.search).get('dev')==='true'){
  const panel=document.createElement('aside');panel.className='dev-panel';panel.setAttribute('aria-label','Developer Panel');
  const title=document.createElement('h3');title.textContent='Developer Panel · Two Counters';panel.append(title);
  function devButton(label,action){const button=document.createElement('button');button.textContent=label;button.addEventListener('click',action);panel.append(button);}
  function setCounter(key,hits){
    clearCombo();state[key]=hits;
    if(key==='sessionHits'){state.sessionAcknowledged=hits>30;state.highestSessionHits=Math.max(state.highestSessionHits,hits);}
    if(key==='alertHits'){state.alertAcknowledged=false;state.alertMessageIndex=null;state.sharePending=false;}
    if(key==='lifetimeHits')state.unlockedAchievements=achievements.filter(item=>hits>=item.hits).map(item=>item.hits);
    state.lifetimeHits=Math.max(state.lifetimeHits,state.sessionHits,state.alertHits);persist();render();
  }
  for(const hits of [0,29,30,45])devButton(`Set Session ${hits}`,()=>setCounter('sessionHits',hits));
  for(const hits of [0,99,100])devButton(`Set Alert ${hits}`,()=>setCounter('alertHits',hits));
  for(const hits of [299,499,999])devButton(`Set Lifetime ${hits}`,()=>setCounter('lifetimeHits',hits));
  devButton('Trigger Rage Released',()=>{setCounter('sessionHits',Math.max(state.sessionHits,30));if(state.alertHits>=100&&!state.alertAcknowledged)showAlert();else showRage();});
  devButton('Trigger Husband Alert',()=>{setCounter('alertHits',Math.max(state.alertHits,100));showAlert();});
  devButton('Reset Session Only',resetSession);
  devButton('Reset Alert Only',()=>{if(confirm('清除累積警戒值？'))setCounter('alertHits',0);});
  devButton('Reset All',()=>{if(confirm('清除所有測試紀錄？舊版存檔仍會保留。')){state=createState();resetSession();}});
  document.body.append(panel);
}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./service-worker.js').catch(()=>status('離線快取尚未就緒；目前仍可正常遊玩。'));}
