(()=>{
  const $ = id => document.getElementById(id),
        KEY = "paqueta-demo-v1",
        target = 5;

  const tokens = {
    "PAQUETA-123": "Mercado Centro",
    "PAQUETA-456": "Super Bahia",
    "PAQUETA-789": "Mercado da Praia"
  };

  let s;
  try {
    s = JSON.parse(localStorage.getItem(KEY)) || { profile: null, stamps: [], used: [], redemptions: [] };
  } catch {
    s = { profile: null, stamps: [], used: [], redemptions: [] };
  }

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(s));
    render();
  };

  const show = id => {
    ["welcome", "profile", "app", "adminView"].forEach(x => $(x).classList.toggle("hidden", x !== id));
    scrollTo(0, 0);
  };

  const say = t => { $("message").textContent = t; };

  function add(token, store) {
    if (!s.profile) {
      show("profile");
      return;
    }

    token = (token || "").trim().toUpperCase();
    if (token) {
      if (!tokens[token]) {
        say("Código inválido. Teste PAQUETA-123, PAQUETA-456 ou PAQUETA-789.");
        return;
      }
      store = tokens[token];
    } else {
      token = "DEMO-" + store + "-" + new Date().toISOString().slice(0, 10);
    }

    if (s.used.includes(token)) {
      say("Este código já foi usado nesta caderneta.");
      return;
    }

    if (s.stamps.length >= 15) {
      say("Limite de 15 carimbos da demonstração atingido.");
      return;
    }

    s.used.push(token);
    s.stamps.push({ store, at: new Date().toISOString(), token });
    save();
    say("Carimbo de demonstração adicionado: " + store + ".");
  }

  function render() {
    let n = s.stamps.length,
        progress = n ? ((n % target) || target) : 0;

    $("person").textContent = s.profile?.name?.split(" ")[0] || "participante";
    $("count").textContent = n;
    $("left").textContent = n >= target ? 0 : target - n;
    $("stamps").innerHTML = Array.from({ length: target }, (_, i) =>
      `<div class="stamp ${i < progress ? "full" : ""}">${i < progress ? "★" : i + 1}</div>`
    ).join("");

    const rs = [
      ["cupom", "Cupom de desconto", 5, "％"],
      ["kit", "Kit Paquetá", 10, "🎁"],
      ["surpresa", "Surpresa especial", 15, "★"]
    ];

    $("rewards").innerHTML = rs.map(([id, name, cost, icon]) => {
      let done = s.redemptions.some(r => r.id === id);
      return `<div class="reward"><div>${icon} <b>${name}</b><small>${cost} carimbos · ilustrativo</small></div><button data-r="${id}" ${n < cost || done ? "disabled" : ""}>${done ? "Resgatado" : n < cost ? "Faltam " + (cost - n) : "Resgatar"}</button></div>`;
    }).join("");

    $("history").innerHTML = n
      ? s.stamps.slice().reverse().map(x =>
          `<div class="history">★ <b>${x.store}</b> · ${new Date(x.at).toLocaleString("pt-BR")}</div>`
        ).join("")
      : "<p class='note'>Nenhum carimbo registrado ainda.</p>";

    $("aUsers").textContent = s.profile ? 1 : 0;
    $("aStamps").textContent = n;
    $("aRewards").textContent = s.redemptions.length;
  }

  $("start").onclick = () => show(s.profile ? "app" : "profile");
  $("admin").onclick = () => { render(); show("adminView"); };
  $("back").onclick = () => show(s.profile ? "app" : "welcome");

  $("form").onsubmit = e => {
    e.preventDefault();
    s.profile = { name: $("name").value.trim(), email: $("email").value.trim() };
    save();
    show("app");
  };

  $("edit").onclick = () => {
    if (s.profile) {
      $("name").value = s.profile.name;
      $("email").value = s.profile.email || "";
    }
    show("profile");
  };

  $("nfc").onclick = () => add("", $("store").value);
  $("validate").onclick = () => {
    add($("token").value, "");
    $("token").value = "";
  };

  $("token").onkeydown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("validate").click();
    }
  };

  $("rewards").onclick = e => {
    let b = e.target.closest("[data-r]");
    if (!b) return;

    const r = { cupom: "Cupom de desconto", kit: "Kit Paquetá", surpresa: "Surpresa especial" };
    s.redemptions.push({
      id: b.dataset.r,
      name: r[b.dataset.r],
      code: "DEMO-" + Math.random().toString(36).slice(2, 8).toUpperCase()
    });
    save();
    say("Resgate apenas simulado.");
  };

  $("reset").onclick = () => {
    if (confirm("Apagar os dados desta demonstração?")) {
      s = { profile: null, stamps: [], used: [], redemptions: [] };
      save();
      show("welcome");
    }
  };

  $("export").onclick = () => {
    let rows = [["tipo", "nome", "loja", "data", "codigo"], ...s.stamps.map(x => ["carimbo", s.profile?.name || "", x.store, x.at, x.token]), ...s.redemptions.map(x => ["resgate", s.profile?.name || "", x.name, x.at, x.code])];
    let csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\r\n");
    let a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "relatorio-paqueta-demo.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  render();
  if (s.profile) show("app");
})();
