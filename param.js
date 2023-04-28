'use strict'
const param = {
    maxXValues: 30,
    reportDate: "2023-04-25",
    reportTitle: "Metrics for 25-Apr-2023",
    cols: [
        {
            col: "CREATE DATE",
            title: "Count by Create Date", //defaults to col
            type: "MMM-YY", //DD, DDD, MMM, MM-YY, MMM-YY, YYYY
            //max,
            //min
        },
        {
            col: "STATUS",
            order: "descending",
        },
        { col: "PRIORITY" },
        {
            col: "GEORAPHY",
            order: ["US", "Europe", "Asia"], //foreces the order can be "asceding" or "desceding"
        },
        {
            col: "CREATE DATE",
            title: "Count by Create Day", //defaults to col
            type: "DDD" //DD, DDD, MMM, MM-YY, MMM-YY, YYYY
            //max,
            //min
        },
        {
            col: "X", //does not exist
        },
    ]
}


const daysDDD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const monthsMMM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function transformCol(type, value, transformType = "format") {
    let formatValue = value
    let unFormatValue = value
    switch (type) {
        case "YYYY":
            if (transformType == "format")
                formatValue = value.slice(0, 4) //date is "yyyy-mm-dd"
            else
                unFormatValue = value
            break
        case "MMM-YY":
            if (transformType == "format")
                formatValue = monthsMMM[+value.slice(5, 7)] + "-" + value.slice(2, 4)
            else {

                const MM = monthsMMM.findIndex(v => v == value.slice(0, 3))
                let MMString = MM.toString()
                if (MMString.length == 1) MMString = "0" + MMString
                unFormatValue = value.slice(4, 6) + MMString
            }
            break
        case "DD":
            if (transformType == "format")
                formatValue = value.slice(8, 10)
            else
                unFormatValue = value
            break
        case "DDD":
            if (transformType == "format") {
                const d = new Date(value)
                formatValue = daysDDD[+d.getDay()]
            }
            else
                unFormatValue = daysDDD.findIndex(v => v == value)
            break
        case "MMM":
            if (transformType == "format")
                formatValue = monthsMMM[+value.slice(5, 7)]
            else
                unFormatValue = monthsMMM.findIndex(v => v == value)
            break
        default:
            break
    }
    if (transformType == "format")
        return formatValue
    else
        return unFormatValue
}
function transformRow(row) {
    let transformedRow = {}
    param.cols.forEach((e, i) => {
        transformedRow[i] = transformCol(e.type, row[e.col])
    })
    return transformedRow
}
function getTitle(i) {
    return param.cols[i].title ?? param.cols[i].col
}
function getReportTitle() {
    return param.reportTitle ?? "Title not provided"
}
const sortArrayOfObjects = (arr, propertyName, order = 'a') => {
    const sortedArr = arr.sort((a, b) => {
        if (a[propertyName] < b[propertyName]) {
            return -1;
        }
        if (a[propertyName] > b[propertyName]) {
            return 1;
        }
        return 0;
    });

    if (order === 'd') {
        return sortedArr.reverse();
    }

    return sortedArr;
};



function transformDataLabels(i, dataIn) {
    const type = param.cols[i].type
    let counts = []
    for (const [col, value] of Object.entries(dataIn))
        counts.push({ cat: col, value: value.filteredCount, sortkey: transformCol(type, col, "unformat") })

    //if date type then insert all values and add a sort value


    const sortedCounts = sortArrayOfObjects(counts, "sortkey");

    let labels = [], data = []
    sortedCounts.forEach(e => { labels.push(e.cat); data.push(e.value) })
    return { labels, data }

}