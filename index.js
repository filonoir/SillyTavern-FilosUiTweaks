const EXTENSION_NAME = "Filos UI Tweaks";
const TEMPLATE_ROOT = "third-party/SillyTavern-FilosUiTweaks";
const SETTINGS_PANEL_SELECTOR = "#extensions_settings2";
const SETTINGS_ROOT_ID = "fuit_container";
const SCREEN_SIZE_INPUT_STEP = 10;
const SCREEN_MOBILE_BREAKPOINT = 1000;

const MIN_DESK_CHAT_SIZE = 600 - SCREEN_SIZE_INPUT_STEP;
const MAX_DESK_CHAT_SIZE = SCREEN_MOBILE_BREAKPOINT;

const MIN_SIDE_PANEL_SIZE = 300 - SCREEN_SIZE_INPUT_STEP;
const MAX_SIDE_PANEL_SIZE = SCREEN_MOBILE_BREAKPOINT / 2;

const MIN_MOBILE_ADJUST_SIZE = 300 - SCREEN_SIZE_INPUT_STEP;
const MAX_MOBILE_ADJUST_SIZE = SCREEN_MOBILE_BREAKPOINT;

const PROPERTY_DVH = "--fuit-dvh";
const PROPERTY_DVH_OFFSET = "--fuit-dvh-offset";
const PROPERTY_DESK_CHAT_SIZE = "--fuit-desk-chat-size";
const PROPERTY_SIDE_PANEL_SIZE = "--fuit-side-panel-size";

const MOBILE_CSS_DEFAULT_SELECTOR = 'link[href="css/mobile-styles.css"]';
const MOBILE_CSS_REPLACEMENT_ID = "fuit_mobile_styles";
const MOBILE_CSS_REPLACEMENT_URL = `/scripts/extensions/${TEMPLATE_ROOT}/fiut-mobile-styles.css`;

const CLASS_MOBILE_ADJUST_ENABLED = "fuit-mobile-adjust";
const CLASS_IS_DESKTOP_SIZE = "fuit-desktop-size";
const CLASS_FIX_DESKTOP_CHAT = "fuit-fix-chat";
const CLASS_FIX_DESKTOP_PANELS = "fuit-fix-panels";
const CLASS_MOBILE_CSS_ENABLED = "fuit-css-enabled";
const CLASS_MOBILE_CSS_DISABLED_CLASS = "fuit-css-disabled";

const DEFAULT_SETTINGS = Object.freeze({
    minDeskChatSize: 1000,
    minSidePanelSize: 400,
    maxMobileAdjust: 700,
    replaceMobileCss: true,
});

let hasInitialized = false;
let hasBoundResize = false;

function clampSettingValue(value, minValue, maxValue, fallbackValue) {
    const numericValue = Number.parseInt(value, 10);
    if (Number.isNaN(numericValue)) {
        return fallbackValue;
    }

    return Math.min(maxValue, Math.max(minValue, numericValue));
}

function getSettings() {
    const { extensionSettings } = SillyTavern.getContext();

    if (!extensionSettings[EXTENSION_NAME]) {
        extensionSettings[EXTENSION_NAME] = structuredClone(DEFAULT_SETTINGS);
    }

    const settings = extensionSettings[EXTENSION_NAME];

    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        if (!Object.hasOwn(settings, key)) {
            settings[key] = defaultValue;
        }
    }

    settings.minDeskChatSize = clampSettingValue(
        settings.minDeskChatSize,
        MIN_DESK_CHAT_SIZE,
        MAX_DESK_CHAT_SIZE,
        DEFAULT_SETTINGS.minDeskChatSize,
    );
    settings.minSidePanelSize = clampSettingValue(
        settings.minSidePanelSize,
        MIN_SIDE_PANEL_SIZE,
        MAX_SIDE_PANEL_SIZE,
        DEFAULT_SETTINGS.minSidePanelSize,
    );
    settings.maxMobileAdjust = clampSettingValue(
        settings.maxMobileAdjust,
        MIN_MOBILE_ADJUST_SIZE,
        MAX_MOBILE_ADJUST_SIZE,
        DEFAULT_SETTINGS.maxMobileAdjust,
    );
    settings.replaceMobileCss = settings.replaceMobileCss !== false;

    return settings;
}

function applyMobileCssReplacement() {
    const { replaceMobileCss } = getSettings();
    const defaultMobileCss = document.querySelector(MOBILE_CSS_DEFAULT_SELECTOR);
    const replacementMobileCss = document.getElementById(MOBILE_CSS_REPLACEMENT_ID);

    if (!defaultMobileCss) {
        replacementMobileCss?.remove();
        return;
    }

    defaultMobileCss.disabled = replaceMobileCss;

    if (!replaceMobileCss) {
        replacementMobileCss?.remove();
        return;
    }

    if (replacementMobileCss) {
        return;
    }

    const link = document.createElement("link");
    link.id = MOBILE_CSS_REPLACEMENT_ID;
    link.rel = "stylesheet";
    link.href = MOBILE_CSS_REPLACEMENT_URL;
    defaultMobileCss.insertAdjacentElement("afterend", link);
}

function applySettingsToDocument() {
    const { minDeskChatSize, minSidePanelSize, maxMobileAdjust, replaceMobileCss } = getSettings();

    const isDesktopSize = window.innerWidth > SCREEN_MOBILE_BREAKPOINT;

    const hasDesktopChatSizeSetting = isDesktopSize && (minDeskChatSize !== MIN_DESK_CHAT_SIZE);
    const hasSidePanelSizeSetting = isDesktopSize && (minSidePanelSize !== MIN_SIDE_PANEL_SIZE);
    const hasMobileAdjustSetting = !isDesktopSize && (maxMobileAdjust !== MIN_MOBILE_ADJUST_SIZE);

    const hasDesktopChatSize = hasDesktopChatSizeSetting && window.innerWidth >= minDeskChatSize;
    const hasFixedPanels = hasSidePanelSizeSetting && ((window.innerWidth - minDeskChatSize) / 2) < minSidePanelSize;
    const hasMobileAdjust = hasMobileAdjustSetting && window.innerWidth <= maxMobileAdjust;

    const html = document.documentElement;

    html.classList.toggle(CLASS_IS_DESKTOP_SIZE, isDesktopSize);
    html.classList.toggle(CLASS_MOBILE_CSS_ENABLED, replaceMobileCss);
    html.classList.toggle(CLASS_MOBILE_CSS_DISABLED_CLASS, !replaceMobileCss);
    
    setViewportOffset();
    html.style.setProperty(PROPERTY_DVH, `${window.visualViewport.height}px`);

    html.classList.toggle(CLASS_FIX_DESKTOP_CHAT, hasDesktopChatSize);
    if (hasDesktopChatSizeSetting) {
        html.style.setProperty(PROPERTY_DESK_CHAT_SIZE, `${minDeskChatSize}px`);
    } else {
        html.style.removeProperty(PROPERTY_DESK_CHAT_SIZE);
    }

    html.classList.toggle(CLASS_FIX_DESKTOP_PANELS, hasFixedPanels);
    if (hasSidePanelSizeSetting) {
        html.style.setProperty(PROPERTY_SIDE_PANEL_SIZE, `${minSidePanelSize}px`);
    } else {
        html.style.removeProperty(PROPERTY_SIDE_PANEL_SIZE);
    }

    html.classList.toggle(CLASS_MOBILE_ADJUST_ENABLED, hasMobileAdjust);
}

function syncSettingsUi() {
    const { minDeskChatSize, minSidePanelSize, maxMobileAdjust, replaceMobileCss } = getSettings();
    const desktopRangeInput = $("#fuit_min_desk_chat_size");
    const desktopNumberInput = $("#fuit_min_desk_chat_size_value");
    const sidePanelRangeInput = $("#fuit_min_side_panel_size");
    const sidePanelNumberInput = $("#fuit_min_side_panel_size_value");
    const mobileRangeInput = $("#fuit_max_mobile_adjust");
    const mobileNumberInput = $("#fuit_max_mobile_adjust_value");
    const replaceMobileCssInput = $("#fuit_replace_mobile_css");
    const desktopDrawerItem = desktopRangeInput.closest(".drawer-item");
    const sidePanelDrawerItem = sidePanelRangeInput.closest(".drawer-item");
    const mobileDrawerItem = mobileRangeInput.closest(".drawer-item");
    const desktopUnitOutput = desktopDrawerItem.find(".fuit-range-unit");
    const sidePanelUnitOutput = sidePanelDrawerItem.find(".fuit-range-unit");
    const mobileUnitOutput = mobileDrawerItem.find(".fuit-range-unit");
    const hasDesktopChatSizeSetting = minDeskChatSize !== MIN_DESK_CHAT_SIZE;
    const hasSidePanelSizeSetting = minSidePanelSize !== MIN_SIDE_PANEL_SIZE;
    const hasMobileAdjustSettingSetting = maxMobileAdjust !== MIN_MOBILE_ADJUST_SIZE;

    desktopRangeInput.val(String(minDeskChatSize));
    desktopNumberInput.val(String(minDeskChatSize));
    desktopDrawerItem.toggleClass("setting-disabled", !hasDesktopChatSizeSetting);
    desktopUnitOutput.text(hasDesktopChatSizeSetting ? "px" : "off");

    sidePanelRangeInput.val(String(minSidePanelSize));
    sidePanelNumberInput.val(String(minSidePanelSize));
    sidePanelDrawerItem.toggleClass("setting-disabled", !hasSidePanelSizeSetting);
    sidePanelUnitOutput.text(hasSidePanelSizeSetting ? "px" : "off");

    mobileRangeInput.val(String(maxMobileAdjust));
    mobileNumberInput.val(String(maxMobileAdjust));
    mobileDrawerItem.toggleClass("setting-disabled", !hasMobileAdjustSettingSetting);
    mobileUnitOutput.text(hasMobileAdjustSettingSetting ? "px" : "off");

    replaceMobileCssInput.prop("checked", replaceMobileCss);
}

function saveMinDeskChatSize(nextValue) {
    const settings = getSettings();
    const { saveSettingsDebounced } = SillyTavern.getContext();

    settings.minDeskChatSize = clampSettingValue(
        nextValue,
        MIN_DESK_CHAT_SIZE,
        MAX_DESK_CHAT_SIZE,
        DEFAULT_SETTINGS.minDeskChatSize,
    );
    syncSettingsUi();
    applySettingsToDocument();
    saveSettingsDebounced();
}

function saveMinSidePanelSize(nextValue) {
    const settings = getSettings();
    const { saveSettingsDebounced } = SillyTavern.getContext();

    settings.minSidePanelSize = clampSettingValue(
        nextValue,
        MIN_SIDE_PANEL_SIZE,
        MAX_SIDE_PANEL_SIZE,
        DEFAULT_SETTINGS.minSidePanelSize,
    );
    syncSettingsUi();
    applySettingsToDocument();
    saveSettingsDebounced();
}

function saveMaxMobileAdjust(nextValue) {
    const settings = getSettings();
    const { saveSettingsDebounced } = SillyTavern.getContext();

    settings.maxMobileAdjust = clampSettingValue(
        nextValue,
        MIN_MOBILE_ADJUST_SIZE,
        MAX_MOBILE_ADJUST_SIZE,
        DEFAULT_SETTINGS.maxMobileAdjust,
    );
    syncSettingsUi();
    applySettingsToDocument();
    saveSettingsDebounced();
}

function saveReplaceMobileCss(nextValue) {
    const settings = getSettings();
    const { saveSettingsDebounced } = SillyTavern.getContext();

    settings.replaceMobileCss = Boolean(nextValue);
    syncSettingsUi();
    applyMobileCssReplacement();
    saveSettingsDebounced();
}

function bindSettingsUi() {
    const desktopRangeInput = $("#fuit_min_desk_chat_size");
    const desktopNumberInput = $("#fuit_min_desk_chat_size_value");
    const sidePanelRangeInput = $("#fuit_min_side_panel_size");
    const sidePanelNumberInput = $("#fuit_min_side_panel_size_value");
    const mobileRangeInput = $("#fuit_max_mobile_adjust");
    const mobileNumberInput = $("#fuit_max_mobile_adjust_value");
    const replaceMobileCssInput = $("#fuit_replace_mobile_css");

    if (
        !desktopRangeInput.length
        || !desktopNumberInput.length
        || !sidePanelRangeInput.length
        || !sidePanelNumberInput.length
        || !mobileRangeInput.length
        || !mobileNumberInput.length
        || !replaceMobileCssInput.length
    ) {
        return;
    }

    desktopRangeInput.off(".fuit");
    desktopNumberInput.off(".fuit");
    sidePanelRangeInput.off(".fuit");
    sidePanelNumberInput.off(".fuit");
    mobileRangeInput.off(".fuit");
    mobileNumberInput.off(".fuit");
    replaceMobileCssInput.off(".fuit");

    desktopRangeInput.on("input.fuit change.fuit", (event) => {
        saveMinDeskChatSize(event.target.value);
    });

    desktopNumberInput.on("input.fuit change.fuit", (event) => {
        saveMinDeskChatSize(event.target.value);
    });

    sidePanelRangeInput.on("input.fuit change.fuit", (event) => {
        saveMinSidePanelSize(event.target.value);
    });

    sidePanelNumberInput.on("input.fuit change.fuit", (event) => {
        saveMinSidePanelSize(event.target.value);
    });

    mobileRangeInput.on("input.fuit change.fuit", (event) => {
        saveMaxMobileAdjust(event.target.value);
    });

    mobileNumberInput.on("input.fuit change.fuit", (event) => {
        saveMaxMobileAdjust(event.target.value);
    });

    replaceMobileCssInput.on("input.fuit change.fuit", (event) => {
        saveReplaceMobileCss(event.target.checked);
    });

    syncSettingsUi();
}

async function renderSettingsPanel() {
    if ($(SETTINGS_ROOT_ID.startsWith("#") ? SETTINGS_ROOT_ID : `#${SETTINGS_ROOT_ID}`).length) {
        return;
    }

    const { renderExtensionTemplateAsync } = SillyTavern.getContext();
    const { minDeskChatSize, minSidePanelSize, maxMobileAdjust } = getSettings();
    const settingsHtml = await renderExtensionTemplateAsync(TEMPLATE_ROOT, "settings", {
        minDeskChatSize,
        minSidePanelSize,
        maxMobileAdjust,
        extensionName: EXTENSION_NAME,
        settingsRootId: SETTINGS_ROOT_ID,
        minDeskChatSizeMin: MIN_DESK_CHAT_SIZE,
        minDeskChatSizeMax: MAX_DESK_CHAT_SIZE,
        minSidePanelSizeMin: MIN_SIDE_PANEL_SIZE,
        minSidePanelSizeMax: MAX_SIDE_PANEL_SIZE,
        maxMobileAdjustMin: MIN_MOBILE_ADJUST_SIZE,
        maxMobileAdjustMax: MAX_MOBILE_ADJUST_SIZE,
        screenSizeInputStep: SCREEN_SIZE_INPUT_STEP,
    });

    $(SETTINGS_PANEL_SELECTOR).append(settingsHtml);
    bindSettingsUi();
}

let ticking = false;

async function setViewportOffset() {
    document.documentElement.style.setProperty(PROPERTY_DVH_OFFSET, `${window.visualViewport.offsetTop}px`);
}

async function requestScrollAnimationFrame() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            setViewportOffset();
            ticking = false;
        });
        ticking = true;
    }
}

async function initializeExtension() {
    if (hasInitialized) {
        applySettingsToDocument();
        applyMobileCssReplacement();
        syncSettingsUi();
        return;
    }

    hasInitialized = true;
    applySettingsToDocument();
    applyMobileCssReplacement();
    await renderSettingsPanel();

    if (!hasBoundResize) {
        hasBoundResize = true;
        window.visualViewport.addEventListener("resize", applySettingsToDocument, { passive: true });
        window.visualViewport.addEventListener('scroll', requestScrollAnimationFrame, { passive: true });
    }

    console.debug(`[${EXTENSION_NAME}] activated`);
}

export function activate() {
    const { eventSource, event_types } = SillyTavern.getContext();

    // Apply the current CSS variables and classes immediately when the extension is enabled.
    applySettingsToDocument();
    applyMobileCssReplacement();

    // Delay the full extension initialization until the app is ready.
    eventSource.on(event_types.APP_INITIALIZED, () => {
        void initializeExtension();
    });
}
