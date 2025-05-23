  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");

  let container = document.getElementById("canvas-container");

  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  let w = canvas.width;
  let h = canvas.height;

  let flow = {
    "nodes": [
      { "type": "start", "info": "", "next": "1" },
      { "type": "end", "info": "", "next": null }
    ],
    "variables": []
  };






  let frecceSelected = -1;
  let nodoSelected = -1;
  let nodi = [];
  let frecce = [];

  let tabVariabili=document.getElementById("tabVariabili");

  let rigaTabella = [];

  function chiudiPopup(){
    document.getElementById("popup-window").classList.remove("active");
  }

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
    frecce = []
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
        let toWrite = node.text
        if(flow.nodes[i].type != "end" && flow.nodes[i].type != "start"){
            toWrite+=":\n"+ flow.nodes[i].info;
            if(flow.nodes[i].info == ""){
              toWrite+="empty"
            }
        }
        ctx.fillText(toWrite, cx, cy);
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
  function checkClick(event){
    clickNodo(event)
    clickFreccia(event)
  }
  function clickFreccia(event) {
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    for (let i = 0; i < frecce.length; i++) {
      const freccia = frecce[i];
      if (isPointNearLine(clickX, clickY, freccia.inzioX, freccia.inzioY, freccia.fineX, freccia.fineY, 8)) {
        console.log("Hai cliccato la freccia", freccia.id);
        document.getElementById("popup-window").classList.add("active");
        frecceSelected = freccia.id;
        return;
      }
    }

    console.log("Nessuna freccia cliccata");
  }
  function clickNodo(event) {
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    for (let i = 0; i < nodi.length; i++) {
      const node = nodi[i];
      const x0 = node.relX * w - node.width / 2;
      const y0 = node.relY * h - node.height / 2;
      const x1 = x0 + node.width;
      const y1 = y0 + node.height;

      if (clickX >= x0 && clickX <= x1 && clickY >= y0 && clickY <= y1) {
        console.log("Hai cliccato il nodo", i);
        if(flow.nodes[i].type != "start" && flow.nodes[i].type != "end"){
          document.getElementById("edit-node-popup").classList.add("active");
          if(flow.nodes[i].info != ""){
            document.getElementById("edit-node-input").value = flow.nodes[i].info
          }else{
            document.getElementById("edit-node-input").value = "" 
          }
        }  
        nodoSelected = i;
        return;
      }
    }

    console.log("Nessun nodo cliccato");
  }
  function salvaInfo(){
      flow.nodes[nodoSelected].info = document.getElementById("edit-node-input").value;
      chiudiEditPopup()
      draw(nodi)
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

  // Una variabile deve iniziare con una lettera e contenere solo lettere e numeri
  function lettereENumeri(str) {
      return /^[a-zA-Z][a-zA-Z0-9]*$/.test(str);
  }

  function aggiungiVaribile(event) {
    // trova la riga su cui è stato attivato l'evento
    let target = event.target;
    // risali fino alla riga (tr)
    while (target && target.tagName !== "TR") {
      target = target.parentElement;
    }
    if (!target) return;

    // aggiungi la riga solo se la riga modificata è l'ultima della tabella
    let isUltimaRiga = (target.rowIndex === tabVariabili.rows.length - 1);

    let cella1 = target.cells[0];
    let cella2 = target.cells[1];
    let cella3 = target.cells[2];
    let f = false;
    let valore;
    let tipo = cella2.querySelector("select").value;
    let val1 = cella1.querySelector("input").value;
    let val3 = cella3.querySelector("input").value;

    // rimuovi eventuali messaggi di errore precedenti
    let oldError = target.querySelector(".error-message");
    if (oldError) oldError.remove();

    // controllo: se NON è l'ultima riga e tutte le celle sono vuote, elimina la riga
    if (!isUltimaRiga && val1 === "" && val3 === "") {
      // rimuovi anche da flow.variables
      flow.variables.splice(target.rowIndex - 1, 1);
      tabVariabili.deleteRow(target.rowIndex);
      return;
    }

    // controlla se tutte le celle sono piene
    if (val1 === "" || val3 === "") {
      return;
    }
    let errMsg = "";
    // controlla se il valore della prima cella è valido
    if (lettereENumeri(val1)) {
      switch (tipo) {
        case "int":
          if (/^-?\d+$/.test(val3)) {
            f = true;
            valore = parseInt(val3);
          } else {
            errMsg = "Il valore deve essere un intero valido.";
          }
          break;
        case "float":
          if (/^-?\d*\.\d+$/.test(val3) || /^-?\d+\.\d*$/.test(val3)) {
            f = true;
            valore = parseFloat(val3);
          } else {
            errMsg = "Il valore deve essere un numero decimale valido.";
          }
          break;
        case "string":
          if (val3 !== "") {
            f = true;
            valore = val3;
          } else {
            errMsg = "Il valore stringa non può essere vuoto.";
          }
          break;
      }
    } else {
      errMsg = "Il nome della variabile deve iniziare con una lettera e contenere solo lettere (a-z, A-Z) e numeri (0-9).";
    }

    // se i dati sono corretti, aggiorna o aggiungi la variabile
    if (f) {
      if (!isUltimaRiga) {
        // Modifica una variabile esistente
        let idx = target.rowIndex - 1;
        if (flow.variables[idx]) {
          flow.variables[idx].name = val1;
          flow.variables[idx].type = tipo;
          flow.variables[idx].value = val3;
        }
      } else {
        // Aggiungi una nuova variabile solo se non già inserita
        if (target.getAttribute("data-inserito") === "1") return;
        target.setAttribute("data-inserito", "1");
        let variabile = { "name": val1, "type": tipo, "value": val3 };
        flow.variables.push(variabile);
        let riga = {
          name: val1,
          type: tipo,
          value: valore,
        }
        rigaTabella.push(riga);
        inserisciRiga();
        let nuovaRiga = tabVariabili.rows[tabVariabili.rows.length - 1];
        nuovaRiga.addEventListener("change", aggiungiVaribile);
      }
    } else {
      // mostra un messaggio di errore in una nuova riga subito sotto quella corrente
      let errorRow = tabVariabili.insertRow(target.rowIndex + 1);
      let errorCell = errorRow.insertCell();
      errorCell.colSpan = 3;
      errorCell.className = "error-message";
      errorCell.textContent = "Dati non validi. " + errMsg;
      // rimuovi il messaggio se la riga viene modificata di nuovo
      let removeError = () => {
        if (errorRow.parentNode) errorRow.parentNode.removeChild(errorRow);
        target.removeEventListener("input", removeError, true);
      };
      target.addEventListener("input", removeError, true);
    }
    console.log(flow.variables)
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
      {value: "int", text: "Integer"},
      {value: "float", text: "Float"},
      {value: "string", text: "String"}
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
    canvas.addEventListener("click",checkClick);
    let ultimaRiga = tabVariabili.rows[tabVariabili.rows.length - 1];
    if (ultimaRiga) {
      ultimaRiga.addEventListener("change", aggiungiVaribile);
    }
    // svuota il contenuto della cella 1 e 3 della riga 1 (indice 1)
    if (tabVariabili.rows.length > 0) {
      let primaRiga = tabVariabili.rows[1];
      if (primaRiga.cells.length >= 3) {
        let cella1Input = primaRiga.cells[0].querySelector("input");
        let cella3Input = primaRiga.cells[2].querySelector("input");
        if (cella1Input) {
          cella1Input.value = "";
        }
        if (cella3Input) {
          cella3Input.value = "";
        }
      }
    }
  }

  function inserisciNodo(tipo){
    let nodo = {"type": tipo, "info":"", "next": frecceSelected+2+""}
    flow.nodes.splice(frecceSelected+1, 0, nodo);
    for(i=frecceSelected+2; i<flow.nodes.length-1; i++){
      flow.nodes[i].next = (parseInt(flow.nodes[i].next)+1) + ""
    }
    nodi.splice(frecceSelected+1, 0,{
        relX: 0.35,
        relY: 0.2,
        width: 100,
        height: 40,
        color: "white",
        text: tipo
    })
    
    calcoloY(nodi)
    draw(nodi)

    chiudiPopup() 
  }

  function calcoloY(nodi){
    let start = 0.05
    for(i=0;i<nodi.length;i++){
      nodi[i].relY = start
      start+=0.1
    }
  }

  function chiudiEditPopup(){
    document.getElementById("edit-node-popup").classList.remove("active");
  }

  function run(){
    executeFlow(flow)
  }