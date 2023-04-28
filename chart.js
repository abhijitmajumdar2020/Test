'use strict'
//draw the chart: APEXCHAFRT
//https://apexcharts.com/docs/update-charts-from-json-api-ajax/

function drawBarChart(id, title, data, labels, clickCallback) {

    var options = {
        series: [{
            name: 'Count', //<<<<<<<<<<<< param this
            data: data //<<<<<<<<<< data here
        }],
        chart: {
            height: 350,
            type: 'bar',
            events: {
                click: function (event, chartContext, config) {
                    if (config.dataPointIndex >= 0)
                        clickCallback(id, config.config.xaxis.categories[config.dataPointIndex])
                    else
                        clickCallback(id, null) //console.log(config) 
                    //console.log(config.dataPointIndex, config.config.xaxis.categories, config.globals.dom.baeEl)// The last parameter config contains additional information like `seriesIndex` and `dataPointIndex` for cartesian charts
                }
            },
            toolbar: {
                show: false,
                // offsetX: 0,
                // offsetY: 0,
                // tools: {
                //     download: true,
                //     selection: true,
                //     zoom: true,
                //     zoomin: true,
                //     zoomout: true,
                //     pan: true,
                //     reset: true | '<img src="/static/icons/reset.png" width="20">',
                //     customIcons: [{
                //         icon: '<img src="/static/icons/chart-carpet.png" width="20">',
                //         index: 4,
                //         title: 'tooltip of the icon',
                //         class: 'custom-icon',
                //         click: function (chart, options, e) {
                //             console.log("clicked custom-icon")
                //         }
                //     }]
                // },
            }
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
            categories: labels, //["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],


            // labels: {
            //     formatter: (value) => formatCol(id, value)
            // },
            //position: 'top',
            // axisBorder: {
            //     show: false
            // },
            // axisTicks: {
            //     show: false
            // },
            // crosshairs: {
            //     fill: {
            //         type: 'gradient',
            //         gradient: {
            //             colorFrom: '#D8E3F0',
            //             colorTo: '#BED1E6',
            //             stops: [0, 100],
            //             opacityFrom: 0.4,
            //             opacityTo: 0.5,
            //         }
            //     }
            // },
            // tooltip: {
            //     enabled: true,
            // }
        },
        yaxis: {
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false,
            },
            // labels: {
            //     show: false,
            //     formatter: function (val) {
            //         return val + "%";
            //     }
            // }

        },
        title: {
            text: title,
            //     floating: true,
            //     offsetY: 330,
            //     align: 'center',
            //     style: {
            //         color: '#444'
            //     }
        }
    };
    var chart = new ApexCharts(document.querySelector('#' + id,), options)
    chart.render()
    return chart
}
function updateBarChart(chart, data, labels) {
    chart.updateSeries([{
        data: data
    }])
}