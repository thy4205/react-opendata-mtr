import { useState, useEffect } from "react";
import Papa from 'papaparse';  // Removed unused imports for simplicity
import "./App.css";
import axios from 'axios';
import routeDataFilePath from '/src/routes.json';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


function App() {
  const [upt, setUpdTime] = useState(0);
  const [lineData, setLineData] = useState({});  // Changed to string for line codes
  const [lineValue, setLineValue] = useState("");  // Changed to string for line codes
  const [staValue, setStaValue] = useState("");
  const [routeColour, setRouteColour] = useState("#0b089e");
  const [fullList, setFullList] = useState({});  // Moved to state
  const [loading, setLoading] = useState(true);  // For loading state
  const [error, setError] = useState(null);
  const [arrivalTime, setArrivelTime] = useState({ UP: [{ ttnt: 0 }, { ttnt: 0 }, { ttnt: 0 }, { ttnt: 0 }], DOWN: [{ ttnt: 0 }, { ttnt: 0 }, { ttnt: 0 }, { ttnt: 0 }] })     // For error handling

  const csvFilePath = '/mtr_lines_and_stations.csv';

  useEffect(() => {


    console.log(routeDataFilePath['routes']);

    // Fetch and parse CSV only once on mount
    fetch(csvFilePath)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch CSV");
        return response.text();
      })
      .then((responseText) => {
        Papa.parse(responseText, {
          header: true,
          dynamicTyping: true,
          complete: function (results) {
            const LineList = [];
            const tempFullList = {};

            results.data.forEach((station) => {
              if (LineList.indexOf(station['Line Code']) === -1 && station['Line Code'] !== null) {
                LineList.push(station['Line Code']);
              }
            });

            LineList.forEach((Line) => {
              const LineStation = [];
              results.data.forEach((station) => {
                if (station['Line Code'] === Line) {
                  LineStation[station['Station Code']] = {

                    cname: station['Chinese Name'],
                    ename: station['English Name']
                  };
                }
              });


              tempFullList[Line] = LineStation;
            });
            console.log(tempFullList);
            setFullList(tempFullList);  // Update state
            //alert(typeof tempFullList);
            setLoading(false);

          },
          error: (err) => {
            setError("Error parsing CSV: " + err.message);
            setLoading(false);
          }
        });
      })
      .catch((err) => {
        setError("Fetch error: " + err.message);
        setLoading(false);
      });
  }, []);  // Empty dependency array: runs once on mount

  const handleLineChange = async (event) => {
    setLineValue(event.target.value);
    console.log(fullList[event.target.value]);
    setRouteColour(routeDataFilePath['routes'][event.target.value]['colour']);

    // You can add logic here to populate stations based on selected line
  };
  const lineChange = (event) => {
    setStaValue(event.target.value);
    console.log(fullList[lineValue]);
    //alert(event.target.value);

    // Perform the GET request using axios.get()
    if (event.target.value !== "") {
      axios.get('https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=' + lineValue + "&sta=" + event.target.value).then(function (response) {
        setArrivelTime(response.data.data[lineValue + '-' + event.target.value]);
        console.log(response.data.data[lineValue + '-' + event.target.value]);
      });
    }


  }
  function Showttnt({ data, seq, direction }) {
    if (!data[direction]) {
      return null;
    }
    if (!data[direction][seq]) {
      return null;
    }
    if (lineValue == "") {
      return null;
    }


    var selectStaData = {};
    if (typeof fullList[lineValue][arrivalTime[direction][seq]['dest']] == 'undefined') {
      return null;
    }
    if (lineValue && staValue) {
      console.log(fullList[lineValue][arrivalTime[direction][seq]['dest']]['cname']);
      var destFullName = [fullList[lineValue][arrivalTime[direction][seq]['dest']]['cname'], fullList[lineValue][arrivalTime[direction][seq]['dest']]['ename']]
      //console.log(fullList[lineValue][arrivalTime[direction][seq]['dest']]['cname']);
    }
    return <tr><td style={{ 'width': "50px" }}><div className="platformNumber" style={{ "backgroundColor": routeColour, color: 'white', width: "40px", "borderRadius": "20px" }}>{arrivalTime[direction][seq]['plat'] !== 'undefined' ? arrivalTime[direction][seq]['plat'] : ""}</div></td><td><Box component="span" sx={{ display: 'block', textAlign: 'left' }}>{arrivalTime[direction][seq]['dest'] !== 'undefined' ? destFullName[0] : ""}</Box><Box component="span" sx={{ display: 'block', textAlign: 'left' }}>{arrivalTime[direction][seq]['dest'] !== 'undefined' ? destFullName[1] : ""}</Box></td><td>{arrivalTime[direction][seq]['ttnt'] ? (arrivalTime[direction][seq]['ttnt'] == 0 ? "即將到達" : arrivalTime[direction][seq]['ttnt'] + "分鐘") : ""}</td></tr>
  }

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <Container maxWidth="sm">
        <h1>MTR資訊顯示</h1>
        <hr style={{ "border": "none", "height": "4px", "backgroundColor": routeColour }}></hr>
        <form>
          {/*  <select id="line" value={lineValue} >
            <option value="">Select a line</option>
            {(routeDataFilePath['routes']).map((line) => (
              <option key={line['short']} value={line['short']}>
                {line['nameChi']}
              </option>
            ))}
          </select> */}
          <Grid container spacing={2}>
            <Grid size={5}>
              <Box sx={{ minWidth: 120 }}>
                <FormControl fullWidth>
                  <InputLabel id="lineSelectLabel">Route</InputLabel>
                  <Select
                    labelId="lineSelectLabel"
                    id="demo-simple-select"
                    label="Age"
                    onChange={handleLineChange}
                    variant="filled"
                  >
                    {Object.entries(routeDataFilePath['routes']).map(([linekey, lineValue]) => (
                      <MenuItem key={linekey} value={linekey}>
                        {lineValue['nameChi']}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid size={5}>
              <Box sx={{ minWidth: 120 }}>
                <FormControl fullWidth>
                  <InputLabel id="stationSelectorLabel">Station</InputLabel>
                  <Select
                    labelId="stationSelectorLabel"
                    id="stationSelector"
                    label="Age"
                    onChange={lineChange}
                    variant="filled"
                  >
                    <MenuItem value="">Select a station</MenuItem>
                    {lineValue && fullList[lineValue] ? (
                      Object.entries(fullList[lineValue]).map(([code, stationData]) => (
                        <MenuItem key={code} value={code}>
                          {stationData.cname}  {/* Shows English name; change to stationData.cname for Chinese */}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No stations available</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid size={2}>
              <button type="submit" >Submit</button>
            </Grid>
          </Grid>
        </form>

        <h3>上行</h3>
        <table style={{ width: "100%" }}>
          <tbody>



            <Showttnt data={arrivalTime} seq="0" direction="UP" />
            <Showttnt data={arrivalTime} seq="1" direction="UP" />
            <Showttnt data={arrivalTime} seq="2" direction="UP" />
            <Showttnt data={arrivalTime} seq="3" direction="UP" />
          </tbody>
        </table>
        <h3>下行</h3>
        <table style={{ width: "100%" }}>
          <tbody>

            <Showttnt data={arrivalTime} seq="0" direction="DOWN" />
            <Showttnt data={arrivalTime} seq="1" direction="DOWN" />
            <Showttnt data={arrivalTime} seq="2" direction="DOWN" />
            <Showttnt data={arrivalTime} seq="3" direction="DOWN" />


          </tbody>
        </table>

      </Container>

    </>
  );
}

export default App;