# Reglas del juego: Fórmulas matemáticas e invariantes numéricos

Este documento establece las especificaciones matemáticas y los invariantes que rigen el equilibrio del juego *Aethelgard: Sendas y Criaturas*. Toda regla es validada por el servidor y tiene correspondencia con pruebas automatizadas en las Fases 6 y 7.

---

## 1. Normalización y Soberanía Interna de Atributos (Subfase 10j)

A partir de la Subfase 10j, rige el principio de **Soberanía Interna de Atributos**: las 30 criaturas canónicas poseen estadísticas base inmutables definidas en el servidor de juego (`apps/api/src/modulos/externo/bestiario-canonico.ts`), garantizando una progresión estricta por bioma regional y presupuesto total:
$$\text{Presupuesto} = \text{hpBase} + \text{ataqueBase} + \text{defensaBase} + \text{velocidadBase}$$
Donde cada estadística individual se acota rigurosamente en $[30, 100]$.

La fórmula matemática de normalización original del Anexo A.3 se conserva como base de referencia metodológica sobre el SRD 5.2 de Open5e:

$$\text{valorJuego} = 30 + 70 \times \frac{\text{valor} - \text{minimo}}{\text{maximo} - \text{minimo}}$$

Donde $\text{minimo}$ y $\text{maximo}$ representan los valores extremos observados en el catálogo seleccionado de criaturas.

### 1.1 Atributos sujetos a normalización
1. **$\text{hpBase}$:** Calculado a partir de los puntos de golpe originales ($\text{hit\_points}$).
2. **$\text{ataqueBase}$:** Calculado a partir del promedio de daño del mejor ataque disponible en la criatura.
3. **$\text{defensaBase}$:** Calculado a partir de la clase de armadura original ($\text{armor\_class}$).
4. **$\text{velocidadBase}$:** Calculado a partir del valor máximo de desplazamiento presente en $\text{speed\_all}$ ($\max(\text{walk}, \text{fly}, \text{swim}, \text{climb}, \text{burrow})$).

### 1.2 Cálculo del promedio de ataque
El promedio de daño de una acción de ataque se determina como:

$$\text{promedioAtaque} = \text{damage\_die\_count} \times \left(\frac{\text{lados}}{2} + 0.5\right) + \text{damage\_bonus}$$

- $\text{damage\_die\_type}$: Cadena que especifica el dado (ej. `"D6"` $\rightarrow 6$ lados, `"D8"` $\rightarrow 8$ lados, `"D10"` $\rightarrow 10$ lados).
- $\text{damage\_bonus}$: Si el campo es `null`, se evalúa como $0$.

### 1.3 Tasa de captura base de la especie
La susceptibilidad intrínseca de una especie a ser capturada se calcula directamente desde su índice de desafío ($\text{challenge\_rating}$ / CR):

$$\text{tasaCaptura} = \text{clamp}(0.10, 0.90, 0.90 - 0.07 \times \text{challenge\_rating})$$

Donde $\text{clamp}(a, b, x) = \max(a, \min(b, x))$. Una criatura con $\text{CR} = 0$ posee $\text{tasaCaptura} = 0.90$, mientras que una criatura poderosa con $\text{CR} \ge 11.4$ alcanza el suelo de $0.10$.

### 1.4 Caso borde obligatorio: División entre cero ($\text{maximo} = \text{minimo}$)
Si en una muestra o subconjunto de criaturas el valor máximo y el valor mínimo de una estadística son idénticos ($\text{maximo} = \text{minimo}$), para evitar una indeterminación matemática por división entre cero, se establece por regla de diseño:

$$\text{valorJuego} = 65$$

El valor $65$ corresponde al punto medio exacto del intervalo normalizado $[30, 100]$.

---

## 2. Fórmulas del sistema de juego

### 2.1 Fórmula de daño en combate (Subfase 10k)
Determina el daño infligido a los puntos de golpe del defensor al impactar un movimiento, incorporando afinidades elementales y defensa efectiva.

- **Variables y rangos:**
  - $\text{ataque}$ (Atacante): $[30, 250]$ (estadística escalada por nivel).
  - $\text{defensaEfectiva}$ (Defensor): $[1, 250]$ ($\text{defensa} \times 0.75$ si sufre `QUEMADURA`, sino $\text{defensa}$).
  - $\text{poder}$ (Movimiento): $[5, 80]$.
  - $\text{nivel}$ (Atacante): $[1, 50]$.
  - $F_{\text{afinidad}}$: Multiplicador de ventaja elemental ($1.5$ ventaja, $0.75$ desventaja, $1.0$ neutral).
- **Fórmula:**
  $$\text{danoBruto} = \left( \frac{\text{ataque}}{\max(1, \text{defensaEfectiva})} \times \text{poder} \times 0.8 \right) + (\text{nivel} \times 0.5)$$
  $$\text{factorVariacion} = 0.85 + 0.30 \times r, \quad r \sim \mathcal{U}[0, 1) \quad (\pm 15\,\% \text{ de variación estocástica})$$
  $$\text{danoFinal} = \max(1, \lfloor \text{danoBruto} \times \text{factorVariacion} \times F_{\text{afinidad}} \rfloor)$$
- **Invariante cumplido:** **INV-04** (El daño mínimo de un golpe es siempre $\ge 1$, garantizado aun bajo desventaja elemental y factor estocástico mínimo de $0.85$).
- **Ejemplo numérico resuelto:**
  - Atacante Nivel 3 con $\text{ataque} = 45$ usa movimiento de fuego ($\text{poder} = 12$) contra rival de natura ($F_{\text{afinidad}} = 1.5$) con $\text{defensa} = 50$.
  - Con factor base $1.0$: $\text{danoBruto} = (45 / 50 \times 12 \times 0.8) + (3 \times 0.5) = 8.64 + 1.5 = 10.14$.
  - $\text{danoFinal} = \max(1, \lfloor 10.14 \times 1.0 \times 1.5 \rfloor) = \lfloor 15.21 \rfloor = 15$.
  - Si el defensor cuenta con escudo `BASTION`, el daño consume primero los puntos del escudo ($0 \le \text{escudo}$); el remanente, de existir, impacta los puntos de salud.

### 2.2 Probabilidad final de captura (Subfase 10k)
Determina la probabilidad de éxito al intentar capturar una criatura salvaje durante un turno de combate.

- **Variables y rangos:**
  - $\text{tasaCaptura}$ (Especie): $[0.10, 0.90]$.
  - $\text{hpActual}$: $[1, \text{hpMaximo}]$.
  - $\text{hpMaximo}$: $[30, 500]$.
  - $\text{multiplicadorTalisman}$: $1.0$ (Básico) o $1.5$ (Resonante).
  - $\text{multiplicadorEstado}$: $1.25$ si el rival sufre un estado alterado activo (`QUEMADURA`, `VENENO`, `ESCARCHA`, `PARALISIS`, `PETRIFICACION`), $1.0$ en caso contrario.
- **Fórmula:**
  $$\text{factorSalud} = 1.0 - 0.5 \times \left( \frac{\text{hpActual}}{\text{hpMaximo}} \right)$$
  $$\text{probBruta} = \text{tasaCaptura} \times \text{factorSalud} \times \text{multiplicadorTalisman} \times \text{multiplicadorEstado}$$
  $$\text{probFinal} = \text{clamp}(0.05, 0.95, \text{probBruta})$$
- **Relación entre $\text{tasaCaptura}$ y $\text{probFinal}$:**
  La $\text{tasaCaptura}$ ($0.10$ a $0.90$) es una propiedad genética fija de la especie. La probabilidad final ($\text{probFinal}$) modula dicha tasa en función de la salud rival, el talismán y la sinergia de estados alterados activos ($\times 1.25$). La función $\text{clamp}$ final impone una salvaguarda universal estricta: ninguna captura tiene garantizado el éxito absoluto ($95\,\%$ máximo) ni es matemáticamente imposible ($5\,\%$ mínimo).
- **Invariante cumplido:** **INV-02** ($\text{probFinal} \in [0.05, 0.95]$).
- **Ejemplo numérico resuelto:**
  - Criatura salvaje con $\text{tasaCaptura} = 0.50$, reducida a $\text{hpActual} = 30$ de $\text{hpMaximo} = 60$, afectada por `QUEMADURA` ($\text{multiplicadorEstado} = 1.25$). Se usa Talismán Básico ($1.0$).
  - $\text{factorSalud} = 1.0 - 0.5 \times (30 / 60) = 0.75$.
  - $\text{probBruta} = 0.50 \times 0.75 \times 1.0 \times 1.25 = 0.46875$ ($46.88\,\%$).
  - $\text{probFinal} = \text{clamp}(0.05, 0.95, 0.46875) = 0.46875$.

### 2.3 Experiencia (XP) ganada en combate
Experiencia otorgada a la criatura participante al debilitar a un oponente en combate.

- **Variables y rangos:**
  - $\text{challenge\_rating}$ (Rival): $[0, 20]$.
  - $\text{nivelRival}$: $[1, 50]$.
- **Fórmula:**
  $$\text{xpBase} = \max\left(10, \text{round}(25 \times (1 + \text{challenge\_rating}))\right)$$
  $$\text{xpGanada} = \text{round}\left(\text{xpBase} \times (1 + (\text{nivelRival} - 1) \times 0.20)\right)$$
- **Ejemplo numérico resuelto:**
  - Rival vencido: Nivel 3, $\text{challenge\_rating} = 0.5$.
  - $\text{xpBase} = \text{round}(25 \times 1.5) = 38$.
  - $\text{xpGanada} = \text{round}(38 \times (1 + 2 \times 0.20)) = \text{round}(38 \times 1.40) = 53\text{ XP}$.

### 2.4 Experiencia acumulada requerida por nivel
Determina la cantidad total de XP necesaria para que una criatura alcance un nivel determinado $n$.

- **Variables y rangos:**
  - $n$ (Nivel objetivo): $[1, 50]$.
- **Fórmula:**
  $$\text{xpRequerida}(n) = \begin{cases} 0 & \text{si } n = 1 \\ \left\lfloor 50 \times (n - 1)^{1.8} + 100 \times (n - 1) \right\rfloor & \text{si } n > 1 \end{cases}$$
- **Invariante cumplido:** **INV-05** ($\text{xpRequerida}(n+1) > \text{xpRequerida}(n)$ estrictamente para todo $n \ge 1$).
- **Ejemplo numérico resuelto:**
  - Nivel 1: $0\text{ XP}$.
  - Nivel 2: $\lfloor 50 \times 1^{1.8} + 100 \times 1 \rfloor = 50 + 100 = 150\text{ XP}$.
  - Nivel 3: $\lfloor 50 \times 2^{1.8} + 100 \times 2 \rfloor = \lfloor 50 \times 3.4822 + 200 \rfloor = \lfloor 174.11 + 200 \rfloor = 374\text{ XP}$.
  - Nivel 4: $\lfloor 50 \times 3^{1.8} + 100 \times 3 \rfloor = \lfloor 50 \times 7.2246 + 300 \rfloor = \lfloor 361.23 + 300 \rfloor = 661\text{ XP}$.
  - Nivel 5: $\lfloor 50 \times 4^{1.8} + 100 \times 4 \rfloor = \lfloor 50 \times 12.1257 + 400 \rfloor = \lfloor 606.28 + 400 \rfloor = 1006\text{ XP}$.

- **Piso de experiencia canónica y persistencia:**
  Toda criatura creada o capturada en un nivel $n$ retiene como cimiento de experiencia acumulada $\text{experienciaBase}(n) = \text{xpRequerida}(n)$. Cualquier XP ganada en combate se incrementa acumulativamente sobre dicho valor en la columna `criatura.experiencia`.
- **Aislamiento por Personaje y Multitenancy:**
  La entrega de experiencia y actualización de nivel en `ProgresoService` valida estrictamente la pertenencia `criatura.personajeId === personajeId`, asegurando que el progreso se guarde y conserve única y exclusivamente en la criatura del usuario/personaje en sesión, impidiendo fuga de datos hacia otros jugadores.

### 2.5 Probabilidad de huida de combate (Subfase 10k)
Determina la probabilidad de éxito al intentar escapar de un encuentro salvaje, evaluando velocidades efectivas.

- **Variables y rangos:**
  - $\text{velEfectivaJugador}$: $[10, 200]$ ($\text{velocidad} \times 0.60$ si sufre `ESCARCHA`, $\times 0.75$ si sufre `PARALISIS`).
  - $\text{velEfectivaRival}$: $[10, 200]$ ($\text{velocidad} \times 0.60$ si sufre `ESCARCHA`, $\times 0.75$ si sufre `PARALISIS`).
  - $\text{intentos}$: Contador de intentos fallidos previos en el encuentro ($1, 2, 3\dots$).
- **Fórmula:**
  $$\text{probHuidaBruta} = \left(\frac{\text{velEfectivaJugador}}{\text{velEfectivaJugador} + \text{velEfectivaRival}}\right) + 0.10 \times (\text{intentos} - 1)$$
  $$\text{probHuidaFinal} = \text{clamp}(0.10, 0.90, \text{probHuidaBruta})$$
- **Contraataque en Huida Fallida:**
  Si la huida fracasa ($r \ge \text{probHuidaFinal}$), el rival ejecuta un contraataque autoritativo determinista a través de `resolverRonda`, aplicando daño elemental, chequeo de estados y fin de ronda.

### 2.6 Progreso de exploración de zona (Fase 9 / Subfase 10d)
Determina el grado de reconocimiento cartográfico de una zona salvaje por parte del explorador.

- **Variables y rangos:**
  - $\text{progresoPrevio}$: $[0, 100]$ (porcentaje persistido en la tabla `zona_desbloqueada` en PostgreSQL).
  - $\text{incrementoPorExploracion}$: $+20\,\%$ otorgado al completar una acción de exploración pacífica (`OBJETO` o `SIN_EVENTO`), o al resolver favorablemente un encuentro hostil mediante victoria (`VICTORIA`) o captura (`CAPTURADO`).
- **Fórmula de actualización:**
  $$\text{progresoNuevo} = \min(100, \text{progresoPrevio} + 20)$$
- **Regla del servidor y activación condicionada (Subfase 10d, A-8 / S-6):**
  1. Si la exploración resulta en un evento de `ENCUENTRO`, el progreso de la ruta **no se incrementa prematuramente** mientras el combate permanezca en curso (`EN_CURSO`).
  2. El incremento de $+20\,\%$ de la zona se acredita y persiste en la base de datos exclusivamente cuando el encuentro es resuelto favorablemente (al derrotar a la bestia en `CombateService` o al capturarla en `CapturaService`). Si el jugador huye o es derrotado, la senda retiene su progreso previo.
  3. El progreso es administrado y validado íntegramente en el servidor en la columna `zona_desbloqueada.progreso`. Al alcanzar $100\,\%$, el cliente despliega la insignia de "100% Cartografiada / Explorada".

### 2.8 Desbloqueo del movimiento insignia M4 (Subfase 10k)
- Toda especie cuenta con 4 movimientos en los slots $1..4$. El slot 4 corresponde a la técnica insignia o movimiento de Furia.
- **Condición de activación:** La criatura aliada requiere $\text{resonancia} = 100$ para habilitar el slot 4. Cualquier intento de ejecución con resonancia menor es rechazado en servidor con `BadRequestException(MOVIMIENTO_BLOQUEADO)`.
- **Reinicio:** Al completarse la ejecución del movimiento insignia, la resonancia de la criatura aliada se reinicia inmediatamente a $0\,\%$ sin acumular ganancias en dicha ronda.
- **Restricción rival:** La criatura rival nunca sortea ni ejecuta el slot 4 en sus turnos regulares.

### 2.10 Matriz inmutable de afinidades elementales (Subfase 10k)
Rige las interacciones elementales entre el tipo del movimiento atacante y la afinidad de la criatura defensora:

| Atacante \ Defensor | Físico | Fuego | Agua | Natura | Sombra | Luz |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Físico** | $1.0\times$ | $1.0\times$ | $1.0\times$ | $1.0\times$ | $1.0\times$ | $1.0\times$ |
| **Fuego** | $1.0\times$ | $0.75\times$ | $0.75\times$ | **$1.5\times$** | $1.0\times$ | $1.0\times$ |
| **Agua** | $1.0\times$ | **$1.5\times$** | $0.75\times$ | $0.75\times$ | $1.0\times$ | $1.0\times$ |
| **Natura** | $1.0\times$ | $0.75\times$ | **$1.5\times$** | $0.75\times$ | $1.0\times$ | $1.0\times$ |
| **Sombra** | $1.0\times$ | $1.0\times$ | $1.0\times$ | $1.0\times$ | $0.75\times$ | **$1.5\times$** |
| **Luz** | $1.0\times$ | $1.0\times$ | $1.0\times$ | $1.0\times$ | **$1.5\times$** | $0.75\times$ |

### 2.11 Catálogo y reglas de estados alterados (Subfase 10k)
1. **`QUEMADURA`:** DoT del $10\,\%$ del HP Máximo (mínimo 1), $\text{defensaEfectiva} = \text{defensa} \times 0.75$. Duración: 3 turnos.
2. **`VENENO`:** DoT del $12\,\%$ del HP Máximo (mínimo 1). Duración: 4 turnos.
3. **`ESCARCHA`:** $\text{velEfectiva} = \text{velocidad} \times 0.60$. Duración: 2 turnos.
4. **`PARALISIS`:** $\text{velEfectiva} = \text{velocidad} \times 0.75$, $25\,\%$ de probabilidad de perder turno ($r < 0.25$). Duración: 2 turnos.
5. **`PETRIFICACION`:** Pérdida total del turno ($100\,\%$, sin consumir tirada estocástica). Duración: 1 turno.
6. **`BASTION`:** Escudo de protección equivalente al $20\,\%$ del HP Máximo que absorbe daño directo antes de impactar los puntos de salud. Expira al consumirse o tras 3 turnos (beneficio: `esAlterado: false`).

- **Regla DoT No Letal (D-4):** Los daños por estado al final del turno se acotan a $\max(1, \text{hpActual} - \text{danoDoT})$, impidiendo que un estado alterado debilite a una criatura por sí solo.
- **Inmunidad de 1 Turno (D-6):** Al expirar un estado natural o por escudo agotado, la criatura adquiere inmunidad al mismo código de estado durante el turno inmediatamente posterior.

### 2.12 Acumulador y mecánicas de Resonancia (Subfase 10k)
La barra de Resonancia ($0 - 100\,\%$) se incrementa al final de cada ronda según las siguientes reglas autoritativas:
1. **Ganancia base:** $+8\,\%$ por ronda concluida.
2. **Bonificación elemental:** $+10\,\%$ si el atacante asestó un golpe con ventaja elemental ($F_{\text{afinidad}} = 1.5$).
3. **Carga por daño recibido:** $\lfloor (\text{danoAbsorbido} / \text{hpMaximo}) \times 40 \rfloor$, con un tope máximo de $+20\,\%$ por ronda.
4. **Saturación:** Acotada en $[0, 100]$. Al alcanzar $100\,\%$, desbloquea el movimiento insignia M4.
5. **Consumo:** Ejecutar M4 reinicia la resonancia a $0\,\%$ sin acumular ganancias en dicha ronda.
6. **Representación en cliente (Subfase 10l):** El cliente representa la Resonancia mediante 10 bloques discretos retro calculados como $\lfloor \text{resonancia} / 10 \rfloor$. El servidor permanece como la única fuente autoritativa de su acumulación y persistencia.

---

## 3. Resolución de tablas ponderadas (CFG)

La selección aleatoria en tablas de aparición de criaturas y tablas de eventos se resuelve mediante ponderaciones relativas configuradas como datos en base de datos.

Dada una tabla con $k$ entradas, donde cada entrada $i$ posee un peso entero $\text{peso}_i > 0$:

1. Se calcula la suma acumulada total de pesos:
   $$S = \sum_{i=1}^k \text{peso}_i$$
   Por **INV-01**, se garantiza que $S > 0$.
2. La probabilidad formal resultante de cada opción es:
   $$P(i) = \frac{\text{peso}_i}{S}$$
3. El algoritmo del servidor genera un número pseudoaleatorio flotante uniforme $r \in [0, S)$.
4. Se recorren las entradas acumulando los pesos; la entrada seleccionada es la primera donde la suma acumulada supera estrictamente a $r$:
   $$\text{seleccionada} = \min \left\{ j \;\middle|\; \sum_{i=1}^j \text{peso}_i > r \right\}$$

---

## 4. Invariantes numéricos del sistema

Estos cinco invariantes actúan como contratos inquebrantables de la lógica del juego. Se implementan como verificaciones automáticas de integridad y pruebas unitarias:

| ID | Invariante | Descripción matemática / Lógica | Fase donde se valida |
| --- | --- | --- | --- |
| **INV-01** | Suma de pesos positiva y normalizada | $\sum_{i=1}^{k} \text{peso}_i > 0$ para toda tabla de aparición o eventos. En la Subfase 10j, cada tabla de las 6 zonas cuenta con exactamente 5 especies con suma estricta de 100 % ($35\% + 35\% + 15\% + 10\% + 5\% = 100\%$). | Fase 5 (Seed), Fase 6 y Fase 10j |
| **INV-02** | Rango de captura acotado | $0.05 \le \text{probFinal} \le 0.95$. Toda tirada de captura retiene un riesgo mínimo ($5\,\%$) y una oportunidad mínima ($5\,\%$), incluso ante la sinergia de estados alterados ($\times 1.25$). | Fase 7 (Combate) y Subfase 10k |
| **INV-03** | Rango de puntos de golpe | $0 \le \text{hpActual} \le \text{hpMaximo}$. Ningún cálculo de daño permite HP negativo ni curación por encima del máximo. En curación fuera de combate (`POST /api/inventario/usar`), si $\text{hpActual} \ge \text{hpMaximo}$ la acción es rechazada con `400 SALUD_COMPLETA` sin consumir el objeto ni descontar stock. En el Santuario de Curación (`POST /api/curacion/restaurar`, Subfase 10h), restaura atómicamente a todo el equipo activo y revive a criaturas caídas ($\text{hpActual} = 0 \to \text{hpMaximo}$) exactamente al 100 % de su salud sin sobrecuración. En la Subfase 10k, los DoTs de estados respetan la salvaguarda no letal ($\max(1, \text{hpActual} - \text{danoDoT})$). | Fase 7, Fase 10g, Fase 10h y Subfase 10k |
| **INV-04** | Daño mínimo no nulo | $\text{danoFinal} \ge 1$. Todo ataque ejecutado que impacte inflige al menos 1 punto de daño, sin importar la defensa del rival ni la desventaja elemental ($0.75\times$). | Fase 7 (Combate) y Subfase 10k |
| **INV-05** | Progresión monótona creciente | $\text{xpRequerida}(n+1) > \text{xpRequerida}(n)$ para todo $n \ge 1$. Cada nivel exige estrictamente más XP acumulada que el anterior. | Fase 7 (Progresión) |

### 4.1 Invariantes de jerarquía táctica y presupuesto de especies (Subfase 10j)

Para garantizar que ninguna criatura temprana opaque a los desafíos de zonas avanzadas y que las criaturas especiales y legendarias conserven su estatus apex, rigen 4 invariantes numéricos verificados por la suite unitaria (`apps/api/test/bestiario-canonico.spec.ts`):

| ID | Invariante | Regla Matemática / Lógica Operativa | Cumplimiento Verificado |
| --- | --- | --- | --- |
| **J-1** | Jerarquía de Aprendiz a Aventurero | Todo presupuesto común de Zona 1 ($166 - 178$) es estrictamente menor que los presupuestos comunes de Zona 2 ($200 - 232$). | Verificado en código (`bestiario-canonico.ts`) |
| **J-2** | Supremacía de Rarezas Superiores | Toda criatura común de una jerarquía regional posee un presupuesto total inferior a las criaturas especiales o legendarias de jerarquías iguales o superiores. | Verificado en código y pruebas unitarias |
| **J-3** | Monotonía Estricta Apex y Legendarias | Los presupuestos de criaturas especiales y legendarias crecen estrictamente por zona bioma: $210 < 270 < 280 < 320 < 355 < 380$. Las dos Legendarias (`behir-abismo`: 355, `remorhaz-glaciar`: 380) superan a todas las demás criaturas del compendio. | Verificado en matriz canónica y BD |
| **J-4** | Acotamiento de Atributos Base | Cada estadística individual ($\text{hpBase}, \text{ataqueBase}, \text{defensaBase}, \text{velocidadBase}$) se ubica estrictamente dentro del intervalo $[30, 100]$. | Verificado en 30 especies del bestiario |

---

### 2.7 Catálogo canónico de consumibles y reglas de inventario (`INV-03`, `S-4`, `S-6`)

Los objetos de curación y talismanes de captura poseen precios y efectos canónicos normalizados en PostgreSQL (`prisma/seed.ts`).

| Código | Nombre | Tipo | Precio de Compra | Efecto Canónico | Regla Operativa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pocion-menor` | Poción de Curación Menor | `CURACION` | 30 oro | Restaura +20 HP | Acotada a $\min(\text{hpMaximo}, \text{hpActual} + 20)$. Rechazada si HP está lleno. |
| `pocion-mayor` | Poción de Curación Mayor | `CURACION` | 80 oro | Restaura +50 HP | Acotada a $\min(\text{hpMaximo}, \text{hpActual} + 50)$. Rechazada si HP está lleno. |
| `talisman-basico` | Talismán Básico de Captura | `CAPTURA` | 50 oro | Bono Captura Nv.1 (x1.0) | Solo aplicable durante combate activo. Rechazado con `OBJETO_NO_CONSUMIBLE` en inventario. |
| `talisman-avanzado`| Talismán Avanzado de Captura| `CAPTURA` | 150 oro | Bono Captura Nv.2 (x1.5) | Solo aplicable durante combate activo. Rechazado con `OBJETO_NO_CONSUMIBLE` en inventario. |

**Reglas de Capacidad e Invariante de Inventario:**
- Capacidad estándar de bolsa: $C = 20$ ranuras distintas.
- Lotes de compra rápida en bazar: $x1$, $x5$, $x10$ (acotados estrictamente a $[1, 99]$ en DTO).
- Costo total calculado unilateralmente en servidor ($S\text{-6}$): $\text{costoTotal} = \text{precioCompra} \times \text{cantidad}$.
- Invariante de saldo ($S\text{-4}$): $\text{saldoMonedas} \ge \text{costoTotal}$, validado bajo bloqueo de concurrencia pesimista (`FOR UPDATE`).

---

### 2.8 Jerarquía de 4 slots de movimientos y bloqueo de Furia (Subfase 10j, D-4)

Cada criatura posee exactamente 4 movimientos tácticos ordenados por slot (`1..4`):
1. **Slot 1 (M1 - Básico):** Ataque elemental o físico estándar sin costo adicional.
2. **Slot 2 (M2 - Táctico):** Ataque con efecto secundario de estado, debilitamiento o ventaja.
3. **Slot 3 (M3 - Cobertura):** Movimiento de defensa, barrera, drenaje o potencia superior.
4. **Slot 4 (M4 - Furia/Especial):** Técnica definitiva de devastación elemental ($24 - 40$ de poder).

**Regla de bloqueo en servidor (Decisión D-4):**
- Durante la Subfase 10j, el jugador solo puede invocar en combate los slots 1 a 3 (`movimientoIndice: 0, 1, 2`).
- El Slot 4 (`movimientoIndice: 3`, slot 4) está formalmente bloqueado en el servidor bajo código de error `400 MOVIMIENTO_BLOQUEADO` («El movimiento seleccionado requiere 100% de Resonancia en combate para ejecutarse.») hasta que se implemente la mecánica de medidor de Resonancia.
- Los rivales salvajes seleccionan aleatoriamente su contraataque exclusivamente entre los slots 1 y 3 (el rival nunca ejecuta el slot 4 de Furia).

---

### 2.9 Tablas de aparición canónicas e invariante INV-01

En las 6 zonas del mundo, cada tabla de aparición cuenta con exactamente 5 especies autóctonas distribuidas con una suma estricta del **100 %** ($\sum_{i=1}^5 \text{peso}_i = 100$):
$$\text{Distribución: } 35\,\% \text{ (Común 1)} + 35\,\% \text{ (Común 2)} + 15\,\% \text{ (Frecuente)} + 10\,\% \text{ (Rara)} + 5\,\% \text{ (Especial / Legendaria)} = 100\,\%$$
Esta parametrización garantiza matemáticamente el cumplimiento del invariante **INV-01** en todo momento.
