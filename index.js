import { global } from "./common/Global.js"
import { buildFavourites} from "./favourities/Favourites.js"
import { createMultiselect} from "./tabs/Multiselect.js"
import { buildGroups, initializeGroupsSelectable} from "./groups/Groups.js"
import { tabsHooks, favouritiesHooks, commonHooks } from "./common/hooks.js"
import { buildAllUngroupedWindows, initializeUngroupedTabsSelectables } from "./tabs/UngroupedWindows.js"
import { mapAllOpenTabs } from "./tabs/Common.js"


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

      //.....MUTE BTN CHANGE HANDLING......

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

      //..............................
    }
  }
)

chrome.tabs.onActivated.addListener(
  async (data) => {
    let tab = await chrome.tabs.get(data.tabId);
    let targetTab = document.getElementById(data.tabId);
    let properTab = global.ungroupedWindows.filter(x => x.windowId == tab.windowId)[0].tabs.filter(y => y.id == tab.id)[0]

    console.log(tab)

    properTab.active = true;

    targetTab.parentElement.querySelector(".current-tab").classList.remove("current-tab");
    targetTab.classList.add("current-tab")
    
})



//..............................................................
//..................PROGRAM INICIALIZATION......................
//..............................................................

let favourities = await chrome.storage.sync.get("favourities");
global.favourities = favourities.favourities != null && favourities.favourities != undefined ? favourities.favourities : [];

let windows = await chrome.windows.getAll();

for(let window of windows){
  let tabs = await chrome.tabs.query({windowId: window.id});
  
  let o = new Object();
  o.windowId = window.id;
  o.focused = window.focused;
  o.tabs = mapAllOpenTabs(tabs);
  global.ungroupedWindows.push(o);
}

buildAllUngroupedWindows();
initializeUngroupedTabsSelectables();

buildFavourites();

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






//In progress: 









//Do zrobienia:

//116. Minimalizacja/maksymalizacja okien + lista zminimalizowanych 






//Fix:


//107. Nazwa grupy/hosta musi zniknąć/zmienić kolor po zamknięciu/usunięciu kart.
//Po kliknięciu close -> usunąć widoczność hosta/grupy jeśli jest pusta | odpiąć klasy grouped/active gdy nie jest puste podczas wyszukiwania


//118. Przeciąganie z nowego okna pozwala na ustawienie karty przez przypiątą :C


//Opcjonalne: 

//24. Strona/sekcja do personalizacji wtyczki.
//88. Import/export ustawień/ulubionych/grup. 






//Na koniec:

//9. Unselect jednocześnie hosta i tabów




//Refactor: 

//60. Ogarnąć jak tworzone są identyfikatory dla poszczególnych elementów wtyczki + rozkminić jak przechowywane są dane w storage - ujednolicić






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
//44. Przeciąganie kart między grupami
//45. Edytowanie nazwy grupy, nadanie koloru
//46. Walidacja nazwy grupy - musi mieć długość minimum 1
//47. Dodawanie nowej grupy w sekcji grup
//48. Otwieranie w nowym oknie/tym samym/grupowanie
//49. Zapisywanie zwinięcia/rozwinięcia grupy
//50. Możliwość zmiany rozmiaru siatki dla ulubionych + widok jako lista
//51. Zapisanie zmiany kolejności po przeciągnięciu w ulubionych
//52. Odznaczanie/zaznaczanie duplikatów w ulubionych.
//53. Funkcja "zamknij duplikaty" + "Pokaż duplikaty"
//55. Usuwanie ulubionych z poziomu sekcji
//56. Czasem podczas przenoszenia elementów pojawia się błąd "Uncaught NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
//58. Dodanie loadrea gdy strony się dopiero ładują i późniejsze uzupełnienie favIcony ???? - raczej zbędne
//59. Wtyczna otwarta w kilku oknach nie działa jak powinna.
//61. Ochrona przed duplikowaniem kart w grupie
//62. Otwieranie już zgrupowanych kart (oznaczone kolorem)
//63. Gdy strony są usuwane z grupy -> owtieranie wszystkich na raz nie przechwytuje usunięcia.
//64. Jeśli grupa pozostaje pusta - dodać informację zamiast przycisków.
//65. Dodanie karty do listy po otwarciu grupy lub ulubionych
//66. Wykrywanie zmiany tytułu strony 
//68. Szybkie zaznaczenie powoduje, że counter się nie pojawia.
//69. Wyświetlanie wszystkich okien
//70. Rozgrupowanie kart wg hosta - możliwość zmiany kolejności kart/grupowanie/przeciąganie między oknami itp.
//71. Przypinanie kart
//72. Jeśli dodajemy zduplikowane karty do grupy - dodadzą się wszystkie - nie zostają wychwycone powtórki. <- 
//73. Obiekt ze stanami (rozwinięte/zwinięte) pobrać ze storage tylko raz i na nim operować
//74. Taki sam w 2 różnych oknach = to samo id !!!
//76. Zmienić ikonki 
//77. Klikanie na karty - trzeba kliknąć w span, żeby zadziałało - zrobić klikanie na całym li.
//79. Update kolekcji po przeniesieniu do innego okna
//80. Po prawej stronie w headerze opcje zależne od sekcji - dla tabów => widok pogrupowanych/rozgrupowanych kart
//81. Expand i collapes -> tylko jeden wpis do stora MAX_WRITE_OPERATION_PER_MINUTE
//82. Zamknięcie okna. gdy są pogrupowane -> po powrocie do niepogrupowanych znów jest widoczne
//83. Gdy zamieniam tylko kolejność kart wewnątrz okna -> znikają one z listy, co widać po przełączeniu na widok pogrupowany i z powrotem.
//86. Wyszukiwanie po hoście w niezgrupowanych listach
//87. Selectable nie działa po zgrupowaniu kart => prawdopodobnie tracone są referencje do elementów html.
//88. Wyłączenie Expand i Collapse gdy nie są zgrupowane karty.
//89. Prawy klik na karte powoduje zniknięcie countera ???
//92. Selectable w pinned kartach
//95. Zachowanie aktywnych kart/duplikatów podczas przełączania między zgrupowanymi i nie.
//90. FLaga pinned dla okna.
//91. Show duplicates znika po kliknięciu na okno ???
//94. Close duplicates - usunąć karty z kolekcji.
//96. Zabronić przeciągania karty przed przypięte karty.
//97. Zamknięcie najpierw pojedynczej karty a potem całego hosta powoduje błąd.
//98. Usunięcie kontenera window gdy zamknięta jest ostatnia karta.
//99. Zamykanie zgrupowanych kart powoduje najpierw podniesienie eventu o zmianie numeru grupy. 
//100. Zamknięcie okna ma usuwać je z kolekcji.
//101. Selectable przestaje działać po dodaniu karty z grupy lub ulubionych.
//102. Wyszukiwanie w grupach.
//103. Brak wyników napis w każdym oknie.
//104. Gwiazdka się nie wypełnia gdy duplikaty występują w różnych oknach.
//105. Utrzymanie koloru żółtego przy duplikatach podczas grupowania.
//106. Odznaczenie w grupach nie odznacza nazwy grupy
//108. Odznaczenie grouped wszystkich nie usuwa klasy goruped z nich.
//109. Przeciąganie przypiętych kart do innego okna nie działa + indeksy 
//110. Zmiana CSS
//111. Opcja otwórz nowe okno z wtyczki.
//112. Kliknięcie na okno przenosi nie niego.
//113. Zmiana ikony podczas przeciągania hostów.
//114. Przenoszenie do nowej pustej grupy.
//115. Selectable nie działa jak trzeba po dodaniu zone jako całe #app. - zaznaczenie grup powoduje odznaczenie tabów.
//117. Skrócić długość nazw kart o 2-3 znaków 
//119. Zamykanie okna gdy zamknięta jest ostatnia karta.
//120. Zamknięcie nowego okna powoduje błąd
//121. Kiedy przenoszone jest aktywna karta z innego okna trzeba odpiąć jej klasę current-tab i przypiąć innej karcie.

//Nowe pomysły: 

//1. Udostępnianie wielu linków jednym
//2. Nagrywanie sesji/historia
//3. Opcje na prawy klik na stronie (zapisywanie do grupy/ulubione itp)

//Wycofane pomysły:

//78. Grupowanie kart hostami - ustawianie kolejności dla całych hostów.