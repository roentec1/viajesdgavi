# Viajes D'Gavi by Morhú — Sitio web

Portal estático conectado a **Google Sheets**. Sin panel admin: editas la hoja y el sitio se actualiza.

## Google Sheet

**Editar datos aquí:**  
https://docs.google.com/spreadsheets/d/1WQQC-9lD3S9BV9spvZTRxDnpR6oTURCYxgnwq39a2rc/edit

El sitio lee la versión **publicada en la web** (CSV) de esa misma hoja.

### Pestañas (gid)

| Sección | gid |
|---------|-----|
| Promociones | 271680704 |
| Servicios | 1773325793 |
| Todo incluido | 479306391 |
| Destinos | 1433921742 |
| Tours | 1242735945 |
| FAQ | 1131629955 |
| Citas | 1878396277 |
| Horarios | 1995823101 |

### Importante: mantener publicada la hoja

1. Abre la hoja de edición.
2. **Archivo → Compartir → Publicar en la web**.
3. Publica **todo el documento** o cada pestaña.
4. Si dejas de publicar, el sitio no podrá leer los datos.

Solo se muestran filas con **Estado** = `Activo`, `Disponible` o `Publicado`.

## Actualización en el sitio

- Automática cada **15 minutos**.
- Botón **Actualizar ahora** para forzar la lectura al momento.

## Subir a GitHub + GitHub Pages

```bash
# 1. Crea un repo nuevo en GitHub (ej. viajes-dgavi)
# 2. En tu PC:
unzip viajes-portal.zip
cd viajes-portal
git init
git add .
git commit -m "Sitio Viajes D'Gavi by Morhú"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/viajes-dgavi.git
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Deploy from branch → main → / (root) → Save**.

También puedes usar **Netlify** o **Vercel**: arrastra la carpeta o conecta el repo.

## Estructura

```
viajes-portal/
├── index.html
├── contacto.html
├── aviso-privacidad.html
├── README.md
└── assets/
    ├── css/style.css
    ├── js/sheets.js    ← conexión a Google Sheets
    ├── js/render.js    ← dibuja cada sección
    ├── js/main.js
    └── img/logo.jpg
```

## Contacto

El formulario abre **WhatsApp** con el mensaje del cliente (no requiere servidor).

WhatsApp: 81 3051 5995  
Correo: viajes.d.gavi@gmail.com
