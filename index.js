import { global } from "./common/Global.js"
import { buildFavourites} from "./favourities/Favourites.js"
import { createMultiselect} from "./tabs/Multiselect.js"
import { buildGroups, initializeGroupsSelectable } from "./groups/Groups.js"
import { tabsHooks, favouritiesHooks, commonHooks } from "./common/hooks.js"
import { buildAllUngroupedWindows, initializeUngroupedTabsSelectables } from "./tabs/UngroupedWindows.js";
import { buildAllGroupedWindows, initializeGroupedTabsSelectables } from "./tabs/GroupedWindows.js"
import { mapAllOpenTabs, groupUngroupedTabs } from "./tabs/Common.js"
import { initializeSettings } from "./settings/Settings.js"
import { createUngroupedOtherwiseGrouped } from "./tabs/Tabs.js"

//..............................................................
//..................HANDLE TAB CHANGED EVENT....................
//..............................................................

chrome.tabs.onUpdated.addListener(
  async (tabId) => {
    
    let tab;
    try{
      tab = await chrome.tabs.get(tabId);
    }
    catch{}

    let targetTab = document.getElementById(tabId);
      
    if(targetTab != null && tab){
      let properTab = global.ungroupedWindows.filter(x => x.windowId == tab.windowId)[0].tabs.filter(y => y.id == tab.id)[0];

      //.....TAB TITLE CHANGE HANDLING.....

      if(tab.title != properTab.title){
        
        targetTab.querySelector("span").innerText = tab.title.length > 27 ? tab.title.substring(0, 24) + " ..." : tab.title;
        targetTab.querySelector("span").title = tab.title;
        properTab.title = tab.title;
      }

      //.....TAB FAVICON CHANGE HANDLING......

      if(tab.favIconUrl != properTab.favIcon){
        if(tab.favIconUrl != ""){
          properTab.favIcon = tab.favIconUrl;

          if(!global.grouped){
            targetTab.querySelector("img").src = tab.favIconUrl;
          }
          else{
            targetTab.closest(".outer-list-item").querySelector(".favIcon").src = tab.favIconUrl;
          }
        }
      }

      //.....MUTE BTN CHANGE HANDLING......

      if(global.settings.muteTabOption){
        if(tab.mutedInfo.muted){
          properTab.muted = true;
        }
        else{
          properTab.muted = false;
        }
  
        if(tab.audible){
          targetTab.querySelector(".mute-btn").classList.remove("display-none");
          properTab.audible = true;
        }
        else{
          if(!tab.mutedInfo.muted){
            targetTab.querySelector(".mute-btn").classList.add("display-none");
          }
          properTab.audible = false;
        }
  
        if(global.grouped && !properTab.muted){
        
          let muteBtns = targetTab.parentNode.querySelectorAll(".mute-btn")
          let muteBtnsHidden = targetTab.parentNode.querySelectorAll(".mute-btn.display-none")
          
          if (muteBtns.length == muteBtnsHidden.length) {
            targetTab.closest(".outer-list-item").querySelector("label .mute-btn").classList.add("display-none")
          }
          else{
            targetTab.closest(".outer-list-item").querySelector("label .mute-btn").classList.remove("display-none")
          }
        }
      }
    }

      //..............................
    
  }
)


chrome.tabs.onCreated.addListener(tab => {
  appendSingleTabToExistingWindow(tab);
  updateWindowsContainers();
})


chrome.tabs.onActivated.addListener(
  async (data) => {
    let tab = await chrome.tabs.get(data.tabId);
    let targetTab = document.getElementById(data.tabId);
    let properTab = global.ungroupedWindows.filter(x => x.windowId == tab.windowId)[0].tabs.filter(y => y.id == tab.id)[0]

    global.ungroupedWindows.filter(x => x.windowId == tab.windowId)[0].tabs.filter(y => y.active)[0].active = false;
    properTab.active = true;

    if(!global.grouped){
      let currentTab = targetTab.parentElement.querySelector(".current-tab");
      if (currentTab != null){
        currentTab.classList.remove("current-tab");
      }
    }
    else{
      for(let curr of targetTab.closest(".window-list").querySelectorAll(".current-tab")){
        curr.classList.remove("current-tab")
      }
      targetTab.closest(".outer-list-item").querySelector("label").classList.add("current-tab");
    }
    
    targetTab.classList.add("current-tab")
  }
)

chrome.tabs.onRemoved.addListener(
  async (tabId) => {
    let targetTab = document.getElementById(tabId);

    if(targetTab != null){
      targetTab.remove();
    }
  }
)

// chrome.tabs.onMoved.addListener(t => {
  
// })

//..............................................................
//..................PROGRAM INICIALIZATION......................
//..............................................................

let x = await chrome.storage.sync.get("settings")
if(Object.keys(x).length == 0){
  chrome.storage.sync.set({settings: global.settings})
}

let favourities = await chrome.storage.sync.get("favourities");
global.favourities = favourities.favourities != null && favourities.favourities != undefined ? favourities.favourities : [];

let settings = await chrome.storage.sync.get("settings");
global.settings = settings.settings;

let windows = await chrome.windows.getAll();

for(let window of windows){

  let tabs = await chrome.tabs.query({windowId: window.id});
  
  let o = new Object();
  o.windowId = window.id;
  o.focused = window.focused;
  o.tabs = mapAllOpenTabs(tabs);
  global.ungroupedWindows.push(o);
}

if(global.settings.groupByDefaultOption){
  createUngroupedOtherwiseGrouped(false)
}
else if(global.settings.keepLastGroupingModeOption){
  createUngroupedOtherwiseGrouped(!global.settings.previouslyGrouped)
}
else{
  createUngroupedOtherwiseGrouped(true);
}

buildFavourites();
initializeSettings();


chrome.storage.sync.get("groups", (res) => {
  global.groups = res.groups != null && res.groups != undefined ? res.groups : [];
  buildGroups();
  initializeGroupsSelectable();
  createMultiselect();   
});

chrome.storage.sync.get("expandedHosts", (res) => {
  global.expandedHosts = res.expandedHosts != null && res.expandedHosts != undefined ? res.expandedHosts : [];
});

window.onclick = (e) => {   
  if (!tabsHooks.addToGroupContainer.contains(e.target)){
    document.getElementById('expand-select-group').checked = false;
  }
};

//..............................................................
//............MAIN BUTTONS EVENT LISTENERS......................
//..............................................................

commonHooks.goToTabsBtn.onclick = (e) => {

  commonHooks.main.style.transform = "translateX(0)";

  if(tabsHooks.pinnedWindowsContainer.childNodes.length > 0){
    showPinnedSection()
  }

  highlightSelectedSectionBtn(e.target);
  changeDynamicButtonsDisplay([favouritiesHooks.changeFavouritedDisplayBtn], "none")
  changeDynamicButtonsDisplay([tabsHooks.groupTabsBtn,  tabsHooks.createNewWindowBtn], "block")
}

commonHooks.goToGroupsBtn.onclick = (e) => {
  
  commonHooks.main.style.transform = "translateX(-350px)"
  hidePinnedSection();
  highlightSelectedSectionBtn(e.target);
  changeDynamicButtonsDisplay([tabsHooks.groupTabsBtn, tabsHooks.createNewWindowBtn, favouritiesHooks.changeFavouritedDisplayBtn], "none")
}

commonHooks.goToFavouritesBtn.onclick = (e) => {
  
  commonHooks.main.style.transform = "translateX(-700px)"
  hidePinnedSection();
  highlightSelectedSectionBtn(e.target);
  changeDynamicButtonsDisplay([favouritiesHooks.changeFavouritedDisplayBtn], "block")
  changeDynamicButtonsDisplay([tabsHooks.groupTabsBtn,  tabsHooks.createNewWindowBtn], "none")
}

commonHooks.goToSettingsBtn.onclick = (e) => {
  
  commonHooks.main.style.transform = "translateX(-1050px)"
  hidePinnedSection();
  highlightSelectedSectionBtn(e.target);
  changeDynamicButtonsDisplay([tabsHooks.groupTabsBtn,  tabsHooks.createNewWindowBtn, favouritiesHooks.changeFavouritedDisplayBtn], "none")
}

//..............................................................
//......................FUNCTIONS...............................
//..............................................................

function hidePinnedSection(){
  tabsHooks.pinnedWindowsSection.classList.remove("shown");
  document.querySelector("#app").style.width = "350px";
  commonHooks.main.style.width = "1400px";
  document.querySelector("#current-tabs-wrapper").style.width = "350px";
}

function showPinnedSection(){
  tabsHooks.pinnedWindowsSection.classList.add("shown");
  document.querySelector("#app").style.width = "700px";
  commonHooks.main.style.width = "1750px";
  document.querySelector("#current-tabs-wrapper").style.width = "700px";
}

function highlightSelectedSectionBtn(button){
  document.querySelector(".selected-section").classList.remove("selected-section")
  button.classList.add("selected-section")
}

function changeDynamicButtonsDisplay(buttons, displayMode){
  for(let btn of buttons){
    btn.style.display = displayMode;
  }
}

function appendSingleTabToExistingWindow(createdTab){

  if(global.ungroupedWindows.filter(x => x.windowId == createdTab.windowId)[0] == null){
    let o = new Object();
    o.windowId = createdTab.windowId;
    o.tabs = [];
  
    global.ungroupedWindows.push(o)
  }

  let url;
  let domain;

  try{
      domain = (new URL(createdTab.url));
      url = createdTab.url;
  }
  catch{
      domain = (new URL(createdTab.pendingUrl));
      url = createdTab.pendingUrl
  }

  let ob = {
    id: createdTab.id,
    favIcon: createdTab.favIcon,
    title: createdTab.title,
    audible: createdTab.audible,
    active: createdTab.active,
    muted: createdTab.mutedInfo.muted,
    duplicateNumber: global.duplicateNumber,
    url: url,
    host: domain.host,
    pinned: createdTab.pinned
  }

  let duplcatesInAllWindows = global.ungroupedWindows.filter(x => x.tabs.filter(y => y.url == url).length > 0)
  
  if(duplcatesInAllWindows.length > 0){
      ob.duplicateNumber = duplcatesInAllWindows[0].tabs.filter(x => x.url == url)[0].duplicateNumber;
  }
 
  global.ungroupedWindows.filter(x => x.windowId == createdTab.windowId)[0].tabs.push(ob);
  
  global.duplicateNumber++;
}

function updateWindowsContainers(){
  
  //op????nienie wykonania 
  chrome.tabs.query({currentWindow: true}, () => {
    tabsHooks.allWindowsContainer.innerHTML = "";
    tabsHooks.pinnedWindowsContainer.innerHTML = ""
    if(global.grouped){
      groupUngroupedTabs();
      buildAllGroupedWindows();

      global.grSel.disable();
      initializeGroupedTabsSelectables();
    }
    else{
      buildAllUngroupedWindows();

      global.ungrSel.disable();
      initializeUngroupedTabsSelectables(); // czy na pewno tworzy?? za ka??dym razem nowy obiekt ??
    }
  })
}



//.......IN PROGRESS......



//.........TO DO..........

//123. Przej??cie do innego okna/karty w innym oknie na klik.



//..........FIX...........

//107. Nazwa grupy/hosta musi znikn????/zmieni?? kolor po zamkni??ciu/usuni??ciu kart.
//9. Unselect jednocze??nie hosta i tab??w
//124. Wy??wietlanie obecnego okna w pierwszej kolejno??ci

//........OPTIONAL........ 








//.........FOR THE END......


//88. Import/export ustawie??/ulubionych/grup. 




//........REFACTOR..........

//60. Ogarn???? jak tworzone s?? identyfikatory dla poszczeg??lnych element??w wtyczki + rozkmini?? jak przechowywane s?? dane w storage - ujednolici??






//.........DONE.............

//1. Wyciszanie kart
//2. Zamykanie wszystkich wybranych
//3. Rozkmini?? co z usuwaniem klasy active dla host-label po kliku na close selected.
//4. Zmiana aktywnej kary na klik
//5. Pod??wietlenie aktywnej karty
//7. Wyszukiwarka
//6. Tworzenie grup z zak??adkami i zapisywanie w local storage
//8. Zwijanie i rozwijanie wszystkich host??w jednym przyciskiem
//10. Oznaczanie jako muted hosta je??li wszystkie taby s?? wyciszone
//13. zwijanie i zawijanie wszystkich kart do loacl storage
//14. Zaznaczanie hosta z aktywn?? kart?? - tak jak muted
//15. Wy??wietlenie liczbt zaznaczonych kart
//16. Position Fix wyszukiwarki i nawigacji
//17. Wy??wietli?? "no results" kiedy nie ma pasuj??cych kart.
//18. Zamkni??cie karty, kt??ra jest zaznaczona nie dzia??a poprawnie
//19. Czerwona strza??ka gdy active
//20. Selected zmniejszajcy si?? gdy korzysta si?? z searcha
//22. Pokazanie, ??e muzyka gra w danej karcie.
//23. Otw??rz w oknie incognito.
//24. Strona/sekcja do personalizacji wtyczki.
//25. Zamiast grafik strza??a do rozwijania w css
//26. Posprz??ta?? w katalogu z projektem - grafiki
//27. Stworzenie zak??adki ulubionych z menu jak w androidzie
//28. Wywala si??, gdy strony s?? dopiero ??adowane
//30. Kompresja wszystkich zasob??w
//31. Gdy dla danego hosta nie wszystkie karty generuj?? d??wi??k pr??ba wyciszenia ca??ego hosta generuje b????d - sprawdzi?? 
//33. Animacja na dodanie do grupy
//34. Wyrzucenie grup do osobnej sekcji
//35. Mo??liwo???? nazywania grup
//36. Odznaczanie wszystkich zaznaczonych z poziomu wystaj??cych labelek
//37. Doda?? favicony do kart w grupie
//38. Zmaiana active na zielony przy tworzeniu grupy
//39. Obs??u??y?? odznaczanie kart - zielony licznik musi znikn???? tak jak czerwony, input musi zmieni?? placeholder i ikon?? 
//40. Dodawanie grupy bezpo??rednio po jej utworzeniu
//41. Button zapisu do grup jest aktywny po przej??ciu do czerwonegi i z potrotem do zielonego
//42. Grupa o podanej nazwie istnieje - czy chcesz doda?? do istniej??cej listy/nadpisa??/zmieni?? nazw?? ?
//43. Rozdzieli?? ka??d?? sekcj?? na osobny plik js.
//44. Przeci??ganie kart mi??dzy grupami
//45. Edytowanie nazwy grupy, nadanie koloru
//46. Walidacja nazwy grupy - musi mie?? d??ugo???? minimum 1
//47. Dodawanie nowej grupy w sekcji grup
//48. Otwieranie w nowym oknie/tym samym/grupowanie
//49. Zapisywanie zwini??cia/rozwini??cia grupy
//50. Mo??liwo???? zmiany rozmiaru siatki dla ulubionych + widok jako lista
//51. Zapisanie zmiany kolejno??ci po przeci??gni??ciu w ulubionych
//52. Odznaczanie/zaznaczanie duplikat??w w ulubionych.
//53. Funkcja "zamknij duplikaty" + "Poka?? duplikaty"
//55. Usuwanie ulubionych z poziomu sekcji
//56. Czasem podczas przenoszenia element??w pojawia si?? b????d "Uncaught NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
//58. Dodanie loadrea gdy strony si?? dopiero ??aduj?? i p????niejsze uzupe??nienie favIcony ???? - raczej zb??dne
//59. Wtyczna otwarta w kilku oknach nie dzia??a jak powinna.
//61. Ochrona przed duplikowaniem kart w grupie
//62. Otwieranie ju?? zgrupowanych kart (oznaczone kolorem)
//63. Gdy strony s?? usuwane z grupy -> owtieranie wszystkich na raz nie przechwytuje usuni??cia.
//64. Je??li grupa pozostaje pusta - doda?? informacj?? zamiast przycisk??w.
//65. Dodanie karty do listy po otwarciu grupy lub ulubionych
//66. Wykrywanie zmiany tytu??u strony 
//68. Szybkie zaznaczenie powoduje, ??e counter si?? nie pojawia.
//69. Wy??wietlanie wszystkich okien
//70. Rozgrupowanie kart wg hosta - mo??liwo???? zmiany kolejno??ci kart/grupowanie/przeci??ganie mi??dzy oknami itp.
//71. Przypinanie kart
//72. Je??li dodajemy zduplikowane karty do grupy - dodadz?? si?? wszystkie - nie zostaj?? wychwycone powt??rki. <- 
//73. Obiekt ze stanami (rozwini??te/zwini??te) pobra?? ze storage tylko raz i na nim operowa??
//74. Taki sam w 2 r????nych oknach = to samo id !!!
//76. Zmieni?? ikonki 
//77. Klikanie na karty - trzeba klikn???? w span, ??eby zadzia??a??o - zrobi?? klikanie na ca??ym li.
//79. Update kolekcji po przeniesieniu do innego okna
//80. Po prawej stronie w headerze opcje zale??ne od sekcji - dla tab??w => widok pogrupowanych/rozgrupowanych kart
//81. Expand i collapes -> tylko jeden wpis do stora MAX_WRITE_OPERATION_PER_MINUTE
//82. Zamkni??cie okna. gdy s?? pogrupowane -> po powrocie do niepogrupowanych zn??w jest widoczne
//83. Gdy zamieniam tylko kolejno???? kart wewn??trz okna -> znikaj?? one z listy, co wida?? po prze????czeniu na widok pogrupowany i z powrotem.
//86. Wyszukiwanie po ho??cie w niezgrupowanych listach
//87. Selectable nie dzia??a po zgrupowaniu kart => prawdopodobnie tracone s?? referencje do element??w html.
//88. Wy????czenie Expand i Collapse gdy nie s?? zgrupowane karty.
//89. Prawy klik na karte powoduje znikni??cie countera ???
//92. Selectable w pinned kartach
//95. Zachowanie aktywnych kart/duplikat??w podczas prze????czania mi??dzy zgrupowanymi i nie.
//90. FLaga pinned dla okna.
//91. Show duplicates znika po klikni??ciu na okno ???
//94. Close duplicates - usun???? karty z kolekcji.
//96. Zabroni?? przeci??gania karty przed przypi??te karty.
//97. Zamkni??cie najpierw pojedynczej karty a potem ca??ego hosta powoduje b????d.
//98. Usuni??cie kontenera window gdy zamkni??ta jest ostatnia karta.
//99. Zamykanie zgrupowanych kart powoduje najpierw podniesienie eventu o zmianie numeru grupy. 
//100. Zamkni??cie okna ma usuwa?? je z kolekcji.
//101. Selectable przestaje dzia??a?? po dodaniu karty z grupy lub ulubionych.
//102. Wyszukiwanie w grupach.
//103. Brak wynik??w napis w ka??dym oknie.
//104. Gwiazdka si?? nie wype??nia gdy duplikaty wyst??puj?? w r????nych oknach.
//105. Utrzymanie koloru ??????tego przy duplikatach podczas grupowania.
//106. Odznaczenie w grupach nie odznacza nazwy grupy
//108. Odznaczenie grouped wszystkich nie usuwa klasy goruped z nich.
//109. Przeci??ganie przypi??tych kart do innego okna nie dzia??a + indeksy 
//110. Zmiana CSS
//111. Opcja otw??rz nowe okno z wtyczki.
//112. Klikni??cie na okno przenosi nie niego.
//113. Zmiana ikony podczas przeci??gania host??w.
//114. Przenoszenie do nowej pustej grupy.
//115. Selectable nie dzia??a jak trzeba po dodaniu zone jako ca??e #app. - zaznaczenie grup powoduje odznaczenie tab??w.
//117. Skr??ci?? d??ugo???? nazw kart o 2-3 znak??w 
//118. Przeci??ganie z nowego okna pozwala na ustawienie karty przez przypi??t?? :C
//119. Zamykanie okna gdy zamkni??ta jest ostatnia karta.
//120. Zamkni??cie nowego okna powoduje b????d
//121. Kiedy przenoszone jest aktywna karta z innego okna trzeba odpi???? jej klas?? current-tab i przypi???? innej karcie.
//122. Synchronizacja - tworzenie nowej grupy 



//Nowe pomys??y: 

//1. Udost??pnianie wielu link??w jednym
//2. Nagrywanie sesji/historia
//3. Opcje na prawy klik na stronie (zapisywanie do grupy/ulubione itp)

//Wycofane pomys??y:

//78. Grupowanie kart hostami - ustawianie kolejno??ci dla ca??ych host??w.