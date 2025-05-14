let scatterWidth = 400;
let scatterHeight = 400;

function initScatterplot(pcaData, selectedCountry = null) {
    console.log("initScatterplot called with pcaData:", pcaData);
    console.log("Selected country:", selectedCountry);

    if (!pcaData || !Array.isArray(pcaData) || pcaData.length === 0) {
        console.error("pcaData is invalid or empty");
        return;
    }

    let svg = d3.select("#svg_plot")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight);

    svg.selectAll("*").remove();

    let margin = {top: 30, right: 50, bottom: 50, left: 50};
    let width = scatterWidth - margin.left - margin.right;
    let height = scatterHeight - margin.top - margin.bottom;

    let g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let xScale = d3.scaleLinear()
        .domain(d3.extent(pcaData, d => d.PCA2).map((d, i) => d + (i === 0 ? 1 : -1)))
        .range([0, width])
        .nice();

    let yScale = d3.scaleLinear()
        .domain(d3.extent(pcaData, d => d.PCA1).map((d, i) => d + (i === 0 ? 1 : -1)))
        .range([height, 0])
        .nice();

    console.log("xScale domain (PCA2):", xScale.domain(), "range:", xScale.range());
    console.log("yScale domain (PCA1):", yScale.domain(), "range:", yScale.range());

    let dataCountries = new Set(data.map(d => {
        let name = d["Country Name"];
        return name.replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
    }));

    let dots = g.selectAll("circle")
        .data(pcaData);

    dots.enter()
        .append("circle")
        .merge(dots)
        .attr("cx", d => {
            let value = xScale(d.PCA2);
            if (isNaN(value)) console.error("Invalid cx for", d["Country Name"], "PCA2:", d.PCA2);
            return value;
        })
        .attr("cy", d => {
            let value = yScale(d.PCA1);
            if (isNaN(value)) console.error("Invalid cy for", d["Country Name"], "PCA1:", d.PCA1);
            return value;
        })
        .attr("r", 5)
        .attr("fill", d => {
            let normalizedName = d["Country Name"].replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
            return normalizedName === selectedCountry ? "red" : "steelblue";
        })
        .attr("class", d => `dot-${d["Country Name"].replace(/[^a-zA-Z0-9]/g, "_")}`)
        .on("mouseover", function(event, d) {
            let countryName = d["Country Name"].replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
            if (dataCountries.has(countryName)) {
                d3.select(`.country-${countryName.replace(/[^a-zA-Z0-9]/g, "_")}`)
                    .attr("fill", "red");
            }
        })
        .on("mouseout", function(event, d) {
            let countryName = d["Country Name"].replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
            if (dataCountries.has(countryName)) {
                d3.select(`.country-${countryName.replace(/[^a-zA-Z0-9]/g, "_")}`)
                    .attr("fill", dataCountries.has(countryName) ? "steelblue" : "#ccc");
            }
        })
        .on("click", function(event, d) {
            let countryName = d["Country Name"].replace(/, Arab Rep\.|Islamic Rep\./g, "").trim();
            let selectedIndicator = document.getElementById('indicator_change').value;
            console.log("Scatterplot dot clicked - drawLinePlot with country:", countryName, "and indicator:", selectedIndicator);
            drawLinePlot(countryName, selectedIndicator);
        });

    dots.exit().remove();

    console.log("Dots added:", g.selectAll("circle").size());

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("PCA2");

    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -30)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("PCA1");
}