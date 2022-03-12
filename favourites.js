const dragableContainer = document.getElementById("dragables-container")

let animation = true;

let favouritesGrid = true;
//DRY
let changeFavouritedDisplayBtn = document.getElementById("change-favourites-display-grid");
changeFavouritedDisplayBtn.addEventListener("click", () => {

    if(favouritesGrid){
        animation = false;

        let dragables = document.getElementsByClassName("dragable");
        for(let dragable of dragables){
            dragable.classList.remove("animated", "x4")
            dragable.classList.add("vertical")
        }

        favouritesGrid = false;
        changeFavouritedDisplayBtn.classList.remove("grid");
        changeFavouritedDisplayBtn.title = "Show grid."
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

        changeFavouritedDisplayBtn.classList.add("grid");
        changeFavouritedDisplayBtn.title = "Show list."
    }
})

//DRY END

let firstDrag = 0;

let previousIndex;
let newIndex;

function buildFavourites() {
    for (let fav of favourities) {
        createSingeFavourite(fav)
    }
}

function createSingeFavourite(fav){
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

        favourities = favourities.filter(x => x.url != fav.url)
        chrome.storage.sync.set({favourities: favourities})

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

    dragableContainer.appendChild(dragable);


    //dragable functionality

    dragable.addEventListener("dragstart", () => {
        dragable.classList.add("dragging");

        previousIndex = Array.prototype.indexOf.call(dragableContainer.children, dragable);
    })

    dragable.addEventListener("dragend", () => {
        dragable.classList.remove("dragging");
        firstDrag = 0

        newIndex = Array.prototype.indexOf.call(dragableContainer.children, dragable);

        let element = favourities[previousIndex];
        favourities.splice(previousIndex, 1)
        favourities.splice(newIndex, 0, element)
        
        chrome.storage.sync.set({favourities: favourities})
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
                if (Math.round(enteredElement.right) == dragableContainer.getBoundingClientRect().right && firstDrag < 2) {
                    e.target.before(draggingElement)
                    firstDrag++;
                }
                else {
                    e.target.after(draggingElement)
                    firstDrag = 0
                }
            }
            else {
                if (Math.round(enteredElement.left) == dragableContainer.getBoundingClientRect().left &&
                    Math.round(enteredElement.top) != dragableContainer.getBoundingClientRect().top &&
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

