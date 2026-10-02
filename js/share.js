export const ALERT_THRESHOLD=100;
export function husbandAlertShareMessage(currentAlertMessage){return `🚨 HUSBAND ALERT

老公，事情有點嚴重。

你的老婆最近已經默默累積了 ${ALERT_THRESHOLD} 下。

────────────

${currentAlertMessage}

────────────

🛟 老公求生建議

祝 你 好 運 🙂`;}
export function lineShareUrl(text){return `https://line.me/R/share?text=${encodeURIComponent(text)}`;}
export function openLineShare(text){
  if(!navigator.onLine)return 'offline';
  console.info('[SHARE READY]');
  let popup;
  try{popup=window.open(lineShareUrl(text),'_blank');}catch{return 'blocked';}
  if(!popup)return 'blocked';
  try{popup.opener=null;}catch{}
  return 'opened';
}
export async function webShare(text){
  if(!navigator.onLine)return 'offline';
  if(!navigator.share)return 'unsupported';
  try{await navigator.share({text});return 'handed-off';}
  catch(error){return error.name==='AbortError'?'cancelled':'failed';}
}
export async function copyMessage(text){
  try{if(!navigator.clipboard?.writeText)return false;await navigator.clipboard.writeText(text);return true;}catch{return false;}
}
