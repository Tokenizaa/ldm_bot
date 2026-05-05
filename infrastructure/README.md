# Infrastructure

## Redis (local)

Start Redis:

`docker compose -f infrastructure/docker/docker-compose.yml up -d`

Stop Redis:

`docker compose -f infrastructure/docker/docker-compose.yml down`

## Full stack (redis + api + workers)

Requires a `.env` file (or environment) with:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_KEY`
- `LOJA_DO_MECANICO_EMAIL`
- `LOJA_DO_MECANICO_PASSWORD`

Start:

`docker compose -f infrastructure/docker/docker-compose.full.yml up -d`

Stop:

`docker compose -f infrastructure/docker/docker-compose.full.yml down`
