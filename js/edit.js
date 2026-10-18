// Modo edição das promoções (carregado sob demanda: #editar na URL ou 5 cliques em "Ofertas").
window.ShockEdit = (function(){
  let C, pFile, pickIndex = -1, tools;

  const status = t => {
    const el = document.getElementById("pstatus");
    el.textContent = t; clearTimeout(status.t);
    status.t = setTimeout(() => { el.textContent = ""; }, 2600);
  };
  const save = () => {
    try { localStorage.setItem(C.PROMOS_KEY, JSON.stringify(C.state.promos)); status("Salvo neste navegador ✓"); }
    catch(e){ status("Não foi possível salvar (imagem muito grande?)"); }
  };

  function afterRender(){
    C.pGrid.querySelectorAll("[data-f]").forEach(el => el.setAttribute("contenteditable","true"));
    C.pGrid.querySelectorAll(".pimg").forEach(box => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ppick"; b.textContent = "📷 Trocar imagem";
      box.appendChild(b);
    });
    document.getElementById("tToggle").textContent = C.state.promos.on ? "Ocultar seção" : "Mostrar seção";
  }

  function setEditing(on){
    C.state.editing = on; C.pRender();
    if (on) C.pSection.scrollIntoView({behavior:"smooth", block:"start"});
  }

  function init(ctx){
    C = ctx;
    tools = document.createElement("div");
    tools.className = "ptools"; tools.id = "ptools";
    tools.innerHTML = `<b>Modo edição</b> — clique nos textos com borda tracejada para escrever, e troque a imagem da promoção.
      <div>
        <button type="button" class="tbtn main" id="tDone">✓ Concluir</button>
        <button type="button" class="tbtn" id="tToggle">Ocultar seção</button>
        <button type="button" class="tbtn" id="tReset">Restaurar padrão</button>
        <span class="pstatus" id="pstatus"></span>
      </div>
      <input type="file" id="pfile" accept="image/*" hidden>`;
    C.pGrid.parentNode.insertBefore(tools, C.pGrid);
    pFile = document.getElementById("pfile");

    C.pGrid.addEventListener("input", e => {
      const el = e.target.closest("[data-f]"); if (!el) return;
      const i = +el.closest(".pcard").dataset.i;
      C.state.promos.items[i][el.dataset.f] = el.textContent.trim();
      clearTimeout(save.t); save.t = setTimeout(save, 400);
    });
    C.pGrid.addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.closest("[data-f]")) { e.preventDefault(); e.target.blur(); }
    });
    C.pGrid.addEventListener("paste", e => {
      if (!e.target.closest("[data-f]")) return;
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData("text").replace(/\s+/g," ");
      document.execCommand("insertText", false, t);
    });
    C.pGrid.addEventListener("click", e => {
      if (e.target.closest(".ppick")) { pickIndex = +e.target.closest(".pcard").dataset.i; pFile.click(); }
    });

    pFile.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file || pickIndex < 0) return;
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const r = Math.min(1, 900 / im.width), c = document.createElement("canvas");
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        C.state.promos.items[pickIndex].img = c.toDataURL("image/webp", .8);
        URL.revokeObjectURL(url); C.pRender(); save();
      };
      im.src = url; e.target.value = "";
    });

    document.getElementById("tToggle").addEventListener("click", () => { C.state.promos.on = !C.state.promos.on; C.pRender(); save(); });
    document.getElementById("tReset").addEventListener("click", () => {
      if (!confirm("Voltar para as promoções padrão?")) return;
      try { localStorage.removeItem(C.PROMOS_KEY); } catch(e){}
      C.state.promos = C.clone(C.PROMOS_DEFAULT); C.pRender(); status("Restaurado ✓");
    });
    document.getElementById("tDone").addEventListener("click", () => {
      save(); setEditing(false);
      if (/editar/i.test(location.hash)) history.replaceState(null,"",location.pathname + location.search);
    });

    setEditing(true);
  }
  return { init, afterRender, start: () => setEditing(true) };
})();
