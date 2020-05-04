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
            .style("color", getColor(sectionName))
            .selectAll("th")
            .data(cols)
            .enter()
            .append("th")
            .text(d => d + (d == sortcols[0] ? " " : ""))
            .attr("onclick", (d => "sortTable('" + sectionName + "','" + d + "')"))
            .attr("cursor", "pointer")
            .append("i")
            .attr("class", d => (d == sortcols[0] ? sortcols[1] == 1 ? "fa fa-toggle-down" : "fa fa-toggle-up" : ""));
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
    let rowInDiv;
    function addNewRow(parentDiv) {
        rowInDiv = d3.select(parentDiv)
            .append('div')
            .attr("class", "w3-row-padding");
    }
    function addToRow(numberInRow) {
        const classtype = ["w3-col", "w3-half", "w3-third", "w3-quarter"][numberInRow - 1];
        if (!classtype) return;
        if (!rowInDiv) addNewRow();
        if (rowInDiv.selectAll(sectionName).nodes().length >= numberInRow) addNewRow();
        return rowInDiv.append('div')
            .attr("class", classtype)//[numberInRow - 1])
            .append('div')
            .attr("class", "w3-container w3-margin-bottom" + " " + sectionName);
    }
    let $s = params.sections[sectionName];
    if ($s.charts === undefined) return;
    initialiseCounter(sectionName);
    const backColor = getColor(sectionName),
        textColor = "#fff";
    //remove divs if any
    d3.select("#main")
        .html("");
    //remove menus if any
    d3.select('#menuDivId')
        .html("");
    //set the TOC for other sections before current section
    d3.select('#menuDivId').append('a')
        .attr("class", "w3-bar-item w3-padding")
        .style("font-weight", "bold")
        .style("border-bottom", "1px solid")
        .text("Contents");
    //d3.select('#menuDivId').append('hr').style("color","black");

    for (const s in params.sections) {
        const item = d3.select('#menuDivId').append('a')
            .style("font-weight", "bold")
            .text(params.sections[s].title);
        if (s == sectionName)
            item.attr("class", "w3-bar-item w3-padding")
                .append('div')
                .attr("id", "detailMenu")
        else
            item.attr("class", "w3-bar-item w3-button w3-padding")
                .attr('onclick', "loadSection('" + s + "')");
    }
    /////////////////////////////////////////////////////////////////////////////////// section title
    let title = !$s.title ? sectionName : $s.title;
    d3.select("#main-title")
        .text(title + " Dashboard (" + niceDateFormat(params.reportdate) + ")")
    // d3.select(div).append("br")
    //createTOC(id, title, ["#fff", backColor]);// textColor]);
    ////////////////////////////////////////////////////////////////////////////////// trend
    const filters = $s.charts.bars.filters;
    if ($s.charts.trend) {
        let id = sectionName + "-chart-" + filters.length; //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        ///////////////////////////////////////////////////////////////////////////////////inights

        //addNewRow(div);

        const insights = d3.select(div)
            .append("div")
            .attr("class", "insightgrid");
        for (let i = 0; i < 4; i++) {
            //addToRow(4)
            insights.append("div")
                .attr("class", "w3-container" + " " + sectionName)
                .attr("id", "insights-" + i);
            //.attr("class", sectionName);
            //.node().classList.add(sectionName)
        }
        createTOC("insights-0", title + " Insights", [backColor, textColor]);
        ///////////////////////////////////////////////////////////////////////////////trend chart
        title = !$s.charts.trend.title ? sectionName : $s.charts.trend.title;
        addNewRow(div);
        let wrapper = addToRow(2)
        wrapper.append("div")
            .attr("class", "chart-title")
            .text(title);
        wrapper.append('div')
            .attr("class", "mychart")
            .attr("id", id);
        createTOC(id, title, [backColor, textColor]);
    }
    ////////////////////////////////////////////////////////////////////////////////// filtered bars
    //$s.charts.bars) // must exist
    title = !$s.charts.bars.title ? sectionName : $s.charts.bars.title;

    addNewRow(div);
    for (var i = 0; i < filters.length; i++) {
        let chart = $s.sectiondata.charts[i];
        chart.index = i;
        let id = sectionName + '-chart-' + i;
        const wrapper = addToRow(3);
        let charttitle = wrapper.append("div")
            .attr("class", "chart-title")
            .text(chart.title + " ");
        if (!filters[i].nofilter)
            charttitle.append("i")
                .attr("class", "fa fa-filter");

        wrapper.append('div')
            .attr("class", "mychart")
            .attr("id", id);

        createTOC(id, chart.title, [backColor, textColor]);
    }
    //////////////////////////////////////////////////////////replace with slicer
    let id = sectionName + "-filter-values";
    createOneBar(div, backColor, textColor, title, true)
        .style('cursor', 'pointer')
        .attr('onclick', 'resetFilter("' + sectionName + '")')
        .attr('id', id);

    ////////////////////////////////////////////////////////////////////////////////// table
    if ($s.charts.table) {
        // let newDiv = document.createElement('div');
        id = sectionName + "-table";
        title = $s.charts.table.title
        if (!title) title = sectionName
        d3.select(div).append('br');
        createChartTitle(sectionName, div, id + "-title", "table-button")
            .append('div')
            .attr("class", "w3-responsive")
            .append('table')
            .attr("class", "w3-table-all")
            .attr("id", id);

        d3.select("#table-button")
            .attr("onclick", "copyTable('" + id + "')")
            .append("i")
            .attr("class", "fa fa-file-excel-o");

        // wrapper.append("div")
        //     // .attr("class", "w3-container w3-margin-bottom")
        //     // .append('div')
        //     .attr("class", "w3-responsive")
        //     .append('table')
        //     .attr("class", "w3-table-all")
        //     .attr("id", id);

        createTOC(id, title, [backColor, textColor]);
    }
}
function createChartTitle(sectionName, parentDiv, id1, id2) {
    // const html = '<table border="0" width="100%">'
    //     + '<tr class="chart-title>'
    //     + '<td width="99%">Title</td>'
    //     + '<td width="1%" align="right">button</td>'
    //     + '</tr>'
    //     + '</table>';
    let wrapper = d3.select(parentDiv)
        .append('div')
        .attr("class", "w3-container w3-margin-bottom")
        .append('div')
        .attr("class", "w3-container x3-card-4 w3-padding-4 " + sectionName);
    let title = wrapper.append("div")
        .attr("class", "chart-title");
    //title.append('div').html(html);
    title.append("p")
        .attr("id", id1)
        .style("float", "left")
        .text(title);

    if (id2 !== undefined) {
        title.append("button")
            .style("float", "right")
            .attr("class", "w3-button")
            .attr("id", id2);
        //.attr("onclick", "copyTable('" + id + "')")
        //.append("i")
        //.attr("class", buttonIcon);
    }
    title.append("div")
        .style("clear", "both");
    return wrapper;
}

function createTOC(divId, title, colors = ["#fff", 0]) {
    d3.select('#detailMenu').append('a')
        .attr("class", "w3-bar-item w3-button w3-padding")
        //.style("background-color", colors[0] + "80")
        .style("color", colors[0])
        //.style("border-left-style", "solid") 
        .style("font-weight", "normal")
        .attr('onclick', "actionTOC('" + divId + "')")
        .text(title);
}
function actionTOC(chartDiv) {
    document.getElementById(chartDiv).scrollIntoView(true);
    window.scrollBy(0, -100); //scroll down a bit to avoid nav bar
    w3_close();
}

function createOneBar(div, backColor, textColor, title, hidden = false) {
    //d3.select(div).append('br');
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
