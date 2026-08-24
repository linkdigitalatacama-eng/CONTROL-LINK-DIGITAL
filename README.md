# LINK CONTROL · Sales OS

Sistema operativo comercial para LINK DIGITAL.

## Qué contiene

- Prospect Hunter: captura de comercios y Opportunity Score.
- Pipeline: Descubierto → Investigando → Preview → Contactado → Respondió → Reunión → Propuesta → Negociación → Ganado / Perdido.
- Preview Studio conceptual por prospecto.
- Clientes 360.
- Product Engine con protocolos para Website Starter, Website Pro, Web Comercial y E-commerce.
- Calendar Workspace: cliente → gesto → evento → Google Calendar.
- Intelligence Workspace por negocio: fuentes + memorias + consultas.
- AI Gateway con OpenRouter.
- MCP Connector para invocar LINK CONTROL desde ChatGPT.
- Supabase Auth + RLS + persistencia.
- Modo claro / gris / oscuro.
- Interfaz responsive con sidebar colapsable, drawers y modales suaves.

## Deploy en Vercel

1. Sube este directorio a GitHub.
2. Importa el repo en Vercel.
3. Agrega las variables de `.env.example`.
4. Ejecuta `supabase-sales-os.sql` en el SQL Editor de Supabase.
5. Vuelve a desplegar.
6. Abre la app y prueba Auth, IA y Calendar.

### Variables mínimas

```bash
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-5.5
REQUIRE_SUPABASE_AUTH=true
APP_URL=https://TU-APP.vercel.app
APP_TITLE=LINK CONTROL · Sales OS
MCP_ACCESS_TOKEN=un-token-largo-y-secreto
MCP_CLIENT_SECRET=otro-secreto-largo
```

Para Google Calendar:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_CALENDAR_ID=primary
CALENDAR_NOTIFY_EMAIL=linkdigitalatacama@gmail.com
```

## Conector ChatGPT

La app expone:

- MCP/JSON-RPC: `/api/mcp`
- SSE compatibility: `/sse`
- OAuth discovery: `/.well-known/oauth-authorization-server`
- OAuth authorize: `/oauth/authorize`
- OAuth token: `/oauth/token`
- Dynamic registration: `/oauth/register`

En ChatGPT, crea un complemento/conector personalizado apuntando al dominio de Vercel. Si el selector pide OAuth, usa el flujo OAuth incluido.

Herramientas MCP:

- `link_dashboard`
- `link_search_prospects`
- `link_get_client`
- `link_update_pipeline`
- `link_create_task`
- `link_add_memory`
- `link_add_source`
- `link_ask_client_ai`

### Nota de seguridad

La API key de OpenRouter y la service role key de Supabase son secretos de servidor. Nunca deben escribirse en `index.html`.

El conector permite operar el Sales OS desde ChatGPT; por eso `MCP_ACCESS_TOKEN` debe ser largo, privado y rotado si se comparte.

## Inteligencia por negocio

El modelo es:

```text
Cliente
 ├─ Business Master
 ├─ Fuentes
 ├─ Memorias
 ├─ Oportunidades
 ├─ Tareas
 └─ Calendario
       ↓
LINK Intelligence
       ↓
OpenRouter
```

La primera versión usa contexto estructurado de Supabase para respuestas fundamentadas. La arquitectura deja espacio para agregar embeddings/pgvector y recuperación semántica por chunks en una segunda iteración.

## Protocolo comercial

```text
Prospectar
 → Investigar
 → Score
 → Preview
 → Contactar
 → Responder
 → Reunión
 → Propuesta
 → Negociación
 → Ganado
 → Onboarding
 → Producción
 → Entrega
 → Medición
 → Expansión
```

La regla central:

**la demo demuestra; el pago autoriza la producción.**

No se debe presentar una demo como si fuera el sitio oficial del comercio ni publicar activos de terceros sin autorización.
