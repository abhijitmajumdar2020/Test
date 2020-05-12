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
            .attr("onclick", (d => `sortTable('${sectionName}','${d}')`))
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
    function addOneSpace(parent, title, button) {
        //title = {text: "title", id: "x"}
        //button = {icon: "font awsome", id: "y"}
        let wrapper = parent.append('div')
            .attr("class", `w3-container w3-card-2 ${sectionName}`);
        if (title) {
            let panel = wrapper.append("div")
                .attr("class", "w3-panel")
                .style("padding", 0);
            let titleDiv = panel.append("div")
                .attr("class", "w3-left  chart-title") //w3-padding
                .text(title.text);
            if (title.id)
                titleDiv.attr("id", title.id);
            if (button) {
                panel.append("button")
                    .attr("class", "w3-right w3-btn w3-white w3-border") //w3-padding
                    .attr("id", button.id)
                    .append("i")
                    .attr("class", button.icon);
            }
        }
        return wrapper;
    }

    let $s = params.sections[sectionName];
    if ($s.charts === undefined) return;
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
        //.style({"font-weight":"bold", "border-bottom": "1px solid"})
        .style("font-weight", "bold")
        .style("border-bottom", "1px solid")
        .text("Book Marks");

    for (const s in params.sections) {
        const item = d3.select('#menuDivId').append('a')
            .style("font-weight", "bold")
            .attr("class", "w3-bar-item w3-padding")
            .text(params.sections[s].title);
        if (s == sectionName)
            item.append('div')
                .attr("id", "detailMenu")
        else
            item.classed("w3-button", true)
                .attr('onclick', "loadSection('" + s + "')");
    }
    /////////////////////////////////////////////////////////////////////////////////// section title
    let title = !$s.title ? sectionName : $s.title;
    d3.select("#main-title")
        .text(`${title} Dashboard (${niceDateFormat(params.reportdate)})`)

    ////////////////////////////////////////////////////////////////////////////////// trend
    const filters = $s.charts.bars.filters;
    if ($s.charts.trend) {
        let id = sectionName + "-chart-" + filters.length; //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        ///////////////////////////////////////////////////////////////////////////////////inights
        let insights = d3.select(div)
            .append("div")
            .attr("class", "grid150");
        for (let i = 0; i < 4; i++) {
            addOneSpace(insights)
                .attr("id", "insights-" + i);
        }
        createTOC("insights-0", "Insights", [backColor, textColor]);
        //////////////////////////////////////////////////////////replace with slicer
        {
            let id = sectionName + "-filter-values";
            let wrapper = d3.select(div)
                .append("div").style("padding-bottom", "10px")
                .append("div").attr("class", "w3-container")
                .append("div").attr("class", "w3-bar w3-white w3-card-2")
                .append("div").attr("class", "w3-bar-item")
                .attr("id", id)
                .text("Filter: None");
            {
                // <div class="w3-bar w3-card-2">
                //     <a href="#" class="w3-bar-item w3-button">Home</a>
                //     <a href="#" class="w3-bar-item w3-button">Link 1</a>
                //     <div class="w3-dropdown-hover">
                //          <button class="w3-button">Dropdown</button>
                //          <div class="w3-dropdown-content w3-bar-block w3-card-4">
                //              <a href="#" class="w3-bar-item w3-button">Link 1</a>
                //              <a href="#" class="w3-bar-item w3-button">Link 2</a>
                //              <a href="#" class="w3-bar-item w3-button">Link 3</a>
                //          </div>
                //     </div>
                // </div>
                let wrapper = d3.select(div)
                    .append("div")
                    .attr("class", "w3-container")
                    .append("div")
                    .attr("class", "w3-bar w3-white w3-card-2");
                wrapper.append("a")
                    .attr("href", "#")
                    .attr("class", "w3-bar-item")
                    //.attr("id", filterId)
                    //.attr("onclick", `slicerSelect("${filterId}")`)
                    .append("i").attr("class", "fa fa-filter");

                const count = $s.sectiondata.counts;
                const filter = $s.sectiondata.filters;
                for (const key in count)
                    if (filter[count[key].col]) {
                        //const id = `${sectionName}-filtercol-${count[key].col}`; //avoid .col how about key?  
                        const id = `${sectionName}-filtercol-${key}`; //avoid .col how about key?  
                        const x = wrapper.append("div")
                            .attr("class", "w3-dropdown-hover");
                        x.append("button")
                            .attr("class", "w3-button")
                            //.attr("id", id)
                            .text(count[key].col);
                        const y = x.append("div")
                            .attr("id", id)
                            .attr("class", "w3-dropdown-content w3-bar-block w3-card-2");
                        count[key].cats.forEach((element,i) => {
                            //const filterId = `${id}-${element}`; ////avoid .col how about index number
                            const filterId = `${id}-${i}`; ////avoid .col how about index number
                            y.append("a")
                                .attr("href", "#")
                                .attr("class", "w3-bar-item w3-button")
                                .attr("id", filterId)
                                .attr("onclick", `slicerSelect("${filterId}")`)
                                .append("i").attr("class", "fa fa-check-square-o")
                                .text(" " + element)

                        });
                    }
                wrapper.append("a")
                    .attr("href", "#")
                    .attr("class", "w3-bar-item")
                    //.attr("id", filterId)
                    .attr("onclick", `resetFilter("${sectionName}")`)
                    .append("i").attr("class", "fa fa-refresh")

            }
        }
        ///////////////////////////////////////////////////////////////////////////////trend chart
        title = !$s.charts.trend.title ? sectionName : $s.charts.trend.title;
        let wrapper = d3.select(div)
            .append("div")
            .attr("class", "grid300")

        addOneSpace(wrapper, { text: title })
            .append("div")
            .attr("id", id);

        wrapper.append("div"); //force an extra div to halve the display
        createTOC(id, title, [backColor, textColor]);
    }
    ////////////////////////////////////////////////////////////////////////////////// filtered bars
    //$s.charts.bars) // must exist
    title = !$s.charts.bars.title ? sectionName : $s.charts.bars.title;
    {
        let wrapper = d3.select(div)
            .append("div")
            .attr("class", "grid300")
        for (var i = 0; i < filters.length; i++) {
            let chart = $s.sectiondata.charts[i];
            chart.index = i;
            let id = sectionName + '-chart-' + i;
            addOneSpace(
                wrapper,
                { text: chart.title },
                filters[i].nofilter ? null : { id: id + "filter", icon: "fa fa-refresh" }
            ).append("div")
                .attr("id", id);

            createTOC(id, chart.title, [backColor, textColor]);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////// table
    if ($s.charts.table) {

        let id = sectionName + "-table";
        title = $s.charts.table.title
        if (!title) title = sectionName
        let wrapper = d3.select(div)
            .append("div")
            .attr("class", "grid450")
        addOneSpace(
            wrapper,
            { id: id + "-title", text: title },
            { id: "table-button", icon: "fa fa-file-excel-o" }
        ).append('div')
            .attr("class", "w3-responsive")
            .append('table')
            .attr("class", "w3-table-all")
            .attr("id", id);

        d3.select("#table-button")
            .attr("onclick", `copyTable('${id}')`);

        createTOC(id, title, [backColor, textColor]);
    }
    countRecs(sectionName);
}

function createTOC(divId, title, colors = ["#fff", 0]) {
    d3.select('#detailMenu').append('a')
        .attr("class", "w3-bar-item w3-button w3-padding")
        .style("color", colors[0])
        .style("font-weight", "normal")
        .attr('onclick', `actionTOC('${divId}')`)
        .text(title);
}
function actionTOC(chartDiv) {
    document.getElementById(chartDiv).scrollIntoView(true);
    window.scrollBy(0, -100); //scroll down a bit to avoid nav bar
    w3_close();
}

// function createOneBar(div, backColor, textColor, title, hidden = false) {
//     //d3.select(div).append('br');
//     let outDiv = d3.select(div)
//         .append('div')
//         .attr("class", "w3-container");
//     if (hidden)
//         outDiv = outDiv.append('div').attr("class", "w3-grey");
//     return outDiv.append('div')
//         .attr("class", "w3-container w3-center w3-padding")
//         .style("white-space", "nowrap")
//         .style("height", "40px")
//         .style("width", "100%")
//         .style("background-color", backColor)
//         .style("color", textColor)
//         .text(title);
// }
