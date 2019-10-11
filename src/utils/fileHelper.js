const fsPromises = window.require('fs').promises;

const fileHelper = {
    readFile: (path) => {
        return fsPromises.readFile(path)
    },
    writeFile: (path, content) => {
        return fsPromises.writeFile(path, content)
    },
    deleteFile: (path) => {
        return fsPromises.unlink(path)
    },
    renameFile: (oldPath, newPath) => {
        return fsPromises.rename(oldPath, newPath)
    }
}

export default fileHelper

