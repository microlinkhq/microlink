# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.10.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.9.2...microlink.io%400.10.0) (2026-09-08)

### Features

* **cli:** add <product> docs ([#37](https://github.com/microlinkhq/microlink/issues/37)) ([f3bd9e0](https://github.com/microlinkhq/microlink/commit/f3bd9e059a776be72e34ee5940fde7a4c35fe7ac))

## [0.9.2](https://github.com/microlinkhq/microlink/compare/microlink.io%400.9.1...microlink.io%400.9.2) (2026-09-08)

### Bug Fixes

* **cli:** read x-content-length when Content-Length is missing ([#36](https://github.com/microlinkhq/microlink/issues/36)) ([8108df7](https://github.com/microlinkhq/microlink/commit/8108df74ac7fc2eff58e0126a578eb85b399c625))

## [0.9.1](https://github.com/microlinkhq/microlink/compare/microlink.io%400.9.0...microlink.io%400.9.1) (2026-09-08)

**Note:** Version bump only for package microlink.io

## [0.9.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.8.0...microlink.io%400.9.0) (2026-09-08)

### ⚠ BREAKING CHANGES

* `microlink.run()` and `microlink run` are gone.
  Use `microlink.function()` / `microlink function`.

### Features

* rename run to function ([#34](https://github.com/microlinkhq/microlink/issues/34))

## [0.8.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.7.0...microlink.io%400.8.0) (2026-09-08)

### Features

* **cli:** add help command ([#33](https://github.com/microlinkhq/microlink/issues/33)) ([d673f8e](https://github.com/microlinkhq/microlink/commit/d673f8ec819b9ffc4d206734a63c71dfa8a8f2ac))

## [0.7.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.6.0...microlink.io%400.7.0) (2026-09-07)

### Features

* **cli:** export run() for embedding ([#32](https://github.com/microlinkhq/microlink/issues/32)) ([0c40c82](https://github.com/microlinkhq/microlink/commit/0c40c82863562a95b23447f4daf0458b4295bae4))

### Bug Fixes

* **cli:** space key picker from opening url ([#31](https://github.com/microlinkhq/microlink/issues/31)) ([1c13953](https://github.com/microlinkhq/microlink/commit/1c1395312f4cf8bc3b93e045fa884d1ebaccba82))

## [0.6.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.5.2...microlink.io%400.6.0) (2026-08-31)

### Features

* type proxy as url or location ([#30](https://github.com/microlinkhq/microlink/issues/30)) ([a39ab0f](https://github.com/microlinkhq/microlink/commit/a39ab0f128ea285be45834d60071ddd08e862bc0))

## [0.5.2](https://github.com/microlinkhq/microlink/compare/microlink.io%400.5.1...microlink.io%400.5.2) (2026-08-27)

### Bug Fixes

* **cli:** report search footer size ([#29](https://github.com/microlinkhq/microlink/issues/29)) ([b0d6bfb](https://github.com/microlinkhq/microlink/commit/b0d6bfb5949095f51e292dd1b0c721786ddb0425))

## [0.5.1](https://github.com/microlinkhq/microlink/compare/microlink.io%400.5.0...microlink.io%400.5.1) (2026-08-25)

### Bug Fixes

* **cli:** accept urls without a protocol ([#28](https://github.com/microlinkhq/microlink/issues/28)) ([6a4bba3](https://github.com/microlinkhq/microlink/commit/6a4bba3dfd41dda8d9861067ef447cede43f0cf3))

## [0.5.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.4.0...microlink.io%400.5.0) (2026-08-25)

### Features

* **search:** expose page to match the API ([#24](https://github.com/microlinkhq/microlink/issues/24)) ([a6da33a](https://github.com/microlinkhq/microlink/commit/a6da33a9538dbeaf7eb168126a34818c7e5ed782))

### Bug Fixes

* **cli:** fail cleanly on invalid extract --data ([#25](https://github.com/microlinkhq/microlink/issues/25)) ([c8ac889](https://github.com/microlinkhq/microlink/commit/c8ac889534815ab3ea7b0bc2cc966e6e05ed1469))

## [0.4.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.3.0...microlink.io%400.4.0) (2026-08-25)

### Features

* **cli:** add login and logout ([#23](https://github.com/microlinkhq/microlink/issues/23)) ([352fe0e](https://github.com/microlinkhq/microlink/commit/352fe0e5d7f54f5858212dc64e9afc91d89b76af))

## [0.3.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.2.3...microlink.io%400.3.0) (2026-08-25)

### Features

* **cli:** add search --html and --markdown ([#22](https://github.com/microlinkhq/microlink/issues/22)) ([9f6070a](https://github.com/microlinkhq/microlink/commit/9f6070a1a5d786cbc2aab1b8b99a8ccd196a2e8d))

## [0.2.3](https://github.com/microlinkhq/microlink/compare/microlink.io%400.2.2...microlink.io%400.2.3) (2026-08-24)

### Bug Fixes

* report the real reason behind a failed request ([#21](https://github.com/microlinkhq/microlink/issues/21)) ([5c7e618](https://github.com/microlinkhq/microlink/commit/5c7e61885425321e11a9c089ac879a4a69f74a63))

## [0.2.2](https://github.com/microlinkhq/microlink/compare/microlink.io%400.2.1...microlink.io%400.2.2) (2026-08-23)

### Bug Fixes

* **core:** make npx microlink.io run the cli ([#20](https://github.com/microlinkhq/microlink/issues/20)) ([0cff8ec](https://github.com/microlinkhq/microlink/commit/0cff8ecb1639452930f5817fdc13fd2f05f153a3))

## [0.2.1](https://github.com/microlinkhq/microlink/compare/microlink.io%400.2.0...microlink.io%400.2.1) (2026-08-23)

**Note:** Version bump only for package microlink.io

## [0.2.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.1.1...microlink.io%400.2.0) (2026-08-23)

### Features

* **cli:** add --endpoint and HTTP headers ([#16](https://github.com/microlinkhq/microlink/issues/16)) ([8a28bea](https://github.com/microlinkhq/microlink/commit/8a28bea3b92ffb06d5f97d2bf0100ba1e1844de3))

## [0.1.1](https://github.com/microlinkhq/microlink/compare/microlink.io%400.1.0...microlink.io%400.1.1) (2026-08-20)

**Note:** Version bump only for package microlink.io

## [0.1.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.0.5...microlink.io%400.1.0) (2026-08-19)

### Features

* **cli:** treat bare url as metadata ([#10](https://github.com/microlinkhq/microlink/issues/10)) ([d179741](https://github.com/microlinkhq/microlink/commit/d1797419694d88df2f90c6f41eca17128b915674))

## [0.0.5](https://github.com/microlinkhq/microlink/compare/microlink.io%400.0.4...microlink.io%400.0.5) (2026-08-05)

### Bug Fixes

* **mcp:** expose shared API query params on all URL tools ([#8](https://github.com/microlinkhq/microlink/issues/8)) ([7a7ccb0](https://github.com/microlinkhq/microlink/commit/7a7ccb064b63fcf6c6f7745544d90f4c5295d3bf))

## [0.0.4](https://github.com/microlinkhq/microlink/compare/microlink.io%400.0.3...microlink.io%400.0.4) (2026-08-05)

**Note:** Version bump only for package microlink.io

## [0.0.3](https://github.com/microlinkhq/microlink/compare/microlink.io%400.0.2...microlink.io%400.0.3) (2026-07-29)

**Note:** Version bump only for package microlink.io

## [0.0.2](https://github.com/microlinkhq/microlink/compare/microlink.io%400.0.1...microlink.io%400.0.2) (2026-07-23)

**Note:** Version bump only for package microlink.io

## 0.0.1 (2026-07-07)

**Note:** Version bump only for package microlink.io
