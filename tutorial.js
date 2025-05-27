
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
    id: 'new-var',
    text: 'Click here to add a new variable, entering its name.',
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
    show: () => {resizeCanvas(); pulsingFreccia(0, 10000);},
    hide: () => resizeCanvas()
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
    show: () => {resizeCanvas(); pulsingNodo(0, 10000);},
    hide: () => resizeCanvas()
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

let pulseNodeActive = false;

function pulsingNodo(index, duration = 3000) {
    if (nodi.length === 0 || !nodi[index]) return;

    const nodo = nodi[index];
    if(nodo.type === 'start' || nodo.type === 'end') return; // Non pulsare su Start o End
    const startTime = performance.now();
    pulseNodeActive = true;

    function animate(time) {
        if (!pulseNodeActive) return;

        const elapsed = time - startTime;
        if (elapsed > duration) {
            pulseNodeActive = false;
            resizeCanvas(); // Pulizia e ridisegno normale
            return;
        }

        resizeCanvas(); // Cancella e ridisegna tutto normalmente

        // Calcola spessore oscillante tra 2 e 6
        const thickness = 2 + Math.abs(Math.sin(elapsed / 200)) * 4;

        // Disegna il bordo pulsante del nodo (assumendo rettangolo)
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = thickness;
        ctx.setLineDash([10, 5]);
        ctx.rect(nodo.x, nodo.y, nodo.width, nodo.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}