/* Pøt Mølle – interaktion: sticky header, mobilmenu, scroll-reveal */
(function () {
  "use strict";

  var doc = document.documentElement;
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.getElementById("mobile-nav");

  /* Sticky header: solid background once the page is scrolled */
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile navigation */
  function setMenu(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector("[data-menu-label]").textContent = open ? "Luk" : "Menu";
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("nav-open", open);
    if (open) {
      var first = mobileNav.querySelector("a");
      if (first) first.focus();
    } else {
      toggle.focus();
    }
  }

  if (toggle && mobileNav) {
    mobileNav.setAttribute("aria-hidden", "true");
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
        mobileNav.setAttribute("aria-hidden", "true");
        document.body.classList.remove("nav-open");
        toggle.querySelector("[data-menu-label]").textContent = "Menu";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setMenu(false);
    });
    window.matchMedia("(min-width: 1040px)").addEventListener("change", function (mq) {
      if (mq.matches && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
        document.body.classList.remove("nav-open");
      }
    });
  }

  /* Scroll reveal (progressive enhancement – content is visible without JS) */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }

  doc.classList.add("js-ready");
})();

/* Underside-funktioner: scrollspy til undermenu + formularer (mailto, ingen backend) */
(function () {
  "use strict";

  /* Scrollspy */
  var subnav = document.querySelector(".subnav");
  if (subnav && "IntersectionObserver" in window) {
    var links = [].slice.call(subnav.querySelectorAll('a[href^="#"]'));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el) map[id] = { link: a, el: el };
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
        var hit = map[entry.target.id];
        if (hit) { hit.link.classList.add("is-active"); hit.link.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { spy.observe(map[id].el); });
  }

  /* Formularer: validering + forberedt e-mail (mailto). Der sendes intet automatisk. */
  var today = new Date().toISOString().slice(0, 10);

  function initForm(form) {
    var status = form.querySelector("[data-form-status]");
    var to = form.getAttribute("data-mailto");
    var subjectBase = form.getAttribute("data-subject") || "Henvendelse via hjemmesiden";
    var fields = [].slice.call(form.querySelectorAll("input, select, textarea"));
    form.setAttribute("novalidate", "");
    fields.forEach(function (el) { if (el.type === "date") el.min = today; });

    function setError(el, msg) {
      var wrap = el.closest(".field");
      var err = wrap.querySelector(".field__error");
      wrap.classList.toggle("has-error", !!msg);
      err.textContent = msg || "";
      if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    }

    function check(el) {
      var v = el.value.trim();
      var msg = "";
      if (el.required && !v) {
        msg = el.getAttribute("data-msg-required") || "Udfyld venligst dette felt.";
      } else if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        msg = "Skriv en gyldig e-mailadresse, fx navn@eksempel.dk.";
      } else if (v && el.type === "tel" && (!/^[+()\d\s-]+$/.test(v) || v.replace(/\D/g, "").length < 8)) {
        msg = "Skriv et gyldigt telefonnummer med mindst 8 cifre.";
      } else if (v && el.type === "number" && (isNaN(Number(v)) || Number(v) < 1)) {
        msg = "Angiv et antal på mindst 1.";
      } else if (v && el.type === "date" && v < today) {
        msg = "Vælg en dato i dag eller senere.";
      } else if (v && el.name === "besked" && v.length < 10) {
        msg = "Skriv gerne lidt mere, så vi kan hjælpe dig bedst muligt.";
      }
      setError(el, msg);
      return !msg;
    }

    function show(type, text) {
      status.hidden = false;
      status.className = "form-status form-status--" + type;
      status.textContent = text;
    }

    fields.forEach(function (el) {
      el.addEventListener("blur", function () { if (el.value.trim() || el.closest(".field").classList.contains("has-error")) check(el); });
      el.addEventListener("input", function () { if (el.closest(".field").classList.contains("has-error")) check(el); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (el) { if (!check(el) && !firstBad) firstBad = el; });
      if (firstBad) {
        show("error", "Der mangler lidt oplysninger. Ret de markerede felter, og prøv igen.");
        firstBad.focus();
        return;
      }
      var lines = [], message = "", subject = subjectBase;
      fields.forEach(function (el) {
        var v = el.value.trim();
        if (!v) return;
        if (el.name === "besked") { message = v; return; }
        var lab = form.querySelector('label[for="' + el.id + '"]');
        var text = lab ? lab.textContent.replace(/\s*\*\s*$/, "").trim() : el.name;
        lines.push(text + ": " + v);
        if (el.name === "emne" || el.name === "anledning") subject = subjectBase + " – " + v;
      });
      var body = message + "\n\n" + lines.join("\n");
      var href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      show("success", "Din besked er gjort klar. Vi åbner nu dit mailprogram med alt udfyldt – tryk Send dér for at sende den til os. Åbnede det ikke? Skriv til " + to + " eller ring på 86 96 51 00.");
      window.location.href = href;
    });
  }

  [].slice.call(document.querySelectorAll("[data-mailto-form]")).forEach(initForm);
})();
