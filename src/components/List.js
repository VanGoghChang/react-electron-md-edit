import React, { useState, useEffect, useRef } from "react"
import PropTypes from "prop-types"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileAlt, faEdit, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons"
import useKeyPress from "../hooks/useKeyPress"

const List = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState("")

    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const closeSearch = () => {
        setEditStatus(false)
        setValue("")
    }

    useEffect(() => {
        if (enterPressed && editStatus) {
            const editItem = files.find(file => file.id === editStatus)
            onSaveEdit(editItem.id, value)
            setEditStatus(false)
        }

        if (escPressed && editStatus) {
            closeSearch()
        }
    })

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                        className="list-group-item row bg-light d-flex align-items-center"
                        key={file.id}
                    >
                        {(file.id !== editStatus) &&
                            <>
                                <span
                                    className="col-2 c-link"
                                    onClick={() => { onFileClick(file.id) }}
                                >
                                    <FontAwesomeIcon size="lg" icon={faFileAlt} />
                                </span>
                                <span className="col-7">
                                    {file.title}
                                </span>
                                <button
                                    type="button"
                                    className="icon-button col-1"
                                    onClick={() => { setEditStatus(file.id); setValue(file.title) }}
                                >
                                    <FontAwesomeIcon size="lg" title="编辑" icon={faEdit} />
                                </button>
                                <button
                                    type="button"
                                    className="icon-button col-1"
                                    onClick={() => { onFileDelete(file.id) }}
                                >
                                    <FontAwesomeIcon size="lg" title="删除" icon={faTrash} />
                                </button>
                            </>
                        }
                        {(file.id === editStatus) &&
                            <>
                                <input
                                    className="form-control col-10"
                                    value={value}
                                    // ref={node}
                                    onChange={e => { setValue(e.target.value) }}
                                />
                                <button
                                    type="button"
                                    className="icon-button col-2"
                                    onClick={closeSearch}
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
    onFileDelete: PropTypes
}

export default List