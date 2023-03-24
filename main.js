import { csvParse } from 'd3-dsv';
import airportCSVString from './airports.js';

let start = Date.now();
let result = csvParse(airportCSVString);

if (globalThis.document) {
  document.body.textContent = `Parsing CSV took ${(Date.now() - start).toFixed(
    2
  )}ms for ${result.length} rows`;
} else {
  console.log(
    `Parsing CSV took ${(Date.now() - start).toFixed(2)}ms for ${
      result.length
    } rows`
  );
}
