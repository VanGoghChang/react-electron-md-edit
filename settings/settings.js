const { remote, ipcRenderer } = require('electron')
const Store = require('electron-store')
const settingsStore = new Store()
const storageConfigArray = ["#savedFileLocation", "#accessKey", "#secretKey", "#bucketName"]

const $ = (selector) => {
    const result = document.querySelectorAll(selector)
    return result.length > 1?result: result[0]
}
 document.addEventListener("DOMContentLoaded", () => {
     // init
     storageConfigArray.forEach( selector => {
        const { id } = $(selector)
        const storageValue = settingsStore.get(id)
        if(storageValue){
            $(selector).value = storageValue
        }
     })
     $("#select-new-location").addEventListener('click', () => {
        remote.dialog.showOpenDialog({
            message: "选择文件储存路径",
            properties: ["openDirectory"],
        }, (paths) => {
            if(Array.isArray(paths) && paths.length > 0) {
                $("#savedFileLocation").value = paths[0]
                savedLocation = paths[0]
            }
        })
     })

     $("#settings-form").addEventListener("submit", (e) => {
        e.preventDefault()
        storageConfigArray.forEach( selector => {
            const {id , value } = $(selector)
            settingsStore.set(id, value?value: "")
        })
        ipcRenderer.send('config-is-saved')
        remote.getCurrentWindow().close()
     })

     $(".nav-tabs").addEventListener("click", (e) => {
         e.preventDefault()
         if(e.target.dataset.tab === undefined) {
             return
         }
         $(".nav-link").forEach(element => {
             element.classList.remove("active")
         })
         e.target.classList.add("active")
         $(".config-area").forEach(element => {
             element.style.display = "none"
         })
         $(e.target.dataset.tab).style.display = "block"
     })


 })