//..............................................................
//..................EXISTING ELEMENTS HOOKS.....................
//..............................................................

let hostsContainer = document.getElementById("main-list");

let expandAllHostsBtn = document.getElementById("expand-all-hosts-btn");
let colapseAllHostsBtn = document.getElementById("colapse-all-hosts-btn");

let searchContainer = document.getElementById("search-container");
let searchInput = document.getElementById("search-input");

let selectedTabsCounter = document.getElementById("selected-tabs-counter");

let closeSelectedBtn = document.getElementById("close-selected-btn");
let createGroupBtn = document.getElementById("create-group-btn");

let showDuplicatesBtn = document.getElementById("show-duplicates-btn")

let allHostsCheckboxes = document.getElementById("main-list").getElementsByClassName("inner-list-checkbox");

//..............................................................
//...........................FUNCTIONS..........................
//..............................................................

showDuplicatesBtn.onclick = (e) => findDuplicates(e);

function findDuplicates(e){
    let duplicatesNumber = 0;

    if(!showDuplicates){
        for(let i = 0; i <= duplicateNumber; i++){
            let elements = document.getElementsByClassName("duplicate_" + i);
            if(elements.length > 1){
                for(let el of elements){
                    el.parentNode.parentNode.classList.add("yellow")
                    duplicatesNumber++;
                }
                duplicatesNumber--
                elements[0].parentNode.parentNode.parentNode.parentNode.classList.add("yellow")
    
                selectedTabsCounter.style.visibility = "visible"
                selectedTabsCounter.style.opacity = "1"
                selectedTabsCounter.querySelector("span").innerText = duplicatesNumber;
                selectedTabsCounter.classList.add("duplicates")
    
                e.target.innerText = "Close duplicates"
                showDuplicates = true;
            }
        }
    }
    else{
        for(let i = 0; i <= duplicateNumber; i++){
            let elements = document.getElementsByClassName("duplicate_" + i);
            if(elements.length > 1){
                elements[0].parentNode.parentNode.parentNode.parentNode.classList.remove("yellow")
                elements[0].parentNode.parentNode.classList.remove("yellow")
    
                for(let i = 1; i<elements.length; i++){
                    chrome.tabs.remove(parseInt(elements[i].parentNode.parentNode.id));
                    elements[i].parentNode.parentNode.classList.add("removed");
                }

                setTimeout(() => {
                    for(let i = 1; i<elements.length; i++){
                        elements[i].parentNode.parentNode.remove();
                    }
                }, 200);

                selectedTabsCounter.style.visibility = "hidden"
                selectedTabsCounter.style.opacity = "0"
                selectedTabsCounter.querySelector("span").innerText = ""
                selectedTabsCounter.classList.remove("duplicates")

                e.target.innerText = "Show duplicates"
                showDuplicates = false;
            }
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

async function buildTabs() {

    for (const [host, hostTabs] of Object.entries(groupedTabs)) {

        let hostItem = document.createElement("li");
        hostItem.id = "host_" + host;
        hostItem.classList.add("outer-list-item");

        let hostCheckbox = document.createElement("input");
        hostCheckbox.type = "checkbox";
        hostCheckbox.classList.add("inner-list-checkbox")
        hostCheckbox.id = host;

        chrome.storage.sync.get(host, function (result) {
            hostCheckbox.checked = Object.values(result)[0];
        });

        let hostLabel = document.createElement("label");
        hostLabel.classList.add("inner-list-checkbox-label");
        hostLabel.classList.add("selectable");
        hostLabel.htmlFor = host;

        if (hostTabs.some(x => x.active)) {
            hostLabel.classList.add("selected-tab")
        }

        hostLabel.onclick = () => {
            let obj = new Object();
            obj[host] = !hostCheckbox.checked;
            chrome.storage.sync.set(obj);
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

        closeAllTabsOfHostBtn.onclick = () => closeAllTabsOfHost(hostTabs, host)

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
            hostTabsList.appendChild(buildSingleTab(host, hostTab, hostItem, hostTabs));
        }

        hostItem.appendChild(hostTabsList);
        hostsContainer.appendChild(hostItem);
    }
}

function closeAllTabsOfHost(hostTabs, host) {
    for (let tab of hostTabs) {
        chrome.tabs.remove(tab.id);
    }

    deleteHostElementFromDOM(host)
    chrome.storage.sync.remove(host);
}

function closeTab(tabId, host) {
    chrome.tabs.remove(tabId);

    let currentTab = document.getElementById(tabId);
    let currentHostTabsList = currentTab.parentNode;

    currentTab.classList.add("removed");
    setTimeout(() => {
        currentTab.remove();
        if (currentHostTabsList.childNodes.length == 0) {
            deleteHostElementFromDOM(host);
        }
    }, 200);
}

function deleteHostElementFromDOM(host) {
    let hostElement = document.getElementById("host_" + host)

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
        console.log(document.getElementById(hostTabs[0].id).parentNode.querySelectorAll(".mute-btn"))
        btn.classList.add("muted");
    }
    else {
        for (let tab of hostTabs) {
            chrome.tabs.update(tab.id, { muted: false });
        }
        for(let btn of document.getElementById(hostTabs[0].id).parentNode.querySelectorAll(".mute-btn")){
            btn.classList.remove("muted")
        }
        console.log(document.getElementById(hostTabs[0].id).parentNode.querySelectorAll(".mute-btn"))
        btn.classList.remove("muted");
    }
}

function buildSingleTab(host, hostTab, hostItem, hostTabs) {
    let tab = document.createElement("li");
    tab.classList.add("inner-list-item")
    tab.classList.add("selectable")
    tab.id = hostTab.id;

    if (hostTab.active) {
        tab.classList.add("selected-tab")
    }

    let tabTitle = document.createElement("span");
    tabTitle.onclick = () => {
        chrome.tabs.update(hostTab.id, { selected: true });
    }

    tabTitle.innerHTML = hostTab.title.length > 32 ? hostTab.title.substring(0, 29) + " ..." : hostTab.title;

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

    addToFavouritesButton.onclick = () => {
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

    let closeTabButton = document.createElement("button");
    closeTabButton.classList.add("close-btn")
    closeTabButton.onclick = () => closeTab(hostTab.id, host)

    tabButtons.appendChild(addToFavouritesButton)
    tabButtons.appendChild(closeTabButton)

    tab.appendChild(tabTitle);
    tab.appendChild(tabButtons);

    return tab;
}

function initializeHostsSelectables() {
    new Selectables({
        elements: '.selectable',
        zone: '#main-list',
        selectedClass: 'active',
        key: "ctrlKey",

        start: () => {
            showDuplicates = false;

            let yellow = document.getElementsByClassName("yellow");
            while(yellow.length > 0){
                yellow[0].classList.remove("yellow")
            }
            showDuplicatesBtn.innerText = "Show duplicates"
            selectedTabsCounter.classList.remove("duplicates");
            hideSelectedCounter(selectedTabsCounter);
            

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

            let activeTabs = document.getElementsByClassName("inner-list-item active");

            for (let i = 0; i < activeTabs.length; i++) {

                let label = activeTabs[i].parentNode.parentNode.querySelector(".inner-list-checkbox-label")

                if (!label.classList.contains("active")) {
                    label.classList.add("active")
                }
            }

            if (activeTabs.length == 0) {

                groupCreating = false;
                searchInput.parentNode.classList.remove("group-name");

                showDuplicatesBtn.disabled = false;
                hideSelectedCounter(selectedTabsCounter);
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

//..............................................................
//................BUTTONS AND INPUT ACTIONS.....................
//..............................................................

expandAllHostsBtn.onclick = () => checkAllCheckboxes(allHostsCheckboxes)
colapseAllHostsBtn.onclick = () =>uncheckAllCheckboxes(allHostsCheckboxes)

closeSelectedBtn.onclick = () => {

    let activeVisibleTabs = document.querySelectorAll(".inner-list-item.active:not(.display-none)");

    for(let tab of activeVisibleTabs){
        chrome.tabs.remove(parseInt(tab.id));
        deleteTabElementFromDOM("active", tab.id)
    }

    hideSelectedCounter(selectedTabsCounter);
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
        hideSelectedCounter(selectedTabsCounter);
        showDuplicates = false;
    }
    else{
        handleSelectedCounterClick("active");
        hideSelectedCounter(selectedTabsCounter);
        disableTabsButtons();
        showDuplicatesBtn.disabled = false;
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
    if(allHosts.length == document.getElementsByClassName("outer-list-item display-none").length){
      document.getElementById("no-results-info").style.display = "block";
    }
    else{
      document.getElementById("no-results-info").style.display = "none";
    }

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
            let tabInfo = Object.values(groupedTabs).find(x => x.find(y => y.id == tab.id) != null).find(z => z.id == tab.id);
            
            let ob = new Object();
            ob.favIcon = tabInfo.favIcon;
            ob.title = tabInfo.title;
            ob.url = tabInfo.url;
            ob.id = String(tabInfo.id) + Date.now();

            newTabs.push(ob);
        }

        for(let groupName of selectedGroups){
            let groupIndex = groups.findIndex(x => x.name == groupName)
            let tabs = groups[groupIndex].tabs;
            let groupList = document.getElementById("group_" + groupName).querySelector("ul")

            for(let tab of newTabs){
                console.log(tabs.findIndex(x => x.url == tab.url))
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