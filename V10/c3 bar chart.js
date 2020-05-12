'use strict'
function c3BarChart(chartDivID, data, onclickFunction) {
    let sectionName = chartDivID.split('-')[0];
    var d = transformData(data);
    let chartcolors = {};
    for (let i = 0; i < d.columns.length; i++)
        chartcolors[d.columns[i][0]] = getColor(sectionName, i);
    return c3.generate({
        bindto: "#" + chartDivID,
        data: {
            columns: d.columns,
            type: 'bar',
            onclick: function (dataItem, element) {
                onclickFunction(d.categories[dataItem.x], chartDivID)
            },
            //colors: chartcolors//{ Count: params.sections[sectionName].colors[0] }
        },
        axis: {
            x: {
                type: 'category',
                categories: d.categories, tick: {
                    culling: { max: 0 },
                }
            }
        },
        bar: { width: { ratio: 0.7 } },
        legend: { show: d.columns.length > 1 },
        tooltip: {
            contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                return newToolTip(this.getTooltipContent(d, defaultTitleFormat, defaultValueFormat, color), this.config.bindto, d)
            }
        }
    })
};
function c3LineChart(chartDivID, data, onclickFunction, chartCallOuts) {
    
    if (data == null) return;
    var d = [];
    d.push(data[0].slice());
    d[0].unshift('date');
    for (var i = 1; i < data.length; i += 2) {
        if (data[i + 1]) {
            d.push(data[i + 1].slice());
            d[d.length - 1].unshift(data[i]);
        }
    }
    const chart = c3.generate({
        bindto: "#" + chartDivID,
        data: {
            x: 'date',
            columns: d,
            //types: {'Hi forecast': 'area', 'Lo forecast': 'area'},//'line',
            //types: {'Plan': 'spline'},//'line',
        },
        point: { show: true },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    //values: xvalues,
                    culling: { max: 5 },
                    format: function (x) { return x.toString().slice(4, 10); },
                }
            }
        },
        regions: [{ axis: 'date', start: addDays(params.reportdate, 1) }],
        legend: { show: d.length > 1 }
    });
    if (chartCallOuts)
        chart.xgrids(chartCallOuts);
    return chart;

};
function c3RefreshChart(chart, data, filterValue, sectionName) {
    if (!chart) return;
    if (data == null) {
        chart.hide();
        return;
    }
    chart.show();
    var d = transformData(data);
    // let chartcolors = {};
    // for (let i = 0; i < d.columns.length; i++) {
    //     let barColor = getColor(sectionName, i)
    //     if (filterValue == []) barColor = barColor + '80';
    //     chartcolors[d.columns[i][0]] = barColor;

    // }
    // chart.data.colors(chartcolors);
    //console.log(chart.internal.config.axis_x_type);
    //console.log(chart.internal.config.axis_x_categories);
    //if (chart.internal.config.axis_x_type == "category") {
    //     chart.internal.config.axis_x_categories[0] = 1;
    //console.log(chart.internal.config)
    //}
    chart.load({
        columns: d.columns
    });
    //console.log(
}

function transformData(data) {
    //transform input data to c3 compatible data
    //   imput: [[cat1, cat2, cat3 ...],what1,[90, 220, 320 ...],what2,[90, 220, 320 ...]]
    //          input[0] are the category and input[1] are the values
    //   output: { categories: ['data1', 'data2', 'data3'], columns: [['count', 90, 220, 320]] }

    var d = { categories: data[0].slice(), columns: [] };
    if (data.length > 2)
        for (var i = 1; i < data.length; i += 2) {
            if (data[i + 1]) {
                var cols = data[i + 1].slice();
                cols.unshift(data[i]);
                d.columns.push(cols);
            }
        }
    else {
        var cols = data[1].slice();
        cols.unshift("Value");
        d.columns.push(cols);
    }
    return d;
}
function newToolTip(currentHTML, div, d) {
    let html = currentHTML.replace("</table>", ""); ////remove the </table> tag
    let idParts = div.split("-");
    const sectionName = idParts[0].replace("#", "");
    const chartIndex = idParts[2];//get the total and % values
    const { counts, sums, measure } = params.sections[sectionName].sectiondata.counts[chartIndex];
    const totalCount = counts.reduce((acc, val) => acc + val, 0);
    const totalSum = sums.reduce((acc, val) => acc + val, 0);

    let aggregateValue = totalCount,
        aggregate = "Total:",
        percent = Math.round(100 * d[0].value / totalCount) + "%";

    if (measure)
        if (measure.type == "Average") {
            aggregateValue = Math.round(totalSum / totalCount);
            aggregate = "Overall Average:";
            percent = "";
        }
        else {
            aggregateValue = totalSum;
            aggregate = "Total:";
            percent = Math.round(100 * d[0].value / totalSum) + "%";
        }
    html += "<tr class='c3-tooltip-name--Count'>";
    if (percent != "") {
        html += "<td class='name'><span style='background-color:#0570b080'></span>" + "%" + "</td>";
        html += "<td class='value'>" + percent + "</td>";
    }
    html += "</tr>";

    html += "<tr class='c3-tooltip-name--Count'>";
    html += "<td class='name'>" + aggregate + "</td>";
    html += "<td class='value'>" + aggregateValue + "</td>";
    html += "</tr>";

    html += "</table>";
    return html;
}
