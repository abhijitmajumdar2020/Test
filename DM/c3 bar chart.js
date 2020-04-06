'use strict'
function c3BarChart(chartDivID, data, onclickFunction) {
    let sectionName = chartDivID.split('-')[0];
    var d = transformData(data);
    return c3.generate({
        bindto: "#" + chartDivID,
        data: {
            columns: d.columns,
            type: 'bar',
            onclick: function (dataItem, element) {
                onclickFunction(d.categories[dataItem.x], chartDivID)
            },
            colors: { Count: params.sections[sectionName].colors[0] }
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
        legend: { show: d.columns.length > 1 }
    })
};
function c3LineChart(chartDivID, data, onclickFunction, chartCallOuts) {
    //data is pairs x followed by pairs of cat and values
    var d = [];
    d.push(data[0].slice());
    d[0].unshift('x');
    for (var i = 1; i < data.length; i += 2) {
        if (data[i + 1]) {
            d.push(data[i + 1].slice());
            d[d.length - 1].unshift(data[i]);
        }
    };

    var chart = c3.generate({
        bindto: "#" + chartDivID,
        data: {
            x: 'x',
            columns: d,
            //types: {'Hi forecast': 'area', 'Lo forecast': 'area'},//'line',
            //types: {'Plan': 'spline'},//'line',
            //colors: { Count: normalBarColor }
        },
        point: { show: true },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    culling: { max: 5 },
                    format: function (x) { return x.toString().slice(4, 10); }
                }
            }
        },
        regions: [{ axis: 'x', start: addDays(params.reportdate, 1) }],
        legend: { show: d.length > 1 }
    });
    if (chartCallOuts)
        chart.xgrids(chartCallOuts);
    return chart;
};
function c3RefreshChart(chart, data, filterValue, sectionName) {
    if (data == null) {
        chart.hide();
        return;
    }
    chart.show();
    var d = transformData(data);
    var barColor = params.sections[sectionName].colors[0];
    if (filterValue !== null) barColor = barColor + '80';
    chart.data.colors({
        Count: barColor
    });
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
        cols.unshift('Count');
        d.columns.push(cols);
    }
    return d;
}