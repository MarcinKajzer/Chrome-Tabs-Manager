import { global } from "../common/Global.js";
import { favouritiesHooks } from "../common/hooks.js";

let animation = true;
let favouritesGrid = true;

//DRY
favouritiesHooks.changeFavouritedDisplayBtn.onclick = () => {

    if(favouritesGrid){
        animation = false;

        let dragables = document.getElementsByClassName("dragable");
        for(let dragable of dragables){
            dragable.classList.remove("animated", "x4")
            dragable.classList.add("vertical")
        }

        favouritesGrid = false;
        favouritiesHooks.changeFavouritedDisplayBtn.classList.remove("grid");
        favouritiesHooks.changeFavouritedDisplayBtn.title = "Show grid."
    }
    else{
        let dragables = document.getElementsByClassName("dragable");
        for(let dragable of dragables){
            if(animation){
                dragable.classList.add("animated")
            }
            dragable.classList.add("x4")
            dragable.classList.remove("vertical")
        }
        animation = true;

        favouritesGrid = true;

        favouritiesHooks.changeFavouritedDisplayBtn.classList.add("grid");
        favouritiesHooks.changeFavouritedDisplayBtn.title = "Show list."
    }
}

//DRY END

let firstDrag = 0;

let previousIndex;
let newIndex;

export function buildFavourites() {
    for (let fav of global.favourities) {
        createSingeFavourite(fav)
    }
}

export function createSingeFavourite(fav){
    let dragable = document.createElement("div");
    dragable.classList.add("dragable", "animated")

    dragable.draggable = true;
    dragable.onclick = () => {
        openTabsOfGroup([fav], true)
    }
    dragable.addEventListener("mousedown", (e) => {
        if(e.button == 1){
            openTabsOfGroup([fav], false)
        }
    })

    let deleteButton = document.createElement("button")
    deleteButton.classList.add("remove-favourite-btn")
    deleteButton.title = "Remove"
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        
        dragable.style.width = 0;
        dragable.style.paddingLeft = 0
        dragable.style.paddingRight = 0
        setTimeout(() => {
            dragable.remove();
        },300)

        global.favourities = global.favourities.filter(x => x.url != fav.url)
        chrome.storage.sync.set({favourities: global.favourities})

        let buttons = document.getElementsByClassName(fav.id)
        
        while(buttons.length > 0){
            buttons[0].classList.remove("favourite-tab")
            buttons[0].classList.remove(fav.id)
        }
    }

    let wrapper = document.createElement("div")

    let iconContainer = document.createElement("div");
    iconContainer.classList.add("icon-container")

    let icon = document.createElement("img");
    icon.src = fav.favIcon != null & fav.favIcon != "" ? fav.favIcon : "assets/default_favicon.png";

    let name = document.createElement("p")
    name.innerText = fav.name.length > 30 ? fav.name.substring(0,33) + "..." : fav.name
    name.title = fav.name;

    iconContainer.appendChild(icon);

    wrapper.appendChild(iconContainer)
    wrapper.appendChild(name)

    dragable.appendChild(deleteButton)
    dragable.appendChild(wrapper)

    favouritiesHooks.dragableContainer.appendChild(dragable);


    //dragable functionality

    dragable.addEventListener("dragstart", () => {
        dragable.classList.add("dragging");

        previousIndex = Array.prototype.indexOf.call(favouritiesHooks.dragableContainer.children, dragable);
    })

    dragable.addEventListener("dragend", () => {
        dragable.classList.remove("dragging");
        firstDrag = 0

        newIndex = Array.prototype.indexOf.call(favouritiesHooks.dragableContainer.children, dragable);

        let element = global.favourities[previousIndex];
        global.favourities.splice(previousIndex, 1)
        global.favourities.splice(newIndex, 0, element)
        
        chrome.storage.sync.set({favourities: global.favourities})
    })

    dragable.addEventListener("dragover", (e) => dragANdDrop(e))
    
}

function dragANdDrop(e){
    e.preventDefault();
    let dragable = e.target;
    let draggingElement = document.querySelector(".dragging")
    let enteredElement = e.target.getBoundingClientRect()

    if(!dragable.classList.contains("dragging") && dragable.tagName != "BUTTON"){
        if(dragable.classList.contains("vertical")){
            let centerY = enteredElement.top + enteredElement.height / 2;

            if (e.clientY > centerY) {
                e.target.after(draggingElement)
            }
            else {
                e.target.before(draggingElement)
            }
        }
        else{
            let centerX = enteredElement.left + enteredElement.width / 2;

            if (e.clientX > centerX) {
                if (Math.round(enteredElement.right) == favouritiesHooks.dragableContainer.getBoundingClientRect().right && firstDrag < 2) {
                    e.target.before(draggingElement)
                    firstDrag++;
                }
                else {
                    e.target.after(draggingElement)
                    firstDrag = 0
                }
            }
            else {
                if (Math.round(enteredElement.left) == favouritiesHooks.dragableContainer.getBoundingClientRect().left &&
                    Math.round(enteredElement.top) != favouritiesHooks.dragableContainer.getBoundingClientRect().top &&
                    firstDrag < 2) {

                    e.target.after(draggingElement)
                    firstDrag++;
                }
                else {
                    e.target.before(draggingElement)
                    firstDrag = 0
                }

            }
        }
    }
}

