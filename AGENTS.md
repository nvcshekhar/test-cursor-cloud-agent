# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout

- Branches that include the todo app have `package.json`, `src/`, and `public/` at the repo root (`cursor/create-node-todo-app-2044` and descendants). **`main`** may still be README-only until those changes are merged.

### Services

| Service | Required? | How to run |
|---------|-----------|------------|
| Todo API + static UI | Yes (on the todo branch) | `npm run dev` or `npm start` (default port **3000**, override with `PORT`) |

No database or Docker services. Todos persist in `data/todos.json` (created at runtime).

### Tooling

- **Node.js** ≥ 18 (VM provides Node 22 via nvm/exec-daemon).
- **Package manager:** npm (`package-lock.json` may be absent until first `npm install`).

### Install dependencies

When `package.json` is present at the repo root:

```bash
npm ci
```

**npm registry TLS:** In some Cloud Agent VMs, HTTPS to `registry.npmjs.org` fails with `ECONNRESET` / `SSL_ERROR_SYSCALL` while `github.com` still works. If `npm install` fails, retry later or use an alternate registry (e.g. `npm install --registry=https://registry.npmmirror.com`). Until `express` is installed, `npm start` will not run; core todo logic in `src/store.js` can still be exercised with Node directly.

### Lint / test / build

- **Lint:** Not configured in this repo.
- **Tests:** `npm test` runs `node --test test/` when a `test/` directory exists (not present on all branches).
- **Build:** None (plain Node, no compile step).

### Run (development)

Cloud Agent environments start the API automatically via `.cursor/start.sh` (`npm start` on port **3000**). For ad-hoc work:

```bash
npm run dev    # node --watch src/server.js
# or
npm start      # node src/server.js
```

Open `http://localhost:3000` for the UI. REST API under `/api/todos`.

### Quick smoke check (no Express)

If dependencies are not installed yet, verify persistence logic:

```bash
node -e "const s=require('./src/store'); console.log(s.createTodo({title:'smoke'}));"
```

### Update script scope

The VM **update script** only refreshes npm dependencies when `package.json` exists; it does not start servers or run migrations.
