import { global } from "../common/Global.js"
import { tabsHooks } from "../common/hooks.js"
import { showSelectedCounter, hideSelectedCounter, handleSelectedCounterClick, checkAllCheckboxes, uncheckAllCheckboxes } from "../common/Functions.js"
import { disableTabsButtons, unactiveAllTabsInColection } from "./Common.js"
import { buildAllGroupedWindows, initializeGroupedTabsSelectables } from "./GroupedWindows.js"
import { buildAllUngroupedWindows, initializeUngroupedTabsSelectables, buildSingleUngroupedWindow } from "./UngroupedWindows.js"
import { groupUngroupedTabs, mapAllOpenTabs, enableTabsButtons, resetGroupNameInput, removeGroupedClassFromAllElements, hideGroupSelection } from "./Common.js"

//..............................................................
//.....................EVENT LISTENERS..........................
//..............................................................

tabsHooks.createNewWindowBtn.onclick = () => {
    buildNewWindow();
}

tabsHooks.groupTabsBtn.onclick = () => {

    tabsHooks.allWindowsContainer.innerHTML = "";
    tabsHooks.pinnedWindowsContainer.innerHTML = ""

    if(global.grouped){
        buildAllUngroupedWindows();
        global.grouped = false;
        tabsHooks.groupTabsBtn.classList.remove("ungroup-tabs")
        tabsHooks.groupTabsBtn.title = "Group tabs."
        tabsHooks.colapseAllHostsBtn.disabled = true;
        tabsHooks.expandAllHostsBtn.disabled = true;

        initializeUngroupedTabsSelectables();
        global.grSel.disable();
    }
    else{
        groupUngroupedTabs();
        buildAllGroupedWindows();
        global.grouped = true;
        tabsHooks.groupTabsBtn.classList.add("ungroup-tabs")
        tabsHooks.groupTabsBtn.title = "Ungroup tabs."
        tabsHooks.colapseAllHostsBtn.disabled = false;
        tabsHooks.expandAllHostsBtn.disabled = false;

        initializeGroupedTabsSelectables();
        global.ungrSel.disable();
    }
}

tabsHooks.showDuplicatesBtn.onclick = (e) => handleDuplicates(e);

tabsHooks.expandAllHostsBtn.onclick = () => {
    checkAllCheckboxes(tabsHooks.allHostsCheckboxes);
    checkAllCheckboxes(tabsHooks.allPinedHostsCheckboxes);
}

tabsHooks.colapseAllHostsBtn.onclick = () => {
    uncheckAllCheckboxes(tabsHooks.allHostsCheckboxes);
    uncheckAllCheckboxes(tabsHooks.allPinedHostsCheckboxes);
}

tabsHooks.closeSelectedBtn.onclick = () => {

    let activeVisibleTabs = document.querySelectorAll(".inner-list-item.active:not(.display-none)");

    for(let tab of activeVisibleTabs){
        chrome.tabs.remove(parseInt(tab.id));
        deleteTabElementFromDOM("active", tab.id);
    }

    hideSelectedCounter(tabsHooks.selectedTabsCounter);
    disableTabsButtons();
}

tabsHooks.createGroupBtn.onclick = () => {

    tabsHooks.searchInput.style.display = "none";
    tabsHooks.addToGroupContainer.style.display = "block"

    global.groupCreating = true;

    tabsHooks.searchContainer.classList.add("group-name");
    tabsHooks.selectedTabsCounter.classList.add("group-creation");

    let allActiveElements = document.querySelectorAll(".active");
    for(let el of allActiveElements){
        el.classList.add("grouped")
    }

    disableTabsButtons();
}

tabsHooks.selectedTabsCounter.onclick = () => {
    
    if(global.groupCreating){
        tabsHooks.selectedTabsCounter.classList.remove("group-creation");
        resetGroupNameInput();
        enableTabsButtons();
        hideGroupSelection();
    }
    else if(global.showDuplicates){
        //DRY schowaj duplikaty
        let duplicatedTabs = document.getElementsByClassName("duplicated-tab");
        while(duplicatedTabs.length > 0){
            duplicatedTabs[0].classList.remove("duplicated-tab")
        }
        tabsHooks.showDuplicatesBtn.innerText = "Show duplicates"
        tabsHooks.selectedTabsCounter.classList.remove("duplicates");
        hideSelectedCounter(tabsHooks.selectedTabsCounter);
        global.showDuplicates = false;

        hideDuplicatesInCollection();
    }
    else{
        handleSelectedCounterClick("active");
        hideSelectedCounter(tabsHooks.selectedTabsCounter);
        disableTabsButtons();
        tabsHooks.showDuplicatesBtn.disabled = false;

        unactiveAllTabsInColection();
    }

    removeGroupedClassFromAllElements();
}

tabsHooks.searchInput.addEventListener("focus", () => {
    tabsHooks.searchContainer.classList.add("active-search")
  })

  tabsHooks.searchInput.addEventListener("blur", () => {
    tabsHooks.searchContainer.classList.remove("active-search")
})

tabsHooks.searchInput.addEventListener("input", (e) => {

    let allTabs = document.querySelectorAll(".window-container .inner-list-item")
    let allHosts = document.querySelectorAll(".window-container .outer-list-item");

    for(let i = 0; i < allTabs.length; i++){
        if(!allTabs[i].innerText.toLowerCase().includes(e.target.value.toLowerCase()) &&
            !global.ungroupedWindows.filter(x => x.tabs.filter(y => y.id == allTabs[i].id).length > 0)[0].tabs
                            .filter(z => z.id == allTabs[i].id)[0].host.toLowerCase()
                            .includes(e.target.value.toLowerCase())
            ){
            allTabs[i].classList.add("display-none")
        }
        else{
            allTabs[i].classList.remove("display-none")
        }
    }

    if(global.grouped){
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
    }

    let noResultsInfos = document.getElementsByClassName("no-results-info")

    for(let noRes of noResultsInfos){
        if(noRes.parentNode.querySelector("li:not(.display-none)") == null){
            noRes.style.display = "block";
        }
        else{
            noRes.style.display = "none";
        }
    }

    let activeVisibleTabs = document.querySelectorAll(".inner-list-item.active:not(.display-none)");
    tabsHooks.selectedTabsCounter.querySelector("span").innerText = activeVisibleTabs.length;

    if(activeVisibleTabs.length > 0){
        enableTabsButtons();

        tabsHooks.selectedTabsCounter.style.visibility = "visible"
        tabsHooks.selectedTabsCounter.style.opacity = "1"
    }
    else{
        disableTabsButtons();

        tabsHooks.selectedTabsCounter.style.opacity = "0"
        setTimeout(() => {
            tabsHooks.selectedTabsCounter.style.visibility = "hidden"
        }, 200)
    }
})
 
//..............................................................
//...........................FUNCTIONS..........................
//..............................................................

async function buildNewWindow(){
    let newWindow = await chrome.windows.create({focused: false});
    
    chrome.tabs.query({windowId: newWindow.id}, (tabs) => {
    
        let o = new Object();
        o.windowId = newWindow.id;
        o.focused = newWindow.focused;
        o.tabs = mapAllOpenTabs(tabs);
        global.ungroupedWindows.push(o);

        buildSingleUngroupedWindow(o, global.ungroupedWindows.length)
    })
}

function handleDuplicates(e){
    global.numberOfDuplicates = 0;

    if(!global.showDuplicates){
       showDuplicate(e);
    }
    else{
        closeDuplicates(e);
    }
}

function showDuplicate(e){
    for(let i = 0; i <= global.duplicateNumber; i++){
        let elements = document.getElementsByClassName("duplicate_" + i);
        if(elements.length > 1){
            for(let el of elements){
                el.closest(".inner-list-item").classList.add("duplicated-tab")
                global.numberOfDuplicates++;

                let tabId = el.closest(".inner-list-item").id;
                global.ungroupedWindows.filter(x => x.tabs.filter(y => y.id == tabId).length > 0)[0].tabs.filter(z => z.id == tabId)[0].shownDuplicate = true;
            }
            global.numberOfDuplicates--

            try{
                elements[0].closest(".outer-list-item").classList.add("duplicated-tab")
            }
            catch{}

            showSelectedCounter(tabsHooks.selectedTabsCounter);
            tabsHooks.selectedTabsCounter.querySelector("span").innerText = global.numberOfDuplicates;
            tabsHooks.selectedTabsCounter.classList.add("duplicates")

            e.target.innerText = "Close duplicates"
            global.showDuplicates = true;
        }
    }
}

function closeDuplicates(e){
    for(let i = 0; i <= global.duplicateNumber; i++){
        let elements = document.getElementsByClassName("duplicate_" + i);
        if(elements.length > 1){
            try{
                elements[0].closest(".outer-list-item").classList.remove("duplicated-tab")
            }
            catch{}

            elements[0].closest(".inner-list-item").classList.remove("duplicated-tab")

            for(let i = 1; i<elements.length; i++){

                let tabId = parseInt(elements[i].closest(".inner-list-item").id)

                let windowId = parseInt(elements[i].closest(".window-list").id.substring(7));
                global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs = global.ungroupedWindows.filter(x => x.windowId == windowId)[0].tabs.filter(y => y.id != tabId);

                chrome.tabs.remove(tabId);
                elements[i].closest(".inner-list-item").classList.add("removed");
            }

            setTimeout(() => {
                for(let i = 1; i<elements.length; i++){
                    elements[i].closest(".inner-list-item").remove();
                }
            }, 200);

            hideSelectedCounter(tabsHooks.selectedTabsCounter);
            tabsHooks.selectedTabsCounter.classList.remove("duplicates")

            e.target.innerText = "Show duplicates"
            global.showDuplicates = false;
        }
    }
}