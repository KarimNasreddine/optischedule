import { Table } from "flowbite-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import logo from "/public/images/logo.svg";
import Head from "next/head";
// import main from "../../util/optischedule";

export default function Home() {
  const [temperature, setTemperature] = useState();
  const [mode, setMode] = useState("active");
  const [standbyTemperature, setStandbyTemperature] = useState();
  const [smartWeatherPrediction, setSmartWeatherPrediction] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [consumptionWithSystem, setConsumptionWithSystem] = useState(2.5);
  const [consumptionWithoutSystem, setConsumptionWithoutSystem] =
    useState(27.3);

  const [roomsActualTemperature, setRoomsActualTemperature] = useState([
    { room: 107, temperature: 24 },
    { room: 109, temperature: 25 },
    { room: 110, temperature: 22 },
    { room: 111, temperature: 24 },
    { room: 201, temperature: 23 },
    { room: 202, temperature: 25 },
    { room: 203, temperature: 24 },
    { room: 204, temperature: 23 },
    { room: 205, temperature: 24 },
    { room: 208, temperature: 22 },
    { room: 209, temperature: 22 },
    { room: 211, temperature: 25 },
    { room: 212, temperature: 22 },
    { room: 225, temperature: 24 },
  ]);

  const getSmartWeatherPrediction = async () => {
    const axios = require("axios");

    const latitude = 33.89;
    const longitude = 35.5;
    const hourlyData = "temperature_2m,relativehumidity_2m";
    const dailyData = "temperature_2m_max,temperature_2m_min";

    axios
      .get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyData}&daily=${dailyData}&timezone=Asia/Beirut&current_weather=true&lang=en`
      )
      .then((response) => {
        // Optimal Set Temperature = 0.6*Max Temp + 0.4*Min Temp

        const maxTempTomorrow = response.data.daily.temperature_2m_max[0];
        const minTempTomorrow = response.data.daily.temperature_2m_min[0];
        const relativeHumidity = response.data.hourly.relativehumidity_2m[0];
        const optimalSetPoint = Math.round(
          0.6 * maxTempTomorrow + 0.4 * minTempTomorrow
        );
        setTemperature(optimalSetPoint);

        console.log("optimalSetPoint :", optimalSetPoint);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Set temperature to 22°C when smart weather prediction is enabled
  useEffect(() => {
    if (smartWeatherPrediction == true) {
      getSmartWeatherPrediction();
    }
  }, [smartWeatherPrediction]);

  // useEffect(() => {
  //   main();
  // }, []);

  // useEffect(() => {
  //   console.log("temperature :", temperature);
  //   console.log("mode :", mode);
  //   console.log("standbyTemperature :", standbyTemperature);
  //   console.log("smartWeatherPrediction :", smartWeatherPrediction);
  // }, [temperature, mode, standbyTemperature, smartWeatherPrediction]);

  const optiScheduleCaller = async () => {
    try {
      const apiTemperature = String(temperature);
      const apiMode = String(mode);
      const apiStandbyTemperature = String(standbyTemperature);

      // Make a POST request to the API

      setIsRunning(false);
      const response = await fetch(
        `/api/optischedule?temperature=${apiTemperature}&mode=${apiMode}&standbyDeltaTemperature=${apiStandbyTemperature}`
      );
      const data = await response.json();

      console.log(data);

      // Update the message state with the custom message returned by the API
      setTemperature(data.temperature);
      setMode(data.mode);
      setStandbyTemperature(data.standbyDeltaTemperature);
      // setRoomsActualTemperature(data.roomsActualTemperature);

      let on = data.runCount["onMode"] || 0;
      let off = data.runCount["offMode"] || 0;
      let standby = data.runCount["standbyMode"] || 0;
      let total = on + off + standby;

      // Convert to kWh
      on /= 12;
      off /= 12;
      standby /= 12;
      total /= 12;

      // setConsumptionWithSystem(Math.round(on * 0.8 * 220));
      // setConsumptionWithoutSystem(Math.round(total * 0.8 * 220));

      setIsRunning(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    optiScheduleCaller();
    const interval = setInterval(() => {
      if (isRunning) {
        // execute your function here
        optiScheduleCaller();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    optiScheduleCaller();
  };

  return (
    <>
      <Head>
        <title>OptiSchedule</title>
      </Head>
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="https://flowbite.com/" className="flex items-center">
            <Image
              width={35}
              src={logo}
              className="h-8 mr-3"
              alt="Flowbite Logo"
            />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
              OptiSchedule
            </span>
          </a>
          <button
            data-collapse-toggle="navbar-default"
            type="button"
            className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-default"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-6 h-6"
              aria-hidden={true}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
          <div className="hidden w-full md:block md:w-auto" id="navbar-default">
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <a
                  href="#control-settings"
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                >
                  Control Settings
                </a>
              </li>
              <li>
                <a
                  href="#table"
                  className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                >
                  Rooms Table
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <section className="bg-white dark:bg-gray-900">
        <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
              Schedule-Based Automatic HVAC System Control
            </h1>
            <br />
            <br />
            <h1 className="max-w-2xl mb-4 text-xl font-extrabold tracking-tight leading-none md:text-2xl xl:text-3xl dark:text-white">
              Comparison Since Last Run:
            </h1>
            <br />
            <span>
              <p className="inline max-w-2xl mb-6 font-bold text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
                - With System:
              </p>{" "}
              <span className="text-xl font-bold text-green-500">
                {consumptionWithSystem} kWh
              </span>
              <br />
              <br />
              <p className="inline max-w-2xl mb-6 font-bold text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
                - Without System:
              </p>{" "}
              <span className="text-xl font-bold text-red-500">
                {consumptionWithoutSystem} kWh
              </span>
            </span>
          </div>
          <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
            <Image
              className="rounded-full"
              width={500}
              height={500}
              src={logo}
              alt="Logo"
            />
          </div>
        </div>
      </section>
      <section
        id="control-settings"
        className="bg-gray-50 dark:bg-gray-900 min-h-full  px-40"
      >
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Control Settings
              </h1>
              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="temperature"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Desired Room Temperature (in °C)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    id="temperature"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="ex: 22"
                    required={!smartWeatherPrediction}
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    pattern="^-?[0-9]\d*\.?\d*$"
                    min={16}
                    max={28}
                    disabled={smartWeatherPrediction}
                  />
                </div>
                <div className="flex items-center mb-4">
                  <input
                    id="smart-weather-prediction"
                    type="checkbox"
                    value=""
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    checked={smartWeatherPrediction}
                    onChange={(e) =>
                      setSmartWeatherPrediction(e.target.checked)
                    }
                  />
                  <label
                    htmlFor="default-checkbox"
                    className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Smart Weather Prediction
                  </label>
                </div>
                <div className="py-2">
                  <label
                    htmlFor="temperature"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Mode:
                  </label>
                  <div className="flex items-center mb-4">
                    <input
                      id="mode-cooling"
                      type="radio"
                      value=""
                      name="mode"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      checked={mode == "active"}
                      onChange={() => {
                        setMode("active");
                      }}
                    />
                    <label
                      htmlFor="mode-cooling"
                      className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      Cooling
                    </label>
                  </div>
                  <div className="flex items-center mb-4">
                    <input
                      id="mode-heating"
                      type="radio"
                      value=""
                      name="mode"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      checked={mode == "inactive"}
                      onChange={() => {
                        setMode("inactive");
                      }}
                    />
                    <label
                      htmlFor="mode-heating"
                      className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      Heating
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="temperature"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Standby Delta Temperature (in °C)
                  </label>
                  <input
                    type="number"
                    name="standby-delta-temperature"
                    id="temperature"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="ex: 5"
                    required={true}
                    value={standbyTemperature}
                    onChange={(e) => setStandbyTemperature(e.target.value)}
                    pattern="^-?[0-9]\d*\.?\d*$"
                    min={0}
                    max={10}
                    disabled={smartWeatherPrediction}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <h1 className="max-w-2xl mb-4 text-l font-extrabold tracking-tight leading-none md:text-xl xl:text-2xl dark:text-white">
            Rooms
          </h1>
          <Table id="table" className="text-center" hoverable={true}>
            <Table.Head>
              <Table.HeadCell>Room</Table.HeadCell>
              <Table.HeadCell>Temperature</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {roomsActualTemperature.map((object, index) => (
                <Table.Row
                  key={index}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {object.room}
                  </Table.Cell>
                  <Table.Cell>{object.temperature}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        <footer className="bg-white dark:bg-gray-900">
          <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
            <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                © 2023 OptiSchedule. All Rights Reserved.
              </span>
            </div>
          </div>
        </footer>
      </section>
    </>
  );
}
