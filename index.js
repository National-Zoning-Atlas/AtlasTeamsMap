function map(mapdata) {
    const width=875,
      height=510;
  
    // Create an svg element to hold our map, and set it to the proper width and
    // height. The viewBox is set to a constant value becase the projection we're
    // using is designed for that viewBox size:
    // https://github.com/topojson/us-atlas#us-atlas-topojson
    const svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, 975, 610])
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("style", "width: 100%; height: auto; height: intrinsic;");


     // Create the US boundary
     const usa = svg
     .append('g')
     .append('path')
     .datum(topojson.feature(mapdata, mapdata.objects.nation))
     .attr('d', d3.geoPath())   

    // Create the state boundaries. "stroke" and "fill" set the outline and fill
    // colors, respectively.
    const state = svg
    .append('g')
    .attr('stroke', '#ffffff')
    .selectAll('path')
    .data(topojson.feature(mapdata, mapdata.objects.states).features)
    .join('path')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('d', d3.geoPath())
    .attr("fill", function(d) {
      if (d.properties["Has Team"] === "Y") {
        return "#006999";
      } else if (d.properties["Has Team"] === "N") {
        return "#c0c0c0";
      }
    })
    .attr(`hasteam`, (d) => d.properties[`Has Team`])
    .on("mouseover", function(d) {
      if (d3.select(this).attr("hasteam") === "Y") {
        d3.selectAll("path[hasteam='Y']")
          .transition()
          .duration(200)
          .style("opacity", 0.7);
        d3.select(this)
          .transition()
          .duration(150)
          .style("opacity", 1);
        } 
      })
      .on("mouseout", function(d) {
        d3.selectAll("path[hasteam='Y']")
          .transition()
          .duration(150)
          .style("opacity", 1);
      })
    .attr('url', (d) => d.properties.URL)
    .style("cursor", function(d) {
      if (d.properties.URL) {
        return "pointer";
      } else {
        return "default";
      }
    })
    .on("click", function(d) {
      if (d3.select(this).attr("url")) {
        window.open(d3.select(this).attr("url"), "_blank");
      }
    });
  
  }
  
  window.addEventListener('DOMContentLoaded', async (event) => {
    const res = await fetch(`atlasteams.json`)
    const mapJson = await res.json()
    map(mapJson)
  });