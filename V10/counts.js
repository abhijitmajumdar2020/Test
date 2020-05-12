"use strict"
function loadSection(sectionName) {
    if (sectionName && params.sections[sectionName])
        sectionName = sectionName
    else
        sectionName = Object.keys(params.sections)[0];

    w3_close();
    d3.select("#loader").style("display", "block");
    d3.select("#footer").style("display", "none");

    for (const key in params.sections) {
        params.sections[key].data = [];
        removeCharts(key);
    }
    const $s = params.sections[sectionName];
    d3.csv($s.datasource, function (row) {
        //make sure the values are trimmed
        for (let key in row)
            if (typeof row[key] === "string") row[key] = row[key].trim();

        //fid dates //////////////////only required for demo
        row = fixDatesData(row);
        //create calculated columns
        if ($s.calculatedcols)
            for (let newcol in $s.calculatedcols)
                if (!row[newcol]) row[newcol] = $s.calculatedcols[newcol](row); //create nowcol only if doesnt exist
        $s.data.push(row);
    })
        .then(data => {
            d3.select("#loader").style("display", "none");
            d3.select("#footer").style("display", "block");
            initialiseCounter(sectionName);
            sortData($s.data, $s.charts.table.sortcols);
            countRecs(sectionName);
            createChartSpaces("#main", sectionName);
            //countRecs(sectionName);
            addChartsToDivs(sectionName);
            params.currentsection = sectionName;
        });
}

function sortTable(sectionName, col) {
    //check order
    const $s = params.sections[sectionName];
    if (!$s.charts.table.sortcols)
        $s.charts.table.sortcols = [col, -1];
    const sortcols = $s.charts.table.sortcols;
    if (col == sortcols[0]) //if same col then toggel the sort order
        sortcols[1] *= -1
    else { //else change sortcol
        sortcols[0] = col //if sortcols = [col,1] is used then it does not copy back to params!
        sortcols[1] = 1;
    }
    sortData($s.data, sortcols);
    filterChanged(sectionName, true);
}
function sortData(data, sortcols) {
    if (sortcols) {
        data.sort(
            (a, b) => {
                for (let i = 0; i < sortcols.length; i += 2) {
                    const sortOrder = sortcols[i + 1],
                        col = sortcols[i];
                    if (!a[col] == undefined) return 0;
                    if (a[col] > b[col]) return sortOrder;
                    if (a[col] < b[col]) return -sortOrder;
                }
                return 0;
            }
        )
    }
}
function initialiseCounter(sectionName) {
    const $s = params.sections[sectionName];
    //if ($s.sectiondata ) return;
    let $$ = new function () {
        this.charts = {};
        this.counts = {};
        this.filters = {};
        this.totalRecs = 0;
        this.filteredRec = 0;
    };

    $s.sectiondata = $$;
    $s.charts.bars.filters.forEach((e, i) => {
        if (!e.nofilter) $$.filters[e.col] = [];
        $$.charts[i] = {
            col: e.col,
            chart: null,
            type: null,
            title: e.title ? e.title :
                (e.measure ? `${e.measure.type} of ${e.measure.col}` : "Count") + ` by ${e.col}`,
            index: i
        };
        $$.counts[i] = {
            col: e.col,
            cats: e.values ? [...e.values] : [],
            counts: e.values ? [...e.values].fill(0) : [],//,[...e.values].fill(0),
            sums: e.values ? [...e.values].fill(0) : [],//,[...e.values].fill(0),[...e.values].fill(0),
            measure: e.measure,
            bin: e.bin,
        };
        if ($$.counts[i].bin == "auto") {
            $$.counts[i].bin = setAutoBins(sectionName, e.col);
            $$.counts[i].cats = [...$$.counts[i].bin.labels];
            $$.counts[i].counts = [...$$.counts[i].cats].fill(0);
        }
    });
}

function isFiltered(row, sectionName) {
    const filters = params.sections[sectionName].sectiondata.filters;
    for (const col in filters) {
        const f = filters[col];
        if (f.length > 0 && f.indexOf(row[col]) == -1)
            return false;
    }
    return true;
}
function slicerSelect(id) {
    const subStr = id.split("-"); // id = sectionName-filter-catIndex-valueIndex
    const sectionName = subStr[0],
        catIndex = subStr[2],
        //cat = subStr[2],
        parentId = subStr[0] + "-" + subStr[1] + "-" + subStr[2];
    //let filter = params.sections[sectionName].sectiondata.filters[cat];
    const cat = params.sections[sectionName].sectiondata.counts[catIndex].col;
    let filter = params.sections[sectionName].sectiondata.filters[cat];
    if (!filter) return;

    let checked = d3.select("#" + parentId).selectAll(".fa-check-square-o");

    const clickedItem = d3.select("#" + id).select("i");
    //can unslect all but the last one
    if (clickedItem.attr("class") == "fa fa-check-square-o" && checked.size() == 1) return;

    if (clickedItem.attr("class") == "fa fa-check-square-o") {
        clickedItem.attr("class", "fa fa-square-o");
    } else {
        clickedItem.attr("class", "fa fa-check-square-o");
    }
    const unCheckedItems = d3.select("#" + parentId).selectAll(".fa-square-o");
    filter.length = 0;
    if (unCheckedItems.size() > 0) {
        let checkedItems = d3.select("#" + parentId).selectAll(".fa-check-square-o");
        filter.length = 0;
        for (const node of checkedItems.nodes())
            filter.push(node.innerText.trim());
    }
    filterChanged(sectionName, true);
}
function syncMenusToFilter(sectionName) {
    const filters = params.sections[sectionName].sectiondata.filters;
    for (const cat in filters) {
        let catIndex;
        const counts = params.sections[sectionName].sectiondata.counts;
        for (const i in counts) 
            if (counts[i].col == cat) {
                catIndex = i;
                break;
            }
        const id = sectionName + "-filtercol-" + catIndex;
        const items = d3.select("#" + id).selectAll("a");

        for (const node of items.nodes()) {
            const value = node.innerText.trim();
            const el = d3.select("#" + node.id).select("i");
            if (filters[cat].length == 0)
                el.attr("class", "fa fa-check-square-o")
            else if (filters[cat].indexOf(value) != -1)
                el.attr("class", "fa fa-check-square-o")
            else
                el.attr("class", "fa fa-square-o");
        }
    }

}
// function showSlicer() {
//     var x = document.getElementById("slicer");
//     console.log("slicer", x);
//     if (x.className.indexOf("w3-show") == -1) {
//         x.className += " w3-show";
//     } else {
//         x.className = x.className.replace(" w3-show", "");
//     }
// }
//bin: {values: [] bins: []} | "week" | "month" | "year"
//sum|average: col >> if none then count, if both then sum
//where bin: [[values],[categories]] | bindate: "week"|"month"|"year", if both then bin
//instead of auto try numberX where x shows the precision 
function setAutoBins(sectionName, col, noOfBins = 5) {
    const data = params.sections[sectionName].data;
    let min = +data[0][col],
        max = +data[0][col],
        sum = 0,
        count = 0;
    sum = data.reduce((sum, currentRow) => {
        min = Math.min(+currentRow[col], min);
        max = Math.max(+currentRow[col], max);
        count++;
        sum += +currentRow[col];
        return sum;
    }, 0);
    const average = Math.round((sum / count));
    const delta = Math.round((max - min) / ((noOfBins)));
    let bins = [],
        labels = [`${min}-${delta}`];
    for (let i = 1; i < noOfBins; i++) {
        bins.push(delta * i);
        labels.push(`${delta * i}-${delta * (i + 1)}`)
    }
    return { bins, labels }
}

function getBinValue(bin, val) {
    const { bins, labels } = bin;
    let ascending = bins[1] > bins[0];
    for (let i = 0; i < bins.length; i++) {
        if ((ascending && (val < bins[i])) || (!ascending && val > bins[i]))
            return labels[i];
    }
    return labels[labels.length - 1];
}
function dateDiff(start, end) {
    let startDate = new Date(start),
        endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000));
}

function countRecs(sectionName) {
    const $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    $$.totalRecs = 0;
    $$.filteredRecs = 0;

    let createTable = $s.charts.table != undefined;

    //zero the counters
    for (let entry in $$.counts) {
        $$.counts[entry].counts.fill(0);
        $$.counts[entry].sums.fill(0);
    }

    for (let row of $s.data) {
        if (isActive(row, sectionName)) {
            $$.totalRecs++;
            if (isFiltered(row, sectionName)) {
                $$.filteredRecs++;
                if (createTable)
                    addToTable($$.filteredRecs, row, sectionName);
                for (let entry in $$.counts) {
                    const count = $$.counts[entry];
                    let cat = row[count.col];
                    if (count.bin) cat = getBinValue(count.bin, cat);

                    let index = count.cats.indexOf(cat);
                    if (index == -1) {
                        index = count.cats.push(cat) - 1;
                        count.counts[index] = 0;
                        count.sums[index] = 0;
                    }
                    count.counts[index]++;
                    if (count.measure)
                        count.sums[index] += +row[count.measure.col];
                }
            }
        }
    }
}
function removeCharts(sectionName) {
    function removeChart(chart) {
        if (chart) {
            if (chart.internal.api)
                chart = chart.destroy();
            chart = null;
        }
    }
    let $$ = params.sections[sectionName].sectiondata;
    if ($$) {
        for (let key in $$.charts)
            removeChart($$.charts[key].chart);
        removeChart($$.charts.trend.chart);
    }
}
function addChartsToDivs(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];

    for (let key in $$.charts) {
        const count = $$.counts[key];
        const data = [[...count.cats], [...count.sums]];
        $$.charts[key].chart = c3BarChart(sectionName + "-chart-" + key, data, onclickFunction);
        $$.charts[key].type = "filtered bars";
    }
    let trendData = createTrendData(sectionName);
    const i = $s.charts.bars.filters.length;
    $$.charts.trend = {
        chart: c3LineChart(sectionName + "-chart-" + i, trendData, null, $s.charts.trend.callouts),
        type: $s.charts.trend.type.style,
        index: i
    }
    filterChanged(sectionName, false);
}
function refrenshOnResize() {
    refreshAllCharts(params.currentsection);
}
function refreshAllCharts(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    for (let key in $$.charts) {
        if ($$.charts[key].type == "filtered bars") {
            const count = $$.counts[key];
            let values = count.measure ? [...count.sums] : [...count.counts];
            if (count.mesure)
                if (count.measure.type == "Average") {
                    values.forEach((v, i) => values[i] = Math.round(v / count.counts[i]))
                }

            const data = [[...count.cats], [...values]];
            c3RefreshChart($$.charts[key].chart, data, $$.filters[$$.charts[key].col], sectionName);
        } else {
            const trendData = createTrendData(sectionName);
            c3RefreshChart($$.charts[key].chart, trendData, null, sectionName);
        }
    }
}
function onclickFunction(cat, id) {
    let idParts = id.split("-");
    let sectionName = idParts[0];
    let $$ = params.sections[sectionName].sectiondata;
    // toggle the filter
    const filterValue = $$.counts[idParts[2]].col;
    if ($$.filters[filterValue] == undefined) return;
    const i = $$.filters[filterValue].indexOf(cat);
    if (i == -1)
        $$.filters[filterValue].push(cat)
    else
        $$.filters[filterValue].splice(i, 1)

    filterChanged(sectionName, true);
}
function resetFilter(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    for (let f in $$.filters)
        $$.filters[f] = [];
    filterChanged(sectionName, true);
}
function filterChanged(sectionName, recount) {
    syncMenusToFilter(sectionName);
    if (recount) countRecs(sectionName);
    //create the filter message
    let $$ = params.sections[sectionName].sectiondata,
        filterMessage = "";

    for (const f in $$.filters) {
        if ($$.filters[f].length > 0) {
            if (filterMessage != "")
                filterMessage += " & ";
            filterMessage = filterMessage + f + "=" + $$.filters[f].join("|");
        }
    }
    let backColor = filterMessage == "" ? "white" : "lightgrey"; d3.selectAll("." + sectionName)
        .style("background-color", backColor);

    let filterBar = document.getElementById(sectionName + "-filter-values");
    filterBar.innerHTML = filterMessage == "" ? "Filter: None" : "Filter: " + filterMessage;
    let percentRecs = Math.floor(100 * $$.filteredRecs / $$.totalRecs);
    refreshAllCharts(sectionName);
}


function isActive(row, sectionName) {
    const include = params.sections[sectionName].charts.bars.include;
    if (include)
        return include(row)
    else
        return true;
}
function copyTable(id) { ///external
    //create a tab delimited text
    const table = document.getElementById(id);
    let copyText = "";
    for (let row of table.rows) {
        for (let cell of row.cells)
            copyText += cell.innerText + "\t";
        copyText += "\n";
    }

    const temp = document.createElement("textarea");
    temp.value = copyText;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
}
function addDays(date, days) {
    d = new Date(date);
    d.setTime(d.getTime() + days * 86400000); //d.setDate(d.getDate() + days); doesnt work due to daylight saving
    return d.toISOString().slice(0, 10);
}
function createDateArray(arr, startDate, endDate) {
    let d = new Date(startDate),
        dateString = startDate;

    do {
        arr.push(dateString);
        d.setTime(d.getTime() + 86400000); //d.setDate(d.getDate() + days); doesnt work due to daylight saving
        dateString = d.toISOString().slice(0, 10);
    } while (dateString < endDate);
}

function getColor(sectionName, index = 0) {
    const colors = params.colors;
    if (index < 0)
        index = 0
    else if (index > colors.length - 1)
        index = colors.length - 1;
    index = colors.length - 1 - index;
    return colors[index];

}
function generteInsight(insights) {
    for (let i = 0; i < Math.min(4, insights.length); i++) {
        const div = d3.select("#insights-" + i);
        if (!div) break;
        div.html("")
            .classed("w3-leftbar w3-border-red w3-border-orange w3-border-green", false);
        if (insights[i].color != "none")
            div.classed("w3-leftbar w3-border-" + insights[i].color, true)

        div.style("text-align", "center");
        div.append("p")
            .attr("class", "w3-xxlarge")
            .text(insights[i].headline);
        div.append("p")
            .attr("class", "w3-tiny")
            .text(insights[i].message);
    }
}
function niceDateFormat(d) {
    const newdate = "" + new Date(d); //format: Fri Apr 24 2020 19:35:08 GMT+0100 (BST)
    return newdate.slice(4, 10);
}
/////////////////FOLLOWING REQUIRED ONLY FOR DEMO.  MOVES ALL DATES AS IF REPORT DATE IS TODAY////////////
function fixDates() {
    //console.log("done");
    const today = new Date();
    const daysToAdd = dateDiff(params.reportdate, today.toISOString().slice(0, 10));
    params["daysToAdd"] = daysToAdd;
    if (daysToAdd == 0) return;
    //note to self: cannot use JSON.stringify as it doesnt cov er the functions
    traverse(params);
}
function fixDatesData(row) {
    const daysToAdd = params["daysToAdd"];
    if (daysToAdd == 0) return;
    let datastr = JSON.stringify(row);
    const datepattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g; //pattern for date YYYY-MM-DD
    datastr = datastr.replace(datepattern, name => addDays(name, daysToAdd));
    return JSON.parse(datastr);
}

function traverse(x) {
    const datepattern = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g; //pattern for date YYYY-MM-DD
    function covertDate(x) {
        if (!x.search(datepattern)) {
            return x.replace(datepattern, name => addDays(name, params.daysToAdd));
        }
        else
            return x;
    }
    function traverseArray(arr) {
        arr.forEach(function (x, i) {
            if ((typeof x === 'string'))
                arr[i] = covertDate(x)
            else
                traverse(x);
        })
    }
    function traverseObject(o) {
        for (let key in o)
            if (o.hasOwnProperty(key)) {
                if ((typeof o[key] === 'string'))
                    o[key] = covertDate(o[key])
                else
                    traverse(o[key]);
            }
            else
                doNothing();//console.log("obj without hasOwnProperty: ", o);

    }
    function isObject(o) {
        return (typeof o === 'object') && (0 !== null)//Object.prototype.toString.call(o) === '[object Array]'
    }
    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]'
    }
    function doNothing() { }
    if (isArray(x))
        traverseArray(x)
    else if ((typeof x === 'object') && (x !== null))
        traverseObject(x);
    else
        doNothing();//console.log("object value is ", x); 
}


function addDays(oldDate, days) {
    let newDate = new Date(oldDate);
    if (newDate == "Invald Date") {
        console.log("invalid date in input", oldDate);
        return oldDate;
    }
    newDate.setDate(newDate.getDate() + days);
    return newDate.toISOString().slice(0, 10);
}