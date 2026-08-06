/*
 * gwk-chat — a minimal, aesthetic AI chat widget for gregorykyro.com
 * Self-injecting: adds its own styles + DOM, no dependencies.
 *
 * SETUP: point CHAT_ENDPOINT at your deployed Cloudflare Worker URL
 * (or set window.GWK_CHAT_ENDPOINT before this script loads).
 */
(function () {
  "use strict";

  var CHAT_ENDPOINT =
    (typeof window !== "undefined" && window.GWK_CHAT_ENDPOINT) ||
    "https://gwk-chat.bibleverse.workers.dev";

  if (document.getElementById("gwk-chat-root")) return; // avoid double-init

  var SUGGESTIONS = [
    "What is Greg building at Lila?",
    "What's his most impactful research?",
    "How can I reach him?"
  ];

  var GREETING =
    "Hi \u2014 I'm Greg's AI assistant.";

  // ---------- styles ----------
  var css = [
    "#gwk-chat-root{--gwk-fg:var(--fg,#f5f5f7);--gwk-bg:var(--bg,#000);--gwk-accent:var(--accent,#0a84ff);--gwk-muted:var(--fg-muted,#8a8a8f);--gwk-line:rgba(255,255,255,.12);--gwk-panel:rgba(20,20,22,.72);--gwk-user:rgba(255,255,255,.10);--gwk-sans:var(--font-sans,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif);font-family:var(--gwk-sans);}",
    "#gwk-launch{position:fixed;right:24px;bottom:24px;z-index:2147483000;height:52px;min-width:52px;padding:0 18px;display:inline-flex;align-items:center;gap:10px;border-radius:999px;border:1px solid var(--gwk-line);background:rgba(20,20,22,.6);color:var(--gwk-fg);cursor:pointer;-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);box-shadow:0 8px 30px rgba(0,0,0,.45);font-size:14px;font-weight:500;letter-spacing:-.01em;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .3s ease,box-shadow .3s ease;}",
    "#gwk-launch:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(0,0,0,.55);}",
    "#gwk-launch .gwk-dot{width:8px;height:8px;border-radius:50%;background:var(--gwk-accent);box-shadow:0 0 10px var(--gwk-accent);flex:none;}",
    "#gwk-launch.gwk-hidden{opacity:0;pointer-events:none;transform:translateY(8px) scale(.96);}",
    "#gwk-panel{position:fixed;right:24px;bottom:24px;z-index:2147483001;width:384px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 48px);display:flex;flex-direction:column;border-radius:20px;border:1px solid var(--gwk-line);background:var(--gwk-panel);-webkit-backdrop-filter:blur(28px) saturate(180%);backdrop-filter:blur(28px) saturate(180%);box-shadow:0 24px 70px rgba(0,0,0,.6);overflow:hidden;opacity:0;transform:translateY(16px) scale(.98);transform-origin:bottom right;pointer-events:none;transition:opacity .35s cubic-bezier(.2,.8,.2,1),transform .35s cubic-bezier(.2,.8,.2,1);}",
    "#gwk-panel.gwk-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}",
    "#gwk-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--gwk-line);}",
    "#gwk-head .gwk-title{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;letter-spacing:-.01em;color:var(--gwk-fg);}",
    "#gwk-head .gwk-dot{width:7px;height:7px;border-radius:50%;background:var(--gwk-accent);box-shadow:0 0 10px var(--gwk-accent);}",
    "#gwk-close{appearance:none;background:transparent;border:0;color:var(--gwk-muted);cursor:pointer;line-height:1;padding:6px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;transition:color .2s ease,background .2s ease;}",
    "#gwk-close:hover{color:var(--gwk-fg);background:rgba(255,255,255,.06);}",
    "#gwk-msgs{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth;}",
    "#gwk-msgs.gwk-empty{justify-content:center;}",
    "#gwk-msgs::-webkit-scrollbar{width:8px;}#gwk-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px;}",
    ".gwk-msg{max-width:85%;font-size:14px;line-height:1.55;letter-spacing:-.01em;white-space:pre-wrap;word-wrap:break-word;}",
    ".gwk-msg.gwk-a{align-self:flex-start;color:var(--gwk-fg);}",
    ".gwk-msg.gwk-u{align-self:flex-end;color:var(--gwk-fg);background:var(--gwk-user);padding:10px 14px;border-radius:16px 16px 4px 16px;}",
    ".gwk-msg a{color:var(--gwk-accent);text-decoration:none;}.gwk-msg a:hover{text-decoration:underline;}",
    ".gwk-intro{color:var(--gwk-muted);font-size:14px;line-height:1.55;}",
    ".gwk-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}",
    ".gwk-chip{appearance:none;border:1px solid var(--gwk-line);background:rgba(255,255,255,.03);color:var(--gwk-fg);font:inherit;font-size:12.5px;padding:8px 12px;border-radius:999px;cursor:pointer;transition:background .2s ease,border-color .2s ease,transform .2s ease;}",
    ".gwk-chip:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.24);transform:translateY(-1px);}",
    ".gwk-typing{display:inline-flex;gap:4px;align-items:center;height:16px;}",
    ".gwk-typing i{width:6px;height:6px;border-radius:50%;background:var(--gwk-muted);animation:gwkblink 1.2s infinite ease-in-out;}",
    ".gwk-typing i:nth-child(2){animation-delay:.2s;}.gwk-typing i:nth-child(3){animation-delay:.4s;}",
    "@keyframes gwkblink{0%,80%,100%{opacity:.25;transform:translateY(0);}40%{opacity:1;transform:translateY(-2px);}}",
    "#gwk-form{display:flex;align-items:flex-end;gap:8px;padding:12px;border-top:1px solid var(--gwk-line);}",
    "#gwk-input{flex:1;resize:none;max-height:120px;min-height:22px;background:transparent;border:0;outline:0;color:var(--gwk-fg);font:inherit;font-size:14px;line-height:1.5;letter-spacing:-.01em;padding:8px 6px;}",
    "#gwk-input::placeholder{color:var(--gwk-muted);}",
    "#gwk-send{appearance:none;flex:none;width:36px;height:36px;border-radius:50%;border:1px solid var(--gwk-line);background:var(--gwk-fg);color:var(--gwk-bg);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:opacity .2s ease,transform .2s ease;}",
    "#gwk-send:hover{transform:scale(1.05);}#gwk-send:disabled{opacity:.35;cursor:default;transform:none;}",
    ".gwk-foot{padding:0 14px 10px;font-size:10.5px;color:var(--gwk-muted);text-align:center;letter-spacing:.01em;}",
    "@media (max-width:520px){#gwk-panel{right:8px;bottom:8px;width:calc(100vw - 16px);height:calc(100vh - 16px);max-height:calc(100vh - 16px);border-radius:18px;}#gwk-launch{right:16px;bottom:16px;}}",
    "@media (prefers-reduced-motion:reduce){#gwk-panel,#gwk-launch{transition:none;}.gwk-typing i{animation:none;}}"
  ].join("");

  var style = document.createElement("style");
  style.id = "gwk-chat-style";
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- DOM ----------
  var root = document.createElement("div");
  root.id = "gwk-chat-root";
  root.innerHTML =
    '<button id="gwk-launch" aria-label="Open chat with Greg\'s AI assistant">' +
    '<span class="gwk-dot"></span><span>Ask</span></button>' +
    '<section id="gwk-panel" role="dialog" aria-modal="false" aria-label="Chat with Greg\'s AI assistant">' +
    '<header id="gwk-head"><span class="gwk-title"><span class="gwk-dot"></span>Ask about Greg</span>' +
    '<button id="gwk-close" aria-label="Minimize chat" title="Minimize">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' +
    "</button></header>" +
    '<div id="gwk-msgs" aria-live="polite"></div>' +
    '<form id="gwk-form">' +
    '<textarea id="gwk-input" rows="1" placeholder="Ask anything about Greg\u2026" autocomplete="off"></textarea>' +
    '<button id="gwk-send" type="submit" aria-label="Send message">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11l5-5 5 5"/><path d="M12 6v12"/></svg>' +
    "</button></form>" +
    '<div class="gwk-foot">AI can be imperfect \u00b7 verify important details</div>' +
    "</section>";
  document.body.appendChild(root);

  var launch = root.querySelector("#gwk-launch");
  var panel = root.querySelector("#gwk-panel");
  var closeBtn = root.querySelector("#gwk-close");
  var msgs = root.querySelector("#gwk-msgs");
  var form = root.querySelector("#gwk-form");
  var input = root.querySelector("#gwk-input");
  var sendBtn = root.querySelector("#gwk-send");

  var history = []; // {role, content}
  var busy = false;
  var greeted = false;

  // ---------- helpers ----------
  function esc(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  // minimal markdown: links, **bold**, *italic*, and line breaks (already pre-wrap)
  function render(text) {
    var h = esc(text);
    h = h.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    h = h.replace(/(^|[\s(])((https?:\/\/)[^\s)]+)(?![^<]*<\/a>)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
    return h;
  }
  function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }

  function addMsg(role, text) {
    msgs.classList.remove("gwk-empty");
    var el = document.createElement("div");
    el.className = "gwk-msg " + (role === "user" ? "gwk-u" : "gwk-a");
    el.innerHTML = role === "user" ? esc(text) : render(text);
    msgs.appendChild(el);
    scrollDown();
    return el;
  }

  function showIntro() {
    if (greeted) return;
    greeted = true;
    var wrap = document.createElement("div");
    wrap.className = "gwk-a gwk-intro";
    wrap.innerHTML =
      "<div>" + esc(GREETING) + "</div>" +
      '<div class="gwk-chips">' +
      SUGGESTIONS.map(function (s) {
        return '<button class="gwk-chip" type="button">' + esc(s) + "</button>";
      }).join("") +
      "</div>";
    msgs.appendChild(wrap);
    msgs.classList.add("gwk-empty");
    wrap.querySelectorAll(".gwk-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        input.value = chip.textContent;
        submit();
      });
    });
    scrollDown();
  }

  function typingBubble() {
    var el = document.createElement("div");
    el.className = "gwk-msg gwk-a";
    el.innerHTML = '<span class="gwk-typing"><i></i><i></i><i></i></span>';
    msgs.appendChild(el);
    scrollDown();
    return el;
  }

  function openPanel() {
    panel.classList.add("gwk-open");
    launch.classList.add("gwk-hidden");
    showIntro();
    setTimeout(function () { input.focus(); }, 300);
  }
  function closePanel() {
    panel.classList.remove("gwk-open");
    launch.classList.remove("gwk-hidden");
    launch.focus();
  }

  // ---------- networking (streaming plain text) ----------
  function streamReply(bubble) {
    return fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    }).then(function (res) {
      if (!res.ok || !res.body) {
        return res.text().then(function (t) {
          throw new Error(t || ("HTTP " + res.status));
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var acc = "";
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return acc;
          acc += decoder.decode(r.value, { stream: true });
          bubble.innerHTML = render(acc);
          scrollDown();
          return pump();
        });
      }
      return pump();
    });
  }

  function submit() {
    var text = (input.value || "").trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    input.value = "";
    input.style.height = "auto";
    addMsg("user", text);
    history.push({ role: "user", content: text });

    var bubble = typingBubble();
    streamReply(bubble)
      .then(function (full) {
        var out = (full || "").trim();
        if (!out) {
          bubble.innerHTML = render("Sorry, I didn't get a response. Please try again.");
        } else {
          bubble.innerHTML = render(out);
          history.push({ role: "assistant", content: out });
        }
      })
      .catch(function (err) {
        var msg =
          CHAT_ENDPOINT.indexOf("REPLACE-WITH-YOUR-WORKER") !== -1
            ? "The assistant isn't connected yet (the endpoint hasn't been configured)."
            : "Sorry, something went wrong reaching the assistant. Please try again in a moment.";
        bubble.innerHTML = render(msg);
        if (window.console) console.error("[gwk-chat]", err);
      })
      .then(function () {
        busy = false;
        sendBtn.disabled = false;
        input.focus();
        scrollDown();
      });
  }

  // ---------- events ----------
  launch.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("gwk-open")) closePanel();
  });
})();
