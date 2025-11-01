## Índice

* [Visión general](#visión-general)
* [Arquitectura](#arquitectura)
* [Características clave](#características-clave)
* [Stack tecnológico](#stack-tecnológico)
* [Estructura de repositorios](#estructura-de-repositorios)
* [Puesta en marcha (local)](#puesta-en-marcha-local)
* [Variables de entorno](#variables-de-entorno)
* [Contratos de API (REST + SSE)](#contratos-de-api-rest--sse)
* [DTOs / Modelos de datos](#dtos--modelos-de-datos)
* [Métricas y observabilidad](#métricas-y-observabilidad)
* [Flujos principales](#flujos-principales)
* [Pruebas rápidas (curl)](#pruebas-rápidas-curl)
* [Despliegue y consideraciones](#despliegue-y-consideraciones)
* [Solución de problemas](#solución-de-problemas)
* [Trabajo futuro](#trabajo-futuro)
* [Licencia](#licencia)

---

## Visión general

El proyecto demuestra cómo **integrar paradigmas** (orientado a objetos, funcional y reactivo) para construir un sistema **en tiempo real**:

* **Backend**: expone endpoints REST, un canal **Server-Sent Events (SSE)** para “empujar” actualizaciones en vivo a los clientes, normaliza/valida la ingesta y publica eventos. Mantiene **métricas** de throughput y latencia.
* **Frontend**: consume el stream SSE y **renderiza el Leaderboard** con baja latencia; también consulta el endpoint de **métricas** y expone una página **Admin** para ingesta manual.

---

## Arquitectura

```
┌─────────────┐      SSE (event-stream)      ┌──────────────────────┐
│  Backend    │ ───────────────────────────▶ │  Frontend (React)    │
│  Node/TS    │                               │  Estado global       │
│  HTTP nativo│ ◀──── REST (JSON) ─────────── │  Reducer + Hooks     │
│  /ingest    │                               │  Leaderboard / Admin │
│  /api/*     │                               │  /metrics            │
│  /metrics   │                               └──────────────────────┘
└─────┬───────┘
      │  Métricas (TPS/latencias)
      ▼
 In-memory trackers
```

**Capas backend:**

* **Ruteo HTTP** (GET/POST) + middlewares (CORS, rate limit, sanitización).
* **Validadores & normalizadores** (p. ej., parseo de “1:21.345” a `lastLapMs`).
* **Servicios de dominio** (pilotos, muestras, leaderboard).
* **SSE Hub** (suscripción, heartbeats, broadcast).
* **Métricas** (TPS, latencias p50/p95).

**Capas frontend:**

* **API client** (REST + SSE).
* **Hooks** (`useRaceData`, `useEventSource`, `useMetrics`).
* **Estado global** (reducer + selectores).
* **UI** (Leaderboard, Métricas, Admin).

---

## Características clave

* ⚡ **Tiempo real con SSE** (sin polling): actualizaciones “push”.
* 🧠 **Modelo de dominio claro**: Pilotos, Muestras, Leaderboard.
* 🧰 **Validación y normalización** de payloads de ingesta.
* 📊 **Métricas** de rendimiento en vivo (TPS/latencias).
* 🛡️ **CORS, rate limit, sanitización de inputs**.
* 🧪 **Arquitectura desacoplada** → fácil de probar y extender.

---

## Stack tecnológico

**Backend**

* Node.js + TypeScript (HTTP nativo)
* SSE (EventSource)
* In-memory store + ring buffer
* Medición de latencias + TPS

**Frontend**

* React + TypeScript + Vite
* TailwindCSS (UI)
* Estado global con reducer + hooks personalizados
* EventSource (SSE) y fetch/JSON para REST

---

## Estructura de repositorios

```
f1-monitor-backend/
  src/
    config/           # env & constantes
    server/           # http, middlewares, router
    sse/              # hub suscripciones/broadcast
    domain/           # entidades & store en memoria
    services/         # lógica de aplicación
    pipeline/         # validaciones & normalizaciones
    infra/            # métricas, logging
    utils/            # helpers
  package.json
  tsconfig.json
  README.md

f1-dashboard-frontend/
  src/
    shared/
      api/            # clients REST/SSE
      hooks/          # useRaceData, useEventSource, useMetrics
      state/          # contexto + reducer + selectores
      types/          # DTOs/contratos
      config/         # env (VITE_*)
    features/
      dashboard/      # Leaderboard + componentes
      metrics/        # Panel de métricas
      admin/          # Ingesta manual (crear piloto / enviar muestra)
    app/              # router, layout, app shell
    components/       # UI básicos
  index.html
  vite.config.ts
  package.json
  tsconfig.json
  README.md
```

---

## Puesta en marcha (local)

### 1) Backend

```bash
cd f1-monitor-backend
pnpm i   # o npm i / yarn
cp .env.example .env
pnpm dev  # arranca en http://localhost:8080
```

`PORT=8080` por defecto.

### 2) Frontend

```bash
cd f1-dashboard-frontend
pnpm i   # o npm i / yarn
cp .env.example .env
pnpm dev  # arranca en http://localhost:5173 (Vite)
```

**Asegúrate** de que `VITE_API_URL` apunte al backend (ej. `http://localhost:8080`).

---

## Variables de entorno

### Backend (`f1-monitor-backend/.env`)

```ini
PORT=8080
CORS_ORIGIN=*                 # o https://tu-frontend.com
RATE_LIMIT_RPS=20
HISTORY_WINDOW_MS=300000      # 5 min
RING_BUFFER_CAPACITY=1000
METRICS_ENABLED=true
NODE_ENV=development
```

### Frontend (`f1-dashboard-frontend/.env`)

```ini
VITE_API_URL=http://localhost:8080          # base REST
# (opcional) si el SSE va en otra ruta/host:
# VITE_SSE_URL=http://localhost:8080/sse
# (opcional) si quieres separar la base de /ingest:
# VITE_INGEST_URL=http://localhost:8080
```

---

## Contratos de API (REST + SSE)

### Salud & Métricas

* **GET `/health`**

  * `200 { ok:true, data:{ status:'ok', ts:number, uptimeMs:number } }`

* **GET `/metrics`**

  * `200 { ok:true, data:{ tps:number, latency:{ mean:number, p50:number, p95:number, count:number } } }`

### SSE

* **GET `/sse`** → `text/event-stream`

  * Eventos:

    * `ping` (heartbeat)
    * `race-update` con `RaceSampleDTO` (ver [DTOs](#dtos--modelos-de-datos))

### Ingesta

* **POST `/ingest`**

  * **Body**:

    ```json
    {
      "pilotId": "ver33",
      "pilotName": "Max Verstappen",
      "team": "RedBull",
      "currentPosition": 1,
      "lastLapTime": "1:21.345",
      "anomalyDetected": false
    }
    ```
  * **Respuesta** `201 { ok:true, data: RaceSampleDTO }`
  * **Errores**: `422 VALIDATION_ERROR`, `429 RATE_LIMITED`, `400 BAD_REQUEST`

### API Pilotos & Datos

* **GET `/api/pilots[?team=Ferrari]`**

  * `200 { ok:true, data: PilotDTO[] }`

* **POST `/api/pilots`** (upsert)

  * **Body**: `PilotDTO`
  * `201 { ok:true, data: PilotDTO }`

* **GET `/api/pilots/latest?id=ver16`**

  * `200 { ok:true, data: RaceSampleDTO | null }`
  * `400` si falta `id`

* **GET `/api/pilots/recent?id=ver16&windowMs=300000`**

  * `200 { ok:true, data: RaceSampleDTO[] }`
  * `400` si faltan parámetros

> **Formato de error (todas las rutas):**
>
> ```json
> { "ok": false, "error": { "code": "BAD_REQUEST|NOT_FOUND|...", "message": "...", "details": {} } }
> ```

---

## DTOs / Modelos de datos

```ts
// Piloto
type PilotDTO = {
  id: string;           // ej "ver33"
  name: string;         // "Max Verstappen"
  team: string;         // "RedBull" | "Ferrari" | ...
};

// Muestra de carrera (normalizada)
type RaceSampleDTO = {
  pilotId: string;      // "ver33"
  position: number;     // 1..20
  lastLapMs: number;    // tiempo de vuelta en ms (normalizado)
  points: number;       // puntos según posición (25..1)
  anomaly: boolean;     // evento atípico
  ts: number;           // epoch ms (servidor)
};

// Leaderboard (agregado por piloto)
type LeaderboardRowDTO = {
  pilotId: string;
  pilotName: string;
  team: string;
  points: number;
  lastLapMs?: number;
  ts?: number;
};
```

**Normalización de tiempo**

* `lastLapTime` acepta `"M:SS.mmm"` (p. ej. `"1:21.345"`), `"SSS.mmm"` o milisegundos como string.
* El backend lo convierte a `lastLapMs: number`.

**Reglas de negocio**

* Puntos: `25, 18, 15, 12, 10, 8, 6, 4, 2, 1` para posiciones `1..10`.
* Leaderboard ordenado por `points` (desempate por `ts` más reciente).
* Ventana “recent” configurable por `windowMs`; si no se indica, usa el historial del buffer.

---

## Métricas y observabilidad

* **TPS (Throughput)**: solicitudes/s (ventana móvil).
* **Latencias**: `mean`, `p50`, `p95`, `count` (historial reciente).
* **Frontend** consulta `/metrics` cada N segundos y muestra panel con tarjetas.

Objetivo sugerido:

* p50 **< 100 ms**, p95 **< 300 ms** en LAN para endpoints simples.
* Reconexión automática de SSE con backoff.

---

## Flujos principales

### 1) Leaderboard en vivo (Frontend)

1. Carga inicial: `GET /api/pilots` + `GET /api/leaderboard`.
2. Suscripción: `GET /sse` (EventSource).
3. En cada `race-update`:

   * Reducer actualiza estado: últimas vueltas, puntos.
   * Reordenamiento por puntos sin recargar.

### 2) Ingesta manual (Admin)

1. Crear/actualizar piloto: `POST /api/pilots`.
2. Enviar evento: `POST /ingest`.
3. Backend valida + normaliza → genera `RaceSampleDTO` → broadcast `race-update`.
4. UI recibe evento y actualiza Leaderboard.

### 3) Métricas

1. Frontend “polling” a `GET /metrics` (p. ej., cada 3 s).
2. Muestra TPS y latencias (mean/p50/p95).

---

## Pruebas rápidas (curl)

```bash
# Salud
curl -s http://localhost:8080/health | jq

# Ingesta de muestra
curl -s -X POST http://localhost:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{"pilotId":"ver16","pilotName":"Charles Leclerc","team":"Ferrari","currentPosition":1,"lastLapTime":"1:21.000"}' | jq

# Última muestra del piloto
curl -s "http://localhost:8080/api/pilots/latest?id=ver16" | jq

# Muestras recientes (5 min)
curl -s "http://localhost:8080/api/pilots/recent?id=ver16&windowMs=300000" | jq

# Leaderboard
curl -s http://localhost:8080/api/leaderboard | jq

# Métricas
curl -s http://localhost:8080/metrics | jq
```

Para **SSE** desde terminal:

```bash
curl -N http://localhost:8080/sse
```

---

## Despliegue y consideraciones

* **CORS**: configura `CORS_ORIGIN` en backend para el dominio del frontend.
* **Proxies/CDN**: desactiva **buffering** para la ruta `/sse` (p. ej., `X-Accel-Buffering: no` en Nginx/Cloudflare).
* **Escalabilidad**:

  * Mantén `RING_BUFFER_CAPACITY` acorde al volumen de eventos.
  * Para múltiples instancias, publica SSE vía **pub/sub** (Redis) o usa **Sticky Sessions**.
* **Persistencia**: actual es **in-memory** (demo). Para producción, considera Redis/DB de series temporales.

---

## Solución de problemas

* **El punto de estado dice “Desconectado”**
  Verifica que `/sse` responde con `text/event-stream` y que el proxy no esté haciendo buffering. Revisa CORS.

* **No llegan eventos al Leaderboard**
  Prueba `/ingest` con `curl` y observa logs del backend. Verifica validación (`422`) y `team/position/lastLapTime`.

* **Métricas no cambian**
  Forza carga con varios `curl` a diferentes endpoints; recuerda que la UI hace polling cada N segundos.

* **CORS bloquea requests**
  Ajusta `CORS_ORIGIN` (backend) y asegúrate de usar URLs absolutas correctas en el frontend (`VITE_API_URL`, `VITE_SSE_URL`).
