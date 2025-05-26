async function save(json,name){
    name = name.replace(/[\\/:*?"<>|]/g, "");
    name = name.trim()
    if(name == ""){
        name = "test"
    }
    if (!name.toLowerCase().endsWith(".json")) {
        name += ".json";
    }
    const dati = JSON.stringify(json)
    const blob = new Blob([dati],{type: 'application/json'})
    const url = URL.createObjectURL(blob)

    const options = {
        suggestedName: name,
        types: [
            {
                description: 'JSON file',
                accept: { 'application/json': ['.json'] }
            }
        ]
    };

    try {
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(flow, null, 2)); 
        await writable.close();
    } catch (err) {
        console.error("Salvataggio annullato o fallito:", err);
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
        URL.revokeObjectURL(url)
    }
    saved=true;
}