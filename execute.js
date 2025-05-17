/*
this script is used to execute the flow:
 - the flow is stored in a json object
 - it's a map of node where each one is a block that points to the next one
 - conditions are special nodes that contains 2 different next nodes (the first one for true, the second for false)
 - the last node doesn't aim to any other node
 - every types of nodes has its own function to execute (assign, print, input, if...)
 - the json contains also all the variables declared from the user in the sidebar

 json structure example:
 {
  "nodes": {
    "0": { "type": "start", "info": "", "next": "1" },
    "1": { "type": "input", "info": "x", "next": "2" },
    "2": { "type": "input", "info": "y", "next": "3" },
    "3": { "type": "if", "info": "y != 0", "next": { "true": "4", "false": "5" } },
    "4": { "type": "print", "info": "x / y", "next": "6" },
    "5": { "type": "print", "info": "'can't divide by 0'", "next": "6" },
    "6": { "type": "end", "info": "", "next": "" }
  },
    "variables": {
    "x": {"type": "int", "value": 0},
    "y": {"type": "int", "value": 0}
    }
}
*/
function executeFlow(json){
    let currentNode = "0"; // start from the first node
    let variables = json.variables;
    while(currentNode != null){
        const node = json.nodes[currentNode];
        switch(node.type){
            case "start":       // START NODE
                console.log("Start\n");
                currentNode = node.next;
                break;
            case "print": // PRINT NODE
                string="";
                parts = splitStrings(node.info);
                for(i=0;i<parts.length;i++){  
                    if(parts[i].startsWith("'")){
                        string+= parts[i].substring(1, parts[i].length-1);
                    }else{
                        let expression="";
                        let isVar=false;
                        let variable="";
                        for(j=0;j<parts[i].length;j++){
                          if(parts[i][j] == " "){
                            if(isVar){
                                isVar=false;
                                expression += variables[variable].value.toString();
                                variable="";
                            }
                            continue;
                          }
                          if (!isNaN(parts[i][j]) || "+-*/".includes(parts[i][j])) {
                              if(isVar){
                                  isVar=false;
                                  expression += variables[variable].value.toString();
                                  variable="";
                              }
                              expression += parts[i][j];
                          }else{
                              isVar=true;
                              variable += parts[i][j];
                          }
                          if(isVar && j == parts[i].length - 1){
                              expression += variables[variable].value.toString();
                              isVar=false;
                              variable="";
                          }
                      }
                        string += eval(expression);
                    }
                }
                console.log("Print: " + string);
                currentNode = node.next;
                break; 
              case "if": // IF NODE
                let condition = node.info;
                let expression = "";
                console.log("If: " + condition);
                let isVar=false;
                let variable="";
                for (let j = 0; j < condition.length; j++) {
                    if (condition[j] == " ") {
                        if(isVar){
                          isVar=false;
                          expression += variables[variable].value.toString();
                          variable="";
                        }
                        continue;
                    } 
                    if (!isNaN(condition[j]) || "+-*/<>=.()".includes(condition[j])) {
                        if(isVar){
                          isVar=false;
                          expression += variables[variable].value.toString();
                          variable="";
                        }
                        expression += condition[j];
                    } else {
                        isVar=true;
                        variable += condition[j];
                    }
                    if (j == condition.length - 1 && isVar) {
                        expression += variables[variable].value.toString();
                        isVar=false;
                        variable="";
                    }
                }
                if (eval(expression)) {
                    console.log("If: " + condition + " is true");
                    currentNode = node.next.true;
                } else {
                    console.log("If: " + condition + " is false");
                    currentNode =  node.next.false;
                }
                break;

              case "input": //INPUT NODE
                console.log("Input: " + node.info);
                variables[node.info].value = inputVariable(node.info, variables[node.info].type);
                currentNode = node.next;  
                break;

              case "assign": // ASSIGN NODE
                console.log("Assign: " + node.info);
                let assignParts = node.info.split("=");
                let varName = assignParts[0].trim();
                let exp = assignParts[1].trim();

                Object.keys(variables).forEach(v => {
                  exp = exp.replaceAll(v, variables[v].value.toString());
                });

                variables[varName].value = eval(exp);
                currentNode = node.next;
                break;

              case "end": // END NODE
                console.log("End\n");
                currentNode = node.next;
                break;
        }
    }
    
}


function splitStrings(input) {
  const parts = [];
  let buffer = "";
  let isExpression = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === "'") {
      if (isExpression) {
        isExpression = false;
      } else {
        isExpression = true;
      }

      buffer += char;
      i++;

      while (i < input.length) {
        buffer += input[i];
        if (input[i] === "'") {
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

        if (input[j] === "'") {
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

function inputVariable(name,type) {
  const input = prompt(`Enter a value for ${name} (${type}):`);
  if (input !== null) {
    switch (type) {
      case "Integer":
        if (isNaN(input)) {
          console.log("Invalid input. Retry.");
          return inputVariable(name, type);
        }
        return parseInt(input);
        break;
      case "Real":
        if (isNaN(input)) {
          console.log("Invalid input. Retry.");
          return inputVariable(name, type);
        }
        return parseFloat(input);
        break;
      case "String":
        return input;
        break;
    }
  } else {
    return null;
  }
}