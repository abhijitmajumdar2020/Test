"use strict"
//colors from from https://colorbrewer2.org
//colors: ['#f6eff7','#bdc9e1','#67a9cf','#02818a'], // PuBuGn (purple, blue green) 
//colors: ['#edf8fb','#b3cde3','#8c96c6','#88419d']; // BuPu (blue purple)
//colors: ['#edf8fb','#b2e2e2','#66c2a4','#238b45'];// BuGn (blue green)
//colors: ['#f0f9e8','#bae4bc','#7bccc4','#2b8cbe'], // GnBu (green blue)
//colors: ['#f1eef6','#bdc9e1','#74a9cf','#0570b0'], //PuBu (purple blue)

let params = {
    //global params
    reportdate: "2020-02-25",
    message: "These charts use assumed, but relastic, data. Complex programmes are sucessfully completed using similar metrics. Please click on the bar charts to see how display changes.",
    colors: ['#f1eef6', '#bdc9e1', '#74a9cf', '#0570b0'], //PuBu (purple blue)
    sections:
    {
        RAID: {
            title: "RAID",
            datasource: "https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/RAID.csv",
            data: [],
            // calculatedcols: {
            //     Due(row) { return dateDiff(params.reportdate, row["Due Date"]) },
            // },
            charts: {
                trend: {
                    title: "Active RAID",
                    start: "2020-01-20",
                    end: "2020-03-15",
                    ageFilter: "Age Bin",
                    callouts: [
                        { text: "Test Start", value: "2020-01-20" },
                        { text: "Test End", value: "2020-03-15" },
                    ],
                    type: {
                        style: "raid",
                        duedate: "Due Date",
                        //raised: "Created",
                        //resolved: "Closed",
                        //executed: ["Executed", "Status", ["PASS","FAIL"]],//select rows where this col is in the array
                        //scope:  "Created",
                        //forecast: 7, //days to look back to forcast 
                        //plan: [0,1], //plan points ...[0] is high plan[1] is low must have scope to show plan
                    }
                },
                bars: {
                    title: "RAID List",
                    //include(row) { return (row["Closed"] == "") },
                    // //ID	Owner	Area	Status	Type	Due Date	Impact	Likelyhood	Dependency On
                    filters: [
                        //ID	Owner	Area	Status	Type	Due Date	Impact	Likelyhood	Dependency On
                        { col: "Type", values: ["RISK", "ACTION", "ISSUE", "DEPENDENCY"] },//, nofilter: true },
                        { col: "Impact", values: ["L", "M", "H"] },
                        { col: "Likelyhood", values: ["L", "M", "H"] },
                        { col: "Owner", values: ["Team1", "Team2"] },
                        { col: "Area" },//values: ["AML", "INVEST", "SAVE"] },
                        { col: "Resolver Team", values: ["Team1", "Team2", "Team3", "Team4", "Team5", "Team6"] },
                        // {
                        //     col: "Due", labels: ["Overdue", "0-7", "7+"],
                        //     bin: {bins: [0,7], labels: ["Overdue", "0-7", "7+"]},
                        // },
                    ]
                },
                table: {
                    title: "RAID List",
                    //colstoinclude: ["ID", "Tech", "Area", "Status", "Priority", "Created", "Age"], //if cols not included it defaults to data headers
                    //data in pairs colname and sortorder.  sortorder = 1 for acsending, -1 for decsenong
                    //the sort is left to right e.g. ["Priority", 1, "Created", 1] means sort by Priority first then Created
                    //sortcols: ["Created", 1],
                    maxentries: 20,
                },
            }
        },
        BUILD: {
            title: "Build",
            datasource: "https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/STORY.csv",
            data: [],
            charts: {
                trend: {
                    title: "Earned Value Trend",
                    start: "2019-12-15",
                    end: "2020-03-10",
                    callouts: [
                        { text: "Start", value: "2019-12-15" },
                        { text: "End", value: "2020-03-10" },
                    ],
                    type: {
                        style: "story",
                        //raised: "Created",
                        //resolved: "Closed",
                        history: "History",
                        storypoints: "Effort",
                        earnedvalue: { "NEW": 0, "PRE-BUILD": .2, "BUILD": .5, "TEST": .7, "CLOSED": 1 },
                        //executed: ["Executed", "Status", ["PASS","FAIL"]],//select rows where this col is in the array
                        //scope:  "Created",
                        forecast: 7, //days to look back to forcast 
                        //plan(x, d) { x = x * 12 / d - 6; return Math.exp(x) / (Math.exp(x) + 1) }, //sigmoid plan
                        plan(x, d) { return x / d }, //straightline plan
                    }
                },
                bars: {
                    title: "Stories",
                    //include (row) { return (row["ID"] == "ST132") },
                    filters: [
                        { col: "Tech", values: ["MF", "WEB"], measure: { type: "Sum", col: "Effort" } }, //type: ["Sum", "Effort"],
                        { col: "Area", values: ["AML", "LOAN", "SAVE"], measure: { type: "Average", col: "Effort" } }, //type: ["Sum", "Effort"],
                    ]
                },
                table: {
                    title: "List of Stories",
                    colstoinclude: ["ID", "Tech", "Area", "Effort"], //if cols not included it defaults to data headers
                    //data in pairs colname and sortorder.  sortorder = 1 for acsending, -1 for decsenong
                    //the sort is left to right e.g. ["Priority", 1, "Created", 1] means sort by Priority first then Created
                    //sortcols: ["Created", 1],
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
                        forecast: 7, //days to look back to forcast 
                        //sigmoid with 1.4 test execution ///////////////////////////////////////////////////////
                        plan(x, d) { x = x * 12 / d - 6; return 1.4 * Math.exp(x) / (Math.exp(x) + 1) },
                        //straight line with 1.4 test execution //////////////////////////////////////////////////
                        //plan (x, d) { return 1.4 * x / d }, 
                        //arbitrary plan path/////////////////////////////////////////////////////////////////////
                        // plan (x, d) {
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
                    title: "Scripts Counts",
                    filters: [
                        { col: "Tech", values: ["MF", "WEB"] },
                        { col: "Area", values: ["AML", "LOAN", "SAVE"] },
                        { col: "Status", values: ["PASS", "FAIL", "BLOCK", "NO RUN"], nofilter: true },
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
        //     datasource: "https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/UAT.csv",
        //     data: [],
        //     charts: {
        //         trend: {
        //             title: "UAT Execution Trend",
        //             start: "2020-01-20",
        //             end: "2020-03-15",
        //             callouts: [
        //                 { text: "Test Start", value: "2020-01-20" },
        //                 { text: "Test End", value: "2020-03-15" },],
        //             type: {
        //                 style: "test",
        //                 executed: ["Executed", "Status", ["PASS", "FAIL"]],//select rows where this col is in the array
        //                 scope: "Created",
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
        //                 { col: "Status", values: ["PASS", "FAIL", "BLOCK", "NO RUN"], nofilter: true },
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
                        //executed: ["Executed", "Status", ["PASS","FAIL"]],//select rows where this col is in the array
                        //scope:  "Created",
                        forecast: 7, //days to look back to forcast 
                        //plan: [0,1], //plan points ...[0] is high plan[1] is low must have scope to show plan
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
                    //data in pairs colname and sortorder.  sortorder = 1 for acsending, -1 for decsenong
                    //the sort is left to right e.g. ["Priority", 1, "Created", 1] means sort by Priority first then Created
                    sortcols: ["Created", 1],
                    maxentries: 20,
                },
            }
        },

        //     SPRINT: {
        //         title: "Sprints",
        //         datasource: "https://raw.githubusercontent.com/abhijitmajumdar2020/Test/master/DM/SPRINTS.csv",
        //         data: [],
        //         // calculatedcols: {
        //         //     Age (row) { return  dateDiff(row["Created"], row["Closed"] == "" ? params.reportdate : row["Closed"]) },
        //         //     "Age Bin" (row) { return (getAgeBucket(row["Created"], row["Closed"])) },
        //         // },
        //         //colors: ["#02818a", "#fff"],
        //         charts: {
        //             trend: {
        //                 title: "Story Burnup",
        //                 start: "2019-12-15",
        //                 end: "2020-03-25",
        //                 //ageFilter: "Age Bin",
        //                 callouts: [
        //                     { text: "S1 Start", value: "2019-12-23" },
        //                     { text: "S2 Start", value: "2020-01-13" },
        //                     { text: "S3 Start", value: "2020-02-03" },
        //                     { text: "S4 Start", value: "2020-02-24" },
        //                     { text: "S5 Start", value: "2020-03-16" }
        //                 ],
        //                 type: {
        //                     plan: (x, d) => { x = x * 12 / d - 6; return Math.exp(x) / (Math.exp(x) + 1) },
        //                     style: "story",
        //                     //raised: "Created",
        //                     //resolved: "Closed",
        //                     history: "History",
        //                     storypoints: "Story Points",
        //                     earnedvalue: { "NEW": 0, "PRE-BUILD": .2, "BUILD": .5, "TEST": .7, "CLOSED": 1 },
        //                     //executed: ["Executed", "Status", ["PASS","FAIL"]],//select rows where this col is in the array
        //                     //scope:  "Created",
        //                     forecast: 7, //days to look back to forcast 
        //                     //sigmoid plan ///////////////////////////////////////////////////////

        //                 }
        //             },
        //             bars: {
        //                 title: "Stories",
        //                 //include  (row) { return (row["ID"] == "ST132") },
        //                 filters: [
        //                     //{ col: "Team", values: ["T1", "T2"], type: ["Sum", "Story Points"] },
        //                     { col: "Sprint", values: ["SP1", "SP2", "SP3"] },
        //                     { col: "Sprint", values: ["SP1", "SP2", "SP3"], type: ["Sum", "Story Points"] },
        //                     { col: "Sprint", values: ["SP1", "SP2", "SP3"], type: ["Average", "Story Points"] },
        //                     { col: "Area", values: ["AML", "LOAN", "SAVE"] },
        //                     { col: "Area", values: ["AML", "LOAN", "SAVE"], type: ["Sum", "Story Points"] },
        //                     { col: "Area", values: ["AML", "LOAN", "SAVE"], type: ["Average", "Story Points"] },
        //                 ]
        //             },
        //             table: {
        //                 title: "List of Stories",
        //                 colstoinclude: ["ID", "Team", "Area", "Sprint", "Story Points"], //if cols not included it defaults to data headers
        //                 //data in pairs colname and sortorder.  sortorder = 1 for acsending, -1 for decsenong
        //                 //the sort is left to right e.g. ["Priority", 1, "Created", 1] means sort by Priority first then Created
        //                 //sortcols: ["Created", 1],
        //                 maxentries: 20,
        //             },
        //         }
        //     },
    }
}