(function(){
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
  const clean = n => n.replace(/\s*⚡/g,"").trim();
  const src = k => `img/${k}.webp`;

  /* ===== WhatsApp ===== */
  function openWhatsApp(message){
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,"")}?text=${encodeURIComponent(message)}`;
    const toast = $("toast");
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); window.open(url, "_blank", "noopener,noreferrer"); }, 250);
  }

  /* ===== Cardápio ===== */
  function photo(name, img){
    const alt = esc(clean(name));
    const im = k => `<img src="${src(k)}" alt="${alt}" width="377" height="472" loading="lazy" decoding="async">`;
    if (Array.isArray(img)) return `<div class="photo duo">${img.map(im).join("")}</div>`;
    if (img) return `<div class="photo">${im(img)}</div>`;
    return `<div class="photo soon" aria-hidden="true">⚡</div>`;
  }

  function card([name, desc, price, img], withPhoto){
    const btn = `<button class="order" data-name="${esc(name)}" data-price="${esc(price)}">PEDIR →</button>`;
    if (withPhoto) {
      return `<article class="card">${photo(name,img)}<div class="body"><div class="tag">⚡ PEDIDO PELO WHATSAPP</div><h3>${name}</h3><p class="desc">${desc}</p><div class="bottom"><div class="price">${price}</div>${btn}</div></div></article>`;
    }
    const thumb = img
      ? `<img class="thumb" src="${src(img)}" alt="${esc(name)}" width="68" height="68" loading="lazy" decoding="async">`
      : `<span class="ico${name === "Cebola roxa" ? " roxa" : ""}" aria-hidden="true">${ICONS[name] || "⚡"}</span>`;
    return `<article class="card plain"><div class="body"><div class="toprow"><div class="tag">⚡ ${esc(desc)}</div>${thumb}</div><h3>${name}</h3><div class="bottom"><div class="price">${price}</div>${btn}</div></div></article>`;
  }

  function render(id, data, withPhoto){
    $(id).innerHTML = data.map(d => card(d, withPhoto)).join("");
  }
  render("burger-grid", MENU.burgers, true);
  render("porcao-grid", MENU.porcoes, true);
  render("combo-grid", MENU.combos, true);
  render("topping-grid", MENU.toppings, false);

  document.addEventListener("click", e => {
    const b = e.target.closest(".order");
    if (b) openWhatsApp(`Olá! Quero pedir o *${clean(b.dataset.name)}*${b.dataset.price ? ` por ${b.dataset.price}` : ""}.`);
    const w = e.target.closest("[data-wa]");
    if (w) { e.preventDefault(); openWhatsApp(w.dataset.wa); }
  });

  /* ===== Promoções ===== */
  const PROMOS_KEY = "shock_promos_v5";
  const clone = o => JSON.parse(JSON.stringify(o));
  const state = { promos: clone(PROMOS_DEFAULT), editing: false };
  try {
    const s = localStorage.getItem(PROMOS_KEY);
    if (s) state.promos = Object.assign(clone(PROMOS_DEFAULT), JSON.parse(s));
  } catch(e){}

  const pSection = $("promocoes"), pGrid = $("promo-grid");

  function pRender(){
    const { promos, editing } = state;
    pGrid.innerHTML = promos.items.map((p,i) => `<article class="pcard" data-i="${i}">
      <div class="pimg">
        ${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.title)}" decoding="async">` : `<div class="empty">Sem imagem</div>`}
        <span class="pbadge" data-f="badge">${esc(p.badge)}</span>
      </div>
      <div class="pbody">
        <div class="ptitle" data-f="title">${esc(p.title)}</div>
        <div class="pdesc" data-f="desc">${esc(p.desc)}</div>
        <div class="prow">
          <div><div class="pold" data-f="old">${esc(p.old)}</div><div class="pprice" data-f="price">${esc(p.price)}</div></div>
          <button type="button" class="pbtn" data-f="btn">${esc(p.btn)}</button>
        </div>
      </div>
    </article>`).join("");
    const empty = promos.items.length === 0;
    pSection.hidden = !(editing || (promos.on && !empty));
    pSection.classList.toggle("editing", editing);
    pSection.classList.toggle("dim", editing && !promos.on);
    $("navPromo").hidden = !(promos.on && !empty);
    if (editing && window.ShockEdit) ShockEdit.afterRender();
  }

  pGrid.addEventListener("click", e => {
    if (state.editing) return;
    if (!e.target.closest(".pbtn")) return;
    const p = state.promos.items[+e.target.closest(".pcard").dataset.i];
    openWhatsApp(`Olá! Quero aproveitar a promoção *${p.title}*${p.price ? ` por ${p.price}` : ""}.`);
  });

  /* ===== Modo edição (carregado só quando necessário) ===== */
  let editLoading = false;
  function startEditing(){
    if (state.editing) return;
    if (window.ShockEdit) { ShockEdit.start(); return; }
    if (editLoading) return;
    editLoading = true;
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "css/edit.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "js/edit.js";
    js.onload = () => ShockEdit.init({ state, pSection, pGrid, pRender, PROMOS_KEY, PROMOS_DEFAULT, clone, esc });
    document.head.appendChild(js);
  }
  window.__startEditing = startEditing;

  let clicks = 0, timer;
  $("promoTag").addEventListener("click", () => {
    if (state.editing) return;
    clicks++; clearTimeout(timer); timer = setTimeout(() => { clicks = 0; }, 2500);
    if (clicks >= 5) { clicks = 0; startEditing(); }
  });
  const checkEditHash = () => { if (/editar/i.test(location.hash) || /[?&]editar/i.test(location.search)) startEditing(); };
  window.addEventListener("hashchange", checkEditHash);

  pRender();
  checkEditHash();
})();
