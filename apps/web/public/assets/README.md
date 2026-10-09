# Repositorio de Creativos y Assets Visuales (Aethelgard)

Esta carpeta almacena los recursos estáticos generados para el juego web.

## Estructura de carpetas

```text
apps/web/public/assets/
├── criaturas/    -> Sprites e ilustraciones de criaturas (WebP / PNG)
├── zonas/        -> Paisajes e ilustraciones de rutas y localidades (WebP / PNG)
├── objetos/      -> Iconos y sprites de ítems, orbes y pociones (WebP / PNG)
└── sonidos/      -> Efectos de sonido breves retro en formato MP3 / WAV
```

## Convención de nombres de archivos

Los nombres deben coincidir con el identificador (`slug`) de la entidad:
- **Criaturas:** `nombre-en-kebab-case.webp` (ej: `lobo-estelar.webp`, `draco-ceniza.webp`).
- **Zonas:** `nombre-zona.webp` (ej: `valle-susurros.webp`, `bastion-solar.webp`).
- **Objetos:** `nombre-objeto.webp` (ej: `pocion-curativa.webp`, `orbe-captura.webp`).

## Dimensiones recomendadas (para Google Flow / Generación)

- **Criaturas:** 256x256 px o 512x512 px (formato WebP, fondo transparente o viñeta retro).
- **Objetos:** 128x128 px o 256x256 px (fondo transparente, estilo pixel-art o retro).
- **Zonas / Paisajes:** 640x360 px o 800x450 px (relación 16:9, paisaje retro panorámico).
- **Sonidos:** MP3 o WAV de 0.5 a 2 segundos (máx 100 KB).

## Placeholders
Si un archivo aún no se ha colocado en la carpeta, la aplicación utiliza automáticamente los placeholders SVG en `/assets/placeholder-*.svg`.
