export let commonHooks = {
    main : document.querySelector("main"),
    goToTabsBtn : document.getElementById("go-to-tabs-btn"),
    goToGroupsBtn : document.getElementById("go-to-groups-btn"),
    goToFavouritesBtn : document.getElementById("go-to-favourites-btn"),
    goToSettingsBtn : document.getElementById("go-to-settings-btn"),
}

export let tabsHooks = {
    allWindowsContainer : document.getElementById("all-windows"),
    pinnedWindowsContainer : document.getElementById("all-pinned-windows"),
    pinnedWindowsSection : document.getElementById("pinned-windows-section"),

    createNewWindowBtn : document.getElementById("create-new-window-btn"),

    expandAllHostsBtn : document.getElementById("expand-all-hosts-btn"),
    colapseAllHostsBtn : document.getElementById("colapse-all-hosts-btn"),

    searchContainer : document.getElementById("search-container"),
    searchInput : document.getElementById("search-input"),

    selectedTabsCounter : document.getElementById("selected-tabs-counter"),

    closeSelectedBtn : document.getElementById("close-selected-btn"),
    createGroupBtn : document.getElementById("create-group-btn"),

    showDuplicatesBtn : document.getElementById("show-duplicates-btn"),

    allHostsCheckboxes : document.getElementById("all-windows").getElementsByClassName("inner-list-checkbox"),
    allPinedHostsCheckboxes : document.getElementById("all-pinned-windows").getElementsByClassName("inner-list-checkbox"),

    groupTabsBtn : document.getElementById("group-tabs-btn"),

    addToGroupContainer : document.getElementById('add-to-group-container'),
}

export let groupsHooks = {

}

export let favouritiesHooks = {
    changeFavouritedDisplayBtn : document.getElementById("change-favourites-display-grid"),
    dragableContainer : document.getElementById("dragables-container"),
}

export let settingsHooks = {
    pinTabOption : document.getElementById("pin-tab-option"),
    muteTabOption : document.getElementById("mute-tab-option"),
    openNewWindowOption : document.getElementById("open-new-window-option"),
    groupByDefaultOption : document.getElementById("group-by-default-option"),
    keepLastGroupingModeOption : document.getElementById("keep-last-grouping-mode-option"),
    rememberLastGroupingModeOption : document.getElementById("remember-expanded-websites-option"),

    openAllInThisWindowOption : document.getElementById("open-all-in-this-window-option"),
    openAllInThisWindowAsGroupOption : document.getElementById("open-all-in-this-window-as-group-option"),
    openAllInNewWindowOption : document.getElementById("open-all-in-new-window-option"),
    openAllIncognitoOption : document.getElementById("open-all-incognito-option"),
    openTabInNewWindowOption : document.getElementById("open-tab-in-new-window-option"),
    openTabIncognitoOption : document.getElementById("open-tab-incognito-option"),
    rememberExpandedGroupsWebsite : document.getElementById("remember-expanded-groups-website"),

    displayAsGroupOption : document.getElementById("display-as-grid-option"),
    rememberLastDisplayModeOption : document.getElementById("remember-last-display-mode-option"),
    darkmodeOption : document.getElementById("darkmode-option"),
    keepLastOpenedSectionOption : document.getElementById("keep-last-opened-section-option")
}








