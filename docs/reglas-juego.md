# Reglas del juego: Fórmulas matemáticas e invariantes numéricos

Este documento establece las especificaciones matemáticas y los invariantes que rigen el equilibrio del juego *Aethelgard: Sendas y Criaturas*. Toda regla es validada por el servidor y tiene correspondencia con pruebas automatizadas en las Fases 6 y 7.

---

## 1. Normalización de estadísticas (Anexo A.3)

Las estadísticas de D&D provistas por Open5e (`srd-2024`) manejan órdenes de magnitud dispares. Para integrarlas al motor del juego, cada atributo base se normaliza a una escala común en el intervalo **[30, 100]**:

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

### 2.1 Fórmula de daño en combate
Determina el daño infligido a los puntos de golpe del defensor al impactar un movimiento.

- **Variables y rangos:**
  - $\text{ataque}$ (Atacante): $[30, 250]$ (estadística escalada por nivel).
  - $\text{defensa}$ (Defensor): $[30, 250]$ (estadística escalada por nivel).
  - $\text{poder}$ (Movimiento): $[5, 50]$.
  - $\text{nivel}$ (Atacante): $[1, 50]$.
- **Fórmula:**
  $$\text{danoBruto} = \left( \frac{\text{ataque}}{\max(1, \text{defensa})} \times \text{poder} \times 0.8 \right) + (\text{nivel} \times 0.5)$$
  $$\text{factorVariacion} = 0.85 + 0.30 \times r, \quad r \sim \mathcal{U}[0, 1) \quad (\pm 15\,\% \text{ de variación estocástica})$$
  $$\text{danoFinal} = \max(1, \lfloor \text{danoBruto} \times \text{factorVariacion} \rfloor)$$
- **Invariante cumplido:** **INV-04** (El daño mínimo de un golpe es siempre $\ge 1$, garantizado aun bajo el factor estocástico mínimo de $0.85$).
- **Ejemplo numérico resuelto:**
  - Atacante Nivel 3 con $\text{ataque} = 45$ usa movimiento con $\text{poder} = 12$. Defensor con $\text{defensa} = 50$.
  - Con factor base $1.0$: $\text{danoBruto} = (45 / 50 \times 12 \times 0.8) + (3 \times 0.5) = 8.64 + 1.5 = 10.14$.
  - $\text{danoFinal} = \max(1, \lfloor 10.14 \times 1.0 \rfloor) = 10$.
  - Con factor mínimo $0.85$: $\lfloor 10.14 \times 0.85 \rfloor = \lfloor 8.619 \rfloor = 8$.
  - Con factor máximo $1.15$: $\lfloor 10.14 \times 1.15 \rfloor = \lfloor 11.661 \rfloor = 11$.

### 2.2 Probabilidad final de captura
Determina la probabilidad de éxito al intentar capturar una criatura salvaje durante un turno de combate.

- **Variables y rangos:**
  - $\text{tasaCaptura}$ (Especie): $[0.10, 0.90]$.
  - $\text{hpActual}$: $[1, \text{hpMaximo}]$.
  - $\text{hpMaximo}$: $[30, 500]$.
  - $\text{multiplicadorTalisman}$: $1.0$ (Básico) o $1.5$ (Resonante).
- **Fórmula:**
  $$\text{factorSalud} = 1.0 - 0.5 \times \left( \frac{\text{hpActual}}{\text{hpMaximo}} \right)$$
  $$\text{probBruta} = \text{tasaCaptura} \times \text{factorSalud} \times \text{multiplicadorTalisman}$$
  $$\text{probFinal} = \text{clamp}(0.05, 0.95, \text{probBruta})$$
- **Relación entre $\text{tasaCaptura}$ y $\text{probFinal}$:**
  La $\text{tasaCaptura}$ ($0.10$ a $0.90$) es una propiedad genética fija de la especie. La probabilidad final ($\text{probFinal}$) modula dicha tasa en función de la situación táctica (debilitar al rival aumenta el factor salud de $0.50$ hasta rozar $1.00$) y el objeto empleado. La función $\text{clamp}$ final impone una salvaguarda universal estricta: ninguna captura tiene garantizado el éxito absoluto ($95\,\%$ máximo) ni es matemáticamente imposible ($5\,\%$ mínimo).
- **Invariante cumplido:** **INV-02** ($\text{probFinal} \in [0.05, 0.95]$).
- **Ejemplo numérico resuelto:**
  - Criatura salvaje con $\text{tasaCaptura} = 0.60$, reducida a $\text{hpActual} = 15$ de $\text{hpMaximo} = 60$. Se usa Talismán Resonante ($1.5$).
  - $\text{factorSalud} = 1.0 - 0.5 \times (15 / 60) = 1.0 - 0.125 = 0.875$.
  - $\text{probBruta} = 0.60 \times 0.875 \times 1.5 = 0.7875$ ($78.75\,\%$).
  - $\text{probFinal} = \text{clamp}(0.05, 0.95, 0.7875) = 0.7875$.

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

### 2.5 Probabilidad de huida de combate
Determina la probabilidad de éxito al intentar escapar de un encuentro salvaje.

- **Variables y rangos:**
  - $\text{velJugador}$: $[30, 200]$.
  - $\text{velRival}$: $[30, 200]$.
  - $\text{intentos}$: Contador de intentos fallidos previos en el encuentro ($1, 2, 3\dots$).
- **Fórmula:**
  $$\text{probHuidaBruta} = \left(\frac{\text{velJugador}}{\text{velJugador} + \text{velRival}}\right) + 0.10 \times (\text{intentos} - 1)$$
  $$\text{probHuidaFinal} = \text{clamp}(0.10, 0.90, \text{probHuidaBruta})$$
- **Ejemplo numérico resuelto:**
  - Jugador con $\text{velJugador} = 40$ frente a rival con $\text{velRival} = 60$ en el primer intento ($\text{intentos} = 1$).
  - $\text{probHuidaBruta} = (40 / (40 + 60)) + 0 = 0.40$ ($40\,\%$).
  - $\text{probHuidaFinal} = \text{clamp}(0.10, 0.90, 0.40) = 0.40$.

### 2.6 Progreso de exploración de zona (Fase 9)
Determina el grado de reconocimiento cartográfico de una zona salvaje por parte del explorador.

- **Variables y rangos:**
  - $\text{progresoPrevio}$: $[0, 100]$ (porcentaje persistido en la tabla `zona_desbloqueada` en PostgreSQL).
  - $\text{incrementoPorExploracion}$: $+20\,\%$ por cada acción de exploración realizada en la zona.
- **Fórmula de actualización:**
  $$\text{progresoNuevo} = \min(100, \text{progresoPrevio} + 20)$$
- **Regla del servidor (A-8 / S-6):**
  El progreso es administrado y persistido íntegramente en el servidor en la columna `zona_desbloqueada.progreso`. Al alcanzar $100\,\%$, el cliente despliega la insignia de "Zona 100% Explorada / Cartografiada".

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
| **INV-01** | Suma de pesos positiva | $\sum_{i=1}^{k} \text{peso}_i > 0$ para toda tabla de aparición o eventos de zona. Ninguna tabla puede estar vacía o tener suma cero. | Fase 5 (Seed) y Fase 6 |
| **INV-02** | Rango de captura acotado | $0.05 \le \text{probFinal} \le 0.95$. Toda tirada de captura retiene un riesgo mínimo ($5\,\%$) y una oportunidad mínima ($5\,\%$). | Fase 7 (Combate) |
| **INV-03** | Rango de puntos de golpe | $0 \le \text{hpActual} \le \text{hpMaximo}$. Ningún cálculo de daño permite HP negativo ni curación por encima del máximo. | Fase 7 (Combate/Curación) |
| **INV-04** | Daño mínimo no nulo | $\text{danoFinal} \ge 1$. Todo ataque ejecutado que impacte inflige al menos 1 punto de daño, sin importar la defensa del rival. | Fase 7 (Combate) |
| **INV-05** | Progresión monótona creciente | $\text{xpRequerida}(n+1) > \text{xpRequerida}(n)$ para todo $n \ge 1$. Cada nivel exige estrictamente más XP acumulada que el anterior. | Fase 7 (Progresión) |
