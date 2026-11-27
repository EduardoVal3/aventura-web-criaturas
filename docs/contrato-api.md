# Contrato REST de la API: Aethelgard

Este documento define la especificación técnica de la API REST que comunica el Front-End (`apps/web/src/api/apiHttp.ts`) y el Back-End en NestJS 10 (`apps/api`, **44 rutas REST / 46 operaciones HTTP** exportadas en [`docs/swagger-openapi.json`](swagger-openapi.json)). Cuando el cliente opera detrás del API Gateway opcional **Kong 3.9.5 DB-less** (`:8000`), `apiHttp.ts` adjunta adicionalmente la cabecera `apikey` configurada mediante `VITE_CLAVE_GATEWAY`.

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
   - `401 Unauthorized`: Falta de token de autenticación o sesión inválida (`NO_AUTORIZADO`, `CREDENCIALES_INVALIDAS` o `USUARIO_NO_ENCONTRADO` si el usuario no existe en la base de datos).
   - `403 Forbidden`: Acción no autorizada por reglas de seguridad o estado de juego (ej. moverse a zona bloqueada o actuar fuera de turno).
   - `404 Not Found`: Recurso solicitado no encontrado.
   - `409 Conflict`: Conflicto de estado (ej. nombre de usuario duplicado, turno desactualizado `TURNO_DESACTUALIZADO` o equipo completo sin intercambio).
   - `429 Too Many Requests`: Cuota de solicitudes por minuto excedida en `/api/exploracion*` cuando se opera detrás de Kong Gateway (`apiHttp.ts` lo normaliza a `LIMITE_SOLICITUDES`).
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
    "estado": "disponible",
    "marcaTiempo": "2026-10-07T12:00:00.000Z",
    "version": "0.1.0"
  }
  ```
- **Errores posibles:** `500 ERROR_INTERNO_SERVIDOR`.

---

### 2.2 Autenticación y usuarios (`M-USR`)

#### `POST /api/usuarios/registro` (alias `/api/autenticacion/registro`)
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
    "tokenAcceso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Errores posibles:**
  - `400 DATOS_INVALIDOS` (correo o clave no cumplen formato).
  - `409 USUARIO_DUPLICADO` (nombre de usuario o correo ya registrado).

#### `POST /api/usuarios/login` (aliases `/api/usuarios/ingreso`, `/api/autenticacion/ingreso`, `/api/autenticacion/login`)
- **Módulo:** `M-USR`.
- **Descripción:** Inicia sesión y genera token de autenticación JWT (vigencia 24 h).
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
    "tokenAcceso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tienePersonaje": true
  }
  ```
- **Errores posibles:**
  - `401 CREDENCIALES_INVALIDAS` (usuario o clave incorrectos).

#### `GET /api/autenticacion/perfil` (alias `GET /api/usuarios/perfil`)
- **Módulo:** `M-USR`.
- **Descripción:** Retorna los datos del usuario autenticado extraídos del JWT verificado junto con el estado de personaje activo (`tienePersonaje` y resumen `personaje` o `null`) y si mantiene un combate `EN_CURSO` vigente (`tieneEncuentroActivo`, con autorreparación automática a `DERROTA` ante encuentros huérfanos con todo el equipo en `0 HP`), permitiendo al Front-End hidratar sesión y cerrojo de combate al recargar sin provocar `404` en `/api/personajes/activo`. Requiere cabecera `Authorization: Bearer <token>`.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "sub": "usr-101",
    "usuarioId": "usr-101",
    "nombreUsuario": "arturo_sendas",
    "correo": "arturo@ejemplo.com",
    "tienePersonaje": true,
    "tieneEncuentroActivo": false,
    "personaje": {
      "personajeId": "pj-201",
      "nombre": "Arturo",
      "monedas": 120,
      "ubicacionActualId": "LOC-01",
      "totalCriaturasEquipo": 3,
      "totalCriaturasAlmacen": 1
    }
  }
  ```
- **Nota sobre cierre de sesión:** La autenticación es *stateless* con JWT; el cierre de sesión se efectúa localmente en el cliente (`apiHttp.cerrarSesion()` y `ContextoAutenticacion.tsx`) eliminando `aethelgard_token_acceso` de `localStorage` y limpiando el estado reactivo sin emitir peticiones a un `/logout` inexistente.
- **Salvaguarda de Autenticación Global (`AutenticacionGuard`):** Todas las rutas protegidas validan tanto la firma criptográfica del JWT como la existencia efectiva del usuario en PostgreSQL (`Usuario.id`). Si el registro fue eliminado o la base de datos fue reseteada, el guard arroja `401 Unauthorized` con código `USUARIO_NO_ENCONTRADO`; `apiHttp.ts` emite `aethelgard:no-autorizado` únicamente ante respuestas `401` de rutas protegidas con token activo (nunca ante credenciales erróneas en `/login` o `/registro`), purgando `aethelgard_token_acceso` sin llamadas redundantes.

---


### 2.3 Personaje y progreso inicial (`M-PJ`)

#### `POST /api/personajes` (alias `POST /api/personaje`)
- **Módulo:** `M-PJ`, `M-CRI`.
- **Descripción:** Crea el personaje explorador asignando ubicación inicial (`LOC-01`), inventario de bienvenida (`3` talismanes básicos, `2` pociones menores), `100` monedas, desbloqueo inicial (`LOC-01`, `ZON-01`, `ZON-02`) y la especie inicial elegida (`lobo-estepario`, `vibora-rocosa` o `cangrejo-abismal`).
- **Cuerpo de petición:**
  ```json
  {
    "nombre": "Arturo",
    "especieInicialSlug": "lobo-estepario"
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
      "especieSlug": "lobo-estepario",
      "nombre": "Lobo Estepario",
      "nivel": 1,
      "hpActual": 34,
      "hpMaximo": 34,
      "puntosExperiencia": 0
    }
  }
  ```
- **Errores posibles:**
  - `400 ESPECIE_INICIAL_INVALIDA`.
  - `409 PERSONAJE_YA_EXISTE` (usuario ya tiene personaje activo).

#### `GET /api/personajes/activo` (aliases `GET /api/personajes`, `GET /api/personaje`, `GET /api/personaje/activo`)
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
- **Descripción:** Retorna los detalles de la ubicación actual del personaje, su slug para recursos multimedia, nivel de fauna salvaje (`faunaNivelMinimo` y `faunaNivelMaximo`), especies autóctonas del hábitat, poder y rango del equipo del explorador, red territorial de 9 nodos para minimapa, servicios y conexiones con checklist estructurado.
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
    "faunaNivelMinimo": null,
    "faunaNivelMaximo": null,
    "servicios": ["CURACION", "ALMACEN", "HISTORIAL"],
    "progresoZona": 100,
    "tieneEncuentroActivo": false,
    "equipoDebilitado": false,
    "especiesHabitantes": [],
    "poderEquipo": {
      "nivelMaximoEquipo": 5,
      "nivelPromedioEquipo": 4,
      "nivelMaximoColeccion": 5,
      "criaturasEquipoNv5": 2,
      "rangoDomador": "Domador de Riscos"
    },
    "nodosMapa": [
      {
        "id": "LOC-01",
        "nombre": "Villa Serena",
        "tipo": "LOCALIDAD",
        "esSegura": true,
        "faunaNivelMinimo": null,
        "faunaNivelMaximo": null,
        "desbloqueada": true,
        "progreso": 100,
        "esActual": true,
        "esAdyacente": false,
        "conexionesIds": ["ZON-01", "ZON-02"]
      },
      {
        "id": "ZON-01",
        "nombre": "Praderas del Amanecer",
        "tipo": "ZONA",
        "esSegura": false,
        "faunaNivelMinimo": 1,
        "faunaNivelMaximo": 3,
        "desbloqueada": true,
        "progreso": 100,
        "esActual": false,
        "esAdyacente": true,
        "conexionesIds": ["LOC-01", "LOC-02"]
      }
    ],
    "conexiones": [
      {
        "ubicacionDestinoId": "ZON-01",
        "nombre": "Praderas del Amanecer",
        "tipoDestino": "ZONA",
        "esSegura": false,
        "faunaNivelMinimo": 1,
        "faunaNivelMaximo": 3,
        "nivelSugerido": "1-3",
        "estaBloqueada": false,
        "desbloqueada": true,
        "puedeDesbloquear": false,
        "cumpleRequisito": true,
        "requisito": null,
        "detalleProgreso": null,
        "progresoActual": 100,
        "progresoObjetivo": 100,
        "especiesHabitantes": [
          {
            "slug": "lobo-estepario",
            "nombre": "Lobo Estepario",
            "tipo": "beast",
            "elemento": "fisico",
            "esEspecial": false,
            "esLegendaria": false,
            "pesoAparicion": 35
          }
        ],
        "requisitoCartografia": null,
        "requisitoNivelEquipo": null
      },
      {
        "ubicacionDestinoId": "LOC-02",
        "nombre": "Puesto Fronterizo del Río",
        "tipoDestino": "LOCALIDAD",
        "esSegura": true,
        "faunaNivelMinimo": null,
        "faunaNivelMaximo": null,
        "nivelSugerido": "Rango libre",
        "estaBloqueada": true,
        "desbloqueada": false,
        "puedeDesbloquear": true,
        "cumpleRequisito": true,
        "requisito": "Requiere explorar Praderas del Amanecer al 100%",
        "detalleProgreso": "Requiere cartografiar ZON-01 al 100%",
        "progresoActual": 100,
        "progresoObjetivo": 100,
        "especiesHabitantes": [],
        "requisitoCartografia": {
          "zonaId": "ZON-01",
          "nombre": "Praderas del Amanecer",
          "completada": true,
          "progresoActual": 100
        },
        "requisitoNivelEquipo": null
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
  - `409 ENCUENTRO_PREVIO_ACTIVO` (existe un combate `EN_CURSO` pendiente de resolución).

---

### 2.5 Exploración (`M-EXP`, `M-ENC`)

#### `POST /api/exploracion/explorar` (alias `POST /api/exploracion`)
- **Módulo:** `M-EXP`.
- **Descripción:** Ejecuta una tirada probabilística de exploración en la ruta silvestre activa. Si el evento es `OBJETO` o `SIN_EVENTO`, computa y persiste el avance cartográfico (+20% hasta 100%). Si resulta en `ENCUENTRO`, el progreso de la zona se mantiene en su valor actual sin incremento prematuro, acreditándose el +20% al resolver el combate en el servidor (`VICTORIA` o `CAPTURADO`). Cuando se accede vía Kong Gateway (`:8000`), esta ruta aplica `rate-limiting` (5 req/min por consumidor).
- **Cuerpo de petición:** Ninguno.
- **Respuesta exitosa (`200 OK`) - Caso Encuentro:**
  ```json
  {
    "tipoEvento": "ENCUENTRO",
    "mensaje": "¡Una criatura salvaje te desafía en el camino: Víbora Rocosa (Nivel 2)!",
    "progresoZona": 0,
    "encuentro": {
      "encuentroId": "enc-401",
      "estado": "EN_CURSO",
      "especie": {
        "slug": "vibora-rocosa",
        "nombre": "Víbora Rocosa",
        "esLegendaria": false,
        "nivel": 2,
        "hpActual": 33,
        "hpMaximo": 33,
        "ataque": 46,
        "defensa": 33,
        "velocidad": 54
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
  - `400 EQUIPO_DEBILITADO` (todas las criaturas del equipo activo se encuentran en `0 HP`; debe usarse una poción o curarse en un santuario antes de explorar).
  - `403 ZONA_NO_EXPLORABLE` (se intentó explorar dentro de una localidad segura).
  - `409 ENCUENTRO_PREVIO_ACTIVO` (ya existe un combate en curso pendiente de resolver).

#### `GET /api/encuentros/activo`
- **Módulo:** `M-ENC`.
- **Descripción:** Consulta el estado del encuentro o combate actualmente en desarrollo, incluyendo afinidades elementales, barras de Resonancia, estados alterados, movimientos tácticos (slots 1..4) de la aliada líder, turno real y bitácora reconstruida para reanudación fiel (ver contrato táctico completo en §2.13).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "turno": 2,
    "esTurnoJugador": true,
    "criaturaRival": {
      "slug": "vibora-rocosa",
      "nombre": "Víbora Rocosa",
      "nivel": 2,
      "hpActual": 21,
      "hpMaximo": 33,
      "ataque": 46,
      "defensa": 33,
      "velocidad": 54,
      "afinidad": "natura",
      "resonancia": 16,
      "esLegendaria": false,
      "estados": []
    },
    "criaturaAliada": {
      "criaturaId": "cri-301",
      "slug": "lobo-estepario",
      "nombre": "Lobo Estepario",
      "nombreEspecie": "Lobo Estepario",
      "nivel": 2,
      "hpActual": 29,
      "hpMaximo": 37,
      "ataque": 42,
      "defensa": 35,
      "velocidad": 47,
      "afinidad": "fisico",
      "resonancia": 24,
      "estados": [],
      "experiencia": 180,
      "porcentajeXp": 13,
      "xpSiguienteNivel": 374,
      "xpNivelActual": 150,
      "movimientos": [
        { "slot": 1, "nombre": "Mordisco", "poder": 12, "tipoAccion": "Ataque melé", "efecto": null, "estadoAplicado": null, "bloqueado": false },
        { "slot": 2, "nombre": "Acometida Ágil", "poder": 14, "tipoAccion": "Ataque melé", "efecto": "VEL_UP", "estadoAplicado": null, "bloqueado": false },
        { "slot": 3, "nombre": "Aullido Estepario", "poder": 10, "tipoAccion": "Estado", "efecto": "DEF_DOWN", "estadoAplicado": null, "bloqueado": false },
        { "slot": 4, "nombre": "Furia de Manada", "poder": 24, "tipoAccion": "Ataque melé", "efecto": "CRITICO", "estadoAplicado": null, "bloqueado": true }
      ]
    },
    "bitacora": [
      "Turno 1: ¡Un Víbora Rocosa salvaje (Nv. 2) está frente a ti!",
      "¡Tu aliada es Lobo Estepario (Nv. 2)!"
    ]
  }
  ```
- **Errores posibles:**
  - `404 ENCUENTRO_NO_ENCONTRADO` (sin encuentro activo).

---

### 2.6 Combate y captura (`M-COM`, `M-CAP`)

#### `POST /api/combate/atacar` (alias `POST /api/combates/atacar`)
- **Módulo:** `M-COM`.
- **Descripción:** Ejecuta el movimiento seleccionado por el jugador (`movimientoIndice: 0..3`, donde el slot 4 o índice `3` requiere `resonancia === 100`) y resuelve el contraataque rival (sorteado exclusivamente entre sus slots 1 a 3) dentro de una transacción serializada con `SELECT ... FOR UPDATE`. En caso de victoria, incluye el desglose de progreso de XP, subida de nivel y monedas (ver detalle táctico completo en §2.13).
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401",
    "movimientoIndice": 0,
    "turnoEsperado": 2
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "turno": 2,
    "accionJugador": {
      "movimiento": "Mordisco",
      "danoCausado": 12,
      "hpRestanteRival": 9
    },
    "accionRival": {
      "movimiento": "Picotazo",
      "danoCausado": 8,
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
      "movimiento": "Mordisco",
      "danoCausado": 12,
      "hpRestanteRival": 0
    },
    "accionRival": null,
    "resultadoFinal": "VICTORIA",
    "progreso": {
      "xpGanada": 45,
      "monedasGanadas": 30,
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
  - `400 MOVIMIENTO_BLOQUEADO` ("El movimiento seleccionado requiere 100% de Resonancia en combate para ejecutarse.") si se envía `movimientoIndice: 3` con resonancia `< 100`.
  - `400 Bad Request` ("movimientoIndice must not be greater than 3") ante índices inválidos.
  - `400 ACCION_FUERA_DE_TURNO` / `400 ENCUENTRO_NO_ACTIVO` (regla `S-5`).
  - `409 TURNO_DESACTUALIZADO` (avance concurrente detectado vía `turnoEsperado` y `FOR UPDATE`).
  - `404 ENCUENTRO_NO_ENCONTRADO`.

#### `POST /api/combate/capturar` (aliases `POST /api/combates/capturar`, `POST /api/encuentros/:id/capturar`)
- **Módulo:** `M-CAP`, `M-INV`.
- **Descripción:** Intenta capturar la criatura enemiga usando un talismán del inventario (`talisman-basico` o `talisman-avanzado`) en una transacción atómica serializada con `FOR UPDATE` (reglas `S-3`, `S-4`, `S-5` e `INV-02`).
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401",
    "itemCodigo": "talisman-basico",
    "turnoEsperado": 2
  }
  ```
- **Respuesta exitosa (`200 OK`) - Captura exitosa:**
  ```json
  {
    "exito": true,
    "mensaje": "¡Captura exitosa! Víbora Rocosa ha sido incorporado a tu equipo.",
    "encuentroId": "enc-401",
    "estado": "CAPTURADO",
    "destinoCaptura": "EQUIPO",
    "criaturaCapturada": {
      "criaturaId": "cri-302",
      "nombre": "Víbora Rocosa",
      "nivel": 2,
      "hpActual": 9,
      "hpMaximo": 33
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
      "movimiento": "Mordedura Tóxica",
      "danoCausado": 7,
      "hpRestanteAliado": 17
    }
  }
  ```
- **Errores posibles:**
  - `400 ITEM_NO_DISPONIBLE` (el jugador no posee el talismán en su inventario, regla `S-4`).
  - `409 TURNO_DESACTUALIZADO` (avance concurrente de turno, regla `S-5`).
  - `404 ENCUENTRO_NO_ENCONTRADO` (sin encuentro activo, regla `S-3`).

#### `POST /api/combate/huir` (alias `POST /api/combates/huir`)
- **Módulo:** `M-COM`.
- **Descripción:** Intenta retirarse del combate.
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401",
    "turnoEsperado": 2
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
      "movimiento": "Picotazo",
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
        "slug": "lobo-estepario",
        "nombre": "Lobo Estepario",
        "apodo": "Colmillo",
        "nivel": 2,
        "hpActual": 29,
        "hpMaximo": 37,
        "ataque": 42,
        "defensa": 35,
        "velocidad": 47,
        "experiencia": 180,
        "porcentajeXp": 13,
        "xpSiguienteNivel": 374,
        "xpNivelActual": 150,
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
        "slug": "arana-gigante",
        "nombre": "Araña Gigante",
        "apodo": null,
        "nivel": 3,
        "hpActual": 46,
        "hpMaximo": 46,
        "ataque": 53,
        "defensa": 42,
        "velocidad": 53,
        "experiencia": 374,
        "porcentajeXp": 0,
        "xpSiguienteNivel": 661,
        "xpNivelActual": 374,
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
    "mensaje": "Intercambio completado: Araña Gigante ocupa el puesto de Lobo Estepario.",
    "totalEnEquipo": 6,
    "totalEnAlmacen": 4
  }
  ```
- **Errores posibles:**
  - `409 ENCUENTRO_PREVIO_ACTIVO` (no se permiten transferencias con el almacén durante un combate activo).
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
  - `409 ENCUENTRO_PREVIO_ACTIVO` (no se permiten compras en tienda mientras existe un combate activo).
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
        "nombre": "Lobo Estepario",
        "hpPrevio": 34,
        "hpNuevo": 34,
        "hpMaximo": 34,
        "hpRestaurado": 0,
        "fueRevivida": false
      },
      {
        "criaturaId": "cri-302",
        "nombre": "Halcón Ceniza",
        "hpPrevio": 36,
        "hpNuevo": 54,
        "hpMaximo": 54,
        "hpRestaurado": 18,
        "fueRevivida": false
      },
      {
        "criaturaId": "cri-303",
        "nombre": "Oso Fresno",
        "hpPrevio": 0,
        "hpNuevo": 90,
        "hpMaximo": 90,
        "hpRestaurado": 90,
        "fueRevivida": true
      }
    ]
  }
  ```
- **Errores posibles:**
  - `409 ENCUENTRO_PREVIO_ACTIVO` (no se permite activar el santuario mientras existe un combate activo).
  - `403 SERVICIO_NO_DISPONIBLE` (la ubicación actual no es una localidad segura o no cuenta con servicio de curación autorizado).
  - `404 PERSONAJE_NO_ENCONTRADO` (no se encontró el personaje activo del explorador).

---

### 2.10 Progreso y requisitos (`M-PRO`)

#### `GET /api/progreso/desbloqueos`
- **Módulo:** `M-PRO`.
- **Descripción:** Consulta el estado de las 9 ubicaciones del mundo (3 localidades seguras y 6 zonas silvestres), sus requisitos territoriales y avance cartográfico.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "zonas": [
      { "zonaId": "LOC-01", "nombre": "Villa Serena", "desbloqueada": true, "progresoActual": 100, "progresoObjetivo": 100, "cumpleRequisito": true, "requisito": null },
      { "zonaId": "ZON-01", "nombre": "Praderas del Amanecer", "desbloqueada": true, "progresoActual": 60, "progresoObjetivo": 100, "cumpleRequisito": true, "requisito": null },
      { "zonaId": "ZON-02", "nombre": "Riberas del Lago Espejo", "desbloqueada": true, "progresoActual": 20, "progresoObjetivo": 100, "cumpleRequisito": true, "requisito": null },
      { "zonaId": "LOC-02", "nombre": "Puesto Fronterizo del Río", "desbloqueada": false, "progresoActual": 60, "progresoObjetivo": 100, "cumpleRequisito": false, "requisito": "Cartografiar Praderas del Amanecer al 100%" },
      { "zonaId": "ZON-03", "nombre": "Bosque Susurrante", "desbloqueada": false, "progresoActual": 20, "progresoObjetivo": 100, "cumpleRequisito": false, "requisito": "Cartografiar Riberas del Lago Espejo al 100%" },
      { "zonaId": "ZON-04", "nombre": "Paso de los Riscos", "desbloqueada": false, "progresoActual": 0, "progresoObjetivo": 100, "cumpleRequisito": false, "requisito": "Cartografiar Bosque Susurrante al 100% y poseer 1 criatura Nv. 5+" },
      { "zonaId": "LOC-03", "nombre": "Bastión del Norte", "desbloqueada": false, "progresoActual": 0, "progresoObjetivo": 100, "cumpleRequisito": false, "requisito": "Cartografiar Paso de los Riscos al 100%" },
      { "zonaId": "ZON-05", "nombre": "Cueva Umbría", "desbloqueada": false, "progresoActual": 0, "progresoObjetivo": 100, "cumpleRequisito": false, "requisito": "Cartografiar Paso de los Riscos al 100% y 3 criaturas en equipo Nv. 5+" },
      { "zonaId": "ZON-06", "nombre": "Pico de la Cumbre", "desbloqueada": false, "progresoActual": 0, "progresoObjetivo": 100, "cumpleRequisito": false, "requisito": "Cartografiar Cueva Umbría al 100% y poseer 1 criatura Nv. 10+" }
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
- **Descripción:** Lista las 30 especies del compendio biológico en una sola llamada `O(1)` erradicando el cuello de botella $N+1$, enriquecidas con afinidad elemental (`fisico`, `fuego`, `agua`, `natura`, `sombra`, `luz`), indicador de criatura legendaria (`esLegendaria`), arquetipo táctico (`TANQUE`, `ATACANTE`, `VELOZ`, `EQUILIBRADO`), lore descriptivo y sus 4 movimientos tácticos ordenados por slot (`1..4`).
- **Parámetros de consulta opcionales:** `?tipo=beast` (soporta los 6 tipos biológicos: `beast`, `monstrosity`, `undead`, `elemental`, `construct`, `plant`).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "total": 30,
    "especies": [
      {
        "slug": "lobo-estepario",
        "keyExterna": "srd-2024_wolf",
        "nombre": "Lobo Estepario",
        "tipo": "beast",
        "elemento": "fisico",
        "challengeRating": 0.25,
        "hpBase": 34,
        "ataqueBase": 39,
        "defensaBase": 32,
        "velocidadBase": 45,
        "tasaCaptura": 0.85,
        "esEspecial": false,
        "esLegendaria": false,
        "zona": {
          "id": "ZON-01",
          "nombre": "Praderas del Amanecer"
        },
        "descripcion": "Cazador en manada ágil y coordinado que recorre las praderas abiertas.",
        "arquetipo": "VELOZ",
        "movimientos": [
          {
            "slot": 1,
            "nombre": "Mordisco",
            "nombreOriginal": "Bite",
            "tipoAccion": "Ataque melé",
            "poder": 12,
            "efecto": null
          },
          {
            "slot": 2,
            "nombre": "Acometida Ágil",
            "nombreOriginal": null,
            "tipoAccion": "Ataque veloz",
            "poder": 14,
            "efecto": "VEL_UP"
          },
          {
            "slot": 3,
            "nombre": "Aullido Estepario",
            "nombreOriginal": null,
            "tipoAccion": "Técnica de apoyo",
            "poder": 10,
            "efecto": "DEF_DOWN"
          },
          {
            "slot": 4,
            "nombre": "Furia de Manada",
            "nombreOriginal": null,
            "tipoAccion": "Furia táctica",
            "poder": 24,
            "efecto": "CRITICO"
          }
        ]
      }
    ]
  }
  ```

#### `GET /api/especies/:slug`
- **Módulo:** `M-CRI`.
- **Descripción:** Ficha técnica táctica y detallada de una especie específica identificada por su slug (ej. `behir-abismo`, `remorhaz-glaciar`).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "slug": "behir-abismo",
    "keyExterna": "srd-2024_behir",
    "nombre": "Behir del Abismo",
    "tipo": "monstrosity",
    "elemento": "sombra",
    "challengeRating": 11,
    "hpBase": 94,
    "ataqueBase": 96,
    "defensaBase": 89,
    "velocidadBase": 81,
    "tasaCaptura": 0.15,
    "esEspecial": true,
    "esLegendaria": true,
    "zona": {
      "id": "ZON-05",
      "nombre": "Cueva Umbría"
    },
    "descripcion": "Serpentina criatura colosal que domina las profundidades del abismo.",
    "arquetipo": "ATACANTE",
    "movimientos": [
      {
        "slot": 1,
        "nombre": "Descarga Eléctrica",
        "nombreOriginal": "Lightning Breath",
        "tipoAccion": "Ataque elemental",
        "poder": 20,
        "efecto": "PARALISIS"
      },
      {
        "slot": 2,
        "nombre": "Mordedura Titánica",
        "nombreOriginal": "Bite",
        "tipoAccion": "Ataque melé",
        "poder": 24,
        "efecto": "CRITICO"
      },
      {
        "slot": 3,
        "nombre": "Constricción Relámpago",
        "nombreOriginal": "Constrict",
        "tipoAccion": "Control físico",
        "poder": 22,
        "efecto": "ATURDIMIENTO"
      },
      {
        "slot": 4,
        "nombre": "Relámpago del Abismo",
        "nombreOriginal": null,
        "tipoAccion": "Furia legendaria",
        "poder": 38,
        "efecto": "SOBRECARGA_LEGENDARIA"
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
        "descripcion": "Victoria contra Víbora Rocosa (Nv. 2) en Praderas del Amanecer (+45 XP)",
        "marcaTiempo": "2026-10-07T12:45:00.000Z",
        "datosJson": { "monedas": 30, "xp": 45 }
      },
      {
        "eventoId": "his-502",
        "tipo": "CAPTURA",
        "categoria": "CAPTURA",
        "descripcion": "Captura exitosa de Lobo Estepario con Talismán Básico de Captura",
        "marcaTiempo": "2026-10-07T12:42:00.000Z",
        "datosJson": { "criaturaId": "cri-101" }
      }
    ]
  }
  ```
- **Errores posibles:**
  - `404 PERSONAJE_NO_ENCONTRADO` ("No se encontró un personaje activo para el usuario autenticado.").

---

### 2.13 Encuentros y combate táctico por turnos (`M-ENC` / `M-COM`) (Subfase 10k)

#### `GET /api/encuentros/activo`
- **Módulo:** `M-ENC`.
- **Descripción:** Reanuda el encuentro activo del explorador en sesión, entregando el estado táctico integral: afinidades elementales, multiplicador y etiqueta de ventaja elemental, barras de Resonancia ($0-100\%$), catálogo de estados alterados activos en ambos lados y estado de bloqueo de movimientos (`bloqueado: true` en el slot 4 si la resonancia aliada es $<100\%$).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "turno": 2,
    "esTurnoJugador": true,
    "efectividadAliadaSobreRival": {
      "multiplicador": 1.5,
      "etiqueta": "VENTAJA"
    },
    "criaturaRival": {
      "slug": "cangrejo-abismal",
      "nombre": "Cangrejo Abismal",
      "nivel": 4,
      "hpActual": 35,
      "hpMaximo": 47,
      "ataque": 46,
      "defensa": 73,
      "velocidad": 37,
      "afinidad": "agua",
      "resonancia": 24,
      "esLegendaria": false,
      "estados": [
        { "codigo": "VENENO", "turnosRestantes": 3, "valor": 2 }
      ]
    },
    "criaturaAliada": {
      "criaturaId": "cri-101",
      "slug": "treant-anciano",
      "nombre": "Treant Anciano",
      "nombreEspecie": "Treant Anciano",
      "nivel": 5,
      "hpActual": 96,
      "hpMaximo": 118,
      "ataque": 90,
      "defensa": 107,
      "velocidad": 50,
      "afinidad": "natura",
      "resonancia": 86,
      "estados": [],
      "experiencia": 1250,
      "porcentajeXp": 62,
      "xpSiguienteNivel": 1397,
      "xpNivelActual": 1006,
      "movimientos": [
        { "nombre": "Tajo de Rama", "poder": 15, "tipoAccion": "Ataque melé", "slot": 1, "efecto": null, "estadoAplicado": null, "bloqueado": false },
        { "nombre": "Arraigo Boscoso", "poder": 14, "tipoAccion": "Estado", "slot": 2, "efecto": "REGENERACION", "estadoAplicado": null, "bloqueado": false },
        { "nombre": "Embestida de Tronco", "poder": 20, "tipoAccion": "Ataque melé", "slot": 3, "efecto": "STUN", "estadoAplicado": "PARALISIS", "bloqueado": false },
        { "nombre": "Furia Silvestre", "poder": 30, "tipoAccion": "Ataque melé", "slot": 4, "efecto": "BARRERA", "estadoAplicado": "BASTION", "bloqueado": true }
      ]
    },
    "bitacora": [
      "¡Treant Anciano usó Tajo de Rama causando 22 de daño!",
      "Turno 1: ¡Un Cangrejo Abismal salvaje (Nv. 4) está frente a ti!"
    ]
  }
  ```
- **Errores posibles:**
  - `404 ENCUENTRO_NO_ENCONTRADO` ("No tienes ningún encuentro o combate activo en este momento.").

#### `POST /api/combate/:id/acciones` (aliases `POST /api/combates/:id/acciones`, `POST /api/combate/atacar`)
- **Módulo:** `M-COM`.
- **Descripción:** Despachador de acciones tácticas del turno (`ATACAR`, `RESONANCIA`, `HUIR`, `CAPTURAR`). Soporta ejecución del movimiento insignia (`RESONANCIA` o `movimientoIndice: 3`) previa validación de `resonancia === 100`, con reinicio inmediato a 0% tras el ataque. Incluye validación de concurrencia y serialización mediante `turnoEsperado` y bloqueo `FOR UPDATE`.
- **Cuerpo de petición:**
  ```json
  {
    "tipoAccion": "ATACAR",
    "movimientoIndice": 0,
    "turnoEsperado": 2
  }
  ```
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "turno": 2,
    "accionJugador": {
      "movimiento": "Tajo de Rama",
      "danoCausado": 22,
      "hpRestanteRival": 13,
      "efectividad": "VENTAJA",
      "multiplicadorAfinidad": 1.5,
      "danoAbsorbido": 0,
      "estadoAplicado": null,
      "perdioTurno": null,
      "esInsignia": false
    },
    "accionRival": {
      "movimiento": "Pinzazo",
      "danoCausado": 6,
      "hpRestanteAliado": 90,
      "efectividad": "DESVENTAJA",
      "multiplicadorAfinidad": 0.75,
      "danoAbsorbido": 0,
      "estadoAplicado": null,
      "perdioTurno": null
    },
    "efectosFinDeTurno": [
      {
        "objetivo": "RIVAL",
        "codigo": "VENENO",
        "dano": 2,
        "hpRestante": 11
      }
    ],
    "resonancia": {
      "aliada": 100,
      "rival": 32
    },
    "estados": {
      "aliada": [],
      "rival": [{ "codigo": "VENENO", "turnosRestantes": 2, "valor": 2 }]
    },
    "mensajes": [
      "¡Treant Anciano usó Tajo de Rama causando 22 de daño! (¡Es súper efectivo!)",
      "El rival respondió con Pinzazo causando 6 de daño.",
      "Cangrejo Abismal sufre 2 de daño por VENENO."
    ],
    "estado": "EN_CURSO"
  }
  ```
- **Errores posibles:**
  - `400 MOVIMIENTO_BLOQUEADO` ("El movimiento seleccionado requiere 100% de Resonancia en combate para ejecutarse.").
  - `400 ACCION_FUERA_DE_TURNO` ("No es el turno del jugador en este combate.").
  - `409 TURNO_DESACTUALIZADO` ("El turno del combate ya ha sido resuelto por otra acción concurrente.").

#### `POST /api/combate/capturar`
- **Módulo:** `M-CAP`.
- **Descripción:** Resuelve el intento probabilístico de captura aplicando $\times 1.25$ al multiplicador de estado si la criatura rival padece un estado alterado activo (`tieneEstadoAlterado`). Si la captura fracasa, el rival contraataca y resuelve el fin de turno con el motor determinista.
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401",
    "itemCodigo": "talisman-basico",
    "turnoEsperado": 2
  }
  ```
- **Respuesta fallida (`200 OK` con `exito: false`):**
  ```json
  {
    "exito": false,
    "mensaje": "¡El talismán no logró contener a la criatura! Se ha roto.",
    "encuentroId": "enc-401",
    "estado": "EN_CURSO",
    "contraataqueRival": {
      "movimiento": "Pinzazo",
      "danoCausado": 6,
      "hpRestanteAliado": 84
    },
    "efectosFinDeTurno": [],
    "resonancia": { "aliada": 16, "rival": 30 },
    "estados": { "aliada": [], "rival": [{ "codigo": "VENENO", "turnosRestantes": 1, "valor": 2 }] },
    "mensajes": [
      "¡El talismán no logró contener a la criatura! Se ha roto.",
      "El rival respondió con Pinzazo causando 6 de daño."
    ]
  }
  ```
- **Errores posibles:**
  - `400 ITEM_NO_DISPONIBLE` ("No posees este talismán en tu inventario.").
  - `409 TURNO_DESACTUALIZADO` ("El turno del combate ya ha sido resuelto por otra acción concurrente.").

#### `POST /api/combate/huir`
- **Módulo:** `M-COM`.
- **Descripción:** Evalúa la huida usando velocidades efectivas ($\text{vel} \times 0.50$ si sufre `ESCARCHA`). Si fracasa, ejecuta contraataque rival determinista.
- **Cuerpo de petición:**
  ```json
  {
    "encuentroId": "enc-401",
    "turnoEsperado": 2
  }
  ```
- **Errores posibles:**
  - `409 TURNO_DESACTUALIZADO` ("El turno del combate ya ha sido resuelto por otra acción concurrente.").

