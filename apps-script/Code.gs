const PROPERTY_KEYS = {
  liveSpreadsheetId: "LIVE_SPREADSHEET_ID",
  devSpreadsheetId: "DEV_SPREADSHEET_ID",
  openSheetPassword: "OPEN_SHEET_PASSWORD"
};

const ALLOWED_SHEETS = ["Selector", "Config"];

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

function getSpreadsheetId(mode) {
  const properties = PropertiesService.getScriptProperties();
  const key = mode === "dev" ? PROPERTY_KEYS.devSpreadsheetId : PROPERTY_KEYS.liveSpreadsheetId;
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

  if (configuredName) {
    const namedSheet = spreadsheet.getSheetByName(configuredName);
    if (namedSheet) return namedSheet;
  }

  const defaultSheet = spreadsheet.getSheetByName(logicalSheetName);
  if (defaultSheet) return defaultSheet;

  if (configuredGid) {
    const gid = Number(configuredGid);
    const gidSheet = spreadsheet.getSheets().find((sheet) => sheet.getSheetId() === gid);
    if (gidSheet) return gidSheet;
  }

  throw new Error(`${logicalSheetName} sheet was not found for ${mode}.`);
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
