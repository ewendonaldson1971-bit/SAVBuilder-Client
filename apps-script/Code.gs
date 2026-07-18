const PROPERTY_KEYS = {
  liveSpreadsheetId: "LIVE_SPREADSHEET_ID",
  openSheetPassword: "OPEN_SHEET_PASSWORD"
};

const ALLOWED_SHEETS = ["Selector", "Config"];
const DEFAULT_DEV_SELECTOR_SHEET_NAME = "DEV";
const IMPOSITION_EMAIL_TO = "sales@vivad.com.au";
const IMPOSITION_EMAIL_SUBJECT = "SavBuilder imposition submitted";
const IMPOSITION_EMAIL_ACTION = "email-imposition";
const MAX_IMPOSITION_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function doGet(event) {
  const params = event && event.parameter ? event.parameter : {};
  const callback = getSafeCallbackName(params.callback);
  let payload;

  try {
    payload = handleRequest(params);
  } catch (error) {
    payload = {
      ok: false,
      error: error && error.message ? error.message : "Apps Script request failed."
    };
  }

  return writePayload(payload, callback);
}

function doPost(event) {
  const params = event && event.parameter ? event.parameter : {};
  let payload;

  try {
    const action = String(params.action || "").trim().toLowerCase();
    if (action === IMPOSITION_EMAIL_ACTION) {
      payload = handleImpositionEmail(params);
    } else {
      payload = {
        ok: false,
        error: "Unsupported Apps Script POST action."
      };
    }
  } catch (error) {
    payload = {
      ok: false,
      error: error && error.message ? error.message : "Apps Script request failed."
    };
  }

  return writePayload(payload, "");
}

function handleRequest(params) {
  const mode = getMode(params.mode);
  const action = String(params.action || "data").trim().toLowerCase();

  if (action === "opensheet") {
    return getOpenSheetPayload(mode, params.password, params.sheet);
  }

  const sheetName = getRequestedSheetName(params.sheet);
  const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId(mode));
  const sheet = getWorksheet(spreadsheet, mode, sheetName);

  return {
    ok: true,
    mode,
    sheet: sheetName,
    values: sheet.getDataRange().getDisplayValues()
  };
}

function handleImpositionEmail(params) {
  const svg = String(params.svg || "");
  if (!svg.trim()) throw new Error("No imposition file was received.");
  if (Utilities.newBlob(svg).getBytes().length > MAX_IMPOSITION_ATTACHMENT_BYTES) {
    throw new Error("Imposition file is too large to email.");
  }

  const filename = getSafeAttachmentName(params.filename || "sav-builder-imposition.svg");
  const productName = String(params.productName || "").trim();
  const rollWidth = String(params.rollWidth || "").trim();
  const total = String(params.total || "").trim();
  const mode = getMode(params.mode);

  const body = [
    "SAV Builder imposition submitted.",
    "",
    productName ? `Product: ${productName}` : "",
    rollWidth ? `Roll width: ${rollWidth} mm` : "",
    total ? `Total: ${total}` : "",
    `Mode: ${mode}`
  ].filter(Boolean).join("\n");

  MailApp.sendEmail({
    to: IMPOSITION_EMAIL_TO,
    subject: IMPOSITION_EMAIL_SUBJECT,
    body,
    name: "SAV Builder",
    attachments: [
      Utilities.newBlob(svg, "image/svg+xml", filename)
    ]
  });

  return {
    ok: true
  };
}

function getOpenSheetPayload(mode, password, sheetName) {
  const properties = PropertiesService.getScriptProperties();
  const expectedPassword = properties.getProperty(PROPERTY_KEYS.openSheetPassword);
  if (!expectedPassword) throw new Error("Open-sheet password is not configured.");
  if (String(password || "") !== expectedPassword) throw new Error("Incorrect password.");

  const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId(mode));
  const requestedSheetName = getRequestedSheetName(sheetName || "Selector");
  const sheet = getWorksheet(spreadsheet, mode, requestedSheetName);

  return {
    ok: true,
    mode,
    url: `${spreadsheet.getUrl()}#gid=${sheet.getSheetId()}`
  };
}

function getSafeAttachmentName(value) {
  const cleaned = String(value || "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const filename = cleaned || "sav-builder-imposition.svg";
  return /\.svg$/i.test(filename) ? filename : `${filename}.svg`;
}

function getSpreadsheetId(mode) {
  const properties = PropertiesService.getScriptProperties();
  const key = PROPERTY_KEYS.liveSpreadsheetId;
  const id = properties.getProperty(key);
  if (!id) throw new Error(`${key} is not configured.`);
  if (!/^[A-Za-z0-9_-]{20,}$/.test(id)) {
    throw new Error(`${key} must be a Google spreadsheet ID, not "${id}".`);
  }
  return id;
}

function getWorksheet(spreadsheet, mode, logicalSheetName) {
  const properties = PropertiesService.getScriptProperties();
  const prefix = `${mode.toUpperCase()}_${logicalSheetName.toUpperCase()}`;
  const configuredName = properties.getProperty(`${prefix}_SHEET_NAME`);
  const configuredGid = properties.getProperty(`${prefix}_SHEET_GID`);
  const defaultSheetName = getDefaultWorksheetName(mode, logicalSheetName);

  if (configuredName) {
    const namedSheet = spreadsheet.getSheetByName(configuredName);
    if (namedSheet) return namedSheet;
  }

  const defaultSheet = spreadsheet.getSheetByName(defaultSheetName);
  if (defaultSheet) return defaultSheet;

  if (configuredGid) {
    const gid = Number(configuredGid);
    const gidSheet = spreadsheet.getSheets().find((sheet) => sheet.getSheetId() === gid);
    if (gidSheet) return gidSheet;
  }

  throw new Error(`${logicalSheetName} sheet was not found for ${mode}.`);
}

function getDefaultWorksheetName(mode, logicalSheetName) {
  if (mode === "dev" && logicalSheetName === "Selector") {
    return DEFAULT_DEV_SELECTOR_SHEET_NAME;
  }
  return logicalSheetName;
}

function getRequestedSheetName(value) {
  const sheet = String(value || "Selector").trim();
  if (ALLOWED_SHEETS.indexOf(sheet) === -1) {
    throw new Error("Requested sheet is not allowed.");
  }
  return sheet;
}

function getMode(value) {
  return String(value || "").trim().toLowerCase() === "dev" ? "dev" : "live";
}

function getSafeCallbackName(value) {
  const callback = String(value || "").trim();
  if (!callback) return "";
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)) {
    throw new Error("Invalid callback name.");
  }
  return callback;
}

function writePayload(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
