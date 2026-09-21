# volatility-insights.com

Static one-page site. No build step, no dependencies, no framework.

## How to change the site

1. Open `index.html`.
2. Edit the text between the `<!-- ===== CONTENT ... -->` and `<!-- ===== END CONTENT ===== -->` markers.
3. Commit and push:

   ```powershell
   git add -A
   git commit -m "update site"
   git push
   ```

Live within ~1 minute. You can also edit `index.html` straight in the GitHub web
editor if you are not at your own machine.

To preview locally, just double-click `index.html`.

## Files

| File          | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `index.html`  | The whole page: content + styling in one file.                  |
| `404.html`    | Shown for unknown URLs.                                         |
| `CNAME`       | Tells GitHub Pages the custom domain. Do not delete or rename.  |
| `.nojekyll`   | Skips Jekyll processing so files are served exactly as-is.      |
| `robots.txt`  | Search engine rules.                                            |
| `sitemap.xml` | Sitemap. Add a `<url>` entry if you add more pages.             |

## Hosting

* **GitHub Pages** builds and serves the site from the `main` branch, root folder.
* **Cloudflare** is the DNS provider (and optionally CDN/WAF in front).

### DNS records in Cloudflare

| Type    | Name  | Value                                                                    |
| ------- | ----- | ------------------------------------------------------------------------ |
| `A`     | `@`   | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `AAAA`  | `@`   | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| `CNAME` | `www` | `GeorgeHategan.github.io`                                                |

Cloudflare SSL/TLS encryption mode must be **Full (strict)**. `Flexible` causes a
redirect loop with GitHub Pages.
