# Package Sus Detector: free browser demo

A free, no-signup, browser-only demo of [Package Sus Detector](https://apify.com/stormy251/package-sus-detector). Type one npm or PyPI name and it runs the same open-source (MIT) checks as the Actor, in your browser, against the public npm, PyPI, OSV and deps.dev APIs. No server, no tracking, nothing is downloaded or run.

**Risk signals, not accusations.** A `caution` or `suspicious` verdict means "look closer before installing". A clean result is not a guarantee of safety.

Need a whole `package.json`, `requirements.txt` or lockfile, a pull-request diff, or a CI gate? Use the paid Actor on Apify ($0.01 per package checked): https://apify.com/stormy251/package-sus-detector, or the [GitHub Action](https://github.com/stormy251/package-sus-detector-action).

## Differences from the Actor (honest list)
| Signal | Demo | Actor |
| --- | --- | --- |
| npm, PyPI, OSV, deps.dev | yes (CORS enabled on all four) | yes |
| PyPI weekly downloads (pypistats.org) | **skipped**: pypistats sends no CORS headers, so browsers block it | yes |
| endoflife.date release-line check | skipped | yes |
| Lockfiles, PR diff, CI gate | no | yes |

Because the PyPI download count is missing, low-usage signals for PyPI packages (and anything scored from them) can be lower in the demo than in the Actor. npm results match the Actor.

## Develop
```
npm install
scripts/sync-core.sh ../package-sus-detector   # re-copy core/ from the Actor repo and re-apply the 3 browser patches
npm run build                                   # bundles browser/app.js to app.js (committed; GitHub Pages serves the repo root)
npm test                                        # unit tests
npm run test:browser                            # real headless Chrome against live registries (needs network and Chrome; CHROME=/path)
TEST_URL=https://stormy251.github.io/package-sus-demo/ npm run test:browser   # test the deployed page
```
`core/` is a copy of the Actor's `src/` (v0.2) with three small patches: no `node:fs` typosquat-list loader, no `process.env` read, and no `.unref()` on a timer.

MIT licence.
