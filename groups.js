const colors = [
  { 
    name: "grey",
    code: "rgb(218,220,224)"
  },
  { 
    name: "blue",
    code: "rgb(138,180,248)"
  },
  { 
    name: "red",
    code: "rgb(242,139,130)"
  },
  { 
    name: "yellow",
    code: "rgb(253,214,99)"
  },
  { 
    name: "green",
    code: "rgb(129,201,149)"
  },
  { 
    name: "pink",
    code: "rgb(255,139,203)"
  },
  { 
    name: "purple",
    code: "rgb(197,138,249)"
  },
  { 
    name: "cyan",
    code: "rgb(120,217,236)"
  },
  { 
    name: "orange",
    code: "rgb(252,173,112)"
  }
]

//..............................................................
//..................EXISTING ELEMENTS HOOKS.....................
//..............................................................

let groupsContainer = document.getElementById("groups-list");

let expandAllGroupsBtn = document.getElementById("expand-all-groups-btn")
let colapseAllGroupsBtn = document.getElementById("collapse-all-groups-btn");

let selectedGroupsCounter = document.getElementById("selected-groups-counter");

let removeSelectedBtn = document.getElementById("remove-selected-btn");

let allGroupsCheckboxes = document.getElementById("groups-list").getElementsByClassName("inner-list-checkbox");

//..............................................................
//...........................FUNCTIONS..........................
//..............................................................

function enableGroupsButtons(){
  removeSelectedBtn.disabled = false;
}

function disableGroupsButtons(){
  removeSelectedBtn.disabled = true;
}

//..............................................................
//................BUTTONS AND INPUT ACTIONS.....................
//..............................................................

expandAllGroupsBtn.onclick = () => checkAllCheckboxes(allGroupsCheckboxes)
colapseAllGroupsBtn.onclick = () =>uncheckAllCheckboxes(allGroupsCheckboxes)

removeSelectedBtn.onclick = () => {

  let activeVisibleTabs = document.querySelectorAll(".inner-list-item.selected-group:not(.display-none)");

  for(let tab of activeVisibleTabs){
      
      let currentTab = document.getElementById(tab.id);
      let currentHostTabsList = currentTab.parentNode;
      let groupName = currentHostTabsList.parentNode.id.substring(6) 

      let deleteGroup = groups.find(x => x.name == groupName);
      let deleteGroupIndex = groups.indexOf(deleteGroup);
      let remainTabs = groups[deleteGroupIndex].tabs.filter(y => y.id != tab.id);
      
      if(remainTabs.length == 0){
        groups.splice(deleteGroupIndex, 1);
      }
      else{
        groups[deleteGroupIndex].tabs = remainTabs;
      }

      deleteTabElementFromDOM("selected-group", tab.id)
  }

  chrome.storage.sync.set({groups: groups})

  hideSelectedCounter(selectedGroupsCounter);
  disableGroupsButtons();
}


selectedGroupsCounter.addEventListener("click", () => {
  handleSelectedCounterClick("selected-group")
  hideSelectedCounter(selectedGroupsCounter);
  disableGroupsButtons();
})


//..............................................................


async function buildGroups() {

  if (groups == null || groups.length == 0) {
    return;
  }

  for (const group of groups) {
    buildSingleGroup(group);
  }
}

function buildSingleGroup(group){
  let groupItem = document.createElement("li");
  groupItem.id = "group_" + group.name;
  groupItem.classList.add("outer-list-item");

  let groupCheckbox = document.createElement("input");
  groupCheckbox.type = "checkbox";
  groupCheckbox.classList.add("inner-list-checkbox")
  groupCheckbox.id = group.name;

  chrome.storage.sync.get(group.name, function (result) {
    groupCheckbox.checked = Object.values(result)[0];
  });

  let groupLabel = document.createElement("label");
  groupLabel.classList.add("inner-list-checkbox-label");
  groupLabel.classList.add("selectable");
  groupLabel.htmlFor = group.name;

  groupLabel.onclick = () => {
    let obj = new Object();
    obj[group.name] = !groupCheckbox.checked;
    chrome.storage.sync.set(obj);
  }

  let groupInfo = document.createElement("div");

  let favIcon = document.createElement("span");
  favIcon.classList.add("group-color-div");
  favIcon.style.background = colors.filter(x => x.name == group.color)[0].code;
 
  let groupName = document.createElement("span");
  groupName.innerHTML = group.name.length > 30 ? group.name.substring(0, 27) + " ..." : group.name;

  let groupButtons = document.createElement("div");

  let editGroupBtn = document.createElement("button");
  editGroupBtn.classList.add("edit-group-btn")
  editGroupBtn.onclick = (e) => {
    e.stopPropagation();
    showGroupOptions(group, groupName, favIcon);
  }
  editGroupBtn.title = "Edit group."

  let openAllGroupInNewWindowBtn = document.createElement("button");
  openAllGroupInNewWindowBtn.classList.add("open-all-in-new-window-btn")
  openAllGroupInNewWindowBtn.onclick = (e) => {
    e.stopPropagation();
    openAllTabsOfGroupInNewWindow(group.tabs)
  }
  openAllGroupInNewWindowBtn.title = "Open in new window."

  let openAllGroupBtn = document.createElement("button");
  openAllGroupBtn.classList.add("open-all-btn")
  openAllGroupBtn.onclick = (e) => {
    e.stopPropagation();
    openAllTabsOfGroup(group.tabs)
  }
  openAllGroupBtn.title = "Open in this window."

  let openAllGroupAndMergeBtn = document.createElement("button");
  openAllGroupAndMergeBtn.classList.add("open-all-and-merge-btn")
  openAllGroupAndMergeBtn.onclick = (e) => {
    e.stopPropagation();
    openAllTabsOfGroupAndMerge(group.tabs, group.name, group.color)
  }
  openAllGroupAndMergeBtn.title = "Open in this window as group."

  let openAllGroupIncognitoBtn = document.createElement("button");
  openAllGroupIncognitoBtn.classList.add("open-all-incognito-btn")
  openAllGroupIncognitoBtn.onclick = (e) => {
    e.stopPropagation();
    openAllTabsOfGroupInNewWindow(group.tabs, true)
  }
  openAllGroupIncognitoBtn.title = "Open in incognito window."

  let deleteGroupBtn = document.createElement("button");
  deleteGroupBtn.classList.add("delete-btn")
  deleteGroupBtn.onclick = () => deleteGroup(group.name)
  deleteGroupBtn.title = "Remove group."

  groupInfo.appendChild(favIcon);
  groupInfo.appendChild(groupName);

  groupButtons.appendChild(editGroupBtn);
  groupButtons.appendChild(openAllGroupBtn);
  groupButtons.appendChild(openAllGroupAndMergeBtn);
  groupButtons.appendChild(openAllGroupInNewWindowBtn);
  groupButtons.appendChild(openAllGroupIncognitoBtn);
  groupButtons.appendChild(deleteGroupBtn);

  groupLabel.appendChild(groupInfo);
  groupLabel.appendChild(groupButtons);

  groupItem.appendChild(groupCheckbox);
  groupItem.appendChild(groupLabel);

  let groupTabsList = document.createElement("ul");

  for (let groupTab of group.tabs) {
    groupTabsList.appendChild(buildSingleGroupTab(group.name, groupTab));
  }

  groupItem.appendChild(groupTabsList);
  groupsContainer.appendChild(groupItem);
}


function buildSingleGroupTab(groupName, groupTab) {
  let tab = document.createElement("li");
  tab.classList.add("inner-list-item")
  tab.classList.add("selectable")
  tab.id = groupTab.id;

  let tabInfo = document.createElement("div")

  let tabFavIcon = document.createElement("img");
  tabFavIcon.classList.add("favIcon");
  tabFavIcon.src = groupTab.favIcon != null && groupTab.favIcon != "" ? groupTab.favIcon : "assets/default_favicon.png";

  let tabTitle = document.createElement("span");
  tabTitle.innerHTML = groupTab.title.length > 26 ? groupTab.title.substring(0, 23) + " ..." : groupTab.title;
  tabTitle.onclick = () => {
    chrome.tabs.create({ url: groupTab.url })
  }
  tabTitle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if(e.button == 1){
      chrome.tabs.create({active: false, url: groupTab.url })
    }
  })

  let tabButtons = document.createElement("div");

  let deleteTabBtn = document.createElement("button");
  deleteTabBtn.classList.add("delete-btn")
  deleteTabBtn.onclick = () => deleteTab(groupName, groupTab.id)
  deleteTabBtn.title = "Remove tab."

  let openInNewWindowBtn = document.createElement("button");
  openInNewWindowBtn.classList.add("open-all-in-new-window-btn")
  openInNewWindowBtn.onclick = () => openInNewWindow(groupTab.url)
  openInNewWindowBtn.title = "Open in new window."

  let openIncognitoBtn = document.createElement("button");
  openIncognitoBtn.classList.add("open-all-incognito-btn")
  openIncognitoBtn.onclick = () => openInNewWindow(groupTab.url, true)
  openIncognitoBtn.title = "Open in incognito window."


  tabButtons.appendChild(openInNewWindowBtn)
  tabButtons.appendChild(openIncognitoBtn)
  tabButtons.appendChild(deleteTabBtn)

  tabInfo.appendChild(tabFavIcon);
  tabInfo.appendChild(tabTitle);

  tab.appendChild(tabInfo);
  tab.appendChild(tabButtons);

  return tab;
}

//.then ? usunąć z drzewa dopiero gdy uda się akcja na storage ? 
function deleteGroup(groupName) {
  deleteGroupElemetFromDOM(groupName)

  let deleteGroup = groups.find(x => x.name == groupName);
  let deleteGroupIndex = groups.indexOf(deleteGroup);

  groups.splice(deleteGroupIndex, 1);
  chrome.storage.sync.set({ groups: groups })
}

function deleteGroupElemetFromDOM(groupName) {
  let groupElement = document.getElementById("group_" + groupName);

  groupElement.classList.add("remove-host");
  setTimeout(() => {
    groupElement.remove();
  }, 300);
}

function deleteTab(groupName, tabId) {
  
  let deleteGroup = groups.find(x => x.name == groupName);
  let deleteGroupIndex = groups.indexOf(deleteGroup);
  let remainTabs = groups[deleteGroupIndex].tabs.filter(y => y.id != tabId);

  groups[deleteGroupIndex].tabs = remainTabs;
  chrome.storage.sync.set({ groups: groups })
  
  let currentTab = document.getElementById(tabId);

  currentTab.classList.add("removed");
  setTimeout(() => {
    currentTab.remove();
  }, 200);


  //do osobnej funkcji
  let pagesCounter = document.getElementById(groupName + "-input").nextElementSibling.querySelectorAll("span")[1]
  let numberOfTabsInGroup = parseInt(pagesCounter.innerText.substring(0,2)) - 1;

  
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

}

function openAllTabsOfGroup(tabs) {
  for (let t of tabs) {
    chrome.tabs.create({ url: t.url, active: false })
  }
}

async function openAllTabsOfGroupAndMerge(tabs, groupName, color){
  
  let tabsToGroup = [];

  for(let tab of tabs){
    tabsToGroup.push(await chrome.tabs.create({url: tab.url, active: false}))
  }
  
  chrome.tabs.group({ tabIds: tabsToGroup.map(x => x.id)}, (groupId) => {
    chrome.tabGroups.update(groupId, { collapsed: false, title: groupName, color: color });
  });
}

function openAllTabsOfGroupInNewWindow(tabs, incognito = false){
  chrome.windows.create({url: tabs.map(x => x.url), incognito: incognito})
}

function openInNewWindow(url, incognito = false){
  chrome.windows.create({url: url, incognito: incognito})
}

function initializeGroupsSelectable() {
  new Selectables({
    elements: '.selectable',
    zone: '#groups-list',
    selectedClass: 'selected-group',
    key: "ctrlKey",

    onDeselect: (e) => {
      if (e.classList.contains("inner-list-checkbox-label")) {
        let selectedTabs = e.parentNode.getElementsByClassName("inner-list-item")
        for (let i = 0; i < selectedTabs.length; i++) {
          selectedTabs[i].classList.remove("selected-group");
        }
      }

      if (e.classList.contains("inner-list-item")) {
        let selectedTabs = e.parentNode.getElementsByClassName("selected-group");
        if (selectedTabs.length === 0) {
          e.parentNode.parentNode.querySelector(".inner-list-checkbox-label").classList.remove("selected-group")
        }
      }
    },

    stop: () => {

      let selectedGroups = document.getElementsByClassName("inner-list-checkbox-label selected-group");

      for (let i = 0; i < selectedGroups.length; i++) {

        let selectedTabs = selectedGroups[i].parentNode.querySelector("ul").getElementsByClassName("selected-group");
        let allTabs = selectedGroups[i].parentNode.querySelector("ul").getElementsByClassName("inner-list-item");

        if (selectedTabs.length === 0) {
          for (let i = 0; i < allTabs.length; i++) {
            allTabs[i].classList.add("selected-group");
          }
        }
      }

      let selectedTabs = document.getElementsByClassName("inner-list-item selected-group");

      for (let i = 0; i < selectedTabs.length; i++) {

        let label = selectedTabs[i].parentNode.parentNode.querySelector(".inner-list-checkbox-label")

        if (!label.classList.contains("selected-group")) {
          label.classList.add("selected-group")
        }
      }

      if (selectedTabs.length == 0) {

        hideSelectedGroupsCounter();
        disableGroupsButtons();
      }
      else {

        enableGroupsButtons();

        selectedGroupsCounter.style.visibility = "visible"
        selectedGroupsCounter.style.opacity = "1"
        selectedGroupsCounter.querySelector("span").innerText = selectedTabs.length;
      }
    }
  });
}

function showGroupOptions(group, groupLabel, groupColorDiv){
  
  //remove previous
  let x = document.querySelector(".group-options-container")
  if(x != null){
    x.remove();
  }
  
  let groupIndex = groups.indexOf(group)
  //build

  let optionsContaier = document.createElement("div")
  optionsContaier.classList.add("group-options-container")

  let closeBtn = document.createElement("button")
  closeBtn.classList.add("close-group-edition-btn")
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    optionsContaier.remove();
  })
  
 
  let groupNameInput = document.createElement("input")
  groupNameInput.classList.add("group-name-input")
  groupNameInput.value = group.name
  groupNameInput.addEventListener("input", (e) => {

      if(groups.findIndex(x => x.name == e.target.value) == -1){
        groups[groupIndex].name = e.target.value;
        groupLabel.innerText = e.target.value;

        chrome.storage.sync.set({groups: groups})
      }
  })


  let colorsContainer = document.createElement("div")
  colorsContainer.classList.add("colors-container")

  for(let color of colors){
    let wrapper = document.createElement("div")

    let colorInput = document.createElement("input")
    colorInput.type = "radio"
    colorInput.classList.add("color-input")
    colorInput.id = color.name + "_color"
    colorInput.name = "color"

    if(group.color == color.name){
      colorInput.checked = true;
    }

    colorInput.addEventListener("change", (e) => {
      e.stopPropagation();
      if(e.target.checked == true){
        groups[groupIndex].color = color.name;
        groupColorDiv.style.background = color.code;
        chrome.storage.sync.set({groups: groups})
      }
    })

    let colorLabel = document.createElement("label");
    colorLabel.htmlFor = colorInput.id;
    colorLabel.style.background = color.code

    wrapper.appendChild(colorInput);
    wrapper.appendChild(colorLabel);

    colorsContainer.appendChild(wrapper)
  }

  optionsContaier.appendChild(closeBtn)
  optionsContaier.appendChild(groupNameInput)
  optionsContaier.appendChild(colorsContainer);

  //show

  
  groupColorDiv.parentNode.parentNode.parentNode.appendChild(optionsContaier);
}


