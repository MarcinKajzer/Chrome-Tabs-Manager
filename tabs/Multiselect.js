import { global } from "../common/Global.js";
import { tabsHooks } from "../common/hooks.js";
import { buildSingleGroup, buildSingleGroupTab } from "../groups/Groups.js";
import { resetGroupNameInput, removeGroupedClassFromAllElements, enableTabsButtons, hideGroupSelection } from "./Common.js"

let inputsList = document.getElementById("inputs");
let newGroupNameInput = document.getElementById("new-group-name-input");
let confirmGroupCreationBtn = document.getElementById("confirm-group-creation-btn");
let confirmSavingTabsBtn = document.getElementById("confirm-saving-tabs-btn");

export function createMultiselect(){

    let allGroups = global.groups.map(x => x.name)

    for(let group of global.groups){
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

    confirmGroupCreationBtn.onclick = (e) => {
        
        let gr = new Object();
        gr.name = newGroupNameInput.value;
        gr.color = "blue";
        gr.tabs = [];
        global.groups.push(gr)

        if(global.groups != null){
            chrome.storage.sync.set({groups: global.groups})
        }
        else{
            chrome.storage.sync.set({groups: [global.groups]})
        }
        
        //upewnić się, że zapisało się poprawnie i wtedy dopiero wykonać co poniżej 
        addGroupToSelectList(inputsList, newGroupNameInput.value)

        e.target.disabled = true;
        newGroupNameInput.value = ""

        buildSingleGroup(gr)
    }

    confirmSavingTabsBtn.addEventListener("click", () => {

        let activeVisibleTabs = document.querySelectorAll(".inner-list-item.active:not(.display-none)");
        let newTabs = [];
        let uniqueTabs = 0;

        for(let tab of activeVisibleTabs){
            let tabInfo = global.ungroupedWindows.find(x => x.tabs.find(y => y.id == tab.id) != null).tabs.find(z => z.id == tab.id);
            
            let ob = new Object();
            ob.favIcon = tabInfo.favIcon;
            ob.title = tabInfo.title;
            ob.url = tabInfo.url;
            ob.host = tabInfo.host;
            ob.id = String(tabInfo.id) + Date.now();

            newTabs.push(ob);
        }

        for(let groupName of global.selectedGroups){
            let groupIndex = global.groups.findIndex(x => x.name == groupName)
            let tabs = global.groups[groupIndex].tabs;
            let groupList = document.getElementById("group_" + groupName).querySelector("ul")

            document.getElementById("group_" + groupName).querySelector(".no-constant-buttons").style.display = "block"
            document.getElementById("group_" + groupName).querySelector(".group-is-empty-info").style.display = "none";

            for(let tab of newTabs){
                if(tabs.findIndex(x => x.url == tab.url) == -1){
                    tabs.push(tab)
                    groupList.appendChild(buildSingleGroupTab(groupName, tab));
                    uniqueTabs++;
                }
            }

            global.groups[groupIndex].tabs = tabs;
            chrome.storage.sync.set({groups: global.groups})

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

        tabsHooks.selectedTabsCounter.classList.remove("group-creation");

        hideGroupSelection();
    })
}

function defineEventHandling(input){
    let selectGroupsLabel = document.getElementById("select-group-label");

    input.addEventListener("change", (e) => {
        let groupName = e.target.parentNode.querySelector("label").querySelector("span").innerText;
        if(e.target.checked){
            global.selectedGroups.push(groupName)
        }
        else{
            let index = global.selectedGroups.indexOf(groupName);
            global.selectedGroups.splice(index,1);
        }

        confirmSavingTabsBtn.disabled = false;

        if(global.selectedGroups.length == 0){
            selectGroupsLabel.innerText = "Select group";
            confirmSavingTabsBtn.disabled = true;
        }
        else if(global.selectedGroups.length > 3){
            selectGroupsLabel.innerText = global.selectedGroups.length + " groups"
        }
        else{
            selectGroupsLabel.innerText = global.selectedGroups.join(', ')
        }
    })
}

export function addGroupToSelectList(inputsContainer, group, quaitity){

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