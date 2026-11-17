document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
      document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  initHeroSlider();
  window.initScrollAnimations = initScrollAnimations;
  initScrollAnimations();
});

function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.querySelector('.hero-arrow-prev');
  const nextBtn = document.querySelector('.hero-arrow-next');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function show(i) {
    slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    current = i;
  }
  function next() { show((current + 1) % slides.length); }
  function prev() { show((current - 1 + slides.length) % slides.length); }
  function start() { timer = setInterval(next, 6000); }
  function stop() { clearInterval(timer); }

  if (nextBtn) nextBtn.addEventListener('click', () => { stop(); next(); start(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { stop(); prev(); start(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { stop(); show(i); start(); }));
  start();
}

function initScrollAnimations() {
  const els = document.querySelectorAll('.animate-on-scroll:not(.visible)');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}
