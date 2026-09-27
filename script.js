const items=[];
function toggleCart(){document.getElementById('drawer').classList.toggle('open');document.getElementById('overlay').classList.toggle('open')}
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.getElementById('count').textContent=items.length;

const OWNER_KEY='unspaced_owner_pin_v1';
const CONTENT_KEY='unspaced_owner_content_v1';

function openOwner(){
  document.getElementById('ownerPanel').classList.add('open');
  document.getElementById('ownerPanel').setAttribute('aria-hidden','false');
  document.getElementById('ownerPin').focus();
}
function closeOwner(){
  document.getElementById('ownerPanel').classList.remove('open');
  document.getElementById('ownerPanel').setAttribute('aria-hidden','true');
}
function ownerLogin(){
  const pin=document.getElementById('ownerPin').value;
  if(!pin){document.getElementById('ownerLoginStatus').textContent='Enter a PIN to continue.';return}
  const stored=localStorage.getItem(OWNER_KEY);
  if(!stored){
    localStorage.setItem(OWNER_KEY,btoa(unescape(encodeURIComponent(pin))));
    showEditor();
    document.getElementById('ownerLoginStatus').textContent='';
  }else if(stored===btoa(unescape(encodeURIComponent(pin)))){
    showEditor();
    document.getElementById('ownerLoginStatus').textContent='';
  }else{
    document.getElementById('ownerLoginStatus').textContent='Incorrect PIN.';
  }
}
function showEditor(){
  document.getElementById('ownerLogin').style.display='none';
  document.getElementById('ownerEditor').style.display='block';
  loadOwnerFields();
}
function ownerLogout(){
  document.getElementById('ownerEditor').style.display='none';
  document.getElementById('ownerLogin').style.display='block';
  document.getElementById('ownerPin').value='';
}
function currentContent(){
  return JSON.parse(localStorage.getItem(CONTENT_KEY)||'null') || {
    headline:'Be completely<br>present.',
    manifesto:'Centered. Infinitely connected. Without distraction.',
    description:"Don't let self-imposed boundaries define your focus. Be the still star in the night sky while racing thoughts and worries drift past like clouds. Your state remains calm, unshaken and unbounded — present, grounded and untouched by negative energy.",
    blue:'#2418d8',
    purple:'#c35be0',
    background:'#090909'
  };
}
function loadOwnerFields(){
  const c=currentContent();
  document.getElementById('editHeadline').value=c.headline.replace(/<br>/g,' ');
  document.getElementById('editManifesto').value=c.manifesto;
  document.getElementById('editDescription').value=c.description;
  document.getElementById('editBlue').value=c.blue;
  document.getElementById('editPurple').value=c.purple;
  document.getElementById('editBackground').value=c.background || '#090909';
}
function applyContent(c){
  document.querySelector('.hero h1').innerHTML=c.headline.replace(/\n/g,'<br>');
  document.querySelector('.heroManifesto').textContent=c.manifesto;
  document.querySelector('.heroManifesto + p').textContent=c.description;
  document.documentElement.style.setProperty('--blue',c.blue);
  document.documentElement.style.setProperty('--purple',c.purple);
  document.documentElement.style.setProperty('--site-bg',c.background || '#090909');
}
function saveOwnerChanges(){
  const c={
    headline:document.getElementById('editHeadline').value,
    manifesto:document.getElementById('editManifesto').value,
    description:document.getElementById('editDescription').value,
    blue:document.getElementById('editBlue').value,
    purple:document.getElementById('editPurple').value,
    background:document.getElementById('editBackground').value
  };
  localStorage.setItem(CONTENT_KEY,JSON.stringify(c));
  applyContent(c);
  document.getElementById('ownerStatus').textContent='Saved on this device.';
}
function resetOwnerChanges(){
  localStorage.removeItem(CONTENT_KEY);
  const c=currentContent();
  applyContent(c);
  loadOwnerFields();
  document.getElementById('ownerStatus').textContent='Reset to the original UNSPACED content.';
}
applyContent(currentContent());


const CODE_KEY='unspaced_custom_code_v1';
const ORIGINAL_CODE=()=>document.documentElement.outerHTML;
function openCodeEditor(){
  const box=document.getElementById('ownerCode');
  box.classList.add('open');
  const saved=localStorage.getItem(CODE_KEY);
  document.getElementById('codeEditor').value=saved || '<!doctype html>\n'+ORIGINAL_CODE();
  document.getElementById('codeStatus').textContent=saved?'Loaded your saved code draft.':'Loaded the current site code.';
  document.getElementById('codeEditor').focus();
}
function closeCodeEditor(){
  document.getElementById('ownerCode').classList.remove('open');
}
function saveCodeDraft(){
  const code=document.getElementById('codeEditor').value;
  localStorage.setItem(CODE_KEY,code);
  document.getElementById('codeStatus').textContent='Code draft saved on this device.';
}
function resetCode(){
  localStorage.removeItem(CODE_KEY);
  document.getElementById('codeEditor').value='<!doctype html>\n'+ORIGINAL_CODE();
  document.getElementById('codeStatus').textContent='Code draft reset to the current site.';
}
function downloadCode(){
  const code=document.getElementById('codeEditor').value;
  const blob=new Blob([code],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='UNSPACED_custom.html';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  localStorage.setItem(CODE_KEY,code);
  document.getElementById('codeStatus').textContent='Downloaded UNSPACED_custom.html and saved the draft.';
}


const IMAGE_DB='unspaced_site_images_v1';
const IMAGE_STORE='images';

function openImageDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(IMAGE_DB,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(IMAGE_STORE,{keyPath:'id',autoIncrement:true});
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function getImages(){
  const db=await openImageDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(IMAGE_STORE,'readonly');
    const req=tx.objectStore(IMAGE_STORE).getAll();
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function addImage(file){
  if(!file.type.startsWith('image/')) return;
  const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
  const db=await openImageDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(IMAGE_STORE,'readwrite');
    const req=tx.objectStore(IMAGE_STORE).add({name:file.name,data,created:Date.now()});
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function deleteImage(id){
  const db=await openImageDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(IMAGE_STORE,'readwrite');
    const req=tx.objectStore(IMAGE_STORE).delete(id);
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}
async function handleImageUpload(event){
  const files=[...event.target.files];
  const status=document.getElementById('imageStatus');
  try{
    for(const file of files) await addImage(file);
    status.textContent=`Added ${files.length} image${files.length===1?'':'s'}.`;
    event.target.value='';
    await renderSiteImages();
    await renderOwnerImages();
  }catch(e){
    status.textContent='Could not add the image. Try a smaller image file.';
    console.error(e);
  }
}
async function renderOwnerImages(){
  const box=document.getElementById('ownerImageList');
  if(!box) return;
  const images=await getImages();
  box.innerHTML='';
  if(!images.length){
    box.innerHTML='<div style="grid-column:1/-1;color:#777;font-size:12px">No uploaded images yet.</div>';
    return;
  }
  images.forEach(img=>{
    const card=document.createElement('div');
    card.className='imageCard';
    card.innerHTML=`<img src="${img.data}" alt=""><div style="font-size:10px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(img.name)}</div><button onclick="removeSiteImage(${img.id})">Delete</button>`;
    box.appendChild(card);
  });
}
const CART_IMAGE_KEY='unspaced_cart_image_v1';

function renderCartImage(){
  const img=document.getElementById('cartBrandImage');
  const preview=document.getElementById('cartImagePreview');
  if(!img) return;
  const data=localStorage.getItem(CART_IMAGE_KEY);
  if(data){
    img.src=data;
    img.classList.remove('cartImageEmpty');
    if(preview){ preview.src=data; preview.classList.remove('hidden'); }
  }else{
    img.removeAttribute('src');
    img.classList.add('cartImageEmpty');
    if(preview){ preview.removeAttribute('src'); preview.classList.add('hidden'); }
  }
}
async function handleCartImageUpload(event){
  const file=event.target.files && event.target.files[0];
  const status=document.getElementById('cartImageStatus');
  if(!file) return;
  if(!file.type.startsWith('image/')){ status.textContent='Please choose an image file.'; return; }
  try{
    const data=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(file);
    });
    localStorage.setItem(CART_IMAGE_KEY,data);
    renderCartImage();
    event.target.value='';
    status.textContent='Cart image saved on this device.';
  }catch(e){
    status.textContent='Could not save that image. Try a smaller image file.';
  }
}
function removeCartImage(){
  localStorage.removeItem(CART_IMAGE_KEY);
  renderCartImage();
  const status=document.getElementById('cartImageStatus');
  if(status) status.textContent='Cart image removed.';
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
async function removeSiteImage(id){
  await deleteImage(id);
  await renderOwnerImages();
  await renderSiteImages();
  const status=document.getElementById('imageStatus');
  if(status) status.textContent='Image deleted.';
}
async function renderSiteImages(){
  const box=document.getElementById('uploadedGallery');
  if(!box) return;
  const images=await getImages();
  box.innerHTML='';
  images.forEach(img=>{
    const item=document.createElement('div');
    item.className='uploadedImage';
    item.innerHTML=`<img src="${img.data}" alt="${escapeHtml(img.name)}">`;
    box.appendChild(item);
  });
}
const originalShowEditor=showEditor;
showEditor=async function(){
  originalShowEditor();
  await renderOwnerImages();
  renderCartImage();
};
renderSiteImages();
renderCartImage();
