# Changelog

## [1.2.0](https://github.com/bruno00o/random-gif/compare/v1.1.1...v1.2.0) (2026-04-19)


### Features

* add 'Reveal word' message context menu to show the word behind any GIF ([6ab7269](https://github.com/bruno00o/random-gif/commit/6ab726900dba7d15fc52106989d5aa886a0c7c9e))
* add per-user history, stats and privacy commands backed by SQLite ([fa2f9db](https://github.com/bruno00o/random-gif/commit/fa2f9db29c686bec37c6eb6a42350283007a5e64))

## [1.1.1](https://github.com/bruno00o/random-gif/compare/v1.1.0...v1.1.1) (2026-04-19)


### Bug Fixes

* handle empty Tenor results and clamp numberOfResults to [1, 50] ([b838764](https://github.com/bruno00o/random-gif/commit/b838764eb344ebfee8e7f5a7b3183a3fd6bf7a5d))

## [1.1.0](https://github.com/bruno00o/random-gif/compare/v1.0.0...v1.1.0) (2026-04-18)


### Features

* migrate backend to TypeScript + ESM, swap Express for Hono, add Vitest ([e387f9a](https://github.com/bruno00o/random-gif/commit/e387f9ab3abc4081a9c2cc5320a7c0388bc0cb65))


### Bug Fixes

* bump deps to patch CVEs and upgrade to Node 24 ([0c7514a](https://github.com/bruno00o/random-gif/commit/0c7514a0198168195845d5ebbb2207b23fe0f166))
