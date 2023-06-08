'use strict'
var $p = (function () {
    var $ = {};// public object - returned at end of module
    const demoDate = '2023-04-25'
    let config = {
        //maxXValues: 30,
        //reportDate: "2023-04-25",
        //reportTitle: "Metrics for 25-Apr-2023",
        // cols: [
        //     {
        //         col: "CREATE DATE",
        //         title: "Count by Create Date",
        //         type: "MMM-YY",
        //         //max,
        //         //min
        //     },
        //     {
        //         col: "STATUS",
        //         title: "Count by Status",
        //         order: "descending",
        //         type: "String"
        //     },
        //     {
        //         col: "PRIORITY",
        //         title: "Count by Priority",
        //         type: "String"
        //     },
        //     {
        //         col: "GEORAPHY",
        //         title: "Count by Geog",
        //         type: "String",
        //         order: ["US", "Europe", "Asia"], //foreces the order can be "asceding" or "desceding"
        //     },
        //     {
        //         col: "CREATE DATE",
        //         title: "Count by Create Day",
        //         type: "DDD",
        //         //max,
        //         //min
        //     },
        //     {
        //         col: "AGE",
        //         title: "Count by Age",
        //         type: "Number",
        //         bins: [10, 50, 100, 200],
        //     },
        //     {
        //         col: "CLOSE DATE",
        //         title: "Count by Close Date",
        //         type: "MMM-YY",
        //     },
        // ]
    }
    function binnedValues(v, bin) {
        const binIndex = bin.findIndex((e => e >= v))
        if (binIndex == -1) {
            return {
                formatedValue: ">",
                unFormatedValue: bin[bin.length - 1] + 1
            }
        }
        if (binIndex == 0) {
            return {
                formatedValue: "<" + bin[0],
                unFormatedValue: bin[0] + 0
            }
        }
        return {
            formatedValue: bin[binIndex - 1] + "-" + bin[binIndex],
            unFormatedValue: bin[binIndex] + 0
        }
    }
    $.testbin = function (bin) {
        x = []
        bin.forEach(v => x.push(binnedValues(v, bin)))
        return x
    }
    function transformCol(type, value, bin, row) {
        function invalidValues() {
            return { formatedValue: "?", unFormatedValue: "?" }
        }
        // function xbinnedValues(v) {
        //     const binIndex = bin.findIndex((e => e >= v))
        //     if (binIndex == -1) {
        //         return {
        //             formatedValue: ">",
        //             unFormatedValue: bin[bin.length - 1] + 1
        //         }
        //     }
        //     if (binIndex == 0) {
        //         return {
        //             formatedValue: "<" + bin[0],
        //             unFormatedValue: bin[0] + 0
        //         }
        //     }
        //     return {
        //         formatedValue: bin[binIndex - 1] + "-" + bin[binIndex],
        //         unFormatedValue: bin[binIndex] + 0
        //     }
        // }
        const dateFormats = ["YYYY", "MMM-YY", "MMM", "DDD", "DD"]
        const d = new Date(value)
        if (dateFormats.includes(type))
            if (d.toString() == 'Invalid Date')
                return invalidValues()

        let formatedValue = value
        let unFormatedValue = value
        switch (type) {
            case "YYYY":
                formatedValue = d.getFullYear()
                unFormatedValue = formatedValue
                break
            case "MMM-YY":
                formatedValue = d.toString().slice(4, 7) + "-" + d.toString().slice(13, 15)
                unFormatedValue = d
                break
            case "DD":

                formatedValue = d.getDate()
                unFormatedValue = formatedValue + 0
                break
            case "DDD":
                unFormatedValue = d.getDay()
                formatedValue = d.toString().slice(0, 3)
                break
            case "MMM":
                unFormatedValue = d.getMonth()
                formatedValue = d.toString().slice(4, 7)
                break
            case "Number":
                if (isNaN(value)) return invalidValues()

                if (bin && Array.isArray(bin))
                    return binnedValues(parseFloat(value), bin)
                else {
                    formatedValue = parseFloat(value, 10)
                    unFormatedValue = formatedValue
                }
                break
            case "Risk":
                let likelyhood = row["Likelihood"] || "?"
                unFormatedValue = likelyhood.toString() + value.toString()
                formatedValue = unFormatedValue
                break
            case "String":
                break
            default:
                return invalidValues()
        }
        return { formatedValue, unFormatedValue }
    }
    $.transformRow = function (row) {
        let transformedRow = {}
        config.cols.forEach((e, i) => {
            transformedRow[i] = transformCol(e.type, row[e.col], e.bins, row)
        })
        return transformedRow
    }

    $.transformDataAndLabels = function (i, dataIn) {
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
        function appendToEnd(keys) {
            keys.forEach(key => {
                if (specials[key])
                    sortedCounts.push({
                        cat: key,
                        value: specials[key],
                    })
            })
        }

        function getOrderedValues(type) {
            switch (type) {
                // case "YYYY":
                //     return []
                // case "MMM-YY":
                //     return []
                case "DD":
                    const DD = []
                    for (i = 1; i++; i <= 31) DD.push(i)
                    return DD
                case "DDD":
                    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                case "MMM":
                    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                // case "Number":
                //     return []
                // case "String":
                //     return []
                default:
                    return []
            }
        }
        function getDisplayValue(countType, sum, count) {

            if (countType == "Sum") return sum
            if (countType == "Average")
                if (count > 0)
                    return (sum / count).toFixed(1)
                else
                    return 0
            return count
        }

        const { countType, type, order } = config.cols[i]
        let orderedValue = []

        if (order)
            orderedValue = order
        else
            orderedValue = getOrderedValues(type)


        // order.forEach(v => {
        //     orderedCounts.push({
        //         cat: col,
        //         value: displayValue,
        //         sortkey: value.sortkey
        //     })
        // })



        let counts = [], specials = {}, orderedCounts = []

        orderedValue.forEach(v => orderedCounts.push({ cat: v, value: 0 }))

        for (const [col, value] of Object.entries(dataIn)) {
            const displayValue = getDisplayValue(countType, value.filteredSum, value.filteredCount)
            if (col == "..." || col == "?")
                specials[col] = displayValue
            else {
                const i = orderedCounts.findIndex(v => v.cat == col)
                if (i == -1) //not in order
                    counts.push({
                        cat: col,
                        value: displayValue,
                        sortkey: value.sortkey
                    })
                else
                    orderedCounts[i].value = displayValue
            }
        }
        //if date type then insert all values and add a sort value

        let sortedCounts = sortArrayOfObjects(counts, "sortkey");

        appendToEnd(["...", "?"])
        orderedCounts.toReversed().forEach(v => {
            sortedCounts.unshift(v)
        })



        let labels = [], data = []
        sortedCounts.forEach(e => { labels.push(e.cat); data.push(e.value) })

        return { labels, data }

    }

    $.getColProperties = function (index) {
        return config.cols[index]
    }

    $.setColProperties = function (index, newValues) {
        let updated = false
        const col = config.cols[index]
        for (const [key, value] of Object.entries(newValues)) {
            if (col[key] != value) {
                col[key] = value
                updated = true
            }
        }
        if (updated)
            if (col.type == "Number")
                col.order = setOrder(col)

        return updated
    }

    $.createCol = function (data) {
        config.cols.push(data)
    }
    function setOrder(col) {
        if (col.type != "Number") return
        if (!col.bins) {
            return []
        }
        let binValues = []
        binValues.push("<" + col.bins[0])
        col.bins.forEach((v, i) => { if (i > 0) binValues.push(col.bins[i - 1] + "-" + v) })
        return binValues
    }
    $.autoCreateConfig = function (row) {
        function type(value) {
            if (value == "") return "String"
            if (!isNaN(value)) return "Number"
            const d = new Date(value)
            if (d != "Invalid Date") return "MMM"
            return "String"
        }

        if (config.cols) return

        const autoCols = []
        for (const [colName, value] of Object.entries(row.data)) {

            let col = {
                col: colName,
                title: "Count by " + colName,
                type: type(value),
                countType: "Count",
                chartType: "bar"
            }
            col.autoType = col.type
            if (col.type == "Number") {
                col.bins = [10, 100, 500, 1000]
                col.order = setOrder(col)
            }

            autoCols.push(col)

        }
        const d = demoDate ? new Date(demoDate) : new Date()

        config.reportDate = d.toISOString().substring(0, 10)
        config.reportTitle = 'Auto-generated Metrics'
        config.maxValues = 30
        config.cols = autoCols
        config.colNames = []
        autoCols.forEach(v => config.colNames.push(v.col))
    }

    $.convertDemodDate = function (date) {
        if (!demoDate)
            return date
        else
            return date + Date() - demoDate

    }

    $.removeCol = function (index) {
        if (!config.cols) return false

        let newCols = [], updated = false

        config.cols.forEach((v, i) => {
            if (i == index)
                updated = true
            else
                newCols.push(v)
        })

        if (updated) config.cols = newCols

        return updated

    }
    $.copyCol = function (index) {
        if (!config.cols) return false

        let newCols = [], updated = false

        config.cols.forEach((v, i) => {
            newCols.push(v)
            if (i == index) {
                updated = true
                newCols.push(v)
            }
        })

        if (updated) config.cols = newCols

        return updated

    }
    // $.getAllCols = function () {
    //     let allCols = []

    //     if (!config.cols) return []
    //     config.cols.forEach(v => {
    //         if (v.type != "Hide")
    //             allCols.push({
    //                 key: v.col,
    //                 type: v.type
    //             })
    //     })
    //     return allCols
    // }
    $.getConfig = function () {
        let configWithoutCols = {}
        for (const [key, value] of Object.entries(config)) {
            if (key != "cols") configWithoutCols[key] = value
        }

        return configWithoutCols
    }

    $.setConfig = function (newConfig) {

        const { reportTitle, reportDate } = newConfig

        if (reportTitle)
            if (config.reportTitle != reportTitle) config.reportTitle = reportTitle


        if (reportDate)
            if (config.reportDate != reportDate) config.reportDate = reportDate

        return true
    }

    $.getChartSequence = function () {
        let currentSequence = []
        config.cols.forEach((v, i) => currentSequence.push(i + 1))
        return currentSequence
    }

    $.setChartSequence = function (newSequence) {
        console.log(newSequence)
        if (!newSequence) return false
        if (!Array.isArray(newSequence)) return false
        //if (newSequence.length != config.cols.length) return false

        let update = true

        let newCols = []
        newSequence.forEach(v => {
            if (isNaN(v)) update = false
            const i = parseInt(v) - 1
            if (!config.cols[i]) update = false
            if (update) newCols.push(config.cols[i])
        })

        if (update) config.cols = newCols

        return update
    }

    return $; // expose externally
}());