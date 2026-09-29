# Sushi Center Talca

Sitio estático de catálogo y pedidos por WhatsApp. Incluye un respaldo de la carta para mostrar contenido cuando Google Sheets no responde; en ese caso la página avisa que se está viendo una copia y pide confirmar precios y stock.

## Ejecutar

```bash
npm run dev
```

Abrir `http://localhost:4173`.

## Publicar en Vercel

Subir esta carpeta a un repositorio GitHub y conectar el repositorio a Vercel. El proyecto trae `vercel.json`, que omite la instalación y compilación en Vercel y sirve directamente `public/`. No requiere dependencias de npm.

## Editar la carta

La URL del CSV publicado está en `public/src/app.js` (`CSV_URL`). La página vuelve a consultar Google Sheets al abrirse, al volver a la pestaña y cada cinco minutos mientras está visible. El cliente puede cambiar categorías, nombres, descripciones, opciones, precios, stock y enlaces de foto en la planilla sin volver a publicar.

`stock=sí` habilita la compra; cualquier otro valor la bloquea. Un precio vacío también la bloquea. La columna `foto` acepta una URL pública directa de imagen. Si la URL falla, la tarjeta vuelve automáticamente al diseño sin imagen.

Las imágenes de `public/assets/` son archivos locales. La foto de portada es una imagen conceptual creada para la web, no representa un producto específico de la carta.
