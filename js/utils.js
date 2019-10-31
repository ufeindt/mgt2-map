const padToTwo = (n) => {
    if (n <= 9) { 
        n = ('0' + n).slice(-2); 
    }
    return n.toString();
}

function rollDie(d) {
    return Math.floor(d*Math.random()) + 1;
}

function rollDice(n, d, dm) {
    var result = dm;

    for(i = 0; i < n; i++) {
	result += rollDie(d)
    }

    return result;
}