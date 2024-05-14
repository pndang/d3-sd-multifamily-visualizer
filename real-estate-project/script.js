function main() {

    let mouseOver = function(d) {
        d3.select(this)
          .transition()
        //   .duration(200)
          .style("opacity", 0.5)
          .style("stroke", "gray");
          console.log(d)
          var submarket = d.relatedTarget.__data__.properties.name
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

    d3.json('../data/san-diego.geojson').then(
        function (mapData) {
            d3.csv('../data/clean_costar_data.csv').then(function (realEstateData) {
                var vacancyBySubmarket = new Map();
                var yearBySubmarket = new Map();
                var parkingBySubmarket = new Map();
                realEstateData.forEach(function(d) {
                    vacancyBySubmarket.set(d['Submarket'], +d['Vacancy %']);
                    yearBySubmarket.set(d['Submarket'], +d['Built/Renov']);
                    parkingBySubmarket.set(d['Submarket'], +d['Parking Spaces/Unit']);
                });

                mapData.features.forEach(function (feature) {
                    var submarket = feature.properties.name;
                    var vacancy = vacancyBySubmarket.get(submarket);
                    feature.properties.vacancy = vacancy || 0;
                    var year = yearBySubmarket.get(submarket);
                    feature.properties.year = year || 0;
                    var parking = parkingBySubmarket.get(submarket);
                    feature.properties.parking = parking || 0;
                });

                svg.selectAll("path")
                   .data(mapData.features)
                   .enter()
                   .append("path")
                   .attr("d", path)
                   .style("fill", function(d) { return colorScale(d.properties.vacancy); })
                   .style("stroke", "gray")
                   .style("stroke-width", 0.5)
                   .on('mouseover', mouseOver)
                   .on('mouseleave', mouseLeave);
            });
        }
    );
}