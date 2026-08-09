# Strapi integration

This branch introduces the staged SAV Builder cutover from Google Sheets to Strapi.

## Current stage

When a Strapi URL is configured, Strapi becomes authoritative for:

- which SAV configurations are published
- product, brand, class, longevity and laminate labels
- material-property filters
- mounting-surface descriptions and links
- specification-sheet links

The existing Apps Script feed temporarily supplies product/laminate costs, pricing Config
values and QCodes. The browser joins both feeds by the Strapi importer's stable `sourceKey`.
If Strapi is configured but unavailable, the selector fails closed instead of quoting an
unpublished or stale configuration.

This is a transition state. The Sheet and Apps Script can be retired only after a trusted
server endpoint supplies quotes and resolves QCodes. The final cart flow must not accept a
browser-authored `price` as binding.

## Configure

Set the Strapi base URL on the `app.js` script element in `index.html`:

```html
<script
  src="app.js"
  data-apps-script-url="https://script.google.com/macros/s/.../exec"
  data-strapi-url="https://your-strapi-host.example"
></script>
```

For local development, leave `data-strapi-url` empty and use the `strapi` query parameter:

```text
http://localhost:8888/?mode=dev&strapi=http://127.0.0.1:1337
```

The Strapi environment must grant the Public role `find` and `findOne` permission for
`sav-builder-option`. The private QCode field is omitted from these responses.

## Expected Strapi query

The app reads:

```text
GET /api/sav-builder-options
  ?pagination[pageSize]=200
  &sort=sortOrder:asc
  &populate=*
```

`populate=*` is used so first-level components and media fields are included, including
`surfaceGuidance`, `rollOptions`, `productSpecSheet` and `laminateSpecSheet`.

Only published entries are returned by the public Content API. The protected
`POST /api/sav-builder-options/resolve-qcode` route is reserved for the future server-side
quote/cart adapter and must never be called with a token embedded in this static app.
