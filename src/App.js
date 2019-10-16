import React, { useState } from 'react'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from 'react-simplemde-editor'
import uuidv4 from 'uuid/v4'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import "easymde/dist/easymde.min.css"
import Search from './components/Search'
import List from './components/List'
import BottomButton from './components/BottomButton'
import TabList from './components/TabList'
import { flattenArray, objectToArray, timeStampSerialize } from './utils/helper'
import fileHelper from './utils/fileHelper'
import useIpcRenderer from "./hooks/useIpcRenderer"
import Loader from './components/Loader'

// import Node module
const Path = window.require('path')
const { remote, ipcRenderer } = window.require('electron')
const Store = window.require('electron-store')

const store = new Store()

const getAutoSync = () => ["accessKey", "secretKey", "bucketName", "autoSyncToCloud"].every(key => !!store.get(key))

const saveFilesToStore = (data) => {
  const fileStoreArray = objectToArray(data)
  const fileStoreObje = fileStoreArray.reduce((result, file) => {
    const { id, title, path, createdAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      title,
      path,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  }, {})
  store.set("files", fileStoreObje)
}

function App() {
  const [files, setFiles] = useState(store.get("files") || {})
  const [unsaveFileIDs, setUnSaveFileIDs] = useState([])
  const [openFileIDs, setOpenFileIDs] = useState([])
  const [activeFileID, setActiveFileID] = useState("")
  const [searchFilesList, setSearchFilesList] = useState([])
  const [loading, setLoading] = useState(false)

  const filesArray = objectToArray(files)
  const fileSaveLocation = store.get("savedFileLocation") || remote.app.getPath("documents")

  console.log("render files___:", files)

  const onSearchClose = () => setSearchFilesList([])

  const activedFile = files[activeFileID]
  const openedFiles = openFileIDs.map(openID => files[openID])

  const filesListSource = (searchFilesList.length > 0) ? searchFilesList : filesArray

  const fileClick = (fileID) => {
    setActiveFileID(fileID)
    const activeFile = files[fileID]
    const { isLoaded, path, id } = activeFile

    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send("download-file", { key: Path.basename(path), path, id })
      } else {
        fileHelper.readFile(path).then((value) => {
          const newFile = { ...files[fileID], body: value, isLoaded: true }
          setFiles({ ...files, [fileID]: newFile })
        })
      }

    }

    if (!openFileIDs.includes(fileID)) {
      setOpenFileIDs([...openFileIDs, fileID])
    }
  }

  const tabActive = (fileID) => {
    setActiveFileID(fileID)
  }

  const tabClose = (id) => {
    let newFiles = []
    if (openFileIDs.includes(id)) {
      newFiles = openFileIDs.filter(id => id !== id)
      console.log("newFiles_______________", newFiles)
      setOpenFileIDs(newFiles)
    }

    if (newFiles.length > 0) {
      if (id === activeFileID) {
        setActiveFileID(newFiles[0])
      }
    } else {
      setActiveFileID("")
    }
  }

  const onChangeFile = (id, value) => {
    if (value !== files[id].body) {
      if (!unsaveFileIDs.includes(id)) {
        setUnSaveFileIDs([...unsaveFileIDs, id])
      }
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })
    }
  }

  const editFile = (id, title, isNew) => {
    const targetSavePath = isNew ? Path.join(fileSaveLocation, `${title}.md`) :
      Path.join(Path.dirname(files[id].path), `${title}.md`)
    const newFile = { ...files[id], title, isNew: false, path: targetSavePath }
    const newFiles = { ...files, [id]: newFile }
    if (isNew) {
      // Create file
      fileHelper.writeFile(targetSavePath, files[id].body).then(() => {
        setFiles(newFiles)
        // To store
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = Path.join(Path.dirname(files[id].path), `${files[id].title}.md`)
      // Update file name
      fileHelper.renameFile(oldPath, targetSavePath).then(() => {
        setFiles(newFiles)
        // To store
        saveFilesToStore(newFiles)
      })
    }
  }

  const deleteFile = (id) => {
    if (files[id].isNew) {
      const newfiles = { ...files }
      delete newfiles[id]
      setFiles(newfiles)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const newfiles = { ...files }
        delete newfiles[id]
        console.log("newFiles___", newfiles, files)
        tabClose(id)
        setFiles(newfiles)
        saveFilesToStore(newfiles)
        if (getAutoSync()) {
          ipcRenderer.send("delete-file", { key: Path.basename.path(files[id].path) })
        }
      })
        .catch(() => {
          saveFilesToStore({})
        })
    }
  }

  const searchFiles = (keywords) => {
    const newFiles = filesArray.filter(file => file.title.includes(keywords))
    setSearchFilesList(newFiles)
  }

  const createFile = () => {
    const newID = uuidv4()
    const newFiles = {
      id: newID,
      title: "",
      body: "## please input markdown",
      createdAt: new Date().getTime(),
      isNew: true
    }
    setFiles({ ...files, [newID]: newFiles })
  }

  const onSaveFile = () => {
    if(Object.keys(activedFile).length > 0){
      const { path, body } = activedFile
      fileHelper.writeFile(path, body).then(() => {
        setUnSaveFileIDs(unsaveFileIDs.filter(id => id !== activeFileID))
        if (getAutoSync()) {
          ipcRenderer.send("uplaod-file", { key: `${Path.basename(path)}`, path })
        }
      })
    }
  }

  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: "选择需要导入的文件",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "MarkDown", extensions: ["md"] }
      ]
    }, (paths) => {
      if (Array.isArray(paths) && paths.length > 0) {
        // filter out the path, already have path in electron store
        const addNewFilesPath = paths.filter(path => {
          const alreadyPath = Object.values(files).find(file => {
            return file.path === path
          })
          return !alreadyPath
        })
        // extend the path array to an array contains files info
        const importFilesPathArr = addNewFilesPath.map(path => {
          return {
            id: uuidv4(),
            path,
            title: Path.basename(path, Path.extname(path)),
            createdAt: new Date().getTime()
          }
        })
        // flatten files array
        const newFiles = { ...files, ...flattenArray(importFilesPathArr) }
        // setState && update electron store
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      }
    })
  }

  const activeFilesUploaded = () => {
    console.log("uploaded-active-file")
    const { id } = activedFile
    // flatten files array
    const newFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: newFile }
    // setState && update electron store
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  const allFilesUploaded = () => {
    const newFiles = objectToArray(files).reduce((obj, file) => {
      const updatedAt = new Date().getTime()
      obj[file.id] = { ...files[file.id], isSynced: true, updatedAt }
      return obj
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  const filesDownload = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      console.log("download status:", message.status)
      if (message.status === "download-success") {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true }
      }
      const newFiles = { ...files, [id]: newFile }
      // setState && update electron store
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }

  useIpcRenderer({
    'create-file': createFile,
    'save-file': onSaveFile,
    'import-file': importFiles,
    'search-file': searchFiles,
    'file-uploaded': activeFilesUploaded,
    'all-files-uploaded': allFilesUploaded,
    'file-downloaded': filesDownload,
    'loading-status': (event, message) => { setLoading(message) },
  })
console.log("activedFile_____", activedFile)
  return (
    <div className="App container-fluid px-0">
      {loading ? <Loader /> : null}
      <div className="row no-gutters">
        <div className="col-4 left-panel">
          <Search
            title="我的云文档"
            onSearch={searchFiles}
            onSearchClose={onSearchClose}
          />
          <List
            files={filesListSource}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={editFile}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomButton
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onClick={createFile}
              />
            </div>
            <div className="col">
              <BottomButton
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className="col-8 right-panel">
          {
            !activeFileID &&
            <div className="block-page">
              选择或者创建新的 Markdown 文档
            </div>
          }
          {
            activeFileID &&
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unsaveFileIDs}
                onTabClick={tabActive}
                onCloseTab={tabClose}
              />
              <SimpleMDE
                key={activedFile && activedFile.id}
                value={activedFile && activedFile.body}
                onChange={(value) => { onChangeFile(activeFileID, value) }}
                options={{ minHeight: "515px" }}
              />
              {activedFile && activedFile.isSynced ? <span className="sync-status">已同步，上次同步{timeStampSerialize(activedFile.updatedAt)}</span> : null}
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
