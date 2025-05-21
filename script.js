let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let container = document.getElementById("canvas-container");

canvas.width = container.offsetWidth;
canvas.height = container.offsetHeight;

let w = canvas.width;
let h = canvas.height;

let dragging = null;
const MIN_DISTANCE = 150; 

let nodi = [];
let frecce = [];

let tabVariabili=document.getElementById("tabVariabili");

let rigaTabella = [];

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
    const node = forme[i];

    // calcolo posizione in alto a sinistra
    const x0 = node.relX * w - node.width  / 2;
    const y0 = node.relY * h - node.height / 2;
    // coordinate del centro del nodo
    const cx = x0 + node.width  / 2;
    const cy = y0 + node.height / 2;

    // disegno il rettangolo
    ctx.fillStyle   = node.color;
    ctx.fillRect(x0, y0, node.width, node.height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x0, y0, node.width, node.height);

    // disegno il testo al centro, se esiste
    if (node.text) {
      const fontSize = 14;
      ctx.font         = `${fontSize}px Arial`;
      ctx.fillStyle    = "black";
      ctx.textAlign    = "center";  // orizzontale
      ctx.textBaseline = "middle";  // verticale
      ctx.fillText(node.text, cx, cy);
    }
  }
  for (let i = 0; i < forme.length-1; i++) {
    const node = forme[i];
    const node1 = forme[i+1];
    let xSopra=node.relX*w;
    let ySopra=node.relY*h + node.height/2;
    let xSotto=node1.relX*w;
    let ySotto=node1.relY*h - node.height/2;
    drawLine(xSopra,ySopra,xSotto,ySotto);
  }
}


function drawLine(x1, y1, x2, y2) {
    let n=frecce.length;
    frecce.push( {
      inzioX: x1,
      inzioY: y1,
      fineX: x2,
      fineY: y2,
      id: n
    });
    ctx.beginPath();
    ctx.moveTo(x1, y1);       
    ctx.lineTo(x2, y2);       
    ctx.strokeStyle = "black";  
    ctx.lineWidth = 2;    
    ctx.stroke();             
}
function aggiungiNodo(event) {
  let rect = canvas.getBoundingClientRect();
  let clickX = event.clientX - rect.left;
  let clickY = event.clientY - rect.top;

  for (let i = 0; i < frecce.length; i++) {
    const freccia = frecce[i];
    if (isPointNearLine(clickX, clickY, freccia.inzioX, freccia.inzioY, freccia.fineX, freccia.fineY, 8)) {
      console.log("Hai cliccato la freccia", freccia.id);
      return;
    }
  }

  console.log("Nessuna freccia cliccata");
}
function isPointNearLine(clickX, clickY, x1, y1, x2, y2, distanza) {
    let f=false; //Se false nessuan freccia cliccata, se true allora rilevato
    if(clickX <= x1 + distanza && clickX >= x1-distanza){
      if(clickY >= y1 && clickY <= y2){
        f=true;
      }
    }
    return f;
}

function lettereENumeri(str) {
    return /^[a-zA-Z0-9]+$/.test(str) && /[a-zA-Z]/.test(str);
}

function aggiungiVaribile(){
  let nRighe=tabVariabili.rows.length;
  let cella1= tabVariabili.rows[nRighe-1].cells[0];
  let cella2= tabVariabili.rows[nRighe-1].cells[1];
  let cella3= tabVariabili.rows[nRighe-1].cells[2];
  let f=false;
  let valore;
  let tipo = cella2.querySelector("select").value;
  if(cella1.querySelector("input").value!="" && lettereENumeri(cella1.querySelector("input").value) ){
    
    switch (tipo){
      case "i":
        if(!isNaN(parseInt(cella3.querySelector("input").value))){
          f=true;
          valore=parseInt(cella3.querySelector("input").value);
        }
        break;
      case "r":
        if(!isNaN(parseFloat(cella3.querySelector("input").value))){
          f=true;
          valore=parseFloat(cella3.querySelector("input").value);
        }
        break;
      case "s":
        if(cella3.querySelector("input").value!=""){
          f=true;
          valore=cella3.querySelector("input").value;
        }
        break;
    }
  }
  if(f){
    let riga = { //salvo qui le variabili -> per artifoni: mettere in json
      name: cella1.querySelector("input").value,
      type: tipo,
      value: valore,
    }
    rigaTabella.push(riga);
    inserisciRiga();
  }else{
    cella1.style.backgroundColor = "red";
    cella2.style.backgroundColor = "red";
    cella3.style.backgroundColor = "red";
    
  }
}

function inserisciRiga(){
  let nuovaRiga=tabVariabili.insertRow();
  let cell1,cell2,cell3;
  cell1= nuovaRiga.insertCell();
  cell2= nuovaRiga.insertCell();
  cell3= nuovaRiga.insertCell();
  let inputCella1=document.createElement("input");
  let inputCella3=document.createElement("input");
  let selectCella2=document.createElement("select");
  inputCella1.type="text";
  inputCella3.type="text";

  let option=[
    {value: "i", text: "Integer"},
    {value: "f", text: "Float"},
    {value: "s", text: "String"}
  ];
  let selectOptions= [];
  let i;
  for(i=0; i<3; i++){
    selectOptions[i]=document.createElement("option");
    selectOptions[i].value=option[i].value;
    selectOptions[i].textContent=option[i].text;
    selectCella2.appendChild(selectOptions[i]);
  }
  inputCella1.classList.add("inputVariable");
  selectCella2.classList.add("inputVariable");
  inputCella3.classList.add("inputVariable");
  cell1.appendChild(inputCella1);
  cell2.appendChild(selectCella2);
  cell3.appendChild(inputCella3);
}

window.onload = function (){
  window.addEventListener("resize", resizeCanvas);
  
    //Disegno start
    nodi.push({
      relX: 0.35,
      relY: 0.05,
      width: 100,
      height: 40,
      color: "white",
      text: "Start"
  });
  //Disegno End
  nodi.push({
      relX: 0.35,
      relY: 0.4,
      width: 100,
      height: 40,
      color: "white",
      text: "End"
  })
  draw(nodi);
  canvas.addEventListener("click",aggiungiNodo);
  tabVariabili.addEventListener("change",aggiungiVaribile);

}