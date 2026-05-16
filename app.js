// localStorage polyfill for window.storage API
async function _stGet(key){try{const v=localStorage.getItem(key);return v!==null?{value:v}:null}catch{return null}}
async function _stSet(key,val){try{localStorage.setItem(key,val);return{key,value:val}}catch{return null}}

// User secret ID - persistent, unique per browser
function getUserId(){let id=localStorage.getItem("co-uid");if(!id){id="u-"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem("co-uid",id)}return id}
function getUserName(){return localStorage.getItem("co-uname")||"Anon-"+getUserId().slice(2,7)}
function setUserName(n){localStorage.setItem("co-uname",n.replace(/[<>&"']/g,"").slice(0,16))}
const USER_ID=getUserId();

// Server API
const isMobile=/Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)||window.innerWidth<600;
const API_BASE="https://samptonweb.dpdns.org/api/caseopen";
const API_LIGHT="https://samptonweb.wat-the-heck-lol12.workers.dev/api/caseopen";
async function api(path,body){let resp;try{resp=await fetch(API_BASE+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({uid:USER_ID,uname:getUserName(),...body})})}catch(e){if(window.__setOnline)window.__setOnline(false);return null}if(window.__setOnline)window.__setOnline(true);try{return await resp.json()}catch{return null}}
async function apiL(path,body){let resp;try{resp=await fetch(API_LIGHT+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({uid:USER_ID,uname:getUserName(),...body})})}catch(e){if(window.__setOnline)window.__setOnline(false);return null}if(window.__setOnline)window.__setOnline(true);try{return await resp.json()}catch{return null}}

// Report an open to server (fire-and-forget)
// Report open is now handled server-side via /roll
// Report sell
function reportSell(item){api("/sell",{item:item.name,value:item.value})}
// Send chat
async function sendChat(msg){return api("/chat",{msg:msg.slice(0,200)})}
// Get live feed
async function getFeed(){return api("/feed",{})}
// Get leaderboard
async function getLeaderboard(){return api("/leaderboard",{})}
// Get chat messages
let chatPfpsLoaded=false;
async function getChat(needPfps,afterId){return api("/chatlog",{needPfps:needPfps!==false,after:afterId||0})}
// Get online players
async function getOnline(){return api("/online",{})}

// Browser fingerprint (canvas + screen + timezone + UA hash)
function genFingerprint(){try{const c=document.createElement("canvas");const x=c.getContext("2d");c.width=200;c.height=50;x.textBaseline="top";x.font="14px Arial";x.fillText("fp:"+navigator.language+screen.width+"x"+screen.height,2,2);const d=c.toDataURL();let h=0;for(let i=0;i<d.length;i++){h=((h<<5)-h)+d.charCodeAt(i);h|=0}return"fp"+Math.abs(h).toString(36)+Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/\//g,"")}catch{return""}}
const FINGERPRINT=genFingerprint();

// Account state (stored in localStorage + cookie)
function getAccount(){try{const a=localStorage.getItem("co-account");if(a)return JSON.parse(a);const c=document.cookie.match(/co-account=([^;]+)/);if(c)try{const d=JSON.parse(decodeURIComponent(c[1]));localStorage.setItem("co-account",JSON.stringify(d));return d}catch{}return null}catch{return null}}
function saveAccount(acc){localStorage.setItem("co-account",JSON.stringify(acc));document.cookie="co-account="+encodeURIComponent(JSON.stringify(acc))+";path=/;max-age=31536000;SameSite=Lax"}
function clearAccount(){localStorage.removeItem("co-account");document.cookie="co-account=;path=/;max-age=0"}

// Auth API
async function authRegister(username,password){return api("/auth/register",{username,password,fingerprint:FINGERPRINT})}
async function authLogin(username,password){return api("/auth/login",{username,password,fingerprint:FINGERPRINT})}
async function authSave(username,token,slot,data){return api("/auth/save",{username,token,slot,data})}
async function authLoad(username,token){return api("/auth/load",{username,token})}

// Cookie consent check
function hasConsent(){return localStorage.getItem("co-consent")==="yes"}
function giveConsent(){localStorage.setItem("co-consent","yes")}

// Simple markdown renderer (Discord-style)
function renderMd(text){
  if(!text)return "";
  // Escape HTML first to prevent XSS
  text=text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  return text
    .replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")
    .replace(/\*(.+?)\*/g,"<i>$1</i>")
    .replace(/~~(.+?)~~/g,"<s>$1</s>")
    .replace(/`(.+?)`/g,"<code style='background:#1a1d24;padding:1px 4px;border-radius:3px;font-size:0.9em'>$1</code>")
    .replace(/\n/g,"<br>");
}

const { useState, useEffect, useRef, useCallback } = React;

const R={consumer:{label:"Consumer",color:"#b0b3b8",bg:"rgba(176,179,184,0.12)",chance:.55},industrial:{label:"Industrial",color:"#5b98d6",bg:"rgba(91,152,214,0.12)",chance:.20},milspec:{label:"Mil-Spec",color:"#4b69ff",bg:"rgba(75,105,255,0.12)",chance:.12},restricted:{label:"Restricted",color:"#8847ff",bg:"rgba(136,71,255,0.12)",chance:.06},classified:{label:"Classified",color:"#d32ce6",bg:"rgba(211,44,230,0.12)",chance:.03},covert:{label:"Covert",color:"#eb4b4b",bg:"rgba(235,75,75,0.12)",chance:.015},chroma:{label:"★ Chroma",color:"#ffd700",bg:"rgba(255,215,0,0.18)",chance:.005},legendary:{label:"★ Legendary",color:"#ff0000",bg:"rgba(255,0,0,0.18)",chance:.00001}};
const RKEYS=Object.keys(R);
// IC loaded from cases.js (window.IC)
const IC=window.IC||{};
const CONDITIONS=["Factory New","Minimal Wear","Field-Tested","Well-Worn","Battle-Scarred"];
const QUOTES_WIN=["Today is your day.","Not bad at all.","Someone's lucky.","The odds smiled on you.","Keep going.","That's a keeper.","Nice pull.","The grind pays off.","Clean.","Save it or sell it?"];
const QUOTES_LOSS=["I am so happy that I am not in your place.","Better luck next time.","The house always wins.","Pain.","That's rough.","F","It builds character.","Could be worse. Actually no.","Rent is due soon btw.","Your wallet felt that.","Ouch.","At least it's not real money.","Have you considered stopping?"];

// CASES loaded from cases.js (window.CASES)
const CASES=window.CASES||[];

const DEFAULT_BAL=1000,RENT_EVERY=5,BASE_RENT=200,MAX_LOAN=50000,LOAN_RATE=.2,SCROLL_COUNT=55,WIN_IDX=48;
const INIT={bal:DEFAULT_BAL,inv:[],stats:{opened:0,spent:0,won:0,sold:0,best:null,bestVal:0},loan:0,creditScore:500,loansPaid:0,loansDefaulted:0,onlineMinutes:0,loanDeadline:0,loanRequestAt:0,loanTermMinutes:0,rentCtr:0,history:[{n:0,bal:DEFAULT_BAL,label:"Start"}],starred:{}};
function roll(c){let r2=Math.random(),cum=0;for(const[k,v]of Object.entries(R)){cum+=v.chance;if(r2<=cum){const pool=c.items.filter(i=>i.rarity===k);if(pool.length)return pool[Math.floor(Math.random()*pool.length)]}}return c.items.filter(i=>i.rarity==="consumer")[0]}
function money(n){
  if(n===null||n===undefined||isNaN(n))return"$0";
  if(n<0)return"-"+money(-n);
  if(n<1e6)return"$"+Math.round(n).toLocaleString();
  // For very large numbers, use suffix notation
  const suffixes=["","K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc","Ud","Dd","Td","Qad","Qid"];
  let i=0;
  let v=n;
  while(v>=1000&&i<suffixes.length-1){v/=1000;i++}
  if(i<=1)return"$"+Math.round(n).toLocaleString();
  return"$"+v.toFixed(v>=100?0:v>=10?1:2)+suffixes[i];
}
function genFloat(){return Math.random()}
function getCondition(f){if(f<.07)return CONDITIONS[0];if(f<.15)return CONDITIONS[1];if(f<.38)return CONDITIONS[2];if(f<.45)return CONDITIONS[3];return CONDITIONS[4]}
function condAbbr(c){return c.split(" ").map(w=>w[0]).join("")}
function dName(m){return(m.display_name&&m.display_name!==m.uname&&m.display_name!==m.username)?(m.display_name+" (@"+(m.uname||m.username)+")"):(m.uname||m.username||"Anon")}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
const TAB_ID=uid();

// Sound system using Web Audio API
let _actx;function actx(){if(!_actx)_actx=new(window.AudioContext||window.webkitAudioContext)();return _actx}
function playTone(freq,dur,type="sine",vol=0.15){try{const c=actx(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur)}catch{}}
function sndOpen(){playTone(440,.08,"square",.1);setTimeout(()=>playTone(660,.08,"square",.1),60)}
// Case-select tick (CS-style click as items pass marker)
// Uses Web Audio API: load mp3 once into a buffer, play instances at consistent volume.
let _tickBuf=null,_tickCtx=null,_tickLoading=null;
async function _ensureTick(){
  if(_tickBuf)return _tickBuf;
  if(_tickLoading)return _tickLoading;
  _tickLoading=(async()=>{
    try{
      _tickCtx=_tickCtx||new (window.AudioContext||window.webkitAudioContext)();
      const r=await fetch("sound/caseselect.mp3");
      const ab=await r.arrayBuffer();
      _tickBuf=await _tickCtx.decodeAudioData(ab);
      return _tickBuf;
    }catch{return null}
  })();
  return _tickLoading;
}
// Preload at module load so first ticks fire instantly
_ensureTick();

// ============================================================
// Sound manager: SFX + Music with separate volumes + mute toggles
// Persisted in localStorage.
// ============================================================
const _SND={
  sfxVol:0.7,musicVol:0.4,sfxMuted:false,musicMuted:false,
  _ctx:null,_buffers:{},_loading:{},_musicEl:null,_currentMusic:null,
  load(){try{const s=JSON.parse(localStorage.getItem("co-sound")||"{}");if(s.sfxVol!==undefined)this.sfxVol=s.sfxVol;if(s.musicVol!==undefined)this.musicVol=s.musicVol;if(s.sfxMuted!==undefined)this.sfxMuted=s.sfxMuted;if(s.musicMuted!==undefined)this.musicMuted=s.musicMuted;if(this._musicEl)this._musicEl.volume=this.musicMuted?0:this.musicVol;}catch{}},
  save(){try{localStorage.setItem("co-sound",JSON.stringify({sfxVol:this.sfxVol,musicVol:this.musicVol,sfxMuted:this.sfxMuted,musicMuted:this.musicMuted}))}catch{}},
  _ensureCtx(){if(!this._ctx){try{this._ctx=new (window.AudioContext||window.webkitAudioContext)()}catch{}}return this._ctx},
  async _loadBuffer(name){
    if(this._buffers[name])return this._buffers[name];
    if(this._loading[name])return this._loading[name];
    this._loading[name]=(async()=>{
      try{
        const ctx=this._ensureCtx();if(!ctx)return null;
        const r=await fetch("sound/"+name+".mp3");
        if(!r.ok)return null;
        const ab=await r.arrayBuffer();
        const buf=await ctx.decodeAudioData(ab);
        this._buffers[name]=buf;
        return buf;
      }catch{return null}
    })();
    return this._loading[name];
  },
  async sfx(name,volMult){
    if(this.sfxMuted)return;
    const buf=await this._loadBuffer(name);
    if(!buf)return;
    try{
      const ctx=this._ensureCtx();if(!ctx)return;
      if(ctx.state==="suspended")ctx.resume();
      const src=ctx.createBufferSource();src.buffer=buf;
      const g=ctx.createGain();g.gain.value=this.sfxVol*(volMult||1);
      src.connect(g);g.connect(ctx.destination);
      src.start();
    }catch{}
  },
  playMusic(name,loop){
    if(this._currentMusic===name&&this._musicEl&&!this._musicEl.paused)return;
    this.stopMusic();
    try{
      const el=new Audio("sound/"+name+".mp3");
      el.loop=loop!==false;
      el.volume=this.musicMuted?0:this.musicVol;
      this._musicEl=el;
      this._currentMusic=name;
      const p=el.play();
      if(p&&p.catch){
        p.catch((err)=>{
          console.warn("[music] autoplay blocked for",name,"-",err?.name||err);
          // Queue: replay on next user gesture
          this._pendingMusic=name;
          const retry=()=>{
            if(this._pendingMusic&&this._musicEl){
              this._musicEl.play().then(()=>{this._pendingMusic=null;console.log("[music] resumed",name)}).catch(()=>{});
            }
            window.removeEventListener("click",retry);
            window.removeEventListener("touchstart",retry);
            window.removeEventListener("keydown",retry);
          };
          window.addEventListener("click",retry,{once:true});
          window.addEventListener("touchstart",retry,{once:true});
          window.addEventListener("keydown",retry,{once:true});
        });
      }
    }catch(e){console.warn("[music] error",e)}
  },
  stopMusic(){
    if(this._musicEl){try{this._musicEl.pause();this._musicEl=null}catch{}}
    this._currentMusic=null;
  },
  setSfxVol(v){this.sfxVol=Math.max(0,Math.min(1,v));this.save()},
  setMusicVol(v){this.musicVol=Math.max(0,Math.min(1,v));if(this._musicEl)this._musicEl.volume=this.musicMuted?0:this.musicVol;this.save()},
  toggleSfx(){this.sfxMuted=!this.sfxMuted;this.save()},
  toggleMusic(){this.musicMuted=!this.musicMuted;if(this._musicEl)this._musicEl.volume=this.musicMuted?0:this.musicVol;this.save()},
};
_SND.load();
window._SND=_SND;
function sndTick(){
  if(!_tickBuf||!_tickCtx)return;
  try{
    if(_tickCtx.state==="suspended")_tickCtx.resume();
    const src=_tickCtx.createBufferSource();
    src.buffer=_tickBuf;
    const g=_tickCtx.createGain();
    g.gain.value=0.35;
    src.connect(g);g.connect(_tickCtx.destination);
    src.start();
  }catch{}
}
function sndReveal(isWin,rarity){if(rarity==="legendary"){playTone(440,.15,"sine",.18);setTimeout(()=>playTone(554,.15,"sine",.18),100);setTimeout(()=>playTone(659,.15,"sine",.18),200);setTimeout(()=>playTone(880,.3,"sine",.2),300);setTimeout(()=>playTone(1100,.4,"sine",.15),500)}else if(rarity==="chroma"){playTone(523,.12,"sine",.15);setTimeout(()=>playTone(659,.12,"sine",.15),80);setTimeout(()=>playTone(784,.12,"sine",.15),160);setTimeout(()=>playTone(1047,.25,"sine",.18),240)}else if(rarity==="covert"){playTone(523,.1,"sine",.14);setTimeout(()=>playTone(659,.1,"sine",.14),80);setTimeout(()=>playTone(784,.2,"sine",.16),160)}else if(isWin){playTone(523,.1,"sine",.12);setTimeout(()=>playTone(659,.1,"sine",.12),80);setTimeout(()=>playTone(784,.15,"sine",.14),160)}else{playTone(330,.15,"triangle",.1);setTimeout(()=>playTone(260,.2,"triangle",.08),120)}}
function sndSell(){playTone(880,.06,"square",.08);setTimeout(()=>playTone(1100,.06,"square",.08),50)}

function Particles({color,count}){const ps=[];for(let i=0;i<(count||12);i++){const a=Math.random()*360,d=30+Math.random()*60,dur=0.6+Math.random()*0.8;ps.push(<div key={i} style={{position:"absolute",width:4+Math.random()*4,height:4+Math.random()*4,borderRadius:"50%",background:color||"#ffd700",left:"50%",top:"50%",opacity:0,animation:"particles "+dur+"s ease-out "+(i*0.05)+"s forwards",transform:"translate("+Math.cos(a*Math.PI/180)*d+"px,"+Math.sin(a*Math.PI/180)*d+"px)"}}/>)}return <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>{ps}</div>}

function MI({n,s,c,f}){return <span className="material-symbols-rounded" style={{fontSize:s||16,color:c||"inherit",verticalAlign:"middle",lineHeight:1,fontWeight:400,fontFamily:"'Material Symbols Rounded'",...(f||{})}}>{n}</span>}

// User status dot. status: "online" | "away" | "offline"
function StatusDot({status,size,withLabel}){
  const colors={online:"#4ade80",away:"#f59e0b",offline:"#555"};
  const labels={online:"Online",away:"Away",offline:"Offline"};
  const c=colors[status]||"#555";
  const sz=size||8;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,verticalAlign:"middle"}}>
    <span style={{width:sz,height:sz,borderRadius:"50%",background:c,boxShadow:status==="online"?`0 0 6px ${c}`:"none",flexShrink:0}}/>
    {withLabel&&<span style={{fontSize:Math.max(9,sz),color:c,fontWeight:600}}>{labels[status]||"Offline"}</span>}
  </span>;
}

// Right-click / long-press context menu for usernames anywhere in the app.
// Wrap a username with <UserName name={u}>display</UserName> and right-click → menu.
function UserName({name,children,style,onClick,as}){
  const Tag=as||"span";
  const longPressedRef=useRef(false);
  const handler=(e)=>{
    if(!name)return;
    e.preventDefault();
    e.stopPropagation();
    window.__showUserMenu&&window.__showUserMenu(name,e.clientX,e.clientY);
  };
  let touchTimer=null;
  const touchStart=(e)=>{if(!name)return;longPressedRef.current=false;touchTimer=setTimeout(()=>{longPressedRef.current=true;const t=e.touches?.[0];if(t)window.__showUserMenu&&window.__showUserMenu(name,t.clientX,t.clientY)},500)};
  const touchEnd=()=>{if(touchTimer){clearTimeout(touchTimer);touchTimer=null}};
  const clickGuard=(e)=>{
    if(longPressedRef.current){longPressedRef.current=false;e.preventDefault();e.stopPropagation();return}
    onClick&&onClick(e);
  };
  return <Tag data-username={name} onContextMenu={handler} onTouchStart={touchStart} onTouchEnd={touchEnd} onTouchMove={touchEnd} onClick={clickGuard} style={style}>{children}</Tag>;
}

function BalanceTicker({value,color,fontSize}){
  const[display,setDisplay]=useState(value);
  const prevRef=useRef(value);
  const animRef=useRef(null);
  const flashRef=useRef(null);
  useEffect(()=>{
    const from=prevRef.current;
    const to=value;
    if(from===to)return;
    if(animRef.current)cancelAnimationFrame(animRef.current);
    const start=performance.now();
    const dur=Math.min(900,300+Math.abs(to-from)/100);
    // Pulse class for color flash
    if(flashRef.current){flashRef.current.classList.remove("balanceTick");void flashRef.current.offsetWidth;flashRef.current.classList.add("balanceTick")}
    const tick=(t)=>{
      const p=Math.min(1,(t-start)/dur);
      const eased=1-Math.pow(1-p,3);
      const cur=from+(to-from)*eased;
      setDisplay(cur);
      if(p<1){animRef.current=requestAnimationFrame(tick)}
      else{setDisplay(to);prevRef.current=to}
    };
    animRef.current=requestAnimationFrame(tick);
    return()=>{if(animRef.current)cancelAnimationFrame(animRef.current)};
  },[value]);
  return <span ref={flashRef} style={{color:color||"#4ade80",fontWeight:700,fontSize:fontSize||"clamp(14px,3.5vw,20px)",display:"inline-block"}}>{money(display)}</span>;
}


function Starburst({color,children,spin}){const pts=18,outer=50,inner=42;let d="";for(let i=0;i<pts*2;i++){const a=(Math.PI*i)/pts-Math.PI/2,r=i%2===0?outer:inner;d+=(i===0?"M":"L")+(50+r*Math.cos(a))+","+(50+r*Math.sin(a))}d+="Z";return(<div style={{position:"relative",width:"clamp(120px,35vw,200px)",height:"clamp(120px,35vw,200px)"}}><svg viewBox="0 0 100 100" style={{position:"absolute",inset:0,width:"100%",height:"100%",filter:`drop-shadow(0 0 ${spin?24:12}px ${color}${spin?"88":"44"})`,animation:spin?"spin 8s linear infinite":"none"}}><path d={d} fill={color+"22"} stroke={color} strokeWidth="0.5"/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{children}</div></div>)}

function App(){
  // i18n hook - re-render on language change
  const[lang,setLang]=useState(typeof window!=='undefined'&&window.I18N?window.I18N.getLang():'en');
  const t=(k,vars)=>typeof window!=='undefined'&&window.I18N?window.I18N.t(k,vars):k;
  useEffect(()=>{const h=(e)=>setLang(e.detail.lang);window.addEventListener('langchange',h);return()=>window.removeEventListener('langchange',h)},[]);

  const[appLoading,setAppLoading]=useState(true);const[offline,setOffline]=useState(false);const offlineRef=useRef(false);useEffect(()=>{window.__setOnline=(v)=>{if(!v&&!offlineRef.current){offlineRef.current=true;setOffline(true)}if(v&&offlineRef.current){offlineRef.current=false;setOffline(false)}};return()=>{window.__setOnline=null}},[]);const[loadProgress,setLoadProgress]=useState(0);const[loadMsg,setLoadMsg]=useState("Initializing...");const[slot,setSlot]=useState(0);const[slotMeta,setSlotMeta]=useState([null,null,null]);const[showSlots,setShowSlots]=useState(true);
  const[st,setSt]=useState(INIT);const[page,setPage]=useState("shop");const[selCase,setSelCase]=useState(null);const[wonItem,setWonItem]=useState(null);const[wonFloat,setWonFloat]=useState(0);const[wonQuote,setWonQuote]=useState("");const[scrollItems,setScrollItems]=useState([]);const[scrollDone,setScrollDone]=useState(false);const[opening,setOpening]=useState(false);const[resetMsg,setResetMsg]=useState("");const[loanAmt,setLoanAmt]=useState("");const[loanMinutes,setLoanMinutes]=useState("5");const[showLoanModal,setShowLoanModal]=useState(false);const[rentPaid,setRentPaid]=useState(0);const[inspecting,setInspecting]=useState(null);const[confirmReset,setConfirmReset]=useState(false);const[drops,setDrops]=useState([]);const[showSoundModal,setShowSoundModal]=useState(false);const[soundVer,setSoundVer]=useState(0);
  const[invSort,setInvSort]=useState("newest");const[invFilter,setInvFilter]=useState("all");const[invView,setInvView]=useState("grid");const[selItem,setSelItem]=useState(null);const[sellAmt,setSellAmt]=useState("");const[sellConfirm,setSellConfirm]=useState(null);const[lastWonId,setLastWonId]=useState(null);const[superWin,setSuperWin]=useState(null);
  const[feed,setFeed]=useState([]);const[lb,setLb]=useState([]);const[chatLog,setChatLog]=useState([]);const pfpCache=useRef({});const lastChatIdRef=useRef(0);const lastDmIdRef=useRef(0);const[chatMsg,setChatMsg]=useState("");const[nickname,setNickname]=useState(getUserName());const[nameEditing,setNameEditing]=useState(false);const[chatCd,setChatCd]=useState(0);
  const[account,setAccount]=useState(getAccount());const[showAuth,setShowAuth]=useState(false);const[authTab,setAuthTab]=useState("login");const[authUser,setAuthUser]=useState("");const[authPass,setAuthPass]=useState("");const[authErr,setAuthErr]=useState("");const[authLoading,setAuthLoading]=useState(false);const[saveStatus,setSaveStatus]=useState("");const[consent,setConsent]=useState(hasConsent());const[onlineData,setOnlineData]=useState(null);const[userStatusMap,setUserStatusMap]=useState({});
  const[dmInbox,setDmInbox]=useState(null);const[dmTo,setDmTo]=useState("");const[dmMsg,setDmMsg]=useState("");const[dmSearch,setDmSearch]=useState("");const[dmResults,setDmResults]=useState([]);const[dmUnread,setDmUnread]=useState(0);
  const[viewProfile,setViewProfile]=useState(null);const[editBio,setEditBio]=useState("");const[editPrivacy,setEditPrivacy]=useState("public");
  const[reportTarget,setReportTarget]=useState("");const[reportReason,setReportReason]=useState("");const[reportMsg,setReportMsg]=useState("");
  const[toast,setToast]=useState(null);const[userMenu,setUserMenu]=useState(null);const[reportModal,setReportModal]=useState(null);const[pvpEliminated,setPvpEliminated]=useState(false);const[horseRace,setHorseRace]=useState(null);const[horseAnim,setHorseAnim]=useState(0);const[horseBet,setHorseBet]=useState("");const[horsePick,setHorsePick]=useState(0);const[horseHistory,setHorseHistory]=useState([]);const[multiResults,setMultiResults]=useState(null);const[bjTable,setBjTable]=useState(null);const[bjBet,setBjBet]=useState("10000");const[bjHasCard,setBjHasCard]=useState(false);const[btcPrice,setBtcPrice]=useState(0);const[btcHistory,setBtcHistory]=useState([]);const[btcPortfolio,setBtcPortfolio]=useState({active:[],sold:[]});const[btcInvestAmt,setBtcInvestAmt]=useState("");const[btcDays,setBtcDays]=useState(7);const[btcLastUpdate,setBtcLastUpdate]=useState(0);const[btcNextUpdate,setBtcNextUpdate]=useState(0);const[btcTick,setBtcTick]=useState(0);const[btcChange24h,setBtcChange24h]=useState(0);const[plinkoBet,setPlinkoBet]=useState("1000");const[plinkoRisk,setPlinkoRisk]=useState("medium");const[plinkoRows,setPlinkoRows]=useState(12);const[plinkoResult,setPlinkoResult]=useState(null);const[plinkoAnim,setPlinkoAnim]=useState(false);const[rouletteBets,setRouletteBets]=useState([]);const[rouletteResult,setRouletteResult]=useState(null);const[rouletteAnim,setRouletteAnim]=useState(false);const[rouletteAmt,setRouletteAmt]=useState("1000");const[weatherData,setWeatherData]=useState(null);const[smhiWarnings,setSmhiWarnings]=useState(null);const[pollenData,setPollenData]=useState(null);const[airData,setAirData]=useState(null);const[expandedSection,setExpandedSection]=useState({});const[dailyStatus,setDailyStatus]=useState(null);const[dailyModal,setDailyModal]=useState(null);const[wheelStatus,setWheelStatus]=useState(null);const[wheelSpinning,setWheelSpinning]=useState(false);const[wheelResult,setWheelResult]=useState(null);const wheelCanvasRef=useRef(null);const horseCanvasRef=useRef(null);const horseAnimRef=useRef(null);const syncLockRef=useRef(false);const lastServerActionRef=useRef(0);const plinkoCanvasRef=useRef(null);const rouletteCanvasRef=useRef(null);const[pvpWinModal,setPvpWinModal]=useState(null);const[warnModal,setWarnModal]=useState(null);const[banModal,setBanModal]=useState(null);const[banTimer,setBanTimer]=useState("");const[giftModal,setGiftModal]=useState(null);const[giftAmt,setGiftAmt]=useState("");
  const[events,setEvents]=useState([]);const[dismissedEvents,setDismissedEvents]=useState({});
  const[friendsList,setFriendsList]=useState([]);
  function showProfile(username){if(!username||username==="Anon"||username==="SYSTEM")return;api("/profile/full",{target:username.toLowerCase(),username:account?.username||""}).then(r=>{if(r?.profile)setViewProfile(r.profile)}).catch(()=>{})}
  // Custom confirm/prompt modals that look better than native ones
  const askConfirm=(opts)=>new Promise(res=>{setConfirmModal({...opts,resolve:res})});
  const askPrompt=(opts)=>new Promise(res=>{setPromptModal({...opts,resolve:res,value:opts.defaultValue||""})});
  const[lobbies,setLobbies]=useState([]);const[curLobby,setCurLobby]=useState(null);const[lobbyChat,setLobbyChat]=useState([]);const[lobbyChatMsg,setLobbyChatMsg]=useState("");const[lobbyTimer,setLobbyTimer]=useState(0);const[createLobbyName,setCreateLobbyName]=useState("");const[createLobbyPw,setCreateLobbyPw]=useState("");const[createLobbyMode,setCreateLobbyMode]=useState("profit_race");const[createLobbyBet,setCreateLobbyBet]=useState("1000");const[buckshotState,setBuckshotState]=useState(null);const[buckshotNarration,setBuckshotNarration]=useState(null);const buckshotEventCursorRef=useRef(0);const[buckshotConfirm,setBuckshotConfirm]=useState(null);const[itemAnimSlot,setItemAnimSlot]=useState(null);const[confirmModal,setConfirmModal]=useState(null);const[promptModal,setPromptModal]=useState(null);
  const stripRef=useRef(null);const lockRef=useRef(false);const lobbyPollRef=useRef(null);

  async function refreshLobbies(){const r=await api("/lobby/list",{});if(r?.lobbies)setLobbies(r.lobbies)}
  async function refreshLobby(id){
    const targetId=id||curLobby?.id;
    if(!targetId)return;
    const r=await api("/lobby/info",{lobbyId:targetId});
    if(r?.lobby){
      setCurLobby(r.lobby);
      if(r.chat)setLobbyChat(r.chat);
      if(r.players)setCurLobby(prev=>({...prev,...r.lobby,_players:r.players}));
    }else if(r&&(r.error==="Lobby not found"||r.error==="Not found")){
      // Lobby deleted (cancelled, ended, cleaned up). Bounce out.
      if(curLobby?.id===targetId){
        clearInterval(lobbyPollRef.current);
        setCurLobby(null);
        setLobbyChat([]);
        // Don't toast if we're in buckshot — the buckshot poll already handled it
        if(curLobby?.mode!=="buckshot"){
          setToast({msg:"Lobby ended",color:"#f59e0b"});
          try{await silentCloudSync()}catch{}
        }
      }
    }
  }
  async function joinLobby(id,pw){const r=await api("/lobby/join",{username:account?.username,lobbyId:id,lobbyPassword:pw||"",slot});if(r?.ok){if(r.betLocked>0){setToast({msg:"Locked "+money(r.betLocked)+" — game ON!",color:"#f59e0b"});try{await silentCloudSync()}catch{}}await refreshLobby(id);return true}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"});return false}}
  async function leaveLobby(){if(curLobby){setPvpEliminated(false);setPvpWinModal(null);await api("/lobby/leave",{username:account?.username,lobbyId:curLobby.id});setCurLobby(null);setLobbyChat([]);clearInterval(lobbyPollRef.current);refreshLobbies()}}
  async function deleteLobby(){
    if(!curLobby)return;
    setPvpEliminated(false);setPvpWinModal(null);
    const r=await api("/lobby/end",{lobbyId:curLobby.id,username:account?.username});
    if(r?.refunded&&r.refunds&&r.refunds.length>0){
      const myRefund=r.refunds.find(x=>x.username===account?.username);
      if(myRefund)setToast({msg:"Refunded "+money(myRefund.amount),color:"#fbbf24"});
      try{await silentCloudSync()}catch{}
    }
    setCurLobby(null);setLobbyChat([]);clearInterval(lobbyPollRef.current);refreshLobbies();
  }

  // Poll lobby while in one
  useEffect(()=>{if(!curLobby?.id)return;const id=setInterval(()=>refreshLobby(curLobby.id),3000);lobbyPollRef.current=id;return()=>clearInterval(id)},[curLobby?.id]);
  // Refresh user status map every 30s (used for online/away badges)
  useEffect(()=>{
    const fetchStatus=()=>{api("/online",{}).then(r=>{if(r?.players){const map={};for(const p of r.players){map[p.uname]=p.status}setUserStatusMap(map)}})};
    fetchStatus();
    const id=setInterval(fetchStatus,30000);
    return()=>clearInterval(id);
  },[]);
  // Global right-click user menu
  useEffect(()=>{
    window.__showUserMenu=(uname,x,y)=>{
      if(!uname)return;
      // Position menu, but keep on screen
      const menuW=180,menuH=240;
      const px=Math.min(x,window.innerWidth-menuW-10);
      const py=Math.min(y,window.innerHeight-menuH-10);
      setUserMenu({name:uname,x:px,y:py});
    };
    const closer=(e)=>{if(!e.target.closest("[data-user-menu]"))setUserMenu(null)};
    window.addEventListener("click",closer);
    window.addEventListener("scroll",()=>setUserMenu(null),true);
    return()=>{window.removeEventListener("click",closer);window.__showUserMenu=null};
  },[]);
  // Online-minutes tracking: increment onlineMinutes once per minute as long as the tab is visible
  useEffect(()=>{
    let activeMs=0;
    let lastTick=Date.now();
    const tick=()=>{
      if(document.visibilityState==="visible"){
        const dt=Date.now()-lastTick;
        activeMs+=dt;
        while(activeMs>=60000){
          activeMs-=60000;
          setSt(p=>{
            const newMins=(p.onlineMinutes||0)+1;
            const ns={...p,onlineMinutes:newMins};
            // Check loan deadline penalty
            if(p.loan>0&&p.loanDeadline>0&&newMins>=p.loanDeadline){
              // Penalty: -50 credit score, mark default, flag
              const newCS=Math.max(0,(p.creditScore||500)-50);
              ns.creditScore=newCS;
              ns.loansDefaulted=(p.loansDefaulted||0)+1;
              ns.loanDeadline=0; // reset so penalty only applies once
              setToast({msg:"Loan deadline missed! -50 credit",color:"#eb4b4b"});
            }
            return ns;
          });
        }
      }
      lastTick=Date.now();
    };
    const id=setInterval(tick,5000);
    return()=>clearInterval(id);
  },[]);
  // Buckshot Roulette: poll game state every 1s while in a buckshot lobby
  useEffect(()=>{
    if(!curLobby?.id||curLobby.mode!=="buckshot")return;
    let dead=false;
    const fetchState=async()=>{
      if(dead)return;
      try{
        const r=await api("/buckshot/state",{lobbyId:curLobby.id,username:account?.username||""});
        if(r?.state){setBuckshotState(r.state);return}
        // Lobby gone (cancelled, deleted, or never existed). Bounce out cleanly.
        if(r&&(r.error==="Lobby not found"||r.error==="Not found")){
          dead=true;
          clearInterval(id);
          _SND.stopMusic();
          buckshotEventCursorRef.current=0;
          setBuckshotNarration(null);
          setBuckshotState(null);
          setCurLobby(null);
          setToast({msg:"Lobby was cancelled by host. Bets refunded.",color:"#f59e0b"});
          // Pull fresh balance (server has refunded us)
          try{await silentCloudSync()}catch{}
          refreshLobbies&&refreshLobbies();
        }
      }catch{}
    };
    fetchState();
    const id=setInterval(fetchState,1000);
    return()=>{dead=true;clearInterval(id);_SND.stopMusic();buckshotEventCursorRef.current=0;setBuckshotNarration(null)};
  },[curLobby?.id,curLobby?.mode]);
  // Disconnect-on-leave: when user navigates away from PvP page or closes tab during a playing buckshot game,
  // tell the server. Gives the user 15s grace to reconnect before pot goes to opponent.
  useEffect(()=>{
    if(!account||curLobby?.mode!=="buckshot"||curLobby?.status!=="playing"||buckshotState?.winner)return;
    const send=()=>{
      try{
        const url=API_BASE+"/buckshot/disconnect";
        const body=JSON.stringify({lobbyId:curLobby.id,username:account.username});
        // Use sendBeacon if available — guarantees delivery even on tab close
        if(navigator.sendBeacon){navigator.sendBeacon(url,new Blob([body],{type:"application/json"}))}
        else{fetch(url,{method:"POST",body,keepalive:true}).catch(()=>{})}
      }catch{}
    };
    const onUnload=()=>send();
    window.addEventListener("pagehide",onUnload);
    window.addEventListener("beforeunload",onUnload);
    return()=>{
      window.removeEventListener("pagehide",onUnload);
      window.removeEventListener("beforeunload",onUnload);
      // Also send disconnect when navigating away from PvP page (page change in SPA)
      if(page!=="pvp")send();
    };
  },[account?.username,curLobby?.id,curLobby?.status,curLobby?.mode,buckshotState?.winner,page]);
  // On PvP page load, check for an active playing buckshot game (in case user closed tab and is coming back)
  const[rejoinPrompt,setRejoinPrompt]=useState(null);
  useEffect(()=>{
    if(!account||page!=="pvp"||curLobby)return;
    let dead=false;
    (async()=>{
      try{
        const r=await api("/buckshot/my-active",{username:account.username});
        if(dead)return;
        if(r?.active&&!r.active.expired){
          setRejoinPrompt(r.active);
          // Tell server we reconnected (clears grace flag)
          try{await api("/buckshot/reconnect",{lobbyId:r.active.lobbyId,username:account.username})}catch{}
        }
      }catch{}
    })();
    return()=>{dead=true};
  },[account?.username,page,curLobby?.id]);
  // Process narration events. Use event IDs to track what's been shown (server may trim old events).
  useEffect(()=>{
    if(!buckshotState||!buckshotState.events||!buckshotState.events.length)return;
    // Find events with id > cursor
    const unseen=buckshotState.events.filter(e=>e&&e.id&&e.id>buckshotEventCursorRef.current);
    if(unseen.length===0)return;
    let cancelled=false;
    (async()=>{
      for(const ev of unseen){
        if(cancelled)return;
        setBuckshotNarration(ev);
        // Sound + visual effects by event type
        if(ev.t==="live"){
          _SND.sfx("shot",1.5);
          // Gun recoil + muzzle flash
          const gun=document.querySelector("[data-gun]");
          if(gun){
            gun.classList.remove("gunRecoil");void gun.offsetWidth;gun.classList.add("gunRecoil");
            const flash=document.createElement("div");
            flash.className="muzzleFlash";
            const r=gun.getBoundingClientRect();
            flash.style.left=(r.left+r.width/2-40)+"px";
            flash.style.top=(r.top+r.height/2-40)+"px";
            flash.style.position="fixed";
            flash.style.zIndex="9995";
            document.body.appendChild(flash);
            setTimeout(()=>flash.remove(),420);
          }
          // Saw slash on top if sawed
          if(ev.sawed){
            const saw=document.createElement("div");saw.className="sawSlash";saw.textContent="🪚";document.body.appendChild(saw);setTimeout(()=>saw.remove(),820);
          }
          // If you're the victim: red flash + heavy shake
          if(ev.target===account.username){
            const f=document.createElement("div");f.className="redFlash";document.body.appendChild(f);setTimeout(()=>f.remove(),620);
            document.body.classList.add("shakeHard");setTimeout(()=>document.body.classList.remove("shakeHard"),500);
          }
        } else if(ev.t==="blank"){
          _SND.sfx("emptyshot",1.2);
          // Click motion + smoke puff
          const gun=document.querySelector("[data-gun]");
          if(gun){
            gun.classList.remove("gunClick");void gun.offsetWidth;gun.classList.add("gunClick");
            const puff=document.createElement("div");puff.className="blankPuff";
            const r=gun.getBoundingClientRect();
            puff.style.left=(r.left+r.width/2-30)+"px";
            puff.style.top=(r.top+r.height/2-30)+"px";
            puff.style.position="fixed";puff.style.zIndex="9995";
            document.body.appendChild(puff);
            setTimeout(()=>puff.remove(),720);
          }
        } else if(ev.t==="item_cigarette"){
          // Charges glow green for the user
          const sel=ev.user===account.username?"[data-charges='self']":"[data-charges='opp']";
          const el=document.querySelector(sel);
          if(el){el.classList.remove("cigaretteGlow");void el.offsetWidth;el.classList.add("cigaretteGlow");setTimeout(()=>el.classList.remove("cigaretteGlow"),1400)}
        } else if(ev.t==="item_beer"){
          // Beer bottle flies out of gun
          const gun=document.querySelector("[data-gun]");
          if(gun){
            const beer=document.createElement("div");beer.className="beerEject";beer.textContent="🍺";
            const r=gun.getBoundingClientRect();
            beer.style.left=(r.left+r.width/2-18)+"px";
            beer.style.top=(r.top+r.height/2)+"px";
            beer.style.position="fixed";beer.style.zIndex="9995";
            document.body.appendChild(beer);
            setTimeout(()=>beer.remove(),1020);
          }
        } else if(ev.t==="item_magnifier"){
          const m=document.createElement("div");m.className="magnifierPop";m.textContent="🔍";document.body.appendChild(m);setTimeout(()=>m.remove(),1220);
        } else if(ev.t==="item_handsaw"){
          const saw=document.createElement("div");saw.className="sawSlash";saw.textContent="🪚";saw.style.top="50%";document.body.appendChild(saw);setTimeout(()=>saw.remove(),820);
        } else if(ev.t==="item_handcuffs"){
          const h=document.createElement("div");h.className="handcuffChain";h.textContent="🔗";document.body.appendChild(h);setTimeout(()=>h.remove(),1320);
        } else if(ev.t==="win"){
          // Confetti-ish burst
          for(let i=0;i<24;i++){
            const p=document.createElement("div");
            const color=["#4ade80","#fbbf24","#ec4899","#3b82f6","#fff"][i%5];
            const angle=(Math.PI*2*i)/24+Math.random()*0.3;
            const dist=180+Math.random()*150;
            p.className="particle";
            p.style.cssText=`background:${color};--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist}px;--rot:${(Math.random()-0.5)*720}deg;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;box-shadow:0 0 10px ${color};position:fixed;top:50%;left:50%;z-index:9994`;
            document.body.appendChild(p);
            setTimeout(()=>p.remove(),1300);
          }
        }
        await new Promise(r=>setTimeout(r,ev.ms||1200));
        buckshotEventCursorRef.current=ev.id;
      }
      if(!cancelled)setBuckshotNarration(null);
    })();
    return()=>{cancelled=true};
  },[buckshotState?.events?.map?.(e=>e?.id).join(",")]);
  // Buckshot music tracks: based on current round (1/2/3)
  useEffect(()=>{
    if(curLobby?.mode!=="buckshot"||curLobby?.status!=="playing"||!buckshotState)return;
    const round=buckshotState.round||1;
    const tracks=["Generalrelease","Beforeeveryload","Socketcalibration"];
    const want=tracks[Math.min(round-1,2)];
    if(_SND._currentMusic!==want&&!_SND.musicMuted)_SND.playMusic(want);
  },[curLobby?.status,curLobby?.mode,buckshotState?.round]);
  // Force user to stay on PvP tab during active buckshot game
  useEffect(()=>{
    if(curLobby?.mode==="buckshot"&&curLobby?.status==="playing"&&page!=="pvp"){
      setPage("pvp");
      setToast({msg:"Locked to PvP — game in progress",color:"#f59e0b"});
    }
  },[curLobby?.status,curLobby?.mode,page]);
  // Daily login bonus check on account login
  useEffect(()=>{if(!account)return;api("/daily/status",{username:account.username}).then(r=>{if(r?.canClaim)setDailyModal(r);else setDailyStatus(r)})},[account?.username]);
  // Wheel of Fortune - draw static wheel on page enter
  useEffect(()=>{
    if(page!=="wheel")return;
    const cv=wheelCanvasRef.current;
    if(!cv)return;
    const W=cv.offsetWidth;
    if(!W)return;
    cv.width=W*2;cv.height=W*2;
    const g=cv.getContext("2d");g.scale(2,2);
    const segs=[
      {label:"$1K"},{label:"$5K"},{label:"$10K"},{label:"$25K"},
      {label:"$50K"},{label:"$100K"},{label:"$500K"},{label:"$2M"}
    ];
    const n=segs.length;
    const segAng=(Math.PI*2)/n;
    const colors=["#dc2626","#fb923c","#fbbf24","#84cc16","#22d3ee","#3b82f6","#a855f7","#ec4899"];
    const cx=W/2,cy=W/2,rad=W/2-8;
    g.fillStyle="#1a1a2e";g.beginPath();g.arc(cx,cy,W/2-2,0,Math.PI*2);g.fill();
    segs.forEach((s,i)=>{
      const a0=-Math.PI/2+i*segAng-segAng/2;
      const a1=a0+segAng;
      g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,rad,a0,a1);g.closePath();
      g.fillStyle=colors[i%colors.length];g.fill();
      g.strokeStyle="#0d1117";g.lineWidth=2;g.stroke();
      g.save();g.translate(cx,cy);g.rotate(a0+segAng/2);
      g.fillStyle="#fff";g.font="bold "+Math.max(11,W*0.05)+"px sans-serif";
      g.textAlign="right";g.textBaseline="middle";
      g.strokeStyle="#000";g.lineWidth=3;
      g.strokeText(s.label,rad*0.92,0);g.fillText(s.label,rad*0.92,0);
      g.restore();
    });
    g.fillStyle="#2d2d3f";g.beginPath();g.arc(cx,cy,rad*0.18,0,Math.PI*2);g.fill();
    g.fillStyle="#ffd700";g.beginPath();g.arc(cx,cy,rad*0.08,0,Math.PI*2);g.fill();
  },[page,wheelResult]);
  // Lobby timer
  useEffect(()=>{if(!curLobby?.started_at||curLobby?.status!=="playing")return;const id=setInterval(()=>{const elapsed=Date.now()-curLobby.started_at;const left=Math.max(0,(curLobby.duration||300)*1000-elapsed);setLobbyTimer(left);if(left<=0){clearInterval(id);api("/lobby/end",{lobbyId:curLobby.id,username:account?.username}).then(r=>{if(r?.results){setCurLobby(prev=>({...prev,status:"finished",_results:r.results}));setPvpWinModal({winner:r.winner,results:r.results})}})}},500);return()=>clearInterval(id)},[curLobby?.started_at,curLobby?.status]);

  // Verify account on mount - clear stale sessions from DB wipe
  useEffect(()=>{
    if(!account?.username||!account?.token)return;
    (async()=>{
      try{
        const r=await api("/auth/load",{username:account.username,token:account.token});
        if(r?.error==="Unauthorized"||r?.error){clearAccount();setAccount(null);console.log("[AUTH] Stale session cleared")}
      }catch{}
    })();
  },[]);

  useEffect(()=>{(async()=>{
    let prog=0;const step=(n,msg)=>{prog=n;setLoadProgress(n);setLoadMsg(msg)};
    step(5,"Loading slot data...");
    try{const r=await _stGet("co-slots");if(r?.value)setSlotMeta(JSON.parse(r.value))}catch{}
    step(20,"Loading saved account...");
    await new Promise(r=>setTimeout(r,50));
    step(35,"Connecting to server...");
    try{const test=await api("/refresh",{});if(test)step(55,"Server connected...")}catch{step(55,"Offline mode...")}
    step(65,"Loading chat...");
    try{const c=await getChat(true);if(c?.msgs){if(c.pfps)Object.entries(c.pfps).forEach(([uid,pfp])=>{pfpCache.current[uid]=pfp});chatPfpsLoaded=true;const msgs=c.msgs.map(m=>({...m,pfp:pfpCache.current[m.uid]||""}));setChatLog(msgs);if(msgs.length>0){const mx=Math.max(...msgs.map(m=>m.id||0));if(mx>lastChatIdRef.current)lastChatIdRef.current=mx}}}catch{}
    step(75,"Loading events...");try{const ev=await api("/events",{});if(ev?.events)setEvents(ev.events)}catch{}
    step(80,"Loading feed...");
    try{const[f,l]=await Promise.all([getFeed(),getLeaderboard()]);if(f?.feed)setFeed(f.feed);if(l?.lb)setLb(l.lb)}catch{}
    step(95,"Preparing...");
    await new Promise(r=>setTimeout(r,200));
    step(100,"Ready!");
    setTimeout(()=>setAppLoading(false),300);
  })()},[]);
  async function saveSlotMeta(m){setSlotMeta(m);try{await _stSet("co-slots",JSON.stringify(m))}catch{}}
  async function loadSlot(i){
    // Claim slot lock
    try{await _stSet("co-lock-"+i,TAB_ID)}catch{}
    setSlot(i);setShowSlots(false);try{const r=await _stGet("co-s"+i);if(r?.value){const d=JSON.parse(r.value);setSt(s=>({...INIT,...d.st,starred:d.st?.starred||{}}));if(d.drops)setDrops(d.drops)}else{setSt({...INIT,inv:[],stats:{...INIT.stats},history:[{n:0,bal:DEFAULT_BAL,label:"Start"}],starred:{}});setDrops([])}}catch{setSt({...INIT});setDrops([])}setPage("shop");setOpening(false);lockRef.current=false}

  // Check tab lock - if another tab stole our slot, go back to slot screen
  useEffect(()=>{if(showSlots)return;const id=setInterval(async()=>{try{const r=await _stGet("co-lock-"+slot);if(r?.value&&r.value!==TAB_ID){setShowSlots(true);setOpening(false);lockRef.current=false}}catch{}},2000);return()=>clearInterval(id)},[showSlots,slot]);

  // Poll server for live data + remote refresh check
  const lastRefreshRef=useRef(Date.now());
  useEffect(()=>{if(showSlots)return;let on=true;let dmPollCount=0;async function poll(){if(!on)return;try{const[c,ref]=await Promise.all([getChat(!chatPfpsLoaded,chatPfpsLoaded?lastChatIdRef.current:0),api("/refresh",{})]);if(c?.msgs){if(c.pfps){Object.entries(c.pfps).forEach(([uid,pfp])=>{pfpCache.current[uid]=pfp});chatPfpsLoaded=true}const newMsgs=c.msgs.map(m=>({...m,pfp:pfpCache.current[m.uid]||""}));if(lastChatIdRef.current>0){if(newMsgs.length>0){setChatLog(prev=>{const existIds=new Set(prev.map(m=>m.id));const fresh=newMsgs.filter(m=>!existIds.has(m.id));return[...fresh,...prev].slice(0,200)})}}else{setChatLog(newMsgs)}if(newMsgs.length>0){const maxId=Math.max(...newMsgs.map(m=>m.id||0));if(maxId>lastChatIdRef.current)lastChatIdRef.current=maxId}};if(ref?.refreshAt&&ref.refreshAt>lastRefreshRef.current){lastRefreshRef.current=ref.refreshAt;location.reload()}dmPollCount++
        const ev2=await api("/events",{});if(ev2?.events)setEvents(ev2.events);if(dmPollCount%8===0){const[f,l]=await Promise.all([getFeed(),getLeaderboard()]);if(f?.feed)setFeed(f.feed);if(l?.lb)setLb(l.lb)}if(account?.username&&account?.token&&dmPollCount%2===0){try{const dm=await api("/dm/inbox",{username:account.username,token:account.token,after:lastDmIdRef.current});if(dm?.ok&&dm.unread!==undefined){if(dm.unread>dmUnread&&dmUnread>=0){setToast({msg:dm.unread+" new message"+(dm.unread>1?"s":""),color:"#3b82f6"})}setDmUnread(dm.unread);// Merge new received/sent into existing, update lastDmIdRef
const newMax=Math.max(0,...(dm.received||[]).map(m=>m.id||0),...(dm.sent||[]).map(m=>m.id||0));if(newMax>lastDmIdRef.current)lastDmIdRef.current=newMax;if(dm.incremental){// merge new messages into existing inbox
if((dm.received&&dm.received.length>0)||(dm.sent&&dm.sent.length>0)){setDmInbox(prev=>{if(!prev)return dm;const ex=new Set([...(prev.received||[]).map(m=>m.id),...(prev.sent||[]).map(m=>m.id)]);return{...prev,unread:dm.unread,received:[...(dm.received||[]).filter(m=>!ex.has(m.id)),...(prev.received||[])].slice(0,200),sent:[...(dm.sent||[]).filter(m=>!ex.has(m.id)),...(prev.sent||[])].slice(0,200)}})}}else{// first poll - full replacement
if(dm.received)setDmInbox(prev=>({...prev,received:dm.received,sent:dm.sent||prev?.sent,unread:dm.unread}))}}}catch{}}if(account?.username&&account?.token&&dmPollCount%5===0){try{const st=await api("/status",{username:account.username,token:account.token});if(st?.banned){setBanModal({reason:st.banReason||"Banned",expires:st.banExpires||0});clearAccount();setAccount(null)}if(st?.warned&&!warnModal)setWarnModal(st.warnReason||"Warning");if(st?.forceSync&&st.forceSync>0){const lastSync=parseInt(localStorage.getItem("co-lastsync")||"0");const isFresh=(Date.now()-st.forceSync)<600000; /* 10min */ if(st.forceSync>lastSync&&isFresh){localStorage.setItem("co-lastsync",String(st.forceSync));syncLockRef.current=true;try{const lr=await api("/auth/load",{username:account.username,token:account.token,ackForceSync:true});if(lr?.ok&&lr.slots){for(let si=0;si<3;si++){if(lr.slots[si]){await _stSet("co-s"+si,JSON.stringify(lr.slots[si]))}}const curSlotData=lr.slots[slot];if(curSlotData&&curSlotData.st){setSt(s=>({...INIT,...curSlotData.st,starred:curSlotData.st?.starred||{}}));if(curSlotData.drops)setDrops(curSlotData.drops);setToast({msg:"Synced from cloud",color:"#3b82f6"})}}}catch{}setTimeout(()=>{syncLockRef.current=false},3000)}else if(st.forceSync>0&&!isFresh){/* Stale flag — clear it without overwriting local */ try{await api("/auth/load",{username:account.username,token:account.token,ackForceSync:true,clearOnly:true})}catch{}; localStorage.setItem("co-lastsync",String(st.forceSync))}}}catch{}}}catch{}};poll();const id=setInterval(poll,6000);return()=>{on=false;clearInterval(id)}},[showSlots,account]);
  // Chat cooldown countdown
  useEffect(()=>{if(chatCd<=0)return;const id=setTimeout(()=>setChatCd(c=>c-1),1000);return()=>clearTimeout(id)},[chatCd]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(null),3000);return()=>clearTimeout(id)},[toast]);
  // Auto cloud save every 30s
  useEffect(()=>{if(!account?.username||!account?.token||showSlots)return;const id=setInterval(()=>{cloudSave()},10000);return()=>clearInterval(id)},[account,showSlots,slot]);

  const save=useCallback(async(s,d)=>{try{const lk=await _stGet("co-lock-"+slot);if(lk?.value&&lk.value!==TAB_ID)return;await _stSet("co-s"+slot,JSON.stringify({st:s,drops:d||[]}))}catch{}const inv=s.inv||[];const tv=inv.reduce((a,i)=>a+i.value,0);setSlotMeta(prev=>{const m=[...prev];m[slot]={bal:s.bal,items:inv.length,totalVal:tv,opened:s.stats?.opened||0};saveSlotMeta(m);return m})},[slot]);
  useEffect(()=>{if(showSlots)return;const id=setInterval(()=>{if(syncLockRef.current)return;setSt(cur=>{setDrops(dd=>{save(cur,dd);return dd});return cur})},5000);return()=>clearInterval(id)},[save,showSlots]);

  function getCreditScore(s){return s.creditScore||500}
  function getCreditLimit(cs){return cs>=800?50000:cs>=600?30000:cs>=400?15000:cs>=200?8000:3000}
  function checkReset(s){const cs=getCreditScore(s);if(cs<10){setResetMsg("Credit score too low! Account reset.");const fresh={...INIT,inv:[],stats:{...INIT.stats},history:[{n:0,bal:DEFAULT_BAL,label:"Fresh Start"}],starred:{},creditScore:50,loansPaid:0,loansDefaulted:(s.loansDefaulted||0)+1};setSt(fresh);setDrops([]);save(fresh,[]);setTimeout(()=>{setResetMsg("");setPage("shop")},3000);return true}const cheapest=Math.min(...CASES.map(c=>c.price));if(s.bal<cheapest&&s.loan>=getCreditLimit(cs)){setResetMsg("Bankrupt. Game reset. Credit score damaged!");const oldCS=Math.max(0,(s.creditScore||100)-150);const oldDefaults=(s.loansDefaulted||0)+1;const fresh={...INIT,inv:[],stats:{...INIT.stats},history:[{n:0,bal:DEFAULT_BAL,label:"Start"}],starred:{},creditScore:oldCS,loansPaid:s.loansPaid||0,loansDefaulted:oldDefaults};setSt(fresh);setDrops([]);save(fresh,[]);setTimeout(()=>{setResetMsg("");setPage("shop")},2500);return true}return false}

  useEffect(()=>{if(!banModal||typeof banModal!=="object"||!banModal.expires||banModal.expires<=0){setBanTimer("");return}const tick=()=>{const left=banModal.expires-Date.now();if(left<=0){setBanTimer("Expired! Reload to continue");return}const hr=Math.floor(left/3600000),mn=Math.floor((left%3600000)/60000),sc=Math.floor((left%60000)/1000);setBanTimer((hr>0?hr+"h ":"")+(mn>0?mn+"m ":"")+sc+"s")};tick();const iv=setInterval(tick,1000);return()=>clearInterval(iv)},[banModal]);

  async function doOpen(c){
    const sd=events.find(e=>e.type==="sale"&&e.discount>0);const cPrice=sd?Math.floor(c.price*(1-sd.discount/100)):c.price;if(lockRef.current||st.bal<cPrice)return;lockRef.current=true;setOpening(true);setScrollDone(false);setSelCase(c);sndOpen();
    // Server-side roll
    const rollResp=await api("/roll",{caseId:c.id,username:account?.username||"",token:account?.token||"",slot});
    if(!rollResp?.ok||!rollResp.result){lockRef.current=false;setOpening(false);return}
    const sr=rollResp.result;const winner={name:sr.name,rarity:sr.rarity,value:sr.value,icon:c.items.find(i=>i.name===sr.name)?.icon||"?"};
    const fl=sr.float,quotes=winner.value>=c.price?QUOTES_WIN:QUOTES_LOSS;
    setWonItem({...winner,id:uid()});setWonFloat(fl);setWonQuote(quotes[Math.floor(Math.random()*quotes.length)]);
    const items=[];for(let i=0;i<SCROLL_COUNT;i++)items.push(i===WIN_IDX?winner:c.items[Math.floor(Math.random()*c.items.length)]);
    setScrollItems(items);setPage("opening");
    // Persist debit + the won item NOW (don't wait for 5s animation to finish).
    // If user closes the tab during the scroll animation, server already has the item; local must match.
    // CRITICAL: use the server-issued item ID so a cloud-sync doesn't replace a client UUID with a different server UUID
    // (which would orphan any actions queued against the local ID, like sell/star).
    const itemId=rollResp.result?.serverItemId||uid();setLastWonId(itemId);
    lastServerActionRef.current=Date.now();
    setSt(p=>{
      const serverBal=(rollResp.result?.serverBal!==null&&rollResp.result?.serverBal!==undefined)?rollResp.result.serverBal:(p.bal-cPrice+winner.value);
      const ns={...p,bal:serverBal,inv:[...p.inv,{...winner,id:itemId,from:c.id,t:Date.now(),float:fl}],stats:{...p.stats,spent:p.stats.spent+cPrice,opened:p.stats.opened+1,won:p.stats.won+winner.value,best:winner.value>p.stats.bestVal?winner.name:p.stats.best,bestVal:Math.max(p.stats.bestVal,winner.value)}};
      save(ns,drops);return ns;
    });
    requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(!stripRef.current)return;const el=stripRef.current,parent=el.parentElement;el.style.transition="none";el.style.transform="translateX(0)";requestAnimationFrame(()=>{if(!stripRef.current)return;const firstItem=el.children[0];if(!firstItem)return;const itemW=firstItem.offsetWidth,center=parent.offsetWidth/2,pad=itemW*.1,off=WIN_IDX*itemW+pad+(Math.random()*(itemW-pad*2))-center;el.style.transition="transform 5s cubic-bezier(0.15,0.85,0.20,1.01)";el.style.transform=`translateX(-${off}px)`;
      // Tick sound on each item boundary crossing the marker
      // Initialize lastIdx to the starting position so first crossing fires a tick
      const initialMarkerInStrip=center; // tx=0 at start, so marker is at center pixel of strip
      let lastIdx=Math.floor(initialMarkerInStrip/itemW);
      const trackTick=()=>{
        if(!stripRef.current)return;
        const tx=new DOMMatrix(getComputedStyle(stripRef.current).transform).e;
        const markerInStrip=-tx+center;
        const idx=Math.floor(markerInStrip/itemW);
        if(idx!==lastIdx)sndTick();
        lastIdx=idx;
        if(performance.now()-tickStart<5200)requestAnimationFrame(trackTick);
      };
      const tickStart=performance.now();
      requestAnimationFrame(trackTick);
    })})});
    setTimeout(()=>{setScrollDone(true);const isEpicDrop=["covert","chroma","legendary"].includes(winner.rarity);const isHugeWin=winner.value>=c.price*5;if(isEpicDrop){document.body.classList.add("shakeHard");setTimeout(()=>document.body.classList.remove("shakeHard"),500);
      // SUPER WIN MODAL + particle burst — dramatic pop-out for chroma/legendary
      if(winner.rarity==="legendary"||winner.rarity==="chroma"){
        setSuperWin({name:winner.name,value:winner.value,rarity:winner.rarity,icon:winner.icon,caseName:c.name,caseColor:c.color});
        const colors=winner.rarity==="legendary"?["#ffd700","#fff","#fbbf24"]:["#ec4899","#a855f7","#06b6d4","#84cc16","#fbbf24","#fff"];
        const container=document.createElement("div");
        container.style.cssText="position:fixed;top:50%;left:50%;width:0;height:0;z-index:9999;pointer-events:none";
        document.body.appendChild(container);
        for(let i=0;i<30;i++){
          const p=document.createElement("div");
          const angle=(Math.PI*2*i)/30+Math.random()*0.3;
          const dist=200+Math.random()*200;
          p.className="particle";
          p.style.cssText=`background:${colors[i%colors.length]};--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist}px;--rot:${(Math.random()-0.5)*720}deg;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;box-shadow:0 0 10px ${colors[i%colors.length]}`;
          container.appendChild(p);
        }
        setTimeout(()=>container.remove(),1300);
      }
    }
    // Big-win screen flash
    if(isHugeWin||winner.rarity==="legendary"){
      const flash=document.createElement("div");
      flash.className="bigWinFlash";
      document.body.appendChild(flash);
      setTimeout(()=>flash.remove(),500);
    }
    sndReveal(winner.value>=c.price,winner.rarity);
    let rp=0;
    setSt(prev=>{
      let rc=prev.rentCtr+1;if(rc>=RENT_EVERY){rp=RENT_AMT;rc=0}
      setRentPaid(rp);
      const newBal=prev.bal-rp;
      const isBig=winner.value>=c.price*3;
      const he={n:prev.stats.opened,bal:newBal};
      if(isBig)he.label=winner.name+" "+money(winner.value);
      const ns={...prev,bal:newBal,loan:prev.loan,rentCtr:rc,history:[...(prev.history||[]),he].slice(-200),starred:prev.starred||{}};
      const nd={name:winner.name,rarity:winner.rarity,value:winner.value,cond:getCondition(fl),icon:winner.icon};
      setDrops(dd=>{const r=[nd,...dd].slice(0,20);save(ns,r);return r});
      setTimeout(()=>{checkReset(ns);lockRef.current=false},400);
      return ns;
    })},5400);
  }

  async function doMultiOpen(c,count){
    const sd=events.find(e=>e.type==="sale"&&e.discount>0);const cPrice=sd?Math.floor(c.price*(1-sd.discount/100)):c.price;if(lockRef.current||st.bal<cPrice*count)return;lockRef.current=true;
    setSt(p=>({...p,bal:p.bal-cPrice*count}));
    const r=await api("/roll/multi",{caseId:c.id,count,username:account?.username||"",token:account?.token||""});
    if(!r?.ok||!r.results){lockRef.current=false;setSt(p=>({...p,bal:p.bal+cPrice*count}));setToast({msg:"Failed",color:"#eb4b4b"});return}
    const items=r.results.map(rr=>({...rr,id:uid(),icon:c.items.find(i=>i.name===rr.name)?.icon||"?",from:c.id,t:Date.now()}));
    setMultiResults({items,case:c,totalValue:r.totalValue,totalCost:c.price*count});
    setSt(p=>{const ns={...p,inv:[...p.inv,...items],stats:{...p.stats,spent:p.stats.spent+cPrice*count,won:p.stats.won+r.totalValue,opened:p.stats.opened+count}};save(ns,drops);return ns});
    sndReveal(r.totalValue>c.price*count);setPage("multi");lockRef.current=false;
  }
  function openAgain(){setLastWonId(null);if(!selCase||st.bal<selCase.price){setPage("shop");setOpening(false);return}doOpen(selCase)}
  function borrow(){
    const a=parseInt(loanAmt);
    if(!a||a<=0){setToast({msg:"Enter amount",color:"#eb4b4b"});return}
    const cs=st.creditScore||500;
    const maxByCredit=cs>=700?MAX_LOAN:cs>=500?100000:cs>=300?30000:cs>=150?10000:3000;
    const actual=Math.min(a,maxByCredit-st.loan);
    if(actual<=0){setToast({msg:"Already at credit limit",color:"#eb4b4b"});return}
    const minutes=parseInt(loanMinutes)||5;
    if(minutes<1||minutes>10){setToast({msg:"Payback time: 1-10 minutes online",color:"#eb4b4b"});return}
    const rate=cs>=700?0.05:cs>=500?0.1:cs>=300?0.2:cs>=150?0.35:0.5;
    const owedAmount=Math.round(actual*(1+rate));
    const deadlineOnlineMinutes=(st.onlineMinutes||0)+minutes;
    setSt(p=>{const ns={...p,bal:p.bal+actual,loan:p.loan+owedAmount,creditScore:Math.max(0,p.creditScore||500),loanDeadline:deadlineOnlineMinutes,loanRequestAt:Date.now(),loanTermMinutes:minutes};save(ns,drops);return ns});
    setLoanAmt("");
    setLoanMinutes("5");
    setShowLoanModal(false);
    setToast({msg:"Borrowed "+money(actual)+" — owe "+money(owedAmount)+" by "+minutes+" online min",color:"#f59e0b"});
  }
  function repay(){const a=parseInt(loanAmt);if(!a||a<=0)return;const actual=Math.min(a,st.loan,st.bal);if(actual<=0)return;setSt(p=>{const paid=(p.loansPaid||0)+actual;const fullPaid=p.loan-actual<=0;const csBoost=fullPaid?20:Math.floor(actual/1000)*2;const ns={...p,bal:p.bal-actual,loan:p.loan-actual,creditScore:Math.min(1000,(p.creditScore||100)+csBoost),loansPaid:paid};save(ns,drops);return ns});setLoanAmt("")}
  function doReset(){const fresh={...INIT,inv:[],stats:{...INIT.stats},history:[{n:0,bal:DEFAULT_BAL,label:"Start"}],starred:{}};setSt(fresh);setDrops([]);save(fresh,[]);setPage("shop");lockRef.current=false;setOpening(false);setConfirmReset(false)}

  // Auth handlers
  async function handleAuth(){
    setAuthErr("");setAuthLoading(true);
    try{
      const fn=authTab==="login"?authLogin:authRegister;
      const r=await fn(authUser,authPass);
      if(!r||r.error){if(r?.banned){setBanModal({reason:r.banReason||r.error||"Banned",expires:r.banExpires||0});setShowAuth(false)}else{setAuthErr(r?.error||"Failed")}setAuthLoading(false);return}
      const acc={username:r.username,token:r.token,role:r.role||"user",display_name:r.display_name||r.username};
      setAccount(acc);saveAccount(acc);setShowAuth(false);setAuthUser("");setAuthPass("");
      // Cloud/Local sync resolution
      if(r.slots&&r.slots.some(s=>s!==null)){
        const localSlots=[];for(let i=0;i<3;i++){try{const d=await _stGet("co-s"+i);localSlots.push(d?.value?JSON.parse(d.value):null)}catch{localSlots.push(null)}}
        const cloudBals=r.slots.map(s=>s?.st?.bal||0);
        const localBals=localSlots.map(s=>s?.st?.bal||0);
        const cloudItems=r.slots.map(s=>s?.st?.inv?.length||0);
        const localItems=localSlots.map(s=>s?.st?.inv?.length||0);
        const msg="Cloud vs Local data:\n\n"+[0,1,2].map(i=>"Slot "+(i+1)+": Cloud $"+cloudBals[i].toLocaleString()+" ("+cloudItems[i]+" items) | Local $"+localBals[i].toLocaleString()+" ("+localItems[i]+" items)").join("\n")+"\n\nOK = Load from CLOUD\nCancel = Keep LOCAL (uploads to cloud)";
        if(confirm(msg)){
          for(let i=0;i<3;i++){if(r.slots[i]){await _stSet("co-s"+i,JSON.stringify(r.slots[i]))}}
          location.reload();
        } else {
          for(let i=0;i<3;i++){try{const d=await _stGet("co-s"+i);if(d?.value){await api("/auth/save",{username:r.username,token:r.token,slot:i,data:JSON.parse(d.value)})}}catch{}}
          setToast({msg:"Local saves uploaded to cloud",color:"#4ade80"});
        }
      }
    }catch(e){setAuthErr(e.message||"Error")}
    setAuthLoading(false);
  }
  async function cloudSave(){
    if(!account||!account.username||!account.token)return;
    // Skip auto-save if a server-side action just authoritatively set state — our local state and the server's slot already match, no need to roundtrip
    if(Date.now()-lastServerActionRef.current<4000)return;
    setSaveStatus("saving");
    try{
      const slotData=await _stGet("co-s"+slot);
      const data=slotData?.value?JSON.parse(slotData.value):null;
      if(!data){setSaveStatus("No data");return}
      const r=await authSave(account.username,account.token,slot,data);
      if(r?.error==="Unauthorized"){clearAccount();setAccount(null);setSaveStatus("Session expired");return}
      if(r?.ok)setSaveStatus("Saved!");else setSaveStatus(r?.error||"Failed");
    }catch{setSaveStatus("Error")}
    setTimeout(()=>setSaveStatus(""),3000);
  }
  async function cloudLoad(){
    if(!account)return;
    const ok=await askConfirm({title:"Load from cloud",message:"This will overwrite your local data for slot "+(slot+1)+".",ok:"Load",color:"#8b5cf6",icon:"cloud_download"});if(!ok)return;
    setSaveStatus("loading");
    try{
      const r=await authLoad(account.username,account.token);
      if(r?.slots&&r.slots[slot]){
        await _stSet("co-s"+slot,JSON.stringify(r.slots[slot]));
        setSaveStatus("Loaded!");location.reload();
      }else{setSaveStatus("No cloud data for this slot")}
    }catch{setSaveStatus("Error")}
    setTimeout(()=>setSaveStatus(""),3000);
  }
  async function silentCloudSync(){
    if(!account)return null;
    lastServerActionRef.current=Date.now();
    try{
      // ackForceSync clears the server's force_sync flag so the status-poll loop doesn't keep firing
      const r=await api("/auth/load",{username:account.username,token:account.token,ackForceSync:true});
      if(r?.slots&&r.slots[slot]){
        const fresh=r.slots[slot];
        await _stSet("co-s"+slot,JSON.stringify(fresh));
        if(fresh.st)setSt(fresh.st);
        if(fresh.drops)setDrops(fresh.drops);
        // Update lastSync so status poll doesn't re-trigger
        localStorage.setItem("co-lastsync",String(Date.now()));
        return fresh;
      }
    }catch(e){console.warn("silentCloudSync failed",e)}
    return null;
  }
  function logout(){clearAccount();setAccount(null)}

  function sellItem(item){sndSell();setSt(p=>{const idx=p.inv.findIndex(i=>i.id===item.id);if(idx===-1)return p;const ni=[...p.inv];ni.splice(idx,1);const starred={...p.starred};delete starred[item.id];const ns={...p,bal:p.bal+item.value,inv:ni,stats:{...p.stats,sold:(p.stats.sold||0)+item.value},starred};save(ns,drops);return ns});setSelItem(null)}
  function sellLastWon(){if(!lastWonId||!wonItem)return;sndSell();setSt(p=>{const idx=p.inv.findIndex(i=>i.id===lastWonId);if(idx===-1)return p;const item=p.inv[idx];const ni=[...p.inv];ni.splice(idx,1);const starred={...p.starred};delete starred[lastWonId];const ns={...p,bal:p.bal+item.value,inv:ni,stats:{...p.stats,sold:(p.stats.sold||0)+item.value},starred};save(ns,drops);return ns});setLastWonId(null)}
  function sellMultiple(count){sndSell();setSt(p=>{let sorted=getFilteredSorted(p.inv,p.starred);sorted=sorted.filter(i=>!p.starred[i.id]);const toSell=sorted.slice(0,count);if(!toSell.length)return p;const ids=new Set(toSell.map(i=>i.id));const total=toSell.reduce((s,i)=>s+i.value,0);const ni=p.inv.filter(i=>!ids.has(i.id));const ns={...p,bal:p.bal+total,inv:ni,stats:{...p.stats,sold:(p.stats.sold||0)+total}};save(ns,drops);return ns})}
  function sellAllUnstarred(){sndSell();setSt(p=>{const unstarred=p.inv.filter(i=>!p.starred[i.id]);if(!unstarred.length)return p;const total=unstarred.reduce((s,i)=>s+i.value,0);const starred=p.inv.filter(i=>p.starred[i.id]);const ns={...p,bal:p.bal+total,inv:starred,stats:{...p.stats,sold:(p.stats.sold||0)+total}};save(ns,drops);return ns});setSellConfirm(null)}
  function toggleStar(id){setSt(p=>{const s={...p.starred};if(s[id])delete s[id];else s[id]=true;const ns={...p,starred:s};save(ns,drops);return ns})}

  function getFilteredSorted(inv,starred){let items=[...inv];if(invFilter==="starred")items=items.filter(i=>starred[i.id]);else if(invFilter!=="all")items=items.filter(i=>i.rarity===invFilter);if(invSort==="newest")items.reverse();else if(invSort==="value-high")items.sort((a,b)=>b.value-a.value);else if(invSort==="value-low")items.sort((a,b)=>a.value-b.value);else if(invSort==="rarity")items.sort((a,b)=>RKEYS.indexOf(b.rarity)-RKEYS.indexOf(a.rarity));else if(invSort==="name")items.sort((a,b)=>a.name.localeCompare(b.name));return items}

  useEffect(()=>{if(page!=="bj")return;const iv=setInterval(()=>{api("/bj/state",{tableId:"main",username:account?.username||""}).then(r=>{if(r?.table)setBjTable(r.table)})},1000);api("/bj/state",{tableId:"main",username:account?.username||""}).then(r=>{if(r?.table)setBjTable(r.table)});return()=>clearInterval(iv)},[page,account]);

  useEffect(()=>{
    if(page!=="roulette")return;
    const cv=rouletteCanvasRef.current;if(!cv)return;
    const W=cv.offsetWidth;if(!W)return;
    cv.width=W*2;cv.height=W*2;
    const g=cv.getContext("2d");g.scale(2,2);
    const nums=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
    const red=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    const segAng=(Math.PI*2)/nums.length;
    const cx=W/2,cy=W/2,rad=W/2-12;
    // If we have a last result, draw wheel rotated to show that number at top
    const lastIdx=rouletteResult?nums.indexOf(rouletteResult.number):-1;
    const rot=lastIdx>=0?(-lastIdx*segAng):0;
    g.fillStyle="#3f1a05";g.beginPath();g.arc(cx,cy,W/2-2,0,Math.PI*2);g.fill();
    nums.forEach((n,i)=>{
      const a0=-Math.PI/2+i*segAng-segAng/2+rot,a1=a0+segAng;
      g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,rad,a0,a1);g.closePath();
      g.fillStyle=n===0?"#16a34a":red.has(n)?"#dc2626":"#111";g.fill();
      g.strokeStyle="#000";g.lineWidth=0.5;g.stroke();
      g.save();g.translate(cx,cy);g.rotate(a0+segAng/2);g.fillStyle="#fff";g.font="bold "+Math.max(10,W*0.04)+"px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(String(n),rad*0.82,0);g.restore();
    });
    g.fillStyle="#2d1505";g.beginPath();g.arc(cx,cy,rad*0.25,0,Math.PI*2);g.fill();
    g.fillStyle="#f59e0b";g.beginPath();g.arc(cx,cy,rad*0.1,0,Math.PI*2);g.fill();
    g.fillStyle="#fbbf24";g.strokeStyle="#000";g.lineWidth=2;
    g.beginPath();g.moveTo(cx,4);g.lineTo(cx-10,22);g.lineTo(cx+10,22);g.closePath();g.fill();g.stroke();
  },[page,rouletteResult]);

  useEffect(()=>{if(page!=="btc")return;
    // Load cached values from localStorage on tab enter (no API call needed)
    try{const cached=localStorage.getItem("co-btc-cache");if(cached){const c=JSON.parse(cached);if(c.price)setBtcPrice(c.price);if(c.history)setBtcHistory(c.history);if(c.ts)setBtcLastUpdate(c.ts)}}catch{}
    // Always reload portfolio (per-user)
    if(account)api("/btc/portfolio",{username:account.username,token:account.token}).then(r=>{if(r?.ok){setBtcPortfolio({active:r.active||[],sold:r.sold||[]})}});
    // Reload history on days change (server's D1 cache handles efficient re-use)
    apiL("/btc/history",{days:btcDays}).then(r=>{if(r?.prices&&r.prices.length>0){setBtcHistory(r.prices);try{const prev=JSON.parse(localStorage.getItem("co-btc-cache")||"{}");localStorage.setItem("co-btc-cache",JSON.stringify({...prev,history:r.prices}))}catch{}}});
    // If price is 0 (first ever load), fetch once
    if(btcPrice===0){apiL("/btc/price",{}).then(r=>{if(r?.price){setBtcPrice(r.price);if(typeof r.change24h==="number")setBtcChange24h(r.change24h);setBtcLastUpdate(Date.now());try{localStorage.setItem("co-btc-cache",JSON.stringify({price:r.price,change24h:r.change24h||0,ts:Date.now(),history:btcHistory}))}catch{}}})}
  },[page,btcDays]);

  useEffect(()=>{if(page!=="btc")return;
    let timerId=null,nextTimer=null;
    const doRefresh=()=>{
      apiL("/btc/price",{}).then(r=>{
        if(r?.price){
          setBtcPrice(r.price);
          if(typeof r.change24h==="number")setBtcChange24h(r.change24h);
          const now=Date.now();
          setBtcLastUpdate(now);
          try{const prev=JSON.parse(localStorage.getItem("co-btc-cache")||"{}");localStorage.setItem("co-btc-cache",JSON.stringify({...prev,price:r.price,change24h:r.change24h||0,ts:now}))}catch{}
        }
      });
    };
    const scheduleNext=()=>{
      const now=Date.now();
      const msUntilMinute=60000-(now%60000);
      timerId=setTimeout(()=>{doRefresh();scheduleNext()},msUntilMinute);
    };
    setBtcNextUpdate(Date.now()+(60000-(Date.now()%60000)));
    scheduleNext();
    // Tick every second to force re-render of countdown
    nextTimer=setInterval(()=>setBtcTick(t=>t+1),1000);
    return()=>{if(timerId)clearTimeout(timerId);if(nextTimer)clearInterval(nextTimer)};
  },[page]);
  const activeSale=events.find(e=>e.type==="sale"&&e.discount>0);const saleDiscount=activeSale?activeSale.discount:0;
  const activeEffect=events.find(e=>!dismissedEvents[e.id]&&e.style&&(()=>{try{const s=JSON.parse(e.style);return s.effect}catch{return false}})());const bodyEffect=activeEffect?(()=>{try{const s=JSON.parse(activeEffect.style);return s.effect}catch{return""}})():"";
  const RENT_AMT=st.bal>=1000000000?Math.floor(st.bal*0.02):st.bal>=1000000?Math.floor(st.bal*0.01):BASE_RENT;
  const rentIn=RENT_EVERY-st.rentCtr,invTotal=st.inv.reduce((s,i)=>s+i.value,0),profit=(st.stats.sold||0)+invTotal-st.stats.spent,unstarredCount=st.inv.filter(i=>!st.starred?.[i.id]).length,unstarredVal=st.inv.filter(i=>!st.starred?.[i.id]).reduce((s,i)=>s+i.value,0);
  function caseStats(cId){const items=st.inv.filter(i=>i.from===cId);const sp=items.length*(CASES.find(c=>c.id===cId)?.price||0);const ea=items.reduce((s,i)=>s+i.value,0);const counts={};RKEYS.forEach(k=>{counts[k]=items.filter(i=>i.rarity===k).length});return{opened:items.length,spent:sp,earned:ea,counts}}
  const filteredInv=getFilteredSorted(st.inv,st.starred||{});

  // COOKIE CONSENT
  if(!consent)return(<div style={S.root}><style>{CSS}</style><div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"clamp(20px,5vw,40px)",gap:16,textAlign:"center"}}><div style={{fontSize:"clamp(40px,12vw,64px)"}}><MI n="cookie" s={48}/></div><div style={{fontSize:"clamp(18px,5vw,26px)",fontWeight:800}}>Cookie Notice</div><div style={{color:"#888",fontSize:"clamp(10px,2.5vw,13px)",maxWidth:400}}>This game uses localStorage to save your progress and cookies to sync your account. Your data stays in your browser and on our server only.</div><button onClick={()=>{giveConsent();setConsent(true)}} style={{...S.btn,background:"#4ade80",color:"#000",padding:"12px 32px",fontSize:"clamp(12px,3vw,16px)"}}>Accept & Play</button><div style={{color:"#555",fontSize:"clamp(8px,2vw,10px)"}}>Required to save game data</div></div></div>);

  // SAVE SLOT SCREEN
  if(appLoading)return(<div style={{...S.root,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><style>{CSS}</style><div style={{fontSize:"clamp(24px,7vw,36px)",fontWeight:800,letterSpacing:4,color:"#e2e8f0",marginBottom:8}}>CASES</div><div style={{width:"clamp(200px,60vw,320px)",height:8,background:"#1e2430",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,#4ade80,#3b82f6,#8b5cf6)",borderRadius:4,transition:"width 0.3s ease",width:loadProgress+"%"}}/></div><div style={{color:"#888",fontSize:11}}>{loadMsg}</div><div style={{color:"#333",fontSize:9,marginTop:8}}>v2.0</div></div>);


  if(showSlots)return(<div style={S.root}><style>{CSS}</style><div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"clamp(20px,5vw,40px)",gap:"clamp(16px,4vw,28px)"}}><div style={{fontSize:"clamp(20px,6vw,32px)",fontWeight:800,letterSpacing:3,color:"#ccc"}}>CASES</div><div style={{color:"#666",fontSize:"clamp(10px,2.5vw,13px)"}}>Select a save slot</div><div style={{display:"flex",flexDirection:"column",gap:"clamp(8px,2vw,12px)",width:"100%",maxWidth:400}}>{[0,1,2].map(i=>{const m=slotMeta[i];return(<button key={i} onClick={()=>loadSlot(i)} style={{...S.slotBtn,borderColor:slot===i?"#4ade80":"#1e2430"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}><span style={{fontWeight:700,fontSize:"clamp(12px,3vw,16px)"}}>Slot {i+1}</span>{m?<span style={{color:"#4ade80",fontWeight:600,fontSize:"clamp(10px,2.5vw,13px)"}}>{money(m.bal)}</span>:<span style={{color:"#555",fontSize:"clamp(10px,2.5vw,12px)"}}>Empty</span>}</div>{m&&<div style={{display:"flex",gap:"clamp(10px,3vw,18px)",fontSize:"clamp(8px,2vw,10px)",color:"#888"}}><span>{m.items} items</span><span>Inv: {money(m.totalVal)}</span><span>{m.opened} opened</span></div>}</button>)})}</div></div></div>);

  return(<div style={S.root}><style>{CSS}</style>

    {/* Auth Modal */}
    {showAuth&&<div style={S.overlay} onClick={()=>setShowAuth(false)}><div className="modalIn" style={S.modal} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:"clamp(14px,3.5vw,18px)",fontWeight:700}}>{account?"Account":"Login / Register"}</div>
      {account?<>
        <div style={{color:"#4ade80",fontWeight:600}}>{"\u2705"} {account.username}</div>
        <div style={{color:"#888",fontSize:"clamp(9px,2.2vw,11px)"}}>Role: {account.role}</div>
        <button onClick={logout} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b",width:"100%"}}>Logout</button>
      </>:<>
        <div style={{display:"flex",gap:4,width:"100%"}}><button onClick={()=>setAuthTab("login")} style={{...S.btn,flex:1,background:authTab==="login"?"#3b82f6":"#ffffff08",color:authTab==="login"?"#fff":"#888"}}>Login</button><button onClick={()=>setAuthTab("register")} style={{...S.btn,flex:1,background:authTab==="register"?"#8b5cf6":"#ffffff08",color:authTab==="register"?"#fff":"#888"}}>Register</button></div>
        <input value={authUser} onChange={e=>setAuthUser(e.target.value.slice(0,16))} placeholder="Username" style={{...S.input,width:"100%"}} maxLength={16} autoComplete="username" name="username" id="co-auth-user"/>
        <input value={authPass} onChange={e=>setAuthPass(e.target.value.slice(0,64))} placeholder="Password" type="password" style={{...S.input,width:"100%"}} maxLength={64} onKeyDown={e=>{if(e.key==="Enter")handleAuth()}} autoComplete={authTab==="register"?"new-password":"current-password"} name="password" id="co-auth-pass"/>
        {authErr&&<div style={{color:"#eb4b4b",fontSize:"clamp(9px,2.2vw,11px)"}}>{authErr}</div>}
        <button onClick={handleAuth} disabled={authLoading||!authUser||!authPass} style={{...S.btn,background:"#4ade80",color:"#000",width:"100%"}}>{authLoading?"...":(authTab==="login"?"Login":"Register")}</button>
      </>}
      <button onClick={()=>setShowAuth(false)} style={{...S.btn,background:"#ffffff08",color:"#666",width:"100%"}}>Close</button>
    </div></div>}

    {/* Modals */}
    {confirmReset&&<div style={S.overlay}><div className="modalIn" style={S.modal}><div style={{fontSize:"clamp(28px,8vw,44px)"}}><MI n="warning" s={36} c="#f59e0b"/></div><div style={{fontSize:"clamp(14px,3.5vw,18px)",fontWeight:700}}>Reset slot {slot+1}?</div><div style={{color:"#888",fontSize:"clamp(10px,2.5vw,12px)",textAlign:"center"}}>Everything will be wiped.</div><div style={{display:"flex",gap:"clamp(8px,2vw,12px)",marginTop:8}}><button onClick={()=>setConfirmReset(false)} style={{...S.btn,background:"#ffffff0a",color:"#888",flex:1}}>Cancel</button><button onClick={doReset} style={{...S.btn,background:"#eb4b4b",color:"#fff",flex:1}}>Reset</button></div></div></div>}

    {sellConfirm&&<div style={S.overlay}><div className="modalIn" style={S.modal}><div style={{fontSize:"clamp(14px,3.5vw,18px)",fontWeight:700}}>Sell {sellConfirm==="all"?`${unstarredCount} unstarred`:`${sellAmt} cheapest`} items?</div><div style={{color:"#4ade80",fontSize:"clamp(14px,3.5vw,20px)",fontWeight:700}}>+{money(sellConfirm==="all"?unstarredVal:0)}</div><div style={{color:"#f59e0b",fontSize:"clamp(9px,2.2vw,11px)"}}>Starred items are protected</div><div style={{display:"flex",gap:8}}><button onClick={()=>setSellConfirm(null)} style={{...S.btn,background:"#ffffff0a",color:"#888",flex:1}}>Cancel</button><button onClick={()=>{if(sellConfirm==="all")sellAllUnstarred();else sellMultiple(parseInt(sellAmt)||1);setSellConfirm(null)}} style={{...S.btn,background:"#4ade80",color:"#000",flex:1}}>Sell</button></div></div></div>}

    {selItem&&<div style={S.overlay} onClick={()=>setSelItem(null)}><div className="modalIn" style={S.modal} onClick={e=>e.stopPropagation()}><div style={{fontSize:"clamp(40px,12vw,64px)"}}>{selItem.icon}</div><div style={{color:R[selItem.rarity]?.color,fontSize:"clamp(9px,2.2vw,11px)",fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{R[selItem.rarity]?.label}</div><div style={{fontSize:"clamp(16px,4.5vw,22px)",fontWeight:700,textAlign:"center"}}>{selItem.name}</div><div style={{fontSize:"clamp(20px,5.5vw,28px)",fontWeight:800,color:"#4ade80"}}>{money(selItem.value)}</div>
      {selItem.float!==undefined&&<><div style={{color:"#ccc",fontSize:"clamp(11px,2.8vw,14px)",fontWeight:600}}>{getCondition(selItem.float)}</div><div style={{width:"100%"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"clamp(7px,1.8vw,9px)",color:"#666",marginBottom:2}}><span>0.00</span><span>1.00</span></div><div style={{position:"relative",height:6,borderRadius:4,overflow:"hidden",background:"linear-gradient(to right,#4ade80,#4ade80 7%,#a3e635 7%,#a3e635 15%,#fbbf24 15%,#fbbf24 38%,#f97316 38%,#f97316 45%,#ef4444 45%)"}}><div style={{position:"absolute",top:-2,bottom:-2,left:`${selItem.float*100}%`,width:2,background:"#fff",borderRadius:1,boxShadow:"0 0 4px #fff"}}/></div><div style={{textAlign:"center",color:"#888",fontSize:"clamp(8px,2vw,10px)",marginTop:3}}>Float: {selItem.float.toFixed(4)}</div></div></>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"clamp(4px,1vw,8px)",width:"100%",fontSize:"clamp(8px,2vw,10px)",color:"#888"}}><div>From: {CASES.find(c=>c.id===selItem.from)?.name||"?"}</div><div>ID: {selItem.id?.slice(0,8)}</div><div>Dropped: {selItem.t?new Date(selItem.t).toLocaleDateString():"-"}</div><div>Rarity: {(R[selItem.rarity]?.chance*100).toFixed(1)}%</div></div>
      <div style={{display:"flex",gap:6,width:"100%",marginTop:4}}><button onClick={()=>toggleStar(selItem.id)} style={{...S.btn,background:st.starred?.[selItem.id]?"#ffd70022":"#ffffff08",color:st.starred?.[selItem.id]?"#ffd700":"#888",flex:1,border:st.starred?.[selItem.id]?"1px solid #ffd70044":"1px solid transparent"}}>{st.starred?.[selItem.id]?"★ Starred":"☆ Star"}</button><button onClick={()=>sellItem(selItem)} disabled={!!st.starred?.[selItem.id]} style={{...S.btn,background:st.starred?.[selItem.id]?"#333":"#4ade80",color:st.starred?.[selItem.id]?"#666":"#000",flex:1}}>Sell {money(selItem.value)}</button></div>
      <button onClick={()=>setSelItem(null)} style={{...S.btn,background:"#ffffff08",color:"#666",width:"100%"}}>Close</button>
    </div></div>}

    {resetMsg&&<div style={S.overlay}><div className="modalIn" style={S.modal}><div style={{fontSize:"clamp(36px,10vw,56px)"}}><MI n="dangerous" s={44} c="#eb4b4b"/></div><div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:700,color:"#eb4b4b"}}>{resetMsg}</div></div></div>}

    {/* HEADER */}
    {!(curLobby?.mode==="buckshot"&&curLobby?.status==="playing")&&<div style={S.hdr}><div style={{display:"flex",alignItems:"center",gap:"clamp(6px,1.5vw,10px)"}}><button onClick={()=>setShowSlots(true)} style={{...S.btn,background:"#ffffff08",color:"#888",padding:"clamp(4px,1vw,6px) clamp(6px,1.5vw,10px)",fontSize:"clamp(9px,2.2vw,11px)"}}>Slot {slot+1}</button><div style={S.title}>CASES</div></div><div style={S.hdrRight}><button onClick={()=>{const cur=lang;const next=cur==="en"?"sv":"en";if(window.I18N)window.I18N.setLang(next);setToast({msg:next==="sv"?"Språk: Svenska":"Language: English",color:"#4ade80"})}} aria-label={t("lang_label")} title={t("lang_label")} style={{...S.btn,background:"#ffffff08",color:"#cbd5e1",padding:"6px 10px",fontSize:"clamp(9px,2.2vw,11px)",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}><MI n="language" s={14}/>{lang.toUpperCase()}</button><button onClick={()=>setPage("faq")} aria-label="FAQ" title="FAQ" style={{...S.btn,background:"#ffffff08",color:"#cbd5e1",padding:"6px 8px",fontSize:"clamp(9px,2.2vw,11px)"}}><MI n="help_outline" s={14}/></button><button onClick={()=>setShowSoundModal(true)} aria-label="Sound settings" title="Sound settings" style={{...S.btn,background:"#ffffff08",color:"#cbd5e1",padding:"6px 8px",fontSize:"clamp(9px,2.2vw,11px)"}}><MI n={_SND.sfxMuted&&_SND.musicMuted?"volume_off":"volume_up"} s={14}/></button><button onClick={()=>setShowAuth(true)} style={{...S.btn,background:account?"#4ade8022":"#ffffff08",color:account?"#4ade80":"#888",padding:"6px 12px",fontSize:"clamp(9px,2.2vw,12px)",border:account?"1px solid #4ade8033":"1px solid #333",fontWeight:700}}>{account?"✓ "+account.username:t("login")}</button>{account&&<><button onClick={cloudSave} style={{...S.btn,background:"#3b82f6",color:"#fff",padding:"6px 14px",fontSize:"clamp(10px,2.5vw,13px)",fontWeight:700}}><><MI n="cloud_upload" s={14}/> Save</></button><button onClick={cloudLoad} style={{...S.btn,background:"#8b5cf622",color:"#8b5cf6",padding:"6px 10px",fontSize:"clamp(9px,2.2vw,11px)"}}><><MI n="cloud_download" s={14}/> Load</></button></>}{saveStatus&&<span style={{color:saveStatus==="Saved!"?"#4ade80":"#fbbf24",fontSize:"clamp(9px,2.2vw,11px)",fontWeight:700,animation:"fadeUp .3s"}}>{saveStatus}</span>}<div style={S.chip}><span style={S.chipLbl}>BAL</span><BalanceTicker value={st.bal} color={st.bal<100?"#eb4b4b":"#4ade80"} fontSize="clamp(14px,3.5vw,20px)"/></div>{st.loan>0&&<div style={{...S.chip,borderColor:"#eb4b4b33"}}><span style={S.chipLbl}>DEBT</span><span style={{color:"#eb4b4b",fontWeight:700,fontSize:"clamp(12px,3vw,18px)"}}>{money(st.loan)}</span></div>}<div style={S.rentChip}>Rent: {money(RENT_AMT)} in {rentIn} opens</div></div></div>}
    {!account&&!(curLobby?.mode==="buckshot"&&curLobby?.status==="playing")&&<div style={{background:"#f59e0b11",borderBottom:"1px solid #f59e0b22",padding:"4px 12px",textAlign:"center",fontSize:"clamp(8px,2vw,10px)",color:"#f59e0b"}}>Login to save progress to cloud. Your data is local only!</div>}
    {events.filter(e=>!dismissedEvents[e.id]).map(e=>{const ec=e.type==="announcement"?"#f59e0b":e.type==="sale"?"#4ade80":e.type==="maintenance"?"#eb4b4b":e.type==="warning"?"#f97316":e.type==="update"?"#8b5cf6":e.type==="rain"?"#ffd700":e.type==="brainrot"?"#ff6767":e.type==="takeover"?"#e2e8f0":e.type==="jumpscare"?"#eb4b4b":"#3b82f6";const ei=e.type==="announcement"?"campaign":e.type==="sale"?"local_offer":e.type==="maintenance"?"build":e.type==="warning"?"warning":e.type==="update"?"system_update":e.type==="rain"?"payments":e.type==="brainrot"?"psychology":e.type==="takeover"?"wallpaper":e.type==="jumpscare"?"flash_on":"celebration";let sty={};try{sty=JSON.parse(e.style||"{}")}catch{};return <div key={e.id}>{e.type==="takeover"&&sty.image&&<div style={{position:"fixed",inset:0,zIndex:99,backgroundImage:"url("+sty.image+")",backgroundSize:"cover",backgroundPosition:"center",opacity:0.15,pointerEvents:"none"}}/>}{e.type==="jumpscare"&&sty.image&&!dismissedEvents["js_"+e.id]&&<div onClick={()=>setDismissedEvents(d=>({...d,["js_"+e.id]:true}))} style={{position:"fixed",inset:0,zIndex:99998,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><img src={sty.image} style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain"}}/><div style={{position:"absolute",bottom:40,color:"#666",fontSize:12}}>Click to dismiss</div></div>}{e.type==="rain"&&<div style={{position:"fixed",top:0,left:0,right:0,height:"100vh",pointerEvents:"none",zIndex:98,overflow:"hidden"}}>{[...Array(20)].map((_,i)=><div key={i} style={{position:"absolute",left:Math.random()*100+"%",top:-20,fontSize:Math.random()*14+12,animation:"moneyRain "+(2+Math.random()*3)+"s linear "+(Math.random()*2)+"s infinite",opacity:0.6}}>{["💲","💰","💵","🤑"][i%4]}</div>)}</div>}<div className={"slideIn"+(sty.effect?" effect"+sty.effect[0].toUpperCase()+sty.effect.slice(1):"")} style={{background:ec+"18",borderBottom:"1px solid "+ec+"33",padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}><MI n={ei} s={16} c={ec}/><div style={{flex:1}}><div style={{color:ec,fontWeight:700,fontSize:"clamp(10px,2.5vw,12px)"}}>{e.title}{e.discount>0&&<span style={{background:"#4ade80",color:"#000",padding:"1px 6px",borderRadius:4,fontSize:9,fontWeight:800,marginLeft:6}}>{e.discount}% OFF</span>}{e.type==="brainrot"&&<span style={{marginLeft:6,fontSize:9}}>🧠💀</span>}</div>{e.description&&<div style={{color:"#aaa",fontSize:"clamp(8px,2vw,10px)"}}>{e.description}</div>}{sty.image&&e.type!=="jumpscare"&&e.type!=="takeover"&&<img src={sty.image} style={{maxWidth:120,maxHeight:60,borderRadius:4,marginTop:4,objectFit:"cover"}}/>}</div><button onClick={()=>setDismissedEvents(d=>({...d,[e.id]:true,["js_"+e.id]:true}))} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer"}}><MI n="close" s={14}/></button></div></div>})}

    {/* NAV */}
    {!(curLobby?.mode==="buckshot"&&curLobby?.status==="playing")&&<div style={S.nav}>{[["shop",t("tab_shop")],["inv",`${t("tab_inv")} (${st.inv.length})`],["stats",t("tab_stats")],["loan",t("tab_loan")],["flip",t("tab_flip")],["pvp",t("tab_pvp")],["live",t("tab_live")],["lb",t("tab_lb")],["chat",t("tab_chat")],["dm",`${t("tab_dm")}${dmUnread>0?" ("+dmUnread+")":""}`],["me",t("tab_me")],["map",t("tab_map")],["horse",t("tab_horse")],["bj",t("tab_bj")],["btc",t("tab_btc")],["plinko",t("tab_plinko")],["roulette",t("tab_roulette")],["wheel",t("tab_wheel")],["school",t("tab_weather")]].map(([k,l])=>(<button key={k} onClick={()=>{if(!opening||scrollDone||k==="shop"){setPage(k);if(k!=="opening")setOpening(false);if(k==="map")getOnline().then(r=>{if(r)setOnlineData(r)});if(k==="pvp")refreshLobbies();if(k==="bj"&&account){api("/bj/buycard",{username:account.username,token:account.token}).then(r=>{if(r?.hasCard)setBjHasCard(true)})}if(k==="btc"){/* useEffect handles initial load */}if(k==="wheel"&&account){api("/wheel/status",{username:account.username}).then(r=>setWheelStatus(r))}if(k==="school"){if(!weatherData){api("/weather/today",{lat:59.4288,lon:17.9498}).then(r=>{setWeatherData(r)})}if(!smhiWarnings){api("/weather/warnings",{}).then(r=>{setSmhiWarnings(r||{warnings:[]})})}if(!pollenData){api("/weather/pollen",{}).then(r=>{setPollenData(r||{today:[]})})}if(!airData){api("/weather/air",{lat:59.4288,lon:17.9498}).then(r=>{setAirData(r)})}}if(k==="dm"&&account){api("/dm/inbox",{username:account.username,token:account.token}).then(r=>{if(r?.ok){setDmInbox(r);setDmUnread(0);const mx=Math.max(0,...(r.received||[]).map(m=>m.id||0),...(r.sent||[]).map(m=>m.id||0));if(mx>lastDmIdRef.current)lastDmIdRef.current=mx;api("/dm/read",{username:account.username,token:account.token})}}).catch(()=>{setTimeout(()=>{api("/dm/inbox",{username:account.username,token:account.token}).then(r2=>{if(r2?.ok){setDmInbox(r2);setDmUnread(0);const mx=Math.max(0,...(r2.received||[]).map(m=>m.id||0),...(r2.sent||[]).map(m=>m.id||0));if(mx>lastDmIdRef.current)lastDmIdRef.current=mx}})},2000)})}}}} style={{...S.tab,...(page===k||(page==="opening"&&k==="shop")?S.tabOn:{}),color:k==="dm"&&dmUnread>0?"#f59e0b":undefined}}>{l}</button>))}{account&&["admin","owner","mod"].includes(account.role)&&<button onClick={()=>{if(account.role==="owner")window.owner();else window.admin()}} style={{...S.tab,background:"#ff000022",color:"#ff4444",border:"1px solid #ff000044"}}>{account.role==="owner"?"Owner":"Admin"}</button>}<button onClick={()=>setConfirmReset(true)} style={{...S.tab,marginLeft:"auto",color:"#eb4b4b"}}>Reset</button></div>}

    {/* SHOP */}
    {/* ═══════════ SHOP / case grid ═══════════ */}
    {page==="shop"&&<div className="pageBody" style={S.body}><div style={S.grid}>{CASES.map(c=>{const cP=saleDiscount>0?Math.floor(c.price*(1-saleDiscount/100)):c.price;const ok=st.bal>=cP;return(<div key={c.id} className="caseCardHover" style={{...S.card,borderColor:c.color+"44",opacity:ok?1:.35,"--c":c.color}}><div style={{...S.cardIcon,background:c.color+"12",borderColor:c.color+"28"}}><span style={{fontSize:"clamp(20px,5vw,30px)"}}>{c.icon}</span></div><div style={S.cardName}>{c.name}</div><div style={{...S.cardPrice,color:c.color}}>{saleDiscount>0&&<span style={{textDecoration:"line-through",color:"#666",fontSize:"clamp(9px,2.5vw,12px)",marginRight:4}}>{money(c.price)}</span>}{money(saleDiscount>0?Math.floor(c.price*(1-saleDiscount/100)):c.price)}</div><div style={{display:"flex",flexDirection:"column",gap:3,width:"100%"}}><div style={{display:"flex",gap:3}}><button disabled={!ok} onClick={()=>doOpen(c)} style={{...S.btn,background:ok?c.color:"#333",color:"#fff",flex:2,padding:"clamp(4px,1vw,6px) 0",fontSize:"clamp(9px,2.3vw,12px)"}}>Open</button><button disabled={st.bal<cP*10||c.id==="epstein"} onClick={()=>{if(c.id==="epstein"){setToast({msg:"No bulk opening for this case",color:"#eb4b4b"});return}doMultiOpen(c,10)}} style={{...S.btn,background:st.bal>=cP*10?c.color+"aa":"#222",color:st.bal>=cP*10?"#fff":"#555",flex:1,padding:"clamp(4px,1vw,6px) 0",fontSize:"clamp(8px,2vw,10px)"}}>x10</button></div><button onClick={()=>{setInspecting(c);setPage("inspect")}} style={{...S.btn,background:"#ffffff06",color:"#666",padding:"2px 0",fontSize:"clamp(8px,2vw,10px)"}}>Inspect</button></div></div>)})}</div></div>}

    {/* OPENING */}
    {/* ═══════════ CASE OPENING animation ═══════════ */}
    {page==="opening"&&<div className="pageBody" style={S.body}>
      <div style={{textAlign:"center",padding:"clamp(6px,1.5vw,10px) 0",color:"#555",fontSize:"clamp(10px,2.5vw,13px)"}}>{scrollDone?"":"Opening "+selCase?.name+"..."}</div>
      <div style={S.scrollOuter}><div style={S.marker}/><div style={S.scrollClip}><div ref={stripRef} style={S.strip}>{scrollItems.map((item,i)=>{const rar=R[item.rarity];const won=i===WIN_IDX&&scrollDone;return(<div key={i} style={{...S.sItem,borderBottomColor:rar.color,background:won?rar.bg:"#0c0e13",transform:won?"scale(1.08)":"none",transition:"all 0.3s ease",boxShadow:won?"0 0 12px "+rar.color+"66":"none",zIndex:won?2:0}}><div style={{fontSize:"clamp(16px,4vw,28px)",lineHeight:1}}>{item.rarity==="chroma"?<span style={{color:"#ffd700",textShadow:"0 0 8px #ffd70066"}}><MI n="star" s={24} c="#ffd700"/></span>:<span>{item.icon||"?"}</span>}</div><div style={{fontSize:"clamp(6px,1.6vw,9px)",color:rar.color,fontWeight:600,textAlign:"center",lineHeight:1.15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%"}}>{item.name}</div></div>)})}</div></div></div>
      {scrollDone&&wonItem&&(()=>{const rar=R[wonItem.rarity];const isEpic=["covert","chroma","legendary"].includes(wonItem.rarity);const isChroma=wonItem.rarity==="chroma";const isLegendary=wonItem.rarity==="legendary";const cs=caseStats(selCase?.id);const pp=cs.spent===0?"0.00":((cs.earned/cs.spent-1)*100).toFixed(2);const cond=getCondition(wonFloat);return(
        <div className="fadeUp" style={{display:"flex",flexDirection:"column",gap:"clamp(10px,2.5vw,16px)"}}>
          <div style={{background:"#141820",border:"1px solid #1e2430",borderRadius:"clamp(6px,1.5vw,10px)",padding:"clamp(16px,4vw,28px)",display:"flex",flexDirection:"column",alignItems:"center",gap:"clamp(6px,1.5vw,10px)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"clamp(8px,2vw,14px)"}}><span style={{fontSize:"clamp(20px,5vw,32px)"}}>{selCase?.icon}</span><div><div style={{color:rar.color,fontSize:"clamp(14px,3.8vw,22px)",fontWeight:700}}>{wonItem.name}</div><div style={{color:"#999",fontSize:"clamp(10px,2.5vw,13px)"}}>{cond}</div></div></div>
            <div style={{width:"clamp(180px,55vw,340px)",height:3,background:rar.color,borderRadius:2,opacity:.6}}/>
            <Starburst color={rar.color} spin={isChroma||isLegendary}><span style={{fontSize:"clamp(40px,12vw,72px)"}}>{wonItem.icon}</span></Starburst>
            <div style={{display:"flex",gap:8,marginTop:6,width:"100%",justifyContent:"center",flexWrap:"wrap"}}>
              {lastWonId&&<button onClick={sellLastWon} style={{...S.btn,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#000",fontWeight:800,padding:"10px 20px",fontSize:"clamp(13px,3.2vw,16px)",boxShadow:"0 4px 16px #f59e0b44",animation:"pulse 1.5s infinite"}}><MI n="sell" s={16}/> Sell · {money(wonItem?.value||0)}</button>}
              <button onClick={openAgain} style={{...S.btn,background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"#000",fontWeight:800,padding:"10px 20px",fontSize:"clamp(13px,3.2vw,16px)",boxShadow:"0 4px 16px #4ade8044"}}><MI n="refresh" s={16}/> Spin Again · {money(selCase?.price||0)}</button>
            </div>
            <div style={{color:"#ccc",fontSize:"clamp(11px,2.8vw,15px)",fontWeight:600,textAlign:"center",fontStyle:"italic"}}>{wonQuote}</div>
            <div style={{width:"clamp(200px,60vw,380px)"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"clamp(8px,2vw,10px)",color:"#888",marginBottom:3}}><span>MIN: 0.00</span><span>MAX: 1.00</span></div><div style={{position:"relative",height:6,borderRadius:4,overflow:"hidden",background:"linear-gradient(to right,#4ade80,#4ade80 7%,#a3e635 7%,#a3e635 15%,#fbbf24 15%,#fbbf24 38%,#f97316 38%,#f97316 45%,#ef4444 45%)"}}><div style={{position:"absolute",top:-2,bottom:-2,left:`${wonFloat*100}%`,width:2,background:"#fff",borderRadius:1,boxShadow:"0 0 4px #fff"}}/></div></div>
            <div style={{textAlign:"center"}}><span style={{color:"#999",fontSize:"clamp(10px,2.5vw,13px)"}}>Price: </span><span style={{color:wonItem.value>=selCase?.price?"#4ade80":"#eb4b4b",fontSize:"clamp(13px,3.5vw,18px)",fontWeight:800}}>{money(wonItem.value)}</span><span style={{color:"#666",fontSize:"clamp(9px,2.2vw,11px)"}}> | Float: {wonFloat.toFixed(4)}</span></div>
            {rentPaid>0&&<div style={{color:"#f59e0b",fontSize:"clamp(9px,2.2vw,11px)"}}>Rent: {money(rentPaid)}</div>}
            <div style={{display:"flex",width:"100%",gap:6,alignItems:"center",marginTop:6,flexWrap:"wrap"}}><div style={{background:selCase?.color+"22",border:`1px solid ${selCase?.color}44`,borderRadius:6,padding:"5px 10px",fontSize:"clamp(9px,2.2vw,11px)",color:selCase?.color,fontWeight:600}}>{selCase?.icon} {selCase?.name}: {money(selCase?.price)}</div><div style={{flex:1}}/><button onClick={()=>{setPage("shop");setOpening(false)}} style={{...S.btn,background:"#ffffff08",color:"#999"}}>Back</button>{lastWonId&&<button onClick={sellLastWon} style={{...S.btn,background:"#fbbf24",color:"#000",fontWeight:700}}>Sell {money(wonItem?.value||0)}</button>}{lastWonId?(()=>{const net=(wonItem?.value||0)-(selCase?.price||0);const netColor=net>=0?"#4ade80":"#eb4b4b";return <button onClick={()=>{sellLastWon();setTimeout(()=>openAgain(),50)}} style={{...S.btn,background:net>=0?"#4ade80":"#eb4b4b",color:"#0a0c10",fontWeight:800,display:"inline-flex",alignItems:"center",gap:6}}>Sell & Spin Again <span style={{fontSize:10,opacity:0.85}}>({net>=0?"+":""}{money(net)} net)</span></button>})():<button onClick={openAgain} style={{...S.btn,background:"#4ade80",color:"#0a0c10",fontWeight:800}}>One more time</button>}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"clamp(8px,2vw,12px)"}}>
            <div style={{background:"#141820",border:"1px solid #1e2430",borderRadius:8,padding:"clamp(10px,2.5vw,16px)"}}><div style={{fontWeight:700,fontSize:"clamp(10px,2.5vw,13px)",marginBottom:8,color:"#ccc",textAlign:"center"}}>Container stats</div><div style={{display:"grid",gridTemplateColumns:"auto 1fr auto 1fr",gap:"2px 8px",fontSize:"clamp(9px,2.2vw,11px)"}}><span style={{color:"#888"}}>Opened:</span><span style={{fontWeight:600}}>{cs.opened}</span><span style={{color:"#888"}}>Spent:</span><span style={{fontWeight:600}}>{money(cs.spent)}</span><span style={{color:"#888"}}>Profit:</span><span style={{fontWeight:600,color:parseFloat(pp)>=0?"#4ade80":"#eb4b4b"}}>{pp}%</span><span style={{color:"#888"}}>Earned:</span><span style={{fontWeight:600}}>{money(cs.earned)}</span></div><div style={{marginTop:8,fontSize:"clamp(8px,2vw,10px)"}}>{RKEYS.filter(k=>k!=="consumer").map(k=><div key={k} style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}><span style={{color:R[k].color,fontWeight:600,width:"clamp(50px,16vw,75px)"}}>{R[k].label}</span><div style={{flex:1,height:10,background:`${R[k].color}22`,borderRadius:2}}/><span style={{color:"#ccc",width:24,textAlign:"right"}}>{cs.counts[k]||0}</span></div>)}</div></div>
            <div style={{background:"#141820",border:"1px solid #1e2430",borderRadius:8,padding:"clamp(10px,2.5vw,16px)",overflow:"hidden"}}><div style={{fontWeight:700,fontSize:"clamp(10px,2.5vw,13px)",marginBottom:8,color:"#ccc",textAlign:"center"}}>Latest drops</div><div style={{display:"flex",flexDirection:"column",gap:2,maxHeight:"clamp(120px,30vw,200px)",overflowY:"auto"}}>{drops.length===0?<div style={{color:"#555",fontSize:"clamp(9px,2.2vw,11px)"}}>None</div>:drops.slice(0,12).map((d,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 6px",background:i===0?R[d.rarity].bg:"transparent",borderLeft:`2px solid ${R[d.rarity].color}`,borderRadius:3,fontSize:"clamp(8px,2vw,10px)"}}><span style={{color:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}><span style={{color:"#666"}}>{i+1}.</span> {d.icon} {d.name}</span><span style={{color:R[d.rarity].color,fontWeight:600,marginLeft:6,flexShrink:0}}>{money(d.value)}</span></div>)}</div></div>
          </div>
        </div>
      )})()}
    </div>}

    {/* INSPECT */}
    {/* ═══════════ INSPECT case ═══════════ */}
    {page==="inspect"&&inspecting&&<div className="pageBody" style={S.body}><button onClick={()=>setPage("shop")} style={{...S.btn,background:"#ffffff08",color:"#666",marginBottom:10}}>&larr; Back</button><div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:10}}>{inspecting.icon} {inspecting.name} &mdash; {money(inspecting.price)}</div><div style={S.iList}><div style={S.iHdr}><span>Item</span><span>Rarity</span><span>Value</span><span>Rate</span></div>{[...inspecting.items].sort((a,b)=>R[b.rarity].chance-R[a.rarity].chance).map((item,i)=>{const pool=inspecting.items.filter(x=>x.rarity===item.rarity).length;const p=((R[item.rarity].chance/pool)*100).toFixed(2);return(<div key={i} style={{...S.iRow,borderLeftColor:R[item.rarity].color}}><span style={{fontWeight:600}}>{item.icon} {item.name}</span><span style={{color:R[item.rarity].color,fontWeight:600}}>{R[item.rarity].label}</span><span style={{color:"#4ade80"}}>{money(item.value)}</span><span style={{color:"#666"}}>{p}%</span></div>)})}</div><div style={{marginTop:16}}><div style={{fontSize:"clamp(12px,3vw,14px)",fontWeight:600,marginBottom:8,color:"#777"}}>Drop Rates</div>{Object.entries(R).map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{color:v.color,fontWeight:600,width:"clamp(60px,18vw,90px)",fontSize:"clamp(9px,2.5vw,12px)"}}>{v.label}</span><div style={{flex:1,height:5,background:"#1a1d24",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:v.color,width:`${Math.max(v.chance*200,1)}%`}}/></div><span style={{color:"#666",width:"clamp(32px,10vw,48px)",textAlign:"right",fontSize:"clamp(8px,2.2vw,11px)"}}>{(v.chance*100).toFixed(1)}%</span></div>)}</div></div>}

    {/* INVENTORY */}
    {/* ═══════════ INVENTORY ═══════════ */}
    {page==="inv"&&<div className="pageBody" style={S.body}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}><div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700}}>Inventory ({st.inv.length})</div><div style={{color:"#888",fontSize:"clamp(9px,2.2vw,11px)"}}>Total: {money(invTotal)} | <MI n="star" s={11} c="#ffd700"/> {Object.keys(st.starred||{}).length}</div></div>
      <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <select value={invSort} onChange={e=>setInvSort(e.target.value)} style={S.sel}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="value-high">Value ↓</option><option value="value-low">Value ↑</option><option value="rarity">Rarity</option><option value="name">Name</option></select>
        <select value={invFilter} onChange={e=>setInvFilter(e.target.value)} style={S.sel}><option value="all">All</option><option value="starred">★ Starred</option>{RKEYS.map(k=><option key={k} value={k}>{R[k].label}</option>)}</select>
        <button onClick={()=>setInvView(v=>v==="grid"?"list":"grid")} style={{...S.btn,background:"#ffffff08",color:"#888",padding:"5px 8px"}}>{invView==="grid"?"List":"Grid"}</button>
        <div style={{flex:1}}/>
        <input type="number" placeholder="#" value={sellAmt} onChange={e=>setSellAmt(e.target.value)} style={{...S.sel,width:"clamp(40px,12vw,60px)"}}/>
        <button onClick={()=>{const n=parseInt(sellAmt);if(n>0)setSellConfirm("count")}} disabled={!sellAmt||parseInt(sellAmt)<=0} style={{...S.btn,background:"#4ade8022",color:"#4ade80",padding:"5px 8px"}}>Sell #</button>
        <button onClick={()=>setSellConfirm("all")} disabled={unstarredCount===0} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b",padding:"5px 8px"}}>Sell all</button>
      </div>
      {filteredInv.length===0?<div style={{color:"#555",padding:20,textAlign:"center"}}>No items match.</div>:
        invView==="grid"?<div style={S.invG}>{filteredInv.map((item,i)=>{const starred=st.starred?.[item.id];return(<div key={item.id||i} className="invItem" onClick={()=>setSelItem(item)} style={{...S.invI,borderLeftColor:R[item.rarity]?.color||"#555",cursor:"pointer",position:"relative",background:starred?"#ffd70008":"#0d1117"}}>{starred&&<div style={{position:"absolute",top:4,right:6,color:"#ffd700",fontSize:"clamp(10px,2.5vw,14px)"}}>{"\u2605"}</div>}<div style={{fontWeight:600,fontSize:"clamp(10px,2.8vw,13px)"}}>{item.icon} {item.name}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:R[item.rarity]?.color,fontSize:"clamp(8px,2.2vw,10px)"}}>{R[item.rarity]?.label}</span><span style={{color:"#4ade80",fontSize:"clamp(9px,2.5vw,12px)",fontWeight:600}}>{money(item.value)}</span></div>{item.float!==undefined&&<div style={{color:"#666",fontSize:"clamp(7px,1.8vw,9px)"}}>{getCondition(item.float)}</div>}</div>)})}</div>:
        <div style={{display:"flex",flexDirection:"column",gap:2}}>{filteredInv.map((item,i)=>{const starred=st.starred?.[item.id];return(<div key={item.id||i} onClick={()=>setSelItem(item)} style={{display:"grid",gridTemplateColumns:"24px 1fr 80px 70px 24px",alignItems:"center",gap:6,padding:"5px 8px",background:starred?"#ffd70008":"#0d1117",borderLeft:`2px solid ${R[item.rarity]?.color}`,borderRadius:3,cursor:"pointer",fontSize:"clamp(8px,2.2vw,11px)"}}><span>{item.icon}</span><span style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</span><span style={{color:R[item.rarity]?.color,fontWeight:600}}>{R[item.rarity]?.label}</span><span style={{color:"#4ade80",fontWeight:600}}>{money(item.value)}</span><span style={{color:starred?"#ffd700":"#333"}}>{starred?<MI n="star" s={12} c="#ffd700"/>:<MI n="star_outline" s={12} c="#333"/>}</span></div>)})}</div>}
    </div>}

    {/* STATS */}
    {/* ═══════════ STATS chart ═══════════ */}
    {page==="stats"&&(()=>{const hist=st.history||[{n:0,bal:DEFAULT_BAL}];const vals=hist.map(h=>h.bal);const minV=Math.min(...vals,0);const maxV=Math.max(...vals,DEFAULT_BAL);const range=maxV-minV||1;const W=800,H=320,PAD={t:30,r:20,b:40,l:60};const cw=W-PAD.l-PAD.r,ch=H-PAD.t-PAD.b;const x=i=>PAD.l+(hist.length<=1?cw/2:(i/(hist.length-1))*cw);const y=v=>PAD.t+ch-((v-minV)/range)*ch;const pts=hist.map((h,i)=>`${x(i)},${y(h.bal)}`).join(" ");const area=`M${x(0)},${y(hist[0].bal)} `+hist.map((h,i)=>`L${x(i)},${y(h.bal)}`).join(" ")+` L${x(hist.length-1)},${y(minV)} L${x(0)},${y(minV)} Z`;const tips=hist.map((h,i)=>h.label?{...h,i}:null).filter(Boolean);const gridLines=[];for(let g=0;g<=5;g++){const val=minV+(range*g)/5;gridLines.push({y:y(val),val})}const startY=y(DEFAULT_BAL);return(
      <div className="pageBody" style={S.body}><div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:10}}>Stats</div>
        <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:10,padding:"clamp(10px,2.5vw,16px)",marginBottom:14,overflow:"hidden"}}><div style={{fontSize:"clamp(10px,2.5vw,13px)",fontWeight:700,color:"#888",marginBottom:8}}>Balance History</div>
          {hist.length<2?<div style={{color:"#555",fontSize:12,padding:"20px 0",textAlign:"center"}}>Open cases to see data</div>:
          <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
            {gridLines.map((g,i)=><g key={i}><line x1={PAD.l} y1={g.y} x2={W-PAD.r} y2={g.y} stroke="#1a1d24" strokeWidth="1"/><text x={PAD.l-6} y={g.y+4} fill="#444" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">{Math.abs(g.val)>=1000?(g.val/1000).toFixed(0)+"k":Math.round(g.val)}</text></g>)}
            {[0,Math.floor(hist.length/4),Math.floor(hist.length/2),Math.floor(hist.length*3/4),hist.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=><text key={i} x={x(i)} y={H-8} fill="#444" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">#{hist[i].n}</text>)}
            {minV<0&&<line x1={PAD.l} y1={y(0)} x2={W-PAD.r} y2={y(0)} stroke="#eb4b4b44" strokeWidth="1" strokeDasharray="4,4"/>}
            <line x1={PAD.l} y1={startY} x2={W-PAD.r} y2={startY} stroke="#4ade8033" strokeWidth="1" strokeDasharray="4,4"/>
            <defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity=".15"/><stop offset="60%" stopColor="#4ade80" stopOpacity=".03"/><stop offset="100%" stopColor="#eb4b4b" stopOpacity=".08"/></linearGradient><linearGradient id="lG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#4ade80"/><stop offset="100%" stopColor={profit>=0?"#4ade80":"#eb4b4b"}/></linearGradient></defs>
            <path d={area} fill="url(#aG)"/><polyline points={pts} fill="none" stroke="url(#lG)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx={x(hist.length-1)} cy={y(hist[hist.length-1].bal)} r="4" fill={profit>=0?"#4ade80":"#eb4b4b"}/>
            {tips.map((t,ti)=>{const tx=x(t.i),ty=y(t.bal),above=ty>H/2;return(<g key={ti}><line x1={tx} y1={ty} x2={tx} y2={above?ty-30:ty+30} stroke="#ffd70088" strokeWidth="1" strokeDasharray="2,2"/><circle cx={tx} cy={ty} r="3.5" fill="#ffd700"/><rect x={tx-50} y={above?ty-46:ty+32} width="100" height="14" rx="3" fill="#141820" stroke="#ffd70044" strokeWidth=".5"/><text x={tx} y={above?ty-36:ty+42} fill="#ffd700" fontSize="7.5" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="600">{t.label.length>18?t.label.slice(0,18)+"..":t.label}</text></g>)})}
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="#1e2430" strokeWidth="1"/><line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="#1e2430" strokeWidth="1"/>
          </svg>}
          <div style={{display:"flex",gap:14,marginTop:6,flexWrap:"wrap",fontSize:"clamp(8px,2vw,10px)"}}><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/> Profit</span><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:"#eb4b4b",display:"inline-block"}}/> Loss</span><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:"#ffd700",display:"inline-block"}}/> Big win</span></div>
        </div>
        <div style={S.stG}>{[["Opened",st.stats.opened],["Spent",money(st.stats.spent)],["Won",money(st.stats.won)],["Profit",money(profit)],["Sold",money(st.stats.sold||0)],["Best",st.stats.best||"\u2014"],["Debt",money(st.loan)],["Credit",st.creditScore||100],["Inv Value",money(invTotal)]].map(([l,v],i)=><div key={i} style={S.stI}><div style={{color:"#555",fontSize:"clamp(8px,2.2vw,10px)",textTransform:"uppercase",letterSpacing:1}}>{l}</div><div style={{fontSize:"clamp(14px,4vw,20px)",fontWeight:700,color:l==="Profit"?(profit>=0?"#4ade80":"#eb4b4b"):l==="Sold"?"#fbbf24":"#e2e8f0"}}>{v}</div></div>)}</div>
      </div>)})()}

    {/* LOAN */}
    {/* ═══════════ LOAN / credit ═══════════ */}
    {page==="loan"&&(()=>{
      const cs=st.creditScore||500;
      const tier=cs>=700?"Excellent":cs>=500?"Good":cs>=300?"Fair":cs>=150?"Poor":"Very Poor";
      const tierColor=cs>=700?"#4ade80":cs>=500?"#3b82f6":cs>=300?"#f59e0b":cs>=150?"#f97316":"#eb4b4b";
      const rate=cs>=700?5:cs>=500?10:cs>=300?20:cs>=150?35:50;
      const maxByCredit=cs>=700?MAX_LOAN:cs>=500?100000:cs>=300?30000:cs>=150?10000:3000;
      const avail=Math.max(0,maxByCredit-st.loan);
      const remainingMins=st.loanDeadline>0?Math.max(0,st.loanDeadline-(st.onlineMinutes||0)):0;
      return <div className="pageBody" style={S.body}>
        <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:10}}>Loan</div>
        <div style={S.loanBox}>
          <div style={{background:"#080a0f",borderRadius:10,padding:"12px 16px",marginBottom:12,border:"1px solid "+tierColor+"33"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{color:"#888",fontSize:11,fontWeight:600}}>CREDIT SCORE</span><span style={{color:tierColor,fontSize:12,fontWeight:700}}>{tier}</span></div>
            <div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{color:tierColor,fontSize:"clamp(28px,7vw,40px)",fontWeight:800}}>{cs}</span><span style={{color:"#555",fontSize:10}}>/800</span></div>
            <div style={{background:"#1e2430",borderRadius:4,height:6,marginTop:6,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,#eb4b4b,#f59e0b,#4ade80)",width:(cs/8)+"%",borderRadius:4,transition:"width 0.5s"}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:9,color:"#666"}}><span>Rate: {rate}%</span><span>Limit: {money(maxByCredit)}</span><span>Paid: {money(st.loansPaid||0)}</span><span>Defaults: {st.loansDefaulted||0}</span></div>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>{[["DEBT",st.loan,st.loan>0?"#eb4b4b":"#4ade80"],["LIMIT",maxByCredit,tierColor],["AVAIL",avail,"#e2e8f0"],["ONLINE",(st.onlineMinutes||0)+" min","#888"]].map(([l,v,c])=><div key={l}><div style={{color:"#555",fontSize:"clamp(8px,2vw,10px)"}}>{l}</div><div style={{fontSize:"clamp(14px,4vw,20px)",fontWeight:700,color:c}}>{typeof v==="number"?money(v):v}</div></div>)}</div>
          {st.loan>0&&st.loanDeadline>0&&<div style={{background:remainingMins<=2?"#eb4b4b22":"#f59e0b22",border:"1px solid "+(remainingMins<=2?"#eb4b4b55":"#f59e0b55"),borderRadius:8,padding:"10px 12px",marginBottom:12}}>
            <div style={{color:remainingMins<=2?"#eb4b4b":"#f59e0b",fontSize:12,fontWeight:800}}>{remainingMins>0?"⏰ Loan deadline: "+remainingMins+" online min remaining":"⚠ Deadline passed"}</div>
            <div style={{color:"#94a3b8",fontSize:10,marginTop:2}}>Owe {money(st.loan)}. Miss the deadline and you lose 50 credit score.</div>
          </div>}
          <div style={{color:"#888",fontSize:10,marginBottom:8,lineHeight:1.5}}>Loans must be repaid before the deadline. Time counts only while the tab is active. Default = credit damage.</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={()=>{setLoanAmt("");setLoanMinutes("5");setShowLoanModal(true)}} disabled={avail<=0} style={{...S.btn,background:"#f59e0b",color:"#000",fontWeight:700,padding:"10px 20px",flex:1}}>Request Loan ({rate}%)</button>
            <button onClick={()=>{setLoanAmt(String(Math.min(st.loan,st.bal)));repay()}} disabled={st.loan<=0||st.bal<=0} style={{...S.btn,background:"#4ade80",color:"#000",fontWeight:700,padding:"10px 20px"}}>Repay {money(Math.min(st.loan,st.bal))}</button>
          </div>
        </div>
      </div>;
    })()}
    {/* LOAN REQUEST MODAL */}
    {showLoanModal&&(()=>{
      const cs=st.creditScore||500;
      const rate=cs>=700?0.05:cs>=500?0.1:cs>=300?0.2:cs>=150?0.35:0.5;
      const maxByCredit=cs>=700?MAX_LOAN:cs>=500?100000:cs>=300?30000:cs>=150?10000:3000;
      const avail=Math.max(0,maxByCredit-st.loan);
      const amt=parseInt(loanAmt)||0;
      const minutes=parseInt(loanMinutes)||5;
      const totalOwed=Math.round(amt*(1+rate));
      return <div style={S.overlay} onClick={()=>setShowLoanModal(false)}><div className="modalIn" style={{...S.modal,maxWidth:400,padding:20}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><MI n="attach_money" s={24} c="#f59e0b"/><div style={{fontSize:18,fontWeight:800,color:"#f59e0b"}}>Request Loan</div></div>
        <div style={{color:"#888",fontSize:11,marginBottom:14}}>Your credit: {cs}/800 · Rate: {(rate*100)}% · Max: {money(avail)}</div>
        <div style={{marginBottom:12}}>
          <div style={{color:"#888",fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>1. How much do you want?</div>
          <input type="number" value={loanAmt} onChange={e=>setLoanAmt(e.target.value.replace(/[^0-9]/g,""))} placeholder="Amount $" style={{...S.input,width:"100%",fontSize:16,textAlign:"center"}} autoFocus/>
          <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>{[1000,5000,10000,50000].filter(a=>a<=avail).map(a=><button key={a} onClick={()=>setLoanAmt(String(a))} style={{...S.btn,background:loanAmt===String(a)?"#f59e0b22":"#ffffff08",color:loanAmt===String(a)?"#f59e0b":"#888",padding:"3px 10px",fontSize:10}}>{money(a)}</button>)}<button onClick={()=>setLoanAmt(String(avail))} style={{...S.btn,background:"#f59e0b11",color:"#f59e0b",padding:"3px 10px",fontSize:10}}>Max</button></div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{color:"#888",fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>2. When will you pay it back? (online time, max 10 min)</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{[1,3,5,7,10].map(m=><button key={m} onClick={()=>setLoanMinutes(String(m))} style={{...S.btn,background:loanMinutes===String(m)?"#3b82f6":"#ffffff08",color:loanMinutes===String(m)?"#fff":"#888",padding:"6px 12px",fontSize:11,flex:1,fontWeight:700}}>{m} min</button>)}</div>
        </div>
        {amt>0&&minutes>0&&<div style={{background:"#080a0e",borderRadius:8,padding:10,marginBottom:12,fontSize:11}}>
          <div style={{display:"flex",justifyContent:"space-between",color:"#cbd5e1"}}><span>You receive:</span><span style={{color:"#4ade80",fontWeight:700}}>+{money(amt)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",color:"#cbd5e1",marginTop:4}}><span>Interest ({(rate*100)}%):</span><span style={{color:"#eb4b4b"}}>+{money(totalOwed-amt)}</span></div>
          <div style={{borderTop:"1px solid #1e2430",margin:"6px 0 4px",paddingTop:4,display:"flex",justifyContent:"space-between"}}><span style={{color:"#cbd5e1",fontWeight:700}}>You owe:</span><span style={{color:"#eb4b4b",fontWeight:800}}>{money(totalOwed)}</span></div>
          <div style={{color:"#94a3b8",fontSize:9,marginTop:4}}>Deadline: {minutes} online min from now ({(st.onlineMinutes||0)+minutes} total)</div>
        </div>}
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setShowLoanModal(false)} style={{...S.btn,background:"#ffffff08",color:"#888",flex:1,padding:10}}>Cancel</button>
          <button onClick={borrow} disabled={!amt||amt<=0||amt>avail} style={{...S.btn,background:"#f59e0b",color:"#000",flex:2,fontWeight:800,padding:10}}>Sign & Borrow</button>
        </div>
      </div></div>;
    })()}

    {/* LIVE FEED */}
    {/* ═══════════ LIVE FEED ═══════════ */}
    {page==="live"&&<div className="pageBody" style={S.body}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700}}><MI n="stream" s={20} c="#eb4b4b"/> Live Opens</div>
        <button onClick={async()=>{const f=await getFeed();if(f?.feed)setFeed(f.feed)}} style={{...S.btn,background:"#ffffff08",color:"#888"}}>Refresh</button>
      </div>
      {/* Nickname editor */}
      <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",gap:6,alignItems:"center",fontSize:"clamp(9px,2.2vw,11px)"}}>
        <span style={{color:"#888"}}>Your name:</span>
        {nameEditing?<><input value={nickname} onChange={e=>setNickname(e.target.value.slice(0,16))} maxLength={16} style={{...S.sel,flex:1}} autoFocus/><button onClick={()=>{setUserName(nickname);setNameEditing(false)}} style={{...S.btn,background:"#4ade80",color:"#000",padding:"4px 10px"}}>Save</button></>:<><span style={{color:"#e2e8f0",fontWeight:600}}>{nickname}</span><button onClick={()=>setNameEditing(true)} style={{...S.btn,background:"#ffffff08",color:"#888",padding:"4px 8px"}}>Edit</button></>}
        <span style={{color:"#444",marginLeft:"auto"}}>ID: {USER_ID.slice(0,8)}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        {feed.length===0?<div style={{color:"#555",textAlign:"center",padding:20}}>No recent opens yet. Be the first!</div>:
        feed.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#0d1117",borderLeft:`2px solid ${R[f.rarity]?.color||"#555"}`,borderRadius:4,fontSize:"clamp(8px,2.2vw,11px)"}}>
          <span style={{color:"#888",flexShrink:0,width:50}}>{f.ago||""}</span>
          <span style={{color:"#ccc",fontWeight:600}}>{f.uname||"Anon"}</span>
          <span style={{color:"#888"}}>{f.case_name==="horse"?"won":"opened"}</span>
          <span style={{color:R[f.rarity]?.color,fontWeight:600}}>{f.case_name==="horse"?<MI n="emoji_nature" s={12} c={R[f.rarity]?.color}/>:f.icon} {f.item}</span>
          <span style={{color:"#4ade80",fontWeight:600,marginLeft:"auto",flexShrink:0}}>{money(f.value)}</span>
        </div>)}
      </div>
    </div>}

    {/* LEADERBOARD */}
    {/* ═══════════ LEADERBOARD ═══════════ */}
    {page==="lb"&&<div className="pageBody" style={S.body}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700}}><MI n="leaderboard" s={20}/> Leaderboard</div>
        <button onClick={async()=>{const l=await getLeaderboard();if(l?.lb)setLb(l.lb)}} style={{...S.btn,background:"#ffffff08",color:"#888"}}>Refresh</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        {lb.length===0?<div style={{color:"#555",textAlign:"center",padding:20}}>No players yet.</div>:
        lb.map((p,i)=>{
          const rankIcon = i<3 ? <MI n={["emoji_events","military_tech","workspace_premium"][i]} s={16} c={["#ffd700","#c0c0c0","#cd7f32"][i]}/> : null;
          return (
          <UserName key={p.uname||i} name={p.uname} as="div" style={{display:"grid",gridTemplateColumns:"34px minmax(0,1fr) auto auto",alignItems:"center",gap:"clamp(4px,1.5vw,10px)",padding:"8px clamp(8px,2vw,12px)",background:i<3?"#ffd70008":"#0d1117",border:i<3?"1px solid #ffd70022":"1px solid #151820",borderRadius:6,fontSize:"clamp(9px,2.2vw,12px)",cursor:"pointer"}} onClick={()=>showProfile(p.uname)}>
            <span style={{fontWeight:800,color:i<3?"#ffd700":"#888",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>{rankIcon||`#${i+1}`}</span>
            <span style={{fontWeight:600,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,minWidth:0}}>
              <StatusDot status={userStatusMap[p.uname]||"offline"}/>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dName(p)}</span>
              <span style={{color:"#666",fontSize:"clamp(7px,1.8vw,9px)",flexShrink:0}}>Lv{p.level||1}</span>
              {p.banned&&<span style={{color:"#eb4b4b",fontSize:8,background:"#eb4b4b22",padding:"0 4px",borderRadius:3,flexShrink:0}}>BAN</span>}
              {p.deleted&&<span style={{color:"#666",fontSize:8,background:"#33333355",padding:"0 4px",borderRadius:3,flexShrink:0}}>DEL</span>}
            </span>
            <span style={{color:"#4ade80",fontWeight:600,textAlign:"right",whiteSpace:"nowrap"}}>{money(p.totalWon||0)}</span>
            <span style={{color:"#888",textAlign:"right",whiteSpace:"nowrap",fontSize:"clamp(8px,2vw,10px)"}}>{(p.opens||0).toLocaleString()} opens</span>
          </UserName>
        )})}
      </div>
    </div>}

    {/* CHAT */}
    {/* ═══════════ GLOBAL CHAT ═══════════ */}
    {page==="chat"&&<div className="pageBody" style={S.body}>
      <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:12}}><MI n="chat" s={20}/> Chat Room</div>
      <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:8,padding:10,height:"clamp(200px,50vh,400px)",overflowY:"auto",display:"flex",flexDirection:"column-reverse",gap:4,marginBottom:10}} id="__chatbox">
        {chatLog.length===0?<div style={{color:"#555",textAlign:"center",padding:20}}>No messages yet. Say hi!</div>:
        chatLog.map((m,i)=><div key={m.id||i} className="chatMsg" style={{display:"flex",gap:6,fontSize:"clamp(8px,2.2vw,11px)",padding:"4px 0",alignItems:"flex-start"}}>
          <span style={{color:"#888",flexShrink:0,width:42}}>{m.ago||""}</span>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#1e2430",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0,cursor:"pointer",overflow:"hidden"}} onClick={()=>{if(m.uid!=="SYSTEM")showProfile(m.uname)}}>{m.pfp?<img src={m.pfp} style={{width:18,height:18,borderRadius:"50%",objectFit:"cover"}}/>:<MI n="person" s={12} c="#666"/>}</div>
          {m.uid!=="SYSTEM"?<UserName name={m.uname} style={{color:m.uid===USER_ID?"#4ade80":m.role==="owner"?"#ff4444":m.role==="admin"?"#ffd700":m.role==="mod"?"#8b5cf6":"#3b82f6",fontWeight:700,flexShrink:0,cursor:"pointer"}} onClick={()=>showProfile(m.uname)}>{dName(m)}</UserName>:<span style={{color:"#f59e0b",fontWeight:700,flexShrink:0}}>{dName(m)}</span>}
          <span style={{color:m.uid==="SYSTEM"?"#fbbf24":"#ccc"}} dangerouslySetInnerHTML={{__html:renderMd(m.msg)}}/>
          {m.uid!=="SYSTEM"&&m.uid!==USER_ID&&account&&<span onClick={()=>setReportModal({targetUser:m.uname,messageId:m.id,channel:"global",content:m.msg})} style={{color:"#f59e0b",cursor:"pointer",fontSize:11,marginLeft:4,opacity:0.7,flexShrink:0}} title="Report"><MI n="flag" s={11} c="#f59e0b"/></span>}
        </div>)}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={chatMsg} onChange={e=>setChatMsg(e.target.value.slice(0,200))} onKeyDown={e=>{if(e.key==="Enter"&&chatMsg.trim()&&chatCd<=0){sendChat(chatMsg.trim()).then(r=>{if(r?.cooldown)setChatCd(r.cooldown);else if(r?.ok||r?.sent){setChatCd(5);getChat(false,lastChatIdRef.current).then(c2=>{if(c2?.msgs&&c2.msgs.length>0){const nm=c2.msgs.map(m=>({...m,pfp:pfpCache.current[m.uid]||""}));setChatLog(prev=>{const ids=new Set(prev.map(m=>m.id));const fresh=nm.filter(m=>!ids.has(m.id));return[...fresh,...prev].slice(0,200)});const mx=Math.max(...nm.map(m=>m.id||0));if(mx>lastChatIdRef.current)lastChatIdRef.current=mx}})}else if(r?.error==="Banned: "||r?.banned){setChatCd(999)}});setChatMsg("")}}} placeholder={chatCd>0?`Wait ${chatCd}s...`:"Type a message..."} style={{...S.input,flex:1,width:"auto"}} maxLength={200} disabled={chatCd>0}/>
        <button onClick={()=>{if(chatMsg.trim()&&chatCd<=0){sendChat(chatMsg.trim()).then(r=>{if(r?.cooldown)setChatCd(r.cooldown);else if(r?.ok||r?.sent){setChatCd(5);getChat(false,lastChatIdRef.current).then(c2=>{if(c2?.msgs&&c2.msgs.length>0){const nm=c2.msgs.map(m=>({...m,pfp:pfpCache.current[m.uid]||""}));setChatLog(prev=>{const ids=new Set(prev.map(m=>m.id));const fresh=nm.filter(m=>!ids.has(m.id));return[...fresh,...prev].slice(0,200)});const mx=Math.max(...nm.map(m=>m.id||0));if(mx>lastChatIdRef.current)lastChatIdRef.current=mx}})}else if(r?.banned){setChatCd(999)}});setChatMsg("")}}} disabled={chatCd>0||!chatMsg.trim()} style={{...S.btn,background:chatCd>0?"#333":"#8b5cf6",color:chatCd>0?"#666":"#fff"}}>{chatCd>0?chatCd+"s":"Send"}</button>
      </div>
    </div>}

    {/* COIN FLIP */}
    {/* ═══════════ COIN FLIP ═══════════ */}
    {page==="flip"&&<div className="pageBody" style={S.body}>
      <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:12}}><MI n="monetization_on" s={20}/> Coin Flip <span style={{color:"#888",fontSize:"clamp(9px,2.2vw,11px)",fontWeight:400}}>49% win rate</span></div>
      <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:12,padding:"clamp(16px,4vw,28px)",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{fontSize:"clamp(48px,14vw,80px)",transition:"transform 0.5s",transform:wonItem?.flipResult?"rotateY(360deg)":"none"}}>{wonItem?.flipResult==="heads"?<MI n="paid" s={64} c="#f59e0b"/>:wonItem?.flipResult==="tails"?<MI n="circle" s={64} c="#8b5cf6"/>:<MI n="help" s={64} c="#888"/>}</div>
        {wonItem?.flipResult&&<div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:800,color:wonItem.flipWon?"#4ade80":"#eb4b4b",animation:"fadeUp .4s"}}>{wonItem.flipWon?"+"+money(wonItem.flipBet):"-"+money(wonItem.flipBet)}</div>}
        <div style={{display:"flex",gap:6,alignItems:"center"}}><input type="number" placeholder="Bet amount" id="flipBet" style={{...S.input,width:"clamp(100px,30vw,160px)"}} min="1"/></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={async()=>{const bet=parseInt(document.getElementById("flipBet")?.value);if(!bet||bet<=0||bet>st.bal)return;const r=await api("/coinflip",{bet,choice:"heads",username:account?.username,token:account?.token,slot});if(!r?.ok){setToast({msg:r?.error||"Failed",color:"#eb4b4b"});return}setWonItem(w=>({...w,flipResult:r.result,flipWon:r.won,flipBet:bet}));lastServerActionRef.current=Date.now();setSt(p=>{const newBal=(r.serverBal!==null&&r.serverBal!==undefined)?r.serverBal:p.bal+(r.won?bet:-bet);const ns={...p,bal:newBal};save(ns,drops);return ns});if(r.won)sndReveal(true);else sndReveal(false)}} style={{...S.btn,background:"#f59e0b",color:"#000",padding:"10px 24px",fontSize:"clamp(12px,3vw,16px)",fontWeight:800}}>Heads</button>
          <button onClick={async()=>{const bet=parseInt(document.getElementById("flipBet")?.value);if(!bet||bet<=0||bet>st.bal)return;const r=await api("/coinflip",{bet,choice:"tails",username:account?.username,token:account?.token,slot});if(!r?.ok){setToast({msg:r?.error||"Failed",color:"#eb4b4b"});return}setWonItem(w=>({...w,flipResult:r.result,flipWon:r.won,flipBet:bet}));lastServerActionRef.current=Date.now();setSt(p=>{const newBal=(r.serverBal!==null&&r.serverBal!==undefined)?r.serverBal:p.bal+(r.won?bet:-bet);const ns={...p,bal:newBal};save(ns,drops);return ns});if(r.won)sndReveal(true);else sndReveal(false)}} style={{...S.btn,background:"#8b5cf6",color:"#fff",padding:"10px 24px",fontSize:"clamp(12px,3vw,16px)",fontWeight:800}}>Tails</button>
        </div>
        <div style={{color:"#888",fontSize:"clamp(8px,2vw,10px)"}}>Server-side — provably fair</div>
      </div>
    </div>}

    {/* PVP LOBBY */}
    {/* ═══════════ PVP ARENA + BUCKSHOT ROULETTE ═══════════ */}
    {page==="pvp"&&<div className="pageBody" style={S.body}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}>
        <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700}}><MI n="sports_kabaddi" s={20}/> PvP Arena</div>
        {!curLobby&&account&&<button onClick={async()=>{const ok=await askConfirm({title:"Escape stuck lobby",message:"Use this if you can't create or join a lobby because of a previous broken game. Any unfinished bets will be refunded.",ok:"Clear & refund",color:"#fbbf24",icon:"emergency"});if(!ok)return;const r=await api("/lobby/force-leave",{username:account.username});if(r?.ok){if(r.refundedTotal>0){setToast({msg:"Cleared "+r.kickedFrom+" stale lobby, refunded "+money(r.refundedTotal),color:"#4ade80"});try{await silentCloudSync()}catch{}}else if(r.kickedFrom>0){setToast({msg:"Cleared "+r.kickedFrom+" stale lobby entries",color:"#4ade80"})}else{setToast({msg:"No stuck lobbies found",color:"#888"})}refreshLobbies&&refreshLobbies()}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}}} style={{...S.btn,background:"#fbbf2422",color:"#fbbf24",border:"1px solid #fbbf2444",fontSize:"clamp(9px,2vw,11px)",padding:"4px 10px"}} title="Use if you can't join/create a lobby">🛟 Escape stuck lobby</button>}
      </div>
      {/* REJOIN ACTIVE MATCH banner — appears when user has a playing buckshot game they're not currently in */}
      {rejoinPrompt&&!curLobby&&account&&<div style={{background:"linear-gradient(135deg,#3a0a0a,#7a0a0a)",border:"2px solid #eb4b4b",borderRadius:8,padding:14,marginBottom:14,animation:"bounceIn .4s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"space-between",flexWrap:"wrap"}}>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontWeight:800,fontSize:"clamp(13px,3.5vw,16px)",color:"#fff",fontFamily:"'Black Ops One',sans-serif",letterSpacing:1.5}}>🔫 ACTIVE BUCKSHOT MATCH</div>
            <div style={{color:"#cbd5e1",fontSize:"clamp(10px,2.5vw,12px)",marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rejoinPrompt.name} · Pot: {money(rejoinPrompt.pot||0)}</div>
            <div style={{color:"#fbbf24",fontSize:"clamp(9px,2.2vw,11px)",marginTop:4}}>Your turn timer or grace period is still running — rejoin now or you'll forfeit the pot.</div>
          </div>
          <button onClick={async()=>{
            const lid=rejoinPrompt.lobbyId;
            try{await api("/buckshot/reconnect",{lobbyId:lid,username:account.username})}catch{}
            const r=await api("/lobby/get",{lobbyId:lid});
            if(r?.lobby){setCurLobby(r.lobby);setRejoinPrompt(null)}
            else{setToast({msg:"Match no longer exists",color:"#eb4b4b"});setRejoinPrompt(null)}
          }} style={{...S.btn,background:"#eb4b4b",color:"#fff",fontWeight:800,padding:"10px 24px",fontSize:"clamp(11px,2.8vw,14px)",letterSpacing:1}}>REJOIN MATCH</button>
        </div>
      </div>}
      {!account?<div style={{color:"#f59e0b",background:"#f59e0b11",padding:12,borderRadius:8,textAlign:"center"}}>Login required for PvP</div>:
      curLobby?<div>
        {/* IN-LOBBY VIEW */}
        <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:12,padding:"clamp(12px,3vw,20px)",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div><div style={{fontWeight:700,fontSize:"clamp(14px,3.5vw,18px)"}}>{curLobby.name}</div><div style={{color:"#888",fontSize:"clamp(8px,2vw,10px)"}}>Mode: {curLobby.mode==="profit_race"?"Profit Race":curLobby.mode==="buckshot"?"Buckshot 🔫":"Coin Flip Duel"} · Host: {curLobby.host}{curLobby.password_hash?<> · <MI n="lock" s={10}/></>:""}</div></div>
            <div style={{display:"flex",gap:4}}>
              {curLobby.status==="waiting"&&curLobby.host===account.username&&curLobby.mode!=="buckshot"&&<button onClick={async()=>{await api("/lobby/start",{lobbyId:curLobby.id,username:account.username});refreshLobby(curLobby.id)}} style={{...S.btn,background:"#4ade80",color:"#000",fontSize:"clamp(10px,2.5vw,13px)"}}>Start</button>}
              {curLobby._spectating?<button onClick={()=>{setCurLobby(null);clearInterval(lobbyPollRef.current)}} style={{...S.btn,background:"#ffffff08",color:"#888",fontSize:"clamp(9px,2.2vw,11px)"}}>Stop Watching</button>:
              curLobby.host===account.username?<button onClick={deleteLobby} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b",fontSize:"clamp(9px,2.2vw,11px)"}}>Delete</button>:
              <button onClick={leaveLobby} style={{...S.btn,background:"#f59e0b22",color:"#f59e0b",fontSize:"clamp(9px,2.2vw,11px)"}}>Leave</button>}
            </div>
          </div>
          {/* Timer */}
          {curLobby.status==="playing"&&curLobby.mode!=="buckshot"&&<div style={{background:"#141820",borderRadius:8,padding:"8px 14px",marginBottom:8,textAlign:"center"}}><div style={{color:"#f59e0b",fontWeight:800,fontSize:"clamp(20px,6vw,32px)"}}>{Math.floor(lobbyTimer/60000)}:{String(Math.floor((lobbyTimer%60000)/1000)).padStart(2,"0")}</div><div style={{color:"#888",fontSize:"clamp(8px,2vw,10px)"}}>Time remaining · $10,000 start · No loan</div></div>}
          {curLobby.status==="finished"&&<div style={{background:"#4ade8011",border:"1px solid #4ade8033",borderRadius:8,padding:10,marginBottom:8,textAlign:"center"}}><div style={{color:"#4ade80",fontWeight:800,fontSize:"clamp(14px,3.5vw,18px)"}}>Game Over!</div>{pvpWinModal&&<div style={{marginTop:6}}><div style={{color:"#4ade80",fontWeight:700}}>{pvpWinModal.winner===account?.username?<><MI n="celebration" s={16}/> YOU WON {curLobby.mode==="buckshot"?money(curLobby.pot||0):""}!</>:pvpWinModal.winner+" wins!"}</div>{(pvpWinModal.results||[]).map((p,i)=>{const isBuckshot=curLobby.mode==="buckshot";const isWinner=p.username===pvpWinModal.winner;const amt=isBuckshot?(isWinner?(curLobby.pot||0):-(curLobby.bet||0)):(p.profit||0);return <div key={p.username} style={{display:"flex",justifyContent:"center",gap:8,fontSize:11,padding:2,color:i===0?"#ffd700":p.eliminated?"#eb4b4b88":"#ccc"}}><span>#{i+1}</span><span>{p.username}</span><span style={{color:amt>=0?"#4ade80":"#eb4b4b"}}>{amt>=0?"+":""}{money(amt)}</span>{p.eliminated&&<span style={{color:"#eb4b4b",fontSize:8}}>OUT</span>}</div>})}</div>}</div>}
          {/* Players */}
          <div style={{fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600,color:"#888",marginBottom:4}}>Players ({curLobby._players?.length||0}/{curLobby.mode==="buckshot"?2:5})</div>
          <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:10}}>
            {(curLobby._players||[]).map((p,i)=><div key={p.username} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:i===0&&curLobby.status==="finished"?"#4ade8011":"#141820",borderRadius:6,borderLeft:"3px solid "+(p.username===curLobby.host?"#f59e0b":"#333")}}>
              <span style={{color:i===0&&curLobby.status==="finished"?"#ffd700":"#888",fontWeight:700,width:20}}>{curLobby.status==="finished"?"#"+(i+1):""}</span>
              <UserName name={p.username} style={{fontWeight:700,color:"#e2e8f0",flex:1,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}} onClick={()=>{api("/profile/full",{target:p.username,username:account?.username}).then(r=>{if(r?.profile)setViewProfile(r.profile)})}}><StatusDot status={userStatusMap[p.username]||"offline"} size={7}/>{p.username}</UserName>
              {curLobby.status!=="waiting"&&curLobby.mode!=="buckshot"&&<span style={{color:p.profit>=0?"#4ade80":"#eb4b4b",fontWeight:700,fontSize:"clamp(10px,2.5vw,13px)"}}>{p.profit>=0?"+":""}${(p.profit||0).toLocaleString()}</span>}
              {curLobby.status!=="waiting"&&curLobby.mode!=="buckshot"&&<span style={{color:"#888",fontSize:"clamp(8px,2vw,10px)"}}>{p.opens||0} opens</span>}
              {curLobby.status==="finished"&&curLobby.mode==="buckshot"&&buckshotState?.winner&&<span style={{color:p.username===buckshotState.winner?"#4ade80":"#eb4b4b",fontWeight:700,fontSize:"clamp(10px,2.5vw,13px)"}}>{p.username===buckshotState.winner?"+"+money(curLobby.pot||0):"-"+money(curLobby.bet||0)}</span>}
              {p.eliminated&&<span style={{color:"#eb4b4b",background:"#eb4b4b22",padding:"1px 4px",borderRadius:3,fontSize:8,fontWeight:700}}>OUT</span>}
              {curLobby.status==="waiting"&&curLobby.host===account.username&&p.username!==account.username&&!["admin","owner","mod"].includes(p.role)&&<button onClick={async()=>{await api("/lobby/kick",{username:account.username,target:p.username,lobbyId:curLobby.id});refreshLobby(curLobby.id)}} style={{background:"#eb4b4b22",color:"#eb4b4b",border:"none",padding:"2px 6px",borderRadius:3,cursor:"pointer",fontSize:9}}>Kick</button>}
            </div>)}
          </div>
          {/* BUCKSHOT ROULETTE GAME */}
          {curLobby.mode==="buckshot"&&<div style={{...S.buckshotPanel,marginBottom:10,minHeight:curLobby.status==="playing"?"calc(100vh - 200px)":"auto",maxWidth:curLobby.status==="playing"?"none":undefined}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{...S.buckshotTitle,display:"flex",alignItems:"center",gap:8}}><MI n="local_fire_department" s={22} c="#eb4b4b"/> BUCKSHOT ROULETTE</div>
              <div style={{fontFamily:"'Black Ops One',sans-serif",color:"#ffd700",fontSize:16,letterSpacing:2,textShadow:"0 0 6px #ffd70044"}}>POT: {money(curLobby.pot||0)}</div>
            </div>
            {curLobby.status==="waiting"&&<div>
              <div style={{color:"#888",fontSize:11,textAlign:"center",padding:8}}>
                {(curLobby._players?.length||0)<2?"Waiting for opponent ("+(curLobby._players?.length||0)+"/2)...":"Both players ready. Host can start."}
              </div>
              <div style={{color:"#94a3b8",fontSize:10,textAlign:"center",marginBottom:8}}>Each player has 3 charges. Shells are loaded with a mix of live and blank rounds. Shoot yourself or your opponent. Last one standing wins ${(curLobby.pot||0).toLocaleString()}.</div>
              {curLobby.host===account.username&&(curLobby._players?.length||0)===2&&<button onClick={async()=>{_SND.playMusic("Generalrelease");const r=await api("/buckshot/start",{lobbyId:curLobby.id,username:account.username});if(r?.ok){refreshLobby(curLobby.id)}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} style={{...S.btn,background:"#eb4b4b",color:"#fff",fontWeight:800,width:"100%",padding:10}}>START GAME 🔫</button>}
              {curLobby.host===account.username&&<button onClick={async()=>{const ok=await askConfirm({title:"Cancel lobby",message:"All bets will be refunded to players.",ok:"Cancel & Refund",color:"#eb4b4b",icon:"cancel"});if(!ok)return;const r=await api("/buckshot/cancel",{lobbyId:curLobby.id,username:account.username});if(r?.ok){if(r.refunded){setToast({msg:"Refunded "+money(curLobby.bet||0)+" (will sync)",color:"#4ade80"});await silentCloudSync()}setCurLobby(null);clearInterval(lobbyPollRef.current);refreshLobbies()}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b",fontWeight:700,width:"100%",marginTop:6,fontSize:11}}>Cancel & Refund</button>}
            </div>}
            {curLobby.status==="playing"&&buckshotState&&(()=>{
              const isYou=u=>u===account.username;
              const yourItems=(buckshotState.items&&buckshotState.items[account.username])||[];
              const oppName=buckshotState.p1===account.username?buckshotState.p2:buckshotState.p1;
              const oppItemCount=buckshotState.oppItemCount||0;
              const knownShells=buckshotState.knownShells||{};
              const nextShellIdx=buckshotState.shellIdx||0;
              const youKnowNext=knownShells[nextShellIdx];
              const itemIcons={cigarette:"🚬",beer:"🍺",magnifier:"🔍",handsaw:"🪚",handcuffs:"🔗"};
              const itemNames={cigarette:"Cigarette",beer:"Beer",magnifier:"Magnifier",handsaw:"Handsaw",handcuffs:"Handcuffs"};
              const itemDesc={cigarette:"+1 charge",beer:"Eject next shell",magnifier:"Peek at next shell",handsaw:"Next live = 2 damage",handcuffs:"Skip opponent's turn"};
              const renderCharges=(uname)=>{
                const c=buckshotState.charges?.[uname]||0;
                const max=buckshotState.maxCharges||2;
                const bars=[];
                for(let i=0;i<max;i++)bars.push(<div key={i} style={{flex:1,height:14,background:i<c?"#eb4b4b":"#1a0a0a",border:"1px solid "+(i<c?"#7a1818":"#3a1818"),borderRadius:2,boxShadow:i<c?"inset 0 -2px 4px rgba(0,0,0,0.4),0 0 4px #eb4b4b66":"inset 0 -1px 2px rgba(0,0,0,0.6)"}}/>);
                return <div data-charges={uname===account.username?"self":"opp"} style={{display:"flex",gap:2,marginTop:6}}>{bars}</div>;
              };
              const renderItemSlot=(item,idx,canUse)=>{
                const filled=!!item;
                const anim=itemAnimSlot===idx;
                return <button key={idx} disabled={!filled||!canUse} onClick={async()=>{if(!item)return;setItemAnimSlot(idx);setTimeout(()=>setItemAnimSlot(null),650);const r=await api("/buckshot/useitem",{lobbyId:curLobby.id,username:account.username,item});if(r?.ok){if(item==="magnifier"&&r.revealedShell){setToast({msg:"Peeked: "+r.revealedShell.toUpperCase()+" shell",color:r.revealedShell==="live"?"#eb4b4b":"#3b82f6"})}else setToast({msg:itemNames[item]+" used",color:"#4ade80"})}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} className={anim?"itemUseAnim":""} style={{aspectRatio:"1",background:filled?"linear-gradient(135deg,#2a0a0a,#1a0808)":"#0a0404",border:"2px solid "+(filled?"#5a1a1a":"#2a0808"),borderRadius:4,fontSize:filled?22:0,cursor:filled&&canUse?"pointer":"default",opacity:filled?1:0.5,padding:0,fontFamily:"inherit",color:"#fff",transition:"all .15s"}} title={filled?itemNames[item]+" - "+itemDesc[item]:"empty"}>{filled?itemIcons[item]:""}</button>;
              };
              const winnerUI=buckshotState.winner&&<div style={{textAlign:"center",padding:20,background:buckshotState.winner===account.username?"linear-gradient(135deg,#0a3010,#1a5020)":"linear-gradient(135deg,#3a0a0a,#5a1a1a)",border:"2px solid "+(buckshotState.winner===account.username?"#4ade80":"#eb4b4b"),borderRadius:6,marginTop:14}}>
                <div style={{fontFamily:"'Black Ops One',sans-serif",fontSize:24,letterSpacing:3,color:buckshotState.winner===account.username?"#4ade80":"#eb4b4b",textShadow:"0 0 12px currentColor"}}>{buckshotState.winner===account.username?"VICTORY":"DEFEAT"}</div>
                <div style={{fontFamily:"'Special Elite',serif",fontSize:13,color:"#cbd5e1",marginTop:6}}>{buckshotState.winner}  -  Pot: {money(curLobby.pot||0)}</div>
                <div style={{fontFamily:"'Special Elite',serif",fontSize:11,color:"#94a3b8",marginTop:4}}>Round wins: {buckshotState.p1} {buckshotState.roundWins?.[buckshotState.p1]||0}  -  {buckshotState.roundWins?.[buckshotState.p2]||0} {buckshotState.p2}</div>
              </div>;
              return <div style={{position:"relative"}}>
                {/* Narration banner */}
                {buckshotNarration&&<div style={{position:"absolute",top:-2,left:0,right:0,background:buckshotNarration.t==="live"?"linear-gradient(180deg,#7a0a0a,#3a0404)":buckshotNarration.t==="blank"?"linear-gradient(180deg,#1a3a6a,#0a1a3a)":buckshotNarration.t==="round"||buckshotNarration.t==="win"?"linear-gradient(180deg,#6a4a0a,#3a2a04)":buckshotNarration.t==="item"?"linear-gradient(180deg,#3a1a4a,#1a0a2a)":"linear-gradient(180deg,#1a1a1a,#0a0a0a)",border:"2px solid "+(buckshotNarration.t==="live"?"#eb4b4b":buckshotNarration.t==="blank"?"#3b82f6":buckshotNarration.t==="win"?"#ffd700":"#666"),padding:"14px 12px",textAlign:"center",zIndex:10,animation:"fadeUp .25s ease-out",boxShadow:"0 6px 16px rgba(0,0,0,0.6)",borderRadius:4}}>
                  <div style={{fontFamily:"'Black Ops One',sans-serif",fontSize:22,letterSpacing:3,color:buckshotNarration.t==="live"?"#fff":buckshotNarration.t==="blank"?"#fff":"#fff",textShadow:"0 0 10px currentColor"}}>{buckshotNarration.text}</div>
                </div>}
                {/* Round + roundwins header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,fontFamily:"'Black Ops One',sans-serif",letterSpacing:2}}>
                  <div style={{color:"#eb4b4b",fontSize:15}}>ROUND {buckshotState.round||1}/3</div>
                  <div style={{color:"#ffd700",fontSize:13}}>{buckshotState.p1}: {buckshotState.roundWins?.[buckshotState.p1]||0}  |  {buckshotState.p2}: {buckshotState.roundWins?.[buckshotState.p2]||0}</div>
                </div>
                {/* Player panels: opponent on top, you on bottom */}
                {[oppName,account.username].filter(Boolean).map(pn=>{
                  const isMe=pn===account.username;
                  const isTurn=buckshotState.turn===pn;
                  const charges=buckshotState.charges?.[pn]||0;
                  const max=buckshotState.maxCharges||2;
                  return <div key={pn} style={{background:isTurn?"linear-gradient(90deg,#2a0a0a,#1a0404)":"#0d0606",border:"2px solid "+(isTurn?"#eb4b4b":"#3a1818"),borderRadius:4,padding:10,marginBottom:8,boxShadow:isTurn?"0 0 12px rgba(235,75,75,0.3)":"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontFamily:"'Black Ops One',sans-serif",letterSpacing:2,color:isMe?"#4ade80":"#cbd5e1",fontSize:14}}>{(pn||"???").toUpperCase()}{isMe&&"  (YOU)"}</div>
                      <div style={{fontFamily:"'Special Elite',serif",color:"#888",fontSize:11}}>{charges}/{max} CHARGES</div>
                    </div>
                    {renderCharges(pn)}
                    {buckshotState.cuffs?.[pn]&&<div style={{marginTop:6,fontFamily:"'Special Elite',serif",color:"#a855f7",fontSize:11}}>🔗 HANDCUFFED</div>}
                    {isTurn&&!buckshotState.winner&&<div style={{marginTop:4,fontFamily:"'Black Ops One',sans-serif",color:"#eb4b4b",fontSize:11,letterSpacing:2}}>► ACTIVE</div>}
                    {/* Items grid - 8 slots */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:3,marginTop:8}}>
                      {isMe?
                        Array.from({length:8}).map((_,i)=>renderItemSlot(yourItems[i],i,buckshotState.turn===account.username&&!buckshotState.winner))
                        :Array.from({length:8}).map((_,i)=><div key={i} style={{aspectRatio:"1",background:i<oppItemCount?"#1a0808":"#0a0404",border:"2px solid "+(i<oppItemCount?"#3a1818":"#2a0808"),borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:i<oppItemCount?0.7:0.3}}>{i<oppItemCount?"?":""}</div>)
                      }
                    </div>
                  </div>;
                })}
                {/* Shells visualization with peek-info */}
                <div style={{background:"#0a0404",border:"2px solid #3a1818",borderRadius:4,padding:10,marginBottom:8,textAlign:"center"}}>
                  <div style={{fontFamily:"'Special Elite',serif",color:"#888",fontSize:11,marginBottom:6}}>SHELLS LOADED  -  {buckshotState.shellsRemaining||0} REMAINING</div>
                  <div style={{display:"flex",justifyContent:"center",gap:12,fontFamily:"'Black Ops One',sans-serif"}}>
                    <span style={{color:"#eb4b4b",fontSize:14,letterSpacing:2}}>🔴 {buckshotState.liveRemaining||0} LIVE</span>
                    <span style={{color:"#3b82f6",fontSize:14,letterSpacing:2}}>🔵 {buckshotState.blankRemaining||0} BLANK</span>
                  </div>
                  {buckshotState.sawNext&&<div style={{marginTop:6,fontFamily:"'Black Ops One',sans-serif",color:"#fb923c",fontSize:11,letterSpacing:2}}>🪚 HANDSAW ACTIVE  -  NEXT LIVE = -2</div>}
                  {youKnowNext&&<div style={{marginTop:6,fontFamily:"'Black Ops One',sans-serif",color:youKnowNext==="live"?"#eb4b4b":"#3b82f6",fontSize:11,letterSpacing:2}}>👁 YOU SAW: NEXT SHELL = {youKnowNext.toUpperCase()}</div>}
                </div>
                {/* Opponent disconnected: countdown to auto-win. Only triggers on explicit disconnect (tab close / leave), NOT poll silence. */}
                {!buckshotState.winner&&!buckshotState.isSpectator&&buckshotState.oppDisconnectedAt>0&&buckshotState.serverNow&&(()=>{
                  const elapsed=buckshotState.serverNow-buckshotState.oppDisconnectedAt;
                  const remaining=Math.max(0,Math.ceil((15000-elapsed)/1000));
                  return <div style={{textAlign:"center",marginBottom:6,padding:"6px 10px",background:"linear-gradient(90deg,#7a0a0a,#3a0a0a,#7a0a0a)",border:"1px solid #eb4b4b",borderRadius:4,fontFamily:"'Special Elite',serif",fontSize:12,color:"#eb4b4b",fontWeight:700,letterSpacing:1}}>⚠ OPPONENT LEFT - AUTO-WIN IN {remaining}s</div>;
                })()}
                {/* Turn timer */}
                {!buckshotState.winner&&!buckshotState.isSpectator&&buckshotState.turnStartedAt&&(()=>{
                  const elapsed=Date.now()-buckshotState.turnStartedAt;
                  const remaining=Math.max(0,Math.ceil((60000-elapsed)/1000));
                  const warn=remaining<=10;
                  const isYou=buckshotState.turn===account.username;
                  return <div style={{textAlign:"center",marginBottom:8,fontFamily:"'Black Ops One',sans-serif",letterSpacing:2,fontSize:13,color:warn?"#eb4b4b":"#888"}} className={warn?"timerWarn":""}>⏱ {isYou?"YOUR":"OPPONENT"} TURN TIMER: {remaining}s{remaining===0?"  -  FORFEIT IMMINENT":""}</div>;
                })()}
                {/* Forfeit button: explicit honest exit */}
                {!buckshotState.winner&&!buckshotState.isSpectator&&<div style={{textAlign:"center",marginBottom:6}}>
                  <button onClick={async()=>{const ok=await askConfirm({title:"Forfeit & leave",message:"You will lose your bet and your opponent gets the pot. Continue?",ok:"Forfeit",color:"#eb4b4b",icon:"flag"});if(!ok)return;const r=await api("/lobby/force-leave",{username:account.username});if(r?.ok){setToast({msg:"Forfeited",color:"#eb4b4b"});try{await silentCloudSync()}catch{}}}} style={{...S.btn,background:"#3a0a0a",color:"#eb4b4b",border:"1px solid #6b1818",fontSize:10,padding:"3px 10px"}}>FORFEIT & LEAVE</button>
                </div>}
                {/* The Gun — visible centerpiece for shoot/blank animations */}
                {!buckshotState.winner&&<div style={{display:"flex",justifyContent:"center",marginBottom:10,padding:"10px 0"}}>
                  <div data-gun style={{fontSize:"clamp(56px,14vw,96px)",lineHeight:1,filter:buckshotState.turn===account.username?"drop-shadow(0 0 12px #eb4b4b66)":"grayscale(0.6) brightness(0.7)",transition:"filter .3s",transformOrigin:"center bottom",position:"relative"}}>🔫</div>
                </div>}
                {/* Action buttons */}
                {!buckshotState.winner&&buckshotState.turn===account.username&&!buckshotState.isSpectator&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <button onClick={()=>setBuckshotConfirm({target:"self",title:"SHOOT YOURSELF",desc:"You will fire the chambered shell at yourself. If it's a LIVE shell, you take damage."})} style={{...S.btnBuckshot,background:"#3a0a0a",color:"#eb4b4b",border:"2px solid #6b1818",padding:16}}>🔫 SHOOT SELF</button>
                  <button onClick={()=>setBuckshotConfirm({target:"opponent",title:"SHOOT OPPONENT",desc:"You will fire the chambered shell at "+oppName+"."})} style={{...S.btnBuckshot,background:"#7a0a0a",color:"#fff",border:"2px solid #aa2828",padding:16}}>🔫 SHOOT OPPONENT</button>
                </div>}
                {!buckshotState.winner&&buckshotState.turn&&buckshotState.turn!==account.username&&!buckshotState.isSpectator&&<div style={{background:"#0a0404",border:"2px solid #3a1818",borderRadius:4,padding:14,textAlign:"center",fontFamily:"'Special Elite',serif",color:"#888",fontSize:13,marginBottom:8}}>WAITING FOR {buckshotState.turn.toUpperCase()}...</div>}
                {buckshotState.isSpectator&&!buckshotState.winner&&<div style={{background:"#0a0a3a",borderRadius:4,padding:8,textAlign:"center",fontFamily:"'Special Elite',serif",color:"#3b82f6",fontSize:11,marginBottom:8}}>👁 SPECTATING  -  {buckshotState.turn?.toUpperCase()}'S TURN</div>}
                {/* Item legend (collapsible — cleaner UI) */}
                {(buckshotState.round||1)>=2&&<details style={{background:"#0a0404",border:"1px solid #3a1818",borderRadius:4,padding:"4px 8px",marginTop:8,fontFamily:"'Special Elite',serif",fontSize:10,color:"#94a3b8"}}>
                  <summary style={{color:"#666",fontSize:9,letterSpacing:1,cursor:"pointer",userSelect:"none"}}>ITEMS HELP</summary>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:4,marginTop:4}}>
                    <div>🚬 Cigarette = +1 charge</div>
                    <div>🍺 Beer = Eject next shell</div>
                    <div>🔍 Magnifier = Peek shell</div>
                    <div>🪚 Handsaw = Next live -2 dmg</div>
                    <div>🔗 Handcuffs = Skip opp turn</div>
                  </div>
                </details>}
                {winnerUI}
              </div>;
            })()}
          </div>}
          {/* Lobby opening (during game) */}
          {curLobby.status==="playing"&&!curLobby._spectating&&curLobby.mode!=="buckshot"&&<div style={{marginBottom:10}}>
            {pvpEliminated&&<div style={{background:"#eb4b4b11",border:"1px solid #eb4b4b33",borderRadius:8,padding:8,textAlign:"center",marginBottom:6}}><div style={{color:"#eb4b4b",fontWeight:700}}>Eliminated! Spectating...</div></div>}
            <div style={{fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600,color:"#888",marginBottom:4,opacity:pvpEliminated?0.3:1}}>Open Cases {curLobby._myBal!==undefined&&<span style={{color:"#4ade80"}}> — ${curLobby._myBal?.toLocaleString()||"10,000"} left</span>}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CASES.filter(c=>c.price<=10000).map(c=><button key={c.id} disabled={curLobby._myBal!==undefined&&curLobby._myBal<c.price} onClick={async()=>{const r=await api("/lobby/roll",{username:account.username,lobbyId:curLobby.id,caseId:c.id});if(r?.timeUp||r?.error==="Time up"){refreshLobby(curLobby.id);return}if(r?.cantAfford||r?.eliminated){setPvpEliminated(true);setCurLobby(prev=>({...prev,_myBal:0}));setToast({msg:r?.error||"Bankrupt!",color:"#eb4b4b"});if(r?.matchEnded)setPvpWinModal({winner:r?.winner,results:r?.matchResults||r?.results});return}if(r?.throttle){setToast({msg:"Slow down! 2/sec max",color:"#f59e0b"});return}if(r?.ok&&r.result){setWonItem({name:r.result.name,rarity:r.result.rarity,value:r.result.value,icon:c.items.find(i=>i.name===r.result.name)?.icon||"?"});sndReveal(r.result.value>=c.price);if(r.result.balance!==undefined)setCurLobby(prev=>({...prev,_myBal:r.result.balance}));if(r.result.eliminated){setPvpEliminated(true);setToast({msg:"Eliminated!",color:"#eb4b4b"})}if(r.result.matchEnded)setPvpWinModal({winner:r.result.winner,results:r.result.matchResults});refreshLobby(curLobby.id)}else if(r?.error){setToast({msg:r.error,color:"#eb4b4b"})}}} style={{...S.btn,background:c.color+"22",color:c.color,border:"1px solid "+c.color+"44",padding:"4px 8px",fontSize:"clamp(8px,2vw,10px)",opacity:(curLobby._myBal!==undefined&&curLobby._myBal<c.price)?0.3:1}}>{c.icon} ${c.price}</button>)}</div>
            {wonItem?.name&&<div className="bounceIn" style={{background:"#141820",borderRadius:8,padding:8,marginTop:6,textAlign:"center"}}><span style={{fontSize:20}}>{wonItem.icon}</span> <span style={{color:R[wonItem.rarity]?.color,fontWeight:700}}>{wonItem.name}</span> <span style={{color:"#4ade80"}}>${wonItem.value?.toLocaleString()}</span></div>}
          </div>}
          {/* Lobby Chat */}
          <div style={{fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600,color:"#888",marginBottom:4}}>Lobby Chat</div>
          <div style={{background:"#080a0e",borderRadius:6,padding:6,height:120,overflowY:"auto",display:"flex",flexDirection:"column-reverse",gap:2,marginBottom:6}}>
            {lobbyChat.length===0?<div style={{color:"#555",textAlign:"center",fontSize:10}}>No messages</div>:
            lobbyChat.map((m,i)=><div key={i} style={{fontSize:"clamp(8px,2vw,10px)"}}><span style={{color:"#888"}}>{m.ago} </span><span style={{color:"#8b5cf6",fontWeight:700}}>{m.uname}</span> <span style={{color:"#ccc"}}>{m.msg}</span></div>)}
          </div>
          <div style={{display:"flex",gap:4}}><input value={lobbyChatMsg} onChange={e=>setLobbyChatMsg(e.target.value.slice(0,200))} onKeyDown={e=>{if(e.key==="Enter"&&lobbyChatMsg.trim()){api("/lobby/chat",{username:account.username,lobbyId:curLobby.id,msg:lobbyChatMsg.trim()});setLobbyChatMsg("")}}} placeholder="Type..." style={{...S.input,flex:1,width:"auto",padding:"4px 8px",fontSize:10}} maxLength={200}/><button onClick={()=>{if(!lobbyChatMsg.trim())return;api("/lobby/chat",{username:account.username,lobbyId:curLobby.id,msg:lobbyChatMsg.trim()});setLobbyChatMsg("")}} style={{...S.btn,background:"#8b5cf6",color:"#fff",padding:"4px 10px",fontSize:10}}>Send</button></div>
        </div>
      </div>:
      <>
        {/* CREATE LOBBY */}
        <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:12,padding:"clamp(12px,3vw,18px)",marginBottom:12}}>
          <div style={{fontWeight:700,marginBottom:8,fontSize:"clamp(11px,2.8vw,14px)"}}>Create Lobby</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
            <input value={createLobbyName} onChange={e=>setCreateLobbyName(e.target.value.slice(0,30))} placeholder="Lobby name" style={{...S.input,flex:2,minWidth:100}} maxLength={30}/>
            <input value={createLobbyPw} onChange={e=>setCreateLobbyPw(e.target.value.slice(0,20))} placeholder="Password (optional)" style={{...S.input,flex:1,minWidth:80}} maxLength={20} type="password"/>
          </div>
          <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
            {[["profit_race","Profit Race"],["coinflip_duel","Coin Flip Duel"],["buckshot","Buckshot 🔫"]].map(([v,l])=><button key={v} onClick={()=>setCreateLobbyMode(v)} style={{...S.btn,background:createLobbyMode===v?"#3b82f6":"#ffffff08",color:createLobbyMode===v?"#fff":"#888",flex:1,fontSize:"clamp(9px,2.2vw,11px)"}}>{l}</button>)}
          </div>
          {createLobbyMode==="buckshot"&&<div style={{background:"#0a0c10",border:"1px solid #f59e0b22",borderRadius:6,padding:8,marginBottom:8}}>
            <div style={{color:"#f59e0b",fontSize:10,fontWeight:700,marginBottom:6}}>Buckshot Roulette · 2 players, winner takes all</div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{color:"#888",fontSize:10}}>Bet:</span>
              <input value={createLobbyBet} onChange={e=>setCreateLobbyBet(e.target.value.replace(/[^0-9]/g,""))} placeholder="1000" style={{...S.input,flex:1,fontSize:11}}/>
              <div style={{color:"#888",fontSize:9}}>Each player puts in. Total pool: ${(parseInt(createLobbyBet)*2||0).toLocaleString()}</div>
            </div>
            <div style={{color:"#888",fontSize:9,marginTop:4}}>Money locked on join. Refunded only if lobby canceled before start. Once started: winner gets the pool, loser gets nothing.</div>
          </div>}
          <button onClick={async()=>{
            const name=createLobbyName.trim()||account.username+"'s lobby";
            const bet=parseInt(createLobbyBet)||0;
            if(createLobbyMode==="buckshot"&&(bet<100||bet>st.bal)){setToast({msg:bet>st.bal?"Insufficient balance for bet":"Min bet $100",color:"#eb4b4b"});return}
            const tryCreate=async()=>api("/lobby/create",{username:account.username,name,lobbyPassword:createLobbyPw,mode:createLobbyMode,bet,slot});
            let r=await tryCreate();
            // If stuck in a ghost lobby, force-leave and retry once
            if(!r?.lobbyId&&r?.error&&(r.error.indexOf("already")>=0||r.error.indexOf("Leave your current")>=0)){
              const fl=await api("/lobby/force-leave",{username:account.username});
              if(fl?.ok){
                if(fl.refundedTotal>0){setToast({msg:"Cleared "+fl.kickedFrom+" stale lobby, refunded "+money(fl.refundedTotal),color:"#fbbf24"});try{await silentCloudSync()}catch{}}
                r=await tryCreate();
              }
            }
            if(r?.lobbyId){if(r.betLocked>0){setToast({msg:"Locked "+money(r.betLocked)+" in pot",color:"#f59e0b"});try{await silentCloudSync()}catch{}}setCreateLobbyName("");setCreateLobbyPw("");await refreshLobby(r.lobbyId)}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}
          }} style={{...S.btn,background:"#4ade80",color:"#000",fontWeight:700,width:"100%"}}>Create Lobby</button>
        </div>
        {/* LOBBY LIST */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:600,color:"#888",fontSize:"clamp(10px,2.5vw,12px)"}}>Open Lobbies ({lobbies.length})</div>
          <button onClick={refreshLobbies} style={{...S.btn,background:"#ffffff08",color:"#888",padding:"3px 8px",fontSize:"clamp(8px,2vw,10px)"}}>Refresh</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {lobbies.length===0?<div style={{color:"#555",textAlign:"center",padding:16}}>No lobbies. Create one!</div>:
          lobbies.map(l=><div key={l.id} className="slideIn lobbyCard" style={{background:"#0d1117",border:"1px solid #151820",borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:"clamp(11px,2.8vw,14px)"}}>{l.name} {l.password_hash&&<MI n="lock" s={10} c="#888"/>}</div>
              <div style={{color:"#888",fontSize:"clamp(8px,2vw,10px)"}}>{l.mode==="profit_race"?"Profit Race":"Coin Flip"} · {l.player_count||0}/5 · {l.status} · Host: {l.host}</div>
            </div>
            {l.status==="waiting"&&<button onClick={async()=>{let pw="";if(l.password_hash){pw=await askPrompt({title:"Password required",message:"This lobby is password-protected.",placeholder:"Password",password:true,ok:"Join"});if(pw===null)return}const ok=await joinLobby(l.id,pw);if(ok)await refreshLobby(l.id)}} style={{...S.btn,background:"#3b82f6",color:"#fff",padding:"6px 14px"}}>Join</button>}
            {l.status==="playing"&&<button onClick={async()=>{const r=await api("/lobby/spectate",{lobbyId:l.id});if(r?.ok)setCurLobby({...r.lobby,_players:r.players,_spectating:true})}} style={{...S.btn,background:"#f59e0b22",color:"#f59e0b",padding:"6px 14px"}}>Watch</button>}
          </div>)}
        </div>
        <div style={{color:"#666",fontSize:"clamp(8px,2vw,10px)",marginTop:10}}>Lobbies auto-delete after 5 min idle. 2 min matches. idle. Host can choose Profit Race ($10k, 5min) or Coin Flip Duel.</div>
      </>}
    </div>}

    {/* DMs - Discord-style */}
    {/* ═══════════ DIRECT MESSAGES ═══════════ */}
    {page==="dm"&&<div className="pageBody" style={S.body}>
      <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:12}}><MI n="mail" s={20}/> Messages</div>
      {!account?<div style={{color:"#f59e0b",padding:12,textAlign:"center"}}>Login required</div>:<div style={{display:"flex",gap:10,height:"clamp(300px,60vh,500px)"}}>
        {/* Left sidebar - conversations */}
        <div style={{width:"clamp(100px,30vw,180px)",background:"#0d1117",border:"1px solid #151820",borderRadius:8,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
          <div style={{padding:"8px 10px",borderBottom:"1px solid #151820"}}>
            <input value={dmSearch} onChange={e=>{const v=e.target.value.slice(0,20);setDmSearch(v);const q=v.trim();if(q.length>=2){clearTimeout(window._dmST);window._dmST=setTimeout(()=>{api("/users/search",{q}).then(r=>{if(r?.users)setDmResults(r.users)})},200)}else{setDmResults([])}}} placeholder="🔍 Find user (type 2+ chars)..." style={{...S.sel,padding:"4px 8px",fontSize:10,width:"100%"}}/>
            {dmResults.length>0&&<div style={{display:"flex",flexDirection:"column",gap:1,marginTop:4}}>{dmResults.map(u=><button key={u.username} onClick={()=>{setDmTo(u.username);setDmResults([]);setDmSearch("")}} style={{background:"#141820",border:"none",color:"#4ade80",padding:"4px 6px",borderRadius:3,cursor:"pointer",fontSize:9,textAlign:"left",fontFamily:"inherit"}}>{u.username} <span style={{color:"#666"}}>Lv{u.level}</span></button>)}</div>}
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {/* Conversation list from received messages */}
            {(()=>{const convos={};(dmInbox?.received||[]).forEach(m=>{if(!convos[m.from_user])convos[m.from_user]={user:m.from_user,lastMsg:m.msg,ago:m.ago,unread:!m.read,pfp:m.pfp||""}});(dmInbox?.sent||[]).forEach(m=>{if(!convos[m.to_user])convos[m.to_user]={user:m.to_user,lastMsg:m.msg,ago:m.ago,pfp:m.to_pfp||""}});(dmInbox?.sent||[]).forEach(m=>{if(!convos[m.to_user])convos[m.to_user]={user:m.to_user,lastMsg:"You: "+m.msg,ago:m.ago}});return Object.values(convos).map(c=><button key={c.user} onClick={()=>setDmTo(c.user)} style={{display:"flex",gap:6,alignItems:"center",padding:"8px 10px",background:dmTo===c.user?"#1e2430":"transparent",border:"none",borderBottom:"1px solid #0a0c10",cursor:"pointer",width:"100%",fontFamily:"inherit"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#1e2430",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,cursor:"pointer"}} onClick={e=>{e.stopPropagation();showProfile(c.user)}}>{c.pfp?<img src={c.pfp} style={{width:28,height:28,borderRadius:"50%",objectFit:"cover"}}/>:<MI n="person" s={12} c="#555"/>}</div>
              <div style={{flex:1,overflow:"hidden",textAlign:"left"}}><div style={{fontWeight:c.unread?700:600,fontSize:"clamp(9px,2.2vw,11px)",color:c.unread?"#e2e8f0":"#888",display:"flex",alignItems:"center",gap:4}}><StatusDot status={userStatusMap[c.user]||"offline"} size={7}/>{c.user}</div><div style={{fontSize:8,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.lastMsg?.slice(0,25)}</div></div>
              {c.unread&&<div style={{width:6,height:6,borderRadius:"50%",background:"#3b82f6",flexShrink:0}}/>}
            </button>)})()}
          </div>
        </div>
        {/* Right - message area */}
        <div style={{flex:1,display:"flex",flexDirection:"column",background:"#0d1117",border:"1px solid #151820",borderRadius:8,overflow:"hidden"}}>
          {!dmTo?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#555"}}>Select a conversation</div>:<>
            {/* Header */}
            <div style={{padding:"8px 12px",borderBottom:"1px solid #151820",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#1e2430",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer"}} onClick={()=>{api("/profile/full",{target:dmTo,username:account?.username}).then(r=>{if(r?.profile)setViewProfile(r.profile)})}}><MI n="person" s={12} c="#555"/></div>
              <span style={{fontWeight:700,color:"#e2e8f0",flex:1}}>{dmTo}</span>
              <button onClick={()=>{api("/profile/full",{target:dmTo,username:account?.username}).then(r=>{if(r?.profile)setViewProfile(r.profile)})}} style={{...S.btn,background:"#ffffff08",color:"#888",padding:"2px 8px",fontSize:9}}>Profile</button>
            </div>
            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column-reverse",gap:4}}>
              {(()=>{const all=[...(dmInbox?.received||[]).filter(m=>m.from_user===dmTo).map(m=>({...m,dir:"in",t:m.created_at})),...(dmInbox?.sent||[]).filter(m=>m.to_user===dmTo).map(m=>({...m,dir:"out",t:m.created_at}))].sort((a,b)=>b.t-a.t);return all.length===0?<div style={{color:"#555",textAlign:"center"}}>No messages yet</div>:all.map((m,i)=><div key={m.id||i} className="slideIn" style={{display:"flex",justifyContent:m.dir==="out"?"flex-end":"flex-start"}}><div style={{maxWidth:"75%",background:m.dir==="out"?"#3b82f622":"#141820",border:"1px solid "+(m.dir==="out"?"#3b82f633":"#1e2430"),borderRadius:10,borderBottomRightRadius:m.dir==="out"?2:10,borderBottomLeftRadius:m.dir==="in"?2:10,padding:"6px 10px"}}><div style={{fontSize:"clamp(9px,2.3vw,12px)",color:"#ccc"}} dangerouslySetInnerHTML={{__html:renderMd(m.msg)}}/>{m.gift_amount>0&&<div style={{marginTop:3}}>{m.gift_status==="pending"?<button onClick={async()=>{const r=await api("/gift/claim",{username:account.username,token:account.token,dmId:m.id});if(r?.ok){if(r.amount){const ns={...st,bal:(st.bal||0)+r.amount};setSt(ns)}setToast({msg:"Claimed $"+(r.amount||0).toLocaleString()+"!",color:"#4ade80"});api("/dm/inbox",{username:account.username,token:account.token,after:lastDmIdRef.current}).then(r2=>{if(r2?.ok){const mx=Math.max(lastDmIdRef.current,...(r2.received||[]).map(m=>m.id||0),...(r2.sent||[]).map(m=>m.id||0));lastDmIdRef.current=mx;if(r2.incremental){setDmInbox(prev=>{if(!prev)return r2;const ex=new Set([...(prev.received||[]).map(m=>m.id),...(prev.sent||[]).map(m=>m.id)]);return{...prev,unread:r2.unread,received:[...(r2.received||[]).filter(m=>!ex.has(m.id)),...(prev.received||[])].slice(0,200),sent:[...(r2.sent||[]).filter(m=>!ex.has(m.id)),...(prev.sent||[])].slice(0,200)}})}else setDmInbox(r2)}})}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} style={{background:"#4ade8022",border:"1px solid #4ade8033",borderRadius:6,padding:"4px 10px",color:"#4ade80",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>Claim {money(m.gift_amount||0)}</button>:<span style={{color:"#888",fontSize:9}}>Claimed{m.gift_claimed_by?" by "+m.gift_claimed_by:""}</span>}</div>}<div style={{fontSize:8,color:"#555",textAlign:m.dir==="out"?"right":"left",marginTop:2}}>{m.ago}</div></div></div>)})()}
            </div>
            {/* Input */}
            <div style={{padding:"8px 10px",borderTop:"1px solid #151820",display:"flex",gap:4}}>
              <input value={dmMsg} onChange={e=>setDmMsg(e.target.value.slice(0,500))} placeholder="Message..." style={{...S.input,flex:1,width:"auto",padding:"6px 10px",fontSize:"clamp(10px,2.5vw,12px)"}} maxLength={500} onKeyDown={e=>{if(e.key==="Enter"&&dmMsg.trim()){api("/dm/send",{username:account.username,token:account.token,to:dmTo,msg:dmMsg.trim()}).then(r=>{if(r?.ok){setDmMsg("");api("/dm/inbox",{username:account.username,token:account.token,after:lastDmIdRef.current}).then(r2=>{if(r2?.ok){const mx=Math.max(lastDmIdRef.current,...(r2.received||[]).map(m=>m.id||0),...(r2.sent||[]).map(m=>m.id||0));lastDmIdRef.current=mx;if(r2.incremental){setDmInbox(prev=>{if(!prev)return r2;const ex=new Set([...(prev.received||[]).map(m=>m.id),...(prev.sent||[]).map(m=>m.id)]);return{...prev,unread:r2.unread,received:[...(r2.received||[]).filter(m=>!ex.has(m.id)),...(prev.received||[])].slice(0,200),sent:[...(r2.sent||[]).filter(m=>!ex.has(m.id)),...(prev.sent||[])].slice(0,200)}})}else setDmInbox(r2)}})}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}})}}}/>
              <button onClick={()=>{setGiftModal({to:dmTo,context:"dm"});setGiftAmt("")}} style={{...S.btn,background:"#ffd70022",color:"#ffd700",padding:"6px 10px"}}><MI n="redeem" s={16}/></button>
              <button onClick={()=>{if(!dmMsg.trim())return;api("/dm/send",{username:account.username,token:account.token,to:dmTo,msg:dmMsg.trim()}).then(r=>{if(r?.ok){setDmMsg("");api("/dm/inbox",{username:account.username,token:account.token,after:lastDmIdRef.current}).then(r2=>{if(r2?.ok){const mx=Math.max(lastDmIdRef.current,...(r2.received||[]).map(m=>m.id||0),...(r2.sent||[]).map(m=>m.id||0));lastDmIdRef.current=mx;if(r2.incremental){setDmInbox(prev=>{if(!prev)return r2;const ex=new Set([...(prev.received||[]).map(m=>m.id),...(prev.sent||[]).map(m=>m.id)]);return{...prev,unread:r2.unread,received:[...(r2.received||[]).filter(m=>!ex.has(m.id)),...(prev.received||[])].slice(0,200),sent:[...(r2.sent||[]).filter(m=>!ex.has(m.id)),...(prev.sent||[])].slice(0,200)}})}else setDmInbox(r2)}})}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}})}} style={{...S.btn,background:"#3b82f6",color:"#fff",padding:"6px 12px"}}>Send</button>
            </div>
          </>}
        </div>
      </div>}
    </div>}

    {/* PROFILE */}
    {/* ═══════════ ME / profile / settings ═══════════ */}
    {page==="me"&&<div className="pageBody" style={S.body}>
      <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:12}}><MI n="person" s={20}/> My Profile</div>
      {!account?<div style={{color:"#f59e0b",padding:12,textAlign:"center"}}>Login required</div>:<>
        <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:12,padding:"clamp(14px,4vw,24px)",marginBottom:12}}>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"#1e2430",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,overflow:"hidden",flexShrink:0}}><MI n="person" s={12} c="#555"/></div>
            <div><div style={{fontWeight:700,fontSize:"clamp(14px,3.5vw,18px)",color:"#e2e8f0"}}>{account.username}</div><div style={{color:"#888",fontSize:"clamp(9px,2.2vw,11px)"}}>Level {account.level||1} &middot; {account.role||"user"}{account.user_number?" · #"+account.user_number:""}</div></div><button onClick={()=>{setPage("dm");if(account){api("/dm/inbox",{username:account.username,token:account.token}).then(r=>{if(r?.ok){setDmInbox(r);setDmUnread(0);const mx=Math.max(0,...(r.received||[]).map(m=>m.id||0),...(r.sent||[]).map(m=>m.id||0));if(mx>lastDmIdRef.current)lastDmIdRef.current=mx;api("/dm/read",{username:account.username,token:account.token})}})}}} style={{...S.btn,background:"#3b82f622",color:"#3b82f6",padding:"6px 10px",marginLeft:"auto",display:"flex",alignItems:"center",gap:4}}><MI n="chat" s={14}/>Messages{dmUnread>0?" ("+dmUnread+")":""}</button>
          </div>
          <div style={{fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600,color:"#888",marginBottom:4}}>Profile Picture</div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10}}><div style={{width:40,height:40,borderRadius:"50%",background:"#1e2430",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{account.pfp?<img src={account.pfp} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover"}}/>:<MI n="person" s={12} c="#666"/>}</div><label style={{...S.btn,background:"#3b82f622",color:"#3b82f6",cursor:"pointer"}}>Upload<input type="file" accept="image/*" style={{display:"none"}} onChange={async(e)=>{const file=e.target.files[0];if(!file)return;if(file.size>2500000){setToast({msg:"Max 2.5MB",color:"#eb4b4b"});return}const reader=new FileReader();reader.onload=async(ev)=>{const b64=ev.target.result;const r=await api("/profile/edit",{username:account.username,token:account.token,pfp:b64});if(r?.ok){setToast({msg:"PFP updated!",color:"#4ade80"});const a={...account,pfp:b64};setAccount(a);saveAccount(a)}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})};reader.readAsDataURL(file)}}/></label>{account.pfp&&<button onClick={async()=>{const r=await api("/profile/edit",{username:account.username,token:account.token,pfp:""});if(r?.ok){setToast({msg:"PFP removed",color:"#4ade80"});const a={...account,pfp:""};setAccount(a);saveAccount(a)}}} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b"}}>Remove</button>}</div><div style={{fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600,color:"#888",marginBottom:4}}>Display Name</div>
          <div style={{display:"flex",gap:4,marginBottom:10}}><input defaultValue={account.display_name||account.username} id="editDname" placeholder="Your display name..." style={{...S.input,flex:1,width:"auto"}} maxLength={24}/><button onClick={async()=>{const v=document.getElementById("editDname")?.value||"";const r=await api("/profile/edit",{username:account.username,token:account.token,display_name:v});if(r?.ok){setSaveStatus("Name saved!");const a={...account,display_name:v};setAccount(a);saveAccount(a)}}} style={{...S.btn,background:"#4ade80",color:"#000"}}>Save</button></div>
          <div style={{fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600,color:"#888",marginBottom:4}}>Bio</div>
          <div style={{display:"flex",gap:4,marginBottom:10}}><input value={editBio} onChange={e=>setEditBio(e.target.value.slice(0,200))} placeholder="Write something..." style={{...S.input,flex:1,width:"auto"}} maxLength={200}/><button onClick={async()=>{const r=await api("/profile/edit",{username:account.username,token:account.token,bio:editBio});if(r?.ok)setSaveStatus("Bio saved!")}} style={{...S.btn,background:"#4ade80",color:"#000"}}>Save</button></div>
          <div style={{fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600,color:"#888",marginBottom:4}}>Privacy</div>
          <div style={{display:"flex",gap:4,marginBottom:10}}>{["public","private","friends"].map(p=><button key={p} onClick={async()=>{setEditPrivacy(p);await api("/profile/edit",{username:account.username,token:account.token,privacy:p});setSaveStatus("Privacy: "+p)}} style={{...S.btn,background:editPrivacy===p?"#3b82f6":"#ffffff08",color:editPrivacy===p?"#fff":"#888",flex:1,textTransform:"capitalize"}}>{p==="friends"?"Friends Only":p}</button>)}</div>
        </div>
      </>}
    </div>}

    
    {/* MULTI OPEN RESULTS */}
    {/* ═══════════ MULTI-OPEN results ═══════════ */}
    {page==="multi"&&multiResults&&<div className="pageBody" style={S.body}>
      <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:8}}>x{multiResults.items.length} Opening Results</div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",justifyContent:"center"}}>
        <div style={{background:"#0d1117",borderRadius:8,padding:"8px 14px",textAlign:"center"}}><div style={{color:"#888",fontSize:9}}>SPENT</div><div style={{color:"#eb4b4b",fontWeight:700,fontSize:14}}>{money(multiResults.totalCost)}</div></div>
        <div style={{background:"#0d1117",borderRadius:8,padding:"8px 14px",textAlign:"center"}}><div style={{color:"#888",fontSize:9}}>GOT</div><div style={{color:"#4ade80",fontWeight:700,fontSize:14}}>{money(multiResults.totalValue)}</div></div>
        <div style={{background:"#0d1117",borderRadius:8,padding:"8px 14px",textAlign:"center"}}><div style={{color:"#888",fontSize:9}}>PROFIT</div><div style={{color:multiResults.totalValue>=multiResults.totalCost?"#4ade80":"#eb4b4b",fontWeight:700,fontSize:14}}>{multiResults.totalValue>=multiResults.totalCost?"+":""}{money(multiResults.totalValue-multiResults.totalCost)}</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6}}>
        {multiResults.items.map((it,i)=><div key={i} className="bounceIn" style={{background:"#0d1117",borderRadius:8,border:"2px solid "+(R[it.rarity]?.color||"#333")+"55",padding:8,textAlign:"center",animationDelay:i*0.05+"s",animationFillMode:"backwards"}}>
          <div style={{fontSize:20,marginBottom:2}}>{it.icon}</div>
          <div style={{color:R[it.rarity]?.color,fontSize:9,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.name}</div>
          <div style={{color:"#4ade80",fontSize:11,fontWeight:700}}>{money(it.value)}</div>
          <div style={{color:"#555",fontSize:7}}>{R[it.rarity]?.label}</div>
        </div>)}
      </div>
      <div style={{display:"flex",gap:6,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={()=>{setPage("shop");setMultiResults(null)}} style={{...S.btn,background:"#ffffff08",color:"#999"}}>Back to Shop</button>
        {st.bal>=multiResults.case.price*10&&<button onClick={()=>{setMultiResults(null);doMultiOpen(multiResults.case,10)}} style={{...S.btn,background:"#4ade80",color:"#000",fontWeight:700}}>Open x10 Again</button>}
        <button onClick={()=>{const total=multiResults.items.reduce((s,it)=>s+it.value,0);setSt(p=>{const inv=p.inv.filter(x=>!multiResults.items.find(mi=>mi.id===x.id));const ns={...p,bal:p.bal+total,inv};save(ns,drops);return ns});setToast({msg:"Sold all for $"+total.toLocaleString(),color:"#4ade80"});setMultiResults(null);setPage("shop")}} style={{...S.btn,background:"#fbbf24",color:"#000",fontWeight:700}}>Sell All ({money(multiResults.totalValue)})</button>
      </div>
    </div>}

        {/* PLINKO */}
    {/* ═══════════ PLINKO ═══════════ */}
    {page==="plinko"&&<div style={{...S.body,maxWidth:600,margin:"0 auto"}}>
      <div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:800,marginBottom:8}}>🎯 Plinko</div>
      <canvas ref={plinkoCanvasRef} style={{width:"100%",maxWidth:500,background:"#0d1117",border:"1px solid #1e2430",borderRadius:8,display:"block",margin:"0 auto"}}/>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12,alignItems:"center",justifyContent:"center"}}>
        <input value={plinkoBet} onChange={e=>setPlinkoBet(e.target.value.replace(/[^0-9]/g,""))} placeholder="Bet" style={{...S.input,width:100,textAlign:"center"}} onKeyDown={e=>{if(e.key==="Enter"&&!plinkoAnim){document.querySelector("[data-plinko-drop]")?.click()}}}/>
        <select value={plinkoRisk} onChange={e=>setPlinkoRisk(e.target.value)} style={{...S.input,width:100}}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
        <select value={plinkoRows} onChange={e=>setPlinkoRows(parseInt(e.target.value))} style={{...S.input,width:80}}>{[8,10,12,14,16].map(n=><option key={n} value={n}>{n} rows</option>)}</select>
        <button disabled={plinkoAnim} onClick={async()=>{const bet=parseInt(plinkoBet);if(!bet||bet<100||bet>st.bal){setToast({msg:"Invalid bet",color:"#eb4b4b"});return}setPlinkoAnim(true);setPlinkoResult(null);const r=await api("/plinko/drop",{username:account?.username,token:account?.token,bet,rows:plinkoRows,risk:plinkoRisk,slot});if(!r?.ok){setPlinkoAnim(false);setToast({msg:r?.error||"Failed",color:"#eb4b4b"});return}
            // Apply server balance immediately so closing tab mid-animation doesn't undo result
            if(r.serverBal!==null&&r.serverBal!==undefined){lastServerActionRef.current=Date.now();setSt(p=>{const ns={...p,bal:r.serverBal};save(ns,drops);return ns})}
          const cv=plinkoCanvasRef.current;if(!cv){setPlinkoAnim(false);return}
          const W=cv.offsetWidth,H=W*0.9;cv.width=W*2;cv.height=H*2;cv.style.height=H+"px";const g=cv.getContext("2d");g.scale(2,2);
          const rowsN=plinkoRows,pegR=4,ballR=7,gap=(W-40)/rowsN;
          const pegs=[];for(let row=0;row<rowsN;row++)for(let col=0;col<=row+1;col++){const x=W/2+(col-(row+1)/2)*gap;const y=40+row*(gap*0.9);pegs.push({x,y})}
          const buckets={low:[1.5,1.2,1.1,1,0.9,1,1.1,1.2,1.5],medium:[5,2,1.3,1,0.5,0.3,0.5,1,1.3,2,5],high:[29,4,1.5,0.3,0.2,0.2,0.3,1.5,4,29]}[plinkoRisk];
          const bw=(W-20)/buckets.length;
          // Server-decided target bucket — ball MUST end up here so visual matches payout.
          const targetBucketIdx=r.bucket;
          const targetX=10+targetBucketIdx*bw+bw/2;
          let bx=W/2,by=20,vx=0,vy=0,pathIdx=0,finished=false;
          const draw=()=>{g.fillStyle="#0d1117";g.fillRect(0,0,W,H);g.fillStyle="#888";pegs.forEach(p=>{g.beginPath();g.arc(p.x,p.y,pegR,0,Math.PI*2);g.fill()});buckets.forEach((m,i)=>{const bx2=10+i*bw;const c=m>=2?"#4ade80":m>=1?"#f59e0b":"#eb4b4b";const isWin=i===targetBucketIdx&&finished;g.fillStyle=c+(isWin?"77":"33");g.fillRect(bx2,H-40,bw-2,30);g.fillStyle=c;g.font="bold 10px sans-serif";g.textAlign="center";g.fillText(m+"x",bx2+bw/2,H-22)});g.fillStyle="#fbbf24";g.beginPath();g.arc(bx,by,ballR,0,Math.PI*2);g.fill();g.strokeStyle="#fff";g.lineWidth=1;g.stroke()};
          let lastPegId=-1;
          const step=()=>{if(finished)return;
            vy+=0.35;
            // Progressive bias toward target — stronger as ball nears the bottom
            const progress=Math.min(1,(by-40)/(H-80));
            const biasStrength=0.04+progress*0.25;
            vx+=(targetX-bx)*biasStrength/20;
            // Substep to avoid tunneling at high velocity
            const steps=Math.max(1,Math.ceil(Math.abs(vy)/3));
            for(let s=0;s<steps;s++){
              bx+=vx/steps;by+=vy/steps;
              // Find closest overlapping peg
              let closest=null,closestD=Infinity,closestId=-1;
              for(let i=0;i<pegs.length;i++){const p=pegs[i];const dx=bx-p.x,dy=by-p.y,d=Math.sqrt(dx*dx+dy*dy);if(d<pegR+ballR&&d<closestD){closest=p;closestD=d;closestId=i}}
              if(closest&&closestId!==lastPegId){
                // Push ball out along collision normal
                const nx=(bx-closest.x)/(closestD||1),ny=(by-closest.y)/(closestD||1);
                bx=closest.x+nx*(pegR+ballR+0.5);
                by=closest.y+ny*(pegR+ballR+0.5);
                // Decide bounce direction: bias toward target bucket more strongly as we go down
                const goRight=targetX>bx?1:0;
                pathIdx++;
                // Velocity: reflect along normal then bias horizontally per server path
                const dotV=vx*nx+vy*ny;
                vx=vx-2*dotV*nx;
                vy=vy-2*dotV*ny;
                // Apply bounce damping
                vx*=0.55;vy*=0.55;
                // Horizontal bias toward target — stronger lower
                vx+=(goRight?1:-1)*(1.0+progress*1.5);
                // Clamp velocity
                if(Math.abs(vx)>5)vx=Math.sign(vx)*5;
                if(vy<0.5)vy=0.5;
                lastPegId=closestId;
              }else if(!closest){
                lastPegId=-1;
              }
            }
            if(bx<ballR){bx=ballR;vx=Math.abs(vx)*0.5}
            if(bx>W-ballR){bx=W-ballR;vx=-Math.abs(vx)*0.5}
            // Final lock: when close to bottom, snap toward target bucket center
            if(by>H-80){bx+=(targetX-bx)*0.18}
            if(by>H-40){bx=targetX;finished=true;setTimeout(()=>{setPlinkoResult({bucket:r.bucket,multiplier:r.multiplier,payout:r.payout,profit:r.profit});setPlinkoAnim(false);draw();if(r.profit>0){document.body.classList.add("shakeHard");setTimeout(()=>document.body.classList.remove("shakeHard"),400);sndReveal(true)}else sndReveal(false)},300);return}
            draw();requestAnimationFrame(step)
          };
          step();
        }} data-plinko-drop="1" style={{...S.btn,background:plinkoAnim?"#333":"#4ade80",color:"#000",padding:"8px 20px",fontWeight:700}}>{plinkoAnim?"...":"Drop!"}</button>
      </div>
      {plinkoResult&&<div className="bounceIn" style={{textAlign:"center",marginTop:12,padding:10,background:"#0d1117",borderRadius:8}}>
        <div style={{fontSize:18,fontWeight:800,color:plinkoResult.profit>=0?"#4ade80":"#eb4b4b"}}>{plinkoResult.multiplier}x · {plinkoResult.profit>=0?"+":""}{money(plinkoResult.profit)}</div>
      </div>}
    </div>}

    {/* ROULETTE */}
    {/* ═══════════ ROULETTE ═══════════ */}
    {page==="roulette"&&<div style={{...S.body,maxWidth:700,margin:"0 auto"}}>
      <div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:800,marginBottom:8}}>🎰 Roulette</div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <div style={{position:"relative",width:"min(320px,90vw)",height:"min(320px,90vw)"}}>
          <canvas ref={rouletteCanvasRef} style={{width:"100%",height:"100%",display:"block"}}/>
        </div>
        {rouletteResult&&<div className="bounceIn" style={{padding:"8px 20px",borderRadius:8,background:rouletteResult.profit>=0?"#16a34a":"#7f1d1d",color:"#fff",fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:10}}>
          <span style={{background:rouletteResult.color==="red"?"#dc2626":rouletteResult.color==="black"?"#000":"#16a34a",padding:"2px 10px",borderRadius:6,minWidth:30,textAlign:"center"}}>{rouletteResult.number}</span>
          <span>{rouletteResult.profit>0?"WIN +":rouletteResult.profit===0?"PUSH ":"LOSE -"}{money(Math.abs(rouletteResult.profit))}</span>
        </div>}
      </div>

      {/* Bet amount selector */}
      <div style={{display:"flex",gap:6,marginTop:12,alignItems:"center",justifyContent:"center",flexWrap:"wrap"}}>
        <span style={{color:"#888",fontSize:11}}>Chip:</span>
        <input value={rouletteAmt} onChange={e=>setRouletteAmt(e.target.value.replace(/[^0-9]/g,""))} placeholder="100" style={{...S.input,width:90,textAlign:"center"}}/>
        {[100,1000,10000,100000,1000000].map(q=><button key={q} onClick={()=>setRouletteAmt(String(q))} style={{...S.btn,background:rouletteAmt===String(q)?"#f59e0b22":"#0d1117",border:"1px solid "+(rouletteAmt===String(q)?"#f59e0b":"#1e2430"),padding:"4px 8px",fontSize:10,color:rouletteAmt===String(q)?"#f59e0b":"#aaa"}}>{q>=1000?(q/1000)+"K":q}</button>)}
      </div>

      {/* Helper to add a bet (or stack on existing) */}
      {(()=>{
        const addBet=(type,value)=>{
          if(rouletteAnim){setToast({msg:"Wait for spin",color:"#eb4b4b"});return}
          const amt=parseInt(rouletteAmt);
          if(!amt||amt<100){setToast({msg:"Min $100",color:"#eb4b4b"});return}
          const total=rouletteBets.reduce((s,b)=>s+b.amount,0);
          if(total+amt>st.bal){setToast({msg:"Not enough",color:"#eb4b4b"});return}
          setRouletteBets(b=>{
            const idx=b.findIndex(x=>x.type===type&&String(x.value)===String(value));
            if(idx>=0){const nb=[...b];nb[idx]={...nb[idx],amount:nb[idx].amount+amt};return nb}
            return[...b,{type,value,amount:amt}]
          });
        };
        // Get total bet on a specific spot for the chip overlay
        const betOn=(type,value)=>{const m=rouletteBets.find(b=>b.type===type&&String(b.value)===String(value));return m?m.amount:0};
        const Chip=({amt})=>amt>0?<div style={{position:"absolute",top:2,right:2,background:"#fbbf24",color:"#000",fontSize:9,fontWeight:800,padding:"1px 4px",borderRadius:6,minWidth:18,textAlign:"center",lineHeight:1.2,border:"1px solid #92400e",pointerEvents:"none"}}>{amt>=1000?Math.floor(amt/1000)+"K":amt}</div>:null;

        return <div style={{marginTop:10,maxWidth:600,margin:"10px auto 0"}}>
          {/* Number grid + 0 */}
          <div style={{display:"flex",gap:2}}>
            <button onClick={()=>addBet("number",0)} style={{background:"#16a34a",color:"#fff",border:"none",padding:"8px 4px",borderRadius:3,fontSize:11,fontWeight:700,cursor:"pointer",width:30,position:"relative"}}>0<Chip amt={betOn("number",0)}/></button>
            <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:2,flex:1}}>
              {[3,6,9,12,15,18,21,24,27,30,33,36,2,5,8,11,14,17,20,23,26,29,32,35,1,4,7,10,13,16,19,22,25,28,31,34].map(n=><button key={n} onClick={()=>addBet("number",n)} style={{background:[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n)?"#dc2626":"#1f2937",color:"#fff",border:"none",padding:"8px 2px",borderRadius:3,fontSize:11,fontWeight:700,cursor:"pointer",position:"relative"}}>{n}<Chip amt={betOn("number",n)}/></button>)}
            </div>
          </div>
          {/* Dozens row */}
          <div style={{display:"grid",gridTemplateColumns:"30px repeat(3,1fr)",gap:2,marginTop:2}}>
            <div></div>
            {[["dozen1","1-12 (3x)"],["dozen2","13-24 (3x)"],["dozen3","25-36 (3x)"]].map(([t,l])=><button key={t} onClick={()=>addBet(t,t)} style={{background:"#374151",color:"#fff",border:"none",padding:"8px",borderRadius:3,fontSize:10,fontWeight:700,cursor:"pointer",position:"relative"}}>{l}<Chip amt={betOn(t,t)}/></button>)}
          </div>
          {/* Outside bets row */}
          <div style={{display:"grid",gridTemplateColumns:"30px repeat(6,1fr)",gap:2,marginTop:2}}>
            <div></div>
            {[["low","1-18","#374151"],["even","EVEN","#374151"],["red","RED","#dc2626"],["black","BLACK","#1f2937"],["odd","ODD","#374151"],["high","19-36","#374151"]].map(([t,l,bg])=><button key={t} onClick={()=>addBet(t,t)} style={{background:bg,color:"#fff",border:"none",padding:"8px 4px",borderRadius:3,fontSize:10,fontWeight:700,cursor:"pointer",position:"relative"}}>{l} (2x)<Chip amt={betOn(t,t)}/></button>)}
          </div>
        </div>
      })()}

      {/* Bet summary + actions */}
      {rouletteBets.length>0&&<div style={{marginTop:10,padding:10,background:"#0d1117",borderRadius:8,maxWidth:600,margin:"10px auto 0"}}>
        <div style={{fontSize:11,color:"#888",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
          <span>Active bets: {rouletteBets.length}</span>
          <span style={{color:"#fbbf24",fontWeight:700}}>Total: {money(rouletteBets.reduce((s,b)=>s+b.amount,0))}</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {rouletteBets.map((b,i)=>{
            const label=b.type==="number"?"#"+b.value:b.type.replace("dozen","D").toUpperCase();
            const c=b.type==="red"||(b.type==="number"&&[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(b.value))?"#dc2626":b.type==="black"?"#000":b.type==="number"&&b.value===0?"#16a34a":"#374151";
            return <span key={i} style={{background:c,padding:"3px 8px",borderRadius:4,fontSize:10,color:"#fff",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>
              {label} · {money(b.amount)}
              <button onClick={()=>setRouletteBets(bs=>bs.filter((_,j)=>j!==i))} disabled={rouletteAnim} style={{background:"rgba(0,0,0,0.4)",border:"none",color:"#fff",cursor:rouletteAnim?"not-allowed":"pointer",padding:"0 4px",marginLeft:2,borderRadius:3,fontSize:11,lineHeight:1}}>×</button>
            </span>
          })}
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center"}}>
          <button disabled={rouletteAnim} onClick={async()=>{
            const total=rouletteBets.reduce((s,b)=>s+b.amount,0);
            if(total>st.bal){setToast({msg:"Not enough",color:"#eb4b4b"});return}
            
            setRouletteAnim(true);
            setRouletteResult(null);
            const r=await api("/roulette/spin",{username:account?.username,token:account?.token,bets:rouletteBets,slot});
            if(!r?.ok){setRouletteAnim(false);setToast({msg:r?.error||"Spin failed",color:"#eb4b4b"});return}
            // CRITICAL: apply server-authoritative balance NOW, before animation, so closing the tab mid-spin doesn't undo the loss.
            if(r.serverBal!==null&&r.serverBal!==undefined){lastServerActionRef.current=Date.now();setSt(p=>{const ns={...p,bal:r.serverBal};save(ns,drops);return ns})}
            // Animate spin
            const cv=rouletteCanvasRef.current;
            if(!cv){setRouletteAnim(false);return}
            const W=cv.offsetWidth;
            cv.width=W*2;cv.height=W*2;
            const g=cv.getContext("2d");g.scale(2,2);
            const nums=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
            const red=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
            const segAng=(Math.PI*2)/nums.length;
            const targetIdx=nums.indexOf(r.number);
            const landRot=-targetIdx*segAng;
            const totalRot=-(Math.PI*2*6)+landRot;
            const t0=performance.now();
            const dur=4500;
            const drawWheel=(rot)=>{
              g.clearRect(0,0,W,W);
              const cx=W/2,cy=W/2,rad=W/2-12;
              g.fillStyle="#3f1a05";g.beginPath();g.arc(cx,cy,W/2-2,0,Math.PI*2);g.fill();
              nums.forEach((n,i)=>{
                const a0=-Math.PI/2+i*segAng-segAng/2+rot,a1=a0+segAng;
                g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,rad,a0,a1);g.closePath();
                g.fillStyle=n===0?"#16a34a":red.has(n)?"#dc2626":"#111";g.fill();
                g.strokeStyle="#000";g.lineWidth=0.5;g.stroke();
                g.save();g.translate(cx,cy);g.rotate(a0+segAng/2);g.fillStyle="#fff";g.font="bold "+Math.max(10,W*0.04)+"px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(String(n),rad*0.82,0);g.restore();
              });
              g.fillStyle="#2d1505";g.beginPath();g.arc(cx,cy,rad*0.25,0,Math.PI*2);g.fill();
              g.fillStyle="#f59e0b";g.beginPath();g.arc(cx,cy,rad*0.1,0,Math.PI*2);g.fill();
              g.fillStyle="#fbbf24";g.strokeStyle="#000";g.lineWidth=2;
              g.beginPath();g.moveTo(cx,4);g.lineTo(cx-10,22);g.lineTo(cx+10,22);g.closePath();g.fill();g.stroke();
            };
            const loop=()=>{
              const t=Math.min(1,(performance.now()-t0)/dur);
              const eased=1-Math.pow(1-t,3.5);
              const rot=totalRot*eased;
              drawWheel(rot);
              if(t<1){requestAnimationFrame(loop)}
              else{
                setTimeout(()=>{
                  // Server-determined payout is authoritative
                  setRouletteResult({number:r.number,color:r.color,payout:r.payout,profit:r.profit});
                  setRouletteBets([]);
                  setRouletteAnim(false);
                  if(r.profit>0){document.body.classList.add("shakeHard");setTimeout(()=>document.body.classList.remove("shakeHard"),400);sndReveal(true)}
                  else sndReveal(false);
                },500);
              }
            };
            loop();
          }} style={{...S.btn,background:rouletteAnim?"#333":"#4ade80",color:"#000",fontWeight:700,padding:"8px 24px"}}>{rouletteAnim?"Spinning...":"SPIN"}</button>
          <button disabled={rouletteAnim} onClick={()=>setRouletteBets([])} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b"}}>Clear All</button>
        </div>
      </div>}
    </div>}

    {/* FAQ */}
    {/* ═══════════ FAQ ═══════════ */}
    {page==="faq"&&<div style={{...S.body,maxWidth:720,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <button onClick={()=>setPage("shop")} style={{...S.btn,background:"#ffffff08",color:"#888",padding:"4px 10px",fontSize:11,display:"inline-flex",alignItems:"center",gap:3}}><MI n="arrow_back" s={14}/>{t("back")}</button>
      </div>
      <div style={{fontSize:"clamp(20px,5vw,28px)",fontWeight:800,marginBottom:4,display:"flex",alignItems:"center",gap:8,animation:"fadeUp .4s"}}><MI n="help_outline" s={28} c="#3b82f6"/> {t("faq_title")}</div>
      <div style={{color:"#94a3b8",fontSize:12,marginBottom:16,animation:"fadeUp .5s"}}>{t("faq_subtitle")}</div>
      {[
        ["what_is","star"],["login","login"],["save","save"],["slots","layers"],
        ["rent","home"],["loan","attach_money"],["bj","casino"],["btc","currency_bitcoin"],
        ["weather","cloud"],["chat","chat"],["legal","gavel"],["data","shield"],
        ["delete","delete"],["contact","mail"]
      ].map(([key,icon],i)=>{
        const itemKey="faq_"+key;
        const expanded=expandedSection[itemKey];
        return <div key={key} style={{background:expanded?"#0a1929":"#0d1117",border:expanded?"1px solid #3b82f644":"1px solid #1e2430",borderRadius:10,marginBottom:6,overflow:"hidden",transition:"all .2s",animation:"fadeUp .4s",animationDelay:(i*0.04)+"s",animationFillMode:"backwards"}}>
          <div onClick={()=>setExpandedSection(p=>({...p,[itemKey]:!p[itemKey]}))} style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <MI n={icon} s={20} c={expanded?"#3b82f6":"#60a5fa"}/>
            <div style={{flex:1,color:expanded?"#fff":"#cbd5e1",fontWeight:700,fontSize:13}}>{t("faq_q_"+key)}</div>
            <MI n={expanded?"expand_less":"expand_more"} s={20} c="#666"/>
          </div>
          {expanded&&<div style={{padding:"0 14px 14px 44px",color:"#cbd5e1",fontSize:12,lineHeight:1.6,animation:"fadeUp .25s"}}>
            {t("faq_a_"+key)}
          </div>}
        </div>;
      })}
      <div style={{marginTop:16,padding:12,background:"#0d1117",border:"1px solid #1e2430",borderRadius:8,fontSize:11,color:"#64748b",textAlign:"center",animation:"fadeUp .8s"}}>
        CASES · Open source · D1 + Cloudflare Workers
      </div>
    </div>}

    {/* WEATHER */}
    {/* ═══════════ WEATHER ═══════════ */}
    {page==="school"&&(()=>{
      const wIcon=(s)=>{
        if(!s)return"cloud";
        const sl=s.toLowerCase();
        const isNight=sl.includes("_night")||sl.includes("_polartwilight");
        if(sl.includes("thunder"))return"thunderstorm";
        if(sl.includes("snow")||sl.includes("sleet"))return"ac_unit";
        if(sl.includes("rain")||sl.includes("shower"))return"rainy";
        if(sl.includes("fog"))return"foggy";
        if(sl.includes("partlycloudy"))return isNight?"partly_cloudy_night":"partly_cloudy_day";
        if(sl.includes("cloudy")||sl.includes("cloud"))return"cloud";
        if(sl.includes("clear")||sl.includes("fair"))return isNight?"bedtime":"wb_sunny";
        return"cloud";
      };
      const wColor=(s)=>{if(!s)return"#94a3b8";const sl=s.toLowerCase();const isNight=sl.includes("_night")||sl.includes("_polartwilight");if(sl.includes("clear")||sl.includes("fair"))return isNight?"#94a3b8":"#fbbf24";if(sl.includes("rain")||sl.includes("shower"))return"#3b82f6";if(sl.includes("snow")||sl.includes("sleet"))return"#bae6fd";if(sl.includes("thunder"))return"#a855f7";if(sl.includes("fog"))return"#64748b";if(sl.includes("partlycloudy"))return isNight?"#94a3b8":"#cbd5e1";if(sl.includes("cloudy"))return"#94a3b8";return"#94a3b8"};
      const windDirKey=(deg)=>{if(deg===undefined||deg===null)return null;const keys=["wind_n","wind_nne","wind_ne","wind_ene","wind_e","wind_ese","wind_se","wind_sse","wind_s","wind_ssw","wind_sw","wind_wsw","wind_w","wind_wnw","wind_nw","wind_nnw"];return keys[Math.round(deg/22.5)%16]};
      const windDir=(deg)=>{const k=windDirKey(deg);return k?t(k):"–"};
      const fmtTime=(iso)=>{if(!iso)return"–";const d=new Date(iso);return d.toLocaleTimeString(lang==="sv"?"sv-SE":"en-GB",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Stockholm"})};
      const uvLabel=(u)=>{if(u===undefined||u===null)return"–";if(u<3)return t("uv_low");if(u<6)return t("uv_moderate");if(u<8)return t("uv_high");if(u<11)return t("uv_very_high");return t("uv_extreme")};
      const uvColor=(u)=>{if(u===undefined||u===null)return"#888";if(u<3)return"#4ade80";if(u<6)return"#fbbf24";if(u<8)return"#fb923c";if(u<11)return"#dc2626";return"#a855f7"};
      const pollenLabel=(l)=>[t("pollen_none"),t("pollen_trace"),t("pollen_low"),t("pollen_moderate"),t("pollen_high"),t("pollen_very_high"),t("pollen_extreme")][l]||"?";
      const pollenColor=(l)=>["#475569","#a3a3a3","#4ade80","#fbbf24","#fb923c","#dc2626","#a855f7"][l]||"#888";
      const toggle=(k)=>setExpandedSection(p=>({...p,[k]:!p[k]}));
      const c=weatherData?.current||{};
      const w=weatherData||{};
      // Compute daylight duration
      let daylight="–";
      if(w.sun?.sunrise&&w.sun?.sunset){
        const dur=(new Date(w.sun.sunset)-new Date(w.sun.sunrise))/60000;
        const h=Math.floor(dur/60),m=Math.round(dur%60);
        daylight=h+"h "+m+"m";
      }
      // Format day name in current language
      const dayName=(date,short)=>{const d=new Date(date);const wd=d.getDay();const keys=["day_sun","day_mon","day_tue","day_wed","day_thu","day_fri","day_sat"];return short?t(keys[wd]):d.toLocaleDateString(lang==="sv"?"sv-SE":"en-US",{weekday:"long"})};
      const visibilityLabel=(v)=>{if(v===undefined||v===null)return"–";if(v<10)return"Excellent";if(v<30)return"Good";if(v<70)return"Moderate";return"Poor"};
      return <div style={{...S.body,maxWidth:720,margin:"0 auto"}}>
        <div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:800,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><MI n="cloud" s={26} c="#60a5fa"/> {t("weather_title")} · {t("weather_location")}</div>

        {/* SMHI WARNINGS */}
        {smhiWarnings?.warnings?.length>0&&<div style={{marginBottom:14}}>
          {smhiWarnings.warnings.map((wn,i)=>{
            const lvlColor=wn.level==="RED"?"#dc2626":wn.level==="ORANGE"?"#fb923c":"#fbbf24";
            return <div key={i} onClick={()=>toggle("warn"+i)} style={{background:lvlColor+"15",border:"1px solid "+lvlColor+"55",borderLeft:"4px solid "+lvlColor,borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",animation:"slideIn .3s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <MI n="warning" s={20} c={lvlColor}/>
                <div style={{flex:1}}>
                  <div style={{color:lvlColor,fontWeight:800,fontSize:12}}>{wn.event}</div>
                  <div style={{color:"#cbd5e1",fontSize:10}}>{wn.area} · {wn.level_label||wn.level}</div>
                </div>
                <MI n={expandedSection["warn"+i]?"expand_less":"expand_more"} s={20} c="#888"/>
              </div>
              {expandedSection["warn"+i]&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid "+lvlColor+"33",color:"#cbd5e1",fontSize:11,lineHeight:1.5}}>
                {wn.description}
                {wn.startDate&&<div style={{color:"#94a3b8",fontSize:10,marginTop:6}}>{lang==="sv"?"Från":"From"}: {new Date(wn.startDate).toLocaleString(lang==="sv"?"sv-SE":"en-GB")}</div>}
                {wn.endDate&&<div style={{color:"#94a3b8",fontSize:10}}>{lang==="sv"?"Till":"Until"}: {new Date(wn.endDate).toLocaleString(lang==="sv"?"sv-SE":"en-GB")}</div>}
              </div>}
            </div>;
          })}
        </div>}

        {/* MAIN WEATHER */}
        {w.ok?<div onClick={()=>toggle("wmain")} style={{background:"linear-gradient(135deg,#1e3a8a 0%,#0d1117 100%)",borderRadius:12,padding:"clamp(14px,3vw,20px)",marginBottom:14,border:"1px solid #1e2430",cursor:"pointer",animation:"fadeUp .4s"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <MI n={wIcon(c.symbol)} s={64} c={wColor(c.symbol)} f={{filter:"drop-shadow(0 4px 12px "+wColor(c.symbol)+"44)"}}/>
              <div>
                <div style={{fontSize:"clamp(26px,7vw,42px)",fontWeight:800,color:"#fff",lineHeight:1}}>{c.temp!==undefined?Math.round(c.temp)+"°":"–"}</div>
                <div style={{fontSize:11,color:"#cbd5e1",textTransform:"capitalize",marginTop:4}}>{(c.symbol||"").replace(/_/g," ").replace(/(day|night)$/,"").trim()}</div>
                {c.rainStopsAt&&<div style={{color:"#60a5fa",fontSize:10,marginTop:2,display:"flex",alignItems:"center",gap:3}}><MI n="umbrella" s={11} c="#60a5fa"/> {t("weather_rain_stops")} {fmtTime(c.rainStopsAt)}</div>}
                {!c.rainStopsAt&&c.rainStartsAt&&<div style={{color:"#fbbf24",fontSize:10,marginTop:2,display:"flex",alignItems:"center",gap:3}}><MI n="water_drop" s={11} c="#fbbf24"/> {t("weather_rain_starts")} {fmtTime(c.rainStartsAt)}</div>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,fontSize:11,color:"#cbd5e1"}}>
              {c.wind!==undefined&&<div style={{display:"flex",alignItems:"center",gap:4}}><MI n="air" s={14} c="#888"/><div><div style={{color:"#888",fontSize:9}}>{t("weather_wind").toUpperCase()}</div><div>{c.wind.toFixed(1)} m/s {windDir(c.wind_dir)}</div></div></div>}
              {c.humidity!==undefined&&<div style={{display:"flex",alignItems:"center",gap:4}}><MI n="water_drop" s={14} c="#60a5fa"/><div><div style={{color:"#888",fontSize:9}}>{t("weather_humidity").toUpperCase()}</div><div>{Math.round(c.humidity)}%</div></div></div>}
              {c.uv!==undefined&&<div style={{display:"flex",alignItems:"center",gap:4}}><MI n="wb_sunny" s={14} c={uvColor(c.uv)}/><div><div style={{color:"#888",fontSize:9}}>{t("weather_uv").toUpperCase()}</div><div style={{color:uvColor(c.uv)}}>{c.uv.toFixed(1)} {uvLabel(c.uv)}</div></div></div>}
              {c.pressure!==undefined&&<div style={{display:"flex",alignItems:"center",gap:4}}><MI n="speed" s={14} c="#888"/><div><div style={{color:"#888",fontSize:9}}>{t("weather_pressure").toUpperCase()}</div><div>{Math.round(c.pressure)} hPa</div></div></div>}
            </div>
          </div>
          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #1e293b",display:"flex",justifyContent:"center",alignItems:"center",gap:6,color:"#64748b",fontSize:10}}>
            <MI n={expandedSection.wmain?"expand_less":"expand_more"} s={16}/>
            <span>{t("weather_more_details")}</span>
          </div>
          {expandedSection.wmain&&<div onClick={e=>e.stopPropagation()} style={{marginTop:10,paddingTop:10,borderTop:"1px solid #1e293b",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,fontSize:11,color:"#cbd5e1",animation:"fadeUp .25s"}}>
            {c.wind_gust!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="air" s={10}/>{t("weather_wind_gust").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2}}>{c.wind_gust.toFixed(1)} m/s</div></div>}
            {c.wind_dir!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="explore" s={10}/>{t("weather_wind_from").toUpperCase()}</div><div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}><MI n="navigation" s={16} c="#60a5fa" f={{transform:"rotate("+(c.wind_dir+180)+"deg)",transformOrigin:"center"}}/><span style={{fontWeight:700}}>{windDir(c.wind_dir)} ({Math.round(c.wind_dir)}°)</span></div></div>}
            {c.dew_point!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="opacity" s={10}/>{t("weather_dew_point").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2}}>{c.dew_point.toFixed(1)}°C</div></div>}
            {c.cloud!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="cloud" s={10}/>{t("weather_cloud_cover").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2}}>{Math.round(c.cloud)}%</div>{c.cloud_low!==undefined&&<div style={{color:"#94a3b8",fontSize:9,marginTop:2}}>L:{Math.round(c.cloud_low)}% M:{Math.round(c.cloud_mid||0)}% H:{Math.round(c.cloud_high||0)}%</div>}</div>}
            {c.visibility!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="visibility" s={10}/>{t("weather_visibility").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2}}>{c.visibility<5?"Excellent":c.visibility<20?"Good":c.visibility<50?"Moderate":"Poor"}</div></div>}
            {c.precip>0&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="water_drop" s={10}/>{t("weather_precip_now").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2,color:"#60a5fa"}}>{c.precip}mm/h</div></div>}
            {c.precip_prob>0&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="percent" s={10}/>{t("weather_rain_chance").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2}}>{Math.round(c.precip_prob)}%</div></div>}
            {w.sun?.sunrise&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="wb_twilight" s={10}/>{t("weather_sunrise").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2,color:"#fbbf24"}}>{fmtTime(w.sun.sunrise)}</div></div>}
            {w.sun?.sunset&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="nights_stay" s={10}/>{t("weather_sunset").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2,color:"#fb923c"}}>{fmtTime(w.sun.sunset)}</div></div>}
            {w.sun?.sunrise&&w.sun?.sunset&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:8}}><div style={{color:"#888",fontSize:9,display:"flex",alignItems:"center",gap:3}}><MI n="schedule" s={10}/>{t("weather_daylight").toUpperCase()}</div><div style={{fontWeight:700,marginTop:2}}>{daylight}</div></div>}
          </div>}
        </div>:<div style={{color:"#555",fontSize:11,padding:14,textAlign:"center",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:8,marginBottom:14}}>{t("loading")}</div>}

        {/* AIR QUALITY */}
        {airData?.ok&&airData.aqi!==undefined&&airData.aqi!==null&&<div onClick={()=>toggle("air")} style={{background:airData.aqi_color+"15",border:"1px solid "+airData.aqi_color+"55",borderRadius:12,padding:"12px 14px",marginBottom:14,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <MI n="masks" s={22} c={airData.aqi_color}/>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#cbd5e1"}}>{t("weather_air_quality")}</div>
                <div style={{fontSize:18,fontWeight:800,color:airData.aqi_color,marginTop:2}}>{Math.round(airData.aqi)} · {airData.aqi_label}</div>
              </div>
            </div>
            <MI n={expandedSection.air?"expand_less":"expand_more"} s={20} c="#888"/>
          </div>
          {expandedSection.air&&<div onClick={e=>e.stopPropagation()} style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+airData.aqi_color+"33",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,fontSize:10,color:"#cbd5e1"}}>
            {airData.pm25!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:6}}><div style={{color:"#888",fontSize:9}}>PM2.5</div><div style={{fontWeight:700}}>{airData.pm25.toFixed(1)} μg/m³</div></div>}
            {airData.pm10!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:6}}><div style={{color:"#888",fontSize:9}}>PM10</div><div style={{fontWeight:700}}>{airData.pm10.toFixed(1)} μg/m³</div></div>}
            {airData.no2!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:6}}><div style={{color:"#888",fontSize:9}}>NO₂</div><div style={{fontWeight:700}}>{airData.no2.toFixed(1)} μg/m³</div></div>}
            {airData.o3!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:6}}><div style={{color:"#888",fontSize:9}}>O₃</div><div style={{fontWeight:700}}>{airData.o3.toFixed(1)} μg/m³</div></div>}
            {airData.so2!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:6}}><div style={{color:"#888",fontSize:9}}>SO₂</div><div style={{fontWeight:700}}>{airData.so2.toFixed(1)} μg/m³</div></div>}
            {airData.co!==undefined&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:6,padding:6}}><div style={{color:"#888",fontSize:9}}>CO</div><div style={{fontWeight:700}}>{airData.co.toFixed(0)} μg/m³</div></div>}
          </div>}
        </div>}

        {/* HOURLY FORECAST - compact cards with big icons + temp */}
        {w.hourly?.length>0&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid #1e2430",borderRadius:12,padding:"14px",marginBottom:14,animation:"fadeUp .5s"}}>
          <div onClick={()=>toggle("hr")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:"#cbd5e1"}}><MI n="schedule" s={18} c="#60a5fa"/> {t("weather_next_hours",{n:expandedSection.hr?24:12})}</div>
            <MI n={expandedSection.hr?"expand_less":"expand_more"} s={20} c="#888"/>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,scrollSnapType:"x mandatory"}}>
            {w.hourly.slice(0,expandedSection.hr?24:12).map((h,i)=>{
              const isFirst=i===0;
              const hr=new Date(h.time).getHours().toString().padStart(2,"0");
              return <div key={i} style={{flexShrink:0,textAlign:"center",background:isFirst?"linear-gradient(180deg,#1e3a8a44,#0d1117)":"#080a0e",borderRadius:10,padding:"10px 12px",minWidth:72,border:isFirst?"1px solid #3b82f655":"1px solid #1e2430",scrollSnapAlign:"start",animation:"fadeUp .4s",animationDelay:(i*0.03)+"s",animationFillMode:"backwards"}}>
                <div style={{fontSize:10,color:isFirst?"#3b82f6":"#888",fontWeight:700}}>{isFirst?(lang==="sv"?"NU":"NOW"):hr+":00"}</div>
                <div style={{margin:"4px 0",height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <MI n={wIcon(h.symbol)} s={30} c={wColor(h.symbol)} f={{filter:"drop-shadow(0 0 6px "+wColor(h.symbol)+"44)"}}/>
                </div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.1}}>{h.temp!==undefined?Math.round(h.temp)+"°":"–"}</div>
                <div style={{minHeight:14,marginTop:4}}>
                  {h.precip>0?<div style={{fontSize:9,color:"#60a5fa",display:"flex",alignItems:"center",justifyContent:"center",gap:2}}><MI n="water_drop" s={10} c="#60a5fa"/>{h.precip.toFixed(1)}mm</div>:
                   h.precip_prob>5?<div style={{fontSize:9,color:"#94a3b8"}}>{Math.round(h.precip_prob)}%</div>:null}
                </div>
              </div>;
            })}
          </div>
        </div>}

        {/* 7-DAY FORECAST - clickable rows that expand to per-hour cards */}
        {w.daily?.length>0&&<div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid #1e2430",borderRadius:12,padding:"14px",marginBottom:14,animation:"fadeUp .55s"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:"#cbd5e1",marginBottom:10}}><MI n="calendar_today" s={18} c="#60a5fa"/> {t("weather_forecast_7day")}</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {w.daily.slice(0,7).map((d,i)=>{
              const dayKey="day"+i;
              const expanded=expandedSection[dayKey];
              // Get hourly entries for this date
              const dayHourly=(w.hourly||[]).filter(h=>h.time.startsWith(d.date));
              return <div key={i} style={{background:expanded?"#0a1929":"#080a0e",borderRadius:8,border:expanded?"1px solid #3b82f644":"1px solid #1e2430",overflow:"hidden",transition:"all .2s"}}>
                <div onClick={()=>toggle(dayKey)} style={{display:"grid",gridTemplateColumns:"80px 36px 1fr 90px 16px",gap:8,alignItems:"center",padding:"10px 10px",fontSize:12,cursor:"pointer"}}>
                  <div style={{color:expanded?"#3b82f6":"#cbd5e1",fontWeight:700}}>{i===0?t("weather_today"):dayName(d.date,true)}</div>
                  <MI n={wIcon(d.symbol)} s={26} c={wColor(d.symbol)} f={{filter:"drop-shadow(0 0 4px "+wColor(d.symbol)+"33)"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:8,color:"#94a3b8",fontSize:10,flexWrap:"wrap"}}>
                    {d.precip>0&&<span style={{display:"inline-flex",alignItems:"center",gap:2}}><MI n="water_drop" s={11} c="#60a5fa"/>{d.precip.toFixed(1)}mm</span>}
                    {d.wind!==undefined&&<span style={{display:"inline-flex",alignItems:"center",gap:2}}><MI n="air" s={11}/>{d.wind.toFixed(1)}m/s</span>}
                  </div>
                  <div style={{textAlign:"right",color:"#fff",fontWeight:700,fontSize:13}}>
                    {d.temp_max!==undefined?Math.round(d.temp_max)+"°":"–"}<span style={{color:"#64748b",marginLeft:6,fontSize:11}}>{d.temp_min!==undefined?Math.round(d.temp_min)+"°":"–"}</span>
                  </div>
                  <MI n={expanded?"expand_less":"expand_more"} s={16} c="#666"/>
                </div>
                {expanded&&<div style={{padding:"0 10px 12px",animation:"fadeUp .25s"}}>
                  {dayHourly.length>0?<div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,scrollSnapType:"x mandatory"}}>
                    {dayHourly.map((h,hi)=>{
                      const hr=new Date(h.time).getHours().toString().padStart(2,"0");
                      return <div key={hi} style={{flexShrink:0,textAlign:"center",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderRadius:8,padding:"8px 10px",minWidth:62,border:"1px solid #1e2430",scrollSnapAlign:"start",animation:"fadeUp .35s",animationDelay:(hi*0.025)+"s",animationFillMode:"backwards"}}>
                        <div style={{fontSize:9,color:"#888",fontWeight:700}}>{hr}:00</div>
                        <div style={{margin:"3px 0"}}>
                          <MI n={wIcon(h.symbol)} s={22} c={wColor(h.symbol)}/>
                        </div>
                        <div style={{fontSize:12,fontWeight:800,color:"#fff"}}>{h.temp!==undefined?Math.round(h.temp)+"°":"–"}</div>
                        <div style={{minHeight:12,marginTop:2}}>
                          {h.precip>0?<div style={{fontSize:8,color:"#60a5fa"}}>{h.precip.toFixed(1)}mm</div>:
                           h.precip_prob>5?<div style={{fontSize:8,color:"#94a3b8"}}>{Math.round(h.precip_prob)}%</div>:null}
                        </div>
                      </div>;
                    })}
                  </div>:<div style={{color:"#666",fontSize:10,textAlign:"center",padding:8}}>{lang==="sv"?"Inga timdata för denna dag":"No hourly data for this day"}</div>}
                </div>}
              </div>;
            })}
          </div>
        </div>}

        {/* POLLEN */}
        {pollenData?.today?.length>0&&<div onClick={()=>toggle("pol")} style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid #1e2430",borderRadius:12,padding:"12px 14px",marginBottom:14,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:"#cbd5e1"}}><MI n="grass" s={16} c="#4ade80"/> {t("weather_pollen_title")} · {pollenData.region}</div>
            <MI n={expandedSection.pol?"expand_less":"expand_more"} s={18} c="#888"/>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {pollenData.today.slice(0,expandedSection.pol?20:6).map((p,i)=><div key={i} style={{background:pollenColor(p.level)+"22",border:"1px solid "+pollenColor(p.level)+"55",borderRadius:6,padding:"4px 8px",fontSize:10,color:pollenColor(p.level),fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
              <span>{p.name}</span>
              <span style={{background:pollenColor(p.level),color:"#000",borderRadius:3,padding:"0 4px",fontSize:9}}>{pollenLabel(p.level)}</span>
            </div>)}
          </div>
          {expandedSection.pol&&pollenData.text&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #1e293b",fontSize:11,color:"#cbd5e1",lineHeight:1.4}}>{pollenData.text}</div>}
        </div>}
      </div>;
    })()}

            {/* WHEEL OF FORTUNE */}
    {/* ═══════════ WHEEL OF FORTUNE ═══════════ */}
    {page==="wheel"&&<div style={{...S.body,maxWidth:520,margin:"0 auto"}}>
      <div style={{fontSize:"clamp(20px,5vw,28px)",fontWeight:800,marginBottom:6,display:"flex",alignItems:"center",gap:8,animation:"fadeUp .4s"}}><MI n="casino" s={28} c="#ffd700" f={{filter:"drop-shadow(0 0 8px #ffd70066)"}}/> {t("wheel_title")}</div>
      <div style={{color:"#94a3b8",fontSize:12,marginBottom:16,animation:"fadeUp .5s"}}>{t("wheel_subtitle")}</div>

      {!account?<div style={{padding:20,background:"#0d1117",border:"1px solid #1e2430",borderRadius:12,textAlign:"center",animation:"fadeUp .5s"}}>
        <MI n="lock" s={32} c="#888"/>
        <div style={{color:"#cbd5e1",fontSize:13,marginTop:6}}>{t("wheel_login_required")}</div>
      </div>:<>
        <div style={{position:"relative",margin:"0 auto",width:"min(380px,90vw)",aspectRatio:"1"}}>
          {/* Pointer at top */}
          <div style={{position:"absolute",top:-2,left:"50%",transform:"translateX(-50%)",zIndex:2,width:0,height:0,borderLeft:"14px solid transparent",borderRight:"14px solid transparent",borderTop:"22px solid #ffd700",filter:"drop-shadow(0 2px 4px #0008)"}}/>
          <canvas ref={wheelCanvasRef} style={{width:"100%",height:"100%",display:"block"}}/>
        </div>

        {wheelResult&&<div className="bounceIn" style={{textAlign:"center",margin:"14px 0",padding:"14px 18px",background:"linear-gradient(135deg,#4ade8022,#16a34a22)",border:"1px solid #4ade8055",borderRadius:12}}>
          <MI n="celebration" s={32} c="#4ade80" f={{filter:"drop-shadow(0 0 8px #4ade8088)"}}/>
          <div style={{fontSize:18,fontWeight:800,color:"#4ade80",marginTop:4}}>{t("wheel_won",{amount:wheelResult.amount.toLocaleString()})}</div>
        </div>}

        <div style={{textAlign:"center",marginTop:16}}>
          {wheelStatus?.canSpin===false?<div style={{padding:"10px 16px",background:"#0d1117",border:"1px solid #1e2430",borderRadius:8,display:"inline-flex",alignItems:"center",gap:8}}>
            <MI n="schedule" s={18} c="#888"/>
            <div>
              <div style={{fontSize:11,color:"#888"}}>{t("wheel_next_spin")}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#cbd5e1"}}>{wheelStatus.nextSpinMs?(()=>{const h=Math.floor(wheelStatus.nextSpinMs/3600000);const m=Math.floor((wheelStatus.nextSpinMs%3600000)/60000);return h+"h "+m+"m"})():"–"}</div>
            </div>
          </div>:<button disabled={wheelSpinning||!wheelStatus?.canSpin} onClick={async()=>{
            setWheelSpinning(true);
            setWheelResult(null);
            const r=await api("/wheel/spin",{username:account.username,token:account.token,slot});
            if(!r?.ok){
              setWheelSpinning(false);
              setToast({msg:r?.error||"Failed",color:"#eb4b4b"});
              if(r?.nextSpinMs)setWheelStatus({canSpin:false,nextSpinMs:r.nextSpinMs});
              return;
            }
            // Apply server balance immediately (wheel never loses, but consistency)
            if(r.serverBal!==null&&r.serverBal!==undefined){lastServerActionRef.current=Date.now();setSt(p=>{const ns={...p,bal:r.serverBal};save(ns,drops);return ns})}
            // Animate canvas
            const cv=wheelCanvasRef.current;
            if(!cv){setWheelSpinning(false);return}
            const W=cv.offsetWidth;
            cv.width=W*2;cv.height=W*2;
            const g=cv.getContext("2d");g.scale(2,2);
            const segs=r.segments;
            const n=segs.length;
            const segAng=(Math.PI*2)/n;
            // Colors for each segment
            const colors=["#dc2626","#fb923c","#fbbf24","#84cc16","#22d3ee","#3b82f6","#a855f7","#ec4899"];
            // Target: land on segs[r.prizeIndex] at top (-PI/2)
            // Static placement: seg i is centered at -PI/2 + i*segAng. To put prizeIndex at top, rotation must be -prizeIndex*segAng
            const landRot=-r.prizeIndex*segAng;
            const totalRot=-(Math.PI*2*7)+landRot;
            const t0=performance.now();
            const dur=5500;
            const drawWheel=(rot)=>{
              g.clearRect(0,0,W,W);
              const cx=W/2,cy=W/2,rad=W/2-8;
              // Outer ring
              g.fillStyle="#1a1a2e";
              g.beginPath();g.arc(cx,cy,W/2-2,0,Math.PI*2);g.fill();
              // Segments
              segs.forEach((s,i)=>{
                const a0=-Math.PI/2+i*segAng-segAng/2+rot;
                const a1=a0+segAng;
                g.beginPath();
                g.moveTo(cx,cy);
                g.arc(cx,cy,rad,a0,a1);
                g.closePath();
                g.fillStyle=colors[i%colors.length];
                g.fill();
                g.strokeStyle="#0d1117";g.lineWidth=2;g.stroke();
                // Label
                g.save();
                g.translate(cx,cy);
                g.rotate(a0+segAng/2);
                g.fillStyle="#fff";
                g.font="bold "+Math.max(11,W*0.05)+"px sans-serif";
                g.textAlign="right";
                g.textBaseline="middle";
                g.strokeStyle="#000";g.lineWidth=3;
                g.strokeText(s.label,rad*0.92,0);
                g.fillText(s.label,rad*0.92,0);
                g.restore();
              });
              // Center hub
              g.fillStyle="#2d2d3f";g.beginPath();g.arc(cx,cy,rad*0.18,0,Math.PI*2);g.fill();
              g.fillStyle="#ffd700";g.beginPath();g.arc(cx,cy,rad*0.08,0,Math.PI*2);g.fill();
            };
            const loop=()=>{
              const tt=Math.min(1,(performance.now()-t0)/dur);
              const eased=1-Math.pow(1-tt,3.5);
              const rot=totalRot*eased;
              drawWheel(rot);
              if(tt<1){requestAnimationFrame(loop)}
              else{
                setTimeout(()=>{
                  setWheelResult({amount:r.amount,label:r.label,index:r.prizeIndex});
                  setWheelSpinning(false);
                  setWheelStatus({canSpin:false,nextSpinMs:24*3600*1000});
                  if(r.amount>=100000){document.body.classList.add("shakeHard");setTimeout(()=>document.body.classList.remove("shakeHard"),400);sndReveal(true)}
                  else sndReveal(false);
                },600);
              }
            };
            loop();
          }} style={{...S.btn,background:wheelSpinning?"#333":"linear-gradient(135deg,#ffd700,#fbbf24)",color:"#000",fontWeight:800,padding:"12px 36px",fontSize:16,boxShadow:wheelSpinning?"none":"0 4px 20px #ffd70044"}}>{wheelSpinning?t("wheel_spinning"):t("wheel_spin")}</button>}
        </div>

        <div style={{marginTop:14,padding:10,background:"#0d1117",border:"1px solid #1e2430",borderRadius:8,fontSize:10,color:"#64748b",textAlign:"center"}}>
          {t("wheel_rules")}
        </div>
      </>}
    </div>}

                {/* BLACKJACK */}
    {/* ═══════════ BLACKJACK ═══════════ */}
    {page==="bj"&&<div style={{...S.body,maxWidth:650,margin:"0 auto"}}>
      <div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:800,marginBottom:8}}>♠ Blackjack</div>
      {bjTable?(()=>{
        const me=bjTable.players.find(p=>p.user===account?.username);
        const myBet=me?me.bet:0;
        const myHandValue=me?me.handValue:null;
        const canJoin=bjHasCard&&!me&&(bjTable.phase==="waiting"||bjTable.phase==="intermission")&&bjTable.players.length<5;
        return <div>
          <div style={{background:"#0a3d0a",borderRadius:16,padding:"clamp(12px,3vw,24px)",position:"relative",border:"3px solid #0d4d0d",minHeight:200}}>
            <div style={{position:"absolute",top:8,right:12,color:"#ffd700",fontSize:11,fontWeight:700}}>Pot: {money(bjTable.pot)}</div>
            <div style={{position:"absolute",top:8,left:12,color:"#888",fontSize:10}}>Phase: {bjTable.phase} {bjTable.countdown>0?`(${bjTable.countdown}s)`:""}</div>
            {me&&<div style={{textAlign:"center",marginBottom:8,marginTop:18,padding:"6px 10px",background:"#4ade8011",border:"1px solid #4ade8033",borderRadius:6,fontSize:11,fontWeight:700,color:"#4ade80"}}>You bet {money(myBet)} {myHandValue!==null?"· Hand: "+myHandValue:""}</div>}
            <div style={{textAlign:"center",marginBottom:16,marginTop:8}}>
              <div style={{color:"#aaa",fontSize:10,marginBottom:4}}>DEALER {(bjTable.phase==="playing"||bjTable.phase==="finished")&&bjTable.dealerValue?"("+bjTable.dealerValue+")":""}</div>
              <div style={{display:"flex",gap:6,justifyContent:"center"}}>{(bjTable.dealer||[]).map((c,i)=><div key={i} className="bounceIn" style={{width:"clamp(36px,9vw,50px)",height:"clamp(52px,13vw,72px)",background:c.rank==="?"?"#1a1a2e":"#fff",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"clamp(14px,3.5vw,20px)",fontWeight:700,color:c.suit==="♥"||c.suit==="♦"?"#dc2626":"#111",border:"2px solid #333",boxShadow:"0 2px 8px #0004",animationDelay:i*0.1+"s"}}>{c.rank==="?"?"🂠":c.rank+c.suit}</div>)}</div>
            </div>
            <div style={{borderTop:"1px dashed #1a5e1a",paddingTop:12}}>
              {bjTable.players.length===0?<div style={{color:"#888",textAlign:"center",padding:10,fontSize:11}}>No players yet</div>:bjTable.players.map((p,i)=>{const isMe=p.user===account?.username;return <div key={i} style={{marginBottom:10,padding:8,background:isMe?"#ffffff10":"#00000020",borderRadius:8,border:isMe?"1px solid #4ade8044":"1px solid transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:isMe?"#4ade80":"#ccc",fontWeight:700,fontSize:11}}>{p.user}{isMe?" (YOU)":""}</span><span style={{color:"#888",fontSize:10}}>Bet: {money(p.bet)} {p.handValue!==null?"· "+p.handValue:""}</span></div>
                <div style={{display:"flex",gap:4}}>{(p.hand||[]).map((c,j)=><div key={j} className="bounceIn" style={{width:"clamp(32px,8vw,44px)",height:"clamp(46px,11.5vw,64px)",background:c.rank==="?"?"#1a1a2e":"#fff",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"clamp(12px,3vw,17px)",fontWeight:700,color:c.suit==="♥"||c.suit==="♦"?"#dc2626":"#111",border:isMe?"2px solid #4ade8044":"2px solid #333",animationDelay:(i*0.15+j*0.1)+"s"}}>{c.rank==="?"?"🂠":c.rank+c.suit}</div>)}</div>
                {p.result&&<div style={{marginTop:4,fontSize:11,fontWeight:700,color:p.result==="win"||p.result==="blackjack"?"#4ade80":p.result==="push"?"#f59e0b":"#eb4b4b"}}>{p.result==="blackjack"?"♠ BLACKJACK!":p.result==="win"?"WIN +"+money(p.payout):p.result==="push"?"PUSH "+money(p.payout):"BUST"}</div>}
              </div>})}
            </div>
          </div>
          {bjTable.phase==="playing"&&me&&me.status==="playing"&&<div style={{display:"flex",gap:6,justifyContent:"center",marginTop:12}}>
            <button onClick={async()=>{const r=await api("/bj/action",{username:account.username,tableId:"main",action:"hit"});if(r?.table)setBjTable(r.table)}} style={{...S.btn,background:"#4ade80",color:"#000",padding:"10px 20px",fontWeight:700}}>HIT</button>
            <button onClick={async()=>{const r=await api("/bj/action",{username:account.username,tableId:"main",action:"stand"});if(r?.table)setBjTable(r.table)}} style={{...S.btn,background:"#eb4b4b",color:"#fff",padding:"10px 20px",fontWeight:700}}>STAND</button>
            <button onClick={async()=>{if(st.bal<me.bet){setToast({msg:"Need "+money(me.bet),color:"#eb4b4b"});return}setSt(p=>({...p,bal:p.bal-me.bet}));const r=await api("/bj/action",{username:account.username,tableId:"main",action:"double"});if(r?.table)setBjTable(r.table)}} style={{...S.btn,background:"#f59e0b",color:"#000",padding:"10px 20px",fontWeight:700}}>DOUBLE</button>
          </div>}
          {bjTable.phase==="finished"&&me&&<div className="bounceIn" style={{textAlign:"center",padding:12,marginTop:8}}>
            <div style={{fontSize:22,fontWeight:800,color:me.result==="win"||me.result==="blackjack"?"#4ade80":me.result==="push"?"#f59e0b":"#eb4b4b"}}>{me.result==="blackjack"?"♠ BLACKJACK! ♠":me.result==="win"?"YOU WIN!":me.result==="push"?"PUSH":"You lost"}</div>
            {me.payout>0&&<div style={{color:"#4ade80",fontSize:18,fontWeight:700,marginTop:4}}>+{money(me.payout)}</div>}
            <div style={{color:"#888",fontSize:10,marginTop:8}}>Waiting for next round...</div>
          </div>}
          {canJoin&&<div style={{marginTop:12,padding:10,background:"#0d1117",borderRadius:8,textAlign:"center"}}>
            <div style={{color:"#4ade80",fontSize:11,marginBottom:6}}>Join this round!</div>
            <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",marginBottom:6}}>{[10000,50000,100000,500000,1000000].map(a=><button key={a} onClick={()=>setBjBet(String(a))} style={{...S.btn,background:bjBet===String(a)?"#f59e0b33":"#ffffff08",color:bjBet===String(a)?"#f59e0b":"#888",padding:"3px 8px",fontSize:9}}>{money(a)}</button>)}</div>
            <input value={bjBet} onChange={e=>setBjBet(e.target.value.replace(/[^0-9]/g,""))} placeholder="Bet (min $10K)" style={{...S.input,width:140,textAlign:"center",marginBottom:6}}/>
            <div><button onClick={async()=>{const bet=parseInt(bjBet);if(!bet||bet<10000||bet>st.bal){setToast({msg:bet>st.bal?"Not enough":"Min $10K",color:"#eb4b4b"});return}const r=await api("/bj/join",{username:account.username,token:account.token,tableId:"main",bet,slot});if(r?.ok){if(r.serverBal!==null&&r.serverBal!==undefined){lastServerActionRef.current=Date.now();setSt(p=>{const ns={...p,bal:r.serverBal};save(ns,drops);return ns})}setToast({msg:"Joined! Wait for round start",color:"#4ade80"});const s=await api("/bj/state",{tableId:"main",username:account.username});if(s?.table)setBjTable(s.table)}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}}} style={{...S.btn,background:"#4ade80",color:"#000",padding:"8px 20px",fontWeight:700}}>Join with {money(parseInt(bjBet)||10000)}</button></div>
          </div>}
          {!bjHasCard&&!me&&<div style={{marginTop:12,padding:10,background:"#0d1117",borderRadius:8,textAlign:"center"}}>
            <div style={{color:"#888",fontSize:11,marginBottom:6}}>You're spectating. Buy a card to play:</div>
            <button onClick={async()=>{if(st.bal<50000){setToast({msg:"Need $50,000",color:"#eb4b4b"});return}const r=await api("/bj/buycard",{username:account?.username,token:account?.token});if(r?.ok){setBjHasCard(true);setSt(p=>{const ns={...p,bal:p.bal-50000};save(ns,drops);return ns});setToast({msg:"Card purchased!",color:"#4ade80"})}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} style={{...S.btn,background:"#f59e0b",color:"#000",padding:"8px 20px",fontWeight:700}}>Buy Card ($50K)</button>
          </div>}
          {me&&bjTable.phase==="waiting"&&<div style={{textAlign:"center",color:"#f59e0b",marginTop:8,fontSize:11}}>Waiting... {bjTable.countdown>0?`Starting in ${bjTable.countdown}s`:`${bjTable.players.length}/5 players`}</div>}
        </div>
      })():<div style={{color:"#888",textAlign:"center",padding:20}}>Loading table...</div>}
    </div>}

    {/* BITCOIN */}
    {/* ═══════════ BITCOIN ═══════════ */}
    {page==="btc"&&<div style={{...S.body,maxWidth:650,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
        <div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:800}}>₿ Bitcoin Investment</div>
        {btcLastUpdate>0&&<div style={{fontSize:10,color:"#888",textAlign:"right"}}>
          <div>Updated {(()=>{const s=Math.floor((Date.now()-btcLastUpdate)/1000);return s<60?s+"s ago":Math.floor(s/60)+"m ago"})()}</div>
          {btcNextUpdate>0&&<div style={{color:"#4ade80"}}>Next: {Math.max(0,Math.ceil((btcNextUpdate-Date.now())/1000))}s</div>}
        </div>}
      </div>
      {(()=>{
      const chartW=Math.min(600,typeof window!=="undefined"?window.innerWidth-40:560),chartH=180;
      const prices=btcHistory||[];const minP=prices.length?Math.min(...prices.map(p=>p.v)):0,maxP=prices.length?Math.max(...prices.map(p=>p.v)):1,rangeP=maxP-minP||1;
      const pts=prices.map((p,i)=>{const x=(i/(prices.length-1||1))*chartW;const y=chartH-((p.v-minP)/rangeP)*chartH*0.85-10;return x+","+y}).join(" ");
      return <div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
          <div><div style={{color:"#888",fontSize:9}}>BTC PRICE</div><div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}><div style={{color:"#f59e0b",fontSize:"clamp(20px,5vw,28px)",fontWeight:800}}>${btcPrice.toLocaleString(undefined,{maximumFractionDigits:0})}</div>{btcChange24h!==0&&<div style={{color:btcChange24h>=0?"#4ade80":"#eb4b4b",fontSize:"clamp(11px,2.5vw,14px)",fontWeight:700}}>{btcChange24h>=0?"▲":"▼"} {Math.abs(btcChange24h).toFixed(2)}%</div>}</div></div>
          <div style={{display:"flex",gap:4}}>{[1,7,30,90].map(d=><button key={d} onClick={()=>setBtcDays(d)} style={{...S.btn,background:btcDays===d?"#f59e0b22":"#ffffff08",color:btcDays===d?"#f59e0b":"#666",padding:"3px 8px",fontSize:9}}>{d}D</button>)}</div>
        </div>
        {prices.length>2&&!isNaN(minP)&&!isNaN(maxP)?<svg width={chartW} height={chartH} style={{display:"block",marginBottom:12}}><defs><linearGradient id="btcG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity=".2"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/></linearGradient></defs><polygon points={"0,"+chartH+" "+pts+" "+chartW+","+chartH} fill="url(#btcG)"/><polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth="2"/>{prices.length>0&&<circle cx={chartW} cy={parseFloat(pts.split(" ").pop().split(",")[1])} r="3" fill="#f59e0b"/>}</svg>:<div style={{width:chartW,height:chartH,marginBottom:12,background:"#0d1117",border:"1px dashed #1e2430",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#555",fontSize:11}}>Loading chart...</div>}
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          <input value={btcInvestAmt} onChange={e=>setBtcInvestAmt(e.target.value.replace(/[^0-9]/g,""))} placeholder="$ Amount" style={{...S.btn,background:"#0d1117",border:"1px solid #333",padding:"8px 12px",width:120,textAlign:"center",color:"#e2e8f0"}}/>
          {[10000,50000,100000,500000].map(a=><button key={a} onClick={()=>setBtcInvestAmt(String(a))} style={{...S.btn,background:"#ffffff08",color:"#888",padding:"3px 8px",fontSize:9}}>{money(a)}</button>)}
          <button onClick={async()=>{const amt=parseInt(btcInvestAmt);if(!amt||amt<=0||amt>st.bal){setToast({msg:"Invalid",color:"#eb4b4b"});return}if(!account){setToast({msg:"Login required",color:"#eb4b4b"});return}const r=await api("/btc/invest",{username:account.username,token:account.token,amount:amt,action:"buy",slot});if(r?.ok){if(r.serverBal!==null&&r.serverBal!==undefined){lastServerActionRef.current=Date.now();setSt(p=>{const ns={...p,bal:r.serverBal};save(ns,drops);return ns})}setToast({msg:"Bought "+r.btcAmount.toFixed(6)+" BTC @ $"+r.buyPrice.toLocaleString(),color:"#4ade80"});api("/btc/portfolio",{username:account.username,token:account.token}).then(r2=>{if(r2?.ok)setBtcPortfolio({active:r2.active||[],sold:r2.sold||[]})})}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}}} style={{...S.btn,background:"#4ade80",color:"#000",padding:"8px 16px",fontWeight:700}}>Buy BTC</button>
        </div>
        {btcPortfolio.active.length>0&&<div style={{marginBottom:12}}><div style={{color:"#888",fontSize:10,fontWeight:700,marginBottom:4}}>ACTIVE POSITIONS</div>{btcPortfolio.active.map(inv=>{const cur=inv.amount_btc*btcPrice;const pnl=cur-inv.amount_usd;const pnlPct=inv.amount_usd>0?((pnl/inv.amount_usd)*100).toFixed(1):0;return <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",background:"#0d1117",borderRadius:6,marginBottom:4,borderLeft:"3px solid "+(pnl>=0?"#4ade80":"#eb4b4b")}}>
          <div><div style={{fontSize:11,fontWeight:600,color:"#ccc"}}>{inv.amount_btc.toFixed(6)} BTC</div><div style={{fontSize:9,color:"#666"}}>Bought @ ${inv.buy_price.toLocaleString()}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:700,color:pnl>=0?"#4ade80":"#eb4b4b"}}>{pnl>=0?"+":""}${Math.round(pnl).toLocaleString()} ({pnlPct}%)</div>
          <button onClick={async()=>{const r=await api("/btc/invest",{username:account.username,token:account.token,investmentId:inv.id,action:"sell",slot});if(r?.ok){lastServerActionRef.current=Date.now();setSt(p=>{const newBal=(r.serverBal!==null&&r.serverBal!==undefined)?r.serverBal:p.bal+Math.round(r.sold);const ns={...p,bal:newBal};save(ns,drops);return ns});setToast({msg:"Sold for $"+Math.round(r.sold).toLocaleString()+(r.profit>=0?" (+$"+Math.round(r.profit).toLocaleString()+")":""),color:r.profit>=0?"#4ade80":"#eb4b4b"});api("/btc/portfolio",{username:account.username,token:account.token}).then(r2=>{if(r2?.ok)setBtcPortfolio({active:r2.active||[],sold:r2.sold||[]})})}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b",padding:"2px 8px",fontSize:9}}>Sell</button></div>
        </div>})}</div>}
        {btcPortfolio.sold.length>0&&<div><div style={{color:"#666",fontSize:9,fontWeight:700,marginBottom:4}}>HISTORY</div>{btcPortfolio.sold.slice(0,5).map(inv=>{const pnl=(inv.sell_price-inv.buy_price)*inv.amount_btc;return <div key={inv.id} style={{fontSize:9,color:pnl>=0?"#4ade80":"#eb4b4b",marginBottom:2}}>{pnl>=0?"+":""}${Math.round(pnl).toLocaleString()} · {inv.amount_btc.toFixed(4)} BTC · {new Date(inv.sold_at).toLocaleDateString()}</div>})}</div>}
      </div>})()}
    </div>}

    {/* HORSE RACING */}
    {/* ═══════════ HORSE RACING ═══════════ */}
    {page==="horse"&&<div style={{...S.body,maxWidth:600,margin:"0 auto"}}>
      <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700,marginBottom:12}}><MI n="emoji_nature" s={20}/> Horse Racing</div>
      {!horseRace?<div style={{display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
        <div style={{color:"#888",fontSize:"clamp(10px,2.5vw,12px)",textAlign:"center"}}>Pick a horse. 3 laps. 6x payout on win!</div>
        <div style={{display:"flex",gap:5,width:"100%",flexWrap:"wrap",justifyContent:"center"}}>{["Thunder","Lightning","Shadow","Storm","Blaze","Rocket","Phantom"].map((n,i)=>{const colors=["#eb4b4b","#3b82f6","#8b5cf6","#f59e0b","#4ade80","#f472b6","#06b6d4"];return <button key={i} onClick={()=>setHorsePick(i)} style={{...S.btn,background:horsePick===i?colors[i]+"33":colors[i]+"11",color:colors[i],border:"2px solid "+(horsePick===i?colors[i]:colors[i]+"33"),padding:"8px 10px",fontSize:"clamp(9px,2.2vw,12px)",fontWeight:700,flex:"1 1 65px",minWidth:60,transition:"all .2s"}}>{n}</button>})}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>{[100,500,1000,5000,10000].map(a=><button key={a} onClick={()=>setHorseBet(String(a))} style={{...S.btn,background:horseBet===String(a)?"#ffffff22":"#ffffff08",color:"#ccc",padding:"4px 10px",fontSize:10}}>{money(a)}</button>)}<button onClick={()=>setHorseBet(String(Math.floor(st.bal/2)))} style={{...S.btn,background:"#f59e0b22",color:"#f59e0b",padding:"4px 10px",fontSize:10}}>Half</button><button onClick={()=>setHorseBet(String(st.bal))} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b",padding:"4px 10px",fontSize:10}}>All In</button></div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{color:"#888",fontSize:12}}>Bet: $</span><input value={horseBet} onChange={e=>setHorseBet(e.target.value.replace(/[^0-9]/g,""))} placeholder="Amount" style={{...S.btn,background:"#0d1117",border:"1px solid #333",padding:"8px 12px",width:120,textAlign:"center",fontSize:14,color:"#e2e8f0"}}/></div>
        <button onClick={async()=>{const bet=parseInt(horseBet);if(!bet||bet<=0||bet>st.bal){setToast({msg:"Invalid bet",color:"#eb4b4b"});return}const r=await api("/horse/race",{bet,pick:horsePick,username:account?.username,token:account?.token,slot});if(r?.ok){
            // Apply server balance immediately — leaving during the 20s race no longer undoes the bet/win
            if(r.serverBal!==null&&r.serverBal!==undefined){lastServerActionRef.current=Date.now();setSt(p=>{const ns={...p,bal:r.serverBal};save(ns,drops);return ns})}
            const NH=r.horses.length,NS=r.horses[0].segments.length,cum=r.horses.map(hr=>{const c=[0];for(let j=0;j<NS;j++)c.push(c[j]+hr.segments[j]);return c}),mx=Math.max(...cum.map(c=>c[NS]));r._cum=cum;r._mx=mx;r._nh=NH;r._ns=NS;setHorseRace(r);setHorseAnim(0);const raceDur=20000;const t0=performance.now();const LAPS=3;const cols=r.horses.map(x=>x.color);const drawFrame=(t)=>{const cv=horseCanvasRef.current;if(!cv)return;const dpr=2,cw=cv.offsetWidth;if(!cw)return;const ch=Math.round(cw*0.62);cv.width=cw*dpr;cv.height=ch*dpr;cv.style.height=ch+"px";const g=cv.getContext("2d");g.scale(dpr,dpr);const W=cw,H=ch,cx=W/2,cy=H*0.44,rx=W*0.38,ry=H*0.32;g.fillStyle="#080b12";g.fillRect(0,0,W,H);g.beginPath();g.ellipse(cx,cy,rx+16,ry+16,0,0,Math.PI*2);g.fillStyle="#0e1220";g.fill();g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.strokeStyle="#1a2030";g.lineWidth=28;g.stroke();g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.strokeStyle="#141c2a";g.lineWidth=24;g.stroke();const sa=-Math.PI/2;const slx=cx+rx*Math.cos(sa),sly=cy+ry*Math.sin(sa);g.fillStyle="#f59e0b55";g.fillRect(slx-3,sly-15,6,30);g.fillStyle="#f59e0b";g.fillRect(slx-1,sly-15,2,30);g.font="bold "+Math.max(7,W*0.018|0)+"px sans-serif";g.textAlign="center";g.fillStyle="#f59e0b";g.fillText("S/F",slx,sly-20);const fIdx=t*NS,lo=Math.min(Math.floor(fIdx),NS),hi=Math.min(lo+1,NS),fr=fIdx-lo;const dists=cum.map(c=>c[lo]+(c[hi]-c[lo])*fr);const ranked=[...Array(NH)].map((_,i)=>({i,d:dists[i]})).sort((a,b)=>b.d-a.d);const tPos=f=>{const a=sa+f*Math.PI*2;return{x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)}};ranked.slice().reverse().forEach(({i:idx})=>{const d=dists[idx],lp=(d/mx)*LAPS,tf=lp%1,pt=tPos(tf),rk=ranked.findIndex(s=>s.i===idx),lane=(rk-Math.floor(NH/2))*3.8,ang=sa+tf*Math.PI*2,nx=-Math.sin(ang),ny=Math.cos(ang),px=pt.x+nx*lane,py=pt.y+ny*lane*(ry/rx),sz=Math.max(7,W*0.024|0),ip=idx===r.pick;g.beginPath();g.arc(px,py,sz+3,0,Math.PI*2);g.fillStyle=cols[idx]+"22";g.fill();g.beginPath();g.arc(px,py,sz,0,Math.PI*2);g.fillStyle=cols[idx];g.fill();if(ip){g.strokeStyle="#fff";g.lineWidth=2.5;g.stroke()}g.fillStyle="#fff";g.font="bold "+Math.max(6,sz*0.75|0)+"px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(String(idx+1),px,py+0.5)});g.textBaseline="alphabetic";g.fillStyle="#e2e8f0";g.font="bold "+Math.max(11,W*0.036|0)+"px sans-serif";g.textAlign="center";const fin=t>=1;if(fin){g.fillText("FINISH!",cx,cy-4);g.fillStyle=cols[r.winner];g.font="bold "+Math.max(9,W*0.026|0)+"px sans-serif";g.fillText(r.horses[r.winner].name+" WINS!",cx,cy+W*0.032)}else{const ll=Math.min(LAPS,Math.floor((dists[ranked[0].i]/mx)*LAPS)+1);g.fillText("Lap "+ll+" / "+LAPS,cx,cy-4);g.fillStyle=cols[ranked[0].i]+"bb";g.font=Math.max(8,W*0.02|0)+"px sans-serif";g.fillText(r.horses[ranked[0].i].name+" leads",cx,cy+W*0.03)}const lbY=cy+ry+30;const lbH2=NH*16+20;if(lbY+lbH2<H){g.fillStyle="#0c101888";g.fillRect(8,lbY,W-16,lbH2);ranked.forEach(({i:idx},pos)=>{const yy=lbY+8+pos*16;const lp=(dists[idx]/mx)*LAPS;const cl=Math.min(LAPS,Math.floor(lp));const ip=idx===r.pick;g.fillStyle=pos===0?"#ffd700":pos===1?"#c0c0c0":pos===2?"#cd7f32":"#555";g.font="bold 9px sans-serif";g.textAlign="left";g.fillText(fin?(r.horses[idx].place===1?"1st":r.horses[idx].place===2?"2nd":r.horses[idx].place===3?"3rd":r.horses[idx].place+"th"):String(pos+1),14,yy+10);g.beginPath();g.arc(34,yy+6,4,0,Math.PI*2);g.fillStyle=cols[idx];g.fill();g.fillStyle=cols[idx];g.font=(ip?"bold ":"")+"10px sans-serif";g.fillText(r.horses[idx].name+(ip?" ★":""),44,yy+10);g.fillStyle="#888";g.textAlign="right";g.fillText(fin?"Done":"L"+(cl+1),W-14,yy+10);if(!fin){const bx=W-70,bw=40,by=yy+2,bh=4;g.fillStyle="#1e2430";g.fillRect(bx,by,bw,bh);g.fillStyle=cols[idx];g.fillRect(bx,by,bw*((lp%1)),bh)}})}};const loop=()=>{const elapsed=performance.now()-t0;const t=Math.min(1,elapsed/raceDur);horseAnimRef.current=t;drawFrame(t);if(t<1){requestAnimationFrame(loop)}else{setHorseAnim(1);setTimeout(()=>{if(r.won){document.body.classList.add("shakeHard");setTimeout(()=>document.body.classList.remove("shakeHard"),500);sndReveal(true);setToast({msg:"WON $"+r.payout.toLocaleString()+"!",color:"#4ade80"});setHorseHistory(prev=>[{won:true,amount:r.payout,horse:r.horses[r.winner].name,t:Date.now()},...prev].slice(0,20))}else{sndReveal(false);setToast({msg:"Lost! "+r.horses[r.winner].name+" won",color:"#eb4b4b"});setHorseHistory(prev=>[{won:false,amount:r.bet,horse:r.horses[r.winner].name,t:Date.now()},...prev].slice(0,20))}},500)}};requestAnimationFrame(loop)}else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}}} disabled={!horseBet||parseInt(horseBet)<=0} style={{...S.btn,background:"#4ade80",color:"#000",padding:"12px 32px",fontSize:"clamp(13px,3.5vw,16px)",fontWeight:800}}>Race!</button>
      </div>:
      <div>
        <canvas ref={horseCanvasRef} style={{width:"100%",borderRadius:12,background:"#080b12",display:"block",border:"1px solid #1a2030"}}/>
        {horseAnim>=1&&<div className="bounceIn" style={{textAlign:"center",padding:16}}>
          <div style={{fontSize:"clamp(20px,6vw,32px)",fontWeight:800,color:horseRace.won?"#4ade80":"#eb4b4b",marginBottom:6}}>{horseRace.won?"YOU WON!":"Better luck next time"}</div>
          <div style={{color:horseRace.won?"#4ade80":"#eb4b4b",fontSize:"clamp(16px,4vw,24px)",fontWeight:700}}>{horseRace.won?"+$"+horseRace.payout.toLocaleString():"-$"+horseRace.bet.toLocaleString()}</div>
          <div style={{color:"#888",fontSize:12,marginTop:6}}>{horseRace.horses[horseRace.winner].name} wins the race!</div>
          <button onClick={()=>{setHorseRace(null);setHorseAnim(0)}} style={{...S.btn,background:"#4ade80",color:"#000",padding:"10px 28px",marginTop:14,fontWeight:700,fontSize:14}}>Race Again</button>
        </div>}
      </div>}
    </div>}

    {/* PROFILE VIEW MODAL */}
    {confirmModal&&<div style={S.overlay} onClick={()=>{confirmModal.resolve&&confirmModal.resolve(false);setConfirmModal(null)}}><div className="modalIn" style={{...S.modal,maxWidth:360,padding:20}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:15,fontWeight:700,color:confirmModal.color||"#e2e8f0",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>{confirmModal.icon&&<MI n={confirmModal.icon} s={20} c={confirmModal.color||"#e2e8f0"}/>}{confirmModal.title||"Confirm"}</div>
      <div style={{color:"#94a3b8",fontSize:12,marginBottom:16,lineHeight:1.5}}>{confirmModal.message}</div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>{confirmModal.resolve&&confirmModal.resolve(false);setConfirmModal(null)}} style={{...S.btn,background:"#ffffff08",color:"#888",flex:1,padding:9}}>{confirmModal.cancel||"Cancel"}</button>
        <button onClick={()=>{confirmModal.resolve&&confirmModal.resolve(true);setConfirmModal(null)}} style={{...S.btn,background:confirmModal.color||"#3b82f6",color:"#fff",flex:1,padding:9,fontWeight:700}} autoFocus>{confirmModal.ok||"Confirm"}</button>
      </div>
    </div></div>}
    {promptModal&&<div style={S.overlay} onClick={()=>{promptModal.resolve&&promptModal.resolve(null);setPromptModal(null)}}><div className="modalIn" style={{...S.modal,maxWidth:360,padding:20}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>{promptModal.icon&&<MI n={promptModal.icon} s={20}/>}{promptModal.title||"Input"}</div>
      {promptModal.message&&<div style={{color:"#94a3b8",fontSize:12,marginBottom:12,lineHeight:1.5}}>{promptModal.message}</div>}
      <input autoFocus type={promptModal.password?"password":"text"} value={promptModal.value||""} onChange={e=>setPromptModal(p=>({...p,value:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){promptModal.resolve&&promptModal.resolve(promptModal.value);setPromptModal(null)}else if(e.key==="Escape"){promptModal.resolve&&promptModal.resolve(null);setPromptModal(null)}}} placeholder={promptModal.placeholder||""} maxLength={promptModal.maxLength||500} style={{...S.input,width:"100%",fontSize:14,marginBottom:12}}/>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>{promptModal.resolve&&promptModal.resolve(null);setPromptModal(null)}} style={{...S.btn,background:"#ffffff08",color:"#888",flex:1,padding:9}}>Cancel</button>
        <button onClick={()=>{promptModal.resolve&&promptModal.resolve(promptModal.value);setPromptModal(null)}} style={{...S.btn,background:"#3b82f6",color:"#fff",flex:1,padding:9,fontWeight:700}}>{promptModal.ok||"OK"}</button>
      </div>
    </div></div>}
    {buckshotConfirm&&<div style={S.overlay} onClick={()=>setBuckshotConfirm(null)}><div className="modalIn" style={{...S.modal,maxWidth:400,padding:24,background:"linear-gradient(180deg,#1a0808,#0a0404)",border:"2px solid #5a1a1a",fontFamily:"'Special Elite',serif"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontFamily:"'Black Ops One',sans-serif",fontSize:22,letterSpacing:3,color:"#eb4b4b",textAlign:"center",textShadow:"0 0 10px #eb4b4b88",marginBottom:10}}>{buckshotConfirm.title}</div>
      <div style={{color:"#cbd5e1",fontSize:13,textAlign:"center",marginBottom:18,lineHeight:1.5}}>{buckshotConfirm.desc}</div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setBuckshotConfirm(null)} style={{...S.btnBuckshot,background:"#1a0808",color:"#888",border:"2px solid #333",flex:1,padding:14}}>CANCEL</button>
        <button onClick={async()=>{
          const target=buckshotConfirm.target;
          setBuckshotConfirm(null);
          const r=await api("/buckshot/shoot",{lobbyId:curLobby.id,username:account.username,target});
          if(r?.ok){
            if(r.winner){_SND.stopMusic();if(r.forceSync){await silentCloudSync()}if(r.winner===account.username){setToast({msg:"You won "+money(r.payout||0)+"!",color:"#4ade80"})}}
          }else setToast({msg:r?.error||"Failed",color:"#eb4b4b"});
        }} style={{...S.btnBuckshot,background:buckshotConfirm.target==="self"?"#3a0a0a":"#7a0a0a",color:"#fff",border:"2px solid "+(buckshotConfirm.target==="self"?"#eb4b4b":"#aa2828"),flex:2,padding:14}}>🔫 FIRE</button>
      </div>
    </div></div>}
    {showSoundModal&&<div style={S.overlay} onClick={()=>setShowSoundModal(false)}><div className="modalIn" style={{...S.modal,maxWidth:380,padding:20}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><MI n="volume_up" s={24} c="#3b82f6"/><div style={{fontSize:17,fontWeight:800}}>Sound Settings</div></div>
      {[{label:"SFX",vol:_SND.sfxVol,muted:_SND.sfxMuted,setVol:v=>{_SND.setSfxVol(v);setSoundVer(x=>x+1)},toggle:()=>{_SND.toggleSfx();setSoundVer(x=>x+1)}},{label:"Music",vol:_SND.musicVol,muted:_SND.musicMuted,setVol:v=>{_SND.setMusicVol(v);setSoundVer(x=>x+1)},toggle:()=>{_SND.toggleMusic();setSoundVer(x=>x+1)}}].map((s,i)=><div key={i} style={{marginBottom:14,padding:12,background:"#0d1117",borderRadius:8,border:"1px solid #1e2430"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,color:"#cbd5e1"}}>{s.label}</div>
          <button onClick={s.toggle} style={{...S.btn,background:s.muted?"#eb4b4b22":"#4ade8022",color:s.muted?"#eb4b4b":"#4ade80",fontSize:11,padding:"4px 10px",border:"1px solid "+(s.muted?"#eb4b4b44":"#4ade8044")}}><MI n={s.muted?"volume_off":"volume_up"} s={12}/> {s.muted?"Muted":"On"}</button>
        </div>
        <input type="range" min="0" max="1" step="0.05" value={s.vol} onChange={e=>s.setVol(parseFloat(e.target.value))} disabled={s.muted} style={{width:"100%",accentColor:s.muted?"#666":"#3b82f6",opacity:s.muted?0.4:1}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#666",marginTop:2}}><span>0%</span><span style={{color:s.muted?"#666":"#3b82f6",fontWeight:700}}>{Math.round(s.vol*100)}%</span><span>100%</span></div>
      </div>)}
      <button onClick={()=>setShowSoundModal(false)} style={{...S.btn,background:"#3b82f6",color:"#fff",width:"100%",fontWeight:700,padding:10}}>Done</button>
    </div></div>}
    {/* SUPER WIN MODAL — chroma/legendary item pop-out */}
    {superWin&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",zIndex:99997,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeUp .3s ease-out"}} onClick={()=>setSuperWin(null)}>
      <div onClick={e=>e.stopPropagation()} className={superWin.rarity==="legendary"?"legendaryPulse":"chromaSpin"} style={{position:"relative",padding:"clamp(20px,5vw,40px) clamp(24px,6vw,60px)",borderRadius:20,background:superWin.rarity==="legendary"?"linear-gradient(135deg,#1a1300,#0a0800,#1a1300)":"linear-gradient(135deg,#1a0a1a,#0a0a1a,#0a1a1a)",border:`3px solid ${superWin.rarity==="legendary"?"#ffd700":"#a855f7"}`,boxShadow:superWin.rarity==="legendary"?"0 0 60px #ffd70066, 0 0 120px #fbbf2444":"0 0 60px #a855f766, 0 0 120px #06b6d444",textAlign:"center",maxWidth:"92vw",animation:"bounceIn .6s ease-out"}}>
        <div style={{fontSize:"clamp(11px,2.8vw,14px)",letterSpacing:4,color:superWin.rarity==="legendary"?"#ffd700":"#a855f7",fontWeight:800,marginBottom:8,textTransform:"uppercase"}} className={superWin.rarity==="legendary"?"glow":"rainbowGlow"}>{superWin.rarity==="legendary"?"⭐ LEGENDARY DROP ⭐":"✨ CHROMA UNLOCKED ✨"}</div>
        <div style={{fontSize:"clamp(24px,8vw,52px)",fontWeight:900,letterSpacing:1,marginBottom:6,color:"#fff",textShadow:superWin.rarity==="legendary"?"0 0 30px #ffd700":"0 0 30px #a855f7"}}>{superWin.icon} {superWin.name}</div>
        <div style={{fontSize:"clamp(20px,5vw,36px)",fontWeight:800,color:"#4ade80",marginBottom:4,textShadow:"0 0 16px #4ade8088"}}>+{money(superWin.value)}</div>
        <div style={{fontSize:"clamp(9px,2.2vw,11px)",color:"#888",marginBottom:18}}>from {superWin.caseName}</div>
        <button onClick={()=>setSuperWin(null)} style={{...S.btn,background:superWin.rarity==="legendary"?"linear-gradient(135deg,#ffd700,#fbbf24)":"linear-gradient(135deg,#a855f7,#06b6d4)",color:"#000",fontWeight:800,padding:"10px 30px",fontSize:"clamp(11px,2.8vw,14px)",letterSpacing:2}}>AWESOME!</button>
      </div>
    </div>}
    {viewProfile&&<div style={S.overlay} onClick={()=>setViewProfile(null)}><div className="modalIn" style={{...S.modal,maxWidth:"clamp(300px,85vw,440px)"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:64,height:64,borderRadius:"50%",background:"#1e2430",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,overflow:"hidden",margin:"0 auto"}}>{viewProfile.pfp?<img src={viewProfile.pfp} style={{width:64,height:64,borderRadius:"50%",objectFit:"cover"}}/>:<MI n="person" s={32} c="#5a6478"/>}</div>
      <div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:700,display:"flex",alignItems:"center",gap:8,justifyContent:"center",flexWrap:"wrap"}}><StatusDot status={userStatusMap[viewProfile.username]||"offline"} size={10}/>{viewProfile.display_name||viewProfile.username||"Unknown"}</div>
      <div style={{color:"#888",fontSize:"clamp(9px,2.2vw,11px)",display:"flex",alignItems:"center",gap:6,justifyContent:"center",flexWrap:"wrap"}}>@{viewProfile.username||"?"} · {viewProfile.role||"user"} · <StatusDot status={userStatusMap[viewProfile.username]||"offline"} withLabel/></div>
      {viewProfile.uid&&<div style={{color:"#555",fontSize:"clamp(8px,2vw,9px)",fontFamily:"monospace",textAlign:"center"}}>ID: {viewProfile.uid}</div>}
      {viewProfile.bio&&viewProfile.privacy!=="private"&&<div style={{color:"#ccc",fontSize:"clamp(10px,2.5vw,12px)",fontStyle:"italic",textAlign:"center",padding:"4px 8px",wordBreak:"break-word"}}>{viewProfile.bio}</div>}
      {/* Always-public stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,width:"100%",fontSize:"clamp(8px,2vw,10px)"}}>
        {[["Level",viewProfile.level||1],["Wins",viewProfile.wins||0],["Losses",viewProfile.losses||0],["Win Rate",(viewProfile.win_rate||"0.0")+"%"],["Streak",viewProfile.win_streak||0],["Best",viewProfile.best_streak||0],["Opened",(viewProfile.total_opened||0).toLocaleString()],["Earned",viewProfile.total_earned!==undefined?money(viewProfile.total_earned||0):"?"],["Joined",viewProfile.created_at?new Date(viewProfile.created_at).toLocaleDateString():"?"]].map(([l,v])=><div key={l} style={{background:"#080a0e",padding:"4px 6px",borderRadius:4,textAlign:"center",overflow:"hidden"}}><div style={{color:"#555",fontSize:7,textTransform:"uppercase"}}>{l}</div><div style={{fontWeight:600,color:l==="Win Rate"&&parseFloat(v)>50?"#4ade80":l==="Win Rate"&&parseFloat(v)<50?"#eb4b4b":"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</div></div>)}</div>
      {viewProfile.privacy==="private"&&<div style={{color:"#888",fontSize:10,textAlign:"center"}}>Some details hidden (private profile)</div>}
      {viewProfile.warned>0&&<div style={{color:"#f59e0b",background:"#f59e0b11",padding:"4px 8px",borderRadius:6,fontSize:10,textAlign:"center"}}><MI n="warning" s={12} c="#f59e0b"/> Warned: {viewProfile.warn_reason}</div>}
      <div style={{display:"flex",gap:4,width:"100%",flexWrap:"wrap"}}>
        {account&&viewProfile.username!==account.username&&<button onClick={async()=>{const r=await api("/friends/add",{username:account.username,token:account.token,target:viewProfile.username});if(r?.ok)setToast({msg:r.action==="accepted"?"Friend accepted!":"Friend request sent!",color:"#4ade80"});else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} style={{...S.btn,background:viewProfile.friendStatus==="friends"?"#4ade8022":"#3b82f622",color:viewProfile.friendStatus==="friends"?"#4ade80":"#3b82f6",flex:1,border:"1px solid "+(viewProfile.friendStatus==="friends"?"#4ade8033":"#3b82f633")}}>{viewProfile.friendStatus==="friends"?"Friends ✓":viewProfile.friendStatus==="sent"?"Pending...":viewProfile.friendStatus==="received"?"Accept ✓":"+ Add Friend"}</button>}
        <button onClick={()=>{setDmTo(viewProfile.username);setViewProfile(null);setPage("dm")}} style={{...S.btn,background:"#8b5cf622",color:"#8b5cf6",flex:1}}>DM</button>
        {account&&viewProfile.username!==account.username&&<button onClick={()=>{setGiftModal({to:viewProfile.username,context:"profile"});setGiftAmt("")}} style={{...S.btn,background:"#ffd70022",color:"#ffd700",flex:1,border:"1px solid #ffd70033"}}><MI n="redeem" s={14}/> Gift $</button>}
        {account&&viewProfile.username!==account.username&&<button onClick={()=>setReportModal({targetUser:viewProfile.username,channel:"profile"})} style={{...S.btn,background:"#eb4b4b11",color:"#eb4b4b"}}><MI n="flag" s={14}/></button>}
        <button onClick={()=>setViewProfile(null)} style={{...S.btn,background:"#ffffff08",color:"#888",flex:1}}>Close</button>
      </div>
    </div></div>}

    {/* ONLINE MAP */}
    {/* ═══════════ WORLD MAP ═══════════ */}
    {page==="map"&&<div className="pageBody" style={S.body}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:"clamp(15px,4vw,20px)",fontWeight:700}}><MI n="public" s={20}/> Online Players</div>
        <button onClick={async()=>{const r=await getOnline();if(r)setOnlineData(r)}} style={{...S.btn,background:"#ffffff08",color:"#888"}}>Refresh</button>
      </div>
      <div style={{background:"#0d1117",border:"1px solid #151820",borderRadius:10,padding:"clamp(12px,3vw,20px)",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 6px #4ade80"}}/>
          <span style={{color:"#4ade80",fontWeight:700,fontSize:"clamp(16px,4vw,22px)"}}>{onlineData?.online||0}</span>
          <span style={{color:"#888"}}>players online</span>
        </div>
        {onlineData?.countries&&Object.entries(onlineData.countries).sort((a,b)=>b[1].count-a[1].count).map(([code,data])=>(
          <div key={code} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #151820"}}>
            <span style={{fontSize:"clamp(16px,4vw,22px)"}}>{code&&code!=="XX"&&code.length===2?String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6+c.charCodeAt(0)-65)):"🌐"}</span>
            <span style={{color:"#e2e8f0",fontWeight:600,flex:1}}>{code!=="XX"?code:"Unknown"}</span>
            <span style={{color:"#4ade80",fontWeight:700}}>{data.count}</span>
            <span style={{color:"#666",fontSize:"clamp(8px,2vw,10px)"}}>{data.players.slice(0,3).join(", ")}{data.players.length>3?"...":""}</span>
          </div>
        ))}
        {(!onlineData?.countries||Object.keys(onlineData.countries).length===0)&&<div style={{color:"#555",textAlign:"center",padding:20}}>No players online</div>}
      </div>
      <div style={{color:"#666",fontSize:"clamp(8px,2vw,10px)",textAlign:"center"}}>Location based on country only. No precise tracking.</div>
    </div>}

    {/* BAN MODAL */}
    {/* DAILY LOGIN BONUS MODAL */}
    {dailyModal&&dailyModal.canClaim&&<div style={S.overlay}><div className="modalIn" style={{...S.modal,maxWidth:420,padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 0%, #ffd70022, transparent 60%)",pointerEvents:"none"}}/>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
        <MI n="redeem" s={48} c="#ffd700" f={{filter:"drop-shadow(0 0 12px #ffd70088)",animation:"bounceIn .6s ease-out"}}/>
        <div style={{fontSize:22,fontWeight:800,color:"#ffd700"}}>{t("daily_title")}</div>
        <div style={{fontSize:11,color:"#94a3b8",textAlign:"center"}}>{t("daily_subtitle")}</div>
        {/* 7-day streak grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,width:"100%",margin:"8px 0"}}>
          {[5000,10000,25000,50000,100000,250000,1000000].map((amt,i)=>{
            const dayNum=i+1;
            const currentDay=Math.min((dailyModal.streak||0)+1,7);
            const isToday=dayNum===currentDay;
            const isPast=dayNum<currentDay;
            return <div key={i} style={{padding:"6px 2px",borderRadius:6,background:isToday?"#ffd70022":isPast?"#4ade8011":"#0d1117",border:"1px solid "+(isToday?"#ffd700":isPast?"#4ade8044":"#1e2430"),textAlign:"center",position:"relative",animation:isToday?"glow 2s infinite":"none"}}>
              <div style={{fontSize:9,color:isToday?"#ffd700":isPast?"#4ade80":"#666",fontWeight:700}}>{lang==="sv"?"DAG":"DAY"} {dayNum}</div>
              <div style={{fontSize:10,color:isToday?"#fff":isPast?"#4ade80":"#888",fontWeight:700,marginTop:2}}>{amt>=1000000?(amt/1000000)+"M":amt>=1000?(amt/1000)+"K":amt}</div>
              {isPast&&<div style={{position:"absolute",top:1,right:2,fontSize:9}}><MI n="check_circle" s={11} c="#4ade80"/></div>}
            </div>;
          })}
        </div>
        <button onClick={async()=>{
          const r=await api("/daily/claim",{username:account.username,token:account.token,slot});
          if(r?.ok){
            lastServerActionRef.current=Date.now();setSt(p=>{const newBal=(r.serverBal!==null&&r.serverBal!==undefined)?r.serverBal:p.bal+r.reward;const ns={...p,bal:newBal};save(ns,drops);return ns});
            setToast({msg:t("daily_claimed",{amount:r.reward.toLocaleString()}),color:"#4ade80"});
            setDailyStatus({canClaim:false,streak:r.streak,nextClaimMs:24*3600*1000});
            setDailyModal(null);
          }else{setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}
        }} style={{...S.btn,background:"linear-gradient(135deg,#ffd700,#fbbf24)",color:"#000",fontWeight:800,padding:"10px 28px",fontSize:14,marginTop:4,boxShadow:"0 4px 20px #ffd70044"}}>{t("daily_claim")} {(()=>{const rewards=[5000,10000,25000,50000,100000,250000,1000000];const day=Math.min((dailyModal.streak||0),6);return "$"+rewards[day].toLocaleString()})()}</button>
        <button onClick={()=>{setDailyModal(null);setDailyStatus({canClaim:true,streak:dailyModal.streak})}} style={{...S.btn,background:"transparent",color:"#64748b",fontSize:10,marginTop:4}}>{t("daily_later")}</button>
      </div>
    </div></div>}

    {giftModal&&<div style={S.overlay} onClick={()=>setGiftModal(null)}><div className="modalIn" style={{...S.modal,maxWidth:340}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:16,fontWeight:800,color:"#ffd700"}}><MI n="redeem" s={20} c="#ffd700"/> Gift money to @{giftModal.to}</div>
      <div style={{color:"#888",fontSize:11}}>Your balance: {money(st.bal)}</div>
      <input value={giftAmt} onChange={e=>setGiftAmt(e.target.value.replace(/[^0-9]/g,""))} placeholder="Amount in $" autoFocus style={{...S.input,width:"100%",fontSize:16,textAlign:"center"}} onKeyDown={async(e)=>{if(e.key==="Enter"){const amt=parseInt(giftAmt);if(!amt||amt<=0||amt>st.bal){setToast({msg:amt>st.bal?"Not enough":"Invalid amount",color:"#eb4b4b"});return}const r=await api("/gift",{username:account.username,token:account.token,to:giftModal.to,amount:amt,slot:slot});if(r?.ok){if(r.newBal!==undefined)setSt(p=>({...p,bal:r.newBal}));setToast({msg:"Sent $"+amt.toLocaleString()+"!",color:"#4ade80"});if(giftModal.context==="dm"){api("/dm/inbox",{username:account.username,token:account.token,after:lastDmIdRef.current}).then(r2=>{if(r2?.ok){const mx=Math.max(lastDmIdRef.current,...(r2.received||[]).map(m=>m.id||0),...(r2.sent||[]).map(m=>m.id||0));lastDmIdRef.current=mx;if(r2.incremental){setDmInbox(prev=>{if(!prev)return r2;const ex=new Set([...(prev.received||[]).map(m=>m.id),...(prev.sent||[]).map(m=>m.id)]);return{...prev,unread:r2.unread,received:[...(r2.received||[]).filter(m=>!ex.has(m.id)),...(prev.received||[])].slice(0,200),sent:[...(r2.sent||[]).filter(m=>!ex.has(m.id)),...(prev.sent||[])].slice(0,200)}})}else setDmInbox(r2)}})}setGiftModal(null)}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>{[1000,10000,100000,1000000].map(a=><button key={a} onClick={()=>setGiftAmt(String(a))} style={{...S.btn,background:giftAmt===String(a)?"#ffd70022":"#0d1117",border:"1px solid "+(giftAmt===String(a)?"#ffd700":"#1e2430"),color:giftAmt===String(a)?"#ffd700":"#888",padding:"4px 10px",fontSize:10}}>{a>=1000000?(a/1000000)+"M":(a/1000)+"K"}</button>)}<button onClick={()=>setGiftAmt(String(st.bal))} style={{...S.btn,background:"#eb4b4b22",color:"#eb4b4b",padding:"4px 10px",fontSize:10}}>All</button></div>
      <div style={{display:"flex",gap:6,width:"100%"}}>
        <button onClick={()=>setGiftModal(null)} style={{...S.btn,background:"#ffffff08",color:"#888",flex:1}}>Cancel</button>
        <button onClick={async()=>{const amt=parseInt(giftAmt);if(!amt||amt<=0||amt>st.bal){setToast({msg:amt>st.bal?"Not enough":"Invalid amount",color:"#eb4b4b"});return}const r=await api("/gift",{username:account.username,token:account.token,to:giftModal.to,amount:amt,slot:slot});if(r?.ok){if(r.newBal!==undefined)setSt(p=>({...p,bal:r.newBal}));setToast({msg:"Sent $"+amt.toLocaleString()+"!",color:"#4ade80"});if(giftModal.context==="dm"){api("/dm/inbox",{username:account.username,token:account.token,after:lastDmIdRef.current}).then(r2=>{if(r2?.ok){const mx=Math.max(lastDmIdRef.current,...(r2.received||[]).map(m=>m.id||0),...(r2.sent||[]).map(m=>m.id||0));lastDmIdRef.current=mx;if(r2.incremental){setDmInbox(prev=>{if(!prev)return r2;const ex=new Set([...(prev.received||[]).map(m=>m.id),...(prev.sent||[]).map(m=>m.id)]);return{...prev,unread:r2.unread,received:[...(r2.received||[]).filter(m=>!ex.has(m.id)),...(prev.received||[])].slice(0,200),sent:[...(r2.sent||[]).filter(m=>!ex.has(m.id)),...(prev.sent||[])].slice(0,200)}})}else setDmInbox(r2)}})}setGiftModal(null)}else setToast({msg:r?.error||"Failed",color:"#eb4b4b"})}} style={{...S.btn,background:"#ffd700",color:"#000",flex:2,fontWeight:700}}>Send {giftAmt&&parseInt(giftAmt)>0?"$"+parseInt(giftAmt).toLocaleString():""}</button>
      </div>
    </div></div>}
    {account&&page!=="dm"&&<button onClick={()=>{setPage("dm");if(account){api("/dm/inbox",{username:account.username,token:account.token}).then(r=>{if(r?.ok){setDmInbox(r);setDmUnread(0);const mx=Math.max(0,...(r.received||[]).map(m=>m.id||0),...(r.sent||[]).map(m=>m.id||0));if(mx>lastDmIdRef.current)lastDmIdRef.current=mx;api("/dm/read",{username:account.username,token:account.token})}})}}} style={{position:"fixed",bottom:16,right:16,zIndex:9000,width:56,height:56,borderRadius:"50%",background:dmUnread>0?"#3b82f6":"#1e2430",color:dmUnread>0?"#fff":"#888",border:"2px solid "+(dmUnread>0?"#3b82f6":"#2a3040"),boxShadow:"0 4px 12px #0008",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,transition:"all .2s"}} title="Messages"><MI n="chat" s={24}/>{dmUnread>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#eb4b4b",color:"#fff",borderRadius:"50%",minWidth:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,padding:"0 6px",border:"2px solid #0a0c10"}}>{dmUnread>9?"9+":dmUnread}</span>}</button>}
    {offline&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:999990,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}><MI n="wifi_off" s={48} c="#eb4b4b"/><div style={{color:"#eb4b4b",fontSize:20,fontWeight:800}}>Connection Lost</div><div style={{color:"#888",fontSize:12}}>Waiting for internet...</div><div className="pulse" style={{width:40,height:4,background:"#eb4b4b33",borderRadius:2,marginTop:8}}><div style={{width:"50%",height:"100%",background:"#eb4b4b",borderRadius:2,animation:"pulse 1.5s infinite"}}/></div></div>}
    {banModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.97)",zIndex:999999,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"linear-gradient(180deg,#1a0000,#0d0000)",border:"2px solid #eb4b4b",borderRadius:16,padding:"clamp(20px,5vw,36px)",maxWidth:420,width:"92vw",textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}><MI n="block" s={48} c="#eb4b4b"/></div><div style={{color:"#eb4b4b",fontWeight:800,fontSize:"clamp(20px,5vw,26px)",marginBottom:6}}>Account Banned</div><div style={{color:"#ff8888",fontSize:12,marginBottom:12,padding:"8px 14px",background:"#eb4b4b11",borderRadius:8,border:"1px solid #eb4b4b22"}}>{typeof banModal==="object"?banModal.reason:banModal}</div>{banTimer&&<div style={{marginBottom:14}}><div style={{color:"#f59e0b",fontSize:13,fontWeight:700,marginBottom:4}}>Time Ban</div><div style={{color:"#ffd700",fontSize:"clamp(18px,5vw,24px)",fontWeight:800,fontFamily:"JetBrains Mono,monospace",padding:"10px 16px",background:"#f59e0b11",borderRadius:8,border:"1px solid #f59e0b33"}}>{banTimer}</div></div>}{typeof banModal==="object"&&!banModal.expires&&<div style={{color:"#eb4b4b88",fontSize:11,marginBottom:10,fontWeight:600}}>Permanent Ban</div>}<div style={{color:"#888",fontSize:10,marginBottom:14}}>You cannot access the site while banned. Contact an admin if you think this is a mistake.</div><button onClick={()=>{setBanModal(null);location.reload()}} style={{...S.btn,background:"#eb4b4b",color:"#fff",padding:"10px 28px",fontSize:14,fontWeight:700}}>Reload</button></div></div>}

    {/* WARN MODAL */}
    {warnModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:999998,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#1a1000",border:"2px solid #f59e0b",borderRadius:16,padding:30,maxWidth:440,width:"90vw",textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}><MI n="warning" s={40} c="#f59e0b"/></div><div style={{color:"#f59e0b",fontWeight:800,fontSize:22,marginBottom:8}}>Warning</div><div style={{color:"#ccc",fontSize:13,marginBottom:16}}>You have been warned for: <b style={{color:"#f59e0b"}}>{warnModal}</b></div><div style={{color:"#888",fontSize:10,marginBottom:12}}>This warning will remain on your profile permanently.</div><label style={{display:"flex",gap:6,alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:11,color:"#aaa",cursor:"pointer"}}><input type="checkbox" id="__warnAck"/> I have read and understand this warning</label><button onClick={async()=>{if(!document.getElementById("__warnAck")?.checked){setToast({msg:"Check the box first",color:"#f59e0b"});return}await api("/warn/ack",{username:account?.username,token:account?.token});setWarnModal(null);setToast({msg:"Account reactivated",color:"#4ade80"})}} style={{...S.btn,background:"#f59e0b",color:"#000",padding:"10px 24px",fontSize:14}}>Reactivate Account</button></div></div>}

    {/* TOAST */}
    {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.color+"22",border:"1px solid "+toast.color+"44",color:toast.color,padding:"10px 20px",borderRadius:8,fontWeight:700,fontSize:"clamp(10px,2.5vw,13px)",zIndex:99999,pointerEvents:"none",animation:"bounceIn .4s ease-out",backdropFilter:"blur(8px)"}}>{toast.msg}</div>}
    {userMenu&&(()=>{
      const u=userMenu.name;
      const isMe=account&&u===account.username;
      const status=userStatusMap[u]||"offline";
      const closeMenu=()=>setUserMenu(null);
      return <div data-user-menu="1" style={{position:"fixed",top:Math.min(userMenu.y,window.innerHeight-260),left:Math.min(userMenu.x,window.innerWidth-220),background:"#0d1117",border:"1px solid #2a3040",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.5)",zIndex:99998,minWidth:180,maxWidth:240,padding:6,animation:"fadeUp .15s ease-out"}}>
        <div style={{padding:"8px 10px",borderBottom:"1px solid #1e2430",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
          <StatusDot status={status}/>
          <div style={{flex:1,fontSize:13,fontWeight:700,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u}</div>
        </div>
        {[
          ["person","View profile","#3b82f6",()=>{showProfile&&showProfile(u);closeMenu()}],
          !isMe&&account?["chat","Send DM","#a855f7",()=>{setPage("dm");setTimeout(()=>{const input=document.querySelector("[data-dm-to]");if(input)input.value=u;},100);closeMenu()}]:null,
          !isMe&&account?["person_add","Add friend","#4ade80",async()=>{const r=await api("/friend/request",{username:account.username,token:account.token,target:u});setToast({msg:r?.ok?"Friend request sent":r?.error||"Failed",color:r?.ok?"#4ade80":"#eb4b4b"});closeMenu()}]:null,
          !isMe&&account?["block","Block",  "#666",async()=>{const ok=await askConfirm({title:"Block user",message:"Block "+u+"? You won't see their messages or be matched with them.",ok:"Block",color:"#666",icon:"block"});if(!ok)return;const r=await api("/block",{username:account.username,token:account.token,target:u,action:"block"});setToast({msg:r?.ok?"Blocked "+u:r?.error||"Failed",color:r?.ok?"#888":"#eb4b4b"});closeMenu()}]:null,
          !isMe&&account?["flag","Report","#eb4b4b",async()=>{const reason=await askPrompt({title:"Report "+u,message:"Why are you reporting this user?",placeholder:"Reason (e.g. harassment, cheating, scam)",ok:"Submit Report",maxLength:200});if(!reason)return;api("/report",{username:account.username,token:account.token,target:u,reason}).then(r=>{setToast({msg:r?.ok?"Report submitted":r?.error||"Failed",color:r?.ok?"#4ade80":"#eb4b4b"})});closeMenu()}]:null,
          ["content_copy","Copy username","#888",()=>{navigator.clipboard?.writeText(u);setToast({msg:"Copied",color:"#4ade80"});closeMenu()}],
        ].filter(Boolean).map(([icon,label,color,act],i)=>
          <button key={i} onClick={act} style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"transparent",border:"none",color:color,padding:"7px 10px",fontSize:12,cursor:"pointer",textAlign:"left",borderRadius:4,fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background=color+"22"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <MI n={icon} s={16}/>{label}
          </button>
        )}
      </div>;
    })()}

    {/* REPORT MODAL */}
    {reportModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:99998,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setReportModal(null)}><div style={{background:"#0d1117",border:"1px solid #1e2430",borderRadius:12,padding:20,maxWidth:400,width:"92vw",display:"flex",flexDirection:"column",gap:8}} onClick={e=>e.stopPropagation()}>
      <div style={{fontWeight:700,fontSize:16,color:"#eb4b4b"}}><MI n="flag" s={18} c="#eb4b4b"/> Report {reportModal.targetUser}</div>
      {reportModal.content&&<div style={{background:"#141820",borderRadius:6,padding:"6px 10px",fontSize:10,color:"#888",maxHeight:60,overflow:"hidden",border:"1px solid #1e2430"}}><span style={{color:"#555"}}>Content:</span> {reportModal.content}</div>}
      <div style={{color:"#888",fontSize:10}}>Select a reason:</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{["Harassment","NSFW","Hate speech","Spam","Threats","Impersonation","Scam","Other"].map(preset=><button key={preset} onClick={()=>setReportModal(p=>({...p,selectedPreset:preset}))} style={{background:reportModal.selectedPreset===preset?"#eb4b4b33":"#141820",border:"1px solid "+(reportModal.selectedPreset===preset?"#eb4b4b":"#1e2430"),borderRadius:6,padding:"5px 10px",color:reportModal.selectedPreset===preset?"#eb4b4b":"#888",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>{preset}</button>)}</div>
      <input value={reportModal.customReason||""} onChange={e=>setReportModal(p=>({...p,customReason:e.target.value.slice(0,200)}))} placeholder="Details (max 200 chars)" maxLength={200} style={{...S.input,width:"100%",fontSize:11}}/>
      <div style={{color:"#555",fontSize:9,textAlign:"right"}}>{(reportModal.customReason||"").length}/200</div>
      <button onClick={async()=>{if(!reportModal.selectedPreset){setToast({msg:"Select a reason",color:"#eb4b4b"});return}const fullReason=reportModal.selectedPreset+(reportModal.customReason?" - "+reportModal.customReason:"");const r=await api("/report/chat",{username:account.username,token:account.token,targetUser:reportModal.targetUser,preset:reportModal.selectedPreset,messageId:reportModal.messageId||0,channel:reportModal.channel||"global",reason:fullReason,content:reportModal.content||""});setReportModal(null);setToast(r?.ok?{msg:"Report submitted!",color:"#4ade80"}:{msg:r?.error||"Failed",color:"#eb4b4b"})}} disabled={!reportModal.selectedPreset} style={{...S.btn,background:reportModal.selectedPreset?"#eb4b4b":"#333",color:"#fff",padding:"10px",fontSize:12,fontWeight:700}}>Submit Report</button>
      <button onClick={()=>setReportModal(null)} style={{background:"#ffffff08",border:"none",padding:"6px 16px",borderRadius:6,color:"#666",cursor:"pointer",fontFamily:"inherit",fontSize:10}}>Cancel</button>
    </div></div>}

  </div>);
}

const CSS=`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');.material-symbols-rounded{font-family:'Material Symbols Rounded';font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:'liga';font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}*{box-sizing:border-box;margin:0;padding:0;color:inherit}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#222;border-radius:2px}::-webkit-scrollbar-track{background:transparent}button{color:inherit!important}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes glow{0%,100%{box-shadow:0 0 5px #ffd70033}50%{box-shadow:0 0 20px #ffd70066}}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}@keyframes bounceIn{0%{opacity:0;transform:scale(.3)}50%{transform:scale(1.05)}70%{transform:scale(.95)}100%{opacity:1;transform:scale(1)}}.fadeUp{animation:fadeUp .4s ease-out}.bounceIn{animation:bounceIn .5s ease-out}.slideIn{animation:slideIn .3s ease-out}.pulse{animation:pulse 1.5s infinite}.glow{animation:glow 2s infinite}@keyframes epicGlow{0%{box-shadow:0 0 5px #ffd70033,0 0 10px #ffd70011}25%{box-shadow:0 0 20px #ffd70066,0 0 40px #ffd70033,0 0 80px #ffd70011}50%{box-shadow:0 0 30px #ffd70099,0 0 60px #ffd70044,0 0 100px #ffd70022}75%{box-shadow:0 0 20px #ffd70066,0 0 40px #ffd70033}100%{box-shadow:0 0 5px #ffd70033,0 0 10px #ffd70011}}@keyframes rainbowGlow{0%{box-shadow:0 0 20px #ff000066,0 0 40px #ff000033}16%{box-shadow:0 0 20px #ff880066,0 0 40px #ff880033}33%{box-shadow:0 0 20px #ffff0066,0 0 40px #ffff0033}50%{box-shadow:0 0 20px #00ff0066,0 0 40px #00ff0033}66%{box-shadow:0 0 20px #0088ff66,0 0 40px #0088ff33}83%{box-shadow:0 0 20px #8800ff66,0 0 40px #8800ff33}100%{box-shadow:0 0 20px #ff000066,0 0 40px #ff000033}}@keyframes legendaryPulse{0%{transform:scale(1);filter:brightness(1)}25%{transform:scale(1.03);filter:brightness(1.3)}50%{transform:scale(1);filter:brightness(1.5)}75%{transform:scale(1.03);filter:brightness(1.3)}100%{transform:scale(1);filter:brightness(1)}}@keyframes shakeHard{0%,100%{transform:translate(0)}10%{transform:translate(-8px,4px)}20%{transform:translate(6px,-6px)}30%{transform:translate(-4px,8px)}40%{transform:translate(8px,-4px)}50%{transform:translate(-6px,6px)}60%{transform:translate(4px,-8px)}70%{transform:translate(-8px,4px)}80%{transform:translate(6px,6px)}90%{transform:translate(-4px,-4px)}}@keyframes chromaSpin{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}@keyframes particles{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(0.3)}}.epicGlow{animation:epicGlow 2s ease-in-out infinite}.rainbowGlow{animation:rainbowGlow 3s linear infinite}.legendaryPulse{animation:legendaryPulse 1.5s ease-in-out infinite}.shakeHard{animation:shakeHard .5s ease-in-out}.chromaSpin{animation:chromaSpin 4s linear infinite}@keyframes moneyRain{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes rainbowFilter{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}@keyframes brainSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.effectShake{animation:shakeHard 0.3s infinite!important}.effectInvert{filter:invert(1)!important}.effectBlur{filter:blur(2px)!important}.effectRainbow{animation:rainbowFilter 2s linear infinite!important}.effectRotate{animation:brainSpin 4s linear infinite!important}@keyframes bigWinFlash{0%{background:rgba(255,215,0,0)}30%{background:rgba(255,215,0,0.5)}100%{background:rgba(255,215,0,0)}}.bigWinFlash{position:fixed;inset:0;pointer-events:none;z-index:9998;animation:bigWinFlash .5s ease-out}@keyframes particleBurst{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0.3) rotate(var(--rot))}}.particle{position:absolute;top:50%;left:50%;width:8px;height:8px;border-radius:50%;pointer-events:none;animation:particleBurst 1.2s ease-out forwards}@keyframes balanceTick{0%{color:#ffd700;transform:scale(1.1)}100%{color:inherit;transform:scale(1)}}.balanceTick{animation:balanceTick .4s ease-out}@keyframes itemUse{0%{transform:scale(1);opacity:1;box-shadow:0 0 0 #ffd70000}40%{transform:scale(1.4);opacity:1;box-shadow:0 0 24px #ffd700cc}100%{transform:scale(0);opacity:0;box-shadow:0 0 0 #ffd70000}}.itemUseAnim{animation:itemUse .6s ease-out forwards}@keyframes turnPulse{0%,100%{box-shadow:inset 0 0 0 2px #eb4b4b}50%{box-shadow:inset 0 0 0 2px #eb4b4b,0 0 12px #eb4b4baa}}.turnPulse{animation:turnPulse 1.8s ease-in-out infinite}@keyframes timerWarn{0%,100%{color:#f59e0b}50%{color:#eb4b4b}}.timerWarn{animation:timerWarn .8s ease-in-out infinite}button{cursor:pointer;font-family:inherit;transition:transform .15s ease,opacity .15s ease,box-shadow .2s ease}button:active:not(:disabled){transform:scale(.95)}button:hover:not(:disabled){opacity:0.9}button:disabled{opacity:.3;cursor:not-allowed}.caseCardHover{transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease,border-color .25s ease}.caseCardHover:hover{transform:translateY(-4px) scale(1.03);box-shadow:0 12px 32px var(--c,#4ade80)55,0 0 24px var(--c,#4ade80)33;border-color:var(--c,#4ade80)cc!important}@keyframes pageSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes tabPop{0%{transform:scale(0.95)}50%{transform:scale(1.05)}100%{transform:scale(1)}}@keyframes legendaryTextGlow{0%,100%{filter:drop-shadow(0 0 8px #ffd70088)}50%{filter:drop-shadow(0 0 24px #ffd700)}}.tabPop{animation:tabPop .25s ease-out}input:focus,select:focus,textarea:focus{outline:none!important;border-color:transparent!important;background-color:#080a0e!important;background-image:linear-gradient(90deg,#4ade80 50%,transparent 50%),linear-gradient(90deg,#4ade80 50%,transparent 50%),linear-gradient(0deg,#4ade80 50%,transparent 50%),linear-gradient(0deg,#4ade80 50%,transparent 50%)!important;background-position:0 0,100% 100%,0 100%,100% 0!important;background-repeat:repeat-x,repeat-x,repeat-y,repeat-y!important;background-size:14px 2px,14px 2px,2px 14px,2px 14px!important;animation:marchAnts 0.5s linear infinite}@keyframes marchAnts{from{background-position:0 0,100% 100%,0 100%,100% 0}to{background-position:14px 0,calc(100% - 14px) 100%,0 calc(100% + 14px),100% calc(0% - 14px)}}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role=button]:focus-visible{outline:2px solid #4ade80;outline-offset:2px}select{-webkit-appearance:none;appearance:none}@keyframes gunRecoil{0%{transform:translateY(0) rotate(0)}15%{transform:translateY(-12px) rotate(-3deg)}30%{transform:translateY(-6px) rotate(-1deg)}100%{transform:translateY(0) rotate(0)}}.gunRecoil{animation:gunRecoil .45s ease-out}@keyframes gunClick{0%{transform:translateX(0)}30%{transform:translateX(-3px)}60%{transform:translateX(2px)}100%{transform:translateX(0)}}.gunClick{animation:gunClick .25s ease-out}@keyframes muzzleFlash{0%{opacity:0;transform:scale(.3)}25%{opacity:1;transform:scale(1.4)}100%{opacity:0;transform:scale(1.8)}}.muzzleFlash{position:absolute;width:80px;height:80px;background:radial-gradient(circle,#fff 0%,#ffd700 30%,#ff6600 60%,transparent 80%);border-radius:50%;pointer-events:none;animation:muzzleFlash .4s ease-out forwards;z-index:5}@keyframes hpDamage{0%{transform:scale(1);background:#eb4b4b}50%{transform:scale(.6);background:#7a0a0a;box-shadow:0 0 16px #eb4b4b}100%{transform:scale(0);opacity:0;background:#3a0808}}.hpDamage{animation:hpDamage .6s ease-out forwards}@keyframes redFlash{0%{background:rgba(235,75,75,0)}30%{background:rgba(235,75,75,0.4)}100%{background:rgba(235,75,75,0)}}.redFlash{position:fixed;inset:0;pointer-events:none;z-index:9996;animation:redFlash .6s ease-out forwards}@keyframes blankPuff{0%{opacity:0;transform:scale(.5)}40%{opacity:.6;transform:scale(1.4)}100%{opacity:0;transform:scale(2)}}.blankPuff{position:absolute;width:60px;height:60px;background:radial-gradient(circle,#94a3b888 0%,#94a3b844 40%,transparent 80%);border-radius:50%;pointer-events:none;animation:blankPuff .7s ease-out forwards;z-index:5}@keyframes sawSlash{0%{transform:translateX(-100vw) rotate(-15deg);opacity:0}30%{opacity:1}50%{transform:translateX(0) rotate(0);opacity:1}100%{transform:translateX(100vw) rotate(15deg);opacity:0}}.sawSlash{position:fixed;top:40%;left:0;font-size:80px;pointer-events:none;z-index:9995;animation:sawSlash .8s ease-out forwards;filter:drop-shadow(0 0 12px #eb4b4b)}@keyframes magnifierPop{0%{transform:scale(.3) rotate(-20deg);opacity:0}40%{transform:scale(1.2) rotate(10deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:0}}.magnifierPop{position:fixed;top:50%;left:50%;margin-left:-40px;margin-top:-40px;font-size:80px;pointer-events:none;z-index:9995;animation:magnifierPop 1.2s ease-out forwards;filter:drop-shadow(0 0 12px #3b82f6)}@keyframes cigaretteGlow{0%{filter:drop-shadow(0 0 4px #4ade80)}50%{filter:drop-shadow(0 0 20px #4ade80) drop-shadow(0 0 40px #4ade80)}100%{filter:drop-shadow(0 0 4px #4ade80)}}.cigaretteGlow{animation:cigaretteGlow 1.4s ease-out}@keyframes beerEject{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-200px) rotate(720deg);opacity:0}}.beerEject{position:absolute;font-size:36px;pointer-events:none;z-index:6;animation:beerEject 1s ease-out forwards}@keyframes handcuffChain{0%,100%{transform:scale(1) rotate(-5deg);opacity:1}50%{transform:scale(1.15) rotate(5deg);opacity:1}}.handcuffChain{position:fixed;top:35%;left:50%;margin-left:-30px;font-size:60px;pointer-events:none;z-index:9995;animation:handcuffChain 1.3s ease-in-out forwards;filter:drop-shadow(0 0 12px #ffd700)}.pageBody{animation:pageSlideIn .3s ease-out}.modalIn{animation:bounceIn .35s cubic-bezier(.34,1.56,.64,1)}@keyframes invItemPop{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}.invItem{animation:invItemPop .35s ease-out both}.invItem:nth-child(2){animation-delay:.03s}.invItem:nth-child(3){animation-delay:.06s}.invItem:nth-child(4){animation-delay:.09s}.invItem:nth-child(5){animation-delay:.12s}.invItem:nth-child(6){animation-delay:.15s}.invItem:nth-child(7){animation-delay:.18s}.invItem:nth-child(8){animation-delay:.21s}.invItem:nth-child(9){animation-delay:.24s}.invItem:nth-child(n+10){animation-delay:.27s}.lobbyCard{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.lobbyCard:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(74,222,128,0.15);border-color:#4ade8044!important}.chatMsg{animation:slideIn .25s ease-out}@keyframes coinFlip{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}.coinFlip{animation:coinFlip .6s ease-out}@keyframes valueFlash{0%{background:#4ade8033}100%{background:transparent}}.valueFlash{animation:valueFlash .8s ease-out}@keyframes statBarFill{from{width:0}}.statBar>div{animation:statBarFill .8s ease-out}@keyframes ripple{to{transform:scale(2);opacity:0}}.rippleContainer{position:relative;overflow:hidden}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}`;

const S={
  root:{fontFamily:"'JetBrains Mono',monospace",background:"#0a0c10",color:"#e2e8f0",minHeight:"100vh",display:"flex",flexDirection:"column",fontSize:"clamp(11px,2.8vw,14px)"},
  hdr:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"clamp(8px,2vw,14px) clamp(12px,3vw,20px)",borderBottom:"1px solid #151820",flexWrap:"wrap",gap:6},
  title:{fontSize:"clamp(16px,4.5vw,22px)",fontWeight:800,letterSpacing:3,color:"#ccc"},
  hdrRight:{display:"flex",alignItems:"center",gap:"clamp(4px,1.5vw,8px)",flexWrap:"wrap"},
  chip:{display:"flex",flexDirection:"column",alignItems:"center",background:"#0d1117",border:"1px solid #151820",borderRadius:8,padding:"2px clamp(8px,2.5vw,14px)"},
  chipLbl:{color:"#777",fontSize:"clamp(7px,1.8vw,9px)",letterSpacing:1},
  // Buckshot Roulette theme — Special Elite (typewriter) for body, Black Ops One for headers
  buckshotPanel:{fontFamily:"'Special Elite',serif",background:"linear-gradient(180deg,#1a0808,#0a0404)",border:"2px solid #5a1a1a",borderRadius:6,padding:14,boxShadow:"inset 0 0 40px rgba(0,0,0,0.6)"},
  buckshotTitle:{fontFamily:"'Black Ops One',sans-serif",fontSize:18,fontWeight:400,letterSpacing:3,color:"#eb4b4b",textTransform:"uppercase",textShadow:"0 0 8px #eb4b4b66"},
  btnBuckshot:{fontFamily:"'Black Ops One',sans-serif",letterSpacing:2,textTransform:"uppercase",fontSize:13,padding:"10px 18px",borderRadius:4,border:"2px solid currentColor",cursor:"pointer",transition:"all .15s"},
  rentChip:{background:"#f59e0b0a",border:"1px solid #f59e0b1a",borderRadius:8,padding:"4px 10px",fontSize:"clamp(9px,2.2vw,11px)",color:"#f59e0b",fontWeight:600},
  nav:{display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",gap:3,padding:"6px clamp(12px,3vw,20px)",borderBottom:"1px solid #151820",flexWrap:"wrap"},
  tab:{background:"#1a1f2e",border:"1px solid #2a3040",color:"#e2e8f0",padding:"6px 12px",fontSize:"clamp(10px,2.5vw,13px)",fontWeight:600,borderRadius:6,transition:"all .15s"},
  tabOn:{background:"#2a3548",color:"#fff",border:"1px solid #4ade8055"},
  body:{padding:"clamp(12px,3vw,20px)",flex:1,maxWidth:960,margin:"0 auto",width:"100%",overflowX:"hidden"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(clamp(110px,22vw,150px),1fr))",gap:"clamp(6px,1.5vw,10px)"},
  card:{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",minWidth:0,border:"1px solid",borderRadius:12,padding:"clamp(6px,1.5vw,10px)",display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxShadow:"0 4px 24px rgba(0,0,0,0.3)"},
  cardIcon:{width:"clamp(36px,9vw,52px)",height:"clamp(36px,9vw,52px)",borderRadius:10,border:"1px solid",display:"flex",alignItems:"center",justifyContent:"center"},
  cardName:{fontWeight:700,fontSize:"clamp(10px,2.6vw,13px)",textAlign:"center"},
  cardPrice:{fontWeight:800,fontSize:"clamp(13px,3.5vw,18px)"},
  btn:{border:"none",padding:"clamp(7px,1.8vw,10px) clamp(10px,3vw,16px)",borderRadius:6,fontWeight:700,fontSize:"clamp(10px,2.5vw,13px)",transition:"all .15s"},
  scrollOuter:{position:"relative",marginBottom:14},
  marker:{position:"absolute",top:0,bottom:0,left:"50%",width:2,background:"#ffd700",zIndex:10,transform:"translateX(-50%)",boxShadow:"0 0 10px #ffd70044"},
  scrollClip:{overflow:"hidden",borderRadius:8,border:"1px solid #151820",background:"#080a0e"},
  strip:{display:"flex",willChange:"transform"},
  sItem:{width:"16%",minWidth:"16%",aspectRatio:"1/1.15",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderBottom:"3px solid",padding:2,flexShrink:0,transition:"background .3s,transform .3s"},
  iList:{display:"flex",flexDirection:"column",gap:1},
  iHdr:{display:"grid",gridTemplateColumns:"1fr 80px 65px 50px",padding:"4px 8px",fontSize:"clamp(7px,1.8vw,10px)",color:"#444",textTransform:"uppercase",letterSpacing:1},
  iRow:{display:"grid",gridTemplateColumns:"1fr 80px 65px 50px",padding:"6px 8px",background:"#0d1117",borderLeft:"2px solid",borderRadius:3,fontSize:"clamp(8px,2.2vw,11px)",alignItems:"center"},
  invG:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(clamp(140px,38vw,200px),1fr))",gap:6},
  invI:{background:"#0d1117",borderRadius:6,padding:"8px 10px",borderLeft:"2px solid",display:"flex",flexDirection:"column",gap:2,border:"1px solid transparent"},
  stG:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(clamp(120px,35vw,170px),1fr))",gap:8},
  stI:{background:"#0d1117",border:"1px solid #151820",borderRadius:8,padding:"clamp(8px,2.5vw,14px)",display:"flex",flexDirection:"column",gap:3},
  loanBox:{background:"#0d1117",border:"1px solid #151820",borderRadius:12,padding:"clamp(14px,4vw,24px)"},
  input:{background:"#080a0e",border:"1px solid #151820",borderRadius:6,padding:"8px 12px",color:"#e2e8f0",fontSize:"clamp(11px,2.8vw,14px)",fontFamily:"inherit",width:"clamp(100px,30vw,140px)"},
  sel:{background:"#080a0e",border:"1px solid #151820",borderRadius:6,padding:"5px 8px",color:"#e2e8f0",fontSize:"clamp(9px,2.2vw,11px)",fontFamily:"inherit"},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999},
  modal:{background:"#141820",border:"1px solid #1e2430",borderRadius:14,padding:"clamp(20px,5vw,32px)",display:"flex",flexDirection:"column",alignItems:"center",gap:10,maxWidth:"clamp(280px,80vw,400px)",width:"100%"},
  slotBtn:{background:"#0d1117",border:"1px solid #1e2430",borderRadius:12,padding:"clamp(14px,3.5vw,20px)",display:"flex",flexDirection:"column",gap:6,cursor:"pointer",fontFamily:"inherit",color:"#e2e8f0",width:"100%",transition:"all .15s",fontSize:"clamp(11px,2.8vw,14px)"},
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));