export const flattenArray = (array) => {
    return array.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

export const objectToArray = (object) => {
    console.log("Object__:", object)
    return Object.keys(object).map(key => object[key])
}