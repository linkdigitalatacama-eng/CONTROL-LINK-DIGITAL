# LINK CONTROL · Sales OS

Sistema operativo comercial para LINK DIGITAL.

Este README cumple dos funciones: documentar la arquitectura y **protocolizar la atención de clientes**. La regla es simple: cada interacción debe mover al cliente hacia una decisión, una entrega o una relación mejor, y cada paso importante debe quedar registrado.

## Principios de atención LINK

1. **Escuchar antes de ofrecer.** Primero entender el problema, contexto, urgencia y resultado esperado.
2. **Hablar claro.** Explicar qué hacemos, qué no hacemos, cuánto cuesta y cuál es el siguiente paso.
3. **No prometer lo que no está confirmado.** Si un dato, integración, plazo o capacidad no está verificado, se dice explícitamente.
4. **Una conversación = un siguiente paso.** Nunca dejar una oportunidad sin responsable, estado o próxima acción.
5. **La evidencia manda.** Registrar mensajes relevantes, decisiones, archivos, propuestas, pagos y cambios de etapa.
6. **La demo demuestra; el pago autoriza la producción.** Una demo o preview no debe presentarse como el sitio oficial del cliente ni publicarse como activo de terceros sin autorización.
7. **Proteger la información.** Secretos, tokens, claves y credenciales son datos de servidor y nunca deben aparecer en el frontend, conversaciones públicas o commits.
8. **Cuidar la relación después del cierre.** La venta termina cuando el cliente obtiene valor, no cuando se emite una propuesta.

## Protocolo de atención por misión

Cada cliente recorre una misión comercial. Las seis etapas son:

```text
MARKETING
  ↓
VENTAS
  ↓
CIERRE
  ↓
ONBOARDING
  ↓
ENTREGA
  ↓
POSVENTA
```

### 01 · Marketing — encontrar la oportunidad

**Objetivo:** poner una solución frente a una persona o negocio con una necesidad real.

Checklist:
- Definir a quién queremos ayudar.
- Investigar el negocio y su contexto.
- Encontrar oportunidades reales.
- Priorizar una oportunidad.

**Regla de atención:** no optimizar una campaña antes de validar que existe interés o problema.

### 02 · Ventas — convertir interés en conversación

**Objetivo:** entender antes de presentar.

Checklist:
- Contactar al prospecto correcto.
- Hacer preguntas de diagnóstico.
- Identificar problema, impacto, urgencia y presupuesto cuando corresponda.
- Conseguir un siguiente compromiso: llamada, reunión, propuesta o información.

**Regla de atención:** preguntar antes de explicar.

### 03 · Cierre — transformar oportunidad en decisión

**Objetivo:** convertir claridad en una decisión explícita.

Checklist:
- Confirmar alcance.
- Confirmar valor y condiciones.
- Presentar propuesta clara.
- Resolver objeciones con información verificable.
- Definir fecha o condición de decisión.

**Regla de atención:** claridad antes que presión.

### 04 · Onboarding — preparar el terreno

**Objetivo:** evitar retrabajo y comenzar con información suficiente.

Checklist:
- Confirmar objetivos y entregables.
- Recibir materiales y accesos necesarios.
- Definir responsables y canal de comunicación.
- Registrar fechas y criterios de éxito.

**Regla de atención:** no avanzar con información crítica pendiente.

### 05 · Entrega — demostrar valor

**Objetivo:** producir lo acordado y hacer visible el resultado.

Checklist:
- Completar el entregable principal.
- Revisar con el cliente.
- Registrar cambios, pendientes y aprobación.
- Dejar claro qué cambió y qué sigue.

**Regla de atención:** entregar evidencia, no solamente trabajo.

### 06 · Posventa — convertir entrega en relación

**Objetivo:** comprobar resultado, satisfacción y siguiente necesidad real.

Checklist:
- Preguntar por resultado y satisfacción.
- Registrar mejoras o problemas.
- Resolver pendientes.
- Programar seguimiento.
- Detectar una nueva oportunidad solo cuando exista una necesidad real.

**Regla de atención:** el siguiente negocio nace del valor entregado.

## Guion operativo de cada conversación

Antes de responder:

```text
1. ¿Quién es el cliente/prospecto?
2. ¿En qué etapa está?
3. ¿Qué necesita ahora?
4. ¿Qué información está confirmada?
5. ¿Qué falta preguntar o verificar?
6. ¿Cuál es el siguiente paso concreto?
7. ¿Dónde queda registrado?
```

Después de responder:

```text
CONTACTO
 → CONTEXTO
 → NECESIDAD
 → PROPUESTA/ACCIÓN
 → COMPROMISO
 → FECHA
 → REGISTRO
```

## Protocolo de escalamiento

No improvisar cuando ocurra alguno de estos casos:

- Solicitud fuera del alcance acordado.
- Problema de seguridad, credenciales o acceso.
- Reclamo de facturación o pago.
- Cambio importante de alcance.
- Incumplimiento o retraso.
- Información legal, contractual o sensible que requiera revisión.
- Integración que todavía no haya sido probada.

En esos casos: **pausar la promesa, registrar el caso, explicar lo que sí sabemos y escalar al responsable.**

## Qué debe registrar LINK CONTROL

Cada oportunidad debería poder responder:

```text
Cliente
 ├─ Contacto
 ├─ Fuente
 ├─ Etapa
 ├─ Necesidad
 ├─ Oportunidad
 ├─ Próxima acción
 ├─ Responsable
 ├─ Fechas
 ├─ Propuesta
 ├─ Pagos
 ├─ Conversaciones
 ├─ Entrega
 └─ Posventa
```

Los cambios de etapa deben conservar historial. El pipeline original ya utiliza `stage_events` como fuente de evolución y de futuros dashboards de conversión y cuellos de botella.

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

## LINK Gateway

Gateway es la capa de conexiones de LINK. Las aplicaciones externas deben entrar por adaptadores y convertirse al protocolo interno antes de tocar Sales OS, Payments o CRM.

```text
Telegram / WhatsApp / Web / API
              ↓
        LINK GATEWAY
              ↓
        LINK PROTOCOL
              ↓
   Sales OS / Payments / CRM
              ↓
           Supabase
```

Regla: **Gateway no debe conocer la lógica comercial de Sales OS.** Gateway transporta, autentica, normaliza, registra y enruta eventos.

## LINK Payments

Payments es un módulo independiente de los proveedores de pago.

```text
Sales OS
   ↓
LINK Payments
   ↓
Payment Provider (ej. Stripe)
```

Esto permite reutilizar la arquitectura de cobro en otras aplicaciones sin copiar la lógica comercial.

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

## Conector ChatGPT

La app expone:

- MCP/JSON-RPC: `/api/mcp`
- SSE compatibility: `/sse`
- OAuth discovery: `/.well-known/oauth-authorization-server`
- OAuth authorize: `/oauth/authorize`
- OAuth token: `/oauth/token`
- Dynamic registration: `/oauth/register`

Herramientas MCP actuales:

- `link_dashboard`
- `link_search_prospects`
- `link_get_client`
- `link_update_pipeline`
- `link_create_task`
- `link_add_memory`
- `link_add_source`
- `link_ask_client_ai`

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` es exclusivamente servidor.
- `OPENROUTER_API_KEY` es exclusivamente servidor.
- Tokens de Gateway y proveedores nunca se escriben en `index.html`.
- RLS debe proteger los datos por organización/rol antes de exponer operaciones multiusuario.
- Los eventos importantes deben quedar auditables.
- `MCP_ACCESS_TOKEN` y `MCP_CLIENT_SECRET` deben ser secretos largos y rotarse si se comparten.

## Deploy

1. GitHub contiene el código fuente.
2. Vercel ejecuta y publica la aplicación.
3. Supabase contiene datos, Auth, RLS y servicios backend.
4. Los secretos se configuran como variables de entorno en Vercel.
5. Antes de desplegar un cambio, probar el flujo existente y evitar reemplazos destructivos.

## Regla de evolución: NO ROMPER LO QUE FUNCIONA

Antes de modificar un módulo existente:

```text
LEER
 → ENTENDER
 → AISLAR EL CAMBIO
 → IMPLEMENTAR
 → PROBAR EL FLUJO EXISTENTE
 → DESPLEGAR
 → VERIFICAR
```

Preferir cambios aditivos y módulos independientes. No reemplazar `index.html`, APIs, tablas o integraciones existentes si pueden extenderse de forma segura.

## Roadmap

```text
Foundation
   ↓
LINK Gateway
   ↓
Sales OS
   ↓
LINK Payments
   ↓
Automations
   ↓
AI / MCP
```

La visión es que una nueva aplicación pueda reutilizar los módulos LINK sin reconstruir toda la plataforma.
