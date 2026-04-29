# Argus

Magento 2 frontend GraphQL debug CLI. The hundred-eyed watcher.

A terminal-resident diagnostic console for Magento 2 frontend GraphQL — interactive TUI plus a non-interactive `blitz` subcommand. Built on Ink 5, undici, zero filesystem persistence of secrets, and an outbound allow-list.

## Install

Requires Node.js ≥ 20. Installs two binaries: `argus` (long form) and `ag` (short alias).

The package is **not published to the public npm registry**. Pick whichever distribution route fits.

### From a tarball (zero infrastructure)

The maintainer runs `npm pack` and ships you `argus-cli-0.1.0.tgz`. You install it directly:

```sh
npm install -g ./argus-cli-0.1.0.tgz
argus --version
```

To upgrade, replace the tarball and re-run the same command. To remove: `npm uninstall -g argus-cli`.

### From GitHub

Once the repo is pushed:

```sh
npm install -g git+https://github.com/<owner>/argus.git
```

Re-run the same command to pull updates. For private repos you need an SSH key or a PAT in the URL.

### From source

```sh
git clone <repo-url> argus
cd argus
npm install
npm run build
npm link             # creates argus / ag symlinks
```

`npm unlink -g argus-cli` removes them.

## Quick start

```sh
argus                                       # interactive TUI
argus --endpoint https://shop.example/graphql
ARGUS_ADMIN_KEY=xxx argus blitz user@example.com default
```

Your admin API key is **never** stored in config. It's prompted interactively (TUI) or read from `ARGUS_ADMIN_KEY` (non-interactive).

## Configuration

Optional `~/.argusrc.json`:

```json
{
  "endpoint": "https://shop.example.com/graphql",
  "defaultStoreCode": "default",
  "timeoutMs": 10000
}
```

Resolution cascade for the endpoint: `--endpoint` flag → `ARGUS_ENDPOINT` env → config file → interactive prompt.

The config schema is strict — unknown keys (like tokens or admin keys) are rejected on load.

## Modes

### Blitzkrieg
Surface a customer's full frontend commerce state in four keystrokes after admin auth.
- prompts: email + store code
- acquires customer token via `generateCustomerTokenAsAdmin`
- fans out three parallel queries: customer + addresses, cart summary, cart detail
- renders three panels with badges, tables, totals
- aggregates phone numbers across all addresses, flags ones that look invalid
- live request log (operation · status · ms) shown during fetch; toggle on results with `l`

Footer actions on results:

```
r refresh    c cart-id    t token    l log    j dump    b back    q quit
```

`t` copies the live customer token to the clipboard for use elsewhere — straight from the session, never written to disk.

### Reserved (planned)
Cart Forge · Schema Diff · Mutation Lab · Cache Inspector · Order Probe · Wishlist Probe · Catalog Probe.

## Non-interactive

```sh
ARGUS_ADMIN_KEY=… argus blitz <email> <store-code>
```

- admin key is read from env only — refused on argv
- emits a single sanitised JSON object on stdout
- exit codes: `0` full success · `2` partial · `3` token failure · `4` admin auth failure · `1` other

## Security

1. Admin key entered via masked input; never logged, written, or re-rendered.
2. Customer token is mode-scoped and cleared on mode exit.
3. All snapshot dumps run through a redactor — admin keys, customer tokens, and any field matching `token | authorization | password | secret | api_key | bearer` are replaced with `«redacted»`.
4. Outbound network egress is restricted to the configured endpoint host via an undici dispatcher allow-list — verified by unit test.
5. No telemetry, no analytics, no update checks, no remote schema fetch.
6. On `SIGINT` / `SIGTERM` / clean exit, secret references are zeroized.

## Magento prerequisites

`generateCustomerTokenAsAdmin` is a B2B / EE-era mutation; if your storefront does not expose it natively, install the matching module before relying on the Blitzkrieg flow.

## Development

```sh
npm install
npm run dev          # tsup watch
npm run typecheck
npm test
npm run build
node dist/cli.js
```

Layout follows the PRD — operations under `src/graphql/operations/` are the only places GraphQL strings exist; everything else imports them.

### Cutting a release for distribution

```sh
npm version patch          # or minor / major — bumps package.json
npm run build
npm pack                   # → argus-cli-<version>.tgz
```

Hand the resulting `.tgz` off (Slack, AirDrop, email). Recipients install with `npm install -g <tarball>`.

## License

MIT.
