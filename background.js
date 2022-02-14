// chrome.browserAction.onClicked.addListener(() => {
//   chrome.tabs.query({currentWindow: true}, res => {
//     for(let tab of res){
//       console.log(tab)
//     }
//   })
// });


// chrome.runtime.onInstalled.addListener((reason) => {
//   // if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
//   //   chrome.tabs.create({
//   //     url: 'onboarding.html'
//   //   });
//   // }

//   chrome.browserAction.onClicked.addListener(() => {
//     chrome.tabs.query({currentWindow: true}, res => {
//       for(let tab of res){
//         console.log(tab)
//       }
//     })
//   });
// });

// let dict = {};

// chrome.runtime.onInstalled.addListener(() => {
  
//    chrome.tabs.query({currentWindow: true}, (res) => {
//      for(let tab of res){
//        console.log(tab)
//      }
//    }) 
// });

chrome.tabs.onActivated.addListener(() => {
  chrome.tabs.query({currentWindow: true}, (res) => {
    for(let tab of res){
      console.log(tab)
    }
  }) 
})

// const url = "https://www.example.com/blog?search=hello&world";

// let domain = (new URL(url));

// console.log(domain.origin)

chrome.tabs.onCreated.addListener(tab => {
  console.log(tab);
})

chrome.tabs.onRemoved.addListener((tabId) => {
  // usunięcie 
})

// nie ma potrzeby przechowywać tabsów w kolekji - to już jest 
// gotowa kolekcja - trzeba tylko robić update podczas eventów