const fs = require("fs");
var convertXMLtoJSON = require("xml2js");
const util = require("util");
// const getXml = require("../../../util/infoSilemRequestor");
import path from "path";

// console.log(getXml());

const bechtalResponse = path.join(process.cwd(), "public", "data");

const bechtalResponseXML = path.join(
  process.cwd(),
  "public",
  "data",
  "bechtal-response.xml"
);

const bechtalResponseJSON = path.join(
  process.cwd(),
  "public",
  "data",
  "bechtal-response.json"
);

var xmldata = fs.readFileSync(bechtalResponseXML, "utf-8");

// xmldata = xmldata.substring(xmldata.indexOf("<soap"));

// console.log("xmldata: ", xmldata);

// console.log(xmldata);

// convertXMLtoJSON.parseString(xmldata.trim(), function (err, result) {
// if (err) {
// console.log("Result: ", result);
// console.error(err);
// } else {
// console.log("result: ", result);
// fs.writeFileSync(bechtalResponse, JSON.stringify(result));
// const data = fs.readFileSync(bechtalResponse, "utf-8"); // read the JSON file
// // do something with the data
// }
// });

// const data = fs.readFileSync(bechtalResponseJSON, "utf-8"); // read the JSON file

// console.log("data: ", data);

const json = JSON.parse(xmldata); // parse the JSON data

let obj = util.inspect(json, { showHidden: false, depth: null }); // inspect the JSON data

delete Object.assign(json, { ["Envelope"]: json["soap:Envelope"] })[ // replace the key "soap:Envelope" with "Envelope"
  "soap:Envelope"
];

delete Object.assign(json["Envelope"], {
  // replace the $ sign with Dollar
  ["Dollar"]: json["Envelope"]["$"],
})["$"];

delete Object.assign(json["Envelope"], {
  // replace soap:Body with Body
  ["Body"]: json["Envelope"]["soap:Body"],
})["soap:Body"];

let reservations =
  json["Envelope"]["Body"][0]["RoomBookingOccurrence_ExportAllResponse"][0][
    "RoomBookingOccurrence_ExportAllResult"
  ][0]["XMLData"][0]["ReservationOccurrences"][0]["ReservationOccurrence"]; // get the reservations

let lastReservationOfTheDay = {}; // create an object to hold the last reservations of the day for each room

const roomOn = {}; // create an object to hold the rooms that are on
const roomStandby = {}; // create an object to hold the rooms that are on standby
const roomOff = {}; // create an object to hold the rooms that are off

const runCount = { onMode: 0, standbyMode: 0, offMode: 0 }; // create an object to hold the number of times the function has run

//This function initiates a PUT request to change the mode (on, off, unoccupied) of the HVAC system of a specific classroom
async function updateRoomOccupancy(room, mode) {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/${room}/analog-value,2/present-value?priority=5&alt=json`;
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
    body: JSON.stringify({
      $base: "Real",
      value: mode,
    }),
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    // console.log(data);
  } catch (error) {
    console.error(error);
  }
}

//This function initiates a PUT request to change the set point temperature of the HVAC system
async function updateSetPointTemperature(room, temperature) {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/${room}/analog-value,1/present-value?priority=5&alt=json`;
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
    body: JSON.stringify({
      $base: "Real",
      value: temperature,
    }),
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    // console.log(data);
  } catch (error) {
    console.error(error);
  }
}

//This function initiates a PUT request to change the mode (Cooling/Heating) of the entire HVAC system
// For Cooling choose mode as "active": updateHvacMode("active");
// For Heating choose mode as "inactive": updateHvacMode("inactive");
async function updateHvacMode(mode) {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/301/binary-value,4/present-value?priority=5&alt=json`;
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
    body: JSON.stringify({
      $base: "Real",
      value: mode,
    }),
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    // console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// //This function initiates a PUT request to change the delta Temperature that modifies the set point when the classroom in unoccupied
async function updateDeltaTemperature(room, delta) {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/${room}/analog-value,3/present-value?priority=5&alt=json`;
  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
    body: JSON.stringify({
      $base: "Real",
      value: delta,
    }),
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    // console.log(data);
  } catch (error) {
    console.error(error);
  }
}

//This function initiates a GET request to get the actual temperature of each classroom
async function getActualTemperature(room) {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/${room}/analog-input,101/present-value?priority=5&alt=json`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    // console.log(data);
  } catch (error) {
    console.error(error);
  }
}

//This function initiates a GET request to get the set point temperature of each classroom
async function getSetPointTemperature(room) {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/${room}/analog-value,1/present-value?priority=5&alt=json`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

//This function initiates a GET request to retrieve the Cooling/Heating mode of the entire HVAC system
async function getHvacMode() {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/301/binary-value,4/present-value?priority=5&alt=json`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    // console.log(data);
  } catch (error) {
    console.error(error);
  }
}

//This function initiates a GET request to retrieve the Delta temperature of the Standby Mode
async function getDeltaTemperature(room) {
  const url = `http://192.168.19.205/enteliweb/api/.bacnet/AUB/${room}/analog-value,3/present-value?priority=5&alt=json`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic ZWVtMDc6RWxqb2VsdGlpMTAx",
    },
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.text(); // Log the response data as text
    // console.log(responseData); // Log the response data
    const data = JSON.parse(responseData); // Attempt to parse the JSON data
    // console.log(data);
  } catch (error) {
    console.error(error);
  }
}

let temperature, mode, standbyDeltaTemperature;

export default async function controlHVAC(req, res) {
  if (req.query.temperature != undefined) {
    temperature = req.query.temperature;
  }

  if (req.query.mode != undefined) {
    mode = req.query.mode;
    // console.log(mode);
  }

  if (req.query.standbyDeltaTemperature != undefined) {
    standbyDeltaTemperature = req.query.standbyDeltaTemperature;
  }

  const roomMap = {};
  roomMap["215"] = "304";
  roomMap["214"] = "305";
  roomMap["212"] = "306";
  roomMap["211"] = "307";
  roomMap["209"] = "308";
  roomMap["208"] = "309";
  roomMap["205"] = "310";
  roomMap["204"] = "311";
  roomMap["203"] = "312";
  roomMap["202"] = "313";
  roomMap["201"] = "314";
  roomMap["107"] = "316";
  roomMap["109"] = "317";
  roomMap["110"] = "318";
  roomMap["111"] = "319";
  roomMap["108"] = "320";

  // Reset the room flags
  try {
    for (room in roomOn) {
      roomOn[room] = false;
    }
  } catch (error) {
    console.log(error);
  }
  try {
    for (room in roomStandby) {
      roomStandby[room] = false;
    }
  } catch (error) {
    console.log(error);
  }
  try {
    for (room in roomOff) {
      roomOff[room] = false;
    }
  } catch (error) {
    console.log(error);
  }

  // //
  // Loop through the reservations //
  // //

  for (let i = 0; i < reservations.length; i++) {
    // loop through the reservations
    let reservation = reservations[i]; // get the reservation
    let startTime = reservation["StartTime"][0]; // get the start time
    let endTime = reservation["EndTime"][0]; // get the end time
    let room = reservation["Room"][0]; // get the room
    let DOW = reservation["ReservationDOW"][0]; // get the day of the week
    let resStartDate = reservation["ReservationStartDate"][0]; // get the reservation start date
    let resEndDate = reservation["ReservationEndDate"][0]; // get the reservation end date

    let startTimeSplit = startTime.split(":"); // split the start time
    let endTimeSplit = endTime.split(":"); // split the end time

    if (
      roomOn[room] == undefined &&
      roomStandby[room] == undefined &&
      roomOff[room] == undefined &&
      roomMap[room] != undefined
    ) {
      roomOn[room] = false; // set the room to off by default
      roomStandby[room] = false; // set the room to off by default
      roomOff[room] = false; // set the room to off by default
    }

    //      //
    // DATE //
    //      //

    resStartDate = new Date(resStartDate); // convert the reservation start date to a date object
    resEndDate = new Date(resEndDate); // convert the reservation end date to a date object

    resStartDate.setDate(resStartDate.getDate() - 1); // set the reservation start date to the day before
    resEndDate.setDate(resEndDate.getDate() + 1); // set the reservation end date to the day after

    //      //
    // TIME //
    //      //

    let resStartTime = new Date(); // create a new date object
    resStartTime.setHours(
      startTimeSplit[0],
      startTimeSplit[1],
      startTimeSplit[2],
      0
    ); // set the hours, minutes, seconds, and milliseconds of the reservation start time

    let resEndTime = new Date(); // create a new date object
    resEndTime.setHours(endTimeSplit[0], endTimeSplit[1], endTimeSplit[2], 0); // set the hours, minutes, seconds, and milliseconds of the reservation end time

    const currentDate = new Date(); // get the current date

    let currentDateOffsetedPlus = new Date(currentDate); // create a new date object
    let currentDateOffsetedMinus = new Date(currentDate); // create a new date object

    currentDateOffsetedPlus.setMinutes(
      currentDateOffsetedPlus.getMinutes() + 15
    ); // add 15 minutes to the current date
    currentDateOffsetedMinus.setMinutes(
      currentDateOffsetedMinus.getMinutes() - 15
    ); // subtract 15 minutes from the current date

    resStartTime = resStartTime.getTime(); // convert the reservation start time to a timestamp
    resEndTime = resEndTime.getTime(); // convert the reservation end time to a timestamp

    currentDateOffsetedPlus = currentDateOffsetedPlus.getTime(); // convert the current date offseted plus to a timestamp
    currentDateOffsetedMinus = currentDateOffsetedMinus.getTime(); // convert the current date offseted minus to a timestamp

    // //
    // DAY OF THE WEEK //
    // //

    const arrDOW = [...DOW]; // convert the day of the week to an array

    let numDay = []; // create an array to hold the day of the week

    for (let letter of arrDOW) {
      // loop through the day of the week
      if (letter == "M") {
        numDay.push(1);
      } else if (letter == "T") {
        numDay.push(2);
      } else if (letter == "W") {
        numDay.push(3);
      } else if (letter == "R") {
        numDay.push(4);
      } else if (letter == "F") {
        numDay.push(5);
      } else if (letter == "S") {
        numDay.push(6);
      } else if (letter == "U") {
        numDay.push(0);
      }
    }

    if (currentDate >= resStartDate && currentDate <= resEndDate) {
      // check if the current date is between the reservation start date and the reservation end date
      if (numDay.includes(currentDate.getDay())) {
        // check if the current day of the week is in the array of days of the week

        // populate the lastReservationOfTheDay object with the last reservation of the day for each room
        if (
          lastReservationOfTheDay[room] == undefined ||
          resEndTime >= lastReservationOfTheDay[room]
        ) {
          lastReservationOfTheDay[room] = resEndTime; // set the last reservation of the day for the room to the reservation end time
        }

        // roomOn[room] = false; // set the room to standby by default
        // roomStandby[room] = true; // set the room to standby by default
        // roomOff[room] = false; // set the room to standby by default

        if (
          // check if the current time is between the reservation start time and the reservation end time
          currentDateOffsetedPlus >= resStartTime &&
          currentDateOffsetedMinus <= resEndTime
        ) {
          //HVAC on Occupied Mode
          roomOn[room] = true; // set the room to on
          roomStandby[room] = false; // set the room to not on standby
          roomOff[room] = false; // set the room to not off
        }

        // After class finishes by 15 minutes, put HVAC on Standby Mode or turn off
        else if (
          currentDateOffsetedMinus >= resEndTime ||
          currentDateOffsetedPlus <= resStartTime
        ) {
          // check if the current time is after the reservation end time

          if (roomOn[room] == true) {
            // check if the room is on
            // roomOn[room] = false; // set the room flag to off
          } else {
            // HVAC on Standby Mode

            roomStandby[room] = true; // set the room to standby
          }
        }

        // Prints when class is on this day

        // console.log("Start Time: " + startTime);
        // console.log("End Time: " + endTime);
        // console.log("Room: " + room);
        // console.log("DOW: " + DOW);
        // console.log("Reservation Start Date: " + resStartDate);
        // console.log("Reservation End Date: " + resEndDate);
        // console.log();
      }
    }
  }

  // console.log(lastReservationOfTheDay);

  // //
  // End Loop through the reservations //
  // //

  // //
  // After the last reservation of the day, turn off HVAC //
  // //

  const currentDateGlobal = new Date(); // get the current date
  let currentDateOffsetedMinusGlobal = new Date(currentDateGlobal); // create a new date object

  currentDateOffsetedMinusGlobal.setMinutes(
    currentDateOffsetedMinusGlobal.getMinutes() - 15
  ); // subtract 15 minutes from the current date

  currentDateOffsetedMinusGlobal = currentDateOffsetedMinusGlobal.getTime(); // convert the current date offseted minus to a timestamp

  for (let [room, resEndTimeForTheDay] of Object.entries(
    lastReservationOfTheDay
  )) {
    if (
      currentDateOffsetedMinusGlobal >= resEndTimeForTheDay ||
      currentDateGlobal.getHours() < 7
    ) {
      // check if the current time is after the last reservation of the day
      roomOn[room] = false; // set the room to not on
      roomStandby[room] = false; // set the room to not on standby
      roomOff[room] = true; // set the room to off
      // console.log("Turn off HVAC for room " + room);
      // console.log();
    }
  }

  // if current time is at 7 am, set room to standby by default
  if (currentDateGlobal.getHours() == 7 && currentDateGlobal.getMinutes() < 6) {
    for (let room in roomOn) {
      roomOn[room] = false; // set the room to not on
    }
    for (let room in roomStandby) {
      roomStandby[room] = true; // set the room to standby
    }
    for (let room in roomOff) {
      roomOff[room] = false; // set the room to not off
    }
  }

  console.log();
  console.log("On Mode:");
  for (let room in roomOn) {
    if (roomMap[room] != undefined) {
      if (roomOn[room] == true) {
        // check if the room is on

        //HVAC on Occupied Mode
        console.log(roomMap[room] + " (ie. room " + room + ") is turned on");

        runCount["onMode"] += 1; // increment the on mode run count

        // await updateRoomOccupancy(roomMap[room], 1); //Turning On the HVAC system
        // await updateSetPointTemperature(roomMap[room], temperature); //Set the temperature
        // await updateHvacMode(mode); //Set the mode
        // await updateDeltaTemperature(roomMap[room], standbyDeltaTemperature); //Set the Standby DeltaTemperature
      }
    }
  }

  console.log();
  console.log("Standby Mode:");
  for (let room in roomStandby) {
    if (roomMap[room] != undefined) {
      if (roomStandby[room] == true) {
        // check if the room is on standby

        // HVAC on Standby Mode
        console.log(
          roomMap[room] + " (ie. room " + room + ") is put on standby"
        );

        runCount["standbyMode"] += 1; // increment the standby mode run count

        // await updateRoomOccupancy(roomMap[room], 2); //Set HVAC system to standby mode
        // await updateSetPointTemperature(roomMap[room], temperature); //Set the temperature
        // await updateHvacMode(mode); //Set the mode
        // await updateDeltaTemperature(roomMap[room], standbyDeltaTemperature); //Set the Standby DeltaTemperature
      }
    }
  }

  console.log();
  console.log("Off Mode:");
  for (let room in roomOff) {
    if (roomMap[room] != undefined) {
      if (roomOff[room] == true) {
        // check if the room is off

        // HVAC turned off
        console.log(roomMap[room] + " (ie. room " + room + ") is turn off");

        runCount["offMode"] += 1; // increment the off mode run count

        // await updateRoomOccupancy(roomMap[room], 3); //Turn off the HVAC system
        // await updateSetPointTemperature(roomMap[room], temperature); //Set the temperature
        // await updateHvacMode(mode); //Set the mode
        // await updateDeltaTemperature(roomMap[room], standbyDeltaTemperature); //Set the Standby DeltaTemperature
      }
    }
  }

  console.log();
  console.log("Desired Room Temperature: " + temperature);
  console.log("Mode: " + mode);
  console.log("Standby Delta Temperature: " + standbyDeltaTemperature);
  console.log();

  console.log();
  console.log();
  console.log("Room On:");
  console.log(roomOn);
  console.log();
  console.log("Room Standby:");
  console.log(roomStandby);
  console.log();
  console.log("Room Off:");
  console.log(roomOff);
  console.log();

  let roomsSetPointTemperature = getSetPointTemperature(311); // get the set point temperature for 311 because all rooms have the same value
  let roomsMode = getHvacMode(); // get the hvac mode for all rooms
  let roomsStandbyDeltaTemperature = getDeltaTemperature(311); // get the standby delta temperature for 311 because all rooms have the same value

  let roomsActualTempurature = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // for (let room in roomMap) {
  //   let i = 0;
  //   let actualTemperature = await getActualTemperature(roomMap[room]);
  //   roomsActualTempurature[i] = {
  //     room: room,
  //     actualTemperature: actualTemperature,
  //   };
  //   i++;
  // }

  res.status(200).json({
    temperature: 26,
    mode: "active",
    standbyDeltaTemperature: 3,
    roomsActualTemperature: roomsActualTempurature,
    runCount: runCount,
  });
}
