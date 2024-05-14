function main() {

    let mouseOver = function(d) {
        d3.select(this)
          .transition()
        //   .duration(1000)
          .style("opacity", 0.5)
          .style("stroke", "gray");
          console.log(d);
          var submarket = d.relatedTarget.__data__.properties.name
          console.log("test2");
          var vacancy = d.relatedTarget.__data__.properties.vacancy
          var year = d.relatedTarget.__data__.properties.year
          var parking = d.relatedTarget.__data__.properties.parking
          tooltip.html("<strong>Submarket:</strong> " + submarket + "<br>" + "<strong>Vacancy Rate:</strong> " + vacancy + "%" + "<br>" + "<strong>Mean built/renov year:</strong> " + year + "<br>" + "<strong>Median Parking/Unit:</strong> " + parking);
          tooltip.style("visibility", "visible");
    }
    
    let mouseLeave = function(d) {
        d3.select(this)
            .transition()
            // .duration(200)
            .style("opacity", 1)
            .style("stroke", "gray")
            tooltip.style("visibility", "hidden");
    }

    var tooltip = d3.select("body")
                    .append("div")
                    .style("position", "absolute")
                    .style("visibility", "hidden")
                    .style("background", "#FFC0CB")
                    .text("a simple tooltip");

    // Define the SVG width and height
    var width = 800;
    var height = 600;

    // Create SVG element
    var svg = d3.select('body')
                .append('svg')
                .attr('width', width)
                .attr('height', height);
    
    var projection = d3.geoMercator()
                       .center([-117.16, 32.71])
                       .scale(80000)
                       .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
                 .projection(projection);
    
    var colorScale = d3.scaleSequential(d3.interpolateBlues)
                       .domain([0, 5]);

    var legendWidth = 200;
    var legendHeight = 20;
    var legendX = 20;
    var legendY = height - 50;
    var legendTickValues = [0, 1, 2, 3, 4, 5];

    var legendColorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 5]);

    var legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + legendX + "," + legendY + ")");

    legend.append("text")
        .attr("class", "legendTitle")
        .attr("x", 0)
        .attr("y", -10)
        .text("Vacancy (%)")
        .style("font-weight", "bold");
              
    legend.selectAll(".legendRect")
        .data(d3.range(0, 1.01, 0.1)) 
        .enter().append("rect")
        .attr("class", "legendRect")
        .attr("x", function(d, i) { return i * legendWidth / 10; })
        .attr("y", 0)
        .attr("width", legendWidth / 10)
        .attr("height", legendHeight)
        .attr("fill", function(d) { return legendColorScale(d * 5); });
              
    legend.selectAll(".legendText")
        .data(legendTickValues)
        .enter().append("text")
        .attr("class", "legendText")
        .attr("x", function(d, i) { return i * legendWidth / (legendTickValues.length - 1) - 4; })
        .attr("y", legendHeight * 2)
        .text(function(d) { return d; });
              
    legend.selectAll(".legendLine")
        .data(legendTickValues)
        .enter().append("line")
        .attr("class", "legendLine")
        .attr("x1", function(d, i) { return i * legendWidth / (legendTickValues.length - 1); })
        .attr("y1", legendHeight * 0)
        .attr("x2", function(d, i) { return i * legendWidth / (legendTickValues.length - 1); })
        .attr("y2", legendHeight * 1.2)
        .attr("stroke", "black");

    function attachEventListeners() {
        svg.selectAll("path")
        .on('mouseover', mouseOver)
        .on('mouseleave', mouseLeave);
    }

    d3.json('data/san-diego.geojson').then(
        function (mapData) {
            d3.csv('data/clean_costar_data.csv').then(function (realEstateData) {
                var vacancyBySubmarket = new Map();
                var yearBySubmarket = new Map();
                var parkingBySubmarket = new Map();
                var unitBySubmarket = new Map();
                realEstateData.forEach(function(d) {
                    vacancyBySubmarket.set(d['Submarket'], +d['Vacancy %']);
                    yearBySubmarket.set(d['Submarket'], +d['Built/Renov']);
                    parkingBySubmarket.set(d['Submarket'], +d['Parking Spaces/Unit']);
                    unitBySubmarket.set(d['Submarket'], +d['Units']);
                });

                mapData.features.forEach(function (feature) {
                    var submarket = feature.properties.name;
                    var vacancy = vacancyBySubmarket.get(submarket);
                    feature.properties.vacancy = vacancy || 0;
                    var year = yearBySubmarket.get(submarket);
                    feature.properties.year = year || 0;
                    var parking = parkingBySubmarket.get(submarket);
                    feature.properties.parking = parking || 0;
                    var units = unitBySubmarket.get(submarket);
                    feature.properties.units = units || 0;
                });

                function updateVisualization(selectedUnitRange) {
                    console.log(selectedUnitRange)
                    var filteredData = mapData.features.filter(function(d) {
                        var units = +d.properties.units;
                        switch (selectedUnitRange) {
                            case '0-9':
                                return units >= 0 && units <= 9;
                            case '10-49':
                                return units >= 10 && units <= 49;
                            case '50-199':
                                return units >= 50 && units <= 199;
                            case '200-499':
                                return units >= 200 && units <= 499;
                            case '500+':
                                return units >= 500;
                            case 'All':
                                return true;
                            default:
                                return true;
                        }
                        attachEventListeners();
                    });

                    svg.selectAll("path")
                       .data(filteredData)
                       .enter()
                       .append("path")
                       .attr("d", path)
                       .style("fill", function(d) { return colorScale(d.properties.vacancy); })
                       .style("stroke", "gray")
                       .style("stroke-width", 0.5)
                       .on('mouseover', mouseOver)
                       .on('mouseleave', mouseLeave);
                }

                function processButtonInput() {
                    var radioVal = document.querySelector('input[name="unitRange"]:checked').value;
                    updateVisualization(radioVal);
                  }
                  
                // Event listener to the radio button
                d3.select("#unitRange").on("change", processButtonInput )

                // processButtonInput(54);
                updateVisualization("50-199");

            });
        }
    );
}