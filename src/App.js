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
import defaultListData from './utils/defaultListData'
import { flattenArray, objectToArray } from './utils/helper'
import fileHelper from './utils/fileHelper'

// import Node module
const Path = require('path')
const { remote } = require('electron')

function App() {
  const [files, setFiles] = useState(flattenArray(defaultListData))
  const [unsaveFileIDs, setUnSaveFileIDs] = useState([])
  const [openFileIDs, setOpenFileIDs] = useState([])
  const [activeFileID, setActiveFileID] = useState("")
  const [searchFilesList, setSearchFilesList] = useState([])

  const filesArray = objectToArray(files)
  // const fileStorageDirPath = Path.join(remote.app.)

  const fileClick = (fileID) => {
    setActiveFileID(fileID)
    if(!openFileIDs.includes(fileID)){
      setOpenFileIDs([ ...openFileIDs, fileID ])
    }
  }

  const tabActive = (fileID) => {
    setActiveFileID(fileID)
  }

  const tabClose = (fileID) => {
    let newFiles = []
    if(openFileIDs.includes(fileID)){
      newFiles = openFileIDs.filter(id => id !== fileID)
      setOpenFileIDs(newFiles)
    }

    if(newFiles.length > 0){
      if(fileID === activeFileID){
        setActiveFileID(newFiles[0])
      }
    }else{
      setActiveFileID("")
    }
  }

  const onChangeFile = (id, value) => {
    if(!unsaveFileIDs.includes(id)){
      setUnSaveFileIDs([ ...unsaveFileIDs, id ])
    }
    const newFile = { ...files[id], body: value}
    setFiles({ ...files, [id]: newFile})
  }

  const editFile = (id, value) => {
    if(file[id].isNew){
      // create file
      fileHelper.writeFile(join())
    }else{
      // update file name
    }
    const newFile = { ...files[id], title: value, isNew: false}
    

    setFiles({ ...files, [id]: newFile })
  }

  const deleteFile = (fileID) => {
    delete files[fileID]
    setFiles(files)
    tabClose(fileID)
  }

  const searchFiles = (keywords) => {
    const newFiles = filesArray.filter(file => file.title.includes(keywords))
    setSearchFilesList(newFiles)
  }

  const createFile = () => {
    const newID = uuidv4()
    const newFiles =  {
      id: newID,
      title: "",
      body: "## please input markdown",
      createdAt: new Date().getTime(),
      isNew: true
    }
    setFiles({ ...files, [newID]: newFiles })
  }

  const onSearchClose = () => setSearchFilesList([])

  const activedFile = files[activeFileID]
  const openedFiles = openFileIDs.map(openID => files[openID])

  const filesListSource = (searchFilesList.length > 0)?searchFilesList: filesArray
  return (
    <div className="App container-fluid px-0">
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
                onChange={(value) => { onChangeFile( activeFileID, value ) }}
                options={{ minHeight: "515px" }}
              />
            </>
          }

        </div>
      </div>
    </div>
  );
}

export default App;
