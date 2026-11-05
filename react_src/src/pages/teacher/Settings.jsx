import {useState} from 'react';import ChangePassword from '../../components/ChangePassword';import {S,today} from '../../lib/storage';

// --- DESIGN ONLY (no logic) ---
const PAGE={width:'100%',maxWidth:'none',margin:0,boxSizing:'border-box',padding:0,fontFamily:"'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",color:'#111',backgroundColor:'#f7f7f6',minHeight:'100vh'};
const HEADER={backgroundColor:'#fff',borderBottom:'1px solid #e8e8e6',padding:'24px 24px 14px'};
const CARD={backgroundColor:'#fff',border:'1px solid #e2e2e0',borderRadius:8,padding:'16px 18px',boxSizing:'border-box',marginBottom:14};
const CARD_TITLE={display:'block',fontSize:14,fontWeight:600,color:'#111',marginBottom:12};
const LABEL={display:'block',fontSize:11,fontWeight:500,color:'#8a8a88',letterSpacing:'0.04em',textTransform:'uppercase',marginBottom:4};
const FIELD={width:'100%',boxSizing:'border-box',padding:'9px 12px',borderRadius:6,border:'1px solid #e2e2e0',backgroundColor:'#f5f5f3',color:'#111',fontFamily:'inherit',fontSize:13,outline:'none',boxShadow:'0 0 0 1000px #f5f5f3 inset',WebkitTextFillColor:'#111'};
const GRID={display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:12};
const BTN_P={padding:'9px 16px',backgroundColor:'#111',color:'#fff',border:'1px solid #111',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:500};
const BTN_S={padding:'9px 16px',backgroundColor:'#fff',color:'#111',border:'1px solid #d4d4d2',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:500};
const CHECK={display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#111',marginTop:10,cursor:'pointer'};

const F=({l,v,f})=><div><span style={LABEL}>{l}</span><input className="fi" type="number" min="0" value={v} onChange={f} style={FIELD}/></div>;
export default function Settings(){const w0={q:50,r:25,g:15,t:10,xMax:10,...(S.get('rating_weights')||{})},[w,setW]=useState(w0),[lp,setLp]=useState(S.get('late_pen')??5),[bot,setBot]=useState(S.get('bot_cfg')||{token:'',gid:''}),[tg,setTg]=useState({teacher:1,tasks:1,...(S.get('tg_opts')||{})}),[theme,setTheme]=useState(S.get('theme')||'');
const n=k=>e=>setW({...w,[k]:Number(e.target.value)||0});
const save=()=>{if(w.q+w.r+w.g+w.t!==100)return alert("Ulushlar yig'indisi 100 bo'lsin ("+(w.q+w.r+w.g+w.t)+")");S.set('rating_weights',w);S.set('late_pen',Number(lp)||0);S.set('bot_cfg',bot);S.set('tg_opts',tg);alert('Saqlandi ✓')};
const pick=t=>{setTheme(t);S.set('theme',t);document.documentElement.dataset.theme=t};
const exp=()=>{const data={};Object.keys(localStorage).filter(k=>k.startsWith('mys_')).forEach(k=>{const m=k.slice(4);if(!['session','bot_cfg'].includes(m))data[m]=S.get(m)});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:'mystra',version:2,data},null,2)],{type:'application/json'}));a.download='mystra_backup_'+today()+'.json';a.click()};
const imp=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result),d=j.data||j,k=Object.keys(d).filter(x=>!['session','bot_cfg'].includes(x));if(!k.length||!confirm("Ma'lumotlar ALMASHTIRILADI. Davom etamizmi?"))return;k.forEach(x=>S.set(x,d[x]));location.reload()}catch{alert("Fayl noto'g'ri")}};r.readAsText(f)};
return <div style={PAGE}>
<div style={HEADER}>
<h1 style={{fontSize:18,fontWeight:600,margin:'0 0 2px 0',color:'#111'}}>Sozlamalar</h1>
<p style={{color:'#8a8a88',margin:0,fontSize:13}}>Reyting, Telegram, tema va zaxira nusxa</p>
</div>

<div style={{padding:24}}>

<div style={CARD}>
<b style={CARD_TITLE}>Reyting ulushlari (jami 100)</b>
<div style={GRID}>
<F l="Sifat" v={w.q} f={n('q')}/>
<F l="Muntazamlik" v={w.r} f={n('r')}/>
<F l="O'sish" v={w.g} f={n('g')}/>
<F l="O'z vaqtida" v={w.t} f={n('t')}/>
<F l="Extra bonus (oyiga max ball)" v={w.xMax} f={n('xMax')}/>
<F l="Kechikish jarimasi (kuniga %)" v={lp} f={e=>setLp(e.target.value)}/>
</div>
</div>

<div style={CARD}>
<b style={CARD_TITLE}>Telegram</b>
<div style={GRID}>
<div><span style={LABEL}>Bot token</span><input className="fi" placeholder="Bot token" value={bot.token} onChange={e=>setBot({...bot,token:e.target.value})} style={FIELD}/></div>
<div><span style={LABEL}>Chat/Group ID</span><input className="fi" placeholder="Chat/Group ID" value={bot.gid} onChange={e=>setBot({...bot,gid:e.target.value})} style={FIELD}/></div>
</div>
<label style={{...CHECK,marginTop:14}}><input type="checkbox" checked={!!tg.teacher} onChange={e=>setTg({...tg,teacher:e.target.checked?1:0})}/> Topshirilgan ish va so'rovlar</label>
<label style={CHECK}><input type="checkbox" checked={!!tg.tasks} onChange={e=>setTg({...tg,tasks:e.target.checked?1:0})}/> Yangi vazifa e'loni</label>
</div>

<button className="btn btn-p" style={{...BTN_P,marginBottom:14}} onClick={save}>Saqlash</button>

<div style={CARD}>
<b style={CARD_TITLE}>Tema</b>
<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{['','dark','pink','purple','gold','black','neon'].map(t=><button key={t} className={'btn '+(theme===t?'btn-p':'')} style={theme===t?BTN_P:BTN_S} onClick={()=>pick(t)}>{t||'standart'}</button>)}</div>
</div>

<ChangePassword/>

<div style={CARD}>
<b style={CARD_TITLE}>Zaxira nusxa</b>
<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
<button className="btn" style={BTN_S} onClick={exp}>⬇️ Eksport</button>
<label className="btn" style={{...BTN_S,cursor:'pointer'}}>⬆️ Import<input type="file" hidden accept=".json" onChange={imp}/></label>
</div>
</div>

</div>
</div>}