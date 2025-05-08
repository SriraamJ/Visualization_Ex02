function drawLinePlot(countryName, selectedIndicator) {
    console.log("drawLinePlot called with countryName:", countryName, "selectedIndicator:", selectedIndicator);

    if (!data || !Array.isArray(data)) {
        console.error("Data is not defined or not an array");
        return;
    }

    let uniqueCountries = [...new Set(data.map(d => d["Country Name"]))];
    let yearField = Object.keys(data[0]).find(key => key.toLowerCase().includes("year")) || "Year";
    let uniqueYears = [...new Set(data.map(d => d[yearField]))];

    let svg = d3.select("#svg_lineplot");
    if (svg.empty()) {
        console.error("svg_lineplot element not found in the DOM");
        return;
    }
    svg.attr("width", 600) // Increased from 400 to 600
       .attr("height", 300);

    svg.selectAll("*").remove();

    let margin = {top: 20, right: 20, bottom: 50, left: 40}; // Increased bottom margin for better X-axis label spacing
    let width = 600 - margin.left - margin.right; // Now 540px for the plotting area
    let height = 300 - margin.top - margin.bottom;

    let g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let countryData = [];
    data.forEach((d) => {
        let countryField = Object.keys(d).find(key => key.toLowerCase().includes("country name")) || "Country Name";
        let normalizedName = d[countryField] ? d[countryField].replace(/, Arab Rep\.|Islamic Rep\./g, "").trim() : "";
        let year = +d[yearField];
        let matches = normalizedName === countryName && year >= 1960 && year <= 2020;
        if (matches) {
            countryData.push(d);
        }
    });
    countryData.sort((a, b) => +a[yearField] - +b[yearField]);

    console.log("Filtered countryData for", countryName, ":", countryData);

    if (countryData.length === 0) {
        console.warn("No data available for", countryName, "between 1960-2020");
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text("No data available for " + countryName);
        return;
    }

    let validData = countryData.filter(d => {
        let value = +d[selectedIndicator];
        return !isNaN(value);
    });

    console.log("Valid data points after filtering NaN values:", validData);

    if (validData.length === 0) {
        console.warn("No valid numeric data for", selectedIndicator, "in", countryName);
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text("No valid data for " + selectedIndicator);
        return;
    }

    let xScale = d3.scaleLinear()
        .domain([1960, 2020])
        .range([0, width]);

    let yValues = validData.map(d => +d[selectedIndicator]);
    let yMin = Math.min(0, d3.min(yValues));
    let yMax = d3.max(yValues);
    let yScale = d3.scaleLinear()
        .domain([yMin, yMax * 1.1])
        .range([height, 0])
        .nice();

    let line = d3.line()
        .x(d => xScale(+d[yearField]))
        .y(d => yScale(+d[selectedIndicator]))
        .defined(d => !isNaN(+d[selectedIndicator]));

    g.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 1)
        .attr("d", line);

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(12)) // Increased ticks for better granularity
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40) // Adjusted Y position due to increased bottom margin
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Year");

    g.append("g")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -30)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(selectedIndicator);

    console.log("Line plot rendered successfully for", countryName);
}