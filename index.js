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


    // Add logos for states with teams
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

  const quadtree = d3.quadtree()
    .extent([[-1, -1], [width + 1, height + 1]])
    .addAll(logos.data().map((d) => [d.x, d.y]));

  function findClosestValidPosition(x, y, radius) {
    let bestX = x,
      bestY = y,
      bestDistance = Infinity;

    quadtree.visit((node, x0, y0, x1, y1) => {
      if (!node.length) {
        do {
          const dx = x - node.data[0],
            dy = y - node.data[1],
            d = Math.sqrt(dx * dx + dy * dy);

          if (d < bestDistance) {
            bestDistance = d;
            bestX = node.data[0] + (dx * radius) / d;
            bestY = node.data[1] + (dy * radius) / d;
          }
        } while (node = node.next);
      }

      return x0 > x + bestDistance || x1 < x - bestDistance || y0 > y + bestDistance || y1 < y - bestDistance;
    });

    return [bestX, bestY];
  }

  logos.each(function (d) {
    const nationGeom = topojson.feature(mapdata, mapdata.objects.nation);
    const point = { type: "Point", coordinates: [d.x, d.y] };
    if (d3.geoContains(nationGeom, point)) {
      const [newX, newY] = findClosestValidPosition(d.x, d.y, 55);
      d.x = newX;
      d.y = newY;
    }
  });

  logos
    .attr("x", (d) => d.x - 25)
    .attr("y", (d) => d.y - 25);

}

window.addEventListener('DOMContentLoaded', async (event) => {
  const res = await fetch(`atlasteams.json`)
  const mapJson = await res.json()
  map(mapJson)
});
