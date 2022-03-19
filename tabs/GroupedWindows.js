import {global} from "../common/Global.js"
import { tabsHooks } from "../common/hooks.js";
import { buildWindowContainer, unactiveAllTabsInColection, enableTabsButtons, disableTabsButtons, hideGroupSelection } from "./Common.js";

let currentDraggingHostList;
let dragOverHostList;
let dragOverWindowId;


export function buildAllGroupedWindows(){
    let currentWindow = global.groupedWindows.filter(x => x.focused)[0];

    buildSingleGroupedWindow(currentWindow, null, global.groupedWindows.length > 1)

    let index = 2;
    for(let window of global.groupedWindows.filter(x => !x.focused)){
        buildSingleGroupedWindow(window, index, true);
        index++;
    }
}

function buildSingleGroupedWindow(window, index, isMoreThenOneWindow) {

    let windowContainer = buildWindowContainer(index, window);
    
    if(isMoreThenOneWindow){
        let dropHerePopup = document.createElement("div")
        dropHerePopup.classList.add("drop-here-popup")
        windowContainer.appendChild(dropHerePopup);
    }

    let windowList = windowContainer.querySelector(".window-list");
    windowList.addEventListener("dragover", () => handleWindowListDragover(windowList, window.windowId))
    
    for (const [host, hostTabs] of Object.entries(window.hosts)) {

        let hostItem = document.createElement("li");
        hostItem.id = "host_" + host + "_window" + window.windowId;
        hostItem.draggable = true;
        hostItem.classList.add("outer-list-item");

        hostItem.addEventListener("dragstart", () => handleHostItemDragstart(hostItem))
        hostItem.addEventListener("dragend", () => handleHostItmDragend(host, hostItem, hostTabs))

        let hostCheckbox = document.createElement("input");
        hostCheckbox.type = "checkbox";
        hostCheckbox.classList.add("inner-list-checkbox")
        hostCheckbox.id = host + window.windowId;

        if(global.expandedHosts.filter(x => x == host + window.windowId).length > 0){
            hostCheckbox.checked = true;
        }

        let hostLabel = document.createElement("label");
        hostLabel.classList.add("inner-list-checkbox-label");
        hostLabel.classList.add("selectable");

        if(hostTabs.filter(x => x.selected).length > 0){
            hostLabel.classList.add("active");

            if(global.groupCreating){
                hostLabel.classList.add("grouped")
            }
        }

        if(hostTabs.filter(x => x.shownDuplicate).length > 0){
            hostLabel.classList.add("yellow");
        }

        hostLabel.htmlFor = host + window.windowId;

        if (hostTabs.some(x => x.active)) {
            hostLabel.classList.add("selected-tab")
        }

        hostLabel.onclick = () => {
            if(global.expandedHosts.filter(x => x == host + window.windowId).length == 0){
                global.expandedHosts.push(host + window.windowId);
            }
            else{
                global.expandedHosts = global.expandedHosts.filter(x => x != host + window.windowId)
            }
            chrome.storage.sync.set({"expandedHosts": global.expandedHosts});
        }

        let hostInfo = document.createElement("div");

        let favIcon = document.createElement("img");
        favIcon.classList.add("favIcon");
        favIcon.src = hostTabs[0].favIcon == null || hostTabs[0].favIcon == "" ?
            "assets/default_favicon.png" :
            hostTabs[0].favIcon;

        let hostName = document.createElement("span");
        hostName.innerHTML = host.length > 25 ? host.substring(0, 25) + " ..." : host;

        let hostButtons = document.createElement("div");

        let closeAllTabsOfHostBtn = document.createElement("button");
        closeAllTabsOfHostBtn.classList.add("close-btn")
        closeAllTabsOfHostBtn.onclick = () => closeAllTabsOfHost(host, window.windowId)

        if (hostTabs.some(x => x.audible) || hostTabs.some(x => x.muted)) {
            let muteAllTabsOfHostBtn = document.createElement("button");
            muteAllTabsOfHostBtn.classList.add("mute-btn");

            if (hostTabs.filter(x => x.muted).length == hostTabs.filter(x => x.audible || x.muted).length) {
                muteAllTabsOfHostBtn.classList.add("muted")
            }

            muteAllTabsOfHostBtn.onclick = (e) => defineOnClickMuteGroupBtn(e.target, hostTabs);
            hostButtons.appendChild(muteAllTabsOfHostBtn);
        }

        let hostTabsList = document.createElement("ul");

        hostInfo.appendChild(favIcon);
        hostInfo.appendChild(hostName);

        hostButtons.appendChild(closeAllTabsOfHostBtn)

        hostLabel.appendChild(hostInfo);
        hostLabel.appendChild(hostButtons);

        hostItem.appendChild(hostCheckbox);
        hostItem.appendChild(hostLabel);

        for (let hostTab of hostTabs) {
            hostTabsList.appendChild(buildSingleTab(host, hostTab, hostItem, window.windowId, hostTabs));
        }

        hostItem.appendChild(hostTabsList);
        windowList.appendChild(hostItem);

        if(window.pinned){
            tabsHooks.pinnedWindowsContainer.appendChild(windowContainer);
        }
        else{
            tabsHooks.allWindowsContainer.appendChild(windowContainer);
        }
    }
}

function buildSingleTab(host, hostTab, hostItem, windowId) {
    let tab = document.createElement("li");
    tab.classList.add("inner-list-item")
    tab.classList.add("selectable")

    if(hostTab.selected){
        tab.classList.add("active");
        if(global.groupCreating){
            tab.classList.add("grouped")
        }
    }

    if(hostTab.shownDuplicate){
        tab.classList.add("yellow");
    }

    tab.id = hostTab.id;
    tab.onclick = () => {
        chrome.tabs.update(hostTab.id, { selected: true });
    }
    if (hostTab.active) {
        tab.classList.add("selected-tab")
    }

    tab.draggable = true;

    tab.addEventListener("dragstart", (e) => handleGroupedTabDragstart(tab, e))
    tab.addEventListener("dragend", (e) => handleGroupedTabDragend(tab, e, host, hostTab))

    let tabTitle = document.createElement("span");
    tabTitle.innerHTML = hostTab.title.length > 29 ? hostTab.title.substring(0, 26) + " ..." : hostTab.title;

    let tabButtons = document.createElement("div");

    if (hostTab.audible || host.muted) {
        let muteTabButton = document.createElement("button");
        muteTabButton.classList.add("mute-btn");

        chrome.tabs.get(hostTab.id, (tab) => {
            if (hostTab.muted) {
                muteTabButton.classList.add("muted");
            }
        })

        muteTabButton.onclick = (e) => {
            e.stopPropagation();
            if (!e.target.classList.contains("muted")) {
                chrome.tabs.update(hostTab.id, { muted: true })
                e.target.classList.add("muted");

                let mutedTabs = hostItem.querySelector("ul").getElementsByClassName("mute-btn muted");
                let muteButtons = hostItem.querySelector("ul").getElementsByClassName("mute-btn");
                
                if (mutedTabs.length == muteButtons.length) {
                    hostItem.querySelector(".mute-btn").classList.add("muted");
                }
            }
            else {
                chrome.tabs.update(hostTab.id, { muted: false })
                e.target.classList.remove("muted");
                hostItem.querySelector(".mute-btn").classList.remove("muted");
            }
        }

        tabButtons.appendChild(muteTabButton);
    }

    //DRY..............

    let pinTabBtn = document.createElement("button");
    pinTabBtn.classList.add("pin-tab-btn");

    if(hostTab.pinned){
        pinTabBtn.classList.add("unpin-tab");
    }

    pinTabBtn.onclick = (e) => {
        e.stopPropagation();
        chrome.tabs.get(hostTab.id, (t) => {
            let pinned = !t.pinned;
            chrome.tabs.update(hostTab.id, {pinned: pinned}, (result) => {
                if(pinned){
                    pinTabBtn.classList.add("unpin-tab")
                }
                else{
                    pinTabBtn.classList.remove("unpin-tab")
                }

                //DRY - zmiana kolejności elementu - osobna funkcji
                let indexOfElement = global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.findIndex(x => x.id == hostTab.id);
                let elem = global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.splice(indexOfElement, 1)
                global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.splice(result.index, 0, elem[0])
            })
        })
    }


    let addToFavouritesButton = document.createElement("button");
    addToFavouritesButton.classList.add("add-to-favourites-btn")
    addToFavouritesButton.classList.add("duplicate_" + hostTab.duplicateNumber )
    
    let index = global.favourities.findIndex(x => x.url === hostTab.url)
    
    if(index != -1){
        addToFavouritesButton.classList.add(global.favourities[index].id)
    }

    if(global.favourities.filter(x => x.url == hostTab.url).length > 0){
        addToFavouritesButton.classList.add("favourite-tab");
    }   

    addToFavouritesButton.onclick = (e) => {
        e.stopPropagation();
        handleAddToFavouriteBtnClick(hostTab);
    }
    //DRY END.............

    let closeTabButton = document.createElement("button");
    closeTabButton.classList.add("close-btn")
    
    closeTabButton.onclick = (e) => {
        e.stopPropagation();
        closeTab(hostTab.id, host, windowId)
    }

    tabButtons.appendChild(pinTabBtn)
    tabButtons.appendChild(addToFavouritesButton)
    tabButtons.appendChild(closeTabButton)

    tab.appendChild(tabTitle);
    tab.appendChild(tabButtons);

    return tab;
}

//___________________GROUPED TAB EVENT HANDLERS_________________

function handleWindowListDragover(windowList, windowId){
    if(currentDraggingHostList != windowList ){
        if(document.querySelector(".visible-popup") != null) {
            document.querySelector(".visible-popup").classList.remove("visible-popup")
        }
        dragOverHostList = windowList;
        dragOverWindowId = windowId;
        windowList.parentNode.querySelector(".drop-here-popup").classList.add("visible-popup")
    }
    else{
        if(document.querySelector(".visible-popup") != null) {
            document.querySelector(".visible-popup").classList.remove("visible-popup")
        }
        dragOverHostList = null;
        dragOverWindowId = null;
    }
}

function handleHostItemDragstart(hostItem){
    hostItem.classList.add("dragging-host")
    currentDraggingHostList = hostItem.parentNode;
}

function handleHostItmDragend(host, hostItem, hostTabs){
    hostItem.classList.remove("dragging-host");
    if(document.querySelector(".visible-popup") != null) {
        document.querySelector(".visible-popup").classList.remove("visible-popup")
    }

    if(dragOverHostList != null){
        let windowId = parseInt(hostItem.parentNode.id.substring(7))

        global.ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs = 
        global.ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs.concat(global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.host == host))

        global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.host != host)
        
        let matchingHost = Array.from(dragOverHostList.getElementsByClassName("outer-list-item")).filter(x => x.id.includes(host))

        if(matchingHost.length > 0){
            let tabsToMove = hostItem.getElementsByClassName("inner-list-item")
            while(tabsToMove.length > 0){
                matchingHost[0].querySelector("ul").appendChild(tabsToMove[0]);
            }
            hostItem.remove();
        }
        else{
            dragOverHostList.appendChild(hostItem);
        }
        
        chrome.tabs.move(hostTabs.map(x => x.id), {index : -1, windowId : dragOverWindowId})
    }
}

function handleGroupedTabDragstart(tab, e){
    e.stopPropagation();
    tab.classList.add("dragging-grouped-tab")
    currentDraggingHostList = tab.parentNode.parentNode.parentNode;
}

function handleGroupedTabDragend(tab, e, host, hostTab){
    e.stopPropagation();
    tab.classList.remove("dragging-grouped-tab")
    if(document.querySelector(".visible-popup") != null) {
        document.querySelector(".visible-popup").classList.remove("visible-popup")
    }

    if(dragOverHostList != null){
        
        let matchingHost = Array.from(dragOverHostList.getElementsByClassName("outer-list-item")).filter(x => x.id.includes(host))
        
        let hostId = tab.parentNode.parentNode.id;
        let windowId = parseInt(tab.parentNode.parentNode.parentNode.id.substring(7))

        //DRY
        global.ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs.push(hostTab);
        global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.id != hostTab.id)
        //DRY END

        if(matchingHost.length > 0){
            matchingHost[0].querySelector("ul").appendChild(tab);
        }
        else{
            let hostItemCopy = tab.parentNode.parentNode.cloneNode(true);
            hostItemCopy.id += "_copy";
            hostItemCopy.querySelector("ul").innerHTML = ""
            hostItemCopy.querySelector("ul").appendChild(tab);
            dragOverHostList.appendChild(hostItemCopy);

            let hostTabs = global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs; 

            hostItemCopy.addEventListener("dragstart", () => handleHostItemDragstart(hostItemCopy))
            hostItemCopy.addEventListener("dragend", () => handleHostItmDragend(host, hostItemCopy, hostTabs))
        }

        if(document.getElementById(hostId).getElementsByClassName("inner-list-item").length == 0)
        {
            document.getElementById(hostId).remove();
            let listId = tab.parentNode.parentNode.id

            if(listId.includes("_copy")){
                tab.parentNode.parentNode.id = listId.substring(0, listId.length - 5)
            }
        }

        chrome.tabs.move(hostTab.id, {index : -1, windowId : dragOverWindowId})
    }
}

//_______________________________________________________________



export function initializeGroupedTabsSelectables() {
    global.grSel = new Selectables({
        elements: '.selectable',
        zone: '#current-tabs-wrapper',
        selectedClass: 'active',
        key: "ctrlKey",

        start: () => {
            
        },
        onSelect: (e) => {
            if (global.groupCreating) {
                e.classList.add("grouped");
            }
        },
        onDeselect: (e) => {
            if (e.classList.contains("inner-list-checkbox-label")) {
                let activeTabs = e.parentNode.getElementsByClassName("inner-list-item")
                for (let i = 0; i < activeTabs.length; i++) {
                    activeTabs[i].classList.remove("active");
                }
            }

            if (e.classList.contains("inner-list-item")) {
                let activeTabs = e.parentNode.getElementsByClassName("active");
                if (activeTabs.length === 0) {
                    e.parentNode.parentNode.querySelector(".inner-list-checkbox-label").classList.remove("active")
                }
            }

            e.classList.remove("grouped");
        },
        stop: () => {

            //wyłączenie duplikatów
            global.showDuplicates = false;

            let yellow = document.getElementsByClassName("yellow");

            if(yellow.length > 0){
                selectedTabsCounter.querySelector("span").innerText = 0;
            }

            while(yellow.length > 0){
                yellow[0].classList.remove("yellow")
            }
            //..........

            let activeHosts = document.getElementsByClassName("inner-list-checkbox-label active");

            for (let i = 0; i < activeHosts.length; i++) {

                let activeTabs = activeHosts[i].parentNode.querySelector("ul").getElementsByClassName("active");
                let allTabs = activeHosts[i].parentNode.querySelector("ul").getElementsByClassName("inner-list-item");

                if (activeTabs.length === 0) {
                    for (let i = 0; i < allTabs.length; i++) {
                        allTabs[i].classList.add("active");
                    }
                }
            }

            unactiveAllTabsInColection();

            let activeTabs = document.getElementsByClassName("inner-list-item active");

            for (let i = 0; i < activeTabs.length; i++) {

                let label = activeTabs[i].parentNode.parentNode.querySelector(".inner-list-checkbox-label")

                if (!label.classList.contains("active")) {
                    label.classList.add("active")
                }

                global.ungroupedWindows.filter(x => x.tabs.filter(y => y.id == activeTabs[i].id).length > 0)[0].tabs.filter(z => z.id == activeTabs[i].id)[0].selected = true;
            }

            if (activeTabs.length == 0) {

                global.groupCreating = false;
                tabsHooks.searchInput.parentNode.classList.remove("group-name");

                tabsHooks.showDuplicatesBtn.disabled = false;
                hideSelectedCounter(selectedTabsCounter);
                disableTabsButtons();

                tabsHooks.selectedTabsCounter.classList.remove("group-creation");
                resetGroupNameInput();
                hideGroupSelection();
            }
            else {
                if (!global.groupCreating) {
                    enableTabsButtons();
                }

                tabsHooks.selectedTabsCounter.style.visibility = "visible"
                tabsHooks.selectedTabsCounter.style.opacity = "1"
                tabsHooks.selectedTabsCounter.querySelector("span").innerText = activeTabs.length;

                tabsHooks.showDuplicatesBtn.innerText = "Show duplicates"
                tabsHooks.selectedTabsCounter.classList.remove("duplicates");
                
                tabsHooks.showDuplicatesBtn.disabled = true;
            }

        }
    });
}


function defineOnClickMuteGroupBtn(btn, hostTabs) {
    if (!btn.classList.contains("muted")) {
        for (let tab of hostTabs) {
            chrome.tabs.update(tab.id, { muted: true })
        }
        for(let btn of document.getElementById(hostTabs[0].id).parentNode.querySelectorAll(".mute-btn")){
            btn.classList.add("muted")
        }
        btn.classList.add("muted");
    }
    else {
        for (let tab of hostTabs) {
            chrome.tabs.update(tab.id, { muted: false });
        }
        for(let btn of document.getElementById(hostTabs[0].id).parentNode.querySelectorAll(".mute-btn")){
            btn.classList.remove("muted")
        }
        btn.classList.remove("muted");
    }
}

function closeAllTabsOfHost(host, windowId) {

    for (let tab of global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.host == host)) {
        chrome.tabs.remove(tab.id);
    }

    deleteHostElementFromDOM(host, windowId)
    chrome.storage.sync.remove(host);
}