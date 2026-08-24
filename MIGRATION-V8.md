# Migración desde LINK CONTROL v8

La app nueva conserva la idea central de v8:

Cliente → Compromiso → Gesto/Paso → Evento → Google Calendar → cumplimiento.

`supabase-sales-os.sql` agrega el modelo de Sales OS.

Si ya tienes las tablas `clients`, `commitments` y `calendar_events` de v8:
1. Haz backup.
2. Ejecuta sólo las tablas nuevas que no existan.
3. Mantén `calendar_events` y adapta los campos si tu versión ya contiene producción real.
4. No borres datos de v8.

La app nueva usa `calendar_events` con la misma relación 360 y puede seguir usando `/api/calendar-gateway`.
