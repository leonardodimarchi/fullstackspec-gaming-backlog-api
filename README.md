# Pós Graduação: Fullstack Development

Atividade Final - Projeto Fullstack

API de gaming backlog (estilo Backloggd) com NestJS, MongoDB e integração IGDB.

## Dupla

- Leonardo Dimarchi - 200109
- Luiz Toquetto - 200359

## Tecnologias

- NestJS 11
- MongoDB

## Configuração

```bash
npm install
cp .env.example .env
```

Preencha o `.env` (MongoDB, JWT, credenciais IGDB/Twitch). Inicie o MongoDB e rode:

```bash
npm run start:dev
```

A API sobe em `http://localhost:3000/api`.

## Autenticação

- Rotas públicas: `POST /api/auth/register`, `POST /api/auth/login`
- Demais rotas exigem header: `Authorization: Bearer <token>`
- Rotas de usuários (`/users`) e admin (`/admin`) exigem role **ADMIN**
- No primeiro startup, um admin é criado com `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `.env`

## Endpoints de autenticação

- `POST /api/auth/register` - registra usuário (role USER)
- `POST /api/auth/login` - autentica e retorna JWT

## Endpoints de jogos (IGDB)

- `GET /api/games/popular` - jogos populares (home)
- `GET /api/games` - lista/busca jogos (paginado)
- `GET /api/games/metadata/genres` - lista gêneros (filtro opcional `?q=`)
- `GET /api/games/metadata/platforms` - lista plataformas (filtro opcional `?q=`)
- `GET /api/games/:igdbId` - detalhe do jogo

### Filtros de jogos (`GET /api/games`)


| Query        | Descrição                                              |
| ------------ | ------------------------------------------------------ |
| `q`          | Busca por nome                                         |
| `page`       | Página (default 1)                                     |
| `limit`      | Itens por página (default 20, max 50)                  |
| `sort`       | `popularity`, `name`, `releaseDate`, `rating`, `hypes` |
| `sortOrder`  | `asc` ou `desc`                                        |
| `genreId`    | ID do gênero (IGDB)                                    |
| `platformId` | ID da plataforma (IGDB)                                |
| `year`       | Ano de lançamento                                      |
| `minRating`  | Rating mínimo (0–100)                                  |


## Endpoints de backlog (`user-games`)

- `GET /api/user-games/counts` - contagem por status (badges das tabs)
- `GET /api/user-games` - lista backlog do usuário autenticado
- `GET /api/user-games/:id` - busca entrada do backlog por id
- `POST /api/user-games` - adiciona jogo ao backlog (body: `{ "igdbId": number }`)
- `PATCH /api/user-games/:id` - atualiza parcialmente
- `DELETE /api/user-games/:id` - remove do backlog

### Status do backlog

- `PLAYING`
- `WANT_TO_PLAY_NEXT`
- `WATCH_LIST`
- `FINISHED`
- `ABANDONED`

### Filtros de backlog (`GET /api/user-games`)


| Query    | Descrição                     |
| -------- | ----------------------------- |
| `status` | Filtra por um status          |
| `page`   | Página (default 1)            |
| `limit`  | Itens por página (default 20) |


Ao adicionar um jogo, o status default é `WANT_TO_PLAY_NEXT`. Tempos esperados (`expectedTime`, `expectedTimeForAllContent`) vêm do IGDB e podem ser editados depois via `PATCH`. Não é possível trocar o jogo de uma entrada — remover e adicionar outro.

## Endpoints de usuários (Admin)

- `GET /api/users` - lista usuários
- `POST /api/users` - cria usuário
- `GET /api/users/:id` - busca usuário por id
- `PATCH /api/users/:id` - atualiza parcialmente
- `DELETE /api/users/:id` - remove usuário

## Endpoints de admin (Admin)

- `GET /api/admin/statistics` - estatísticas para dashboard

## Coleções MongoDB


| Coleção           | Descrição                                   |
| ----------------- | ------------------------------------------- |
| `users`           | Usuários e roles                            |
| `games`           | Cache de jogos IGDB (TTL 7 dias)            |
| `user_games`      | Backlog por usuário                         |
| `game_list_cache` | Cache de listas (ex.: popular, TTL 24h)     |
| `metadata_cache`  | Cache de gêneros e plataformas (TTL 7 dias) |


## Postman

Importe a collection: [postman/gaming-backlog-api.postman_collection.json](postman/gaming-backlog-api.postman_collection.json).