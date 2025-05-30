let tabsCount = 0;
let codeLines = [];
const indend = '    ';
let index=0;
function addLine(code){
    codeLines.push(indend.repeat(tabsCount) + code);
}

function openPythonPopup(){
    const popup = document.getElementById('python-popup');
    popup.classList.add('active');
    document.getElementById('overlay').classList.add('active');
    const codeContainer = document.getElementById('python-code');
    codeContainer.innerHTML = ''; // Clear previous content
    translateFlow();
    const hasCode = codeLines.some(line => line.trim() !== '');
     const now = new Date();
    const formattedDate = (now.getMonth() + 1).toString().padStart(2, '0') + '/' +
                      now.getDate().toString().padStart(2, '0') + '/' +
                      now.getFullYear();
    if(hasCode){
        if (codeLines.length > 0 && codeLines[0].startsWith("Error")) {
            codeContainer.value = "# " + formattedDate + "\n# Code from BaseFlow\n\n# " + codeLines[0];
        } else {
            codeContainer.value = "# " + formattedDate  + "\n# Code from BaseFlow\n" +  codeLines.join('\n');
        }
    }else{
        codeContainer.value = "# Empty flowchart"
    }
}

function closePythonPopup(){
    const popup = document.getElementById('python-popup');
    popup.classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function copyPythonCode(){
    const codeContainer = document.getElementById('python-code');
    codeContainer.select();
    document.execCommand('copy');
    alert('Python code copied to clipboard!');
}

function downloadPythonCode(){
    const codeContainer = document.getElementById('python-code');
    const blob = new Blob([codeContainer.value], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'flow_code.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Python code downloaded as flow_code.py!');
}

function translateFlow(){
    codeLines = [];
    tabsCount = 0;
    index=0;
    for (index = 0; index < flow.variables.length; index++) {
        addLine(translateVariable(flow.variables[index].name, flow.variables[index].value));
    }
    addLine('\n');
    for (index = 0; index < flow.nodes.length; index++) {
        const node = flow.nodes[index];
        addLine(translateNode(node));
    }
    console.log(codeLines.join('\n'));
}

function translateVariable(variable,init){
    let string = '';
    string += variable + " = " + init;

    return string;
}

function translateNode(node){
    switch(node.type) {
        case 'start':
            return '';
        case 'end':
            return '';
        case 'assign':
            if(node.info == ""){
                codeLines[0] = ("Error: node " + node.type + " is empty. Please edit its informations to translate the chart into Python");
                return '';
            }
            return node.info;
        case 'input':
            if(node.info == ""){
                codeLines[0] = ("Error: node " + node.type + " is empty. Please edit its informations to translate the chart into Python");
                return '';
            }
            const variable = getVariable(node.info,flow.variables);
            switch(variable.type) {
                case 'string':
                    return variable.name + " = input('Insert a string for " + variable.name +"')";
                case 'int':
                    return variable.name + " = int(input('Insert an integer for " + variable.name + "'))";
                case 'float':
                    return variable.name + " = float(input('Insert a float for " + variable.name + "'))";
            }
        case 'print':
            if(node.info == ""){
                codeLines[0] = "Error: node " + node.type + " is empty. Please edit its informations to translate the chart into Python";
                return '';
            }
            return 'print(' + node.info + ')';
        case 'if':
            if(node.info == ""){
                codeLines[0] = ("Error: node " + node.type + " is empty. Please edit its informations to translate the chart into Python");
                return '';
            }
            addLine('');
            addLine('if ' + node.info + ':');
            tabsCount++;
            recreateIfBranches(node);
            return '';
    }
}

function recreateIfBranches(ifNode){
    let falseBranch = parseInt(ifNode.next.false);
    let trueBranch = parseInt(ifNode.next.true);
    for(index = trueBranch; index < falseBranch; index++){
        const node = flow.nodes[index];
        addLine(translateNode(node));
    }
    tabsCount--;
    addLine('else:');
    tabsCount++;
    for(index = falseBranch; index < flow.nodes[ifNode.next.false-1].next; index++){
        addLine(translateNode(flow.nodes[index]));
    }
    tabsCount--;
}