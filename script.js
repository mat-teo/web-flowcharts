let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let container = document.getElementById("canvas-container");

canvas.width = container.offsetWidth;
canvas.height = container.offsetHeight;

let w = canvas.width;
let h = canvas.height;

let dragging = null;
const MIN_DISTANCE = 150; 

let nodi = []
nodi.push({
    relX: 0.5,
    relY: 0.5,
    width: 100,
    height: 100,
    color: "red"
})

nodi.push({
    relX: 0.25,
    relY: 0.25,
    width: 50,
    height: 50,
    color: "lime"
})


window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth - 10;
    canvas.height = window.innerHeight - 10;
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    draw(nodi);
}

function draw(forme) {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < forme.length; i++) {
        ctx.fillStyle = forme[i].color;
        let x = forme[i].relX * w - forme[i].width / 2;
        let y = forme[i].relY * h - forme[i].height / 2;
        ctx.fillRect(x, y, forme[i].width, forme[i].height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(x, y, forme[i].width, forme[i].height);
    }
    drawConnections();
}
function drawConnections() {
    for (let i = 1; i < nodi.length; i++) {
        let x1 = nodi[i-1].relX * w;
        let y1 = nodi[i-1].relY * h;;
        let x2 = nodi[i].relX * w;
        let y2 = nodi[i].relY * h;

        if(Math.abs(y1-y2) >= nodi[i-1].height/2 + nodi[i].height/2){
            if (y1 < y2) {
                y1 = y1 + nodi[i-1].height / 2;
                y2 = y2 - nodi[i].height / 2;
            }else{
                y1 = y1 - nodi[i-1].height / 2;
                y2 = y2 + nodi[i].height / 2;
            }
        }else{
            if(x1 < x2){
                x1 = x1 + nodi[i-1].width / 2;
                x2 = x2 - nodi[i].width / 2;
            }else{
                x1 = x1 - nodi[i-1].width / 2;
                x2 = x2 + nodi[i].width / 2;    
            }
        }
                
        drawLine(x1, y1, x2, y2);

        const angle = Math.atan2(y2 - y1, x2 - x1);   // disegno punta della freccia
        const angle1 = angle + Math.PI / 7;
        const angle2 = angle - Math.PI / 7;

        const x3 = x2 - 10 * Math.cos(angle1);
        const y3 = y2 - 10 * Math.sin(angle1);
        const x4 = x2 - 10 * Math.cos(angle2);
        const y4 = y2 - 10 * Math.sin(angle2);

        drawLine(x2, y2, x3, y3);
        drawLine(x2, y2, x4, y4);
    }
}

canvas.addEventListener("mousedown", getClick)
canvas.addEventListener("mousemove", drag)
document.addEventListener("mouseup", () => {
    dragging = null;
});

Array.from(document.getElementsByClassName("node")).forEach((node)=>{
    node.addEventListener("mousedown", (e) => {
        nodi.push({
            relX: 0,
            relY: 0,
            width: 100,
            height: 100,
            color: "red"
        })
        dragging = nodi[nodi.length-1];
    });
})

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = 0; i < nodi.length; i++) {
        const nodo = nodi[i];
        const x = nodo.relX * w - nodo.width / 2;
        const y = nodo.relY * h - nodo.height / 2;

        if (
            mouseX >= x &&
            mouseX <= x + nodo.width &&
            mouseY >= y &&
            mouseY <= y + nodo.height
        ) {  //prima di eliminare definitivamente il nodo, mostra un popup per eventualmente annullare 
            const popup = document.createElement("div");
            popup.textContent = "Nodo eliminato. Annulla?";
            popup.style.position = "fixed";
            popup.style.bottom = "20px";
            popup.style.left = "20px";
            popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            popup.style.color = "white";
            popup.style.padding = "10px";
            popup.style.borderRadius = "5px";
            popup.style.zIndex = "1000";
            document.body.appendChild(popup);

            const undoTimeout = setTimeout(() => {
                document.body.removeChild(popup);
            }, 3000);

            const undoButton = document.createElement("button");
            undoButton.textContent = "Annulla";
            undoButton.style.marginLeft = "10px";
            undoButton.style.backgroundColor = "white";
            undoButton.style.color = "black";
            undoButton.style.border = "none";
            undoButton.style.padding = "5px 10px";
            undoButton.style.cursor = "pointer";
            popup.appendChild(undoButton);

            const removedNode = nodi.splice(i, 1)[0];
            draw(nodi);

           
            const undoKeyHandler = (event) => {
                if (event.ctrlKey && event.key === "z") {
                    clearTimeout(undoTimeout);
                    nodi.splice(i, 0, removedNode);
                    draw(nodi);
                    document.body.removeChild(popup);
                    document.removeEventListener("keydown", undoKeyHandler);
                }
            };

            document.addEventListener("keydown", undoKeyHandler);

            undoButton.addEventListener("click", () => {
                clearTimeout(undoTimeout);
                nodi.splice(i, 0, removedNode);
                draw(nodi);
                document.body.removeChild(popup);
                document.removeEventListener("keydown", undoKeyHandler);
            });
            
            
            
            break;
        }
    }
});

function getClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = 0; i < nodi.length; i++) {
      const nodo = nodi[i];
      const x = nodo.relX * w - nodo.width / 2;
      const y = nodo.relY * h - nodo.height / 2;

      if (
        mouseX >= x &&
        mouseX <= x + nodo.width &&
        mouseY >= y &&
        mouseY <= y + nodo.height
      ) {
        dragging = nodi[i];
        break;
      }
    }
}

function drag(e) {
    if (dragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let newX = mouseX;
        let newY = mouseY;

        newX = Math.max(0, Math.min(newX, w - dragging.width));
        newY = Math.max(0, Math.min(newY, h - dragging.height));

        for (let i = 0; i < nodi.length; i++) {
            if (nodi[i] === dragging) continue;

            const otherX = (nodi[i].relX * w - nodi[i].width / 2) + nodi[i].width / 2;
            const otherY = (nodi[i].relY * h - nodi[i].height / 2) + nodi[i].height / 2;

            const distX = newX - otherX;
            const distY = newY - otherY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < MIN_DISTANCE) {
                return;
            }
        }

        dragging.relX = newX / w;
        dragging.relY = newY / h;

        draw(nodi);
    }
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);       
    ctx.lineTo(x2, y2);       
    ctx.strokeStyle = "black";  
    ctx.lineWidth = 2;    
    ctx.stroke();             
}

draw(nodi)