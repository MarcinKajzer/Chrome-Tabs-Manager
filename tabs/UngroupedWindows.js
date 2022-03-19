import {global} from "../common/Global.js"
import { tabsHooks, favouritiesHooks } from "../common/hooks.js"
import { buildWindowContainer, unactiveAllTabsInColection, enableTabsButtons, disableTabsButtons, closeTab, hideGroupSelection } from "./Common.js";
import { createSingeFavourite} from "../favourities/Favourites.js"

let parentWindowId;
let dragOverWindowId;
let isDraggingTabPinned;


export function buildAllUngroupedWindows(){
    let currentWindow = global.ungroupedWindows.filter(x => x.focused)[0];

    buildSingleUngroupedWindow(currentWindow, null)

    let index = 2;
    for(let window of global.ungroupedWindows.filter(x => !x.focused)){
        buildSingleUngroupedWindow(window, index, true);
        index++;
    }
}

export function buildSingleUngroupedWindow(window, index){

    let windowContainer = buildWindowContainer(index, window)
    let windowList = windowContainer.querySelector(".window-list");
    
    for(let tab of window.tabs){
        windowList.appendChild(buildSingleUngroupedTab(tab, window.windowId))
    }

    if(window.pinned){
        tabsHooks.pinnedWindowsContainer.appendChild(windowContainer);
    }
    else{
        tabsHooks.allWindowsContainer.appendChild(windowContainer);
    }
}

function buildSingleUngroupedTab(hostTab, windowId){
    
    let tab = document.createElement("li");
    tab.classList.add("inner-list-item", "ungrouped", "selectable")

    if(hostTab.selected){
        tab.classList.add("active")
        if(global.groupCreating){
            tab.classList.add("grouped")
        }
    }

    if(hostTab.shownDuplicate){
        tab.classList.add("yellow");
    }

    tab.draggable = true;
    tab.id = hostTab.id;

    tab.addEventListener("dragover", (e) => handleUngroupedTabDragover(e, tab))
    tab.addEventListener("dragstart", () => hangleUngroupedTabDragstart(tab));
    tab.addEventListener("dragend", (e) => handleUngroupedTabDragEnd(e, tab, hostTab));

    tab.onclick = () => {
        chrome.tabs.update(hostTab.id, { selected: true });
    }

    if (hostTab.active) {
        tab.classList.add("selected-tab")
    }

    let tabInfo = document.createElement("div")

    let tabFavIcon = document.createElement("img");
    tabFavIcon.classList.add("favIcon");
    tabFavIcon.src = hostTab.favIcon != null && hostTab.favIcon != "" ? hostTab.favIcon : "assets/default_favicon.png";

    let tabTitle = document.createElement("span");
    tabTitle.innerHTML = hostTab.title.length > 29 ? hostTab.title.substring(0, 26) + " ..." : hostTab.title;
    
    let tabButtons = document.createElement("div");

    if (hostTab.audible) {
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
            }
            else {
                chrome.tabs.update(hostTab.id, { muted: false })
                e.target.classList.remove("muted");
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
                    tab.parentNode.insertBefore(tab, tab.parentNode.children[result.index]);
                    pinTabBtn.classList.add("unpin-tab")
                }
                else{
                    tab.parentNode.insertBefore(tab, tab.parentNode.children[result.index+1])
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
    //DRY END..............

    let closeTabButton = document.createElement("button");
    closeTabButton.classList.add("close-btn")
    
    closeTabButton.onclick = (e) => {
        e.stopPropagation();
        closeTab(hostTab.id, null, windowId, false)
    }

    tabInfo.appendChild(tabFavIcon)
    tabInfo.appendChild(tabTitle)

    tabButtons.appendChild(pinTabBtn)
    tabButtons.appendChild(addToFavouritesButton)
    tabButtons.appendChild(closeTabButton)

    tab.appendChild(tabInfo)
    tab.appendChild(tabButtons);

    return tab;
}


//_________________EVENT HANDLERS_________________

function handleUngroupedTabDragover(e, tab){
    e.preventDefault();

    dragOverWindowId = parseInt(tab.parentNode.id.substring(7));
    
    let draggingElement = document.querySelector(".dragging-ungrouped-tab")
    let enteredElement = tab.getBoundingClientRect()

    let centerY = enteredElement.top + enteredElement.height / 2;

    if(dragOverWindowId == parentWindowId){
        if(isDraggingTabPinned && e.target.closest(".inner-list-item").querySelector(".unpin-tab") != null || 
            !isDraggingTabPinned && e.target.closest(".inner-list-item").querySelector(".unpin-tab") == null){
            if (e.clientY > centerY) {
                tab.after(draggingElement)
            }
            else {
                tab.before(draggingElement);
            }
        }
    }
    else{
        if(isDraggingTabPinned && e.target.closest(".inner-list-item").querySelector(".unpin-tab") == null ||
            !isDraggingTabPinned){
            if (e.clientY > centerY) {
                tab.after(draggingElement)
            }
            else {
                tab.before(draggingElement);
            }
        }
    }
}

function hangleUngroupedTabDragstart(tab){

    tab.classList.add("dragging-ungrouped-tab");
    parentWindowId = parseInt(tab.parentNode.id.substring(7))

    isDraggingTabPinned = !(tab.querySelector(".unpin-tab") == null)
}

function handleUngroupedTabDragEnd(e, tab, hostTab){
    tab.classList.remove("dragging-ungrouped-tab")

    let targetWindowId = parseInt(e.target.parentNode.id.substring(7))
    let index = Array.prototype.indexOf.call(tab.parentNode.children, tab) - 1;
    chrome.tabs.move(parseInt(tab.id), {windowId: targetWindowId, index: index});

    if(targetWindowId != parentWindowId){
        global.ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs.splice(index, 0, hostTab)

        global.ungroupedWindows.filter(x => x.windowId == parentWindowId)[0].tabs = 
        global.ungroupedWindows.filter(x => x.windowId == parentWindowId)[0].tabs
                               .filter(y => y.id != hostTab.id)

        
        tab.querySelector(".pin-tab-btn").classList.remove("unpin-tab");  
    }
    else{
        let indexOfElement = global.ungroupedWindows.filter(x => x.windowId == targetWindowId)[0].tabs.indexOf(hostTab);
        let elem = global.ungroupedWindows.filter(x => x.windowId == targetWindowId)[0].tabs.splice(indexOfElement, 1)
        global.ungroupedWindows.filter(x => x.windowId == targetWindowId)[0].tabs.splice(index, 0, elem[0])
    }
}

function handleAddToFavouriteBtnClick(hostTab){
   
    let fav = new Object();
    fav.name = hostTab.title,
    fav.favIcon = hostTab.favIcon,
    fav.url = hostTab.url
    fav.id = "fav_" + Date.now();

    if(global.favourities != null){
        let indexOfRemovedFav = global.favourities.findIndex(x => x.url == fav.url);

        if(indexOfRemovedFav != -1){
            favouritiesHooks.dragableContainer.removeChild(favouritiesHooks.dragableContainer.childNodes[indexOfRemovedFav+1])

            for(let button of document.getElementsByClassName("duplicate_" + hostTab.duplicateNumber)){
                button.classList.remove("favourite-tab")
                button.classList.remove(fav.id)
            }

            global.favourities = global.favourities.filter(x => x.url != fav.url)
        }
        else{
            global.favourities.push(fav);
            for(let button of document.getElementsByClassName("duplicate_" + hostTab.duplicateNumber)){
                button.classList.add("favourite-tab")
                button.classList.add(fav.id)
            }

            createSingeFavourite(fav);
        }
        chrome.storage.sync.set({favourities: global.favourities})
    }
    else{
        chrome.storage.sync.set({favourities: [fav]})
        for(let button of document.getElementsByClassName("duplicate_" + hostTab.duplicateNumber)){
            button.classList.add("favourite-tab")
            button.classList.add(fav.id)
        }
        createSingeFavourite(fav);
    }
}

//______________________________________________________________


export function initializeUngroupedTabsSelectables() {
    global.ungrSel = new Selectables({
        elements: '.window-list .selectable',
        zone: '#app',
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
            e.classList.remove("grouped");
        },
        stop: () => {

            global.showDuplicates = false;

            let yellow = document.getElementsByClassName("yellow");

            if(yellow.length > 0){
                tabsHooks.selectedTabsCounter.querySelector("span").innerText = 0;
            }

            while(yellow.length > 0){
                yellow[0].classList.remove("yellow")
            }

            unactiveAllTabsInColection();

            let activeTabs = document.getElementsByClassName("selectable active");
            
            if (activeTabs.length == 0) {

                global.groupCreating = false;
                tabsHooks.searchInput.parentNode.classList.remove("group-name");

                tabsHooks.showDuplicatesBtn.disabled = false;
                hideSelectedCounter(tabsHooks.selectedTabsCounter);
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

            for(let tab of activeTabs){
                global.ungroupedWindows.filter(x => x.tabs.filter(y => y.id == tab.id).length > 0)[0].tabs.filter(z => z.id == tab.id)[0].selected = true;
            }
        }
    });
}