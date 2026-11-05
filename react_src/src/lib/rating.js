import {S} from './storage';
// Adolatli oylik reyting: Sifat + Muntazamlik + O'sish + O'z vaqtida + Extra bonus
export function calcRating(studentId){
  const W={q:50,r:25,g:15,t:10,xMax:10,...(S.get('rating_weights')||{})};
  const st=(S.get('students')||[]).find(s=>s.id===studentId);
  const grp=(S.get('groups')||[]).find(g=>st&&g.id===st.groupId);
  const d=new Date(),ym=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`;
  const cur=ym(d),prev=ym(new Date(d.getFullYear(),d.getMonth()-1,1));
  const all=(S.get('hw_records')||[]).filter(r=>r.studentId===studentId&&r.avgScore!=null);
  const mo=m=>all.filter(r=>(r.date||'').slice(0,7)===m);
  const avg=a=>a.length?a.reduce((x,r)=>x+r.avgScore,0)/a.length:0;
  const c=mo(cur).filter(r=>!r.extra),x=mo(cur).filter(r=>r.extra),p=mo(prev).filter(r=>!r.extra);
  if(!c.length&&!x.length)return{score:0,days:0,avg:0};
  const days=new Set(c.map(r=>r.date.slice(0,10))).size;
  const exp=Math.max(1,(grp?.days?grp.days.split(',').length:3)*4);
  const reg=Math.min(1,days/exp),gr=p.length?Math.max(0,Math.min(1,(avg(c)-avg(p)+20)/40)):0.5;
  const tm=c.length?c.filter(r=>!r.late).length/c.length:0;
  const score=Math.round(avg(c)/100*W.q+reg*W.r+gr*W.g+tm*W.t+Math.min(W.xMax,x.length*2));
  return{score,days,avg:Math.round(avg(c))};
}
