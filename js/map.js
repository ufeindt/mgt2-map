class Map {
    constructor(width, height) {
        this.props = {
            width: width,
            height: height,
            systems: {}
        }

        this.hexSideLength = 50;
        this.maxRouteLength = 2;

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
                out.push({
                    d: this.hexagonPath(x, y),
                    label: padToTwo(x) + padToTwo(y),
                    labelX: this.hexagonCentreX(x, y) - 0.0*this.hexSideLength,
                    labelY: this.hexagonCentreY(x, y) - 0.65*this.hexSideLength
                });
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
        this.distances = [];
        this.routes = [];

        var coords = Object.keys(this.props.systems);
        coords.sort();

        for (var i = 0; i < coords.length; i++) {
            var neighbours = this.hexagonNeighbours(coords[i], this.maxRouteLength);
            for (var j = i + 1; j < coords.length; j++) {
                if (coords[j] in neighbours) {
                    this.distances[`${coords[i]}-${coords[j]}`] = neighbours[coords[j]];

                    if (this.props.systems[coords[i]].world.refuel && this.props.systems[coords[j]].world.refuel) {
                        this.routes[`${coords[i]}-${coords[j]}`] = neighbours[coords[j]];
                    }
                }
            }    
        }
    }

    get jumpRoutePaths() {
        var paths = [];
        var d;

        for (const [route, distance] of Object.entries(this.routes)) {
            var x1 = Number(route.slice(0, 2));
            var x2 = Number(route.slice(5, 7));
            var y2 = Number(route.slice(7, 9));
            var y1 = Number(route.slice(2, 4));

            var d = `M${this.hexagonCentreX(x1, y1)} ${this.hexagonCentreY(x1, y1)}`;
            d += `L${this.hexagonCentreX(x2, y2)} ${this.hexagonCentreY(x2, y2)}`;
            paths.push({
                d: d,
                distance: distance,
                name: route 
            });
        }

        return paths;
    }
}