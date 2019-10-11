export const flattenArray = (array) => {
    return array.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

export const objectToArray = (obj) => {
    return Object.keys(obj).map(key => obj[key])
}