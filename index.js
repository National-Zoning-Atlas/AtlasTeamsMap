function map(mapdata) {
  const width = 875,
    height = 510;

  const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, 975, 610])
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("style", "width: 100%; height: auto; height: intrinsic;");

  const usa = svg
    .append('g')
    .append('path')
    .datum(topojson.feature(mapdata, mapdata.objects.nation))
    .attr('d', d3.geoPath())

  const state = svg
    .append('g')
    .attr('stroke', '#ffffff')
    .selectAll('path')
    .data(topojson.feature(mapdata, mapdata.objects.states).features)
    .join('path')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr('d', d3.geoPath())
    .attr("fill", function (d) {
      if (d.properties["Has Team"] === "Y") {
        return "#006999";
      } else if (d.properties["Has Team"] === "N") {
        return "#c0c0c0";
      }
    })
    .attr(`hasteam`, (d) => d.properties[`Has Team`])
    .on("mouseover", function (d) {
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
    .on("mouseout", function (d) {
      d3.selectAll("path[hasteam='Y']")
        .transition()
        .duration(150)
        .style("opacity", 1);
    })
    .attr('url', (d) => d.properties.URL)
    .style("cursor", function (d) {
      if (d.properties.URL) {
        return "pointer";
      } else {
        return "default";
      }
    })
    .on("click", function (d) {
      if (d3.select(this).attr("url")) {
        window.open(d3.select(this).attr("url"), "_blank");
      }
    });


    const logos = svg.selectAll("image")
    .data(topojson.feature(mapdata, mapdata.objects.states).features)
    .enter()
    .filter((d) => d.properties["Has Team"] === "Y")
    .append("image")
    .attr("xlink:href", (d) => d.properties.LogoURL)
    .attr("width", 50)
    .attr("height", 50)
    .attr("x", (d) => d3.geoPath().centroid(d)[0] - 25)
    .attr("y", (d) => d3.geoPath().centroid(d)[1] - 25);

  // Force simulation to prevent overlap and push logos outside nation geometry
  const simulation = d3.forceSimulation(logos.data())
    .force("x", d3.forceX((d) => d3.geoPath().centroid(d)[0]).strength(0.2))
    .force("y", d3.forceY((d) => d3.geoPath().centroid(d)[1]).strength(0.2))
    .force("collide", d3.forceCollide(55))
    .force("nation", (alpha) => {
      logos.each(function (d) {
        const nationGeom = mapdata.objects.nation;
        const point = { type: "Point", coordinates: [d.x, d.y] };
        if (d3.geoContains(topojson.feature(mapdata, nationGeom), point)) {
          const closest = d3.geoInterpolate(point.coordinates, d3.geoPath().centroid(d))(1 + alpha * 0.1);
          d.x += (closest[0] - d.x) * alpha;
          d.y += (closest[1] - d.y) * alpha;
        }
      });
    })
    .on("tick", () => {
      logos
        .attr("x", (d) => d.x - 25)
        .attr("y", (d) => d.y - 25);
    });

}

window.addEventListener('DOMContentLoaded', async (event) => {
  const res = await fetch(`atlasteams.json`)
  const mapJson = await res.json()
  map(mapJson)
});
