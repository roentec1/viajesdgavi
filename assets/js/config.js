/**
 * Viajes D'Gavi by Morhú - Site Configuration
 * NO PHP - Pure static + Google Apps Script
 */

const SITE_CONFIG = {
  name: "Viajes D'Gavi by Morhú",
  slogan: "El placer de viajar sin preocupaciones",
  url: "https://viajes-d-gavi.com",
  email: "viajes.d.gavi@gmail.com",
  phone: "81 3051 5995",
  whatsapp: "528130515995",
  address: "Monterrey, N.L. CP 66460",

  // URL por defecto (cámbiala aquí O desde el panel Admin → Configuración)
  googleScriptUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",

  social: {
    facebook: "https://www.facebook.com/ViajesDGaviByMorhu",
    instagram: "",
    tiktok: "",
    youtube: "",
    twitter: ""
  },

  admin: {
    username: "admin",
    passwordHash: "Admin2026!"
  }
};

// --- Override desde Admin (localStorage) ---
// Si guardaste la URL en el panel Admin, se usa automáticamente en este navegador.
// Para que TODOS los visitantes la usen, también debe estar en googleScriptUrl arriba
// y volver a publicar el sitio (o usar la opción "Descargar config.js" del admin).
(function applyStoredConfig() {
  try {
    const storedUrl = localStorage.getItem("vdg_gas_url");
    if (storedUrl && storedUrl.indexOf("script.google.com") !== -1) {
      SITE_CONFIG.googleScriptUrl = storedUrl.trim();
    }
    const storedSocial = localStorage.getItem("vdg_social");
    if (storedSocial) {
      const s = JSON.parse(storedSocial);
      SITE_CONFIG.social = Object.assign({}, SITE_CONFIG.social, s);
    }
  } catch (e) {}
})();

function getWhatsAppUrl(message) {
  const defaultMsg = "Hola, me interesa recibir información sobre los viajes y promociones de Viajes D'Gavi by Morhú.";
  const msg = encodeURIComponent(message || defaultMsg);
  return "https://wa.me/" + SITE_CONFIG.whatsapp + "?text=" + msg;
}

function formatPrice(price) {
  return "$" + Number(price).toLocaleString("es-MX") + " MXN";
}

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, parseInt(rating) || 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

/** Guarda la URL de Google Apps Script (desde Admin) */
function saveGoogleScriptUrl(url) {
  url = (url || "").trim();
  if (!url) {
    localStorage.removeItem("vdg_gas_url");
    return { success: false, message: "URL vacía" };
  }
  if (url.indexOf("script.google.com") === -1 && url.indexOf("YOUR_SCRIPT") === -1) {
    return { success: false, message: "La URL no parece de Google Apps Script" };
  }
  localStorage.setItem("vdg_gas_url", url);
  SITE_CONFIG.googleScriptUrl = url;
  return { success: true, message: "URL guardada. El sitio usará esta conexión." };
}

function getGoogleScriptUrl() {
  return SITE_CONFIG.googleScriptUrl || "";
}
