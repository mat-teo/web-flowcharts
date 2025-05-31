// Riferimenti agli elementi del canvas e al contesto di disegno
  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");
  let container = document.getElementById("canvas-container");

  // Impostazioni iniziali delle dimensioni del canvas
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  let w = canvas.width;
  let h = canvas.height;
  
  const NODE_BASE_HEIGHT_PX = 40; // Altezza base di un nodo in pixel
  const NODE_VERTICAL_SPACING_BASE_REL = 0.06; // Spaziatura verticale relativa base tra nodi sequenziali (8% dell'altezza del canvas)
  const IF_BRANCH_START_Y_OFFSET_REL = 0.05; // Spaziatura verticale relativa addizionale tra un nodo IF e l'inizio dei suoi rami

 function resizeCanvasToFitNodes(nodi) {
  const margin = 100;        // Spazio extra intorno ai nodi
  const scrollPadding = 300; // Spazio in più *sempre* per scorrere

  let maxX = 0, maxY = 0;

  for (const node of nodi) {
    const nodeX = node.relX * canvas.width;
    const nodeY = node.relY * canvas.height;
    if (nodeX > maxX) maxX = nodeX;
    if (nodeY > maxY) maxY = nodeY;
  }

  // Calcola quanto spazio serve per contenere i nodi + margini + scroll extra
  const requiredWidth = Math.max(container.offsetWidth, maxX + margin + scrollPadding);
  const requiredHeight = Math.max(container.offsetHeight, maxY + margin + scrollPadding);

  // Ridimensiona il canvas solo se necessario
  if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
    canvas.width = requiredWidth;
    canvas.height = requiredHeight;
    w = canvas.width;
    h = canvas.height;
  }
}


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
  function drawLine(x1, y1, x2, y2, salva, fromNodeIndex, toNodeIndex, arrowType) {
    if (salva) {
      // Assicurati che fromNodeIndex e toNodeIndex siano numeri validi, altrimenti logga un errore o usa un fallback.
      if (typeof fromNodeIndex !== 'number' || typeof toNodeIndex !== 'number') {
        console.error("drawLine: fromNodeIndex o toNodeIndex non sono numeri validi.", { x1, y1, x2, y2, salva, fromNodeIndex, toNodeIndex, arrowType });
        // Potresti decidere di non salvare la freccia o usare valori di fallback se appropriato,
        // ma è meglio che il chiamante passi sempre dati validi.
      }
      frecce.push({
        inzioX: x1, inzioY: y1, fineX: x2, fineY: y2,
        id: frecce.length,
        fromNodeIndex: fromNodeIndex,
        toNodeIndex: toNodeIndex,
        type: arrowType
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
function findJoinNode(ifNodeIndex) {
    const ifNode = flow.nodes[ifNodeIndex];
    if (!ifNode || !ifNode.next) return null; // Add null check
    
    let truePathEnd = parseInt(ifNode.next.true);
    let falsePathEnd = parseInt(ifNode.next.false);
    
    // Add checks to ensure nodes exist
    if (!flow.nodes[truePathEnd] || !flow.nodes[falsePathEnd]) return null;
    
    // Trova l'ultimo nodo del ramo true
    while (flow.nodes[truePathEnd] && flow.nodes[truePathEnd].next !== ifNode.join) {
        truePathEnd = parseInt(flow.nodes[truePathEnd].next);
        if (isNaN(truePathEnd)) break; // Prevent infinite loops
    }
    
    // Trova l'ultimo nodo del ramo false
    while (flow.nodes[falsePathEnd] && flow.nodes[falsePathEnd].next !== ifNode.join) {
        falsePathEnd = parseInt(flow.nodes[falsePathEnd].next);
        if (isNaN(falsePathEnd)) break; // Prevent infinite loops
    }
    
    // Il nodo di join è il successivo comune
    if (!flow.nodes[truePathEnd] || !flow.nodes[falsePathEnd]) return null;
    
    return flow.nodes[truePathEnd].next === flow.nodes[falsePathEnd].next ? 
        parseInt(flow.nodes[truePathEnd].next) : null;
}


/**
 * FUNZIONE PRINCIPALE draw(forme):
 * - Calcola quanti incoming ha ciascun nodo logico (flow.nodes).
 * - Costruisce joinSet = { indici di nodo con almeno 2 incoming }.
 * - Disegna nodi (colori, forme, testo).
 * - Poi, per ogni collegamento “next”:
 *     • Se proviene da un IF (ramo true/false), usa drawArrowFromRight/Left.
 *     • Altrimenti (“normal”), se il target ∈ joinSet → spezza in 3 spezzoni (verticale, orizzontale, verticale).
 *       Altrimenti, disegna un’unica linea retta con drawLine(...).
 */
function draw(forme) {
  // === 1) Calcolo incomingCount per ciascun nodo logico ===
  const incomingCount = Array(flow.nodes.length).fill(0);

  for (let i = 0; i < flow.nodes.length; i++) {
    const nd = flow.nodes[i];
    if (!nd) continue;

    if (nd.type === "if" && typeof nd.next === "object" && nd.next !== null) {
      const tIdx = parseInt(nd.next.true,  10);
      const fIdx = parseInt(nd.next.false, 10);
      if (!isNaN(tIdx) && tIdx < incomingCount.length) incomingCount[tIdx]++;
      if (!isNaN(fIdx) && fIdx < incomingCount.length) incomingCount[fIdx]++;
    }
    else if (typeof nd.next === "string" && nd.next !== null) {
      const nIdx = parseInt(nd.next, 10);
      if (!isNaN(nIdx) && nIdx < incomingCount.length) incomingCount[nIdx]++;
    }
  }

  // === 2) Costruisco joinSet: tutti i k con incomingCount[k] ≥ 2 ===
  const joinSet = new Set();
  for (let k = 0; k < incomingCount.length; k++) {
    if (incomingCount[k] >= 2) {
      joinSet.add(k);
    }
  }
  console.log(">> joinSet (nodi con ≥2 incoming):", Array.from(joinSet));

  // === 3) Adatto dinamicamente il canvas e resetto frecce ===
  resizeCanvasToFitNodes(forme);
  ctx.clearRect(0, 0, w, h);
  frecce = [];

  // === 4) BLOCCO 1: Disegno di tutti i nodi (colori, forme, testo) ===
  for (let i = 0; i < forme.length; i++) {
    const node = forme[i];
    if (!node) continue;

    // 4.a) Determino il colore di sfondo in base a flow.nodes[i].type
    const tipo = flow.nodes[i]?.type;
    let coloreNodo;
    switch (tipo) {
      case "start":       coloreNodo = "green";      break;
      case "end":         coloreNodo = "red";        break;
      case "read": case "input":   coloreNodo = "gray";       break;
      case "write": case "output": case "print":     coloreNodo = "lightblue";  break;
      case "assign": case "assignment": coloreNodo = "yellow";    break;
      case "if":          coloreNodo = "orange";     break;
      default:            coloreNodo = node.color;   break;
    }

    // 4.b) Calcolo le coordinate in pixel dell’angolo alto‐sinistro
    const x0 = node.relX * w - node.width / 2;
    const y0 = node.relY * h - node.height / 2;
    const cx = x0 + node.width / 2;
    const cy = y0 + node.height / 2;

    // 4.c) Disegno della forma (rettangolo arrotondato, parallelogramma, rombo, o rettangolo normale)
    ctx.fillStyle   = coloreNodo;
    ctx.strokeStyle = "black";

    switch (tipo) {
      case "start":
      case "end":
        // Rettangolo arrotondato, raggio = 10px
        drawRoundedRect(x0, y0, node.width, node.height, 10);
        break;

      case "read": case "input":
      case "write": case "output": case "print":
      case "assign": case "assignment":
        // Parallelogramma con skew = 20px
        drawParallelogram(x0, y0, node.width, node.height, 20);
        break;

      case "if":
        // Rombo (diamante)
        drawDiamond(x0, y0, node.width, node.height);
        break;

      default:
        // Rettangolo standard
        ctx.beginPath();
        ctx.rect(x0, y0, node.width, node.height);
        ctx.closePath();
        break;
    }
    ctx.fill();
    ctx.stroke();

    // 4.d) Scrivo il testo (centrato)
    if (node.text) {
      let toWrite = node.text;
      if (flow.nodes[i] && !["start", "end"].includes(flow.nodes[i].type)) {
        toWrite += ":\n" + (flow.nodes[i].info || "");
      }
      ctx.font         = `bold 16px Arial`;
      ctx.fillStyle    = "black";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(toWrite, cx, cy);
    }
  }

  // === 5) BLOCCO 2: Disegno delle frecce tra i nodi ===
  for (let i = 0; i < forme.length; i++) {
    const node  = forme[i];
    const logic = flow.nodes[i];
    if (!logic || !node) continue;

    // Coordinate del centro del nodo (X) e del centro verticale (Y)
    const xMid       = node.relX * w;
    const yMid       = node.relY * h;
    const nodeHeight = node.height;

    // 5.a) Se è un IF, disegno i due rami TRUE/FALSE “a gomito” (drawArrowFromRight/Left)
    if (logic.type === "if" && typeof logic.next === "object" && logic.next !== null) {
      const trueIndex  = parseInt(logic.next.true,  10);
      const falseIndex = parseInt(logic.next.false, 10);

      if (!isNaN(trueIndex) && forme[trueIndex]) {
        drawArrowFromRight(node, forme[trueIndex], "T", i, trueIndex);
      }
      if (!isNaN(falseIndex) && forme[falseIndex]) {
        drawArrowFromLeft(node, forme[falseIndex], "F", i, falseIndex);
      }
    }
    // 5.b) Altrimenti, se next è una stringa (nodo “normale”), verifico se target ∈ joinSet
    else if (typeof logic.next === "string" && logic.next !== null) {
      const nextIndex = parseInt(logic.next, 10);
      if (isNaN(nextIndex) || !forme[nextIndex]) continue;

      // 5.b.1) Se il target è in joinSet → disegno “gomito” con 3 spezzoni
      if (joinSet.has(nextIndex)) {
        console.log(`→ Nodo ${i} sta puntando a join ${nextIndex}; disegno gomito`);
        drawJoinConnectionFromLast(node, forme[nextIndex], i, nextIndex);
      }
      // 5.b.2) Altrimenti → disegno una linea retta normale
      else {
        const target = forme[nextIndex];
        drawLine(
          xMid,
          yMid + nodeHeight / 2,
          target.relX * w,
          target.relY * h - target.height / 2,
          true,
          i,
          nextIndex,
          'normal'
        );
      }
    }
  }
}


/**
 * Helper che spezza in 3 spezzoni la connessione da “lastNode” → “joinNode”:
 *   1) verticale (da lastNode fino a midY)
 *   2) orizzontale (da startX fino a targetX, a quota midY)
 *   3) verticale breve (da midY fino al bordo superiore di joinNode)
 *
 * @param {object} lastNode       – Oggetto visuale di partenza (ha relX, relY, width, height)
 * @param {object} joinNode       – Oggetto visuale di destinazione
 * @param {number} fromNodeIndex  – Indice logico di lastNode in flow.nodes
 * @param {number} toNodeIndex    – Indice logico di joinNode in flow.nodes
 */
function drawJoinConnectionFromLast(lastNode, joinNode, fromNodeIndex, toNodeIndex) {
  // 1) Calcolo il punto di partenza: centro X, bordo inferiore di lastNode
  const startX = lastNode.relX * w;
  const startY = lastNode.relY * h + lastNode.height / 2;

  // 2) Calcolo il bordo superiore di joinNode
  const targetX = joinNode.relX * w;
  const targetY = joinNode.relY * h - joinNode.height / 2;

  // 3) Definisco midY come 25px sopra targetY (gap per il gomito)
  const verticalGap = 25;
  const midY        = targetY - verticalGap;

  console.log(
    `   Gomito → (${startX.toFixed(1)},${startY.toFixed(1)}) → `,
    `(${startX.toFixed(1)},${midY.toFixed(1)}) → `,
    `(${targetX.toFixed(1)},${midY.toFixed(1)}) → `,
    `(${targetX.toFixed(1)},${targetY.toFixed(1)})`
  );

  // 4.a) Traccio il primo tratto verticale: da (startX,startY) a (startX,midY)
  drawLine(startX, startY, startX, midY, true, fromNodeIndex, toNodeIndex, "normal");
  // 4.b) Traccio il tratto orizzontale: da (startX,midY) a (targetX,midY)
  drawLine(startX, midY, targetX, midY, true, fromNodeIndex, toNodeIndex, "normal");
  // 4.c) Traccio il tratto verticale breve: da (targetX,midY) a (targetX,targetY)
  drawLine(targetX, midY, targetX, targetY, true, fromNodeIndex, toNodeIndex, "normal");
}



function drawJoinConnection(fromNode, toNode, fromIndex, toIndex) {
  const fromX = fromNode.relX * w;
  const fromY = fromNode.relY * h + fromNode.height / 2;
  const toX = toNode.relX * w;
  const toY = toNode.relY * h - toNode.height / 2;
  
  // Calcola l'offset verticale in base all'altezza del nodo
  const joinY = Math.max(fromY, toY) + 80; 
  
  // Linea verticale dal nodo if al punto di join
  drawLine(fromX, fromY, fromX, joinY, false);
  
  // Linea orizzontale di join
  drawLine(fromX, joinY, toX, joinY, true, fromIndex, toIndex, 'join');
  
  // Linea verticale dal punto di join al nodo successivo
  drawLine(toX, joinY, toX, toY, false);
}

function findParentIf(nodeIndex) {
  let currentIndex = nodeIndex;
  while (currentIndex >= 0) {
    if (flow.nodes[currentIndex]?.type === "if") {
      return currentIndex;
    }
    currentIndex--;
  }
  return -1;
}

// Rettangolo con angoli arrotondati
function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Parallelogramma (spostamento orizzontale di 'skew' px sui lati)
function drawParallelogram(x, y, width, height, skew) {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.closePath();
}

// Rombo (diamante) centrato su x0,y0 con ampiezza w,h
function drawDiamond(x, y, w, h) {
  const cx = x + w/2;
  const cy = y + h/2;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(x + w, cy);
  ctx.lineTo(cx, y + h);
  ctx.lineTo(x, cy);
  ctx.closePath();
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
    const midX = startX + 40; 
    const targetAttachX = to.relX * w; 
    const targetAttachY = to.relY * h - to.height / 2; // Bordo superiore del nodo target
    // Y per il segmento orizzontale. Assicurati che sia sopra targetAttachY se c'è un cerchio.
    // Se targetAttachY è la Y del bordo superiore del nodo, e il cerchio è sopra,
    // horizontalLineY deve essere ancora più sopra o coincidere con il centro del cerchio.
    // Adattiamo per essere sicuri che horizontalLineY sia sopra il target del nodo.
    const circleRadius = 10;
    const verticalGapBeforeNode = 25; // Spazio desiderato prima del nodo target (per cerchio e linea)
    const horizontalLineY = targetAttachY - verticalGapBeforeNode - circleRadius;


    drawLine(startX, startY, midX, startY, false); 
    // Segmento verticale principale cliccabile per il ramo 'if_true'
    drawLine(midX, startY, midX, horizontalLineY, true, fromNodeIndex, toNodeIndex, 'if_true');
    drawLine(midX, horizontalLineY, targetAttachX, horizontalLineY, false); 

    ctx.beginPath();
    ctx.arc(targetAttachX, horizontalLineY, circleRadius, 0, 2 * Math.PI, false); 
    ctx.stroke();
    ctx.fillStyle = "black"; 
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, midX + 20 , startY + (horizontalLineY - startY) / 2);
    // ctx.fill(); // fill() non è necessario per il testo se usi fillStyle e fillText

    // Linea finale dal cerchio (o dal punto di attacco orizzontale) al bordo superiore del nodo target
    // Questo segmento, se cliccato, rappresenta l'inserimento "dopo il join" per questo ramo.
    drawLine(targetAttachX, horizontalLineY, targetAttachX, targetAttachY, true, fromNodeIndex, toNodeIndex, 'if_true_join_segment');
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
    const midX = startX - 40; 
    const targetAttachX = to.relX * w; 
    const targetAttachY = to.relY * h - to.height / 2; // Bordo superiore del nodo target
    const circleRadius = 10;
    const verticalGapBeforeNode = 25;
    const horizontalLineY = targetAttachY - verticalGapBeforeNode - circleRadius;

    drawLine(startX, startY, midX, startY, false); 
    drawLine(midX, startY, midX, horizontalLineY, true, fromNodeIndex, toNodeIndex, 'if_false');
    drawLine(midX, horizontalLineY, targetAttachX, horizontalLineY, false); 

    ctx.beginPath();
    ctx.arc(targetAttachX, horizontalLineY, circleRadius, 0, 2 * Math.PI, false); 
    ctx.stroke();
    ctx.fillStyle = "red"; 
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, midX - 20 , startY + (horizontalLineY - startY) / 2);
    
    // Linea finale dal cerchio al bordo superiore del nodo target
    // Anche questo segmento, se cliccato, rappresenta l'inserimento "dopo il join" per questo ramo.
    drawLine(targetAttachX, horizontalLineY, targetAttachX, targetAttachY, true, fromNodeIndex, toNodeIndex, 'if_false_join_segment');
}


/**
 * Inserisce un nuovo nodo logico e visuale nel flowchart quando l'utente clicca su una freccia.
 * @param {string} tipo - Il tipo di nodo da inserire (es. "input", "print", "if").
 */
// In script.js

/**
 * Inserisce un nuovo nodo logico e visuale nel flowchart quando l'utente clicca su una freccia.
 * @param {string} tipo - Il tipo di nodo da inserire (es. "input", "print", "if").
 */
// In script.js

/**
 * Inserisce un nuovo nodo logico e visuale nel flowchart quando l'utente clicca su una freccia.
 * @param {string} tipo - Il tipo di nodo da inserire (es. "input", "print", "if").
 */
// In script.js
// In script.js
// Sostituisci completamente la tua funzione inserisciNodo con questa:
function inserisciNodo(tipo) {
    saved = false;
    if (frecceSelected === -1 || !frecce[frecceSelected]) {
        console.error("inserisciNodo ERRORE: Nessuna freccia selezionata o freccia non valida.");
        chiudiPopup();
        return;
    }

    const clickedArrow = frecce[frecceSelected];
    if (typeof clickedArrow.fromNodeIndex !== 'number' || typeof clickedArrow.toNodeIndex !== 'number') {
        console.error("inserisciNodo ERRORE: Dati freccia corrotti.", clickedArrow);
        chiudiPopup();
        frecceSelected = -1;
        return;
    }

    const parentNodeIndex = clickedArrow.fromNodeIndex;
    const originalTargetNodeIndex = clickedArrow.toNodeIndex;
    const newActualNodeIndex = originalTargetNodeIndex;

    console.log(`inserisciNodo INFO: Inizio. Tipo: ${tipo}, Freccia ID: ${clickedArrow.id}, Freccia Tipo: ${clickedArrow.type}`);
    console.log(`  parentNodeIndex: ${parentNodeIndex}, originalTargetNodeIndex: ${originalTargetNodeIndex}, newActualNodeIndex: ${newActualNodeIndex}`);

    if (parentNodeIndex === originalTargetNodeIndex &&
        (clickedArrow.type.startsWith('if_true') || clickedArrow.type.startsWith('if_false'))) {
        console.error(`inserisciNodo ERRORE: Tentativo di inserire nodo in un ramo IF che punta a se stesso. Annullato.`);
        chiudiPopup();
        frecceSelected = -1;
        return;
    }

    let newNodeLogic;
    const nextNodeForNewLogic = (newActualNodeIndex + 1).toString();
    if (tipo === "if") {
        newNodeLogic = {
            "type": "if", "info": "",
            "next": { "true": nextNodeForNewLogic, "false": nextNodeForNewLogic }
        };
    } else {
        newNodeLogic = { "type": tipo, "info": "", "next": nextNodeForNewLogic };
    }

    flow.nodes.splice(newActualNodeIndex, 0, newNodeLogic);
    console.log(`inserisciNodo INFO: newNodeLogic inserito in flow.nodes all'indice ${newActualNodeIndex}. Lunghezza flow.nodes: ${flow.nodes.length}`);

    // CICLO FOR PER AGGIORNARE GLI INDICI LOGICI (incluso il join)
    for (let i = 0; i < flow.nodes.length; i++) {
        let n = flow.nodes[i];
        if (n === newNodeLogic) { continue; }

        if (n.type === "if" && typeof n.next === "object" && n.next !== null) {
            // Aggiornamento proprietà join
            if (n.join) {
                let oldJoin = parseInt(n.join);
                if (!isNaN(oldJoin) && oldJoin >= newActualNodeIndex) {
                    n.join = (oldJoin + 1).toString();
                }
            }
            
            // Aggiornamento rami true/false
            if (n.next.true !== null && typeof n.next.true === 'string') {
                let oldTrue = parseInt(n.next.true);
                if (!isNaN(oldTrue) && oldTrue >= newActualNodeIndex) { 
                    n.next.true = (oldTrue + 1).toString(); 
                }
            }
            
            if (n.next.false !== null && typeof n.next.false === 'string') {
                let oldFalse = parseInt(n.next.false);
                if (!isNaN(oldFalse) && oldFalse >= newActualNodeIndex) { 
                    n.next.false = (oldFalse + 1).toString(); 
                }
            }
        } else if (n.next !== null && typeof n.next === 'string') {
            let oldNext = parseInt(n.next);
            if (!isNaN(oldNext) && oldNext >= newActualNodeIndex) { 
                n.next = (oldNext + 1).toString(); 
            }
        }
    }
    
    // GESTIONE SPECIFICA PER I JOIN
    if (clickedArrow.type.includes('join_segment')) {
        const parentIfIndex = findParentIf(parentNodeIndex);
        if (parentIfIndex !== -1) {
            // Inizializza il join se non esiste
            if (!flow.nodes[parentIfIndex].join) {
                flow.nodes[parentIfIndex].join = originalTargetNodeIndex.toString();
            }
            
            // Aggiorna il punto di join con il nuovo nodo
            flow.nodes[parentIfIndex].join = newActualNodeIndex.toString();
            console.log(`Aggiornato join per nodo IF ${parentIfIndex}: ${flow.nodes[parentIfIndex].join}`);
        }
    }

    // AGGIORNAMENTO PUNTATORI DEL NODO GENITORE
    const actualParentNodeLogic = flow.nodes[parentNodeIndex];
    let isJoinInsertion = false;
    let isBranchInsertion = false;

    if (actualParentNodeLogic && actualParentNodeLogic.type === 'if' && typeof actualParentNodeLogic.next === 'object') {
        const originalTargetNumeric = parseInt(originalTargetNodeIndex);
        const expectedIndexOfOriginalTargetAfterShift = (originalTargetNumeric + (newActualNodeIndex <= originalTargetNumeric ? 1 : 0)).toString();

        if ((clickedArrow.type === 'if_true_join_segment') &&
            actualParentNodeLogic.next.false === expectedIndexOfOriginalTargetAfterShift) {
            isJoinInsertion = true;
        } else if ((clickedArrow.type === 'if_false_join_segment') &&
                   actualParentNodeLogic.next.true === expectedIndexOfOriginalTargetAfterShift) {
            isJoinInsertion = true;
        }
    }

    if (!isJoinInsertion && actualParentNodeLogic && actualParentNodeLogic.type === 'if' &&
        (clickedArrow.type === 'if_true' || clickedArrow.type === 'if_false')) {
        isBranchInsertion = true;
    }

    if (actualParentNodeLogic) {
        const newTargetForParent = newActualNodeIndex.toString();
        if (isJoinInsertion) {
            // Aggiorna entrambi i rami per puntare al nuovo nodo di join
            actualParentNodeLogic.next.true = newTargetForParent;
            actualParentNodeLogic.next.false = newTargetForParent;
        } else {
            // Aggiorna solo il ramo specifico
            if (clickedArrow.type === 'normal') {
                actualParentNodeLogic.next = newTargetForParent;
            } else if (clickedArrow.type === 'if_true' || clickedArrow.type === 'if_true_join_segment') {
                actualParentNodeLogic.next.true = newTargetForParent;
            } else if (clickedArrow.type === 'if_false' || clickedArrow.type === 'if_false_join_segment') {
                actualParentNodeLogic.next.false = newTargetForParent;
            }
        }
    }

    // CALCOLO POSIZIONE X DEL NUOVO NODO
    const parentVisualNode = nodi[parentNodeIndex];
    let newRelX;
    const elbowOffsetPixels = 40;

    if (isJoinInsertion && parentVisualNode) {
    // Allineamento verticale con il nodo if padre
          newRelX = parentVisualNode.relX;
      } else if (isBranchInsertion && parentVisualNode) {
          // Mantieni l'offset originale per i rami
          if (clickedArrow.type === 'if_true') {
              const parentRightEdgeX_abs = parentVisualNode.relX * w + parentVisualNode.width / 2;
              const midX_abs = parentRightEdgeX_abs + elbowOffsetPixels;
              newRelX = midX_abs / w;
          } else if (clickedArrow.type === 'if_false') {
              const parentLeftEdgeX_abs = parentVisualNode.relX * w - parentVisualNode.width / 2;
              const midX_abs = parentLeftEdgeX_abs - elbowOffsetPixels;
              newRelX = midX_abs / w;
          }
      }else if (parentVisualNode && clickedArrow.type === 'normal') {
        // Per frecce normali: mantieni la stessa X
        newRelX = parentVisualNode.relX;
    } else if (parentVisualNode) {
        // Fallback per altri tipi di freccia
        newRelX = parentVisualNode.relX;
    } else {
        // Se non c'è parent, posizione di default
        newRelX = 0.35;
        if (nodi.length > 0 && nodi[0]) { 
            newRelX = nodi[0].relX; 
        }
    }

    // CLAMP DELLA POSIZIONE X
    const nodeVisualWidth = 100;
    let minPossibleRelX = (nodeVisualWidth / 2) / w + 0.01;
    let maxPossibleRelX = 1 - ((nodeVisualWidth / 2) / w) - 0.01;
    if (newRelX < minPossibleRelX) newRelX = minPossibleRelX;
    if (newRelX > maxPossibleRelX) newRelX = maxPossibleRelX;

    // INSERIMENTO DEL NUOVO NODO VISUALE
    nodi.splice(newActualNodeIndex, 0, {
        relX: newRelX, 
        relY: 0, 
        width: nodeVisualWidth, 
        height: 40,
        color: "white", 
        text: tipo.charAt(0).toUpperCase() + tipo.slice(1)
    });

    // RICALCOLO POSIZIONI Y E RIDISEAGNO
    calcoloY(nodi);
    draw(nodi);
    chiudiPopup();
    frecceSelected = -1;
}


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
  
  // In script.js, sostituisci la vecchia funzione calcoloY

// In script.js, sostituisci la tua intera funzione calcoloY
/**
 * Ritorna l’indice dell’ultimo nodo del ramo (true o false) prima del join.
 * Se il ramo non ha join (true ≠ false), restituisce -1.
 *
 * @param {number} ifIndex  – Indice del nodo IF in flow.nodes
 * @param {"true"|"false"} branchType – Scegliamo se il ramo “true” o “false”
 * @returns {number} indice dell’ultimo nodo del ramo, oppure -1 se non è ramo join
 */
/**
 * Ritorna l’indice dell’ultimo nodo del ramo (true o false) prima del join.
 * Se il ramo non converge (true ≠ false) o non trova join, restituisce -1.
 *
 * @param {number} ifIndex      – Indice del nodo IF in flow.nodes
 * @param {"true"|"false"} branchType – Scegliamo “true” o “false”
 * @returns {number} indice dell’ultimo nodo del ramo prima del join, oppure -1
 */
function findLastNodeInBranch(ifIndex, branchType) {
  const ifNode = flow.nodes[ifIndex];
  if (!ifNode || typeof ifNode.next !== "object") return -1;

  // Indice di partenza del ramo (TRUE o FALSE)
  let current = parseInt(ifNode.next[branchType], 10);
  // Controlliamo se TRUE e FALSE convergono sullo stesso target
  const otherBranch = branchType === "true" ? "false" : "true";
  if (parseInt(ifNode.next[otherBranch], 10) !== current) {
    // Non c’è convergenza immediata: nessun join
    return -1;
  }
  // Ora “current” è l’indice del nodo su cui si riconvergono
  const joinIndex = current;

  // Scorriamo lungo il ramo finché non troviamo chi punta direttamente a joinIndex
  while (true) {
    const node = flow.nodes[current];
    if (!node) break;
    // Se questo nodo fa next === joinIndex, allora è l’ultimo prima del join
    if (node.next === joinIndex.toString()) {
      return current;
    }
    // Altrimenti scendiamo lungo il flusso “lineare”
    const nextIdx = parseInt(node.next, 10);
    if (isNaN(nextIdx)) break;
    current = nextIdx;
  }
  return -1;
}

/**
 * Disegna, a “gomito”, il collegamento dal **lastNode** al **joinNode**:
 * 1) Scende verticalmente un po’ sotto lastNode
 * 2) Va orizzontale fino all’X di joinNode
 * 3) Scende verticalmente fino al bordo superiore di joinNode
 *
 * @param {object} lastNode       – Oggetto visuale (con relX, relY, width, height)
 * @param {object} joinNode       – Oggetto visuale del nodo di join (same format)
 * @param {number} fromNodeIndex  – Indice logico di lastNode in flow.nodes
 * @param {number} toNodeIndex    – Indice logico di joinNode in flow.nodes
 */
/**
 * Disegna, a “gomito”, la connessione dal lastNode al joinNode:
 *   1) Verticale: dal bordo inferiore di lastNode a un punto Y intermedio (midY)
 *   2) Orizzontale: da (lastNode.relX*w, midY) a (joinNode.relX*w, midY)
 *   3) Verticale: da (joinNode.relX*w, midY) al bordo superiore di joinNode
 *
 * @param {object} lastNode       – Nodo grafico (has relX, relY, width, height)
 * @param {object} joinNode       – Nodo grafico di join (has relX, relY, width, height)
 * @param {number} fromNodeIndex  – Indice di lastNode in flow.nodes
 * @param {number} toNodeIndex    – Indice di joinNode in flow.nodes
 */
function drawJoinConnectionFromLast(lastNode, joinNode, fromNodeIndex, toNodeIndex) {
  // 1) Calcolo coordinate di partenza (centro del bordo inferiore di lastNode)
  const startX = lastNode.relX * w;
  const startY = lastNode.relY * h + lastNode.height / 2;

  // 2) Calcolo coordinate del bordo superiore di joinNode (destinazione finale)
  const targetX = joinNode.relX * w;
  const targetY = joinNode.relY * h - joinNode.height / 2;

  // 3) Scegliamo un Y intermedio (midY) che sia “qualche pixel” sopra targetY
  const verticalGap = 25;              // 25px sopra il nodo di join
  const midY = targetY - verticalGap;

  // 4.a) Segmento verticale: da (startX, startY) a (startX, midY)
  drawLine(startX, startY, startX, midY, true, fromNodeIndex, toNodeIndex, "normal");

  // 4.b) Segmento orizzontale: da (startX, midY) a (targetX, midY)
  drawLine(startX, midY, targetX, midY, true, fromNodeIndex, toNodeIndex, "normal");

  // 4.c) Segmento verticale breve: da (targetX, midY) a (targetX, targetY)
  drawLine(targetX, midY, targetX, targetY, true, fromNodeIndex, toNodeIndex, "normal");
}


function calcoloY(nodiVisualArray) {
    if (!flow.nodes.length || !nodiVisualArray.length || !h) {
        console.warn("calcoloY: Dati mancanti o canvas non inizializzato correttamente.");
        return;
    }

    for (let node of nodiVisualArray) {
        node.relY = 0; 
    }
    
    let maxYAtColumn = {}; 

    /**
     * @param {number} currentNodeIndex
     * @param {number} predecessorBottomY_candidate
     * @param {Set<number>} visitedInPath - Nodi visitati in questo specifico percorso ricorsivo per rilevare cicli.
     * @returns {number}
     */
    // In script.js
// Dentro la funzione calcoloY, nella sotto-funzione calculateNodeYRecursive

function calculateNodeYRecursive(currentNodeIndex, predecessorBottomY_candidate, visitedInPath) {
    const visualNode = nodiVisualArray[currentNodeIndex];
    const logicalNode = flow.nodes[currentNodeIndex];

    // Log Iniziale per la chiamata corrente
    // console.log(`calcoloY [${currentNodeIndex} - ${logicalNode ? logicalNode.type : 'N/A'}]: Entrata. predecessorBottomY_candidate=${predecessorBottomY_candidate.toFixed(3)}`);

    if (!visualNode || !logicalNode) {
        // console.log(`calcoloY [${currentNodeIndex}]: Nodo visuale o logico non trovato. Ritorno: ${predecessorBottomY_candidate.toFixed(3)}`);
        return predecessorBottomY_candidate;
    }

    if (visitedInPath.has(currentNodeIndex)) {
        console.warn(`calculateNodeYRecursive: Ciclo rilevato al nodo ${currentNodeIndex}. Interruzione del percorso.`);
        return visualNode.relY !== 0 ? visualNode.relY + ((visualNode.height || NODE_BASE_HEIGHT_PX) / h) + NODE_VERTICAL_SPACING_BASE_REL : predecessorBottomY_candidate;
    }
    visitedInPath.add(currentNodeIndex);

    const nodeHeightRel = (visualNode.height || NODE_BASE_HEIGHT_PX) / h;
    const columnKey = visualNode.relX.toFixed(2);

    let proposedTopY = predecessorBottomY_candidate;
    // console.log(`calcoloY [${currentNodeIndex}]: proposedTopY iniziale = ${proposedTopY.toFixed(3)}`);

    if (maxYAtColumn[columnKey] && maxYAtColumn[columnKey] > proposedTopY) {
        // console.log(`calcoloY [${currentNodeIndex}]: Colonna ${columnKey} ha maxY=${maxYAtColumn[columnKey].toFixed(3)}, che è > proposedTopY. proposedTopY aggiornato.`);
        proposedTopY = maxYAtColumn[columnKey];
    }

    if (visualNode.relY !== 0 && visualNode.relY > proposedTopY) {
        // console.log(`calcoloY [${currentNodeIndex}]: visualNode.relY (${visualNode.relY.toFixed(3)}) è > proposedTopY. proposedTopY aggiornato.`);
        proposedTopY = visualNode.relY;
    }
    
    visualNode.relY = proposedTopY;
    // console.log(`calcoloY [${currentNodeIndex}]: ASSEGNATO visualNode.relY = ${visualNode.relY.toFixed(3)}`);

    const currentNodeBottomY = visualNode.relY + nodeHeightRel + NODE_VERTICAL_SPACING_BASE_REL;
    // console.log(`calcoloY [${currentNodeIndex}]: currentNodeBottomY (con spacing) = ${currentNodeBottomY.toFixed(3)}`);
    
    // Aggiorna maxYAtColumn[columnKey] *solo se* currentNodeBottomY è effettivamente maggiore.
    // Questo previene che un percorso più corto sovrascriva un maxY stabilito da un percorso più lungo che passa per la stessa colonna.
    if (!maxYAtColumn[columnKey] || currentNodeBottomY > maxYAtColumn[columnKey]) {
        maxYAtColumn[columnKey] = currentNodeBottomY;
        // console.log(`calcoloY [${currentNodeIndex}]: Aggiornato maxYAtColumn[${columnKey}] = ${maxYAtColumn[columnKey].toFixed(3)}`);
    }
    
    let maxPathYReached = currentNodeBottomY;

    if (logicalNode.type === "if" && typeof logicalNode.next === "object") {
        const trueNextIndex = parseInt(logicalNode.next.true);
        const falseNextIndex = parseInt(logicalNode.next.false);
        
        let branchInitialTopY = visualNode.relY + nodeHeightRel + IF_BRANCH_START_Y_OFFSET_REL;
        // console.log(`calcoloY [${currentNodeIndex} - IF]: branchInitialTopY = ${branchInitialTopY.toFixed(3)} (relY=${visualNode.relY.toFixed(3)}, heightRel=${nodeHeightRel.toFixed(3)}, offset=${IF_BRANCH_START_Y_OFFSET_REL.toFixed(3)})`);

        let trueBranchEndY = currentNodeBottomY; 
        let falseBranchEndY = currentNodeBottomY;

        if (!isNaN(trueNextIndex) && flow.nodes[trueNextIndex] && nodiVisualArray[trueNextIndex]) {
            trueBranchEndY = calculateNodeYRecursive(trueNextIndex, branchInitialTopY, new Set(visitedInPath));
            // console.log(`calcoloY [${currentNodeIndex} - IF]: Ramo TRUE (->${trueNextIndex}) ritorna trueBranchEndY = ${trueBranchEndY.toFixed(3)}`);
        }
        if (!isNaN(falseNextIndex) && flow.nodes[falseNextIndex] && nodiVisualArray[falseNextIndex]) {
            falseBranchEndY = calculateNodeYRecursive(falseNextIndex, branchInitialTopY, new Set(visitedInPath));
            // console.log(`calcoloY [${currentNodeIndex} - IF]: Ramo FALSE (->${falseNextIndex}) ritorna falseBranchEndY = ${falseBranchEndY.toFixed(3)}`);
        }
        maxPathYReached = Math.max(maxPathYReached, trueBranchEndY, falseBranchEndY); // Assicurati di considerare anche la Y del nodo IF stesso se i rami sono più corti.
        // Correggo: maxPathYReached dovrebbe essere il massimo tra le Y finali dei rami.
        // Se un ramo non esiste, la sua EndY è currentNodeBottomY, che è un fallback sicuro.
        maxPathYReached = Math.max(trueBranchEndY, falseBranchEndY);


    } else if (typeof logicalNode.next === "string" && logicalNode.next !== null) {
        const nextNodeIndex = parseInt(logicalNode.next);
        if (!isNaN(nextNodeIndex) && flow.nodes[nextNodeIndex] && nodiVisualArray[nextNodeIndex]) {
             maxPathYReached = calculateNodeYRecursive(nextNodeIndex, currentNodeBottomY, new Set(visitedInPath));
             // console.log(`calcoloY [${currentNodeIndex}]: Ramo NEXT (->${nextNodeIndex}) ritorna maxPathYReached = ${maxPathYReached.toFixed(3)}`);
        }
    }
    
    // console.log(`calcoloY [${currentNodeIndex}]: Uscita. Ritorno maxPathYReached = ${maxPathYReached.toFixed(3)}`);
    return maxPathYReached;
}
    let startNodeIndex = flow.nodes.findIndex(node => node.type === 'start');
    if (startNodeIndex === -1 && flow.nodes.length > 0) {
        startNodeIndex = 0;
    }

    if (startNodeIndex !== -1 && nodiVisualArray[startNodeIndex]) {
        nodiVisualArray[startNodeIndex].relY = 0.05; 
        
        const startNodeHeightRel = (nodiVisualArray[startNodeIndex].height || NODE_BASE_HEIGHT_PX) / h;
        const startNodeBottomY = nodiVisualArray[startNodeIndex].relY + startNodeHeightRel + NODE_VERTICAL_SPACING_BASE_REL;
        
        const startColumnKey = nodiVisualArray[startNodeIndex].relX.toFixed(2);
        maxYAtColumn[startColumnKey] = startNodeBottomY;

        const logicalStartNode = flow.nodes[startNodeIndex];
        const initialVisitedInPath = new Set(); // Set iniziale per il percorso principale

        if (logicalStartNode.type === "if" && typeof logicalStartNode.next === "object") {
            initialVisitedInPath.add(startNodeIndex); // Aggiungi lo start node se è un IF prima di ramificare
            let branchInitialTopY = nodiVisualArray[startNodeIndex].relY + startNodeHeightRel + IF_BRANCH_START_Y_OFFSET_REL;
            const trueNextIndex = parseInt(logicalStartNode.next.true);
            const falseNextIndex = parseInt(logicalStartNode.next.false);

            if (!isNaN(trueNextIndex) && flow.nodes[trueNextIndex] && nodiVisualArray[trueNextIndex]) {
                calculateNodeYRecursive(trueNextIndex, branchInitialTopY, new Set(initialVisitedInPath));
            }
            if (!isNaN(falseNextIndex) && flow.nodes[falseNextIndex] && nodiVisualArray[falseNextIndex]) {
                calculateNodeYRecursive(falseNextIndex, branchInitialTopY, new Set(initialVisitedInPath));
            }
        } else if (typeof logicalStartNode.next === "string" && logicalStartNode.next !== null) {
            const firstNextIndex = parseInt(logicalStartNode.next);
            if (!isNaN(firstNextIndex) && flow.nodes[firstNextIndex] && nodiVisualArray[firstNextIndex]) {
                 initialVisitedInPath.add(startNodeIndex); // Aggiungi lo start node prima di procedere
                 calculateNodeYRecursive(firstNextIndex, startNodeBottomY, initialVisitedInPath);
            }
        }
    } else if (flow.nodes.length > 0) {
        console.warn("calcoloY: Nodo di start non trovato o non valido.");
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

  function isLastNodeOfIf(index){
    let lastIndex=[];
    for(i=0;i<flow.nodes.length;i++){
        if(lastIndex[lastIndex.length-1] == i || flow.nodes[lastIndex[lastIndex.length-1]] - 1 == i){
          if(i==index){
            return true;
          }else{
            lastIndex.pop();
          }
        }
        if(flow.nodes[i].type == "if"){
          if(flow.nodes[i].next.true != flow.nodes[i].next.false){
            lastIndex.push(parseInt(flow.nodes[i].next.false)-1)
          }else{
            lastIndex.push(i);
          }
        }
    }
  }