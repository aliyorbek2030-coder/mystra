export default function ProgressBar({pct,label,hint}){return(
 <div style={{position:'sticky',top:0,zIndex:5,background:'var(--bg)',padding:'8px 0'}}>
  <div style={{display:'flex',justifyContent:'space-between',fontWeight:700}}><span>{label}</span><span>{pct}%</span></div>
  <div style={{height:14,background:'var(--surface2)',borderRadius:99,overflow:'hidden',marginTop:6}}><div style={{width:pct+'%',height:'100%',background:'var(--accent)',transition:'width .4s'}}/></div>
  {hint&&<div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>{hint}</div>}</div>)}
