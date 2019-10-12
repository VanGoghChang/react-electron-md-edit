const { remote } = require('electron')
const Store = require('electron-store')
const settingsStore = new Store()

const $ = (id) => {
    return document.getElementById(id)
}
 document.addEventListener("DOMContentLoaded", () => {
     let savedLocation = settingsStore.get("filesSavedLoaction")
     if(savedLocation){
        $("savedFileLocation").value = savedLocation
     }
     $("select-new-location").addEventListener('click', () => {
        remote.dialog.showOpenDialog({
            message: "选择文件储存路径",
            properties: ["openDirectory"],
        }, (paths) => {
            if(Array.isArray(paths) && paths.length > 0) {
                $("savedFileLocation").value = paths[0]
                savedLocation = paths[0]
            }
        })
     })

     $("settings-form").addEventListener("submit", () => {
        settingsStore.set("filesSavedLoaction", savedLocation)
        remote.getCurrentWindow().close()
     })
 })