import {useState} from 'react';import {useAuth} from '../lib/auth';import {changePassword} from '../lib/account';
export default function ChangePassword(){const {user}=useAuth(),[f,setF]=useState({o:'',n:'',c:''}),[m,setM]=useState(null);
  const go=()=>{if(f.n!==f.c)return setM({e:'Yangi parollar bir xil emas.'});const e=changePassword(user,f.o,f.n);setM(e?{e}:{ok:'Parol o\'zgartirildi ✓'});if(!e)setF({o:'',n:'',c:''})};
  return <div className="card"><b>🔑 Parolni o'zgartirish</b>{m&&<div style={{color:m.e?'var(--danger)':'var(--success)',margin:'6px 0'}}>{m.e||m.ok}</div>}
   {[['o','Joriy parol'],['n','Yangi parol'],['c','Yangi parolni tasdiqlang']].map(([k,l])=><input key={k} className="fi" type="password" placeholder={l} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} style={{marginTop:8}}/>)}<button className="btn btn-p" style={{marginTop:10}} onClick={go}>Saqlash</button></div>}
