import { settingsHooks } from "../common/Hooks.js";
import { global } from "../common/Global.js";

export function initializeSettings(){

    for(let key of Object.keys(settingsHooks)){

        settingsHooks[key].checked = global.settings[key];

        settingsHooks[key].addEventListener("change", (e) => {
            global.settings[key] = e.target.checked;

            if(key == "groupByDefaultOption" && e.target.checked){
                settingsHooks.keepLastGroupingModeOption.checked = false;
                global.settings.keepLastGroupingModeOption = false;
            }
            else if(key == "keepLastGroupingModeOption" && e.target.checked){
                settingsHooks.groupByDefaultOption.checked = false;
                global.settings.groupByDefaultOption = false;
            }

            chrome.storage.sync.set({settings: global.settings})
        })
    }

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(global.settings));
    var dlAnchorElem = document.getElementById('export');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "settings.json");
}

