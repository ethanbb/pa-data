// main.js

const puppeteer = require('puppeteer');
// const downloads = require('download.js');
// let download = downloads.download;
var fs = require('fs');
// var url = require('url');
// var http = require('http');
// var exec = require('child_process').exec;
// var spawn = require('child_process').spawn;
const request = require("request-promise-native");

const random_docket = require('./random-docket.js');
let create_docket_number = random_docket.create_docket_number

// async function getPic() {
//   // const browser = await puppeteer.launch({ headless: true });
//   // const page = await browser.newPage();
//   // await page.setViewport({ width: 1920, height: 926 });
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();
//   await page.setViewport({width: 1920, height: 926});
//   await page.goto('https://google.com');
//   await page.screenshot({path: 'google.png'});

//   await browser.close();
// }

// getPic();

let byDocket = async (docketNum) => {

  // Docket number test: CP-51-CR-0503941-1997
  let docketNumData = docketNum.split('-');
  // console.log(docketNumData[0])

  // Actual Scraping goes Here...
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 926});

  await page.goto('https://ujsportal.pacourts.us/DocketSheets/CP.aspx');
  await page.waitForSelector("#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_docketNumberControl_mddlCourt");
  // page.click("#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_docketNumberControl_mddlCourt")
  

  page.select(
    "#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_docketNumberControl_mddlCourt",
    docketNumData[0]
  );
  await page.$eval(
    '#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_docketNumberControl_mtxtCounty',
    function (el, str) { el.value = str },
    docketNumData[1]
  );
  page.select(
    "#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_docketNumberControl_mddlDocketType",
    docketNumData[2]
  );
  await page.$eval(
    '#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_docketNumberControl_mtxtSequenceNumber',
    function (el, str) { el.value = str },
    docketNumData[3]
  );

  await page.$eval(
    '#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_docketNumberControl_mtxtYear',
    function (el, str) { el.value = str },
    docketNumData[4]
  );
  page.click("#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_searchCommandControl")

  let noneFound = false;
  page.waitForSelector(
    "#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_searchResultsGridControl_noResultsPanel",
  ).then(function () {
    console.log("NO RECORDS FOUND");
    noneFound = true;
    return endSearch(browser, null);
  });

  await page
    .waitForSelector(
      "#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_searchResultsGridControl_resultsPanel",
      {timeout: 10000}
    )
    .catch(function(err){
      if (!noneFound) {
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~');
        return endSearch(browser, null);
      }
    });

  const docketPDFData = await page.evaluate(
    () => {
      let data = [document.querySelector('#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_searchResultsGridControl_caseList_ctl00_ctl00_docketNumberLabel').innerText];
      let moreData = Array.from(
        document.querySelectorAll('#ctl00_ctl00_ctl00_cphMain_cphDynamicContent_cphDynamicContent_docketNumberCriteriaControl_searchResultsGridControl_caseList_ctl00_ctl00_printControl_printMenun0Items a'),
          element => element.href
      )
      return data.concat(moreData);
    }
  );

  // downloadPDF(docketPDFData[1], docketPDFData[0], 'docket-' + docketPDFData[0] + '.pdf');
  // downloadPDF(docketPDFData[2], docketPDFData[0], 'summary-' + docketPDFData[0] + '.pdf');
  downloadPDF(docketPDFData[1], 'docket-' + docketPDFData[0] + '.pdf');
  downloadPDF(docketPDFData[2], 'summary-' + docketPDFData[0] + '.pdf');

  // await page.screenshot({path: 'docket.png'});
  if (!noneFound) {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~');
    return endSearch(browser, docketPDFData);
  }
};


let endSearch = function(browser, data, message) {
  if (message) {
    console.log(message)
  }
  browser.close();
  return data;
};


// async function downloadPDF(pdfURL, docket, outputFilename) {
async function downloadPDF(pdfURL, outputFilename) {
  // console.log(pdfURL);
  let pdfBuffer = await request.get({
    uri: pdfURL, encoding: null,
    headers: {'User-Agent': 'cfb-data-analysis'}
  });
  // let path = 'data/' + docket + '/' + outputFilename;
  let path = 'data/' + outputFilename;
  console.log("Writing downloaded PDF file to " + path + "...");
  fs.writeFile(path, pdfBuffer, function (err) { if (err) {console.log(err)} });
}

// // Test
//   // Docket number test: CP-51-CR-0503941-1997
// byDocket('CP-51-CR-0000000-1997')
//   .then((value) => {
//       // console.log(value); // Success!
//   }).catch((err) => {
//     console.log(err);
//   });

// Keep it running till we stop it manually
async function forever () {
  let id = create_docket_number({min: 2007, max: 2019});
  let text = '\n' + id;
  fs.appendFileSync('dockets-used.txt', text, function (err) {
    if (err) console.log(err);
    console.log(id);
  });

  await byDocket(id)
  .then((value) => {
      // console.log(value); // Success!
  }).catch((err) => {
    console.log(err);
  });

  forever();
}

forever();
