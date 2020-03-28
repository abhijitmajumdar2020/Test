'use strict'
// all functions related to DOM elements here
function addToTable(sNo, row, sectionName) {
    let tableTitle = sectionName + '-table-title';
    if (document.getElementById(tableTitle) == null) return; //<<<<<<<<<<<<<why do we need to do this?
    let $$ = sectionData[sectionName];
    let { title, maxentries, colstoinclude } = $$.section.charts.table;
    if (!title) title = "List";
    if (!maxentries) maxentries = 10;
    if (sNo > maxentries) {
        d3.select('#' + tableTitle).text(title + ' (max ' + maxentries + ')'); //tableHeader
        return;
    } else
        d3.select('#' + tableTitle).text(title);

    //decide which headers to include
    if (colstoinclude == undefined) colstoinclude = $$.data[0];
    var colIndices = [0]; // space for sNo
    for (let i = 0; i < colstoinclude.length; i++)
        colIndices.push($$.data[0].indexOf(colstoinclude[i]))

    let table = d3.select('#' + sectionName + '-table');
    if (sNo == 1) {
        table.select('thead')
            .remove();
        table.select('tbody')
            .remove();
        //create table hader
        table.append("thead").append("tr")
            .selectAll("th")
            .data(colIndices)
            .enter()
            .append("th")
            .text((d, i) => (i == 0 ? '#' : colstoinclude[i - 1]));

        table.append("tbody");
    }
    //create table rows
    table.select("tbody").append("tr")
        .selectAll("td")
        .data(colIndices)
        .enter()
        .append("td")
        .text((d, i) => (i == 0 ? sNo : row[colIndices[i]]));

}
function createChartSpaces(div, sectionName) {
    let section = params.sections[sectionName];
    if (section.charts === undefined) return;
    initialiseCounter(sectionName);
    const mainDiv = document.getElementById(div);
    const [backColor, textColor] = section.colors;
    /////////////////////////////////////////////////////////////////////////////////// section title
    let title = !section.title ? sectionName : section.title;
    createOneBar(div, backColor, textColor, title);

    createTOC('', title, section.colors);
    ////////////////////////////////////////////////////////////////////////////////// trend
    if (section.charts.trend) {
        //let newDiv = document.createElement('div');
        var id = sectionName + "-chart-" + section.charts.bars.filters.length;
        title = !section.charts.trend.title ? sectionName : section.charts.trend.title;
        d3.select('#' + div).append('br');
        let wrapper = d3.select('#' + div)
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
    if (section.charts.bars) {
        id = sectionName + "-filter-values";
        title = !section.charts.bars.title ? sectionName : section.charts.bars.title;

        createOneBar(div, backColor, textColor, title)
            .style('cursor', 'pointer')
            .attr('onclick', 'resetFilter("' + sectionName + '")');

        createOneBar(div, backColor, textColor, title)
            .style('cursor', 'pointer')
            .attr('onclick', 'resetFilter("' + sectionName + '")')
            .attr('id', id);

        d3.select('#' + div).append('br');

        const howManyInrow = 2, styleForEach = 'w3-half';
        var chartCount = section.charts.bars.filters.length;
        var rows = Math.floor(chartCount / howManyInrow);
        for (var i = 0; i < rows; i++) {
            createOneRow(div, howManyInrow, styleForEach, sectionName, chartNo);
            chartNo += howManyInrow;
        }
        //and then the leftover
        createOneRow(div, (chartCount % howManyInrow), styleForEach, sectionName, chartNo);

    }
    ////////////////////////////////////////////////////////////////////////////////// table
    if (section.charts.table) {
        // let newDiv = document.createElement('div');
        id = sectionName + "-table";
        title = section.charts.table.title
        if (!title) title = sectionName

        d3.select('#' + div).append('br');
        let wrapper = d3.select('#' + div)
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
function createOneRow(parentDivId, howMany, classType, sectionName, chartNo) {
    if (howMany > 0) {

        let row = d3.select('#' + parentDivId)
            .append('div')
            .attr("class", "w3-row-padding w3-margin-bottom");
        //following is not the best loop in the world!  should be handled via d3 data.... but 
        for (var i = 0; i < howMany; i++) {
            const chartId = sectionName + '-chart-' + chartNo;
            let wrapper = row.append('div')
                .attr("class", classType)
                .append('div')
                .attr("class", "w3-container w3-card-4 w3-padding-4 " + sectionName);
            wrapper.append('h5')
                .text(sectionData[sectionName].titles[chartNo]);
            wrapper.append('div')
                .attr("id", chartId);

            createTOC(chartId, sectionData[sectionName].titles[chartNo++])
        }
    }
}
function createOneBar(div, backColor, textColor, title) {
    d3.select('#' + div).append('br');
    return d3.select('#' + div)
        .append('div')
        .attr("class", "w3-container")
        .append('div')
        .attr("class", "w3-container w3-center w3-padding")
        .style("white-space", "nowrap")
        .style("height", "40px")
        .style("width", "100%")
        .style("background-color", backColor)
        .style("color", textColor)
        .text(title);
}