/**
 * Viajes D'Gavi by Morhú
 * Lectura de Google Sheets publicados (CSV) + auto-refresh cada 15 min
 *
 * Hoja de edición (tú editas aquí):
 * https://docs.google.com/spreadsheets/d/1WQQC-9lD3S9BV9spvZTRxDnpR6oTURCYxgnwq39a2rc/edit
 *
 * Lectura pública del sitio (Publicar en la web → CSV):
 * usa el ID publicado 2PACX asociado a esa misma hoja.
 */

const SPREADSHEET_EDIT_ID = '1WQQC-9lD3S9BV9spvZTRxDnpR6oTURCYxgnwq39a2rc';

// Feed público (CSV). Debe ser la publicación web de la hoja de arriba.
const SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8GE6574KijyC9srV_ap9lbcBX4g1qh19yf2a1UGw6dEMqqMAditWHNw0DR2YlVvYpQBoNoNrnkmuo/pub';

const SHEETS = {
  promociones:  { gid: '271680704',  label: 'Promociones' },
  servicios:    { gid: '1773325793', label: 'Servicios' },
  todoIncluido: { gid: '479306391',  label: 'Todo incluido' },
  destinos:     { gid: '1433921742', label: 'Destinos populares' },
  tours:        { gid: '1242735945', label: 'Tours' },
  faq:          { gid: '1131629955', label: 'Preguntas frecuentes' },
  citas:        { gid: '1878396277', label: 'Citas y contacto' },
  horarios:     { gid: '1995823101', label: 'Horarios' }
};

const REFRESH_MS = 15 * 60 * 1000;
const cache = {};
const listeners = [];
let refreshing = false;

function csvUrl(gid) {
  return `${SHEET_BASE}?gid=${gid}&single=true&output=csv`;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      if (ch === '\r') i++;
      row.push(cell.trim());
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(cols => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] !== undefined ? cols[i] : ''; });
    return obj;
  });
}

function normalizeKey(obj, candidates, fallback = '') {
  for (const k of candidates) {
    if (obj[k] !== undefined && obj[k] !== '') return obj[k];
  }
  const keys = Object.keys(obj);
  for (const c of candidates) {
    const found = keys.find(k => k.toLowerCase() === c.toLowerCase());
    if (found && obj[found] !== '') return obj[found];
  }
  return fallback;
}

function isActive(row) {
  const estado = String(normalizeKey(row, ['Estado', 'estado', 'Status', 'status'], '')).toLowerCase();
  if (!estado) return true;
  return ['activo', 'disponible', 'publicado', 'active', 'sí', 'si'].includes(estado);
}

async function fetchSheet(key) {
  const meta = SHEETS[key];
  if (!meta) throw new Error('Hoja desconocida: ' + key);
  const url = csvUrl(meta.gid) + '&_ts=' + Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error HTTP ' + res.status + ' en ' + meta.label);
  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('La hoja no está publicada o requiere inicio de sesión (' + meta.label + ')');
  }
  const objects = rowsToObjects(parseCSV(text)).filter(isActive);
  cache[key] = { data: objects, updatedAt: new Date(), error: null };
  return objects;
}

async function loadAll() {
  const keys = Object.keys(SHEETS);
  const results = await Promise.allSettled(keys.map(k => fetchSheet(k)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn('No se pudo cargar', keys[i], r.reason);
      if (!cache[keys[i]]) {
        cache[keys[i]] = { data: [], updatedAt: new Date(), error: String(r.reason) };
      }
    }
  });
  listeners.forEach(fn => { try { fn(cache); } catch (e) { console.error(e); } });
  return cache;
}

async function refreshNow() {
  if (refreshing) return { success: false, message: 'Ya se está actualizando...' };
  refreshing = true;
  try {
    await loadAll();
    return { success: true, message: 'Datos actualizados' };
  } catch (e) {
    return { success: false, message: String(e) };
  } finally {
    refreshing = false;
  }
}

function isRefreshing() { return refreshing; }

function onData(fn) {
  listeners.push(fn);
  if (Object.keys(cache).length) fn(cache);
}

function getData(key) {
  return (cache[key] && cache[key].data) || [];
}

function startAutoRefresh() {
  loadAll();
  setInterval(loadAll, REFRESH_MS);
}

/* ---- Mapeos por sección ---- */

function mapPromociones(rows) {
  return rows.map(r => ({
    id: normalizeKey(r, ['ID', 'Id', 'id']),
    titulo: normalizeKey(r, ['Título de la Promoción', 'Titulo de la Promocion', 'Título', 'titulo']),
    descripcion: normalizeKey(r, ['Descripción', 'Descripcion', 'descripcion']),
    destino: normalizeKey(r, ['Destino', 'destino']),
    precioRegular: normalizeKey(r, ['Precio Regular (MXN)', 'Precio Regular', 'precio regular']),
    precioPromo: normalizeKey(r, ['Precio Promoción (MXN)', 'Precio Promocion (MXN)', 'Precio Promoción', 'precio promocion']),
    descuento: normalizeKey(r, ['Descuento (%)', 'Descuento', 'descuento']),
    fechaInicio: normalizeKey(r, ['Fecha Inicio', 'fecha inicio']),
    fechaFin: normalizeKey(r, ['Fecha Fin', 'fecha fin']),
    imagen: normalizeKey(r, ['Imagen URL', 'Imagen', 'imagen URL', 'imagen']),
    badge: normalizeKey(r, ['Badge', 'badge']),
    estado: normalizeKey(r, ['Estado', 'estado'])
  }));
}

function mapServicios(rows) {
  return rows.map(r => ({
    id: normalizeKey(r, ['ID', 'Id']),
    nombre: normalizeKey(r, ['Nombre del Servicio', 'Nombre', 'nombre']),
    categoria: normalizeKey(r, ['Categoría', 'Categoria', 'categoria']),
    descripcion: normalizeKey(r, ['Descripción Corta', 'Descripcion Corta', 'Descripción', 'descripcion']),
    incluye: normalizeKey(r, ['Incluye', 'incluye']),
    precioDesde: normalizeKey(r, ['Precio Desde (MXN)', 'Precio Desde', 'precio desde']),
    imagen: normalizeKey(r, ['Icono / Imagen URL', 'Imagen URL', 'Icono', 'imagen']),
    estado: normalizeKey(r, ['Estado', 'estado'])
  }));
}

function mapTodoIncluido(rows) {
  return rows.map(r => ({
    id: normalizeKey(r, ['ID', 'Id']),
    nombre: normalizeKey(r, ['Resort / Paquete', 'Resort', 'Paquete', 'nombre']),
    destino: normalizeKey(r, ['Destino', 'destino']),
    duracion: normalizeKey(r, ['Duración', 'Duracion', 'duracion']),
    plan: normalizeKey(r, ['Plan de Alimentos', 'Plan', 'plan']),
    precio: normalizeKey(r, ['Precio por Persona (MXN)', 'Precio por Persona', 'precio']),
    amenidades: normalizeKey(r, ['Amenidades Principales', 'Amenidades', 'amenidades']),
    imagen: normalizeKey(r, ['Imagen URL', 'Imagen', 'imagen']),
    temporada: normalizeKey(r, ['Temporada', 'temporada']),
    estado: normalizeKey(r, ['Estado', 'estado'])
  }));
}

function mapDestinos(rows) {
  return rows.map(r => ({
    id: normalizeKey(r, ['ID', 'Id']),
    nombre: normalizeKey(r, ['Destino', 'nombre', 'Nombre']),
    tipo: normalizeKey(r, ['Tipo', 'tipo', 'Categoría', 'categoria']),
    descripcion: normalizeKey(r, ['Descripción', 'Descripcion', 'descripcion']),
    atracciones: normalizeKey(r, ['Atracciones Principales', 'Atracciones', 'atracciones']),
    precio: normalizeKey(r, ['Precio Promedio (MXN)', 'Precio Promedio', 'precio']),
    imagen: normalizeKey(r, ['Imagen Portada URL', 'Imagen URL', 'Imagen', 'imagen']),
    destacado: normalizeKey(r, ['Destacado', 'destacado']),
    estado: normalizeKey(r, ['Estado', 'estado'])
  }));
}

function mapTours(rows) {
  return rows.map(r => ({
    id: normalizeKey(r, ['ID', 'Id']),
    nombre: normalizeKey(r, ['Nombre del Tour', 'Nombre', 'nombre']),
    categoria: normalizeKey(r, ['Categoría', 'Categoria', 'categoria']),
    duracion: normalizeKey(r, ['Duración', 'Duracion', 'duracion']),
    salidas: normalizeKey(r, ['Salidas Disponibles', 'Salidas', 'salidas']),
    precioAdulto: normalizeKey(r, ['Precio Adulto (MXN)', 'Precio Adulto', 'precio adulto']),
    precioMenor: normalizeKey(r, ['Precio Menor (MXN)', 'Precio Menor', 'precio menor']),
    itinerario: normalizeKey(r, ['Itinerario Resumen', 'Itinerario', 'itinerario']),
    imagen: normalizeKey(r, ['Imagen URL', 'Imagen', 'imagen']),
    cupo: normalizeKey(r, ['Cupo Máximo', 'Cupo Maximo', 'Cupo', 'cupo']),
    estado: normalizeKey(r, ['Estado', 'estado'])
  }));
}

function mapFaq(rows) {
  return rows.map(r => ({
    id: normalizeKey(r, ['ID', 'Id']),
    categoria: normalizeKey(r, ['Categoría', 'Categoria', 'categoria']),
    pregunta: normalizeKey(r, ['Pregunta', 'pregunta']),
    respuesta: normalizeKey(r, ['Respuesta', 'respuesta']),
    orden: Number(normalizeKey(r, ['Orden', 'orden'], 999)) || 999,
    estado: normalizeKey(r, ['Estado', 'estado'])
  })).sort((a, b) => a.orden - b.orden);
}

function mapHorarios(rows) {
  return rows.map(r => ({
    id: normalizeKey(r, ['ID', 'Id']),
    tipo: normalizeKey(r, ['Tipo de Horario', 'Tipo', 'tipo']),
    destino: normalizeKey(r, ['Destino / Servicio', 'Destino', 'destino']),
    dias: normalizeKey(r, ['Días de Operación', 'Dias de Operacion', 'Días', 'dias']),
    horaInicio: normalizeKey(r, ['Hora Inicio', 'hora inicio']),
    horaFin: normalizeKey(r, ['Hora Fin', 'hora fin']),
    punto: normalizeKey(r, ['Punto de Partida / Canal', 'Punto de Partida', 'punto']),
    notas: normalizeKey(r, ['Notas / Frecuencia', 'Notas', 'notas']),
    estado: normalizeKey(r, ['Estado', 'estado'])
  }));
}

function whatsappUrl(message) {
  const phone = '528130515995';
  const text = encodeURIComponent(
    message || "Hola, me interesa recibir información sobre los viajes y promociones de Viajes D'Gavi by Morhú."
  );
  return `https://wa.me/${phone}?text=${text}`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.SheetsAPI = {
  SPREADSHEET_EDIT_ID,
  SHEETS,
  startAutoRefresh,
  loadAll,
  refreshNow,
  isRefreshing,
  onData,
  getData,
  mapPromociones,
  mapServicios,
  mapTodoIncluido,
  mapDestinos,
  mapTours,
  mapFaq,
  mapHorarios,
  whatsappUrl,
  escapeHtml,
  cache
};
