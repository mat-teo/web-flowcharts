// Riferimenti agli elementi del canvas e al contesto di disegno
  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");
  let container = document.getElementById("canvas-container");

  // Impostazioni iniziali delle dimensioni del canvas
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  let w = canvas.width;
  let h = canvas.height;
  
  let saved
  // Struttura dati principale per la logica del flowchart
  let flow = {
    "nodes": [
      { "type": "start", "info": "", "next": "1" },
      { "type": "end", "info": "", "next": null }
    ],
    "variables": []
  };

  // Variabili per tenere traccia della selezione corrente dell'utente
  let frecceSelected = -1; // Indice della freccia selezionata
  let nodoSelected = -1;   // Indice del nodo selezionato

  // Array per gli oggetti visuali (nodi e frecce) sul canvas
  let nodi = [];
  let frecce = [];

  // Riferimento alla tabella HTML delle variabili
  let tabVariabili = document.getElementById("tabVariabili");
  // Array per la gestione delle righe della tabella 
  let rigaTabella = [];



   // Nasconde la finestra popup utilizzata per selezionare il tipo di nodo da inserire.
  function chiudiPopup() {
    document.getElementById("popup-window").classList.remove("active");
  }

  /**
   * Adapta le dimensioni del canvas quando la finestra del browser viene ridimensionata
   * e ridisegna l'intero flowchart.
   */
  function resizeCanvas() {
    canvas.width = window.innerWidth - 10;
    canvas.height = window.innerHeight - 10;
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;
    draw(nodi); // Ridisegna tutto
  }

  /**
   * Disegna l'intero flowchart (nodi e frecce) sul canvas.
   * @param {Array} forme - Array degli oggetti nodo visuali da disegnare.
   */
  
  /**
   * Disegna una linea tra due punti.
   * Se 'salva' è true, la linea viene aggiunta all'array 'frecce' per la rilevazione dei click.
   */
  function drawLine(x1, y1, x2, y2, salva) {
    if (salva) {
      frecce.push({ inzioX: x1, inzioY: y1, fineX: x2, fineY: y2, id: frecce.length });
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Gestore dell'evento click sul canvas.
   * Verifica se il click è avvenuto su un nodo o su una freccia.
   */
  function checkClick(event) {
    clickNodo(event);
    clickFreccia(event);
  }

  /**
   * Gestisce il click su una freccia.
   * Se una freccia viene cliccata, apre il popup per l'inserimento di un nuovo nodo.
   */
  function clickFreccia(event) {
    // Blocco 1: Calcola le coordinate del click relative al canvas
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    // Blocco 2: Itera sulle frecce disegnate e verifica se qualcuna è stata cliccata
    // La funzione 'isPointNearLine' è usata per questa verifica.
    for (let i = 0; i < frecce.length; i++) {
      const freccia = frecce[i];
      if (isPointNearLine(clickX, clickY, freccia.inzioX, freccia.inzioY, freccia.fineX, freccia.fineY, 8)) {
        console.log("Hai cliccato la freccia", freccia.id);
        document.getElementById("popup-window").classList.add("active"); // Mostra il popup
        frecceSelected = freccia.id; // Memorizza l'ID della freccia
        return;
      }
    }
  }

  /**
   * Disegna una freccia "a gomito" dal lato destro del nodo 'from' al nodo 'to',
   * tipicamente usata per il ramo 'true' di un nodo 'if', con un'etichetta.
   */
  // In script.js

/**
 * Disegna una linea tra due punti.
 * Se 'salva' è true, la linea viene aggiunta all'array 'frecce' per la rilevazione dei click,
 * includendo informazioni sul nodo di partenza, di destinazione e il tipo di freccia.
 * @param {number} x1 - Coordinata X del punto di inizio.
 * @param {number} y1 - Coordinata Y del punto di inizio.
 * @param {number} x2 - Coordinata X del punto di fine.
 * @param {number} y2 - Coordinata Y del punto di fine.
 * @param {boolean} salva - Se true, salva la freccia nell'array 'frecce'.
 * @param {number} fromNodeIndex - Indice del nodo di partenza (da flow.nodes).
 * @param {number} toNodeIndex - Indice del nodo di destinazione (da flow.nodes).
 * @param {string} arrowType - Tipo di freccia ('normal', 'if_true', 'if_false').
 */
function drawLine(x1, y1, x2, y2, salva, fromNodeIndex, toNodeIndex, arrowType) {
  if (salva) {
    frecce.push({
      inzioX: x1, inzioY: y1, fineX: x2, fineY: y2,
      id: frecce.length, // L'ID univoco della freccia
      fromNodeIndex: fromNodeIndex, // Indice del nodo di partenza nella logica flow.nodes
      toNodeIndex: toNodeIndex,     // Indice del nodo di destinazione nella logica flow.nodes
      type: arrowType         // Tipo di freccia: 'normal', 'if_true', 'if_false'
    });
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Disegna l'intero flowchart (nodi e frecce) sul canvas.
 * @param {Array} forme - Array degli oggetti nodo visuali da disegnare.
 */
function draw(forme) {
  ctx.clearRect(0, 0, w, h); // Pulisce il canvas
  frecce = []; // Resetta l'array delle frecce, che verranno ricalcolate

  // Blocco 1: Disegna tutti i nodi (rettangoli e testo)
  for (let i = 0; i < forme.length; i++) {
    const node = forme[i];
    const x0 = node.relX * w - node.width / 2;
    const y0 = node.relY * h - node.height / 2;
    const cx = x0 + node.width / 2;
    const cy = y0 + node.height / 2;

    ctx.fillStyle = node.color;
    ctx.fillRect(x0, y0, node.width, node.height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x0, y0, node.width, node.height);
    //scirtta dentro
    if (node.text) {
      let toWrite = node.text;
      if (flow.nodes[i] && (flow.nodes[i].type != "end" && flow.nodes[i].type != "start")) { // Aggiunto controllo flow.nodes[i]
        toWrite += ":\n" + (flow.nodes[i].info || "empty");
      }
      ctx.font = `14px Arial`;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(toWrite, cx, cy);
    }
  }

  // Blocco 2: Disegna le frecce di collegamento tra i nodi
  // Questo avviene dopo aver disegnato tutti i nodi per avere le loro posizioni corrette.
  for (let i = 0; i < forme.length; i++) {
    const node = forme[i]; // Nodo visuale di partenza
    const logic = flow.nodes[i]; // Nodo logico corrispondente

    if (!logic) continue; // Salta se il nodo logico non esiste (potrebbe accadere durante manipolazioni intense)

    const xMid = node.relX * w;
    const yMid = node.relY * h;
    const nodeHeight = node.height;

    // Gestisce le frecce per i nodi "if" (con rami true/false)
    if (logic.type === "if" && typeof logic.next === "object") {
      const trueIndex = parseInt(logic.next.true);
      const falseIndex = parseInt(logic.next.false);
      if (!isNaN(trueIndex) && forme[trueIndex]) {
        // Passa l'indice del nodo 'if' (i) e l'indice del nodo target del ramo 'true'
        drawArrowFromRight(node, forme[trueIndex], "T", i, trueIndex);
      }
      if (!isNaN(falseIndex) && forme[falseIndex]) {
        // Passa l'indice del nodo 'if' (i) e l'indice del nodo target del ramo 'false'
        drawArrowFromLeft(node, forme[falseIndex], "F", i, falseIndex);
      }
    // Gestisce le frecce per gli altri tipi di nodi (con una singola uscita 'next')
    } else if (typeof logic.next === "string" && logic.next !== null) {
      const nextIndex = parseInt(logic.next);
      if (!isNaN(nextIndex) && forme[nextIndex]) {
        const target = forme[nextIndex];
        // Passa l'indice del nodo corrente (i) e l'indice del nodo successivo
        drawLine(xMid, yMid + nodeHeight / 2, target.relX * w, target.relY * h - target.height / 2, true, i, nextIndex, 'normal');
      }
    }
  }
}

/**
 * Disegna una freccia "a gomito" dal lato destro del nodo 'from' al nodo 'to',
 * tipicamente usata per il ramo 'true' di un nodo 'if', con un'etichetta.
 * @param {object} from - Nodo visuale di partenza.
 * @param {object} to - Nodo visuale di destinazione.
 * @param {string} label - Etichetta da disegnare sulla freccia (es. "T").
 * @param {number} fromNodeIndex - Indice del nodo di partenza in flow.nodes.
 * @param {number} toNodeIndex - Indice del nodo di destinazione in flow.nodes.
 */
function drawArrowFromRight(from, to, label, fromNodeIndex, toNodeIndex) {
    const startX = from.relX * w + from.width / 2;
    const startY = from.relY * h;
    const midX = startX + 40; // Punto X del gomito
    const targetAttachX = to.relX * w; // Coordinata X centrale del nodo target
    const targetAttachY = to.relY * h - to.height / 2; // Bordo superiore del nodo target
    const horizontalLineY = targetAttachY - 10; // Y per il segmento orizzontale vicino al cerchio/target (10 è raggio cerchio)

    drawLine(startX, startY, midX, startY, false); // Segmento orizzontale dal nodo sorgente
    // Il segmento verticale è quello principale cliccabile per le frecce 'if'
    drawLine(midX, startY, midX, horizontalLineY, true, fromNodeIndex, toNodeIndex, 'if_true');
    drawLine(midX, horizontalLineY, targetAttachX, horizontalLineY, false); // Segmento orizzontale verso il nodo target

    // Disegna un cerchio nel punto di connessione e l'etichetta
    ctx.beginPath();
    ctx.arc(targetAttachX, horizontalLineY, 10, 0, 2 * Math.PI, false); // Cerchio di connessione
    ctx.stroke();
    ctx.fillStyle = "green"; // Colore per il testo del ramo True
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    // Etichetta posizionata a metà del segmento verticale
    ctx.fillText(label, midX, startY + (horizontalLineY - startY) / 2);

    // Linea finale dal cerchio al bordo superiore del nodo target
    drawLine(targetAttachX, horizontalLineY, targetAttachX, targetAttachY, false);
}

/**
 * Disegna una freccia "a gomito" dal lato sinistro del nodo 'from' al nodo 'to',
 * tipicamente usata per il ramo 'false' di un nodo 'if', con un'etichetta.
 * @param {object} from - Nodo visuale di partenza.
 * @param {object} to - Nodo visuale di destinazione.
 * @param {string} label - Etichetta da disegnare sulla freccia (es. "F").
 * @param {number} fromNodeIndex - Indice del nodo di partenza in flow.nodes.
 * @param {number} toNodeIndex - Indice del nodo di destinazione in flow.nodes.
 */
function drawArrowFromLeft(from, to, label, fromNodeIndex, toNodeIndex) {
    const startX = from.relX * w - from.width / 2;
    const startY = from.relY * h;
    const midX = startX - 40; // Punto X del gomito
    const targetAttachX = to.relX * w; // Coordinata X centrale del nodo target
    const targetAttachY = to.relY * h - to.height / 2; // Bordo superiore del nodo target
    const horizontalLineY = targetAttachY - 10; // Y per il segmento orizzontale vicino al cerchio/target

    drawLine(startX, startY, midX, startY, false); // Segmento orizzontale dal nodo sorgente
    // Il segmento verticale è quello principale cliccabile
    drawLine(midX, startY, midX, horizontalLineY, true, fromNodeIndex, toNodeIndex, 'if_false');
    drawLine(midX, horizontalLineY, targetAttachX, horizontalLineY, false); // Segmento orizzontale verso il nodo target

    // Disegna un cerchio nel punto di connessione e l'etichetta
    ctx.beginPath();
    ctx.arc(targetAttachX, horizontalLineY, 10, 0, 2 * Math.PI, false); // Cerchio di connessione
    ctx.stroke();
    ctx.fillStyle = "red"; // Colore per il testo del ramo False
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    // Etichetta posizionata a metà del segmento verticale
    ctx.fillText(label, midX, startY + (horizontalLineY - startY) / 2);
    
    // Linea finale dal cerchio al bordo superiore del nodo target
    drawLine(targetAttachX, horizontalLineY, targetAttachX, targetAttachY, false);
}


/**
 * Inserisce un nuovo nodo logico e visuale nel flowchart quando l'utente clicca su una freccia.
 * @param {string} tipo - Il tipo di nodo da inserire (es. "input", "print", "if").
 */
function inserisciNodo(tipo) {
    saved = false; // Segna che ci sono modifiche non salvate
    if (frecceSelected === -1 || !frecce[frecceSelected]) {
        console.error("Nessuna freccia selezionata o freccia non valida.");
        chiudiPopup();
        return;
    }

    const clickedArrow = frecce[frecceSelected];
    const parentNodeIndex = clickedArrow.fromNodeIndex;
    const originalTargetNodeIndex = clickedArrow.toNodeIndex;

    // Il nuovo nodo verrà inserito logicamente nell'array flow.nodes.
    // Una strategia comune è inserirlo all'indice del target originale.
    // Il target originale e tutti i nodi successivi verranno scalati di uno.
    const newActualNodeIndex = originalTargetNodeIndex;

    let newNodeLogic;
    if (tipo === "if") {
        newNodeLogic = {
            "type": "if",
            "info": "", // L'utente la modificherà in seguito
            "next": {
                // Entrambi i rami del nuovo "if" puntano inizialmente al target originale della freccia cliccata.
                // Dopo l'inserimento, questo sarà (newActualNodeIndex + 1).
                "true": (newActualNodeIndex + 1).toString(),
                "false": (newActualNodeIndex + 1).toString()
            }
        };
    } else {
        newNodeLogic = {
            "type": tipo,
            "info": "", // L'utente la modificherà
            // Il nuovo nodo punta al target originale della freccia cliccata.
            // Dopo l'inserimento, questo sarà (newActualNodeIndex + 1).
            "next": (newActualNodeIndex + 1).toString()
        };
    }

    // Inserisci il nuovo nodo logico in flow.nodes
    flow.nodes.splice(newActualNodeIndex, 0, newNodeLogic);

    // Aggiorna i puntatori 'next' (e 'true'/'false') di TUTTI i nodi a causa dello splice.
    // Qualsiasi puntatore che era >= newActualNodeIndex deve essere incrementato.
    for (let i = 0; i < flow.nodes.length; i++) {
        let n = flow.nodes[i];

        // Non modificare il nodo appena inserito (newNodeLogic) in questo ciclo, 
        // i suoi puntatori 'next' sono già stati impostati correttamente
        // in relazione alla sua nuova posizione e ai nodi che lo seguono.
        if (i === newActualNodeIndex && n === newNodeLogic) {
            continue; 
        }
        
        if (n.type === "if" && typeof n.next === "object") {
            let oldTrue = parseInt(n.next.true);
            let oldFalse = parseInt(n.next.false);

            // Se il puntatore true puntava a un indice che ora è scalato
            if (!isNaN(oldTrue) && oldTrue >= newActualNodeIndex) {
                n.next.true = (oldTrue + 1).toString();
            }
            // Se il puntatore false puntava a un indice che ora è scalato
            if (!isNaN(oldFalse) && oldFalse >= newActualNodeIndex) {
                n.next.false = (oldFalse + 1).toString();
            }
        } else if (typeof n.next === "string" && n.next !== null) {
            let oldNext = parseInt(n.next);
            // Se il puntatore next puntava a un indice che ora è scalato
            if (!isNaN(oldNext) && oldNext >= newActualNodeIndex) {
                n.next = (oldNext + 1).toString();
            }
        }
    }
    
    // Ora, aggiorna il nodo genitore (da cui partiva la freccia cliccata) per puntare al nuovo nodo.
    // L'indice parentNodeIndex è ancora valido perché l'inserimento è avvenuto a newActualNodeIndex (originalTargetNodeIndex).
    // Se parentNodeIndex < newActualNodeIndex, il suo indice non è cambiato.
    // Se parentNodeIndex == newActualNodeIndex, sarebbe un caso strano (nodo che punta a se stesso e si inserisce "prima"?).
    // Normalmente, parentNodeIndex sarà < newActualNodeIndex.
    const parentNodeToUpdate = flow.nodes[parentNodeIndex]; 
    if (parentNodeToUpdate) { // Controllo di sicurezza
        if (clickedArrow.type === 'normal') {
            parentNodeToUpdate.next = newActualNodeIndex.toString();
        } else if (clickedArrow.type === 'if_true') {
            parentNodeToUpdate.next.true = newActualNodeIndex.toString();
        } else if (clickedArrow.type === 'if_false') {
            parentNodeToUpdate.next.false = newActualNodeIndex.toString();
        }
    }


    // Inserisci il nodo visuale
    const parentVisualNode = nodi[parentNodeIndex];
    nodi.splice(newActualNodeIndex, 0, {
        relX: parentVisualNode ? parentVisualNode.relX : 0.35,
        relY: 0, // calcoloY lo correggerà
        width: 100,
        height: 40,
        color: "white",
        text: tipo.charAt(0).toUpperCase() + tipo.slice(1)
    });

    calcoloY(nodi);
    draw(nodi);
    chiudiPopup();
    frecceSelected = -1; // Resetta la selezione

    // console.log("Nuovo flow:", JSON.parse(JSON.stringify(flow.nodes)));
}
  /**
   * Gestisce il click su un nodo.
   * Se un nodo (non 'start' o 'end') è cliccato, apre il popup per modificarne le informazioni.
   */
  function clickNodo(event) {
    // Blocco 1: Calcola le coordinate del click relative al canvas
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    // Blocco 2: Itera sui nodi e verifica se qualcuno è stato cliccato
    for (let i = 0; i < nodi.length; i++) {
      const node = nodi[i];
      const x0 = node.relX * w - node.width / 2;
      const y0 = node.relY * h - node.height / 2;
      const x1 = x0 + node.width;
      const y1 = y0 + node.height;

      if (clickX >= x0 && clickX <= x1 && clickY >= y0 && clickY <= y1) {
        console.log("Hai cliccato il nodo", i);
        // Apre il popup di modifica solo per nodi che non siano 'start' o 'end'
        if (flow.nodes[i].type != "start" && flow.nodes[i].type != "end") {
          document.getElementById("edit-node-popup").classList.add("active");
          document.getElementById("edit-node-title").innerHTML = "Edit " + flow.nodes[i].type +" node"
          document.getElementById("edit-node-input").value = flow.nodes[i].info || "";
        }
        nodoSelected = i; // Memorizza l'indice del nodo
        return;
      }
    }
  }

  /**
   * Salva le informazioni inserite nel popup di modifica del nodo
   * nel nodo logico corrispondente e ridisegna il flowchart.
   */
  function salvaInfo() {
    flow.nodes[nodoSelected].info = document.getElementById("edit-node-input").value;
    chiudiEditPopup();
    draw(nodi);
  }

  /**
   * Verifica se un punto (clickX, clickY) è vicino a un segmento di linea (x1,y1)-(x2,y2).
   * L'implementazione attuale è più adatta a rilevare click vicino a linee verticali.
   */
  function isPointNearLine(clickX, clickY, x1, y1, x2, y2, distanza) {
    let f = false;
    if (clickX <= x1 + distanza && clickX >= x1 - distanza) {
      if ((clickY >= y1 && clickY <= y2) || (clickY >= y2 && clickY <= y1)) {
        f = true;
      }
    }
    return f;
  }

  /**
   * Controlla se una stringa è un nome di variabile valido (inizia con lettera, poi lettere o numeri).
   */
  function lettereENumeri(str) {
    return /^[a-zA-Z][a-zA-Z0-9]*$/.test(str);
  }

  /**
   * Gestisce l'aggiunta o la modifica di una variabile nella tabella HTML.
   * Viene attivata quando l'utente modifica i campi di una riga della tabella.
   */
  function aggiungiVaribile(event) {
    // Blocco 1: Identifica la riga modificata e ottiene i valori inseriti dall'utente.
    let target = event.target;
    while (target && target.tagName !== "TR") target = target.parentElement;
    if (!target) return;

    let isUltimaRiga = (target.rowIndex === tabVariabili.rows.length - 1);
    let val1 = target.cells[0].querySelector("input").value.trim(); // Nome
    let tipo = target.cells[1].querySelector("select").value;    // Tipo
    let val3 = target.cells[2].querySelector("input").value.trim(); // Valore

    // Rimuove eventuali messaggi di errore precedenti
    let oldError = target.nextSibling;
    if (oldError && oldError.classList && oldError.classList.contains("error-message-row")) {
      oldError.remove();
    }

    // Blocco 2: Se non è l'ultima riga e i campi nome/valore sono vuoti, elimina la variabile.
    if (!isUltimaRiga && val1 === "" && val3 === "") {
      flow.variables.splice(target.rowIndex - 1, 1);
      tabVariabili.deleteRow(target.rowIndex);
      return;
    }

    // Se nome o valore sono vuoti (e non è un'eliminazione), attende input completo.
    if (val1 === "" || val3 === "") return;

    // Blocco 3: Valida il nome e il valore della variabile in base al tipo.
    let fValid = false;
    let valoreConvertito;
    let errMsg = "";
    if (lettereENumeri(val1)) {
      // Validazione specifica per tipo
      switch (tipo) {
        case "int":
          if (/^-?\d+$/.test(val3)) { fValid = true; valoreConvertito = parseInt(val3); }
          else { errMsg = "Il valore deve essere un intero valido."; }
          break;
        case "float":
          if (/^-?\d*\.\d+$/.test(val3) || /^-?\d+\.?\d*$/.test(val3)) { fValid = true; valoreConvertito = parseFloat(val3); }
          else { errMsg = "Il valore deve essere un numero decimale valido."; }
          break;
        case "string":
          fValid = true; valoreConvertito = val3;
          break;
      }
    } else {
      errMsg = "Nome variabile non valido.";
    }

    // Blocco 4: Se i dati sono validi, aggiorna/aggiunge la variabile logica e gestisce la tabella.
    if (fValid) {
      if (!isUltimaRiga) { // Modifica variabile esistente
        flow.variables[target.rowIndex - 1] = { name: val1, type: tipo, value: valoreConvertito };
      } else { // Aggiunge nuova variabile
        if (target.getAttribute("data-inserito") === "1") return; // Previene doppie aggiunte
        target.setAttribute("data-inserito", "1");
        flow.variables.push({ name: val1, type: tipo, value: valoreConvertito });
        inserisciRiga(); // Aggiunge nuova riga vuota per input futuro
        tabVariabili.rows[tabVariabili.rows.length - 1].addEventListener("change", aggiungiVaribile);
        target.removeAttribute("data-inserito");
      }
    // Blocco 5: Se i dati non sono validi, mostra un messaggio di errore.
    } else {
      let errorRow = tabVariabili.insertRow(target.rowIndex + 1);
      errorRow.classList.add("error-message-row");
      let errorCell = errorRow.insertCell();
      errorCell.colSpan = 3;
      errorCell.className = "error-message";
      errorCell.textContent = "Dati non validi. " + errMsg;
      target.addEventListener("input", () => { if (errorRow.parentNode) errorRow.remove(); }, { once: true });
    }
  }

  /**
   * Inserisce una nuova riga vuota (con campi input/select) nella tabella delle variabili HTML.
   */
  function inserisciRiga() {
    let nuovaRiga = tabVariabili.insertRow();
    let cell1 = nuovaRiga.insertCell();
    let cell2 = nuovaRiga.insertCell();
    let cell3 = nuovaRiga.insertCell();

    let inputNome = document.createElement("input");
    inputNome.type = "text"; inputNome.classList.add("inputVariable");
    cell1.appendChild(inputNome);

    let selectTipo = document.createElement("select");
    selectTipo.classList.add("inputVariable");
    ["int", "float", "string"].forEach(val => {
      let option = document.createElement("option");
      option.value = val; option.textContent = val.charAt(0).toUpperCase() + val.slice(1);
      if(val=="int"){
        option.textContent = "Integer"
      }
      selectTipo.appendChild(option);
    });
    cell2.appendChild(selectTipo);

    let inputValore = document.createElement("input");
    inputValore.type = "text"; inputValore.classList.add("inputVariable");
    cell3.appendChild(inputValore);
  }

  /**
   * Funzione eseguita al caricamento completo della pagina (onload).
   * Inizializza il flowchart di base, disegna e imposta gli event listener.
   */
  window.onload = function () {
    saved=true;
    window.addEventListener("resize", resizeCanvas);

    // Creazione dei nodi visuali iniziali (Start e End)
    nodi.push({ relX: 0.35, relY: 0.05, width: 100, height: 40, color: "white", text: "Start" });
    nodi.push({ relX: 0.35, relY: 0.4, width: 100, height: 40, color: "white", text: "End" });
    calcoloY(nodi); // Calcola le posizioni Y corrette
    draw(nodi);     // Disegna il flowchart iniziale

    canvas.addEventListener("click", checkClick); // Listener per click su nodi/frecce

    // Imposta il listener per la prima riga dati della tabella variabili
    if (tabVariabili.rows[1]) {
      tabVariabili.rows[1].addEventListener("change", aggiungiVaribile);
      // Svuota i campi della prima riga dati, se necessario
      tabVariabili.rows[1].cells[0].querySelector("input").value = "";
      tabVariabili.rows[1].cells[2].querySelector("input").value = "";
    }
  }

  /**
   * Inserisce un nuovo nodo logico e visuale nel flowchart quando l'utente clicca su una freccia.
   * Questa funzione è complessa per la gestione degli indici e dei puntatori 'next'.
   * @param {string} tipo - Il tipo di nodo da inserire (es. "input", "print", "if").
   */
  

  /**
   * Ricalcola e assegna le posizioni Y relative (relY) a tutti i nodi visuali
   * per distribuirli verticalmente in modo uniforme sul canvas.
   */
  function calcoloY(nodiArr) {
    let currentRelY = 0.05; // Posizione Y relativa di partenza
    const ySpacing = 0.05;  // Spaziatura verticale relativa tra i nodi
    const ifAdditionalSpacing = 0.06
    for (let i = 0; i < nodiArr.length; i++) {
      nodiArr[i].relY = currentRelY; // Assegna la posizione Y calcolata al nodo corrente
      let spacingForNextNode = (nodiArr[i].height / h) + ySpacing;
      const currentNodeLogic = flow.nodes[i];
      if (currentNodeLogic && currentNodeLogic.type === "if") {
        spacingForNextNode += ifAdditionalSpacing;
      }
      currentRelY += spacingForNextNode; // Aggiorna currentRelY per il prossimo nodo
    }
  }

  /**
   * Nasconde il popup utilizzato per modificare le informazioni di un nodo esistente.
   */
  function chiudiEditPopup() {
    document.getElementById("edit-node-popup").classList.remove("active");
  }

  /**
   * Avvia l'esecuzione del flowchart.
   * Chiama la funzione 'executeFlow' (definita in 'execute.js') passando la struttura logica 'flow'.
   */
 

   function saveFile(){
    document.getElementById("save-popup").classList ="active";
    document.getElementById('overlay').classList = 'active'
  }


  document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      console.log("Contenuto file:", content);
      try {
        const json = JSON.parse(content);
        // Qui puoi aggiornare il flow e i nodi, ad esempio:
        flow = json;
        // Aggiorna anche la rappresentazione grafica se necessario
        // Ricostruisci i nodi grafici in base a flow.nodes
        nodi = [];
        for (let i = 0; i < flow.nodes.length; i++) {
          let tipo = flow.nodes[i].type;
          nodi.push({
            relX: 0.35,
            relY: 0.05 + i * 0.1,
            width: 100,
            height: 40,
            color: "white",
            text: tipo.charAt(0).toUpperCase() + tipo.slice(1)
          });
        }
        while (tabVariabili.rows.length > 1) {
          tabVariabili.deleteRow(1);
        }
        for (let i = 0; i < flow.variables.length; i++) {
          inserisciRiga();
          let riga = tabVariabili.rows[i + 1];
          let varObj = flow.variables[i];
          let cella1 = riga.cells[0].querySelector("input");
          let cella2 = riga.cells[1].querySelector("select");
          let cella3 = riga.cells[2].querySelector("input");
          if (cella1) cella1.value = varObj.name;
          if (cella2) cella2.value = varObj.type;
          if (cella3) cella3.value = varObj.value;
          riga.addEventListener("change", aggiungiVaribile);
        }
        if (tabVariabili.rows.length === flow.variables.length + 1) {
          inserisciRiga();
          let ultimaRiga = tabVariabili.rows[tabVariabili.rows.length - 1];
          ultimaRiga.addEventListener("change", aggiungiVaribile);
        }
        calcoloY(nodi);
        draw(nodi);
      } catch (err) {
        alert("Errore nel parsing del file JSON: " + err.message);
      }
      // Puoi chiamare qui una funzione per caricare il flusso, ad esempio:
      // loadFlowFromJSON(content);
    };
    reader.readAsText(file);
  }
});


 window.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      if(!isEmpty() && !saved){
        event.preventDefault();
        if (confirm("There are unsaved changes. Do you really want to reload the page?")) {
          location.reload();
        }
      }
      // Otherwise, allow the default reload
    }
  });

function isEmpty(){
    if(flow.nodes.length==2){
      return true
    }else{
      return false
    }
  }

  function closeSavePopup(){
   document.getElementById("save-popup").classList.remove('active');
   document.getElementById("overlay").classList.remove('active');
  }

  function deleteNode(){
    flow.nodes.splice(nodoSelected,1);
    let current = nodoSelected;
    while(flow.nodes[current].next != null){
      if(typeof flow.nodes[current].next == "object"){
        flow.nodes[current].next = {"true":(parseInt(flow.nodes[current].next.true) - 1).toString(), "false":(parseInt(flow.nodes[current].next.false) - 1).toString()};
      }else{
        flow.nodes[current].next = (parseInt(flow.nodes[current].next) - 1).toString();
      }
      current++;
    }
    nodi.splice(nodoSelected,1);
    resizeCanvas();
    chiudiEditPopup();
  }