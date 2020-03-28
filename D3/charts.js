function drawChart(data) {
    // set the dimensions and margins of the graph
    var margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#main")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Parse the Data
    //d3.json("data.json", function (data) {


    // X axis
    var x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(function (d) { return d.Country; }))
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 13000])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) { return x(d.Country); })
        .attr("y", function (d) { return y(d.Value); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.Value); })
        .attr("fill", "#69b3a2")
}
function x(d) {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#main")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr('id', 'xxx')
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    var x = d3.scaleLinear()
        .domain([1, 100])
        .range([0, width]);

    svg.append("g")
        .attr('id', 'yyy')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 13])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_IC.csv", function (data) {

        // Show confidence interval
        svg.append("path")
            .datum(data)
            .attr("fill", "#cce5df")
            .attr("stroke", "none")
            .attr("d", d3.area()
                .x(function (d) { return x(d.x) })
                .y0(function (d) { return y(d.CI_right) })
                .y1(function (d) { return y(d.CI_left) })
            )

        // Add the line
        svg
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) { return x(d.x) })
                .y(function (d) { return y(d.y) })
            )
    })
}

function xx() {
    d3.csv("data.csv").then(function(data) {
        data.forEach(function(d) {
            d.y = +d.y;
        });
    console.log(data[0]);
    drawlinechart(data);
});
 
    //var d = d3.range(10).map(function (d) { return { "y": d3.randomUniform(1)() } });
    //drawlinechart(d);
    //d = d3.range(10).map(function (d) { return { "y": d3.randomUniform(10)() } });
    //drawlinechart(d);
    //d = d3.range(10).map(function (d) { return { "y": d3.randomUniform(6)() } });
    //drawlinechart(d);
}
function drawlinechart(dataset) {
    // 2. Use the margin convention practice 
    // var margin = { top: 50, right: 50, bottom: 50, left: 50 }
    //     , width = window.innerWidth - margin.left - margin.right // Use the window's width 
    //     , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

    var margin = { top: 50, right: 50, bottom: 50, left: 50 }
        , width = 460 - margin.left - margin.right // Use the window's width 
        , height = 400 - margin.top - margin.bottom; // Use the window's height

    // The number of datapoints
    //var dataset = d3.range(10).map(function (d) { return { "y": d3.randomUniform(1)() } })

    // 5. X scale will use the index of our data
    var xScale = d3.scaleLinear()
        .domain([0, dataset.length - 1]) // input
        .range([0, width]); // output

    // 6. Y scale will use the randomly generate number 
    let ext = d3.extent(dataset, d => d.y);
    if (ext[0] > 0) ext[0] = 0;
    ext[1] = Math.round(ext[1] * 1.6, 0);
    //ext = [0,10];
    console.log(ext);
    var yScale = d3.scaleLinear()
        .domain(ext) // input 
        .range([height, 0]); // output 

    // 7. d3's line generator
    var line = d3.line()
        .x(function (d, i) { return xScale(i); }) // set the x values for the line generator
        .y(function (d) { return yScale(d.y); });// set the y values for the line generator 
    //.curve(d3.curveMonotoneX) // apply smoothing to the line

    // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
    //var dataset = d3.range(n).map(function (d) { return { "y": d3.randomUniform(1)() } })

    // 1. Add the SVG to the page and employ #2
    var svg = d3.select("#main").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr('fill', 'lightgray')
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // 3. Call the x axis in a group tag
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

    // 4. Call the y axis in a group tag
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

    // 9. Append the path, bind the data, and call the line generator 
    svg.append("path")
        .datum(dataset)
        .attr("fill", "#cce5df")
        .attr("stroke", "none")
        .attr("d", d3.area()
            .x(function (d, i) { return xScale(i) })
            .y0(function (d) { return yScale(d.y * .9) })
            .y1(function (d) { return yScale(d.y * 1.1) })
        );
    svg.append("path")
        .datum(dataset) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", line); // 11. Calls the line generator 

    // 12. Appends a circle for each datapoint 
    // svg.selectAll(".dot")
    //     .data(dataset)
    //     .enter().append("circle") // Uses the enter().append() method
    //     .attr("class", "dot") // Assign a class for styling
    //     .attr("cx", function (d, i) { return xScale(i) })
    //     .attr("cy", function (d) { return yScale(d.y) })
    //     .attr("r", 5);


}
