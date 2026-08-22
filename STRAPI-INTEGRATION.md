# Strapi integration

The SAV Builder catalogue is supplied by Strapi and pricing is supplied by the Pricing Engine.

## Current stage

When a Strapi URL is configured, Strapi becomes authoritative for:

- which SAV configurations are published
- product, brand, class, longevity and laminate labels
- material-property filters
- mounting-surface descriptions and links
- specification-sheet links
- the available stock widths and their public QCodes

The browser does not load costs or pricing configuration. It sends the selected product's
QCodes, elements, print mode and advanced options to the authenticated Pricing Engine. The
Pricing Engine resolves each QCode through JobTalk/APIM and returns the selected width,
server-generated layout and element prices. If either Strapi or the Pricing Engine is
unavailable, the builder fails closed instead of producing a local estimate.

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
`sav-builder-option`. QCodes are returned; costs and pricing formulas are not stored in Strapi.

## Expected Strapi query

The app reads:

```text
GET /api/sav-builder-options
  ?pagination[pageSize]=100
  &pagination[page]=<each page>
  &sort=sortOrder:asc
  &populate=*
```

`populate=*` is used so first-level components and media fields are included, including
`surfaceGuidance`, `rollOptions`, `productSpecSheet` and `laminateSpecSheet`.

Only published entries are returned by the public Content API. The browser never needs a
Strapi API token and does not use `sourceKey` to join pricing data.
