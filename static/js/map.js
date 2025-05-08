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
                d3.select(this).attr("fill", "orange");
                let countryName = d.properties.admin;
                if (dataCountries.has(countryName)) {
                    d3.select("#svg_map").append("text")
                        .attr("id", "tooltip")
                        .attr("x", event.pageX - mapWidth / 2)
                        .attr("y", event.pageY - mapHeight / 2 - 10)
                        .attr("font-size", "12px")
                        .text(countryName);
                }
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", d => dataCountries.has(d.properties.admin) ? "steelblue" : "#ccc");
                d3.select("#tooltip").remove();
            })
            .on("click", function(event, d) {
                let countryName = d.properties.admin.replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
                if (dataCountries.has(countryName)) {
                    console.log("Calling initScatterplot with pcaData:", pcaData, "and countryName:", countryName);
                    initScatterplot(pcaData, countryName);
                    let selectedIndicator = document.getElementById('indicator_change').value;
                    console.log("Map clicked - Calling drawLinePlot with countryName:", countryName, "and selectedIndicator:", selectedIndicator);
                    drawLinePlot(countryName, selectedIndicator);
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