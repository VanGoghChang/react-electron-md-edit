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

function App() {

  const [files, setFiles] = useState(defaultListData)
  const [unsaveFileIDs, setUnSaveFileIDs] = useState([])
  const [openFileIDs, setOpenFileIDs] = useState([])
  const [activeFileID, setActiveFileID] = useState("")
  const [searchFilesList, setSearchFilesList] = useState([])

  const openedFiles = openFileIDs.map(openID => {
    return files.find(file => openID === file.id)
  })

  const activedFile = files.find(file => activeFileID === file.id)

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
    const newFiles = files.map(file => {
      if(file.id === id){
          file["body"] = value
      }
      return file
    })
    setFiles(newFiles)
  }

  const deleteFile = (fileID) => {
    const newFiles = files.filter(file => file.id !== fileID)
    setFiles(newFiles)

    tabClose(fileID)
  }

  const editFile = (id, value) => {
    const newFiles = files.map(file => {
      if(file.id === id){
          file["title"] = value
          file["isNew"] = false
      }
      return file
    })
    setFiles(newFiles)
  }

  const searchFiles = (keywords) => {
    const newFiles = files.filter(file => file.title.includes(keywords))
    setSearchFilesList(newFiles)
  }

  const createFile = () => {
    const newFiles = [ ...files, {
      id: uuidv4(),
      title: "",
      body: "## please input markdown",
      createdAt: new Date().getTime(),
      isNew: true
    }]

    setFiles(newFiles)
  }

  const onSearchClose = () => setSearchFilesList([])

  const filesListSource = (searchFilesList.length > 0)?searchFilesList: files
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
