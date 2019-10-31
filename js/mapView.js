const showDistance = !true;
const showRoutes = !true;

// select the svg container first
const svg = d3.select('.canvas')
    .append('svg')
        .attr('width', 1000)
        .attr('height', 1200);

// create margins & dimensions
const margin = {top: 20, right: 20, bottom: 20, left: 20};
const graphWidth = 600 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

const graph = svg.append('g')
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// ordinal colour scale for distance
const colourDist = d3.scaleOrdinal(d3["schemeSet2"])
    .domain([0, 1, 2, 3, 4, 5, 6]);

// d3.json('../data/map.json').then(data => {

//    updateMap(data);

//});

map = new Map(8, 10);
updateMap(map);
console.log(map.distances);
console.log(map.routes);

function updateMap(map) {
    gridData = map.makeHexGrid();

    const gridPaths = graph.selectAll('path')
        .data(gridData);

    gridPaths.exit()
        .remove();

    gridPaths.enter()
        .append('path')
        .attr('class', 'grid-hex')
        .attr('stroke', '#000')
        .attr('fill', '#fff')
        .attr('stroke-width', 2)
        .attr('d', d => d.d);

    const gridLabels = graph.selectAll('text')
        .data(gridData);

    gridLabels.exit()
        .remove();

    gridLabels.enter()
        .append('text')
        .attr('class', 'grid-label')
        .attr('fill', '#666')
        .attr('x', d => d.labelX)
        .attr('y', d => d.labelY)
        .attr('font-family', 'monospace')
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .text(d => d.label);

    if (showRoutes) {
        const jumpRoutes = graph.selectAll('path.jump-route')
            .data(map.jumpRoutePaths);

        jumpRoutes.exit()
            .remove();

        jumpRoutes.enter()
            .append('path')
            .attr('class', 'jump-route')
            .attr('stroke', d => colourDist(d.distance))
            .attr('stroke-width', 5)
            .attr('stroke-opacity', 0.5)
            .attr('d', d => d.d);
    }

    const planetLabels = graph.selectAll('text.planet-labels')
        .data(Object.values(map.props.systems));

    planetLabels.exit()
        .remove();

    planetLabels.enter()
        .append('text')
        .attr('class', 'planet-label')
        .attr('fill', '#000')
        .attr('x', d => d.x)
        .attr('y', d => d.labelY)
        .attr('font-family', 'monospace')
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .text(d => d.world.profile);
        
    const starportLabels = graph.selectAll('text.planet-labels')
        .data(Object.values(map.props.systems));

    starportLabels.exit()
        .remove();

    starportLabels.enter()
        .append('text')
        .attr('class', 'planet-label')
        .attr('fill', '#000')
        .attr('x', d => d.x)
        .attr('y', d => d.starportLabelY)
        .attr('font-family', 'monospace')
        .attr('font-size', 18)
        .attr('text-anchor', 'middle')
        .text(d => d.world.profile[0]);
        

    const planetMarkers = graph.selectAll('circle.planet')
        .data(Object.values(map.props.systems).filter(d => !d.asteroid));

    planetMarkers.exit()
        .remove();

    planetMarkers.enter()
        .append('circle')
        .attr('class', 'planet')
        .attr('fill', d => d.fill)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 6);

    const asteroidMarkers = graph.selectAll('circle.asteroid')
        .data(map.asteroids);

    asteroidMarkers.exit()
        .remove();

    asteroidMarkers.enter()
        .append('circle')
        .attr('class', 'asteroid')
        .attr('fill', d => d.fill)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.r);

    const gasGiantRingMarkers = graph.selectAll('ellipse.gas-giant-ring')
        .data(Object.values(map.props.systems).filter(d => d.world.props.gasGiant));

    gasGiantRingMarkers.exit()
        .remove();

    gasGiantRingMarkers.enter()
        .append('ellipse')
        .attr('class', 'gas-giant-ring')
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('fill', '#fff')
        .attr('cx', d => d.gasGiantX)
        .attr('cy', d => d.gasGiantY)
        .attr('rx', 8)
        .attr('ry', 2)
        .attr('transform', d => `rotate(-20, ${d.gasGiantX}, ${d.gasGiantY})`);

    const gasGiantMarkers = graph.selectAll('circle.gas-giant')
        .data(Object.values(map.props.systems).filter(d => d.world.props.gasGiant));

    gasGiantMarkers.exit()
        .remove();

    gasGiantMarkers.enter()
        .append('circle')
        .attr('class', 'gas-giant')
        .attr('fill', '#000')
        .attr('cx', d => d.gasGiantX)
        .attr('cy', d => d.gasGiantY)
        .attr('r', 4);

    if (showDistance) {
        // add events
        graph.selectAll('.grid-hex')
            .on('mouseover', (d, i, n) => {
                handleHexMouseOverDistance(d, i, n);
            })
            .on('mouseout', (d, i, n) => {
                handleHexMouseOutDistance(d, i, n);
            });
    }
}

// Hover functions
// event handlers
const handleHexMouseOverDistance = (d, i, n) => {
    var neighbours = map.hexagonNeighbours(n[i].__data__['label'], 6);
    n.forEach( n_ => {
        if (n_.__data__['label'] in neighbours) {
            d3.select(n_)
                .transition('changeHexFill').duration(300)
                .attr('fill', colourDist(neighbours[n_.__data__['label']]))
                .attr('fill-opacity', 0.5);
        }
    });
};
  
const handleHexMouseOutDistance = (d,i,n) => {
    var neighbours = map.hexagonNeighbours(n[i].__data__['label'], 6);
    n.forEach( n_ => {
        if (n_.__data__['label'] in neighbours) {
            d3.select(n_)
                .transition('changeHexFill').duration(300)
                .attr('fill', '#fff');
        }
    });
};