import { csvParse } from "d3-dsv";
import airportCSVString from "./airports.js";

let start = Date.now();
let result = csvParse(airportCSVString);
let end = Date.now();
let msg = `Parsing CSV took ${end - start}ms for ${result.length} rows`;

console.log(`Parsing CSV took ${end - start}ms for ${result.length} rows`);
if (globalThis.document) {
  document.body.textContent = msg
}
