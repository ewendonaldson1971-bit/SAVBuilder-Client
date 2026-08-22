(function () {
  "use strict";

  const APP_MODES = {
    live: {
      title: "SAV Builder",
      background: "#eff5fb"
    },
    dev: {
      title: "SAV Builder DEV",
      background: "#fff8df"
    }
  };
  const APP_MODE = getAppMode();
  const APP_CONFIG = APP_MODES[APP_MODE];
  const APP_SCRIPT_ELEMENT = document.currentScript;
  const APPS_SCRIPT_WEB_APP_URL = String(
    window.SAV_BUILDER_APPS_SCRIPT_URL ||
    APP_SCRIPT_ELEMENT?.dataset?.appsScriptUrl ||
    document.querySelector("meta[name='sav-builder-apps-script-url']")?.content ||
    ""
  ).trim();
  const STRAPI_BASE_URL = String(
    window.SAV_BUILDER_STRAPI_URL ||
    APP_SCRIPT_ELEMENT?.dataset?.strapiUrl ||
    document.querySelector("meta[name='sav-builder-strapi-url']")?.content ||
    (APP_MODE === "dev" ? new URLSearchParams(window.location.search).get("strapi") : "") ||
    ""
  ).trim().replace(/\/+$/, "");
  const PRICING_API_URL = String(
    window.SAV_BUILDER_PRICING_API_URL ||
    APP_SCRIPT_ELEMENT?.dataset?.pricingApiUrl ||
    ""
  ).trim().replace(/\/+$/, "");
  const PDF_ICON_SRC = "assets/icons/pdf-file-icon.webp?v=1";

  const TILE_OFFSET_MM = 5;
  const MATERIAL_LOADING_MM = 500;
  const SETUP_FEE = 22;
  const TRIM_PER_LINEAR_M = 0.5;
  const STOCK_MULTIPLIER = 2;
  const LAMINATE_MULTIPLIER = 3;
  const PRINT_PER_SQM = 15;
  const UNIT_PRICE = 0.5;
  const MAX_PREVIEW_PLACEMENTS = 2600;
  const DEFAULT_PRICING_CONFIG = Object.freeze({
    materialLoadingMm: MATERIAL_LOADING_MM,
    edgePrintMarginMm: 0,
    setupFee: SETUP_FEE,
    trimPerLinearM: TRIM_PER_LINEAR_M,
    stockMultiplier: STOCK_MULTIPLIER,
    laminateMultiplier: LAMINATE_MULTIPLIER,
    printPerSqm: PRINT_PER_SQM,
    unitPrice: UNIT_PRICE,
    printModes: {
      clear: [],
      translucent: [],
      standard: []
    }
  });
  const BRAND_COLUMN = "Brand";
  const FALLBACK_BRAND_OPTIONS = [
    { id: "all", label: "All", matches: [] },
    { id: "avery", label: "Avery", matches: ["Avery"], logo: "assets/brands/avery-dennison.png?v=2" },
    { id: "orafol", label: "Orafol", matches: ["Orafol"], logo: "assets/brands/orafol.svg?v=2" },
    { id: "3m", label: "3M", matches: ["3M"], logo: "assets/brands/3m.png?v=2" }
  ];
  const CLASS_COLUMN = "Class";
  const CLASS_COLUMN_CANDIDATES = ["Class", "Product Class", "Material Class", "Vinyl Class"];
  const CLASS_OPTIONS = [
    { id: "all", label: "All", matches: [] },
    { id: "monomeric", label: "Monomeric (Good)", matches: ["Monomeric", "Mono"] },
    { id: "polymeric", label: "Polymeric (Better)", matches: ["Polymeric", "Poly"] },
    { id: "intermediate-polymeric", label: "Intermediate Polymeric (Better)", matches: ["Intermediate Polymeric"], matchMode: "prefix" },
    { id: "premium-polymeric", label: "Premium Polymeric (Better still)", matches: ["Premium Polymeric"], matchMode: "prefix" },
    { id: "cast", label: "Cast (Best)", matches: ["Cast"] }
  ];
  const LIMIT_FILTER_OPTIONS = [
    { id: "white", label: "White", columns: ["White"] },
    { id: "air-release", label: "Air Release", columns: ["Air Release"] },
    { id: "repositionable", label: "Repositionable on Install", columns: ["Repositionable on Install", "Repositionable on Installation", "Repositionable"] },
    { id: "removable", label: "Removable", columns: ["Removable"] },
    { id: "high-tac", label: "High-tac", columns: ["High-tac", "High tac", "High tack"] },
    { id: "greyback", label: "Greyback", columns: ["Greyback", "Grey back", "Grayback", "Gray back"] },
    { id: "translucent", label: "Translucent", columns: ["Translucent"] },
    { id: "clear", label: "Clear", columns: ["Clear"] },
    { id: "optically-clear", label: "Optically Clear", columns: ["Optically Clear"] },
    { id: "perforated", label: "Perforated (One Way Vision)", columns: ["Perforated", "Perforated (One way Vision)", "Perforated (One Way Vision)"] }
  ];
  const MOUNTING_SURFACE_ALL = "all";
  const MOUNTING_SURFACE_COLUMN = "Mounting Surface";
  const LEGACY_SURFACE_COLUMN = "Surface";
  const TYPE_COLUMN = "Type";
  const LONGEVITY_COLUMN = "Longevity";
  const LAMINATE_COLUMN = "Laminate";
  const PRINT_MODE_COLUMN = "Print Mode";
  const SURFACE_DESCRIPTION_COLUMN = "Surface Description";
  const SURFACE_LINK_COLUMN = "Surface Link";
  const PRODUCT_SPEC_SHEET_COLUMNS = [
    "Product Spec Sheet",
    "Product Spec Sheet Link",
    "Product PDF",
    "Product PDF Link",
    "Product Data Sheet",
    "Product Datasheet"
  ];
  const LAMINATE_SPEC_SHEET_COLUMNS = [
    "Laminate Spec Sheet",
    "Laminate Spec Sheet Link",
    "Laminate PDF",
    "Laminate PDF Link",
    "Laminate Data Sheet",
    "Laminate Datasheet"
  ];
  const PUBLISHED_COLUMN_CANDIDATES = [
    "Published",
    "Publish",
    "Is Published",
    "Published?"
  ];
  const DERIVED_PERFORATION_COLUMN = "Perforation";
  const CART_WINDOW_NAME = "savBuilderCart";
  const CART_NAVIGATION_DELAY_MS = 1200;
  const IMPOSITION_EMAIL_TO = "sales@vivad.com.au";
  const IMPOSITION_EMAIL_SUBJECT = "SavBuilder imposition submitted";
  const IMPOSITION_EMAIL_ACTION = "email-imposition";
  const ADD_TO_CART_EMAIL_TO = "jtlog@vivad.com.au";
  const ADD_TO_CART_EMAIL_SUBJECT = "SAVBuilder Add to cart";
  const ADD_TO_CART_EMAIL_ACTION = "add-to-cart";
  const APPS_SCRIPT_REQUEST_TIMEOUT_MS = 15000;
  const APPS_SCRIPT_RETRY_COUNT = 1;
  const APPS_SCRIPT_RETRY_DELAY_MS = 700;
  const STRAPI_REQUEST_TIMEOUT_MS = 15000;
  const STRAPI_PAGE_SIZE = 200;
  const SURFACE_LABELS = Object.freeze({
    "glass": "Glass",
    "painted-plaster-prepared": "Painted Plaster Prepared",
    "acm-metal-smooth-surfaces": "ACM /Metal/Smooth Surfaces",
    "vehicle-wrapping": "Vehicle Wrapping",
    "tiles": "Tiles",
    "timber-floor": "Timber Floor",
    "smooth-concrete": "Smooth Concrete",
    "brick-or-stone": "Brick or Stone",
    "carpet": "Carpet",
    "asphalt": "Asphalt",
    "raw-gyprock": "Raw Gyprock",
    "raw-mdf": "Raw MDF",
    "rough-timber-hoarding": "Rough Timber Hoarding",
    "acrylic": "Acrylic",
    "polyethylene": "Polyethylene (Wheely Bins, plastic Seating)"
  });

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
    pricingConfig: { ...DEFAULT_PRICING_CONFIG },
    brandFilter: "all",
    brandOptions: FALLBACK_BRAND_OPTIONS.map((option) => ({ ...option })),
    classFilter: "all",
    limitFilters: new Set(),
    mountingSurfaceFilter: MOUNTING_SURFACE_ALL,
    selectedProduct: null,
    productSearchQuery: "",
    productSearchResults: [],
    productSearchSelection: null,
    elementInputMode: "table",
    productSource: "fallback",
    useOffsetJoins: null,
    offsetPromptDismissed: false,
    artworks: [],
    artworkErrors: [],
    currentBest: null,
    currentOptions: [],
    currentCartUrls: [],
    currentCartLines: [],
    pricingApiToken: window.sessionStorage.getItem("savBuilderPricingToken") || "",
    pricingApiUser: window.sessionStorage.getItem("savBuilderPricingUser") || "",
    pricingQuoteRequestId: 0
  };

  const ui = {};
  let recalcTimer = 0;
  let recommendationPanelFrame = 0;
  let recommendationPanelResizeObserver = null;
  let pdfjsPromise = null;
  let artworkCropInteraction = null;
  let appToastTimer = 0;

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
    renderBrandSelector();
    renderClassSelector();
    renderLimitFilters();
    renderMountingSurfaceSelector();
    attachEvents();
    initRecommendationPanelSizing();
    recalculate();
    refreshProducts();
    renderPricingConnection();
  }

  function cacheUi() {
    ui.selectorSurvey = document.getElementById("selector-survey");
    ui.appTitle = document.getElementById("app-title");
    ui.configuratorProgress = document.getElementById("configurator-progress");
    ui.configuratorGuidance = document.getElementById("configurator-guidance");
    ui.advancedConfigStatus = document.getElementById("advanced-config-status");
    ui.productSearchPanel = document.querySelector(".product-search");
    ui.filtersPanel = document.querySelector(".filters-panel");
    ui.brandSelector = document.getElementById("brand-selector");
    ui.classSelector = document.getElementById("class-selector");
    ui.limitSelector = document.getElementById("limit-selector");
    ui.mountingSurfaceSelector = document.getElementById("mounting-surface-selector");
    ui.resetSurvey = document.getElementById("reset-survey");
    ui.productSearch = document.getElementById("product-search");
    ui.productSearchResults = document.getElementById("product-search-results");
    ui.sheetStatus = document.getElementById("sheet-status");
    ui.appToast = document.getElementById("app-toast");
    ui.openGSheet = document.getElementById("open-gsheet");
    ui.refreshProducts = document.getElementById("refresh-products");
    ui.printRateConstant = document.getElementById("print-rate-constant");
    ui.downloadImposition = document.getElementById("download-imposition");
    ui.emailImposition = document.getElementById("email-imposition");
    ui.bleedMm = document.getElementById("bleed-mm");
    ui.overlapMm = document.getElementById("overlap-mm");
    ui.advancedOffsetChoices = document.getElementById("advanced-offset-choices");
    ui.elementModeInputs = Array.from(document.querySelectorAll("input[name='element-entry-mode']"));
    ui.elementCsvPanel = document.getElementById("element-csv-panel");
    ui.elementTablePanel = document.getElementById("element-table-panel");
    ui.inputPanel = document.querySelector(".input-panel");
    ui.elementRowsBody = document.getElementById("element-rows-body");
    ui.addElementRow = document.getElementById("add-element-row");
    ui.jobInput = document.getElementById("job-input");
    ui.loadSample = document.getElementById("load-sample");
    ui.artworkUpload = document.getElementById("artwork-upload");
    ui.clearArtwork = document.getElementById("clear-artwork");
    ui.artworkList = document.getElementById("artwork-list");
    ui.artworkFitWarning = document.getElementById("artwork-fit-warning");
    ui.inputErrors = document.getElementById("input-errors");
    ui.rollChoice = document.getElementById("roll-choice");
    ui.metricLinear = document.getElementById("metric-linear");
    ui.metricJoins = document.getElementById("metric-joins");
    ui.metricPrice = document.getElementById("metric-price");
    ui.metricRate = document.getElementById("metric-rate");
    ui.resultsPanel = document.querySelector(".results-panel");
    ui.costBreakdown = document.getElementById("cost-breakdown");
    ui.offsetPrompt = document.getElementById("offset-prompt");
    ui.optionCount = document.getElementById("option-count");
    ui.optionsBody = document.getElementById("options-body");
    ui.priceSummary = document.getElementById("price-summary");
    ui.addAllCart = document.getElementById("add-all-cart");
    ui.fixedAddAllCart = document.getElementById("fixed-add-all-cart");
    ui.addAllCartButtons = [ui.addAllCart, ui.fixedAddAllCart].filter(Boolean);
    ui.pricingBody = document.getElementById("pricing-body");
    ui.impositionSummary = document.getElementById("imposition-summary");
    ui.impositionPreview = document.getElementById("imposition-preview");
    ui.stockOptionsPanel = document.getElementById("widths-title")?.closest("section");
    ui.pricingConnection = document.getElementById("pricing-connection");
    ui.pricingConnectionLabel = document.getElementById("pricing-connection-label");
    ui.pricingLogin = document.getElementById("pricing-login");
    ui.pricingLoginForm = document.getElementById("pricing-login-form");
    ui.pricingLoginClose = document.getElementById("pricing-login-close");
    ui.pricingLoginCancel = document.getElementById("pricing-login-cancel");
    ui.pricingUsername = document.getElementById("pricing-username");
    ui.pricingPassword = document.getElementById("pricing-password");
    ui.pricingLoginError = document.getElementById("pricing-login-error");
  }

  function applyAppMode() {
    document.title = APP_CONFIG.title;
    document.documentElement.style.setProperty("--paper", APP_CONFIG.background);
    document.body.dataset.appMode = APP_MODE;
    if (ui.appTitle) ui.appTitle.textContent = APP_CONFIG.title;
    if (ui.openGSheet) ui.openGSheet.hidden = APP_MODE === "live";
    if (ui.refreshProducts) ui.refreshProducts.hidden = APP_MODE === "live";
  }

  function attachEvents() {
    ui.pricingConnection?.addEventListener("click", () => {
      if (state.pricingApiToken && window.confirm(`Disconnect ${state.pricingApiUser || "the current user"} from the Pricing Service?`)) {
        clearPricingSession();
        return;
      }
      ui.pricingLogin?.showModal();
      ui.pricingUsername?.focus();
    });
    ui.pricingLoginClose?.addEventListener("click", () => ui.pricingLogin.close());
    ui.pricingLoginCancel?.addEventListener("click", () => ui.pricingLogin.close());
    ui.pricingLoginForm?.addEventListener("submit", connectPricingService);
    document.querySelectorAll(".help-button").forEach((button) => {
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("keydown", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    });

    ui.productSearch.addEventListener("input", handleProductSearchInput);

    ui.configuratorProgress.addEventListener("click", handleConfiguratorProgressClick);
    ui.configuratorGuidance.addEventListener("click", handleConfiguratorGuidanceClick);
    ui.sheetStatus?.addEventListener("click", (event) => {
      const retry = event.target.closest("[data-selector-retry]");
      if (!retry) return;
      refreshProducts();
    });

    ui.productSearchResults.addEventListener("click", (event) => {
      const result = event.target.closest("[data-product-search-index]");
      if (!result) return;
      applyProductSearchSelection(Number.parseInt(result.dataset.productSearchIndex, 10));
    });

    ui.resetSurvey.addEventListener("click", resetSurveyAndFilters);

    ui.brandSelector.addEventListener("click", (event) => {
      const button = event.target.closest("[data-brand-filter]");
      if (!button) return;
      const brandFilter = button.dataset.brandFilter;
      if (!getBrandOption(brandFilter)) return;
      if (state.brandFilter === brandFilter) {
        ui.brandSelector.querySelector("details")?.removeAttribute("open");
        return;
      }
      state.brandFilter = brandFilter;
      state.productSearchSelection = null;
      state.productSearchQuery = "";
      ui.productSearch.value = "";
      validateMountingSurfaceFilter();
      validateSelectorSelections();
      renderBrandSelector();
      renderMountingSurfaceSelector();
      recalculate();
    });

    ui.brandSelector.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const dropdown = ui.brandSelector.querySelector("details");
      if (!dropdown?.open) return;
      dropdown.open = false;
      dropdown.querySelector("summary")?.focus();
    });

    document.addEventListener("click", (event) => {
      if (ui.brandSelector.contains(event.target)) return;
      ui.brandSelector.querySelector("details")?.removeAttribute("open");
    });

    ui.classSelector.addEventListener("click", (event) => {
      const button = event.target.closest("[data-class-filter]");
      if (!button) return;
      const classFilter = button.dataset.classFilter;
      if (!getClassOption(classFilter) || state.classFilter === classFilter) return;
      state.classFilter = classFilter;
      state.productSearchSelection = null;
      state.productSearchQuery = "";
      ui.productSearch.value = "";
      validateMountingSurfaceFilter();
      validateSelectorSelections();
      renderClassSelector();
      renderMountingSurfaceSelector();
      recalculate();
    });

    ui.limitSelector.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-limit-filter]");
      if (!checkbox) return;
      const limitFilter = checkbox.dataset.limitFilter;
      if (!getLimitFilterOption(limitFilter)) return;
      if (checkbox.checked) {
        state.limitFilters.add(limitFilter);
      } else {
        state.limitFilters.delete(limitFilter);
      }
      state.productSearchSelection = null;
      state.productSearchQuery = "";
      ui.productSearch.value = "";
      validateMountingSurfaceFilter();
      validateSelectorSelections();
      renderLimitFilters();
      renderMountingSurfaceSelector();
      recalculate();
    });

    ui.mountingSurfaceSelector.addEventListener("change", (event) => {
      const input = event.target.closest("[data-mounting-surface-filter]");
      if (!input) return;
      state.mountingSurfaceFilter = input.value || MOUNTING_SURFACE_ALL;
      state.productSearchSelection = null;
      state.productSearchQuery = "";
      ui.productSearch.value = "";
      validateSelectorSelections();
      renderMountingSurfaceSelector();
      recalculate();
    });

    ui.openGSheet.addEventListener("click", openGSheetWithPassword);

    ui.selectorSurvey.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-selector-column]");
      const reset = event.target.closest("[data-selector-reset]");
      const back = event.target.closest("[data-selector-back]");
      const clearFilters = event.target.closest("[data-selector-clear-filters]");

      if (reset) {
        resetSurveyAndFilters();
        return;
      }

      if (clearFilters) {
        clearSelectorFilters();
        return;
      }

      if (back) {
        state.productSearchSelection = null;
        undoLastSelectorSelection();
        recalculate();
        return;
      }

      if (!choice) return;
      const column = choice.dataset.selectorColumn;
      if (column === "Product" && reopenLaminateSelectionForProduct(choice.dataset.selectorValue)) {
        state.productSearchSelection = null;
        recalculate();
        return;
      }
      const shouldKeepSearchSelection = Boolean(state.productSearchSelection) && column !== "Product";
      if (!shouldKeepSearchSelection) {
        state.productSearchSelection = null;
      }
      state.selectorSelections[column] = choice.dataset.selectorValue;
      if (choice.dataset.selectorPreserveAfter === "true") {
        validateSelectorSelections();
      } else {
        pruneSelectionsAfter(column);
      }
      if (shouldKeepSearchSelection && state.productSearchSelection) {
        state.productSearchSelection.selections = { ...state.selectorSelections };
      }
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
      state.offsetPromptDismissed = false;
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
      lastRow?.querySelector("[data-element-field='quantity']")?.focus();
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

    ui.advancedOffsetChoices?.addEventListener("click", handleOffsetChoiceClick);
    ui.offsetPrompt.addEventListener("click", handleOffsetPromptClick);

    ui.downloadImposition.addEventListener("click", downloadImposition);
    ui.emailImposition.addEventListener("click", emailImposition);
    ui.addAllCartButtons.forEach((button) => {
      button.addEventListener("click", addAllToCart);
    });
  }

  function initRecommendationPanelSizing() {
    if (!ui.resultsPanel) return;
    scheduleRecommendationPanelSpaceUpdate();
    window.addEventListener("resize", scheduleRecommendationPanelSpaceUpdate);
    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleRecommendationPanelSpaceUpdate).catch(() => {});
    }
    if ("ResizeObserver" in window) {
      recommendationPanelResizeObserver = new ResizeObserver(scheduleRecommendationPanelSpaceUpdate);
      recommendationPanelResizeObserver.observe(ui.resultsPanel);
    }
  }

  function scheduleRecommendationPanelSpaceUpdate() {
    window.cancelAnimationFrame(recommendationPanelFrame);
    recommendationPanelFrame = window.requestAnimationFrame(updateRecommendationPanelSpace);
  }

  function updateRecommendationPanelSpace() {
    if (!ui.resultsPanel) return;
    const rect = ui.resultsPanel.getBoundingClientRect();
    const bottomOffset = Math.max(0, window.innerHeight - rect.bottom);
    const reservedSpace = Math.ceil(rect.height + bottomOffset + 28);
    document.documentElement.style.setProperty("--recommendation-panel-space", `${reservedSpace}px`);
  }

  function handleOffsetPromptClick(event) {
    const close = event.target.closest("[data-offset-prompt-close]");
    if (close) {
      state.offsetPromptDismissed = true;
      hideOffsetPrompt();
      return;
    }
    handleOffsetChoiceClick(event);
  }

  function handleOffsetChoiceClick(event) {
    const choice = event.target.closest("[data-offset-choice]");
    if (!choice) return;
    state.useOffsetJoins = choice.dataset.offsetChoice === "yes";
    recalculate();
  }

  function hideOffsetPrompt() {
    if (!ui.offsetPrompt) return;
    ui.offsetPrompt.classList.add("hidden");
    ui.offsetPrompt.innerHTML = "";
    scheduleRecommendationPanelSpaceUpdate();
  }

  function syncOffsetChoiceButtons() {
    const useOffset = state.useOffsetJoins === true;
    document.querySelectorAll("[data-offset-choice]").forEach((button) => {
      const selected = button.dataset.offsetChoice === (useOffset ? "yes" : "no");
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function resetSurveyAndFilters() {
    state.selectorSelections = {};
    state.brandFilter = "all";
    state.classFilter = "all";
    state.limitFilters.clear();
    state.mountingSurfaceFilter = MOUNTING_SURFACE_ALL;
    state.productSearchSelection = null;
    state.productSearchQuery = "";
    ui.productSearch.value = "";
    renderBrandSelector();
    renderClassSelector();
    renderLimitFilters();
    renderMountingSurfaceSelector();
    recalculate();
  }

  function clearSelectorFilters() {
    state.brandFilter = "all";
    state.classFilter = "all";
    state.limitFilters.clear();
    state.mountingSurfaceFilter = MOUNTING_SURFACE_ALL;
    state.productSearchSelection = null;
    state.productSearchQuery = "";
    ui.productSearch.value = "";
    validateSelectorSelections();
    renderBrandSelector();
    renderClassSelector();
    renderLimitFilters();
    renderMountingSurfaceSelector();
    recalculate();
  }

  function handleConfiguratorProgressClick(event) {
    const step = event.target.closest("[data-configurator-target]");
    if (!step) return;
    goToConfiguratorTarget(step.dataset.configuratorTarget);
  }

  function handleConfiguratorGuidanceClick(event) {
    const button = event.target.closest("[data-configurator-guidance-target]");
    if (!button || button.disabled) return;
    goToConfiguratorTarget(button.dataset.configuratorGuidanceTarget);
  }

  function goToConfiguratorTarget(target) {
    const targetElements = getConfiguratorTargetElements(target);
    if (!targetElements?.scrollTarget) return;

    const shouldScroll = !isElementVisible(targetElements.scrollTarget);
    if (shouldScroll) {
      targetElements.scrollTarget.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    }
    highlightConfiguratorTarget(targetElements.scrollTarget);

    const focusTarget = targetElements.focusTarget ||
      getFirstFocusableElement(targetElements.scrollTarget) ||
      targetElements.scrollTarget;
    window.setTimeout(() => focusElementWithoutJump(focusTarget), shouldScroll ? 140 : 0);
  }

  function isElementVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const margin = 12;
    return rect.bottom > margin &&
      rect.top < viewportHeight - margin &&
      rect.right > margin &&
      rect.left < viewportWidth - margin;
  }

  function getConfiguratorTargetElements(target) {
    if (target === "product") {
      return {
        scrollTarget: ui.productSearchPanel || ui.productSearch,
        focusTarget: ui.productSearch
      };
    }

    if (target === "filters") {
      return {
        scrollTarget: ui.filtersPanel,
        focusTarget: getFirstFocusableElement(ui.filtersPanel)
      };
    }

    if (target === "selector") {
      return {
        scrollTarget: ui.selectorSurvey,
        focusTarget: getFirstFocusableElement(ui.selectorSurvey)
      };
    }

    if (target === "data") {
      return {
        scrollTarget: ui.inputPanel,
        focusTarget: getDataEntryFocusTarget()
      };
    }

    if (target === "result") {
      return {
        scrollTarget: ui.resultsPanel || ui.stockOptionsPanel,
        focusTarget: ui.fixedAddAllCart && !ui.fixedAddAllCart.disabled ? ui.fixedAddAllCart : ui.resultsPanel
      };
    }

    return null;
  }

  function getDataEntryFocusTarget() {
    if (state.elementInputMode === "csv") return ui.jobInput;
    return ui.elementRowsBody?.querySelector("[data-element-field]") || ui.addElementRow || ui.jobInput;
  }

  function getFirstFocusableElement(container) {
    return container?.querySelector("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])") || null;
  }

  function highlightConfiguratorTarget(element) {
    element.classList.remove("progress-target-highlight");
    void element.offsetWidth;
    element.classList.add("progress-target-highlight");
    window.setTimeout(() => element.classList.remove("progress-target-highlight"), 1300);
  }

  function focusElementWithoutJump(element) {
    if (!element) return;
    const hadTabIndex = element.hasAttribute("tabindex");
    if (!isNaturallyFocusable(element) && !hadTabIndex) {
      element.setAttribute("tabindex", "-1");
    }
    element.focus({ preventScroll: true });
    if (!hadTabIndex && element.getAttribute("tabindex") === "-1") {
      window.setTimeout(() => element.removeAttribute("tabindex"), 500);
    }
  }

  function isNaturallyFocusable(element) {
    return Boolean(element.matches("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"));
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

  async function openGSheetWithPassword() {
    if (!isAppsScriptConfigured()) {
      showAppToast("Apps Script is not configured yet.", "error");
      return;
    }

    const password = window.prompt("Enter password to open the GSheet");
    if (password == null) return;

    try {
      const payload = await loadAppsScriptPayload({
        action: "openSheet",
        password: password.trim()
      });
      if (!payload.url) throw new Error("No sheet URL was returned.");
      window.open(payload.url, "_blank", "noopener");
    } catch (error) {
      showAppToast(error.message || "Could not open the GSheet.", "error");
    }
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
        <td><input data-element-field="quantity" aria-label="Quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}"></td>
        <td><input data-element-field="width" aria-label="Width" type="number" min="0" step="1" value="${escapeHtml(row.width)}"></td>
        <td><input data-element-field="height" aria-label="Height" type="number" min="0" step="1" value="${escapeHtml(row.height)}"></td>
        <td><input data-element-field="shortname" aria-label="Shortname" value="${escapeHtml(row.shortname)}"></td>
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
    const fieldOrder = ["quantity", "width", "height", "shortname"];
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
    const firstField = firstRow?.querySelector("[data-element-field='quantity']");
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
    setSheetStatus("loading", "Loading SAV catalogue...");

    const strapiConfigured = isStrapiConfigured();
    const [configResult, selectorResult, strapiResult, brandResult] = await Promise.allSettled([
      loadConfigFromAppsScript(),
      loadSelectorFromAppsScript(),
      strapiConfigured ? loadSavCatalogFromStrapi() : Promise.resolve(null),
      strapiConfigured ? loadBrandsFromStrapi() : Promise.resolve(null)
    ]);

    if (strapiConfigured && brandResult.status === "fulfilled" && brandResult.value?.length) {
      applyStrapiBrands(brandResult.value);
    } else {
      state.brandOptions = FALLBACK_BRAND_OPTIONS.map((option) => ({ ...option }));
      if (!getBrandOption(state.brandFilter, false)) state.brandFilter = "all";
      renderBrandSelector();
    }

    state.pricingConfig = configResult.status === "fulfilled"
      ? { ...DEFAULT_PRICING_CONFIG, ...configResult.value }
      : { ...DEFAULT_PRICING_CONFIG };

    if (selectorResult.status === "fulfilled" && selectorResult.value.rows.length) {
      let selectorData = selectorResult.value;

      if (strapiConfigured) {
        if (strapiResult.status === "rejected") {
          applySelectorData({ ...selectorData, rows: [] }, "strapi-error");
          setSheetStatus("error", "Could not load the published Strapi catalogue. Product selection is unavailable.", { retry: true });
          recalculate();
          return;
        }

        selectorData = await mergeStrapiCatalog(selectorData, strapiResult.value);
        if (!selectorData.rows.length) {
          applySelectorData(selectorData, "strapi");
          setSheetStatus("warning", "Strapi has no published SAV configurations matching the pricing feed.", { retry: true });
          recalculate();
          return;
        }
      }

      applySelectorData(selectorData, strapiConfigured ? "strapi+apps-script" : "apps-script");
      if (configResult.status === "rejected") {
        setSheetStatus("warning", "Product data loaded, but Config could not be loaded. Default pricing settings are being used.", { retry: true });
      } else {
        setSheetStatus("", "");
      }
    } else {
      const error = selectorResult.status === "rejected"
        ? selectorResult.reason
        : new Error("No selector rows in sheet");
      applySelectorData(parseSelectorCsv(FALLBACK_SELECTOR_CSV), "fallback");
      setSheetStatus("error", getSelectorLoadFailureMessage(error), { retry: true });
    }

    recalculate();
  }

  async function refreshPricingConfig() {
    state.pricingConfig = { ...DEFAULT_PRICING_CONFIG };
    if (!isAppsScriptConfigured()) return;

    try {
      const config = await loadConfigFromAppsScript();
      state.pricingConfig = {
        ...DEFAULT_PRICING_CONFIG,
        ...config
      };
    } catch (error) {
      state.pricingConfig = { ...DEFAULT_PRICING_CONFIG };
    }
  }

  function isAppsScriptConfigured() {
    return /^https:\/\/script\.google\.com\/macros\/s\//i.test(APPS_SCRIPT_WEB_APP_URL);
  }

  function isStrapiConfigured() {
    return /^https?:\/\//i.test(STRAPI_BASE_URL);
  }

  async function loadSavCatalogFromStrapi() {
    const url = new URL("/api/sav-builder-options", STRAPI_BASE_URL);
    url.searchParams.set("pagination[pageSize]", String(STRAPI_PAGE_SIZE));
    url.searchParams.set("sort", "sortOrder:asc");
    url.searchParams.set("populate", "*");

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = window.setTimeout(() => controller?.abort(), STRAPI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        signal: controller?.signal
      });
      if (!response.ok) throw new Error(`Strapi catalogue returned HTTP ${response.status}.`);

      const payload = await response.json();
      if (!Array.isArray(payload?.data)) throw new Error("Strapi catalogue response has no data array.");
      return payload.data.map((entry) => entry?.attributes ? { ...entry.attributes, documentId: entry.documentId || entry.id } : entry);
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Strapi catalogue request timed out.");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function mergeStrapiCatalog(selectorData, catalogEntries) {
    const catalogBySourceKey = new Map(
      catalogEntries
        .filter((entry) => entry?.sourceKey)
        .map((entry) => [String(entry.sourceKey), entry])
    );

    const mergedRows = [];
    for (const row of selectorData.rows) {
      const sourceKey = await buildSavSourceKey(row);
      const entry = catalogBySourceKey.get(sourceKey);
      if (!entry) continue;

      const merged = mergeStrapiEntryIntoSelectorRow(row, entry);
      if (merged) mergedRows.push(merged);
    }

    return { ...selectorData, rows: mergedRows };
  }

  function mergeStrapiEntryIntoSelectorRow(row, entry) {
    const surfaceGuidance = Array.isArray(entry.surfaceGuidance) ? entry.surfaceGuidance : [];
    const rowSurfaceKey = normalizeKey(row[MOUNTING_SURFACE_COLUMN]);
    const surfaceInfo = surfaceGuidance.find((guidance) =>
      normalizeKey(SURFACE_LABELS[guidance.surface] || guidance.surface) === rowSurfaceKey
    );

    if (rowSurfaceKey && !surfaceInfo) return null;

    const productSpecSheet = getStrapiMediaUrl(
      entry.productSpecSheet,
      entry.produstSpecSheet,
      entry.productSpecSheetUrl
    );
    const laminateSpecSheet = getStrapiMediaUrl(
      entry.laminateSpecSheet,
      entry.laminateSpecSheetUrl
    );

    return {
      ...row,
      Product: String(entry.productName || row.Product || "").trim(),
      Brand: String(entry.brand || "").trim(),
      Class: String(entry.materialClass || "").trim(),
      Longevity: String(entry.longevity || "").trim(),
      Laminate: String(entry.laminateName || "").trim(),
      "Product Spec Sheet": productSpecSheet,
      "Laminate Spec Sheet": laminateSpecSheet,
      "Surface Description": String(surfaceInfo?.description || "").trim(),
      "Surface Link": String(surfaceInfo?.link || "").trim(),
      White: toSelectorBoolean(entry.white),
      "Air Release": toSelectorBoolean(entry.airRelease),
      "Repositionable on Installation": toSelectorBoolean(entry.repositionable),
      Removable: toSelectorBoolean(entry.removable),
      "High-tac": toSelectorBoolean(entry.highTac),
      Greyback: toSelectorBoolean(entry.greyback),
      Translucent: toSelectorBoolean(entry.translucent),
      Clear: toSelectorBoolean(entry.clear),
      "Optically Clear": toSelectorBoolean(entry.opticallyClear),
      "Perforated (One way Vision)": toSelectorBoolean(entry.perforated),
      savDocumentId: entry.documentId || "",
      savSourceKey: entry.sourceKey
    };
  }

  async function loadBrandsFromStrapi() {
    const url = new URL("/api/brands", STRAPI_BASE_URL);
    url.searchParams.set("pagination[pageSize]", "100");
    url.searchParams.set("sort", "sortOrder:asc");
    url.searchParams.set("populate[logo]", "true");

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = window.setTimeout(() => controller?.abort(), STRAPI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        signal: controller?.signal
      });
      if (!response.ok) throw new Error(`Strapi brands returned HTTP ${response.status}.`);

      const payload = await response.json();
      if (!Array.isArray(payload?.data)) throw new Error("Strapi brands response has no data array.");
      return payload.data.map((entry) => entry?.attributes ? { ...entry.attributes, documentId: entry.documentId || entry.id } : entry);
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Strapi brands request timed out.");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function applyStrapiBrands(entries) {
    const brands = entries.map((entry) => {
      const label = String(entry?.name || "").trim();
      const id = savSlugify(String(entry?.key || label), 120);
      if (!label || !id) return null;
      return {
        id,
        label,
        matches: [label, String(entry?.key || "").trim()].filter(Boolean),
        logo: getStrapiMediaUrl(entry?.logo)
      };
    }).filter((brand) => brand?.logo);

    if (!brands.length) return;
    state.brandOptions = [
      { id: "all", label: "All", matches: [] },
      ...brands
    ];
    if (!getBrandOption(state.brandFilter, false)) state.brandFilter = "all";
    renderBrandSelector();
  }

  function getStrapiMediaUrl(...candidates) {
    for (const candidate of candidates) {
      const url = extractStrapiMediaUrl(candidate);
      if (url) return url;
    }
    return "";
  }

  function extractStrapiMediaUrl(value) {
    if (!value) return "";
    if (typeof value === "string") return normalizeStrapiAssetUrl(value);

    const data = value.data;
    if (Array.isArray(data)) {
      for (const item of data) {
        const url = extractStrapiMediaUrl(item);
        if (url) return url;
      }
    }
    if (data) {
      const url = extractStrapiMediaUrl(data);
      if (url) return url;
    }

    const attributesUrl = value.attributes?.url;
    if (attributesUrl) return normalizeStrapiAssetUrl(attributesUrl);
    if (value.url) return normalizeStrapiAssetUrl(value.url);

    return "";
  }

  function normalizeStrapiAssetUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return `${STRAPI_BASE_URL}${url}`;
    return url;
  }

  function toSelectorBoolean(value) {
    return value === true ? "TRUE" : "";
  }

  async function buildSavSourceKey(row) {
    const productName = String(row.Product || "").trim();
    const laminateName = String(row.Laminate || "").trim() || undefined;
    const rolls = (Array.isArray(row.rolls) ? row.rolls : [])
      .filter((roll) => Number.isInteger(roll.width) && roll.width > 0 && roll.qcode)
      .map((roll) => ({ widthMm: roll.width, qcode: String(roll.qcode).trim() }))
      .sort((left, right) => left.widthMm - right.widthMm);
    const identity = JSON.stringify({ productName, laminateName, rolls });
    const digest = await sha256Hex(identity);
    return `${savSlugify(productName, 120) || "sav-option"}-${digest.slice(0, 16)}`;
  }

  async function sha256Hex(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function savSlugify(value, maxLength) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxLength);
  }

  async function loadConfigFromAppsScript() {
    const payload = await loadAppsScriptPayload({ sheet: "Config" });
    return parseConfigRows(getAppsScriptRows(payload));
  }

  async function loadSelectorFromAppsScript() {
    const payload = await loadAppsScriptPayload({ sheet: "Selector" });
    return parseSelectorRows(getAppsScriptRows(payload));
  }

  function getAppsScriptRows(payload) {
    if (!payload || !Array.isArray(payload.values)) return [];
    return payload.values.map((row) =>
      Array.isArray(row) ? row.map((cell) => String(cell ?? "").trim()) : []
    );
  }

  async function loadAppsScriptPayload(params = {}) {
    if (!isAppsScriptConfigured()) {
      return Promise.reject(new Error("Apps Script is not configured."));
    }

    let lastError = null;
    for (let attempt = 0; attempt <= APPS_SCRIPT_RETRY_COUNT; attempt += 1) {
      try {
        return await loadAppsScriptJsonPayload(params);
      } catch (error) {
        lastError = error;
      }

      try {
        return await loadAppsScriptJsonpPayload(params);
      } catch (error) {
        lastError = error;
      }

      if (attempt < APPS_SCRIPT_RETRY_COUNT) {
        await wait(APPS_SCRIPT_RETRY_DELAY_MS * (attempt + 1));
      }
    }

    throw lastError || new Error("Apps Script request failed.");
  }

  async function loadAppsScriptJsonPayload(params = {}) {
    const url = buildAppsScriptUrl(params);
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = window.setTimeout(() => controller?.abort(), APPS_SCRIPT_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        signal: controller?.signal
      });
      const text = await response.text();
      const payload = parseAppsScriptJsonResponse(text);
      validateAppsScriptPayload(payload, response.status);
      return payload;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Apps Script request timed out.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function loadAppsScriptJsonpPayload(params = {}) {
    return new Promise((resolve, reject) => {
      const callbackName = `__savBuilderAppsScript${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Apps Script request timed out."));
      }, APPS_SCRIPT_REQUEST_TIMEOUT_MS);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = (payload) => {
        cleanup();
        try {
          validateAppsScriptPayload(payload);
          resolve(payload);
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("Apps Script request failed."));
      };

      script.src = buildAppsScriptUrl(params, callbackName).toString();
      document.head.appendChild(script);
    });
  }

  function buildAppsScriptUrl(params = {}, callbackName = "") {
    const url = new URL(APPS_SCRIPT_WEB_APP_URL);
    Object.entries({
      ...params,
      mode: APP_MODE,
      callback: callbackName,
      _: Date.now()
    }).forEach(([key, value]) => {
      if (value != null && value !== "") url.searchParams.set(key, value);
    });
    return url;
  }

  function validateAppsScriptPayload(payload, status = 200) {
    if (!payload || payload.ok === false) {
      throw new Error(payload?.error || `Apps Script request failed with HTTP ${status}.`);
    }
  }

  function getSelectorLoadFailureMessage(error) {
    const detail = APP_MODE === "dev" && error?.message ? ` ${error.message}` : "";
    return `Could not load the live GSheet data.${detail} Using emergency fallback data.`;
  }

  function setSheetStatus(variant, message, options = {}) {
    if (!ui.sheetStatus) return;

    const text = String(message || "").trim();
    ui.sheetStatus.hidden = !text;
    ui.sheetStatus.className = `sheet-status${variant ? ` ${variant}` : ""}`;
    ui.sheetStatus.innerHTML = text
      ? `<span>${escapeHtml(text)}</span>${options.retry ? `<button class="ghost-button compact" type="button" data-selector-retry>Try again</button>` : ""}`
      : "";
  }

  function showAppToast(message, variant = "success", options = {}) {
    const text = String(message || "").trim();
    if (!text) return;

    window.clearTimeout(appToastTimer);

    if (!ui.appToast) {
      if (variant === "error") window.alert(text);
      return;
    }

    const timeoutMs = Number.isFinite(options.timeoutMs)
      ? options.timeoutMs
      : (variant === "error" ? 6500 : 3400);

    ui.appToast.textContent = text;
    ui.appToast.className = `app-toast ${variant}`;
    ui.appToast.hidden = false;
    window.requestAnimationFrame(() => ui.appToast.classList.add("is-visible"));

    appToastTimer = window.setTimeout(() => {
      ui.appToast.classList.remove("is-visible");
      window.setTimeout(() => { ui.appToast.hidden = true; }, 180);
    }, timeoutMs);
  }

  function applySelectorData(selectorData, source) {
    state.selectorRows = getPublishedSelectorRows(selectorData.rows);
    state.selectorColumns = selectorData.selectorColumns;
    state.postProductSelectorColumns = selectorData.postProductSelectorColumns || [];
    state.productSource = source;
    state.productSearchSelection = null;
    validateMountingSurfaceFilter();
    validateSelectorSelections();
    renderBrandSelector();
    renderClassSelector();
    renderLimitFilters();
    renderMountingSurfaceSelector();
  }

  function getPublishedSelectorRows(rows) {
    if (APP_MODE !== "live" || !hasPublishedColumn(rows)) return rows;
    return rows.filter(isPublishedSelectorRow);
  }

  function hasPublishedColumn(rows) {
    return rows.some((row) =>
      Object.keys(row).some(isPublishedColumnName)
    );
  }

  function isPublishedSelectorRow(row) {
    return PUBLISHED_COLUMN_CANDIDATES.some((column) =>
      isTrueFilterCell(getRowValueForColumn(row, column))
    );
  }

  function recalculate() {
    const parsed = parseElements(ui.jobInput.value);
    renderInputErrors(parsed.errors);
    reconcileArtworkMappings(parsed.elements);
    const selectorState = getSelectorState();
    state.selectedProduct = selectorState.product;
    renderProductSearch();
    renderSelectorSurvey(selectorState);
    renderConfiguratorProgress(selectorState, parsed.elements);
    renderAdvancedConfigStatus();

    if (!parsed.elements.length) {
      state.currentBest = null;
      state.currentOptions = [];
      renderConfiguratorGuidance(selectorState, parsed.elements, null);
      renderArtworkList(parsed.elements);
      renderEmptyResults();
      return;
    }

    const product = selectorState.product;
    if (!product) {
      state.currentBest = null;
      state.currentOptions = [];
      renderConfiguratorGuidance(selectorState, parsed.elements, null);
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
    renderConfiguratorGuidance(selectorState, parsed.elements, best);
    requestAuthoritativeQuote(product, parsed.elements, settings);
  }

  function renderPricingConnection(status = "") {
    if (!ui.pricingConnection || !ui.pricingConnectionLabel) return;
    const connected = Boolean(state.pricingApiToken);
    ui.pricingConnection.classList.toggle("is-connected", connected);
    ui.pricingConnection.classList.toggle("is-working", status === "working");
    ui.pricingConnectionLabel.textContent = status === "working"
      ? "Checking price…"
      : connected
        ? `Pricing: ${state.pricingApiUser || "connected"}`
        : "Connect pricing";
    ui.pricingConnection.title = connected ? "Authoritative backend pricing is connected. Click to disconnect." : "Sign in to use authoritative backend pricing.";
  }

  async function connectPricingService(event) {
    event.preventDefault();
    const username = String(ui.pricingUsername?.value || "").trim();
    const password = String(ui.pricingPassword?.value || "");
    if (!username || !password || !PRICING_API_URL) return;
    const submit = ui.pricingLoginForm.querySelector("button[type='submit']");
    submit.disabled = true;
    ui.pricingLoginError.textContent = "";
    try {
      const response = await fetch(`${PRICING_API_URL}/api/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const payload = await response.json();
      if (!response.ok || !payload.token) throw new Error(payload.error || "Could not connect to the Pricing Service.");
      state.pricingApiToken = payload.token;
      state.pricingApiUser = payload.user?.username || username;
      window.sessionStorage.setItem("savBuilderPricingToken", state.pricingApiToken);
      window.sessionStorage.setItem("savBuilderPricingUser", state.pricingApiUser);
      ui.pricingPassword.value = "";
      ui.pricingLogin.close();
      renderPricingConnection();
      showAppToast("Authoritative Pricing Service connected.");
      recalculate();
    } catch (error) {
      ui.pricingLoginError.textContent = error?.message || "Could not connect to the Pricing Service.";
    } finally {
      submit.disabled = false;
    }
  }

  function clearPricingSession() {
    state.pricingApiToken = "";
    state.pricingApiUser = "";
    state.pricingQuoteRequestId += 1;
    window.sessionStorage.removeItem("savBuilderPricingToken");
    window.sessionStorage.removeItem("savBuilderPricingUser");
    renderPricingConnection();
    showAppToast("Pricing Service disconnected.");
    recalculate();
  }

  async function requestAuthoritativeQuote(product, elements, settings) {
    if (!PRICING_API_URL || !state.pricingApiToken || !product?.rolls?.length || !elements.length) {
      renderPricingConnection();
      return;
    }
    const requestId = ++state.pricingQuoteRequestId;
    renderPricingConnection("working");
    try {
      const response = await fetch(`${PRICING_API_URL}/api/v1/pricing/sav-builder/quote`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${state.pricingApiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          qcodes: product.rolls.map((roll) => roll.qcode).filter(Boolean),
          printMode: product.printMode || "",
          settings,
          elements: elements.map((element) => ({ shortname: element.shortname, quantity: element.quantity, widthMm: element.width, heightMm: element.height }))
        })
      });
      const quote = await response.json();
      if (requestId !== state.pricingQuoteRequestId) return;
      if (response.status === 401) {
        clearPricingSession();
        showAppToast("Your Pricing Service session expired. Please connect again.", "error");
        return;
      }
      if (!response.ok) throw new Error(quote.error || "Authoritative pricing failed.");
      applyAuthoritativeQuote(quote, elements);
      renderPricingConnection();
    } catch (error) {
      if (requestId !== state.pricingQuoteRequestId) return;
      renderPricingConnection();
      showAppToast(`${error?.message || "Authoritative pricing failed."} Showing the local estimate.`, "error");
    }
  }

  function applyAuthoritativeQuote(quote, elements) {
    const qcode = String(quote?.source?.qcode || "").trim();
    const localBest = state.currentOptions.find((option) => String(option.roll.qcode || "").trim() === qcode);
    if (!localBest || !quote.imposition || !quote.costs) return;
    const alternatives = new Map((quote.alternatives || []).map((option) => [String(option.qcode || "").trim(), option]));
    const ranked = state.currentOptions.map((option) => {
      const authoritative = alternatives.get(String(option.roll.qcode || "").trim());
      return authoritative ? { ...option, costs: { ...option.costs, total: authoritative.total }, selectedPack: { ...option.selectedPack, lengthMm: authoritative.printLengthMm }, joins: authoritative.joins } : option;
    }).sort(compareRollOptions);
    const evenPack = quote.imposition.evenPack || localBest.evenPack;
    const offsetPack = quote.imposition.offsetPack || localBest.offsetPack;
    const selectedPack = quote.imposition.offsetJoinsUsed ? offsetPack : evenPack;
    const best = {
      ...localBest,
      costs: quote.costs,
      joins: quote.imposition.joins,
      offsetSaves: quote.imposition.offsetSaves,
      offsetJoinsUsed: quote.imposition.offsetJoinsUsed,
      elementPlans: quote.imposition.elementPlans,
      evenPack,
      offsetPack,
      selectedPack: { ...selectedPack, placements: quote.imposition.placements, truncated: quote.imposition.placementsTruncated, lengthMm: quote.imposition.printLengthMm },
      roll: { ...localBest.roll, printableWidth: quote.imposition.printableWidthMm }
    };
    state.currentBest = best;
    state.currentOptions = ranked;
    renderResults(best, ranked, elements);
    showAppToast("Price verified by the Vivad Pricing Service.");
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
    const searchSelectionState = getActiveProductSearchSelectionState();
    if (searchSelectionState) return searchSelectionState;

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

  function getActiveProductSearchSelectionState() {
    const selection = state.productSearchSelection;
    if (!selection || !Array.isArray(selection.rows) || !selection.rows.length) return null;

    const rows = selection.rows.filter((row) =>
      state.selectorRows.includes(row) &&
      row.isCompleteProduct &&
      matchesSelectedFilters(row)
    );
    if (!rows.length) {
      state.productSearchSelection = null;
      return null;
    }

    const selections = { ...selection.selections };
    const productName = selection.productName || selections.Product || rows[0].Product;
    const question = getPrintModeQuestion(rows, selections);
    if (question) {
      const previewProduct = buildProductFromRows(rows, productName, selections);
      return {
        selections,
        pathEntries: getSelectorPathEntries(selections, rows, question),
        candidates: rows,
        question,
        product: null,
        previewProduct,
        hasRows: state.selectorRows.length > 0,
        completeProductCount: rows.length
      };
    }

    const product = buildProductFromRows(rows, productName, selections);
    if (!product) return null;

    return {
      selections,
      pathEntries: getProductSearchPathEntries(product),
      candidates: rows,
      question: null,
      product,
      hasRows: state.selectorRows.length > 0,
      completeProductCount: rows.length
    };
  }

  function renderProductSearch() {
    const query = state.productSearchQuery.trim();
    if (ui.productSearch.value !== state.productSearchQuery) {
      ui.productSearch.value = state.productSearchQuery;
    }
    if (!query) {
      ui.productSearchResults.innerHTML = "";
      state.productSearchResults = [];
      return;
    }

    const results = getProductSearchResults(query);
    state.productSearchResults = results;
    if (!results.length) {
      ui.productSearchResults.innerHTML = `<div class="product-search-empty">No matching products.</div>`;
      return;
    }

    ui.productSearchResults.innerHTML = `
      <div class="product-search-list">
        ${results.map((result, index) => renderProductSearchResult(result, index)).join("")}
      </div>
    `;
  }

  function handleProductSearchInput() {
    state.productSearchQuery = ui.productSearch.value;
    if (applyMountingSurfaceFilterFromSearch(state.productSearchQuery)) {
      state.productSearchSelection = null;
      validateSelectorSelections();
      renderMountingSurfaceSelector();
      recalculate();
      return;
    }

    renderProductSearch();
  }

  function getProductSearchResults(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const grouped = new Map();

    state.selectorRows.forEach((row, index) => {
      if (!row.isCompleteProduct || !row.Product) return;
      if (!matchesSelectedFilters(row)) return;
      const haystack = getProductSearchHaystack(row);
      if (!terms.every((term) => matchesProductSearchTerm(haystack, term))) return;

      const key = getProductSearchGroupKey(row);
      if (!grouped.has(key)) {
        grouped.set(key, {
          row,
          rows: [],
          indexes: []
        });
      }
      const result = grouped.get(key);
      result.rows.push(row);
      result.indexes.push(index);
    });

    return Array.from(grouped.values()).slice(0, 20);
  }

  function getProductSearchGroupKey(row) {
    return [
      row.Product,
      row[BRAND_COLUMN],
      row.Laminate,
      row.Type,
      row[DERIVED_PERFORATION_COLUMN],
      row[LONGEVITY_COLUMN],
      getRollWidthLabels(row).join("|"),
      getRollQCodes(row).join("|")
    ].map((value) => String(value || "").trim()).join("\u001f");
  }

  function getProductSearchHaystack(row) {
    const mountingSurface = row[MOUNTING_SURFACE_COLUMN];
    const values = [
      row.Product,
      mountingSurface,
      getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, mountingSurface),
      row.Laminate,
      ...getRollQCodes(row)
    ].filter(Boolean);

    return {
      text: values.join(" ").toLowerCase(),
      normalized: values.map(normalizeKey).join(" ")
    };
  }

  function matchesProductSearchTerm(haystack, term) {
    const normalizedTerm = normalizeKey(term);
    return haystack.text.includes(term) ||
      (normalizedTerm && haystack.normalized.includes(normalizedTerm));
  }

  function applyMountingSurfaceFilterFromSearch(query) {
    const matchingSurface = getMountingSurfaceSearchMatch(query);
    if (!matchingSurface || matchingSurface === state.mountingSurfaceFilter) return false;
    state.mountingSurfaceFilter = matchingSurface;
    return true;
  }

  function getMountingSurfaceSearchMatch(query) {
    const normalizedQuery = normalizeKey(query);
    const terms = getProductSearchTerms(query);
    if (!normalizedQuery && !terms.length) return "";

    return getAvailableMountingSurfaceChoices().find((choice) =>
      getMountingSurfaceSearchLabels(choice).some((label) =>
        matchesMountingSurfaceSearchLabel(label, normalizedQuery, terms)
      )
    ) || "";
  }

  function getMountingSurfaceSearchLabels(choice) {
    return Array.from(new Set([
      choice,
      getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, choice)
    ].map((label) => String(label || "").trim()).filter(Boolean)));
  }

  function getProductSearchTerms(query) {
    return String(query || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map(normalizeKey)
      .filter(Boolean);
  }

  function matchesMountingSurfaceSearchLabel(label, normalizedQuery, terms) {
    const labelKey = normalizeKey(label);
    if (!labelKey) return false;
    if (normalizedQuery && (labelKey === normalizedQuery || (normalizedQuery.length >= 3 && labelKey.includes(normalizedQuery)))) {
      return true;
    }
    return terms.some((term) =>
      term.length >= 3 && (labelKey === term || labelKey.includes(term))
    );
  }

  function renderProductSearchResult(result, index) {
    const meta = getProductSearchMeta(result);
    return `
      <button class="product-search-result" type="button" data-product-search-index="${index}">
        <strong>${escapeHtml(result.row.Product)}</strong>
        ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
      </button>
    `;
  }

  function getProductSearchMeta(result) {
    const row = result.row || result;
    const surfaces = getProductSearchSurfaces(result);
    const surfaceLabels = surfaces.map((surface) => getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, surface));
    const parts = [
      row[BRAND_COLUMN] ? `Brand: ${row[BRAND_COLUMN]}` : "",
      row.Laminate ? `Laminate: ${row.Laminate}` : "",
      surfaceLabels.length ? `${surfaceLabels.length === 1 ? "Mounting surface" : "Mounting surfaces"}: ${surfaceLabels.join(", ")}` : "",
      row.Type,
      row[DERIVED_PERFORATION_COLUMN],
      row[LONGEVITY_COLUMN]
    ].filter(Boolean);
    const widths = row.rolls && row.rolls.length
      ? getRollWidthLabels(row).join(", ")
      : "";
    if (widths) parts.push(widths);
    const qcodes = getRollQCodes(row);
    if (qcodes.length) parts.push(`${qcodes.length === 1 ? "QCode" : "QCodes"}: ${qcodes.join(", ")}`);
    return parts.join(" | ");
  }

  function getProductSearchSurfaces(result) {
    const rows = result.rows || [result.row || result];
    return Array.from(new Set(rows
      .map((row) => String(row[MOUNTING_SURFACE_COLUMN] || "").trim())
      .filter(Boolean)));
  }

  function getRollQCodes(row) {
    const qcodes = row.rolls && row.rolls.length
      ? row.rolls.map((roll) => String(roll.qcode || "").trim())
      : [];
    return Array.from(new Set(qcodes.filter(Boolean)));
  }

  function getRollWidthLabels(row) {
    return row.rolls && row.rolls.length
      ? row.rolls.map((roll) => formatRollWidthLabel(roll))
      : [];
  }

  function applyProductSearchSelection(resultIndex) {
    const result = state.productSearchResults[resultIndex];
    if (!result) return;
    const rows = result.rows && result.rows.length ? result.rows : [result.row];

    const selections = {};
    getSelectorSelectionOrder().forEach((column) => {
      const value = getCommonSelectorValue(rows, column);
      if (value) {
        selections[column] = value;
      }
    });
    const productName = String(result.row?.Product || rows[0]?.Product || "").trim();
    if (productName) {
      selections.Product = productName;
    }

    state.selectorSelections = selections;
    validateSelectorSelections();
    state.productSearchSelection = {
      rows,
      selections: { ...state.selectorSelections },
      productName
    };
    state.productSearchQuery = "";
    ui.productSearch.value = "";
    recalculate();
  }

  function getCommonSelectorValue(rows, column) {
    const values = Array.from(new Set(rows
      .map((row) => String(row[column] || "").trim())
      .filter(isMeaningfulSelectorValue)));
    return values.length === 1 ? values[0] : "";
  }

  function getCandidateSelectorRows(selections) {
    return state.selectorRows.filter((row) =>
      matchesSelectedFilters(row) &&
      Object.entries(selections).every(([column, value]) =>
        isSyntheticSelectorColumn(column) || !value || String(row[column] || "") === value
      )
    );
  }

  function getProductSearchPathEntries(product) {
    const selections = product.selectorSelections || {};
    return getSelectorSelectionOrder()
      .filter((column) => column !== MOUNTING_SURFACE_COLUMN && shouldShowSelectorColumn(column) && selections[column])
      .map((column) => ({ column, value: selections[column], inferred: false }));
  }

  function reopenLaminateSelectionForProduct(productName) {
    const product = String(productName || "").trim();
    if (!product || normalizeKey(state.selectorSelections.Product) !== normalizeKey(product)) return false;
    if (!state.selectorSelections[LAMINATE_COLUMN]) return false;
    if (getLaminateChoicesForProduct(product).length <= 1) return false;

    clearSelectionFromColumn(LAMINATE_COLUMN, { Product: product });
    return true;
  }

  function getLaminateChoicesForProduct(productName) {
    const product = String(productName || "").trim();
    if (!product) return [];
    const selections = {
      ...getSelectionsBeforeColumn(state.selectorSelections, "Product"),
      Product: product
    };
    return getSortedSelectorChoices(
      getCandidateSelectorRows(selections).filter((row) => row.isCompleteProduct),
      LAMINATE_COLUMN
    ).filter(isMeaningfulSelectorValue);
  }

  function clearSelectionFromColumn(column, preservedSelections = {}) {
    const order = getSelectorSelectionOrder();
    const index = order.indexOf(column);
    if (index >= 0) {
      order.slice(index).forEach((laterColumn) => {
        delete state.selectorSelections[laterColumn];
      });
    } else {
      delete state.selectorSelections[column];
      delete state.selectorSelections[PRINT_MODE_COLUMN];
      state.postProductSelectorColumns.forEach((laterColumn) => {
        delete state.selectorSelections[laterColumn];
      });
    }

    Object.entries(preservedSelections).forEach(([preservedColumn, value]) => {
      if (value) state.selectorSelections[preservedColumn] = value;
    });
    validateSelectorSelections();
  }

  function renderConfiguratorProgress(selectorState, elements = []) {
    if (!ui.configuratorProgress) return;
    const product = selectorState.product || selectorState.previewProduct;
    const hasProduct = Boolean(selectorState.product);
    const hasElements = elements.length > 0;
    const activeFilterCount = getActiveFilterCount();
    const filterSummary = getProgressFilterSummary(activeFilterCount);
    const currentQuestion = selectorState.question
      ? getDisplaySelectorColumn(selectorState.question.label)
      : "Select";

    const steps = [
      {
        label: "Product",
        value: product?.name || currentQuestion,
        status: hasProduct ? "complete" : "current",
        target: "product"
      },
      {
        label: "Filters",
        value: filterSummary,
        status: activeFilterCount ? "complete" : "neutral",
        target: "filters"
      },
      {
        label: "Data",
        value: hasElements ? `${elements.length} ${elements.length === 1 ? "row" : "rows"}` : "No job",
        status: hasElements ? "complete" : (hasProduct ? "current" : "pending"),
        target: "data"
      },
      {
        label: "Result",
        value: hasProduct && hasElements ? "Ready" : "Pending",
        status: hasProduct && hasElements ? "complete" : "pending",
        target: "result"
      }
    ];

    ui.configuratorProgress.innerHTML = steps.map((step) => `
      <button class="configurator-step ${escapeHtml(step.status)}" type="button" data-configurator-target="${escapeHtml(step.target)}" aria-label="${escapeHtml(`Go to ${step.label}: ${step.value}`)}">
        <span>${escapeHtml(step.label)}</span>
        <strong>${escapeHtml(step.value)}</strong>
      </button>
    `).join("");
  }

  function getProgressFilterSummary(activeFilterCount = getActiveFilterCount()) {
    if (!activeFilterCount) return "Default";
    const surface = state.mountingSurfaceFilter === MOUNTING_SURFACE_ALL
      ? ""
      : getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, state.mountingSurfaceFilter);
    if (surface && activeFilterCount === 1) return `Surface: ${surface}`;
    return `${activeFilterCount} active`;
  }

  function renderConfiguratorGuidance(selectorState, elements = [], best = null) {
    if (!ui.configuratorGuidance) return;
    const hasProduct = Boolean(selectorState.product);
    const hasElements = elements.length > 0;
    const product = selectorState.product || selectorState.previewProduct;
    let title = "Choose a product";
    let body = "Use product search, mounting surface, brand, class and properties to narrow the available SAVs.";
    let status = "current";
    let target = "product";
    let disabled = false;

    if (!selectorState.hasRows) {
      title = "Loading product data";
      body = "The selector is waiting for the Apps Script product feed.";
      status = "pending";
      disabled = true;
    } else if (!selectorState.candidates.length) {
      title = "No results found";
      body = "Clear filters or broaden the selection to see matching SAV products.";
      target = "filters";
    } else if (!hasProduct && selectorState.question) {
      const question = getDisplaySelectorColumn(selectorState.question.label);
      const count = selectorState.completeProductCount || selectorState.candidates.length;
      title = `Choose ${question}`;
      body = `${formatInteger(count)} matching ${count === 1 ? "product" : "products"} remain. Search can still jump straight to a product, QCode or mounting surface.`;
      target = "selector";
    } else if (!hasProduct) {
      title = "Choose a product";
      body = "Adjust the filters or use search to find the SAV before calculating the job.";
      target = "product";
    } else if (!hasElements) {
      title = "Enter job sizes";
      body = `${product?.name || "The product"} is selected. Add quantity, width, height and shortname in Data Entry to calculate the roll.`;
      status = "current";
      target = "data";
    } else if (best) {
      title = "Review the recommendation";
      body = `${best.productName} is selected on ${getRollChoiceLabel(best.roll)} at ${formatMoney(best.costs.rate)} / sqm. Stock Options shows the available alternatives.`;
      status = "complete";
      target = "result";
    }

    ui.configuratorGuidance.className = `configurator-guidance ${status}${disabled ? " disabled" : ""}`;
    ui.configuratorGuidance.innerHTML = `
      <button class="configurator-guidance-button" type="button" data-configurator-guidance-target="${escapeHtml(target)}"${disabled ? " disabled" : ""}>
        <span class="configurator-guidance-kicker">Next action</span>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(body)}</span>
      </button>
    `;
  }

  function getActiveFilterCount() {
    return [
      state.mountingSurfaceFilter !== MOUNTING_SURFACE_ALL,
      state.brandFilter !== "all",
      state.classFilter !== "all",
      state.limitFilters.size > 0
    ].filter(Boolean).length;
  }

  function renderAdvancedConfigStatus() {
    if (!ui.advancedConfigStatus) return;
    const bleedType = document.querySelector("input[name='bleed-type']:checked")?.value || "none";
    const bleedMm = cleanNumber(ui.bleedMm?.value, 0);
    const overlapMm = cleanNumber(ui.overlapMm?.value, 20);
    const custom = bleedType !== "none" ||
      bleedMm > 0 ||
      Math.abs(overlapMm - 20) > 0.001 ||
      state.useOffsetJoins === true;
    ui.advancedConfigStatus.textContent = custom ? "Custom" : "Defaults";
    ui.advancedConfigStatus.classList.toggle("custom", custom);
    syncOffsetChoiceButtons();
  }

  function isSyntheticSelectorColumn(column) {
    return isPrintModeColumnName(column);
  }

  function renderBrandSelector() {
    if (!ui.brandSelector) return;
    const current = getBrandOption(state.brandFilter);
    const renderLogo = (option) => option.logo
      ? `<img class="brand-option-logo" src="${escapeHtml(option.logo)}" alt="" aria-hidden="true">`
      : `<span class="brand-all-mark" aria-hidden="true">ALL</span>`;
    const options = state.brandOptions.map((option) => {
      const selected = option.id === state.brandFilter;
      return `
        <button class="brand-dropdown-option${selected ? " selected" : ""}" type="button" data-brand-filter="${escapeHtml(option.id)}" role="option" aria-selected="${selected ? "true" : "false"}">
          <span class="brand-option-media">${renderLogo(option)}</span>
          <span class="brand-option-name">${escapeHtml(option.id === "all" ? "All brands" : option.label)}</span>
          <span class="brand-option-check" aria-hidden="true">✓</span>
        </button>
      `;
    }).join("");
    ui.brandSelector.innerHTML = `
      <details class="brand-dropdown">
        <summary class="brand-dropdown-trigger" aria-label="Select brand: ${escapeHtml(current.id === "all" ? "All brands" : current.label)}">
          <span class="brand-option-media">${renderLogo(current)}</span>
          <span class="brand-option-name">${escapeHtml(current.id === "all" ? "All brands" : current.label)}</span>
          <span class="brand-dropdown-chevron" aria-hidden="true"></span>
        </summary>
        <div class="brand-dropdown-menu" role="listbox" aria-label="Brands">
          ${options}
        </div>
      </details>
    `;
  }

  function renderClassSelector() {
    if (!ui.classSelector) return;
    ui.classSelector.innerHTML = CLASS_OPTIONS.map((option) => {
      const selected = option.id === state.classFilter;
      return `
        <button class="class-button${selected ? " selected" : ""}" type="button" data-class-filter="${escapeHtml(option.id)}" role="radio" aria-checked="${selected ? "true" : "false"}">
          <span>${escapeHtml(option.label)}</span>
        </button>
      `;
    }).join("");
  }

  function renderLimitFilters() {
    if (!ui.limitSelector) return;
    ui.limitSelector.innerHTML = LIMIT_FILTER_OPTIONS.map((option) => {
      const checked = state.limitFilters.has(option.id);
      return `
        <label class="limit-option${checked ? " selected" : ""}">
          <input type="checkbox" data-limit-filter="${escapeHtml(option.id)}" ${checked ? "checked" : ""}>
          <span>${escapeHtml(option.label)}</span>
        </label>
      `;
    }).join("");
  }

  function renderMountingSurfaceSelector() {
    if (!ui.mountingSurfaceSelector) return;
    const choices = getAvailableMountingSurfaceChoices();
    const options = [
      { value: MOUNTING_SURFACE_ALL, label: "All" },
      ...choices.map((choice) => ({
        value: choice,
        label: getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, choice)
      }))
    ];

    ui.mountingSurfaceSelector.innerHTML = `
      <select class="mounting-surface-select" id="mounting-surface-filter" data-mounting-surface-filter>
        ${options.map((option) => `
          <option value="${escapeHtml(option.value)}" ${option.value === state.mountingSurfaceFilter ? "selected" : ""}>${escapeHtml(option.label)}</option>
        `).join("")}
      </select>
    `;
  }

  function getAvailableMountingSurfaceChoices() {
    return getDistinctValues(
      state.selectorRows.filter((row) => row.isCompleteProduct && matchesBaseFilters(row)),
      MOUNTING_SURFACE_COLUMN
    );
  }

  function matchesSelectedFilters(row) {
    return matchesBaseFilters(row) &&
      matchesMountingSurfaceFilter(row);
  }

  function matchesBaseFilters(row) {
    return matchesBrandOption(row, getBrandOption(state.brandFilter)) &&
      matchesClassOption(row, getClassOption(state.classFilter)) &&
      matchesLimitFilters(row);
  }

  function matchesBrandOption(row, option) {
    if (!option || option.id === "all") return true;
    const brandKey = normalizeKey(row[BRAND_COLUMN]);
    return Boolean(brandKey) && option.matches.some((match) => brandKey.includes(normalizeKey(match)));
  }

  function matchesClassOption(row, option) {
    if (!option || option.id === "all") return true;
    const classKey = normalizeKey(getClassFilterText(row));
    return Boolean(classKey) && option.matches.some((match) => {
      const matchKey = normalizeKey(match);
      return option.matchMode === "prefix" ? classKey.startsWith(matchKey) : classKey.includes(matchKey);
    });
  }

  function matchesLimitFilters(row) {
    if (!state.limitFilters.size) return true;
    return Array.from(state.limitFilters).every((filterId) =>
      matchesLimitFilterOption(row, getLimitFilterOption(filterId))
    );
  }

  function matchesLimitFilterOption(row, option) {
    if (!option) return true;
    return option.columns.some((column) => isTrueFilterCell(getRowValueForColumn(row, column)));
  }

  function matchesMountingSurfaceFilter(row) {
    if (!state.mountingSurfaceFilter || state.mountingSurfaceFilter === MOUNTING_SURFACE_ALL) return true;
    return String(row[MOUNTING_SURFACE_COLUMN] || "").trim() === state.mountingSurfaceFilter;
  }

  function validateMountingSurfaceFilter() {
    if (!state.mountingSurfaceFilter || state.mountingSurfaceFilter === MOUNTING_SURFACE_ALL) return;
    const choices = getAvailableMountingSurfaceChoices();
    if (!choices.includes(state.mountingSurfaceFilter)) {
      state.mountingSurfaceFilter = MOUNTING_SURFACE_ALL;
    }
  }

  function getRowValueForColumn(row, column) {
    const key = normalizeKey(column);
    const header = Object.keys(row).find((candidate) => normalizeKey(candidate) === key);
    return header ? row[header] : "";
  }

  function getClassFilterText(row) {
    const explicitClass = CLASS_COLUMN_CANDIDATES
      .map((column) => String(row[column] || "").trim())
      .find(Boolean);
    if (explicitClass) return explicitClass;
    return [
      row.Product,
      row.Laminate,
      row.Type
    ].filter(Boolean).join(" ");
  }

  function getBrandOption(id, useFallback = true) {
    const option = state.brandOptions.find((candidate) => candidate.id === id);
    return option || (useFallback ? state.brandOptions[0] : null);
  }

  function getClassOption(id) {
    return CLASS_OPTIONS.find((option) => option.id === id) || CLASS_OPTIONS[0];
  }

  function getLimitFilterOption(id) {
    return LIMIT_FILTER_OPTIONS.find((option) => option.id === id) || null;
  }

  function getDisplaySelectorColumn(column) {
    return String(column || "");
  }

  function getDisplaySelectorValue(column, value) {
    return String(value || "").trim();
  }

  function shouldShowSelectorColumn(column) {
    if (isPerforationColumnName(column)) return state.limitFilters.has("perforated");
    if (isPrintModeColumnName(column)) return true;
    return true;
  }

  function getSelectorPathEntries(selections, candidates, question) {
    const entries = [];

    for (const column of state.selectorColumns) {
      if (!shouldShowSelectorColumn(column)) continue;
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

    const printModeEntry = getPrintModePathEntry(candidates, selections, question);
    if (printModeEntry) entries.push(printModeEntry);

    for (const column of state.postProductSelectorColumns) {
      if (!shouldShowSelectorColumn(column)) continue;
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
    for (const column of state.selectorColumns) {
      if (!shouldShowSelectorColumn(column)) continue;
      if (selections[column]) continue;
      const choices = getSortedSelectorChoices(candidates, column);
      if (choices.length > 1) {
        return { column, label: column, choices };
      }
    }

    if (!selections.Product) {
      const productChoices = getSortedSelectorChoices(candidates.filter((row) => row.isCompleteProduct), "Product");
      if (productChoices.length > 1) {
        return { column: "Product", label: "Product", choices: productChoices };
      }
    }

    const printModeQuestion = getPrintModeQuestion(candidates, selections);
    if (printModeQuestion) return printModeQuestion;

    for (const column of state.postProductSelectorColumns) {
      if (!shouldShowSelectorColumn(column)) continue;
      if (selections[column]) continue;
      const choices = getSortedSelectorChoices(candidates, column);
      if (choices.length > 1) {
        return { column, label: column, choices };
      }
    }

    return null;
  }

  function getPrintModeQuestion(candidates, selections) {
    if (selections[PRINT_MODE_COLUMN]) return null;
    const rows = getPrintModeCandidateRows(candidates, selections);
    const choices = getPrintModeOptionsForRows(rows).map((option) => option.label);
    return choices.length > 1
      ? { column: PRINT_MODE_COLUMN, label: PRINT_MODE_COLUMN, choices }
      : null;
  }

  function getPrintModePathEntry(candidates, selections, question) {
    if (question && question.column === PRINT_MODE_COLUMN) return null;
    const rows = getPrintModeCandidateRows(candidates, selections);
    const options = getPrintModeOptionsForRows(rows);
    if (selections[PRINT_MODE_COLUMN]) {
      const selected = options.find((option) => normalizeKey(option.label) === normalizeKey(selections[PRINT_MODE_COLUMN]));
      return selected ? { column: PRINT_MODE_COLUMN, value: selected.label, inferred: false } : null;
    }
    return options.length === 1
      ? { column: PRINT_MODE_COLUMN, value: options[0].label, inferred: true }
      : null;
  }

  function getPrintModeCandidateRows(candidates, selections) {
    const completeRows = candidates.filter((row) => row.isCompleteProduct);
    const productName = selections.Product || getSingleDistinctValue(completeRows, "Product");
    return productName
      ? completeRows.filter((row) => row.Product === productName)
      : completeRows;
  }

  function buildSelectedProduct(candidates, selections) {
    const completeRows = candidates.filter((row) => row.isCompleteProduct);
    if (!completeRows.length) return null;

    const productName = selections.Product || getDistinctValues(completeRows, "Product")[0];
    if (!productName) return null;

    const productRows = completeRows.filter((row) => row.Product === productName);
    if (!productRows.length) return null;

    return buildProductFromRows(productRows, productName, selections);
  }

  function buildProductFromRows(productRows, productName, selections) {
    if (!productRows.length || !productName) return null;

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

    const printModeOption = getPrintModeOptionForSelection(productRows, selections[PRINT_MODE_COLUMN]) ||
      getSinglePrintModeOption(productRows);
    const printSqmRate = printModeOption?.rate ??
      productRows.find((row) => Number.isFinite(row.printSqmRate))?.printSqmRate;
    const surfaceInfos = getProductSurfaceInfos(productRows);
    const surfaceDescription = surfaceInfos.length === 1 ? surfaceInfos[0].description : "";
    const surfaceLink = surfaceInfos.length === 1 ? surfaceInfos[0].link : "";
    const mountingSurfaces = getDistinctValues(productRows, MOUNTING_SURFACE_COLUMN);
    const longevities = getDistinctValues(productRows, LONGEVITY_COLUMN);
    const laminates = getSortedSelectorChoices(productRows, LAMINATE_COLUMN);
    const productSpecSheet = getFirstRowValueForColumns(productRows, PRODUCT_SPEC_SHEET_COLUMNS);
    const laminateSpecSheet = getFirstRowValueForColumns(productRows, LAMINATE_SPEC_SHEET_COLUMNS);

    return {
      name: productName.trim(),
      rolls: Array.from(rollsByWidth.values()).sort((a, b) => a.width - b.width),
      printSqmRate,
      printMode: printModeOption?.label || "",
      surfaceDescription,
      surfaceLink,
      surfaceInfos,
      mountingSurfaces,
      longevities,
      laminates,
      productSpecSheet,
      laminateSpecSheet,
      selectorRow: productRows[0],
      selectorSelections: { ...selections }
    };
  }

  function getFirstRowValueForColumns(rows, columns) {
    for (const row of rows) {
      for (const column of columns) {
        const value = String(getRowValueForColumn(row, column) || "").trim();
        if (value) return value;
      }
    }
    return "";
  }

  function getProductSurfaceInfos(productRows) {
    const seen = new Set();
    return productRows.map((row) => {
      const info = {
        surface: String(row[MOUNTING_SURFACE_COLUMN] || "").trim(),
        description: String(row[SURFACE_DESCRIPTION_COLUMN] || "").trim(),
        link: String(row[SURFACE_LINK_COLUMN] || "").trim()
      };
      const key = [info.surface, info.description, info.link].join("\u001f");
      if (seen.has(key)) return null;
      seen.add(key);
      return info;
    }).filter((info) => info && (info.surface || info.description || info.link));
  }

  function getDistinctValues(rows, column) {
    const values = Array.from(new Set(rows.map((row) => String(row[column] || "").trim()).filter(Boolean)));
    return isPerforationColumnName(column) ? values.sort(comparePerforationChoices) : values;
  }

  function getSortedSelectorChoices(rows, column) {
    const values = getDistinctValues(rows, column);
    if (column === "Product") return sortProductChoicesByCost(rows, values);
    if (isLaminateColumnName(column)) return sortLaminateChoicesByCost(rows, values);
    return values;
  }

  function sortProductChoicesByCost(rows, choices) {
    return sortChoicesByCost(choices, (choice) =>
      getMinimumRollCost(rows.filter((row) => row.Product === choice), "cost")
    );
  }

  function sortLaminateChoicesByCost(rows, choices) {
    return sortChoicesByCost(choices, (choice) =>
      getMinimumRollCost(rows.filter((row) => String(row[LAMINATE_COLUMN] || "").trim() === choice), "laminateCost")
    );
  }

  function sortChoicesByCost(choices, getCost) {
    return choices.slice().sort((a, b) =>
      compareNullableNumbers(getCost(a), getCost(b)) ||
      String(a).localeCompare(String(b))
    );
  }

  function getMinimumRollCost(rows, costKey) {
    const costs = rows.flatMap((row) => Array.isArray(row.rolls)
      ? row.rolls.map((roll) => cleanNumber(roll[costKey], NaN))
      : []);
    const finiteCosts = costs.filter((cost) => Number.isFinite(cost) && cost >= 0);
    return finiteCosts.length ? Math.min(...finiteCosts) : NaN;
  }

  function compareNullableNumbers(a, b) {
    const aFinite = Number.isFinite(a);
    const bFinite = Number.isFinite(b);
    if (aFinite && bFinite) return a - b;
    if (aFinite) return -1;
    if (bFinite) return 1;
    return 0;
  }

  function getSingleDistinctValue(rows, column) {
    const values = getDistinctValues(rows, column);
    return values.length === 1 ? values[0] : "";
  }

  function getPrintModeOptionsForRows(rows) {
    const config = state.pricingConfig || DEFAULT_PRICING_CONFIG;
    const printModes = config.printModes || {};
    const types = getPrintModeTypesForRows(rows);
    const options = [];
    types.forEach((type) => {
      (printModes[type] || []).forEach((option) => addPrintModeOption(options, option.label, option.rate));
    });
    return options;
  }

  function getPrintModeTypesForRows(rows) {
    if (!rows.length) return [];
    if (rows.some((row) => isClearPrintModeRow(row))) return ["clear"];
    if (rows.some((row) => isTrueFilterCell(getRowValueForColumn(row, "Translucent")))) return ["translucent"];
    return ["standard"];
  }

  function isClearPrintModeRow(row) {
    return isTrueFilterCell(getRowValueForColumn(row, "Clear")) ||
      isTrueFilterCell(getRowValueForColumn(row, "Optically Clear"));
  }

  function getPrintModeOptionForSelection(rows, value) {
    const key = normalizeKey(value);
    if (!key) return null;
    return getPrintModeOptionsForRows(rows).find((option) => normalizeKey(option.label) === key) || null;
  }

  function getSinglePrintModeOption(rows) {
    const options = getPrintModeOptionsForRows(rows);
    return options.length === 1 ? options[0] : null;
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
      if (!shouldShowSelectorColumn(column)) return;
      if (!state.selectorSelections[column]) return;
      if (isPrintModeColumnName(column)) {
        const rows = getCandidateSelectorRows(validated);
        if (getPrintModeOptionForSelection(rows, state.selectorSelections[column])) {
          validated[column] = state.selectorSelections[column];
        }
        return;
      }
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
    return [...state.selectorColumns, "Product", PRINT_MODE_COLUMN, ...state.postProductSelectorColumns];
  }

  function evaluateRoll(product, roll, elements, settings) {
    const printableWidth = getPrintableRollWidth(roll);
    const pricedRoll = { ...roll, printableWidth };
    const printDimensions = elements.map((element) => getPrintDimensions(element, settings));
    const maxUnrotatedPrintWidth = printDimensions.reduce((max, dims) => Math.max(max, dims.printWidth), 0);
    const unrotatedFitCount = printDimensions.filter((dims) => dims.printWidth <= printableWidth + 0.001).length;
    const unrotatedFitsAll = unrotatedFitCount === elements.length;
    const evenElementPlans = elements.map((element, index) =>
      chooseElementPlan(element, index, printableWidth, settings, "even")
    );
    const offsetElementPlans = elements.map((element, index) =>
      chooseElementPlan(element, index, printableWidth, settings, "right-offset")
    );
    const evenGroups = evenElementPlans.flatMap((plan) => plan.groups);
    const offsetGroups = offsetElementPlans.flatMap((plan) => plan.groups);
    const evenPack = packGroupsBestFit(evenGroups, printableWidth, "nested");
    const offsetPack = packGroupsBestFit(offsetGroups, printableWidth, "offset");
    const offsetSaves = offsetPack.lengthMm + 0.1 < evenPack.lengthMm;
    const offsetJoinsUsed = settings.useOffsetJoins === true && offsetSaves;
    const selectedPack = offsetJoinsUsed ? offsetPack : evenPack;
    const elementPlans = offsetJoinsUsed ? offsetElementPlans : evenElementPlans;
    const groups = offsetJoinsUsed ? offsetGroups : evenGroups;
    const joins = elementPlans.reduce((total, plan) => total + plan.joins, 0);
    const costs = calculateCosts(selectedPack, pricedRoll, elements, product.printSqmRate);

    return {
      productName: product.name,
      printSqmRate: product.printSqmRate,
      printMode: product.printMode,
      roll: pricedRoll,
      elementPlans,
      evenElementPlans,
      offsetElementPlans,
      groups,
      evenPack,
      offsetPack,
      offsetSaves,
      offsetJoinsUsed,
      selectedPack,
      joins,
      unrotatedFitsAll,
      unrotatedFitCount,
      maxUnrotatedPrintWidth,
      costs
    };
  }

  function getPrintableRollWidth(roll) {
    const config = state.pricingConfig || DEFAULT_PRICING_CONFIG;
    const edgeMargin = Math.max(0, cleanNumber(config.edgePrintMarginMm, 0));
    return Math.max(1, roll.width - edgeMargin * 2);
  }

  function compareRollOptions(a, b) {
    return (
      a.joins - b.joins ||
      a.costs.total - b.costs.total ||
      Number(b.unrotatedFitsAll) - Number(a.unrotatedFitsAll) ||
      b.unrotatedFitCount - a.unrotatedFitCount ||
      a.selectedPack.lengthMm - b.selectedPack.lengthMm ||
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
    const config = state.pricingConfig || DEFAULT_PRICING_CONFIG;
    const printLinearM = pack.lengthMm / 1000;
    const loadingLinearM = config.materialLoadingMm / 1000;
    const stockLinearM = printLinearM + loadingLinearM;
    const laminateLinearM = roll.laminateCost > 0 ? printLinearM + loadingLinearM : 0;
    const printableWidth = Math.max(1, cleanNumber(roll.printableWidth, roll.width));
    const stockAreaSqm = (roll.width / 1000) * stockLinearM;
    const printAreaSqm = (printableWidth / 1000) * printLinearM;
    const productStockCharge = roll.productCost * stockLinearM * config.stockMultiplier;
    const laminateCharge = roll.laminateCost * laminateLinearM * config.laminateMultiplier;
    const stockCharge = productStockCharge + laminateCharge;
    const printRate = Number.isFinite(printSqmRate) ? printSqmRate : config.printPerSqm;
    const printCharge = printAreaSqm * printRate;
    const trimCharge = elements.reduce((total, element) => {
      const perimeterM = (2 * (element.width + element.height)) / 1000;
      return total + perimeterM * element.quantity * config.trimPerLinearM;
    }, 0);
    const unitCharge = elements.reduce((total, element) => total + element.quantity * config.unitPrice, 0);
    const finishedAreaSqm = elements.reduce(
      (total, element) => total + element.quantity * (element.width * element.height) / 1000000,
      0
    );
    const total = config.setupFee + stockCharge + printCharge + trimCharge + unitCharge;
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
      setupFee: config.setupFee,
      finishedAreaSqm,
      total,
      rate
    };
  }

  function getEffectivePrintSqmRate(product) {
    const config = state.pricingConfig || DEFAULT_PRICING_CONFIG;
    return Number.isFinite(product?.printSqmRate) ? product.printSqmRate : config.printPerSqm;
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

  function parseConfigCsv(csv) {
    const rows = parseCsv(csv, ",").map((row) => row.map((cell) => String(cell || "").trim()));
    return parseConfigRows(rows);
  }

  function parseConfigRows(rows) {
    const config = {};
    rows.forEach((row) => {
      const key = normalizeConfigKey(row[0]);
      const value = cleanNumber(row[1], NaN);
      if (!key || !Number.isFinite(value)) return;
      config[key] = normalizeConfigValue(key, value, row[2]);
    });

    const printModes = parsePrintModeConfigRows(rows);
    if (printModes.clear.length || printModes.translucent.length || printModes.standard.length) {
      config.printModes = printModes;
    }

    return config;
  }

  function parsePrintModeConfigRows(rows) {
    const printModes = {
      clear: [],
      translucent: [],
      standard: []
    };

    rows.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        const type = getPrintModeConfigType(cell);
        if (!type) return;
        const rateColumnIndex = getPrintModeRateColumnIndex(row, columnIndex);
        rows.slice(rowIndex + 1).forEach((modeRow) => {
          const label = String(modeRow[columnIndex] || "").trim();
          const rate = cleanNumber(modeRow[rateColumnIndex], NaN);
          if (!label || !Number.isFinite(rate)) return;
          addPrintModeOption(printModes[type], label, rate);
        });
      });
    });

    return printModes;
  }

  function getPrintModeConfigType(value) {
    const key = normalizeKey(value);
    if (!key.includes("printmode")) return "";
    if (key.includes("translucent")) return "translucent";
    if (key.includes("clear")) return "clear";
    if (key.includes("standard")) return "standard";
    return "";
  }

  function getPrintModeRateColumnIndex(row, printModeColumnIndex) {
    const nextHeader = normalizeKey(row[printModeColumnIndex + 1]);
    return nextHeader.includes("sqmrate") || nextHeader === "rate"
      ? printModeColumnIndex + 1
      : printModeColumnIndex + 1;
  }

  function addPrintModeOption(options, label, rate) {
    const key = normalizeKey(label);
    if (!key || options.some((option) => normalizeKey(option.label) === key)) return;
    options.push({ label, rate });
  }

  function normalizeConfigValue(key, value, unit) {
    if (key === "materialLoadingMm" && isMetresUnit(unit)) {
      return value * 1000;
    }
    return value;
  }

  function normalizeConfigKey(label) {
    const key = normalizeKey(label);
    const aliases = {
      materialloading: "materialLoadingMm",
      materialloadingmm: "materialLoadingMm",
      materialleaderlength: "materialLoadingMm",
      loading: "materialLoadingMm",
      loadinglength: "materialLoadingMm",
      loadingmm: "materialLoadingMm",
      leader: "materialLoadingMm",
      leaderlength: "materialLoadingMm",
      edgeprintmargin: "edgePrintMarginMm",
      edgeprintmarginmm: "edgePrintMarginMm",
      printmargin: "edgePrintMarginMm",
      printmarginmm: "edgePrintMarginMm",
      edgemargin: "edgePrintMarginMm",
      edgemarginmm: "edgePrintMarginMm",
      setup: "setupFee",
      setupfee: "setupFee",
      trimrate: "trimPerLinearM",
      trimcost: "trimPerLinearM",
      trimperlinearm: "trimPerLinearM",
      materialmarkup: "stockMultiplier",
      materialmultiplier: "stockMultiplier",
      productmarkup: "stockMultiplier",
      productmultiplier: "stockMultiplier",
      stockmarkup: "stockMultiplier",
      stockmultiplier: "stockMultiplier",
      laminatemarkup: "laminateMultiplier",
      laminatemultiplier: "laminateMultiplier",
      lammarkup: "laminateMultiplier",
      lammultiplier: "laminateMultiplier",
      printsqmrate: "printPerSqm",
      printpersqm: "printPerSqm",
      defaultprintrate: "printPerSqm",
      defaultprintsqmrate: "printPerSqm",
      unitcost: "unitPrice",
      unitprice: "unitPrice"
    };
    return aliases[key] || "";
  }

  function isMetresUnit(value) {
    const key = normalizeKey(value);
    return key === "m" || key === "metre" || key === "metres" || key === "meter" || key === "meters";
  }

  function parseSelectorRows(rows) {
    if (!rows.length) return { rows: [], selectorColumns: [] };
    const headers = rows[0].map((header) => String(header || "").trim());
    const metadataHeaders = getSurfaceMetadataHeaderRow(rows);
    const dataRows = metadataHeaders.length ? rows.slice(2) : rows.slice(1);
    const productIndex = findHeaderIndex(headers, "Product");
    const mountingSurfaceMatrixColumns = getMountingSurfaceMatrixColumns(dataRows, headers, metadataHeaders, productIndex);
    const hasMountingSurfaceMatrix = mountingSurfaceMatrixColumns.length > 0;
    const mountingSurfaceMatrixHeaderSet = new Set(mountingSurfaceMatrixColumns.map((column) => column.header));
    let baseSelectorColumns = headers
      .slice(0, productIndex >= 0 ? productIndex : headers.length)
      .filter((header) => !isBrandColumnName(header))
      .filter((header) => !isClassColumnName(header))
      .filter((header) => !isLimitFilterColumnName(header))
      .filter((header) => !isLegacySurfaceSideColumn(header))
      .filter((header) => !isPrintModeColumnName(header))
      .filter((header) => !isPerforationColumnName(header))
      .filter((header) => !isSpecSheetColumnName(header))
      .filter((header) => !isWizardExcludedColumnName(header))
      .filter((header) => !isSurfaceMetadataColumnName(header))
      .filter((header) => !mountingSurfaceMatrixHeaderSet.has(header))
      .filter((header) => !hasMountingSurfaceMatrix || !isMatrixReplacedSelectorColumn(header))
      .filter(Boolean);
    const postProductSelectorColumns = productIndex >= 0
      ? headers.slice(productIndex + 1)
        .filter((header) => !isBrandColumnName(header))
        .filter((header) => !isClassColumnName(header))
        .filter((header) => !isLimitFilterColumnName(header))
        .filter((header) => !isLegacySurfaceSideColumn(header))
        .filter((header) => !isPrintModeColumnName(header))
        .filter((header) => !isPerforationColumnName(header))
        .filter((header) => !isSpecSheetColumnName(header))
        .filter((header) => !isWizardExcludedColumnName(header))
        .filter((header) => !isSurfaceMetadataColumnName(header))
        .filter((header) => header && isPostProductSelectorColumn(header))
        .filter((header) => !hasMountingSurfaceMatrix || !isMatrixReplacedSelectorColumn(header))
      : [];
    const perforationColumn = baseSelectorColumns.find(isPerforationColumnName);

    const selectorRows = dataRows.flatMap((row) => {
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

  function getSurfaceMetadataHeaderRow(rows) {
    const candidate = rows[1];
    if (!candidate || !candidate.some((cell) => isSurfaceMetadataColumnName(cell))) return [];
    return candidate.map((header) => String(header || "").trim());
  }

  function getMountingSurfaceMatrixColumns(rows, headers, metadataHeaders, productIndex) {
    const startIndex = getMountingSurfaceMatrixStartIndex(rows, headers);
    const boundary = getMountingSurfaceMatrixBoundary(headers, productIndex, startIndex);

    return headers.slice(startIndex, boundary)
      .map((header, offset) => {
        const index = startIndex + offset;
        const descriptionIndex = getSurfaceMetadataIndex(headers, metadataHeaders, index, "description");
        const linkIndex = getSurfaceMetadataIndex(headers, metadataHeaders, index, "link");
        return { header, index, descriptionIndex, linkIndex };
      })
      .filter((column) => column.header)
      .filter((column) => !isSurfaceMetadataColumnName(column.header));
  }

  function getMountingSurfaceMatrixStartIndex(rows, headers) {
    const firstHeader = headers[0];
    if (!isMatrixReplacedSelectorColumn(firstHeader)) return 0;
    if (headers[1] && !isMatrixBoundarySelectorColumn(headers[1])) return 1;
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
      return [{ surface: "", description: "", link: "" }];
    }

    return mountingSurfaceMatrixColumns
      .filter((column) => isTrueCell(row[column.index]))
      .map((column) => ({
        surface: column.header,
        description: getSurfaceMetadataValue(row, column.descriptionIndex),
        link: getSurfaceMetadataValue(row, column.linkIndex)
      }));
  }

  function getSurfaceMetadataIndex(headers, metadataHeaders, surfaceIndex, type) {
    const isExpectedHeader = type === "description" ? isSurfaceDescriptionColumnName : isSurfaceLinkColumnName;
    const rightOffset = type === "description" ? 1 : 2;
    const leftOffset = type === "description" ? -2 : -1;
    const rightIndex = surfaceIndex + rightOffset;
    const leftIndex = surfaceIndex + leftOffset;
    if (isExpectedHeader(headers[rightIndex])) return rightIndex;
    if (isExpectedHeader(metadataHeaders[rightIndex])) return rightIndex;
    if (isExpectedHeader(headers[leftIndex])) return leftIndex;
    if (isExpectedHeader(metadataHeaders[leftIndex])) return leftIndex;
    return -1;
  }

  function getSurfaceMetadataValue(row, index) {
    if (index < 0) return "";
    return String(row[index] ?? "").trim();
  }

  function prepareSelectorRow(sourceData, mountingSurfaceInfo, hasMountingSurfaceMatrix, perforationColumn) {
    const data = { ...sourceData };
    const surface = typeof mountingSurfaceInfo === "string"
      ? mountingSurfaceInfo
      : mountingSurfaceInfo.surface;
    const description = typeof mountingSurfaceInfo === "object" && mountingSurfaceInfo
      ? mountingSurfaceInfo.description
      : "";
    const link = typeof mountingSurfaceInfo === "object" && mountingSurfaceInfo
      ? mountingSurfaceInfo.link
      : "";
    if (hasMountingSurfaceMatrix) {
      data[MOUNTING_SURFACE_COLUMN] = surface;
      data[LEGACY_SURFACE_COLUMN] = surface;
      data[SURFACE_DESCRIPTION_COLUMN] = description;
      data[SURFACE_LINK_COLUMN] = link;
    } else {
      data[SURFACE_DESCRIPTION_COLUMN] = getGeneralSurfaceDescription(sourceData);
      data[SURFACE_LINK_COLUMN] = getGeneralSurfaceLink(sourceData);
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
    data.isCompleteProduct = Boolean(data.Product && data.rolls.length);
    return data;
  }

  function isTrueCell(value) {
    return String(value ?? "").trim().toLowerCase() === "true";
  }

  function isTrueFilterCell(value) {
    const key = normalizeKey(value);
    return key === "true" || key === "yes" || key === "y" || key === "1" || key === "x";
  }

  function isMatrixReplacedSelectorColumn(header) {
    const key = normalizeKey(header);
    return key === normalizeKey(LEGACY_SURFACE_COLUMN) || key === normalizeKey(MOUNTING_SURFACE_COLUMN);
  }

  function isMatrixBoundarySelectorColumn(header) {
    const key = normalizeKey(header);
    return key === normalizeKey(LEGACY_SURFACE_COLUMN) ||
      key === normalizeKey(MOUNTING_SURFACE_COLUMN) ||
      isLegacySurfaceSideColumn(header) ||
      key === "type" ||
      isPrintModeColumnName(header) ||
      key === "longevity" ||
      key === "laminate" ||
      isBrandColumnName(header) ||
      isLimitFilterColumnName(header) ||
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
      !isLimitFilterColumnName(header) &&
      !isLegacySurfaceSideColumn(header) &&
      !isPrintModeColumnName(header) &&
      !isPerforationColumnName(header) &&
      !isSpecSheetColumnName(header) &&
      !isIgnoredSelectorDataColumn(header) &&
      !isPrintRateColumnName(header);
  }

  function isBrandColumnName(header) {
    return normalizeKey(header) === normalizeKey(BRAND_COLUMN);
  }

  function isClassColumnName(header) {
    const key = normalizeKey(header);
    return CLASS_COLUMN_CANDIDATES.some((column) => key === normalizeKey(column));
  }

  function isLimitFilterColumnName(header) {
    const key = normalizeKey(header);
    return LIMIT_FILTER_OPTIONS.some((option) =>
      option.columns.some((column) => key === normalizeKey(column))
    );
  }

  function isLegacySurfaceSideColumn(header) {
    const key = normalizeKey(header);
    return key === "internalexternal" || key === "firstsurfacesecondsurface";
  }

  function isWizardExcludedColumnName(header) {
    const key = normalizeKey(header);
    return key === normalizeKey(LEGACY_SURFACE_COLUMN) ||
      key === normalizeKey(MOUNTING_SURFACE_COLUMN) ||
      key === normalizeKey(TYPE_COLUMN) ||
      key === normalizeKey(LONGEVITY_COLUMN);
  }

  function isSurfaceMetadataColumnName(header) {
    return isSurfaceDescriptionColumnName(header) || isSurfaceLinkColumnName(header);
  }

  function isSpecSheetColumnName(header) {
    const key = normalizeKey(header);
    return PRODUCT_SPEC_SHEET_COLUMNS.concat(LAMINATE_SPEC_SHEET_COLUMNS)
      .some((column) => key === normalizeKey(column));
  }

  function isPublishedColumnName(header) {
    const key = normalizeKey(header);
    return PUBLISHED_COLUMN_CANDIDATES.some((column) => key === normalizeKey(column));
  }

  function isSurfaceDescriptionColumnName(header) {
    const key = normalizeKey(header);
    return key === "d" || key === "description" || key === "desc" || key === "surfacedescription";
  }

  function isSurfaceLinkColumnName(header) {
    const key = normalizeKey(header);
    return key === "l" || key === "link" || key === "url" || key === "surfacelink";
  }

  function getGeneralSurfaceDescription(row) {
    return String(row[SURFACE_DESCRIPTION_COLUMN] || row.Description || row.Desc || row.D || "").trim();
  }

  function getGeneralSurfaceLink(row) {
    return String(row[SURFACE_LINK_COLUMN] || row.Link || row.URL || row.L || "").trim();
  }

  function isIgnoredSelectorDataColumn(header) {
    const key = normalizeKey(header);
    return key === "updated" || key === "notes" || key === "note" || isPublishedColumnName(header);
  }

  function buildSelectorColumns(baseSelectorColumns, selectorRows, perforationColumn) {
    return baseSelectorColumns.filter((column) => !isPerforationColumnName(column));
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

  function isPrintModeColumnName(column) {
    return normalizeKey(column) === normalizeKey(PRINT_MODE_COLUMN);
  }

  function isLaminateColumnName(column) {
    return normalizeKey(column) === normalizeKey(LAMINATE_COLUMN);
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
    if (ui.rollChoice) ui.rollChoice.textContent = getRollChoiceLabel(roll);
    ui.metricLinear.textContent = `${formatNumber(best.costs.linearM, 2)} m`;
    ui.metricJoins.textContent = formatInteger(best.joins);
    ui.metricPrice.textContent = formatMoney(best.costs.total);
    ui.metricRate.textContent = `${formatMoney(best.costs.rate)} / sqm`;
    if (ui.printRateConstant) {
      ui.printRateConstant.textContent = `${formatMoney(best.costs.printRate)} / sqm`;
    }
    const widestRoll = options.reduce((max, option) => Math.max(max, option.roll.printableWidth || option.roll.width), 0);
    const fitWarning = getStockFitWarning(best.maxUnrotatedPrintWidth, widestRoll);
    ui.costBreakdown.innerHTML = "";
    renderArtworkFitWarning(fitWarning);
    setImpositionActionButtonsDisabled(false);

    renderOffsetPrompt(best);
    renderOptions(options, best);
    renderPricing(best, elements);
    renderImposition(best);
    scheduleRecommendationPanelSpaceUpdate();
  }

  function getStockFitWarning(requiredWidth, widestRoll) {
    if (!Number.isFinite(requiredWidth) || !Number.isFinite(widestRoll) || requiredWidth <= widestRoll + 0.001) {
      return "";
    }

    return `Widest entered print width is ${formatInteger(requiredWidth)} mm, but this product only lists printable stock up to ${formatInteger(widestRoll)} mm. The job will be panelled.`;
  }

  function renderArtworkFitWarning(message) {
    if (!ui.artworkFitWarning) return;
    const text = String(message || "").trim();
    ui.artworkFitWarning.hidden = !text;
    ui.artworkFitWarning.textContent = text;
  }

  function getRollChoiceLabel(roll) {
    if (!roll || !Number.isFinite(roll.width)) return "Select product";
    if (Number.isFinite(roll.printableWidth) && Math.abs(roll.printableWidth - roll.width) > 0.001) {
      return `${formatInteger(roll.width)} mm stock (${formatInteger(roll.printableWidth)} mm printable)`;
    }
    return `${formatInteger(roll.width)} mm stock`;
  }

  function renderEmptyResults() {
    if (ui.rollChoice) ui.rollChoice.textContent = "No job";
    ui.metricLinear.textContent = "0.00 m";
    ui.metricJoins.textContent = "0";
    ui.metricPrice.textContent = "$0.00";
    ui.metricRate.textContent = "$0.00 / sqm";
    if (ui.printRateConstant) {
      ui.printRateConstant.textContent = state.selectedProduct ? `${formatMoney(getEffectivePrintSqmRate(state.selectedProduct))} / sqm` : "Select product";
    }
    ui.costBreakdown.innerHTML = "";
    renderArtworkFitWarning("");
    ui.offsetPrompt.classList.add("hidden");
    ui.optionsBody.innerHTML = "";
    ui.pricingBody.innerHTML = "";
    state.currentCartUrls = [];
    state.currentCartLines = [];
    setAddAllCartButtonsDisabled(true);
    ui.optionCount.textContent = "";
    ui.priceSummary.textContent = "";
    ui.impositionSummary.textContent = "";
    ui.impositionPreview.innerHTML = `<div class="empty-state">Enter job elements to calculate the roll.</div>`;
    setImpositionActionButtonsDisabled(true);
    scheduleRecommendationPanelSpaceUpdate();
  }

  function renderProductRequired(selectorState) {
    if (ui.rollChoice) ui.rollChoice.textContent = "Select product";
    ui.metricLinear.textContent = "0.00 m";
    ui.metricJoins.textContent = "0";
    ui.metricPrice.textContent = "$0.00";
    ui.metricRate.textContent = "$0.00 / sqm";
    if (ui.printRateConstant) {
      ui.printRateConstant.textContent = "Select product";
    }
    ui.costBreakdown.innerHTML = "";
    renderArtworkFitWarning("");
    ui.offsetPrompt.classList.add("hidden");
    ui.optionsBody.innerHTML = "";
    ui.pricingBody.innerHTML = "";
    state.currentCartUrls = [];
    state.currentCartLines = [];
    setAddAllCartButtonsDisabled(true);
    ui.optionCount.textContent = "";
    ui.priceSummary.textContent = "";
    ui.impositionSummary.textContent = "";
    ui.impositionPreview.innerHTML = `<div class="empty-state">${escapeHtml(getSelectorEmptyMessage(selectorState))}</div>`;
    setImpositionActionButtonsDisabled(true);
    scheduleRecommendationPanelSpaceUpdate();
  }

  function renderInputErrors(errors) {
    ui.inputErrors.innerHTML = errors.map((error) => `<div>${escapeHtml(error)}</div>`).join("");
  }

  function renderSelectorSurvey(selectorState) {
    const path = selectorState.pathEntries
      .filter((entry) => entry.value)
      .map((entry) => {
        const column = getDisplaySelectorColumn(entry.column);
        const value = getDisplaySelectorValue(entry.column, entry.value);
        return `<span class="survey-pill${entry.inferred ? " inferred" : ""}">${escapeHtml(column)}: ${escapeHtml(value)}</span>`;
      })
      .join("");

    const nestedProductQuestion = getNestedProductQuestion(selectorState);
    const questionMarkup = selectorState.question && !nestedProductQuestion
      ? renderSelectorQuestion(selectorState.question)
      : "";

    const product = selectorState.product || selectorState.previewProduct;
    const productBrowseMarkup = renderProductBrowseChoices(selectorState, nestedProductQuestion);
    const productMarkup = product ? `
      <div class="selected-product">
        <strong>${escapeHtml(product.name)}</strong>
        <div class="muted">${escapeHtml(product.rolls.map(formatRollLabel).join(" | "))}</div>
        ${renderProductLaminate(product)}
        ${renderProductPrintMode(product)}
        ${renderProductLongevity(product)}
        ${renderProductMountingSurfaces(product)}
        ${renderProductSpecSheetLinks(product)}
        ${renderProductSurfaceInfo(product)}
      </div>
    ` : (!selectorState.question ? renderSelectorEmptyState(selectorState) : "");

    const resetMarkup = Object.keys(selectorState.selections).length ? `
      <div class="survey-actions">
        <button class="ghost-button compact" type="button" data-selector-back="true">Back</button>
      </div>
    ` : "";

    ui.selectorSurvey.innerHTML = `
      ${path ? `<div class="survey-path">${path}</div>` : ""}
      ${questionMarkup}
      ${productBrowseMarkup}
      ${productMarkup}
      ${resetMarkup}
    `;
    hydrateOpenGraphPreviews();
  }

  function renderSelectorEmptyState(selectorState) {
    const showClearFilters = selectorState.hasRows &&
      !selectorState.candidates.length &&
      hasActiveSelectorFilters();
    return `
      <div class="survey-empty">
        <span>${escapeHtml(getSelectorEmptyMessage(selectorState))}</span>
        ${showClearFilters ? `<button class="ghost-button compact" type="button" data-selector-clear-filters="true">Clear filters</button>` : ""}
      </div>
    `;
  }

  function renderSelectorQuestion(question) {
    return `
      <div class="survey-question">
        <strong>${escapeHtml(getDisplaySelectorColumn(question.label))}</strong>
        <div class="choice-grid">
          ${question.choices.map((choice) => `
            <button class="choice-button" type="button" data-selector-column="${escapeHtml(question.column)}" data-selector-value="${escapeHtml(choice)}">${escapeHtml(getDisplaySelectorValue(question.column, choice))}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function getNestedProductQuestion(selectorState) {
    const question = selectorState.question;
    const selections = selectorState.selections || {};
    if (state.productSearchSelection) return null;
    if (!question || !selections.Product || question.column === "Product") return null;

    const order = getSelectorSelectionOrder();
    const productIndex = order.indexOf("Product");
    const questionIndex = order.indexOf(question.column);
    if (productIndex < 0 || questionIndex <= productIndex) return null;

    return getBrowseProductChoices(selections).length > 1 ? question : null;
  }

  function renderProductBrowseChoices(selectorState, nestedQuestion = null) {
    if (state.productSearchSelection) return "";
    const selectedProduct = String(selectorState.selections?.Product || selectorState.product?.name || "").trim();
    if (!selectedProduct) return "";

    const choices = getBrowseProductChoices(selectorState.selections || {});
    if (choices.length <= 1) return "";

    const selectedKey = normalizeKey(selectedProduct);
    return `
      <div class="survey-question product-browse">
        <strong>Product options</strong>
        <div class="choice-grid">
          ${choices.map((choice) => {
            const selected = normalizeKey(choice) === selectedKey;
            return `
              <div class="product-browse-item${selected ? " selected" : ""}">
                <button class="choice-button${selected ? " selected" : ""}" type="button" data-selector-column="Product" data-selector-value="${escapeHtml(choice)}" data-selector-preserve-after="true" aria-pressed="${selected ? "true" : "false"}">${escapeHtml(getDisplaySelectorValue("Product", choice))}</button>
                ${selected && nestedQuestion ? renderNestedProductQuestion(nestedQuestion) : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderNestedProductQuestion(question) {
    return `
      <div class="product-browse-nested">
        <strong>${escapeHtml(getDisplaySelectorColumn(question.label))}</strong>
        <div class="choice-grid nested-choice-grid">
          ${question.choices.map((choice) => `
            <button class="choice-button" type="button" data-selector-column="${escapeHtml(question.column)}" data-selector-value="${escapeHtml(choice)}">${escapeHtml(getDisplaySelectorValue(question.column, choice))}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function getBrowseProductChoices(selections) {
    const baseSelections = getSelectionsBeforeColumn(selections, "Product");
    return getSortedSelectorChoices(
      getCandidateSelectorRows(baseSelections).filter((row) => row.isCompleteProduct),
      "Product"
    );
  }

  function getSelectionsBeforeColumn(selections, column) {
    const order = getSelectorSelectionOrder();
    const index = order.indexOf(column);
    if (index < 0) return { ...selections };
    return order.slice(0, index).reduce((result, earlierColumn) => {
      if (selections[earlierColumn]) result[earlierColumn] = selections[earlierColumn];
      return result;
    }, {});
  }

  function renderProductMountingSurfaces(product) {
    const surfaces = Array.isArray(product.mountingSurfaces) ? product.mountingSurfaces : [];
    if (!surfaces.length) return "";
    const label = surfaces.length === 1 ? "Mounting surface" : "Mounting surfaces";
    const surfaceLabels = surfaces.map((surface) => getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, surface));
    return `<div class="muted">${escapeHtml(`${label}: ${surfaceLabels.join(", ")}`)}</div>`;
  }

  function renderProductPrintMode(product) {
    const printMode = String(product.printMode || "").trim();
    return printMode ? `<div class="muted">${escapeHtml(`Print mode: ${printMode}`)}</div>` : "";
  }

  function renderProductLaminate(product) {
    const laminates = Array.isArray(product.laminates)
      ? product.laminates.filter(Boolean)
      : [];
    if (!laminates.length) return "";
    const label = laminates.length === 1 ? "Laminate" : "Laminates";
    return `<div class="muted">${escapeHtml(`${label}: ${laminates.join(", ")}`)}</div>`;
  }

  function renderProductSpecSheetLinks(product) {
    const links = [
      { label: "Product Data", url: normalizePreviewUrl(product.productSpecSheet) },
      { label: "Laminate Data", url: normalizePreviewUrl(product.laminateSpecSheet) }
    ].filter((link) => link.url);

    if (!links.length) return "";

    return `
      <div class="product-spec-links">
        ${links.map((link) => `
          <a class="product-spec-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(link.label)}" title="${escapeHtml(link.label)}">
            ${renderPdfIcon()}
            <span class="product-spec-label">${escapeHtml(link.label)}</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderPdfIcon() {
    return `<img class="pdf-icon" src="${escapeHtml(PDF_ICON_SRC)}" alt="" aria-hidden="true" loading="lazy">`;
  }

  function renderProductLongevity(product) {
    const longevities = Array.isArray(product.longevities)
      ? product.longevities.filter(Boolean)
      : [];
    if (!longevities.length) return "";
    const label = longevities.length === 1 ? "Longevity" : "Longevities";
    return `<div class="muted">${escapeHtml(`${label}: ${longevities.join(", ")}`)}</div>`;
  }

  function renderProductSurfaceInfo(product) {
    const surfaceInfos = Array.isArray(product.surfaceInfos)
      ? product.surfaceInfos.filter((info) => info.description || normalizePreviewUrl(info.link))
      : [];
    if (surfaceInfos.length && (surfaceInfos.length > 1 || (product.mountingSurfaces || []).length > 1)) {
      return `
        <div class="product-surface-info">
          ${surfaceInfos.map(renderProductSurfaceInfoItem).join("")}
        </div>
      `;
    }

    const description = String(product.surfaceDescription || "").trim();
    const link = normalizePreviewUrl(product.surfaceLink);
    if (!description && !link) return "";

    return `
      <div class="product-surface-info">
        ${description ? `<div class="product-description">${formatDescription(description)}</div>` : ""}
        ${link ? renderOpenGraphPreviewShell(link) : ""}
      </div>
    `;
  }

  function renderProductSurfaceInfoItem(info) {
    const surface = String(info.surface || "").trim();
    const surfaceLabel = getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, surface);
    const description = String(info.description || "").trim();
    const link = normalizePreviewUrl(info.link);

    return `
      <div class="product-surface-detail">
        ${surfaceLabel ? `<div class="product-surface-label">${escapeHtml(surfaceLabel)}</div>` : ""}
        ${description ? `<div class="product-description">${formatDescription(description)}</div>` : ""}
        ${link ? renderOpenGraphPreviewShell(link) : ""}
      </div>
    `;
  }

  function renderOpenGraphPreviewShell(url) {
    if (isDirectImageUrl(url)) return renderImagePreviewShell(url);

    return `
      <a class="og-preview" href="${escapeHtml(url)}" target="_blank" rel="noopener" data-og-preview-url="${escapeHtml(url)}">
        ${renderOpenGraphPreviewContent(buildFallbackLinkPreview(url))}
      </a>
    `;
  }

  function renderImagePreviewShell(url) {
    return `
      <a class="og-preview image-preview" href="${escapeHtml(url)}" target="_blank" rel="noopener">
        ${renderImagePreviewContent(url)}
      </a>
    `;
  }

  function renderImagePreviewContent(url) {
    return `
      <span class="image-preview-media">
        <img src="${escapeHtml(url)}" alt="" loading="lazy">
      </span>
    `;
  }

  function hydrateOpenGraphPreviews() {
    const cards = Array.from(ui.selectorSurvey.querySelectorAll("[data-og-preview-url]"));
    cards.forEach((card) => {
      const url = card.dataset.ogPreviewUrl;
      hydrateLinkPreview(card, url);
    });
  }

  async function hydrateLinkPreview(card, url) {
    if (await canLoadImageUrl(url)) {
      if (!card.isConnected || card.dataset.ogPreviewUrl !== url) return;
      card.classList.add("image-preview");
      delete card.dataset.ogPreviewUrl;
      card.innerHTML = renderImagePreviewContent(url);
      return;
    }

    const preview = await fetchOpenGraphPreview(url);
    if (!preview || !card.isConnected || card.dataset.ogPreviewUrl !== url) return;
    card.innerHTML = renderOpenGraphPreviewContent(preview);
  }

  function canLoadImageUrl(url) {
    return new Promise((resolve) => {
      const image = new Image();
      const timeout = window.setTimeout(() => settle(false), 4500);

      function settle(value) {
        window.clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        resolve(value);
      }

      image.onload = () => settle(true);
      image.onerror = () => settle(false);
      image.src = url;
    });
  }

  async function fetchOpenGraphPreview(url) {
    try {
      const response = await fetch(`/.netlify/functions/open-graph?url=${encodeURIComponent(url)}`, {
        cache: "force-cache"
      });
      if (!response.ok) return null;
      const preview = await response.json();
      return normalizeOpenGraphPreview(preview, url);
    } catch (error) {
      return null;
    }
  }

  function normalizeOpenGraphPreview(preview, fallbackUrl) {
    if (!preview || typeof preview !== "object") return null;
    const fallback = buildFallbackLinkPreview(fallbackUrl);
    const url = normalizePreviewUrl(preview.url) || fallback.url;
    return {
      url,
      title: String(preview.title || fallback.title || "").trim(),
      description: String(preview.description || fallback.description || "").trim(),
      siteName: String(preview.siteName || fallback.siteName || "").trim(),
      image: normalizePreviewUrl(preview.image) || fallback.image
    };
  }

  function renderOpenGraphPreviewContent(preview) {
    const image = preview.image
      ? `<span class="og-preview-media"><img src="${escapeHtml(preview.image)}" alt=""></span>`
      : `<span class="og-preview-media fallback">${escapeHtml(getHostInitial(preview.siteName || preview.url))}</span>`;
    const description = preview.description
      ? `<span class="og-preview-description">${escapeHtml(preview.description)}</span>`
      : "";

    return `
      ${image}
      <span class="og-preview-body">
        <span class="og-preview-site">${escapeHtml(preview.siteName || getReadableHost(preview.url))}</span>
        <span class="og-preview-title">${escapeHtml(preview.title || preview.url)}</span>
        ${description}
      </span>
    `;
  }

  function buildFallbackLinkPreview(url) {
    const parsed = safeParseUrl(url);
    const youtubeId = parsed ? getYouTubeVideoId(parsed) : "";
    const title = youtubeId ? "YouTube video" : getReadableUrlTitle(parsed);
    return {
      url,
      title,
      description: parsed ? getReadableHost(parsed.href) : url,
      siteName: youtubeId ? "YouTube" : getReadableHost(parsed ? parsed.href : url),
      image: youtubeId ? `https://img.youtube.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg` : ""
    };
  }

  function normalizePreviewUrl(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`;
    const parsed = safeParseUrl(withProtocol);
    if (!parsed || !/^https?:$/.test(parsed.protocol)) return "";
    return parsed.href;
  }

  function isDirectImageUrl(value) {
    const parsed = safeParseUrl(value);
    if (!parsed || !/^https?:$/.test(parsed.protocol)) return false;
    return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(parsed.pathname);
  }

  function safeParseUrl(value) {
    try {
      return new URL(value, window.location.href);
    } catch (error) {
      return null;
    }
  }

  function getYouTubeVideoId(url) {
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || "";
    }
    return "";
  }

  function getReadableUrlTitle(url) {
    if (!url) return "Linked resource";
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] || url.hostname;
    return decodeURIComponent(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Linked resource";
  }

  function getReadableHost(url) {
    const parsed = typeof url === "string" ? safeParseUrl(url) : url;
    return parsed ? parsed.hostname.replace(/^www\./i, "") : "";
  }

  function getHostInitial(value) {
    return String(value || "Link").trim().charAt(0).toUpperCase() || "L";
  }

  function formatDescription(value) {
    return escapeHtml(value).replace(/\r?\n/g, "<br>");
  }

  function getSelectorEmptyMessage(selectorState) {
    if (!selectorState.hasRows) return "No selector data loaded.";
    if (!selectorState.candidates.length) return "No results found for this selection";
    if (selectorState.question) return "Answer the product survey to select stock.";
    return "No complete product data is available for this selection yet.";
  }

  function hasActiveSelectorFilters() {
    return state.mountingSurfaceFilter !== MOUNTING_SURFACE_ALL ||
      state.brandFilter !== "all" ||
      state.classFilter !== "all" ||
      state.limitFilters.size > 0 ||
      Boolean(state.productSearchQuery.trim());
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
    if (!meaningful || state.offsetPromptDismissed) {
      hideOffsetPrompt();
      return;
    }

    const savingM = savingMm / 1000;
    const active = state.useOffsetJoins === true ? "Offset joins selected." :
      state.useOffsetJoins === false ? "Even joins selected." :
      "Even joins are selected until you choose.";

    ui.offsetPrompt.classList.remove("hidden");
    ui.offsetPrompt.innerHTML = `
      <div class="offset-prompt-header">
        <p>Do you want to save stock by offsetting the panel joins?</p>
        <button class="icon-button offset-prompt-close" type="button" data-offset-prompt-close aria-label="Hide offset join prompt" title="Hide offset join prompt">X</button>
      </div>
      <div class="muted">${escapeHtml(active)} Potential saving: ${formatNumber(savingM, 2)} linear metres.</div>
      <div class="prompt-actions">
        <button class="offset-choice-button compact${state.useOffsetJoins === true ? " selected" : ""}" type="button" data-offset-choice="yes" aria-pressed="${state.useOffsetJoins === true ? "true" : "false"}">Use offset joins</button>
        <button class="offset-choice-button compact${state.useOffsetJoins === true ? "" : " selected"}" type="button" data-offset-choice="no" aria-pressed="${state.useOffsetJoins === true ? "false" : "true"}">Keep even joins</button>
      </div>
    `;
    syncOffsetChoiceButtons();
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
          <td>${escapeHtml(formatRollWidthLabel(option.roll))}</td>
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
    const cartLines = [];
    ui.pricingBody.innerHTML = elements.map((element, index) => {
      const plan = best.elementPlans.find((item) => item.elementIndex === index);
      const areaSqm = (element.width * element.height) / 1000000;
      const lineArea = areaSqm * element.quantity;
      const lineTotal = lineArea * best.costs.rate;
      const unit = element.quantity > 0 ? lineTotal / element.quantity : 0;
      const printSize = `${formatNumber(plan.printWidth, 0)} x ${formatNumber(plan.printHeight, 0)} mm${plan.rotated ? " rotated" : ""}`;
      const dropsText = plan.drops > 1 ? `${formatInteger(plan.drops)} vertical` : formatInteger(plan.drops);
      const cartUrl = buildCartUrl(best.roll, element, unit, best.printMode, best.offsetJoinsUsed);
      if (cartUrl) {
        cartUrls.push(cartUrl);
        cartLines.push({
          shortname: getCartShortname(element.shortname, best.printMode, best.offsetJoinsUsed),
          enteredShortname: element.shortname,
          quantity: element.quantity,
          width: element.width,
          height: element.height,
          printSize,
          drops: dropsText,
          areaSqm: lineArea,
          unit,
          lineTotal,
          qcode: best.roll.qcode,
          cartUrl
        });
      }
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
    state.currentCartLines = cartLines;
    setAddAllCartButtonsDisabled(!cartUrls.length);
  }

  function buildCartUrl(roll, element, unitPrice, printMode = "", offsetJoinsUsed = false) {
    if (!roll || !roll.qcode) return "";
    const params = new URLSearchParams({
      qcode: roll.qcode,
      quantity: String(element.quantity),
      width: String(Math.round(element.width)),
      height: String(Math.round(element.height)),
      shortname: getCartShortname(element.shortname, printMode, offsetJoinsUsed),
      price: formatCartPrice(unitPrice)
    });
    return `https://vivad.com.au/shopping-cart?${params.toString()}`;
  }

  function getCartShortname(shortname, printMode, offsetJoinsUsed = false) {
    const base = String(shortname || "").trim();
    const mode = String(printMode || "").trim();
    const labelled = mode ? `${base} - ${mode}` : base;
    return offsetJoinsUsed ? `${labelled}-OSJ` : labelled;
  }

  async function addAllToCart() {
    const urls = state.currentCartUrls.slice();
    if (!urls.length) return;

    const originalLabels = new Map(ui.addAllCartButtons.map((button) => [button, button.textContent]));
    setAddAllCartButtonsDisabled(true);
    let cartWindow = window.open(urls[0], CART_WINDOW_NAME);
    let addToCartEmailError = null;
    const addToCartEmailPromise = submitAddToCartEmail({
      bodyText: buildAddToCartEmailBody(),
      lineCount: state.currentCartLines.length,
      total: state.currentBest ? formatMoney(state.currentBest.costs.total) : ""
    }).catch((error) => {
      addToCartEmailError = error;
    });

    try {
      for (let index = 0; index < urls.length; index += 1) {
        setAddAllCartButtonsText(`Adding ${index + 1}/${urls.length}`);
        if (index > 0) {
          await wait(CART_NAVIGATION_DELAY_MS);
          cartWindow = navigateCartTab(urls[index], cartWindow);
        }
      }
    } finally {
      await wait(250);
      await addToCartEmailPromise;
      ui.addAllCartButtons.forEach((button) => {
        button.textContent = originalLabels.get(button) || "Add all to cart";
      });
      setAddAllCartButtonsDisabled(!state.currentCartUrls.length);
      showAppToast(getAddToCartToastMessage(urls.length), "success");
      if (addToCartEmailError) {
        window.setTimeout(() => {
          showAppToast(addToCartEmailError?.message || "Cart opened, but the add-to-cart email could not be sent.", "warning", { timeoutMs: 5600 });
        }, 900);
      }
    }
  }

  function getAddToCartToastMessage(lineCount) {
    const count = Math.max(1, Number(lineCount) || 1);
    const itemText = count === 1 ? "1 item" : `${count} items`;
    const addedText = count === 1 ? "Added a new item" : "Added new items";
    return `Shopping cart (${itemText}) - ${addedText}`;
  }

  function setAddAllCartButtonsDisabled(disabled) {
    (ui.addAllCartButtons || []).forEach((button) => {
      button.disabled = disabled;
    });
  }

  function setAddAllCartButtonsText(text) {
    (ui.addAllCartButtons || []).forEach((button) => {
      button.textContent = text;
    });
  }

  function setImpositionActionButtonsDisabled(disabled) {
    [ui.downloadImposition, ui.emailImposition].filter(Boolean).forEach((button) => {
      button.disabled = disabled;
    });
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
    const printableWidth = Math.max(1, cleanNumber(best.roll.printableWidth, stockWidth));
    const printableOffsetMm = Math.max(0, (stockWidth - printableWidth) / 2);
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
      const x = pad + (printableOffsetMm + placement.x) * scale;
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
          ${canLabel ? `<text x="${x + 6}" y="${y + 16}" fill="#ffffff" font-size="12" font-family="Open Sans, Segoe UI, Arial, sans-serif">${escapeSvg(label)}</text>` : ""}
        </g>
      `;
    }).join("");

    const rollY = titleHeight;
    const rollHeight = drawingHeight;
    const metreMarks = buildMetreMarks(lengthMm, scale, pad, titleHeight, drawingWidth);
    const truncatedNote = pack.truncated
      ? `<text x="${pad}" y="${svgHeight - 12}" fill="#5e6a64" font-size="12" font-family="Open Sans, Segoe UI, Arial, sans-serif">Preview capped at ${pack.placements.length} of ${pack.totalPieces} print pieces.</text>`
      : "";

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Roll imposition">
        <rect width="100%" height="100%" fill="#fbfcfa"/>
        <text x="${pad}" y="24" fill="#17201c" font-size="${preview ? 16 : 22}" font-weight="700" font-family="Open Sans, Segoe UI, Arial, sans-serif">${escapeSvg(title)}</text>
        <text x="${pad}" y="${preview ? 42 : 47}" fill="#5e6a64" font-size="12" font-family="Open Sans, Segoe UI, Arial, sans-serif">Strategy: ${escapeSvg(getStrategyLabel(pack.strategy))} | Joins: ${formatInteger(best.joins)} | Total: ${escapeSvg(formatMoney(best.costs.total))}</text>
        <defs>${clipDefs.join("")}</defs>
        <rect x="${pad}" y="${rollY}" width="${drawingWidth}" height="${rollHeight}" fill="#ffffff" stroke="#17201c" stroke-width="1.4"/>
        ${metreMarks}
        ${rects}
        <text x="${pad + drawingWidth + 8}" y="${rollY + 14}" fill="#5e6a64" font-size="11" font-family="Open Sans, Segoe UI, Arial, sans-serif">${formatInteger(stockWidth)} mm</text>
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
        <text x="${pad - 8}" y="${y + 4}" text-anchor="end" fill="#5e6a64" font-size="10" font-family="Open Sans, Segoe UI, Arial, sans-serif">${metre}m</text>
      `);
    }
    return marks.join("");
  }

  function downloadImposition() {
    if (!state.currentBest) return;
    const svg = getCurrentImpositionSvg();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getImpositionFilename();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function emailImposition() {
    if (!state.currentBest) return;
    if (!isAppsScriptConfigured()) {
      showAppToast("Apps Script is not configured yet.", "error");
      return;
    }

    const button = ui.emailImposition;
    const originalTitle = button?.getAttribute("title") || "Email imposition";
    const originalAriaLabel = button?.getAttribute("aria-label") || "Email imposition";

    try {
      setImpositionActionButtonsDisabled(true);
      if (button) {
        button.setAttribute("aria-busy", "true");
        button.setAttribute("title", "Submitting imposition...");
        button.setAttribute("aria-label", "Submitting imposition");
      }

      await submitImpositionEmail({
        svg: getCurrentImpositionSvg(),
        filename: getImpositionFilename(),
        bodyText: buildImpositionEmailBody(),
        productName: state.currentBest.productName,
        rollWidth: Math.round(state.currentBest.roll.width),
        total: formatMoney(state.currentBest.costs.total)
      });

      showAppToast(`Email request sent to Apps Script for ${IMPOSITION_EMAIL_TO}.`, "success");
    } catch (error) {
      showAppToast(error?.message || "Could not email the imposition. Please download it and send it manually.", "error");
    } finally {
      if (button) {
        button.removeAttribute("aria-busy");
        button.setAttribute("title", originalTitle);
        button.setAttribute("aria-label", originalAriaLabel);
      }
      setImpositionActionButtonsDisabled(!state.currentBest);
    }
  }

  async function submitImpositionEmail(payload) {
    await postAppsScriptPayload({
      action: IMPOSITION_EMAIL_ACTION,
      mode: APP_MODE,
      subject: IMPOSITION_EMAIL_SUBJECT,
      filename: payload.filename,
      bodyText: payload.bodyText || "",
      svg: payload.svg,
      productName: payload.productName || "",
      rollWidth: String(payload.rollWidth || ""),
      total: payload.total || ""
    });
  }

  async function submitAddToCartEmail(payload) {
    await postAppsScriptPayload({
      action: ADD_TO_CART_EMAIL_ACTION,
      mode: APP_MODE,
      subject: ADD_TO_CART_EMAIL_SUBJECT,
      bodyText: payload.bodyText || "",
      lineCount: String(payload.lineCount || ""),
      total: payload.total || ""
    });
  }

  async function postAppsScriptPayload(params) {
    if (!isAppsScriptConfigured()) {
      throw new Error("Apps Script is not configured yet.");
    }

    const body = new URLSearchParams();
    Object.entries(params).forEach(([name, value]) => {
      body.set(name, String(value ?? ""));
    });

    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: "POST",
      mode: "cors",
      body
    });
    const text = await response.text();
    const payloadResponse = parseAppsScriptJsonResponse(text);

    if (!response.ok || !payloadResponse?.ok) {
      throw new Error(payloadResponse?.error || `Apps Script email failed with HTTP ${response.status}.`);
    }
  }

  function parseAppsScriptJsonResponse(text) {
    const cleanText = String(text || "").trim();
    if (!cleanText) return null;
    try {
      return JSON.parse(cleanText);
    } catch (error) {
      return null;
    }
  }

  function buildAddToCartEmailBody() {
    const best = state.currentBest;
    const product = state.selectedProduct;
    if (!best) return "SAVBuilder Add to cart";

    const lines = [
      "SAVBuilder Add to cart",
      "",
      "Selected product",
      `Product: ${best.productName}`,
      ...getProductEmailLines(product),
      "",
      "Selected roll",
      ...getSelectedRollEmailLines(best),
      "",
      "Cart lines",
      ...getAddToCartLineEmailLines()
    ];

    return normalizeEmailBodyLines(lines);
  }

  function getAddToCartLineEmailLines() {
    const lines = Array.isArray(state.currentCartLines) ? state.currentCartLines : [];
    if (!lines.length) return ["No cart lines were available."];

    return lines.flatMap((line, index) => [
      `${index + 1}. ${line.shortname}`,
      `Qty: ${formatInteger(line.quantity)}`,
      `Size: ${formatNumber(line.width, 0)} x ${formatNumber(line.height, 0)} mm`,
      `Entered shortname: ${line.enteredShortname}`,
      `Print size: ${line.printSize}`,
      `Drops: ${line.drops}`,
      `Area: ${formatNumber(line.areaSqm, 2)} sqm`,
      `Unit price: ${formatMoney(line.unit)}`,
      `Line total: ${formatMoney(line.lineTotal)}`,
      line.qcode ? `QCode: ${line.qcode}` : "",
      `Product cart: ${line.cartUrl}`,
      ""
    ]);
  }

  function buildImpositionEmailBody() {
    const best = state.currentBest;
    const product = state.selectedProduct;
    if (!best) return "SAV Builder imposition submitted.";

    const parsed = parseElements(ui.jobInput.value);
    const lines = [
      "SAV Builder imposition submitted.",
      "",
      "Selected product",
      `Product: ${best.productName}`,
      ...getProductEmailLines(product),
      "",
      "Selected roll",
      ...getSelectedRollEmailLines(best),
      "",
      "Entered data",
      ...getEnteredDataEmailLines(parsed.elements, best),
      "",
      "Surface descriptions and links",
      ...getSurfaceInfoEmailLines(product)
    ];

    return normalizeEmailBodyLines(lines);
  }

  function getProductEmailLines(product) {
    if (!product) return [];

    return [
      ...getSelectorSelectionEmailLines(product),
      getArraySummaryLine("Laminate", "Laminates", product.laminates),
      product.printMode ? `Print mode: ${product.printMode}` : "",
      getArraySummaryLine("Mounting surface", "Mounting surfaces", getDisplayMountingSurfaceValues(product.mountingSurfaces)),
      getArraySummaryLine("Longevity", "Longevities", product.longevities),
      product.productSpecSheet ? `Product spec sheet: ${normalizePreviewUrl(product.productSpecSheet)}` : "",
      product.laminateSpecSheet ? `Laminate spec sheet: ${normalizePreviewUrl(product.laminateSpecSheet)}` : ""
    ];
  }

  function getSelectorSelectionEmailLines(product) {
    const selections = product?.selectorSelections || {};
    const order = getSelectorSelectionOrder();
    return order
      .filter((column) => selections[column] && column !== "Product")
      .map((column) => `${getDisplaySelectorColumn(column)}: ${getDisplaySelectorValue(column, selections[column])}`);
  }

  function getSelectedRollEmailLines(best) {
    const roll = best.roll || {};
    const printableWidth = cleanNumber(roll.printableWidth, getPrintableRollWidth(roll));
    return [
      `Roll width: ${formatInteger(roll.width)} mm`,
      `Printable width: ${formatInteger(printableWidth)} mm`,
      roll.qcode ? `QCode: ${roll.qcode}` : "",
      Number.isFinite(roll.productCost) ? `Product cost: ${formatMoney(roll.productCost)} / lm` : "",
      Number.isFinite(roll.laminateCost) && roll.laminateCost > 0 ? `Laminate cost: ${formatMoney(roll.laminateCost)} / lm` : "",
      `Print mode: ${best.printMode || "Standard"}`,
      `Print SQM rate: ${formatMoney(best.costs.printRate)} / sqm`,
      `Imposed length: ${formatNumber(best.costs.printLinearM, 2)} m`,
      `Stock length charged: ${formatNumber(best.costs.linearM, 2)} m`,
      `Joins: ${formatInteger(best.joins)}`,
      `SQM rate: ${formatMoney(best.costs.rate)} / sqm`,
      `Total: ${formatMoney(best.costs.total)}`
    ];
  }

  function getEnteredDataEmailLines(elements, best) {
    if (!elements.length) return ["No entered data."];

    return elements.map((element, index) => {
      const plan = best.elementPlans.find((item) => item.elementIndex === index);
      const printSize = plan
        ? `${formatNumber(plan.printWidth, 0)} x ${formatNumber(plan.printHeight, 0)} mm${plan.rotated ? " rotated" : ""}`
        : "not calculated";
      const drops = plan ? formatInteger(plan.drops) : "0";
      const joins = plan ? formatInteger(plan.joins) : "0";
      return `${index + 1}. ${element.shortname} - Qty ${formatInteger(element.quantity)}, finished ${formatNumber(element.width, 0)} x ${formatNumber(element.height, 0)} mm, print ${printSize}, drops ${drops}, joins ${joins}`;
    });
  }

  function getSurfaceInfoEmailLines(product) {
    const infos = Array.isArray(product?.surfaceInfos)
      ? product.surfaceInfos.filter((info) => info.description || normalizePreviewUrl(info.link))
      : [];
    if (!infos.length) return ["No surface description or link selected."];

    return infos.flatMap((info) => {
      const surface = getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, info.surface);
      return [
        surface ? `${surface}:` : "",
        info.description ? `Description: ${info.description}` : "",
        normalizePreviewUrl(info.link) ? `Link: ${normalizePreviewUrl(info.link)}` : ""
      ];
    });
  }

  function getDisplayMountingSurfaceValues(values) {
    return Array.isArray(values)
      ? values.map((value) => getDisplaySelectorValue(MOUNTING_SURFACE_COLUMN, value))
      : [];
  }

  function getArraySummaryLine(singularLabel, pluralLabel, values) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    if (!items.length) return "";
    return `${items.length === 1 ? singularLabel : pluralLabel}: ${items.join(", ")}`;
  }

  function normalizeEmailBodyLines(lines) {
    return lines
      .map((line) => String(line ?? "").trim())
      .filter((line, index, allLines) => line || allLines[index - 1])
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function getCurrentImpositionSvg() {
    return state.currentBest ? buildImpositionSvg(state.currentBest, { preview: false }) : "";
  }

  function getImpositionFilename(best = state.currentBest) {
    if (!best) return "sav-builder-imposition.svg";
    const safeProduct = getSafeFileSegment(best.productName) || "product";
    return `imposition-${safeProduct}-${Math.round(best.roll.width)}mm.svg`;
  }

  function getSafeFileSegment(value) {
    return String(value || "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
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
    return `${formatRollWidthLabel(roll)}${qcode}`;
  }

  function formatRollWidthLabel(roll) {
    const printableWidth = Number.isFinite(roll.printableWidth) ? roll.printableWidth : getPrintableRollWidth(roll);
    if (Math.abs(printableWidth - roll.width) > 0.001) {
      return `${formatInteger(roll.width)} mm (${formatInteger(printableWidth)} printable)`;
    }
    return `${formatInteger(roll.width)} mm`;
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
    parseConfigCsv,
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
