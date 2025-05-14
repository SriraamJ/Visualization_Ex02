let mapWidth = 800;
let mapHeight = 400;

function initMap() {
    let svg = d3.select("#svg_map")
        .attr("width", mapWidth)
        .attr("height", mapHeight);

    let projection = d3.geoMercator()
        .scale(100)
        .translate([mapWidth / 2, mapHeight / 2]);

    let path = d3.geoPath().projection(projection);

    let topoJsonUrl = "/static/data/world-topo.json";
    console.log("Attempting to load TopoJSON from URL:", topoJsonUrl);

    let selectedCountry = null; // Moved inside initMap to avoid global conflict

    d3.json(topoJsonUrl).then(function(topology) {
        console.log("TopoJSON loaded successfully:", topology);

        let countries = topojson.feature(topology, topology.objects.countries).features;
        console.log("Countries extracted:", countries);

        let dataCountries = new Set(data.map(d => {
            let name = d["Country Name"];
            return name.replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
        }));
        console.log("Normalized countries from CSV:", Array.from(dataCountries));

        svg.selectAll("path")
            .data(countries)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => dataCountries.has(d.properties.admin) ? "steelblue" : "#ccc")
            .attr("stroke", "#fff")
            .attr("class", d => `country-${d.properties.admin.replace(/[^a-zA-Z0-9]/g, "_")}`)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "red");
                let countryName = d.properties.admin;
                if (dataCountries.has(countryName)) {
                    d3.select("#svg_map").append("text")
                        .attr("id", "hover-tooltip")
                        .attr("class", "hover-tooltip")
                        .attr("x", event.pageX - mapWidth / 2 + 10)
                        .attr("y", event.pageY - mapHeight / 2 - 10)
                        .text(countryName);
                }
            })
            .on("mouseout", function() {
                let countryName = d3.select(this).datum().properties.admin;
                if (selectedCountry !== countryName) {
                    d3.select(this).attr("fill", dataCountries.has(countryName) ? "steelblue" : "#ccc");
                }
                d3.select("#hover-tooltip").remove();
            })
            .on("click", function(event, d) {
                let countryName = d.properties.admin.replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
                if (dataCountries.has(countryName)) {
                    // Reset the previously selected country's color
                    if (selectedCountry) {
                        svg.select(`.country-${selectedCountry.replace(/[^a-zA-Z0-9]/g, "_")}`)
                            .attr("fill", dataCountries.has(selectedCountry) ? "steelblue" : "#ccc");
                    }
                    // Highlight the newly selected country in red
                    d3.select(this).attr("fill", "red");
                    selectedCountry = countryName;

                    console.log("Calling initScatterplot with pcaData:", pcaData, "and countryName:", countryName);
                    initScatterplot(pcaData, countryName);
                    let selectedIndicator = document.getElementById('indicator_change').value;
                    console.log("Map clicked - Calling drawLinePlot with countryName:", countryName, "and selectedIndicator:", selectedIndicator);
                    drawLinePlot(countryName, selectedIndicator);

                    // Update tooltip content with the most recent year's data (up to 2020)
                    let tooltip = d3.select("#tooltip");
                    let countryData = data
                        .filter(d => {
                            let normalizedName = d["Country Name"] ? d["Country Name"].replace(/, Arab Rep\.|Islamic Rep\./g, "").trim() : "";
                            let yearField = Object.keys(d).find(key => key.toLowerCase().includes("year")) || "Year";
                            let year = +d[yearField];
                            return normalizedName === countryName && year >= 1960 && year <= 2020;
                        });

                    // Log all years available for the country
                    let yearsAvailable = countryData.map(d => {
                        let yearField = Object.keys(d).find(key => key.toLowerCase().includes("year")) || "Year";
                        return +d[yearField];
                    });
                    console.log("Years available for", countryName, ":", yearsAvailable);

                    // Sort by year in descending order
                    countryData.sort((a, b) => {
                        let yearField = Object.keys(a).find(key => key.toLowerCase().includes("year")) || "Year";
                        let yearA = +a[yearField];
                        let yearB = +b[yearField];
                        return yearB - yearA;
                    });

                    let tooltipContent = `Country: ${countryName}<br>`;
                    if (countryData.length > 0) {
                        let mostRecentEntry = countryData[0]; // Most recent entry (up to 2020)
                        console.log("Most recent entry for", countryName, ":", mostRecentEntry); // Debug log
                        let yearField = Object.keys(mostRecentEntry).find(key => key.toLowerCase().includes("year")) || "Year";
                        console.log("Detected year field:", yearField); // Debug log
                        let year = +mostRecentEntry[yearField];
                        tooltipContent += `Year: ${year}<br>`;
                        // Show up to five indicators
                        let indicatorsToShow = indicators.slice(0, 8); // Take the first 5 indicators
                        indicatorsToShow.forEach((indicator, index) => {
                            let value = mostRecentEntry[indicator];
                            tooltipContent += `${indicator}: ${value !== undefined && !isNaN(value) ? value : "N/A"}${index < 5 ? "<br>" : ""}`;
                        });
                    } else {
                        tooltipContent += "No data available between 1960 and 2020";
                    }

                    tooltip.html(tooltipContent)
                        .style("display", "block");
                }
            });

        // Hide the tooltip when clicking the map background
        svg.on("click", function(event) {
            if (event.target.tagName !== "path") { // Only hide if not clicking a country
                d3.select("#tooltip").style("display", "none");
            }
        });
    }).catch(function(error) {
        console.error("Detailed error loading TopoJSON file:", error);
        svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", mapWidth)
            .attr("height", mapHeight)
            .attr("fill", "lightgray")
            .attr("stroke", "black");
        svg.append("text")
            .attr("x", mapWidth / 2)
            .attr("y", mapHeight / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Failed to load map data");
    });
}