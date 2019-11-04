class Map {
    constructor(subsectors, subsectorDim) {
        if (!subsectorDim) {
            this.subsectorDim = [8, 10];
        } 
        else {
            this.subsectorDim = subsectorDim;
        }

        this.hexSideLength = 50;
        this.maxRouteLength = 4;
        this.maxJump = 2;
        this.routeMode = 'trade';
        // this.systemPlacement = 'default';
        this.systemPlacement = 'grouped';
        // this.systemPlacement = 'rolled';

        this.colours = {
            'wet': '#00bfff',
            'dry': '#b36b00'
        };
        
        this.props = {
            subsectors: subsectors,
            width: this.subsectorDim[0]*subsectors[0],
            height: this.subsectorDim[1]*subsectors[1],
            systems: {}
        }

        // this.rollSystemLocations();
        // this.generateSystems();
        // this.determineJumps();
        // this.determineRoutes();
    }

    rollSystemLocations() {
        this.systemLocations = []

        var coords = [];
        for (var x = 1; x <= this.props.width; x++) {
            for (var y = 1; y <= this.props.height; y++) {
                coords.push(padToTwo(x) + padToTwo(y));
            }
        }
        
        if (this.systemPlacement == 'default') {
            coords.forEach(c => {
                if (rollDie(6) >= 4) {
                    this.systemLocations.push(c);
                }
            });
        }
        else if (this.systemPlacement == 'grouped') {
            while (coords.length > 0) {
                var coord = coords.splice(Math.floor(Math.random()*coords.length), 1)[0];             
                const weights = [0.15, 0.01, 0.08, 0.08];
                var prop = 1;
                
                var neighbours = this.hexagonNeighbours(coord, weights.length);
                for (var k = 0; k < weights.length; k++) {
                    var mod = weights[k]/Object.values(neighbours).filter(n => n == k+1).length*6*(k+1);
                    prop -= mod*Object.entries(neighbours).filter((n, d) => this.systemLocations.includes(n[0]) && n[1] == k+1).length;
                }

                if (Math.random() < prop) {
                    this.systemLocations.push(coord);
                }
            }
        }
        else if (this.systemPlacement == 'rolled') {
            while (coords.length > 0) {
                var coord = coords.splice(Math.floor(Math.random()*coords.length), 1)[0];
                const weights = [5, 1, 3];
                var dc = 72;
                
                var neighbours = this.hexagonNeighbours(coord, weights.length);
                for (var k = 0; k < weights.length; k++) {
                    var mod = weights[k]/Object.values(neighbours).filter(n => n == k+1).length*6*(k+1);
                    dc -= mod*Object.entries(neighbours).filter((n, d) => this.systemLocations.includes(n[0]) && n[1] == k+1).length;
                }

                if (rollDice(12, 6, 0) <= dc) {
                    this.systemLocations.push(coord);
                }
            }
        }

        this.systemLocations.sort();
    }

    generateSystems() {
        for (var x = 1; x <= this.props.width; x++) {
            for (var y = 1; y <= this.props.height; y++) {
                var coord = padToTwo(x) + padToTwo(y);
                if (this.systemLocations.includes(coord)) {
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
        return (1.5*(x-1) + 0.75) * this.hexSideLength;
    }

    hexagonCentreY(x, y) {
        return (2*y + (x-1)%2 - 1) * Math.sqrt(3)/2*this.hexSideLength;
    }

    makeHexFrame() {
        var out = [];

        for (var x = 0; x <= this.props.subsectors[0]; x++) {
            var tmp = {
                x1: 1.5*this.subsectorDim[0]*x*this.hexSideLength,
                y1: -2,
                x2: 1.5*this.subsectorDim[0]*x*this.hexSideLength,
                y2: (2*this.subsectorDim[1]*this.props.subsectors[1]+1)*Math.sqrt(3)/2*this.hexSideLength+2
            }

            out.push(tmp);
        };

        for (var y = 0; y <= this.props.subsectors[0]; y++) {
            var tmp = {
                x1: -2,
                y1: 2*this.subsectorDim[1]*y*Math.sqrt(3)/2*this.hexSideLength,
                x2: 1.5*this.subsectorDim[0]*this.props.subsectors[0]*this.hexSideLength+2,
                y2: 2*this.subsectorDim[1]*y*Math.sqrt(3)/2*this.hexSideLength,
            };

            if (y == this.props.subsectors[1]) {
                tmp.y1 += Math.sqrt(3)/2*this.hexSideLength;
                tmp.y2 += Math.sqrt(3)/2*this.hexSideLength;
            }

            out.push(tmp);
        }

        return out;
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

    determineJumps() {
        this.distances = {};
        this.offGridJumps = {};

        var coords = Object.keys(this.props.systems);
        coords.sort();

        var offGrid = [];
        for (var i = 0; i < coords.length; i++) {
            var neighbours = this.hexagonNeighbours(coords[i], this.maxRouteLength);
            for (var j = i + 1; j < coords.length; j++) {
                if (coords[j] in neighbours) {
                    this.distances[`${coords[i]}-${coords[j]}`] = neighbours[coords[j]];
                }
            }

            if (!this.props.systems[coords[i]].world.refuel) {
                offGrid.push(coords[i]);
            }
        }

        offGrid.forEach(coord => {
            var tmp = {};
            for (const [route, dist] of Object.entries(this.distances)) {
                var coord1 = route.slice(0, 4);
                var coord2 = route.slice(5, 9);
                if (coord1 == coord || coord2 == coord) {
                    tmp[route] = dist;
                }

                for (const [r, d] of Object.entries(tmp)) {
                    this.offGridJumps[r] = d + Math.min(...Object.values(tmp));
                }
            }
        });
    }

    determineRoutes(all) {
        this.routes = {};
        this.routeJumps = {};

        if (this.routeMode == 'all') {
            var routes = Object.keys(this.distances);
        } 
        else {
            var routes = Object.keys(this.tradePartners);
        }
        
        routes.forEach( d => {
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
                            d: this.distances[d],
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

    determineTradeCodes() {
        for (const [coord, info] of Object.entries(this.props.systems)) {
            info.world.determineTradeCodes();
        }
    }

    determineTradePartners() {
        const tradeReasons = [
            [['In', 'Ht'], ['As', 'De', 'Ic', 'NI']],
            [['Hi', 'Ri'], ['Ag', 'Ga', 'Wa']]
        ];

        this.tradePartners = {};  

        Object.keys(this.distances).forEach(route => {
            var coord1 = route.slice(0, 4);
            var coord2 = route.slice(5, 9);
            
            var tc1 = this.props.systems[coord1].world.props.tc;
            var tc2 = this.props.systems[coord2].world.props.tc;

            var tradeConnections = [[], []];

            tradeReasons.forEach(reason => {
                var tmp = [[], []];
                reason[0].forEach(code => {
                    if (tc1.includes(code)) {
                        tmp[0].push(code);
                    }
                });  
                reason[1].forEach(code => {
                    if (tc2.includes(code)) {
                        tmp[1].push(code);
                    }
                });
                if (tmp[0].length > 0 && tmp[1].length > 0) {
                    tradeConnections[0].push(...tmp[0]);
                    tradeConnections[1].push(...tmp[1]);
                }  
            
                tmp = [[], []];
                reason[1].forEach(code => {
                    if (tc1.includes(code)) {
                        tmp[0].push(code);
                    }
                });  
                reason[0].forEach(code => {
                    if (tc2.includes(code)) {
                        tmp[1].push(code);
                    }
                });
                if (tmp[0].length > 0 && tmp[1].length > 0) {
                    tradeConnections[0].push(...tmp[0]);
                    tradeConnections[1].push(...tmp[1]);
                }  
            });


            if (tradeConnections[0].length > 0 && tradeConnections[1].length > 0) {
                this.tradePartners[route] = tradeConnections;
            }
        });
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

        for (const [jump, dist] of Object.entries(this.distances)) {
            var offGridDist = dist;
            if (jump in this.offGridJumps) {
                offGridDist = this.offGridJumps[jump];
            }

            if (dist <= this.maxJump && offGridDist <= this.maxJump) {
                var coord1 = jump.slice(0, 4);
                var coord2 = jump.slice(5, 9);
                
                if (coord1 == start) {
                    if(!newPrev.includes(coord2)){
                        if (parseInt(coord2) < parseInt(goal)) {
                            var newPath = `${coord2}-${goal}`;
                        }
                        else {
                            var newPath = `${goal}-${coord2}`;
                        }
                        if (coord2 == goal && d - dist >= 0) {
                            out.push({jumps: [jump], d: dist})
                        } 
                        else if (d - dist >= this.distances[newPath]) {
                            var deeper = this.findPath(newPath, d - dist, newPrev);
                            
                            for (var i = 0; i < deeper.length; i++) {
                                deeper[i].jumps.unshift(jump);
                                deeper[i].d += dist;
                                out.push(deeper[i]);
                            }
                        }
                    } 
                }
                else if (coord2 == start) {
                    if(!newPrev.includes(coord1)){
                        if (parseInt(coord1) < parseInt(goal)) {
                            var newPath = `${coord1}-${goal}`;
                        }
                        else {
                            var newPath = `${goal}-${coord1}`;
                        }
                        var newPath = `${coord1}-${goal}`;
                        if (coord1 == goal && d - dist >= 0) {
                            out.push({jumps: [jump], d: dist})
                        }
                        else if (d - dist >= this.distances[newPath]) {
                            var deeper = this.findPath(newPath, d - dist, newPrev);

                            for (var i = 0; i < deeper.length; i++) {
                                deeper[i].jumps.unshift(jump);
                                deeper[i].d += dist;
                                out.push(deeper[i]);
                            }
                        }
                    }
                }
            }
        }
        
        var minDist = Math.min(...out.map(d => d.d));
        out = out.filter(d => (d.d == minDist));
        var maxStops = Math.max(...out.map(d => d.jumps.length));
        out = out.filter(d => (d.jumps.length == maxStops));

        return out;
    }

    get jumpRoutePaths() {
        var paths = [];

        if (!this.routeJumps) {
            return paths;
        }

        for (const [route, info] of Object.entries(this.routeJumps)) {
            var x1 = Number(route.slice(0, 2));
            var x2 = Number(route.slice(5, 7));
            var y2 = Number(route.slice(7, 9));
            var y1 = Number(route.slice(2, 4));

            var d = `M${this.hexagonCentreX(x1, y1)} ${this.hexagonCentreY(x1, y1)}`;
            d += `L${this.hexagonCentreX(x2, y2)} ${this.hexagonCentreY(x2, y2)}`;
            var newPath = {
                d: d,
                distance: info.d,
                name: route 
            }

            if (this.routeMode == 'trade') {
                newPath.tradePartners = {};
                info.connecting.forEach(d => {
                    newPath.tradePartners[d] = [this.tradePartners[d][0].map(tc => worldTables.tc[tc].name),
                                                this.tradePartners[d][1].map(tc => worldTables.tc[tc].name)];
                });
            }

            if (route in this.offGridJumps) {
                newPath.distance = this.offGridJumps[route];
            }

            if (newPath.distance <= this.maxJump) {
                paths.push(newPath);
            } 
        }

        return paths;
    }
}