/**
 * Viajes D'Gavi by Morhú - Google Apps Script Web App (completo)
 * Hojas: CLIENTES | PROMOCIONES | DESTINOS | PAQUETES | VENTAS | TESTIMONIOS
 */

const SHEETS = {
  CLIENTES: 'CLIENTES',
  PROMOCIONES: 'PROMOCIONES',
  DESTINOS: 'DESTINOS',
  PAQUETES: 'PAQUETES',
  VENTAS: 'VENTAS',
  TESTIMONIOS: 'TESTIMONIOS'
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || '';
    let result;

    switch (action) {
      // CLIENTES
      case 'saveContact': result = saveContact(data); break;
      case 'getClientes': result = getClientes(data); break;
      case 'updateContactStatus': result = updateContactStatus(data); break;

      // PROMOCIONES
      case 'getPromotions': result = getPromotions(data); break;
      case 'savePromotion': result = savePromotion(data); break;
      case 'deletePromotion': result = deleteRow(SHEETS.PROMOCIONES, data.id); break;
      case 'deleteCliente': result = deleteRow(SHEETS.CLIENTES, data.id); break;
      case 'deleteVenta': result = deleteRow(SHEETS.VENTAS, data.id); break;
      case 'uploadImage': result = uploadImage(data); break;

      // DESTINOS
      case 'getDestinations': result = getDestinations(data); break;
      case 'saveDestination': result = saveDestination(data); break;
      case 'deleteDestination': result = deleteRow(SHEETS.DESTINOS, data.id); break;

      // PAQUETES
      case 'getPackages': result = getPackages(data); break;
      case 'savePackage': result = savePackage(data); break;
      case 'deletePackage': result = deleteRow(SHEETS.PAQUETES, data.id); break;

      // VENTAS
      case 'getVentas': result = getVentas(data); break;
      case 'saveVenta': result = saveVenta(data); break;
      case 'getStats': result = getStats(data); break;

      // TESTIMONIOS
      case 'getTestimonials': result = getTestimonials(data); break;
      case 'saveTestimonial': result = saveTestimonial(data); break;

      default:
        result = { success: false, message: 'Acción no reconocida: ' + action };
    }

    return jsonOut(result);
  } catch (err) {
    return jsonOut({ success: false, message: 'Error: ' + err.toString() });
  }
}

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'ping';
  if (action === 'ping') {
    return jsonOut({ success: true, message: "API Viajes D'Gavi activa" });
  }
  return doPost({ postData: { contents: JSON.stringify(e.parameter || {}) } });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[String(h).toLowerCase().replace(/\s+/g, '_')] = row[i]; });
    // Also keep original keys commonly used
    obj.id = row[0];
    return obj;
  });
}

function findRowById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function deleteRow(sheetName, id) {
  if (!id) return { success: false, message: 'ID requerido' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Hoja no encontrada' };
  const row = findRowById(sheet, id);
  if (row < 0) return { success: false, message: 'Registro no encontrado' };
  sheet.deleteRow(row);
  return { success: true, message: 'Eliminado correctamente' };
}

// ---------- CLIENTES ----------
function saveContact(data) {
  const headers = ['ID','Fecha','Hora','Nombre','Teléfono','WhatsApp','Email','Destino','Fecha de viaje','Número de viajeros','Tipo de viaje','Presupuesto','Mensaje','Estado','Comentarios del asesor','IP'];
  const sheet = getOrCreateSheet(SHEETS.CLIENTES, headers);
  const id = Utilities.getUuid().substring(0, 8).toUpperCase();
  sheet.appendRow([
    id,
    data.fecha || Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd'),
    data.hora || Utilities.formatDate(new Date(), 'America/Mexico_City', 'HH:mm:ss'),
    data.nombre || '', data.telefono || '', data.whatsapp || '', data.email || '',
    data.destino || '', data.fecha_viaje || '', data.num_viajeros || 1,
    data.tipo_viaje || '', data.presupuesto || '', data.mensaje || '',
    data.estado || 'Nuevo', '', data.ip || ''
  ]);
  return { success: true, message: 'Información registrada correctamente', id: id };
}

function getClientes(params) {
  const headers = ['ID','Fecha','Hora','Nombre','Teléfono','WhatsApp','Email','Destino','Fecha de viaje','Número de viajeros','Tipo de viaje','Presupuesto','Mensaje','Estado','Comentarios del asesor','IP'];
  const sheet = getOrCreateSheet(SHEETS.CLIENTES, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  let list = data.slice(1).map(row => ({
    id: row[0], fecha: row[1], hora: row[2], nombre: row[3], telefono: row[4],
    whatsapp: row[5], email: row[6], destino: row[7], fecha_viaje: row[8],
    num_viajeros: row[9], tipo_viaje: row[10], presupuesto: row[11],
    mensaje: row[12], estado: row[13], comentarios: row[14]
  }));
  if (params && params.estado) list = list.filter(c => c.estado === params.estado);
  return { success: true, data: list };
}

function updateContactStatus(data) {
  if (!data.id) return { success: false, message: 'ID requerido' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.CLIENTES);
  if (!sheet) return { success: false, message: 'Hoja no encontrada' };
  const row = findRowById(sheet, data.id);
  if (row < 0) return { success: false, message: 'Cliente no encontrado' };
  if (data.estado) sheet.getRange(row, 14).setValue(data.estado);
  if (data.comentarios !== undefined) sheet.getRange(row, 15).setValue(data.comentarios);
  return { success: true, message: 'Estado actualizado' };
}

// ---------- PROMOCIONES ----------
function getPromotions(params) {
  const headers = ['ID','Fecha','Título','Destino','Precio','Precio anterior','Descuento','Fecha inicio','Fecha fin','Descripción','Imagen','Servicios incluidos','Condiciones','Noches','Hotel','Estado'];
  const sheet = getOrCreateSheet(SHEETS.PROMOCIONES, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  let list = data.slice(1).map(row => ({
    id: row[0], fecha: row[1], titulo: row[2], destino: row[3], precio: row[4],
    precio_anterior: row[5], descuento: row[6], fecha_inicio: row[7], fecha_fin: row[8],
    descripcion: row[9], imagen: row[10], servicios: row[11], condiciones: row[12],
    noches: row[13], hotel: row[14], estado: row[15]
  }));
  if (params && params.status) {
    list = list.filter(p => p.estado === params.status || p.estado === 'active' || p.estado === 'Activo');
  }
  if (params && params.limit) list = list.slice(0, parseInt(params.limit));
  return { success: true, data: list };
}

function savePromotion(data) {
  const headers = ['ID','Fecha','Título','Destino','Precio','Precio anterior','Descuento','Fecha inicio','Fecha fin','Descripción','Imagen','Servicios incluidos','Condiciones','Noches','Hotel','Estado'];
  const sheet = getOrCreateSheet(SHEETS.PROMOCIONES, headers);
  if (data.id) {
    const row = findRowById(sheet, data.id);
    if (row > 0) {
      sheet.getRange(row, 1, 1, headers.length).setValues([[
        data.id, data.fecha || Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd'),
        data.titulo || '', data.destino || '', data.precio || 0, data.precio_anterior || '',
        data.descuento || '', data.fecha_inicio || '', data.fecha_fin || '',
        data.descripcion || '', data.imagen || '', data.servicios || '', data.condiciones || '',
        data.noches || '', data.hotel || '', data.estado || 'active'
      ]]);
      return { success: true, message: 'Promoción actualizada', id: data.id };
    }
  }
  const id = data.id || Utilities.getUuid().substring(0, 8).toUpperCase();
  sheet.appendRow([
    id, Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd'),
    data.titulo || '', data.destino || '', data.precio || 0, data.precio_anterior || '',
    data.descuento || '', data.fecha_inicio || '', data.fecha_fin || '',
    data.descripcion || '', data.imagen || '', data.servicios || '', data.condiciones || '',
    data.noches || '', data.hotel || '', data.estado || 'active'
  ]);
  return { success: true, message: 'Promoción creada', id: id };
}

// ---------- DESTINOS ----------
function getDestinations(params) {
  const headers = ['ID','Destino','País','Categoría','Descripción','Imagen','Precio desde','Visitas','Estado'];
  const sheet = getOrCreateSheet(SHEETS.DESTINOS, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  let list = data.slice(1).map(row => ({
    id: row[0], nombre: row[1], destino: row[1], pais: row[2], categoria: row[3],
    descripcion: row[4], imagen: row[5], precio_desde: row[6], visitas: row[7] || 0, estado: row[8]
  }));
  if (params && params.status) {
    list = list.filter(d => d.estado === params.status || d.estado === 'active' || d.estado === 'Activo');
  }
  if (params && params.limit) list = list.slice(0, parseInt(params.limit));
  return { success: true, data: list };
}

function saveDestination(data) {
  const headers = ['ID','Destino','País','Categoría','Descripción','Imagen','Precio desde','Visitas','Estado'];
  const sheet = getOrCreateSheet(SHEETS.DESTINOS, headers);
  if (data.id) {
    const row = findRowById(sheet, data.id);
    if (row > 0) {
      const current = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
      sheet.getRange(row, 1, 1, headers.length).setValues([[
        data.id, data.nombre || data.destino || '', data.pais || '', data.categoria || '',
        data.descripcion || '', data.imagen || '', data.precio_desde || 0,
        data.visitas !== undefined ? data.visitas : (current[7] || 0),
        data.estado || 'active'
      ]]);
      return { success: true, message: 'Destino actualizado', id: data.id };
    }
  }
  const id = data.id || Utilities.getUuid().substring(0, 8).toUpperCase();
  sheet.appendRow([
    id, data.nombre || data.destino || '', data.pais || 'México', data.categoria || '',
    data.descripcion || '', data.imagen || '', data.precio_desde || 0, data.visitas || 0,
    data.estado || 'active'
  ]);
  return { success: true, message: 'Destino creado', id: id };
}

// ---------- PAQUETES ----------
function getPackages(params) {
  const headers = ['ID','Título','Categoría','Destino','Noches','Precio','Precio anterior','Descripción','Imagen','Estado'];
  const sheet = getOrCreateSheet(SHEETS.PAQUETES, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  let list = data.slice(1).map(row => ({
    id: row[0], titulo: row[1], categoria: row[2], destino: row[3], noches: row[4],
    precio: row[5], precio_anterior: row[6], descripcion: row[7], imagen: row[8], estado: row[9]
  }));
  if (params && params.status) {
    list = list.filter(p => p.estado === params.status || p.estado === 'active' || p.estado === 'Activo');
  }
  if (params && params.limit) list = list.slice(0, parseInt(params.limit));
  return { success: true, data: list };
}

function savePackage(data) {
  const headers = ['ID','Título','Categoría','Destino','Noches','Precio','Precio anterior','Descripción','Imagen','Estado'];
  const sheet = getOrCreateSheet(SHEETS.PAQUETES, headers);
  if (data.id) {
    const row = findRowById(sheet, data.id);
    if (row > 0) {
      sheet.getRange(row, 1, 1, headers.length).setValues([[
        data.id, data.titulo || '', data.categoria || '', data.destino || '',
        data.noches || '', data.precio || 0, data.precio_anterior || '',
        data.descripcion || '', data.imagen || '', data.estado || 'active'
      ]]);
      return { success: true, message: 'Paquete actualizado', id: data.id };
    }
  }
  const id = data.id || Utilities.getUuid().substring(0, 8).toUpperCase();
  sheet.appendRow([
    id, data.titulo || '', data.categoria || '', data.destino || '',
    data.noches || '', data.precio || 0, data.precio_anterior || '',
    data.descripcion || '', data.imagen || '', data.estado || 'active'
  ]);
  return { success: true, message: 'Paquete creado', id: id };
}

// ---------- VENTAS ----------
function getVentas(params) {
  const headers = ['ID','Fecha','Cliente','Destino','Concepto','Monto','Estado','Notas'];
  const sheet = getOrCreateSheet(SHEETS.VENTAS, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  let list = data.slice(1).map(row => ({
    id: row[0], fecha: row[1], cliente: row[2], destino: row[3],
    concepto: row[4], monto: Number(row[5]) || 0, estado: row[6], notas: row[7]
  }));
  return { success: true, data: list };
}

function saveVenta(data) {
  const headers = ['ID','Fecha','Cliente','Destino','Concepto','Monto','Estado','Notas'];
  const sheet = getOrCreateSheet(SHEETS.VENTAS, headers);
  const id = data.id || Utilities.getUuid().substring(0, 8).toUpperCase();
  if (data.id) {
    const row = findRowById(sheet, data.id);
    if (row > 0) {
      sheet.getRange(row, 1, 1, headers.length).setValues([[
        data.id, data.fecha || '', data.cliente || '', data.destino || '',
        data.concepto || '', data.monto || 0, data.estado || 'Confirmada', data.notas || ''
      ]]);
      return { success: true, message: 'Venta actualizada', id: data.id };
    }
  }
  sheet.appendRow([
    id,
    data.fecha || Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd'),
    data.cliente || '', data.destino || '', data.concepto || '',
    data.monto || 0, data.estado || 'Confirmada', data.notas || ''
  ]);
  return { success: true, message: 'Venta registrada', id: id };
}

function getStats(params) {
  const clientes = getClientes({}).data || [];
  const promos = getPromotions({}).data || [];
  const destinos = getDestinations({}).data || [];
  const ventas = getVentas({}).data || [];
  const paquetes = getPackages({}).data || [];

  const totalVentas = ventas.reduce((s, v) => s + (Number(v.monto) || 0), 0);
  const ventasMes = ventas.filter(v => {
    const f = String(v.fecha || '');
    const now = Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM');
    return f.indexOf(now) === 0;
  });
  const totalMes = ventasMes.reduce((s, v) => s + (Number(v.monto) || 0), 0);

  // Destinos más solicitados (por clientes)
  const destCount = {};
  clientes.forEach(c => {
    const d = c.destino || 'Sin destino';
    destCount[d] = (destCount[d] || 0) + 1;
  });
  const destinosPopulares = Object.keys(destCount).map(k => ({ destino: k, solicitudes: destCount[k] }))
    .sort((a, b) => b.solicitudes - a.solicitudes);

  return {
    success: true,
    data: {
      totalClientes: clientes.length,
      clientesNuevos: clientes.filter(c => c.estado === 'Nuevo').length,
      promocionesActivas: promos.filter(p => p.estado === 'active' || p.estado === 'Activo').length,
      destinosPublicados: destinos.filter(d => d.estado === 'active' || d.estado === 'Activo').length,
      paquetesActivos: paquetes.filter(p => p.estado === 'active' || p.estado === 'Activo').length,
      totalVentas: totalVentas,
      totalVentasMes: totalMes,
      cantidadVentas: ventas.length,
      destinosPopulares: destinosPopulares
    }
  };
}

// ---------- TESTIMONIOS ----------
function getTestimonials(params) {
  const headers = ['ID','Nombre','Foto','Comentario','Calificación','Estado'];
  const sheet = getOrCreateSheet(SHEETS.TESTIMONIOS, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  let list = data.slice(1).map(row => ({
    id: row[0], nombre: row[1], foto: row[2], comentario: row[3],
    calificacion: row[4], estado: row[5]
  }));
  if (params && params.status) {
    list = list.filter(t => t.estado === params.status || t.estado === 'active' || t.estado === 'Activo');
  }
  if (params && params.limit) list = list.slice(0, parseInt(params.limit));
  return { success: true, data: list };
}

function saveTestimonial(data) {
  const headers = ['ID','Nombre','Foto','Comentario','Calificación','Estado'];
  const sheet = getOrCreateSheet(SHEETS.TESTIMONIOS, headers);
  const id = data.id || Utilities.getUuid().substring(0, 8).toUpperCase();
  sheet.appendRow([id, data.nombre || '', data.foto || '', data.comentario || '', data.calificacion || 5, data.estado || 'active']);
  return { success: true, message: 'Testimonio guardado', id: id };
}


// ---------- IMÁGENES (subida desde PC → Google Drive) ----------
function uploadImage(data) {
  try {
    if (!data.base64) return { success: false, message: 'No se recibió imagen' };
    var raw = String(data.base64);
    // Quitar prefijo data:image/...;base64,
    var base64 = raw;
    var mime = data.mimeType || 'image/jpeg';
    if (raw.indexOf('base64,') !== -1) {
      var parts = raw.split('base64,');
      base64 = parts[1];
      var meta = parts[0] || '';
      if (meta.indexOf('image/png') !== -1) mime = 'image/png';
      else if (meta.indexOf('image/webp') !== -1) mime = 'image/webp';
      else if (meta.indexOf('image/gif') !== -1) mime = 'image/gif';
      else mime = 'image/jpeg';
    }
    var bytes = Utilities.base64Decode(base64);
    var name = data.filename || ('img_' + Utilities.getUuid().substring(0, 8) + '.jpg');
    var blob = Utilities.newBlob(bytes, mime, name);

    // Carpeta "Viajes DGavi Imagenes" (se crea si no existe)
    var folders = DriveApp.getFoldersByName('Viajes DGavi Imagenes');
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Viajes DGavi Imagenes');
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var id = file.getId();
    // URL directa para usar en <img>
    var url = 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000';
    var viewUrl = 'https://drive.google.com/uc?export=view&id=' + id;
    return { success: true, url: viewUrl, thumb: url, id: id, message: 'Imagen subida correctamente' };
  } catch (err) {
    return { success: false, message: 'Error al subir imagen: ' + err.toString() };
  }
}

