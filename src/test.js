const QiniuManager = require('./utils/QiniuManager')
const path = require("path")

const accessKey = "fPNOoRMjg3Evvpl0tRlugtEWAvo3TR2merUPLyHC"
const secretKey = "PiI0cJOGathbp0VlqmKjvuRsOi8qmgvptOIGXJNr"

const bucket = "mark-down-storage"

const qiniuManager = new QiniuManager(accessKey, secretKey, bucket)

const localPath = "/Users/changyh/Public/loaction.md"
const key = path.basename(localPath)

const downloadPath = path.join(__dirname, key)

// qiniuManager.uploadFiles(key, localPath).then(data => {
//     console.log(data)
// })

// qiniuManager.getBucketDomain().then(data => {
//     console.log(data)
// })

// qiniuManager.generateDownloadLink(key).then(data => {
//     console.log(data)
// })


qiniuManager.downloadFiles(key, downloadPath).then(res => {
    console.log(res)
})