/* jshint esnext: true, node: true */
'use strict';

var fs = require('fs');

/**
 * Descriptions of each error returned by RailtimeSchedule.
 * @readonly
 * @constant
 * @see RailtimeSchedule
 */
const RailtimeScheduleErrorDescriptions = {
    couldNotLoadScheduleJSON: "Couldn't initialize train schedule with provided sources",
    trainWithGivenNumberDoesNotExist: 'A train with the given number does not exist',
    trainDoesNotStopAtGivenStation: 'Train stop not found at the given station'
};
Object.freeze(RailtimeScheduleErrorDescriptions);

/* EXPORTS */
module.exports = RailtimeSchedule;


/**
 * Loads Caltrain schedule.
 * @class
 * @param {Object} sources - Sources of the train schedule JSON. `.scheduleJSON` is prioritized over `.JSONfileName`, but either is acceptable; however, at least one is required.
 * @param {Object|string} [sources.scheduleJSON] - An object containing the JSON schedule data, or its string serialization
 * @param {string} [sources.JSONFileName] - A string representing the path to the schedule JSON file to load
 */
function RailtimeSchedule(sources) {
    var scheduleJSON = sources.scheduleJSON;
    if (scheduleJSON) {
        var type = typeof scheduleJSON;
        if (type === 'object') {
            setTrainsProp(this, scheduleJSON);
            return;
        } else if (type === 'string') {
            setTrainsProp(this, JSON.parse(scheduleJSON));
            return;
        }
    }

    if (sources.JSONFileName) {
        // this will be run at startup, so sync is ok
        let trainsJSON = require(sources.JSONFileName);

        setTrainsProp(this, trainsJSON);
        return;
    }

    throw new Error(RailtimeScheduleErrorDescriptions.couldNotLoadScheduleJSON);
}

/*
 * Set a non-writable property on an object.
 * @private
 */
function setReadonly(obj, key, val) {
    Object.defineProperty(obj, key, {
        value: val,
        writable: false
    });
}

/*
 * Set a value for a non-writable property 'trains'.
 * @private
 * @see setReadonly
 */
function setTrainsProp(obj, val) {
    setReadonly(obj, 'trains', val);
}

/* METHODS */

/**
 * Get a train's departure time at a given station.
 * @param {(string|number)} trainNumber - The train number
 * @param {string} dirtyStationName - The name of the station
 * @returns {(Date|Error)} A Date object representing the departure time or an instance of `Error`
 * @this RailtimeSchedule
 */
RailtimeSchedule.prototype.getTrainAtStation = function getTrainAtStation(trainNumber, dirtyStationName) {
    let trainSchedule = this.trains[trainNumber];
    if (!trainSchedule) {
        return new Error(RailtimeScheduleErrorDescriptions.trainWithGivenNumberDoesNotExist);
    }

    let station = cleanStationName(dirtyStationName);
    let stopTime = trainSchedule[station];
    if (!stopTime) {
        return new Error(RailtimeScheduleErrorDescriptions.trainDoesNotStopAtGivenStation);
    }

    return dateObjectFromString(stopTime);
};

/**
 * Get a Date object of a time respresented in a string (HH:mm:ss)
 * @private
 * @param {string} timeString - A time of the current day, formatted `HH:mm:ss` (hours >24 indicate the next day)
 * @returns {Date} A Date object representing the given time
 */
function dateObjectFromString(timeString) {
    let components = timeString.split(':'); // hours, minutes, seconds

    let dateObject = new Date();
    dateObject.setHours(components[0], components[1], components[2]);

    return dateObject;
}

/**
 * Attempt to remove formatting from a station name (including non-alphanumeric characters, capitalization, and 'caltrain' suffixes)
 * @private
 * @param {string} dirtyString - A string with potentially unwanted characters or formatting
 * @returns {string} A clean version of the input string
 */
function cleanStationName(dirtyString) {
    var cleaned = dirtyString.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

    if (cleaned.endsWith('caltrain')) {
        cleaned = cleaned.substring(0, cleaned.length - 8);
    } else if (cleaned.endsWith('caltrainstation')) {
        cleaned = cleaned.substring(0, cleaned.length - 15);
    }

    return cleaned;
}
