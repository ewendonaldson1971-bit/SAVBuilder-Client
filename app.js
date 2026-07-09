(function () {
  "use strict";

  const APP_MODES = {
    live: {
      title: "SAV Builder-Live",
      background: "#ffffff",
      sheetCsvUrl: "https://docs.google.com/spreadsheets/d/1Ai-RT9p7H73pg07j8cmpDfIIwIo8NnS-gzypc3Kg5x0/gviz/tq?tqx=out:csv&sheet=Selector",
      sheetGvizUrl: "https://docs.google.com/spreadsheets/d/1Ai-RT9p7H73pg07j8cmpDfIIwIo8NnS-gzypc3Kg5x0/gviz/tq?sheet=Selector",
      sheetEditUrl: "https://docs.google.com/spreadsheets/d/1Ai-RT9p7H73pg07j8cmpDfIIwIo8NnS-gzypc3Kg5x0/edit?usp=sharing"
    },
    dev: {
      title: "SAV Builder DEV",
      background: "#fff8df",
      sheetCsvUrl: "https://docs.google.com/spreadsheets/d/1Y6dRHL8FKb1DNZL0JWP7kJsf7DOFJd5ZhyXCHrXH_SU/gviz/tq?tqx=out:csv&gid=1922651000",
      sheetGvizUrl: "https://docs.google.com/spreadsheets/d/1Y6dRHL8FKb1DNZL0JWP7kJsf7DOFJd5ZhyXCHrXH_SU/gviz/tq?gid=1922651000",
      sheetEditUrl: "https://docs.google.com/spreadsheets/d/1Y6dRHL8FKb1DNZL0JWP7kJsf7DOFJd5ZhyXCHrXH_SU/edit?usp=sharing"
    }
  };
  const APP_MODE = getAppMode();
  const APP_CONFIG = APP_MODES[APP_MODE];
  const SHEET_CSV_URL = APP_CONFIG.sheetCsvUrl;
  const SHEET_GVIZ_URL = APP_CONFIG.sheetGvizUrl;
  const SHEET_EDIT_URL = APP_CONFIG.sheetEditUrl;
  const SHEET_OPEN_PASSWORD = "1958-1960";

  const TILE_OFFSET_MM = 5;
  const MATERIAL_LOADING_MM = 500;
  const SETUP_FEE = 22;
  const TRIM_PER_LINEAR_M = 0.5;
  const STOCK_MULTIPLIER = 2;
  const LAMINATE_MULTIPLIER = 3;
  const PRINT_PER_SQM = 15;
  const UNIT_PRICE = 0.5;
  const MAX_PREVIEW_PLACEMENTS = 2600;
  const MOUNTING_SURFACE_COLUMN = "Mounting Surface";
  const LEGACY_SURFACE_COLUMN = "Surface";
  const DERIVED_PERFORATION_COLUMN = "Perforation";
  const CART_WINDOW_NAME = "savBuilderCart";
  const CART_NAVIGATION_DELAY_MS = 1200;

  const FALLBACK_SELECTOR_CSV = [
    '"Surface","Mounting Surface","Type","Laminate","Longevity","Product","Width1","Cost1","Width2","Cost2","Print SQM Rate"',
    '"Glass","Internal","Perforated 20% with Flood White","FALSE","FALSE","Innova Clear 1370 ","1370","$16.46","","","25"',
    '"Glass","Internal","Perforated 20% with Flood White Plus Black","FALSE","FALSE","Innova Clear 1370 ","1370","$16.46","","","30"',
    '"Glass","Internal","Clear Reverse Print  with Full Flood White","FALSE","Short term/ Promotional","MPI 3041","1370","5.44","1520","6.04","25"',
    '"Glass","Internal","Clear Reverse Print  with Full Flood White","FALSE","5 Years","Orajet 3651 Poly Clear ","1370","$7.69","1600","8.98","25"',
    '"Glass","Internal","Clear Reverse Print  with Full Flood White","FALSE","7 Years","Orafol 3952F","1370","$24.37","1520","27.03","25"',
    '"Glass","Internal","Clear Reverse Print Day/Night","FALSE","Short term/ Promotional","MPI 3041","1370","5.44","1520","6.04","25"',
    '"Glass","Internal","Clear Reverse Print Day/Night","FALSE","5 Years","Orajet 3651 Poly Clear ","1370","$7.69","1600","8.98","25"',
    '"Glass","Internal","Clear Reverse Print Day/Night","FALSE","7 Years","Orafol 3952F","1370","$24.37","1520","27.03","25"',
    '"Glass","Internal","Clear 5 Layer Double sided","FALSE","Short term/ Promotional","MPI 3041","1370","5.44","1520","6.04","25"',
    '"Glass","Internal","Clear 5 Layer Double sided","FALSE","5 Years","Orajet 3651 Poly Clear ","1370","$7.69","1600","8.98","25"',
    '"Glass","Internal","Clear 5 Layer Double sided","FALSE","7 Years","Orafol 3952F","1370","$24.37","1520","27.03","25"',
    '"Glass","External","Perforated","","12-18 Months","Megaview 20%","1370","$10.70","","","15"',
    '"Glass","External","Perforated","","2-3 Years","Innova 30% No Laminate","1370","19.1","","","15"',
    '"Glass","External","Perforated","","3-5 Years","Innova 30% With Laminate","1370","28.5","","","15"',
    '"Glass","External","Perforated","","5 Years Plus","Panoramawith laminate","1370","32.04","","","15"',
    '"Glass","External","Perforated","","12-18 Months","Magaview 40%","1370","$10.70","","","15"',
    '"Painted Plaster Prepared for SAV","","","","","","","","","",""',
    '"Acrylic","","","","","","","","","",""',
    '"ACM, Colourbond Smooth ","","","","","","","","","",""',
    '"Timber Floor","","","","","","","","","",""',
    '"Smooth Concrete","","","","","","","","","",""',
    '"Brick or Stone","","","","","","","","","",""',
    '"Carpet","","","","","","","","","",""',
    '"Ashphalt","","","","","","","","","",""',
    '"Raw Gyprock Plaster","","","","","","","","","",""',
    '"Raw MDF","","","","","","","","","",""',
    '"Rough Timber Hoarding","","","","","","","","","",""',
    '"Polythene eg Wheely Bin, Plastic seats","","","","","","","","","",""'
  ].join("\n");

  const SAMPLE_JOB = [
    "Shortname, Quantity, Width, Height",
    "Window Panel, 8, 420, 900",
    "Reception Wall, 2, 2100, 1800",
    "Door Decal, 12, 260, 700",
    "Counter Front, 3, 1220, 760"
  ].join("\n");

  const COLORS = [
    "#13795b",
    "#c45a3d",
    "#2f667f",
    "#a96f18",
    "#6b5d8f",
    "#9a4d6a",
    "#53734d",
    "#5d6f7d"
  ];

  const state = {
    selectorRows: [],
    selectorColumns: [],
    postProductSelectorColumns: [],
    selectorSelections: {},
    selectedProduct: null,
    productSearchQuery: "",
    elementInputMode: "table",
    productSource: "fallback",
    useOffsetJoins: null,
    artworks: [],
    artworkErrors: [],
    currentBest: null,
    currentOptions: [],
    currentCartUrls: []
  };

  const ui = {};
  let recalcTimer = 0;
  let pdfjsPromise = null;
  let artworkCropInteraction = null;

  document.addEventListener("DOMContentLoaded", init);

  function getAppMode() {
    const params = new URLSearchParams(window.location.search);
    const mode = String(params.get("mode") || params.get("appMode") || "").trim().toLowerCase();
    const devFlag = String(params.get("dev") || "").trim().toLowerCase();
    return mode === "dev" || devFlag === "1" || devFlag === "true" ? "dev" : "live";
  }

  function init() {
    cacheUi();
    applyAppMode();
    applySelectorData(parseSelectorCsv(FALLBACK_SELECTOR_CSV), "fallback");
    ui.jobInput.value = "";
    renderElementTableFromText();
    attachEvents();
    recalculate();
    refreshProducts();
  }

  function cacheUi() {
    ui.selectorSurvey = document.getElementById("selector-survey");
    ui.appTitle = document.getElementById("app-title");
    ui.productSearch = document.getElementById("product-search");
    ui.productSearchResults = document.getElementById("product-search-results");
    ui.sheetStatus = document.getElementById("sheet-status");
    ui.openGSheet = document.getElementById("open-gsheet");
    ui.refreshProducts = document.getElementById("refresh-products");
    ui.printRateConstant = document.getElementById("print-rate-constant");
    ui.downloadImposition = document.getElementById("download-imposition");
    ui.bleedMm = document.getElementById("bleed-mm");
    ui.overlapMm = document.getElementById("overlap-mm");
    ui.elementModeInputs = Array.from(document.querySelectorAll("input[name='element-entry-mode']"));
    ui.elementCsvPanel = document.getElementById("element-csv-panel");
    ui.elementTablePanel = document.getElementById("element-table-panel");
    ui.elementRowsBody = document.getElementById("element-rows-body");
    ui.addElementRow = document.getElementById("add-element-row");
    ui.jobInput = document.getElementById("job-input");
    ui.loadSample = document.getElementById("load-sample");
    ui.artworkUpload = document.getElementById("artwork-upload");
    ui.clearArtwork = document.getElementById("clear-artwork");
    ui.artworkList = document.getElementById("artwork-list");
    ui.inputErrors = document.getElementById("input-errors");
    ui.rollChoice = document.getElementById("roll-choice");
    ui.metricLinear = document.getElementById("metric-linear");
    ui.metricJoins = document.getElementById("metric-joins");
    ui.metricPrice = document.getElementById("metric-price");
    ui.metricRate = document.getElementById("metric-rate");
    ui.costBreakdown = document.getElementById("cost-breakdown");
    ui.offsetPrompt = document.getElementById("offset-prompt");
    ui.optionCount = document.getElementById("option-count");
    ui.optionsBody = document.getElementById("options-body");
    ui.priceSummary = document.getElementById("price-summary");
    ui.addAllCart = document.getElementById("add-all-cart");
    ui.pricingBody = document.getElementById("pricing-body");
    ui.impositionSummary = document.getElementById("imposition-summary");
    ui.impositionPreview = document.getElementById("imposition-preview");
  }

  function applyAppMode() {
    document.title = APP_CONFIG.title;
    document.documentElement.style.setProperty("--paper", APP_CONFIG.background);
    if (ui.appTitle) ui.appTitle.textContent = APP_CONFIG.title;
  }

  function attachEvents() {
    ui.productSearch.addEventListener("input", () => {
      state.productSearchQuery = ui.productSearch.value;
      renderProductSearch();
    });

    ui.productSearchResults.addEventListener("click", (event) => {
      const result = event.target.closest("[data-product-search-index]");
      if (!result) return;
      applyProductSearchSelection(Number.parseInt(result.dataset.productSearchIndex, 10));
    });

    ui.openGSheet.addEventListener("click", openGSheetWithPassword);

    ui.selectorSurvey.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-selector-column]");
      const reset = event.target.closest("[data-selector-reset]");
      const back = event.target.closest("[data-selector-back]");

      if (reset) {
        state.selectorSelections = {};
        recalculate();
        return;
      }

      if (back) {
        undoLastSelectorSelection();
        recalculate();
        return;
      }

      if (!choice) return;
      const column = choice.dataset.selectorColumn;
      state.selectorSelections[column] = choice.dataset.selectorValue;
      pruneSelectionsAfter(column);
      recalculate();
    });

    document.querySelectorAll("input[name='bleed-type']").forEach((input) => {
      input.addEventListener("change", recalculate);
    });

    [ui.bleedMm, ui.overlapMm].forEach((input) => {
      input.addEventListener("input", recalculate);
    });

    ui.elementModeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          setElementInputMode(input.value);
        }
      });
    });

    ui.jobInput.addEventListener("input", () => {
      scheduleRecalculate();
    });

    ui.loadSample.addEventListener("click", () => {
      ui.jobInput.value = SAMPLE_JOB;
      renderElementTableFromText();
      state.useOffsetJoins = null;
      recalculate();
    });

    ui.elementRowsBody.addEventListener("input", (event) => {
      if (!event.target.closest("[data-element-field]")) return;
      syncJobInputFromElementTable();
      scheduleRecalculate();
    });

    ui.elementTablePanel.addEventListener("paste", handleElementTablePaste);

    ui.elementRowsBody.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-element-row]");
      if (!remove) return;
      const row = remove.closest("tr");
      if (row) row.remove();
      if (!ui.elementRowsBody.children.length) {
        appendElementTableRow();
      }
      syncJobInputFromElementTable();
      recalculate();
    });

    ui.addElementRow.addEventListener("click", () => {
      appendElementTableRow();
      syncJobInputFromElementTable();
      recalculate();
      const lastRow = ui.elementRowsBody.lastElementChild;
      lastRow?.querySelector("[data-element-field='shortname']")?.focus();
    });

    ui.artworkUpload.addEventListener("change", async () => {
      await addArtworkFiles(Array.from(ui.artworkUpload.files || []));
      ui.artworkUpload.value = "";
    });

    ui.clearArtwork.addEventListener("click", () => {
      state.artworks = [];
      state.artworkErrors = [];
      recalculate();
    });

    ui.artworkList.addEventListener("change", (event) => {
      const select = event.target.closest("[data-artwork-map]");
      if (!select) return;
      const artwork = state.artworks.find((item) => item.id === select.dataset.artworkMap);
      if (!artwork) return;
      artwork.mappedShortname = select.value;
      recalculate();
    });

    ui.artworkList.addEventListener("click", handleArtworkCropClick);
    ui.artworkList.addEventListener("pointerdown", handleArtworkCropPointerDown);
    ui.artworkList.addEventListener("wheel", handleArtworkCropWheel, { passive: false });
    window.addEventListener("pointermove", handleArtworkCropPointerMove);
    window.addEventListener("pointerup", handleArtworkCropPointerUp);
    window.addEventListener("pointercancel", handleArtworkCropPointerUp);

    ui.refreshProducts.addEventListener("click", refreshProducts);

    ui.offsetPrompt.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-offset-choice]");
      if (!choice) return;
      state.useOffsetJoins = choice.dataset.offsetChoice === "yes";
      recalculate();
    });

    ui.downloadImposition.addEventListener("click", downloadImposition);
    ui.addAllCart.addEventListener("click", addAllToCart);
  }

  function handleArtworkCropClick(event) {
    const zoomButton = event.target.closest("[data-artwork-crop-zoom]");
    const resetButton = event.target.closest("[data-artwork-crop-reset]");
    if (!zoomButton && !resetButton) return;

    const frame = getArtworkCropFrameFromElement(event.target);
    const artwork = getArtworkForCropFrame(frame);
    if (!artwork) return;

    event.preventDefault();
    if (resetButton) {
      resetArtworkCrop(artwork);
    } else {
      setArtworkScale(artwork, getArtworkScale(artwork) + cleanNumber(zoomButton.dataset.artworkCropZoom, 0));
    }

    updateArtworkCropperView(frame, artwork);
    refreshImpositionArtwork();
  }

  function handleArtworkCropWheel(event) {
    const frame = getArtworkCropFrameFromElement(event.target);
    const artwork = getArtworkForCropFrame(frame);
    if (!artwork) return;

    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setArtworkScale(artwork, getArtworkScale(artwork) + direction * 0.08);
    updateArtworkCropperView(frame, artwork);
    refreshImpositionArtwork();
  }

  function handleArtworkCropPointerDown(event) {
    if (event.button !== 0) return;
    const frame = getArtworkCropFrameFromElement(event.target);
    const artwork = getArtworkForCropFrame(frame);
    if (!artwork) return;

    const scaleHandle = event.target.closest("[data-artwork-crop-scale]");
    const rect = frame.getBoundingClientRect();
    const imageRect = getArtworkImageRect(artwork, rect.width, rect.height);

    artworkCropInteraction = {
      type: scaleHandle ? "scale" : "pan",
      pointerId: event.pointerId,
      artworkId: artwork.id,
      frame,
      startX: event.clientX,
      startY: event.clientY,
      startScale: getArtworkScale(artwork),
      startCropX: getArtworkCropPercent(artwork, "cropX"),
      startCropY: getArtworkCropPercent(artwork, "cropY"),
      extraX: Math.max(0, imageRect.width - rect.width),
      extraY: Math.max(0, imageRect.height - rect.height)
    };

    frame.classList.add("is-editing");
    frame.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleArtworkCropPointerMove(event) {
    const interaction = artworkCropInteraction;
    if (!interaction || event.pointerId !== interaction.pointerId) return;

    const artwork = state.artworks.find((item) => item.id === interaction.artworkId);
    if (!artwork) return;

    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;

    if (interaction.type === "scale") {
      setArtworkScale(artwork, interaction.startScale + ((deltaX + deltaY) / 240));
    } else {
      if (interaction.extraX > 0) {
        artwork.cropX = clampNumber(interaction.startCropX - (deltaX / interaction.extraX) * 100, 0, 100);
      }
      if (interaction.extraY > 0) {
        artwork.cropY = clampNumber(interaction.startCropY - (deltaY / interaction.extraY) * 100, 0, 100);
      }
    }

    updateArtworkCropperView(interaction.frame, artwork);
    refreshImpositionArtwork();
    event.preventDefault();
  }

  function handleArtworkCropPointerUp(event) {
    const interaction = artworkCropInteraction;
    if (!interaction || event.pointerId !== interaction.pointerId) return;

    interaction.frame?.classList.remove("is-editing");
    interaction.frame?.releasePointerCapture?.(event.pointerId);
    artworkCropInteraction = null;
  }

  function getArtworkCropFrameFromElement(element) {
    return element?.closest("[data-artwork-crop-frame]") ||
      element?.closest("[data-artwork-crop-stage]")?.querySelector("[data-artwork-crop-frame]") ||
      element?.closest(".artwork-cropper")?.querySelector("[data-artwork-crop-frame]") ||
      null;
  }

  function getArtworkForCropFrame(frame) {
    if (!frame) return null;
    return state.artworks.find((item) => item.id === frame.dataset.artworkId) || null;
  }

  function setArtworkScale(artwork, scale) {
    artwork.artworkScale = clampNumber(scale, 1, 3);
    artwork.cropX = getArtworkCropPercent(artwork, "cropX");
    artwork.cropY = getArtworkCropPercent(artwork, "cropY");
  }

  function resetArtworkCrop(artwork) {
    artwork.artworkScale = 1;
    artwork.cropX = 50;
    artwork.cropY = 50;
  }

  function updateArtworkCropperView(frame, artwork) {
    if (!frame) return;
    const image = frame.querySelector("[data-artwork-crop-image]");
    if (image) {
      image.setAttribute("style", getArtworkCropperImageStyle(artwork, cleanNumber(frame.dataset.cropAspect, 1)));
    }

    const scaleReadout = frame.closest(".artwork-cropper")?.querySelector("[data-artwork-scale-readout]");
    if (scaleReadout) {
      scaleReadout.textContent = `${Math.round(getArtworkScale(artwork) * 100)}%`;
    }
  }

  function refreshImpositionArtwork() {
    if (state.currentBest) {
      renderImposition(state.currentBest);
    }
  }

  function scheduleRecalculate() {
    window.clearTimeout(recalcTimer);
    recalcTimer = window.setTimeout(recalculate, 130);
  }

  function openGSheetWithPassword() {
    const password = window.prompt("Enter password to open the GSheet");
    if (password == null) return;
    if (password.trim() !== SHEET_OPEN_PASSWORD) {
      window.alert("Incorrect password.");
      return;
    }
    window.open(SHEET_EDIT_URL, "_blank", "noopener");
  }

  function setElementInputMode(mode) {
    state.elementInputMode = mode === "table" ? "table" : "csv";
    if (state.elementInputMode === "table") {
      renderElementTableFromText();
    } else {
      syncJobInputFromElementTable();
    }

    ui.elementCsvPanel.hidden = state.elementInputMode !== "csv";
    ui.elementTablePanel.hidden = state.elementInputMode !== "table";
    recalculate();
  }

  function renderElementTableFromText() {
    const rows = getElementTableRowsFromText(ui.jobInput.value);
    ui.elementRowsBody.innerHTML = "";
    (rows.length ? rows : [createBlankElementRow()]).forEach((row) => appendElementTableRow(row));
  }

  function getElementTableRowsFromText(text) {
    return getElementPasteRows({ text })
      .map((row, index) => ({
        shortname: String(row[0] || `Element ${index + 1}`).trim(),
        quantity: String(row[1] || "").trim(),
        width: String(row[2] || "").trim(),
        height: String(row[3] || "").trim()
      }));
  }

  function getElementPasteRows({ text = "", html = "" } = {}) {
    const rows = text.trim() ? parseSpreadsheetText(text) : parseSpreadsheetHtml(html);
    if (!rows.length) return [];

    const firstDataRow = rows[0].some((cell) => /shortname|quantity|width|height/i.test(cell)) ? 1 : 0;
    return rows.slice(firstDataRow)
      .filter((row) => row.some((cell) => String(cell).trim()));
  }

  function createBlankElementRow() {
    return { shortname: "", quantity: "", width: "", height: "" };
  }

  function appendElementTableRow(row = createBlankElementRow()) {
    ui.elementRowsBody.insertAdjacentHTML("beforeend", renderElementTableRow(row));
  }

  function renderElementTableRow(row) {
    return `
      <tr>
        <td><input data-element-field="shortname" aria-label="Shortname" value="${escapeHtml(row.shortname)}"></td>
        <td><input data-element-field="quantity" aria-label="Quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}"></td>
        <td><input data-element-field="width" aria-label="Width" type="number" min="0" step="1" value="${escapeHtml(row.width)}"></td>
        <td><input data-element-field="height" aria-label="Height" type="number" min="0" step="1" value="${escapeHtml(row.height)}"></td>
        <td>
          <button class="ghost-button compact icon-button" type="button" data-remove-element-row aria-label="Remove row">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </td>
      </tr>
    `;
  }

  function syncJobInputFromElementTable() {
    const dataLines = getElementTableRows()
      .filter((row) => Object.values(row).some((value) => String(value).trim()))
      .map((row) => [
        formatCsvCell(row.shortname),
        formatCsvCell(row.quantity),
        formatCsvCell(row.width),
        formatCsvCell(row.height)
      ].join(", "));

    const lines = dataLines.length ? ["Shortname, Quantity, Width, Height", ...dataLines] : [];
    ui.jobInput.value = lines.join("\n");
  }

  function getElementTableRows() {
    return Array.from(ui.elementRowsBody.querySelectorAll("tr")).map((row) => ({
      shortname: row.querySelector("[data-element-field='shortname']")?.value || "",
      quantity: row.querySelector("[data-element-field='quantity']")?.value || "",
      width: row.querySelector("[data-element-field='width']")?.value || "",
      height: row.querySelector("[data-element-field='height']")?.value || ""
    }));
  }

  function handleElementTablePaste(event) {
    const input = event.target.closest("[data-element-field]") ||
      (document.activeElement && ui.elementTablePanel.contains(document.activeElement)
        ? document.activeElement.closest("[data-element-field]")
        : null) ||
      ui.elementRowsBody.querySelector("[data-element-field]");
    if (!input) return;

    const text = event.clipboardData?.getData("text") || "";
    const html = event.clipboardData?.getData("text/html") || "";
    if (!/[\t,\r\n]/.test(text) && !html) return;

    event.preventDefault();
    const pastedRows = getElementPasteRows({ text, html });
    if (!pastedRows.length) return;

    const currentRows = shouldReplaceElementTableFromPaste(input, pastedRows)
      ? []
      : getElementTableRows();
    const startRow = currentRows.length ? Array.from(ui.elementRowsBody.children).indexOf(input.closest("tr")) : 0;
    const fieldOrder = ["shortname", "quantity", "width", "height"];
    const startField = currentRows.length ? Math.max(0, fieldOrder.indexOf(input.dataset.elementField)) : 0;

    pastedRows.forEach((pastedRow, pastedIndex) => {
      const targetIndex = Math.max(0, startRow) + pastedIndex;
      if (!currentRows[targetIndex]) currentRows[targetIndex] = createBlankElementRow();
      fieldOrder.slice(startField).forEach((field, fieldOffset) => {
        if (pastedRow[fieldOffset] != null) {
          currentRows[targetIndex][field] = String(pastedRow[fieldOffset]).trim();
        }
      });
    });

    ui.elementRowsBody.innerHTML = "";
    currentRows.forEach((row) => appendElementTableRow(row));
    syncJobInputFromElementTable();
    recalculate();
  }

  function shouldReplaceElementTableFromPaste(input, pastedRows) {
    const firstRow = ui.elementRowsBody.querySelector("tr");
    const firstField = firstRow?.querySelector("[data-element-field='shortname']");
    const startsAtFirstCell = input === firstField;
    const isRange = pastedRows.length > 1 || pastedRows.some((row) => row.length > 1);
    return startsAtFirstCell && isRange;
  }

  function parseSpreadsheetText(text) {
    const delimiter = text.includes("\t") ? "\t" : ",";
    return parseCsv(text, delimiter).map((row) => row.map((cell) => String(cell).trim()));
  }

  function parseSpreadsheetHtml(html) {
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent.trim())
    );
  }

  function formatCsvCell(value) {
    const text = String(value || "").trim();
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
  }

  async function addArtworkFiles(files) {
    const artworkFiles = files.filter((file) => isArtworkFile(file));
    if (!artworkFiles.length) return;

    const parsed = parseElements(ui.jobInput.value);
    ui.artworkList.innerHTML = `<div class="artwork-empty">Preparing artwork...</div>`;
    const settled = await Promise.allSettled(artworkFiles.map((file) => readArtworkFile(file, parsed.elements)));
    const artworks = settled
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    state.artworkErrors = settled
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason && result.reason.message ? result.reason.message : "Artwork could not be loaded.");

    state.artworks.push(...artworks);
    recalculate();
  }

  async function readArtworkFile(file, elements) {
    if (isPdfFile(file)) {
      return renderPdfArtworkFile(file, elements);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = String(reader.result || "");
          const dimensions = await loadImageDimensions(dataUrl);
          resolve(createArtworkRecord({
            name: file.name,
            type: file.type,
            sourceType: "image",
            pageLabel: "",
            dataUrl,
            dimensions,
            elements
          }));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error || new Error("Could not read image file"));
      reader.readAsDataURL(file);
    });
  }

  async function renderPdfArtworkFile(file, elements) {
    const pdfjs = await loadPdfjs();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxSide = Math.max(baseViewport.width, baseViewport.height);
    const renderScale = Math.min(2.5, Math.max(0.5, 1800 / maxSide));
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const dimensions = {
      width: canvas.width,
      height: canvas.height
    };
    page.cleanup();
    pdf.destroy();

    return createArtworkRecord({
      name: file.name,
      type: "image/png",
      sourceType: "pdf",
      pageLabel: "PDF page 1",
      dataUrl,
      dimensions,
      elements
    });
  }

  function createArtworkRecord({ name, type, sourceType, pageLabel, dataUrl, dimensions, elements }) {
    return {
      id: `art-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      stem: getFileStem(name),
      type,
      sourceType,
      pageLabel,
      dataUrl,
      intrinsicWidth: dimensions.width,
      intrinsicHeight: dimensions.height,
      artworkScale: 1,
      cropX: 50,
      cropY: 50,
      mappedShortname: chooseArtworkMapping(name, elements)
    };
  }

  function loadImageDimensions(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!width || !height) {
          reject(new Error("Artwork dimensions could not be read."));
          return;
        }
        resolve({ width, height });
      };
      image.onerror = () => reject(new Error("Artwork dimensions could not be read."));
      image.src = dataUrl;
    });
  }

  async function loadPdfjs() {
    if (!pdfjsPromise) {
      const workerUrl = new URL("./pdfjs/pdf.worker.classic.js", document.baseURI).href;
      pdfjsPromise = Promise.resolve().then(() => {
        const pdfjs = window.pdfjsLib;
        if (!pdfjs) throw new Error("PDF renderer could not be loaded.");
        pdfjs.GlobalWorkerOptions.workerPort = null;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        return pdfjs;
      });
    }
    return pdfjsPromise;
  }

  function chooseArtworkMapping(fileName, elements) {
    if (!elements.length) return "";
    const fileKey = normalizeKey(getFileStem(fileName));
    const exact = elements.find((element) => normalizeKey(element.shortname) === fileKey);
    if (exact) return exact.shortname;
    const contains = elements.find((element) => {
      const elementKey = normalizeKey(element.shortname);
      return fileKey.includes(elementKey) || elementKey.includes(fileKey);
    });
    if (contains) return contains.shortname;
    return elements.length === 1 ? elements[0].shortname : "";
  }

  async function refreshProducts() {
    ui.sheetStatus.textContent = "Selector: loading";
    try {
      const selectorData = await loadSelectorFromGviz();
      if (!selectorData.rows.length) throw new Error("No selector rows in sheet");
      applySelectorData(selectorData, "live");
    } catch (error) {
      try {
        const selectorData = await loadSelectorFromCsvExport();
        if (!selectorData.rows.length) throw new Error("No selector rows in CSV export");
        applySelectorData(selectorData, "live");
      } catch (fallbackError) {
        applySelectorData(parseSelectorCsv(FALLBACK_SELECTOR_CSV), "fallback");
      }
    }

    recalculate();
  }

  async function loadSelectorFromCsvExport() {
    const response = await fetch(`${SHEET_CSV_URL}&_=${Date.now()}`, { cache: "reload" });
    if (!response.ok) throw new Error("Sheet request failed");
    return parseSelectorCsv(await response.text());
  }

  function loadSelectorFromGviz() {
    return new Promise((resolve, reject) => {
      const callbackName = `__rollStockSheet${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Sheet JSONP timed out"));
      }, 5000);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = (payload) => {
        cleanup();
        try {
          resolve(parseSelectorGviz(payload));
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("Sheet JSONP failed"));
      };

      script.src = `${SHEET_GVIZ_URL}&tqx=out:json;responseHandler:${callbackName}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  function applySelectorData(selectorData, source) {
    state.selectorRows = selectorData.rows;
    state.selectorColumns = selectorData.selectorColumns;
    state.postProductSelectorColumns = selectorData.postProductSelectorColumns || [];
    state.productSource = source;
    validateSelectorSelections();
    ui.sheetStatus.textContent = source === "live" ? "Selector: live" : "Selector: fallback";
  }

  function recalculate() {
    const parsed = parseElements(ui.jobInput.value);
    renderInputErrors(parsed.errors);
    reconcileArtworkMappings(parsed.elements);
    const selectorState = getSelectorState();
    state.selectedProduct = selectorState.product;
    renderProductSearch();
    renderSelectorSurvey(selectorState);

    if (!parsed.elements.length) {
      state.currentBest = null;
      state.currentOptions = [];
      renderArtworkList(parsed.elements);
      renderEmptyResults();
      return;
    }

    const product = selectorState.product;
    if (!product) {
      state.currentBest = null;
      state.currentOptions = [];
      renderArtworkList(parsed.elements);
      renderProductRequired(selectorState);
      return;
    }

    const settings = getSettings();
    const options = product.rolls.map((roll) => evaluateRoll(product, roll, parsed.elements, settings));
    const ranked = options.slice().sort(compareRollOptions);
    const best = ranked[0];

    state.currentOptions = ranked;
    state.currentBest = best;

    renderArtworkList(parsed.elements);
    renderResults(best, ranked, parsed.elements);
  }

  function getSettings() {
    const bleedType = document.querySelector("input[name='bleed-type']:checked").value;
    return {
      bleedType,
      bleedMm: cleanNumber(ui.bleedMm.value, 0),
      overlapMm: cleanNumber(ui.overlapMm.value, 0),
      useOffsetJoins: state.useOffsetJoins
    };
  }

  function getSelectorState() {
    const selections = state.selectorSelections;
    const candidates = getCandidateSelectorRows(selections);
    const question = getNextSelectorQuestion(candidates, selections);
    const product = question ? null : buildSelectedProduct(candidates, selections);
    const pathEntries = getSelectorPathEntries(selections, candidates, question);

    return {
      selections,
      pathEntries,
      candidates,
      question,
      product,
      hasRows: state.selectorRows.length > 0,
      completeProductCount: candidates.filter((row) => row.isCompleteProduct).length
    };
  }

  function renderProductSearch() {
    const query = state.productSearchQuery.trim();
    if (ui.productSearch.value !== state.productSearchQuery) {
      ui.productSearch.value = state.productSearchQuery;
    }
    if (!query) {
      ui.productSearchResults.innerHTML = "";
      return;
    }

    const results = getProductSearchResults(query);
    if (!results.length) {
      ui.productSearchResults.innerHTML = `<div class="product-search-empty">No matching products.</div>`;
      return;
    }

    ui.productSearchResults.innerHTML = `
      <div class="product-search-list">
        ${results.map((result) => renderProductSearchResult(result)).join("")}
      </div>
    `;
  }

  function getProductSearchResults(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const seen = new Set();
    const results = [];

    state.selectorRows.forEach((row, index) => {
      if (!row.isCompleteProduct || !row.Product) return;
      const haystack = `${row.Product || ""} ${row.Laminate || ""}`.toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return;

      const key = [
        row.Product,
        row.Laminate,
        row[MOUNTING_SURFACE_COLUMN],
        row["Internal/External"],
        row.Type,
        row[DERIVED_PERFORATION_COLUMN],
        row.Longevity
      ].map((value) => String(value || "").trim()).join("\u001f");
      if (seen.has(key)) return;
      seen.add(key);
      results.push({ row, index });
    });

    return results.slice(0, 20);
  }

  function renderProductSearchResult({ row, index }) {
    const meta = getProductSearchMeta(row);
    return `
      <button class="product-search-result" type="button" data-product-search-index="${index}">
        <strong>${escapeHtml(row.Product)}</strong>
        ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
      </button>
    `;
  }

  function getProductSearchMeta(row) {
    const parts = [
      row.Laminate ? `Laminate: ${row.Laminate}` : "",
      row[MOUNTING_SURFACE_COLUMN],
      row["Internal/External"],
      row.Type,
      row[DERIVED_PERFORATION_COLUMN],
      row.Longevity
    ].filter(Boolean);
    const widths = row.rolls && row.rolls.length
      ? row.rolls.map((roll) => `${formatInteger(roll.width)} mm`).join(", ")
      : "";
    if (widths) parts.push(widths);
    return parts.join(" | ");
  }

  function applyProductSearchSelection(rowIndex) {
    const row = state.selectorRows[rowIndex];
    if (!row) return;

    const selections = {};
    getSelectorSelectionOrder().forEach((column) => {
      const value = String(row[column] || "").trim();
      if (value && isMeaningfulSelectorValue(value)) {
        selections[column] = value;
      }
    });

    state.selectorSelections = selections;
    state.productSearchQuery = "";
    ui.productSearch.value = "";
    validateSelectorSelections();
    recalculate();
  }

  function getCandidateSelectorRows(selections) {
    return state.selectorRows.filter((row) =>
      Object.entries(selections).every(([column, value]) => !value || String(row[column] || "") === value)
    );
  }

  function getSelectorPathEntries(selections, candidates, question) {
    const entries = [];

    for (const column of state.selectorColumns) {
      if (selections[column]) {
        entries.push({ column, value: selections[column], inferred: false });
        continue;
      }

      if (question && question.column === column) break;
      const choices = getDistinctValues(candidates, column);
      if (choices.length === 1 && isMeaningfulSelectorValue(choices[0])) {
        entries.push({ column, value: choices[0], inferred: true });
      }
    }

    if (selections.Product) {
      entries.push({ column: "Product", value: selections.Product, inferred: false });
    } else if (!question || question.column !== "Product") {
      const productChoices = getDistinctValues(candidates.filter((row) => row.isCompleteProduct), "Product");
      if (productChoices.length === 1 && isMeaningfulSelectorValue(productChoices[0])) {
        entries.push({ column: "Product", value: productChoices[0], inferred: true });
      }
    }

    for (const column of state.postProductSelectorColumns) {
      if (selections[column]) {
        entries.push({ column, value: selections[column], inferred: false });
        continue;
      }

      if (question && question.column === column) break;
      const choices = getDistinctValues(candidates, column);
      if (choices.length === 1 && isMeaningfulSelectorValue(choices[0])) {
        entries.push({ column, value: choices[0], inferred: true });
      }
    }

    return entries;
  }

  function getNextSelectorQuestion(candidates, selections) {
    if (state.selectorColumns[0] === MOUNTING_SURFACE_COLUMN && !selections[MOUNTING_SURFACE_COLUMN]) {
      const mountingSurfaceChoices = getDistinctValues(candidates, MOUNTING_SURFACE_COLUMN);
      if (mountingSurfaceChoices.length) {
        return {
          column: MOUNTING_SURFACE_COLUMN,
          label: MOUNTING_SURFACE_COLUMN,
          choices: mountingSurfaceChoices
        };
      }
    }

    for (const column of state.selectorColumns) {
      if (selections[column]) continue;
      const choices = getDistinctValues(candidates, column);
      if (choices.length > 1) {
        return { column, label: column, choices };
      }
    }

    if (!selections.Product) {
      const productChoices = getDistinctValues(candidates.filter((row) => row.isCompleteProduct), "Product");
      if (productChoices.length > 1) {
        return { column: "Product", label: "Product", choices: productChoices };
      }
    }

    for (const column of state.postProductSelectorColumns) {
      if (selections[column]) continue;
      const choices = getDistinctValues(candidates, column);
      if (choices.length > 1) {
        return { column, label: column, choices };
      }
    }

    return null;
  }

  function buildSelectedProduct(candidates, selections) {
    const completeRows = candidates.filter((row) => row.isCompleteProduct);
    if (!completeRows.length) return null;

    const productName = selections.Product || getDistinctValues(completeRows, "Product")[0];
    if (!productName) return null;

    const productRows = completeRows.filter((row) => row.Product === productName);
    if (!productRows.length) return null;

    const rollsByWidth = new Map();
    productRows.forEach((row) => {
      row.rolls.forEach((roll) => {
        const existing = rollsByWidth.get(roll.width);
        if (!existing ||
          (existing.costEstimated && !roll.costEstimated) ||
          (!existing.qcode && roll.qcode)
        ) {
          rollsByWidth.set(roll.width, { ...roll });
        }
      });
    });

    const printSqmRate = productRows.find((row) => Number.isFinite(row.printSqmRate))?.printSqmRate;

    return {
      name: productName.trim(),
      rolls: Array.from(rollsByWidth.values()).sort((a, b) => a.width - b.width),
      printSqmRate,
      selectorRow: productRows[0],
      selectorSelections: { ...selections }
    };
  }

  function getDistinctValues(rows, column) {
    const values = Array.from(new Set(rows.map((row) => String(row[column] || "").trim()).filter(Boolean)));
    return isPerforationColumnName(column) ? values.sort(comparePerforationChoices) : values;
  }

  function isMeaningfulSelectorValue(value) {
    const key = normalizeKey(value);
    return Boolean(key) && key !== "true" && key !== "false";
  }

  function pruneSelectionsAfter(column) {
    const order = getSelectorSelectionOrder();
    const index = order.indexOf(column);
    if (index < 0) return;
    order.slice(index + 1).forEach((laterColumn) => {
      delete state.selectorSelections[laterColumn];
    });
    validateSelectorSelections();
  }

  function validateSelectorSelections() {
    const validated = {};
    getSelectorSelectionOrder().forEach((column) => {
      if (!state.selectorSelections[column]) return;
      const testSelections = { ...validated, [column]: state.selectorSelections[column] };
      if (getCandidateSelectorRows(testSelections).length) {
        validated[column] = state.selectorSelections[column];
      }
    });
    state.selectorSelections = validated;
  }

  function undoLastSelectorSelection() {
    const order = getSelectorSelectionOrder();
    for (let index = order.length - 1; index >= 0; index -= 1) {
      const column = order[index];
      if (state.selectorSelections[column]) {
        delete state.selectorSelections[column];
        return;
      }
    }
  }

  function getSelectorSelectionOrder() {
    return [...state.selectorColumns, "Product", ...state.postProductSelectorColumns];
  }

  function evaluateRoll(product, roll, elements, settings) {
    const printDimensions = elements.map((element) => getPrintDimensions(element, settings));
    const maxUnrotatedPrintWidth = printDimensions.reduce((max, dims) => Math.max(max, dims.printWidth), 0);
    const unrotatedFitCount = printDimensions.filter((dims) => dims.printWidth <= roll.width + 0.001).length;
    const unrotatedFitsAll = unrotatedFitCount === elements.length;
    const evenElementPlans = elements.map((element, index) =>
      chooseElementPlan(element, index, roll.width, settings, "even")
    );
    const offsetElementPlans = elements.map((element, index) =>
      chooseElementPlan(element, index, roll.width, settings, "right-offset")
    );
    const evenGroups = evenElementPlans.flatMap((plan) => plan.groups);
    const offsetGroups = offsetElementPlans.flatMap((plan) => plan.groups);
    const evenPack = packGroupsBestFit(evenGroups, roll.width, "nested");
    const offsetPack = packGroupsBestFit(offsetGroups, roll.width, "offset");
    const offsetSaves = offsetPack.lengthMm + 0.1 < evenPack.lengthMm;
    const selectedPack = settings.useOffsetJoins === true && offsetSaves ? offsetPack : evenPack;
    const elementPlans = settings.useOffsetJoins === true && offsetSaves ? offsetElementPlans : evenElementPlans;
    const groups = settings.useOffsetJoins === true && offsetSaves ? offsetGroups : evenGroups;
    const joins = elementPlans.reduce((total, plan) => total + plan.joins, 0);
    const costs = calculateCosts(selectedPack, roll, elements, product.printSqmRate);

    return {
      productName: product.name,
      printSqmRate: product.printSqmRate,
      roll,
      elementPlans,
      evenElementPlans,
      offsetElementPlans,
      groups,
      evenPack,
      offsetPack,
      offsetSaves,
      selectedPack,
      joins,
      unrotatedFitsAll,
      unrotatedFitCount,
      maxUnrotatedPrintWidth,
      costs
    };
  }

  function compareRollOptions(a, b) {
    return (
      a.joins - b.joins ||
      Number(b.unrotatedFitsAll) - Number(a.unrotatedFitsAll) ||
      b.unrotatedFitCount - a.unrotatedFitCount ||
      a.selectedPack.lengthMm - b.selectedPack.lengthMm ||
      a.costs.total - b.costs.total ||
      a.roll.width - b.roll.width
    );
  }

  function chooseElementPlan(element, elementIndex, stockWidth, settings, panelMode) {
    const printDims = getPrintDimensions(element, settings);
    const orientations = [{
      rotated: false,
      printWidth: printDims.printWidth,
      printHeight: printDims.printHeight
    }];

    const rotatedOrientation = {
      rotated: true,
      printWidth: printDims.printHeight,
      printHeight: printDims.printWidth
    };

    if (rotatedOrientation.printWidth <= stockWidth + 0.001) {
      orientations.push(rotatedOrientation);
    }

    const candidates = orientations.map((orientation) =>
      buildOrientationPlan(element, elementIndex, orientation, stockWidth, settings, panelMode)
    );

    candidates.sort((a, b) => {
      return (
        a.joins - b.joins ||
        a.separateLengthMm - b.separateLengthMm ||
        a.totalPrintedAreaMm2 - b.totalPrintedAreaMm2
      );
    });

    return candidates[0];
  }

  function buildOrientationPlan(element, elementIndex, orientation, stockWidth, settings, panelMode) {
    const overlapMm = Math.min(settings.overlapMm, Math.max(0, stockWidth - 1));
    const drops = countDrops(orientation.printWidth, stockWidth, overlapMm);
    const color = COLORS[elementIndex % COLORS.length];
    const groups = [];
    let joinMode = "none";

    if (drops === 1) {
      groups.push({
        key: `${elementIndex}-whole-${orientation.rotated}`,
        elementIndex,
        shortname: element.shortname,
        count: element.quantity,
        width: orientation.printWidth,
        height: orientation.printHeight,
        color,
        rotated: orientation.rotated,
        drops,
        panelIndex: null,
        panelCount: 1,
        visiblePanelWidth: orientation.printWidth,
        panelSourceX: 0,
        fullPrintWidth: orientation.printWidth,
        fullPrintHeight: orientation.printHeight
      });
    } else {
      const panels = createPanels(orientation.printWidth, drops, stockWidth, overlapMm, panelMode);
      joinMode = panels.mode;
      panels.widths.forEach((panelWidth, panelIndex) => {
        groups.push({
          key: `${elementIndex}-panel-${panelIndex}-${orientation.rotated}`,
          elementIndex,
          shortname: element.shortname,
          count: element.quantity,
          width: panelWidth,
          height: orientation.printHeight,
          color,
          rotated: orientation.rotated,
          drops,
          panelIndex: panelIndex + 1,
          panelCount: drops,
          visiblePanelWidth: panels.visibleWidths[panelIndex],
          panelSourceX: panels.sourceStarts[panelIndex],
          fullPrintWidth: orientation.printWidth,
          fullPrintHeight: orientation.printHeight
        });
      });
    }

    const separate = packGroupsSeparately(groups, stockWidth);
    const totalPrintedAreaMm2 = groups.reduce(
      (total, group) => total + group.count * group.width * group.height,
      0
    );

    return {
      elementIndex,
      element,
      printWidth: orientation.printWidth,
      printHeight: orientation.printHeight,
      rotated: orientation.rotated,
      drops,
      joinDirection: drops > 1 ? "vertical" : "none",
      joins: element.quantity * Math.max(0, drops - 1),
      joinMode,
      groups,
      separateLengthMm: separate.lengthMm,
      totalPrintedAreaMm2
    };
  }

  function getPrintDimensions(element, settings) {
    const bleed = settings.bleedMm;
    const edges = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };

    if (settings.bleedType === "all") {
      edges.left = bleed;
      edges.right = bleed;
      edges.top = bleed;
      edges.bottom = bleed;
    } else if (settings.bleedType === "bottom-right") {
      edges.right = bleed;
      edges.bottom = bleed;
    }

    return {
      printWidth: element.width + edges.left + edges.right,
      printHeight: element.height + edges.top + edges.bottom,
      edges
    };
  }

  function countDrops(printWidth, stockWidth, overlapMm) {
    if (printWidth <= stockWidth) return 1;
    const step = stockWidth - overlapMm;
    if (step <= 0) return Number.POSITIVE_INFINITY;
    let drops = 1;
    let covered = stockWidth;
    while (covered + 0.001 < printWidth && drops < 1000) {
      drops += 1;
      covered += step;
    }
    return drops;
  }

  function createPanels(printWidth, drops, stockWidth, overlapMm, panelMode) {
    const evenVisible = printWidth / drops;
    const evenWidths = Array.from({ length: drops }, (_, index) =>
      index < drops - 1 ? evenVisible + overlapMm : evenVisible
    );

    if (panelMode !== "right-offset" && evenWidths.every((width) => width <= stockWidth + 0.001)) {
      return {
        mode: "even",
        widths: evenWidths,
        visibleWidths: Array.from({ length: drops }, () => evenVisible),
        sourceStarts: Array.from({ length: drops }, (_, index) => index * evenVisible)
      };
    }

    return createRightOffsetPanels(printWidth, drops, stockWidth, overlapMm);
  }

  function createRightOffsetPanels(printWidth, drops, stockWidth, overlapMm) {
    const widths = [];
    const visibleWidths = [];
    const sourceStarts = [];
    let remainingVisible = printWidth;
    let sourceStart = 0;

    for (let index = 0; index < drops; index += 1) {
      sourceStarts.push(sourceStart);
      if (index < drops - 1) {
        const visible = stockWidth - overlapMm;
        widths.push(stockWidth);
        visibleWidths.push(visible);
        remainingVisible -= visible;
        sourceStart += visible;
      } else {
        widths.push(Math.max(0, Math.min(stockWidth, remainingVisible)));
        visibleWidths.push(Math.max(0, remainingVisible));
      }
    }

    return { mode: "right-offset", widths, visibleWidths, sourceStarts };
  }

  function packGroupsSeparately(groups, stockWidth) {
    const placements = [];
    let yCursor = 0;
    let rows = 0;
    const totalPieces = groups.reduce((total, group) => total + group.count, 0);

    groups.forEach((group, groupIndex) => {
      if (group.count <= 0) return;
      if (group.width > stockWidth + 0.001) return;

      const across = Math.max(1, Math.floor((stockWidth + TILE_OFFSET_MM) / (group.width + TILE_OFFSET_MM)));
      const rowCount = Math.ceil(group.count / across);
      const blockStartY = yCursor + (yCursor > 0 ? TILE_OFFSET_MM : 0);
      const blockLength = rowCount * group.height + Math.max(0, rowCount - 1) * TILE_OFFSET_MM;
      const remainingSlots = Math.max(0, MAX_PREVIEW_PLACEMENTS - placements.length);
      const previewCount = Math.min(group.count, remainingSlots);

      for (let copy = 0; copy < previewCount; copy += 1) {
        const row = Math.floor(copy / across);
        const column = copy % across;
        placements.push(makePlacement(group, column * (group.width + TILE_OFFSET_MM), blockStartY + row * (group.height + TILE_OFFSET_MM)));
      }

      yCursor = blockStartY + blockLength;
      rows += rowCount + (groupIndex > 0 ? 1 : 0);
    });

    return {
      strategy: "even",
      lengthMm: yCursor,
      rows,
      placements,
      totalPieces,
      truncated: placements.length < totalPieces
    };
  }

  function packGroupsBestFit(groups, stockWidth, strategy) {
    const pieces = expandGroupPieces(groups, stockWidth);
    const totalPieces = groups.reduce((total, group) => total + Math.max(0, group.count || 0), 0);

    if (!pieces.length) {
      return {
        strategy,
        lengthMm: 0,
        rows: 0,
        placements: [],
        totalPieces,
        truncated: totalPieces > 0
      };
    }

    const packOrders = [
      (a, b) => b.height - a.height || b.width - a.width || b.area - a.area || a.originalIndex - b.originalIndex,
      (a, b) => b.area - a.area || b.height - a.height || b.width - a.width || a.originalIndex - b.originalIndex,
      (a, b) => b.width - a.width || b.height - a.height || b.area - a.area || a.originalIndex - b.originalIndex,
      (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height) || b.area - a.area || a.originalIndex - b.originalIndex,
      (a, b) => a.originalIndex - b.originalIndex || a.copyIndex - b.copyIndex
    ];

    let best = null;
    packOrders.forEach((sorter) => {
      const ordered = pieces.slice().sort(sorter);
      const packed = packPiecesWithSkyline(ordered, stockWidth, strategy, totalPieces);
      if (!best || comparePacks(packed, best) < 0) {
        best = packed;
      }
    });

    return best;
  }

  function expandGroupPieces(groups, stockWidth) {
    const pieces = [];

    groups.forEach((group, originalIndex) => {
      if (!group || group.count <= 0 || group.width > stockWidth + 0.001) return;
      for (let copyIndex = 0; copyIndex < group.count; copyIndex += 1) {
        pieces.push({
          group,
          originalIndex,
          copyIndex,
          width: group.width,
          height: group.height,
          area: group.width * group.height
        });
      }
    });

    return pieces;
  }

  function packPiecesWithSkyline(pieces, stockWidth, strategy, totalPieces) {
    const skyline = [{ x: 0, y: 0, width: stockWidth }];
    const placements = [];
    let lengthMm = 0;
    let placedCount = 0;

    pieces.forEach((piece) => {
      const position = findBestSkylinePosition(piece, skyline, stockWidth);
      if (!position) return;

      if (placements.length < MAX_PREVIEW_PLACEMENTS) {
        placements.push(makePlacement(piece.group, position.x, position.y));
      }

      placedCount += 1;
      lengthMm = Math.max(lengthMm, position.y + piece.height);
      addSkylineLevel(skyline, position.x, position.y + piece.height + TILE_OFFSET_MM, position.footprintWidth);
    });

    placements.sort((a, b) => a.y - b.y || a.x - b.x || a.elementIndex - b.elementIndex);

    return {
      strategy,
      lengthMm,
      rows: skyline.length,
      placements,
      totalPieces,
      truncated: placements.length < totalPieces,
      unplaced: totalPieces - placedCount
    };
  }

  function findBestSkylinePosition(piece, skyline, stockWidth) {
    const candidates = new Set();
    skyline.forEach((segment) => {
      candidates.add(roundMm(segment.x));
      candidates.add(roundMm(Math.max(0, segment.x + segment.width - piece.width)));
    });

    let best = null;
    candidates.forEach((candidateX) => {
      const x = Number(candidateX);
      if (x < -0.001 || x + piece.width > stockWidth + 0.001) return;

      const footprintWidth = getFootprintWidth(piece.width, x, stockWidth);
      const y = getSkylineY(skyline, x, footprintWidth);
      if (y == null) return;

      const top = y + piece.height;
      const footprintTop = top + TILE_OFFSET_MM;
      const rightWaste = Math.max(0, stockWidth - (x + piece.width));
      const score = {
        top,
        footprintTop,
        y,
        rightWaste,
        x
      };

      if (!best || compareSkylineScore(score, best.score) < 0) {
        best = { x, y, footprintWidth, score };
      }
    });

    return best;
  }

  function getFootprintWidth(width, x, stockWidth) {
    const remaining = stockWidth - x - width;
    if (remaining <= 0.001) return width;
    return width + Math.min(TILE_OFFSET_MM, remaining);
  }

  function getSkylineY(skyline, x, width) {
    const end = x + width;
    let covered = x;
    let y = 0;

    for (const segment of skyline) {
      const segmentEnd = segment.x + segment.width;
      if (segmentEnd <= covered + 0.001) continue;
      if (segment.x > covered + 0.001) return null;

      const overlapEnd = Math.min(segmentEnd, end);
      if (overlapEnd > covered + 0.001) {
        y = Math.max(y, segment.y);
        covered = overlapEnd;
      }
      if (covered >= end - 0.001) return y;
    }

    return null;
  }

  function addSkylineLevel(skyline, x, y, width) {
    const end = x + width;
    const updated = [];

    skyline.forEach((segment) => {
      const segmentEnd = segment.x + segment.width;
      if (segmentEnd <= x + 0.001 || segment.x >= end - 0.001) {
        updated.push(segment);
        return;
      }
      if (segment.x < x - 0.001) {
        updated.push({ x: segment.x, y: segment.y, width: x - segment.x });
      }
      if (segmentEnd > end + 0.001) {
        updated.push({ x: end, y: segment.y, width: segmentEnd - end });
      }
    });

    updated.push({ x, y, width });
    updated.sort((a, b) => a.x - b.x);
    skyline.splice(0, skyline.length, ...mergeSkylineSegments(updated));
  }

  function mergeSkylineSegments(segments) {
    const merged = [];

    segments.forEach((segment) => {
      if (segment.width <= 0.001) return;
      const last = merged[merged.length - 1];
      if (last && Math.abs(last.y - segment.y) < 0.001 && Math.abs(last.x + last.width - segment.x) < 0.001) {
        last.width += segment.width;
      } else {
        merged.push({ ...segment });
      }
    });

    return merged;
  }

  function compareSkylineScore(a, b) {
    return (
      a.top - b.top ||
      a.footprintTop - b.footprintTop ||
      a.y - b.y ||
      a.rightWaste - b.rightWaste ||
      a.x - b.x
    );
  }

  function comparePacks(a, b) {
    return (
      (a.unplaced || 0) - (b.unplaced || 0) ||
      a.lengthMm - b.lengthMm ||
      a.rows - b.rows ||
      a.placements.length - b.placements.length
    );
  }

  function roundMm(value) {
    return Math.round(value * 1000) / 1000;
  }

  function makePlacement(group, x, y) {
    return {
      x,
      y,
      width: group.width,
      height: group.height,
      elementIndex: group.elementIndex,
      shortname: group.shortname,
      color: group.color,
      rotated: group.rotated,
      panelIndex: group.panelIndex,
      panelCount: group.panelCount,
      visiblePanelWidth: group.visiblePanelWidth,
      panelSourceX: group.panelSourceX,
      fullPrintWidth: group.fullPrintWidth,
      fullPrintHeight: group.fullPrintHeight,
      drops: group.drops
    };
  }

  function calculateCosts(pack, roll, elements, printSqmRate) {
    const printLinearM = pack.lengthMm / 1000;
    const loadingLinearM = MATERIAL_LOADING_MM / 1000;
    const stockLinearM = printLinearM + loadingLinearM;
    const laminateLinearM = roll.laminateCost > 0 ? printLinearM + loadingLinearM : 0;
    const stockAreaSqm = (roll.width / 1000) * stockLinearM;
    const printAreaSqm = (roll.width / 1000) * printLinearM;
    const productStockCharge = roll.productCost * stockLinearM * STOCK_MULTIPLIER;
    const laminateCharge = roll.laminateCost * laminateLinearM * LAMINATE_MULTIPLIER;
    const stockCharge = productStockCharge + laminateCharge;
    const printRate = Number.isFinite(printSqmRate) ? printSqmRate : PRINT_PER_SQM;
    const printCharge = printAreaSqm * printRate;
    const trimCharge = elements.reduce((total, element) => {
      const perimeterM = (2 * (element.width + element.height)) / 1000;
      return total + perimeterM * element.quantity * TRIM_PER_LINEAR_M;
    }, 0);
    const unitCharge = elements.reduce((total, element) => total + element.quantity * UNIT_PRICE, 0);
    const finishedAreaSqm = elements.reduce(
      (total, element) => total + element.quantity * (element.width * element.height) / 1000000,
      0
    );
    const total = SETUP_FEE + stockCharge + printCharge + trimCharge + unitCharge;
    const rate = finishedAreaSqm > 0 ? total / finishedAreaSqm : 0;

    return {
      linearM: stockLinearM,
      printLinearM,
      loadingLinearM,
      stockLinearM,
      laminateLinearM,
      stockAreaSqm,
      printAreaSqm,
      productStockCharge,
      laminateCharge,
      stockCharge,
      printCharge,
      printRate,
      trimCharge,
      unitCharge,
      setupFee: SETUP_FEE,
      finishedAreaSqm,
      total,
      rate
    };
  }

  function parseElements(text) {
    const rows = parseDelimited(text);
    const elements = [];
    const errors = [];
    let firstDataRow = 0;

    if (rows[0] && rows[0].some((cell) => /shortname|quantity|width|height/i.test(cell))) {
      firstDataRow = 1;
    }

    rows.slice(firstDataRow).forEach((row, index) => {
      const rowNumber = index + firstDataRow + 1;
      if (!row.some((cell) => String(cell).trim())) return;
      const [shortname, quantity, width, height] = row;
      const element = {
        shortname: String(shortname || `Element ${rowNumber}`).trim(),
        quantity: Math.max(0, Math.floor(cleanNumber(quantity, NaN))),
        width: cleanNumber(width, NaN),
        height: cleanNumber(height, NaN)
      };

      if (!element.shortname || !Number.isFinite(element.quantity) || element.quantity <= 0) {
        errors.push(`Row ${rowNumber}: quantity is missing or zero.`);
        return;
      }
      if (!Number.isFinite(element.width) || element.width <= 0 || !Number.isFinite(element.height) || element.height <= 0) {
        errors.push(`Row ${rowNumber}: width and height must be positive millimetres.`);
        return;
      }
      elements.push(element);
    });

    return { elements, errors };
  }

  function parseSelectorCsv(csv) {
    const parsedRows = parseCsv(csv, ",").filter((row) => row.some((cell) => String(cell).trim()));
    return parseSelectorRows(parsedRows);
  }

  function parseSelectorGviz(payload) {
    const headers = payload && payload.table && Array.isArray(payload.table.cols)
      ? payload.table.cols.map((column) => String(column.label || column.id || "").trim())
      : [];
    const tableRows = payload && payload.table && Array.isArray(payload.table.rows)
      ? payload.table.rows
      : [];
    const rows = tableRows.map((row) =>
      (row.c || []).map((cell) => (cell && cell.v != null ? cell.v : ""))
    );
    return parseSelectorRows(headers.length ? [headers, ...rows] : rows);
  }

  function parseSelectorRows(rows) {
    if (!rows.length) return { rows: [], selectorColumns: [] };
    const headers = rows[0].map((header) => String(header || "").trim());
    const productIndex = findHeaderIndex(headers, "Product");
    const mountingSurfaceMatrixColumns = getMountingSurfaceMatrixColumns(rows, headers, productIndex);
    const hasMountingSurfaceMatrix = mountingSurfaceMatrixColumns.length > 0;
    const mountingSurfaceMatrixHeaderSet = new Set(mountingSurfaceMatrixColumns.map((column) => column.header));
    let baseSelectorColumns = headers
      .slice(0, productIndex >= 0 ? productIndex : headers.length)
      .filter((header) => !mountingSurfaceMatrixHeaderSet.has(header))
      .filter((header) => !hasMountingSurfaceMatrix || !isMatrixReplacedSelectorColumn(header))
      .filter(Boolean);
    if (hasMountingSurfaceMatrix) {
      baseSelectorColumns = [MOUNTING_SURFACE_COLUMN, ...baseSelectorColumns];
    }
    const postProductSelectorColumns = productIndex >= 0
      ? headers.slice(productIndex + 1)
        .filter((header) => header && isPostProductSelectorColumn(header))
        .filter((header) => !hasMountingSurfaceMatrix || !isMatrixReplacedSelectorColumn(header))
      : [];
    const perforationColumn = baseSelectorColumns.find(isPerforationColumnName);

    const selectorRows = rows.slice(1).flatMap((row) => {
      const data = {};
      headers.forEach((header, index) => {
        if (header) data[header] = String(row[index] ?? "").trim();
      });
      const mountingSurfaces = getSuitableMountingSurfaces(row, mountingSurfaceMatrixColumns);
      return mountingSurfaces.map((mountingSurface) =>
        prepareSelectorRow(data, mountingSurface, hasMountingSurfaceMatrix, perforationColumn)
      );
    }).filter((row) =>
      baseSelectorColumns.some((column) => row[column]) ||
      (!perforationColumn && row[DERIVED_PERFORATION_COLUMN]) ||
      row.Product
    );

    const selectorColumns = buildSelectorColumns(baseSelectorColumns, selectorRows, perforationColumn);

    return { rows: selectorRows, selectorColumns, postProductSelectorColumns };
  }

  function getMountingSurfaceMatrixColumns(rows, headers, productIndex) {
    const startIndex = getMountingSurfaceMatrixStartIndex(rows, headers);
    const boundary = getMountingSurfaceMatrixBoundary(headers, productIndex, startIndex);

    return headers.slice(startIndex, boundary)
      .map((header, offset) => ({ header, index: startIndex + offset }))
      .filter((column) => column.header)
      .filter((column) => rows.slice(1).some((row) => isTrueCell(row[column.index])));
  }

  function getMountingSurfaceMatrixStartIndex(rows, headers) {
    const firstHeader = headers[0];
    if (!isMatrixReplacedSelectorColumn(firstHeader)) return 0;
    const firstColumnHasTrue = rows.slice(1).some((row) => isTrueCell(row[0]));
    return firstColumnHasTrue ? 0 : 1;
  }

  function getMountingSurfaceMatrixBoundary(headers, productIndex, startIndex) {
    const productBoundary = productIndex >= 0 ? productIndex : headers.length;
    const firstSelectorHeaderIndex = headers.findIndex((header, index) =>
      index >= startIndex && isMatrixBoundarySelectorColumn(header)
    );
    if (firstSelectorHeaderIndex >= 0) {
      return Math.min(firstSelectorHeaderIndex, productBoundary);
    }
    return productBoundary;
  }

  function getSuitableMountingSurfaces(row, mountingSurfaceMatrixColumns) {
    if (!mountingSurfaceMatrixColumns.length) {
      return [""];
    }

    return mountingSurfaceMatrixColumns
      .filter((column) => isTrueCell(row[column.index]))
      .map((column) => column.header);
  }

  function prepareSelectorRow(sourceData, mountingSurface, hasMountingSurfaceMatrix, perforationColumn) {
    const data = { ...sourceData };
    if (hasMountingSurfaceMatrix) {
      data[MOUNTING_SURFACE_COLUMN] = mountingSurface;
      data[LEGACY_SURFACE_COLUMN] = mountingSurface;
    }
    const perforation = normalizePerforationValue(perforationColumn ? data[perforationColumn] : "") ||
      extractPerforationValue(data);

    if (perforation && /perforat/i.test(data.Type || "")) {
      data.Type = stripPerforationFromType(data.Type);
    }
    if (perforationColumn) {
      data[perforationColumn] = perforation || data[perforationColumn];
    } else {
      data[DERIVED_PERFORATION_COLUMN] = perforation;
    }

    data.rolls = extractRolls(data);
    data.printSqmRate = cleanNumber(data["Print SQM Rate"], NaN);
    data.isCompleteProduct = Boolean(data.Product && data.rolls.length && Number.isFinite(data.printSqmRate));
    return data;
  }

  function isTrueCell(value) {
    return String(value ?? "").trim().toLowerCase() === "true";
  }

  function isMatrixReplacedSelectorColumn(header) {
    const key = normalizeKey(header);
    return key === normalizeKey(LEGACY_SURFACE_COLUMN) || key === normalizeKey(MOUNTING_SURFACE_COLUMN);
  }

  function isMatrixBoundarySelectorColumn(header) {
    const key = normalizeKey(header);
    return key === normalizeKey(LEGACY_SURFACE_COLUMN) ||
      key === normalizeKey(MOUNTING_SURFACE_COLUMN) ||
      key === "type" ||
      key === "printmode" ||
      key === "longevity" ||
      key === "laminate" ||
      isPerforationColumnName(header) ||
      isRollWidthColumnName(header) ||
      isProductCostColumnName(header) ||
      isLaminateCostColumnName(header) ||
      isQCodeColumnName(header) ||
      isIgnoredSelectorDataColumn(header) ||
      isPrintRateColumnName(header);
  }

  function isPostProductSelectorColumn(header) {
    return !isRollWidthColumnName(header) &&
      !isProductCostColumnName(header) &&
      !isLaminateCostColumnName(header) &&
      !isQCodeColumnName(header) &&
      !isIgnoredSelectorDataColumn(header) &&
      !isPrintRateColumnName(header);
  }

  function isIgnoredSelectorDataColumn(header) {
    const key = normalizeKey(header);
    return key === "updated" || key === "notes" || key === "note";
  }

  function buildSelectorColumns(baseSelectorColumns, selectorRows, perforationColumn) {
    if (perforationColumn || !selectorRows.some((row) => row[DERIVED_PERFORATION_COLUMN])) {
      return baseSelectorColumns;
    }

    const selectorColumns = baseSelectorColumns.slice();
    const typeIndex = selectorColumns.findIndex((column) => normalizeKey(column) === "type");
    selectorColumns.splice(typeIndex >= 0 ? typeIndex + 1 : selectorColumns.length, 0, DERIVED_PERFORATION_COLUMN);
    return selectorColumns;
  }

  function extractPerforationValue(row) {
    const candidates = [row.Type, row.Product, row[DERIVED_PERFORATION_COLUMN]].filter(Boolean);
    for (const candidate of candidates) {
      const perforation = normalizePerforationValue(candidate);
      if (perforation) return perforation;
    }
    return candidates.some((candidate) => /perforat/i.test(candidate)) ? "Not specified" : "";
  }

  function stripPerforationFromType(value) {
    return String(value || "")
      .replace(/(?:^|\s)\d{1,3}(?:\.\d+)?\s*%/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function normalizePerforationValue(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    const percentage = text.match(/(?:^|[^0-9])(\d{1,3}(?:\.\d+)?)\s*%/);
    if (percentage) return formatPerforationValue(Number.parseFloat(percentage[1]));

    const plainNumber = text.match(/^(\d{1,3}(?:\.\d+)?)$/);
    if (plainNumber) return formatPerforationValue(Number.parseFloat(plainNumber[1]));

    return "";
  }

  function formatPerforationValue(value) {
    if (!Number.isFinite(value) || value <= 0 || value > 100) return "";
    const rounded = Math.round(value * 100) / 100;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
  }

  function isPerforationColumnName(column) {
    const key = normalizeKey(column);
    return (
      key === "perforation" ||
      key === "perforationpercent" ||
      key === "perforationpercentage" ||
      key === "percentageperforation" ||
      key === "percentperforation" ||
      key === "perforatedpercent" ||
      key === "perforatedpercentage"
    );
  }

  function isRollWidthColumnName(column) {
    return /^width\d+$/i.test(normalizeKey(column));
  }

  function isProductCostColumnName(column) {
    const key = normalizeKey(column);
    return /^cost\d+$/i.test(key) || /^productcost\d+$/i.test(key) || /^stockcost\d+$/i.test(key);
  }

  function isLaminateCostColumnName(column) {
    const key = normalizeKey(column);
    return /^lamcost\d+$/i.test(key) || /^laminatecost\d+$/i.test(key);
  }

  function isPrintRateColumnName(column) {
    return normalizeKey(column) === "printsqmrate" || normalizeKey(column) === "printpersqm";
  }

  function isQCodeColumnName(column) {
    return /^qcode\d+$/i.test(normalizeKey(column)) || /^productqcode\d+$/i.test(normalizeKey(column));
  }

  function comparePerforationChoices(a, b) {
    const aPercent = cleanNumber(String(a).replace("%", ""), NaN);
    const bPercent = cleanNumber(String(b).replace("%", ""), NaN);
    if (Number.isFinite(aPercent) && Number.isFinite(bPercent)) return aPercent - bPercent;
    if (Number.isFinite(aPercent)) return -1;
    if (Number.isFinite(bPercent)) return 1;
    return String(a).localeCompare(String(b));
  }

  function findHeaderIndex(headers, name) {
    const key = normalizeKey(name);
    return headers.findIndex((header) => normalizeKey(header) === key);
  }

  function extractRolls(row) {
    const entries = Object.keys(row).map((key) => {
      const match = getSeriesMatch(key, "Width");
      if (!match) return null;
      const suffix = match.suffix;
      const width = cleanNumber(row[key], NaN);
      const productCostEntry = getSeriesEntry(row, ["Product Cost", "Cost"], suffix);
      const laminateCostEntry = getSeriesEntry(row, ["Lam Cost", "Laminate Cost"], suffix);
      const qcodeEntry = getSeriesEntry(row, ["QCode", "Product QCode"], suffix);
      const productCost = cleanNumber(productCostEntry.value, NaN);
      const laminateCost = cleanNumber(laminateCostEntry.value, NaN);
      return {
        suffix: Number.parseInt(suffix, 10),
        width,
        productCost,
        productCostColumn: productCostEntry.key || `Product Cost${suffix}`,
        laminateCost,
        laminateCostColumn: laminateCostEntry.key || `Lam Cost${suffix}`,
        qcode: String(qcodeEntry.value || "").trim(),
        qcodeColumn: qcodeEntry.key || `QCode${suffix}`
      };
    }).filter((entry) => entry && Number.isFinite(entry.width) && entry.width > 0)
      .sort((a, b) => a.suffix - b.suffix);

    const productPricedEntries = entries.filter((entry) => Number.isFinite(entry.productCost) && entry.productCost >= 0);
    return entries.map((entry) => {
      const productDirect = Number.isFinite(entry.productCost) && entry.productCost >= 0;
      const productFallback = productDirect ? entry : findClosestPricedRoll(entry, productPricedEntries, "productCost");
      if (!productFallback) return null;

      const laminateDirect = Number.isFinite(entry.laminateCost) && entry.laminateCost >= 0;
      const laminateCost = laminateDirect ? entry.laminateCost : 0;
      const productCost = productDirect ? entry.productCost : productFallback.productCost;

      return {
        width: entry.width,
        productCost,
        productCostEstimated: !productDirect,
        productCostColumn: entry.productCostColumn,
        productCostSourceWidth: productFallback.width,
        productCostSourceColumn: productFallback.productCostColumn,
        laminateCost,
        laminateCostEstimated: false,
        laminateCostColumn: entry.laminateCostColumn,
        laminateCostSourceWidth: entry.width,
        laminateCostSourceColumn: entry.laminateCostColumn,
        qcode: entry.qcode,
        qcodeColumn: entry.qcodeColumn,
        cost: productCost + laminateCost,
        costEstimated: !productDirect,
        costSourceWidth: !productDirect ? productFallback.width : entry.width
      };
    }).filter(Boolean).sort((a, b) => a.width - b.width);
  }

  function getSeriesMatch(header, label) {
    const pattern = new RegExp(`^${normalizeKey(label)}(\\d+)$`);
    const match = pattern.exec(normalizeKey(header));
    return match ? { suffix: match[1] } : null;
  }

  function getSeriesEntry(row, labels, suffix) {
    const labelList = Array.isArray(labels) ? labels : [labels];
    const key = Object.keys(row).find((candidate) =>
      labelList.some((label) => normalizeKey(candidate) === normalizeKey(`${label}${suffix}`))
    );
    return { key, value: key ? row[key] : "" };
  }

  function findClosestPricedRoll(entry, pricedEntries, costKey) {
    if (!pricedEntries.length) return null;
    return pricedEntries.slice().sort((a, b) =>
      Math.abs(a.width - entry.width) - Math.abs(b.width - entry.width) ||
      Math.abs((a[costKey] || 0) - (entry[costKey] || 0)) - Math.abs((b[costKey] || 0) - (entry[costKey] || 0)) ||
      a.suffix - b.suffix
    )[0];
  }

  function parseDelimited(text) {
    const firstLine = (text.split(/\r?\n/).find((line) => line.trim()) || "");
    const delimiter = firstLine.includes("\t") ? "\t" : ",";
    return parseCsv(text, delimiter).map((row) => row.map((cell) => String(cell).trim()));
  }

  function parseCsv(text, delimiter) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];

      if (char === "\"") {
        if (quoted && next === "\"") {
          cell += "\"";
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") index += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell);
    rows.push(row);
    return rows.filter((item) => item.some((cellValue) => String(cellValue).trim()));
  }

  function cleanNumber(value, fallback) {
    if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
    const cleaned = String(value ?? "").replace(/[$,\s]/g, "");
    const number = Number.parseFloat(cleaned);
    return Number.isFinite(number) ? number : fallback;
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function isArtworkFile(file) {
    return Boolean(file && (isImageFile(file) || isPdfFile(file)));
  }

  function isImageFile(file) {
    return Boolean(file.type && file.type.startsWith("image/"));
  }

  function isPdfFile(file) {
    return Boolean(
      (file.type && file.type === "application/pdf") ||
      /\.pdf$/i.test(file.name || "")
    );
  }

  function getFileStem(fileName) {
    return String(fileName || "").replace(/\.[^.]+$/, "");
  }

  function normalizeKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function capitalize(value) {
    const text = String(value || "");
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }

  function renderResults(best, options, elements) {
    const roll = best.roll;
    ui.rollChoice.textContent = `${roll.width} mm stock`;
    ui.metricLinear.textContent = `${formatNumber(best.costs.linearM, 2)} m`;
    ui.metricJoins.textContent = formatInteger(best.joins);
    ui.metricPrice.textContent = formatMoney(best.costs.total);
    ui.metricRate.textContent = `${formatMoney(best.costs.rate)} / sqm`;
    if (ui.printRateConstant) {
      ui.printRateConstant.textContent = `${formatMoney(best.costs.printRate)} / sqm`;
    }
    const widestRoll = options.reduce((max, option) => Math.max(max, option.roll.width), 0);
    const fitWarning = getStockFitWarning(best.maxUnrotatedPrintWidth, widestRoll);
    ui.costBreakdown.innerHTML = `
      ${fitWarning ? `<div class="fit-warning">${escapeHtml(fitWarning)}</div>` : ""}
      <div><span>Imposed length</span><strong>${formatNumber(best.costs.printLinearM, 2)} m</strong></div>
      <div><span>Product stock length</span><strong>${formatNumber(best.costs.stockLinearM, 2)} m</strong></div>
      ${best.costs.laminateLinearM ? `<div><span>Laminate length</span><strong>${formatNumber(best.costs.laminateLinearM, 2)} m</strong></div>` : ""}
      <div><span>Trim perimeter</span><strong>${formatMoney(best.costs.trimCharge)}</strong></div>
      <div><span>Unit charge</span><strong>${formatMoney(best.costs.unitCharge)}</strong></div>
    `;
    ui.downloadImposition.disabled = false;

    renderOffsetPrompt(best);
    renderOptions(options, best);
    renderPricing(best, elements);
    renderImposition(best);
  }

  function getStockFitWarning(requiredWidth, widestRoll) {
    if (!Number.isFinite(requiredWidth) || !Number.isFinite(widestRoll) || requiredWidth <= widestRoll + 0.001) {
      return "";
    }

    return `Widest entered print width is ${formatInteger(requiredWidth)} mm, but this product only lists stock up to ${formatInteger(widestRoll)} mm. The job is being panelled; choose a product with wider stock or add that width to the Selector sheet to avoid joins.`;
  }

  function renderEmptyResults() {
    ui.rollChoice.textContent = "No job";
    ui.metricLinear.textContent = "0.00 m";
    ui.metricJoins.textContent = "0";
    ui.metricPrice.textContent = "$0.00";
    ui.metricRate.textContent = "$0.00 / sqm";
    if (ui.printRateConstant) {
      ui.printRateConstant.textContent = state.selectedProduct ? `${formatMoney(state.selectedProduct.printSqmRate)} / sqm` : "Select product";
    }
    ui.costBreakdown.innerHTML = "";
    ui.offsetPrompt.classList.add("hidden");
    ui.optionsBody.innerHTML = "";
    ui.pricingBody.innerHTML = "";
    state.currentCartUrls = [];
    ui.addAllCart.disabled = true;
    ui.optionCount.textContent = "";
    ui.priceSummary.textContent = "";
    ui.impositionSummary.textContent = "";
    ui.impositionPreview.innerHTML = `<div class="empty-state">Enter job elements to calculate the roll.</div>`;
    ui.downloadImposition.disabled = true;
  }

  function renderProductRequired(selectorState) {
    ui.rollChoice.textContent = "Select product";
    ui.metricLinear.textContent = "0.00 m";
    ui.metricJoins.textContent = "0";
    ui.metricPrice.textContent = "$0.00";
    ui.metricRate.textContent = "$0.00 / sqm";
    if (ui.printRateConstant) {
      ui.printRateConstant.textContent = "Select product";
    }
    ui.costBreakdown.innerHTML = "";
    ui.offsetPrompt.classList.add("hidden");
    ui.optionsBody.innerHTML = "";
    ui.pricingBody.innerHTML = "";
    state.currentCartUrls = [];
    ui.addAllCart.disabled = true;
    ui.optionCount.textContent = "";
    ui.priceSummary.textContent = "";
    ui.impositionSummary.textContent = "";
    ui.impositionPreview.innerHTML = `<div class="empty-state">${escapeHtml(getSelectorEmptyMessage(selectorState))}</div>`;
    ui.downloadImposition.disabled = true;
  }

  function renderInputErrors(errors) {
    ui.inputErrors.innerHTML = errors.map((error) => `<div>${escapeHtml(error)}</div>`).join("");
  }

  function renderSelectorSurvey(selectorState) {
    const path = selectorState.pathEntries
      .filter((entry) => entry.value)
      .map((entry) => `<span class="survey-pill${entry.inferred ? " inferred" : ""}">${escapeHtml(entry.column)}: ${escapeHtml(entry.value)}</span>`)
      .join("");

    const questionMarkup = selectorState.question ? `
      <div class="survey-question">
        <strong>${escapeHtml(selectorState.question.label)}</strong>
        <div class="choice-grid">
          ${selectorState.question.choices.map((choice) => `
            <button class="choice-button" type="button" data-selector-column="${escapeHtml(selectorState.question.column)}" data-selector-value="${escapeHtml(choice)}">${escapeHtml(choice)}</button>
          `).join("")}
        </div>
      </div>
    ` : "";

    const product = selectorState.product;
    const productMarkup = product ? `
      <div class="selected-product">
        <strong>${escapeHtml(product.name)}</strong>
        <div class="muted">${escapeHtml(product.rolls.map(formatRollLabel).join(" | "))}</div>
      </div>
    ` : (!selectorState.question ? `<div class="survey-empty">${escapeHtml(getSelectorEmptyMessage(selectorState))}</div>` : "");

    const resetMarkup = Object.keys(selectorState.selections).length ? `
      <div class="survey-actions">
        <button class="ghost-button compact" type="button" data-selector-back="true">Back</button>
        <button class="ghost-button compact" type="button" data-selector-reset="true">Reset survey</button>
      </div>
    ` : "";

    ui.selectorSurvey.innerHTML = `
      ${path ? `<div class="survey-path">${path}</div>` : ""}
      ${questionMarkup}
      ${productMarkup}
      ${resetMarkup}
    `;
  }

  function getSelectorEmptyMessage(selectorState) {
    if (!selectorState.hasRows) return "No selector data loaded.";
    if (selectorState.question) return "Answer the product survey to select stock.";
    return "No complete product data is available for this selection yet.";
  }

  function reconcileArtworkMappings(elements) {
    state.artworks.forEach((artwork) => {
      const stillExists = elements.some((element) => element.shortname === artwork.mappedShortname);
      if (!stillExists) {
        artwork.mappedShortname = chooseArtworkMapping(artwork.name, elements);
      }
    });
  }

  function renderArtworkList(elements) {
    const errors = state.artworkErrors
      .map((error) => `<div class="artwork-error">${escapeHtml(error)}</div>`)
      .join("");

    if (!state.artworks.length) {
      ui.artworkList.innerHTML = `${errors}<div class="artwork-empty">No artwork uploaded.</div>`;
      return;
    }

    const options = [
      `<option value="">Not imposed</option>`,
      ...elements.map((element) => `<option value="${escapeHtml(element.shortname)}">${escapeHtml(element.shortname)}</option>`)
    ].join("");

    ui.artworkList.innerHTML = state.artworks.map((artwork) => {
      const artworkId = escapeHtml(artwork.id);
      const cropAspect = getArtworkCropAspect(artwork, elements);
      const cropFrameStyle = getArtworkCropFrameStyle(cropAspect);
      const imageStyle = getArtworkCropperImageStyle(artwork, cropAspect);
      const panelGuides = renderArtworkPanelGuides(artwork);
      const scalePercent = Math.round(getArtworkScale(artwork) * 100);
      const selectOptions = options.replace(
        `value="${escapeHtml(artwork.mappedShortname)}"`,
        `value="${escapeHtml(artwork.mappedShortname)}" selected`
      );
      return `
        <div class="artwork-item">
          <img src="${escapeHtml(artwork.dataUrl)}" alt="">
          <div class="artwork-meta">
            <strong title="${escapeHtml(artwork.name)}">${escapeHtml(artwork.name)}</strong>
            ${artwork.pageLabel ? `<small>${escapeHtml(artwork.pageLabel)}</small>` : ""}
            <select data-artwork-map="${artworkId}" aria-label="Map ${escapeHtml(artwork.name)} to element">
              ${selectOptions}
            </select>
            <div class="artwork-cropper" aria-label="Crop ${escapeHtml(artwork.name)}">
              <div class="artwork-crop-stage" data-artwork-crop-stage data-artwork-id="${artworkId}">
                <div class="artwork-crop-frame" data-artwork-crop-frame data-artwork-id="${artworkId}" data-crop-aspect="${cropAspect}" style="${cropFrameStyle}">
                  <img class="artwork-crop-image" data-artwork-crop-image src="${escapeHtml(artwork.dataUrl)}" alt="" draggable="false" style="${imageStyle}">
                  <div class="artwork-crop-grid" aria-hidden="true"></div>
                  ${panelGuides}
                  <button class="artwork-scale-handle" type="button" data-artwork-crop-scale aria-label="Scale image" title="Scale image"></button>
                </div>
              </div>
              <div class="artwork-crop-actions">
                <button class="icon-button crop-action" type="button" data-artwork-crop-zoom="-0.1" aria-label="Zoom out" title="Zoom out">−</button>
                <button class="icon-button crop-action" type="button" data-artwork-crop-reset aria-label="Reset crop" title="Reset crop">↺</button>
                <button class="icon-button crop-action" type="button" data-artwork-crop-zoom="0.1" aria-label="Zoom in" title="Zoom in">+</button>
                <output data-artwork-scale-readout>${scalePercent}%</output>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    ui.artworkList.innerHTML = `${errors}${ui.artworkList.innerHTML}`;
  }

  function getArtworkScale(artwork) {
    return clampNumber(cleanNumber(artwork.artworkScale, 1), 1, 3);
  }

  function getArtworkCropPercent(artwork, property) {
    return clampNumber(cleanNumber(artwork[property], 50), 0, 100);
  }

  function getArtworkCropAspect(artwork, elements) {
    const element = elements.find((item) => item.shortname === artwork.mappedShortname);
    if (element?.width > 0 && element?.height > 0) {
      return element.width / element.height;
    }

    return Math.max(0.1, cleanNumber(artwork.intrinsicWidth, 1) / Math.max(1, cleanNumber(artwork.intrinsicHeight, 1)));
  }

  function getArtworkCropFrameStyle(aspect) {
    return `--crop-aspect:${Math.max(0.1, aspect)};`;
  }

  function getArtworkCropperImageStyle(artwork, aspect) {
    const boxWidth = 1000;
    const boxHeight = boxWidth / Math.max(0.1, aspect);
    const imageRect = getArtworkImageRect(artwork, boxWidth, boxHeight);

    return [
      `left:${(imageRect.x / boxWidth) * 100}%`,
      `top:${(imageRect.y / boxHeight) * 100}%`,
      `width:${(imageRect.width / boxWidth) * 100}%`,
      `height:${(imageRect.height / boxHeight) * 100}%`
    ].join(";");
  }

  function renderArtworkPanelGuides(artwork) {
    const plan = getArtworkPanelPlan(artwork);
    if (!plan || plan.drops <= 1 || !Number.isFinite(plan.printWidth) || plan.printWidth <= 0) {
      return "";
    }

    const guides = plan.groups
      .filter((group) => group.panelIndex && group.panelIndex < group.panelCount)
      .sort((a, b) => a.panelIndex - b.panelIndex)
      .map((group) => {
        const joinX = group.panelSourceX + group.visiblePanelWidth;
        const overlapWidth = Math.max(0, group.width - group.visiblePanelWidth);
        const joinPercent = clampNumber((joinX / plan.printWidth) * 100, 0, 100);
        const overlapStart = joinPercent;
        const overlapEnd = clampNumber(((joinX + overlapWidth) / plan.printWidth) * 100, 0, 100);
        const overlapPercent = Math.max(0, overlapEnd - overlapStart);
        const label = `Panel ${group.panelIndex} join, ${formatNumber(overlapWidth, 0)} mm overlap`;

        return `
          ${overlapPercent > 0 ? `<span class="artwork-panel-overlap" style="left:${overlapStart}%;width:${overlapPercent}%;" title="${escapeHtml(label)}"></span>` : ""}
          <span class="artwork-panel-join" style="left:${joinPercent}%;" title="${escapeHtml(label)}"></span>
        `;
      })
      .join("");

    return guides ? `<div class="artwork-panel-guides" aria-hidden="true">${guides}</div>` : "";
  }

  function getArtworkPanelPlan(artwork) {
    if (!artwork.mappedShortname || !state.currentBest) return null;
    return state.currentBest.elementPlans.find((plan) => plan.element.shortname === artwork.mappedShortname) || null;
  }

  function renderOffsetPrompt(best) {
    const savingMm = best.evenPack.lengthMm - best.offsetPack.lengthMm;
    const meaningful = best.offsetSaves && savingMm > Math.max(50, best.evenPack.lengthMm * 0.005);
    if (!meaningful) {
      ui.offsetPrompt.classList.add("hidden");
      ui.offsetPrompt.innerHTML = "";
      return;
    }

    const savingM = savingMm / 1000;
    const active = state.useOffsetJoins === true ? "Offset joins selected." :
      state.useOffsetJoins === false ? "Even joins selected." :
      "Even joins are selected until you choose.";

    ui.offsetPrompt.classList.remove("hidden");
    ui.offsetPrompt.innerHTML = `
      <p>Do you want to save stock by offsetting the panel joins?</p>
      <div class="muted">${escapeHtml(active)} Potential saving: ${formatNumber(savingM, 2)} linear metres.</div>
      <div class="prompt-actions">
        <button class="primary-button compact" type="button" data-offset-choice="yes">Use offset joins</button>
        <button class="ghost-button compact" type="button" data-offset-choice="no">Keep even joins</button>
      </div>
    `;
  }

  function renderOptions(options, best) {
    ui.optionCount.textContent = `${options.length} stock widths`;
    ui.optionsBody.innerHTML = options.map((option) => {
      const selected = option === best ? " class=\"selected-row\"" : "";
      const offsetText = option.offsetSaves
        ? `${formatNumber(option.offsetPack.lengthMm / 1000, 2)} m`
        : "No saving";
      return `
        <tr${selected}>
          <td>${formatInteger(option.roll.width)} mm</td>
          <td>${formatInteger(option.joins)}</td>
          <td>${formatNumber(option.evenPack.lengthMm / 1000, 2)} m</td>
          <td>${offsetText}</td>
          <td>${formatMoney(option.costs.total)}</td>
        </tr>
      `;
    }).join("");
  }

  function renderPricing(best, elements) {
    ui.priceSummary.textContent = `${formatMoney(best.costs.total)} over ${formatNumber(best.costs.finishedAreaSqm, 2)} sqm finished area`;
    const cartUrls = [];
    ui.pricingBody.innerHTML = elements.map((element, index) => {
      const plan = best.elementPlans.find((item) => item.elementIndex === index);
      const areaSqm = (element.width * element.height) / 1000000;
      const lineArea = areaSqm * element.quantity;
      const lineTotal = lineArea * best.costs.rate;
      const unit = element.quantity > 0 ? lineTotal / element.quantity : 0;
      const printSize = `${formatNumber(plan.printWidth, 0)} x ${formatNumber(plan.printHeight, 0)} mm${plan.rotated ? " rotated" : ""}`;
      const dropsText = plan.drops > 1 ? `${formatInteger(plan.drops)} vertical` : formatInteger(plan.drops);
      const cartUrl = buildCartUrl(best.roll, element, unit);
      if (cartUrl) cartUrls.push(cartUrl);
      return `
        <tr>
          <td>${escapeHtml(element.shortname)}</td>
          <td>${formatInteger(element.quantity)}</td>
          <td>${formatNumber(element.width, 0)} x ${formatNumber(element.height, 0)} mm</td>
          <td>${printSize}</td>
          <td>${dropsText}</td>
          <td>${formatNumber(lineArea, 2)} sqm</td>
          <td>${formatMoney(unit)}</td>
          <td>${formatMoney(lineTotal)}</td>
          <td>${cartUrl ? `<a class="cart-link" href="${escapeHtml(cartUrl)}" target="${CART_WINDOW_NAME}">Add</a>` : `<span class="muted">No QCode</span>`}</td>
        </tr>
      `;
    }).join("");
    state.currentCartUrls = cartUrls;
    ui.addAllCart.disabled = !cartUrls.length;
  }

  function buildCartUrl(roll, element, unitPrice) {
    if (!roll || !roll.qcode) return "";
    const params = new URLSearchParams({
      qcode: roll.qcode,
      quantity: String(element.quantity),
      width: String(Math.round(element.width)),
      height: String(Math.round(element.height)),
      shortname: element.shortname,
      price: formatCartPrice(unitPrice)
    });
    return `https://vivad.com.au/shopping-cart?${params.toString()}`;
  }

  async function addAllToCart() {
    const urls = state.currentCartUrls.slice();
    if (!urls.length) return;

    ui.addAllCart.disabled = true;
    const originalLabel = ui.addAllCart.textContent;
    let cartWindow = window.open(urls[0], CART_WINDOW_NAME);

    try {
      for (let index = 0; index < urls.length; index += 1) {
        ui.addAllCart.textContent = `Adding ${index + 1}/${urls.length}`;
        if (index > 0) {
          await wait(CART_NAVIGATION_DELAY_MS);
          cartWindow = navigateCartTab(urls[index], cartWindow);
        }
      }
    } finally {
      await wait(250);
      ui.addAllCart.textContent = originalLabel;
      ui.addAllCart.disabled = !state.currentCartUrls.length;
    }
  }

  function navigateCartTab(url, cartWindow) {
    try {
      if (cartWindow && !cartWindow.closed) {
        cartWindow.location.href = url;
        cartWindow.focus();
        return cartWindow;
      }
    } catch (error) {
      // If the cart page severs the opener, the named anchor target still reuses the cart tab.
    }

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = CART_WINDOW_NAME;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return cartWindow;
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function renderImposition(best) {
    const pack = best.selectedPack;
    const strategy = getStrategyLabel(pack.strategy);
    const truncated = pack.truncated ? `, first ${pack.placements.length} pieces shown` : "";
    ui.impositionSummary.textContent = `${formatInteger(best.roll.width)} mm x ${formatNumber(pack.lengthMm / 1000, 2)} m, ${strategy}${truncated}`;
    ui.impositionPreview.innerHTML = buildImpositionSvg(best, { preview: true });
  }

  function getStrategyLabel(strategy) {
    return strategy === "offset" ? "offset joins + best-fit nesting" : "best-fit nesting";
  }

  function buildImpositionSvg(best, options = {}) {
    const pack = best.selectedPack;
    if (!pack.placements.length) {
      return `<div class="empty-state">No printable placements.</div>`;
    }

    const stockWidth = best.roll.width;
    const lengthMm = Math.max(pack.lengthMm, 1);
    const preview = Boolean(options.preview);
    const maxWidthPx = preview ? 640 : 1400;
    const maxHeightPx = preview ? 14000 : 12000;
    const scale = Math.min(maxWidthPx / stockWidth, maxHeightPx / lengthMm);
    const drawingWidth = stockWidth * scale;
    const drawingHeight = lengthMm * scale;
    const pad = preview ? 46 : 64;
    const titleHeight = preview ? 34 : 54;
    const minSvgWidth = preview ? 760 : 1100;
    const svgWidth = Math.max(minSvgWidth, Math.ceil(drawingWidth + pad * 2));
    const svgHeight = Math.ceil(drawingHeight + pad + titleHeight + 26);
    const title = `${best.productName} - ${formatInteger(best.roll.width)} mm - ${formatNumber(best.costs.linearM, 2)} linear m`;
    const placements = pack.placements;
    const artworkMap = getArtworkByElementIndex(best);
    const clipDefs = [];

    const rects = placements.map((placement, placementIndex) => {
      const x = pad + placement.x * scale;
      const y = titleHeight + placement.y * scale;
      const width = Math.max(1, placement.width * scale);
      const height = Math.max(1, placement.height * scale);
      const artwork = artworkMap.get(placement.elementIndex);
      const clipId = `clip-${placementIndex}`;
      if (artwork) {
        clipDefs.push(`<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="3"/></clipPath>`);
      }
      const panelName = placement.panelCount === 2
        ? (placement.panelIndex === 1 ? "Left" : "Right")
        : `P${placement.panelIndex}/${placement.panelCount}`;
      const label = placement.panelIndex
        ? `${placement.shortname} ${panelName}`
        : placement.shortname;
      const canLabel = width > 64 && height > 20;
      const overlapLine = placement.panelIndex && placement.panelIndex < placement.panelCount
        ? `<line x1="${x + placement.visiblePanelWidth * scale}" y1="${y}" x2="${x + placement.visiblePanelWidth * scale}" y2="${y + height}" stroke="#ffffff" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.95"/>`
        : "";
      const artworkMarkup = artwork
        ? buildArtworkMarkup(placement, artwork, clipId, x, y, width, height, scale)
        : "";
      const labelPlate = canLabel && artwork
        ? `<rect x="${x + 4}" y="${y + 4}" width="${Math.min(width - 8, Math.max(76, label.length * 7))}" height="18" rx="3" fill="#17201c" opacity="0.64"/>`
        : "";

      return `
        <g>
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="3" fill="${placement.color}" opacity="0.86"/>
          ${artworkMarkup}
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="3" fill="none" stroke="#17201c" stroke-opacity="0.35" stroke-width="1"/>
          ${overlapLine}
          ${labelPlate}
          ${canLabel ? `<text x="${x + 6}" y="${y + 16}" fill="#ffffff" font-size="12" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(label)}</text>` : ""}
        </g>
      `;
    }).join("");

    const rollY = titleHeight;
    const rollHeight = drawingHeight;
    const metreMarks = buildMetreMarks(lengthMm, scale, pad, titleHeight, drawingWidth);
    const truncatedNote = pack.truncated
      ? `<text x="${pad}" y="${svgHeight - 12}" fill="#5e6a64" font-size="12" font-family="Segoe UI, Arial, sans-serif">Preview capped at ${pack.placements.length} of ${pack.totalPieces} print pieces.</text>`
      : "";

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Roll imposition">
        <rect width="100%" height="100%" fill="#fbfcfa"/>
        <text x="${pad}" y="24" fill="#17201c" font-size="${preview ? 16 : 22}" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${escapeSvg(title)}</text>
        <text x="${pad}" y="${preview ? 42 : 47}" fill="#5e6a64" font-size="12" font-family="Segoe UI, Arial, sans-serif">Strategy: ${escapeSvg(getStrategyLabel(pack.strategy))} | Joins: ${formatInteger(best.joins)} | Total: ${escapeSvg(formatMoney(best.costs.total))}</text>
        <defs>${clipDefs.join("")}</defs>
        <rect x="${pad}" y="${rollY}" width="${drawingWidth}" height="${rollHeight}" fill="#ffffff" stroke="#17201c" stroke-width="1.4"/>
        ${metreMarks}
        ${rects}
        <text x="${pad + drawingWidth + 8}" y="${rollY + 14}" fill="#5e6a64" font-size="11" font-family="Segoe UI, Arial, sans-serif">${formatInteger(stockWidth)} mm</text>
        ${truncatedNote}
      </svg>
    `;
  }

  function getArtworkByElementIndex(best) {
    const byShortname = new Map();
    state.artworks.forEach((artwork) => {
      if (artwork.mappedShortname && artwork.dataUrl && !byShortname.has(artwork.mappedShortname)) {
        byShortname.set(artwork.mappedShortname, artwork);
      }
    });

    const byIndex = new Map();
    best.elementPlans.forEach((plan) => {
      const artwork = byShortname.get(plan.element.shortname);
      if (artwork) byIndex.set(plan.elementIndex, artwork);
    });
    return byIndex;
  }

  function buildArtworkMarkup(placement, artwork, clipId, x, y, width, height, scale) {
    const href = escapeHtml(artwork.dataUrl);
    const preserve = "xMinYMin meet";

    if (placement.rotated) {
      const sourceX = (placement.panelSourceX || 0) * scale;
      const fullWidth = (placement.fullPrintWidth || placement.width) * scale;
      const fullHeight = (placement.fullPrintHeight || placement.height) * scale;
      const imageRect = getArtworkImageRect(artwork, fullHeight, fullWidth);
      const localSourceY = Math.max(0, fullWidth - sourceX - width);

      return `
        <g clip-path="url(#${clipId})">
          <g transform="translate(${x + width} ${y}) rotate(90)">
            <image href="${href}" x="${imageRect.x}" y="${imageRect.y - localSourceY}" width="${imageRect.width}" height="${imageRect.height}" preserveAspectRatio="${preserve}"/>
          </g>
        </g>
      `;
    }

    const sourceX = (placement.panelSourceX || 0) * scale;
    const fullWidth = (placement.fullPrintWidth || placement.width) * scale;
    const fullHeight = (placement.fullPrintHeight || placement.height) * scale;
    const imageRect = getArtworkImageRect(artwork, fullWidth, fullHeight);

    return `
      <g clip-path="url(#${clipId})">
        <image href="${href}" x="${x - sourceX + imageRect.x}" y="${y + imageRect.y}" width="${imageRect.width}" height="${imageRect.height}" preserveAspectRatio="${preserve}"/>
      </g>
    `;
  }

  function getArtworkImageRect(artwork, boxWidth, boxHeight) {
    const safeBoxWidth = Math.max(1, boxWidth);
    const safeBoxHeight = Math.max(1, boxHeight);
    const intrinsicWidth = Math.max(1, cleanNumber(artwork.intrinsicWidth, safeBoxWidth));
    const intrinsicHeight = Math.max(1, cleanNumber(artwork.intrinsicHeight, safeBoxHeight));
    const coverScale = Math.max(safeBoxWidth / intrinsicWidth, safeBoxHeight / intrinsicHeight);
    const userScale = getArtworkScale(artwork);
    const imageWidth = intrinsicWidth * coverScale * userScale;
    const imageHeight = intrinsicHeight * coverScale * userScale;
    const extraX = Math.max(0, imageWidth - safeBoxWidth);
    const extraY = Math.max(0, imageHeight - safeBoxHeight);
    const cropX = getArtworkCropPercent(artwork, "cropX") / 100;
    const cropY = getArtworkCropPercent(artwork, "cropY") / 100;

    return {
      x: -extraX * cropX,
      y: -extraY * cropY,
      width: imageWidth,
      height: imageHeight
    };
  }

  function buildMetreMarks(lengthMm, scale, pad, titleHeight, drawingWidth) {
    const marks = [];
    const metres = Math.floor(lengthMm / 1000);
    for (let metre = 1; metre <= metres; metre += 1) {
      const y = titleHeight + metre * 1000 * scale;
      marks.push(`
        <line x1="${pad}" y1="${y}" x2="${pad + drawingWidth}" y2="${y}" stroke="#d9dfda" stroke-width="1"/>
        <text x="${pad - 8}" y="${y + 4}" text-anchor="end" fill="#5e6a64" font-size="10" font-family="Segoe UI, Arial, sans-serif">${metre}m</text>
      `);
    }
    return marks.join("");
  }

  function downloadImposition() {
    if (!state.currentBest) return;
    const svg = buildImpositionSvg(state.currentBest, { preview: false });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeProduct = state.currentBest.productName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    anchor.href = url;
    anchor.download = `imposition-${safeProduct}-${Math.round(state.currentBest.roll.width)}mm.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  function formatNumber(value, digits) {
    return new Intl.NumberFormat("en-AU", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value || 0);
  }

  function formatInteger(value) {
    return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(value || 0);
  }

  function formatCartPrice(value) {
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  }

  function formatRollLabel(roll) {
    const qcode = roll.qcode ? ` · ${roll.qcode}` : "";
    return `${formatInteger(roll.width)} mm${qcode}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeSvg(value) {
    return escapeHtml(value);
  }

  window.RollStockCalculator = {
    parseElements,
    parseSelectorCsv,
    evaluateRoll,
    buildCartUrl,
    constants: {
      TILE_OFFSET_MM,
      MATERIAL_LOADING_MM,
      SETUP_FEE,
      TRIM_PER_LINEAR_M,
      STOCK_MULTIPLIER,
      LAMINATE_MULTIPLIER,
      PRINT_PER_SQM,
      UNIT_PRICE
    }
  };
})();
