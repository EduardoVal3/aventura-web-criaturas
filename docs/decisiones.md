# Decisiones del proyecto

## D-01. API externa: Open5e v2, documento srd-2024
- Fuente y fecha de consulta:
  - `https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&ordering=challenge_rating_decimal&fields=key,name,type,challenge_rating,hit_points,armor_class` (7 de octubre de 2026)
  - `https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&name__icontains=wolf&fields=key,name,type,challenge_rating,hit_points,armor_class,speed_all,ability_scores,actions` (7 de octubre de 2026)
  - `https://api.open5e.com/v2/documents/?key=srd-2024` (7 de octubre de 2026)
  - `https://api.open5e.com/v2/licenses/` (7 de octubre de 2026)
- Total de criaturas en srd-2024: 331
- Campos confirmados:
  - `key` (cadena única con prefijo `srd-2024_`, p. ej. `srd-2024_wolf`)
  - `name` (cadena en inglés, p. ej. `Wolf`)
  - `type` (objeto `{ name: string, key: string }`, p. ej. `{ "name": "Beast", "key": "beast" }`)
  - `challenge_rating` (numérico entero o decimal, p. ej. `0.25`, `1`, `3`)
  - `armor_class` (entero)
  - `hit_points` (entero)
  - `speed_all` (objeto con `unit`, `walk`, `crawl`, `fly`, `swim`, `climb`, `burrow`, `hover`)
  - `ability_scores` (objeto con `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`)
  - `actions` (lista de acciones con `name`, `desc`, `action_type`, `attacks`)
  - `actions[].attacks` (lista de ataques con `name`, `attack_type`, `to_hit_mod`, `damage_die_count`, `damage_die_type` como `"D6"`, `damage_bonus`, `extra_damage_type`)
- Campos que llegan en null:
  - En ataques: `damage_type` (a menudo null; el tipo principal suele reportarse en `extra_damage_type`), `extra_damage_die_count`, `extra_damage_die_type`, `extra_damage_bonus`, `range` (en ataques cuerpo a cuerpo), `long_range` y `reach` (en ataques a distancia).
  - En acciones: `attacks` (llega vacío `[]` en acciones de soporte, cambio de forma o alientos de área como `Multiattack` o `Cold Breath`), `legendary_action_cost`, `limited_to_form`, `usage_limits`.
- Diferencias con el Anexo A.1 del plan: ninguna a nivel de esquema; la estructura de campos de `srd-2024` coincide con la prevista. Como particularidad técnica de la API, las peticiones deben especificar `format=json` o cabecera `Accept: application/json` para no recibir la interfaz navegable HTML de Django REST Framework.
- Licencia de srd-2024: Creative Commons Attribution 4.0 International (CC BY 4.0), verificada en `https://api.open5e.com/v2/documents/?key=srd-2024` y `https://dnd.wizards.com/resources/systems-reference-document`.
- Atribución exigida (texto literal):
  "This work includes material taken from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, and licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
  (Traducción de cortesía: "Esta obra incluye material tomado del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://dnd.wizards.com/resources/systems-reference-document y publicado bajo la licencia Creative Commons Attribution 4.0 International (CC BY 4.0) disponible en https://creativecommons.org/licenses/by/4.0/legalcode.")
- Límites de uso: no documentados; se hará una sola importación con `fields`.
