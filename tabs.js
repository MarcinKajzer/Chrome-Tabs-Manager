let currentDraggingHostList;
let dragOverHostList;
let dragOverWindowId;

let numberOfDuplicates;

//..............................................................
//..................EXISTING ELEMENTS HOOKS.....................
//..............................................................

let hostsContainer = document.getElementById("all-windows");

let expandAllHostsBtn = document.getElementById("expand-all-hosts-btn");
let colapseAllHostsBtn = document.getElementById("colapse-all-hosts-btn");

let searchContainer = document.getElementById("search-container");
let searchInput = document.getElementById("search-input");

let selectedTabsCounter = document.getElementById("selected-tabs-counter");

let closeSelectedBtn = document.getElementById("close-selected-btn");
let createGroupBtn = document.getElementById("create-group-btn");

let showDuplicatesBtn = document.getElementById("show-duplicates-btn")

let pinnedWindowsSection = document.getElementById("pinned-windows-section")
let pinnedWindowsContainer = document.getElementById("all-pinned-windows")

let allHostsCheckboxes = hostsContainer.getElementsByClassName("inner-list-checkbox");
let allPinedHostsCheckboxes = pinnedWindowsContainer.getElementsByClassName("inner-list-checkbox");


//..............................................................
//...........BUILD UNGROUPED LIST OF TABS FUNCTIONS.............
//..............................................................

function buildAllUngroupedWindows(){
    let currentWindow = ungroupedWindows.filter(x => x.focused)[0];

    buildSingleUngroupedWindow(currentWindow, null)

    let index = 2;
    for(let window of ungroupedWindows.filter(x => !x.focused)){
        buildSingleUngroupedWindow(window, index, true);
        index++;
    }
}

function buildSingleUngroupedWindow(window, index){

    let windowContainer = buildWindowContainer(index, window)
    let windowList = windowContainer.querySelector(".window-list");
    
    for(let tab of window.tabs){
        windowList.appendChild(buildSingleUngroupedTab(tab, window.windowId))
    }

    if(window.pinned){
        pinnedWindowsContainer.appendChild(windowContainer);
    }
    else{
        hostsContainer.appendChild(windowContainer);
    }
}

function buildSingleUngroupedTab(hostTab, windowId){
    
    let tab = document.createElement("li");
    tab.classList.add("inner-list-item", "ungrouped", "selectable")

    if(hostTab.selected){
        tab.classList.add("active")
        if(groupCreating){
            tab.classList.add("grouped")
        }
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
                let indexOfElement = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.findIndex(x => x.id == hostTab.id);
                let elem = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.splice(indexOfElement, 1)
                ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.splice(result.index, 0, elem[0])
            })
        })
    }

    let addToFavouritesButton = document.createElement("button");
    addToFavouritesButton.classList.add("add-to-favourites-btn")
    addToFavouritesButton.classList.add("duplicate_" + hostTab.duplicateNumber )
    
    let index = favourities.findIndex(x => x.url === hostTab.url)
    
    if(index != -1){
        addToFavouritesButton.classList.add(favourities[index].id)
    }

    if(favourities.filter(x => x.url == hostTab.url).length > 0){
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


//_________________UNGROUPED TAB EVENT HANDLERS_________________

function handleUngroupedTabDragover(e, tab){
    e.preventDefault();

    dragOverWindowId = parseInt(tab.parentNode.id.substring(7));
    
    let draggingElement = document.querySelector(".dragging-ungrouped-tab")
    let enteredElement = tab.getBoundingClientRect()

    let centerY = enteredElement.top + enteredElement.height / 2;

    if (e.clientY > centerY) {
        tab.after(draggingElement)
    }
    else {
        tab.before(draggingElement);
    }
}

function hangleUngroupedTabDragstart(tab){

    tab.classList.add("dragging-ungrouped-tab");
    parentWindowId = parseInt(tab.parentNode.id.substring(7))
}

function handleUngroupedTabDragEnd(e, tab, hostTab){
    tab.classList.remove("dragging-ungrouped-tab")

    let targetWindowId = parseInt(e.target.parentNode.id.substring(7))
    let index = Array.prototype.indexOf.call(tab.parentNode.children, tab);
    chrome.tabs.move(parseInt(tab.id), {windowId: targetWindowId, index: index});

    if(targetWindowId != parentWindowId){
        ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs.splice(index, 0, hostTab)

        ungroupedWindows.filter(x => x.windowId == parentWindowId)[0].tabs = 
        ungroupedWindows.filter(x => x.windowId == parentWindowId)[0].tabs
                        .filter(y => y.id != hostTab.id)
    }
    else{
        let indexOfElement = ungroupedWindows.filter(x => x.windowId == targetWindowId)[0].tabs.indexOf(hostTab);
        let elem = ungroupedWindows.filter(x => x.windowId == targetWindowId)[0].tabs.splice(indexOfElement, 1)
        ungroupedWindows.filter(x => x.windowId == targetWindowId)[0].tabs.splice(index, 0, elem[0])
    }
}

function handleAddToFavouriteBtnClick(hostTab){
    //operować na kolekcji zamiast storage
    chrome.storage.sync.get("favourities", result => {
            
        favourities = result.favourities;
        
        let fav = new Object();
        fav.name = hostTab.title,
        fav.favIcon = hostTab.favIcon,
        fav.url = hostTab.url
        fav.id = "fav_" + Date.now();

        if(favourities != null){
            let indexOfRemovedFav = favourities.findIndex(x => x.url == fav.url);

            if(indexOfRemovedFav != -1){
                dragableContainer.removeChild(dragableContainer.childNodes[indexOfRemovedFav+1])

                for(let button of document.getElementsByClassName("duplicate_" + hostTab.duplicateNumber)){
                    button.classList.remove("favourite-tab")
                    button.classList.remove(fav.id)
                }

                favourities = favourities.filter(x => x.url != fav.url)
            }
            else{
                favourities.push(fav);
                for(let button of document.getElementsByClassName("duplicate_" + hostTab.duplicateNumber)){
                    button.classList.add("favourite-tab")
                    button.classList.add(fav.id)
                }

                createSingeFavourite(fav);
            }
            chrome.storage.sync.set({favourities: favourities})
        }
        else{
            chrome.storage.sync.set({favourities: [fav]})
            for(let button of document.getElementsByClassName("duplicate_" + hostTab.duplicateNumber)){
                button.classList.add("favourite-tab")
                button.classList.add(fav.id)
            }
            createSingeFavourite(fav);
        }
    });
}

//______________________________________________________________

//..............................................................
//.............BUILD GROUPED LIST OF TABS FUNCTIONS.............
//..............................................................

function buildAllGroupedWindows(){
    let currentWindow = groupedWindows.filter(x => x.focused)[0];

    buildSingleGroupedWindow(currentWindow, null, groupedWindows.length > 1)

    let index = 2;
    for(let window of groupedWindows.filter(x => !x.focused)){
        buildSingleGroupedWindow(window, index, true);
        index++;
    }
}

function buildSingleGroupedWindow(window, index, isMoreThenOneWindow) {

    let windowContainer = buildWindowContainer(index, window);
    
    if(isMoreThenOneWindow){
        let dropHerePopup = document.createElement("div")
        dropHerePopup.classList.add("drop-here-popup")
        dropHerePopup.innerText = "Drop here."
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

        if(expandedHosts.filter(x => x == host + window.windowId).length > 0){
            hostCheckbox.checked = true;
        }

        let hostLabel = document.createElement("label");
        hostLabel.classList.add("inner-list-checkbox-label");
        hostLabel.classList.add("selectable");

        if(hostTabs.filter(x => x.selected).length > 0){
            hostLabel.classList.add("active");

            if(groupCreating){
                hostLabel.classList.add("grouped")
            }
        }

        hostLabel.htmlFor = host + window.windowId;

        if (hostTabs.some(x => x.active)) {
            hostLabel.classList.add("selected-tab")
        }

        hostLabel.onclick = () => {
            if(expandedHosts.filter(x => x == host + window.windowId).length == 0){
                expandedHosts.push(host + window.windowId);
            }
            else{
                expandedHosts = expandedHosts.filter(x => x != host + window.windowId)
            }
            chrome.storage.sync.set({"expandedHosts": expandedHosts});
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
        closeAllTabsOfHostBtn.onclick = () => closeAllTabsOfHost(hostTabs, host, window.windowId)

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
            pinnedWindowsContainer.appendChild(windowContainer);
        }
        else{
            hostsContainer.appendChild(windowContainer);
        }
    }
}

function buildSingleTab(host, hostTab, hostItem, windowId) {
    let tab = document.createElement("li");
    tab.classList.add("inner-list-item")
    tab.classList.add("selectable")

    if(hostTab.selected){
        tab.classList.add("active");
        if(groupCreating){
            tab.classList.add("grouped")
        }
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
                let indexOfElement = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.findIndex(x => x.id == hostTab.id);
                let elem = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.splice(indexOfElement, 1)
                ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.splice(result.index, 0, elem[0])
            })
        })
    }


    let addToFavouritesButton = document.createElement("button");
    addToFavouritesButton.classList.add("add-to-favourites-btn")
    addToFavouritesButton.classList.add("duplicate_" + hostTab.duplicateNumber )
    
    let index = favourities.findIndex(x => x.url === hostTab.url)
    
    if(index != -1){
        addToFavouritesButton.classList.add(favourities[index].id)
    }

    if(favourities.filter(x => x.url == hostTab.url).length > 0){
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

        ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs = 
        ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs.concat(ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.host == host))

        ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.host != host)
        
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
        ungroupedWindows.filter(x => x.windowId == dragOverWindowId)[0].tabs.push(hostTab);
        ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.id != hostTab.id)
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

            let hostTabs = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs; 

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



//..............................................................
//...........................FUNCTIONS..........................
//..............................................................

// function getPosition(string, subString, index) {
//     return string.split(subString, index).join(subString).length;
// }

function handleDuplicates(e){
    numberOfDuplicates = 0;

    if(!showDuplicates){
       showDuplicate(e);
    }
    else{
        closeDuplicates(e);
    }
}

function showDuplicate(e){
    for(let i = 0; i <= duplicateNumber; i++){
        let elements = document.getElementsByClassName("duplicate_" + i);
        if(elements.length > 1){
            for(let el of elements){
                el.closest(".inner-list-item").classList.add("yellow")
                numberOfDuplicates++;
            }
            numberOfDuplicates--
            console.log(elements[0].closest(".inner-list-item"))
            try{
                elements[0].closest(".outer-list-item").classList.add("yellow")
            }
            catch{}

            showSelectedCounter();
            selectedTabsCounter.querySelector("span").innerText = numberOfDuplicates;
            selectedTabsCounter.classList.add("duplicates")

            e.target.innerText = "Close duplicates"
            showDuplicates = true;
        }
    }
}

function closeDuplicates(e){
    for(let i = 0; i <= duplicateNumber; i++){
        let elements = document.getElementsByClassName("duplicate_" + i);
        if(elements.length > 1){
            try{
                elements[0].closest(".outer-list-item").classList.remove("yellow")
            }
            catch{}

            elements[0].closest(".inner-list-item").classList.remove("yellow")

            for(let i = 1; i<elements.length; i++){

                let tabId = parseInt(elements[i].closest(".inner-list-item").id)

                let windowId = parseInt(elements[i].closest(".window-list").id.substring(7));
                ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.id != tabId);

                chrome.tabs.remove(tabId);
                elements[i].closest(".inner-list-item").classList.add("removed");
            }

            setTimeout(() => {
                for(let i = 1; i<elements.length; i++){
                    elements[i].closest(".inner-list-item").remove();
                }
            }, 200);

            hideSelectedCounter();
            selectedTabsCounter.classList.remove("duplicates")

            e.target.innerText = "Show duplicates"
            showDuplicates = false;
        }
    }
}


function enableTabsButtons(){
    closeSelectedBtn.disabled = false;
    createGroupBtn.disabled = false;
}
  
function disableTabsButtons(){
    closeSelectedBtn.disabled = true;
    createGroupBtn.disabled = true;
}

function resetGroupNameInput(){
    groupCreating = false;
    searchInput.parentNode.classList.remove("group-name");
}

function removeGroupedClassFromAllElements(){
    let allActiveElements = document.getElementsByClassName("grouped");
    while(allActiveElements.length > 0){
        allActiveElements[0].classList.remove('grouped');
    }
}
 
function hideGroupSelection(){
    document.getElementById("expand-select-group").checked = false;
    document.getElementById("create-new-group-btn").checked = false;
    searchInput.style.display = "block";
    document.getElementById("search-header").style.display = "none"

    let inputs = document.getElementById("inputs").querySelectorAll("input");
    for(let input of inputs){
        input.checked = false;
    }

    document.getElementById("select-group-label").innerText = "Select group";
    selectedGroups = [];
}

function closeAllTabsOfHost(hostTabs, host, windowId) {
    for (let tab of hostTabs) {
        chrome.tabs.remove(tab.id);
    }

    deleteHostElementFromDOM(host, windowId)
    chrome.storage.sync.remove(host);
}

function closeTab(tabId, host, windowId, deleteHost = true) {

    ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.id != tabId);

    chrome.tabs.remove(tabId);

    let currentTab = document.getElementById(tabId);
    let currentHostTabsList = currentTab.parentNode;
    let windowList = currentTab.closest(".window-list")

    currentTab.classList.add("removed");
    setTimeout(() => {
        currentTab.remove();
        if (currentHostTabsList.childNodes.length == 0 && deleteHost) {
            deleteHostElementFromDOM(host, windowId);
        }
        if(windowList.childNodes.length == 0){
            currentHostTabsList.parentNode.remove();
            ungroupedWindows = ungroupedWindows.filter(x => x.windowId != windowId);
        }
    }, 200);
}

function deleteHostElementFromDOM(host, windowId) {
    let hostElement = document.getElementById("host_" + host + "_window" + windowId)
    
    hostElement.classList.add("remove-host");
    setTimeout(() => {
        hostElement.remove();
        chrome.storage.sync.remove(host);
    }, 300);
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

function buildWindowContainer(index, window){
    let windowContainer = document.createElement("div")
    windowContainer.classList.add("window-container")

    let windowLabel = document.createElement("div")
    windowLabel.classList.add("window-label");

    let windowName = document.createElement("span");
    if(window.focused){
        windowName.innerText = "Current window";
    }
    else{
        windowName.innerText = "Window " + index;
    }
    
    let buttonsWrapper = document.createElement("div")

    let pinWindowBtn = document.createElement("button")
    if(window.pinned){
        pinWindowBtn.innerText = "Unpin"
    }
    else{
        pinWindowBtn.innerText = "Pin"
    }
    
    pinWindowBtn.classList.add("pin-btn")
    pinWindowBtn.onclick = () => {

        if(windowContainer.parentNode.id == "all-windows"){
            pinnedWindowsSection.classList.add("shown")
            document.querySelector("#app").style.width = "700px";
            document.querySelector("main").style.width = "1750px";
    
            pinnedWindowsContainer.appendChild(windowContainer)
            pinWindowBtn.innerText = "Unpin"

            ungroupedWindows.filter(x => x.windowId == window.windowId)[0].pinned = true;
        }
        else{
            hostsContainer.appendChild(windowContainer);
            pinWindowBtn.innerText = "Pin"

            if(pinnedWindowsContainer.childNodes.length == 0){
                pinnedWindowsSection.classList.remove("shown")
                document.querySelector("#app").style.width = "350px";
                document.querySelector("main").style.width = "1400px";
            }

            ungroupedWindows.filter(x => x.windowId == window.windowId)[0].pinned = false;
        }
    }

    let closeWindowBtn = document.createElement("button")
    closeWindowBtn.classList.add("close-btn")
    closeWindowBtn.onclick = () => {
        chrome.windows.remove(window.windowId);
        ungroupedWindows = ungroupedWindows.filter(x => x.windowId != window.windowId);
        windowContainer.remove();
    }

    let windowList = document.createElement("ul")
    windowList.classList.add("window-list", "outer-list")
    windowList.id = "window_" + window.windowId;

    buttonsWrapper.appendChild(pinWindowBtn)
    buttonsWrapper.appendChild(closeWindowBtn)
    
    windowLabel.appendChild(windowName);
    windowLabel.appendChild(buttonsWrapper);
    
    windowContainer.appendChild(windowLabel);
    windowContainer.appendChild(windowList);

    return windowContainer;
}

let grSel;

function initializeGroupedTabsSelectables() {
    grSel = new Selectables({
        elements: '.selectable',
        zone: '#all-windows',
        selectedClass: 'active',
        key: "ctrlKey",

        start: () => {
            showDuplicates = false;

            let yellow = document.getElementsByClassName("yellow");

            if(yellow.length > 0){
                selectedTabsCounter.querySelector("span").innerText = 0;
            }

            while(yellow.length > 0){
                yellow[0].classList.remove("yellow")
            }
            showDuplicatesBtn.innerText = "Show duplicates"
            selectedTabsCounter.classList.remove("duplicates");
            
            showDuplicatesBtn.disabled = true;
        },
        onSelect: (e) => {
            if (groupCreating) {
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

                ungroupedWindows.filter(x => x.tabs.filter(y => y.id == activeTabs[i].id).length > 0)[0].tabs.filter(z => z.id == activeTabs[i].id)[0].selected = true;
            }

            if (activeTabs.length == 0) {

                groupCreating = false;
                searchInput.parentNode.classList.remove("group-name");

                showDuplicatesBtn.disabled = false;
                hideSelectedCounter();
                disableTabsButtons();
            }
            else {
                if (!groupCreating) {
                    enableTabsButtons();
                }

                selectedTabsCounter.style.visibility = "visible"
                selectedTabsCounter.style.opacity = "1"
                selectedTabsCounter.querySelector("span").innerText = activeTabs.length;
            }

        }
    });
}

let ungrSel;

function initializeUngroupedTabsSelectables() {
    ungrSel = new Selectables({
        elements: '.selectable',
        zone: '#all-windows',
        selectedClass: 'active',
        key: "ctrlKey",

        start: () => {
            showDuplicates = false;

            let yellow = document.getElementsByClassName("yellow");

            if(yellow.length > 0){
                selectedTabsCounter.querySelector("span").innerText = 0;
            }

            while(yellow.length > 0){
                yellow[0].classList.remove("yellow")
            }
            showDuplicatesBtn.innerText = "Show duplicates"
            selectedTabsCounter.classList.remove("duplicates");
            
            showDuplicatesBtn.disabled = true;
        },
        onSelect: (e) => {
            if (groupCreating) {
                e.classList.add("grouped");
            }
        },
        onDeselect: (e) => {
            e.classList.remove("grouped");
        },
        stop: () => {

            unactiveAllTabsInColection();

            let activeTabs = document.getElementsByClassName("selectable active");
            
            if (activeTabs.length == 0) {

                groupCreating = false;
                searchInput.parentNode.classList.remove("group-name");

                showDuplicatesBtn.disabled = false;
                hideSelectedCounter();
                disableTabsButtons();
            }
            else {
                if (!groupCreating) {
                    enableTabsButtons();
                }

                selectedTabsCounter.style.visibility = "visible"
                selectedTabsCounter.style.opacity = "1"
                selectedTabsCounter.querySelector("span").innerText = activeTabs.length;
            }

            for(let tab of activeTabs){
                ungroupedWindows.filter(x => x.tabs.filter(y => y.id == tab.id).length > 0)[0].tabs.filter(z => z.id == tab.id)[0].selected = true;
            }
        }
    });
}

function unactiveAllTabsInColection(){
    for(let win of ungroupedWindows){
        for(let tab of win.tabs){
            tab.selected = false;
        }
    }
}

//..............................................................
//................BUTTONS AND INPUT ACTIONS.....................
//..............................................................

showDuplicatesBtn.onclick = (e) => handleDuplicates(e);

expandAllHostsBtn.onclick = () => {
    checkAllCheckboxes(allHostsCheckboxes);
    checkAllCheckboxes(allPinedHostsCheckboxes);
}
colapseAllHostsBtn.onclick = () => {
    uncheckAllCheckboxes(allHostsCheckboxes);
    uncheckAllCheckboxes(allPinedHostsCheckboxes);
}

closeSelectedBtn.onclick = () => {

    let activeVisibleTabs = document.querySelectorAll(".inner-list-item.active:not(.display-none)");

    for(let tab of activeVisibleTabs){
        chrome.tabs.remove(parseInt(tab.id));
        deleteTabElementFromDOM("active", tab.id);
    }

    hideSelectedCounter();
    disableTabsButtons();
}

createGroupBtn.onclick = () => {

    searchInput.style.display = "none";
    document.getElementById("search-header").style.display = "block"

    groupCreating = true;

    searchContainer.classList.add("group-name");
    selectedTabsCounter.classList.add("group-creation");

    let allActiveElements = document.querySelectorAll(".active");
    for(let el of allActiveElements){
        el.classList.add("grouped")
    }

    disableTabsButtons();
}

selectedTabsCounter.addEventListener("click", () => {
    
    if(groupCreating){
        selectedTabsCounter.classList.remove("group-creation");
        resetGroupNameInput();
        enableTabsButtons();
        hideGroupSelection();
    }
    else if(showDuplicates){
        //DRY schowaj duplikaty
        let yellow = document.getElementsByClassName("yellow");
        while(yellow.length > 0){
            yellow[0].classList.remove("yellow")
        }
        showDuplicatesBtn.innerText = "Show duplicates"
        selectedTabsCounter.classList.remove("duplicates");
        hideSelectedCounter();
        showDuplicates = false;
    }
    else{
        handleSelectedCounterClick("active");
        hideSelectedCounter();
        disableTabsButtons();
        showDuplicatesBtn.disabled = false;

        unactiveAllTabsInColection();
    }

    removeGroupedClassFromAllElements();
})

searchInput.addEventListener("focus", () => {
    searchContainer.classList.add("active-search")
  })

  searchInput.addEventListener("blur", () => {
    searchContainer.classList.remove("active-search")
  })

  
  searchInput.addEventListener("input", (e) => {

    let allTabs = document.getElementsByClassName("inner-list-item")
    let allHosts = document.getElementsByClassName("outer-list-item");

    for(let i = 0; i < allTabs.length; i++){
      if(!allTabs[i].innerText.toLowerCase().includes(e.target.value.toLowerCase())){
        allTabs[i].classList.add("display-none")
      }
      else{
        allTabs[i].classList.remove("display-none")
      }
    }

    for(let i = 0; i < allHosts.length; i++){

      if(allHosts[i].querySelector(".inner-list-checkbox-label").innerText.toLowerCase().includes(e.target.value.toLowerCase())){
        allHosts[i].classList.remove("display-none");

        let tabs = allHosts[i].getElementsByClassName("inner-list-item");
        for(let j = 0; j < tabs.length; j++){
          tabs[j].classList.remove("display-none");
        }
      }
      else if(allHosts[i].getElementsByClassName("inner-list-item").length == allHosts[i].getElementsByClassName("display-none").length){
        allHosts[i].classList.add("display-none");
      }
      else{
        allHosts[i].classList.remove("display-none");
      }
    }

    //pokaż no results gdy nie ma wyników
    // if(allHosts.length == document.getElementsByClassName("outer-list-item display-none").length){
    //   document.getElementById("no-results-info").style.display = "block";
    // }
    // else{
    //   document.getElementById("no-results-info").style.display = "none";
    // }

    //zmniejsz liczbę wybranych po search
    let activeVisibleTabs = document.querySelectorAll(".inner-list-item.active:not(.display-none)");
    selectedTabsCounter.querySelector("span").innerText = activeVisibleTabs.length;

    if(activeVisibleTabs.length > 0){
      enableTabsButtons();

      selectedTabsCounter.style.visibility = "visible"
      selectedTabsCounter.style.opacity = "1"
    }
    else{
      disableTabsButtons();

      selectedTabsCounter.style.opacity = "0"
        setTimeout(() => {
          selectedTabsCounter.style.visibility = "hidden"
        }, 200)
    }
  })

//..............................................................
//................DEFINE MULTISELECT FOR GROUPS.................
//..............................................................

function createMultiselect(){

    let allGroups = groups.map(x => x.name)
  
    let inputsList = document.getElementById("inputs");
    let newGroupNameInput = document.getElementById("new-group-name-input");
    let confirmGroupCreationBtn = document.getElementById("confirm-group-creation-btn");
    confirmSavingTabsBtn = document.getElementById("confirm-saving-tabs-btn");
  
    for(let group of groups){
        addGroupToSelectList(inputsList, group.name, group.tabs.length)
    }
  
    newGroupNameInput.addEventListener("input", (e) => {
        if(allGroups.includes(e.target.value.trim())){
          confirmGroupCreationBtn.disabled = true
        }
        else if(e.target.value.length > 0){
            confirmGroupCreationBtn.disabled = false;
        }
        else{
            confirmGroupCreationBtn.disabled = true
        }
    })
  
    confirmGroupCreationBtn.addEventListener("click", (e) => {
        
      gr = new Object();
      gr.name = newGroupNameInput.value;
      gr.color = "blue";
      gr.tabs = [];
      groups.push(gr)
  
      if(groups != null){
        chrome.storage.sync.set({groups: groups})
      }
      else{
        chrome.storage.sync.set({groups: [groups]})
      }
      
      //upewnić się, że zapisało się poprawnie i wtedy dopiero wykonać co poniżej 
      addGroupToSelectList(inputsList, newGroupNameInput.value)
  
      e.target.disabled = true;
      newGroupNameInput.value = ""

      buildSingleGroup(gr)
    })
  
    confirmSavingTabsBtn.addEventListener("click", () => {
  
        let activeVisibleTabs = document.querySelectorAll(".inner-list-item.active:not(.display-none)");
        let newTabs = [];
        let uniqueTabs = 0;

        for(let tab of activeVisibleTabs){
            let tabInfo = ungroupedWindows.find(x => x.tabs.find(y => y.id == tab.id) != null).tabs.find(z => z.id == tab.id);
            
            let ob = new Object();
            ob.favIcon = tabInfo.favIcon;
            ob.title = tabInfo.title;
            ob.url = tabInfo.url;
            ob.host = tabInfo.host;
            ob.id = String(tabInfo.id) + Date.now();

            newTabs.push(ob);
        }

        for(let groupName of selectedGroups){
            let groupIndex = groups.findIndex(x => x.name == groupName)
            let tabs = groups[groupIndex].tabs;
            let groupList = document.getElementById("group_" + groupName).querySelector("ul")

            for(let tab of newTabs){
                if(tabs.findIndex(x => x.url == tab.url) == -1){
                    tabs.push(tab)
                    groupList.appendChild(buildSingleGroupTab(groupName, tab));
                    uniqueTabs++;
                }
            }

            groups[groupIndex].tabs = tabs;
            chrome.storage.sync.set({groups: groups})

            //do osobnej funkcji
            let pagesCounter = document.getElementById(groupName + "-input").nextElementSibling.querySelectorAll("span")[1]
            let numberOfTabsInGroup = parseInt(pagesCounter.innerText.substring(0,2));
            if(!isNaN(numberOfTabsInGroup)){
                numberOfTabsInGroup = parseInt(pagesCounter.innerText.substring(0,2)) + uniqueTabs;
            }
            else{
                numberOfTabsInGroup = uniqueTabs;
            }
           
            let counterText;
            if(numberOfTabsInGroup == 0  || numberOfTabsInGroup == undefined){
                counterText = "empty"
            }
            else if(numberOfTabsInGroup == 1){
                counterText = "1 page"
            }
            else{
                counterText = numberOfTabsInGroup + " pages"
            }

            pagesCounter.innerText = counterText;

            uniqueTabs = 0;
        }

        resetGroupNameInput();
        removeGroupedClassFromAllElements()
        enableTabsButtons();

        selectedTabsCounter.classList.remove("group-creation");

        hideGroupSelection();
    })
  }

  function defineEventHandling(input){
    let selectGroupsLabel = document.getElementById("select-group-label");
  
    input.addEventListener("change", (e) => {
        let groupName = e.target.parentNode.querySelector("label").querySelector("span").innerText;
        if(e.target.checked){
            selectedGroups.push(groupName)
        }
        else{
            let index = selectedGroups.indexOf(groupName);
            selectedGroups.splice(index,1);
        }
  
        confirmSavingTabsBtn.disabled = false;
  
        if(selectedGroups.length == 0){
            selectGroupsLabel.innerText = "Select group";
            confirmSavingTabsBtn.disabled = true;
        }
        else if(selectedGroups.length > 3){
            selectGroupsLabel.innerText = selectedGroups.length + " groups"
        }
        else{
            selectGroupsLabel.innerText = selectedGroups.join([separator = ', '])
        }
    })
  }
  
  function addGroupToSelectList(inputsContainer, group, quaitity){
    
    let wrapper = document.createElement("div");
        
    let input = document.createElement("input")
    input.type = "checkbox"
    input.id = group + "-input"
  
    let counterText;
    if(quaitity == 0  || quaitity == undefined){
      counterText = "empty"
    }
    else if(quaitity == 1){
      counterText = "1 page"
    }
    else{
      counterText = quaitity + " pages"
    }
  
    let label = document.createElement("label")
    label.htmlFor = group + "-input"
  
    let groupName = document.createElement("span")
    groupName.innerText = group;
    
    let groupTabsCounter = document.createElement("span")
    groupTabsCounter.innerText = counterText
  
    label.appendChild(groupName)
    label.appendChild(groupTabsCounter);
  
    wrapper.appendChild(input)
    wrapper.appendChild(label)
  
    inputsContainer.appendChild(wrapper);
  
    defineEventHandling(input)
  }