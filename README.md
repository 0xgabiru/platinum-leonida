# Platinum Leonida — The Complete GTA VI Trophy Guide &amp; Tracker

![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/0xgabiru/platinum-leonida/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/0xgabiru/platinum-leonida/reward.svg)

An entry for [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

All 55 GTA VI trophies with cited guides, count trackers, a platinum roadmap and an honest missables page. Every claim shows its source — numbered sources with read dates, disputes shown in two versions with an "OUR CALL", and confidence badges on every guide step. Five trophies are marked unconfirmed rather than guessed.

## Run it

```sh
node main.ts            # stages app/ + screenshots/ to /output, writes dossier.json
node serve.ts           # serves app/ on http://localhost:8080
```

Open `app/index.html` in a browser. Progress is stored locally; export/import from the header. No network, no build step, vanilla ES modules.

## What is inside

- `app/index.html` — shell + tab routing (Tracker, Roadmap, Missables, Sources)
- `app/css/base.css` — "ledger gold" light theme
- `app/js/` — boot/routing, data loading, localStorage store, filters, views
- `app/data/trophies.json` — all 55 trophies: official names, descriptions, grades, hidden flags, counts, guides with cited steps
- `app/data/sources.json` — 10 numbered sources + 6 disputes with our calls
- `screenshots/` — 4 JPEG views of the guide (tracker, roadmap, missables, sources)

## License

MIT — see `LICENSE`.
