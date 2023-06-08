
'use strict'
////////////////////////////////////////////////////
// {
//  col1: {
//      value1: {
//          include: true|false, 
//          type: count|sum, 
//          totqaValue: value if sum, 
//          filteredValue: value if sum
//          totalCount: count, 
//          filteredCount: count
//      }
//      value2: {...},
//      ....
//     }
//  col2: ...
// }
/////////////////////////////////////////////////////
var $c = (function () {
    var $ = {};// public object - returned at end of module
    $.processCSVFile = function (file, filter) {
        function zeroiseCounters(allCounts) {
            for (const value of Object.values(allCounts))
                for (const v of Object.values(value)) {
                    v.totalSum = 0
                    v.filteredSum = 0
                    v.totalCount = 0
                    v.filteredCount = 0
                }
        }
        var rowCount = 0,
            allCounts = {}
        if (filter !== undefined) {
            allCounts = JSON.parse(JSON.stringify(filter))
            zeroiseCounters(allCounts)
        }
        //console.log(allCounts)  
        return new Promise((resolve) => {
            Papa.parse(file, {
                download: true,
                header: true,
                step: function (row) {
                    rowCount++
                    if (rowCount == 1) $p.autoCreateConfig(row)
                    countRecords(rowCount, row, allCounts, filter)
                },
                complete: function () {
                    //console.log(`All done! ${rowCount} rows processed`)
                    resolve(allCounts)
                }
            })
        })
    }

    function countRecords(rowCount, row, allCounts, filter) {
        function createDefault(countType, sortkey) {
            return {
                include: true,          // true mean include in counts
                countType: countType,   // can be "sum" or "ave"
                totalSum: 0,            // if sum/ave then sum without filter
                filteredSum: 0,         // if sum/ave then sum when filtered
                totalCount: 0,          // count without filter
                filteredCount: 0,       // count when filtered
                sortkey: sortkey,
            }

        }
        function getValueFromCol(col) {
            let returnValue = row.data[col]
            if (!returnValue) return 0
            if (isNaN(returnValue)) return 0
            return parseFloat(returnValue)
        }
        function sumIt(countType) {
            if (countType == "Average") return true
            if (countType == "Sum") return true
            return false
        }
        //if (rowCount < 3) console.log(`row number: ${rowCount}`, row.data)

        // transform the row if required
        let transformedRow = $p.transformRow(row.data)


        for (const [key, value] of Object.entries(transformedRow)) {

            if (!allCounts[key]) allCounts[key] = {}
            const oneCount = allCounts[key]
            const { countType, colOver } = $p.getColProperties(key)

            let v = value.formatedValue
            if (!oneCount[v]) {
                if (Object.keys(oneCount).length < 30)
                    oneCount[v] = createDefault(countType, value.unFormatedValue)
                else {
                    v = "..."
                    //console.log("before", check(allCounts[key]))
                    if (!oneCount[v])
                        oneCount[v] = createDefault("...")
                    transformedRow[key] = { formatedValue: v, unFormatedValue: v }
                }
            }

            oneCount[v].totalCount++
            if (sumIt(countType))
                oneCount[v].totalSum += getValueFromCol(colOver)
        }

        // update filtered counts 
        let includeInCount = true

        for (const [key, value] of Object.entries(transformedRow))
            if (!allCounts[key][value.formatedValue].include) {
                //if (rowCount == 1) console.log(key, value.formatedValue, allCounts[key][value.formatedValue])
                includeInCount = false
                break
            }

        if (includeInCount)
            for (const [key, value] of Object.entries(transformedRow)) {
                allCounts[key][value.formatedValue].filteredCount++
                const { countType, colOver } = $p.getColProperties(key)
                if (sumIt(countType))
                    allCounts[key][value.formatedValue].filteredSum += getValueFromCol(colOver)
            }
    }
    return $
})()

// function xprocessCSVFile(file, filter) {
//     function zeriseCounters(allCounts) {
//         for (const value of Object.values(allCounts))
//             for (const v of Object.values(value)) {
//                 v.totalSum = 0
//                 v.filteredSum = 0
//                 v.totalCount = 0
//                 v.filteredCount = 0
//             }
//     }
//     var rowCount = 0,
//         allCounts = {}
//     if (filter !== undefined) {
//         allCounts = JSON.parse(JSON.stringify(filter))
//         zeriseCounters(allCounts)
//     }
//     //console.log(allCounts)  
//     return new Promise((resolve) => {
//         Papa.parse(file, {
//             download: true,
//             header: true,
//             step: function (row) {
//                 rowCount++
//                 if (rowCount == 1) $p.autoCreateConfig(row)
//                 countRecords(rowCount, row, allCounts, filter)
//             },
//             complete: function () {
//                 //console.log(`All done! ${rowCount} rows processed`)
//                 resolve(allCounts)
//             }
//         })
//     })
// }


// function xcountRecords(rowCount, row, allCounts, filter) {
//     function createDefault(countType, sortkey) {
//         return {
//             include: true,          // true mean include in counts
//             countType: countType,   // can be "sum" or "ave"
//             totalSum: 0,            // if sum/ave then sum without filter
//             filteredSum: 0,         // if sum/ave then sum when filtered
//             totalCount: 0,          // count without filter
//             filteredCount: 0,       // count when filtered
//             sortkey: sortkey,
//         }

//     }
//     function getValueFromCol(col) {
//         let returnValue = row.data[col]
//         if (!returnValue) return 0
//         if (isNaN(returnValue)) return 0
//         return parseFloat(returnValue)
//     }
//     //if (rowCount < 3) console.log(`row number: ${rowCount}`, row.data)

//     // transform the row if required
//     let transformedRow = $p.transformRow(row.data)


//     for (const [key, value] of Object.entries(transformedRow)) {

//         if (!allCounts[key]) allCounts[key] = {}
//         const oneCount = allCounts[key]
//         const { countType, colOver } = $p.getColProperties(key)

//         let v = value.formatedValue
//         if (!oneCount[v]) {
//             if (Object.keys(oneCount).length < 30)
//                 oneCount[v] = createDefault(countType, value.unFormatedValue)
//             else {
//                 v = "..."
//                 //console.log("before", check(allCounts[key]))
//                 if (!oneCount[v])
//                     oneCount[v] = createDefault("...")
//                 transformedRow[key] = { formatedValue: v, unFormatedValue: v }
//             }
//         }

//         oneCount[v].totalCount++


//         if (countType != "Count")
//             oneCount[v].totalSum += getValueFromCol(colOver)
//     }

//     // update filtered counts 
//     let includeInCount = true

//     for (const [key, value] of Object.entries(transformedRow))
//         if (!allCounts[key][value.formatedValue].include) {
//             //if (rowCount == 1) console.log(key, value.formatedValue, allCounts[key][value.formatedValue])
//             includeInCount = false
//             break
//         }

//     if (includeInCount)
//         for (const [key, value] of Object.entries(transformedRow)) {
//             allCounts[key][value.formatedValue].filteredCount++
//             const { countType, colOver } = $p.getColProperties(key)
//             if (countType != "Count")
//                 allCounts[key][value.formatedValue].filteredSum += getValueFromCol(colOver)
//         }
// }