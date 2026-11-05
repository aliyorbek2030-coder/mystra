import {S,uid} from './storage';
export async function tgSend(kind,text){try{const o={teacher:1,tasks:1,...(S.get('tg_opts')||{})},c=S.get('bot_cfg')||{};if(!o[kind]||!c.token||!c.gid)return;
  await fetch(`https://api.telegram.org/bot${c.token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:c.gid,text:'MYSTRA: '+text})})}catch(e){console.warn('Telegram',e)}}
export function notify(to,text,page){if(to==='teacher')tgSend('teacher','🔔 '+text);const n=S.get('notifs')||[];n.push({id:uid(),to,text,page,date:Date.now(),read:false});S.set('notifs',n)} // TODO backend: POST /notifications
export const unread=to=>(S.get('notifs')||[]).filter(x=>x.to===to&&!x.read);
export function markRead(id){const a=S.get('notifs')||[],x=a.find(y=>y.id===id);if(x)x.read=true;S.set('notifs',a);return x}
