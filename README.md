# GRANA — Gestão de Gastos

App para o lab de CI/CD com GitHub Actions.

```
backend/   Node 24 + Express + SQLite embarcado   → imagem gastos-backend  (porta 3000, API em /api)
frontend/  React + Vite servido por Nginx          → imagem gastos-frontend (porta 80)
```

Rodar localmente: `docker compose up --build` → front em http://localhost:8080, API em http://localhost:3000/api/health.

## Build e publicação no Docker Hub

### 1. Criar o token no Docker Hub

Docker Hub → **Account settings → Personal access tokens** → gere um token com permissão *Read & Write*.

### 2. Cadastrar no GitHub

Repositório → **Settings → Secrets and variables → Actions**:

| Tipo     | Nome                 | Valor                                                    |
| -------- | -------------------- | -------------------------------------------------------- |
| Variable | `DOCKERHUB_USERNAME` | seu usuário do Docker Hub                                |
| Variable | `VITE_API_URL`       | endereço do backend, sem `/api` (ex.: `http://1.2.3.4:3000`). Vazio = mesma origem |
| Secret   | `DOCKERHUB_TOKEN`    | o token do passo 1                                       |

> `VITE_API_URL` é usada no **build** do front (fica gravada no JS), por isso é Variable e entra como `build-arg`.
> As envs do backend (`DB_PATH`, `PORT`, `CORS_ORIGIN`) são de **runtime** e só entram no `docker run` (passo de CD).

### 3. Completar os workflows

Preencha os `TODO` de `.github/workflows/backend.yml` e `frontend.yml`, seguindo as dicas em cada passo:

- **job `ci`**: checkout → setup do Node 24 → `npm ci` → `npm run lint` → `npm test` → `npm run build`
- **job `docker`** (roda só se o `ci` passar): `docker/login-action` → `docker/build-push-action`

### 4. Executar

**Actions → backend (ou frontend) → Run workflow**. Ao terminar, as imagens estarão em:

```
<usuario>/gastos-backend:latest
<usuario>/gastos-frontend:latest
```

### Testando a imagem publicada

```bash
docker run -d -p 3000:3000 -v gastos-data:/data <usuario>/gastos-backend:latest
docker run -d -p 8080:80 <usuario>/gastos-frontend:latest
```

## Deploy na VM (CD)

`deploy/docker-compose.yml` sobe Traefik + backend + frontend na VM, tudo no mesmo endereço:
`/api` vai para o backend e o resto para o frontend. Por isso, no deploy, o front é buildado **sem** `VITE_API_URL` (apague a variable).

1. VM Ubuntu com Docker, portas 22/80/443 liberadas e a pasta `/opt/grana` com dono `ubuntu`.
2. Elastic IP associado à VM (e, para o HTTPS, um hostname no No-IP apontando para ele).
3. Cadastre no GitHub:

| Tipo     | Nome              | Valor                                 |
| -------- | ----------------- | ------------------------------------- |
| Variable | `SSH_HOST`        | IP da VM (ou hostname do No-IP)       |
| Variable | `SSH_USER`        | `ubuntu`                              |
| Variable | `DOMAIN`          | IP da VM; para o HTTPS, o hostname    |
| Variable | `ACME_EMAIL`      | seu e-mail (para o HTTPS)             |
| Secret   | `SSH_PRIVATE_KEY` | conteúdo da chave `.pem` da VM        |

4. Complete os `TODO` de `deploy/docker-compose.yml` e `.github/workflows/deploy.yml`.
5. **Actions → deploy → Run workflow** e acesse `http://` + o valor de `DOMAIN`.
