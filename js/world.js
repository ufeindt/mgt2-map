/*
* Author: Ulrich Feindt <ufeindt@gmail.com>
* License: TBD
*/

class World {
    constructor() {
		this.props = {
			size : -1,
			atmo : -1,
			hzdm : -1,
			temp : -1,
			hydro : -1,
			pop : -1,
			gov : 0,
			factions : [],
			cultural : -1,
			lawlvl : 0,
			starport : -1,
			bases : [],
			berthing : 0,
			tl : 0,
			zone: 'green',
			gasGiant: false
		};
		
		// this.rollWorld();
    }

    get profile() {
		var profile = this.props.starport;
		profile += this.props.size.toString(16).toUpperCase();
		profile += this.props.atmo.toString(16).toUpperCase();
		profile += this.props.hydro.toString(16).toUpperCase();
		profile += this.props.pop.toString(16).toUpperCase();
		profile += this.props.gov.toString(16).toUpperCase();
		profile += this.props.lawlvl.toString(16).toUpperCase();
		profile += '-' + Math.min(Math.max(this.props.tl, 0), 15).toString(16).toUpperCase();

		return profile
    }

	get refuel() {
		return ((this.props.hydro >= 3) || this.props.gasGiant || (parseInt(this.props.starport, 36) <= 13));
	}

    rollSize() {
		this.props.size = rollDice(2, 6, -2);

		// console.log('Size roll: 2D - 2. Result: ' + this.props.size.toString(16).toUpperCase());
    }

    rollAtmo() {
		this.props.atmo = Math.max(rollDice(2, 6, this.props.size - 7), 0);

		// console.log('Atmosphere roll: 2D + ' + (this.props.size - 7).toString() + '. Result: ' + this.props.atmo.toString(16).toUpperCase());
    }

    rollHZDM() {
		this.props.hzdm = rollDice(4, 3, -8);

		// console.log('HZ DM roll: 4D3 - 8. Result: ' + this.props.hzdm.toString(16).toUpperCase());
    }

    rollTemp() {
		var dm;
		
		switch(this.props.atmo) {
			case 2:
			case 3:
				dm = -2;
				break;
			case 4:
			case 5:
			case 14:
				dm = -1;
				break;
			case 8:
			case 9:
				dm = 1;
				break;
			case 10:
			case 13:
			case 16:
				dm = 2;
				break;
			case 11:
			case 12:
				dm = 6;
				break;
			default:
				dm = 0;
		}
		
		var roll = rollDice(2, 6, dm + this.props.hzdm)

		if (roll <= 2) {
			this.props.temp = 0;
		}
		else if (roll <= 4) {
			this.props.temp = 1;
		}
		else if (roll <= 9) {
			this.props.temp = 2;
		}
		else if (roll <= 11) {
			this.props.temp = 3;
		}
		else {
			this.props.temp = 4;
	}

	// console.log('Temperature roll: 2D + ' + (dm + this.props.hzdm).toString() + '. Result: ' + roll);
    }

    rollHydro() {
		if (this.props.size <= 1) {
			this.props.hydro = 0;
		}
		else {
			var dm;

			switch(this.props.atmo) {
				case 0:
				case 1:
				case 10:
				case 11:
				case 12:
					dm = -4;
					break;
				default:
					dm = this.props.atmo - 7;
			}

			switch(this.props.temp) {
				case 3:
					dm -= 2;
					break;
				case 4:
					dm -= 6;
				break;
			}

			this.props.hydro = Math.max(rollDice(2, 6, dm), 0);

			// console.log('Hydrographics roll: 2D + ' + dm.toString() + '. Result: ' + this.props.hydro);
		}
	}

	rollPop() {
		this.props.pop = rollDice(2, 6, -2);

		// console.log('Population roll: 2D - 2. Result: ' + this.props.pop.toString(16).toUpperCase());
    }

    rollGov() {
		if (this.props.pop > 0) {
			this.props.gov = Math.max(rollDice(2, 6, this.props.pop - 7), 0);

			// console.log('Government roll: 2D + ' + (this.props.pop - 7).toString() + '. Result: ' + this.props.gov.toString(16).toUpperCase());
		}
		else {
			this.props.gov = 0;
		}
	}

	rollFactions() {
		if (this.props.pop > 0) {
			var dm = 0;

			if (this.props.gov == 0 || this.props.gov == 7) {
				dm = 1;
			}
			else if (this.props.gov >= 10) {
				dm = -1;
			}

			var n = rollDice(1, 3, dm);
			// console.log('Factions roll: 1D3 + ' + dm.toString() + '. Result: ' + n.toString());

			for (var i = 0; i < n; i++) {
				var roll = rollDice(2, 6, 0);
				var strength;
				
				if (roll <= 3) {
					strength = 0;
				}
				else if (roll <= 5) {
					strength = 1;
				}
				else if (roll <= 7) {
					strength = 2;
				}
				else if (roll <= 9) {
					strength = 3;
				}
				else if (roll <= 11) {
					strength = 4;
				}
				else {
					strength = 5;
				}

				this.props.factions.push([Math.max(rollDice(2, 6, this.props.pop-7), 0), strength])

				// console.log('Faction ' + i.toString() + ':');
				// console.log(this.props.factions[i]);
			}
		}
	}

	rollCultural() {
		if (this.props.pop > 0) {
			this.props.cultural = 10 * rollDice(1, 6, 0) + rollDice(1, 6, 0);

			// console.log('Cultural difference roll: D66. Result: ' + this.props.cultural.toString());
		}
	}

	rollLawLvl() {
		if (this.props.pop > 0) {
			this.props.lawlvl = Math.min(Math.max(rollDice(2, 6, this.props.gov), 0), 9);

			// console.log('Law level roll: 2D + ' + this.props.gov.toString() + '. Result: ' + this.props.lawlvl.toString(16).toUpperCase());
		}
	}

	rollStarport() {
		var dm = 0;

		if (this.props.pop >= 10) {
			dm = 2;
		}
		else if (this.props.pop >= 8) {
			dm = 1;
		}
		else if (this.props.pop <= 2) {
			dm = -2;
		}
		else if (this.props.pop <= 4) {
			dm = -1;
		}
		
		var roll = rollDice(2, 6, dm);

		// console.log('Starport roll: 2D + ' + dm.toString() + '. Result: ' + roll.toString());
		
		if (roll <= 2) {
			this.props.starport = 'X';
		}
		else if (roll <= 4) {
			this.props.starport = 'E';
		}
		else if (roll <= 6) {
			this.props.starport = 'D';
			this.props.berthing = 10 * rollDie(6);
			if (rollDice(2, 6, 0) >= 7) {
				this.props.bases.push('S');
			}
		}
		else if (roll <= 8) {
			this.props.starport = 'C';
			this.props.berthing = 100 * rollDie(6);
			if (rollDice(2, 6, 0) >= 8) {
				this.props.bases.push('S');
			}
			if (rollDice(2, 6, 0) >= 10) {
				this.props.bases.push('R');
			}
			if (rollDice(2, 6, 0) >= 10) {
				this.props.bases.push('TAS');
			}
		}
		else if (roll <= 10) {
			this.props.starport = 'B';
			this.props.berthing = 500 * rollDie(6);
			if (rollDice(2, 6, 0) >= 8) {
				this.props.bases.push('N');
			}
			if (rollDice(2, 6, 0) >= 8) {
				this.props.bases.push('S');
			}
			if (rollDice(2, 6, 0) >= 10) {
				this.props.bases.push('R');
			}
			this.props.bases.push('TAS');
		}
		else {
			this.props.starport = 'A';
			this.props.berthing = 1000 * rollDie(6);
			if (rollDice(2, 6, 0) >= 8) {
				this.props.bases.push('N');
			}
			if (rollDice(2, 6, 0) >= 10) {
				this.props.bases.push('S');
			}
			if (rollDice(2, 6, 0) >= 8) {
				this.props.bases.push('R');
			}
			this.props.bases.push('TAS');
		}
    }

    rollTL() {
		if (this.props.pop > 0) {
			var dm = 0;

			switch(this.props.starport) {
				case 'A':
					dm += 6;
					break;
				case 'B':
					dm += 4;
					break;
				case 'C':
					dm += 2;
					break;
				case 'X':
					dm -= 4;
					break;
			}

			if (this.props.size <= 1) {
				dm += 2;
			}
			else if (this.props.size <= 4) {
				dm += 1;
			}

			if (this.props.atmo <= 3 || this.props.atmo >= 10) {
				dm += 1;
			}

			switch(this.props.hydro) {
				case 0:
				case 9:
					dm += 1;
					break;
				case 10:
					dm += 2;
					break;
			}

			switch(this.props.pop) {
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 8:  
					dm += 1;
					break;
				case 9:
					dm += 2;
					break;
				case 10:
					dm += 4;
					break;
			}

			switch(this.props.gov) {
				case 0:
				case 5:
					dm += 1;
					break;
				case 7:
					dm += 2;
					break;
				case 13:
				case 14:
					dm -= 2;
					break;
			}

			this.props.tl = rollDice(1, 6, dm), 15;
			
			// console.log('TL roll: 1D + ' + dm.toString() + '. Result: ' + this.props.tl.toString(16).toUpperCase());
		}
    }
	
	rollGasGiant() {
		this.props.gasGiant = (rollDice(2, 6, 0) <= 9);
	}

    rollWorld() {
		this.rollSize();
		this.rollAtmo();
		this.rollHZDM();
		this.rollTemp();
		this.rollHydro();
		this.rollPop();
		this.rollGov();
		this.rollFactions();
		this.rollCultural();
		this.rollLawLvl();
		this.rollStarport();
		this.rollTL();
		this.rollGasGiant();
    }
}

function randomWorld() {
	var world = new World();
	world.rollWorld();

	document.getElementById("world").innerHTML = world.profile;
	console.log(world.refuel);
	console.log((world.props.hydro >= 3));
	console.log(world.props.gasGiant);
	console.log((parseInt(world.props.starport, 36) <= 13));
	console.log(world.props.starport);

}
