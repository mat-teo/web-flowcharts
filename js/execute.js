/*
 {
  "nodes": [
    { "type": "start", "info": "", "next": "1" },
    { "type": "input", "info": "x", "next": "2" },
    { "type": "input", "info": "y", "next": "3" },
    { "type": "if", "info": "y != 0", "next": { "true": "4", "false": "5" } },
    { "type": "print", "info": "x / y", "next": "6" },
    { "type": "print", "info": "'can't divide by 0'", "next": "6" },
    { "type": "end", "info": "", "next": "" }
  ],
  "variables": [
    {"name": "x", "type": "int", "value": 0},
 {"name": "y", "type": "int", "value": 0}
 ]
 }
*/
let currentNode = "0"; // inizia dal primo nodo
function run(){
    document.getElementById('console-popup').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeConsole() {
    document.getElementById('console-popup').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function resetFlow() {
    currentNode = "0"; // Reimposta al primo nodo
    const consoleOutput = document.getElementById('console-output');
    printMessage("Flow resetted. Ready to execute again."); // Flusso resettato. Pronto per essere eseguito di nuovo. (Nota: printMessage già gestisce l'output, questo commento traduce il messaggio originale se fosse stato un commento a sé)
    const input = document.getElementById('console-input')
    const btn = document.getElementById('console-send')
    input.classList.remove('active');
}

async function executeStep(){
  if(currentNode== null){
    currentNode = "0"; // Reimposta al primo nodo se currentNode è nullo
  }
  const node = flow.nodes[parseInt(currentNode)];
  currentNode = await executeNode(node,currentNode,flow.variables);
}

async function executeFlow(json){
    console.log(json)
    if(currentNode== null){
      currentNode = "0"; // Reimposta al primo nodo se currentNode è nullo
    }
    let variables = json.variables;
    while(currentNode != null){
        const node = json.nodes[parseInt(currentNode)];
        currentNode = await executeNode(node,currentNode,variables);
    }
    
}

function printMessage(msg){
    const consoleOutput = document.getElementById('console-output');
    const messageElement = document.createElement('p');
    messageElement.textContent = "> " +  msg;
    consoleOutput.appendChild(messageElement);
    consoleOutput.scrollTop = consoleOutput.scrollHeight; // Scorre fino in fondo
}

function throwError(msg){
    const consoleOutput = document.getElementById('console-output');
    const errorElement = document.createElement('p');
    errorElement.textContent = "> Error: " + msg;
    errorElement.classList.add('error');
    consoleOutput.appendChild(errorElement);
    consoleOutput.scrollTop = consoleOutput.scrollHeight; // Scorre fino in fondo
    currentNode = "0"; // Reimposta al primo nodo in caso di errore
}

function clearConsole() {
    const consoleOutput = document.getElementById('console-output');
    consoleOutput.innerHTML = ''; // Pulisce l'output della console
    printMessage("Console cleared."); // Console pulita
}

async function executeNode(node,currentNode,variables){
  if(node.type != "start" && node.type != "end" && node.info == "") {
    throwError("Node " + currentNode + " is empty. Please check your flow."); // Il nodo è vuoto. Controlla il tuo flusso. (Nota: throwError già gestisce l'output)
    return null;
  }
  switch(node.type){
            case "start":       // NODO START
                console.log("Start\n");
                printMessage("Start");
                currentNode = node.next;
                break;
            case "print": // NODO PRINT
                string="";
                parts = splitStrings(node.info);
                for (let i = 0; i < parts.length; i++) {
                  if (parts[i].startsWith("'") || parts[i].startsWith('"') ) {
                    string += parts[i].substring(1, parts[i].length - 1);
                  } else {
                    let expression = "";
                    let isVar = false;
                    let variable = "";
                    for (let j = 0; j < parts[i].length; j++) {
                      if (parts[i][j] == " ") {
                        if (isVar && variable !== "" && variable !== "'" && variable !== '"') {
                          if(!existVariable(variable,variables)){
                            throwError("in node " + currentNode + ": " + variable + " has not been declared")
                            return null;
                          }
                          let v = getVariable(variable, variables);
                          if (v) {
                            expression += v.value.toString();
                          } else {
                            expression += variable;
                          }
                          variable = "";
                        }
                        isVar = false;
                        continue;
                      }
                      if (!isNaN(parts[i][j]) || "+-*/".includes(parts[i][j])) {
                        if (isVar && variable !== "" && variable !== "'" && variable !== '"') {
                          if(!existVariable(variable,variables)){
                            throwError("in node " + currentNode + ": " + variable + " has not been declared")
                            return null;
                          }
                          let v = getVariable(variable, variables);
                          if (v) {
                            expression += v.value.toString();
                          } else {
                            expression += variable;
                          }
                          variable = "";
                        }
                        isVar = false;
                        expression += parts[i][j];
                      } else {
                        isVar = true;
                        variable += parts[i][j];
                      }
                      if (isVar && j == parts[i].length - 1) {
                        if (variable !== "" && variable !== "'" && variable !== '"') {
                          if(!existVariable(variable,variables)){
                            throwError("in node " + currentNode + ": " + variable + " has not been declared")
                            return null;
                          } 
                          let v = getVariable(variable, variables);
                          if (v) {
                            expression += v.value.toString();
                          } else {
                            expression += variable;
                          }
                        }
                        isVar = false;
                        variable = "";
                      }
                    }
                    string += eval(expression);
                  }
                }
                console.log("Print: " + string);
                printMessage(string);
                currentNode = node.next;
                break; 
              case "if": // NODO IF
                let condition = node.info;
                console.log("If: " + condition);
                printMessage("If: " + condition);
                
                if (checkCondition(condition, variables) == true) {
                    console.log("If: " + condition + " is true");
                    printMessage("If: " + condition + " is true");
                    currentNode = node.next.true;
                } else if(checkCondition(condition, variables) == false) {
                    console.log("If: " + condition + " is false");
                    printMessage("If: " + condition + " is false");
                    currentNode =  node.next.false;
                }else{
                  return null;
                }
                break;
              case "while": // NODO WHILE
                let whileCondition = node.info;
                console.log("While: " + whileCondition);
                printMessage("While: " + whileCondition);
                if(checkCondition(whileCondition, variables) == true){
                    console.log("While: " + whileCondition + " is true");
                    printMessage("While: " + whileCondition + " is true");
                    currentNode = node.next.true; // Vai al ramo true
                }else if(checkCondition(whileCondition, variables) == false){
                    console.log("While: " + whileCondition + " is false");
                    printMessage("While: " + whileCondition + " is false");
                    currentNode = node.next.false; // Vai al ramo false
                }else{
                    return null; 
                }
                break;
              case "do": // NODO DO
                let doCondition = node.info;
                console.log("Do: " + doCondition);
                printMessage("Do: " + doCondition);
                if(checkCondition(doCondition, variables) == true){
                    console.log("Do: " + doCondition + " is true");
                    printMessage("Do: " + doCondition + " is true");
                    currentNode = node.next.true; // Vai al ramo true
                }else if (checkCondition(doCondition, variables) == false){
                    console.log("Do: " + doCondition + " is false");
                    printMessage("Do: " + doCondition + " is false");
                    currentNode = node.next.false; // Vai al ramo false
                }else{
                  return null;
                }
                break;
              case "for": // NODO FOR
                let forParts = node.info.split(";");
                if (forParts.length !== 3) {
                    throwError("Invalid for loop syntax: " + node.info);
                    return null;
                }
                
                let init = forParts[0].trim();
                let forcondition = forParts[1].trim();
                let increment = forParts[2].trim();

                let initParts = init.split("=");
                if (initParts.length !== 2) {
                    throwError("Invalid initialization syntax: " + init);
                    return null;
                }
                // Esegui inizializzazione
                variables.forEach(v => {
                  // Sostituisci i nomi delle variabili nell'espressione con i loro valori
            
                  initParts[1] = initParts[1].replace(new RegExp(`\\b${v.name}\\b`, 'g'), v.value.toString());
                });
                getVariable(init[0],variables).value = eval(initParts[1]);

                console.log("For: " + initParts[0] + " = " + getVariable(initParts[0],variables).value);
                printMessage("For: " + initParts[0] + " = " + getVariable(initParts[0],variables).value);


                initParts[1] = eval(initParts[1]).toString()
                initParts[1] += "+"+increment;
                flow.nodes[parseInt(currentNode)].info = initParts[0] + "=" + initParts[1] + ";" + forcondition + ";" + increment;
                // Controlla condizione
                if (checkCondition(forcondition, variables) == true) {
                    console.log("For Condition: " + forcondition + " is true");
                    printMessage("For Condition: " + forcondition + " is true");
                    currentNode = node.next.true; 
                } else if(checkCondition(forcondition, variables) == false) {
                    console.log("For Condition: " + forcondition + " is false");
                    printMessage("For Condition: " + forcondition + " is false");
                    currentNode = node.next.false; 
                }else{
                  return null;
                }

                
                                
                break;
              case "input": //NODO INPUT
                console.log("Input: " + node.info);
                printMessage("Input: " + node.info);
                if (!existVariable(node.info,variables)) {
                    throwError("Variable " + node.info + " not declared.");
                    return null;
                }
                getVariable(node.info,variables).value = await inputVariable(node.info, getVariable(node.info,variables).type);
                currentNode = node.next;  
                break;

              case "assign": // NODO ASSIGN
                console.log("Assign: " + node.info);
                printMessage("Assign: " + node.info)
                let assignParts = node.info.split("=");
                if(assignParts.length != 2){
                  throwError("In node " + currentNode +": wrong assign syntax. Use [Variable] = [Value]")
                  return null;
                }
                let varName = assignParts[0].trim();
                let exp = assignParts[1].trim();

                variables.forEach(v => {
                  // Sostituisci i nomi delle variabili nell'espressione con i loro valori
                  // Usa i confini delle parole per evitare sostituzioni parziali
                  exp = exp.replace(new RegExp(`\\b${v.name}\\b`, 'g'), v.value.toString());
                });
                if(!existVariable(varName,variables)){
                  throwError("in node " + currentNode + ": " + varName + " has not been declared")
                  return null;
                }
                try{
                  getVariable(varName,variables).value = eval(exp);
                }catch(e){
                  throwError("In node " + currentNode + ": invalid expression " + e);
                }
                currentNode = node.next;
                break;

              case "end": // NODO END
                console.log("End\n");
                printMessage("End.");
                currentNode = node.next;
                break;
        }
        return currentNode
}

function checkCondition(condition, variables) {
    let expression = "";
    let isVar = false;
    let variable = "";

    for (let j = 0; j < condition.length; j++) {
        if (condition[j] == " ") {
            if (isVar) {
                isVar = false;
                let v = getVariable(variable, variables);
                if(!existVariable(variable,variables)){
                  throwError(variable + " has not been declared.")
                  return {};
                }
                if (v) {
                    expression += v.value.toString();
                } else {
                    expression += variable;
                }
                variable = "";
            }
            continue;
        }
        if (!isNaN(condition[j]) || "+-*/<>!=.()".includes(condition[j])) {
            if (isVar) {
                isVar = false;
                let v = getVariable(variable, variables);
                if(!existVariable(variable,variables)){
                  throwError(variable + " has not been declared.")
                  return {};
                }
                if (v) {
                    expression += v.value.toString();
                } else {
                    expression += variable;
                }
                variable = "";
            }
            expression += condition[j];
        } else {
            isVar = true;
            variable += condition[j];
        }
        if (j == condition.length - 1 && isVar) {
            let v = getVariable(variable, variables);
            if(!existVariable(variable,variables)){
                throwError(variable + " has not been declared.")
                return {};
            }
            if (v) {
                expression += v.value.toString();
            } else {
                expression += variable;
            }
            isVar = false;
            variable = "";
        }
    }

    try {
        if(!isNaN(expression)){
          return eval(!!(expression));
        }else{
          return eval(expression);
        }
    } catch (e) {
        throwError("in condition: " + expression + ". " + e.message);
        return {};
    }
}


function splitStrings(input) {
  const parts = [];
  let buffer = "";
  let isExpression = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === "'" || char === '"') {
      if (isExpression) {
        isExpression = false;
      } else {
        isExpression = true;
      }

      buffer += char;
      i++;

      while (i < input.length) {
        buffer += input[i];
        if (input[i] === "'" || input[i] === '"') {
          isExpression = false; 
          i++;
          break;
        }
        i++;
      }

      parts.push(buffer.trim());
      buffer = "";
      continue;
    }

    if (char === '+') {
      if (!isExpression) {
        let j = i + 1;
        while (j < input.length && input[j] === ' ') j++;

        if (input[j] === "'" || input[j] === '"') {
          if (buffer.trim() !== "") {
            parts.push(buffer.trim());
          }
          buffer = "";
          i++; 
          continue;
        }
      }

      buffer += '+';
      i++;
      continue;
    }

    buffer += char;
    i++;
  }

  if (buffer.trim() !== "") {
    parts.push(buffer.trim());
  }

  return parts;
}

async function inputVariable(name,type) {
 // const input = prompt(`Inserisci un valore per ${name} (${type}):`); //Riga di codice commentata per l'input tramite prompt
  const input = await askUserInput();
  const feedback = () => {
      document.getElementById('console-input').classList.add('input-error');
      setTimeout(() => document.getElementById('console-input').classList.remove('input-error'), 500);
    };
  if (input !== null) {
    switch (type) {
      case "int":
        if (isNaN(input)) {
          throwError("Invalid input. You have to insert an integer number.");
          feedback();
          return inputVariable(name, type);
        }
        printMessage(input);
        return parseInt(input);
      case "float":
        if (isNaN(input)) {
          throwError("Invalid input. You have to insert a real number.");
          feedback();
          return inputVariable(name, type);
        }
        printMessage(input);
        return parseFloat(input);
      case "string":
        printMessage(input);
        return input;
    }
  } else {
    return null;
  }
}

function askUserInput(){
  document.getElementById('console-input').value= "";
  document.getElementById('console-input').classList.add('active');
  return new Promise((resolve) => {
    const inputElem = document.getElementById('console-input');
    const sendBtn = document.getElementById('console-send');
    const feedback = () => {
      inputElem.classList.add('input-error');
      setTimeout(() => inputElem.classList.remove('input-error'), 500);
    };
    const handler = () => {
      const value = inputElem.value.trim();
      if (value === "") {
        feedback();
        return;
      }
      sendBtn.removeEventListener('click', handler);
      inputElem.removeEventListener('keydown', keyHandler);
      inputElem.classList.remove('active');
      resolve(value);
    };
    const keyHandler = (e) => {
      if (e.key === 'Enter') {
        handler();
      }
    };
    sendBtn.addEventListener('click', handler);
    inputElem.addEventListener('keydown', keyHandler);
  });
}


function existVariable(vrbl,variables){
  for(i=0;i<variables.length;i++){
    if(vrbl == variables[i].name){
      return true
    }
  }
  return false
}

function getVariable(vrbl,variables){
   for(i=0;i<variables.length;i++){
    if(vrbl == variables[i].name){
      return variables[i]
    }
  }
  return null
}