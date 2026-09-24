# Documentation

| Document                        | Contents                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| [`architecture.md`](architecture.md) | Request lifecycle, rendering strategy, module responsibilities  |
| [`i18n-guide.md`](i18n-guide.md)     | Locale/message workflows, ICU patterns, RTL rules, pitfalls     |
| [`testing.md`](testing.md)           | Test pyramid, coverage map, how to extend, CI                   |
| [`trade-offs.md`](trade-offs.md)     | Decisions taken, alternatives rejected, revisit triggers        |
| [`explainers/`](explainers/)         | Line-by-line walkthroughs of the core modules                   |

Start with `architecture.md` for the mental model, then `explainers/` for the code-level
walkthrough of any module you are about to change.

## Explainers

| File | Walks through |
| ------------------------------------------------ | ------------------------------------------------------------ |
| [`explainers/i18n-core.md`](explainers/i18n-core.md) | `config.ts`, `routing.ts`, `navigation.ts`, `request.ts` |
| [`explainers/routing-and-rendering.md`](explainers/routing-and-rendering.md) | `proxy.ts`, layout, pages, 404, `global.d.ts` |
| [`explainers/seo.md`](explainers/seo.md) | `lib/seo.ts`, `sitemap.ts`, `robots.ts`, metadata wiring |
