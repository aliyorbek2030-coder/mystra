import {S} from '../lib/storage';
export function drawReceipt(s,p,net){return new Promise(res=>{const W=600,H=380,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='#5B4BFF';x.fillRect(0,0,W,70);x.fillStyle='#fff';x.font='bold 26px Arial';x.fillText("MYSTRA · To'lov cheki",24,44);
  x.fillStyle='#12131A';x.font='bold 22px Arial';x.fillText(s.name,24,120);x.font='16px Arial';x.fillStyle='#3D4150';
  [['Daraja',s.level],['Oy',p.ym],['Narx (chegirma bilan)',Number(net).toLocaleString('ru-RU')+" so'm"],["To'langan",Number(p.paid).toLocaleString('ru-RU')+" so'm"],['Usul',p.method||'naqd'],['Sana',(p.date||'').slice(0,10)]].forEach(([k,v],i)=>{x.fillText(k+':',24,165+i*32);x.fillStyle='#12131A';x.fillText(String(v),240,165+i*32);x.fillStyle='#3D4150'});
  x.fillStyle=p.status==='paid'?'#1a8f4c':'#d98a00';x.font='bold 20px Arial';x.fillText(p.status==='paid'?"✓ TO'LANGAN":'QISMAN',24,H-24);c.toBlob(res,'image/png')})}
export async function receiptTelegram(s,p,net){const c=S.get('bot_cfg')||{};if(!c.token||!c.gid)return alert('Telegram sozlanmagan');const fd=new FormData();fd.append('chat_id',c.gid);fd.append('photo',await drawReceipt(s,p,net),'receipt.png');fd.append('caption',`💳 ${s.name} · ${p.ym}`);
  try{const r=await(await fetch(`https://api.telegram.org/bot${c.token}/sendPhoto`,{method:'POST',body:fd})).json();alert(r.ok?'Yuborildi ✓':r.description)}catch{alert('Tarmoq xatosi')}}
export async function receiptDownload(s,p,net){const a=document.createElement('a');a.href=URL.createObjectURL(await drawReceipt(s,p,net));a.download=`chek_${s.name}_${p.ym}.png`;a.click()}
