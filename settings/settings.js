import { settingsHooks } from "../common/Hooks.js";
import { global } from "../common/Global.js";

export function initializeSettings(){

    for(let key of Object.keys(global.settings)){

        settingsHooks[key].checked = global.settings[key];

        settingsHooks[key].addEventListener("change", (e) => {
            global.settings[key] = e.target.checked;
            chrome.storage.sync.set({settings: global.settings})
        })
    }
}


