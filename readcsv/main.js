
'use strict'
function processCSVFile(file, filter) {

    var rowCount = 0,
        allCounts = {}
    if (filter !== undefined) {
        allCounts = JSON.parse(JSON.stringify(filter))

        //zerosie the counters

        for (const [key, value] of Object.entries(allCounts)) {
            for (const [k, v] of Object.entries(value)) {
                // console.log(v)
                v.totalSum = 0
                v.filteredSum = 0
                v.totalCount = 0
                v.filteredCount = 0
            }
        }
    }
    //console.log(allCounts)  
    return new Promise((resolve) => {
        Papa.parse(file, {
            download: true,
            header: true,
            step: function (row) {
                rowCount++
                countRecords(rowCount, row, allCounts, filter)
            },
            complete: function () {
                //console.log(`All done! ${rowCount} rows processed`)
                resolve(allCounts)
            }
        })
    })
}

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
function countRecords(rowCount, row, allCounts, filter) {
    function createDefault() {
        return {
            include: true,      // true mean include in counts
            type: "count",      // can be "sum" or "ave"
            totalSum: 0,        // if sum/ave then sum without filter
            filteredSum: 0,     // if sum/ave then sum when filtered
            totalCount: 0,      // count without filter
            filteredCount: 0    // count when filtered
        }

    }
    //if (rowCount < 3) console.log(`row number: ${rowCount}`, row.data)

    // transform the row if required
    let transformedRow = transformRow(row.data)

    for (const [key, value] of Object.entries(transformedRow)) {

        if (!allCounts[key]) allCounts[key] = {}
        let v = value
        if (!allCounts[key][value]) {
            if (Object.keys(allCounts[key]).length < 30)
                allCounts[key][value] = createDefault()
            else {
                v = "..."
                if (!allCounts[key][v])
                    allCounts[key][v] = createDefault()
            }
        }
        if (v == "...") transformedRow[key] = v
        allCounts[key][v].totalCount++
    }

    // update filtered counts 
    let includeInCount = true

    for (const [key, value] of Object.entries(transformedRow)) {
        //console.log(101, key, value)
        // console.log(allCounts[key][value])
        includeInCount = allCounts[key][value].include
        if (!includeInCount) break
    }

    if (includeInCount)
        for (const [key, value] of Object.entries(transformedRow))
            allCounts[key][value].filteredCount++
}