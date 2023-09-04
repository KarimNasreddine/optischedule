const fs = require('fs');
const axios = require('axios');
const xml2js = require('xml2js');
const xmljs = require('xml-js');
const { DOMParser } = require('xmldom');
const parser = new DOMParser();


const today = new Date().toISOString().substr(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().substr(0, 10);

console.log(today); // Output: "2022-04-28"
console.log(yesterday); // Output: "2022-04-27"

const url = 'http://192.168.206.10/InfosilemEnterprise/API/Integration/Integration.asmx';
const headers = {
  'Content-Type': 'application/soap+xml;charset=UTF-8;action="http://www.infosilem.com/StartSession"',

};

const xmlData = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:inf="http://www.infosilem.com/">
  <soap:Header/>
  <soap:Body>
     <inf:StartSession>
        <!--Optional:-->
        <inf:Username>webapi</inf:Username>
        <!--Optional:-->
        <inf:Password>webapi</inf:Password>
     </inf:StartSession>
  </soap:Body>
</soap:Envelope>`;
const url2 = 'http://192.168.206.10/InfosilemEnterprise/API/ExportOnly/RoomBookingPub.asmx';
const soapHeaders = {
  'Content-Type': 'text/xml;charset=UTF-8',
  'SOAPAction': 'http://www.infosilem.com/RoomBookingOccurrence_ExportAll'
};


let xmlObject;

async function makeRequests() {
  try {
    // Make first request
    const response1 = await axios.post(url, xmlData, { headers });
    const xmlResponse = parser.parseFromString(response1.data, "application/xml");
    const startSessionResult = xmlResponse.getElementsByTagName("StartSessionResult")[0].textContent;

    //data
    const soapBody = `
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:inf="http://www.infosilem.com/">
    <soap:Header/>
    <soap:Body>
      <inf:RoomBookingOccurrence_ExportAll>
        <inf:TransferID>${startSessionResult}</inf:TransferID>
        <inf:Options>
          <inf:Building>BECHTA</inf:Building>
          <inf:StartDate>${yesterday}</inf:StartDate>
          <inf:EndDate>${today}</inf:EndDate>
        </inf:Options>
      </inf:RoomBookingOccurrence_ExportAll>
    </soap:Body>
  </soap:Envelope>
`;

    // Make second request
    const response2 = await axios.post(url2, soapBody, { headers: soapHeaders });
    
     xmlObject = response2.data;
     
    
    return xmlObject;
    
  } catch (error) {
    console.log('Error:', error);
  }
}

async function getXml() {
  try {
    const xmlString = await makeRequests();
    fs.writeFileSync('bechtal-response.xml', xmlString);
    return xmlString;
  } catch (error) {
    console.log('Error:', error);
  }
}

// Call the async function
getXml();

module.exports = getXml;
