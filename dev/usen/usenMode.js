"use strict";
// dev専用。順位データは独立ページの週次JSONを参照し、二重管理しない。
const USEN_MODE_MANIFEST = "../usen_ranking/data/manifest.json";
const USEN_MODE_FAVORITES_KEY = "secondzDailyRoutineUsenModeFavorites";
const USEN_MODE_PALETTE = ["#02b9a5","#8b5cf6","#ef4444","#0ea5e9","#eab308","#ec4899","#65a30d"];
let usenModeData = null, usenModeChart = null, usenModeFavorites = [], usenModeFilter = "all";
let usenModeRequestSongs = [], usenModeLoadId = 0;
function usenModeEscape(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function usenModeCurrentRanks() { return (usenModeData?.songs || []).filter(s => Number.isFinite(Number(s.currentRank)) && s.currentRank != null && Number(s.currentRank) >= 1 && Number(s.currentRank) <= 100); }
function usenModeDayDone() { return typeof isDailyTaskDone === "function" && isDailyTaskDone({id:"home_usen_request"}); }
function usenModeSetTab(tab) {
  const next = tab === "ranking" ? "ranking" : "request";
  ["request","ranking"].forEach(name => {
    document.getElementById("usen"+(name==="request"?"Request":"Ranking")+"Panel")?.classList.toggle("hidden",name!==next);
    document.getElementById("usen"+(name==="request"?"Request":"Ranking")+"Tab")?.setAttribute("aria-selected",String(name===next));
  });
  if(next==="ranking") requestAnimationFrame(usenModeRenderChart);
}
function initializeUsenMode() {
  try { const v = JSON.parse(localStorage.getItem(USEN_MODE_FAVORITES_KEY) || "[]"); usenModeFavorites = Array.isArray(v)?v:[]; } catch { usenModeFavorites=[]; }
  document.getElementById("usenModeDefaultCheckbox")?.addEventListener("change",e=>setHomeDefaultMode(e.target.checked?"usen":"normal","usen"));
  document.getElementById("usenRequestTab")?.addEventListener("click",()=>usenModeSetTab("request"));
  document.getElementById("usenRankingTab")?.addEventListener("click",()=>usenModeSetTab("ranking"));
  document.getElementById("usenSongSearch")?.addEventListener("input",usenModeRenderSongs);
  document.getElementById("usenAllSongsFilter")?.addEventListener("click",()=>usenModeSetFilter("all"));
  document.getElementById("usenFavoriteSongsFilter")?.addEventListener("click",()=>usenModeSetFilter("favorites"));
  document.getElementById("usenRandomSong")?.addEventListener("click",()=>{
    const songs=usenModeRequestSongs.filter(s=>String(s.url||"").trim());
    if(!songs.length)return;
    const song=songs[Math.floor(Math.random()*songs.length)];
    const search=document.getElementById("usenSongSearch"); if(search)search.value=song.name;
    usenModeSetFilter("all");
  });
  document.getElementById("usenModeContent")?.addEventListener("click",async event=>{
    const favorite=event.target.closest("[data-usen-favorite]");
    if(favorite) {
      const id=favorite.dataset.usenFavorite;
      usenModeFavorites=usenModeFavorites.includes(id)?usenModeFavorites.filter(v=>v!==id):[...usenModeFavorites,id];
      try { localStorage.setItem(USEN_MODE_FAVORITES_KEY,JSON.stringify(usenModeFavorites)); } catch(e){console.warn(e);}
      usenModeRenderSongs();return;
    }
    const request=event.target.closest("a[data-usen-song]");
    if(!request)return;
    const song=usenModeRequestSongs.find(s=>String(s.id||s.name)===request.dataset.usenSong);
    if(!song)return;
    if(typeof markDailyTaskDone==="function")markDailyTaskDone({id:"home_usen_request"},"usenMode");
    if(typeof sendRequestSongLog==="function")void sendRequestSongLog(song).catch(console.error);
    // 既存のおかわりDailyにも完了を反映
    if(typeof renderHomeUsenExtraList==="function")renderHomeUsenExtraList();
    if(typeof renderHomeDailyExtraList==="function")renderHomeDailyExtraList(state.dailyGroups||[]);
    document.getElementById("usenRequestStatus").textContent="ページを開きました。リクエストの実行は公式サイトでお願いします。";
  });
  syncHomeDefaultModeCheckboxes();
  if(getHomeDefaultMode()==="usen")setUsenModeEnabled(true);
}
function setUsenModeEnabled(enabled) {
  const content=document.getElementById("usenModeContent");
  if(!content)return;
  const wasHidden=content.classList.contains("hidden");
  if(enabled&&state.currentStepElement!==homeStepElement)showOnlyStep(homeStepElement,{recordHistory:false,saveFlow:false});
  if(enabled) {
    document.getElementById("normalHomeContent")?.classList.add("hidden");
    document.getElementById("tverModeContent")?.classList.add("hidden");
    document.getElementById("dreamPassModeContent")?.classList.add("hidden");
    homeStepElement.classList.remove("tver-mode-active","dream-pass-mode-active");
  }else document.getElementById("normalHomeContent")?.classList.remove("hidden");
  content.classList.toggle("hidden",!enabled);
  homeStepElement.classList.toggle("usen-mode-active",enabled);
  syncHomeModeButtons();
  if(enabled&&wasHidden) {
    usenModeSetTab(usenModeDayDone()?"ranking":"request");
    if(typeof sendCheckModeLog==="function")void sendCheckModeLog("usen","open");
    void usenModeLoad();
  }
}
function usenModeSetFilter(filter) {
  usenModeFilter=filter;
  ["All","Favorite"].forEach(t=>{
    const b=document.getElementById("usen"+t+"SongsFilter");
    if(b){const selected=(t==="All"?"all":"favorites")===filter;b.classList.toggle("active",selected);b.setAttribute("aria-pressed",String(selected));}
  });
  usenModeRenderSongs();
}
function usenModeSongId(song){return String(song.id||song.name);}
function usenModeSongRow(song) {
  const id=usenModeSongId(song),isFavorite=usenModeFavorites.includes(id);
  const rank=usenModeCurrentRanks().some(r=>String(r.songId)===String(song.url)||String(r.songTitle)===song.name);
  const url=buildRequestSongUrl(song.url);
  return '<div class="usen-mode-song-row"><span class="usen-mode-crown">'+(rank?'<i class="bi bi-crown-fill" aria-label="ランクイン中"></i>':'')+'</span><a class="usen-mode-song-name" data-usen-song="'+usenModeEscape(id)+'" href="'+usenModeEscape(url)+'" target="_blank" rel="noopener noreferrer">'+usenModeEscape(song.name)+'</a><button type="button" class="usen-mode-favorite'+(isFavorite?" is-favorite":"")+'" data-usen-favorite="'+usenModeEscape(id)+'" aria-label="お気に入り'+(isFavorite?"解除":"登録")+'"><i class="bi bi-heart'+(isFavorite?"-fill":"")+'"></i></button><a class="usen-mode-row-arrow member-work-link-arrow" data-usen-song="'+usenModeEscape(id)+'" href="'+usenModeEscape(url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+usenModeEscape(song.name)+'をリクエスト"><i class="bi bi-chevron-right"></i></a></div>';
}
function usenModeRenderSongs() {
  const songs=usenModeRequestSongs.filter(s=>String(s.url||"").trim());
  const recommended=document.getElementById("usenRecommendedSongs"),list=document.getElementById("usenRequestSongs");
  if(recommended)recommended.innerHTML=songs.filter(s=>s.flag===true).map(usenModeSongRow).join("")||'<p class="usen-mode-caption">おすすめ曲はありません。</p>';
  const query=(document.getElementById("usenSongSearch")?.value||"").toLocaleLowerCase("ja");
  const filtered=songs.filter(s=>(usenModeFilter!=="favorites"||usenModeFavorites.includes(usenModeSongId(s)))&&s.name.toLocaleLowerCase("ja").includes(query));
  if(list)list.innerHTML=filtered.map(usenModeSongRow).join("")||'<p class="usen-mode-caption">該当する曲はありません。</p>';
}
function usenModeFormatDate(s) {
  if(!s)return "--";
  const d=new Date(s);if(!Number.isFinite(d.getTime()))return "--";
  return d.getFullYear()+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+String(d.getDate()).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}
async function usenModeLoad() {
  const id=++usenModeLoadId;
  try {
    const songs=Array.isArray(state.requestSongs)&&state.requestSongs.length?state.requestSongs:await loadRequestSongs();
    usenModeRequestSongs=songs;
    const response=await fetch(USEN_MODE_MANIFEST+"?v="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw Error("manifest: "+response.status);
    const manifest=await response.json();
    const files=(manifest.files||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    if(!files.length)throw Error("順位データがありません");
    const source=files[0].path;
    if(!/^[\w.-]+\.json$/.test(source))throw Error("不正なファイル名");
    const dataResponse=await fetch("../usen_ranking/data/"+source+"?v="+Date.now(),{cache:"no-store"});
    if(!dataResponse.ok)throw Error("ranking: "+dataResponse.status);
    const data=await dataResponse.json();
    if(id!==usenModeLoadId)return;
    usenModeData=data;
    usenModeRenderRanks();
    usenModeRenderSongs();
    usenModeRenderChart();
  }catch(error) {
    if(id!==usenModeLoadId)return;
    console.error("USENモード読み込み失敗",error);
    usenModeRenderSongs();
    const ranks=document.getElementById("usenCurrentRanks");
    if(ranks)ranks.textContent="順位データを読み込めませんでした。";
  }
}
function usenModeRenderRanks() {
  document.getElementById("usenRankingUpdated").textContent="最終取得 "+usenModeFormatDate(usenModeData?.latestCapturedAt);
  const el=document.getElementById("usenCurrentRanks");if(!el)return;
  const ranks=usenModeCurrentRanks().sort((a,b)=>Number(a.currentRank)-Number(b.currentRank));
  if(!ranks.length){el.innerHTML='<p class="usen-mode-caption">現在ランクインしている曲はありません。</p>';return;}
  el.innerHTML=ranks.map(s=>'<div class="usen-mode-rank-row"><span class="usen-mode-song-name">'+usenModeEscape(s.songTitle||s.songId)+'</span><strong>'+Number(s.currentRank)+'位</strong></div>').join("");
}
function usenModeRenderChart() {
  const canvas=document.getElementById("usenWeeklyChart");
  if(!canvas||!usenModeData||typeof Chart==="undefined")return;
  if(document.getElementById("usenRankingPanel")?.classList.contains("hidden"))return;
  if(usenModeChart)usenModeChart.destroy();
  const songs=usenModeData.songs||[];
  const start=Date.parse(usenModeData.period?.startAt),end=Date.parse(usenModeData.period?.endAt);
  const datasets=songs.map((song,i)=>({
    label:song.songTitle||song.songId,
    data:(song.points||[]).map(p=>({x:Date.parse(p.capturedAt),y:Number(p.rank)<=50?Number(p.rank):null})).filter(p=>Number.isFinite(p.x)&&p.x>=start&&p.x<end),
    borderColor:USEN_MODE_PALETTE[i%USEN_MODE_PALETTE.length],backgroundColor:USEN_MODE_PALETTE[i%USEN_MODE_PALETTE.length],
    borderWidth:2.5,pointRadius:0,tension:.15,spanGaps:false
  }));
  document.getElementById("usenChartEmpty")?.classList.toggle("hidden",!!datasets.length);
  const legend=document.getElementById("usenChartLegend");
  if(legend)legend.innerHTML=datasets.map(s=>'<span><i style="background:'+s.borderColor+'"></i>'+usenModeEscape(s.label)+'</span>').join("");
  if(!datasets.length)return;
  usenModeChart=new Chart(canvas,{type:"line",data:{datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+": "+ctx.parsed.y+"位"}}},scales:{x:{type:"linear",min:start,max:end,ticks:{stepSize:86400000,maxRotation:0,callback:value=>{const d=new Date(value);return String(d.getMonth()+1)+"/"+d.getDate();}}},y:{reverse:true,min:1,max:50,afterBuildTicks:axis=>{axis.ticks=[1,20,30,50].map(value=>({value}));},ticks:{callback:value=>value+"位"},grid:{color:ctx=>ctx.tick?.value===20?"rgba(239,68,68,.48)":ctx.tick?.value===30?"rgba(234,179,8,.48)":"rgba(0,0,0,.08)",lineWidth:ctx=>[20,30].includes(ctx.tick?.value)?2:1}}}}});
}
