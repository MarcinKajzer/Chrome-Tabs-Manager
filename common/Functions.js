import { global } from "./Global.js"


export function hideSelectedCounter(counter){
    counter.querySelector("span").innerText = ""
    counter.style.opacity = "0"
    setTimeout(() => {
      counter.style.visibility = "hidden"
    }, 200)
  }
  
export function showSelectedCounter(counter){
    counter.style.visibility = "visible"
    counter.style.opacity = "1"
}

export function checkAllCheckboxes(checkboxes){
    for(let i = 0; i < checkboxes.length; i++){
        checkboxes[i].checked = true;

        if(global.expandedHosts.filter(x => x == checkboxes[i].id).length == 0){
            global.expandedHosts.push(checkboxes[i].id);
        }
    }
    chrome.storage.sync.set({"expandedHosts": global.expandedHosts});
}

export function uncheckAllCheckboxes(checkboxes){
    for(let i = 0; i < checkboxes.length; i++){
        checkboxes[i].checked = false;

        global.expandedHosts = [];
    }
    chrome.storage.sync.set({"expandedHosts": global.expandedHosts}); 
}

export function deleteTabElementFromDOM(className, tabId){

    let currentTab = document.getElementById(tabId);
    let currentHostTabsList = currentTab.parentNode;

    currentTab.classList.add("removed");
    setTimeout(() => {
        currentTab.remove();

        if(global.grouped){
        if(currentHostTabsList.getElementsByClassName(className).length == 0){
            currentHostTabsList.parentNode.querySelector(".inner-list-checkbox-label").classList.remove(className);
        }
        if(document.querySelectorAll(".inner-list-item:not(.display-none)").length == 0){
            currentHostTabsList.parentNode.classList.add("display-none");
        }
        if(currentHostTabsList.childNodes.length == 0){
            currentHostTabsList.parentNode.querySelector(".inner-list-checkbox-label").classList.add("remove-host");
            
            setTimeout(() => {
            currentHostTabsList.parentNode.remove();

            let currentHostName = currentHostTabsList.parentNode.querySelector("input").id;
            chrome.storage.sync.remove(currentHostName);
            }, 300);
        }
        }
    }, 200);
}
  
export function handleSelectedCounterClick(className){
    let activeVisibleTabs = document.querySelectorAll(".inner-list-item." + className +":not(.display-none)");
        
    for(let currentTab of activeVisibleTabs){
        
        currentTab.classList.remove(className, "grouped");
        let currentHostTabsList = currentTab.parentNode;
        
        if(className == "active" ){
        if(global.grouped && currentHostTabsList.getElementsByClassName(className).length == 0){
            currentHostTabsList.parentNode.querySelector(".inner-list-checkbox-label").classList.remove(className, "grouped");
        }
        }
        else{
        if(currentHostTabsList.getElementsByClassName(className).length == 0){
            currentHostTabsList.parentNode.querySelector(".inner-list-checkbox-label").classList.remove(className, "grouped");
        }
        }
    }
}