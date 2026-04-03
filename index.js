const EXTENSION_NAME = "Filos UI Tweaks";
const TEMPLATE_ROOT = "third-party/SillyTavern-FilosUiTweaks";
const SETTINGS_PANEL_SELECTOR = "#extensions_settings2";
const SETTINGS_ROOT_ID = "FilosUiTweaks";
const SCREEN_SIZE_INPUT_STEP = 10;
const SCREEN_MOBILE_BREAKPOINT = 1000;

const MIN_DESK_CHAT_SIZE = 600 - SCREEN_SIZE_INPUT_STEP;
const MAX_DESK_CHAT_SIZE = SCREEN_MOBILE_BREAKPOINT;

const MIN_SIDE_PANEL_SIZE = 300 - SCREEN_SIZE_INPUT_STEP;
const MAX_SIDE_PANEL_SIZE = SCREEN_MOBILE_BREAKPOINT / 2;

const MIN_MOBILE_ADJUST_SIZE = 300 - SCREEN_SIZE_INPUT_STEP;
const MAX_MOBILE_ADJUST_SIZE = SCREEN_MOBILE_BREAKPOINT;

const MIN_DESK_CHAT_SIZE_PROPERTY = "--fuit-min-desk-chat-size";
const MIN_SIDE_PANEL_SIZE_PROPERTY = "--fuit-min-side-panel-size";
const MAX_MOBILE_ADJUST_PROPERTY = "--fuit-max-mobile-adjust";
const MOBILE_ADJUST_CLASS = "fuit-mobile-adjust";
const IS_DESKTOP_SIZE_CLASS = "fuit-is-desktop-size";
const DESKTOP_CHAT_SIZE_CLASS = "fuit-desktop-chat-size";
const DESKTOP_PANELS_FIXED_CLASS = "fuit-desktop-panels-fixed";
const DEFAULT_SETTINGS = Object.freeze({
    minDeskChatSize: 950,
    minSidePanelSize: 300,
    maxMobileAdjust: 700,
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

    return settings;
}

function applySettingsToDocument() {
    const { minDeskChatSize, minSidePanelSize, maxMobileAdjust } = getSettings();

    const isDesktopSize = window.innerWidth > SCREEN_MOBILE_BREAKPOINT;

    const hasDesktopChatSizeSetting = isDesktopSize && (minDeskChatSize !== MIN_DESK_CHAT_SIZE);
    const hasSidePanelSizeSetting = isDesktopSize && (minSidePanelSize !== MIN_SIDE_PANEL_SIZE);
    const hasMobileAdjustSetting = !isDesktopSize && (maxMobileAdjust !== MIN_MOBILE_ADJUST_SIZE);

    const hasDesktopChatSize = hasDesktopChatSizeSetting && window.innerWidth >= minDeskChatSize;
    const hasFixedPanels = hasSidePanelSizeSetting && ((window.innerWidth - minDeskChatSize) / 2) < minSidePanelSize;
    const hasMobileAdjust = hasMobileAdjustSetting && window.innerWidth <= maxMobileAdjust;

    const html = document.documentElement;

    html.classList.toggle(IS_DESKTOP_SIZE_CLASS, isDesktopSize);

    html.classList.toggle(DESKTOP_CHAT_SIZE_CLASS, hasDesktopChatSize);
    if (hasDesktopChatSizeSetting) {
        html.style.setProperty(MIN_DESK_CHAT_SIZE_PROPERTY, `${minDeskChatSize}px`);
    } else {
        html.style.removeProperty(MIN_DESK_CHAT_SIZE_PROPERTY);
    }

    html.classList.toggle(DESKTOP_PANELS_FIXED_CLASS, hasFixedPanels);
    if (hasSidePanelSizeSetting) {
        html.style.setProperty(MIN_SIDE_PANEL_SIZE_PROPERTY, `${minSidePanelSize}px`);
    } else {
        html.style.removeProperty(MIN_SIDE_PANEL_SIZE_PROPERTY);
    }

    html.classList.toggle(MOBILE_ADJUST_CLASS, hasMobileAdjust);
    if (hasMobileAdjustSetting) {
        html.style.setProperty(MAX_MOBILE_ADJUST_PROPERTY, `${maxMobileAdjust}px`);
    } else {
        html.style.removeProperty(MAX_MOBILE_ADJUST_PROPERTY);
    }
}

function syncSettingsUi() {
    const { minDeskChatSize, minSidePanelSize, maxMobileAdjust } = getSettings();
    const desktopRangeInput = $("#fuit_min_desk_chat_size");
    const desktopNumberInput = $("#fuit_min_desk_chat_size_value");
    const sidePanelRangeInput = $("#fuit_min_side_panel_size");
    const sidePanelNumberInput = $("#fuit_min_side_panel_size_value");
    const mobileRangeInput = $("#fuit_max_mobile_adjust");
    const mobileNumberInput = $("#fuit_max_mobile_adjust_value");
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

function bindSettingsUi() {
    const desktopRangeInput = $("#fuit_min_desk_chat_size");
    const desktopNumberInput = $("#fuit_min_desk_chat_size_value");
    const sidePanelRangeInput = $("#fuit_min_side_panel_size");
    const sidePanelNumberInput = $("#fuit_min_side_panel_size_value");
    const mobileRangeInput = $("#fuit_max_mobile_adjust");
    const mobileNumberInput = $("#fuit_max_mobile_adjust_value");

    if (
        !desktopRangeInput.length
        || !desktopNumberInput.length
        || !sidePanelRangeInput.length
        || !sidePanelNumberInput.length
        || !mobileRangeInput.length
        || !mobileNumberInput.length
    ) {
        return;
    }

    desktopRangeInput.off(".fuit");
    desktopNumberInput.off(".fuit");
    sidePanelRangeInput.off(".fuit");
    sidePanelNumberInput.off(".fuit");
    mobileRangeInput.off(".fuit");
    mobileNumberInput.off(".fuit");

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

async function initializeExtension() {
    if (hasInitialized) {
        applySettingsToDocument();
        syncSettingsUi();
        return;
    }

    hasInitialized = true;
    applySettingsToDocument();
    await renderSettingsPanel();

    if (!hasBoundResize) {
        hasBoundResize = true;
        window.addEventListener("resize", applySettingsToDocument, { passive: true });
    }

    console.debug(`[${EXTENSION_NAME}] activated`);
}

export function activate() {
    const { eventSource, event_types } = SillyTavern.getContext();

    // Apply the current CSS variables and classes immediately when the extension is enabled.
    applySettingsToDocument();

    // Delay the full extension initialization until the app is ready.
    eventSource.on(event_types.APP_INITIALIZED, () => {
        void initializeExtension();
    });
}
