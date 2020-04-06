"use strict"
const params = {
    //global params
    reportdate: "2020-02-25",
    //message: "Long long ago in a galaxy far away... blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah ",
    sections:
    {
        SIT: {
            title: "SIT Execution",
            datasource: "SIT.csv", //"https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/SIT.csv",
            data: [],
            colors: ["#003000", "#FFFFFF"], //backgound color, font color
            charts: {
                trend: {
                    title: "SIT Execution Trend",
                    start: "2020-01-20",
                    end: "2020-03-15",
                    nofilter: "Status",
                    callouts: [],
                    type: {
                        style: "test",
                        executed: ["Executed", "Status", ["PASS", "FAIL"]],//select rows where this col is in the array
                        scope: "Created",
                        forecast: 7, //days to look back to forcast 
                        //sigmoid with 1.4 test execution ///////////////////////////////////////////////////////
                        plan: (x, d) => { x = x * 12 / d - 6; return 1.4 * Math.exp(x) / (Math.exp(x) + 1) }, 
                        //straight line with 1.4 test execution //////////////////////////////////////////////////
                        //plan: (x, d) => { return 1.4 * x / d }, 
                        //arbitrary plan path/////////////////////////////////////////////////////////////////////
                        // plan: (x, d) => {
                        //     const p = [0, .1, .2, .6, .8, .9, .95, 1]; //the planned path
                        //     const intervals = p.length - 1;
                        //     const ratio = Math.round(d / intervals, 0); //ratio of points i path to days in duration
                        //     const index = Math.floor(x / ratio); //return p[index] will give a step function
                        //     const delta = (p[index + 1] - p[index]) / ratio;
                            
                        //     return 1.4 * (p[index] + Math.max(0, delta * (x % ratio)));
                        // },
                    }
                },
                bars: {
                    title: "SIT Scripts Counts",
                    filters: [
                        { col: "Tech", values: ["MF", "WEB"] },
                        { col: "Area", values: ["AML", "LOAN", "SAVE"] },
                        { col: "Status", values: ["PASS", "FAIL", "BLOCK", "NO RUN"] },
                        { col: "Priority", values: ["P1", "P2", "P3", "P4"] },
                    ]
                },
                table: {
                    title: "List of SIT Scripts",
                    //cols: ["ID", "Area", "Tech", "Priority", "Created", "Executed"] //if cols not included it defaults to data headers
                },
            }
        },
        // UAT: {
        //     title: "UAT Execution",
        //     datasource: "uat.csv", //"https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/UAT.csv",
        //     data: [],
        //     colors: ["#003366","#FFFFFF"],
        //     charts: {
        //         trend: {
        //             title: "UAT Execution Trend",
        //             start: "2020-01-20",
        //             end: "2020-03-15",
        //             nofilter: "Status",
        //             callouts: [],
        //             type: {
        //                 style: "test",
        //                 executed: ["Executed", "Status", ["PASS","FAIL"]],//select rows where this col is in the array
        //                 scope:  "Created",
        //                 forecast: 7, //days to look back to forcast 
        //                 plan: (x, d) => { return 1.4 * x / d }, 
        //             }
        //         },
        //         bars: {
        //             title: "UAT Scripts Counts",
        //             //include: ["Tech", "=", "MF"],
        //             filters: [
        //                 { col: "Tech", values: ["MF", "WEB"] },
        //                 { col: "Area", values: ["AML", "LOAN", "SAVE"] },
        //                 { col: "Status", values: ["PASS", "FAIL", "BLOCK", "NO RUN"] },
        //                 { col: "Priority", values: ["P1", "P2", "P3", "P4"] }
        //             ]
        //         },
        //         table: {
        //             title: "List of UAT Scripts",
        //             cols: ["ID", "Tech", "Area", "Tech", "Priority"] //if cols not included it defaults to data headers
        //         },
        //     }
        // },
        //defects
        DEFECT: {
            title: "Active Defects",
            datasource: "DEFECT.csv", //"https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/DEFECT.csv",
            data: [],
            calculatedcols: {
                Age: function (row) { return  dateDiff(row["Created"], row["Closed"] == "" ? params.reportdate : row["Closed"]) },
                "Age Bin": function (row) { return (getAgeBucket(row["Created"], row["Closed"])) },
            },
            colors: ["#221100", "#FFFFFF"],
            charts: {
                trend: {
                    title: "Active Defect Trend",
                    start: "2020-01-20",
                    end: "2020-03-15",
                    nofilter: "Status",
                    ageFilter: "Age Bin",
                    callouts: [],
                    type: {
                        style: "defect",
                        raised: "Created",
                        resolved: "Closed",
                        //executed: ["Executed", "Status", ["PASS","FAIL"]],//select rows where this col is in the array
                        //scope:  "Created",
                        forecast: 7, //days to look back to forcast 
                        //plan: [0,1], //plan points ...[0] is high plan[1] is low must have scope to show plan
                    }
                },
                bars: {
                    title: "Active Defect Counts",
                    include: function (row) { return (row["Closed"] == "") },
                    filters: [
                        { col: "Tech", values: ["MF", "WEB"] },
                        { col: "Area", values: ["AML", "LOAN", "SAVE"] },
                        { col: "Status", values: ["NEW", "BUILD", "TEST"] },
                        { col: "Priority", values: ["P1", "P2", "P3", "P4"] },
                        { col: "Age Bin", values: ["5D-", "5-10D", "10-15D", "15D+"] },
                    ]
                },
                table: {
                    title: "List of Active Defects",
                    colstoinclude: ["ID", "Tech", "Area", "Status", "Priority", "Created", "Age Bin", "Age"], //if cols not included it defaults to data headers
                    //data in pairs colname and sortorder.  sortorder = 1 for acsending, -1 for decsenong
                    //the sort is left to right e.g. ["Priority", 1, "Created", 1] means sort by Priority first then Created
                    sortcols: ["Created", 1],
                    maxentries: 20,
                },
            }
        },

        // }
    }
}
