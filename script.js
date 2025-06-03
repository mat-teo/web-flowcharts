let canvas = document.getElementById("canvas"); // Elemento canvas del DOM
let ctx = canvas.getContext("2d"); // Contesto di disegno 2D del canvas
let container = document.getElementById("canvas-container"); // Contenitore del canvas

canvas.width = container.offsetWidth; // Larghezza del canvas impostata come la larghezza del suo contenitore
canvas.height = container.offsetHeight; // Altezza del canvas impostata come l'altezza del suo contenitore
let w = canvas.width; // Larghezza del canvas
let h = canvas.height; // Altezza del canvas

const NODE_BASE_HEIGHT_PX = 40; // Altezza base di un nodo in pixel
const NODE_VERTICAL_SPACING_BASE_REL = 0.06; // Spaziatura verticale relativa base tra nodi sequenziali (6% dell'altezza del canvas)
const IF_BRANCH_START_Y_OFFSET_REL = 0.05; // Spaziatura verticale relativa addizionale tra un nodo IF e l'inizio dei suoi rami

// Ridimensiona il canvas per adattarsi dinamicamente al contenuto dei nodi.
function resizeCanvasToFitNodes(nodi) {
  const margin = 100;        // Spazio extra in pixel intorno ai nodi
  const scrollPadding = 300; // Spazio aggiuntivo in pixel per consentire sempre lo scorrimento

  let maxX = 0, maxY = 0; // Coordinate massime (in pixel) raggiunte dai nodi

  for (const node of nodi) {
    const nodeX = node.relX * canvas.width; // Posizione X assoluta del nodo
    const nodeY = node.relY * canvas.height; // Posizione Y assoluta del nodo
    if (nodeX > maxX) maxX = nodeX;
    if (nodeY > maxY) maxY = nodeY;
  }

  // Calcola la larghezza e l'altezza necessarie per contenere tutti i nodi più i margini e lo spazio per lo scorrimento
  const requiredWidth = Math.max(container.offsetWidth, maxX + margin + scrollPadding);
  const requiredHeight = Math.max(container.offsetHeight, maxY + margin + scrollPadding);

  // Ridimensiona il canvas solo se le dimensioni calcolate sono diverse da quelle attuali
  if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
    canvas.width = requiredWidth;
    canvas.height = requiredHeight;
    w = canvas.width; // Aggiorna la larghezza globale
    h = canvas.height; // Aggiorna l'altezza globale
  }
}


let saved; // Flag per indicare se ci sono modifiche non salvate nel flowchart
// Struttura dati principale per la logica del flowchart
let flow = {
  "nodes": [ 
    { "type": "start", "info": "", "next": "1" },
    { "type": "end", "info": "", "next": null }
  ],
  "variables": [] 
};

let frecceSelected = -1; // Indice della freccia selezionata dall'utente (-1 se nessuna)
let nodoSelected = -1;   // Indice del nodo selezionato dall'utente (-1 se nessuno)

let nodi = []; // Array degli oggetti nodo visuali (per il disegno)
let frecce = []; // Array degli oggetti freccia visuali (per il disegno e l'interazione)

let tabVariabili = document.getElementById("tabVariabili"); // Elemento tabella HTML per le variabili
// Array per la gestione delle righe della tabella (non usato attivamente nel codice fornito)
let rigaTabella = [];

// Nasconde la finestra popup utilizzata per selezionare il tipo di nodo da inserire.
function chiudiPopup() {
  document.getElementById("popup-window").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
}

// Adapta le dimensioni del canvas quando la finestra del browser viene ridimensionata e ridisegna l'intero flowchart.
function resizeCanvas() {
  canvas.width = window.innerWidth - 10; // Imposta la larghezza del canvas quasi come la finestra
  canvas.height = window.innerHeight - 10; // Imposta l'altezza del canvas quasi come la finestra
  ctx = canvas.getContext("2d"); 
  w = canvas.width; // Aggiorna la larghezza globale
  h = canvas.height; // Aggiorna l'altezza globale
  draw(nodi); // Ridisegna tutto
}

// Verifica se un punto (px, py) è vicino a un segmento di linea (x1,y1)-(x2,y2) entro una distanza d.
function isPointNearAnyLineSegment(px, py, x1, y1, x2, y2, d) {
  const A = { x: x1, y: y1 }; // Punto iniziale del segmento
  const B = { x: x2, y: y2 }; // Punto finale del segmento
  const P = { x: px, y: py }; // Punto da controllare

  const ABx = B.x - A.x, ABy = B.y - A.y;  //lunghzza linea
  const APx = P.x - A.x, APy = P.y - A.y;  //spostamento verticale necessario per andare da A a P
  const magAB2 = ABx * ABx + ABy * ABy; 
  let t = (APx * ABx + APy * ABy) / magAB2; 
  if (t < 0) t = 0;
  if (t > 1) t = 1; 

  const closest = { x: A.x + ABx * t, y: A.y + ABy * t }; 
  const dx = P.x - closest.x, dy = P.y - closest.y;
  return (dx * dx + dy * dy) <= (d * d); 
}

// Disegna una linea e, se salva=true, la registra nell'array frecce[].
function drawLine(x1, y1, x2, y2, salva, fromNodeIndex, toNodeIndex, arrowType) {
  if (salva) {
    frecce.push({
      inzioX: x1, inzioY: y1, fineX: x2, fineY: y2,
      id: frecce.length, // ID univoco per la freccia
      fromNodeIndex, // Indice del nodo di partenza
      toNodeIndex, // Indice del nodo di destinazione
      type: arrowType // Tipo di freccia (es. 'normal', 'if_true')
    });
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "black"; 
  ctx.lineWidth = 2; 
  ctx.stroke();
}

// Verifica se il click è avvenuto su un nodo o su una freccia.
function checkClick(event) {
  clickNodo(event);
  clickFreccia(event);
}

// Gestisce il click su una freccia.
// Se una freccia viene cliccata, apre il popup per l'inserimento di un nuovo nodo.
function clickFreccia(event) {
  // Blocco 1: Calcola le coordinate del click relative al canvas
  let rect = canvas.getBoundingClientRect(); 
  let clickX = event.clientX - rect.left; // Coordinata X del click relativa al canvas
  let clickY = event.clientY - rect.top; // Coordinata Y del click relativa al canvas

  // Blocco 2: Itera sulle frecce disegnate e verifica se qualcuna è stata cliccata
  for (let i = 0; i < frecce.length; i++) {
    const freccia = frecce[i]; 
    if (isPointNearLine(clickX, clickY, freccia.inzioX, freccia.inzioY, freccia.fineX, freccia.fineY, 8)) { // 8 è la distanza di tolleranza
      console.log("Hai cliccato la freccia", freccia.id);
      document.getElementById("popup-window").classList.add("active"); 
      document.getElementById("overlay").classList.add("active"); 
      frecceSelected = freccia.id; // Memorizza l'ID della freccia selezionata
      return;
    }
  }
}

// Disegna una linea tra due punti.
// Se 'salva' è true, la linea viene aggiunta all'array 'frecce' per la rilevazione dei click,
// includendo informazioni sul nodo di partenza, di destinazione e il tipo di freccia.
function drawLine(x1, y1, x2, y2, salva, fromNodeIndex, toNodeIndex, arrowType) {
  if (salva) {
    frecce.push({
      inzioX: x1, inzioY: y1, fineX: x2, fineY: y2, // Coordinate della freccia
      id: frecce.length,
      fromNodeIndex: fromNodeIndex, // Indice del nodo di partenza nella logica flow.nodes
      toNodeIndex: toNodeIndex,     
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

// Trova l'indice del nodo di join a cui convergono i rami di un nodo IF.
// Restituisce null se non è un IF valido, i nodi dei rami non esistono o non c'è un join comune.
function findJoinNode(ifNodeIndex) {
    const ifNode = flow.nodes[ifNodeIndex]; //Nodo IF logico
    if (!ifNode || !ifNode.next) return null; // Controllo
    
    let truePathEnd = parseInt(ifNode.next.true); // Indice del nodo target del ramo true
    let falsePathEnd = parseInt(ifNode.next.false); // Indice del nodo target del ramo false
    
    // Controllo per assicurare che i nodi dei rami esistano
    if (!flow.nodes[truePathEnd] || !flow.nodes[falsePathEnd]) return null;
    
    // Trova l'ultimo nodo del ramo true che punta al join node (ifNode.join)
    while (flow.nodes[truePathEnd] && flow.nodes[truePathEnd].next !== ifNode.join) {
        truePathEnd = parseInt(flow.nodes[truePathEnd].next);
        if (isNaN(truePathEnd)) break; // Previene loop infiniti se la struttura è malformata
    }
    
    // Trova l'ultimo nodo del ramo false che punta al join node (ifNode.join)
    while (flow.nodes[falsePathEnd] && flow.nodes[falsePathEnd].next !== ifNode.join) {
        falsePathEnd = parseInt(flow.nodes[falsePathEnd].next);
        if (isNaN(falsePathEnd)) break; 
    }
    
    // Controlla se i nodi finali dei percorsi sono validi
    if (!flow.nodes[truePathEnd] || !flow.nodes[falsePathEnd]) return null;
    
    // Il nodo di join è il successivo comune; se puntano allo stesso nodo, quello è il join.
    return flow.nodes[truePathEnd].next === flow.nodes[falsePathEnd].next ? 
        parseInt(flow.nodes[truePathEnd].next) : null;
}


// FUNZIONE PRINCIPALE draw(forme):
//  Calcola quanti collegamenti in entrata (incoming) ha ciascun nodo logico (flow.nodes).
//  Costruisce joinSet = un insieme di indici di nodi che hanno almeno 2 collegamenti in entrata.
//  Disegna i nodi (considerando colori, forme specifiche per tipo, e testo interno).
//  Per ogni collegamento “next” definito in flow.nodes:
//      Se il collegamento proviene da un nodo IF (distinguendo ramo true e false), 
//       utilizza le funzioni drawArrowFromRight o drawArrowFromLeft.
//      Altrimenti (collegamento “normale”), se il nodo di destinazione è in joinSet (cioè ha multipli ingressi),
//       disegna una connessione spezzata (verticale, orizzontale, verticale).
//      Se non è un IF e non va a un join node, disegna una linea retta semplice usando drawLine
function draw(forme) { 
  // 1) Calcolo incomingCount e joinSet
  const incomingCount = Array(flow.nodes.length).fill(0); //per contare gli ingressi per ogni nodo
  for (let i = 0; i < flow.nodes.length; i++) {
    const nd = flow.nodes[i]; 
    if (!nd) continue;
    if (nd.type === "if" && typeof nd.next === "object" && nd.next !== null) {
      const t = parseInt(nd.next.true, 10); // Indice del nodo successivo per il ramo true
      const f = parseInt(nd.next.false, 10); // Indice del nodo successivo per il ramo false
      if (!isNaN(t) && t < incomingCount.length) incomingCount[t]++;
      if (!isNaN(f) && f < incomingCount.length) incomingCount[f]++;
    } else if (typeof nd.next === "string" && nd.next !== null) {
      const n = parseInt(nd.next, 10); // Indice del nodo successivo normale
      if (!isNaN(n) && n < incomingCount.length) incomingCount[n]++;
    }
  }
  const joinSet = new Set(); // Insieme degli indici dei nodi che sono punti di join
  for (let k = 0; k < incomingCount.length; k++) {
    if (incomingCount[k] >= 2) joinSet.add(k);
  }
  console.log("joinSet:", Array.from(joinSet));

  // 2) Resize e pulizia del canvas
  resizeCanvasToFitNodes(forme); // Adatta le dimensioni del canvas ai nodi
  ctx.clearRect(0, 0, w, h); // Pulisce il canvas
  frecce = []; // Resetta l'array delle frecce visuali

   // 3) DISEGNO DI TUTTI I NODI
  for (let i = 0; i < forme.length; i++) {
    const node = forme[i]; // Nodo visuale corrente
    if (!node) continue;

    const tipo = flow.nodes[i].type; // Tipo del nodo logico corrispondente
    let coloreNodo; 
    switch (tipo) {
      case "start":       coloreNodo = "green";      break;
      case "end":         coloreNodo = "red";        break;
      case "read": case "input":     coloreNodo = "gray";       break;
      case "write": case "output": case "print":     coloreNodo = "lightblue";  break;
      case "assign": case "assignment": coloreNodo = "yellow";    break;
      case "if":          coloreNodo = "orange";     break;
      default:            coloreNodo = node.color;   break; // Colore di default se non specificato
    }

    let x0 = node.relX * w - node.width / 2;
    const y0 = node.relY * h - node.height / 2; 
    const cx = x0 + node.width / 2;
    const cy = y0 + node.height / 2; 

    // Disegno della forma (rettangolo arrotondato, parallelogramma, rombo, o rettangolo normale)
    ctx.fillStyle   = coloreNodo; // Imposta il colore di riempimento
    ctx.strokeStyle = "black"; // Imposta il colore del bordo

    let toWrite = node.text; // Testo base del nodo 
      if (flow.nodes[i] && !["start", "end"].includes(flow.nodes[i].type)) {
        toWrite += ":" + (flow.nodes[i].info || ""); // Aggiunge le informazioni specifiche del nodo se non è start/end
    }
    const textMeasure = ctx.measureText(toWrite); 
    
    // Adattamento larghezza nodo al testo
    let difference = node.width  - textMeasure.width + 20; 
    if(difference>100){ // Limita la riduzione della larghezza
      node.width = 100;
      x0 = node.relX * w - node.width / 2;
    }
    if(node.width<(textMeasure.width+20)){ // Se il nodo è troppo stretto per il testo
      difference = textMeasure.width+20 - node.width;
      x0 -= difference/2;
      node.width = textMeasure.width+20;
    }

    switch (tipo) { // Disegna la forma specifica in base al tipo di nodo
      case "start":
      case "end":
        drawRoundedRect(x0, y0, node.width, node.height, 10); // 10 è il raggio degli angoli
        break;
      case "read": case "input":
      case "write": case "output": case "print":
      case "assign": case "assignment":
        drawParallelogram(x0, y0, node.width, node.height, 20); // 20 è l'inclinazione
        break;
      case "if":
        drawDiamond(x0, y0, node.width, node.height);
        break;
      default: // Nodo di tipo non riconosciuto o generico
        ctx.beginPath();
        ctx.rect(x0, y0, node.width, node.height);
        ctx.closePath();
        break;
    }
    ctx.fill(); // Riempie la forma
    ctx.stroke(); // Disegna il bordo

    if (node.text) {  
      ctx.font = `bold 16px Arial`; 
      ctx.fillStyle = "black"; 
      ctx.textAlign = "center"; 
      ctx.textBaseline = "middle"; 
      ctx.fillText(toWrite, cx, cy); 
    }
  }

  // 4) DISEGNO DEI COLLEGAMENTI
  for (let i = 0; i < forme.length; i++) {
    const node = forme[i]; // Nodo visuale di partenza
    const logicNode = flow.nodes[i]; // Nodo logico di partenza
    if (!logicNode || !node) continue;

    const xMid = node.relX * w; // Coordinata X del centro del nodo di partenza
    const yMid = node.relY * h; // Coordinata Y del centro del nodo di partenza
    const nodeHeight = node.height; // Altezza del nodo di partenza

    // 4.a) Se è IF, disegno solo i rametti interni che vanno ai nodi successivi dei rami true/false
    if (logicNode.type === "if" && typeof logicNode.next === "object" && logicNode.next !== null) {
      const trueIndex  = parseInt(logicNode.next.true,  10); // Indice del nodo successivo per il ramo true
      const falseIndex = parseInt(logicNode.next.false, 10); // Indice del nodo successivo per il ramo false

      // Disegno ramo “true” e catturo Y di svolta/arrivo
      let turnY_true;
      if (!isNaN(trueIndex) && forme[trueIndex]){ // Coordinata Y del "gomito" o arrivo del ramo true
        drawArrowFromRight(node, forme[trueIndex], "T", i, trueIndex); // "T" è l'etichetta del ramo
      }else{
        turnY_true = null;
      }

      // Disegno ramo “false” e catturo Y di svolta/arrivo
      let turnY_false;
      if (!isNaN(falseIndex) && forme[falseIndex]){ // Coordinata Y del "gomito" o arrivo del ramo false
        drawArrowFromLeft(node, forme[falseIndex], "F", i, falseIndex); // "F" è l'etichetta del ramo
      }else{
        turnY_false = null;
      }
      // 4.a.1) Se entrambi i rami convergono allo stesso nodo “next” (IF che si comporta linearmente o join immediato)
      if (trueIndex === falseIndex && !isNaN(trueIndex)) {
        // Decido la Y di partenza per il segmento di join:
        let startY; //
        if (turnY_true !== null) {
            startY = turnY_true;
        } else if (turnY_false !== null) {
            startY = turnY_false;
        } else {
            startY = yMid + nodeHeight / 2;
        }
        const startX = node.relX * w; // X di partenza del segmento di join (centro dell'IF)
        const targetNodeVisual = forme[trueIndex]; // Nodo visuale di destinazione del join
        const targetX = targetNodeVisual.relX * w; // X del nodo di destinazione
        const targetY = targetNodeVisual.relY * h - targetNodeVisual.height / 2; // Y del bordo superiore del nodo di destinazione

        // Spezzone verticale “join” cliccabile → etichetta ‘if_join’
        drawLine(
          startX, // Da X del nodo IF
          startY, // Dalla Y calcolata sotto l'IF
          startX, // A X del nodo IF (linea verticale)
          targetY, // Fino al bordo superiore del nodo target
          true, 
          i, 
          trueIndex, // Indice del nodo target (arrivo)
          'if_join'
        );
        // Spezzone orizzontale “join” cliccabile → etichetta ‘if_join’
        drawLine(
          startX, // Da X del nodo IF (fine del segmento verticale)
          targetY,  // Dalla Y del bordo superiore del nodo target
          targetX, // A X del nodo target (linea orizzontale)
          targetY,  // Alla Y del bordo superiore del nodo target
          true, 
          i, 
          trueIndex, 
          'if_join' 
        );
      }
    }
    // 4.b) Collegamento “normale” (next è una stringa che indica l'indice del prossimo nodo)
    else if (typeof logicNode.next === "string" && logicNode.next !== null) {
      const nextIndex = parseInt(logicNode.next, 10); // Indice del prossimo nodo
      if (isNaN(nextIndex) || !forme[nextIndex]) continue; // Salta se l'indice non è valido o il nodo visuale non esiste

      const targetNodeVisual = forme[nextIndex]; // Nodo visuale di destinazione

      // Se il nodo di destinazione è un punto di join (ha 2 o più ingressi), usa drawJoinConnectionFromLast
      if (joinSet.has(nextIndex)) {
        drawJoinConnectionFromLast(node, targetNodeVisual, i, nextIndex);
      } else {
        // Altrimenti disegna una singola freccia verticale diretta
        drawLine(
          xMid, // Dal centro X del nodo di partenza
          yMid + nodeHeight / 2, // Dal bordo inferiore del nodo di partenza
          targetNodeVisual.relX * w, // Al centro X del nodo di destinazione
          targetNodeVisual.relY * h - targetNodeVisual.height / 2, // Al bordo superiore del nodo di destinazione
          true, 
          i, 
          nextIndex,
          'normal' 
        );
      }
    }
  }
}

// Disegna il collegamento a forma di Lda:
//   l’ultimo nodo di un ramo IF (lastNode)
//   al bordo superiore del nodo esterno a cui si ricongiunge (joinNode)
//   1) una linea verticale dal centro del bordo inferiore di lastNode fino 
//      alla coordinata Y del bordo superiore di joinNode,
//   2) una linea orizzontale da (startX, targetY) a (targetX, targetY).
function drawJoinConnectionFromLast(lastNode, joinNode, fromNodeIndex, toNodeIndex) {
  // 1) Calcolo coordinate del fondo di lastNode (punto di partenza della connessione)
  const startX = lastNode.relX * w; // X del centro di lastNode
  const startY = lastNode.relY * h + lastNode.height / 2; // Y del bordo inferiore di lastNode

  // 2) Calcolo coordinate del bordo superiore di joinNode (punto Y di destinazione)
  const targetX = joinNode.relX * w; // X del centro di joinNode
  const targetY = joinNode.relY * h - joinNode.height / 2; // Y del bordo superiore di joinNode

  // 3) Traccio il primo spezzone verticale (da startY fino a targetY, mantenendo startX)
  drawLine(
    startX, 
    startY, 
    startX, 
    targetY,
    true,            
    fromNodeIndex, 
    toNodeIndex, 
    'normal' 
  );

  // 4) Traccio il secondo spezzone orizzontale (da startX a targetX, mantenendo targetY)
  drawLine(
    startX, 
    targetY, 
    targetX, 
    targetY,
    false,         
    fromNodeIndex, 
    toNodeIndex, 
    'normal' // Tipo di freccia
  );
}

// Disegna il collegamento “da IF al prossimo nodo esterno” come:
//   1) Spezzone verticale cliccabile (dal centro-inferiore di if fino a un punto di join Y)
//   2) Spezzone orizzontale cliccabile (dal punto di join X,Y fino all’X di next sul medesimo Y)
//   3) Spezzone verticale (dal punto di join X,Y fino al bordo superiore di next)
function drawJoinConnection(fromNode, toNode, fromIndex, toIndex) {
  const fromX = fromNode.relX * w; // X del nodo di partenza
  const fromY = fromNode.relY * h + fromNode.height / 2; // Y del bordo inferiore del nodo di partenza
  const toX = toNode.relX * w; // X del nodo di arrivo
  const toY = toNode.relY * h - toNode.height / 2; // Y del bordo superiore del nodo di arrivo
  
  // Calcola una coordinata Y intermedia per il segmento orizzontale del "ponte"
  const joinY = Math.max(fromY, toY) + 80; // 80px sotto il più basso tra fromY e toY (o sopra se toY è molto in alto)
  
  // Linea verticale dal nodo 'from' al punto di joinY (non salvata come cliccabile individualmente)
  drawLine(fromX, fromY, fromX, joinY, false);
  
  // Linea orizzontale di join (salvata come cliccabile, rappresenta il "ponte")
  drawLine(fromX, joinY, toX, joinY, true, fromIndex, toIndex, 'join'); // 'join' come tipo
  
  // Linea verticale dal punto di joinY al nodo 'to' (non salvata come cliccabile individualmente)
  drawLine(toX, joinY, toX, toY, false);
}

// Trova l'indice del nodo IF genitore più vicino, risalendo la catena dei nodi.
function findParentIf(nodeIndex) {
  let currentIndex = nodeIndex; // Inizia dal nodo corrente
  while (currentIndex >= 0) { // Scorre all'indietro finché l'indice è valido
    if (flow.nodes[currentIndex]?.type === "if") { // Se il nodo corrente è di tipo "if"
      return currentIndex; // Restituisce l'indice dell'IF trovato
    }
    currentIndex--; // Passa al nodo precedente
  }
  return -1; // Nessun IF genitore trovato
}

// Disegna un rettangolo con angoli arrotondati (START E END)
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

// Disegna un rettangolo (in,out,assing)
function drawParallelogram(x, y, width, height, skew) {
  ctx.beginPath();
  ctx.rect(x, y, width, height); // Disegna un semplice rettangolo
  ctx.closePath();
}

// Disegna un rombo centrato rispetto al rettangolo(if)
function drawDiamond(x, y, w, h) {
  const cx = x + w/2; // Centro X del rombo
  const cy = y + h/2; // Centro Y del rombo
  ctx.beginPath();
  ctx.moveTo(cx, y);      // Vertice superiore
  ctx.lineTo(x + w, cy);  // Vertice destro
  ctx.lineTo(cx, y + h);  // Vertice inferiore
  ctx.lineTo(x, cy);      // Vertice sinistro
  ctx.closePath();
}

// Disegna la freccia per il ramo TRUE di un nodo IF (esce dal lato destro del nodo IF).
function drawArrowFromRight(from, to, label, fromNodeIndex, toNodeIndex) {
  const verticalGapBeforeNode = 25; // Spazio verticale in px prima di entrare nel nodo target
  const startX_abs = from.relX * w + from.width / 2; // X del bordo destro del nodo 
  const startY_abs = from.relY * h; // Y del centro del nodo 'from' (IF)
  const elbowColumnX_abs = startX_abs + 40; // X della colonna verticale del "gomito" (40px a destra di 'from')
  const targetX = to.relX * w; // X del centro del nodo 'to' (target del ramo true)
  const targetY = to.relY * h - to.height / 2; // Y del bordo superiore del nodo 'to'
  const turnY = targetY - verticalGapBeforeNode; // Y del segmento orizzontale del "gomito"

  // 1) Segmento orizzontale in uscita dal nodo IF (puramente visivo, non cliccabile individualmente)
  drawLine(
    startX_abs, startY_abs, 
    elbowColumnX_abs, startY_abs, 
    false, fromNodeIndex, toNodeIndex, 'if_true_h_out' 
  );

  // 2) Caso “nodi allineati verticalmente sotto il gomito” → discesa verticale diretta dal gomito al nodo 'to'
  if (Math.abs(elbowColumnX_abs - targetX) < 0.5) { // Se la X del gomito e del target sono (quasi) uguali
    drawLine(
      elbowColumnX_abs, startY_abs, 
      elbowColumnX_abs, targetY,   
      true, fromNodeIndex, toNodeIndex, 'if_true' 
    );
    // Etichetta “T” (True) a metà del segmento verticale
    const midY_for_label = (startY_abs + targetY) / 2; 
    ctx.fillStyle = "black";
    ctx.font       = "12px Arial";
    ctx.textAlign  = "center";
    ctx.fillText(label, elbowColumnX_abs + 20, midY_for_label);
    return targetY; 
  }

  // 3) Caso “nodi non allineati verticalmente” → disegnare un gomito interno (V1 + H + V2)
  drawLine(
    elbowColumnX_abs, startY_abs, 
    elbowColumnX_abs, turnY,      
    true, fromNodeIndex, toNodeIndex, 'if_true' 
  );
  //   3.b) H: Segmento orizzontale visivo da X del gomito a X del target, alla quota 'turnY'
  drawLine(
    elbowColumnX_abs, turnY,
    targetX, turnY,          
    false, fromNodeIndex, toNodeIndex, 'if_true_h_in' 
  );
  //   3.c) V2: Segmento verticale visivo finale da 'turnY' fino al bordo superiore di 'to'
  drawLine(
    targetX, turnY,   
    targetX, targetY, 
    false, fromNodeIndex, toNodeIndex, 'if_true_v_to_target' 
  );
  // Etichetta “T” (True) a metà del primo segmento verticale (V1)
  const midY_for_label = (startY_abs + turnY) / 2;
  ctx.fillStyle = "black";
  ctx.font       = "12px Arial";
  ctx.textAlign  = "center";
  ctx.fillText(label, elbowColumnX_abs + 20, midY_for_label); 
  return turnY; 
}

// Disegna il “ramo false” di un IF fino al nodo di destinazione.
function drawArrowFromLeft(from, to, label, fromNodeIndex, toNodeIndex) {
  const verticalGapBeforeNode = 25; // Spazio verticale in px
  const startX_abs       = from.relX * w - from.width / 2; // X del bordo sinistro di 'from'
  const startY_abs       = from.relY * h; // Y del centro di 'from'
  const elbowColumnX_abs = startX_abs - 40; // X della colonna del gomito (40px a sinistra di 'from')
  const targetX          = to.relX * w; // X del centro di 'to'
  const targetY          = to.relY * h - to.height / 2; // Y del bordo superiore di 'to'
  const turnY            = targetY - verticalGapBeforeNode; // Y del segmento orizzontale del gomito

  // 1) Segmento orizzontale in uscita da 'from' (visivo)
  drawLine(
    startX_abs, startY_abs,
    elbowColumnX_abs, startY_abs,
    false, fromNodeIndex, toNodeIndex, 'if_false_h_out'
  );

  // 2) Caso “nodi allineati X” → discesa verticale diretta
  if (Math.abs(elbowColumnX_abs - targetX) < 0.5) {
    // Segmento verticale cliccabile
    drawLine(
      elbowColumnX_abs, startY_abs,
      elbowColumnX_abs, targetY,
      true, fromNodeIndex, toNodeIndex, 'if_false'
    );
    // Etichetta “F” (False)
    const midY_for_label = (startY_abs + targetY) / 2;
    ctx.fillStyle = "red"; // Colore distintivo per il ramo False
    ctx.font       = "12px Arial";
    ctx.textAlign  = "center";
    ctx.fillText(label, elbowColumnX_abs - 20, midY_for_label); // 20px a sinistra del gomito
    return targetY; // Ritorna Y di arrivo
  }

  // 3) Caso “nodi non allineati X” → gomito interno (V1 + H + V2)
  drawLine(
    elbowColumnX_abs, startY_abs,
    elbowColumnX_abs, turnY,
    true, fromNodeIndex, toNodeIndex, 'if_false'
  );   
  drawLine(
    elbowColumnX_abs, turnY,
    targetX, turnY,
    false, fromNodeIndex, toNodeIndex, 'if_false_h_in'
  );
  drawLine(
    targetX, turnY,
    targetX, targetY,
    false, fromNodeIndex, toNodeIndex, 'if_false_v_to_target'
  );
  // Etichetta “F” (False)
  const midY_for_label = (startY_abs + turnY) / 2;
  ctx.fillStyle = "red";
  ctx.font       = "12px Arial";
  ctx.textAlign  = "center";
  ctx.fillText(label, elbowColumnX_abs - 20, midY_for_label);
  return turnY; // Ritorna Y del gomito
}

// Inserisce un nuovo nodo logico e visuale nel flowchart quando l'utente clicca su una freccia.
// Il 'tipo' specifica il tipo di nodo da inserire (es. "input", "print", "if").
// La funzione gestisce l'aggiornamento degli indici e dei puntatori 'next' dei nodi esistenti,
// e calcola la posizione del nuovo nodo visuale.
function inserisciNodo(tipo) {
  saved = false; 
  if (frecceSelected === -1 || !frecce[frecceSelected]) { 
    console.error("inserisciNodo ERRORE: Nessuna freccia selezionata o freccia non valida.");
    chiudiPopup();
    return;
  }

  const clickedArrow = frecce[frecceSelected]; 
  const arrowType = clickedArrow.type; 
  const parentNodeIndex = clickedArrow.fromNodeIndex; //nodo da cui parte la freccia
  const originalTargetNodeIndex = clickedArrow.toNodeIndex; // nodo a cui la freccia puntava originariamente
  // L'indice a cui verrà inserito il nuovo nodo logico. Solitamente coincide con originalTargetNodeIndex, il target originale (e successivi) slittano.
  const newActualNodeIndex = originalTargetNodeIndex;

  console.log(`inserisciNodo INFO: Tipo Nodo="${tipo}", ID Freccia=${clickedArrow.id}, Tipo Freccia="${arrowType}"`);
  console.log(`  parentNodeIndex=${parentNodeIndex}, originalTargetNodeIndex=${originalTargetNodeIndex}`);

  // Blocca inserimenti circolari o problematici all'interno dello stesso ramo IF
  if (
    parentNodeIndex === originalTargetNodeIndex &&
    (arrowType === 'if_true' || arrowType === 'if_false' || arrowType === 'if_join')
  ) {
    console.error("inserisciNodo ERRORE: Tentativo di inserimento circolare in IF.");
    chiudiPopup();
    frecceSelected = -1; // Deseleziona la freccia
    return;
  }

  // 1) Creazione del nuovo nodo logico
  let newNodeLogic; // Oggetto per il nuovo nodo logico
  const nextForNew = (newActualNodeIndex + 1).toString(); // Il nuovo nodo punterà al nodo che era originariamente in newActualNodeIndex+1 (ora slittato)
  if (tipo === "if") { // Se il nuovo nodo è un IF
    newNodeLogic = {
      type: "if",
      info: "",
      next: { true: nextForNew, false: nextForNew } 
    };
  } else { // Per tutti gli altri tipi di nodo
    newNodeLogic = { type: tipo, info: "", next: nextForNew };
  }

  // 2) Inserimento del nuovo nodo logico in flow.nodes e aggiornamento degli indici 'next' dei nodi successivi
  flow.nodes.splice(newActualNodeIndex, 0, newNodeLogic); 
  console.log(`inserisciNodo INFO: Inserito nodo logico "${tipo}" in indice ${newActualNodeIndex}. Ora flow.nodes.length=${flow.nodes.length}`);

  // Aggiorna tutti i puntatori 'next' che puntavano a un indice >= newActualNodeIndex, incrementandoli di 1
  for (let i = 0; i < flow.nodes.length; i++) {
    const n = flow.nodes[i]; // Nodo corrente in analisi
    if (n === newNodeLogic) continue; // Salta il nodo appena inserito

    if (n.type === "if" && typeof n.next === "object" && n.next !== null) { // Se il nodo 'n' è un IF
      // Ramo true
      if (typeof n.next.true === "string") {
        const oldT = parseInt(n.next.true, 10); 
        if (!isNaN(oldT) && oldT >= newActualNodeIndex) {
          n.next.true = (oldT + 1).toString();
        }
      }
      // Ramo false
      if (typeof n.next.false === "string") {
        const oldF = parseInt(n.next.false, 10); // Vecchio indice del ramo false
        if (!isNaN(oldF) && oldF >= newActualNodeIndex) {
          n.next.false = (oldF + 1).toString(); // Incrementa
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

  // 3) Aggiornamento del puntatore 'next' del nodo genitore (parentNodeIndex) per puntare al nuovo nodo inserito (newActualNodeIndex)
  const parentLogic = flow.nodes[parentNodeIndex]; // Nodo logico genitore
  if (parentLogic && parentLogic.type === "if") { // Se il genitore è un IF
    const newTargetStr = newActualNodeIndex.toString(); // Indice del nuovo nodo come stringa

    // A seconda del tipo di freccia cliccata, si aggiorna il ramo corretto dell'IF genitore
    if (arrowType === "if_join") { 
      parentLogic.next.true  = newTargetStr;
      parentLogic.next.false = newTargetStr;
      console.log(`inserisciNodo INFO: JOIN sotto IF → next.true e next.false = ${newTargetStr}`);
    }
    else if (arrowType === "if_true") { // Inserimento nel ramo true
      parentLogic.next.true = newTargetStr;
      console.log(`inserisciNodo INFO: Inserimento in ramo TRUE → next.true = ${newTargetStr}`);
    }
    else if (arrowType === "if_false") { // Inserimento nel ramo false
      parentLogic.next.false = newTargetStr;
      console.log(`inserisciNodo INFO: Inserimento in ramo FALSE → next.false = ${newTargetStr}`);
    }
    else { // Caso di freccia 'normal' che parte da un IF (raro) o segmenti intermedi ('if_*_h_in', etc.)
           // In questi casi, non si modificano i next.true/false diretti dell'IF genitore,
           // perché l'inserimento avviene "dopo" un ramo già definito.
      console.log(`inserisciNodo INFO: Freccia '${arrowType}' da IF → non modifico next.true/false di IF genitore ${parentNodeIndex}. Il next del nodo precedente al nuovo nodo (${newActualNodeIndex-1} se esiste) dovrebbe puntare a ${newActualNodeIndex}.`);
      // Potrebbe essere necessario un aggiustamento più fine qui se l'inserimento avviene
      // su segmenti di freccia che non sono il primo segmento in uscita da un IF.
      // L'attuale logica di aggiornamento dei next al punto 2) dovrebbe già gestire
      // il fatto che il nodo *prima* di newActualNodeIndex (se non è parentNodeIndex stesso)
      // ora punti a newActualNodeIndex+1, e deve essere corretto a newActualNodeIndex.
      // Questa parte è complessa; la logica attuale del parentLogic.next = ... è più robusta.
      // La correzione del next del nodo *immediatamente precedente* al newActualNodeIndex è cruciale.
      // Se parentNodeIndex è l'immediato predecessore, il suo next viene aggiornato.
      // Se c'è un altro nodo tra parentNodeIndex e il punto di inserzione logica,
      // il suo 'next' viene gestito dal ciclo al punto 2, ma bisogna assicurare che punti
      // al nuovo nodo inserito, non a quello slittato.
      // L'aggiornamento del next del nodo *effettivamente* precedente al nuovo nodo inserito:
      if (flow.nodes[newActualNodeIndex-1] && flow.nodes[newActualNodeIndex-1] !== parentLogic ) {
         // Questo scenario è complesso. Se la freccia cliccata non parte direttamente
         // dal parentNodeIndex che definisce il ramo (es. clic su un segmento orizzontale
         // di un gomito), allora il 'fromNodeIndex' della freccia potrebbe essere diverso
         // dal nodo IF che ha originato quel ramo.
         // La logica principale di aggiornamento del 'next' del *nodo che deve puntare al nuovo nodo*
         // è quella che modifica parentLogic.next o n.next.
         // Se parentNodeIndex è il nodo logico che deve puntare al nuovo nodo, allora la sua proprietà .next (o .next.true/.next.false)
         // deve essere newActualNodeIndex.toString().
         // Il ciclo al punto 2) si occupa di far slittare i puntatori dei nodi *successivi*.
         // Il puntatore del nodo *precedente* al nuovo nodo (che è flow.nodes[parentNodeIndex])
         // DEVE essere aggiornato per puntare a newActualNodeIndex.

         // Se arrowType non è if_join, if_true, if_false, significa che l'inserimento è su un
         // collegamento 'normal' o su un segmento secondario di un IF.
         // In questo caso, è il nodo logico all'indice `parentNodeIndex` (quello da cui parte la freccia cliccata)
         // che deve avere il suo `next` (o `next.true`/`next.false` se `parentNodeIndex` è un IF e
         // `arrowType` identifica un ramo specifico) aggiornato a `newActualNodeIndex`.
         // Questo viene già fatto sotto.
    }
  }
  // Se il genitore non è un IF (inserimento "normale" dopo un nodo qualsiasi)
  }else if (parentLogic) {
    parentLogic.next = newActualNodeIndex.toString(); // Il genitore punta al nuovo nodo
    console.log(`inserisciNodo INFO: Genitore non-IF → next = ${newActualNodeIndex}`);
  }


  // 4) Calcolo della posizione X relativa (relX) del nuovo nodo visuale
  const parentVis = nodi[parentNodeIndex]; // Nodo visuale genitore
  let newRelX; // Posizione X relativa del nuovo nodo
  const elbowOffset = 40; // Offset in pixel per i "gomiti" delle frecce IF

  if (parentLogic && parentLogic.type === "if") { // Se il genitore è un IF
    if (arrowType === "if_join" && parentVis) { // Inserimento su un join sotto l'IF
      newRelX = parentVis.relX; // Allinea con l'IF genitore
    }
    else if (arrowType === "if_true" && parentVis) { // Inserimento nel ramo true
      const prX = parentVis.relX * w + parentVis.width / 2; // Bordo destro del genitore
      newRelX = (prX + elbowOffset) / w; // Posiziona a destra, considerando il gomito
    }
    else if (arrowType === "if_false" && parentVis) { // Inserimento nel ramo false
      const plX = parentVis.relX * w - parentVis.width / 2; // Bordo sinistro del genitore
      newRelX = (plX - elbowOffset) / w; // Posiziona a sinistra, considerando il gomito
    }
    else { // Inserimento su un collegamento che non è un ramo diretto (es. esterno o segmento mancante)
      newRelX = parentVis ? parentVis.relX : 0.5; // Allinea al centro dell'IF o default a 0.5 se genitore visuale non trovato
    }
  }
  else if (parentVis && arrowType === "normal") { // Inserimento normale dopo un nodo non-IF
    newRelX = parentVis.relX; // Allinea con il genitore
  }
  else { // Caso di fallback o se non c'è un genitore visuale chiaro (es. inserimento dopo lo start iniziale in una lista vuota)
    newRelX = 0.5; // Posizione di default al centro
  }

  // Clamp (limita) newRelX per evitare che il nodo esca dai margini laterali del canvas
  const nodeWidth = 100; // Larghezza di default del nuovo nodo
  const minRX = (nodeWidth / 2) / w + 0.01; // Minima relX consentita
  const maxRX = 1 - ((nodeWidth / 2) / w) - 0.01; // Massima relX consentita
  if (newRelX < minRX) newRelX = minRX;
  if (newRelX > maxRX) newRelX = maxRX;

  console.log(`inserisciNodo INFO: newRelX = ${newRelX.toFixed(3)}`);

  // 5) Inserimento del nuovo nodo visuale nell'array 'nodi' e ridisegno del flowchart
  nodi.splice(newActualNodeIndex, 0, { // Inserisce il nuovo oggetto nodo visuale
    relX: newRelX, // Posizione X relativa calcolata
    relY: 0, // La relY verrà calcolata da calcoloY()
    width: nodeWidth, // Larghezza standard
    height: NODE_BASE_HEIGHT_PX, // Altezza standard
    color: "white", // Colore di default
    text: tipo.charAt(0).toUpperCase() + tipo.slice(1) // Testo del nodo (es. "Input", "Print")
  });
  console.log(`inserisciNodo INFO: Nodo visivo inserito in indice ${newActualNodeIndex}.`);

  calcoloY(nodi); // Ricalcola le posizioni Y di tutti i nodi
  draw(nodi);     // Ridisegna l'intero flowchart

  chiudiPopup(); // Chiude il popup di selezione del tipo di nodo
  frecceSelected = -1; // Deseleziona la freccia
}

  // Gestisce il click su un nodo.
  // Se il nodo non è 'start' o 'end', apre il popup per modificarne le informazioni.
  function clickNodo(event) {
    // Calcola le coordinate del click relative al canvas
    let rect = canvas.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    // Itera sui nodi visuali per verificare se uno è stato cliccato
    for (let i = 0; i < nodi.length; i++) {
      const node = nodi[i]; // Nodo visuale corrente
      const x0 = node.relX * w - node.width / 2;
      const y0 = node.relY * h - node.height / 2;
      const x1 = x0 + node.width;
      const y1 = y0 + node.height;

      // Controlla se il click è all'interno del nodo
      if (clickX >= x0 && clickX <= x1 && clickY >= y0 && clickY <= y1) {
        console.log("Hai cliccato il nodo", i);
        // Apre il popup di modifica solo per nodi che non siano 'start' o 'end'
        if (flow.nodes[i].type != "start" && flow.nodes[i].type != "end") {
          document.getElementById("edit-node-popup").classList.add("active");
          document.getElementById("overlay").classList.add("active"); 
          document.getElementById("edit-node-title").innerHTML = "Edit " + flow.nodes[i].type +" node"; 
          document.getElementById("edit-node-input").value = flow.nodes[i].info || ""; 
        }
        nodoSelected = i;
        return;
      }
    }
  }

  // Salva le informazioni inserite nel popup di modifica del nodo
  function salvaInfo() {
    if (nodoSelected !== -1 && flow.nodes[nodoSelected]) { // Assicura che un nodo sia selezionato
        flow.nodes[nodoSelected].info = document.getElementById("edit-node-input").value; 
    }
    chiudiEditPopup(); // Chiude il popup di modifica
    draw(nodi); // Ridisegna il flowchart
  }

  // Verifica se un punto (clickX, clickY) è "vicino" a un segmento di linea (x1,y1)-(x2,y2).
  function isPointNearLine(clickX, clickY, x1, y1, x2, y2, distanza) {
    let f = false; // Flag: true se il punto è vicino alla linea
    if (clickX <= x1 + distanza && clickX >= x1 - distanza) { // Controllo sulla coordinata X
      if ((clickY >= y1 && clickY <= y2) || (clickY >= y2 && clickY <= y1)) { // Controllo sulla coordinata Y (tra gli estremi del segmento)
        f = true;
      }
    }
    return f;
  }

  // Controlla se una stringa è un nome di variabile valido (inizia con lettera, seguita da lettere o numeri).
  function lettereENumeri(str) {
    return /^[a-zA-Z][a-zA-Z0-9]*$/.test(str); 
  }

  // Gestisce l'aggiunta o la modifica di una variabile nella tabella HTML delle variabili.
  // Viene attivata quando l'utente modifica i campi di input/select in una riga della tabella.
  function aggiungiVaribile(event) {
    let target = event.target; // Elemento che ha scatenato l'evento (input o select)
    while (target && target.tagName !== "TR") target = target.parentElement; 
    if (!target) return; // Esce se non trova la riga

    let isUltimaRiga = (target.rowIndex === tabVariabili.rows.length - 1);
    let val1 = target.cells[0].querySelector("input").value.trim(); 
    let tipo = target.cells[1].querySelector("select").value;    
    let val3 = target.cells[2].querySelector("input").value.trim(); 

    // Rimuove eventuali messaggi di errore visualizzati precedentemente per questa riga
    let oldError = target.nextSibling; // Possibile riga di errore sottostante
    if (oldError && oldError.classList && oldError.classList.contains("error-message-row")) {
      oldError.remove();
    }

    // Se non è l'ultima riga e i campi nome e valore sono entrambi vuoti, interpreta come eliminazione della variabile.
    if (!isUltimaRiga && val1 === "" && val3 === "") {
      flow.variables.splice(target.rowIndex - 1, 1); // Rimuove la variabile dall'array logico (-1 perché l'indice della riga include l'header)
      tabVariabili.deleteRow(target.rowIndex); // Rimuove la riga dalla tabella HTML
      return;
    }

    // Se nome o valore sono vuoti (e non è un'eliminazione), non fa nulla, attende input completo.
    if (val1 === "" || val3 === "") return;

    let fValid = false;
    let valoreConvertito; 
    let errMsg = ""; 
    if (lettereENumeri(val1)) { 
      switch (tipo) { 
        case "int":
          if (/^-?\d+$/.test(val3)) { fValid = true; valoreConvertito = parseInt(val3); } // Valido intero
          else { errMsg = "Il valore deve essere un intero valido."; }
          break;
        case "float":
          if (/^-?\d*\.\d+$/.test(val3) || /^-?\d+\.?\d*$/.test(val3)) { fValid = true; valoreConvertito = parseFloat(val3); } // Valido float
          else { errMsg = "Il valore deve essere un numero decimale valido."; }
          break;
        case "string":
          fValid = true; valoreConvertito = val3; // Le stringhe sono sempre valide (se non vuote, gestito sopra)
          break;
      }
    } else {
      errMsg = "Nome variabile non valido (deve iniziare con una lettera e contenere solo lettere e numeri).";
    }

    // Se i dati sono validi, aggiorna o aggiunge la variabile logica e gestisce la tabella.
    if (fValid) {
      if (!isUltimaRiga) { // Modifica di una variabile esistente
        flow.variables[target.rowIndex - 1] = { name: val1, type: tipo, value: valoreConvertito };
      } else { // Aggiunta di una nuova variabile (era l'ultima riga, quella vuota)
        if (target.getAttribute("data-inserito") === "1") return; 
        target.setAttribute("data-inserito", "1"); // Marca temporaneamente come inserito
        flow.variables.push({ name: val1, type: tipo, value: valoreConvertito }); // Aggiunge all'array logico
        inserisciRiga(); // Aggiunge una nuova riga vuota in fondo alla tabella per il prossimo input
        // Associa l'handler eventi alla nuova ultima riga (quella appena aggiunta)
        tabVariabili.rows[tabVariabili.rows.length - 1].addEventListener("change", aggiungiVaribile);
        target.removeAttribute("data-inserito"); // Rimuove il marcatore
      }

    } else {
      let errorRow = tabVariabili.insertRow(target.rowIndex + 1); // Inserisce una nuova riga per l'errore
      errorRow.classList.add("error-message-row"); // Classe per lo stile
      let errorCell = errorRow.insertCell(); // Cella che occupa tutta la larghezza
      errorCell.colSpan = 3; // Occupa 3 colonne
      errorCell.className = "error-message"; // Classe per lo stile del messaggio
      errorCell.textContent = "Dati non validi. " + errMsg; // Testo dell'errore
      // Rimuove il messaggio di errore al prossimo input nella riga problematica
      target.addEventListener("input", () => { if (errorRow.parentNode) errorRow.remove(); }, { once: true });
    }
  }

  // Inserisce una nuova riga vuota (con campi input e select) nella tabella delle variabili HTML.
  function inserisciRiga() {
    let nuovaRiga = tabVariabili.insertRow(); // Crea un nuovo elemento TR
    let cell1 = nuovaRiga.insertCell(); // Cella per il nome
    let cell2 = nuovaRiga.insertCell(); // Cella per il tipo
    let cell3 = nuovaRiga.insertCell(); // Cella per il valore

    // Input per il nome della variabile
    let inputNome = document.createElement("input");
    inputNome.type = "text"; inputNome.classList.add("inputVariable");
    cell1.appendChild(inputNome);

    // Select per il tipo di variabile
    let selectTipo = document.createElement("select");
    selectTipo.classList.add("inputVariable");
    ["int", "float", "string"].forEach(val => {
      let option = document.createElement("option");
      option.value = val; option.textContent = val.charAt(0).toUpperCase() + val.slice(1);
      if(val=="int"){ // Personalizzazione testo per "Integer"
        option.textContent = "Integer"
      }
      selectTipo.appendChild(option);
    });
    cell2.appendChild(selectTipo);

    // Input per il valore della variabile
    let inputValore = document.createElement("input");
    inputValore.type = "text"; inputValore.classList.add("inputVariable");
    cell3.appendChild(inputValore);
  }

  window.onload = function () {
    saved=true; // Inizialmente, si considera il flowchart "salvato" (nessuna modifica)
    window.addEventListener("resize", resizeCanvas); // Listener per ridimensionare il canvas

    // Creazione dei nodi visuali iniziali (Start e End)
    nodi.push({ relX: 0.35, relY: 0.05, width: 100, height: 40, color: "white", text: "Start" });
    nodi.push({ relX: 0.35, relY: 0.4, width: 100, height: 40, color: "white", text: "End" });
    calcoloY(nodi); // Calcola le posizioni Y corrette per i nodi
    draw(nodi);     // Disegna il flowchart iniziale

    canvas.addEventListener("click", checkClick); // Listener per click su nodi/frecce sul canvas

    // Imposta il listener per la prima riga dati (se esiste) della tabella variabili
    if (tabVariabili.rows[1]) { // La riga 0 è l'header
      tabVariabili.rows[1].addEventListener("change", aggiungiVaribile);
      tabVariabili.rows[1].cells[0].querySelector("input").value = "";
      tabVariabili.rows[1].cells[2].querySelector("input").value = "";
    }
  }

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
   * * @param {number} currentNodeIndex          – Indice nell’array flow.nodes / nodiVisualArray
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



  // Nasconde il popup utilizzato per modificare le informazioni di un nodo esistente.
  function chiudiEditPopup() {
    document.getElementById("edit-node-popup").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
  }

   // Apre il popup per il salvataggio del file del flowchart.
   function saveFile(){
    document.getElementById("save-popup").classList ="active"; // Mostra il popup di salvataggio
    document.getElementById('overlay').classList = 'active'; // Attiva l'overlay
  }

  // Listener per l'evento 'change' sull'input di tipo file (per caricare un flowchart).
  document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0]; // File selezionato dall'utente
  if (file) {
    const reader = new FileReader(); // Oggetto per leggere il contenuto del file
    reader.onload = (e) => { // Callback eseguita al termine della lettura del file
      const content = e.target.result; // Contenuto testuale del file (JSON atteso)
      console.log("Contenuto file:", content);
      try {
        const json = JSON.parse(content); // Parsing del contenuto JSON
        flow = json; // Aggiorna la struttura logica 'flow' con quella caricata

        // Ricostruisce l'array dei nodi visuali 'nodi' basandosi su flow.nodes
        nodi = []; // Resetta l'array dei nodi visuali
        for (let i = 0; i < flow.nodes.length; i++) {
          let tipo = flow.nodes[i].type; // Tipo del nodo
          nodi.push({ // Aggiunge un nuovo oggetto nodo visuale
            relX: 0.35, // Posizione X relativa di default (verrà ricalcolata)
            relY: 0.05 + i * 0.1, // Posizione Y relativa di default (verrà ricalcolata)
            width: 100, // Larghezza standard
            height: NODE_BASE_HEIGHT_PX, // Altezza standard
            color: "white", // Colore di default
            text: tipo.charAt(0).toUpperCase() + tipo.slice(1) // Testo (es. "Start", "If")
          });
        }

        // Ricostruisce la tabella delle variabili HTML
        while (tabVariabili.rows.length > 1) { // Rimuove tutte le righe tranne l'header
          tabVariabili.deleteRow(1);
        }
        for (let i = 0; i < flow.variables.length; i++) { // Per ogni variabile nel flow caricato
          inserisciRiga(); // Aggiunge una nuova riga alla tabella
          let riga = tabVariabili.rows[i + 1]; // Riga appena inserita
          let varObj = flow.variables[i]; // Oggetto variabile corrente
          // Popola i campi della riga con i dati della variabile
          let cella1 = riga.cells[0].querySelector("input"); // Input nome
          let cella2 = riga.cells[1].querySelector("select"); // Select tipo
          let cella3 = riga.cells[2].querySelector("input"); // Input valore
          if (cella1) cella1.value = varObj.name;
          if (cella2) cella2.value = varObj.type;
          if (cella3) cella3.value = varObj.value;
          riga.addEventListener("change", aggiungiVaribile); // Aggiunge listener per modifiche
        }
        // Assicura che ci sia sempre una riga vuota alla fine per un nuovo input
        if (tabVariabili.rows.length === flow.variables.length + 1 || flow.variables.length === 0) {
            if (flow.variables.length > 0 || tabVariabili.rows.length === 1) { // Se ci sono variabili o la tabella è vuota (solo header)
                 inserisciRiga(); // Aggiunge la riga vuota
            }
            // L'ultima riga (quella per nuovo input) deve avere il listener
            let ultimaRiga = tabVariabili.rows[tabVariabili.rows.length - 1];
            if (ultimaRiga) ultimaRiga.addEventListener("change", aggiungiVaribile);
        }


        calcoloY(nodi); // Ricalcola le posizioni Y
        draw(nodi);     // Ridisegna il flowchart
        saved = true;   // Considera il flowchart caricato come "salvato"
      } catch (err) {
        alert("Errore nel parsing del file JSON: " + err.message); // Gestione errore parsing
      }
    };
    reader.readAsText(file); // Avvia la lettura del file come testo
  }
});

 // Listener per la scorciatoia da tastiera Ctrl+R (o Cmd+R su Mac).
 // Previene il ricaricamento della pagina se ci sono modifiche non salvate, chiedendo conferma.
 window.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') { // Se premuto Ctrl/Cmd + R
      if(!isEmpty() && !saved){ // Se il flowchart non è vuoto e ci sono modifiche non salvate
        event.preventDefault(); // Impedisce il ricaricamento di default
        if (confirm("There are unsaved changes. Do you really want to reload the page?")) { // Chiede conferma
          location.reload(); // Ricarica la pagina se confermato
        }
      }
      // Altrimenti (se salvato o vuoto), permette il ricaricamento di default
    }
  });

// Verifica se il flowchart è "vuoto" (contiene solo i nodi Start e End di default).
function isEmpty(){
    if(flow.nodes.length==2){ // Se ci sono solo 2 nodi (tipicamente Start e End)
      return true;
    }else{
      return false;
    }
  }

  // Chiude il popup di salvataggio.
  function closeSavePopup(){
   document.getElementById("save-popup").classList.remove('active');
   document.getElementById("overlay").classList.remove('active');
  }

  // Elimina il nodo attualmente selezionato (nodoSelected) dal flowchart.
  // Aggiorna gli indici 'next' dei nodi rimanenti e ridisegna.
  function deleteNode(){
    if (nodoSelected === -1 || nodoSelected >= flow.nodes.length) return; // Nessun nodo selezionato o indice non valido

    flow.nodes.splice(nodoSelected,1); 
    for(let i = 0; i < flow.nodes.length; i++) {
        const n = flow.nodes[i];
        if (n.type === "if" && typeof n.next === "object" && n.next !== null) {
            let trueNext = parseInt(n.next.true, 10);
            let falseNext = parseInt(n.next.false, 10);
            if (!isNaN(trueNext) && trueNext > nodoSelected) {
                n.next.true = (trueNext - 1).toString();
            }
            if (!isNaN(falseNext) && falseNext > nodoSelected) {
                n.next.false = (falseNext - 1).toString();
            }
        } else if (typeof n.next === "string" && n.next !== null) {
            let normalNext = parseInt(n.next, 10);
            if (!isNaN(normalNext) && normalNext > nodoSelected) {
                n.next = (normalNext - 1).toString();
            }
        }
    }


    nodi.splice(nodoSelected,1); // Rimuove il nodo visuale
    nodoSelected = -1; // Deseleziona
    calcoloY(nodi); // Ricalcola le Y
    draw(nodi); // Ridisegna
    chiudiEditPopup(); // Chiude l'eventuale popup di modifica
  }
  function isLastNodeOfIf(index){
    let lastIndex=[]; // Array usato per tracciare (presumibilmente) i nodi di fine ramo o IF
    for(let i=0; i<flow.nodes.length; i++){ // Scansiona tutti i nodi
        // La condizione seguente è difficile da interpretare senza contesto preciso
        // su come `lastIndex` dovrebbe funzionare.
        if(lastIndex.length > 0 && (lastIndex[lastIndex.length-1] == i || flow.nodes[lastIndex[lastIndex.length-1]] - 1 == i)){
          // Se il nodo corrente `i` corrisponde all'ultimo `lastIndex` registrato
          // O (condizione ancora più oscura) flow.nodes[indice] - 1 == i
          if(i==index){ // Se il nodo corrente è quello che stiamo cercando
            return true; // Allora è considerato "last node of if"
          }else{
            lastIndex.pop(); // Altrimenti rimuove l'ultimo elemento da lastIndex
          }
        }
        if(flow.nodes[i] && flow.nodes[i].type == "if"){ // Se il nodo corrente è un IF
          if(flow.nodes[i].next.true != flow.nodes[i].next.false){ // Se i rami dell'IF divergono
            // Aggiunge l'indice del nodo precedente al target del ramo 'false' a lastIndex.
            // Questo è un approccio specifico e potrebbe non coprire tutti i casi di "ultimo nodo di un ramo IF".
            lastIndex.push(parseInt(flow.nodes[i].next.false)-1)
          }else{ // Se i rami dell'IF convergono immediatamente (IF lineare)
            lastIndex.push(i); // Aggiunge l'indice dell'IF stesso
          }
        }
    }
    return false; // Se non trovato secondo la logica sopra
  }