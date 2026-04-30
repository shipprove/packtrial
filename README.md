# PackTrial

Test your package the way your users install it.

PackTrial is an early-stage ShipProve project for validating npm package artifacts before release. It is intended to create temporary synthetic consumer projects, install the package artifact, and verify that common consumer environments can install, import, build, and run it.

This repository is currently in the initial planning and documentation stage. The CLI and GitHub Action are not ready for production use yet.

## What PackTrial Checks

The MVP is focused on Node.js and TypeScript packages. Planned checks include:

- installing an `npm pack` tarball in generated consumer projects
- importing from an ESM consumer
- requiring from a CommonJS consumer when supported
- resolving types from a TypeScript consumer
- executing package `bin` entries for CLI packages
- running a small npm and pnpm package-manager matrix

PackTrial is not a SemVer decision tool and does not test real downstream repositories. In the ShipProve portfolio, SemVerdict handles public surface and SemVer risk, while EcoTrial is intended for real downstream project validation.

## Planned Usage

The exact interface may change before the first MVP release. The intended shape is:

```sh
packtrial run
```

With explicit options:

```sh
packtrial run --pm npm,pnpm --templates node-esm,node-cjs,ts-node16,cli-basic
```

As a GitHub Action, PackTrial is expected to run after checkout, dependency installation, and build:

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 20
  - run: npm ci
  - run: npm run build
  - uses: shipprove/packtrial@v1
    with:
      package-managers: npm,pnpm
```

## Support Target

The initial support target is intentionally narrow:

- Runtime: Node.js 20+
- Package managers: npm and pnpm
- Primary CI platform: GitHub Actions on Linux
- Ecosystem: JavaScript / TypeScript / npm packages

macOS may work during development, but full cross-platform support is not promised until it is tested and documented.

## Security

PackTrial runs package-manager commands and may execute package scripts or configured consumer commands. Treat package artifacts, install scripts, and consumer commands as untrusted code in CI.

Recommended defaults for public repositories:

- use `permissions: contents: read`
- do not pass secrets to workflows that run untrusted package scripts
- avoid `pull_request_target` for workflows that check out or execute attacker-controlled code
- prefer GitHub Step Summary output by default; make PR comments opt-in

## Privacy

PackTrial does not collect telemetry by default. It only accesses the network when required by configured operations, such as installing dependencies or resolving package metadata.

## Contributing

This project is under active MVP development. Please keep changes aligned with the MVP scope: package artifact validation in generated synthetic consumer projects for Node.js / TypeScript packages.

## License

Apache-2.0. See `LICENSE`.
