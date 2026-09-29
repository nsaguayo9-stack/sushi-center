const CSV_URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vRPDjKB8nMvpD9of8uJvZKQhMXNjeemxO53H0_kRtdUi0NWdCBhJy95lvpu-cTAug/pub?gid=1011029182&single=true&output=csv';
const WHATSAPP='56996188315';
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function csvRows(text){
  text=text.replace(/^\uFEFF/,''); const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted}
    else if(c===','&&!quoted){row.push(field);field=''}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}
    else field+=c;
  }
  row.push(field);if(row.some(x=>x.trim()))rows.push(row);
  const headers=(rows.shift()||[]).map(x=>x.trim().toLowerCase());
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}
function price(value){const s=String(value||'').trim();if(!s)return null;const n=Number(s.replace(/[^\d]/g,''));return Number.isFinite(n)&&n>0?n:null}
function options(value){
  const s=String(value||'');const m=s.match(/(?:envoltura:\s*)([^;]+)/i);
  return m?m[1].split('/').map(x=>x.trim()).filter(Boolean):[];
}
function parseProducts(text){return csvRows(text).map((r,i)=>({
  id:`${r['categoría']||''}|${r.nombre||''}|${r['opciones/tamaños']||''}`,
  category:r['categoría']||'Otros',name:r.nombre||`Producto ${i+1}`,description:r['descripción']||'',detail:r['opciones/tamaños']||'',price:price(r.precio),available:/^(s[ií]|yes|true|1)$/i.test(r.stock||''),photo:r.foto||'',choices:options(r['opciones/tamaños'])
})).filter(p=>p.name)}
let products=[],cart=[],category='Todos',query='',live=false;const saved=sessionStorage.getItem('sc-cart');if(saved){try{cart=JSON.parse(saved)}catch{}}
const persist=()=>sessionStorage.setItem('sc-cart',JSON.stringify(cart));
const toast=message=>{const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600)};
function categories(){const names=['Todos',...new Set(products.map(p=>p.category))];$('#categories').innerHTML=names.map(n=>`<button type="button" class="chip ${n===category?'active':''}" data-category="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('')}
function productCard(p,index){const unavailable=!p.available||p.price===null;const hasPhoto=Boolean(p.photo);
  return `<article class="product ${hasPhoto?'with-photo':'no-photo'}" data-index="${index}">
    ${hasPhoto?`<div class="product-image"><img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.name)}" loading="lazy" referrerpolicy="no-referrer"></div>`:''}
    <div class="product-body"><div class="product-top"><span class="product-category">${escapeHtml(p.category)}</span>${unavailable?'<span class="soldout">Agotado</span>':''}</div>
    <h3>${escapeHtml(p.name)}</h3>${p.description?`<p class="description">${escapeHtml(p.description)}</p>`:''}
    ${p.detail?`<p class="detail">${escapeHtml(p.detail)}</p>`:''}
    ${p.choices.length&&!unavailable?`<label class="option-label">Elige tu envoltura<select aria-label="Envoltura para ${escapeHtml(p.name)}">${p.choices.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></label>`:''}
    <div class="product-bottom"><strong>${p.price===null?'Precio pendiente':money(p.price)}</strong><button type="button" class="add" ${unavailable?'disabled':''} aria-label="Agregar ${escapeHtml(p.name)} al pedido">${unavailable?'No disponible':'Agregar +'}</button></div></div></article>`}
function renderProducts(){const filtered=products.map((p,i)=>({...p,index:i})).filter(p=>(category==='Todos'||p.category===category||(category==='Promociones'&&p.category==='Promociones vegetarianas'))&&`${p.name} ${p.description} ${p.category}`.toLocaleLowerCase('es').includes(query));$('#products').innerHTML=filtered.map(p=>productCard(p,p.index)).join('');$('#empty').hidden=filtered.length>0;categories()}
function syncCart(){let changed=false;cart=cart.filter(item=>{const p=products.find(x=>x.id===item.id);if(!p||!p.available||p.price===null){changed=true;return false}if(item.price!==p.price||item.name!==p.name){item.price=p.price;item.name=p.name;changed=true}return true});if(changed)persist();renderCart()}
function renderCart(){const count=cart.reduce((n,x)=>n+x.qty,0),total=cart.reduce((n,x)=>n+x.qty*x.price,0);$('#cart-count').textContent=count;$('#cart-total').textContent=money(total);
  $('#cart-lines').innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-line"><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.detail||'')}${x.choice?' · '+escapeHtml(x.choice):''}</small><b>${money(x.price*x.qty)}</b></div><div class="quantity"><button type="button" data-cart="minus" data-i="${i}" aria-label="Reducir ${escapeHtml(x.name)}">−</button><span>${x.qty}</span><button type="button" data-cart="plus" data-i="${i}" aria-label="Aumentar ${escapeHtml(x.name)}">+</button></div><button class="remove" type="button" data-cart="remove" data-i="${i}">Eliminar</button></div>`).join(''):'<p class="empty-cart">Tu carrito está vacío. Explora la carta y agrega lo que te guste.</p>';
  const link=$('#whatsapp');if(cart.length){const lines=cart.map(x=>`• ${x.qty} × ${x.name}${x.detail?` (${x.detail})`:''}${x.choice?` · envoltura: ${x.choice}`:''} — ${money(x.qty*x.price)}`);const message=`Hola Sushi Center Talca, quisiera hacer este pedido:\n\n${lines.join('\n')}\n\nTotal estimado: ${money(total)}\n\n¿Me confirman disponibilidad y entrega?`;link.href=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;link.removeAttribute('aria-disabled')}else{link.removeAttribute('href');link.setAttribute('aria-disabled','true')}}
function openCart(){const d=$('#drawer');d.classList.add('open');d.setAttribute('aria-hidden','false');$('#overlay').hidden=false;document.body.classList.add('no-scroll');$('#close-cart').focus()}
function closeCart(){const d=$('#drawer');d.classList.remove('open');d.setAttribute('aria-hidden','true');$('#overlay').hidden=true;document.body.classList.remove('no-scroll')}
$('#open-cart').onclick=openCart;$('#contact-cart').onclick=openCart;$('#close-cart').onclick=closeCart;$('#overlay').onclick=closeCart;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});
$('#categories').onclick=e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;renderProducts()};
$('#show-promos').onclick=()=>{category='Promociones';renderProducts();$('#carta').scrollIntoView({behavior:'smooth'})};
$('#search').oninput=e=>{query=e.target.value.trim().toLocaleLowerCase('es');renderProducts()};
$('#products').onclick=e=>{const b=e.target.closest('.add');if(!b||b.disabled)return;const card=b.closest('[data-index]'),p=products[Number(card.dataset.index)],choice=card.querySelector('select')?.value||'';const item=cart.find(x=>x.id===p.id&&x.choice===choice);if(item)item.qty++;else cart.push({id:p.id,name:p.name,detail:p.detail,choice,price:p.price,qty:1});persist();renderCart();toast(`${p.name} agregado al pedido`)};
$('#products').addEventListener('error',e=>{if(e.target.matches('.product-image img')){e.target.closest('.product').classList.remove('with-photo');e.target.closest('.product-image').remove()}},true);
$('#cart-lines').onclick=e=>{const b=e.target.closest('[data-cart]');if(!b)return;const i=Number(b.dataset.i);if(b.dataset.cart==='remove')cart.splice(i,1);else if(b.dataset.cart==='plus')cart[i].qty++;else if(--cart[i].qty<=0)cart.splice(i,1);persist();renderCart()};
$('#whatsapp').onclick=e=>{if(!cart.length)e.preventDefault()};
async function load(){try{const response=await fetch(CSV_URL,{cache:'no-store'});if(!response.ok)throw Error(`HTTP ${response.status}`);const text=await response.text();const loaded=parseProducts(text);if(!loaded.length)throw Error('Sin productos');products=loaded;live=true;$('#data-status').textContent=`Carta actualizada · ${products.length} productos`;}
  catch(error){try{const response=await fetch('/catalogo-respaldo.csv');products=parseProducts(await response.text());$('#data-status').textContent='Mostrando copia de la carta · verifica precios y stock por WhatsApp';}catch{$('#data-status').textContent='No se pudo cargar la carta. Inténtalo más tarde.'}}
  syncCart();renderProducts()}
load();document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});setInterval(()=>{if(!document.hidden)load()},5*60*1000);
