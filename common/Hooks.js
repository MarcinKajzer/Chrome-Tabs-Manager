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

    groupTabsBtn : document.getElementById("group-tabs-btn")
}

export let groupsHooks = {

}

export let favouritiesHooks = {
    changeFavouritedDisplayBtn : document.getElementById("change-favourites-display-grid"),
    dragableContainer : document.getElementById("dragables-container"),
}

export let settingsHooks = {

}








