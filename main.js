const { app, Menu, ipcMain, dialog } = require("electron")
const isDev = require("electron-is-dev")
const path = require('path')
const menuTemplate = require('./src/menuTemplate')
const qiniuManager = require('./src/utils/QiniuManager')
const AppWindow = require('./src/AppWindow')
const Store = require("electron-store")
const store = new Store()
let mainWindow

const createManager = () => {
    const accessKey = store.get("accessKey")
    const secretKey = store.get("secretKey")
    const bucket = store.get("bucketName")
    return new qiniuManager(accessKey, secretKey, bucket)
}

app.on("ready", () => {
    const mainWindowConfig = {
        width: 1440,
        height: 768
    }
    const urlLocation = isDev ? "http://localhost:3000" : "dummyurl"
    mainWindow = new AppWindow(mainWindowConfig, urlLocation)
    mainWindow.webContents.openDevTools()
    mainWindow.on('closed', () => {
        mainWindow = null
    })

    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 450,
            parent: mainWindow
        }
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.webContents.openDevTools()
        settingsWindow.on('closed', () => {
            settingsWindow = null
        })
    })

    let menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

    ipcMain.on("config-is-saved", () => {
        let qiniuMenu = process.platform === "darwin" ? menu.items[3] : menu.items[2]
        const switchItems = (toggle) => {
            [1, 2, 3].map(key => {
                qiniuMenu.submenu.items[key].enabled = toggle
            })
        }
        const qiniuConfig = ["accessKey", "secretKey", "bucketName"].every(key => !!store.get(key))
        if (qiniuConfig) {
            switchItems(true)
        } else {
            switchItems(false)
        }
    })

    ipcMain.on("uplaod-file", (event, data) => {
        const manager = createManager()
        if(manager){
            manager.uploadFiles(data.key, data.path)
            .then(result => {
                console.log("result___", result)
                if(result && result.key === data.key){
                    console.log("云端同步成功")
                    event.reply("uploaded-active-file")
                }
                
            })
            .catch(err => {
                dialog.showErrorBox("云端同步失败", "请检查云端配置项是否正确")
            })
        }
    })
})