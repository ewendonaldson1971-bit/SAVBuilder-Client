# SAV Builder Apps Script proxy

This Apps Script hides the Google Sheet IDs from the browser. The browser only calls the deployed Apps Script Web App URL.

## Deploy

1. Create a new Apps Script project while signed in as the Vivad1958 Google account.
2. Paste `Code.gs` into the Apps Script editor.
3. Open **Project Settings** and add these Script Properties:

| Property | Required | Purpose |
| --- | --- | --- |
| `LIVE_SPREADSHEET_ID` | Yes | Live SAV Builder spreadsheet ID. Both live and dev mode read from this spreadsheet. |
| `OPEN_SHEET_PASSWORD` | Yes | Password required before the app opens the Sheet. |
| `LIVE_SELECTOR_SHEET_NAME` | No | Live Selector tab name if it is not `Selector`. |
| `DEV_SELECTOR_SHEET_NAME` | No | DEV Selector tab name if it is not `DEV`. |
| `LIVE_CONFIG_SHEET_NAME` | No | Live Config tab name if it is not `Config`. |
| `DEV_CONFIG_SHEET_NAME` | No | DEV Config tab name if it is not `Config`. |
| `LIVE_SELECTOR_SHEET_GID` | No | Live Selector tab gid if name matching is not suitable. |
| `DEV_SELECTOR_SHEET_GID` | No | DEV Selector tab gid if name matching is not suitable. |
| `LIVE_CONFIG_SHEET_GID` | No | Live Config tab gid if name matching is not suitable. |
| `DEV_CONFIG_SHEET_GID` | No | DEV Config tab gid if name matching is not suitable. |

4. Deploy as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy and authorize this while signed in as **Vivad1958@gmail.com** so imposition emails are sent by that Google account.
5. Copy the Web App URL into the `data-apps-script-url` attribute on the `app.js` script tag near the end of `index.html`:

```html
<script
  src="app.js?v=apps-script-proxy-20260711"
  data-apps-script-url="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
></script>
```

The public app can still see the Apps Script Web App URL, but it cannot see the Google Sheet IDs or the open-sheet password.

## Imposition email

The app can submit the generated imposition SVG to Apps Script. `Code.gs` sends it to `sales@vivad.com.au` with the subject `SavBuilder imposition submitted` using `MailApp.sendEmail`. The first deployment or update may ask the Vivad1958 Google account to authorize email sending.

The app also sends an add-to-cart summary to `jtlog@vivad.com.au` with the subject `SAVBuilder Add to cart` when a user clicks either **Add all to cart** button. The email body includes the selected product/laminate details and each cart line's shortname, quantity, size, QCode, pricing, and cart URL.

If the app reports `You do not have permission to call MailApp.sendEmail`, authorize email sending in Apps Script:

1. Open the Apps Script project while signed in as **Vivad1958@gmail.com**.
2. Paste the latest `Code.gs` into the project and save it.
3. Select `authorizeMailApp` from the function dropdown.
4. Click **Run** and approve the requested Google permissions.
5. Deploy a new Web App version with **Execute as: Me** and **Who has access: Anyone**.

## Troubleshooting

If the Web App URL returns `Script function not found: doGet`, the deployment is not running the `Code.gs` in this folder. Paste this `Code.gs` into the Apps Script project, save it, then create a new Web App deployment or edit the existing deployment to use a new version.

If the Web App URL returns `Illegal spreadsheet id or key: Yes`, check the Script Properties. `LIVE_SPREADSHEET_ID` must be the long ID from the Google Sheet URL, not `Yes`, a tab name, or a sharing flag.
