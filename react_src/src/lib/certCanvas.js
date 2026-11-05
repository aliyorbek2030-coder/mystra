import {CS} from './certData';
const fmtD=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
function wrapText(ctx,text,x,y,maxW,lh){
  const words=(text||'').split(' ');let line='';
  for(const w of words){const t=line+w+' ';if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line.trim(),x,y);line=w+' ';y+=lh;}else line=t;}
  if(line.trim())ctx.fillText(line.trim(),x,y);
}
export function drawCertBlob(cert,student){
  return new Promise(resolve=>{
    const W=900,H=520;
    const canvas=document.createElement('canvas');
    canvas.width=W;canvas.height=H;
    const ctx=canvas.getContext('2d');
    const st=cert.style||CS[0];

    // Parse gradient stops from CSS string
    const m=st.bg.match(/#[0-9a-fA-F]{3,6}/g)||['#1a1a2e','#16213e','#0f3460'];
    const g=ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,m[0]);g.addColorStop(0.5,m[1]||m[0]);g.addColorStop(1,m[2]||m[1]||m[0]);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    // Pattern
    ctx.save();ctx.globalAlpha=0.05;ctx.fillStyle='#fff';
    for(let x=0;x<W;x+=28)for(let y=0;y<H;y+=28){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
    ctx.restore();

    // Deco circles
    ctx.save();ctx.globalAlpha=0.07;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(W-80,90,160,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(70,H-70,120,0,Math.PI*2);ctx.fill();
    ctx.restore();

    // Borders
    ctx.strokeStyle=st.acc+'55';ctx.lineWidth=2;ctx.strokeRect(14,14,W-28,H-28);
    ctx.strokeStyle=st.acc+'22';ctx.lineWidth=1;ctx.strokeRect(22,22,W-44,H-44);

    // Tag
    ctx.fillStyle=st.acc+'30';
    ctx.beginPath();ctx.roundRect(38,38,230,26,13);ctx.fill();
    ctx.fillStyle=st.acc;ctx.font='bold 10px Arial';
    ctx.fillText('✦ CERTIFICATE OF ACHIEVEMENT ✦',50,56);

    // Title
    ctx.fillStyle='#fff';ctx.font='bold 28px Georgia';ctx.fillText('Certificate of Excellence',38,104);

    // By
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='13px Arial';ctx.fillText('This is to proudly certify that',38,130);

    // Name
    ctx.fillStyle=st.acc;ctx.font='italic bold 38px Georgia';ctx.fillText(student.name,38,180);

    // Message
    ctx.fillStyle='rgba(255,255,255,0.82)';ctx.font='13px Arial';
    wrapText(ctx,cert.msg||'',38,210,W-80,20);

    // Score
    ctx.fillStyle=st.acc;ctx.font='bold 50px Arial';ctx.fillText(cert.avgScore+'%',38,278);

    // Quote
    ctx.fillStyle=st.acc;ctx.fillRect(38,300,3,60);
    ctx.fillStyle='rgba(255,255,255,0.65)';ctx.font='italic 13px Georgia';
    wrapText(ctx,cert.quote||'',52,320,W-100,20);

    // Footer
    ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(38,H-80);ctx.lineTo(W-38,H-80);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.fillText('Muslima Teacher',38,H-52);
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='11px Arial';ctx.fillText('Verified & Approved · MYSTRA',38,H-34);

    const ds=fmtD(cert.date);
    const dw=ctx.measureText(ds).width;
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillText(ds,W-38-dw,H-52);

    // Watermark
    ctx.save();ctx.globalAlpha=0.05;ctx.fillStyle='#fff';ctx.font='bold 90px Georgia';
    ctx.textAlign='center';ctx.fillText('MYSTRA',W/2,H/2+30);ctx.restore();

    canvas.toBlob(blob=>resolve(blob),'image/png',0.95);
  });
}
