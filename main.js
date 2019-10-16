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
    const urlLocation = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "./build/index.html")}`
    mainWindow = new AppWindow(mainWindowConfig, urlLocation)
    mainWindow.webContents.openDevTools()
    mainWindow.on('closed', () => {
        mainWindow = null
    })

    // Open setting window
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

    // Set cloud sync menu item status 
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

    // Upload active file
    ipcMain.on("uplaod-file", (event, data) => {
        const manager = createManager()
        if (manager) {
            const { key, path } = data
            manager.uploadFiles(key, path)
                .then(result => {
                    console.log("uplaod file result___", result)
                    if (result && result.key === key) {
                        console.log("云端同步成功")
                        event.reply("file-uploaded")
                    }
                }, error => {
                    if (error.statusCode === 614) { // file is exists
                        console.log("file is exists...")
                        manager.deleteFile(key).then(res => {
                            console.log("delete file result____:", res)
                            return manager.uploadFiles(key, path)
                        }, error => {
                            dialog.showErrorBox("云端同步失败", "请检查云端配置项是否正确")
                        }).then(result => {
                            console.log("uplaod file result___", result)
                            if (result && result.key === key) {
                                console.log("云端同步成功")
                                event.reply("file-uploaded")
                            }
                        })
                    } else {
                        dialog.showErrorBox("云端同步失败", "请检查云端配置项是否正确")
                    }
                })
                .catch(err => {
                    dialog.showErrorBox("云端同步失败", "请检查云端配置项是否正确")
                })
        }
    })

    // Upload all files
    ipcMain.on("all-files-upload", (event, data) => {
        // set loading
        // event.reply("loading-status", true) ----- ipcMain.emit send no event
        setLoadingStatus(true)
        const manager = createManager()
        const files = store.get("files") || {}
        if (manager) {
            const requestArray = Object.keys(files).map(id => {
                const { title, path } = files[id]
                return manager.uploadFiles(title, path)
            })
            Promise.all(requestArray).then(res => {
                console.log("Resp___:", res)
                dialog.showMessageBox({
                    type: "info",
                    title: `云端同步成功${res.length}个文件`,
                    message: `云端同步成功${res.length}个文件`
                })
                // event.reply("all-files-uploaded")
                mainWindow.webContents.send("all-files-uploaded")
                // event.reply("loading-status", false)
                setLoadingStatus(false)
            }).catch(error => {
                dialog.showErrorBox("云端同步失败", "请检查云端配置项是否正确")
                setLoadingStatus(false)
            })
        }
    })

    // Download active file
    ipcMain.on("download-file", (event, data) => {
        setLoadingStatus(true)
        const manager = createManager()
        const files = store.get("files")
        const { key, path, id } = data
        manager.getFileInfoInCloud(key).then(res => {
            console.log("download-file______:", res)
            const serverUpdateTime = Math.round(res.putTime / 10000) //putTime is nm
            const loaclUpdateTime = files[id].updatedAt

            console.log(serverUpdateTime, loaclUpdateTime)
            if (serverUpdateTime > loaclUpdateTime || !loaclUpdateTime) {
                manager.downloadFiles(key, path).then(() => {
                    event.reply("file-downloaded", { status: "download-success", id })
                    setLoadingStatus(false)
                })
            } else {
                event.reply("file-downloaded", { status: "no-new-file", id })
                setLoadingStatus(false)
            }
        }, error => {
            if (error.statusCode === 612) {
                event.reply("file-downloaded", { status: "no-file", id })
                setLoadingStatus(false)
            }
        }).catch(err => {
            if (err) {
                event.reply("file-downloaded", { status: "download-error", id })
                setLoadingStatus(false)
            }
        })
    })

    // Delete file
    ipcMain.on("delete-file", (event, data) => {
        const manager = createManager()
        if (manager) {
            manager.deleteFile(data.key)
                .then(res => {
                    console.log("delete result___:", res)
                    dialog.showMessageBox({
                        type: "info",
                        title: `云端删除成功`,
                        message: `云端删除成功`
                    })
                })
                .catch(error => {
                    console.log("delete error___:", error)
                    dialog.showErrorBox("云端删除失败", "请检查云端配置项是否正确")
                })

        }
    })

    // Set loading status
    const setLoadingStatus = status => {
        mainWindow.webContents.send("loading-status", status)
    }
})