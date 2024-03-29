const showDistance = !true;
const showRoutes = true;
const subsectors = [2, 2]
const subsectorDim = [8, 10]
;
// select the svg container first
const svg = d3.select('.canvas')
    .append('svg')
        .attr('width', 75*subsectorDim[0]*subsectors[0]+3)
        .attr('height', (50*subsectorDim[1]*subsectors[1]+50)*Math.sqrt(3)+3);

// create margins & dimensions
const margin = {top: 1.5, right: 1.5, bottom: 1.5, left: 1.5};
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

const tipSystem = d3.tip()
  .attr('class', 'd3-tip system-tip')
  .direction('se')
  .html(d => {
    let content = '<div><b><u>System Summary</u></b></div>';
    content += `<div><b>Starport:</b> <span id="starport">${d.world.starport}</span></div>`
    content += `<div><b>Size:</b> <span id="size">${d.world.size}</span></div>`
    content += `<div><b>Atmosphere:</b> <span id="atmo">${d.world.atmo}</span></div>`
    content += `<div><b>Temperature:</b> <span id="temp">${d.world.temp}</span></div>`
    content += `<div><b>Hydrographics:</b> <span id="hydro">${d.world.hydro}</span></div>`
    content += `<div><b>Population:</b> <span id="pop">${d.world.pop}</span></div>`
    content += `<div><b>Government:</b> <span id="gov">${d.world.gov}</span></div>`
    content += `<div><b>Law Level:</b> <span id="lawlvl">${d.world.lawlvl}</span></div>`
    content += `<div><b>Tech Level:</b> <span id="tl">${d.world.tl}</span></div>`
    content += `<div><b>Cultural Difference:</b> <span id="cultural">${d.world.cultural}</span></div>`
    content += `<div><b>Trade Codes:</b> <span id="tc">${d.world.tc}</span></div>`

    return content;
  });

graph.call(tipSystem);

const tipRoute = d3.tip()
  .attr('class', 'd3-tip route-tip')
  .direction('se')
  .html(d => {
    let content = '<div><b><u>Trade Routes:</u></b></div>';
    for (const [tr, reasons] of Object.entries(d.tradePartners)) {
        content += `<div><b>${tr.slice(0,4)}&ndash;${tr.slice(5,9)}</b></div>`;
        content += `<div>`;
        reasons.forEach(reason => {
            reason.forEach(r => {
                content += `${r}, `;
            });
            content = content.slice(0, -2);
            content += ' &harr; ';
        });
        content = content.slice(0, -8);
        content += `</div>`;
    }

    return content;
    })

graph.call(tipRoute);

map = new Map(subsectors, subsectorDim);
updateMap(map);
map.rollSystemLocations();
map.generateSystems();
map.determineJumps();
updateMap(map);

d3.json('data/worlds.json').then(data => {
    worldTables = data;
    map.determineTradeCodes();
    map.determineTradePartners();
    map.determineRoutes();
    graph.selectAll('*').remove()
    updateMap(map);
});

function updateMap(map) {
     gridData = map.makeHexGrid();

    const gridPaths = graph.selectAll('path')
        .data(gridData);

    gridPaths.exit()
        .remove();

    gridPaths.enter()
        .append('path')
        .attr('class', 'grid-hex')
        .attr('stroke', '#888')
        .attr('fill', '#fff')
        .attr('fill-opacity', 0)
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
            .attr('d', d => d.d)
            .attr('stroke-opacity', 0)
            .transition().duration(500)
            .attr('stroke-opacity', 0.5);
    }

    frameData = map.makeHexFrame();

    const frameRects = graph.selectAll('rect.grid-frame')
        .data(frameData);

    frameRects.exit()
        .remove();

    frameRects .enter()
        .append('line')
        .attr('class', 'grid-frame')
        .attr('stroke', '#000')
        //.attr('fill', '#fff')
        // .attr('fill-opacity', 0)
        .attr('stroke-width', 3)
        .attr('x1', d => d.x1)
        .attr('y1', d => d.y1)
        .attr('x2', d => d.x2)
        .attr('y2', d => d.y2);

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
        .attr('fill-opacity', 0)
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

    if (worldTables) {
        if (showDistance) {
            // add events
            graph.selectAll('.grid-hex')
                .on('mouseover', (d, i, n) => {
                    handleHexMouseOverDistance(d, i, n);
                })
                .on('mouseout', (d, i, n) => {
                    handleHexMouseOutDistance(d, i, n);
                });
        } else {
            graph.selectAll('.grid-hex')
                .on('mouseover', (d, i, n) => {
                    if ('world' in d) {
                        tipSystem.show(d, n[i]);   
                    }
                })
                .on('mouseout', d => tipSystem.hide());
        }

        if (map.routeMode == 'trade') {
            graph.selectAll('.jump-route')
            .on('mouseover', (d, i, n) => {
                tipRoute.show(d, n[i]);
                handleRouteMouseOver(d, i, n);

            })
            .on('mouseout', (d, i, n) => {
                tipRoute.hide();
                handleRouteMouseOut(d, i, n);
            });
        }
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

const handleRouteMouseOver = (d, i, n) => {
    d3.select(n[i])
        .transition('changeRouteOpacity').duration(100)
        .attr('stroke-opacity', 1);
};
  
const handleRouteMouseOut = (d,i,n) => {
    d3.select(n[i])
        .transition('changeRouteOpacity').duration(100)
        .attr('stroke-opacity', 0.5);
};