// Riferimenti agli elementi del canvas e al contesto di disegno
  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");
  let container = document.getElementById("canvas-container");

  // Impostazioni iniziali delle dimensioni del canvas
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  let w = canvas.width;
  let h = canvas.height;

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
        if (flow.nodes[i].type != "end" && flow.nodes[i].type != "start") {
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

      const xMid = node.relX * w;
      const yMid = node.relY * h;
      const nodeHeight = node.height;

      // Gestisce le frecce per i nodi "if" (con rami true/false)
      if (logic.type === "if" && typeof logic.next === "object") {
        const trueIndex = parseInt(logic.next.true);
        const falseIndex = parseInt(logic.next.false);
        if (!isNaN(trueIndex) && forme[trueIndex]) {
          drawArrowFromRight(node, forme[trueIndex], "T");
        }
        if (!isNaN(falseIndex) && forme[falseIndex]) {
          drawArrowFromLeft(node, forme[falseIndex], "F");
        }
      // Gestisce le frecce per gli altri tipi di nodi (con una singola uscita 'next')
      } else if (typeof logic.next === "string") {
        const nextIndex = parseInt(logic.next);
        if (!isNaN(nextIndex) && forme[nextIndex]) {
          const target = forme[nextIndex];
          drawLine(xMid, yMid + nodeHeight / 2, target.relX * w, target.relY * h - target.height / 2, true);
        }
      }
    }
  }

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
  function drawArrowFromRight(from, to, label) {
    const startX = from.relX * w + from.width / 2;
    const startY = from.relY * h;
    const midX = startX + 40;
    const endX = to.relX * w;
    const endY = to.relY * h - to.height / 2 -30;

    drawLine(startX, startY, midX, startY, false);
    drawLine(midX, startY, midX, endY, true); // Segmento verticale, salvato per click
    drawLine(midX, endY, endX + 11, endY, false); // Leggero offset per il cerchio

    // Disegna un cerchio nel punto di connessione e l'etichetta
    const circleCenterX = endX;
    const circleCenterY = endY;
    ctx.beginPath();
    ctx.arc(circleCenterX, circleCenterY, 10, 0, 2 * Math.PI, false);
    ctx.stroke();
    ctx.fillStyle = "green";
    ctx.font = "12px Arial";
    ctx.fillText(label, midX + 5, (startY + endY) / 2);

    drawLine(endX , endY +10, endX, endY +30, true); // Leggero offset per il cerchio
  }

  /**
   * Disegna una freccia "a gomito" dal lato sinistro del nodo 'from' al nodo 'to',
   * tipicamente usata per il ramo 'false' di un nodo 'if', con un'etichetta.
   */
  function drawArrowFromLeft(from, to, label) {
    const startX = from.relX * w - from.width / 2;
    const startY = from.relY * h;
    const midX = startX - 40;
    const endX = to.relX * w;
    const endY = to.relY * h - to.height / 2 -30 ;

    drawLine(startX, startY, midX, startY, false);
    drawLine(midX, startY, midX, endY, true); // Segmento verticale, salvato per click
    drawLine(midX, endY, endX - 11, endY, false);

    ctx.fillStyle = "red";
    ctx.font = "12px Arial";
    ctx.fillText(label, midX - 10, (startY + endY) / 2);
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
  function inserisciNodo(tipo) {
    // Blocco 1: Identifica il nodo sorgente (ifNodeIndex) e il tipo di ramo (ifArrowType)
    // della freccia selezionata (frecceSelected). Questo determina da dove parte la freccia cliccata.
    let isIfArrow = false;
    let ifArrowType = null;
    let ifNodeIndex = -1; // Indice del nodo logico sorgente della freccia cliccata
    if (frecceSelected !== -1) {
      let currentArrowCount = 0;
      for (let i = 0; i < flow.nodes.length; i++) {
        let nodeLogic = flow.nodes[i];
        if (nodeLogic.type === "end") continue;

        if (nodeLogic.type === "if" && typeof nodeLogic.next === "object") {
          if (currentArrowCount === frecceSelected) { 
            isIfArrow = true; ifArrowType = "T"; 
            ifNodeIndex = i; 
            break; 
          }
          currentArrowCount++;
          if (currentArrowCount === frecceSelected) { 
            isIfArrow = true; ifArrowType = "F"; 
            ifNodeIndex = i; 
            break; 
          }
          currentArrowCount++;
        } else if (typeof nodeLogic.next === "string" && nodeLogic.next !== null) {
          if (currentArrowCount === frecceSelected) { isIfArrow = false; ifArrowType = null; ifNodeIndex = i; break; }
          currentArrowCount++;
        }
      }
    }
    if (ifNodeIndex === -1 && frecceSelected !== -1) { chiudiPopup(); return; } // Errore nel trovare il sorgente

    // Blocco 2: Determina l'indice di inserimento (insertionIndex).
    // È l'indice del nodo che era la destinazione originale della freccia cliccata.
    let originalTargetIndexStr;
    if (isIfArrow) {
      originalTargetIndexStr = (ifArrowType === "T") ? flow.nodes[ifNodeIndex].next.true : flow.nodes[ifNodeIndex].next.false;
    } else {
      originalTargetIndexStr = (ifNodeIndex !== -1) ? flow.nodes[ifNodeIndex].next : flow.nodes[flow.nodes.length - 1].next;
    }
    let insertionIndex = parseInt(originalTargetIndexStr);

    // Blocco 3: Crea il nuovo oggetto nodo logico ('nodo').
    // I suoi puntatori 'next' punteranno al nodo che era la destinazione originale.
    let nuovoNodoLogico;
    if (tipo === "if") {
      nuovoNodoLogico = { type: "if", info: "", next: { true: insertionIndex.toString(), false: insertionIndex.toString() } };
    } else {
      nuovoNodoLogico = { type: tipo, info: "", next: insertionIndex.toString() };
    }

    // Blocco 4: Inserisce il nuovo nodo logico nell'array 'flow.nodes'.
    flow.nodes.splice(insertionIndex, 0, nuovoNodoLogico);

    // Blocco 5: Aggiorna i puntatori 'next' di tutti i nodi successivi all'inserimento
    // e del nodo appena inserito per riflettere lo shift degli indici.
    for (let i = insertionIndex + 1; i < flow.nodes.length; i++) { // Nodi shiftati
      let n = flow.nodes[i];
      if (n.type === "if" && typeof n.next === "object") {
        if (n.next.true !== null) n.next.true = (parseInt(n.next.true) + 1).toString();
        if (n.next.false !== null) n.next.false = (parseInt(n.next.false) + 1).toString();
      } else if (typeof n.next === "string" && n.next !== null) {
        n.next = (parseInt(n.next) + 1).toString();
      }
    }
    // Aggiorna i puntatori del nodo appena inserito (che è a flow.nodes[insertionIndex])
    const nodoAppenaInserito = flow.nodes[insertionIndex];
    if (nodoAppenaInserito.type === "if") {
      nodoAppenaInserito.next.true = (parseInt(nodoAppenaInserito.next.true) + 1).toString();
      nodoAppenaInserito.next.false = (parseInt(nodoAppenaInserito.next.false) + 1).toString();
    } else if (nodoAppenaInserito.next !== null) {
      nodoAppenaInserito.next = (parseInt(nodoAppenaInserito.next) + 1).toString();
    }


    // Blocco 6: Aggiorna il puntatore 'next' del nodo sorgente (ifNodeIndex)
    // affinché punti al nuovo nodo inserito (che ora è a 'insertionIndex').
    if (ifNodeIndex !== -1) {
      if (isIfArrow) {
        if (ifArrowType === "T") flow.nodes[ifNodeIndex].next.true = insertionIndex.toString();
        else flow.nodes[ifNodeIndex].next.false = insertionIndex.toString();
      } else {
        flow.nodes[ifNodeIndex].next = insertionIndex.toString();
      }
    }

    // Blocco 7: Inserisce il corrispondente nodo visuale nell'array 'nodi'.
    nodi.splice(insertionIndex, 0, {
      relX: 0.35, relY: 0.2, width: 100, height: 40, color: "white", text: tipo
    });

    // Blocco 8: Ricalcola le posizioni Y e ridisegna.
    calcoloY(nodi);
    draw(nodi);
    chiudiPopup();
  }


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
  function run() {
    executeFlow(flow);
  }