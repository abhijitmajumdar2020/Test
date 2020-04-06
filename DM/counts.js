'use strict'

//convention for dom items
// sectionName for class to be used to change chrt backgound color when filtered, n stands for section number
// sectionName-chart-n for charts where n is index to cahrts[]
// sectionName-filter-n for filter lable 
// sectionName-table-n for table 

function loadAlldata() {
    let remaining = Object.keys(params.sections).length;
    //start multiple async read requsts and when remaining = 0 then all are done
    for (let sectionName in params.sections) {
        const $s = params.sections[sectionName];
        d3.csv($s.datasource, function (row) {
            //make sure the values are trimmed
            for (let key in row)
                if (typeof row[key] === "string") row[key] = row[key].trim();
            //create calculated columns
            if ($s.calculatedcols)
                for (let newcol in $s.calculatedcols)
                    if (!row[newcol]) row[newcol] = $s.calculatedcols[newcol](row); //create nowcol only if doesnt exist
            $s.data.push(row);
        })
            .then(data => {
                if (!--remaining) dataReady();
            });
    }
}

function dataReady() {
    fixDates();
    d3.select('#loader').style("display", "none");
    for (let sectionName in params.sections) {
        const $s = params.sections[sectionName];
        sortData($s.data, $s.charts.table.sortcols);
        createChartSpaces('#main', sectionName);
        countRecs(sectionName);
        addChartsToDivs(sectionName);
    }
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
    filterChanged(sectionName);
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
    for (let e of $s.charts.bars.filters) {
        $$.charts[e.col] = { chart: null, type: null, title: 'Count by ' + e.col, index: 0 };
        $$.counts[e.col] = { cats: [...e.values], counts: [...e.values].fill(0) };
        $$.filters[e.col] = null;
    }
}

function isFiltered(row, sectionName) {
    const $$ = params.sections[sectionName].sectiondata;
    for (const col in $$.filters)
        if ($$.filters[col] != null && $$.filters[col] != row[col])
            return false;
    return true;
}

function getAgeBucket(raised, resolved) { //<<<<<<<<<<<<<<<todo change buckets based on parameters
    var end = (resolved == '' ? params.reportdate : resolved);
    var age = dateDiff(raised, end);
    var bins = [5, 10, 15], binBuckets = ['5D-', '5-10D', '10-15D', '15D+']
    return getBinValue(bins, binBuckets, age)
}
///generic bin
function getBinValue(bins, binBuckets, val) {
    var ascending = bins[1] > bins[0];
    for (var i = 0; i < bins.length; i++) {
        if ((ascending && (val < bins[i])) || (!ascending && val > bins[i]))
            return binBuckets[i];
    }
    return binBuckets[binBuckets.length - 1]
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

    //zero the counters
    for (let entry in $$.counts)
        $$.counts[entry].counts.fill(0);

    var createTable = $s.charts.table != undefined;
    // for each row count (starting from 1) count if matched by filter
    let rowNo = 0;
    for (let row of $s.data) {
        if (isActive(row, sectionName)) {
            $$.totalRecs++;
            if (isFiltered(row, sectionName)) {
                $$.filteredRecs++;
                if (createTable)
                    addToTable($$.filteredRecs, row, sectionName);
                for (let entry in $$.counts) {
                    const count = $$.counts[entry];
                    let index = count.cats.indexOf(row[entry])
                    if (index == -1) {
                        index = count.cats.push(row[entry]) - 1;
                        count.counts[index] = 0;
                    }
                    count.counts[index]++;
                }
            }
        }
    }
}


function addChartsToDivs(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];

    for (let key in $$.charts) {
        const data = [[...$$.counts[key].cats], [...$$.counts[key].counts]];
        $$.charts[key].chart = c3BarChart(sectionName + '-chart-' + $$.charts[key].index, data, onclickFunction);
        $$.charts[key].type = 'filtered bars';
    }
    let trendData = createTrendData(sectionName);
    const callout = [
        { value: $s.charts.trend.start, text: 'Test Start' },
        { value: $s.charts.trend.end, text: 'Test End' }
    ];
    const i = $s.charts.bars.filters.length;
    $$.charts.trend = {
        chart: c3LineChart(sectionName + '-chart-' + i, trendData, null, callout),
        type: 'timeseries',
        index: i
    }
    filterChanged(sectionName);
}
function refreshAllCharts(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    for (let key in $$.charts) {
        if ($$.charts[key].type == 'filtered bars') {
            const data = [[...$$.counts[key].cats], [...$$.counts[key].counts]];
            c3RefreshChart($$.charts[key].chart, data, $$.filters[key], sectionName);
        } else if ($$.charts[key].type == 'timeseries') {
            const trendData = createTrendData(sectionName);
            c3RefreshChart($$.charts[key].chart, trendData, null, sectionName);
        }
    }
}
function onclickFunction(cat, id) {
    let idParts = id.split('-');
    let sectionName = idParts[0];
    let $$ = params.sections[sectionName].sectiondata;
    //toggle the filter
    const chartIndex = Object.keys($$.filters)[idParts[2]];
    $$.filters[chartIndex] = ($$.filters[chartIndex] == cat ? null : cat);
    countRecs(sectionName);
    filterChanged(sectionName);
}
function resetFilter(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    for (let f in $$.filters)
        $$.filters[f] = null;
    filterChanged(sectionName);
}
function filterChanged(sectionName) {
    //create the filter message
    let $$ = params.sections[sectionName].sectiondata,
        filterMessage = '',
        i = 0;
    for (const f in $$.filters) {
        if ($$.filters[f] != null) {
            if (filterMessage != '')
                filterMessage = filterMessage + ' & ';
            filterMessage = filterMessage + f + '=' + $$.filters[f];
        }
    }
    filterMessage = filterMessage == "" ? "" : "(Filter: "+ filterMessage+")";
    var backColor = filterMessage == "" ? 'white' : 'lightgrey';
    d3.selectAll("." + sectionName)
        .style("background-color", backColor);

    var filterBar = document.getElementById(sectionName + '-filter-values');
    var percentRecs = Math.floor(100 * $$.filteredRecs / $$.totalRecs);
    filterBar.style.width = percentRecs + '%';
    filterBar.innerHTML = `${$$.filteredRecs}  of ${$$.totalRecs} shown (${percentRecs}%)`;
    refreshAllCharts(sectionName);
}

function createTrendData(sectionName) {
    switch (params.sections[sectionName].charts.trend.type.style) {
        case 'test':
            return createTrendDataTest(sectionName)
        case 'defect':
            return createTrendDataDefect(sectionName)
        default:
            return null
    }
}

function createTrendDataTest(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    if ($$.filters[$s.charts.trend.nofilter] != null)
        return null
    let cats = [];
    const { start, end, type } = $s.charts.trend;
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let counts = cats.slice().fill(0),
        scope = counts.slice(),
        forecast = counts.slice().fill(NaN),
        plan = forecast.slice(),
        scopeCount = 0;
    const reportDateIndex = cats.indexOf(params.reportdate);
    const exArray = $s.charts.trend.type.executed;

    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) {
            scopeCount++;
            var where = dateDiff(cats[0], row[type.scope]);
            scope[where]++;
            var status = row[exArray[1]];
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

    avExecution = Math.floor(avExecution / 7);

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
    forecast[reportDateIndex] = NaN;

    if (type.plan) {
        let startPoint = cats.indexOf(start),
            endPoint = cats.indexOf(end);
        for (i = startPoint; i <= endPoint; i++)
            plan[i] = Math.round(scopeCount * type.plan(i - startPoint, endPoint - startPoint));
    }
    else
        plan = null;
    return [cats, 'Executed', counts, 'Scope', scope, 'Forecast', forecast, 'Plan', plan];
}

function createTrendDataDefect(sectionName) {
    const $s = params.sections[sectionName],
        $$ = params.sections[sectionName].sectiondata;
    //get the required data from the params
    let { nofilter, agefilter, type, start, end } = $s.charts.trend;
    if ($$.filters[nofilter] != null)
        return null;
    let ageBucketSet = $$.filters[agefilter];

    let cats = [];
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let counts = cats.slice().fill(0),
        raised = counts.slice(),
        resolved = counts.slice(),
        forecast = counts.slice().fill(NaN);
    const reportDateIndex = cats.indexOf(params.reportdate);

    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) {
            var startDate = row[type.raised];
            var endDate = row[type.resolved];
            if (endDate == '') endDate = $s.charts.trend.end;
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
    avRaised = avRaised / avOverDays;
    avResolved = avResolved / avOverDays;
    //add forecast after report date
    forecast[reportDateIndex] = counts[reportDateIndex];
    for (var i = reportDateIndex + 1; i < cats.length; i++) {
        if (cats[i] <= end)
            forecast[i] = Math.max(0, Math.floor(forecast[i - 1] + avRaised - avResolved))
        else
            forecast[i] = Math.max(0, Math.floor(forecast[i - 1] - avResolved));
    };
    forecast[reportDateIndex] = NaN;
    return [cats, 'Count', counts, 'Forecast', forecast];
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
    let copyText = '';
    for (let row of table.rows) {
        for (let cell of row.cells)
            copyText += cell.innerHTML + "\t";
        copyText += "\n";
    }

    const temp = document.createElement('textarea');
    temp.value = copyText;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
}
function addDays(date, days) {
    d = new Date(date);
    //d.setDate(d.getDate() + days); // doesnt work due to daylight saving
    d.setTime(d.getTime() + days * 86400000); //works despite daylight saving
    return d.toISOString().slice(0, 10);
}
function createDateArray(arr, startDate, endDate) {
    let d = new Date(startDate),
        dateString = startDate;
    // console.log( dateString);
    // dateString = addDays(dateString,-1);
    // console.log(dateString);
    do {
        //dateString = d.toISOString().slice(0, 10);
        arr.push(dateString); //catergories
        //d.setDate(d.getDate() + 1); // doesnt work due to daylight saving
        //dateString = addDays(dateString, 1);
        //console.log('1',dateString);
        d.setTime(d.getTime() + 86400000); //works despite daylight saving
        dateString = d.toISOString().slice(0, 10);
        //console.log('2',dateString);
    } while (dateString < endDate);
}
/////////////////FOLLOWING REQUIRED ONLY FOR DEMO
///MOVE ALL DATES AS IF REPORT DATE IS YESTERDAY////////////
function fixDates() {
    const today = new Date();
    const daysToAdd = dateDiff(params.reportdate, today.toISOString().slice(0, 10)) - 1;
    if (daysToAdd == 0) return;
    //change all dates
    params.reportdate = addDays(params.reportdate, daysToAdd);
    fixDatesOne('SIT', ['Created', 'Executed'], daysToAdd);
    fixDatesOne('UAT', ['Created', 'Executed'], daysToAdd);
    fixDatesOne('DEFECT', ['Created', 'Closed', "History"], daysToAdd);
}

function fixDatesOne(sectionName, dateCols, days) {
    const $s = params.sections[sectionName];
    if (!$s) return;
    $s.charts.trend.start = addDays($s.charts.trend.start, days);
    $s.charts.trend.end = addDays($s.charts.trend.end, days);
    for (let row of $s.data)
        for (let col of dateCols)
            if (row[col] != "")
                if (col == "History") {
                    let history = row[col].split("|"); //split as status date pairs
                    for (let i = 1; i < history.length; i += 2) {
                        history[i] = addDays(history[i], days);
                    }
                    row[col] = history.join("|");
                } else
                    row[col] = addDays(row[col], days);
}
function addDays(oldDate, days) {
    let newDate = new Date(oldDate);
    newDate.setDate(newDate.getDate() + days);
    return newDate.toISOString().slice(0, 10);
}
