import { global } from "../common/Global.js";
import { tabsHooks, favouritiesHooks } from "../common/hooks.js";
import { createSingeFavourite} from "../favourities/Favourites.js"

export function groupUngroupedTabs(){

    console.log(global.ungroupedWindows)
    global.groupedWindows = [];
    for(let window of global.ungroupedWindows){
  
      let groupedTabs = [];
  
      for(let tab of window.tabs){
        
        let ob = {
          id: tab.id,
          favIcon: tab.favIcon,
          title: tab.title,
          audible: tab.audible,
          active: tab.active,
          muted: tab.muted,
          url: tab.url,
          duplicateNumber: tab.duplicateNumber,
          host: tab.host,
          pinned: tab.pinned,
          selected: tab.selected,
          shownDuplicate: tab.shownDuplicate
        }
  
        if(groupedTabs[tab.host] == undefined){
          groupedTabs[tab.host] = [ob]
          
          chrome.storage.sync.get(tab.host, result => {
            if(Object.keys(result).length === 0){
              let obj = new Object();
              obj[tab.host] = false; 
              chrome.storage.sync.set(obj);
            }
          })
        }
        else{
          groupedTabs[tab.host].push(ob)
        }
      }
  
      let ob = new Object();
      ob.hosts = groupedTabs;
      ob.windowId = window.windowId;
      ob.focused = window.focused;
      ob.pinned = window.pinned;
  
      global.groupedWindows.push(ob);
    }
  }
  
  
export function mapAllOpenTabs(tabs){
    let t = [];

    for(let tab of tabs){

        let url;
        let domain;
        try{
        domain = (new URL(tab.url));
        url = tab.url;
        }
        catch{
        domain = (new URL(tab.pendingUrl));
        url = tab.pendingUrl
        }

        let ob = {
        id: tab.id,
        favIcon: tab.favIconUrl,
        title: tab.title,
        audible: tab.audible,
        active: tab.active,
        muted: tab.mutedInfo.muted,
        url: url,
        duplicateNumber: global.duplicateNumber,
        host: domain.hostname,
        pinned: tab.pinned
        }

        let duplcatesInAllWindows = global.ungroupedWindows.filter(x => x.tabs.filter(y => y.url == tab.url).length > 0)
        let duplicates = t.filter(x => x.url == tab.url);

        if(duplcatesInAllWindows.length > 0){
        ob.duplicateNumber = duplcatesInAllWindows[0].tabs.filter(x => x.url == tab.url)[0].duplicateNumber;
        }
        else if(duplicates.length > 0){
        ob.duplicateNumber = duplicates[0].duplicateNumber;
        }

        t.push(ob)

        global.duplicateNumber++
    }

    return t;
}

export function resetGroupNameInput(){
    global.groupCreating = false;
    tabsHooks.searchInput.parentNode.classList.remove("group-name");
}

export function removeGroupedClassFromAllElements(){
    let allActiveElements = document.getElementsByClassName("grouped");
    while(allActiveElements.length > 0){
        allActiveElements[0].classList.remove('grouped');
    }
}

export function hideGroupSelection(){
    document.getElementById("expand-select-group").checked = false;
    document.getElementById("create-new-group-btn").checked = false;
    tabsHooks.searchInput.style.display = "block";
    tabsHooks.addToGroupContainer.style.display = "none"

    let inputs = document.getElementById("inputs").querySelectorAll("input");
    for(let input of inputs){
        input.checked = false;
    }

    document.getElementById("select-group-label").innerText = "Select group";
    global.selectedGroups = [];
}

export function buildWindowContainer(index, window){
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

    windowName.onclick = () => {
        chrome.windows.update(window.windowId, {focused: true})
    }
    
    let buttonsWrapper = document.createElement("div")

    let pinWindowBtn = document.createElement("button")
    pinWindowBtn.classList.add("pin-btn")
    if(window.pinned){
        pinWindowBtn.classList.add("unpin");
    }
    
    pinWindowBtn.classList.add("pin-btn")
    pinWindowBtn.onclick = () => {

        if(windowContainer.parentNode.id == "all-windows"){
            tabsHooks.pinnedWindowsSection.classList.add("shown")
            document.querySelector("#app").style.width = "700px";
            document.querySelector("main").style.width = "1750px";
            document.querySelector("#current-tabs-wrapper").style.width = "700px";
    
            tabsHooks.pinnedWindowsContainer.appendChild(windowContainer)
            pinWindowBtn.classList.add("unpin")
            global.ungroupedWindows.filter(x => x.windowId == window.windowId)[0].pinned = true;
        }
        else{
            tabsHooks.allWindowsContainer.appendChild(windowContainer);
            pinWindowBtn.classList.remove("unpin")

            if(tabsHooks.pinnedWindowsContainer.childNodes.length == 0){
                tabsHooks.pinnedWindowsSection.classList.remove("shown")
                document.querySelector("#app").style.width = "350px";
                document.querySelector("main").style.width = "1400px";
                document.querySelector("#current-tabs-wrapper").style.width = "350px";
            }

            global.ungroupedWindows.filter(x => x.windowId == window.windowId)[0].pinned = false;
        }
    }

    let closeWindowBtn = document.createElement("button")
    closeWindowBtn.classList.add("close-btn")
    closeWindowBtn.onclick = () => {
        chrome.windows.remove(window.windowId);
        global.ungroupedWindows = global.ungroupedWindows.filter(x => x.windowId != window.windowId);
        windowContainer.remove();
    }

    let windowList = document.createElement("ul")
    windowList.classList.add("window-list", "outer-list")
    windowList.id = "window_" + window.windowId;

    let noResultInfo = document.createElement("p")
    noResultInfo.classList.add("no-results-info")
    noResultInfo.innerText = "No results."

    buttonsWrapper.appendChild(pinWindowBtn)
    buttonsWrapper.appendChild(closeWindowBtn)
    
    windowLabel.appendChild(windowName);
    windowLabel.appendChild(buttonsWrapper);
    
    windowList.appendChild(noResultInfo)

    windowContainer.appendChild(windowLabel);
    windowContainer.appendChild(windowList);

    return windowContainer;
}

export function unactiveAllTabsInColection(){
    for(let win of global.ungroupedWindows){
        for(let tab of win.tabs){
            tab.selected = false;
        }
    }
}

export function hideDuplicatesInCollection(){
    for(let win of global.ungroupedWindows){
        for(let tab of win.tabs){
            tab.shownDuplicate = false;
        }
    }
}

export function enableTabsButtons(){
    tabsHooks.closeSelectedBtn.disabled = false;
    tabsHooks.createGroupBtn.disabled = false;
}
  
export function disableTabsButtons(){
    tabsHooks.closeSelectedBtn.disabled = true;
    tabsHooks.createGroupBtn.disabled = true;
}

export function closeTab(tabId, host, windowId, deleteHost = true) {

    global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.id != tabId);

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
        if(windowList.querySelectorAll(".inner-list-item").length == 0){
            windowList.closest(".window-container").remove();
            global.ungroupedWindows = global.ungroupedWindows.filter(x => x.windowId != windowId);
        }
    }, 200);

    groupUngroupedTabs();
}

export function handleAddToFavouriteBtnClick(hostTab){
   
    let fav = new Object();
    fav.name = hostTab.title,
    fav.favIcon = hostTab.favIcon,
    fav.url = hostTab.url
    fav.id = "fav_" + Date.now();

    if(global.favourities != null){
        let indexOfRemovedFav = global.favourities.findIndex(x => x.url == fav.url);
        
        if(indexOfRemovedFav != -1){
            console.log(indexOfRemovedFav)
            console.log(favouritiesHooks.dragableContainer.childNodes[indexOfRemovedFav])
            favouritiesHooks.dragableContainer.removeChild(favouritiesHooks.dragableContainer.childNodes[indexOfRemovedFav])

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

export function deleteHostElementFromDOM(host, windowId) {
    let hostElement = document.getElementById("host_" + host + "_window" + windowId)
    
    hostElement.classList.add("remove-host");
    setTimeout(() => {
        hostElement.remove();
        chrome.storage.sync.remove(host);
    }, 300);
}