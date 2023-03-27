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


// Helper function to check if a point is inside any state or nation
function isInsideStateOrNation(point, nationGeom, stateGeoms) {
  if (d3.geoContains(nationGeom, point)) {
    return stateGeoms.some((stateGeom) => d3.geoContains(stateGeom, point));
  }
  return false;
}

// Helper function to find the best position for the logo
function findBestLogoPosition(state, nationGeom, stateGeoms, stepSize) {
  const centroid = d3.geoPath().centroid(state);
  let bestPosition = centroid;
  let minDistance = Infinity;

  const bounds = d3.geoBounds(nationGeom);
  const left = bounds[0][0];
  const right = bounds[1][0];
  const top = bounds[0][1];
  const bottom = bounds[1][1];

  for (let x = left; x <= right; x += stepSize) {
    for (let y = top; y <= bottom; y += stepSize) {
      const point = { type: "Point", coordinates: [x, y] };
      if (!isInsideStateOrNation(point, nationGeom, stateGeoms)) {
        const distance = Math.hypot(x - centroid[0], y - centroid[1]);
        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = [x, y];
        }
      }
    }
  }

  return bestPosition;
}

const nationGeom = topojson.feature(mapdata, mapdata.objects.nation);
const stateGeoms = topojson.feature(mapdata, mapdata.objects.states).features;

// Add logos for states with teams
const logos = svg.selectAll("image")
  .data(topojson.feature(mapdata, mapdata.objects.states).features)
  .enter()
  .filter((d) => d.properties["Has Team"] === "Y")
  .append("image")
  .attr("xlink:href", (d) => d.properties.LogoURL)
  .attr("width", 50)
  .attr("height", 50);

// Calculate the best position for each logo
logos.each(function (d) {
  const bestPosition = findBestLogoPosition(d, nationGeom, stateGeoms, 5);
  d3.select(this)
    .attr("x", bestPosition[0] - 25)
    .attr("y", bestPosition[1] - 25);
});

}

window.addEventListener('DOMContentLoaded', async (event) => {
  const res = await fetch(`atlasteams.json`)
  const mapJson = await res.json()
  map(mapJson)
});
