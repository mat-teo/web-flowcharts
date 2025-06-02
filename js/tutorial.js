
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

const editNodeTour = new Shepherd.Tour({
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

editNodeTour.addStep({
  id: 'explain',
  text: 'This is the popup window where you can edit the information of a flowchart block (node).',
  attachTo: {
    element: '#edit-node-popup',
    on: 'left'
  },
  buttons: [
    { text: 'Next', action: editNodeTour.next }
  ]
});

editNodeTour.addStep({
  id: 'input',
  text: () => {
    let txt = 'Here you can change the text or value associated with the selected node.';
    switch (flow.nodes[nodoSelected].type) {
      case 'input':
        return txt + "\nFor input nodes, enter the name of the variable you want to read from the user. Make sure this variable is already declared in the table on your left.";
            case 'print':
        return txt + "\nIn print nodes, type the text you want to display. Use single ('') or double (\"\") quotes for text, and use + to combine text with variable values. For example: \"Result: \" + x";
            case 'assign':
        return txt + "\nIn assign nodes, set a value to a declared variable using the format: [VARIABLE NAME] = [VALUE]. You can use numbers, strings, operators, or other variables in the value.";
            case 'if':
        return txt + "\nIf nodes are for making decisions. Write a condition (for example: x > 5 or y == 0). The flowchart will follow the TRUE or FALSE path based on whether the condition is met.";
            case 'while':
        return txt + "\nWhile nodes repeat a set of instructions as long as a condition is true. Write a condition here (for example: i < 10). The flowchart will keep looping while the condition is true.";
            case 'for':
        return txt + "\nFor nodes are for counted loops. Write the initialization, condition, and increment separated by semicolons (for example: i = 0; i < 5; 1). The flowchart will repeat the block for each step.";
            case 'do-while':
        return txt + "\nDo-While nodes are similar to while nodes, but the block always runs at least once. Write a condition (for example: x != 0). The loop repeats as long as the condition is true, checking it after each run.";
            default:
        return 'Here you can change the text or value associated with the selected node.';
    }
  },
  attachTo: {
    element: '#edit-node-input',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: editNodeTour.back },
    { text: 'Next', action: editNodeTour.next }
  ]
});

editNodeTour.addStep({
  id: 'save',
  text: 'Click this button to save your changes.',
  attachTo: {
    element: '#edit-node-popup button:not(#close-edit-popup)',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: editNodeTour.back },
    { text: 'Next', action: editNodeTour.next }
  ]
});

editNodeTour.addStep({
  id: 'close',
  text: 'Or click here to close the popup without saving.',
  attachTo: {
    element: '#close-edit-popup',
    on: 'bottom'
  },
  buttons: [
    { text: 'Back', action: editNodeTour.back },
    { text: 'Done', action: () => { editNodeTour.complete(); } }
  ]
});

function startEditTour(){
  if(!editNodeTour.isActive()){
    editNodeTour.start();
  }
}

const consoleTour = new Shepherd.Tour({
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    scrollTo: { behavior: 'smooth', block: 'center' },
    classes: 'shadow-md bg-purple-200',
  }
});

consoleTour.addStep({
  id: 'console-popup-intro',
  text: 'This is the Console popup. Here you can interact with your flowchart by running it and seeing the output.',
  attachTo: {
    element: '#console-popup',
    on: 'top'
  },
  buttons: [
    { text: 'Next', action: consoleTour.next }
  ]
});

consoleTour.addStep({
  id: 'console-output',
  text: 'This area shows the output of your flowchart, including any errors or results.',
  attachTo: {
    element: '#console-output',
    on: 'top'
  },
  buttons: [
    { text: 'Back', action: consoleTour.back },
    { text: 'Next', action: consoleTour.next }
  ]
});

consoleTour.addStep({
  id: 'console-input',
  text: 'If your flowchart requires input, you can type it here and press Send, or Enter.',
  attachTo: {
    element: '#console-input-section',
    on: 'left'
  },
  buttons: [
    { text: 'Back', action: consoleTour.back },
    { text: 'Next', action: consoleTour.next }
  ]
});

consoleTour.addStep({
  id: 'console-buttons',
  text: 'Use these buttons to control the execution: run all at once, step by step, restart from the first node, or clear and close the console.',
  attachTo: {
    element: '#console-buttons',
    on: 'left'
  },
  buttons: [
    { text: 'Back', action: consoleTour.back },
    { text: 'Done', action: () => { consoleTour.complete(); } }
  ]
});

function startConsoleTour() {
  if (!consoleTour.isActive()) {
    // Ensure the popup is visible before starting the tour
    const popup = document.getElementById('console-popup');
    if (popup && !popup.classList.contains('active')) {
      popup.classList.add('active');
    }
    consoleTour.start();
  }
}