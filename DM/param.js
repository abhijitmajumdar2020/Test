"use strict"

let params = {
    //global params
    reportdate: "2020-02-25",
    message: "These charts use assumed, but relastic, data. Complex programmes are sucessfully completed using similar metrics. Please click on the bar charts to see how display changes.",
    colors: ['#f1eef6', '#bdc9e1', '#74a9cf', '#0570b0'], //PuBu (purple blue)
    sections:
    {
        BUILD: {
            title: "Build",
            datasource: "https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/STORY.csv",
            data: [],
            charts: {
                trend: {
                    title: "Earned Value",
                    start: "2019-12-15",
                    end: "2020-03-10",
                    callouts: [
                        { text: "Start", value: "2019-12-15" },
                        { text: "End", value: "2020-03-10" },
                    ],
                    type: {
                        style: "story",
                        
                        history: "History",
                        storypoints: "Effort",
                        earnedvalue: { "NEW": 0, "PRE-BUILD": .2, "BUILD": .5, "TEST": .7, "CLOSED": 1 },
                        forecast: 7,
                        plan(x, d) { x = x * 12 / d - 6; return Math.exp(x) / (Math.exp(x) + 1) },
                    }
                },
                bars: {
                    title: "Stories",
                    filters: [
                        { col: "Tech", values: ["MF", "WEB"], measure: {type: "Sum", col: "Effort"}}, 
                        { col: "Area", values: ["AML", "LOAN", "SAVE"], measure: {type: "Average", col: "Effort"} }, 
                    ]
                },
                table: {
                    title: "List of Stories",
                    colstoinclude: ["ID", "Tech", "Area", "Effort"],
                    maxentries: 5,
                },
            }
        },
        SIT: {
            title: "Test",
            datasource: "https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/SIT.csv",
            data: [],
            charts: {
                trend: {
                    title: "Test Execution Trend",
                    start: "2020-01-20",
                    end: "2020-03-15",
                    callouts: [
                        { text: "Test Start", value: "2020-01-20" },
                        { text: "Test End", value: "2020-03-15" },
                    ],
                    type: {
                        style: "test",
                        executed: ["Executed", "Status", ["PASS", "FAIL"]],//select rows where this col is in the array
                        passed: ["PASS"],
                        scope: "Created",
                        forecast: 7,
                        //sigmoid with 1.4 test execution ///////////////////////////////////////////////////////
                        plan(x, d) { x = x * 12 / d - 6; return 1.4 * Math.exp(x) / (Math.exp(x) + 1) },
                    }
                },
                bars: {
                    title: "Scripts Counts",
                    filters: [
                        { col: "Tech", values: ["MF", "WEB"] },
                        { col: "Area", values: ["AML", "LOAN", "SAVE"] },
                        { col: "Status", values: ["PASS", "FAIL", "BLOCK", "NO RUN"], nofilter: true },
                        { col: "Priority", values: ["P1", "P2", "P3", "P4"] },
                    ]
                },
                table: {
                    title: "List of Test Scripts",
                },
            }
        },
        DEFECT: {
            title: "Active Defects",
            datasource: "https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/DEFECT.csv",
            data: [],
            calculatedcols: {
                Age(row) { return dateDiff(row["Created"], row["Closed"] == "" ? params.reportdate : row["Closed"]) },
             },
            charts: {
                trend: {
                    title: "Active Defect Trend",
                    start: "2020-01-20",
                    end: "2020-03-15",
                    ageFilter: "Age Bin",
                    callouts: [
                        { text: "Test Start", value: "2020-01-20" },
                        { text: "Test End", value: "2020-03-15" },
                    ],
                    type: {
                        style: "defect",
                        raised: "Created",
                        resolved: "Closed",
                        forecast: 7, 
                    }
                },
                bars: {
                    title: "Active Defect Counts",
                    include(row) { return (row["Closed"] == "") },
                    filters: [
                        { col: "Area", values: ["AML", "LOAN", "SAVE"] },
                        { col: "Priority", values: ["P1", "P2", "P3", "P4"] },
                        { col: "Tech", values: ["MF", "WEB"] },
                        { col: "Status", values: ["NEW", "BUILD", "TEST"], nofilter: true },
                        {
                            col: "Age", values: ["5D-", "5-10D", "10-15D", "15D+"],
                            nofilter: true,
                            bin: "auto", //bin: {bins: [5, 10, 15], labels: ["5D-", "5-10D", "10-15D", "15D+"] },
                        },
                    ]
                },
                table: {
                    title: "List of Active Defects",
                    colstoinclude: ["ID", "Tech", "Area", "Status", "Priority", "Created", "Age"], //if cols not included it defaults to data headers
                    sortcols: ["Created", 1],
                    maxentries: 20,
                },
            }
        },
    }
}