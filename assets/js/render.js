/**
 * Renderizado de secciones desde Google Sheets
 */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function placeholderImg(label) {
  const t = encodeURIComponent(label || 'Viaje');
  return `https://placehold.co/800x500/0A7C8C/ffffff?text=${t}`;
}

function imgSrc(url, label) {
  if (url && /^https?:\/\//i.test(url)) return url;
  return placeholderImg(label);
}

function renderPromociones(data) {
  const grid = $('#promoGrid');
  if (!grid) return;
  const items = SheetsAPI.mapPromociones(data);
  if (!items.length) {
    grid.innerHTML = '<p class="empty-msg">Pronto publicaremos nuevas promociones.</p>';
    return;
  }
  grid.innerHTML = items.map(p => `
    <article class="promo-card animate-on-scroll">
      <div class="promo-card-img">
        <img src="${SheetsAPI.escapeHtml(imgSrc(p.imagen, p.titulo))}" alt="${SheetsAPI.escapeHtml(p.titulo)}" loading="lazy">
        ${p.badge ? `<span class="promo-badge">${SheetsAPI.escapeHtml(p.badge)}</span>` : (p.descuento ? `<span class="promo-badge">-${SheetsAPI.escapeHtml(p.descuento)}</span>` : '')}
      </div>
      <div class="promo-card-body">
        <h3 class="promo-card-title">${SheetsAPI.escapeHtml(p.titulo)}</h3>
        <div class="promo-card-meta">
          ${p.destino ? `<span>📍 ${SheetsAPI.escapeHtml(p.destino)}</span>` : ''}
          ${p.fechaFin ? `<span>🗓️ Hasta ${SheetsAPI.escapeHtml(p.fechaFin)}</span>` : ''}
        </div>
        <p class="promo-card-desc">${SheetsAPI.escapeHtml(p.descripcion)}</p>
        <div class="promo-card-footer">
          <div class="promo-price">
            ${p.precioRegular ? `<span class="promo-price-old">${SheetsAPI.escapeHtml(p.precioRegular)}</span>` : ''}
            <span class="promo-price-current">${SheetsAPI.escapeHtml(p.precioPromo || p.precioRegular)}</span>
          </div>
          <a class="btn btn-primary btn-sm" target="_blank" rel="noopener"
             href="${SheetsAPI.whatsappUrl('Hola, me interesa la promoción: ' + p.titulo)}">Quiero esta promoción</a>
        </div>
      </div>
    </article>
  `).join('');
}

function renderDestinos(data) {
  const grid = $('#destGrid');
  if (!grid) return;
  const items = SheetsAPI.mapDestinos(data);
  if (!items.length) {
    grid.innerHTML = '<p class="empty-msg">Cargando destinos...</p>';
    return;
  }
  grid.innerHTML = items.map(d => `
    <article class="dest-card animate-on-scroll">
      <img src="${SheetsAPI.escapeHtml(imgSrc(d.imagen, d.nombre))}" alt="${SheetsAPI.escapeHtml(d.nombre)}" loading="lazy">
      <div class="dest-card-overlay">
        <span class="dest-card-category">${SheetsAPI.escapeHtml(d.tipo || 'Destino')}</span>
        <h3 class="dest-card-title">${SheetsAPI.escapeHtml(d.nombre)}</h3>
        <p class="dest-card-desc">${SheetsAPI.escapeHtml(d.descripcion)}</p>
        ${d.precio ? `<div class="dest-card-price"><span>Desde</span> ${SheetsAPI.escapeHtml(d.precio)}</div>` : ''}
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn-secondary btn-sm" href="contacto.html?destino=${encodeURIComponent(d.nombre)}">Más información</a>
          <a class="btn btn-outline btn-sm" style="border-color:rgba(255,255,255,.6)" target="_blank" rel="noopener"
             href="${SheetsAPI.whatsappUrl('Hola, me interesa el destino: ' + d.nombre)}">WhatsApp</a>
        </div>
      </div>
    </article>
  `).join('');
}

function renderServicios(data) {
  const grid = $('#serviciosGrid');
  if (!grid) return;
  const items = SheetsAPI.mapServicios(data);
  if (!items.length) {
    grid.innerHTML = '<p class="empty-msg">Cargando servicios...</p>';
    return;
  }
  grid.innerHTML = items.map(s => {
    const icon = s.imagen && !/^https?:\/\//i.test(s.imagen) ? s.imagen : '✨';
    const hasImg = s.imagen && /^https?:\/\//i.test(s.imagen);
    return `
    <div class="service-card animate-on-scroll">
      <div class="service-icon">${hasImg ? `<img src="${SheetsAPI.escapeHtml(s.imagen)}" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:8px">` : icon}</div>
      <h3>${SheetsAPI.escapeHtml(s.nombre)}</h3>
      <p>${SheetsAPI.escapeHtml(s.descripcion)}</p>
      ${s.precioDesde ? `<p style="margin-top:10px;font-weight:600;color:var(--primary)">Desde ${SheetsAPI.escapeHtml(s.precioDesde)}</p>` : ''}
      <a class="btn btn-primary btn-sm" style="margin-top:12px" target="_blank" rel="noopener"
         href="${SheetsAPI.whatsappUrl('Hola, me interesa el servicio: ' + s.nombre)}">Solicitar info</a>
    </div>`;
  }).join('');
}

function renderTodoIncluido(data) {
  const grid = $('#todoIncluidoGrid');
  if (!grid) return;
  const items = SheetsAPI.mapTodoIncluido(data);
  if (!items.length) {
    grid.innerHTML = '<p class="empty-msg">Cargando paquetes todo incluido...</p>';
    return;
  }
  grid.innerHTML = items.map(p => `
    <article class="promo-card animate-on-scroll">
      <div class="promo-card-img">
        <img src="${SheetsAPI.escapeHtml(imgSrc(p.imagen, p.nombre))}" alt="${SheetsAPI.escapeHtml(p.nombre)}" loading="lazy">
        ${p.temporada ? `<span class="promo-badge">${SheetsAPI.escapeHtml(p.temporada)}</span>` : ''}
      </div>
      <div class="promo-card-body">
        <h3 class="promo-card-title">${SheetsAPI.escapeHtml(p.nombre)}</h3>
        <div class="promo-card-meta">
          <span>📍 ${SheetsAPI.escapeHtml(p.destino)}</span>
          <span>🌙 ${SheetsAPI.escapeHtml(p.duracion)}</span>
        </div>
        <p class="promo-card-desc">${SheetsAPI.escapeHtml(p.plan)} · ${SheetsAPI.escapeHtml(p.amenidades)}</p>
        <div class="promo-card-footer">
          <div class="promo-price">
            <span class="promo-price-current">${SheetsAPI.escapeHtml(p.precio)}</span>
            <span style="font-size:.75rem;color:var(--gray)">por persona</span>
          </div>
          <a class="btn btn-primary btn-sm" target="_blank" rel="noopener"
             href="${SheetsAPI.whatsappUrl('Hola, me interesa el paquete: ' + p.nombre)}">Reservar</a>
        </div>
      </div>
    </article>
  `).join('');
}

function renderTours(data) {
  const grid = $('#toursGrid');
  if (!grid) return;
  const items = SheetsAPI.mapTours(data);
  if (!items.length) {
    grid.innerHTML = '<p class="empty-msg">Cargando tours...</p>';
    return;
  }
  grid.innerHTML = items.map(t => `
    <article class="promo-card animate-on-scroll">
      <div class="promo-card-img">
        <img src="${SheetsAPI.escapeHtml(imgSrc(t.imagen, t.nombre))}" alt="${SheetsAPI.escapeHtml(t.nombre)}" loading="lazy">
        ${t.categoria ? `<span class="promo-badge">${SheetsAPI.escapeHtml(t.categoria)}</span>` : ''}
      </div>
      <div class="promo-card-body">
        <h3 class="promo-card-title">${SheetsAPI.escapeHtml(t.nombre)}</h3>
        <div class="promo-card-meta">
          <span>⏱️ ${SheetsAPI.escapeHtml(t.duracion)}</span>
          ${t.salidas ? `<span>🚌 ${SheetsAPI.escapeHtml(t.salidas)}</span>` : ''}
        </div>
        <p class="promo-card-desc">${SheetsAPI.escapeHtml(t.itinerario)}</p>
        <div class="promo-card-footer">
          <div class="promo-price">
            <span class="promo-price-current">${SheetsAPI.escapeHtml(t.precioAdulto)}</span>
            ${t.precioMenor ? `<span style="font-size:.8rem;color:var(--gray)">Menor: ${SheetsAPI.escapeHtml(t.precioMenor)}</span>` : ''}
          </div>
          <a class="btn btn-primary btn-sm" target="_blank" rel="noopener"
             href="${SheetsAPI.whatsappUrl('Hola, me interesa el tour: ' + t.nombre)}">Quiero este tour</a>
        </div>
      </div>
    </article>
  `).join('');
}

function renderFaq(data) {
  const box = $('#faqList');
  if (!box) return;
  const items = SheetsAPI.mapFaq(data);
  if (!items.length) {
    box.innerHTML = '<p class="empty-msg">Sin preguntas frecuentes por ahora.</p>';
    return;
  }
  box.innerHTML = items.map((f, i) => `
    <details class="faq-item animate-on-scroll" ${i === 0 ? 'open' : ''}>
      <summary>${SheetsAPI.escapeHtml(f.pregunta)}</summary>
      <div class="faq-body">
        ${f.categoria ? `<span class="faq-cat">${SheetsAPI.escapeHtml(f.categoria)}</span>` : ''}
        <p>${SheetsAPI.escapeHtml(f.respuesta)}</p>
      </div>
    </details>
  `).join('');
}

function renderHorarios(data) {
  const box = $('#horariosList');
  if (!box) return;
  const items = SheetsAPI.mapHorarios(data);
  if (!items.length) {
    box.innerHTML = '<p class="empty-msg">Horarios próximamente.</p>';
    return;
  }
  box.innerHTML = `
    <div class="card" style="overflow-x:auto">
      <table class="simple-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Destino / Servicio</th>
            <th>Días</th>
            <th>Horario</th>
            <th>Punto / Canal</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(h => `
            <tr>
              <td>${SheetsAPI.escapeHtml(h.tipo)}</td>
              <td><strong>${SheetsAPI.escapeHtml(h.destino)}</strong></td>
              <td>${SheetsAPI.escapeHtml(h.dias)}</td>
              <td>${SheetsAPI.escapeHtml(h.horaInicio)} – ${SheetsAPI.escapeHtml(h.horaFin)}</td>
              <td>${SheetsAPI.escapeHtml(h.punto)}</td>
              <td>${SheetsAPI.escapeHtml(h.notas)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function updateStatusBar(cache) {
  const el = $('#dataStatus');
  if (!el) return;
  const times = Object.values(cache)
    .filter(c => c && c.updatedAt)
    .map(c => c.updatedAt);
  if (!times.length) {
    el.textContent = 'Cargando datos desde Google Sheets...';
    return;
  }
  const latest = new Date(Math.max(...times.map(t => t.getTime())));
  el.textContent = 'Datos actualizados: ' + latest.toLocaleString('es-MX') + ' · Se refrescan cada 15 min';
}

function renderAll(cache) {
  if (cache.promociones) renderPromociones(cache.promociones.data || []);
  if (cache.destinos) renderDestinos(cache.destinos.data || []);
  if (cache.servicios) renderServicios(cache.servicios.data || []);
  if (cache.todoIncluido) renderTodoIncluido(cache.todoIncluido.data || []);
  if (cache.tours) renderTours(cache.tours.data || []);
  if (cache.faq) renderFaq(cache.faq.data || []);
  if (cache.horarios) renderHorarios(cache.horarios.data || []);
  updateStatusBar(cache);
  // re-init scroll animations for new nodes
  if (window.initScrollAnimations) window.initScrollAnimations();
}

document.addEventListener('DOMContentLoaded', () => {
  SheetsAPI.onData(renderAll);
  SheetsAPI.startAutoRefresh();
});
