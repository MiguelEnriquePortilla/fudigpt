echo "const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Asegúrate de que el directorio existe
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Redimensionar la imagen del logotipo principal
sharp('fudigpt-logo.png')
  .resize(240, 240)
  .toFile(path.join(imagesDir, 'fudigpt-logo.png'))
  .then(() => console.log('Logo principal creado'))
  .catch(err => console.error('Error al crear logo principal:', err));

// Crear versión más pequeña para la barra lateral
sharp('fudigpt-logo.png')
  .resize(64, 64)
  .toFile(path.join(imagesDir, 'fudigpt-icon-64.png'))
  .then(() => console.log('Icono pequeño creado'))
  .catch(err => console.error('Error al crear icono pequeño:', err));

// Crear versión facial para chat
sharp('fudigpt-face.png')
  .resize(48, 48)
  .toFile(path.join(imagesDir, 'fudigpt-face.png'))
  .then(() => console.log('Imagen facial creada'))
  .catch(err => console.error('Error al crear imagen facial:', err));
" > resize-images.js