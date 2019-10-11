import React, { useState, useEffect, useRef } from "react"
import PropTypes from "prop-types"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileAlt, faEdit, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons"
import { findParentNode } from "../utils/helper"
import useKeyPress from "../hooks/useKeyPress"
import useContextMenu from "../hooks/useContextMenu"

// import Node module
const { remote } = window.require("electron")
const Menu = remote.Menu
const MenuItem = remote.MenuItem

const List = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState("")

    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    let node = useRef(null)
    const closeSearch = (editItem) => {
        setEditStatus(false)
        setValue("")
        if (editItem.isNew) onFileDelete(editItem.id)
    }

    const clickedItem = useContextMenu([
        {
            label: "open",
            click: () => {
                const targetNode = findParentNode(clickedItem.current, "list-group-item")
                if(targetNode){
                    onFileClick(targetNode.dataset.id)
                }
            }
        },
        {
            label: "rename",
            click: () => {
                console.log("rename")
            }
        },
        {
            label: "delete",
            click: () => {
                console.log("delete")
            }
        },
    ], ".file-list")

    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])

    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== "") {
            onSaveEdit(editItem.id, value, editItem.isNew)
            setEditStatus(false)
        }
        if (escPressed && editStatus) {
            closeSearch(editItem)
        }
    })

    useEffect(() => {
        if (editStatus) {
            node.current.focus()
        }
    }, [editStatus])

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                        className="list-group-item row bg-light d-flex align-items-center mx-0"
                        key={file.id}
                        data-id={file.id}
                        data-title={file.title}
                    >
                        {((file.id !== editStatus) && !file.isNew) &&
                            <>
                                <span
                                    className="col-2 c-link"
                                    onClick={() => { onFileClick(file.id) }}
                                >
                                    <FontAwesomeIcon size="lg" icon={faFileAlt} />
                                </span>
                                <span className="col-6">
                                    {file.title}
                                </span>
                                <button
                                    type="button"
                                    className="icon-button col-2"
                                    onClick={() => { setEditStatus(file.id); setValue(file.title) }}
                                >
                                    <FontAwesomeIcon size="lg" title="编辑" icon={faEdit} />
                                </button>
                                <button
                                    type="button"
                                    className="icon-button col-2"
                                    onClick={() => { onFileDelete(file.id) }}
                                >
                                    <FontAwesomeIcon size="lg" title="删除" icon={faTrash} />
                                </button>
                            </>
                        }
                        {((file.id === editStatus) || file.isNew) &&
                            <>
                                <input
                                    className="form-control col-10"
                                    value={value}
                                    ref={node}
                                    placeholder={"请输入文件名称"}
                                    onChange={e => { setValue(e.target.value) }}
                                />
                                <button
                                    type="button"
                                    className="icon-button col-2"
                                    onClick={() => closeSearch(file)}
                                >
                                    <FontAwesomeIcon size="lg" title="取消" icon={faTimes} />
                                </button>
                            </>

                        }
                    </li>
                ))
            }
        </ul>
    )
}

List.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onSaveEdit: PropTypes.func,
    onFileDelete: PropTypes.func
}

export default List