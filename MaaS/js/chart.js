'use strict'
//draw the chart: APEXCHAFRT
//https://apexcharts.com/docs/update-charts-from-json-api-ajax/

const toolIcons = {
    filter: {
        icon: '<img src="icons/filter.svg" style= "opacity: 50%;" width="15">',//'<img src="icons/filter_alt_FILL0_wght400_GRAD0_opsz48.svg" width="15">',
        index: 0,
        title: 'Filter chart',
        class: 'custom-icon',
        click: function (chart, options, e) {
            chartFilterIconClicked(options.globals.chartID, false)
            //console.log(e)
        }
    },
    config: {
        icon: '<img src="icons/gear.svg" class="noprint" style= "opacity: 50%" width="15">',//'<img src="icons/settings_FILL0_wght400_GRAD0_opsz48.svg" width="15">',
        index: 1,
        title: 'Cofig chart',
        class: 'custom-icon',
        click: function (chart, options, e) {
            showChartMenus(options.globals.chartID)//chartConfigIconClicked(options.globals.chartID)
        }
    },
    menu: {
        icon: '&#9776;',
        index: 0,
        title: 'Chart menu',
        class: 'custom-icon',
        click: function (chart, options, e) {
            showChartMenus(options.globals.chartID)
        }
    },
}

const toolbar = {
    show: true,
    tools: {
        download: false,
        download: false,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false,
        customIcons: [toolIcons.menu]
    }
}

function drawChart(id, col, data, labels, clickCallback) {
    if (col.type == "Risk")
        return createHeatMapChart(id, col, data, labels, clickCallback, risk_5x5)
    else
        return drawBarChart(id, col, data, labels, clickCallback)
}

function updateChart(chart, col, data, labels) {

    if (col.type == "Risk")
        updateHeatMapChart(chart, col, data, labels)
    else
        updateBarChart(chart, col, data, labels)
}

//////////////////////////////////////////////////////////////////////bar charts
function drawBarChart(id, col, data, labels, clickCallback) {
    const { countType, title } = col
    var options = {
        series: [{
            name: countType,//ol.countType,
            data: data,
        }],
        chart: {
            id: id,
            height: 300,
            fontFamily: 'Raleway, Arial, sans-serif',
            //background: '#fff',

            type: 'bar',
            events: {
                click: function (event, chartContext, config) {
                    if (config.dataPointIndex >= 0)
                        clickCallback(id, config.config.xaxis.categories[config.dataPointIndex])
                    //else
                    //    console.log(event, chartContext, config, chartContext.el.id)  //clickCallback(id, null) //console.log(config) 
                    //console.log(config.dataPointIndex, config.config.xaxis.categories, config.globals.dom.baeEl)// The last parameter config contains additional information like `seriesIndex` and `dataPointIndex` for cartesian charts
                }
            },
            toolbar: toolbar,
        },
        plotOptions: {
            bar: {
                //borderRadius: 10,
                dataLabels: {
                    position: 'top', // top, center, bottom
                },
            }
        },
        dataLabels: {
            enabled: true,
            // formatter: function (val) { //<<<<<<<<<<<<<<param this
            //     return val + "%";
            // },
            offsetY: -20,
            style: {
                fontSize: '12px',
                colors: ["#304758"]
            }
        },

        xaxis: {
            categories: labels,
        },
        yaxis: {
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false,
            },
        },

        title: {
            text: title,//col.title,

        }
    }
    var chart = new ApexCharts(document.querySelector('#' + id,), options)
    chart.render()
    return chart
}

function updateBarChart(chart, col, data, labels) {
    //console.log(chart.xaxis.categories)// = labels
    // chart.updateSeries([{
    //     data: data,
    // }])
    chart.updateOptions(
        {
            xaxis: {
                categories: labels
            },
            series: [{
                data: data
            }],
            title: {
                text: col.title,
            }
        }, true
    );
}
////////////////////////////////////////////////////////////////////////
const risk_5x5 = {
    //title: "Count of Risks in Risk Matrix",
    xaxis: {
        title: "Likelyhood",
        catagories: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Near Certain']
    },
    yaxis: {
        title: "Impact",
        catagories: ["V Low", "Low", "Medium", "High", "V High"]
    },
    colors: [
        {
            from: 1,
            to: 2,
            color: "lightgreen",
            name: "Ignore"
        },
        {
            from: 3,
            to: 6,
            color: "green",
            name: "Manage"
        },
        {
            from: 7,
            to: 14,
            color: "orange",
            name: "Manage carefully"
        },
        {
            from: 15,
            to: 19,
            color: "coral",
            name: "Manage very closely"
        },
        {
            from: 20,
            to: 100,
            color: "red",
            name: "Act now"
        },
    ]
}

function createHeatMapChart(id, col, data, labels, clickCallback, risk) {//id, risk, d, l) {
    //console.log(d)
    const newData = mapDataForHeatMap(data, labels)

    const chartDiv = document.querySelector('#' + id,)
    const size = risk.xaxis.catagories.length
    const { countType, title } = col
    function generateData(count) {
        var i = 1;
        var series = [];
        while (i <= size) {
            var x = (i * count).toString();
            var y = i * count

            series.push({
                x: x,
                y: y
            });
            i++;
        }
        return series;
    }

    let s = []

    for (let i = 1; i <= size; i++)
        s.push({
            name: risk.yaxis.catagories[i - 1], //'' + i,
            data: generateData(i)
        })

    var options = {
        series: s,
        chart: {
            id: id,
            height: 300,
            type: 'heatmap',
            fontFamily: 'Raleway, Arial, sans-serif',
            toolbar: toolbar,
        },
        stroke: {
            width: 0
        },
        plotOptions: {
            heatmap: {
                //radius: 30,
                enableShades: false,
                colorScale: {
                    ranges: risk.colors, ////////////////////////////
                },

            }
        },
        dataLabels: {
            enabled: true,
            style: {
                colors: ['#fff']
            },
            formatter: function (val, opt) {
                const dispalyValue = newData[(opt.dataPointIndex + 1) + "" + (opt.seriesIndex + 1)]//data.values
                if (dispalyValue) return dispalyValue
                return ""
            },
        },
        xaxis: {
            type: 'category',
            categories: risk.xaxis.catagories,
            title: { text: risk.xaxis.title }

        },
        yaxis: {
            //show: true,
            //type: 'category',
            title: { text: risk.yaxis.title }

        },
        tooltip: {
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const dispalyValue = newData[(dataPointIndex + 1) + "" + (seriesIndex + 1)]
                const label = risk.yaxis.catagories[seriesIndex] + " & " +
                    risk.xaxis.catagories[dataPointIndex] //+ ": " + dispalyValue

                return '<div class="arrow_box">' +
                    '<p>' + label + '</p>' +
                    '<p>' + dispalyValue + '</p>' +
                    '</div>'
            }
        },
        stroke: {
            width: 1
        },
        title: {
            text: title,
        },
        legend: { show: true },

    };

    var chart = new ApexCharts(chartDiv, options);
    chart.render();
    return chart

}
function mapDataForHeatMap(data, labels) {
    let heatMapData = {}
    for (let i = 0; i < data.length; i++)
        heatMapData[labels[i]] = data[i]
    return heatMapData

}
function updateHeatMapChart(chart, col, data, labels) {

    const newData = mapDataForHeatMap(data, labels)
    chart.updateOptions(
        {
            dataLabels: {
                formatter: function (val, opt) {
                    const dispalyValue = newData[(opt.dataPointIndex + 1) + "" + (opt.seriesIndex + 1)]//data.values
                    if (dispalyValue) return dispalyValue
                    return ""
                },
            },
        }, true
    );
}