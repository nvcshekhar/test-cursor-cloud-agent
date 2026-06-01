# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout

- **`main`** contains only `README.md` (placeholder). There is no application, lockfile, or test suite on this branch.
- The runnable **Node.js todo app** lives on **`cursor/create-node-todo-app-2044`** (`package.json`, `src/`, `public/`). Check out that branch before running the app or installing dependencies.

### Services

| Service | Required? | How to run |
|---------|-----------|------------|
| Todo API + static UI | Yes (on the todo branch) | `npm run dev` or `npm start` (default port **3000**, override with `PORT`) |

No database or Docker services. Todos persist in `data/todos.json` (created at runtime).

### Tooling

- **Node.js** ≥ 18 (VM provides Node 22 via nvm/exec-daemon).
- **Package manager:** npm (`package-lock.json` may be absent until first `npm install`).

### Install dependencies

From the todo branch:

```bash
git checkout cursor/create-node-todo-app-2044
npm install
```

**npm registry TLS:** In some Cloud Agent VMs, HTTPS to `registry.npmjs.org` fails with `ECONNRESET` / `SSL_ERROR_SYSCALL` while `github.com` still works. If `npm install` fails, retry later or use an alternate registry (e.g. `npm install --registry=https://registry.npmmirror.com`). Until `express` is installed, `npm start` will not run; core todo logic in `src/store.js` can still be exercised with Node directly.

### Lint / test / build

- **Lint:** Not configured in this repo.
- **Tests:** `npm test` runs `node --test test/` when a `test/` directory exists (not present on all branches).
- **Build:** None (plain Node, no compile step).

### Run (development)

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
