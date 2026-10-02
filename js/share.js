export const ALERT_THRESHOLD=100;
export function husbandAlertShareMessage(){return `🚨 HUSBAND ALERT 🚨

老公，事情有點嚴重。

你的老婆最近已經默默累積了 ${ALERT_THRESHOLD} 下。

⚠️ ${ALERT_THRESHOLD} 下不是今日限定。
是。
累。
積。
的。

今天的抱抱倒是可以立即供應。

——《老公欠揍計數器》

────────────

🛟 老公求生指南

系統正在分析最佳解法⋯⋯

分析完成。

我也無法救你。

祝你好運。🙂`;}
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
