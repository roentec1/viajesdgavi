/**
 * Viajes D'Gavi by Morhú - Main JavaScript (Static version)
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileMenu();
  initHeroSlider();
  initScrollAnimations();
  initContactForm();
  initModals();
  renderDynamicSections();
});

/* ---------- Header sticky ---------- */
function initHeader() {
  const header = document.getElementById("header");
  if (!header) return;
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  });
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    nav.classList.toggle("active");
    document.body.style.overflow = nav.classList.contains("active") ? "hidden" : "";
  });

  nav.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      toggle.classList.remove("active");
      nav.classList.remove("active");
      document.body.style.overflow = "";
    });
  });
}

/* ---------- Hero Slider ---------- */
function initHeroSlider() {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  const prevBtn = document.querySelector(".hero-arrow-prev");
  const nextBtn = document.querySelector(".hero-arrow-next");
  if (!slides.length) return;

  let current = 0;
  let timer;

  function show(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    current = i;
  }

  function next() { show((current + 1) % slides.length); }
  function prev() { show((current - 1 + slides.length) % slides.length); }

  function start() { timer = setInterval(next, 6000); }
  function stop() { clearInterval(timer); }

  if (nextBtn) nextBtn.addEventListener("click", () => { stop(); next(); start(); });
  if (prevBtn) prevBtn.addEventListener("click", () => { stop(); prev(); start(); });
  dots.forEach((d, i) => d.addEventListener("click", () => { stop(); show(i); start(); }));
  start();
}

/* ---------- Scroll animations ---------- */
function initScrollAnimations() {
  const els = document.querySelectorAll(".animate-on-scroll");
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => obs.observe(el));
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const msgEl = form.querySelector(".form-message");
    const privacy = form.querySelector("#privacy");

    if (privacy && !privacy.checked) {
      showMsg(msgEl, "Debes aceptar el aviso de privacidad.", "error");
      return;
    }

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Enviando...";

    const data = Object.fromEntries(new FormData(form).entries());
    data.fecha = new Date().toISOString().slice(0, 10);
    data.hora = new Date().toTimeString().slice(0, 8);

    try {
      const result = await saveContact(data);
      if (result.success) {
        showMsg(msgEl, result.message || "¡Gracias por contactarnos! Un asesor de Viajes D'Gavi by Morhú se pondrá en contacto contigo.", "success");
        form.reset();
      } else {
        showMsg(msgEl, result.message || "Error. Por favor escríbenos por WhatsApp.", "error");
      }
    } catch (err) {
      showMsg(msgEl, "Error de conexión. Contáctanos por WhatsApp.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = "form-message " + type;
  el.style.display = "block";
}

/* ---------- Modals ---------- */
function initModals() {
  document.querySelectorAll("[data-modal]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const modal = document.getElementById(btn.dataset.modal);
      if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.classList.contains("modal-close")) {
        overlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(m => {
        m.classList.remove("active");
        document.body.style.overflow = "";
      });
    }
  });
}

/* ---------- Render dynamic sections on page load ---------- */
async function renderDynamicSections() {
  // Promotions
  const promoGrid = document.getElementById("promoGrid");
  if (promoGrid) {
    const promos = await getPromotions(8);
    promoGrid.innerHTML = promos.map(p => `
      <article class="promo-card animate-on-scroll">
        <div class="promo-card-img">
          <img src="${p.imagen}" alt="${p.titulo}" loading="lazy">
          ${p.descuento ? `<span class="promo-badge">-${p.descuento}%</span>` : ""}
        </div>
        <div class="promo-card-body">
          <h3 class="promo-card-title">${p.titulo}</h3>
          <div class="promo-card-meta">
            <span>📍 ${p.destino}</span>
            ${p.noches ? `<span>🌙 ${p.noches} noches</span>` : ""}
          </div>
          <p class="promo-card-desc">${p.descripcion || ""}</p>
          <div class="promo-card-footer">
            <div class="promo-price">
              ${p.precio_anterior ? `<span class="promo-price-old">${formatPrice(p.precio_anterior)}</span>` : ""}
              <span class="promo-price-current">${formatPrice(p.precio)}</span>
            </div>
            <a href="${getWhatsAppUrl("Hola, me interesa la promoción: " + p.titulo)}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Quiero esta promoción</a>
          </div>
        </div>
      </article>
    `).join("");
    initScrollAnimations();
  }

  // Destinations
  const destGrid = document.getElementById("destGrid");
  if (destGrid) {
    const dests = await getDestinations(12);
    destGrid.innerHTML = dests.map(d => `
      <article class="dest-card animate-on-scroll">
        <img src="${d.imagen}" alt="${d.nombre}" loading="lazy">
        <div class="dest-card-overlay">
          <span class="dest-card-category">${d.categoria || "Destino"}</span>
          <h3 class="dest-card-title">${d.nombre}</h3>
          <p class="dest-card-desc">${d.descripcion || ""}</p>
          <div class="dest-card-price"><span>Desde</span> ${formatPrice(d.precio_desde)}</div>
          <div style="margin-top:12px;display:flex;gap:8px;">
            <a href="contacto.html?destino=${encodeURIComponent(d.nombre)}" class="btn btn-secondary btn-sm">Más información</a>
            <a href="${getWhatsAppUrl("Hola, me interesa el destino: " + d.nombre)}" class="btn btn-outline btn-sm" style="border-color:rgba(255,255,255,0.6)" target="_blank">WhatsApp</a>
          </div>
        </div>
      </article>
    `).join("");
    initScrollAnimations();
  }

  // Testimonials
  const testGrid = document.getElementById("testGrid");
  if (testGrid) {
    const tests = await getTestimonials(4);
    testGrid.innerHTML = tests.map(t => `
      <div class="testimonial-card animate-on-scroll">
        <div class="testimonial-stars">${renderStars(t.calificacion)}</div>
        <p class="testimonial-text">"${t.comentario}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${(t.nombre || "V")[0]}</div>
          <div class="testimonial-name">${t.nombre}</div>
        </div>
      </div>
    `).join("");
    initScrollAnimations();
  }
}
