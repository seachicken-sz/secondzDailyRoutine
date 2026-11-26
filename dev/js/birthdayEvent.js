// Annual birthday selection (JST). Dev-only test override; remove before production.
(function(){
  const testDate = "2026-11-26";
  const testBirthday = "1997-11-27";
  const fresh = path => window.tamugotoFreshAssetUrl ? window.tamugotoFreshAssetUrl(path) : path;
  let members=[], active=null, dispose=null, loading=false;
  const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).filter(p=>["year","month","day"].includes(p.type)).reduce((a,p)=>(a[p.type]=p.value,a),{});
  function select(){
    const {year,month,day}=today(), date=year+"-"+month+"-"+day;
    const m=members.find(m=>m.enabled===true && /^\d{4}-\d{2}-\d{2}$/.test(m.birthday) && (m.birthday.slice(5)===date.slice(5) || (date===testDate && m.birthday===testBirthday)));
    if(!m)return null;
    const age=Number(year)-Number(m.birthday.slice(0,4));
    return {...m,id:"birthday_"+date.replace(/-/g,""),dateText:date.replace(/-/g,"."),hashtags:(m.hashtags||[]).map(t=>String(t).replaceAll("{age}",String(age)).replaceAll("{year}",year))};
  }
  function loadScript(path){return new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=fresh(path);s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error(path));};document.head.appendChild(s);});}
  function loadCss(){return new Promise((resolve,reject)=>{const s=document.createElement("link");s.rel="stylesheet";s.href=fresh("./css/birthdayConfetti.css?v=20261126-17");s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error("birthday css"));};document.head.appendChild(s);});}
  async function sync(){
    const next=select();
    if(active?.id===next?.id || loading)return;
    if(dispose){dispose();dispose=null;} active=null;
    if(!next)return;
    loading=true;
    try{
      if(!window.startBirthdayCelebration){await loadCss();await loadScript("./js/birthdayModal.js?v=20261126-17");await loadScript("./js/birthdayConfetti.js?v=20261126-17");}
      if(select()?.id!==next.id)return;
      dispose=window.startBirthdayCelebration(next);active=next;
    }catch(e){console.warn("Birthday event unavailable",e);}
    finally{loading=false;}
  }
  async function init(){
    try{const r=await fetch(fresh("../data/birthdayEventJson.json"),{cache:"no-store"});if(!r.ok)throw new Error(r.status);const d=await r.json();if(Array.isArray(d))members=d;}catch(e){console.warn("Birthday data unavailable",e);}
    sync();setInterval(sync,15000);document.addEventListener("visibilitychange",sync);window.addEventListener("pageshow",sync);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
