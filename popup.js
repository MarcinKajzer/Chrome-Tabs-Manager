let groupedTabs = new Object();
let groups = [];
let favourities = [];

//Być może przeniść gdzieś indziej ??? BACKGROUND ? 
//Być może wprowadzić jakieś warunki, żeby nie zawsze odbywał się update
chrome.tabs.onUpdated.addListener(
  (tabId) => {
    chrome.tabs.get(tabId, tab => {
      let targerTab = document.getElementById(tabId);
      if(targerTab != null){
        targerTab.querySelector("span").innerText = tab.title.length > 29 ? tab.title.substring(0, 26) + " ..." : tab.title;
        ungroupedWindows.filter(x => x.windowId == tab.windowId)[0].tabs.filter(y => y.id == tab.id)[0].title = tab.title;
      }
    })
  }
)

let groupCreating = false;
let showDuplicates = false;
let selectedGroups = []

let duplicateNumber = 0;

let groupedWindows = [];
let ungroupedWindows = [];

let expandedHosts = [];

//..............................................................
//..................EXISTING ELEMENTS HOOKS.....................
//..............................................................

let main = document.querySelector("main");

let goToTabsBtn = document.getElementById("go-to-tabs-btn");
let goToGroupsBtn = document.getElementById("go-to-groups-btn")
let goToFavouritesBtn = document.getElementById("go-to-favourites-btn")
let goToSettingsBtn = document.getElementById("go-to-settings-btn")


//..............................................................
//..................PROGRAM INICIALIZATION......................
//..............................................................

chrome.storage.sync.get("favourities", (res) => {
  favourities = res.favourities != null && res.favourities != undefined ? res.favourities : [];
})

chrome.storage.sync.get("groups", (res) => {
  groups = res.groups != null && res.groups != undefined ? res.groups : [];
});

chrome.storage.sync.get("expandedHosts", (res) => {
  expandedHosts = res.expandedHosts != null && res.expandedHosts != undefined ? res.expandedHosts : [];
});

chrome.windows.getAll({}, windows => {

  for(let window of windows){
    chrome.tabs.query({windowId: window.id}, (tabs) => {
    
      let o = new Object();
      o.windowId = window.id;
      o.focused = window.focused;
      o.tabs = mapAllOpenTabs(tabs);
      ungroupedWindows.push(o);
    })
  }

  // po co to ????? - żeby opóźnić wykonanie akcji zamin uzupełnione zostaną pola 
  chrome.tabs.query({currentWindow: true}, tabs => {
    buildAllUngroupedWindows();
    buildGroups();
    buildFavourites();
  
    initializeGroupsSelectable();
    createMultiselect();   

    initializeUngroupedTabsSelectables();
  })
})

window.addEventListener('click', function(e){   
  if (!document.getElementById('search-header').contains(e.target)){
    document.getElementById('expand-select-group').checked = false;
  }
});



function groupUngroupedTabs(){
  groupedWindows = [];
  for(let window of ungroupedWindows){

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
        pinned: tab.pinned
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

    groupedWindows.push(ob);
  }
}


function mapAllOpenTabs(tabs){
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
      duplicateNumber: duplicateNumber,
      host: domain.hostname,
      pinned: tab.pinned
    }

    let duplicates = t.filter(x => x.url == tab.url);

    if(duplicates.length > 0){
      ob.duplicateNumber = duplicates[0].duplicateNumber;
    }

    t.push(ob)

    duplicateNumber++
  }

  return t;
}


//..............................................................
//.....................COMON FUNCTIONS..........................
//..............................................................


function hideSelectedCounter(){
  selectedTabsCounter.querySelector("span").innerText = ""
  selectedTabsCounter.style.opacity = "0"
  setTimeout(() => {
    selectedTabsCounter.style.visibility = "hidden"
  }, 200)
}

function showSelectedCounter(){
  selectedTabsCounter.style.visibility = "visible"
  selectedTabsCounter.style.opacity = "1"
}

function checkAllCheckboxes(checkboxes){
  for(let i = 0; i < checkboxes.length; i++){
    checkboxes[i].checked = true;

    if(expandedHosts.filter(x => x == checkboxes[i].id).length == 0){
      expandedHosts.push(checkboxes[i].id);
    }
  }
  chrome.storage.sync.set({"expandedHosts": expandedHosts});
}

function uncheckAllCheckboxes(checkboxes){
  for(let i = 0; i < checkboxes.length; i++){
    checkboxes[i].checked = false;

    expandedHosts = [];
  }
  chrome.storage.sync.set({"expandedHosts": expandedHosts}); 
}

function deleteTabElementFromDOM(className, tabId){

  let currentTab = document.getElementById(tabId);
  let currentHostTabsList = currentTab.parentNode;

  currentTab.classList.add("removed");
  setTimeout(() => {
    currentTab.remove();
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
  }, 200);
}

function handleSelectedCounterClick(className){
  let activeVisibleTabs = document.querySelectorAll(".inner-list-item." + className +":not(.display-none)");
    
  for(let currentTab of activeVisibleTabs){
    
    currentTab.classList.remove(className, "grouped");
    let currentHostTabsList = currentTab.parentNode;
    
    if(grouped && currentHostTabsList.getElementsByClassName(className).length == 0){
      currentHostTabsList.parentNode.querySelector(".inner-list-checkbox-label").classList.remove(className, "grouped");
    }
  }
}

//..............................................................
//................BUTTONS AND INPUT ACTIONS.....................
//..............................................................

goToTabsBtn.addEventListener("click", (e) => {
  if(pinnedWindowsContainer.childNodes.length > 0){
    //DRY
    pinnedWindowsSection.classList.add("shown");
    document.querySelector("#app").style.width = "700px";
    document.querySelector("main").style.width = "1750px";
  }

  main.style.transform = "translateX(0)";

  document.querySelector(".selected-section").classList.remove("selected-section")
  e.target.classList.add("selected-section")

  changeFavouritedDisplayBtn.style.display = "none";
  groupTabsBtn.style.display = "block"
})

goToGroupsBtn.addEventListener("click", (e) => {
  //DRY
  pinnedWindowsSection.classList.remove("shown");
  document.querySelector("#app").style.width = "350px";
  document.querySelector("main").style.width = "1400px";


  main.style.transform = "translateX(-350px)"

  document.querySelector(".selected-section").classList.remove("selected-section")
  e.target.classList.add("selected-section")

  changeFavouritedDisplayBtn.style.display = "none";
  groupTabsBtn.style.display = "none"
})

goToFavouritesBtn.addEventListener("click", (e) => {
  //DRY
  pinnedWindowsSection.classList.remove("shown");
  document.querySelector("#app").style.width = "350px";
  document.querySelector("main").style.width = "1400px";

  main.style.transform = "translateX(-700px)"

  document.querySelector(".selected-section").classList.remove("selected-section")
  e.target.classList.add("selected-section")

  changeFavouritedDisplayBtn.style.display = "block";
  groupTabsBtn.style.display = "none"
})

goToSettingsBtn.addEventListener("click", (e) => {
  //DRY
  pinnedWindowsSection.classList.remove("shown");
  document.querySelector("#app").style.width = "350px";
  document.querySelector("main").style.width = "1400px";

  main.style.transform = "translateX(-1050px)"

  document.querySelector(".selected-section").classList.remove("selected-section")
  e.target.classList.add("selected-section");

  changeFavouritedDisplayBtn.style.display = "none";
  groupTabsBtn.style.display = "none"
})

grouped = false;
groupTabsBtn = document.getElementById("group-tabs-btn")
groupTabsBtn.addEventListener("click", () => {
  hostsContainer.innerHTML = "";
  pinnedWindowsContainer.innerHTML = ""
  if(grouped){
    buildAllUngroupedWindows();
    grouped = false;
    groupTabsBtn.classList.remove("ungroup-tabs")
    groupTabsBtn.title = "Group tabs."
    colapseAllHostsBtn.disabled = true;
    expandAllHostsBtn.disabled = true;

    initializeUngroupedTabsSelectables(); // czy na pewno tworzyć za każdym razem nowy obiekt ??
    grSel.disable();
  }
  else{
    groupUngroupedTabs();
    buildAllGroupedWindows();
    grouped = true;
    groupTabsBtn.classList.add("ungroup-tabs")
    groupTabsBtn.title = "Ungroup tabs."
    colapseAllHostsBtn.disabled = false;
    expandAllHostsBtn.disabled = false;

    initializeGroupedTabsSelectables();
    ungrSel.disable();
  }
})


//Do zrobienia:



//65. Dodanie karty do listy po otwarciu grupy lub ulubionych
//95. Zachowanie aktywnych kart/duplikatów podczas przełączania między zgrupowanymi i nie.
//96. Zabronić przeciągania karty przed przypięte karty.



//Fix:
//91. Show duplicates znika po kliknięciu na okno ???
//92. Selectable w pinned kartach
//94. Cose duplicates - usunąć karty z kolekcji.

//Opcjonalne lub  na koniec: 

//24. Strona/sekcja do personalizacji wtyczki.
//44. Przeciąganie kart między grupami
//47. Dodawanie nowej grupy w sekcji grup

//60. Ogarnąć jak tworzone są identyfikatory dla poszczególnych elementów wtyczki + rozkminić jak przechowywane są dane w storage - ujednolicić
//64. Jeśli grupa pozostaje pusta - dodać informację zamiast przycisków
//67. Zmiana głównego koloru - aktywna sekcja/karta na stonowany niebieski.
//76. Zmienić ikonki ???
//54. Opcja przenieś zaznaczone do NOWEGO okna.
//75. Licznik grup i ulubionych przy ikonce
//78. Grupowanie kart hostami - ustawianie kolejności dla całych hostów
//84. Zmiana animacji
//86. Wyszukiwanie po hoście w niezgrupowanych listach
//88. Import/export ustawień/ulubionych/grup.
//93. Rozwijalne opcje w grupach ( za dużo jest ikon )


//9. Unselect jednocześnie hosta i tabów
//59. Wtyczna otwarta w kilku oknach nie działa jak powinna.



//Zrobione:

//1. Wyciszanie kart
//2. Zamykanie wszystkich wybranych
//3. Rozkminić co z usuwaniem klasy active dla host-label po kliku na close selected.
//4. Zmiana aktywnej kary na klik
//5. Podświetlenie aktywnej karty
//7. Wyszukiwarka
//6. Tworzenie grup z zakładkami i zapisywanie w local storage
//8. Zwijanie i rozwijanie wszystkich hostów jednym przyciskiem
//10. Oznaczanie jako muted hosta jeśli wszystkie taby są wyciszone
//13. zwijanie i zawijanie wszystkich kart do loacl storage
//14. Zaznaczanie hosta z aktywną kartą - tak jak muted
//15. Wyświetlenie liczbt zaznaczonych kart
//16. Position Fix wyszukiwarki i nawigacji
//17. Wyświetlić "no results" kiedy nie ma pasujących kart.
//18. Zamknięcie karty, która jest zaznaczona nie działa poprawnie
//19. Czerwona strzałka gdy active
//20. Selected zmniejszajcy się gdy korzysta się z searcha
//22. Pokazanie, że muzyka gra w danej karcie.
//23. Otwórz w oknie incognito.
//25. Zamiast grafik strzała do rozwijania w css
//26. Posprzątać w katalogu z projektem - grafiki
//27. Stworzenie zakładki ulubionych z menu jak w androidzie
//28. Wywala się, gdy strony są dopiero ładowane
//30. Kompresja wszystkich zasobów
//31. Gdy dla danego hosta nie wszystkie karty generują dźwięk próba wyciszenia całego hosta generuje błąd - sprawdzić 
//33. Animacja na dodanie do grupy
//34. Wyrzucenie grup do osobnej sekcji
//35. Możliwość nazywania grup
//36. Odznaczanie wszystkich zaznaczonych z poziomu wystających labelek
//37. Dodać favicony do kart w grupie
//38. Zmaiana active na zielony przy tworzeniu grupy
//39. Obsłużyć odznaczanie kart - zielony licznik musi zniknąć tak jak czerwony, input musi zmienić placeholder i ikonę 
//40. Dodawanie grupy bezpośrednio po jej utworzeniu
//41. Button zapisu do grup jest aktywny po przejściu do czerwonegi i z potrotem do zielonego
//42. Grupa o podanej nazwie istnieje - czy chcesz dodać do istniejącej listy/nadpisać/zmienić nazwę ?
//43. Rozdzielić każdą sekcję na osobny plik js.
//45. Edytowanie nazwy grupy, nadanie koloru
//46. Walidacja nazwy grupy - musi mieć długość minimum 1
//48. Otwieranie w nowym oknie/tym samym/grupowanie
//49. Zapisywanie zwinięcia/rozwinięcia grupy
//50. Możliwość zmiany rozmiaru siatki dla ulubionych + widok jako lista
//51. Zapisanie zmiany kolejności po przeciągnięciu w ulubionych
//52. Odznaczanie/zaznaczanie duplikatów w ulubionych.
//53. Funkcja "zamknij duplikaty" + "Pokaż duplikaty"
//55. Usuwanie ulubionych z poziomu sekcji
//56. Czasem podczas przenoszenia elementów pojawia się błąd "Uncaught NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
//58. Dodanie loadrea gdy strony się dopiero ładują i późniejsze uzupełnienie favIcony ???? - raczej zbędne
//61. Ochrona przed duplikowaniem kart w grupie
//62. Otwieranie już zgrupowanych kart (oznaczone kolorem)
//63. Gdy strony są usuwane z grupy -> owtieranie wszystkich na raz nie przechwytuje usunięcia.
//66. Wykrywanie zmiany tytułu strony 
//68. Szybkie zaznaczenie powoduje, że counter się nie pojawia.
//69. Wyświetlanie wszystkich okien
//70. Rozgrupowanie kart wg hosta - możliwość zmiany kolejności kart/grupowanie/przeciąganie między oknami itp.
//71. Przypinanie kart
//72. Jeśli dodajemy zduplikowane karty do grupy - dodadzą się wszystkie - nie zostają wychwycone powtórki. <- 
//73. Obiekt ze stanami (rozwinięte/zwinięte) pobrać ze storage tylko raz i na nim operować
//74. Taki sam w 2 różnych oknach = to samo id !!!
//77. Klikanie na karty - trzeba kliknąć w span, żeby zadziałało - zrobić klikanie na całym li.
//79. Update kolekcji po przeniesieniu do innego okna
//80. Po prawej stronie w headerze opcje zależne od sekcji - dla tabów => widok pogrupowanych/rozgrupowanych kart
//81. Expand i collapes -> tylko jeden wpis do stora MAX_WRITE_OPERATION_PER_MINUTE
//82. Zamknięcie okna. gdy są pogrupowane -> po powrocie do niepogrupowanych znów jest widoczne
//83. Gdy zamieniam tylko kolejność kart wewnątrz okna -> znikają one z listy, co widać po przełączeniu na widok pogrupowany i z powrotem
//87. Selectable nie działa po zgrupowaniu kart => prawdopodobnie tracone są referencje do elementów html.
//88. Wyłączenie Expand i Collapse gdy nie są zgrupowane karty.
//89. Prawy klik na karte powoduje zniknięcie countera ???
//90. FLaga pinned dla okna.