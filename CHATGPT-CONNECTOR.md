# LINK CONTROL · Conector de ChatGPT

## Endpoint principal

`https://control-link-digital.vercel.app/api/mcp`

## Compatibilidad SSE

`https://control-link-digital.vercel.app/api/sse`

## OAuth discovery

`https://control-link-digital.vercel.app/.well-known/oauth-authorization-server`

## Configuración desde LINK CONTROL

1. Abre **Configuración → ChatGPT · Complemento**.
2. Pulsa **Abrir configuración de ChatGPT**.
3. Crea el conector con nombre `LINK CONTROL · Sales OS`.
4. Pega la URL del servidor MCP mostrada por el dashboard.
5. Usa OAuth cuando ChatGPT solicite autenticación.
6. Completa la autorización y vuelve al dashboard.
7. Usa **Comprobar conexión** para validar el discovery OAuth.

## Herramientas MCP expuestas

- `link_dashboard`
- `link_search_prospects`
- `link_get_client`
- `link_update_pipeline`
- `link_create_task`
- `link_add_memory`
- `link_add_source`
- `link_ask_client_ai`

Las credenciales secretas permanecen en Vercel. No deben copiarse al frontend ni al repositorio.
