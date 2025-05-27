
window.addEventListener('load', () => {
    isInTutorial=false;
})

const tour = new Shepherd.Tour({
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    scrollTo: { behavior: 'smooth', block: 'center' },
    classes: 'shadow-md bg-purple-200',
  }
});

tour.addStep({
    id: 'start',
    text: 'Welcome! This tour will guide you through creating a flowchart.',
    buttons: [
        { text: 'Next', action: tour.next }
    ]
});
tour.addStep({
    id: 'table-info',
    text: 'This table is dedicated to declaring variables. By entering information in ALL the cells of a row, you add a new variable.',
    attachTo: {
        element:  'table',
        on: 'right'
    },
    buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Next', action: tour.next }
    ]
});
tour.addStep({
    id: 'new-var',
    text: 'In the first cell you can chose the name of your variable.',
    attachTo: {
        element: '[data-tour-id="step-insert-name"]',
        on: 'bottom'
    },
    buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Next', action: tour.next }
    ]
});

tour.addStep({
    id: 'select-type',
    text: 'Here you can select the type for your variable.',
    attachTo: {
        element: '[data-tour-id="step-insert-type"]',
        on: 'bottom'
    },
    buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Next', action: tour.next }
    ]
});

tour.addStep({
    id: 'value-info',
    text: 'Here you can give set its initial value.',
    attachTo: {
        element:  '[data-tour-id="step-insert-value"]',
        on: 'right'
    },
    buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Next', action: tour.next }
    ]
});
tour.addStep({
  id: 'canvas-zone',
  text: 'This is where your blocks will appear.',
  attachTo: {
    element: '#canvas'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});

tour.addStep({
  id: 'arrows-use',
  text: 'You can click on the arrows to add new blocks.',
  when: {
    show: () => {resizeCanvas(); pulsingFreccia(0, 7000);},
    hide: () => {resizeCanvas(); pulseActive = false;}
  },
  attachTo: {
    element: '#canvas',
    on: 'center'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});

tour.addStep({
  id: 'nodes-use',
  text: 'And you can click on the blocks to edit them (Start and End are not editable).',
  when: {
    show: () => {resizeCanvas(); pulsingNodo(1, 5000);},
    hide: () => {resizeCanvas(); pulseNodoActive = false;}
  },
  attachTo: {
    element: '#canvas'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});

tour.addStep({
  id: 'navbar',
  text: 'This is the toolbar, where you can...',
  attachTo: {
    element: '#toolbar',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});
tour.addStep({
  id: 'new',
  text: 'Create a new flowchart.',
  attachTo: {
    element: '#new-btn',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});

tour.addStep({
  id: 'open',
  text: 'Open your saved flowcharts.',
  attachTo: {
    element: '#open-btn',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});
tour.addStep({
  id: 'save',
  text: 'Download your projects.',
  attachTo: {
    element: '#save-btn',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});
tour.addStep({
  id: 'run',
  text: 'Run the current flowchart.',
  attachTo: {
    element: '#run-btn',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Next', action: tour.next }
  ]
});
tour.addStep({
  id: 'export',
  text: 'And export it in Python!',
  attachTo: {
    element: '#export-python-btn',
    on: 'bottom-start'
  },
  buttons: [
    { text: 'Back', action: tour.back },
    { text: 'Done', action:() =>{ tour.next; tour.complete() }}
  ]
});

function startTutorial(){
    // Avvia tour
   
    if(!tour.isActive() ){
        tour.start();
    }
}


function evidenziaFreccia(index) {
  if (frecce.length === 0 || !frecce[index]) return;

  const freccia = frecce[index];

  ctx.beginPath();
  ctx.moveTo(freccia.inzioX, freccia.inzioY);
  ctx.lineTo(freccia.fineX, freccia.fineY);
  ctx.strokeStyle = "red";       // colore evidenziato
  ctx.lineWidth = 5;             // spessore maggiore
  ctx.setLineDash([10, 5]);      // linea tratteggiata (opzionale)
  ctx.stroke();
  ctx.setLineDash([]);           // reset tratteggio
}

let pulseActive = false;

function pulsingFreccia(index, duration = 3000) {
  if (frecce.length === 0 || !frecce[index]) return;

  const freccia = frecce[index];
  const startTime = performance.now();
  pulseActive = true;

  function animate(time) {
    if (!pulseActive) return;

    const elapsed = time - startTime;
    if (elapsed > duration) {
      pulseActive = false;
      resizeCanvas(); // Pulizia e ridisegno normale
      return;
    }

    resizeCanvas(); // Cancella e ridisegna tutto normalmente

    // Calcola spessore oscillante tra 2 e 6
    const thickness = 2 + Math.abs(Math.sin(elapsed / 200)) * 4;

    // Disegna la freccia pulsante
    ctx.beginPath();
    ctx.moveTo(freccia.inzioX, freccia.inzioY);
    ctx.lineTo(freccia.fineX, freccia.fineY);
    ctx.strokeStyle = "red";
    ctx.lineWidth = thickness;
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

let pulseNodoActive = true; // Bool globale per controllare il pulsing

function pulsingNodo(index, duration = 3000) {
    if (nodi.length === 0 || !nodi[index]) return;
    if (nodi[index].text === 'Start' || nodi[index].text === 'End') return; // Non animare Start e End
    const nodo = nodi[index];
    const originalColor = nodo.color || "white";
    const highlightColor = "orange";
    const startTime = performance.now();
    let active = true;

    function animate(time) {
        if (!active || !pulseNodoActive) {
            nodo.color = originalColor;
            resizeCanvas();
            return;
        }

        const elapsed = time - startTime;
        if (elapsed > duration) {
            nodo.color = originalColor;
            resizeCanvas();
            return;
        }

        // Calcola colore pulsante (oscilla tra highlight e originale)
        const t = Math.abs(Math.sin(elapsed / 200));
        nodo.color = t > 0.5 ? highlightColor : originalColor;
        resizeCanvas();

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    // Stop pulsing if needed externally
    return () => { active = false; nodo.color = originalColor; resizeCanvas(); };
}