# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.16.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.15.0...microlink.io%400.16.0) (2026-09-20)

### Features

* **core:** ship puppeteer-core types ([#67](https://github.com/microlinkhq/microlink/issues/67)) ([0f1dbdc](https://github.com/microlinkhq/microlink/commit/0f1dbdc8af5ad8a88b30f7b25b9d0264f47106c7))

## [0.15.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.14.0...microlink.io%400.15.0) (2026-09-20)

### Features

* **core:** re-export puppeteer Page types ([#66](https://github.com/microlinkhq/microlink/issues/66)) ([1d408a9](https://github.com/microlinkhq/microlink/commit/1d408a968c2ad8cc27d2b670a543ec41efd0f9cd))

## [0.14.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.13.1...microlink.io%400.14.0) (2026-09-20)

### Features

* **core:** type page.metadata and page.extract ([#65](https://github.com/microlinkhq/microlink/issues/65)) ([c12d8bf](https://github.com/microlinkhq/microlink/commit/c12d8bf1caa995dd1a24518867e1a63f71c0619d))

## [0.13.1](https://github.com/microlinkhq/microlink/compare/microlink.io%400.13.0...microlink.io%400.13.1) (2026-09-17)

**Note:** Version bump only for package microlink.io

## [0.13.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.12.0...microlink.io%400.13.0) (2026-09-17)

### Features

* expose product docs through MCP ([#60](https://github.com/microlinkhq/microlink/issues/60)) ([cb414bb](https://github.com/microlinkhq/microlink/commit/cb414bb2ceae26abe59416bb97b4719a87e71d45))

## [0.12.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.11.0...microlink.io%400.12.0) (2026-09-17)

### Features

* **cli:** add buy command ([#59](https://github.com/microlinkhq/microlink/issues/59)) ([61ce1ec](https://github.com/microlinkhq/microlink/commit/61ce1ec519f4bb01717212d6a877f49bfb3fd834))

## [0.11.0](https://github.com/microlinkhq/microlink/compare/microlink.io%400.10.5...microlink.io%400.11.0) (2026-09-17)

### Features

* **function:** type page, url, and headers on function args ([#62](https://github.com/microlinkhq/microlink/issues/62)) ([de12223](https://github.com/microlinkhq/microlink/commit/de12223fb26618849f99271ee545dff79be4352c))

## [0.10.5](https://github.com/microlinkhq/microlink/compare/microlink.io%400.10.4...microlink.io%400.10.5) (2026-09-16)

**Note:** Version bump only for package microlink.io

## [0.10.4](https://github.com/microlinkhq/microlink/compare/microlink.io%400.10.3...microlink.io%400.10.4) (2026-09-13)

### Bug Fixes

* **core:** respect an explicit meta option in extract ([#50](https://github.com/microlinkhq/microlink/issues/50)) ([8cf3372](https://github.com/microlinkhq/microlink/commit/8cf33727a8be8cf425a8450f1825b4eaa03369a0))

## [0.10.3](https://github.com/microlinkhq/microlink/compare/microlink.io%400.10.2...microlink.io%400.10.3) (2026-09-12)

### Bug Fixes

* **core:** markdown, html and text return string | null ([#48](https://github.com/microlinkhq/microlink/issues/48)) ([f1792c2](https://github.com/microlinkhq/microlink/commit/f1792c2558271646f3a6bcb7de3da3449af221cb))

## [0.10.2](https://github.com/microlinkhq/microlink/compare/microlink.io%400.10.1...microlink.io%400.10.2) (2026-09-12)

### Bug Fixes

* **core:** logo, video and audio return Asset | null ([#46](https://github.com/microlinkhq/microlink/issues/46)) ([62c7d8b](https://github.com/microlinkhq/microlink/commit/62c7d8b5af06123521fb50a398724768bf034940))

## [0.10.1](https://github.com/microlinkhq/microlink/compare/microlink.io%400.10.0...microlink.io%400.10.1) (2026-09-11)

**Note:** Version bump only for package microlink.io

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
