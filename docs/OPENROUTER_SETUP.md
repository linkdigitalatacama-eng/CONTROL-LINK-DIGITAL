# LINK CONTROL · OpenRouter

## Qué ya está preparado

LINK CONTROL ya tiene un AI Gateway server-side en `/api/ai-gateway`. El frontend nunca debe recibir `OPENROUTER_API_KEY`.

## Configuración en Vercel

1. Entra al proyecto **control-link-digital** en Vercel.
2. Abre **Settings → Environment Variables**.
3. Crea:

```text
OPENROUTER_API_KEY=sk-or-v1-...
```

4. Aplica la variable a **Production**. Para pruebas, también puedes habilitar Preview/Development.
5. Guarda.
6. Haz un nuevo deployment. Vercel requiere redeploy para que una variable nueva quede disponible en el deployment. 

## Modelo

Opcionalmente configura:

```text
OPENROUTER_MODEL=tu-modelo-openrouter
DEFAULT_AI_PROVIDER=openrouter
```

Si no defines `OPENROUTER_MODEL`, LINK usa el modelo configurado por defecto en `api/ai-gateway.js`.

## Comprobación

Abre:

```text
/api/ai-gateway
```

Debe aparecer:

```json
"openrouter": {
  "configured": true
}
```

También puedes abrir **LINK CONTROL → Ecosistema** para ver el estado de OpenRouter sin exponer la clave.

## Seguridad

Nunca pegues la API key en `index.html`, `ecosystem-bridge.js`, GitHub, Supabase público ni en un mensaje de cliente. La clave debe vivir únicamente como secreto de servidor en Vercel.

## Flujo

```text
LINK Intelligence
      ↓
/api/ai-gateway
      ↓
OPENROUTER_API_KEY (Vercel)
      ↓
OpenRouter
      ↓
modelo elegido
      ↓
respuesta
```
