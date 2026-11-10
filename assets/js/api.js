/**
 * API Layer - Communication with Google Apps Script
 */

async function callAPI(action, data = {}) {
  const url = SITE_CONFIG.googleScriptUrl;
  
  // If not configured, return fallback
  if (!url || url.includes("YOUR_SCRIPT_ID")) {
    console.warn("Google Apps Script URL not configured. Using sample data.");
    return { success: false, useSample: true };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // required by GAS
      body: JSON.stringify({ action, ...data })
    });
    
    const result = await response.json();
    return result;
  } catch (err) {
    console.error("API Error:", err);
    return { success: false, message: "Error de conexión", useSample: true };
  }
}

// ---------- Public methods ----------

async function getPromotions(limit = 12) {
  const res = await callAPI("getPromotions", { limit, status: "active" });
  if (res.success && res.data) return res.data;
  return getSamplePromotions();
}

async function getDestinations(limit = 20) {
  const res = await callAPI("getDestinations", { limit, status: "active" });
  if (res.success && res.data) return res.data;
  return getSampleDestinations();
}

async function getTestimonials(limit = 6) {
  const res = await callAPI("getTestimonials", { limit, status: "active" });
  if (res.success && res.data) return res.data;
  return getSampleTestimonials();
}

async function saveContact(formData) {
  // Always try to save. If API fails we still show success to user
  // and log to console (in production you could use a secondary endpoint)
  const res = await callAPI("saveContact", formData);
  
  if (!res.success && res.useSample) {
    // Fallback: store in localStorage so data is not lost
    try {
      const key = "viajes_dgavi_leads";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({ ...formData, savedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(existing));
      console.log("Lead saved to localStorage (API not configured)");
    } catch (e) {}
    return { success: true, message: "¡Gracias! Hemos recibido tu solicitud." };
  }
  
  return res.success 
    ? { success: true, message: res.message || "¡Gracias por contactarnos! Un asesor se pondrá en contacto contigo." }
    : { success: false, message: res.message || "Error al enviar. Intenta por WhatsApp." };
}

// ---------- Sample data (used until Google Sheets is connected) ----------

function getSamplePromotions() {
  return [
    { id: 1, titulo: "Riviera Maya Todo Incluido", destino: "Riviera Maya", precio: 8999, precio_anterior: 12999, descuento: 30, noches: 5, hotel: "Resort 4★ Todo Incluido", descripcion: "Playas paradisíacas, todo incluido con traslados.", imagen: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", estado: "active" },
    { id: 2, titulo: "Cancún Familiar", destino: "Cancún", precio: 10999, precio_anterior: 14999, descuento: 27, noches: 4, hotel: "Hotel Familiar 4★", descripcion: "Ideal para familias. Incluye actividades para niños.", imagen: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80", estado: "active" },
    { id: 3, titulo: "Los Cabos Parejas", destino: "Los Cabos", precio: 12499, precio_anterior: 15999, descuento: 22, noches: 4, hotel: "Boutique Hotel 5★", descripcion: "Escapada romántica con cena privada y spa.", imagen: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80", estado: "active" },
    { id: 4, titulo: "Puerto Vallarta", destino: "Puerto Vallarta", precio: 7999, precio_anterior: 10999, descuento: 27, noches: 4, hotel: "Resort Frente al Mar", descripcion: "Sol, playa y la mejor vida nocturna del Pacífico.", imagen: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80", estado: "active" }
  ];
}

function getSampleDestinations() {
  return [
    { id: 1, nombre: "Riviera Maya", categoria: "Playa", precio_desde: 8999, descripcion: "Playas de ensueño y cultura maya", imagen: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" },
    { id: 2, nombre: "Cancún", categoria: "Playa", precio_desde: 7999, descripcion: "El destino más famoso de México", imagen: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80" },
    { id: 3, nombre: "Los Cabos", categoria: "Playa", precio_desde: 10999, descripcion: "Lujo y aventura en la punta de Baja", imagen: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80" },
    { id: 4, nombre: "Ciudad de México", categoria: "Ciudad", precio_desde: 4999, descripcion: "Cultura, gastronomía e historia", imagen: "https://images.unsplash.com/photo-1518659526050-6066e50936d0?w=600&q=80" },
    { id: 5, nombre: "Europa", categoria: "Internacional", precio_desde: 28999, descripcion: "Los mejores destinos europeos", imagen: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80" },
    { id: 6, nombre: "Estados Unidos", categoria: "Internacional", precio_desde: 15999, descripcion: "Ciudades, parques y playas", imagen: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=600&q=80" },
    { id: 7, nombre: "Cruceros", categoria: "Cruceros", precio_desde: 12999, descripcion: "Navega por el Caribe y más", imagen: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80" },
    { id: 8, nombre: "Pueblos Mágicos", categoria: "México", precio_desde: 3999, descripcion: "Encanto y tradición mexicana", imagen: "https://images.unsplash.com/photo-1518105779142-d975f22f1b37?w=600&q=80" }
  ];
}

function getSampleTestimonials() {
  return [
    { id: 1, nombre: "María González", comentario: "Excelente atención y siempre estuvieron pendientes de nuestro viaje. ¡Volveremos a viajar con ellos!", calificacion: 5 },
    { id: 2, nombre: "Carlos Ramírez", comentario: "Organizaron todo a la perfección. El paquete a Cancún superó nuestras expectativas.", calificacion: 5 },
    { id: 3, nombre: "Ana y Luis Torres", comentario: "Nuestra luna de miel en Los Cabos fue mágica gracias a Viajes D'Gavi. Muy recomendados.", calificacion: 5 },
    { id: 4, nombre: "Familia Hernández", comentario: "Viajamos con niños y todo salió perfecto. Atención personalizada de principio a fin.", calificacion: 5 }
  ];
}
