'use strict'
// all functions related to DOM elements here
function addToTable(sNo, row, sectionName) {
    let tableTitle = sectionName + '-table-title';
    if (document.getElementById(tableTitle) == null) return; //<<<<<<<<<<<<<why do we need to do this?
    const $s = params.sections[sectionName];
    let { title, maxentries, colstoinclude, sortcols } = $s.charts.table;
    if (!title) title = "List";
    if (!sortcols) sortcols = ["", 1];
    if (!maxentries) maxentries = 10;
    if (sNo > maxentries) {
        d3.select('#' + tableTitle).text(title + ' (max ' + maxentries + ')'); //tableHeader
        return;
    } else
        d3.select('#' + tableTitle).text(title);

    //decide which headers to include
    const cols = !colstoinclude ? Object.keys(row) : [...colstoinclude];
    cols.unshift('#'); //insert the serial number
    const table = d3.select('#' + sectionName + '-table');
    if (sNo == 1) {
        table.select('thead')
            .remove();
        table.select('tbody')
            .remove();
        //create table hader
        table.append("thead").append("tr")
            .selectAll("th")
            .data(cols)
            .enter()
            .append("th")
            .attr("cursor", "pointer")
            .text(d => d + (d == sortcols[0] ? sortcols[1] == 1 ? "\u{2191}" : "\u{2193}" : ""))
            .attr("onclick", (d => "sortTable('" + sectionName + "','" + d + "')"));

        table.append("tbody");
    }
    //create table rows
    table.select("tbody").append("tr")
        .selectAll("td")
        .data(cols)
        .enter()
        .append("td")
        .text((d, i) => i == 0 ? sNo : row[d]);

}
function createChartSpaces(div, sectionName) {
    let $s = params.sections[sectionName];
    if ($s.charts === undefined) return;
    initialiseCounter(sectionName);
    const [backColor, textColor] = $s.colors;
    /////////////////////////////////////////////////////////////////////////////////// section title
    let title = !$s.title ? sectionName : $s.title;
    let id = sectionName
    createOneBar(div, backColor, textColor, title)
        .attr("id", id);

    createTOC(id, title, $s.colors);
    ////////////////////////////////////////////////////////////////////////////////// trend
    const filters = $s.charts.bars.filters;
    if ($s.charts.trend) {
        //let newDiv = document.createElement('div');
        id = sectionName + "-chart-" + filters.length; //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        title = !$s.charts.trend.title ? sectionName : $s.charts.trend.title;

        d3.select(div).append('br');
        let wrapper = d3.select(div)
            .append('div')
            .attr("class", "w3-container")
            .append('div')
            .attr("class", "w3-container w3-card-4 w3-padding-4 " + sectionName);

        wrapper.append('h5')
            .text(title);
        wrapper.append('div')
            .attr("id", id);

        createTOC(id, title);
    }
    ////////////////////////////////////////////////////////////////////////////////// filtered bars
    let chartNo = 0;
    // if ($s.charts.bars) // must exist
    id = sectionName + "-filter-values";
    title = !$s.charts.bars.title ? sectionName : $s.charts.bars.title;

    createOneBar(div, backColor, textColor, title)
        .style('cursor', 'pointer')
        .attr('onclick', 'resetFilter("' + sectionName + '")');

    createOneBar(div, backColor, textColor, title, true) // the last param creates the grey background
        .style('cursor', 'pointer')
        .attr('onclick', 'resetFilter("' + sectionName + '")')
        .attr('id', id);

    d3.select(div).append('br');

    const howManyInrow = 2, styleForEach = 'w3-half';
    var chartCount = filters.length; //count of filtered bars
    var rows = Math.floor(chartCount / howManyInrow);
    for (var i = 0; i < rows; i++) {
        createOneRow(div, howManyInrow, styleForEach, sectionName, chartNo, filters);
        chartNo += howManyInrow;
    }
    //and then the leftover
    createOneRow(div, (chartCount % howManyInrow), styleForEach, sectionName, chartNo, filters);

    ////////////////////////////////////////////////////////////////////////////////// table
    if ($s.charts.table) {
        // let newDiv = document.createElement('div');
        id = sectionName + "-table";
        title = $s.charts.table.title
        if (!title) title = sectionName

        d3.select(div).append('br');
        let wrapper = d3.select(div)
            .append('div')
            .attr("class", "w3-container")
            .append('div')
            .attr("class", "w3-container w3-card-4 w3-padding-4 " + sectionName);

        wrapper.append('h5')
            .attr("id", id + "-title")
            .text(title);
        wrapper.append('table')
            .attr("class", "w3-table-all")
            .attr("id", id);
        wrapper.append('button')
            .attr("class", "w3-button")
            .text("Copy data in table")
            .attr("onclick", "copyTable('" + id + "')");

        createTOC(id, title);
    }
}
function createTOC(divId, title, colors = ['#ffffff', 0]) {
    d3.select('#menuDivId').append('a')
        .attr("class", "w3-bar-item w3-button w3-padding")
        .style("background-color", colors[0])
        .style("color", colors[1])
        .attr('onclick', "actionTOC('" + divId + "')")
        .text(title);
}
function actionTOC(chartDiv) {
    document.getElementById(chartDiv).scrollIntoView(true);
    window.scrollBy(0, -100); //scrool down a bit to avoid nav bar
    w3_close();
}
function createOneRow(parentDivId, howMany, classType, sectionName, chartNo, filters) {
    if (howMany > 0) {
        let row = d3.select(parentDivId)
            .append('div')
            .attr("class", "w3-row-padding w3-margin-bottom");

        const $s = params.sections[sectionName].sectiondata;
        //following is not the best loop in the world!  should be handled via d3 data.... but 
        for (var i = 0; i < howMany; i++) {
            let chart = $s.charts[filters[chartNo].col];
            chart.index = chartNo;
            const chartId = sectionName + '-chart-' + chartNo;
            let wrapper = row.append('div')
                .attr("class", classType)
                .append('div')
                .attr("class", "w3-container w3-card-4 w3-padding-4 " + sectionName);
            wrapper.append('h5')
                .text(chart.title);
            wrapper.append('div')
                .attr("id", chartId);
            createTOC(chartId, chart.title);
            chartNo++;
        }
    }
}
function createOneBar(div, backColor, textColor, title, hidden = false) {
    d3.select(div).append('br');
    let outDiv = d3.select(div)
        .append('div')
        .attr("class", "w3-container");
    if (hidden)
        outDiv = outDiv.append('div').attr("class", "w3-grey");
    return outDiv.append('div')
        .attr("class", "w3-container w3-center w3-padding")
        .style("white-space", "nowrap")
        .style("height", "40px")
        .style("width", "100%")
        .style("background-color", backColor)
        .style("color", textColor)
        .text(title);
}