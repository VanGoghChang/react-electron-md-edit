export const flattenArray = (array) => {
    return array.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

export const objectToArray = (obj) => {
    return Object.keys(obj).map(key => obj[key])
}

export const findParentNode = (node, parentClassName) => {
    let current = node
    while(current !== null){
        console.log(current.classList)
        if(current.classList.contains(parentClassName)){
            return current
        }
        current = current.parentNode
    }
    return false
}