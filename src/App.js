import React from 'react'
import { faPlus, faFileImport } from "@fortawesome/free-solid-svg-icons"
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import Search from './components/Search'
import List from './components/List'
import BottomButton from './components/BottomButton'
import TabList from './components/TabList'
import defaultListData from './utils/defaultListData'

function App() {
  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-4 left-panel">
          <Search 
            title="我的云文档"
            onSearch={value => {
              alert(value)
            }}
          />
          <List
            files={defaultListData}
            onFileClick={id => {console.log(id)}}
            onFileDelete={id => {console.log("deleting",id)}}
            onSaveEdit={(id, value)=> {
              console.log("on save id:", id, "; title:", value)
            }}
          />
          <div className="row no-gutters">
            <div className="col">
              <BottomButton 
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
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
          <TabList 
            files={defaultListData}
            activeId={1}
            onTabClick={(id) => { console.log(id) }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
