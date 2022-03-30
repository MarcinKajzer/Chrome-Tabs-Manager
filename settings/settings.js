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
}