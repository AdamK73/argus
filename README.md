# Argus

Magento 2 frontend GraphQL debug CLI. The hundred-eyed watcher.

In four keystrokes after admin auth, surface a customer's full frontend commerce state — addresses, phone numbers, cart, totals, payment, shipping — in a clean terminal UI. No browser, no Postman.

Default endpoint baked in: **`https://gymbeam.sk/graphql`**.

---

## Install

Requires Node 20+. Pick the line that matches your situation, paste it, done.

### Option A — install from the tarball URL (recommended)

```sh
npm install -g https://github.com/AdamK73/argus/raw/main/argus-cli-0.1.0.tgz
```

Skips the git clone, skips devDependencies, just downloads ~17 KB and symlinks the binary.

### Option B — install from the git repo

```sh
npm install -g --omit=dev github:AdamK73/argus
```

The `--omit=dev` is important — without it npm tries to install build tooling (`tsup`, `vitest`) and may fail on machines that don't have a clean Node toolchain.

### Verify

```sh
argus --version            # → 0.1.0
ag --version               # short alias
```

### Uninstall

```sh
npm uninstall -g argus-cli
```

---

## Run

```sh
argus
```

That's it. The endpoint defaults to gymbeam.sk, so you'll go straight to the admin-key prompt. From there:

1. paste your admin API token (input is masked)
2. press `↵` to validate
3. select **Blitzkrieg** from the menu
4. type the customer's email, press `↵`
5. accept the default store code (just press `↵`) or type one

You'll see the customer's data, addresses, phone numbers, full cart, totals, and a live log of every GraphQL call.

---

## Keys on the results view

| key | action |
|---|---|
| `r` | refresh — re-run the snapshot |
| `c` | copy cart-id to clipboard |
| `t` | copy customer token to clipboard |
| `l` | toggle the request log |
| `j` | dump sanitised JSON to `./argus-snapshots/` |
| `b` | back to menu |
| `q` | quit |

Tokens and admin keys are scrubbed from `j` dumps — only what's safe to share lands on disk.

---

## Override the endpoint

Resolution order (first hit wins):

1. `argus --endpoint https://other.tld/graphql` — per-invocation
2. `ARGUS_ENDPOINT=https://other.tld/graphql argus` — per-shell
3. `~/.argusrc.json`:
   ```json
   { "endpoint": "https://other.tld/graphql", "defaultStoreCode": "uk", "timeoutMs": 10000 }
   ```
4. **built-in default — gymbeam.sk** (you don't need any of the above for the common case)

The rc file's schema is strict: unknown keys (admin tokens, secrets) are refused.

---

## Non-interactive (scripts, CI)

```sh
ARGUS_ADMIN_KEY=xxxxx argus blitz user@example.com default
```

Emits one sanitised JSON line on stdout. Exit codes:

| code | meaning |
|---|---|
| `0` | full success |
| `2` | partial — at least one panel errored |
| `3` | customer token acquisition failed |
| `4` | admin auth failed |
| `1` | anything else |

`ARGUS_ADMIN_KEY` is read from env only — argv is refused so it never lands in shell history or process listings.

---

## Update

```sh
npm install -g https://github.com/AdamK73/argus/raw/main/argus-cli-0.1.0.tgz
```

Same one-liner. npm replaces the existing install.

---

## Security

- Admin key never written to disk, log, or scrollback. Masked on input.
- Customer token is session-scoped and zeroized on mode exit / `SIGINT` / `SIGTERM`.
- Snapshot dumps run through a redactor — keys, tokens, and any `token | authorization | password | secret | api_key | bearer` field are replaced with `«redacted»`.
- Outbound network egress restricted to the configured endpoint host via an `undici` allow-list dispatcher (verified by unit test).
- No telemetry, no analytics, no remote schema fetch, no update check.

---

## For maintainers

### Develop

```sh
npm install
npm run dev          # tsup watch
npm run typecheck
npm test
npm run build
node dist/cli.js
```

GraphQL operation strings live only in `src/graphql/operations/*` and are imported elsewhere — never inlined.

### Cut a release for users

```sh
npm version patch         # bumps package.json
npm run build             # refresh dist/
npm pack                  # → argus-cli-<version>.tgz
git add dist argus-cli-*.tgz package.json
git commit -m "release vX.Y.Z"
git push
```

Both `dist/` and the latest tarball are committed on `main` so the install URLs in this README keep working without any release infrastructure.

If you bump the version number in `package.json`, rename the tarball references in the install commands above to match — or just keep the filename versionless if you'd rather not edit the README on every bump.

---

## License

MIT.
