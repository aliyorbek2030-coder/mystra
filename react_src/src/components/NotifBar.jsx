import {useState} from 'react';import {useNavigate} from 'react-router-dom';import {unread,markRead} from '../lib/notify';
export default function NotifBar({to}){const [,b]=useState(0),nav=useNavigate(),n=unread(to).slice(-5).reverse();if(!n.length)return null;
  return <div className="card" style={{margin:12,borderColor:'var(--accent)'}}><b>🔔 Yangi xabarlar ({n.length})</b>
   {n.map(x=><div key={x.id} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'6px 0'}}><span>{x.text}</span>
    <span style={{whiteSpace:'nowrap'}}><button className="btn btn-p" onClick={()=>{markRead(x.id);nav(x.page||'/')}}>Ochish</button> <button className="btn" onClick={()=>{markRead(x.id);b(v=>v+1)}}>✕</button></span></div>)}</div>}
