import {S,today} from './storage';
export const ymNow=()=>today().slice(0,7);
export const esc=s=>String(s??'');
export const getStudentPrice=s=>Number(((S.get('pay_settings')||{}).levelPrices||{})[s.level])||0; // narx daraja bo'yicha
export const getPayment=(sid,ym)=>(S.get('payments')||[]).find(p=>p.studentId===sid&&p.ym===ym)||{status:'unpaid',paid:0};
export const netPrice=(s,ym)=>{const p=getPayment(s.id,ym);return Math.round(getStudentPrice(s)*(1-(p.discount||0)/100))}; // chegirma hisobga olingan narx
export function setPayment(sid,ym,{paid,method,note,discount},price){const a=S.get('payments')||[],i=a.findIndex(p=>p.studentId===sid&&p.ym===ym),net=Math.round(price*(1-(discount||0)/100)),
  r={studentId:sid,ym,paid,method:method||'naqd',note:note||'',discount:discount||0,date:new Date().toISOString(),status:paid>=net&&net>0?'paid':paid>0?'partial':'unpaid'};i<0?a.push(r):a[i]={...a[i],...r};S.set('payments',a)}
export function adjScore(s,t){const pen=Number(S.get('late_pen')??5);const late=t?.due&&s.date>t.due?Math.round((new Date(s.date)-new Date(t.due))/864e5):0;return Math.max(0,Math.round(s.ai.score*(1-Math.min(50,late*pen)/100)))}
export function attStats(id,ym){const a=S.get('attendance')||{};let p=0,t=0;Object.keys(a).filter(d=>d.startsWith(ym||ymNow())).forEach(d=>{if(a[d][id]){t++;if(a[d][id]==='p')p++}});return{p,t}}
export function streakXp(id){const r=(S.get('hw_records')||[]).filter(x=>x.studentId===id),days=new Set(r.map(x=>(x.date||'').slice(0,10)));let n=0,d=new Date();
  if(!days.has(d.toISOString().slice(0,10)))d.setDate(d.getDate()-1);while(days.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}
  const xp=r.reduce((a,x)=>a+Math.round((x.avgScore||0)/10)+(x.extra?5:0),0);return{streak:n,xp,lvl:Math.floor(Math.sqrt(xp/10))+1}}
// O'quvchi oylik arxivi
export function monthSummary(id){const recs=(S.get('hw_records')||[]).filter(r=>r.studentId===id),certs=(S.get('certificates')||[]).filter(c=>c.studentId===id),m={};
  recs.forEach(r=>{const y=(r.date||'').slice(0,7);(m[y]=m[y]||{ym:y,recs:[]}).recs.push(r)});
  return Object.values(m).map(x=>({ym:x.ym,n:x.recs.length,avg:Math.round(x.recs.reduce((a,r)=>a+r.avgScore,0)/x.recs.length),certs:certs.filter(c=>(c.date||'').startsWith(x.ym)).length,att:attStats(id,x.ym),recs:x.recs.sort((a,b)=>b.date.localeCompare(a.date))})).sort((a,b)=>b.ym.localeCompare(a.ym))}
