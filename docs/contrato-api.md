# Contrato REST de la API: Aethelgard

Este documento define la especificación técnica de la API REST que comunica el Front-End y el Back-End. Rige el comportamiento de la API simulada (`apiSimulada.ts`) y del servidor definitivo en NestJS.

---

## 1. Convenciones y estándares globales

1. **Prefijo base:** Todos los endpoints inician con `/api`.
2. **Convención de nomenclatura:**
   - Rutas URL en español, minúsculas y separadas por guiones medios (kebab-case), por ejemplo: `/api/mundo/ubicacion-actual`.
   - Propiedades en cuerpos y respuestas JSON en español con notación `camelCase`, por ejemplo: `nombrePersonaje`, `hpActual`, `puntosExperiencia`.
3. **Códigos de estado HTTP:**
   - `200 OK`: Petición procesada exitosamente.
   - `201 Created`: Recurso creado satisfactoriamente.
   - `400 Bad Request`: Parámetros de petición inválidos o malformados.
   - `401 Unauthorized`: Falta de token de autenticación o sesión inválida.
   - `403 Forbidden`: Acción no autorizada por reglas de seguridad o estado de juego (ej. moverse a zona bloqueada o actuar fuera de turno).
   - `404 Not Found`: Recurso solicitado no encontrado.
   - `409 Conflict`: Conflicto de estado (ej. nombre de usuario duplicado o equipo completo sin almacén).
   - `500 Internal Server Error`: Falla interna no controlada en el servidor.
4. **Formato único de error:**
   Toda respuesta con código $\ge 400$ retorna estrictamente la siguiente estructura:
   ```json
   {
     "error": {
       "codigo": "CODIGO_ERROR_MAYUSCULAS",
       "mensaje": "Descripción en español clara y comprensible para el usuario."
     }
   }
   ```
5. **Regla de aislamiento externo (Anexo A.4):** Ningún endpoint del juego efectúa llamadas a la API externa de Open5e durante el tiempo de juego. Todas las consultas leen exclusivamente de la base de datos local (cargada previamente mediante el script de importación).

---

## 2. Catálogo de endpoints

### 2.1 Verificación de infraestructura
#### `GET /api/salud`
- **Módulo:** Cimientos / Infraestructura (`Fase 0`).
- **Descripción:** Verifica la operatividad del servidor.
- **Petición:** Ninguna.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "estado": "activo",
    "marcaTiempo": "2026-10-07T12:00:00.000Z",
    "version": "0.1.0"
  }
  ```
- **Errores posibles:** `500 ERROR_INTERNO_SERVIDOR`.

---

### 2.2 Autenticación y usuarios (`M-USR`)

#### `POST /api/usuarios/registro`
- **Módulo:** `M-USR`.
- **Descripción:** Registra un nuevo usuario en la plataforma.
- **Cuerpo de petición:**
  ```json
  {
    "nombreUsuario": "arturo_sendas",
    "correo": "arturo@ejemplo.com",
    "clave": "SecretoSeguro2026!"
  }
  ```
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "usuarioId": "usr-101",
    "nombreUsuario": "arturo_sendas",
    "correo": "arturo@ejemplo.com",
    "tokenAcceso": "jwt.token.simulado"
  }
  ```
- **Errores posibles:**
  - `400 DATOS_INVALIDOS` (correo o clave no cumplen formato).
  - `409 USUARIO_DUPLICADO` (nombre de usuario o correo ya registrado).

#### `POST /api/usuarios/login`
- **Módulo:** `M-USR`.
- **Descripción:** Inicia sesión y genera token de autenticación.
- **Cuerpo de petición:**
  ```json
  {
    "correo": "arturo@ejemplo.com",
    "clave": "SecretoSeguro2026!"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "usuarioId": "usr-101",
    "nombreUsuario": "arturo_sendas",
    "tokenAcceso": "jwt.token.simulado",
    "tienePersonaje": true
  }
  ```
- **Errores posibles:**
  - `401 CREDENCIALES_INVALIDAS` (usuario o clave incorrectos).

#### `POST /api/usuarios/logout`
- **Módulo:** `M-USR`.
- **Descripción:** Invalida la sesión del explorador.
- **Cuerpo de petición:** Ninguno (requiere cabecera `Authorization: Bearer <token>`).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "mensaje": "Sesión cerrada correctamente."
  }
  ```

---

### 2.3 Personaje y progreso inicial (`M-PJ`)

#### `POST /api/personajes`
- **Módulo:** `M-PJ`, `M-CRI`.
- **Descripción:** Crea el personaje explorador asignando ubicación inicial (`LOC-01`) y la especie inicial elegida.
- **Cuerpo de petición:**
  ```json
  {
    "nombre": "Arturo",
    "especieInicialSlug": "lobo-gris"
  }
  ```
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "personajeId": "pj-201",
    "nombre": "Arturo",
    "monedas": 100,
    "ubicacionActualId": "LOC-01",
    "criaturaInicial": {
      "criaturaId": "cri-301",
      "especieSlug": "lobo-gris",
      "nombre": "Lobo Gris",
      "nivel": 1,
      "hpActual": 30,
      "hpMaximo": 30,
      "puntosExperiencia": 0
    }
  }
  ```
- **Errores posibles:**
  - `400 ESPECIE_INICIAL_INVALIDA`.
  - `409 PERSONAJE_YA_EXISTE` (usuario ya tiene personaje activo).

#### `GET /api/personajes/activo`
- **Módulo:** `M-PJ`.
- **Descripción:** Obtiene los datos del explorador autenticado.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "personajeId": "pj-201",
    "nombre": "Arturo",
    "monedas": 120,
    "ubicacionActualId": "LOC-01",
    "totalCriaturasEquipo": 3,
    "totalCriaturasAlmacen": 1
  }
  ```
- **Errores posibles:**
  - `404 PERSONAJE_NO_ENCONTRADO`.

---

### 2.4 Mundo y navegación (`M-MUN`, `M-PRO`)

#### `GET /api/mundo/ubicacion-actual`
- **Módulo:** `M-MUN`.
- **Descripción:** Retorna los detalles de la ubicación actual del personaje, su slug para recursos multimedia, nivel sugerido, servicios, progreso de exploración y destinos conectados.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "ubicacionId": "LOC-01",
    "nombre": "Villa Serena",
    "slug": "villa-serena",
    "tipo": "LOCALIDAD",
    "esSegura": true,
    "descripcion": "Aldea pacífica en el valle donde inician los reclutas del gremio.",
    "nivelMinimo": null,
    "nivelMaximo": null,
    "nivelSugerido": null,
    "servicios": ["CURACION", "ALMACEN", "HISTORIAL"],
    "progresoZona": 100,
    "conexiones": [
      {
        "ubicacionDestinoId": "ZON-01",
        "nombre": "Praderas del Amanecer",
        "nivelSugerido": "1-3",
        "estaBloqueada": false,
        "requisito": null
      },
      {
        "ubicacionDestinoId": "ZON-02",
        "nombre": "Bosque Susurrante",
        "nivelSugerido": "2-4",
        "estaBloqueada": false,
        "requisito": null
      }
    ]
  }
  ```

#### `POST /api/mundo/viajar`
- **Módulo:** `M-MUN`, `M-PRO`.
- **Descripción:** Desplaza al personaje hacia una ubicación conectada válida.
- **Cuerpo de petición:**
  ```json
  {
    "destinoId": "ZON-01"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "ubicacionActualId": "ZON-01",
    "nombre": "Praderas del Amanecer",
    "mensaje": "Has llegado a Praderas del Amanecer."
  }
  ```
- **Errores posibles:**
  - `403 ZONA_BLOQUEADA` (la zona exige requisitos no cumplidos por el jugador, regla `S-2`).
  - `400 CONEXION_INVALIDA` (el destino no está conectado directamente con la ubicación actual).

---

### 2.5 Exploración (`M-EXP`, `M-ENC`)

#### `POST /api/exploracion/explorar`
- **Módulo:** `M-EXP`.
- **Descripción:** Ejecuta una tirada probabilística de exploración en la ruta silvestre activa. Si el evento es `OBJETO` o `SIN_EVENTO`, computa y persiste el avance cartográfico (+20% hasta 100%). Si resulta en `ENCUENTRO`, el progreso de la zona se mantiene en su valor actual sin incremento prematuro, acreditándose el +20% al resolver el combate en el servidor (`VICTORIA` o `CAPTURADO`).
- **Cuerpo de petición:** Ninguno.
- **Respuesta exitosa (`200 OK`) - Caso Encuentro:**
  ```json
  {
    "tipoEvento": "ENCUENTRO",
    "mensaje": "¡Una criatura salvaje te desafía en el camino!",
    "progresoZona": 0,
    "encuentro": {
      "encuentroId": "enc-401",
      "estado": "EN_CURSO",
      "especie": {
        "slug": "pico-de-hacha",
        "nombre": "Pico de Hacha",
        "nivel": 2,
        "hpActual": 19,
        "hpMaximo": 19,
        "ataque": 42,
        "defensa": 51,
        "velocidad": 60
      }
    }
  }
  ```
- **Respuesta exitosa (`200 OK`) - Caso Objeto:**
  ```json
  {
    "tipoEvento": "OBJETO",
    "mensaje": "Has encontrado un cofre oculto en la maleza con 20 monedas.",
    "progresoZona": 40,
    "recompensa": {
      "tipo": "MONEDAS",
      "cantidad": 20
    }
  }
  ```
- **Respuesta exitosa (`200 OK`) - Caso Sin Evento:**
  ```json
  {
    "tipoEvento": "SIN_EVENTO",
    "mensaje": "Recorres la senda con tranquilidad; el viento sopla apacible.",
    "progresoZona": 60,
    "recompensa": null
  }
  ```
- **Errores posibles:**
  - `403 ZONA_NO_EXPLORABLE` (se intentó explorar dentro de una localidad segura).
  - `409 ENCUENTRO_PREVIO_ACTIVO` (ya existe un combate en curso pendiente de resolver).

#### `GET /api/encuentros/activo`
- **Módulo:** `M-ENC`.
- **Descripción:** Consulta el estado del encuentro o combate actualmente en desarrollo.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "turno": 1,
    "esTurnoJugador": true,
    "criaturaRival": {
      "slug": "pico-de-hacha",
      "nombre": "Pico de Hacha",
      "nivel": 2,
      "hpActual": 14,
      "hpMaximo": 19,
      "ataque": 42,
      "defensa": 51,
      "velocidad": 60
    },
    "criaturaAliada": {
      "criaturaId": "cri-301",
      "nombre": "Lobo Gris",
      "nivel": 2,
      "hpActual": 25,
      "hpMaximo": 30
    }
  }
  ```
- **Errores posibles:**
  - `404 ENCUENTRO_NO_ENCONTRADO` (sin encuentro activo).

---

### 2.6 Combate y captura (`M-COM`, `M-CAP`)

#### `POST /api/combate/atacar`
- **Módulo:** `M-COM`.
- **Descripción:** Ejecuta el movimiento seleccionado por el jugador y resuelve el contraataque rival.
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401",
    "movimientoIndice": 0
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "turno": 2,
    "accionJugador": {
      "movimiento": "Mordisco Feroz",
      "danoCausado": 5,
      "hpRestanteRival": 9
    },
    "accionRival": {
      "movimiento": "Picotazo Cortante",
      "danoCausado": 4,
      "hpRestanteAliado": 21
    },
    "resultadoFinal": null
  }
  ```
- **Errores posibles:**
  - `400 ACCION_FUERA_DE_TURNO` (regla `S-5`).
  - `404 ENCUENTRO_NO_ENCONTRADO`.

#### `POST /api/combate/capturar`
- **Módulo:** `M-CAP`, `M-INV`.
- **Descripción:** Intenta capturar la criatura enemiga usando un talismán del inventario (reglas `S-3`, `S-4`).
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401",
    "itemCodigo": "talisman-basico"
  }
  ```
- **Respuesta exitosa (`200 OK`) - Captura exitosa:**
  ```json
  {
    "exito": true,
    "mensaje": "¡Captura exitosa! Pico de Hacha ha sido incorporado a tu equipo.",
    "encuentroId": "enc-401",
    "estado": "CAPTURADO",
    "destinoCaptura": "EQUIPO",
    "criaturaCapturada": {
      "criaturaId": "cri-302",
      "nombre": "Pico de Hacha",
      "nivel": 2,
      "hpActual": 9,
      "hpMaximo": 19
    }
  }
  ```
- **Respuesta exitosa (`200 OK`) - Captura fallida:**
  ```json
  {
    "exito": false,
    "mensaje": "¡El talismán no logró contener a la criatura! Se ha roto.",
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "contraataqueRival": {
      "movimiento": "Picotazo Cortante",
      "danoCausado": 4,
      "hpRestanteAliado": 17
    }
  }
  ```
- **Errores posibles:**
  - `400 ITEM_NO_DISPONIBLE` (el jugador no posee el talismán en su inventario, regla `S-4`).
  - `404 ENCUENTRO_NO_ENCONTRADO` (sin encuentro activo, regla `S-3`).

#### `POST /api/combate/huir`
- **Módulo:** `M-COM`.
- **Descripción:** Intenta retirarse del combate.
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "exito": true,
    "mensaje": "¡Lograste huir del combate con éxito!",
    "estado": "HUIDO"
  }
  ```

---

### 2.7 Equipo y almacén (`M-EQU`)

#### `GET /api/equipo`
- **Módulo:** `M-EQU`.
- **Descripción:** Obtiene la lista de hasta 6 criaturas activas del equipo.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "criaturas": [
      {
        "criaturaId": "cri-301",
        "slug": "lobo-gris",
        "nombre": "Lobo Gris",
        "nivel": 2,
        "hpActual": 25,
        "hpMaximo": 30,
        "ataque": 42,
        "defensa": 58,
        "velocidad": 50,
        "orden": 1
      }
    ]
  }
  ```

#### `GET /api/almacen`
- **Módulo:** `M-EQU`.
- **Descripción:** Lista las criaturas resguardadas en el almacén de reserva.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "criaturas": [
      {
        "criaturaId": "cri-303",
        "slug": "arana-lobo-gigante",
        "nombre": "Araña Lobo Gigante",
        "nivel": 1,
        "hpActual": 11,
        "hpMaximo": 11
      }
    ]
  }
  ```

#### `POST /api/equipo/transferir`
- **Módulo:** `M-EQU`.
- **Descripción:** Mueve una criatura entre el equipo activo y el almacén (solo en localidades autorizadas).
- **Cuerpo de petición:**
  ```json
  {
    "criaturaId": "cri-303",
    "haciaEquipo": true
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "mensaje": "Criatura transferida exitosamente.",
    "totalEnEquipo": 2,
    "totalEnAlmacen": 0
  }
  ```
- **Errores posibles:**
  - `409 EQUIPO_COMPLETO` (no se puede transferir al equipo porque ya cuenta con 6 criaturas, regla `A-6`).
  - `400 EQUIPO_MINIMO_REQUERIDO` (no se puede enviar al almacén la última criatura del equipo).

---

### 2.8 Inventario y comercio (`M-INV`)

#### `GET /api/inventario`
- **Módulo:** `M-INV`.
- **Descripción:** Obtiene los objetos y cantidades pertenecientes al explorador.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "monedas": 120,
    "items": [
      {
        "codigo": "talisman-basico",
        "nombre": "Talismán Básico de Captura",
        "tipo": "CAPTURA",
        "cantidad": 3
      },
      {
        "codigo": "pocion-menor",
        "nombre": "Poción de Curación Menor",
        "tipo": "CURACION",
        "cantidad": 2
      }
    ]
  }
  ```

#### `POST /api/tienda/comprar`
- **Módulo:** `M-INV`.
- **Descripción:** Compra un artículo en la tienda de la localidad descontando monedas.
- **Cuerpo de petición:**
  ```json
  {
    "itemCodigo": "talisman-basico",
    "cantidad": 1
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "itemCodigo": "talisman-basico",
    "cantidadComprada": 1,
    "costoTotal": 50,
    "saldoRestante": 70
  }
  ```
- **Errores posibles:**
  - `400 MONEDAS_INSUFICIENTES`.
  - `403 SERVICIO_NO_DISPONIBLE` (la ubicación actual no posee tienda).

#### `POST /api/inventario/usar`
- **Módulo:** `M-INV`, `M-CUR`.
- **Descripción:** Aplica un consumible de curación sobre una criatura aliada.
- **Cuerpo de petición:**
  ```json
  {
    "itemCodigo": "pocion-menor",
    "criaturaId": "cri-301"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "criaturaId": "cri-301",
    "hpPrevio": 10,
    "hpNuevo": 30,
    "cantidadRestante": 1
  }
  ```

---

### 2.9 Curación (`M-CUR`)

#### `POST /api/curacion/restaurar`
- **Módulo:** `M-CUR`.
- **Descripción:** Restaura por completo los puntos de golpe de todas las criaturas del equipo en un centro de curación autorizado.
- **Cuerpo de petición:** Ninguno.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "mensaje": "Todas las criaturas de tu equipo han sido completamente restauradas.",
    "criaturasRestauradas": 3
  }
  ```
- **Errores posibles:**
  - `403 SERVICIO_NO_DISPONIBLE` (la ubicación actual no cuenta con centro de curación).

---

### 2.10 Progreso y requisitos (`M-PRO`)

#### `GET /api/progreso/desbloqueos`
- **Módulo:** `M-PRO`.
- **Descripción:** Consulta el estado de las zonas del mundo (desbloqueadas y pendientes).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "zonas": [
      { "zonaId": "ZON-01", "desbloqueada": true },
      { "zonaId": "ZON-02", "desbloqueada": true },
      { "zonaId": "ZON-03", "desbloqueada": true },
      { "zonaId": "ZON-04", "desbloqueada": true },
      { "zonaId": "ZON-05", "desbloqueada": false, "requisito": "Poseer al menos 3 criaturas en equipo de Nivel >= 5" },
      { "zonaId": "ZON-06", "desbloqueada": false, "requisito": "Haber superado la expedición de Cueva Umbría" }
    ]
  }
  ```

#### `POST /api/progreso/verificar-zona`
- **Módulo:** `M-PRO`.
- **Descripción:** Evalúa los requisitos de progreso del explorador para desbloquear el acceso formal a una zona bloqueada.
- **Cuerpo de petición:**
  ```json
  {
    "zonaId": "ZON-05"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "zonaId": "ZON-05",
    "desbloqueada": true,
    "mensaje": "¡Has demostrado suficiente maestría! El sello de Cueva Umbría se ha disipado."
  }
  ```
- **Errores posibles:**
  - `400 REQUISITOS_NO_CUMPLIDOS` ("Tu equipo no cuenta con 3 criaturas de nivel 5 o superior.").

---

### 2.11 Catálogo y especies (`M-CRI`)

#### `GET /api/especies`
- **Módulo:** `M-CRI`.
- **Descripción:** Lista las 25 especies del catálogo almacenadas en la base de datos (con soporte para filtro por tipo).
- **Parámetros de consulta opcionales:** `?tipo=beast`
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "total": 25,
    "especies": [
      {
        "slug": "lobo-gris",
        "nombre": "Lobo Gris",
        "tipo": "beast",
        "challengeRating": 0.25,
        "hpBase": 30,
        "ataqueBase": 42,
        "defensaBase": 58,
        "velocidadBase": 50,
        "tasaCaptura": 0.88,
        "esEspecial": false
      }
    ]
  }
  ```

#### `GET /api/especies/:slug`
- **Módulo:** `M-CRI`.
- **Descripción:** Ficha técnica detallada de una especie con sus movimientos disponibles.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "slug": "lobo-gris",
    "keyExterna": "srd-2024_wolf",
    "nombre": "Lobo Gris",
    "tipo": "beast",
    "challengeRating": 0.25,
    "hpBase": 30,
    "ataqueBase": 42,
    "defensaBase": 58,
    "velocidadBase": 50,
    "tasaCaptura": 0.88,
    "movimientos": [
      {
        "nombre": "Mordisco Feroz",
        "nombreOriginal": "Bite",
        "poder": 5.5
      }
    ]
  }
  ```

---

### 2.12 Historial de eventos (`M-HIS`)

#### `GET /api/historial`
- **Módulo:** `M-HIS`.
- **Descripción:** Consulta la lista cronológica de eventos relevantes del explorador.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "eventos": [
      {
        "eventoId": "his-501",
        "tipo": "VICTORIA_COMBATE",
        "descripcion": "Victoria contra Pico de Hacha (Nv. 2) en Praderas del Amanecer (+45 XP)",
        "marcaTiempo": "2026-10-07T12:45:00.000Z"
      },
      {
        "eventoId": "his-502",
        "tipo": "CAPTURA",
        "descripcion": "Captura exitosa de Lobo Gris con Talismán Básico",
        "marcaTiempo": "2026-10-07T12:42:00.000Z"
      }
    ]
  }
  ```
