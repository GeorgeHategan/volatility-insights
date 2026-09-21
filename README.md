# volatility-insights.com

Static site for Volatility Insights, a quantitative research lab for volatility
measurement, modelling and forecasting. Served by GitHub Pages from the `main` branch root.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Front page. Editable content sits between the `CONTENT` and `END CONTENT` markers. |
| `style.css` | All styling for every page. Colours are defined once in `:root`. |
| `surface.js` | Animated SVI volatility surface plus a rough field and drifting peaks, drawn on the hero canvas. No dependencies. |
| `logo.png` | 512x512 circular badge. Used as favicon, apple-touch-icon, Open Graph image and nav mark. |
| `research/index.html` | The quantitative research page: protocol, evaluation standards, stack. |
| `notes/<slug>/index.html` | One research note per folder, giving clean URLs. |
| `404.html` | Styled not-found page. |
| `CNAME` | Custom domain. Do not delete - Pages rewrites the domain setting from this file. |
| `sitemap.xml` | Add an entry for every new note. |
| `robots.txt` | Points crawlers at the sitemap. |
| `.nojekyll` | Stops Pages from running Jekyll over the files. |

## Adding a research note

1. Create `notes/<slug>/index.html`. Copy an existing note as the template.
2. Keep the relative paths: `../../style.css` and `../../logo.png`.
3. Update the `title`, `meta description`, `canonical` and Open Graph tags.
4. Add a `.note` card to the `#notes` section of `index.html`.
5. Add the URL to `sitemap.xml`.

Available article classes: `.article`, `.kicker`, `.standfirst`, `.eq` (with a
`.note` span for the caption), `.callout`, `.refs`, `.back`.

## Changing the colours

Everything derives from the custom properties at the top of `style.css`:
`--bg`, `--panel`, `--panel-2`, `--text`, `--muted`, `--dim`, `--line`,
`--line-soft`, `--accent` (logo cyan), `--accent-2` (logo coral), `--accent-3`.
`surface.js` also interpolates between the cyan and coral values, so change them
there too if you rebrand.

## Local preview

```
python -m http.server 8000
```

Then open http://localhost:8000. A plain file open also works, but relative
links to `notes/<slug>/` need the server.

## Deploying

```
git add -A
git commit -m "describe the change"
git push origin main
```

Pages rebuilds automatically. Allow a minute, then hard-refresh.

## Domain and email

- DNS is managed in Cloudflare, records set to DNS only (grey cloud).
- Contact address `info@volatility-insights.com` is a Cloudflare Email Routing
  forward. MX, SPF, DKIM and DMARC records are in place and managed by Cloudflare.

## Channel

Videos are published at https://www.youtube.com/@volatility_insights
