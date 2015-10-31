/* jshint esnext: true */

var die = function() {
    var message = '!! ' + Array.from(arguments).join('\n!! ');
    console.error(message);
    process.exit(1);
};

var cleanStation = function(str) {
    var cleaned = str.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    if (cleaned.endsWith('caltrain')) {
        cleaned = cleaned.substring(0, cleaned.length - 8);
    } else if (cleaned.endsWith('caltrainstation')) {
        cleaned = cleaned.substring(0, cleaned.length - 15);
    }

    return cleaned;
};

var capitalize = function(str) {
    return str.split(' ').map(function(s) {
        return s[0].toUpperCase() + s.substring(1);
    }).join(' ');
};

var formatDate = function(dateInstance) {
    var twentyFourHour = dateInstance.getHours();
    var twelveHour = twentyFourHour % 12;
    var amPm = (twelveHour === twentyFourHour ? 'am' : 'pm');
    return twelveHour + ':' + dateInstance.getMinutes() + amPm;
};

try {
    var trains = require('../caltrain.json');
} catch (e) {
    die('../caltrain.json does not exist or is not parseable.',
        'Run `make` to generate from the latest data available.');
}

// trains is good
if (process.argv.length !== 4) {
    die('Must specify exactly two arguments:',
        'node query [train number] [station]');
}

var benchStart = Date.now();

var number = process.argv[2];
var station = cleanStation(process.argv[3]);

var scheduledTime = (trains[number] || {})[station]; // janky to make property access not fail

if (!scheduledTime) {
    die(`Unable to find departure for train ${number} at ${station}.`);
}

var timeComponents = scheduledTime.split(':');

var dateObject = new Date();
dateObject.setHours(timeComponents[0]);
dateObject.setMinutes(timeComponents[1]);
dateObject.setSeconds(timeComponents[2] || 0); // in case no seconds are provided

console.log(`Train ${number} departs ${capitalize(station)} at ${formatDate(dateObject)}.`);
console.info(`Finished in ${Date.now()-benchStart} ms.`)
