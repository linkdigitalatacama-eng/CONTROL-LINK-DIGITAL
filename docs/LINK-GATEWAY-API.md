# LINK Gateway API · events:v1

## Propósito

LINK Gateway es la capa común para conectar websites, ecommerce, formularios, bots y automatizaciones con Sales OS.

```text
APP → X-LINK-API-Key → GATEWAY → VALIDACIÓN → SUPABASE → SALES OS / AI → ACCIÓN
```

## Crear una API

1. Inicia sesión en LINK CONTROL.
2. Abre `/gateway.html`.
3. En **Generador de API**, escribe el nombre de la aplicación.
4. Genera la API.
5. Guarda la clave completa inmediatamente.

La clave completa se entrega una sola vez. En Supabase se guarda solamente el hash SHA-256, prefijo, propietario, permisos y estado.

## Enviar un evento

```http
POST /api/gateway?action=event
X-LINK-API-Key: lk_live_...
X-LINK-Idempotency-Key: pedido-123
Content-Type: application/json
```

```json
{
  "event": "lead.created",
  "source": "website",
  "external_id": "lead-123",
  "payload": {
    "name": "Cliente",
    "email": "cliente@example.com"
  }
}
```

Respuesta aceptada:

```json
{
  "ok": true,
  "duplicate": false,
  "event_id": "...",
  "owner_id": "..."
}
```

Si se repite el mismo `X-LINK-Idempotency-Key`, LINK devuelve el evento existente en vez de crear otro.

## Eventos recomendados

- `lead.created`
- `form.submitted`
- `message.received`
- `appointment.booked`
- `payment.completed`
- `website.published`
- `mission.completed`
- `customer.created`

## Supabase

Ejecutar una vez `supabase-gateway-api.sql` en el SQL Editor del proyecto. La migración crea:

- `gateway_api_keys`
- `gateway_events`
- RLS para administración por usuario
- `gateway_auth_api_key()`
- `gateway_revoke_api_key()`
- `gateway_record_api_event()`

No se debe guardar una API key completa en `gateway_api_keys`.
