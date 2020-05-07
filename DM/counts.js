"use strict"
function loadSection(sectionName) {
    const $s = params.sections[sectionName];
    w3_close();
    d3.select("#loader").style("display", "block");
    d3.select("#footer").style("display", "none");

    for (const key in params.sections)
        params.sections[key].data = [];

    d3.csv($s.datasource, function (row) {
        //make sure the values are trimmed
        for (let key in row)
            if (typeof row[key] === "string") row[key] = row[key].trim();

        ///////////////////only required for demo
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
            sortData($s.data, $s.charts.table.sortcols);
            createChartSpaces("#main", sectionName);
            countRecs(sectionName);
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
    let $$ = new function () {
        this.charts = {};
        this.counts = {};
        this.filters = {};
        this.totalRecs = 0;
        this.filteredRec = 0;
    };
    const $s = params.sections[sectionName];
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
            cats: [...e.values],
            counts: [...e.values].fill(0),
            sums: [...e.values].fill(0),
            measure: e.measure,
            bin: e.bin,
        };
        if ($$.counts[i].bin == "auto") {
            $$.counts[i].bin = setAutoBins(sectionName, e.col);
            $$.counts[i].cats = [...$$.counts[i].bin.labels];
            $$.counts[i].counts= [...$$.counts[i].cats].fill(0);
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
//bin: {values: [] bins: []} | "week" | "month" | "year"
//sum|average: col >> if none then count, if both then sum
//where bin: [[values],[categories]] | bindate: "week"|"month"|"year", if both then bin
//instead of auto try numberX where x shows the precision 
function setAutoBins(sectionName, col, noOfBins = 5) {
    const data = params.sections[sectionName].data;
    var min = +data[0][col],
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
    var ascending = bins[1] > bins[0];
    for (var i = 0; i < bins.length; i++) {
        if ((ascending && (val < bins[i])) || (!ascending && val > bins[i]))
            return labels[i];
    }
    return labels[labels.length - 1];
}
function dateDiff(start, end) {
    var startDate = new Date(start),
        endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000));
}

function countRecs(sectionName) {
    const $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    $$.totalRecs = 0;
    $$.filteredRecs = 0;

    var createTable = $s.charts.table != undefined;

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
    var backColor = filterMessage == "" ? "white" : "lightgrey"; d3.selectAll("." + sectionName)
        .style("background-color", backColor);

    var filterBar = document.getElementById(sectionName + "-filter-values");
    filterBar.innerHTML = filterMessage == "" ? "No filter" : "Filter: " + filterMessage;
    var percentRecs = Math.floor(100 * $$.filteredRecs / $$.totalRecs);
    refreshAllCharts(sectionName);
}

function createTrendData(sectionName) {
    switch (params.sections[sectionName].charts.trend.type.style) {
        case "test":
            return createTrendDataTest(sectionName)
        case "defect":
            return createTrendDataDefect(sectionName)
        case "story":
            return createTrendDataStory(sectionName)
        default:
            return null
    }
}
function createTrendDataStory(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    let cats = [];
    const { start, end, type } = $s.charts.trend;
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let ev = cats.slice().fill(0),
        scope = ev.slice(),
        forecast = ev.slice().fill(NaN),
        plan = forecast.slice(),
        scopeCount = 0,
        totalStories = 0,
        stroiesCompleted = 0,
        stroriesWIP = 0;
    const reportDateIndex = cats.indexOf(params.reportdate);
    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) {
            const history = row[type.history].split("|");
            scopeCount += +row[type.storypoints];
            totalStories++;
            //the last status will indicate if the siry is complete or not
            const laststatusEV = type.earnedvalue[history[history.length - 2]];
            if (laststatusEV == 1)
                stroiesCompleted++
            else if (laststatusEV > 0)
                stroriesWIP++;
            var where = dateDiff(cats[0], history[1]);
            if (where < cats.length) {
                let prevEV = 0;
                scope[where] += +row[type.storypoints];
                for (let h = 2; h < history.length; h += 2) {
                    where = dateDiff(cats[0], history[h + 1]);
                    if (where < 0) where = 0;
                    if (type.earnedvalue[history[h]]) {
                        ev[where] += (+row[type.storypoints]) * (type.earnedvalue[history[h]] - prevEV);
                        prevEV = type.earnedvalue[history[h]];
                    }
                    else
                        console.log(h, history[h], type.earnedvalue[history[h]]);
                }
            }
        }
    }
    for (var i = 1; i < ev.length; i++) {
        if (i <= reportDateIndex) {
            ev[i] += ev[i - 1];
            scope[i] += scope[i - 1];
        } else {
            ev[i] = NaN;
            scope[i] = NaN;
        }
    }
    for (var i = 1; i < ev.length; i++) ev[i] = Math.round(ev[i], 0);
    if (type.plan) {
        let startPoint = cats.indexOf(start),
            endPoint = cats.indexOf(end);
        for (i = startPoint; i <= endPoint; i++)
            plan[i] = Math.round(scopeCount * type.plan(i - startPoint, endPoint - startPoint));
    }
    else
        plan = null;
    //generate insights
    //SPI = EV / PV = 14,400 / 18,000 = 0.8
    let insights = [];
    insights.push({
        headline: stroiesCompleted,
        message: `Stories Completed (${Math.round(100 * stroiesCompleted / totalStories)}%)`,
        color: "none"
    });
    insights.push({
        headline: stroriesWIP,
        message: `Stories inflight (${Math.round(100 * stroriesWIP / totalStories)}%)`,
        color: "none"
    });
    insights.push({
        headline: totalStories - (stroiesCompleted + stroriesWIP),
        message: `Stories yet to start (${Math.round(100 * (totalStories - (stroiesCompleted + stroriesWIP)) / totalStories)}%)`,
        color: "none"
    });
    const spi = Math.round(100 * ev[reportDateIndex] / plan[reportDateIndex]);
    insights.push({
        headline: spi + "%",
        message: "SPI",
        color: spi >= 100 ? "green" : spi < 85 ? "red" : "orange"
    });
    insights.push({
        headline: "TBD",
        message: "Forecast end date",
        color: "none"
    });

    generteInsight(insights);
    return [cats, "EV", ev, "Scope", scope, "Plan", plan];
}

function createTrendDataTest(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    let cats = [],
        passed = 0;
    const { start, end, type } = $s.charts.trend;
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let counts = cats.slice().fill(0),
        scope = counts.slice(),
        forecast = counts.slice().fill(NaN),
        plan = forecast.slice(),
        scopeCount = 0;
    const reportDateIndex = cats.indexOf(params.reportdate);
    const endDateIndex = cats.indexOf($s.charts.trend.end);
    const exArray = $s.charts.trend.type.executed;
    const passArray = $s.charts.trend.type.passed;

    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) { // 
            scopeCount++;
            var where = dateDiff(cats[0], row[type.scope]);
            scope[where]++;
            var status = row[exArray[1]];
            if (passArray.indexOf(status) != -1)
                passed++;
            if (exArray[2].indexOf(status) != -1) {
                where = dateDiff(cats[0], row[exArray[0]]);
                counts[where]++;
            }
        }
    }
    //calculate the forcast based on average for last seven days
    var avExecution = 0;
    for (var i = reportDateIndex; i > (reportDateIndex - 7); i--)
        avExecution += counts[i];

    avExecution = avExecution / 7;

    for (var i = 1; i < counts.length; i++) {
        if (i <= reportDateIndex) {
            counts[i] += counts[i - 1];
            scope[i] += scope[i - 1];
        } else {
            counts[i] = NaN;
            scope[i] = NaN;
        }
    }
    forecast[reportDateIndex] = counts[reportDateIndex];
    for (var i = reportDateIndex + 1; i < counts.length; i++)
        forecast[i] = forecast[i - 1] + avExecution;
    for (var i = reportDateIndex + 1; i < counts.length; i++)
        forecast[i] = Math.round(forecast[i]);
    forecast[reportDateIndex] = NaN;

    if (type.plan) {
        let startPoint = cats.indexOf(start),
            endPoint = cats.indexOf(end);
        for (i = startPoint; i <= endPoint; i++)
            plan[i] = Math.round(scopeCount * type.plan(i - startPoint, endPoint - startPoint));
    }
    else
        plan = null;

    let insights = [];
    insights.push({
        headline: Math.round((100 * passed / scopeCount)) + "%",
        message: `Scripts passed (${passed} out of ${scopeCount})`,
        color: "none"
    })
    insights.push({
        headline: avExecution.toFixed(1),
        message: "Current test execution rate",
        color: "none"
    })

    const forecastedtestend = reportDateIndex - 1 + Math.round((plan[endDateIndex] - counts[reportDateIndex]) / avExecution)

    const delay = forecastedtestend - endDateIndex - 1;

    insights.push({
        headline: niceDateFormat(addDays(cats[0], forecastedtestend)),
        message: "Forecasted date for all scripts executed ("
            + (delay == 0 ? "on" : (delay < 0 ? -delay + " days before" : delay + " days after"))
            + ` test end of ${niceDateFormat(cats[endDateIndex])})`,
        color: delay <= 0 ? "green" : delay / 7 <= 1 ? "orange" : "red"
    })
    const daystoend = endDateIndex - reportDateIndex - 1;
    if (daystoend > 0) {
        const requiredrate = (plan[endDateIndex] - counts[reportDateIndex]) / daystoend;
        insights.push({
            headline: requiredrate.toFixed(1),
            message: "Required execution rate to meet end date",
            color: "none"
        })
    } else {
        insights.push({
            headline: "Infinity",
            message: "Required test execution rate cannot be decided",
            color: "red"
        })
    }

    generteInsight(insights);
    return [cats, "Executed", counts, "Scope", scope, "Forecast", forecast, "Plan", plan];
}

function createTrendDataDefect(sectionName) {
    const $s = params.sections[sectionName],
        $$ = params.sections[sectionName].sectiondata;
    //get the required data from the params
    let { agefilter, type, start, end } = $s.charts.trend;

    let ageBucketSet = $$.filters[agefilter];

    let cats = [];
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let counts = cats.slice().fill(0),
        raised = counts.slice(),
        resolved = counts.slice(),
        forecast = counts.slice().fill(NaN);
    const reportDateIndex = cats.indexOf(params.reportdate);
    const endDateIndex = cats.indexOf($s.charts.trend.end);

    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) {
            var startDate = row[type.raised];
            var endDate = row[type.resolved];
            if (endDate == "") endDate = $s.charts.trend.end;
            let arrayStart = dateDiff(cats[0], startDate);
            let arrayEnd = dateDiff(cats[0], endDate);
            for (var i = arrayStart; i < arrayEnd; i++)
                if (ageBucketSet == null || ageBucketSet == getAgeBucket(startDate, cats[i])) {
                    if (i >= 0 && i < counts.length)
                        counts[i]++;
                    if (i == arrayStart) raised[i]++;
                    if (i == (arrayEnd - 1)) resolved[i]++;
                }
        }
    }
    for (var i = reportDateIndex + 1; i < counts.length; i++)
        counts[i] = NaN;
    //calculate the average for last seven days
    var avRaised = 0,
        avResolved = 0,
        avOverDays = 7; // paramterise this <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    for (var i = reportDateIndex; i > (reportDateIndex - avOverDays); i--) {
        avRaised += raised[i];
        avResolved += resolved[i];
    };
    avRaised = Number((avRaised / avOverDays).toFixed(1));
    avResolved = Number((avResolved / avOverDays).toFixed(1));
    //add forecast after report date
    forecast[reportDateIndex] = counts[reportDateIndex];

    for (var i = reportDateIndex + 1; i < cats.length; i++) {
        if (cats[i] <= end)
            forecast[i] = forecast[i - 1] + avRaised - avResolved
        else
            forecast[i] = forecast[i - 1] - avResolved;
    };
    for (var i = reportDateIndex + 1; i < cats.length; i++)
        forecast[i] = Math.max(0, Math.round(forecast[i]));

    let zerodefectdate = 0;
    if (forecast[forecast.length - 1] == 0) {
        for (var i = forecast.length - 1; i > reportDateIndex + 1; i--) {
            if (forecast[i] > 0) {
                zerodefectdate = i + 2;
                break;
            }
        };
    }
    else {
        if (avResolved > 0)
            zerodefectdate = forecast.length - 1 + Math.round(forecast[forecast.length - 1] / avResolved)
        else
            zerodefectdate = -1;
    }
    forecast[reportDateIndex] = NaN;
    //generte the insights
    let insights = [];
    insights.push({
        headline: counts[reportDateIndex],
        message: "Current active defects",
        color: "none"
    })
    insights.push({
        headline: avResolved.toFixed(1),
        message: `Current defect resolve rate. `
            + `Current defect raise rate: ${avRaised.toFixed(1)}`,
        color: "none"
    })
    if (zerodefectdate == -1) {
        insights.push({
            headline: "?",
            message: "Cannot forecast zero defects date at current resolve rate",
            color: "red"
        })
    }
    else {
        const delay = zerodefectdate - endDateIndex - 1;
        insights.push({
            headline: niceDateFormat(addDays(cats[0], zerodefectdate)),
            message: "Forecasted date for no defects at current rate ("
                + (delay == 0 ? "on" : (delay < 0 ? -delay + " days before" : delay + " days after"))
                + ` test end of ${niceDateFormat(cats[endDateIndex])})`,
            color: delay <= 0 ? "green" : delay / 7 <= 1 ? "orange" : "red"
        })
    }
    if (zerodefectdate > endDateIndex) {
        const daystoend = endDateIndex - reportDateIndex - 1;
        if (daystoend > 0) {
            const requiredrate = ((daystoend - 1) * avRaised + counts[reportDateIndex]) / daystoend;
            insights.push({
                headline: requiredrate.toFixed(1),
                message: "Required defect resolve rate to meet end date",
                color: "none"
            })
        } else {
            insights.push({
                headline: "Infinity",
                message: "Required defect resolve rate to meet end date",
                color: "red"
            })
        }
    }
    generteInsight(insights);
    return [cats, "Count", counts, "Forecast", forecast];
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
    //let maxheight = -1;
    //for (let i = 0; i < Math.min(4, insights.length); i++) {
    //    const div = d3.select("#insights-" + i);
    //    if (!div) break;
    //    div.html("");
    //    div.style("text-align", "center");
    //    div.append("p")
    //        .attr("class", "w3-xxlarge")
    //        .style("background-color", insights[i].color)
    //        .text(insights[i].headline);
    //    //div.append("br");
    //    div.append("p")
    //        .attr("class", "w3-tiny")
    //        .text(insights[i].message);
    //    maxheight = Math.max(maxheight, div.style("height").slice(0, -2)); //see note below
    //}
    ////////MUST BE A BETTER WAY TO SIZE ALL TH SAME HEIGHT
    //for (let i = 0; i < Math.min(5, insights.length); i++) {
    //    const div = d3.select("#insights-" + i);
    //    if (!div) break;
    //    div.style("height", maxheight + "px");
    //}
    let maxheight = -1;
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
        //div.append("br");
        div.append("p")
            .attr("class", "w3-tiny")
            .text(insights[i].message);
        maxheight = Math.max(maxheight, div.style("height").slice(0, -2)); //see note below
    }
    ////////MUST BE A BETTER WAY TO SIZE ALL TH SAME HEIGHT
    for (let i = 0; i < Math.min(5, insights.length); i++) {
        const div = d3.select("#insights-" + i);
        if (!div) break;
        div.style("height", maxheight + "px");
    }
}
function niceDateFormat(d) {
    //Fri Apr 24 2020 19:35:08 GMT+0100 (BST)
    const newdate = "" + new Date(d);
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
    //change all dates in data
    //let data = params.sections[sectionName].data;
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
        for (var key in o)
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
