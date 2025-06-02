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
  
  function isPointNearAnyLineSegment(px, py, x1, y1, x2, y2, d) {
  const A = { x: x1, y: y1 };
  const B = { x: x2, y: y2 };
  const P = { x: px, y: py };

  const ABx = B.x - A.x, ABy = B.y - A.y;
  const APx = P.x - A.x, APy = P.y - A.y;
  const magAB2 = ABx * ABx + ABy * ABy;
  let t = (APx * ABx + APy * ABy) / magAB2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  const closest = { x: A.x + ABx * t, y: A.y + ABy * t };
  const dx = P.x - closest.x, dy = P.y - closest.y;
  return (dx * dx + dy * dy) <= (d * d);
}

/**
 * Disegna una linea e, se salva=true, la registra in frecce[].
 */
function drawLine(x1, y1, x2, y2, salva, fromNodeIndex, toNodeIndex, arrowType) {
  if (salva) {
    frecce.push({
      inzioX: x1, inzioY: y1, fineX: x2, fineY: y2,
      id: frecce.length,
      fromNodeIndex,
      toNodeIndex,
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
  // 1) Calcolo incomingCount e joinSet
  const incomingCount = Array(flow.nodes.length).fill(0);
  for (let i = 0; i < flow.nodes.length; i++) {
    const nd = flow.nodes[i];
    if (!nd) continue;
    if (nd.type === "if" && typeof nd.next === "object" && nd.next !== null) {
      const t = parseInt(nd.next.true, 10);
      const f = parseInt(nd.next.false, 10);
      if (!isNaN(t) && t < incomingCount.length) incomingCount[t]++;
      if (!isNaN(f) && f < incomingCount.length) incomingCount[f]++;
    } else if (typeof nd.next === "string" && nd.next !== null) {
      const n = parseInt(nd.next, 10);
      if (!isNaN(n) && n < incomingCount.length) incomingCount[n]++;
    }
  }
  const joinSet = new Set();
  for (let k = 0; k < incomingCount.length; k++) {
    if (incomingCount[k] >= 2) joinSet.add(k);
  }
  console.log("joinSet:", Array.from(joinSet));

  // 2) Resize e pulizia del canvas
  resizeCanvasToFitNodes(forme);
  ctx.clearRect(0, 0, w, h);
  frecce = [];

  // =============================================
  // 3) DISEGNO DI TUTTI I NODI
  // =============================================
  for (let i = 0; i < forme.length; i++) {
    const node = forme[i];
    if (!node) continue;

    const tipo = flow.nodes[i]?.type;
    let coloreNodo;
    switch (tipo) {
      case "start":       coloreNodo = "green";      break;
      case "end":         coloreNodo = "red";        break;
      case "read": case "input":     coloreNodo = "gray";       break;
      case "write": case "output": case "print":     coloreNodo = "lightblue";  break;
      case "assign": case "assignment": coloreNodo = "yellow";    break;
      case "if":          coloreNodo = "orange";     break;
      default:            coloreNodo = node.color;   break;
    }

    const x0 = node.relX * w - node.width / 2;
    const y0 = node.relY * h - node.height / 2;
    const cx = x0 + node.width / 2;
    const cy = y0 + node.height / 2;

    ctx.fillStyle   = coloreNodo;
    ctx.strokeStyle = "black";

    switch (tipo) {
      case "start":
      case "end":
        drawRoundedRect(x0, y0, node.width, node.height, 10);
        break;
      case "read": case "input":
      case "write": case "output": case "print":
      case "assign": case "assignment":
        drawParallelogram(x0, y0, node.width, node.height, 20);
        break;
      case "if":
        drawDiamond(x0, y0, node.width, node.height);
        break;
      default:
        ctx.beginPath();
        ctx.rect(x0, y0, node.width, node.height);
        ctx.closePath();
        break;
    }
    ctx.fill();
    ctx.stroke();

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

  // =============================================
  // 4) DISEGNO DEI COLLEGAMENTI
  // =============================================
  for (let i = 0; i < forme.length; i++) {
    const node      = forme[i];
    const logicNode = flow.nodes[i];
    if (!logicNode || !node) continue;

    const xMid       = node.relX * w;
    const yMid       = node.relY * h;
    const nodeHeight = node.height;

    // 4.a) Se è IF, disegno solo i rametti interni
    if (logicNode.type === "if" && typeof logicNode.next === "object" && logicNode.next !== null) {
      const trueIndex  = parseInt(logicNode.next.true,  10);
      const falseIndex = parseInt(logicNode.next.false, 10);

      // Disegno ramo “true” e catturo Y di svolta/arrivo
      const turnY_true = (!isNaN(trueIndex) && forme[trueIndex])
        ? drawArrowFromRight(node, forme[trueIndex], "T", i, trueIndex)
        : null;

      // Disegno ramo “false” e catturo Y di svolta/arrivo
      const turnY_false = (!isNaN(falseIndex) && forme[falseIndex])
        ? drawArrowFromLeft(node, forme[falseIndex], "F", i, falseIndex)
        : null;

      // 4.a.1) Se entrambi i rami convergono allo stesso nodo “next”
      if (trueIndex === falseIndex && !isNaN(trueIndex)) {
        // Decido la Y di partenza:
        //   se turnY_true≠null, uso quello; 
        //   altrimenti se turnY_false≠null, uso quello;
        //   altrimenti (allineato direttamente) prendo yMid+nodeHeight/2
        const startY = (turnY_true !== null) ? turnY_true
                      : (turnY_false !== null) ? turnY_false
                      : (yMid + nodeHeight / 2);
        const startX = node.relX * w;
        const targetX = forme[trueIndex].relX * w;
        const targetY = forme[trueIndex].relY * h - forme[trueIndex].height / 2;

        // Spezzone verticale “join” cliccabile → etichetta ‘if_join’
        drawLine(
          startX,
          startY,
          startX,
          targetY,
          true,
          i,
          trueIndex,
          'if_join'      // ← così lo riconosciamo come “inserzione diretta sotto IF”
        );
        // Spezzone orizzontale “join” cliccabile → etichetta ‘if_join’
        drawLine(
          startX,
          targetY,
          targetX,
          targetY,
          true,
          i,
          trueIndex,
          'if_join'
        );
      }
    }
    // 4.b) Collegamento “normale” (next è stringa)
    else if (typeof logicNode.next === "string" && logicNode.next !== null) {
      const nextIndex = parseInt(logicNode.next, 10);
      if (isNaN(nextIndex) || !forme[nextIndex]) continue;

      // Se è join (≥2 incoming), uso drawJoinConnectionFromLast
      if (joinSet.has(nextIndex)) {
        drawJoinConnectionFromLast(node, forme[nextIndex], i, nextIndex);
      } else {
        // Altrimenti disegno una singola freccia verticale
        drawLine(
          xMid,
          yMid + nodeHeight / 2,
          forme[nextIndex].relX * w,
          forme[nextIndex].relY * h - forme[nextIndex].height / 2,
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
 * Disegna il collegamento “L-shaped” da:
 *   • l’ultimo nodo di un ramo IF  (lastNode)
 *   • al bordo superiore del nodo esterno (joinNode)
 *
 * Di fatto traccia:
 *   1) una verticale dal centro‐inferiore di lastNode fino 
 *      al targetY (che è il bordo superiore di joinNode),
 *   2) una orizzontale da (startX, targetY) a (targetX, targetY).
 *
 * In questo modo non c’è un terzo spezzone verticale finale,
 * perché la Y di arrivo coincide esattamente con il bordo superiore del nodo di destinazione.
 *
 * @param {object} lastNode       – Oggetto visivo { relX, relY, width, height }
 * @param {object} joinNode       – Oggetto visivo del “nodo successivo” { relX, relY, width, height }
 * @param {number} fromNodeIndex  – Indice logico di lastNode in flow.nodes
 * @param {number} toNodeIndex    – Indice logico di joinNode in flow.nodes
 */
function drawJoinConnectionFromLast(lastNode, joinNode, fromNodeIndex, toNodeIndex) {
  // 1) Calcolo coordinate del fondo di lastNode (punto di partenza)
  const startX = lastNode.relX * w;
  const startY = lastNode.relY * h + lastNode.height / 2;

  // 2) Calcolo coordinate del bordo superiore di joinNode (destinazione Y)
  const targetX = joinNode.relX * w;
  const targetY = joinNode.relY * h - joinNode.height / 2;

  // 3) Traccio il primo spezzone verticale (fino a targetY)
  drawLine(
    startX, 
    startY, 
    startX, 
    targetY,
    true,            // salva=true ⇒ freccia cliccabile in questo spezzone
    fromNodeIndex, 
    toNodeIndex, 
    'normal'
  );

  // 4) Traccio il secondo spezzone orizzontale (fino a targetX)
  drawLine(
    startX, 
    targetY, 
    targetX, 
    targetY,
    false,           
    fromNodeIndex, 
    toNodeIndex, 
    'normal'
  );
}

/**
 * Disegna il collegamento “da IF al prossimo nodo esterno” come:
 *   1) Spezzone verticale cliccabile (dal centro-inferiore di if fino al bordo superiore di next)
 *   2) Spezzone orizzontale cliccabile (dal punto in cui arriva il verticale fino all’X di next)
 *
 * @param {object} ifNode         – Oggetto visivo del nodo IF { relX, relY, width, height }
 * @param {object} nextNode       – Oggetto visivo del nodo successivo { relX, relY, width, height }
 * @param {number} fromNodeIndex  – Indice logico di ifNode in flow.nodes
 * @param {number} toNodeIndex    – Indice logico di nextNode in flow.nodes
 */



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


function drawArrowFromRight(from, to, label, fromNodeIndex, toNodeIndex) {
  const verticalGapBeforeNode = 25;
  const startX_abs       = from.relX * w + from.width / 2;
  const startY_abs       = from.relY * h;
  const elbowColumnX_abs = startX_abs + 40;
  const targetX          = to.relX * w;
  const targetY          = to.relY * h - to.height / 2;
  const turnY            = targetY - verticalGapBeforeNode;

  // 1) Orizzontale in uscita (visivo)
  drawLine(
    startX_abs, startY_abs,
    elbowColumnX_abs, startY_abs,
    false, fromNodeIndex, toNodeIndex, 'if_true_h_out'
  );

  // 2) Caso “allineati X” → discesa verticale diretta dal gomito al nodo
  if (Math.abs(elbowColumnX_abs - targetX) < 0.5) {
    // Verticale cliccabile
    drawLine(
      elbowColumnX_abs, startY_abs,
      elbowColumnX_abs, targetY,
      true, fromNodeIndex, toNodeIndex, 'if_true'
    );
    // Etichetta “T” a metà tra startY_abs e targetY
    const midY_for_label = (startY_abs + targetY) / 2;
    ctx.fillStyle = "black";
    ctx.font       = "12px Arial";
    ctx.textAlign  = "center";
    ctx.fillText(label, elbowColumnX_abs + 20, midY_for_label);
    // Ritorno Y di arrivo per disegni esterni
    return targetY;
  }

  // 3) Caso “non allineati X” → gomito interno
  //   3.a) V1 cliccabile fino a turnY
  drawLine(
    elbowColumnX_abs, startY_abs,
    elbowColumnX_abs, turnY,
    true, fromNodeIndex, toNodeIndex, 'if_true'
  );
  //   3.b) H visivo fino a targetX
  drawLine(
    elbowColumnX_abs, turnY,
    targetX, turnY,
    false, fromNodeIndex, toNodeIndex, 'if_true_h_in'
  );
  //   3.c) V2 visivo finale fino a targetY
  drawLine(
    targetX, turnY,
    targetX, targetY,
    false, fromNodeIndex, toNodeIndex, 'if_true_v_to_target'
  );
  // Etichetta “T” tra startY_abs e turnY
  const midY_for_label = (startY_abs + turnY) / 2;
  ctx.fillStyle = "black";
  ctx.font       = "12px Arial";
  ctx.textAlign  = "center";
  ctx.fillText(label, elbowColumnX_abs + 20, midY_for_label);
  // Ritorno turnY per eventuali connessioni esterne
  return turnY;
}

/**
 * Disegna il “ramo false” di un IF fino al nodo di destinazione,
 * includendo sia la discesa verticale in caso di allineamento,
 * sia il gomito interno (V1 + H + V2) in caso di non allineamento.
 *
 * Restituisce l’Y del punto di svolta orizzontale (turnY), oppure
 * l’Y di arrivo se allineato, per permettere a draw() di sapere
 * da dove far partire eventuali connessioni esterne.
 */
function drawArrowFromLeft(from, to, label, fromNodeIndex, toNodeIndex) {
  const verticalGapBeforeNode = 25;
  const startX_abs       = from.relX * w - from.width / 2;
  const startY_abs       = from.relY * h;
  const elbowColumnX_abs = startX_abs - 40;
  const targetX          = to.relX * w;
  const targetY          = to.relY * h - to.height / 2;
  const turnY            = targetY - verticalGapBeforeNode;

  // 1) Orizzontale in uscita (visivo)
  drawLine(
    startX_abs, startY_abs,
    elbowColumnX_abs, startY_abs,
    false, fromNodeIndex, toNodeIndex, 'if_false_h_out'
  );

  // 2) Caso “allineati X” → discesa verticale diretta dal gomito al nodo
  if (Math.abs(elbowColumnX_abs - targetX) < 0.5) {
    // Verticale cliccabile
    drawLine(
      elbowColumnX_abs, startY_abs,
      elbowColumnX_abs, targetY,
      true, fromNodeIndex, toNodeIndex, 'if_false'
    );
    // Etichetta “F” a metà tra startY_abs e targetY
    const midY_for_label = (startY_abs + targetY) / 2;
    ctx.fillStyle = "red";
    ctx.font       = "12px Arial";
    ctx.textAlign  = "center";
    ctx.fillText(label, elbowColumnX_abs - 20, midY_for_label);
    // Ritorno Y di arrivo per disegni esterni
    return targetY;
  }

  // 3) Caso “non allineati X” → gomito interno
  //   3.a) V1 cliccabile fino a turnY
  drawLine(
    elbowColumnX_abs, startY_abs,
    elbowColumnX_abs, turnY,
    true, fromNodeIndex, toNodeIndex, 'if_false'
  );
  //   3.b) H visivo fino a targetX
  drawLine(
    elbowColumnX_abs, turnY,
    targetX, turnY,
    false, fromNodeIndex, toNodeIndex, 'if_false_h_in'
  );
  //   3.c) V2 visivo finale fino a targetY
  drawLine(
    targetX, turnY,
    targetX, targetY,
    false, fromNodeIndex, toNodeIndex, 'if_false_v_to_target'
  );
  // Etichetta “F” tra startY_abs e turnY
  const midY_for_label = (startY_abs + turnY) / 2;
  ctx.fillStyle = "red";
  ctx.font       = "12px Arial";
  ctx.textAlign  = "center";
  ctx.fillText(label, elbowColumnX_abs - 20, midY_for_label);
  // Ritorno turnY per eventuali connessioni esterne
  return turnY;
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

function inserisciNodo(tipo) {
  saved = false;
  if (frecceSelected === -1 || !frecce[frecceSelected]) {
    console.error("inserisciNodo ERRORE: Nessuna freccia selezionata o freccia non valida.");
    chiudiPopup();
    return;
  }

  const clickedArrow = frecce[frecceSelected];
  const arrowType    = clickedArrow.type;              // es. 'normal', 'if_true', 'if_false', 'if_join', 'if_true_h_in', ecc.
  const parentNodeIndex         = clickedArrow.fromNodeIndex;
  const originalTargetNodeIndex = clickedArrow.toNodeIndex;
  const newActualNodeIndex      = originalTargetNodeIndex;

  console.log(`inserisciNodo INFO: Tipo Nodo="${tipo}", ID Freccia=${clickedArrow.id}, Tipo Freccia="${arrowType}"`);
  console.log(`  parentNodeIndex=${parentNodeIndex}, originalTargetNodeIndex=${originalTargetNodeIndex}`);

  // Blocchiamo inserimenti circolari dentro lo stesso ramo IF
  if (
    parentNodeIndex === originalTargetNodeIndex &&
    (arrowType === 'if_true' || arrowType === 'if_false' || arrowType === 'if_join')
  ) {
    console.error("inserisciNodo ERRORE: Tentativo di inserimento circolare in IF.");
    chiudiPopup();
    frecceSelected = -1;
    return;
  }

  // 1) Creiamo il nuovo nodo logico
  let newNodeLogic;
  const nextForNew = (newActualNodeIndex + 1).toString();
  if (tipo === "if") {
    newNodeLogic = {
      type: "if",
      info: "",
      next: { true: nextForNew, false: nextForNew }
    };
  } else {
    newNodeLogic = { type: tipo, info: "", next: nextForNew };
  }

  // 2) Inseriamo in flow.nodes e spostiamo tutti i next >= newActualNodeIndex
  flow.nodes.splice(newActualNodeIndex, 0, newNodeLogic);
  console.log(`inserisciNodo INFO: Inserito nodo logico "${tipo}" in indice ${newActualNodeIndex}. Ora flow.nodes.length=${flow.nodes.length}`);

  for (let i = 0; i < flow.nodes.length; i++) {
    const n = flow.nodes[i];
    if (n === newNodeLogic) continue;

    if (n.type === "if" && typeof n.next === "object" && n.next !== null) {
      // Ramo true
      if (typeof n.next.true === "string") {
        const oldT = parseInt(n.next.true, 10);
        if (!isNaN(oldT) && oldT >= newActualNodeIndex) {
          n.next.true = (oldT + 1).toString();
        }
      }
      // Ramo false
      if (typeof n.next.false === "string") {
        const oldF = parseInt(n.next.false, 10);
        if (!isNaN(oldF) && oldF >= newActualNodeIndex) {
          n.next.false = (oldF + 1).toString();
        }
      }
    }
    else if (typeof n.next === "string" && n.next !== null) {
      const oldN = parseInt(n.next, 10);
      if (!isNaN(oldN) && oldN >= newActualNodeIndex) {
        n.next = (oldN + 1).toString();
      }
    }
  }
  console.log("inserisciNodo INFO: Puntatori 'next' di tutti i nodi aggiornati.");

  // 3) Aggiorniamo il genitore SOLO se la freccia è esattamente 'if_true', 'if_false' o 'if_join'.
  //    Se invece è un segmento interno-esexterno come 'if_true_h_in', 'if_false_v_to_target', ecc.,
  //    *NON* tocchiamo affatto next.true/false.
  const parentLogic = flow.nodes[parentNodeIndex];
  if (parentLogic && parentLogic.type === "if") {
    const newTargetStr = newActualNodeIndex.toString();

    if (arrowType === "if_join") {
      parentLogic.next.true  = newTargetStr;
      parentLogic.next.false = newTargetStr;
      console.log(`inserisciNodo INFO: JOIN sotto IF → next.true=e next.false = ${newTargetStr}`);
    }
    else if (arrowType === "if_true") {
      parentLogic.next.true = newTargetStr;
      console.log(`inserisciNodo INFO: Inserimento in ramo TRUE → next.true = ${newTargetStr}`);
    }
    else if (arrowType === "if_false") {
      parentLogic.next.false = newTargetStr;
      console.log(`inserisciNodo INFO: Inserimento in ramo FALSE → next.false = ${newTargetStr}`);
    }
    else {
      // arrowType è 'normal' (quindi nodo esterno) o un segmento 'if_*_h_in', 'if_*_v_to_target', ecc.
      // Non aggiorniamo i rami dell’IF: rimangono tali.
      console.log("inserisciNodo INFO: Freccia esterna a IF → non modifico next.true/false di IF.");
    }
  }
  else if (parentLogic) {
    // Genitore non‐IF: inserimento “normale”
    parentLogic.next = newActualNodeIndex.toString();
    console.log(`inserisciNodo INFO: Genitore non-IF → next = ${newActualNodeIndex}`);
  }

  // 4) Calcolo la posizione relX del nuovo nodo visivo
  const parentVis = nodi[parentNodeIndex];
  let newRelX;
  const elbowOffset = 40;

  if (parentLogic && parentLogic.type === "if") {
    if (arrowType === "if_join" && parentVis) {
      newRelX = parentVis.relX;
    }
    else if (arrowType === "if_true" && parentVis) {
      const prX = parentVis.relX * w + parentVis.width / 2;
      newRelX = (prX + elbowOffset) / w;
    }
    else if (arrowType === "if_false" && parentVis) {
      const plX = parentVis.relX * w - parentVis.width / 2;
      newRelX = (plX - elbowOffset) / w;
    }
    else {
      // Inserimento esterno all’IF o segmento IF‐“mancante”: allineo al centro dell’IF
      newRelX = parentVis ? parentVis.relX : 0.5;
    }
  }
  else if (parentVis && arrowType === "normal") {
    newRelX = parentVis.relX;
  }
  else {
    newRelX = 0.5;
  }

  // Clamp fra margini
  const nodeWidth = 100;
  const minRX = (nodeWidth / 2) / w + 0.01;
  const maxRX = 1 - ((nodeWidth / 2) / w) - 0.01;
  if (newRelX < minRX) newRelX = minRX;
  if (newRelX > maxRX) newRelX = maxRX;

  console.log(`inserisciNodo INFO: newRelX = ${newRelX.toFixed(3)}`);

  // 5) Inserisco il nodo visivo e ridisegno
  nodi.splice(newActualNodeIndex, 0, {
    relX: newRelX,
    relY: 0,
    width: 100,
    height: 40,
    color: "white",
    text: tipo.charAt(0).toUpperCase() + tipo.slice(1)
  });
  console.log(`inserisciNodo INFO: Nodo visivo inserito in indice ${newActualNodeIndex}.`);

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


/**
 * Ricalcola e assegna le posizioni Y (relY) a tutti i nodi visuali (nodiVisualArray),
 * facendo in modo che un IF “lineare” (next.true === next.false) non venga  
 * suddiviso in due ramificazioni fino a quando non si crea davvero un ramo.
 */
function calcoloY(nodiVisualArray) {
  if (!flow.nodes.length || !nodiVisualArray.length || !h) {
    console.warn("calcoloY: Dati mancanti o canvas non inizializzato correttamente.");
    return;
  }

  // 1) Reset di tutte le Y
  for (let node of nodiVisualArray) {
    node.relY = 0;
  }

  // 2) Per evitare sovrapposizioni orizzontali, teniamo traccia
  //    del massimo Y già assegnato per ciascuna “colonna” relX
  const maxYAtColumn = {};

  /**
   * Funzione ricorsiva che assegna la relY a currentNodeIndex.
   * 
   * @param {number} currentNodeIndex          – Indice nell’array flow.nodes / nodiVisualArray
   * @param {number} predecessorBottomY        – Punto di partenza (in relY) sotto cui posizionare questo nodo
   * @param {Set<number>} visitedInPath       – Set di nodi già visti lungo questo percorso (evita cicli)
   * @returns {number}                        – Y “massima” (bottom) raggiunta da questo percorso ricorsivo
   */
  function calculateNodeYRecursive(currentNodeIndex, predecessorBottomY, visitedInPath) {
    if (
      currentNodeIndex === null ||
      currentNodeIndex === undefined ||
      visitedInPath.has(currentNodeIndex)
    ) {
      // Se non c’è nodo valido o abbiamo già visitato questo indice → esco restituendo la Y passata
      return predecessorBottomY;
    }
    visitedInPath.add(currentNodeIndex);

    const visualNode  = nodiVisualArray[currentNodeIndex];
    const logicalNode = flow.nodes[currentNodeIndex];
    if (!visualNode || !logicalNode) {
      return predecessorBottomY;
    }

    // Calcolo altezza del nodo (relativa al canvas)
    const nodeHeightRel = (visualNode.height || NODE_BASE_HEIGHT_PX) / h;
    const columnKey     = visualNode.relX.toFixed(2);

    // 2.a) Decido la Y “top” di questo nodo:
    //      deve essere almeno predecessorBottomY,  
    //      ma non deve sovrapporsi a un nodo già in quella stessa colonna.
    let proposedTopY = predecessorBottomY;
    if (maxYAtColumn[columnKey] !== undefined && maxYAtColumn[columnKey] > proposedTopY) {
      proposedTopY = maxYAtColumn[columnKey];
    }
    if (visualNode.relY > proposedTopY) {
      proposedTopY = visualNode.relY;
    }

    // Assegno relY
    visualNode.relY = proposedTopY;

    // Calcolo bottomY (top + altezza + spacing)
    const bottomY = visualNode.relY + nodeHeightRel + NODE_VERTICAL_SPACING_BASE_REL;
    if (!maxYAtColumn[columnKey] || bottomY > maxYAtColumn[columnKey]) {
      maxYAtColumn[columnKey] = bottomY;
    }

    // Per default, il “massimo percorso” inizia come questo bottomY
    let maxPathYReached = bottomY;

    // 3) Se è un IF, devo decidere se trattarlo “lineare” o “ramificato”
    if (logicalNode.type === "if" && typeof logicalNode.next === "object" && logicalNode.next !== null) {
      const trueNextIdx  = parseInt(logicalNode.next.true, 10);
      const falseNextIdx = parseInt(logicalNode.next.false, 10);

      // Se next.true === next.false, NON è stato ancora creato un ramo
      // → comportiamoci come se fosse un collegamento “normale” a quell’unico nodo
      if (!isNaN(trueNextIdx) && trueNextIdx === falseNextIdx) {
        // scendo direttamente, senza ramificare
        const yDown = calculateNodeYRecursive(
          trueNextIdx,
          bottomY,
          new Set(visitedInPath)
        );
        maxPathYReached = Math.max(maxPathYReached, yDown);
      }
      // Altrimenti (trueNextIdx !== falseNextIdx), è un IF veramente ramificato:
      // disegno i due sub‐rami a partire da un “branch start Y”
      else {
        const branchStartY = visualNode.relY + nodeHeightRel + IF_BRANCH_START_Y_OFFSET_REL;

        // 3.a) Ramo TRUE
        if (!isNaN(trueNextIdx)) {
          const yTrue = calculateNodeYRecursive(
            trueNextIdx,
            branchStartY,
            visitedInPath
          );
          if (yTrue > maxPathYReached) maxPathYReached = yTrue;
        }
        // 3.b) Ramo FALSE
        if (!isNaN(falseNextIdx)) {
          const yFalse = calculateNodeYRecursive(
          falseNextIdx,
          branchStartY,
          visitedInPath
        );
          if (yFalse > maxPathYReached) maxPathYReached = yFalse;
        }

        // 3.c) Se i due rami confluiscono su uno stesso nodo (join),
        //       lo posiziono subito sotto il massimo dei due.
        if (trueNextIdx === falseNextIdx && !isNaN(trueNextIdx)) {
          const joinIdx    = trueNextIdx;
          const joinNode   = nodiVisualArray[joinIdx];
          const joinTopY   = maxPathYReached + NODE_VERTICAL_SPACING_BASE_REL;
          if (joinNode && (joinNode.relY < joinTopY)) {
            joinNode.relY = joinTopY;
            const joinBottomY = joinNode.relY + (joinNode.height / h) + NODE_VERTICAL_SPACING_BASE_REL;
            const ck = joinNode.relX.toFixed(2);
            if (!maxYAtColumn[ck] || joinBottomY > maxYAtColumn[ck]) {
              maxYAtColumn[ck] = joinBottomY;
            }
            // 3.c.i) Dopodiché, lavoro sul nodo successivo al join (se esiste)
            const nextOfJoin = flow.nodes[joinIdx].next;
            if (typeof nextOfJoin === "string") {
              const postIdx = parseInt(nextOfJoin, 10);
              if (!isNaN(postIdx)) {
                const yAfterJoin = calculateNodeYRecursive(
                  postIdx,
                  joinBottomY,
                  new Set(visitedInPath)
                );
                if (yAfterJoin > joinBottomY) {
                  maxPathYReached = yAfterJoin;
                }
              }
            }
            // Se non ci sono ulteriori nodi, il maxPathYReached rimane joinBottomY
            maxPathYReached = Math.max(maxPathYReached, joinBottomY);
          }
        }
      }

      return maxPathYReached;
    }

    // 4) Se NON è un IF ma ha un next “normale”
    if (typeof logicalNode.next === "string" && logicalNode.next !== null) {
      const nextIdx = parseInt(logicalNode.next, 10);
      if (!isNaN(nextIdx)) {
        const yNext = calculateNodeYRecursive(
          nextIdx,
          bottomY,
          new Set(visitedInPath)
        );
        if (yNext > maxPathYReached) maxPathYReached = yNext;
      }
    }

    return maxPathYReached;
  }

  // 5) Trovo “start” (o indice 0 se non c’è) e do il via alla ricorsione
  let startIndex = flow.nodes.findIndex(nd => nd.type === "start");
  if (startIndex < 0 && flow.nodes.length > 0) startIndex = 0;

  if (startIndex >= 0 && nodiVisualArray[startIndex]) {
    const startNode    = nodiVisualArray[startIndex];
    startNode.relY     = NODE_VERTICAL_SPACING_BASE_REL / 2; // un po’ di margine su Y=0
    const startHeight  = (startNode.height || NODE_BASE_HEIGHT_PX) / h;
    const startBotY    = startNode.relY + startHeight + NODE_VERTICAL_SPACING_BASE_REL;
    const col0         = startNode.relX.toFixed(2);
    maxYAtColumn[col0] = startBotY;

    const logicStart   = flow.nodes[startIndex];
    // Se è IF, controllo se next.true===next.false per elaborarlo di conseguenza
    if (logicStart.type === "if" && typeof logicStart.next === "object" && logicStart.next !== null) {
      const t0 = parseInt(logicStart.next.true, 10);
      const f0 = parseInt(logicStart.next.false, 10);

      if (!isNaN(t0) && t0 === f0) {
        // IF lineare: trattalo come un normale “next”
        calculateNodeYRecursive(t0, startBotY, new Set([startIndex]));
      } else {
        // IF ramificato: faccio i due rami sotto
        const branchY = startNode.relY + startHeight + IF_BRANCH_START_Y_OFFSET_REL;
        if (!isNaN(t0)) {
          calculateNodeYRecursive(t0, branchY, new Set([startIndex]));
        }
        if (!isNaN(f0)) {
          calculateNodeYRecursive(f0, branchY, new Set([startIndex]));
        }
        // Se confluiscono sullo stesso nodo (join iniziale)
        if (t0 === f0 && !isNaN(t0)) {
          const joinIdx   = t0;
          const joinNode  = nodiVisualArray[joinIdx];
          const joinTopY  = branchY; // max dei due rami è branchY, perché erano allo stesso livello
          if (joinNode && (joinNode.relY < joinTopY)) {
            joinNode.relY = joinTopY;
            const joinBotY = joinNode.relY + ((joinNode.height || NODE_BASE_HEIGHT_PX) / h) + NODE_VERTICAL_SPACING_BASE_REL;
            const colJ     = joinNode.relX.toFixed(2);
            if (!maxYAtColumn[colJ] || joinBotY > maxYAtColumn[colJ]) {
              maxYAtColumn[colJ] = joinBotY;
            }
            // Poi eventuale next dopo merge
            const post = flow.nodes[joinIdx].next;
            if (typeof post === "string") {
              const postIdx = parseInt(post, 10);
              if (!isNaN(postIdx)) {
                calculateNodeYRecursive(postIdx, joinBotY, new Set([startIndex, joinIdx]));
              }
            }
          }
        }
      }
    }
    // Se “start” non è IF ma ha un next normale
    else if (typeof logicStart.next === "string") {
      const nxt0 = parseInt(logicStart.next, 10);
      if (!isNaN(nxt0)) {
        calculateNodeYRecursive(nxt0, startBotY, new Set([startIndex]));
      }
    }
  } else {
    console.warn("calcoloY: nodo di start non trovato o non valido.");
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