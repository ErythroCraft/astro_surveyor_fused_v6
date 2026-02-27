// Astro Surveyor — Minimal v4
// Focus: multi-frame tracking + photometry (ZP) + AU physics model scaffold + RGB→(B−V)* heuristic.

const $ = (id)=>document.getElementById(id);

const els = {
  status: $("status"),
  drop: $("drop"),
  files: $("files"),
  clear: $("clear"),
  run: $("run"),

  pickRef: $("pickRef"),
  refMag: $("refMag"),
  rAp: $("rAp"),
  rIn: $("rIn"),
  rOut: $("rOut"),
  fluxMode: $("fluxMode"),
  refReadout: $("refReadout"),

  align: $("align"),
  ds: $("ds"),
  thrMode: $("thrMode"),
  thrManualBox: $("thrManualBox"),
  thrManual: $("thrManual"),
  k: $("k"),
  minArea: $("minArea"),
  matchDist: $("matchDist"),
  minLen: $("minLen"),
  minDisp: $("minDisp"),
  showAll: $("showAll"),

  rAU: $("rAU"),
  dAU: $("dAU"),
  alpha: $("alpha"),
  beta: $("beta"),
  H: $("H"),
  phaseMode: $("phaseMode"),
  modelTol: $("modelTol"),
  setHFromTrack: $("setHFromTrack"),
  applyModelFilter: $("applyModelFilter"),
  physicsReadout: $("physicsReadout"),

  colorOn: $("colorOn"),
  C: $("C"),


  // AU anchor
  auTarget: $("auTarget"),
  m600: $("m600"),
  iAtAU: $("iAtAU"),
  dmAtAU: $("dmAtAU"),
  enableAuFilter: $("enableAuFilter"),
  magTol: $("magTol"),
  setM600FromTrack: $("setM600FromTrack"),
  applyAuFilter: $("applyAuFilter"),
  auReadout: $("auReadout"),

  // Object inspector
  objSelect: $("objSelect"),
  wiseaOut: $("wiseaOut"),
  copyWisea: $("copyWisea"),
  png: $("png"),
  csv: $("csv"),
  print: $("print"),

  framesBody: $("framesBody"),
  tracksBody: $("tracksBody"),

  cv: $("cv"),
  zoom: $("zoom"),
  zoomChip: $("zoomChip"),
  cursor: $("cursor"),
  selected: $("selected"),

  planetsTbl: $("planetsTbl"),
  spectralTbl: $("spectralTbl"),
};

const ctx = els.cv.getContext("2d", { willReadFrequently:true });

function setStatus(s){ els.status.textContent = s; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function luma(r,g,b){ return 0.2126*r + 0.7152*g + 0.0722*b; }
function fluxVal(r,g,b, mode){ return mode==="sumrgb" ? (r+g+b) : luma(r,g,b); }
function isoUTC(d){
  const p=(n)=>String(n).padStart(2,"0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}Z`;
}

// --- Reference data (from user) ---
const PLANETS = [
  {Planet:"Merkur", rAU:0.387, Irr:9101.40, Albedo:0.142, MagMax:-1.9},
  {Planet:"Venus", rAU:0.723, Irr:2605.10, Albedo:0.67,  MagMax:-4.9},
  {Planet:"Erde",  rAU:1.000, Irr:1360.80, Albedo:0.367, MagMax:0.0},
  {Planet:"Mars",  rAU:1.524, Irr:586.20,  Albedo:0.15,  MagMax:-2.9},
  {Planet:"Jupiter",rAU:5.203, Irr:50.26,  Albedo:0.52,  MagMax:-2.9},
  {Planet:"Saturn", rAU:9.537, Irr:14.95,  Albedo:0.47,  MagMax:-0.5},
  {Planet:"Uranus", rAU:19.191,Irr:3.70,   Albedo:0.51,  MagMax:5.3},
  {Planet:"Neptun", rAU:30.069,Irr:1.50,   Albedo:0.41,  MagMax:7.8},
  {Planet:"Pluto",  rAU:39.482,Irr:0.87,   Albedo:0.5,   MagMax:13.7},
  {Planet:"Referenz",rAU:600.0,Irr:0.00378,Albedo:0.0,   MagMax:26.0},
];

const SPECTRAL = [
  {Class:"O", T:30000, BV:-0.33, Hex:"#9bb0ff", Factor:1.4, Example:"Zeta Puppis"},
  {Class:"B", T:15000, BV:-0.17, Hex:"#aabfff", Factor:1.2, Example:"Rigel"},
  {Class:"A", T:8500,  BV:0.00,  Hex:"#cad7ff", Factor:1.0, Example:"Sirius"},
  {Class:"F", T:6500,  BV:0.30,  Hex:"#f8f7ff", Factor:0.9, Example:"Prokyon"},
  {Class:"G", T:5500,  BV:0.65,  Hex:"#fff4ea", Factor:0.8, Example:"Sonne"},
  {Class:"K", T:4500,  BV:1.05,  Hex:"#ffd2a1", Factor:0.7, Example:"Arktur"},
  {Class:"M", T:3200,  BV:1.50,  Hex:"#ffcc6f", Factor:0.6, Example:"Beteigeuze"},
];

function renderReferenceTables(){
  els.planetsTbl.innerHTML = `
    <thead><tr><th>Planet</th><th>r(AU)</th><th>I(W/m²)</th><th>Alb</th><th>MagMax</th></tr></thead>
    <tbody>${PLANETS.map(p=>`
      <tr><td>${p.Planet}</td><td>${p.rAU}</td><td>${p.Irr}</td><td>${p.Albedo}</td><td>${p.MagMax}</td></tr>
    `).join("")}</tbody>
  `;
  els.spectralTbl.innerHTML = `
    <thead><tr><th>C</th><th>T(K)</th><th>B−V</th><th>Rel</th><th>Example</th></tr></thead>
    <tbody>${SPECTRAL.map(s=>`
      <tr><td>${s.Class}</td><td>${s.T}</td><td>${s.BV}</td><td>${s.Factor}</td><td>${s.Example}</td></tr>
    `).join("")}</tbody>
  `;
}
renderReferenceTables();

// Tabs
document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    $("tabPlanets").classList.toggle("hidden", tab!=="planets");
    $("tabSpectral").classList.toggle("hidden", tab!=="spectral");
  });
});

// --- Physics model (minimal scaffold) ---
const I1_AU = 1360.8;

function solarIrradianceAt(rAU){
  if (!(rAU > 0)) return NaN;
  return I1_AU / (rAU*rAU);
}

function phaseTerm(alphaDeg, beta, mode){
  if (mode==="none") return 0;
  return (beta || 0) * (alphaDeg || 0);
}
function modelMagnitude(H, rAU, dAU, alphaDeg, beta, mode){
  if (!(rAU > 0) || !(dAU > 0) || !isFinite(H)) return NaN;
  const geom = 5 * Math.log10(rAU * dAU);
  return H + geom + phaseTerm(alphaDeg, beta, mode);
}

function updatePhysicsReadout(){
  const rAU = Number(els.rAU.value);
  const dAU = Number(els.dAU.value);
  const alpha = Number(els.alpha.value);
  const beta = Number(els.beta.value);
  const H = Number(els.H.value);
  const I = solarIrradianceAt(rAU);
  const m = modelMagnitude(H, rAU, dAU, alpha, beta, els.phaseMode.value);
  els.physicsReadout.innerHTML =
    `I(r): <b>${isFinite(I)? I.toExponential(6) : "—"} W/m²</b> | m_model: <b>${isFinite(m)? m.toFixed(3) : "—"}</b>`;
}
["input","change"].forEach(ev=>{
  [els.rAU, els.dAU, els.alpha, els.beta, els.H, els.phaseMode].forEach(x=>x.addEventListener(ev, updatePhysicsReadout));
});
updatePhysicsReadout();

// --- AU anchor (600 AU baseline) ---
const I600_AU = 0.00378;
function iAtAU_from600(au){
  if (!(au > 0)) return NaN;
  return I600_AU * (600/au) * (600/au);
}
function dm_vs_600(au){
  if (!(au > 0)) return NaN;
  // Δm = -2.5 log10(I(AU)/I600) = -5 log10(600/AU)
  return -5 * Math.log10(600/au);
}
function mExpectedAtAU(m600, au){
  const dm = dm_vs_600(au);
  if (!isFinite(dm) || !isFinite(m600)) return NaN;
  return m600 + dm;
}
function updateAUReadout(){
  if (!els.auTarget) return;
  const au = Number(els.auTarget.value);
  const m600 = Number(els.m600.value);
  const I = iAtAU_from600(au);
  const dm = dm_vs_600(au);
  const mexp = mExpectedAtAU(m600, au);
  els.iAtAU.value = isFinite(I) ? I.toExponential(6) : "—";
  els.dmAtAU.value = isFinite(dm) ? dm.toFixed(6) : "—";
  els.auReadout.innerHTML = `m_exp(AU): <b>${isFinite(mexp)? mexp.toFixed(3):"—"}</b> | Δ(track): <b>—</b>`;
}
["input","change"].forEach(ev=>{
  ["auTarget","m600"].forEach(id=>{
    const el = $(id);
    if (el) el.addEventListener(ev, ()=>{ updateAUReadout(); renderTracks(); });
  });
  if (els.enableAuFilter) els.enableAuFilter.addEventListener(ev, ()=>{ renderTracks(); });
  if (els.magTol) els.magTol.addEventListener(ev, ()=>{ renderTracks(); });
});
updateAUReadout();


// --- Color / spectral heuristic ---
function rgbToPseudoBV(r,g,b){
  const R=Math.max(1,r), G=Math.max(1,g), B=Math.max(1,b);
  const x1=Math.log10(R/G);
  const x2=Math.log10(G/B);
  return 0.8*x1 + 0.6*x2;
}
function spectralFromBV(bv){
  if (bv < -0.25) return "O";
  if (bv < -0.10) return "B";
  if (bv <  0.10) return "A";
  if (bv <  0.45) return "F";
  if (bv <  0.85) return "G";
  if (bv <  1.25) return "K";
  return "M";
}
function applyColorCorrection(mag, bvPseudo){
  if (els.colorOn.value !== "on") return mag;
  const C = Number(els.C.value);
  if (!isFinite(C)) return mag;
  return mag + C*bvPseudo;
}

// --- Photometry ---
const Photometry = {
  mInst(flux, exposure=1){
    if (!(flux > 0) || !(exposure > 0)) return Infinity;
    return -2.5*Math.log10(flux/exposure);
  },
  zeroPoint(mRef, fluxRef, exposure=1){
    const mi = this.mInst(fluxRef, exposure);
    if (!isFinite(mi)) return NaN;
    return mRef - mi;
  },
  mTrue(flux, zp, exposure=1){
    const mi = this.mInst(flux, exposure);
    if (!isFinite(mi) || !isFinite(zp)) return NaN;
    return mi + zp;
  }
};

// --- Minimal EXIF DateTimeOriginal parser (JPEG) ---
async function readExifDateTimeOriginal(file){
  try{
    const buf = await file.arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return null;
    let off=2;
    while (off+4 < v.byteLength){
      const marker = v.getUint16(off); off+=2;
      if (marker === 0xFFE1){
        off += 2;
        const hdr = String.fromCharCode(v.getUint8(off),v.getUint8(off+1),v.getUint8(off+2),v.getUint8(off+3));
        if (hdr !== "Exif") return null;
        off += 6;
        const tiff = off;
        const endian = v.getUint16(tiff);
        const little = endian===0x4949;
        const u16 = (o)=>v.getUint16(o,little);
        const u32 = (o)=>v.getUint32(o,little);
        if (u16(tiff+2)!==0x002A) return null;
        const ifd0 = tiff + u32(tiff+4);
        let p = ifd0;
        const n = u16(p); p+=2;
        let exifPtr=null;
        for (let i=0;i<n;i++){
          const e = p+i*12;
          const tag=u16(e);
          if (tag===0x8769){ exifPtr = tiff + u32(e+8); break; }
        }
        if (!exifPtr) return null;
        let q=exifPtr;
        const m=u16(q); q+=2;
        for (let i=0;i<m;i++){
          const e=q+i*12;
          const tag=u16(e), type=u16(e+2), count=u32(e+4), val=u32(e+8);
          if (tag===0x9003 && type===2 && count>=19){
            const sOff=tiff+val;
            let s="";
            for (let j=0;j<count;j++){
              const c=v.getUint8(sOff+j);
              if (!c) break;
              s += String.fromCharCode(c);
            }
            const mm = s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
            if (!mm) return null;
            const [_,yy,mo,dd,hh,mi,ss]=mm;
            return new Date(Date.UTC(+yy,+mo-1,+dd,+hh,+mi,+ss));
          }
        }
        return null;
      } else {
        const len = v.getUint16(off);
        off += len;
      }
    }
    return null;
  }catch{ return null; }
}

// --- State ---
const STATE = {
  frames: [], // {name,img,data,timeUTC,expS,T,zp,shift:{dx,dy}}
  refStar: null,
  pickingRef: false,
  tracks: [],
  trackSummaries: new Map(),
  overlay: null,
  selectedTrackId: null,
  modelFilterOn: false,
  auFilterOn: false,
};

function reset(){
  STATE.frames=[];
  STATE.refStar=null;
  STATE.pickingRef=false;
  STATE.tracks=[];
  STATE.overlay=null;
  STATE.selectedTrackId=null;
  STATE.trackSummaries = new Map();
  if (els.objSelect){ els.objSelect.innerHTML = '<option value="">—</option>'; }
  if (els.wiseaOut){ els.wiseaOut.textContent = 'No object selected.'; }
  STATE.modelFilterOn=false;
  STATE.auFilterOn=false;
  els.refReadout.innerHTML = `Ref star: <b>not set</b>`;
  if (els.auReadout) els.auReadout.innerHTML = `m_exp(AU): <b>—</b> | Δ(track): <b>—</b>`;
  els.framesBody.innerHTML = `<tr><td colspan="7" class="empty">No frames.</td></tr>`;
  els.tracksBody.innerHTML = `<tr><td colspan="10" class="empty">No analysis yet.</td></tr>`;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,els.cv.width,els.cv.height);
  ctx.fillStyle="#000"; ctx.fillRect(0,0,els.cv.width,els.cv.height);
  ctx.fillStyle="#00ffd0"; ctx.font="16px system-ui";
  ctx.fillText("Load ≥2 frames to start…", 16, 26);
  setStatus("Load ≥2 frames");
}
reset();

// --- Viewer zoom + cursor ---
els.zoom.addEventListener("input", ()=>{
  const z=Number(els.zoom.value);
  els.zoomChip.textContent=`${z}×`;
  els.cv.style.transformOrigin="center center";
  els.cv.style.transform=`scale(${z})`;
});
els.cv.addEventListener("mousemove",(e)=>{
  const r=els.cv.getBoundingClientRect();
  const x=(e.clientX-r.left)*(els.cv.width/r.width);
  const y=(e.clientY-r.top)*(els.cv.height/r.height);
  els.cursor.textContent = `x:${clamp(Math.floor(x),0,els.cv.width-1)} y:${clamp(Math.floor(y),0,els.cv.height-1)}`;
});

// --- Drag/drop & file load ---
function setDropDrag(on){ els.drop.classList.toggle("drag", on); }
els.drop.addEventListener("dragover",(e)=>{ e.preventDefault(); setDropDrag(true); });
els.drop.addEventListener("dragleave",()=>setDropDrag(false));
els.drop.addEventListener("drop",(e)=>{
  e.preventDefault(); setDropDrag(false);
  const files=[...e.dataTransfer.files].filter(f=>f.type.startsWith("image/"));
  if (files.length) loadFiles(files);
});
els.drop.addEventListener("click",()=>els.files.click());
els.drop.addEventListener("keydown",(e)=>{ if(e.key==="Enter"||e.key===" ") els.files.click(); });
els.files.addEventListener("change",()=>{
  const files=[...els.files.files];
  if (files.length) loadFiles(files);
});

function fileToImg(file){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.onload=()=>res(img);
    img.onerror=rej;
    img.src=URL.createObjectURL(file);
  });
}
function imgToData(img){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,els.cv.width,els.cv.height);
  ctx.drawImage(img, 0,0,els.cv.width,els.cv.height);
  return ctx.getImageData(0,0,els.cv.width,els.cv.height);
}

async function loadFiles(files){
  reset();
  setStatus(`Loading ${files.length}…`);
  for (const f of files){
    const t = (await readExifDateTimeOriginal(f)) || new Date(f.lastModified);
    const img = await fileToImg(f);
    const data = imgToData(img);
    STATE.frames.push({name:f.name, img, data, timeUTC:t, expS:1.0, T:null, zp:NaN, shift:{dx:0,dy:0}});
  }
  STATE.frames.sort((a,b)=>a.timeUTC-b.timeUTC);
  drawFrame(0,false);
  renderFrames();
  setStatus(`Loaded ${STATE.frames.length}. Pick ref star (optional), then Run.`);
}

// --- Draw frame + overlay + ref marker ---
function drawFrame(i, withOverlay=true){
  if (!STATE.frames.length) return;
  const f=STATE.frames[i];
  ctx.putImageData(f.data,0,0);
  if (withOverlay && STATE.overlay) ctx.putImageData(STATE.overlay,0,0);

  if (STATE.refStar){
    ctx.save();
    ctx.strokeStyle="#00ffd0"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(STATE.refStar.x, STATE.refStar.y, 10,0,Math.PI*2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(STATE.refStar.x-14, STATE.refStar.y); ctx.lineTo(STATE.refStar.x+14, STATE.refStar.y);
    ctx.moveTo(STATE.refStar.x, STATE.refStar.y-14); ctx.lineTo(STATE.refStar.x, STATE.refStar.y+14);
    ctx.stroke();
    ctx.fillStyle="#00ffd0"; ctx.font="12px system-ui"; ctx.fillText("REF", STATE.refStar.x+12, STATE.refStar.y-12);
    ctx.restore();
  }
}

// --- Pick ref star ---
els.pickRef.addEventListener("click", ()=>{
  if (STATE.frames.length<1) return alert("Load images first.");
  STATE.pickingRef=true;
  setStatus("Click a bright reference star in the canvas…");
  els.pickRef.textContent="Click in canvas…";
});
els.cv.addEventListener("click",(e)=>{
  if (!STATE.pickingRef) return;
  const r=els.cv.getBoundingClientRect();
  const x=(e.clientX-r.left)*(els.cv.width/r.width);
  const y=(e.clientY-r.top)*(els.cv.height/r.height);
  STATE.refStar={x:clamp(x,0,els.cv.width-1), y:clamp(y,0,els.cv.height-1)};
  STATE.pickingRef=false;
  els.pickRef.textContent="Pick reference star";
  els.refReadout.innerHTML = `Ref star: <b>x=${STATE.refStar.x.toFixed(1)}, y=${STATE.refStar.y.toFixed(1)}</b>`;
  drawFrame(0,true);
  setStatus("Ref star set. Run to compute ZP + magnitudes.");
});

// --- Frames table (edit UTC, exposure) ---
function renderFrames(){
  if (!STATE.frames.length){
    els.framesBody.innerHTML = `<tr><td colspan="7" class="empty">No frames.</td></tr>`;
    return;
  }
  els.framesBody.innerHTML = "";
  STATE.frames.forEach((f,idx)=>{
    const tr=document.createElement("tr");
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td title="${f.name}">${f.name}</td>
      <td><input class="ts" data-i="${idx}" value="${isoUTC(f.timeUTC)}"/></td>
      <td><input class="exp" data-i="${idx}" type="number" min="0.001" step="0.001" value="${f.expS}"/></td>
      <td>${f.shift.dx.toFixed(1)},${f.shift.dy.toFixed(1)}</td>
      <td>${typeof f.T==="number" ? f.T.toFixed(1) : "—"}</td>
      <td>${isFinite(f.zp) ? f.zp.toFixed(4) : "—"}</td>
    `;
    els.framesBody.appendChild(tr);
  });

  els.framesBody.querySelectorAll("input.ts").forEach(inp=>{
    inp.addEventListener("change",()=>{
      const i=Number(inp.dataset.i);
      const d=new Date(inp.value.trim());
      if (isNaN(d.getTime())){ alert("Invalid UTC ISO."); inp.value=isoUTC(STATE.frames[i].timeUTC); return; }
      STATE.frames[i].timeUTC=d;
    });
  });
  els.framesBody.querySelectorAll("input.exp").forEach(inp=>{
    inp.addEventListener("change",()=>{
      const i=Number(inp.dataset.i);
      const v=Number(inp.value);
      if (!(v>0)){ alert("Exposure must be >0."); inp.value=STATE.frames[i].expS; return; }
      STATE.frames[i].expS=v;
    });
  });
}

// --- Robust threshold ---
function median(arr){
  const a=[...arr].sort((x,y)=>x-y);
  const n=a.length;
  if (!n) return 0;
  const m=Math.floor(n/2);
  return n%2 ? a[m] : 0.5*(a[m-1]+a[m]);
}
function autoThreshold(data, k){
  const W=data.width, H=data.height, d=data.data;
  const step=4;
  const s=[];
  for (let y=0;y<H;y+=step){
    for (let x=0;x<W;x+=step){
      const i=(y*W+x)*4;
      s.push(luma(d[i],d[i+1],d[i+2]));
    }
  }
  const m=median(s);
  const mad=median(s.map(v=>Math.abs(v-m)));
  const sigma=1.4826*mad;
  return m + k*sigma;
}

// --- Alignment ---
function downGray(data, factor){
  const W=data.width,H=data.height,d=data.data;
  const w=Math.floor(W/factor), h=Math.floor(H/factor);
  const g=new Float32Array(w*h);
  for (let y=0;y<h;y++){
    for (let x=0;x<w;x++){
      const sx=x*factor, sy=y*factor;
      const i=(sy*W+sx)*4;
      g[y*w+x]=luma(d[i],d[i+1],d[i+2]);
    }
  }
  return {w,h,g};
}
function bestShiftSSD(A,B,range){
  const w=Math.min(A.w,B.w), h=Math.min(A.h,B.h);
  let best={dx:0,dy:0,ssd:Infinity};
  for (let dy=-range;dy<=range;dy++){
    for (let dx=-range;dx<=range;dx++){
      let ssd=0,c=0;
      const x0=Math.max(0,dx), x1=Math.min(w,w+dx);
      const y0=Math.max(0,dy), y1=Math.min(h,h+dy);
      for (let y=y0;y<y1;y++){
        const ay=y*A.w, by=(y-dy)*B.w;
        for (let x=x0;x<x1;x++){
          const diff=A.g[ay+x]-B.g[by+(x-dx)];
          ssd += diff*diff; c++;
        }
      }
      if (c) ssd/=c;
      if (ssd<best.ssd) best={dx,dy,ssd};
    }
  }
  return best;
}

// --- Blob detection ---
function detectBlobs(data, T, minArea, mode){
  const W=data.width,H=data.height,d=data.data;
  const vis=new Uint8Array(W*H);
  const blobs=[];
  const qx=new Int32Array(W*H);
  const qy=new Int32Array(W*H);
  const idx1=(x,y)=>y*W+x;

  for (let y=1;y<H-1;y++){
    for (let x=1;x<W-1;x++){
      const p=idx1(x,y);
      if (vis[p]) continue;
      const ii=(y*W+x)*4;
      const v0=fluxVal(d[ii],d[ii+1],d[ii+2],mode);
      if (v0 < T) continue;

      let head=0,tail=0; qx[tail]=x; qy[tail]=y; tail++; vis[p]=1;
      let area=0, sumW=0, sumX=0, sumY=0, sumR=0,sumG=0,sumB=0;

      while (head<tail){
        const cx=qx[head], cy=qy[head]; head++;
        const i=(cy*W+cx)*4;
        const r=d[i],g=d[i+1],b=d[i+2];
        const v=fluxVal(r,g,b,mode);
        const w=Math.max(1e-6, v);
        area++;
        sumW+=w; sumX+=cx*w; sumY+=cy*w;
        sumR+=r; sumG+=g; sumB+=b;

        for (let oy=-1;oy<=1;oy++){
          for (let ox=-1;ox<=1;ox++){
            if (!ox && !oy) continue;
            const nx=cx+ox, ny=cy+oy;
            if (nx<=0||nx>=W-1||ny<=0||ny>=H-1) continue;
            const np=idx1(nx,ny);
            if (vis[np]) continue;
            const j=(ny*W+nx)*4;
            const vv=fluxVal(d[j],d[j+1],d[j+2],mode);
            if (vv >= T){
              vis[np]=1; qx[tail]=nx; qy[tail]=ny; tail++;
            }
          }
        }
      }

      if (area>=minArea && sumW>0){
        blobs.push({
          x: sumX/sumW, y: sumY/sumW, area,
          rgb: [sumR/area, sumG/area, sumB/area]
        });
      }
    }
  }
  return blobs;
}
function shiftBlobs(blobs, dx, dy){
  return blobs.map(b=>({...b, x:b.x+dx, y:b.y+dy}));
}

// --- Aperture photometry ---
function aperture(data,cx,cy,rAp,rIn,rOut,mode){
  const W=data.width,H=data.height,d=data.data;
  const rAp2=rAp*rAp, rIn2=rIn*rIn, rOut2=rOut*rOut;
  const x0=Math.max(0,Math.floor(cx-rOut-1));
  const x1=Math.min(W-1,Math.ceil(cx+rOut+1));
  const y0=Math.max(0,Math.floor(cy-rOut-1));
  const y1=Math.min(H-1,Math.ceil(cy+rOut+1));

  let apSum=0, apN=0;
  const bg=[];
  for (let y=y0;y<=y1;y++){
    for (let x=x0;x<=x1;x++){
      const dx=x-cx, dy=y-cy;
      const rr=dx*dx+dy*dy;
      const i=(y*W+x)*4;
      const v=fluxVal(d[i],d[i+1],d[i+2],mode);
      if (rr<=rAp2){ apSum+=v; apN++; }
      else if (rr>=rIn2 && rr<=rOut2){ bg.push(v); }
    }
  }
  if (!apN) return {net:0,bg:0,n:0};
  const bgMed = bg.length ? median(bg) : 0;
  return {net: apSum - bgMed*apN, bg:bgMed, n:apN};
}

// --- Tracking ---
function buildTracks(blobsByFrame, times, maxDist){
  const tracks=[];
  let next=1;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  for (const b of blobsByFrame[0]){
    tracks.push({id:next++, samples:[{f:0,x:b.x,y:b.y,rgb:b.rgb}], totalDist:0, totalDt:0});
  }

  for (let fi=1;fi<blobsByFrame.length;fi++){
    const blobs=blobsByFrame[fi];
    const used=new Uint8Array(blobs.length);
    const dt = Math.max(0, (times[fi].getTime()-times[fi-1].getTime())/1000);

    for (const t of tracks){
      const last=t.samples[t.samples.length-1];
      if (last.f !== fi-1) continue;

      let best=-1,bestD=Infinity;
      for (let j=0;j<blobs.length;j++){
        if (used[j]) continue;
        const d=dist(last, blobs[j]);
        if (d<bestD){ bestD=d; best=j; }
      }
      if (best>=0 && bestD<=maxDist){
        used[best]=1;
        const b=blobs[best];
        t.samples.push({f:fi,x:b.x,y:b.y,rgb:b.rgb});
        t.totalDist += bestD;
        t.totalDt += dt;
      }
    }

    for (let j=0;j<blobs.length;j++){
      if (used[j]) continue;
      const b=blobs[j];
      tracks.push({id:next++, samples:[{f:fi,x:b.x,y:b.y,rgb:b.rgb}], totalDist:0, totalDt:0});
    }
  }
  return tracks;
}
function displacement(t){
  const a=t.samples[0], b=t.samples[t.samples.length-1];
  return Math.hypot(b.x-a.x,b.y-a.y);
}

// --- ZP per frame ---
function computeZP(){
  const mode=els.fluxMode.value;
  const rAp=Number(els.rAp.value), rIn=Number(els.rIn.value), rOut=Number(els.rOut.value);
  const mRef=Number(els.refMag.value);

  if (!(rOut>rIn && rIn>rAp)) { alert("Radii must satisfy: rOut > rIn > rAp."); return; }

  for (const f of STATE.frames){
    f.zp = NaN;
    if (!STATE.refStar || !isFinite(mRef)) continue;
    const phot = aperture(f.data, STATE.refStar.x, STATE.refStar.y, rAp,rIn,rOut,mode);
    f.zp = Photometry.zeroPoint(mRef, phot.net, f.expS);
  }
}

// --- Overlay ---
function colorFor(id){
  const r=(id*97)%255, g=(id*57)%255, b=(id*37)%255;
  return `rgb(${r},${g},${b})`;
}
function renderOverlay(tracks){
  drawFrame(0,false);
  ctx.save();
  ctx.lineWidth=2;
  for (const t of tracks){
    ctx.strokeStyle=colorFor(t.id);
    ctx.fillStyle=colorFor(t.id);
    ctx.beginPath();
    t.samples.forEach((s,i)=>{ if(!i) ctx.moveTo(s.x,s.y); else ctx.lineTo(s.x,s.y); });
    ctx.stroke();
    const s0=t.samples[0], s1=t.samples[t.samples.length-1];
    ctx.beginPath(); ctx.arc(s0.x,s0.y,4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(s1.x,s1.y,4,0,Math.PI*2); ctx.fill();
    ctx.font="12px system-ui"; ctx.fillText(`#${t.id}`, s1.x+6, s1.y-6);
  }
  ctx.restore();
  STATE.overlay = ctx.getImageData(0,0,els.cv.width,els.cv.height);
  drawFrame(0,true);
}

// --- Track table ---
function currentModelMag(){
  const H=Number(els.H.value), rAU=Number(els.rAU.value), dAU=Number(els.dAU.value);
  const alpha=Number(els.alpha.value), beta=Number(els.beta.value);
  return modelMagnitude(H,rAU,dAU,alpha,beta,els.phaseMode.value);
}

function renderTracks(){
  if (!STATE.tracks.length){
    els.tracksBody.innerHTML = `<tr><td colspan="12" class="empty">No tracks.</td></tr>`;
    return;
  }
  const mModel = currentModelMag();
  const tol = Math.max(0, Number(els.modelTol.value) || 0);

  const rows = [];
  for (const t of STATE.tracks){
    const speed = (t.totalDt>0) ? (t.totalDist/t.totalDt) : 0;

    // mean rgb
    const rgb=[0,0,0];
    t.samples.forEach(s=>{ rgb[0]+=s.rgb[0]; rgb[1]+=s.rgb[1]; rgb[2]+=s.rgb[2]; });
    rgb[0]/=t.samples.length; rgb[1]/=t.samples.length; rgb[2]/=t.samples.length;

    // magnitudes per sample if ZP known
    const mode=els.fluxMode.value;
    const rAp=Number(els.rAp.value), rIn=Number(els.rIn.value), rOut=Number(els.rOut.value);
    const mags=[];
    for (const s of t.samples){
      const f=STATE.frames[s.f];
      if (!isFinite(f.zp)) continue;
      const phot=aperture(f.data, s.x, s.y, rAp,rIn,rOut,mode);
      const m = Photometry.mTrue(phot.net, f.zp, f.expS);
      if (isFinite(m)) mags.push(m);
    }
    const mag = mags.length ? mags.reduce((a,b)=>a+b,0)/mags.length : NaN;

    // color heuristic
    const bv = rgbToPseudoBV(rgb[0],rgb[1],rgb[2]);
    const sp = spectralFromBV(bv);
    const magCorr = isFinite(mag) ? applyColorCorrection(mag, bv) : NaN;

    // model compare
    const delta = (isFinite(magCorr) && isFinite(mModel)) ? (magCorr - mModel) : NaN;

    // AU anchor expectation (optional)
    const au = els.auTarget ? Number(els.auTarget.value) : NaN;
    const m600 = els.m600 ? Number(els.m600.value) : NaN;
    const mExpAU = (isFinite(au) && isFinite(m600)) ? mExpectedAtAU(m600, au) : NaN;
    const deltaAu = (isFinite(magCorr) && isFinite(mExpAU)) ? (magCorr - mExpAU) : NaN;

    if (STATE.modelFilterOn){
      if (!isFinite(delta) || Math.abs(delta) > tol) continue;
    }
    if (els.enableAuFilter && els.enableAuFilter.checked){
      const tAu = Math.max(0, Number(els.magTol.value) || 0);
      if (!isFinite(deltaAu) || Math.abs(deltaAu) > tAu) continue;
    }

    rows.push({t, speed, mag, magCorr, mModel, delta, mExpAU, deltaAu, bv, sp, rgb});
  }

  if (!rows.length){
    els.tracksBody.innerHTML = `<tr><td colspan="12" class="empty">No tracks match the active filter(s).</td></tr>`;
    return;
  }

  STATE.trackSummaries = new Map();
  rows.forEach(r=>STATE.trackSummaries.set(r.t.id, trackSummaryForRow(r)));
  populateObjectSelect();
  els.tracksBody.innerHTML = "";
  for (const r of rows){
    const tr=document.createElement("tr");
    tr.dataset.id = String(r.t.id);
    if (STATE.selectedTrackId === r.t.id) tr.classList.add("sel");
    tr.innerHTML = `
      <td>${r.t.id}</td>
      <td>${r.t.samples.length}</td>
      <td>${r.speed.toFixed(3)}</td>
      <td>${isFinite(r.mag) ? r.mag.toFixed(3) : "—"}</td>
      <td>${isFinite(r.magCorr) ? r.magCorr.toFixed(3) : "—"}</td>
      <td>${isFinite(r.mModel) ? r.mModel.toFixed(3) : "—"}</td>
      <td>${isFinite(r.delta) ? r.delta.toFixed(3) : "—"}</td>
      <td>${isFinite(r.mExpAU) ? r.mExpAU.toFixed(3) : "—"}</td>
      <td>${isFinite(r.deltaAu) ? r.deltaAu.toFixed(3) : "—"}</td>
      <td>${isFinite(r.bv) ? r.bv.toFixed(3) : "—"}</td>
      <td>${r.sp}</td>
      <td>${Math.round(r.rgb[0])},${Math.round(r.rgb[1])},${Math.round(r.rgb[2])}</td>
    `;
    tr.addEventListener("click", ()=>{
      STATE.selectedTrackId = r.t.id;
      els.selected.textContent = `Selected: #${r.t.id}`;
      if (els.objSelect){ els.objSelect.value = String(r.t.id); }
      showWiseaFor(r.t.id);
      // update AU readout delta for this track
      if (els.auReadout){
        const au = Number(els.auTarget.value);
        const m600 = Number(els.m600.value);
        const mExpAU = mExpectedAtAU(m600, au);
        const dAu = (isFinite(r.magCorr) && isFinite(mExpAU)) ? (r.magCorr - mExpAU) : NaN;
        els.auReadout.innerHTML = `m_exp(AU): <b>${isFinite(mExpAU)? mExpAU.toFixed(3):"—"}</b> | Δ(track): <b>${isFinite(dAu)? dAu.toFixed(3):"—"}</b>`;
      }
      renderTracks();
    });
    els.tracksBody.appendChild(tr);
  }
}

// --- Run ---
els.thrMode.addEventListener("change", ()=>{
  els.thrManualBox.classList.toggle("hidden", els.thrMode.value !== "manual");
});

async function run(){
  if (STATE.frames.length < 2) return alert("Load at least 2 frames.");
  setStatus("Running… (align → detect → track → photometry)");
  STATE.modelFilterOn = false;
  els.applyModelFilter.textContent = "Filter by model";
  if (els.applyAuFilter) els.applyAuFilter.textContent = "Apply AU filter";

  const alignRange = clamp(Number(els.align.value)||0,0,250);
  const ds = clamp(Number(els.ds.value)||1,1,16);
  const ref = downGray(STATE.frames[0].data, ds);
  for (let i=0;i<STATE.frames.length;i++){
    if (i===0){ STATE.frames[i].shift={dx:0,dy:0}; continue; }
    const cur = downGray(STATE.frames[i].data, ds);
    const best = bestShiftSSD(ref, cur, Math.floor(alignRange/ds));
    STATE.frames[i].shift = {dx: best.dx*ds, dy: best.dy*ds};
  }

  const mode=els.fluxMode.value;
  const blobsByFrame=[];
  for (let i=0;i<STATE.frames.length;i++){
    const f=STATE.frames[i];
    let T;
    if (els.thrMode.value==="manual"){
      T = clamp(Number(els.thrManual.value)||0,0,255);
    } else {
      T = autoThreshold(f.data, Math.max(0, Number(els.k.value)||0));
    }
    f.T = T;

    const blobs = detectBlobs(f.data, T, clamp(Number(els.minArea.value)||1,1,1e9), mode);
    const sh = f.shift;
    blobsByFrame[i] = shiftBlobs(blobs, sh.dx, sh.dy);
  }

  const times = STATE.frames.map(f=>f.timeUTC);
  const tracksAll = buildTracks(blobsByFrame, times, clamp(Number(els.matchDist.value)||10,1,250));

  const minLen=clamp(Number(els.minLen.value)||2,2,9999);
  const minDisp=Math.max(0, Number(els.minDisp.value)||0);
  const showAll=els.showAll.checked;
  const tracks = showAll ? tracksAll : tracksAll.filter(t=>t.samples.length>=minLen && displacement(t)>=minDisp);

  computeZP();
  renderFrames();

  STATE.tracks = tracks;
  renderOverlay(tracks);
  renderTracks();
  populateObjectSelect();
  if (STATE.selectedTrackId) showWiseaFor(STATE.selectedTrackId);

  setStatus(`Done. Frames=${STATE.frames.length}, tracks=${STATE.tracks.length}, ZP=${STATE.refStar ? "on" : "off"}`);
}

els.run.addEventListener("click", run);
els.clear.addEventListener("click", reset);

// --- Model tools ---
els.applyModelFilter.addEventListener("click", ()=>{
  STATE.modelFilterOn = !STATE.modelFilterOn;
  els.applyModelFilter.textContent = STATE.modelFilterOn ? "Model filter: ON" : "Filter by model";
  renderTracks();
});

els.setHFromTrack.addEventListener("click", ()=>{
  if (!STATE.selectedTrackId) return alert("Select a track first.");
  const t = STATE.tracks.find(x=>x.id===STATE.selectedTrackId);
  if (!t) return;

  const rAU=Number(els.rAU.value), dAU=Number(els.dAU.value);
  const alpha=Number(els.alpha.value), beta=Number(els.beta.value);
  const P = phaseTerm(alpha,beta,els.phaseMode.value);

  const mode=els.fluxMode.value;
  const rAp=Number(els.rAp.value), rIn=Number(els.rIn.value), rOut=Number(els.rOut.value);

  // mean RGB for BV*
  let rr=0,gg=0,bb=0;
  t.samples.forEach(s=>{ rr+=s.rgb[0]; gg+=s.rgb[1]; bb+=s.rgb[2]; });
  rr/=t.samples.length; gg/=t.samples.length; bb/=t.samples.length;
  const bv = rgbToPseudoBV(rr,gg,bb);

  // mean measured magnitude
  const mags=[];
  for (const s of t.samples){
    const f=STATE.frames[s.f];
    if (!isFinite(f.zp)) continue;
    const phot=aperture(f.data, s.x, s.y, rAp,rIn,rOut,mode);
    const m = Photometry.mTrue(phot.net, f.zp, f.expS);
    if (isFinite(m)) mags.push(m);
  }
  if (!mags.length) return alert("Track has no valid magnitudes (set ref star + run).");
  const m = mags.reduce((a,b)=>a+b,0)/mags.length;
  const mCorr = applyColorCorrection(m, bv);

  const H = mCorr - 5*Math.log10(rAU*dAU) - P;
  if (!isFinite(H)) return alert("Cannot compute H with current inputs.");
  els.H.value = H.toFixed(3);
  updatePhysicsReadout();
  renderTracks();
});



// --- AU anchor tools ---
if (els.applyAuFilter){
  els.applyAuFilter.addEventListener("click", ()=>{
    if (!els.enableAuFilter) return;
    els.enableAuFilter.checked = !els.enableAuFilter.checked;
    renderTracks();
  });
}
if (els.setM600FromTrack){
  els.setM600FromTrack.addEventListener("click", ()=>{
    if (!STATE.selectedTrackId) return alert("Select a track first.");
    const t = STATE.tracks.find(x=>x.id===STATE.selectedTrackId);
    if (!t) return;

    // Use mean mag_corr of selected track, infer m600 = m_track - Δm(AU)
    const au = Number(els.auTarget.value);
    const dm = dm_vs_600(au);

    const mode=els.fluxMode.value;
    const rAp=Number(els.rAp.value), rIn=Number(els.rIn.value), rOut=Number(els.rOut.value);

    // mean RGB for BV*
    let rr=0,gg=0,bb=0;
    t.samples.forEach(s=>{ rr+=s.rgb[0]; gg+=s.rgb[1]; bb+=s.rgb[2]; });
    rr/=t.samples.length; gg/=t.samples.length; bb/=t.samples.length;
    const bv = rgbToPseudoBV(rr,gg,bb);

    const mags=[];
    for (const s of t.samples){
      const f=STATE.frames[s.f];
      if (!isFinite(f.zp)) continue;
      const phot=aperture(f.data, s.x, s.y, rAp,rIn,rOut,mode);
      const m = Photometry.mTrue(phot.net, f.zp, f.expS);
      if (isFinite(m)) mags.push(m);
    }
    if (!mags.length) return alert("Track has no valid magnitudes (set reference star + run).");
    const m = mags.reduce((a,b)=>a+b,0)/mags.length;
    const mCorr = applyColorCorrection(m, bv);
    const m600 = mCorr - dm;

    if (!isFinite(m600)) return alert("Cannot infer m600 with current inputs.");
    els.m600.value = m600.toFixed(3);
    updateAUReadout();
    renderTracks();
  });
}


// --- Object inspector (WISEA-style) ---
function fmt(n, d=3){ return isFinite(n) ? Number(n).toFixed(d) : "—"; }
function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : NaN; }

function trackSummaryForRow(r){
  const t = r.t;
  const s0 = t.samples[0];
  const s1 = t.samples[t.samples.length-1];
  const t0 = STATE.frames[s0.f]?.timeUTC;
  const t1 = STATE.frames[s1.f]?.timeUTC;
  const dt = (t0 && t1) ? Math.max(0, (t1.getTime()-t0.getTime())/1000) : NaN;

  const xs = t.samples.map(s=>s.x);
  const ys = t.samples.map(s=>s.y);

  const vx = (isFinite(dt) && dt>0) ? ((s1.x - s0.x)/dt) : NaN;
  const vy = (isFinite(dt) && dt>0) ? ((s1.y - s0.y)/dt) : NaN;
  const v  = (isFinite(vx)&&isFinite(vy)) ? Math.hypot(vx,vy) : NaN;

  const desig = `WISEA PX${Math.round(mean(xs))}_${Math.round(mean(ys))}`;

  return {
    id: t.id,
    desig,
    n: t.samples.length,
    t0: t0 ? isoUTC(t0) : "—",
    t1: t1 ? isoUTC(t1) : "—",
    dt_s: dt,
    x_mean: mean(xs),
    y_mean: mean(ys),
    x0: s0.x, y0: s0.y,
    x1: s1.x, y1: s1.y,
    vx, vy, v,
    speed_px_s: r.speed,
    mag: r.mag,
    magCorr: r.magCorr,
    bv: r.bv,
    sp: r.sp,
    rgb: r.rgb,
    mModel: r.mModel,
    deltaModel: r.delta,
    mExpAU: r.mExpAU,
    deltaAu: r.deltaAu,
    settings: {
      auTarget: Number(els.auTarget?.value),
      m600: Number(els.m600?.value),
      magTol: Number(els.magTol?.value),
      auFilter: !!(els.enableAuFilter && els.enableAuFilter.checked),
      rAU: Number(els.rAU?.value),
      dAU: Number(els.dAU?.value),
      alpha: Number(els.alpha?.value),
      beta: Number(els.beta?.value),
      H: Number(els.H?.value),
      phaseMode: els.phaseMode?.value,
      colorOn: els.colorOn?.value,
      C: Number(els.C?.value),
      fluxMode: els.fluxMode?.value,
      rAp: Number(els.rAp?.value),
      rIn: Number(els.rIn?.value),
      rOut: Number(els.rOut?.value),
    }
  };
}

function wiseaText(s){
  const set = s.settings;
  const lines = [];
  lines.push(`# WISEA-style analysis (local, image-derived)`);
  lines.push(`Designation: ${s.desig}`);
  lines.push(`Track ID: ${s.id}`);
  lines.push(`Frames (n): ${s.n}`);
  lines.push(`Time span: ${s.t0}  ->  ${s.t1}`);
  lines.push(`Δt (s): ${fmt(s.dt_s, 3)}`);
  lines.push("");
  lines.push(`Centroid (px): x=${fmt(s.x_mean,2)}  y=${fmt(s.y_mean,2)}`);
  lines.push(`Endpoints (px): start=(${fmt(s.x0,2)},${fmt(s.y0,2)})  end=(${fmt(s.x1,2)},${fmt(s.y1,2)})`);
  lines.push(`Velocity (px/s): vx=${fmt(s.vx,5)}  vy=${fmt(s.vy,5)}  |v|=${fmt(s.v,5)}`);
  lines.push(`Speed (track avg px/s): ${fmt(s.speed_px_s,5)}`);
  lines.push("");
  lines.push(`Photometry (mean): mag=${fmt(s.mag,3)}  mag_corr=${fmt(s.magCorr,3)}`);
  lines.push(`Color (heuristic): (B−V)*=${fmt(s.bv,3)}  Sp*=${s.sp}`);
  lines.push(`RGB mean: ${Math.round(s.rgb[0])},${Math.round(s.rgb[1])},${Math.round(s.rgb[2])}`);
  lines.push("");
  lines.push(`Physics model: m_model=${fmt(s.mModel,3)}  Δm=${fmt(s.deltaModel,3)}`);
  lines.push(`AU anchor: m_exp(AU)=${fmt(s.mExpAU,3)}  Δau=${fmt(s.deltaAu,3)}`);
  lines.push("");
  lines.push(`[Settings snapshot]`);
  lines.push(`AU: target=${set.auTarget}  m600=${set.m600}  tol=${set.magTol}  auFilter=${set.auFilter}`);
  lines.push(`Geometry: rAU=${set.rAU}  dAU=${set.dAU}  alpha=${set.alpha}  beta=${set.beta}  H=${set.H}  phase=${set.phaseMode}`);
  lines.push(`Color corr: ${set.colorOn}  C=${set.C}`);
  lines.push(`Photometry: flux=${set.fluxMode}  rAp=${set.rAp}  rIn=${set.rIn}  rOut=${set.rOut}`);
  lines.push("");
  lines.push(`NOTE: For real WISEA Jhhmmss.ss±ddmmss.s naming you must provide WCS (RA/Dec) calibration.`);
  return lines.join("\n");
}

function populateObjectSelect(){
  if (!els.objSelect) return;
  const ids = [...STATE.trackSummaries.keys()].sort((a,b)=>a-b);
  const cur = els.objSelect.value;
  els.objSelect.innerHTML = '<option value="">—</option>' + ids.map(id=>`<option value="${id}">Track #${id}</option>`).join("");
  if (cur && ids.includes(Number(cur))) els.objSelect.value = cur;
}

function showWiseaFor(id){
  if (!els.wiseaOut) return;
  const s = STATE.trackSummaries.get(Number(id));
  if (!s){ els.wiseaOut.textContent = "No object selected."; return; }
  els.wiseaOut.textContent = wiseaText(s);
}

if (els.objSelect){
  els.objSelect.addEventListener("change", ()=>{
    const id = els.objSelect.value;
    showWiseaFor(id);
  });
}
if (els.copyWisea){
  els.copyWisea.addEventListener("click", async ()=>{
    const text = els.wiseaOut?.textContent || "";
    if (!text || text === "No object selected.") return alert("Select an object first.");
    try{ await navigator.clipboard.writeText(text); }
    catch{ alert("Copy failed (clipboard blocked). You can manually select and copy the text."); }
  });
}
// --- Export ---
function exportCSV(){
  if (!STATE.tracks.length) return alert("No tracks.");
  const mModel = currentModelMag();

  const rows=[];
  rows.push([
    "track_id","n","speed_px_s",
    "mag_mean","mag_corr_mean",
    "bv_pseudo","spectral",
    "m_model","delta_mag","m_exp_au","delta_au","au_target","m600","mag_tol","au_filter_on",
    "rAU","dAU","alpha_deg","beta",
  ].join(","));

  for (const t of STATE.tracks){
    const speed = (t.totalDt>0)?(t.totalDist/t.totalDt):0;

    let rr=0,gg=0,bb=0;
    t.samples.forEach(s=>{ rr+=s.rgb[0]; gg+=s.rgb[1]; bb+=s.rgb[2]; });
    rr/=t.samples.length; gg/=t.samples.length; bb/=t.samples.length;

    const bv = rgbToPseudoBV(rr,gg,bb);
    const sp = spectralFromBV(bv);

    const mode=els.fluxMode.value;
    const rAp=Number(els.rAp.value), rIn=Number(els.rIn.value), rOut=Number(els.rOut.value);
    const mags=[];
    for (const s of t.samples){
      const f=STATE.frames[s.f];
      if (!isFinite(f.zp)) continue;
      const phot=aperture(f.data, s.x, s.y, rAp,rIn,rOut,mode);
      const m = Photometry.mTrue(phot.net, f.zp, f.expS);
      if (isFinite(m)) mags.push(m);
    }
    const mag = mags.length ? mags.reduce((a,b)=>a+b,0)/mags.length : NaN;
    const magCorr = isFinite(mag) ? applyColorCorrection(mag, bv) : NaN;
    const delta = (isFinite(magCorr) && isFinite(mModel)) ? (magCorr - mModel) : NaN;
    const au = els.auTarget ? Number(els.auTarget.value) : NaN;
    const m600 = els.m600 ? Number(els.m600.value) : NaN;
    const mExpAU = (isFinite(au) && isFinite(m600)) ? mExpectedAtAU(m600, au) : NaN;
    const deltaAu = (isFinite(magCorr) && isFinite(mExpAU)) ? (magCorr - mExpAU) : NaN;

    rows.push([
      t.id, t.samples.length, speed.toFixed(6),
      isFinite(mag)?mag.toFixed(6):"",
      isFinite(magCorr)?magCorr.toFixed(6):"",
      isFinite(bv)?bv.toFixed(6):"",
      sp,
      isFinite(mModel)?mModel.toFixed(6):"",
      isFinite(delta)?delta.toFixed(6):"",
      isFinite(mExpAU)?mExpAU.toFixed(6):"",
      isFinite(deltaAu)?deltaAu.toFixed(6):"",
      isFinite(au)?au:"",
      isFinite(m600)?m600:"",
      Number(els.magTol.value||""),
      (els.enableAuFilter && els.enableAuFilter.checked) ? 1 : 0,
      Number(els.rAU.value), Number(els.dAU.value), Number(els.alpha.value), Number(els.beta.value),
    ].join(","));
  }

  const blob=new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="astro_surveyor_min_v4.csv";
  a.click();
}

function savePNG(){
  if (!STATE.frames.length) return alert("Load frames first.");
  const a=document.createElement("a");
  a.download="astro_surveyor_min_v4.png";
  a.href=els.cv.toDataURL("image/png");
  a.click();
}

function printView(){
  if (!STATE.frames.length) return alert("Load frames first.");
  const url=els.cv.toDataURL("image/png");
  const w=window.open("","_blank");
  if (!w) return alert("Popup blocked.");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/>
  <title>Print</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center}img{max-width:100vw;max-height:100vh}</style>
  </head><body><img src="${url}"/><script>setTimeout(()=>window.print(),200);</script></body></html>`);
  w.document.close();
}

els.csv.addEventListener("click", exportCSV);
els.png.addEventListener("click", savePNG);
els.print.addEventListener("click", printView);

// Re-render tracks when model/color settings change
["input","change"].forEach(ev=>{
  [els.colorOn, els.C, els.modelTol, els.rAU, els.dAU, els.alpha, els.beta, els.H, els.phaseMode, els.auTarget, els.m600, els.magTol, els.enableAuFilter].forEach(x=>{
    x.addEventListener(ev, ()=>renderTracks());
  });
});

// Also keep readout fresh
["input","change"].forEach(ev=>{
  [els.colorOn, els.C].forEach(x=>x.addEventListener(ev, updatePhysicsReadout));
});
