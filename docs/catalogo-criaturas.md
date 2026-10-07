# Catálogo de Criaturas y Tablas por Zona

Este documento especifica la planilla completa de especies integradas desde la API de Open5e (`srd-2024`), sus estadísticas normalizadas, sus movimientos traducidos, y las tablas de aparición y eventos por zona para *Aethelgard: Sendas y Criaturas*.

---

## 1. Criterios de selección (Anexo A.3)

De las 331 criaturas disponibles en el documento `srd-2024` de Open5e, se seleccionaron exactamente **25 especies** bajo los siguientes criterios técnicos:
1. **Variedad de tipos:** Inclusión equilibrada de bestias (`beast`), monstruosidades (`monstrosity`), elementales (`elemental`), no-muertos (`undead`), autómatas (`construct`) y plantas (`plant`).
2. **Escala de desafío viable:** Desafíos comprendidos entre CR $0.25$ y CR $5$ para encuentros regulares de progresión, incorporando 2 criaturas de desafío superior (CR $6$ y CR $8$) como especies especiales para encuentros raros del $5\,\%$.
3. **Mecánicas compatibles:** Se descartaron dragones ancianos y criaturas con hechizos complejos o efectos que exceden un combate simple por turnos.
4. **Ataques válidos:** Cada especie seleccionada cuenta de forma obligatoria con al menos una acción con dados de ataque definidos (`attacks` no vacío) en su registro de Open5e.

---

## 2. Catálogo normalizado de especies

| `key` | Nombre en español | `slug` | `type.key` | CR | HP | AC | Vel. máx. | Prom. mejor ataque | `hpBase` | `ataqueBase` | `defensaBase` | `velocidadBase` | `tasaCaptura` | Especial |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `srd-2024_wolf` | Lobo Gris | `lobo-gris` | `beast` | 0.25 | 11 | 12 | 40 | 5.5 | 30 | 42 | 58 | 50 | 0.88 | No |
| `srd-2024_giant-wolf-spider` | Araña Lobo Gigante | `arana-lobo-gigante` | `beast` | 0.25 | 11 | 13 | 40 | 5.5 | 30 | 42 | 65 | 50 | 0.88 | No |
| `srd-2024_skeleton` | Esqueleto Guerrero | `esqueleto-guerrero` | `undead` | 0.25 | 13 | 14 | 30 | 6.5 | 31 | 48 | 72 | 40 | 0.88 | No |
| `srd-2024_zombie` | Zombi Putrefacto | `zombi-putrefacto` | `undead` | 0.25 | 15 | 8 | 20 | 5.5 | 32 | 42 | 30 | 30 | 0.88 | No |
| `srd-2024_axe-beak` | Pico de Hacha | `pico-de-hacha` | `monstrosity` | 0.25 | 19 | 11 | 50 | 5.5 | 33 | 42 | 51 | 60 | 0.88 | No |
| `srd-2024_black-bear` | Oso Negro | `oso-negro` | `beast` | 0.50 | 19 | 11 | 30 | 5.5 | 33 | 42 | 51 | 40 | 0.86 | No |
| `srd-2024_cockatrice` | Cocatriza | `cocatriza` | `monstrosity` | 0.50 | 22 | 11 | 40 | 3.5 | 34 | 30 | 51 | 50 | 0.86 | No |
| `srd-2024_dire-wolf` | Lobo Huargo | `lobo-huargo` | `beast` | 1.00 | 22 | 14 | 50 | 8.5 | 34 | 60 | 72 | 60 | 0.83 | No |
| `srd-2024_ghoul` | Necrófago | `necrofago` | `undead` | 1.00 | 22 | 12 | 30 | 5.5 | 34 | 42 | 58 | 40 | 0.83 | No |
| `srd-2024_brown-bear` | Oso Pardo | `oso-pardo` | `beast` | 1.00 | 22 | 11 | 40 | 7.5 | 34 | 54 | 51 | 50 | 0.83 | No |
| `srd-2024_tiger` | Tigre Dientes de Sable | `tigre-dientes-de-sable` | `beast` | 1.00 | 30 | 13 | 40 | 10.0 | 38 | 70 | 65 | 50 | 0.83 | No |
| `srd-2024_animated-armor` | Armadura Animada | `armadura-animada` | `construct` | 1.00 | 33 | 18 | 25 | 5.5 | 39 | 42 | 100 | 35 | 0.83 | No |
| `srd-2024_allosaurus` | Alosaurio | `alosaurio` | `beast` | 2.00 | 51 | 13 | 60 | 15.0 | 46 | 100 | 65 | 70 | 0.76 | No |
| `srd-2024_awakened-tree` | Árbol Despierto | `arbol-despierto` | `plant` | 2.00 | 59 | 13 | 20 | 13.0 | 49 | 88 | 65 | 30 | 0.76 | No |
| `srd-2024_griffon` | Grifo | `grifo` | `monstrosity` | 2.00 | 59 | 12 | 80 | 8.5 | 49 | 60 | 58 | 90 | 0.76 | No |
| `srd-2024_gargoyle` | Gárgola | `gargola` | `elemental` | 2.00 | 67 | 15 | 60 | 7.0 | 53 | 51 | 79 | 70 | 0.76 | No |
| `srd-2024_basilisk` | Basilisco | `basilisco` | `monstrosity` | 3.00 | 52 | 15 | 20 | 10.0 | 47 | 70 | 79 | 30 | 0.69 | No |
| `srd-2024_owlbear` | Osobuho | `osobuho` | `monstrosity` | 3.00 | 59 | 13 | 40 | 14.0 | 49 | 94 | 65 | 50 | 0.69 | No |
| `srd-2024_manticore` | Mantícora | `manticora` | `monstrosity` | 3.00 | 68 | 14 | 50 | 7.5 | 53 | 65 | 72 | 60 | 0.69 | No |
| `srd-2024_werewolf` | Hombre Lobo | `hombre-lobo` | `monstrosity` | 3.00 | 71 | 15 | 30 | 12.0 | 54 | 82 | 79 | 40 | 0.69 | No |
| `srd-2024_winter-wolf` | Lobo Invernal | `lobo-invernal` | `monstrosity` | 3.00 | 75 | 13 | 50 | 11.0 | 56 | 76 | 65 | 60 | 0.69 | No |
| `srd-2024_air-elemental` | Elemental de Aire | `elemental-de-aire` | `elemental` | 5.00 | 90 | 15 | 90 | 14.0 | 62 | 94 | 79 | 100 | 0.55 | No |
| `srd-2024_fire-elemental` | Elemental de Fuego | `elemental-de-fuego` | `elemental` | 5.00 | 93 | 13 | 50 | 10.0 | 63 | 70 | 65 | 60 | 0.55 | No |
| `srd-2024_chimera` | Quimera Tricéfala | `quimera-tricefala` | `monstrosity` | 6.00 | 114 | 14 | 60 | 11.0 | 72 | 76 | 72 | 70 | 0.48 | Sí |
| `srd-2024_hydra` | Hidra de las Marismas | `hidra-de-las-marismas` | `monstrosity` | 8.00 | 184 | 15 | 40 | 10.5 | 100 | 73 | 79 | 50 | 0.34 | Sí |

### 2.1 Valores extremos empleados en la normalización
- **Puntos de golpe (HP):** $\text{mínimo} = 11$, $\text{máximo} = 184$
- **Promedio de mejor ataque:** $\text{mínimo} = 3.5$, $\text{máximo} = 15.0$
- **Clase de armadura (AC):** $\text{mínimo} = 8$, $\text{máximo} = 18$
- **Velocidad máxima:** $\text{mínimo} = 20$, $\text{máximo} = 90$

---

## 3. Movimientos por especie (hasta 3 por criatura)

| Especie (`slug`) | Nombre original en Open5e | Nombre en español | Tipo de acción | Daño / Poder |
| --- | --- | --- | --- | --- |
| `lobo-gris` | `Bite` | Mordisco Feroz | Ataque melé | 5.5 |
| `arana-lobo-gigante` | `Bite` | Mordedura Venenosa | Ataque melé | 5.5 |
| `esqueleto-guerrero` | `Shortsword` | Tajo de Espada Corta | Ataque melé | 6.5 |
| `esqueleto-guerrero` | `Shortbow` | Disparo de Arco Corto | Ataque distancia | 6.5 |
| `zombi-putrefacto` | `Slam` | Golpe Descompuesto | Ataque melé | 5.5 |
| `pico-de-hacha` | `Beak` | Picotazo Cortante | Ataque melé | 5.5 |
| `oso-negro` | `Rend` | Desgarrón de Garra | Ataque melé | 5.5 |
| `cocatriza` | `Petrifying Bite` | Picotazo Petrificante | Ataque melé | 3.5 |
| `lobo-huargo` | `Bite` | Quijada Huarga | Ataque melé | 8.5 |
| `necrofago` | `Bite` | Fauces Cadavéricas | Ataque melé | 5.5 |
| `necrofago` | `Claw` | Zarpazo Paralizante | Ataque melé | 4.5 |
| `oso-pardo` | `Bite` | Dentellada Brutal | Ataque melé | 7.5 |
| `oso-pardo` | `Claw` | Zarpa Imponente | Ataque melé | 5.5 |
| `tigre-dientes-de-sable` | `Rend` | Desgarro Colmillo | Ataque melé | 10.0 |
| `armadura-animada` | `Slam` | Impacto de Hierro | Ataque melé | 5.5 |
| `alosaurio` | `Bite` | Fauces Prehistóricas | Ataque melé | 15.0 |
| `alosaurio` | `Claws` | Garras Devastadoras | Ataque melé | 8.5 |
| `arbol-despierto` | `Slam` | Embestida de Tronco | Ataque melé | 13.0 |
| `grifo` | `Rend` | Zarpazo Alado | Ataque melé | 8.5 |
| `gargola` | `Claw` | Garfas de Granito | Ataque melé | 7.0 |
| `basilisco` | `Bite` | Mordedura de Basilisco | Ataque melé | 10.0 |
| `osobuho` | `Rend` | Abrazo del Osobuho | Ataque melé | 14.0 |
| `manticora` | `Rend` | Desgarre Abisal | Ataque melé | 7.5 |
| `manticora` | `Tail Spike` | Espina de Cola | Ataque distancia | 7.5 |
| `hombre-lobo` | `Bite` | Mordisco Licántropo | Ataque melé | 12.0 |
| `hombre-lobo` | `Longbow` | Disparo de Arco Largo | Ataque distancia | 11.0 |
| `hombre-lobo` | `Scratch` | Arañazo Salvaje | Ataque melé | 10.0 |
| `lobo-invernal` | `Bite` | Mordisco Escarchado | Ataque melé | 11.0 |
| `elemental-de-aire` | `Thunderous Slam` | Ráfaga Trueno | Ataque melé | 14.0 |
| `elemental-de-fuego` | `Burn` | Toque Abrasador | Ataque melé | 10.0 |
| `quimera-tricefala` | `Bite` | Mordisco de Dragón | Ataque melé | 11.0 |
| `quimera-tricefala` | `Ram` | Cornada de Carnero | Ataque melé | 10.5 |
| `quimera-tricefala` | `Claw` | Garra de León | Ataque melé | 7.5 |
| `hidra-de-las-marismas` | `Bite` | Dentellada Múltiple | Ataque melé | 10.5 |

---

## 4. Tablas de aparición por zona

Cada tabla satisface el invariante **INV-01** ($\sum \text{pesos} > 0$). Las criaturas especiales aparecen con una probabilidad del $5\,\%$.

### 4.1 ZON-01: Praderas del Amanecer (Nivel 1–3)
| Especie (`slug`) | Peso relativo | Nivel mín. – máx. | Probabilidad resultante | Tipo de encuentro |
| --- | --- | --- | --- | --- |
| `lobo-gris` | 40 | 1 – 2 | 40.0 % | Común |
| `pico-de-hacha` | 35 | 1 – 3 | 35.0 % | Común |
| `arana-lobo-gigante` | 20 | 1 – 2 | 20.0 % | Frecuente |
| `lobo-huargo` | 5 | 3 – 4 | 5.0 % | **Especial** |
| **Total** | **100** | — | **100.0 %** | Cumple INV-01 |

### 4.2 ZON-02: Bosque Susurrante (Nivel 2–4)
| Especie (`slug`) | Peso relativo | Nivel mín. – máx. | Probabilidad resultante | Tipo de encuentro |
| --- | --- | --- | --- | --- |
| `oso-negro` | 40 | 2 – 3 | 40.0 % | Común |
| `cocatriza` | 35 | 2 – 4 | 35.0 % | Común |
| `arbol-despierto` | 20 | 3 – 4 | 20.0 % | Frecuente |
| `osobuho` | 5 | 4 – 5 | 5.0 % | **Especial** |
| **Total** | **100** | — | **100.0 %** | Cumple INV-01 |

### 4.3 ZON-03: Riberas del Lago Espejo (Nivel 3–5)
| Especie (`slug`) | Peso relativo | Nivel mín. – máx. | Probabilidad resultante | Tipo de encuentro |
| --- | --- | --- | --- | --- |
| `oso-pardo` | 40 | 3 – 4 | 40.0 % | Común |
| `tigre-dientes-de-sable` | 35 | 3 – 5 | 35.0 % | Común |
| `alosaurio` | 20 | 4 – 5 | 20.0 % | Frecuente |
| `hidra-de-las-marismas` | 5 | 5 – 6 | 5.0 % | **Especial** |
| **Total** | **100** | — | **100.0 %** | Cumple INV-01 |

### 4.4 ZON-04: Paso de los Riscos (Nivel 5–7)
| Especie (`slug`) | Peso relativo | Nivel mín. – máx. | Probabilidad resultante | Tipo de encuentro |
| --- | --- | --- | --- | --- |
| `grifo` | 40 | 5 – 6 | 40.0 % | Común |
| `gargola` | 35 | 5 – 6 | 35.0 % | Común |
| `manticora` | 20 | 6 – 7 | 20.0 % | Frecuente |
| `quimera-tricefala` | 5 | 7 – 8 | 5.0 % | **Especial** |
| **Total** | **100** | — | **100.0 %** | Cumple INV-01 |

### 4.5 ZON-05: Cueva Umbría (Nivel 7–10 | Bloqueada)
| Especie (`slug`) | Peso relativo | Nivel mín. – máx. | Probabilidad resultante | Tipo de encuentro |
| --- | --- | --- | --- | --- |
| `esqueleto-guerrero` | 35 | 7 – 8 | 35.0 % | Común |
| `zombi-putrefacto` | 30 | 7 – 8 | 30.0 % | Común |
| `necrofago` | 20 | 8 – 9 | 20.0 % | Frecuente |
| `basilisco` | 10 | 8 – 10 | 10.0 % | Raro |
| `hombre-lobo` | 5 | 9 – 10 | 5.0 % | **Especial** |
| **Total** | **100** | — | **100.0 %** | Cumple INV-01 |

### 4.6 ZON-06: Pico de la Cumbre (Nivel 8–12 | Bloqueada)
| Especie (`slug`) | Peso relativo | Nivel mín. – máx. | Probabilidad resultante | Tipo de encuentro |
| --- | --- | --- | --- | --- |
| `lobo-invernal` | 35 | 8 – 10 | 35.0 % | Común |
| `armadura-animada` | 30 | 8 – 10 | 30.0 % | Común |
| `elemental-de-fuego` | 18 | 9 – 11 | 18.0 % | Frecuente |
| `elemental-de-aire` | 12 | 9 – 11 | 12.0 % | Frecuente |
| `quimera-tricefala` | 5 | 11 – 12 | 5.0 % | **Especial** |
| **Total** | **100** | — | **100.0 %** | Cumple INV-01 |

---

## 5. Tablas de eventos por zona

Los eventos posibles al ejecutar la acción de exploración corresponden estrictamente a los tipos autorizados por el plan de desarrollo (§4 y §9):
- `ENCUENTRO`: Avistamiento de criatura salvaje para iniciar combate.
- `OBJETO`: Descubrimiento de recursos o consumibles (monedas, pociones o talismanes).
- `SIN_EVENTO`: Tramo sereno sin novedades tácticas.

Cada tabla satisface el invariante **INV-01** ($\sum \text{pesos} > 0$).

| Zona | Evento (`tipo`) | Peso relativo | Probabilidad resultante |
| --- | --- | --- | --- |
| **ZON-01: Praderas del Amanecer** | `ENCUENTRO` | 60 | 60.0 % |
| | `OBJETO` | 25 | 25.0 % |
| | `SIN_EVENTO` | 15 | 15.0 % |
| **ZON-02: Bosque Susurrante** | `ENCUENTRO` | 65 | 65.0 % |
| | `OBJETO` | 20 | 20.0 % |
| | `SIN_EVENTO` | 15 | 15.0 % |
| **ZON-03: Riberas del Lago Espejo** | `ENCUENTRO` | 65 | 65.0 % |
| | `OBJETO` | 20 | 20.0 % |
| | `SIN_EVENTO` | 15 | 15.0 % |
| **ZON-04: Paso de los Riscos** | `ENCUENTRO` | 70 | 70.0 % |
| | `OBJETO` | 20 | 20.0 % |
| | `SIN_EVENTO` | 10 | 10.0 % |
| **ZON-05: Cueva Umbría** | `ENCUENTRO` | 75 | 75.0 % |
| | `OBJETO` | 15 | 15.0 % |
| | `SIN_EVENTO` | 10 | 10.0 % |
| **ZON-06: Pico de la Cumbre** | `ENCUENTRO` | 80 | 80.0 % |
| | `OBJETO` | 15 | 15.0 % |
| | `SIN_EVENTO` | 5 | 5.0 % |

---

## 6. Origen de datos (Anexo A.2) y activos visuales

De acuerdo con las reglas de frontera del Anexo A.2:
- **Externo (Open5e):** `key` (`idExterno`), `type.key`, estadísticas fuente (`challenge_rating`, `hit_points`, `armor_class`, `speed_all`, `actions[].attacks`). El nombre en inglés de la criatura se utiliza únicamente como referencia técnica interna y **nunca** se expone en la interfaz del jugador.
- **Propio:** Nombre en español, `slug`, descripciones de ambientación, estadísticas normalizadas (`hpBase`, `ataqueBase`, `defensaBase`, `velocidadBase`, `tasaCaptura`), pertenencia al jugador, nivel individual, puntos de golpe en curso, experiencia acumulada y tablas ponderadas de aparición y eventos.
- **Mixto:** Movimientos de combate (la potencia proviene de la tirada de dados de Open5e, mientras que la denominación en español es de autoría propia).
- **Activos gráficos:** Las imágenes de las especies no bloquean el desarrollo funcional. Se referencian mediante su `slug` (por ejemplo `/assets/criaturas/lobo-gris.png`) y utilizarán placeholders durante los avances iniciales.
