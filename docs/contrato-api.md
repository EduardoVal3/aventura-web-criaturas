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
- **Descripción:** Consulta el estado del encuentro o combate actualmente en desarrollo, incluyendo movimientos de la aliada líder, turno real y bitácora reconstruida para reanudación fiel.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "turno": 2,
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
      "slug": "lobo-gris",
      "nombre": "Lobo Gris",
      "nombreEspecie": "Lobo Gris",
      "nivel": 2,
      "hpActual": 25,
      "hpMaximo": 30,
      "ataque": 42,
      "defensa": 58,
      "velocidad": 50,
      "experiencia": 45,
      "porcentajeXp": 30,
      "xpSiguienteNivel": 150,
      "xpNivelActual": 0,
      "movimientos": [
        {
          "nombre": "Mordisco Feroz",
          "poder": 14,
          "tipoAccion": "ATAQUE"
        }
      ]
    },
    "bitacora": [
      "Turno 1: ¡Un Pico de Hacha salvaje (Nv. 2) está frente a ti!",
      "¡Tu aliada es Lobo Gris (Nv. 2)!"
    ]
  }
  ```
- **Errores posibles:**
  - `404 ENCUENTRO_NO_ENCONTRADO` (sin encuentro activo).

---

### 2.6 Combate y captura (`M-COM`, `M-CAP`)

#### `POST /api/combate/atacar`
- **Módulo:** `M-COM`.
- **Descripción:** Ejecuta el movimiento seleccionado por el jugador y resuelve el contraataque rival. En caso de victoria, incluye el desglose de progreso de XP, subida de nivel y monedas.
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
    "resultadoFinal": null,
    "progreso": null
  }
  ```
- **Respuesta exitosa en Victoria (`200 OK`):**
  ```json
  {
    "encuentroId": "enc-401",
    "estado": "VICTORIA",
    "turno": 3,
    "accionJugador": {
      "movimiento": "Mordisco Feroz",
      "danoCausado": 12,
      "hpRestanteRival": 0
    },
    "accionRival": null,
    "resultadoFinal": "VICTORIA",
    "progreso": {
      "xpGanada": 45,
      "monedasGanadas": 60,
      "subioNivel": true,
      "nivelAnterior": 2,
      "nivelNuevo": 3,
      "porcentajeXp": 12,
      "xpSiguienteNivel": 661,
      "xpNivelActual": 374,
      "saldoMonedas": 260
    }
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
- **Respuesta exitosa - Huida lograda (`200 OK`):**
  ```json
  {
    "exito": true,
    "mensaje": "¡Lograste huir del combate con éxito!",
    "estado": "HUIDO"
  }
  ```
- **Respuesta exitosa - Huida fallida con contraataque rival (`200 OK`):**
  ```json
  {
    "exito": false,
    "mensaje": "¡No pudiste escapar! El rival aprovecha tu distracción.",
    "estado": "EN_CURSO",
    "contraataqueRival": {
      "movimiento": "Mordisco Feroz",
      "danoCausado": 6,
      "hpRestanteAliado": 14
    }
  }
  ```

---

### 2.7 Equipo y almacén (`M-EQU`)

#### `GET /api/equipo`
- **Módulo:** `M-EQU`.
- **Descripción:** Obtiene la lista de hasta 6 criaturas activas del equipo, capacidad máxima y condición de localidad segura.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "criaturas": [
      {
        "criaturaId": "cri-301",
        "slug": "lobo-gris",
        "nombre": "Lobo Gris",
        "apodo": "Colmillo",
        "nivel": 2,
        "hpActual": 25,
        "hpMaximo": 30,
        "ataque": 42,
        "defensa": 58,
        "velocidad": 50,
        "experiencia": 45,
        "porcentajeXp": 30,
        "xpSiguienteNivel": 150,
        "xpNivelActual": 0,
        "orden": 1
      }
    ],
    "limiteEquipo": 6,
    "enLocalidadSegura": true
  }
  ```

#### `GET /api/almacen`
- **Módulo:** `M-EQU`.
- **Descripción:** Lista las criaturas resguardadas en el almacén de reserva con estadísticas completas, capacidad máxima, localidad segura y conteo del equipo.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "criaturas": [
      {
        "criaturaId": "cri-303",
        "slug": "arana-lobo-gigante",
        "nombre": "Araña Lobo Gigante",
        "apodo": null,
        "nivel": 1,
        "hpActual": 11,
        "hpMaximo": 11,
        "ataque": 35,
        "defensa": 40,
        "velocidad": 48,
        "experiencia": 0,
        "porcentajeXp": 0,
        "xpSiguienteNivel": 150,
        "xpNivelActual": 0,
        "orden": null
      }
    ],
    "limiteEquipo": 6,
    "enLocalidadSegura": true,
    "totalEnEquipo": 2
  }
  ```

#### `PATCH /api/equipo/orden`
- **Módulo:** `M-EQU`.
- **Descripción:** Actualiza el orden táctico de las criaturas del equipo mediante una permutación íntegra y serializada por personaje (`FOR UPDATE`). El líder de combate es siempre la criatura en la posición 1. Puede invocarse en cualquier zona (incluyendo combate o zonas hostiles).
- **Cuerpo de petición (Variante lista ordenada de IDs):**
  ```json
  {
    "criaturaIds": ["cri-302", "cri-301"]
  }
  ```
- **Cuerpo de petición (Variante pares de posición):**
  ```json
  {
    "orden": [
      { "criaturaId": "cri-302", "orden": 1 },
      { "criaturaId": "cri-301", "orden": 2 }
    ]
  }
  ```
- **Respuesta exitosa (`200 OK`):** Retorna la estructura de `RespuestaEquipo` con el orden actualizado.
- **Errores posibles:**
  - `400 ORDEN_INVALIDO` (lista parcial, IDs repetidos, posiciones no consecutivas de 1 a n o criaturas no pertenecientes al equipo activo).
  - `400 DATOS_INVALIDOS` (cuerpo vacío o sin listas válidas).

#### `POST /api/equipo/transferir` (o `/api/equipo/mover`)
- **Módulo:** `M-EQU`.
- **Descripción:** Mueve una criatura entre el equipo activo y el almacén, o efectúa un intercambio atómico directo (`intercambiarConId`) cuando el equipo está completo (6/6). La criatura entrante hereda la posición táctica de la saliente. Requiere estar en una localidad segura.
- **Cuerpo de petición - Transferencia regular:**
  ```json
  {
    "criaturaId": "cri-303",
    "haciaEquipo": true
  }
  ```
- **Cuerpo de petición - Intercambio atómico (Equipo lleno):**
  ```json
  {
    "criaturaId": "cri-303",
    "haciaEquipo": true,
    "intercambiarConId": "cri-301"
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "mensaje": "Intercambio completado: Araña Lobo Gigante ocupa el puesto de Lobo Gris.",
    "totalEnEquipo": 6,
    "totalEnAlmacen": 4
  }
  ```
- **Errores posibles:**
  - `403 ACCION_NO_PERMITIDA` (la ubicación actual del explorador no es una localidad segura).
  - `404 CRIATURA_NO_ENCONTRADA` (criatura no encontrada o no pertenece al jugador).
  - `409 EQUIPO_COMPLETO` (se intentó mover al equipo sin intercambio teniendo 6 criaturas, regla `A-6`).
  - `400 EQUIPO_MINIMO_REQUERIDO` (no se puede enviar al almacén la última criatura del equipo).
  - `400 DATOS_INVALIDOS` (se especificó el mismo ID para entrar y salir).

---

### 2.8 Inventario y comercio (`M-INV`)

#### `GET /api/inventario`
- **Módulo:** `M-INV`.
- **Descripción:** Obtiene los objetos, existencias, desglose de ranuras y capacidad máxima del inventario del personaje activo.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "monedas": 120,
    "capacidadMaxima": 20,
    "ranurasOcupadas": 2,
    "totalUnidades": 5,
    "items": [
      {
        "codigo": "talisman-basico",
        "nombre": "Talismán Básico de Captura",
        "descripcion": "Talismán estándar para sintonizar y capturar criaturas salvajes.",
        "tipo": "CAPTURA",
        "efectoValor": 1,
        "precioCompra": 50,
        "cantidad": 3
      },
      {
        "codigo": "pocion-menor",
        "nombre": "Poción de Curación Menor",
        "descripcion": "Brebaje medicinal que restaura 20 puntos de salud.",
        "tipo": "CURACION",
        "efectoValor": 20,
        "precioCompra": 30,
        "cantidad": 2
      }
    ]
  }
  ```

#### `GET /api/tienda`
- **Módulo:** `M-INV`.
- **Descripción:** Consulta el catálogo oficial del bazar en la localidad activa, informando la disponibilidad del servicio mercantil (`servicioDisponible`), el saldo actual en monedas y las existencias que el jugador ya posee de cada artículo (`cantidadEnInventario`).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "saldoMonedas": 120,
    "servicioDisponible": true,
    "ubicacionActual": {
      "id": "LOC-02",
      "nombre": "Puesto Fronterizo del Río",
      "esSegura": true
    },
    "items": [
      {
        "codigo": "pocion-menor",
        "nombre": "Poción de Curación Menor",
        "descripcion": "Brebaje medicinal que restaura 20 puntos de salud.",
        "tipo": "CURACION",
        "precioCompra": 30,
        "efectoValor": 20,
        "cantidadEnInventario": 2
      },
      {
        "codigo": "talisman-basico",
        "nombre": "Talismán Básico de Captura",
        "descripcion": "Talismán estándar para sintonizar y capturar criaturas salvajes.",
        "tipo": "CAPTURA",
        "precioCompra": 50,
        "efectoValor": 1,
        "cantidadEnInventario": 3
      },
      {
        "codigo": "pocion-mayor",
        "nombre": "Poción de Curación Mayor",
        "descripcion": "Elixir reconstituyente que restaura 50 puntos de salud.",
        "tipo": "CURACION",
        "precioCompra": 80,
        "efectoValor": 50,
        "cantidadEnInventario": 0
      },
      {
        "codigo": "talisman-avanzado",
        "nombre": "Talismán Avanzado de Captura",
        "descripcion": "Talismán reforzado con mayor resonancia para criaturas de alto desafío.",
        "tipo": "CAPTURA",
        "precioCompra": 150,
        "efectoValor": 2,
        "cantidadEnInventario": 0
      }
    ]
  }
  ```

#### `POST /api/tienda/comprar`
- **Módulo:** `M-INV`.
- **Descripción:** Ejecuta una compra atómica en el bazar mercantil. El servidor valida unilateralmente el precio oficial (`S-6`), acota la cantidad a `[1, 99]` (`ComprarDto`), serializa la operación mediante bloqueo de fila de personaje (`S-4`), descuenta las monedas y acredita los objetos en inventario mediante upsert aditivo.
- **Cuerpo de petición:**
  ```json
  {
    "itemCodigo": "pocion-menor",
    "cantidad": 5
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "itemCodigo": "pocion-menor",
    "nombre": "Poción de Curación Menor",
    "cantidadComprada": 5,
    "precioUnitario": 30,
    "costoTotal": 150,
    "saldoRestante": 50,
    "cantidadEnInventario": 7
  }
  ```
- **Errores posibles:**
  - `400 MONEDAS_INSUFICIENTES` (saldo menor a `costoTotal`).
  - `400 Bad Request` (si se inyectan campos adicionales como `costoTotal` vía `forbidNonWhitelisted` o cantidad fuera de rango `1..99`).
  - `403 SERVICIO_NO_DISPONIBLE` (la ubicación actual no cuenta con el servicio `TIENDA`).
  - `404 OBJETO_NO_ENCONTRADO` (el código no existe o no tiene precio de compra positivo en catálogo).

#### `POST /api/inventario/usar`
- **Módulo:** `M-INV`, `M-CUR`.
- **Descripción:** Aplica un consumible de curación sobre una criatura aliada fuera de combate. Serializa concurrentemente la fila del personaje (`FOR UPDATE`), valida que el objeto sea de tipo `CURACION`, rechaza si la criatura ya tiene salud completa (`INV-03`), descuenta la unidad de inventario y registra el evento en el historial.
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
    "criaturaNombre": "Ignis",
    "hpPrevio": 10,
    "hpNuevo": 30,
    "hpMaximo": 30,
    "curacionAplicada": 20,
    "cantidadRestante": 1
  }
  ```
- **Errores posibles:**
  - `400 OBJETO_NO_CONSUMIBLE` (el objeto no es de tipo `CURACION`, p. ej. talismán de captura).
  - `400 SALUD_COMPLETA` (la criatura seleccionada ya cuenta con sus puntos de vida al máximo).
  - `400 ITEM_NO_DISPONIBLE` (el jugador no posee el objeto en su bolsa o su cantidad es 0).
  - `404 CRIATURA_NO_ENCONTRADA` (la criatura no pertenece al personaje o no existe).

---

### 2.9 Curación (`M-CUR`)

#### `POST /api/curacion/restaurar`
- **Módulo:** `M-CUR`.
- **Descripción:** Restaura por completo los puntos de golpe de todas las criaturas del equipo en un centro o santuario de curación autorizado (`esSegura: true` y servicio `CURACION` o `CENTRO_CURACION`). Serializa la transacción mediante bloqueo pesimista `FOR UPDATE` por fila de personaje, revive a criaturas caídas (`hpActual = 0 -> hpMaximo`) bajo el invariante `INV-03`, actualiza en base de datos exclusivamente las criaturas con déficit de salud y registra un evento en el historial con el consolidado del ritual.
- **Cuerpo de petición:** Ninguno.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "mensaje": "Todas las criaturas de tu equipo han sido completamente restauradas.",
    "criaturasRestauradas": 3,
    "criaturasCuradas": 2,
    "criaturasRevividas": 1,
    "hpTotalRestaurado": 53,
    "ubicacionNombre": "Villa Serena",
    "detalles": [
      {
        "criaturaId": "cri-301",
        "nombre": "Lobo Alfa",
        "hpPrevio": 30,
        "hpNuevo": 30,
        "hpMaximo": 30,
        "hpRestaurado": 0,
        "fueRevivida": false
      },
      {
        "criaturaId": "cri-302",
        "nombre": "Águila Veloz",
        "hpPrevio": 12,
        "hpNuevo": 30,
        "hpMaximo": 30,
        "hpRestaurado": 18,
        "fueRevivida": false
      },
      {
        "criaturaId": "cri-303",
        "nombre": "Oso Pardo",
        "hpPrevio": 0,
        "hpNuevo": 35,
        "hpMaximo": 35,
        "hpRestaurado": 35,
        "fueRevivida": true
      }
    ]
  }
  ```
- **Errores posibles:**
  - `403 SERVICIO_NO_DISPONIBLE` (la ubicación actual no es una localidad segura o no cuenta con servicio de curación autorizado).
  - `404 PERSONAJE_NO_ENCONTRADO` (no se encontró el personaje activo del explorador).

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
- **Descripción:** Lista las 25 especies del compendio biológico en una sola llamada `O(1)` erradicando el cuello de botella $N+1$, enriquecidas con arquetipo táctico (`TANQUE`, `ATACANTE`, `VELOZ`, `EQUILIBRADO`), lore descriptivo y sus movimientos conocidos.
- **Parámetros de consulta opcionales:** `?tipo=beast` (soporta los 6 tipos biológicos: `beast`, `monstrosity`, `undead`, `elemental`, `construct`, `plant`).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "total": 25,
    "especies": [
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
        "esEspecial": false,
        "descripcion": "Cazador en manada ágil y coordinado que habita en llanuras y bosques.",
        "arquetipo": "EQUILIBRADO",
        "movimientos": [
          {
            "nombre": "Mordisco Feroz",
            "nombreOriginal": "Bite",
            "tipoAccion": "Ataque melé",
            "poder": 5.5
          }
        ]
      }
    ]
  }
  ```

#### `GET /api/especies/:slug`
- **Módulo:** `M-CRI`.
- **Descripción:** Ficha técnica táctica y detallada de una especie específica identificada por su slug.
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
    "esEspecial": false,
    "descripcion": "Cazador en manada ágil y coordinado que habita en llanuras y bosques.",
    "arquetipo": "EQUILIBRADO",
    "movimientos": [
      {
        "nombre": "Mordisco Feroz",
        "nombreOriginal": "Bite",
        "tipoAccion": "Ataque melé",
        "poder": 5.5
      }
    ]
  }
  ```
- **Errores posibles:**
  - `404 ESPECIE_NO_ENCONTRADA` ("No se encontró la especie solicitada en el compendio.").

---

### 2.12 Historial de eventos (`M-HIS`)

#### `GET /api/historial`
- **Módulo:** `M-HIS`.
- **Descripción:** Consulta la bitácora transversal cronológica de crónicas del explorador autenticado, normalizada a 5 categorías canónicas (`COMBATE`, `CAPTURA`, `EXPLORACION`, `TIENDA`, `CURACION`), con soporte de paginación y filtrado por categoría en servidor.
- **Parámetros de consulta opcionales:**
  - `pagina`: Número de página (por defecto `1`).
  - `limite`: Elementos por página (por defecto `20`, máximo `100`).
  - `categoria`: Filtro por categoría canónica (`COMBATE`, `CAPTURA`, `EXPLORACION`, `TIENDA`, `CURACION`).
  - `tipo`: Alias o filtro directo por tipo de evento registrado.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "total": 45,
    "pagina": 1,
    "limite": 20,
    "eventos": [
      {
        "eventoId": "his-501",
        "tipo": "VICTORIA_COMBATE",
        "categoria": "COMBATE",
        "descripcion": "Victoria contra Pico de Hacha (Nv. 2) en Praderas del Amanecer (+45 XP)",
        "marcaTiempo": "2026-10-07T12:45:00.000Z",
        "datosJson": { "monedas": 25, "xp": 45 }
      },
      {
        "eventoId": "his-502",
        "tipo": "CAPTURA",
        "categoria": "CAPTURA",
        "descripcion": "Captura exitosa de Lobo Gris con Talismán Básico",
        "marcaTiempo": "2026-10-07T12:42:00.000Z",
        "datosJson": { "criaturaId": "cri-101" }
      }
    ]
  }
  ```
- **Errores posibles:**
  - `404 PERSONAJE_NO_ENCONTRADO` ("No se encontró un personaje activo para el usuario autenticado.").
