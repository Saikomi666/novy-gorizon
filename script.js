
const bgVideo = document.getElementById("bgVideo");
if (bgVideo) {
  bgVideo.muted = true;
  bgVideo.defaultMuted = true;
  bgVideo.setAttribute("muted", "");
  bgVideo.setAttribute("playsinline", "");
  const startVideo = () => bgVideo.play().catch(() => {});
  bgVideo.addEventListener("loadeddata", startVideo, { once: true });
  startVideo();
}

const CONFIG = {
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzkoO25M9kNFM7fDr_kddWRaPIdIjyLqrytVdn3CqlnlUh6-ukhLeV0LICypBxUL5OqdQ/exec"
};

const $ = (s) => document.querySelector(s);
const modal = $("#formModal");
const success = $("#successModal");
const form = $("#recruitForm");
const statusEl = $("#formStatus");

$("#openForm").addEventListener("click", () => {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
});
function closeForm(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}
$("#closeForm").addEventListener("click", closeForm);
$("#closeBackdrop").addEventListener("click", closeForm);
$("#successClose").addEventListener("click", () => {
  success.classList.remove("open");
  document.body.style.overflow="";
});
document.addEventListener("keydown", e => { if(e.key==="Escape") closeForm(); });

document.querySelectorAll('input[type="file"]').forEach(input=>{
  input.addEventListener("change", ()=>{
    const out=document.querySelector(`.file-name[data-for="${input.name}"]`);
    out.textContent=input.files[0]?.name || "файл не выбран";
  });
});

async function fileToDataURL(file, maxSide=1800, quality=.88){
  if(!file) return null;
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});
  const scale = Math.min(1, maxSide / Math.max(img.width,img.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(img.width*scale));
  canvas.height=Math.max(1,Math.round(img.height*scale));
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  URL.revokeObjectURL(url);
  // JPEG keeps submissions much smaller; transparent PNG remains PNG.
  const isTransparent = file.type==="image/png";
  return canvas.toDataURL(isTransparent ? "image/png" : "image/jpeg", quality);
}

async function submitToGoogle(data){
  const url=CONFIG.GOOGLE_APPS_SCRIPT_URL;
  if(!url || url.includes("PASTE_YOUR")){
    throw new Error("Не указан URL Google Apps Script.");
  }
  const body = new URLSearchParams();
  body.set("payload", JSON.stringify(data));
  // application/x-www-form-urlencoded avoids browser preflight.
  await fetch(url, {method:"POST", mode:"no-cors", body});
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  statusEl.textContent="Собираем личное дело…";
  const fd=new FormData(form);
  const data={};
  for(const [key,value] of fd.entries()){
    if(value instanceof File) continue;
    data[key]=String(value);
  }
  try{
    data.transparent_character = await fileToDataURL(fd.get("transparent_character"));
    data.character_background = await fileToDataURL(fd.get("character_background"));
    data.submitted_at = new Date().toISOString();
    data.form_version = "NH-01";
    statusEl.textContent="Передаём запись в архив…";
    await submitToGoogle(data);
    form.reset();
    document.querySelectorAll(".file-name").forEach(x=>x.textContent="файл не выбран");
    closeForm();
    success.classList.add("open");
    success.setAttribute("aria-hidden","false");
  }catch(err){
    console.error(err);
    statusEl.textContent = err.message || "Не удалось отправить анкету. Проверьте подключение архива.";
  }
});
