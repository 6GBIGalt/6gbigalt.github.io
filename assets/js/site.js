// Portfolio de Greg Gargiulo : en-tête, menu, slider des projets, aperçus, carrousels.
// Aucun framework, aucun écouteur de défilement sur la fenêtre. Le site reste lisible sans ce script.

(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.replace("no-js", "js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  // ------------------------------------------------------------ en-tête
  // Un filet apparaît sous l'en-tête dès que la page n'est plus tout en haut.
  if (hasIO) {
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none";
    document.body.prepend(sentinel);
    new IntersectionObserver(([e]) => root.classList.toggle("is-scrolled", !e.isIntersecting)).observe(sentinel);
  }

  // ------------------------------------------------------------ grands titres
  // Les noms du parcours et « M'écrire. » montent mot à mot, comme le titre de l'accueil, quand leur
  // bloc arrive à l'écran. Avec les animations réduites, ou sans IntersectionObserver, ils s'affichent.
  const reveals = document.querySelectorAll("[data-reveal]");
  if (!hasIO || reduce) reveals.forEach((el) => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    reveals.forEach((el) => io.observe(el));
  }

  // ------------------------------------------------------------ menu
  const toggle = document.querySelector(".toggle");
  const menu = document.getElementById("menu");
  if (toggle && menu) {
    const behind = document.querySelectorAll("main, .foot, .skip");
    const setOpen = (open, focusBack = false) => {
      root.dataset.menu = open ? "open" : "closed";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      behind.forEach((el) => (el.inert = open));
      if (open) menu.querySelector("a")?.focus({ preventScroll: true });
      else if (focusBack) toggle.focus();
    };
    toggle.addEventListener("click", () => setOpen(root.dataset.menu !== "open"));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
      // Au doigt, taper la zone vide du menu le ferme aussi.
      else if (e.target === menu) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root.dataset.menu === "open") setOpen(false, true);
    });
  }

  // ------------------------------------------------------------ pause des animations
  // Le bouton pause des carrousels arrête, sur toute la page, les écrans animés et le passage
  // automatique ; le choix est gardé d'une page à l'autre. Avec les animations réduites, rien ne
  // bouge et le bouton n'est pas affiché.
  const STILL = "portfolio-animations";
  const isStill = () => root.classList.contains("is-still");
  // La liste des boutons est relue à chaque appel : la visionneuse ajoute le sien plus bas.
  const applyStill = (on) => {
    root.classList.toggle("is-still", on);
    document.querySelectorAll(".reel-pause").forEach((b) => b.setAttribute("aria-label", on ? "Relancer les animations" : "Mettre les animations en pause"));
  };
  const wirePause = (b) =>
    b.addEventListener("click", () => {
      const on = !isStill();
      applyStill(on);
      try {
        if (on) localStorage.setItem(STILL, "pause");
        else localStorage.removeItem(STILL);
      } catch {}
    });
  try {
    applyStill(localStorage.getItem(STILL) === "pause");
  } catch {}
  document.querySelectorAll(".reel-pause").forEach(wirePause);

  // ------------------------------------------------------------ carrousels (accueil et études)
  // Un carrousel classique, indépendant du défilement : les flèches, ou un glissement du doigt, passent
  // d'une scène à l'autre, en boucle, et l'écran affiché s'anime de lui-même. Dès que son animation a
  // fini son premier passage, le carrousel passe seul à la scène suivante, tant qu'il est à l'écran ;
  // il se met en pause quand le focus clavier y est, quand la visionneuse est ouverte, quand l'onglet
  // est masqué ou quand les animations sont en pause, et ne tourne pas seul avec les animations réduites.
  document.querySelectorAll(".reel").forEach((reel) => {
    const slides = [...reel.querySelectorAll(".reel-slide")];
    const link = reel.querySelector("a.reel-link");
    const title = reel.querySelector(".reel-title");
    const outcome = reel.querySelector(".reel-outcome, .reel-caption");
    const count = reel.querySelector(".reel-count");
    let index = -1;
    // La scène affichée et ses voisines sont rendues : leurs images se chargent avant leur tour.
    const show = (i) => {
      if (i === index) return;
      index = i;
      slides.forEach((sl, k) => {
        sl.classList.toggle("is-on", k === i);
        const d = Math.abs(k - i);
        sl.classList.toggle("is-near", Math.min(d, slides.length - d) <= 1);
      });
      const d = slides[i].dataset;
      if (link) link.href = d.href;
      if (title) title.textContent = d.name;
      if (outcome) outcome.textContent = d.outcome;
      if (count) count.textContent = `${i + 1} / ${slides.length}`;
    };
    reel.classList.add("is-live");
    show(0);

    // Accueil : un clic sur l'image ouvre l'étude du projet affiché (Cmd ou Ctrl : dans un nouvel
    // onglet) ; au clavier, c'est le lien sous l'image. Étude : un clic agrandit l'écran, ou au
    // clavier le bouton qui apparaît au focus.
    if (!link) {
      const zoom = document.createElement("button");
      zoom.type = "button";
      zoom.className = "btn reel-zoom";
      zoom.textContent = "Agrandir l’écran";
      reel.prepend(zoom);
      const enlarge = () => openViewer(slides[index].querySelector(".stage"), outcome ? outcome.textContent : "");
      zoom.addEventListener("click", enlarge);
      reel.querySelector(".reel-frame").addEventListener("click", enlarge);
    } else {
      reel.querySelector(".reel-frame").addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey) window.open(link.href, "_blank", "noopener");
        else window.location.href = link.href;
      });
    }

    // Après une action volontaire (flèche, glissement), la scène est annoncée aux lecteurs d'écran ;
    // le passage automatique, lui, reste silencieux (pattern APG des carrousels).
    const statusEl = reel.querySelector(".reel-status");
    const announce = () => {
      if (!statusEl) return;
      const d = slides[index].dataset;
      statusEl.textContent = link ? `Projet ${index + 1} sur ${slides.length} : ${d.name}` : `Écran ${index + 1} sur ${slides.length}${d.outcome ? ` : ${d.outcome}` : ""}`;
    };
    const go = (d, manual) => {
      show((index + d + slides.length) % slides.length);
      if (manual) announce();
    };
    reel.querySelectorAll(".reel-arrows .arrow").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.dir), true)));
    // Au doigt : le geste n'est pris que si son premier mouvement net est horizontal (touchmove
    // annulé), sinon le défilement vertical reste au navigateur. Événements tactiles et non pointer
    // events, comme pour les projets sélectionnés plus bas.
    const frame = reel.querySelector(".reel-frame");
    let start = null;
    let swiped = false;
    frame.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      start = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, mine: false } : null;
      swiped = false;
    }, { passive: true });
    frame.addEventListener("touchmove", (e) => {
      if (!start) return;
      if (e.touches.length > 1) return void (start = null);
      if (!start.mine) {
        const dx = e.touches[0].clientX - start.x;
        const dy = e.touches[0].clientY - start.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dy) >= Math.abs(dx)) return void (start = null);
        start.mine = true;
      }
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    frame.addEventListener("touchend", (e) => {
      const done = start;
      start = null;
      if (!done?.mine) return;
      const dx = e.changedTouches[0].clientX - done.x;
      if (Math.abs(dx) < 48) return;
      swiped = true;
      go(dx < 0 ? 1 : -1, true);
    });
    frame.addEventListener("touchcancel", () => (start = null));
    // Un glissement n'ouvre ni l'étude ni la visionneuse.
    frame.addEventListener(
      "click",
      (e) => {
        if (!swiped) return;
        swiped = false;
        e.stopImmediatePropagation();
      },
      true,
    );
    if (!hasIO || reduce || slides.length < 2) return;
    const MOTION = new Set(["screen-scroll-time", "motion-progress", "cad-light", "wipe"]);
    const ready = (sl) => !lively || [...sl.querySelectorAll(".live:is([data-src], [data-seq])")].every((l) => l.classList.contains("is-ready"));
    const paused = () => isStill() || document.hidden || document.querySelector("dialog.viewer")?.open || reel.matches(":focus-within");
    let seen = -1;
    let still = 0;
    let doneAt = 0;
    let last = 0;
    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (index !== seen) {
        seen = index;
        still = 0;
        doneAt = 0;
      }
      const slide = slides[index];
      if (paused() || !ready(slide)) return;
      // Fin du premier passage de chaque animation de la scène (un aller, une boucle d'écrans, une
      // vidéo) ; une scène sans animation reste affichée quatre secondes.
      const anims = slide.getAnimations({ subtree: true }).filter((a) => MOTION.has(a.animationName));
      let finished;
      if (anims.length) finished = anims.every((a) => (a.effect.getComputedTiming().currentIteration ?? 0) >= 1);
      else finished = (still += dt) >= 4000;
      if (!finished) return;
      if (!doneAt) doneAt = now;
      // Un court arrêt sur l'état final, puis la scène suivante.
      if (now - doneAt >= 400) go(1);
    };
    // Le minuteur ne tourne que lorsque le carrousel est à l'écran.
    let timer = 0;
    new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !timer) {
          last = performance.now();
          timer = setInterval(tick, 150);
        } else if (!e.isIntersecting && timer) {
          clearInterval(timer);
          timer = 0;
        }
      },
      { threshold: 0.5 },
    ).observe(frame);
  });

  // ------------------------------------------------------------ sommaire d'une étude
  // Le lien de la section en cours de lecture est marqué : la dernière dont le haut a passé la ligne
  // sous l'en-tête et le sommaire. Une bande d'un pixel sur cette ligne suffit à le savoir.
  const toc = document.querySelector(".toc");
  if (toc && hasIO) {
    const links = [...toc.querySelectorAll("a")];
    const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
    const line = () => (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 2;
    const mark = () => {
      let current = -1;
      targets.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line()) current = i;
      });
      links.forEach((a, i) => (i === current ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    };
    let spy = null;
    const watch = () => {
      spy?.disconnect();
      const top = line();
      spy = new IntersectionObserver(mark, { rootMargin: `-${top}px 0px -${Math.max(0, window.innerHeight - top - 1)}px 0px` });
      targets.forEach((el) => el && spy.observe(el));
    };
    watch();
    window.addEventListener("resize", watch);
  }

  // ------------------------------------------------------------ slider des projets
  // Sur ordinateur, si possible, la section se fige et le défilement vertical fait glisser les
  // projets vers la gauche : c'est une animation CSS liée au défilement (.works.is-pinned), le script
  // mesure seulement la distance à parcourir et active ce mode. Sinon, c'est un slider ordinaire.
  // Sur mobile, les projets sont les uns sous les autres (site.css) : rien à faire défiler.
  const track = document.querySelector(".works-track");
  if (track) {
    const works = track.closest(".works");
    const pin = works.querySelector(".works-pin");
    const items = [...track.children];
    const [prev, next] = works.querySelectorAll(".arrow");
    const canPin = !reduce && Boolean(window.CSS?.supports?.("animation-timeline: view()"));
    let pinned = false;

    // Décalage qui amène le dernier projet contre le bord droit.
    const shift = () => {
      const last = items[items.length - 1];
      const pad = parseFloat(getComputedStyle(track).paddingRight) || 0;
      return Math.max(0, last.offsetLeft + last.offsetWidth + pad - track.clientWidth);
    };
    const offsetOf = (i) => Math.min(items[i].offsetLeft - items[0].offsetLeft, shift());
    // Position de la page à laquelle la section se fige.
    const pinStart = () => works.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(pin).top);
    const current = () => {
      const x = pinned ? window.scrollY - pinStart() : track.scrollLeft;
      let best = 0;
      items.forEach((_, i) => {
        if (Math.abs(offsetOf(i) - x) < Math.abs(offsetOf(best) - x)) best = i;
      });
      return best;
    };
    const goTo = (i) => {
      const left = offsetOf(Math.max(0, Math.min(items.length - 1, i)));
      if (pinned) window.scrollTo({ top: pinStart() + left, behavior: "smooth" });
      else track.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
    };
    [prev, next].forEach((b) => b?.addEventListener("click", () => goTo(current() + Number(b.dataset.dir))));

    // Les flèches s'éteignent quand le premier ou le dernier projet est entièrement visible,
    // que le slider défile ou que les projets glissent.
    if (hasIO) {
      const whole = new Map();
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => whole.set(e.target, e.intersectionRatio >= 0.98));
          if (prev) prev.disabled = Boolean(whole.get(items[0]));
          if (next) next.disabled = Boolean(whole.get(items[items.length - 1]));
        },
        { root: track, threshold: [0, 0.98] },
      );
      io.observe(items[0]);
      io.observe(items[items.length - 1]);
    }

    // Épinglé seulement sur ordinateur (au-delà de 900 px, comme l'aimant de la page), s'il y a de
    // la distance à parcourir et si les projets tiennent dans l'écran.
    const wide = window.matchMedia("(min-width: 901px)");
    const layout = () => {
      pinned = false;
      if (canPin && wide.matches) {
        works.classList.add("is-pinned");
        works.style.setProperty("--works-shift", `${Math.round(shift())}px`);
        pinned = shift() > 0 && pin.firstElementChild.offsetHeight <= pin.clientHeight;
      }
      works.classList.toggle("is-pinned", pinned);
      // Épinglée, ou en colonne sur mobile, la liste ne défile plus à la main : elle n'a plus besoin
      // d'un arrêt de tabulation.
      track.tabIndex = pinned || !wide.matches ? -1 : 0;
    };
    layout();
    wide.addEventListener("change", layout);
    if (canPin) {
      let raf = 0;
      window.addEventListener("resize", () => {
        if (!raf) raf = requestAnimationFrame(() => ((raf = 0), layout()));
      });
      document.fonts?.ready.then(layout);
      // Au clavier, un projet qui reçoit le focus hors de l'écran y est amené.
      track.addEventListener("focusin", (e) => {
        if (!pinned) return;
        const i = items.findIndex((it) => it.contains(e.target));
        if (i < 0) return;
        const r = items[i].getBoundingClientRect();
        const t = track.getBoundingClientRect();
        if (r.left < t.left || r.right > t.right) goTo(i);
      });
    }

    // À la souris, le slider ordinaire se tire comme sur un écran tactile.
    let drag = null;
    let swallowClick = false;
    track.addEventListener("pointerdown", (e) => {
      if (pinned || e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        track.classList.add("is-dragging");
      }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved) return;
      swallowClick = true;
      track.classList.remove("is-dragging");
      goTo(current());
    });
    track.addEventListener("click", (e) => {
      if (swallowClick) {
        e.preventDefault();
        swallowClick = false;
      }
    }, true);
    track.addEventListener("dragstart", (e) => e.preventDefault());

    // Au doigt, section épinglée : un glissement horizontal fait défiler la page de la même distance,
    // donc glisser les projets, un pixel pour un pixel ; au lâcher, ils se calent sur un projet.
    // Glisser vers la gauche juste avant que la section se fige l'amène en place, vers la droite
    // juste après y revient.
    // Le geste n'est pris que si son premier mouvement net est horizontal : le touchmove est alors
    // annulé et le navigateur ne défile pas ; sinon le défilement vertical reste au navigateur.
    // Événements tactiles et non pointer events : sur un vrai iPhone, ces derniers ne suffisaient pas.
    let touch = null;
    const clamp = (y, [lo, hi]) => Math.min(hi, Math.max(lo, y));
    // Sans « instant », le scroll-behavior: smooth de la page animerait chaque pas et la page
    // traînerait derrière le doigt.
    const jump = (y) => window.scrollTo({ top: y, behavior: "instant" });
    track.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      touch = pinned && e.touches.length === 1 ? { x0: t.clientX, y0: t.clientY } : null;
    }, { passive: true });
    track.addEventListener("touchmove", (e) => {
      if (!touch) return;
      if (e.touches.length > 1) return void (touch = null);
      const x = e.touches[0].clientX;
      if (!touch.range) {
        const dx = x - touch.x0;
        const dy = e.touches[0].clientY - touch.y0;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dy) >= Math.abs(dx)) return void (touch = null);
        // Plage permise : celle de la section figée, étendue à la position de départ si le geste
        // commence juste avant ou juste après.
        const lo = pinStart();
        const y = window.scrollY;
        Object.assign(touch, { range: [Math.min(y, lo), Math.max(y, lo + shift())], top: y, last: y, at: e.timeStamp, v: 0 });
      }
      if (e.cancelable) e.preventDefault();
      const want = touch.top - (x - touch.x0);
      const to = clamp(want, touch.range);
      // En butée, l'origine suit le doigt : un retour en arrière répond tout de suite.
      touch.top += to - want;
      touch.v = 0.7 * ((to - touch.last) / Math.max(1, e.timeStamp - touch.at)) + 0.3 * touch.v;
      touch.last = to;
      touch.at = e.timeStamp;
      jump(to);
    }, { passive: false });
    track.addEventListener("touchend", (e) => {
      const done = touch;
      touch = null;
      if (!done?.range) return;
      // Le glissement ne doit pas ouvrir le projet sous le doigt.
      swallowClick = true;
      setTimeout(() => (swallowClick = false), 150);
      // Calage sur le projet le plus proche, comme à la souris, ou sur le suivant dans le sens d'un
      // geste vif. Un doigt arrêté avant d'être levé ne compte pas comme vif.
      const v = e.timeStamp - done.at > 80 ? 0 : done.v;
      const x = window.scrollY - pinStart();
      let i = current();
      if (v > 0.3 && offsetOf(i) <= x) i += 1;
      else if (v < -0.3 && offsetOf(i) >= x) i -= 1;
      goTo(i);
    });
    track.addEventListener("touchcancel", () => (touch = null));
  }

  // ------------------------------------------------------------ écrans animés
  // Le calque d'un écran (page entière ou courte vidéo) se charge après la page, quand l'écran est
  // visible dans un carrousel, une figure ou la visionneuse ; jamais avec les animations réduites ni en mode
  // économie de données. La capture reste affichée en dessous jusqu'à ce qu'il soit prêt.
  const lively = !reduce && !navigator.connection?.saveData;
  // Dans une étude, la position d'une vidéo suit la progression de son animation CSS, donc le
  // défilement. Sur l'accueil et dans la visionneuse, une vidéo d'interface se lit en boucle sur la
  // scène affichée ; une vidéo en aller-retour (live--pingpong) suit son animation, qui va et vient.
  const videos = new Set();
  const seqs = new Set();
  // Temps d'arrêt sur chaque écran (la première moitié de son intervalle), puis glissement adouci.
  const hold = (s) => {
    const k = Math.floor(s);
    const t = Math.min(1, Math.max(0, (s - k - 0.5) / 0.5));
    return k + t * t * (3 - 2 * t);
  };
  // L'animation qui porte la progression, et pas le fondu d'apparition du calque (une transition).
  const progressOf = (el) => el.getAnimations().find((a) => a.animationName === "motion-progress");
  let driving = 0;
  const drive = () => {
    driving = 0;
    for (const l of seqs) {
      const anim = progressOf(l);
      if (!anim) continue;
      const p = anim.effect.getComputedTiming().progress ?? 0;
      // Sur l'accueil, la boucle va jusqu'à la copie du premier écran ; dans une étude, jusqu'à span.
      const byTime = l.closest("[data-motion]")?.dataset.motion === "time";
      const s = byTime ? p * (l.children.length - 1) : p * Number(l.dataset.span);
      l.style.setProperty("--seq", hold(s).toFixed(4));
    }
    for (const v of videos) {
      const live = v.parentElement;
      if (live.closest("[data-motion]")?.dataset.motion === "time" && !live.classList.contains("live--pingpong")) {
        const slide = live.closest(".reel-slide");
        const shown = !slide || slide.classList.contains("is-on");
        if (isStill()) {
          if (!v.paused) v.pause();
          continue;
        }
        if (shown && v.paused) v.play().catch(() => {});
        else if (!shown && !v.paused) {
          v.pause();
          v.currentTime = 0;
        }
        continue;
      }
      const anim = progressOf(v);
      if (!anim || !v.duration) continue;
      const at = (anim.effect.getComputedTiming().progress ?? 0) * v.duration;
      if (Math.abs(v.currentTime - at) > 0.02) v.currentTime = at;
    }
    if (videos.size || seqs.size) driving = requestAnimationFrame(drive);
  };
  const watched = hasIO
    ? new IntersectionObserver((entries) => {
        for (const e of entries) {
          const v = e.target.querySelector("video");
          const set = v ? videos : seqs;
          const item = v || e.target;
          if (e.isIntersecting) set.add(item);
          else {
            set.delete(item);
            if (v && !v.paused) v.pause();
          }
        }
        if ((videos.size || seqs.size) && !driving) driving = requestAnimationFrame(drive);
      })
    : null;
  const load = (live) => {
    if (live.firstChild) return;
    const d = live.dataset;
    let media;
    if (live.classList.contains("live--seq")) {
      // Les écrans de l'enchaînement, et une copie du premier à la fin pour boucler sans retour en arrière.
      const urls = d.seq.split(" ");
      [...urls, urls[0]].forEach((url, i) => {
        const im = new Image();
        im.alt = "";
        im.decoding = "async";
        im.style.setProperty("--i", String(i));
        if (i === 0) im.addEventListener("load", () => live.classList.add("is-ready"), { once: true });
        im.src = url;
        live.append(im);
      });
      watched?.observe(live);
      return;
    }
    if (live.classList.contains("live--video")) {
      // Lecture puis pause aussitôt : Safari ne charge les images d'une vidéo qu'à sa lecture.
      media = document.createElement("video");
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = "auto";
      media.setAttribute("muted", "");
      media.setAttribute("playsinline", "");
      media.setAttribute("aria-hidden", "true");
      media.addEventListener("loadeddata", () => {
        if (live.dataset.at) media.currentTime = Number(live.dataset.at);
        live.classList.add("is-ready");
      }, { once: true });
      media.addEventListener("canplay", () => media.play().then(() => media.pause()).catch(() => {}), { once: true });
      watched?.observe(live);
    } else {
      media = new Image();
      media.alt = "";
      media.decoding = "async";
      media.sizes = d.sizes;
      media.srcset = d.srcset;
      media.addEventListener("load", () => live.classList.add("is-ready"), { once: true });
    }
    media.src = d.src;
    live.append(media);
  };
  if (lively && hasIO) {
    const start = () => {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          load(e.target);
          io.unobserve(e.target);
        }
      });
      document.querySelectorAll("[data-motion] .live:is([data-src], [data-seq])").forEach((l) => io.observe(l));
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  }

  // ------------------------------------------------------------ visionneuse
  // Un écran s'ouvre en grand, avec son animation qui va et vient d'elle-même. Échap, le bouton
  // « Fermer » ou un clic à côté de l'écran la ferment ; le focus revient où il était.
  const viewer = document.createElement("dialog");
  viewer.className = "viewer";
  viewer.innerHTML =
    '<div class="viewer-body" data-motion="time"></div><p class="viewer-caption"></p><button type="button" class="btn viewer-close">Fermer</button>' +
    // Le même bouton pause que les carrousels : le dialog modal rend ceux de la page inatteignables.
    '<button type="button" class="arrow reel-pause" aria-label="Mettre les animations en pause"><svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.5 3v10M10.5 3v10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><svg class="i-play" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 3.2l8 4.8-8 4.8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>';
  document.body.append(viewer);
  const viewerBody = viewer.querySelector(".viewer-body");
  viewer.querySelector(".viewer-close").addEventListener("click", () => viewer.close());
  wirePause(viewer.querySelector(".reel-pause"));
  applyStill(isStill());
  viewer.addEventListener("click", (e) => {
    if (e.target === viewer || e.target === viewerBody) viewer.close();
  });
  viewer.addEventListener("close", () => {
    viewer.querySelectorAll("video").forEach((v) => videos.delete(v));
    viewer.querySelectorAll(".live--seq").forEach((l) => seqs.delete(l));
    viewerBody.replaceChildren();
  });
  function openViewer(stage, caption) {
    // Sans <dialog> (Safari avant 15.4), pas de visionneuse plutôt qu'une erreur.
    if (!stage || typeof viewer.showModal !== "function") return;
    const copy = stage.cloneNode(true);
    copy.classList.add("viewer-stage");
    copy.removeAttribute("aria-hidden");
    copy.querySelectorAll(".stage-zoom").forEach((b) => b.remove());
    copy.querySelectorAll("img").forEach((im) => (im.loading = "eager"));
    // Chaque calque repart de ce que montrait l'écran au moment du clic : l'écran affiché d'un
    // enchaînement, l'instant d'une vidéo.
    const originals = [...stage.querySelectorAll(".live")];
    copy.querySelectorAll(".live").forEach((l, k) => {
      const o = originals[k];
      l.replaceChildren();
      l.classList.remove("is-ready");
      if (l.dataset.seq) {
        const n = l.dataset.seq.split(" ").length;
        const at = Math.round(parseFloat(o.style.getPropertyValue("--seq")) || 0) % n;
        l.style.setProperty("--seq", String(at));
        l.style.setProperty("--m-delay", `-${((at / n) * parseFloat(l.style.getPropertyValue("--loop"))).toFixed(2)}s`);
      }
      const v = o.querySelector("video");
      if (v) l.dataset.at = String(v.currentTime);
    });
    viewerBody.replaceChildren(copy);
    viewer.querySelector(".viewer-caption").textContent = caption;
    viewer.setAttribute("aria-label", caption || "Écran agrandi");
    viewer.showModal();
    if (lively) copy.querySelectorAll(".live:is([data-src], [data-seq])").forEach(load);
  }
  // Figures des études : tout l'écran est un bouton.
  document.querySelectorAll("figure.shot").forEach((fig) => {
    const stage = fig.querySelector(".stage");
    if (!stage) return;
    const caption = fig.querySelector("figcaption")?.textContent.trim() || "";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "stage-zoom";
    b.setAttribute("aria-label", caption ? `Agrandir l’écran : ${caption}` : "Agrandir l’écran");
    b.addEventListener("click", () => openViewer(stage, caption));
    stage.append(b);
  });

  // ------------------------------------------------------------ aperçu des autres projets
  // Le projet affiché suit le défilement : la ligne qui franchit le milieu de l'écran devient active,
  // jusqu'à la dernière, où que soit la souris. Bouger la souris sur une ligne l'active aussi.
  // Un clic sur l'aperçu ouvre l'étude du projet affiché (Cmd ou Ctrl : dans un nouvel onglet) ;
  // au clavier, ce sont les lignes de la liste.
  const rows = [...document.querySelectorAll(".irow")];
  const shots = document.querySelectorAll(".index-shot");
  if (rows.length && shots.length) {
    let current = "0";
    const preview = document.querySelector(".index-preview");
    preview?.addEventListener("click", (e) => {
      const row = rows.find((r) => r.dataset.i === current);
      if (!row) return;
      if (e.metaKey || e.ctrlKey) window.open(row.href, "_blank", "noopener");
      else window.location.href = row.href;
    });
    const activate = (i) => {
      if (i === current) return;
      current = i;
      rows.forEach((r) => r.classList.toggle("is-active", r.dataset.i === i));
      shots.forEach((s) => s.classList.toggle("is-on", s.dataset.i === i));
    };
    if (hasIO) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) activate(e.target.dataset.i);
          // Au-delà de la liste : on garde le premier au-dessus, le dernier en dessous.
          const first = rows[0].getBoundingClientRect();
          const last = rows[rows.length - 1].getBoundingClientRect();
          const mid = window.innerHeight / 2;
          if (first.top > mid) activate(rows[0].dataset.i);
          else if (last.bottom < mid) activate(rows[rows.length - 1].dataset.i);
        },
        { rootMargin: "-49.5% 0px -50% 0px" },
      );
      rows.forEach((r) => io.observe(r));
    }
    // Survol : seulement quand la souris bouge vraiment, pas quand la page défile sous elle.
    let px = -1;
    let py = -1;
    rows.forEach((r) => {
      r.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse" || (e.clientX === px && e.clientY === py)) return;
        px = e.clientX;
        py = e.clientY;
        activate(r.dataset.i);
      });
      r.addEventListener("focus", () => activate(r.dataset.i));
    });
  }
})();
