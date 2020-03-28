'use strict'
let sectionData = {};
//convention for dom items
// sectionName for class to be used to change chrt backgound color when filtered, n stands for section number
// sectionName-chart-nfor charts where n is index to cahrts[]
// sectionName-filter-n for filter lable 
// sectionName-table-n for table 

function initialiseCounter(sectionName) {  ///external
    let $$ = new function () {
        this.section = params.sections[sectionName];  //<<<<
        this.headers = [];        //the headers from data   
        this.headerIndex = [];   //the corrospoding column of the headers, perhaps reuired in future
        this.titles = [];        //chart titles
        this.charts = [];     //chart objects
        this.charttypes = [];     //chart types - bar, line, timeseries etc 
        this.counts = [];        // counts in terms of [[cat1, cat2, cat3..],[count1, count2, count3..]]
        this.filter = [];       //filter to apply
        this.data = eval(params.sections[sectionName].data);          //data
        this.totalRecs = 0;
        this.filteredRec = 0;
    };
    function createCalcuatedCols() {
        if ($$.section.calculatedcols)
            for (let f of $$.section.calculatedcols)
                //check the header does not exist
                if ($$.data.indexOf(f(0, 0)) == -1) {
                    let rowNo = 0;
                    for (let row of $$.data)
                        row.push(f(rowNo++, row));
                }
    }
    function sortData() {
        if ($$.section.charts.table.sortdata) {
            let header = $$.data.shift(); //make a copy of the header and remove it
            let sortCols = [...$$.section.charts.table.sortdata];
            for (let i = 0; i < sortCols.length; i += 2)
                sortCols[i] = header.indexOf(sortCols[i]);

            $$.data.sort(
                (a, b) => {
                    for (let i = 0; i < sortCols.length; i += 2) {
                        const sortOrder = sortCols[i + 1],
                            col = sortCols[i];
                        if (a[col] > b[col]) return sortOrder;
                        if (a[col] < b[col]) return -sortOrder;
                    }
                    return 0;
                }
            )
            $$.data.unshift(header); // reinstate the header
        }
    }

    sectionData[sectionName] = $$;
    createCalcuatedCols();
    sortData();
    //set calculated cols 
    for (var col = 0; col < $$.data[0].length; col++) {
        var keyMatch = $$.section.charts.bars.filters.filter(v => { return v.col == $$.data[0][col] })
        if (keyMatch.length > 0) {
            $$.headers.push(keyMatch[0].col);
            $$.headerIndex.push(col);
            $$.titles.push('Count by ' + keyMatch[0].col); //~<<<<<<<<<<<<<<<<<
            $$.charts.push(null);
            $$.charttypes.push(null);
            $$.filter.push(null);
            $$.counts.push([[], []]);
            var lastEntry = $$.counts.length - 1;
            $$.counts[lastEntry][0] = keyMatch[0].values.slice();
            for (var i = 0; i < $$.counts[lastEntry][0].length; i++)
                $$.counts[lastEntry][1].push(0);
        }
    }
    reCountRecs(sectionName);
}

function isFiltered(row, sectionName) {
    let $$ = sectionData[sectionName];
    for (var col = 0; col < $$.filter.length; col++)
        if ($$.filter[col] != null && $$.filter[col] != row[$$.headerIndex[col]])
            return false;
    return true;
}


function getAgeBucket(raised, resolved) { //<<<<<<<<<<<<<<<todo change buckets based on parameters
    //var start = new Date(raised);
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
function reCountRecs(sectionName) {
    let $$ = sectionData[sectionName];
    $$.totalRecs = 0;
    $$.filteredRecs = 0;

    //zero the counters
    for (let count of $$.counts)
        count[1].fill(0); //count[0] has the categories and count[1] the counts

    var createTable = $$.section.charts.table != undefined;
    // for each row count (starting from 1) count if matched by filter
    for (var row = 1; row < $$.data.length; row++) {
        if (isActive($$.data[row], sectionName)) {
            $$.totalRecs++;
            if (isFiltered($$.data[row], sectionName)) {
                $$.filteredRecs++;
                if (createTable)
                    addToTable($$.filteredRecs, $$.data[row], sectionName);
                for (var col = 0; col < $$.filter.length; col++) {
                    var where = $$.counts[col][0].indexOf($$.data[row][$$.headerIndex[col]]);
                    if (where == -1) {
                        $$.counts[col][0].push($$.data[row][$$.headerIndex[col]]);
                        $$.counts[col][1].push(0);
                        where = $$.counts[col][0].length - 1;
                    };
                    $$.counts[col][1][where]++;
                }
            }
        }
    }
}
function addChartsToDivs(sectionName) {
    let $$ = sectionData[sectionName];
    const chartCount = $$.headers.length;
    let i = 0;
    for (i = 0; i < chartCount; i++) {
        $$.charts[i] = c3BarChart(sectionName + '-chart-' + i, $$.counts[i], onclickFunction);
        $$.charttypes[i] = 'filtered bars';
    }
    let trendData = createTrendData(sectionName);
    const callout = [
        { value: $$.section.charts.trend.start, text: 'Test Start' },
        { value: $$.section.charts.trend.end, text: 'Test End' }
    ];
    $$.charts.push(c3LineChart(sectionName + '-chart-' + i, trendData, null, callout));
    $$.charttypes.push('timeseries');
    filterChanged(sectionName);
}
function refreshAllCharts(sectionName) {
    let $$ = sectionData[sectionName];
    for (let i = 0; i < $$.charts.length; i++)
        if ($$.charttypes[i] == 'filtered bars')
            c3RefreshChart($$.charts[i], $$.counts[i], $$.filter[i], sectionName);
        else if ($$.charttypes[i] == 'timeseries') {
            const trendData = createTrendData(sectionName);
            c3RefreshChart($$.charts[i], trendData, null, sectionName);
        }
}
function onclickFunction(cat, id) {  ///external
    let idParts = id.split('-');
    let sectionName = idParts[0];
    let $$ = sectionData[sectionName];
    let chartIndex = idParts[2];//id.replace("chart", "");
    //toggle the filter
    $$.filter[chartIndex] = ($$.filter[chartIndex] == cat ? null : cat);
    filterChanged(sectionName);
}
function resetFilter(sectionName) {
    let $$ = sectionData[sectionName];
    //reset the filter
    $$.filter.fill(null);
    filterChanged(sectionName);
}
function filterChanged(sectionName) {
    //create the filter message
    var filterMessage = ceateFilterMeassge(sectionName);
    //if filter set then change the background color of charts
    var backColor = filterMessage == '' ? 'white' : 'lightgrey';
    var elements = document.getElementsByClassName(sectionName);
    for (let e of elements)
        e.style.backgroundColor = backColor;

    filterMessage == '' ? filterMessage = 'Filter: None' : filterMessage = 'Filter: ' + filterMessage;
    reCountRecs(sectionName);
    var filterBar = document.getElementById(sectionName + '-filter-values');
    let $$ = sectionData[sectionName];
    var percentRecs = Math.floor(100 * $$.filteredRecs / $$.totalRecs);
    filterBar.style.width = percentRecs + '%';
    filterBar.innerHTML = `${$$.filteredRecs}  of ${$$.totalRecs} shown (${percentRecs}%)`;
    refreshAllCharts(sectionName);
}
function ceateFilterMeassge(sectionName) {
    let $$ = sectionData[sectionName],
        filterMessage = '',
        i = 0;
    for (const f of $$.filter)
        if (f != null) {
            if (filterMessage != '')
                filterMessage = filterMessage + ' & ';
            filterMessage = filterMessage + $$.headers[i++] + '=' + f;
        }
    return filterMessage;
}

function createTrendData(sectionName) {
    switch (sectionData[sectionName].section.charts.trend.type.style) {
        case 'test':
            return createTrendDataTest(sectionName)
        case 'defect':
            return createTrendDataDefect(sectionName)
        default:
            return null
    }
}

function createTrendDataTest(sectionName) {
    let $$ = sectionData[sectionName];
    for (var i = 0; i < $$.filter.length; i++) {
        if ($$.filter[i] != null) {
            if ($$.headers[i] == $$.section.charts.trend.nofilter)
                return null
        }
    }

    let cats = [];
    const { start, end, type } = $$.section.charts.trend;
    //createDateArray(cats, addDays($$.section.charts.trend.start, -7), addDays($$.section.charts.trend.end, 14));
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let counts = cats.slice().fill(0),
        scope = counts.slice(),
        forecast = counts.slice().fill(NaN),
        plan = forecast.slice(),
        scopeCount = 0;
    const reportDateIndex = cats.indexOf(params.reportdate);
    var createdColIndex = $$.data[0].indexOf(type.scope),
        //var createdColIndex = $$.data[0].indexOf($$.section.charts.trend.type.scope),
        exArray = $$.section.charts.trend.type.executed,
        executedColIndex = $$.data[0].indexOf(exArray[0]),
        statusColIndex = $$.data[0].indexOf(exArray[1]);

    for (var row = 1; row < $$.data.length; row++) {
        if (isFiltered($$.data[row], sectionName)) {
            scopeCount++;
            var where = dateDiff(cats[0], $$.data[row][createdColIndex]);
            scope[where]++;

            // status must be pass fail to count as executed
            ////////////// paramerise
            var status = $$.data[row][statusColIndex];

            if (exArray[2].indexOf(status) != -1) { //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                where = dateDiff(cats[0], $$.data[row][executedColIndex]);
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
        for (i = startPoint; i <= endPoint; i++) {
            plan[i] = Math.round(scopeCount * type.plan(i - startPoint,endPoint - startPoint));
        }

        return [cats, 'Executed', counts, 'Scope', scope, 'Forecast', forecast, 'Plan', plan];
    }
    else
        return [cats, 'Executed', counts, 'Scope', scope, 'Forecast', forecast];

}

function createTrendDataDefect(sectionName) {
    let $$ = sectionData[sectionName],
        ageBucketSet = null;
    //get the required data from the params
    let { nofilter, agefilter, type, start, end } = $$.section.charts.trend;
    for (var i = 0; i < $$.filter.length; i++) {
        if ($$.filter[i] != null) {
            if ($$.headers[i] == nofilter)
                return null
            else if ($$.headers[i] == agefilter)
                ageBucketSet = $$.filter[i];
        }
    }
    const raisedColIndex = $$.data[0].indexOf(type.raised);
    const resolvedColIndex = $$.data[0].indexOf(type.resolved);
    let cats = [];
    createDateArray(cats, addDays($$.section.charts.trend.start, -7), addDays($$.section.charts.trend.end, 14));
    let counts = cats.slice().fill(0),
        raised = counts.slice(),
        resolved = counts.slice(),
        forecast = counts.slice().fill(NaN);
    const reportDateIndex = cats.indexOf(params.reportdate);


    for (var row = 1; row < $$.data.length; row++) {
        if (isFiltered($$.data[row], sectionName)) {
            var startDate = $$.data[row][raisedColIndex];
            var endDate = $$.data[row][resolvedColIndex];
            if (endDate == '') endDate = $$.section.charts.trend.end;//d.toISOString().slice(0, 10); <<<<<<<<<<<<<<<<<<OK???? 
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
        if (cats[i] <= $$.section.charts.trend.end)
            forecast[i] = Math.max(0, Math.floor(forecast[i - 1] + avRaised - avResolved))
        else
            forecast[i] = Math.max(0, Math.floor(forecast[i - 1] - avResolved));
    };
    forecast[reportDateIndex] = NaN;
    return [cats, 'Count', counts, 'Forecast', forecast];
}
function isActive(row, sectionName) {
    const include = sectionData[sectionName].section.charts.bars.include;
    if (include)
        return include(row)
    else
        return true;
}
function copyTable(id) { ///external
    //create a tab delimited text
    table = document.getElementById(id);
    copyText = '';
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
    let today = new Date();
    let daysToAdd = dateDiff(params.reportdate, today.toISOString().slice(0, 10)) - 1;
    //change all dates
    params.reportdate = addDays(params.reportdate, daysToAdd);


    if (params.sections.SIT) {
        params.sections.SIT.charts.trend.start = addDays(params.sections.SIT.charts.trend.start, daysToAdd);
        params.sections.SIT.charts.trend.end = addDays(params.sections.SIT.charts.trend.end, daysToAdd);
        fixDatesOne(SITTtests, ['Created', 'Executed'], daysToAdd);
    }
    if (params.sections.UAT) {
        params.sections.UAT.charts.trend.start = addDays(params.sections.UAT.charts.trend.start, daysToAdd);
        params.sections.UAT.charts.trend.end = addDays(params.sections.UAT.charts.trend.end, daysToAdd);
        fixDatesOne(UATtests, ['Created', 'Executed'], daysToAdd);
    }
    if (params.sections.DEFECT) {
        params.sections.DEFECT.charts.trend.start = addDays(params.sections.DEFECT.charts.trend.start, daysToAdd);
        params.sections.DEFECT.charts.trend.end = addDays(params.sections.DEFECT.charts.trend.end, daysToAdd);
        fixDatesOne(DefectData, ['Created', 'Closed'], daysToAdd);
    }

}

function fixDatesOne(data, cols, days) {
    let colIndexes = cols.slice();
    for (let i = 0; i < cols.length; i++)
        colIndexes[i] = data[0].indexOf(cols[i]);

    for (let r = 1; r < data.length; r++)
        for (let i = 0; i < colIndexes.length; i++) {
            let d = data[r][colIndexes[i]]
            if (d != '') data[r][colIndexes[i]] = addDays(d, days)
        }
}
function addDays(oldDate, days) {
    let newDate = new Date(oldDate);
    newDate.setDate(newDate.getDate() + days);
    return newDate.toISOString().slice(0, 10);
}
