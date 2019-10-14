const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')

class QiniuManager {
    constructor(accessKey, secretKey, bucket) {
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
        this.bucket = bucket
        this.config = new qiniu.conf.Config()
        this.config.zone = qiniu.zone.Zone_z2
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
    }

    uploadFiles(key, fileLocation) {
        const options = {
            scope: this.bucket,
        }
        const putPolicy = new qiniu.rs.PutPolicy(options)
        const uploadToken = putPolicy.uploadToken(this.mac)
        const formUploader = new qiniu.form_up.FormUploader(this.config)
        const putExtra = new qiniu.form_up.PutExtra()
        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken, key, fileLocation, putExtra, this._handlePromiseCallback(resolve, reject))
        })
    }

    deleteFiles(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handlePromiseCallback(resolve, reject))
        })
    }

    getBucketDomain() {
        const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
        const token = qiniu.util.generateAccessToken(this.mac, reqURL)
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqURL, token, this._handlePromiseCallback(resolve, reject))
        })
    }

    generateDownloadLink(key) {
        const domainPromise = this.publicBucketDomian? Promise.resolve([this.publicBucketDomian]): this.getBucketDomain()
        return domainPromise.then(data => {
            if(Array.isArray(data) && data.length > 0) {
                const pattern = /^https?/
                this.publicBucketDomian = pattern.test(data[0])? data([0]): `http://${data[0]}`
                return this.bucketManager.publicDownloadUrl(this.publicBucketDomian, key)
            }else{
                throw Error('域名未找到，请检查域名')
            }
        })
    }

    downloadFiles(key, downloadPath) {
        return this.generateDownloadLink(key).then(link => {
            const timeStamp = new Date().getTime()
            const url = `${link}?timeStamp=${timeStamp}`
            return axios({
                url,
                method: 'get',
                responseType: 'stream',
                headers:{'Cache-Control': 'no-cache'}
            })
        }).then(response => {
            const writer = fs.createWriteStream(downloadPath)
            response.data.pipe(writer)
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
            })
        }).catch(error => {
            return new Promise.reject({ err: error.response})
        })

    }

    _handlePromiseCallback(resolve, reject) {
        return (respErr, respBody, respInfo) => {
            if (respErr) {
                throw respErr;
            }
            if (respInfo.statusCode == 200) {
                resolve(respBody);
            } else {
                reject ({
                    statusCode: respInfo.statusCode,
                    body: respBody
                })
            }
        }
    }
}

module.exports = QiniuManager