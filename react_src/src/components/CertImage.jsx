import {useEffect,useState} from 'react';import {drawCertBlob} from '../lib/certCanvas';import {S} from '../lib/storage';
export async function sendCertTelegram(cert,student){const c=S.get('bot_cfg')||{};if(!c.token||!c.gid)return alert('Telegram sozlanmagan (Sozlamalar)');
  try{const blob=await drawCertBlob(cert,student),fd=new FormData();fd.append('chat_id',c.gid);fd.append('photo',blob,'certificate.png');fd.append('caption',`🏆 ${student.name} — ${cert.avgScore}%`);
    const r=await(await fetch(`https://api.telegram.org/bot${c.token}/sendPhoto`,{method:'POST',body:fd})).json();alert(r.ok?'Yuborildi ✓':r.description)}catch{alert('Tarmoq xatosi')}}
export async function sendCertQuiet(cert,student){const c=S.get('bot_cfg')||{};if(!c.token||!c.gid)return false;try{const fd=new FormData();fd.append('chat_id',c.gid);fd.append('photo',await drawCertBlob(cert,student),'certificate.png');fd.append('caption',`🏆 ${student.name} — ${cert.avgScore}%`);return(await(await fetch(`https://api.telegram.org/bot${c.token}/sendPhoto`,{method:'POST',body:fd})).json()).ok}catch{return false}}
export default function CertImage({cert,student,canSend}){const [url,setUrl]=useState('');
  useEffect(()=>{let u;drawCertBlob(cert,student).then(b=>{u=URL.createObjectURL(b);setUrl(u)});return()=>u&&URL.revokeObjectURL(u)},[cert.id,student.name]);
  return <div className="card">{url?<img src={url} alt="certificate" style={{width:'100%',borderRadius:10}}/>:'...'}
   <div style={{display:'flex',gap:8,marginTop:8}}>{url&&<a className="btn" href={url} download={`certificate_${student.name}.png`}>⬇️ Yuklab olish</a>}{canSend&&<button className="btn btn-p" onClick={()=>sendCertTelegram(cert,student)}>✈️ Telegram</button>}</div></div>}
