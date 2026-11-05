// localStorage qatlami (HTML versiya bilan bir xil 'mys_' kalitlari)
export const S={
  get:k=>{try{return JSON.parse(localStorage.getItem('mys_'+k))}catch{return null}},
  set:(k,v)=>{try{localStorage.setItem('mys_'+k,JSON.stringify(v))}catch(e){console.warn('storage',e)}},
};
export const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
export const today=()=>new Date().toISOString().slice(0,10);
