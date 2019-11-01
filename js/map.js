class Map {
    constructor(width, height) {
        this.props = {
            width: width,
            height: height,
            systems: {}
        }

        this.hexSideLength = 50;
        this.maxRouteLength = 4;
        this.maxJump = 2;

        this.colours = {
            'wet': '#00bfff',
            'dry': '#b36b00'
        };

        this.generateSystems();
        this.determineRoutes();
    }

    generateSystems() {
        for (var x = 1; x <= this.props.width; x++) {
            for (var y = 1; y <= this.props.height; y++) {
                if (rollDie(6) >= 4) {
                    var coord = padToTwo(x) + padToTwo(y);
                    var centX = this.hexagonCentreX(x, y);
                    var centY = this.hexagonCentreY(x, y);

                    this.props.systems[coord] = {
                        world: new World(),
                        x: centX,
                        y: centY,
                        labelY: centY + 0.7*this.hexSideLength,
                        starportLabelY: centY - 0.25*this.hexSideLength,
                        asteroid: false
                    };

                    this.props.systems[coord].world.rollWorld();

                    if (this.props.systems[coord].world.props.hydro <= 2) {
                        this.props.systems[coord].fill = this.colours['dry'];
                    }
                    else {
                        this.props.systems[coord].fill = this.colours['wet'];
                    }
                    
                    if (this.props.systems[coord].world.props.size <= 0) {
                        this.props.systems[coord].asteroid = true;
                    }

                    if (this.props.systems[coord].world.props.gasGiant) {
                        this.props.systems[coord].gasGiantX = centX + 0.5*this.hexSideLength;
                        this.props.systems[coord].gasGiantY = centY - 0.3*this.hexSideLength;
                    }
                }
            }
        }
    }

    get asteroids() {
        var out = [];

        Object.values(this.props.systems).forEach(system => {
            if (system.asteroid) {
                out.push({
                    x: system.x + 0.05*this.hexSideLength,
                    y: system.y - 0.0*this.hexSideLength,
                    r: 4,
                    fill: this.colours['dry']
                })
                out.push({
                    x: system.x - 0.05*this.hexSideLength,
                    y: system.y + 0.15*this.hexSideLength,
                    r: 3,
                    fill: this.colours['dry']
                })
                out.push({
                    x: system.x - 0.1*this.hexSideLength,
                    y: system.y - 0.1*this.hexSideLength,
                    r: 3,
                    fill: this.colours['dry']
                })
                out.push({
                    x: system.x - 0.25*this.hexSideLength,
                    y: system.y + 0.05*this.hexSideLength,
                    r: 3,
                    fill: this.colours['dry']
                })
                out.push({
                    x: system.x + 0.25*this.hexSideLength,
                    y: system.y + 0.05*this.hexSideLength,
                    r: 3,
                    fill: this.colours['dry']
                })
            }
        });

        return out;
    }

    hexagonPath(x, y) {
        var centX = this.hexagonCentreX(x, y);
        var centY = this.hexagonCentreY(x, y);
        var h_ = Math.sqrt(3)/2*this.hexSideLength;

        var out = `M${centX - this.hexSideLength/2} ${centY - h_} `;
        out += `L${centX + this.hexSideLength/2} ${centY - h_} `;
        out += `L${centX + this.hexSideLength} ${centY} `;
        out += `L${centX + this.hexSideLength/2} ${centY + h_} `;
        out += `L${centX - this.hexSideLength/2} ${centY + h_} `;
        out += `L${centX - this.hexSideLength} ${centY} `;
        out += `L${centX - this.hexSideLength/2} ${centY - h_} `;

        return out;
    }

    hexagonCentreX(x, y) {
        return (1.5*(x-1) + 1) * this.hexSideLength;
    }

    hexagonCentreY(x, y) {
        return (2*y + (x-1)%2) * Math.sqrt(3)/2*this.hexSideLength;
    }

    makeHexGrid() {
        var out = [];

        for (var x = 1; x <= this.props.width; x++) {
            for (var y = 1; y <= this.props.height; y++) {
                var tmp = {
                    d: this.hexagonPath(x, y),
                    label: padToTwo(x) + padToTwo(y),
                    labelX: this.hexagonCentreX(x, y) - 0.0*this.hexSideLength,
                    labelY: this.hexagonCentreY(x, y) - 0.65*this.hexSideLength
                }; 
                
                if (tmp.label in this.props.systems) {
                    tmp.world = this.props.systems[tmp.label].world;
                }

                out.push(tmp);
            }
        }

        return out;
    }

    hexagonNeighbours(coord, distance) {
        var x = Number(coord.slice(0, 2)); 
        var y = Number(coord.slice(2));

        var neighbours = {};
        neighbours[coord] = 0;

        if (y > 1){
            neighbours[padToTwo(x) + padToTwo(y-1)] = 1;
        }
        if (y < this.props.height){
            neighbours[padToTwo(x) + padToTwo(y+1)] = 1;
        }
        if (x > 1){
            neighbours[padToTwo(x-1) + padToTwo(y)] = 1;
        }
        if (x < this.props.width){
            neighbours[padToTwo(x+1) + padToTwo(y)] = 1;
        }
        if (x%2 == 0){
            if (y < this.props.height) {
                neighbours[padToTwo(x-1) + padToTwo(y+1)] = 1;
                neighbours[padToTwo(x+1) + padToTwo(y+1)] = 1;
            }
        }
        else {
            if (y > 1) {
                neighbours[padToTwo(x-1) + padToTwo(y-1)] = 1;
                neighbours[padToTwo(x+1) + padToTwo(y-1)] = 1;
            }
        }

        if (distance > 1) {
            var tmp;
            Object.keys(neighbours).forEach( (coordLoop) => {
                if (neighbours[coordLoop] == 1) {
                    tmp = this.hexagonNeighbours(coordLoop, distance-1);
                    Object.keys(tmp).forEach( (coordNew) => {
                        if (tmp[coordNew] > 0) {
                            if (!(coordNew in neighbours)) {
                                neighbours[coordNew] = tmp[coordNew] + 1;
                            }
                            else if (tmp[coordNew]+1 < neighbours[coordNew]) {
                                neighbours[coordNew] = tmp[coordNew] + 1;
                            }
                        }
                    });
                }
            });
        }

        return neighbours;
    }

    determineRoutes() {
        this.distances = {};
        this.jumps = {};
        this.routes = {};
        this.routeJumps = {};
        this.tradeRoutes = {};

        var coords = Object.keys(this.props.systems);
        coords.sort();

        for (var i = 0; i < coords.length; i++) {
            var neighbours = this.hexagonNeighbours(coords[i], this.maxRouteLength);
            for (var j = i + 1; j < coords.length; j++) {
                if (coords[j] in neighbours) {
                    this.distances[`${coords[i]}-${coords[j]}`] = neighbours[coords[j]];

                    if (this.props.systems[coords[i]].world.refuel && 
                        this.props.systems[coords[j]].world.refuel &&
                        neighbours[coords[j]] <= this.maxJump) {
                        this.jumps[`${coords[i]}-${coords[j]}`] = neighbours[coords[j]];
                    }
                }
            }    
        }

        Object.keys(this.distances).forEach( d => {
            var tmp = this.findPath(d);
            if (tmp.length > 0) {
                this.routes[d] = tmp;
            }
        });

        for (const [route, info] of Object.entries(this.routes)) {
            info.forEach(info_ => {
                info_.jumps.forEach(d => {
                    if (!(d in this.routeJumps)) {
                        this.routeJumps[d] = {
                            d: this.jumps[d],
                            connecting: [route]
                        };
                    }
                    else if (!this.routeJumps[d].connecting.includes(route)) {
                        this.routeJumps[d].connecting.push(route);
                    }
                });
            });
        }
    }

    findPath(route, d, prev) {
        if (!d) {
            d = this.maxRouteLength;
        }

        var out = [];
        var start = route.slice(0, 4);
        var goal = route.slice(5,9);

        var newPrev = [];
        if (prev) {
            newPrev.push(...prev);
        }
        newPrev.push(start);

        //console.log('new', route, d, newPrev, out);

        Object.keys(this.jumps).forEach( (jump) => {
            var dist = this.jumps[jump];
            var coord1 = jump.slice(0, 4);
            var coord2 = jump.slice(5, 9);
            
            if (coord1 == start) {
                if(!newPrev.includes(coord2)){
                    //console.log('checking', jump, dist, 'coord2 prev', newPrev.includes(coord2));
                    if (coord2 == goal && d - dist >= 0) {
                        out.push({jumps: [jump], d: dist})
                        //console.log('out', out);
                    } 
                    else if (d - dist > 0) {
                        var deeper = this.findPath(`${coord2}-${goal}`, d - dist, newPrev);
                        //console.log('deeper', deeper);
    
                        for (var i = 0; i < deeper.length; i++) {
                            //console.log('case 1', deeper[i], deeper[i]['jumps'], jump);
                            deeper[i].jumps.unshift(jump);
                            deeper[i].d += dist;
                            out.push(deeper[i]);
                        }
                    }
                } 
            }
            else if (coord2 == start) {
                if(!newPrev.includes(coord1)){
                    //console.log('checking', jump, dist, 'coord1 prev', newPrev.includes(coord1));
                    if (coord1 == goal && d - dist >= 0) {
                        out.push({jumps: [jump], d: dist})
                        //console.log('out', out);
                    }
                    else if (d - dist > 0) {
                        var deeper = this.findPath(`${coord1}-${goal}`, d - dist, newPrev);
                        //console.log('deeper', deeper);

                        for (var i = 0; i < deeper.length; i++) {
                            //console.log('case 2', deeper[i], deeper[i]['jumps'], jump);
                            deeper[i].jumps.unshift(jump);
                            deeper[i].d += dist;
                            out.push(deeper[i]);
                        }
                    }
                }
            }
        });

        // Output array [{jumps: [indices], d: distance}]
        //console.log('end', out)
        
        var minDist = Math.min(...out.map(d => d.d));
        out = out.filter(d => (d.d == minDist));
        var maxStops = Math.max(...out.map(d => d.jumps.length));
        out = out.filter(d => (d.jumps.length == maxStops));

        return out;
    }

    get jumpRoutePaths() {
        var paths = [];

        for (const [route, info] of Object.entries(this.routeJumps)) {
            var x1 = Number(route.slice(0, 2));
            var x2 = Number(route.slice(5, 7));
            var y2 = Number(route.slice(7, 9));
            var y1 = Number(route.slice(2, 4));

            var d = `M${this.hexagonCentreX(x1, y1)} ${this.hexagonCentreY(x1, y1)}`;
            d += `L${this.hexagonCentreX(x2, y2)} ${this.hexagonCentreY(x2, y2)}`;
            paths.push({
                d: d,
                distance: info.d,
                name: route 
            });
        }

        return paths;
    }
}