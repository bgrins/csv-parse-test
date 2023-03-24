var EOL = {}, EOF = {}, QUOTE = 34, NEWLINE = 10, RETURN = 13;
function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + '] || ""';
  }).join(",") + "}");
}
function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}
function inferColumns(rows) {
  var columnSet = /* @__PURE__ */ Object.create(null), columns = [];
  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });
  return columns;
}
function pad(value, width) {
  var s = value + "", length = s.length;
  return length < width ? new Array(width - length + 1).join(0) + s : s;
}
function formatYear(year) {
  return year < 0 ? "-" + pad(-year, 6) : year > 9999 ? "+" + pad(year, 6) : pad(year, 4);
}
function formatDate(date) {
  var hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds(), milliseconds = date.getUTCMilliseconds();
  return isNaN(date) ? "Invalid Date" : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2) + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z" : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z" : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z" : "");
}
function dsv(delimiter) {
  var reFormat = new RegExp('["' + delimiter + "\n\r]"), DELIMITER = delimiter.charCodeAt(0);
  function parse(text, f) {
    var convert, columns, rows = parseRows(text, function(row, i) {
      if (convert)
        return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns || [];
    return rows;
  }
  function parseRows(text, f) {
    var rows = [], N = text.length, I = 0, n = 0, t, eof = N <= 0, eol = false;
    if (text.charCodeAt(N - 1) === NEWLINE)
      --N;
    if (text.charCodeAt(N - 1) === RETURN)
      --N;
    function token() {
      if (eof)
        return EOF;
      if (eol)
        return eol = false, EOL;
      var i, j = I, c;
      if (text.charCodeAt(j) === QUOTE) {
        while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE)
          ;
        if ((i = I) >= N)
          eof = true;
        else if ((c = text.charCodeAt(I++)) === NEWLINE)
          eol = true;
        else if (c === RETURN) {
          eol = true;
          if (text.charCodeAt(I) === NEWLINE)
            ++I;
        }
        return text.slice(j + 1, i - 1).replace(/""/g, '"');
      }
      while (I < N) {
        if ((c = text.charCodeAt(i = I++)) === NEWLINE)
          eol = true;
        else if (c === RETURN) {
          eol = true;
          if (text.charCodeAt(I) === NEWLINE)
            ++I;
        } else if (c !== DELIMITER)
          continue;
        return text.slice(j, i);
      }
      return eof = true, text.slice(j, N);
    }
    while ((t = token()) !== EOF) {
      var row = [];
      while (t !== EOL && t !== EOF)
        row.push(t), t = token();
      if (f && (row = f(row, n++)) == null)
        continue;
      rows.push(row);
    }
    return rows;
  }
  function preformatBody(rows, columns) {
    return rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    });
  }
  function format(rows, columns) {
    if (columns == null)
      columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
  }
  function formatBody(rows, columns) {
    if (columns == null)
      columns = inferColumns(rows);
    return preformatBody(rows, columns).join("\n");
  }
  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }
  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }
  function formatValue(value) {
    return value == null ? "" : value instanceof Date ? formatDate(value) : reFormat.test(value += "") ? '"' + value.replace(/"/g, '""') + '"' : value;
  }
  return {
    parse,
    parseRows,
    format,
    formatBody,
    formatRows,
    formatRow,
    formatValue
  };
}
var csv = dsv(",");
var csvParse = csv.parse;
const airportCSVString = `iata,name,city,state,country,latitude,longitude
00M,Thigpen,Bay Springs,MS,USA,31.95376472,-89.23450472
00R,Livingston Municipal,Livingston,TX,USA,30.68586111,-95.01792778
00V,Meadow Lake,Colorado Springs,CO,USA,38.94574889,-104.5698933
01G,Perry-Warsaw,Perry,NY,USA,42.74134667,-78.05208056
01J,Hilliard Airpark,Hilliard,FL,USA,30.6880125,-81.90594389
01M,Tishomingo County,Belmont,MS,USA,34.49166667,-88.20111111
02A,Gragg-Wade,Clanton,AL,USA,32.85048667,-86.61145333
02C,Capitol,Brookfield,WI,USA,43.08751,-88.17786917
02G,Columbiana County,East Liverpool,OH,USA,40.67331278,-80.64140639
03D,Memphis Memorial,Memphis,MO,USA,40.44725889,-92.22696056
04M,Calhoun County,Pittsboro,MS,USA,33.93011222,-89.34285194
04Y,Hawley Municipal,Hawley,MN,USA,46.88384889,-96.35089861
05C,Griffith-Merrillville,Griffith,IN,USA,41.51961917,-87.40109333
05F,Gatesville - City/County,Gatesville,TX,USA,31.42127556,-97.79696778
05U,Eureka,Eureka,NV,USA,39.60416667,-116.0050597
06A,Moton  Municipal,Tuskegee,AL,USA,32.46047167,-85.68003611
06C,Schaumburg,Chicago/Schaumburg,IL,USA,41.98934083,-88.10124278
06D,Rolla Municipal,Rolla,ND,USA,48.88434111,-99.62087694
06M,Eupora Municipal,Eupora,MS,USA,33.53456583,-89.31256917
06N,Randall,Middletown,NY,USA,41.43156583,-74.39191722
06U,Jackpot/Hayden,Jackpot,NV,USA,41.97602222,-114.6580911
07C,Dekalb County,Auburn,IN,USA,41.30716667,-85.06433333
07F,Gladewater Municipal,Gladewater,TX,USA,32.52883861,-94.97174556
07G,Fitch H Beach,Charlotte,MI,USA,42.57450861,-84.81143139
07K,Central City Municipal,Central City,NE,USA,41.11668056,-98.05033639
08A,Wetumpka Municipal,Wetumpka,AL,USA,32.52943944,-86.32822139
08D,Stanley Municipal,Stanley,ND,USA,48.30079861,-102.4063514
08K,Harvard State,Harvard,NE,USA,40.65138528,-98.07978667
08M,Carthage-Leake County,Carthage,MS,USA,32.76124611,-89.53007139
09A,Butler-Choctaw County,Butler,AL,USA,32.11931306,-88.1274625
09J,Jekyll Island,Jekyll Island,GA,USA,31.07447222,-81.42777778
09K,Sargent Municipal,Sargent,NE,USA,41.63695083,-99.34038139
09M,Charleston Municipal,Charleston,MS,USA,33.99150222,-90.078145
09W,South Capitol Street,Washington,DC,USA,38.86872333,-77.00747583
0A3,Smithville Municipal,Smithville,TN,USA,35.98531194,-85.80931806
0A8,Bibb County,Centreville,AL,USA,32.93679056,-87.08888306
0A9,Elizabethton Municipal,Elizabethton,TN,USA,36.37094306,-82.17374111
0AK,Pilot Station,Pilot Station,AK,USA,61.93396417,-162.8929358
0B1,Col. Dyke,Bethel,ME,USA,44.42506444,-70.80784778
0B4,Hartington Municipal,Hartington,NE,USA,42.60355556,-97.25263889
0B5,Turners Falls,Montague,MA,USA,42.59136361,-72.52275472
0B7,Warren-Sugar Bush,Warren,VT,USA,44.11672722,-72.82705806
0B8,Elizabeth,Fishers Island,NY,USA,41.25130806,-72.03161139
0C0,Dacy,Chicago/Harvard,IL,USA,42.40418556,-88.63343222
0C4,Pender Municipal,Pender,NE,USA,42.11388722,-96.72892556
0D1,South Haven Municipal,South Haven,MI,USA,42.35083333,-86.25613889
0D8,Gettysburg Municipal,Gettysburg,SD,USA,44.98730556,-99.9535
0E0,Moriarty,Moriarty,NM,USA,34.98560639,-106.0094661
0E8,Crownpoint,Crownpoint,NM,USA,35.71765889,-108.2015961
0F2,Bowie Municipal,Bowie,TX,USA,33.60166667,-97.77556
0F4,Loup City Municipal,Loup City,NE,USA,41.29028694,-98.99064278
0F7,Fountainhead Lodge Airpark,Eufaula,OK,USA,35.38898833,-95.60165111
0F8,William R Pogue Municipal,Sand Springs,OK,USA,36.17528,-96.15181028
0F9,Tishomingo Airpark,Tishomingo,OK,USA,34.19592833,-96.67555694
0G0,North Buffalo Suburban,Lockport,NY,USA,43.10318389,-78.70334583
0G3,Tecumseh Municipal,Tecumseh,NE,USA,40.39944417,-96.17139694
0G6,Williams County,Bryan,OH,USA,41.46736111,-84.50655556
0G7,Finger Lakes Regional,Seneca Falls,NY,USA,42.88062278,-76.78162028
0H1,Trego Wakeeney,Wakeeney,KS,USA,39.0044525,-99.89289917
0I8,Cynthiana-Harrison County,Cynthiana,KY,USA,38.36674167,-84.28410056
0J0,Abbeville Municipal,Abbeville,AL,USA,31.60016778,-85.23882222
0J4,Florala Municipal,Florala,AL,USA,31.04247361,-86.31156111
0J6,Headland Municipal,Headland,AL,USA,31.364895,-85.30965556
0K7,Humboldt Municipal,Humboldt,IA,USA,42.7360825,-94.24524167
0L5,Goldfield,Goldfield,NV,USA,37.71798833,-117.2384119
0L7,Jean,Jean,NV,USA,35.76827222,-115.3296378
0L9,Echo Bay,Overton,NV,USA,36.31108972,-114.4638672
0M0,Dumas Municipal,Dumas,AR,USA,33.8845475,-91.53429111
0M1,Scott,Parsons,TN,USA,35.63778,-88.127995
0M4,Benton County,Camden,TN,USA,36.01122694,-88.12328833
0M5,Humphreys County,Waverly,TN,USA,36.11659972,-87.73815889
0M6,Panola County,Batesville,MS,USA,34.36677444,-89.90008917
0M8,Byerley,Lake Providence,LA,USA,32.82587917,-91.187665
0O3,Calaveras Co-Maury Rasmussen,San Andreas,CA,USA,38.14611639,-120.6481733
0O4,Corning Municipal,Corning,CA,USA,39.94376806,-122.1713781
0O5,University,Davis,CA,USA,38.53146222,-121.7864906
0Q5,Shelter Cove,Shelter Cove,CA,USA,40.02764333,-124.0733639
0Q6,Shingletown,Shingletown,CA,USA,40.52210111,-121.8177683
0R0,Columbia-Marion County,Columbia,MS,USA,31.29700806,-89.81282944
0R1,Atmore Municipal,Atmore,AL,USA,31.01621528,-87.44675972
0R3,Abbeville Chris Crusta Memorial,Abbeville,LA,USA,29.97576083,-92.08415167
0R4,Concordia Parish,Vidalia,LA,USA,31.56683278,-91.50011889
0R5,David G Joyce,Winnfield,LA,USA,31.96366222,-92.66026056
0R7,Red River,Coushatta,LA,USA,31.99071694,-93.30739306
0S7,Dorothy Scott,Oroville,WA,USA,48.958965,-119.4119622
0S9,Jefferson County International,Port Townsend,WA,USA,48.04981361,-122.8012792
0V2,Harriet Alexander,Salida,CO,USA,38.53916389,-106.0458483
0V3,Pioneer Village,Minden,NE,USA,40.5149125,-98.94565083
0V4,Brookneal/Campbell County,Brookneal,VA,USA,37.14172222,-79.01638889
0V6,Mission Sioux,Mission,SD,USA,43.30694778,-100.6281936
0V7,Kayenta,Kayenta,AZ,USA,36.70972139,-110.2367978
10C,Galt,Chicago/Greenwood/Wonderlake,IL,USA,42.40266472,-88.37588917
10D,Winsted Municipal,Winsted,MN,USA,44.94996278,-94.0669175
10G,Holmes County,Millersburg,OH,USA,40.53716667,-81.95436111
10N,Wallkill,Wallkill,NY,USA,41.62787111,-74.13375583
10U,Owyhee,Owyhee,NV,USA,41.95323306,-116.1876014
11A,Clayton Municipal,Clayton,AL,USA,31.88329917,-85.48491361
11D,Clarion Cty,Clarion,PA,USA,41.22581222,-79.44098972
11IS,Schaumburg Heliport,Chicago/Schaumburg,IL,USA,42.04808278,-88.05257194
11J,Early County,Blakely,GA,USA,31.39698611,-84.89525694
11R,Brenham Municipal,Brenham,TX,USA,30.219,-96.37427778
12C,Rochelle Municipal,Rochelle,IL,USA,41.89300139,-89.07829
12D,Tower Municipal,Tower,MN,USA,47.81833333,-92.29166667
12J,Brewton Municipal,Brewton,AL,USA,31.05126306,-87.06796833
12K,Superior Municipal,Superior,NE,USA,40.04636111,-98.06011111
12Y,Le Sueur Municipal,Le Sueur,MN,USA,44.43746472,-93.91274083
13C,Lakeview,Lakeview,MI,USA,43.45213722,-85.26480333
13K,Eureka Municipal,Eureka,KS,USA,37.8515825,-96.29169806
13N,Trinca,Andover,NJ,USA,40.96676444,-74.78016556
14J,Carl Folsom,Elba,AL,USA,31.40988861,-86.08883583
14M,Hollandale Municipal,Hollandale,MS,USA,33.18262167,-90.83065444
14Y,Todd Field,Long Prairie,MN,USA,45.89857556,-94.87391
15F,Haskell Municipal,Haskell,TX,USA,33.19155556,-99.71793056
15J,Cook County,Adel,GA,USA,31.13780556,-83.45308333
15M,Luka,Luka,MS,USA,34.7723125,-88.16587444
15Z,McCarthy 2,McCarthy,AK,USA,61.43706083,-142.9037372
16A,Nunapitchuk,Nunapitchuk,AK,USA,60.90582833,-162.4391158
16G,Seneca County,Tiffin,OH,USA,41.09405556,-83.2125
16J,Dawson Municipal,Dawson,GA,USA,31.74328472,-84.419285
16S,Myrtle Creek Municipal,Myrtle Creek,OR,USA,42.99845056,-123.3095092
17G,Port Bucyrus-Crawford County,Bucyrus,OH,USA,40.78141667,-82.97469444
17J,Donalsonville Municipal,Donalsonville,GA,USA,31.00694444,-84.87761111
17K,Boise City,Boise City,OK,USA,36.77430028,-102.5104364
17M,Magee Municipal,Magee,MS,USA,31.86127139,-89.80285361
17N,Cross Keys,Cross Keys,NJ,USA,39.70547583,-75.03300306
17Z,Manokotak,Manokotak,AK,USA,58.98896583,-159.0499739
18A,Franklin County,Canon,GA,USA,34.34010472,-83.13348333
18I,McCreary County,Pine Knot,KY,USA,36.69591306,-84.39160389
19A,Jackson County,Jefferson,GA,USA,34.17402472,-83.56066528
19M,C A Moore,Lexington,MS,USA,33.12546111,-90.02555694
19N,Camden,Berlin,NJ,USA,39.77842056,-74.94780389
19P,Port Protection SPB,Port Protection,AK,USA,56.32880417,-133.6100844
1A3,Martin Campbell,Copperhill,TN,USA,35.01619111,-84.34631083
1A5,Macon County,Franklin,NC,USA,35.222595,-83.41904389
1A6,Middlesboro-Bell County,Middlesboro,KY,USA,36.6106375,-83.73741611
1A7,Jackson County,Gainesboro,TN,USA,36.39728139,-85.64164278
1A9,Autauga County,Prattville,AL,USA,32.438775,-86.51044778
1B0,Dexter Regional,Dexter,ME,USA,45.00839444,-69.23976722
1B1,Columbia Cty,Hudson,NY,USA,42.29130028,-73.71031944
1B3,Fair Haven,Fair Haven,VT,USA,43.61534389,-73.27455556
1B9,Mansfield Municipal,Mansfield,MA,USA,42.00013306,-71.19677139
1C5,Clow,Chicago/Plainfield,IL,USA,41.69597444,-88.12923056
1D1,Milbank Municipal,Milbank,SD,USA,45.23053806,-96.56596556
1D2,Canton -Plymouth -  Mettetal,Plymouth,MI,USA,42.35003667,-83.45826833
1D3,Platte Municipal,Platte,SD,USA,43.40332833,-98.82952972
1D6,Hector Municipal,Hector,MN,USA,44.73107278,-94.71471333
1D7,Webster Municipal,Webster,SD,USA,45.29329111,-97.51369889
1D8,Redfield Municipal,Redfield,SD,USA,44.86247611,-98.52953972
1F0,Downtown Ardmore,Ardmore,OK,USA,34.14698917,-97.12265194
1F1,Lake Murray State Park,Overbrook,OK,USA,34.07509694,-97.10667917
1F4,Madill Municipal,Madill,OK,USA,34.14040194,-96.81203222
1F9,Bridgeport Municipal,Bridgeport,TX,USA,33.17533333,-97.82838889
1G0,Wood County,Bowling Green,OH,USA,41.391,-83.63013889
1G3,Kent State University,Kent,OH,USA,41.15186167,-81.41658306
1G4,Grand Canyon West,Peach Springs,AZ,USA,35.99221,-113.8166164
1G5,Freedom,Medina,OH,USA,41.13144444,-81.76491667
1G6,Michael,Cicero,NY,USA,43.18166667,-76.12777778
1H0,Creve Coeur,St Louis,MO,USA,38.72752,-90.50830417
1H2,Effingham County Memorial,Effingham,IL,USA,39.07045083,-88.53351972
1H3,Linn State Tech. College,Linn,MO,USA,38.47149444,-91.81531667
1H8,Casey Municipal,Casey,IL,USA,39.30250917,-88.00406194
1I5,Freehold,Freehold,NY,USA,42.36425,-74.06596806
1I9,Delphi Municipal,Delphi,IN,USA,40.54281417,-86.68167194
1J0,Tri-County,Bonifay,FL,USA,30.84577778,-85.60138889
1K2,Lindsay Municipal,Lindsay,OK,USA,34.85007333,-97.58642028
1K4,David J. Perry,Goldsby,OK,USA,35.1550675,-97.47039389
1K5,Waynoka Municipal,Waynoka,OK,USA,36.56670028,-98.85231333
1K9,Satanta Municipal,Satanta,KS,USA,37.45419111,-100.9921119
1L0,St. John the Baptist Parish,Reserve,LA,USA,30.08720833,-90.58266528
1L1,Lincoln Co,Panaca,NV,USA,37.78746444,-114.4216567
1L7,Escalante Municipal,Escalante,UT,USA,37.74532639,-111.5701653
1L9,Parowan,Parowan,UT,USA,37.85969694,-112.816055
1M1,North Little Rock Municipal,No Lit Rock,AR,USA,34.83398056,-92.25792778
1M2,Belzoni Municipal,Belzoni,MS,USA,33.14518056,-90.51528472
1M4,Posey,Haleyville,AL,USA,34.28034806,-87.60044139
1M5,Portland Municipal,Portland,TN,USA,36.59287528,-86.47691028
1M7,Fulton,Fulton,KY,USA,36.52589417,-88.91561611
1MO,Mountain Grove Memorial,Mountain Grove,MO,USA,37.12071889,-92.311245
1N2,Spadaro,East Moriches,NY,USA,40.82787639,-72.74871083
1N4,Woodbine Muni,Woodbine,NJ,USA,39.21915,-74.794765
1N7,Blairstown,Blairstown,NJ,USA,40.97114556,-74.99747556
1N9,Allentown Queen City Muni,Allentown,PA,USA,40.57027778,-75.48830556
1ND3,Hamry,Kindred,ND,USA,46.6485775,-97.00564306
1O1,Grandfield Municipal,Grandfield,OK,USA,34.23758944,-98.74200917
1O2,Lampson,Lakeport,CA,USA,38.99017472,-122.8997175
1O3,Lodi,Lodi,CA,USA,38.20241667,-121.2684167
1O4,Thomas Municipal,Thomas,OK,USA,35.73338222,-98.73063833
1O6,Dunsmuir Municipal-Mott,Dunsmuir,CA,USA,41.26320889,-122.2719528
1R1,Jena,Jena,LA,USA,31.671005,-92.15846722
1R7,Brookhaven-Lincoln County,Brookhaven,MS,USA,31.6058475,-90.40931583
1R8,Bay Minette Municipal,Bay Minette,AL,USA,30.87046278,-87.81738167
1S0,Pierce County,Puyallup,WA,USA,47.10391667,-122.2871944
1S3,Tillitt,Forsyth,MT,USA,46.27110639,-106.6239206
1S5,Sunnyside Municipal,Sunnyside,WA,USA,46.32763139,-119.9705964
1S6,Priest River Muni,Priest River,ID,USA,48.19018611,-116.9093644
1U7,Bear Lake County,Paris,ID,USA,42.24714972,-111.33826
1V0,Navajo State Park,Navajo Dam,NM,USA,36.80833833,-107.6514444
1V2,Grant County,Hyannis,NE,USA,42.00942944,-101.7693439
1V5,Boulder Muni,Boulder,CO,USA,40.03942972,-105.2258217
1V6,Fremont County,Canon City,CO,USA,38.42838111,-105.1054994
1V9,Blake,Delta,CO,USA,38.78539722,-108.0636611
20A,Robbins,Oneonta,AL,USA,33.97231972,-86.37942722
20M,Macon Municipal,Macon,MS,USA,33.13345889,-88.53559806
20N,Kingston-Ulster,Kingston,NY,USA,41.9852525,-73.96409722
20U,Beach,Beach,ND,USA,46.92362444,-103.9785389
20V,McElroy Airfield,Kremmling,CO,USA,40.05367972,-106.3689467
21D,Lake Elmo,St Paul,MN,USA,44.99748861,-92.85568111
21F,Jacksboro Municipal,Jacksboro,TX,USA,33.228725,-98.14671083
22B,Mountain Meadow Airstrip,Burlington,CT,USA,41.77287528,-73.01121667
22I,Vinton County,McArthur,OH,USA,39.328125,-82.44182167
22M,Pontotoc County,Pontotoc,MS,USA,34.27593833,-89.03839694
22N,Carbon Cty-Jake Arner Memorial,Lehighton,PA,USA,40.80950889,-75.76149639
23J,Herlong,Jacksonville,FL,USA,30.27778889,-81.80594722
23M,Clarke County,Quitman,MS,USA,32.08487111,-88.73893389
23N,Bayport Aerodrome,Bayport,NY,USA,40.75843139,-73.05372083
23R,Devine Municipal,Devine,TX,USA,29.1384075,-98.94189028
24A,Jackson County,Sylva,NC,USA,35.3168625,-83.20936806
24J,Suwannee County,Live Oak,FL,USA,30.30105583,-83.02318778
24N,Jicarilla Apache Nation,Dulce,NM,USA,36.828535,-106.8841914
25J,Cuthbert-Randolph,Cuthbert,GA,USA,31.70016583,-84.82492194
25M,Ripley,Ripley,MS,USA,34.72226778,-89.01504944
25R,International,Edinburg,TX,USA,26.44201083,-98.12945306
26A,Ashland/Lineville,Ashland/Lineville,AL,USA,33.28761417,-85.80412861
26N,Ocean City Muni cipal,Ocean City,NJ,USA,39.26347222,-74.60747222
26R,Jackson County,Edna/Ganado,TX,USA,29.00101,-96.58194667
26U,McDermitt State,McDermitt,OR,USA,42.00211083,-117.7231972
27A,Elbert County-Patz,Elberton,GA,USA,34.09519722,-82.81586417
27D,Myers,Canby,MN,USA,44.72801889,-96.26309972
27J,Newberry Municipal,Newberry,SC,USA,34.30927778,-81.63972222
27K,Georgetown-Scott County,Georgetown,KY,USA,38.23442528,-84.43468667
28J,Kay Larkin,Palatka,FL,USA,29.65863889,-81.68855556
29D,Grove City,Grove City,PA,USA,41.14597611,-80.16592194
29G,Portage County,Ravenna,OH,USA,41.210195,-81.25163083
29S,Gardiner,Gardiner,MT,USA,45.04993556,-110.7466008
2A0,Mark Anton,Dayton,TN,USA,35.48624611,-84.93109722
2A1,Jamestown Municipal,Jamestown,TN,USA,36.34970833,-84.94664472
2A3,Larsen Bay,Larsen Bay,AK,USA,57.53510667,-153.9784169
2A9,Kotlik,Kotlik,AK,USA,63.03116111,-163.5299278
2AK,Lime Village,Lime Village,AK,USA,61.35848528,-155.4403508
2B3,Parlin,Newport,NH,USA,43.38812944,-72.18925417
2B7,Pittsfield Municipal,Pittsfield,ME,USA,44.76852778,-69.37441667
2B9,Post Mills,Post Mills,VT,USA,43.884235,-72.25370333
2D1,Barber,Alliance,OH,USA,40.97089139,-81.09981889
2D5,Oakes Municipal,Oakes,ND,USA,46.17301972,-98.07987556
2F5,Lamesa Municipal,Lamesa,TX,USA,32.75627778,-101.9194722
2F6,Skiatook Municipal,Skiatook,OK,USA,36.357035,-96.01138556
2F7,Commerce Municipal,Commerce,TX,USA,33.29288889,-95.89641806
2F8,Morehouse Memorial,Bastrop,LA,USA,32.75607944,-91.88057194
2G2,Jefferson County Airpark,Steubenville,OH,USA,40.35944306,-80.70007806
2G3,Connellsville,Connellsville,PA,USA,39.95893667,-79.65713306
2G4,Garrett County,Oakland,MD,USA,39.58027778,-79.33941667
2G9,Somerset County,Somerset,PA,USA,40.03911111,-79.01455556
2H0,Shelby County,Shelbyville,IL,USA,39.41042861,-88.8454325
2H2,Aurora Memorial Municipal,Aurora,MO,USA,36.96230778,-93.69531111
2I0,Madisonville Municipal,Madisonville,KY,USA,37.35502778,-87.39963889
2I5,Chanute,Rantoul,IL,USA,40.29355556,-88.14236111
2IS,Airglades,Clewiston,FL,USA,26.74200972,-81.04978917
2J2,Liberty County,Hinesville,GA,USA,31.78461111,-81.64116667
2J3,Louisville Municipal,Louisville,GA,USA,32.98654083,-82.38568139
2J5,Millen,Millen,GA,USA,32.89376972,-81.96511583
2J9,Quincy Municipal,Quincy,FL,USA,30.59786111,-84.55741667
2K3,Stanton County Municipal,Johnson,KS,USA,37.58271111,-101.73281
2K4,Scott,Mangum,OK,USA,34.89172583,-99.52675667
2K5,Telida,Telida,AK,USA,63.39387278,-153.2689733
2M0,Princeton-Caldwell County,Princeton,KY,USA,37.11560444,-87.85556944
2M2,Lawrenceburg Municipal,Lawrenceburg,TN,USA,35.2343025,-87.25793222
2M3,Sallisaw Municipal,Sallisaw,OK,USA,35.43816667,-94.80277778
2M4,G. V. Montgomery,Forest,MS,USA,32.35347778,-89.48867944
2M8,Charles W. Baker,Millington,TN,USA,35.27897583,-89.93147611
2O1,Gansner,Quincy,CA,USA,39.94378056,-120.9468983
2O3,Angwin-Parrett,Angwin,CA,USA,38.57851778,-122.4352572
2O6,Chowchilla,Chowchilla,CA,USA,37.11244417,-120.2468406
2O7,Independence,Independence,CA,USA,36.81382111,-118.2050956
2O8,Hinton Municipal,Hinton,OK,USA,35.50592472,-98.34236111
2P2,Washington Island,Washington Island,WI,USA,45.38620833,-86.92448056
2Q3,Yolo Co-Davis/Woodland/Winters,Davis/Woodland/Winters,CA,USA,38.5790725,-121.8566322
2R0,Waynesboro Municipal,Waynesboro,MS,USA,31.64599472,-88.63475667
2R4,Peter Prince,Milton,FL,USA,30.63762083,-86.99365278
2R5,St Elmo,St Elmo,AL,USA,30.50190833,-88.27511667
2R9,Karnes County,Kenedy,TX,USA,28.8250075,-97.86558333
2S1,Vashon Municipal,Vashon,WA,USA,47.45815333,-122.4773506
2S6,Sportsman Airpark,Newberg,OR,USA,45.29567333,-122.9553783
2S7,Chiloquin State,Chiloquin,OR,USA,42.58319167,-121.8761261
2S8,Wilbur,Wilbur,WA,USA,47.75320639,-118.7438936
2T1,Muleshoe Municipal,Muleshoe,TX,USA,34.18513639,-102.6410981
2V1,Stevens,Pagosa Springs,CO,USA,37.277505,-107.0558742
2V2,Vance Brand,Longmont,CO,USA,40.16367139,-105.1630369
2V5,Wray Municipal,Wray,CO,USA,40.10032333,-102.24096
2V6,Yuma Municipal,Yuma,CO,USA,40.10415306,-102.7129869
2W5,Maryland,Indian Head,MD,USA,38.60053667,-77.07296917
2W6,Captain Walter Francis Duke Regional,Leonardtown,MD,USA,38.31536111,-76.55011111
2Y3,Yakutat SPB,Yakutat,AK,USA,59.5624775,-139.7410994
2Y4,Rockwell City Municipal,Rockwell City,IA,USA,42.38748056,-94.61803333
31F,Gaines County,Seminole,TX,USA,32.67535389,-102.652685
32M,Norfolk,Norfolk,MA,USA,42.12787528,-71.37033556
32S,Stevensville,Stevensville,MT,USA,46.52511111,-114.0528056
33J,Geneva Municipal,Geneva,AL,USA,31.05527778,-85.88033333
33M,Water Valley,Water Valley,MS,USA,34.16677639,-89.68619722
33N,Delaware Airpark,Dover,DE,USA,39.21837556,-75.59642667
33S,Pru,Ritzville,WA,USA,47.12487194,-118.3927539
34A,Laurens County,Laurens,SC,USA,34.50705556,-81.94719444
35A,"Union County, Troy Shelton",Union,SC,USA,34.68680111,-81.64121167
35D,Padgham,Allegan,MI,USA,42.53098278,-85.82513556
35S,Wasco State,Wasco,OR,USA,45.58944444,-120.6741667
36K,Lakin,Lakin,KS,USA,37.96946389,-101.2554472
36S,Happy Camp,Happy Camp,CA,USA,41.79067944,-123.3889444
36U,Heber City Municipal/Russ McDonald,Heber,UT,USA,40.48180556,-111.4288056
37T,Calico Rock-Izard County,Calico Rock,AR,USA,36.16565278,-92.14523611
37W,Harnett County,Erwin,NC,USA,35.37880028,-78.73362917
38A,Shaktoolik,Shaktoolik,AK,USA,64.36263194,-161.2025369
38S,Deer Lodge-City-County,Deer Lodge,MT,USA,46.38881583,-112.7669842
38U,Wayne Wonderland,Loa,UT,USA,38.36247972,-111.5960164
39N,Princeton,Princeton,NJ,USA,40.39834833,-74.65760361
3A0,Grove Hill Municipal,Grove Hill,AL,USA,31.68932389,-87.7613875
3A1,Folsom,Cullman,AL,USA,34.26870833,-86.85833611
3A2,New Tazewell Municipal,Tazewell,TN,USA,36.41008417,-83.55546167
3A3,Anson County,Wadesboro,NC,USA,35.02397611,-80.08127333
3AU,Augusta Municipal,Augusta,KS,USA,37.67162778,-97.07787222
3B0,Southbridge Municipal,Southbridge,MA,USA,42.10092806,-72.03840833
3B1,Greenville Municipal,Greenville,ME,USA,45.46302778,-69.55161111
3B2,Marshfield,Marshfield,MA,USA,42.09824111,-70.67212083
3B9,Chester,Chester,CT,USA,41.38390472,-72.50589444
3BS,Jack Barstow,Midland,MI,USA,43.66291528,-84.261325
3CK,Lake In The Hills,Lake In The Hills,IL,USA,42.20680306,-88.32304028
3CM,James Clements Municipal,Bay City,MI,USA,43.54691667,-83.89550222
3CU,Cable Union,Cable,WI,USA,46.19424889,-91.24640972
3D2,Ephraim/Gibraltar,Ephraim,WI,USA,45.13535778,-87.18586556
3D4,Frankfort Dow Memorial,Frankfort,MI,USA,44.62506389,-86.20061944
3F3,De Soto Parish,Mansfield,LA,USA,32.07345972,-93.76551889
3F4,Vivian,Vivian,LA,USA,32.86133333,-94.01015361
3F7,Jones Memorial,Bristow,OK,USA,35.80685278,-96.42185556
3FM,Fremont Municipal,Fremont,MI,USA,43.43890528,-85.99478
3FU,Faulkton Municipal,Faulkton,SD,USA,45.03191861,-99.11566417
3G3,Wadsworth Municipal,Wadsworth,OH,USA,41.00158222,-81.75513111
3G4,Ashland County,Ashland,OH,USA,40.90297222,-82.25563889
3G7,Williamson/Sodus,Williamson,NY,USA,43.23472222,-77.12097222
3GM,Grand Haven Memorial Airpark,Grand Haven,MI,USA,43.03404639,-86.1981625
3I2,Mason County,Point Pleasant,WV,USA,38.91463889,-82.09858333
3I7,Phillipsburg,Phillipsburg,OH,USA,39.91344194,-84.40030889
3J1,Ridgeland,Ridgeland,SC,USA,32.49268694,-80.99233028
3J7,Greene County Airpark,Greensboro,GA,USA,33.59766667,-83.139
3JC,Freeman,Junction City,KS,USA,39.04327556,-96.84328694
3K3,Syracuse-Hamilton County Municipal,Syracuse,KS,USA,37.99167972,-101.7462822
3K6,St Louis-Metro East,Troy/Marine/St. Louis,IL,USA,38.73290861,-89.80656722
3K7,Mark Hoard Memorial,Leoti,KS,USA,38.45696333,-101.3532161
3LC,Logan County,Lincoln,IL,USA,40.15847222,-89.33497222
3LF,Litchfield Municipal,Litchfield,IL,USA,39.16635306,-89.67489694
3M7,Lafayette Municipal,Lafayette,TN,USA,36.518375,-86.05828083
3M8,North Pickens,Reform,AL,USA,33.38900611,-88.00557806
3M9,Warren Municipal,Warren,AR,USA,33.56044333,-92.08538861
3MY,Mt. Hawley Auxiliary,Peoria,IL,USA,40.79525917,-89.6134025
3N6,Old Bridge,Old Bridge,NJ,USA,40.32988667,-74.34678694
3N8,Mahnomen County,Mahnomen,MN,USA,47.25996056,-95.92809778
3ND0,Northwood Municipal,Northwood,ND,USA,47.72423333,-97.59042222
3O1,Gustine,Gustine,CA,USA,37.26271722,-120.9632586
3O3,Municipal,Purcell,OK,USA,34.97979444,-97.38586167
3O4,Sayre Municipal,Sayre,OK,USA,35.16755222,-99.65787361
3O5,Walters Municipal,Walters,OK,USA,34.37258444,-98.40588583
3O7,Hollister Municipal,Hollister,CA,USA,36.89334528,-121.4102706
3O9,Grand Lake Regional,Afton,OK,USA,36.5775775,-94.86190028
3R0,Beeville Municipal,Beeville,TX,USA,28.36455528,-97.79208194
3R1,Bay City Municipal,Bay City,TX,USA,28.973255,-95.86345528
3R2,Le Gros Memorial,Crowley,LA,USA,30.16173611,-92.48396111
3R4,Hart,Many,LA,USA,31.54489667,-93.48645306
3R7,Jennings,Jennings,LA,USA,30.24269333,-92.67344778
3S4,Illinois Valley,Illinois Valley (Cave Junction),OR,USA,42.10372417,-123.6822911
3S8,Grants Pass,Grants Pass,OR,USA,42.51011722,-123.3879894
3S9,Condon State-Pauling,Condon,OR,USA,45.24651889,-120.1664233
3SG,Harry W Browne,Saginaw - H.Browne,MI,USA,43.43341028,-83.86245833
3SQ,St Charles,St Charles,MO,USA,38.84866139,-90.50011833
3T3,Boyceville Municipal,Boyceville,WI,USA,45.042185,-92.0293475
3T5,Fayette Regional Air Center,La Grange,TX,USA,29.90930556,-96.9505
3TR,Jerry Tyler Memorial,Niles,MI,USA,41.83590806,-86.22517611
3U3,Bowman,Anaconda,MT,USA,46.15313278,-112.86784
3U7,Benchmark,Benchmark,MT,USA,47.48133194,-112.8697678
3U8,Big Sandy,Big Sandy,MT,USA,48.16247972,-110.1132631
3V4,Fort Morgan Municipal,Fort Morgan,CO,USA,40.33423194,-103.8039508
3WO,Shawano Municipal,Shawano,WI,USA,44.78777778,-88.56152444
3Y2,George L Scott Municipal,West Union,IA,USA,42.98508917,-91.79060417
3Y3,Winterset Madison County,Winterset,IA,USA,41.36276778,-94.02106194
3Z9,Haines SPB,Haines,AK,USA,59.23495111,-135.4407181
40J,Perry-Foley,Perry,FL,USA,30.06927778,-83.58058333
40N,Chester Cty-G O Carlson,Coatesville,PA,USA,39.97897222,-75.86547222
40U,Manila,Manila,UT,USA,40.98607,-109.6784811
41U,Manti-Ephraim,Manti,UT,USA,39.32912833,-111.6146397
42A,Melbourne Municipal,Melbourne,AR,USA,36.07079222,-91.82914667
42C,White Cloud,White Cloud,MI,USA,43.55974139,-85.77421944
42J,Keystone Airpark,Keystone Heights,FL,USA,29.84475,-82.04752778
42S,Poplar,Poplar,MT,USA,48.11595861,-105.1821928
43A,Montgomery County,Star,NC,USA,35.38819528,-79.79281667
44B,Dover/Foxcroft,Dover-Foxcroft,ME,USA,45.18338806,-69.2328225
44N,Sky Acres,Millbrook,NY,USA,41.70742861,-73.73802889
45J,Rockingham-Hamlet,Rockingham,NC,USA,34.89107083,-79.75905806
45OH,North Bass Island,North Bass Island,OH,USA,41.71932528,-82.82196917
45R,Kountz - Hawthorne,Kountze/Silsbee,TX,USA,30.33633806,-94.25754361
46A,Blairsville,Blairsville,GA,USA,34.85508722,-83.996855
46D,Carrington Municipal,Carrington,ND,USA,47.45111111,-99.15111111
46N,Sky Park,Red Hook,NY,USA,41.98458333,-73.83596556
47A,Cherokee County,Canton,GA,USA,34.31058333,-84.42391667
47J,Cheraw Municipal,Cheraw,SC,USA,34.71258333,-79.95794444
47N,Central Jersey Regional,Manville,NJ,USA,40.52438417,-74.59839194
47V,Curtis Municipal,Curtis,NE,USA,40.63750778,-100.4712539
48A,Cochran,Cochran,GA,USA,32.39936111,-83.27591667
48D,Clare Municipal,Clare,MI,USA,43.83111111,-84.74133333
48I,Braxton County,Sutton,WV,USA,38.68704444,-80.65176083
48K,Ness City Municipal,Ness City,KS,USA,38.47110278,-99.90806667
48S,Harlem,Harlem,MT,USA,48.56666472,-108.7729339
48V,Tri-County,Erie,CO,USA,40.010225,-105.047975
49A,Gilmer County,Ellijay,GA,USA,34.62786417,-84.52492889
49T,Downtown Heliport,Dallas,TX,USA,32.77333333,-96.80027778
49X,Chemehuevi Valley,Chemehuevi Valley,CA,USA,34.52751083,-114.4310697
49Y,Fillmore County,Preston,MN,USA,43.67676,-92.17973444
4A2,Atmautluak,Atmautluak,AK,USA,60.86674556,-162.2731389
4A4,Cornelius-Moore,Cedartown,GA,USA,34.01869444,-85.14647222
4A5,Marshall-Searcy County,Marshall,AR,USA,35.89893667,-92.65588611
4A6,Scottsboro Municipal,Scottsboro,AL,USA,34.68897278,-86.0058125
4A7,Clayton County,Hampton,GA,USA,33.38911111,-84.33236111
4A9,Isbell,Fort Payne,AL,USA,34.4728925,-85.72221722
4B0,South Albany,South Bethlehem,NY,USA,42.56072611,-73.83395639
4B1,Duanesburg,Duanesburg,NY,USA,42.75840889,-74.13290472
4B6,Ticonderoga Muni,Ticonderoga,NY,USA,43.87700278,-73.41317639
4B7,Schroon Lake,Schroon Lake,NY,USA,43.86256083,-73.74262972
4B8,Robertson,Plainville,CT,USA,41.69037667,-72.8648225
4B9,Simsbury Tri-Town,Simsbury,CT,USA,41.91676389,-72.77731778
4C8,Albia Municipal,Albia,IA,USA,40.99445361,-92.76297194
4D0,Abrams Municipal,Grandledge,MI,USA,42.77420167,-84.73309806
4D9,Alma Municipal,Alma,NE,USA,40.11389972,-99.34565306
4F2,Panola County-Sharpe,Carthage,TX,USA,32.17608333,-94.29880556
4F4,Gilmer-Upshur County,Gilmer,TX,USA,32.699,-94.94886111
4G1,Greenville Muni,Greenville,PA,USA,41.44683167,-80.39126167
4G2,Hamburg Inc.,Hamburg,NY,USA,42.7008925,-78.91475694
4G5,Monroe County,Woodsfield,OH,USA,39.77904472,-81.10277222
4G6,Hornell Muni,Hornell,NY,USA,42.38214444,-77.6821125
4G7,Fairmont Muni,Fairmont,WV,USA,39.44816667,-80.16702778
4I0,Mingo County,Williamson,WV,USA,37.68760139,-82.26097306
4I3,Knox County,Mount Vernon,OH,USA,40.32872222,-82.52377778
4I7,Putnam County,Greencastle,IN,USA,39.63359556,-86.8138325
4I9,Morrow County,Mt. Gilead,OH,USA,40.52452778,-82.85005556
4J1,Brantley County,Nahunta,GA,USA,31.21272417,-81.90539083
4J2,Berrien County,Nashville,GA,USA,31.21255556,-83.22627778
4J5,Quitman-Brooks County,Quitman,GA,USA,30.80575139,-83.58654889
4J6,St Marys,St Marys,GA,USA,30.75468028,-81.55731917
4K0,Pedro Bay,Pedro Bay,AK,USA,59.78960972,-154.1238331
4K5,Ouzinkie,Ouzinkie,AK,USA,57.92287611,-152.5005111
4K6,Bloomfield Municipal,Bloomfield,IA,USA,40.73210556,-92.42826889
4KA,Tununak,Tununak,AK,USA,60.57559667,-165.2731272
4M1,Carroll County,Berryville,AR,USA,36.38340333,-93.61685667
4M3,Carlisle Municipal,Carlisle,AR,USA,34.80823,-91.71205083
4M4,Clinton Municipal,Clinton,AR,USA,35.59785528,-92.45182472
4M7,Russellville-Logan County,Russellville,KY,USA,36.79991667,-86.81016667
4M8,Clarendon Municipal,Clarendon,AR,USA,34.64870694,-91.39457111
4M9,Corning Municipal,Corning,AR,USA,36.40423139,-90.64792639
4N1,Greenwood Lake,West Milford,NJ,USA,41.12854806,-74.34584611
4O3,Blackwell-Tonkawa Municipal,Blackwell-Tonkawa,OK,USA,36.74511583,-97.34959972
4O4,McCurtain County Regional,Idabel,OK,USA,33.909325,-94.85835278
4O5,Cherokee Municipal,Cherokee,OK,USA,36.78336306,-98.35035083
4PH,Polacca,Polacca,AZ,USA,35.79167222,-110.4234653
4R1,I H Bass Jr Memorial,Lumberton,MS,USA,31.01546028,-89.48256556
4R3,Jackson Municipal,Jackson,AL,USA,31.47210861,-87.89472083
4R4,Fairhope Municipal,Fairhope,AL,USA,30.4621125,-87.87801972
4R5,Madeline Island,La Pointe,WI,USA,46.78865556,-90.75866944
4R7,Eunice,Eunice,LA,USA,30.46628389,-92.42379917
4R9,Dauphin Island,Dauphin Island,AL,USA,30.26048083,-88.12749972
4S1,Gold Beach Muni,Gold Beach,OR,USA,42.41344444,-124.4242742
4S2,Hood River,Hood River,OR,USA,45.67261833,-121.5364625
4S3,Joseph State,Joseph,OR,USA,45.35709583,-117.2532244
4S9,Portland-Mulino,Mulino (Portland),OR,USA,45.21632417,-122.5900839
4SD,Reno/Stead,Reno,NV,USA,39.66738111,-119.8754169
4T6,Mid-Way,Midlothian-Waxahachie,TX,USA,32.45609722,-96.91240972
4U3,Liberty County,Chester,MT,USA,48.51072222,-110.9908639
4U6,Circle Town County,Circle,MT,USA,47.41861972,-105.5619431
4V0,Rangely,Rangely,CO,USA,40.09469917,-108.7612172
4V1,Johnson,Walsenburg,CO,USA,37.69640056,-104.7838747
4V9,Antelope County,Neligh,NE,USA,42.11222889,-98.0386775
4W1,Elizabethtown Municipal,Elizabethtown,NC,USA,34.60183722,-78.57973306
4Z4,Holy Cross,Holy Cross,AK,USA,62.18829583,-159.7749503
4Z7,Hyder SPB,Hyder,AK,USA,55.90331972,-130.0067031
50I,Kentland Municipal,Kentland,IN,USA,40.75873222,-87.42821917
50J,Berkeley County,Moncks Corner,SC,USA,33.18605556,-80.03563889
50K,Pawnee City Municipal,Pawnee City,NE,USA,40.11611111,-96.19445278
50R,Lockhart Municipal,Lockhart,TX,USA,29.85033333,-97.67241667
51D,Edgeley Municipal,Edgeley,ND,USA,46.34858333,-98.73555556
51Z,Minto (New),Minto,AK,USA,65.14370889,-149.3699647
52A,Madison Municipal,Madison,GA,USA,33.61212528,-83.46044333
52E,Timberon,Timberon,NM,USA,32.63388889,-105.6863889
52J,Lee County,Bishopville,SC,USA,34.24459889,-80.23729333
53A,"Dr. C.P. Savage, Sr.",Montezuma,GA,USA,32.302,-84.00747222
53K,Osage City Municipal,Osage City,KS,USA,38.63334222,-95.80859806
54J,Defuniak Springs,Defuniak Springs,FL,USA,30.7313,-86.15160833
55D,Grayling Army Airfield,Grayling,MI,USA,44.68032028,-84.72886278
55J,Fernandina Beach Municipal,Fernandina Beach,FL,USA,30.61170083,-81.462345
55S,Packwood,Packwood,WA,USA,46.60400083,-121.6778664
56D,Wyandot County,Upper Sandusky,OH,USA,40.88336139,-83.3145325
56M,Warsaw Municipal,Warsaw,MO,USA,38.34688889,-93.345425
56S,Seaside Municipal,Seaside,OR,USA,46.01649694,-123.9054167
57B,Islesboro,Islesboro,ME,USA,44.30285556,-68.91058722
57C,East Troy Municipal,East Troy,WI,USA,42.79711111,-88.3725
59B,Newton,Jackman,ME,USA,45.63199111,-70.24728944
5A4,Okolona Mun.-Richard M. Stovall,Okolona,MS,USA,34.01580528,-88.72618944
5A6,Winona-Montgomery County,Winona,MS,USA,33.46540139,-89.72924806
5A8,Aleknagik,Aleknagik,AK,USA,59.28256167,-158.6176725
5A9,Roosevelt Memorial,Warm Springs,GA,USA,32.93346222,-84.68881639
5B2,Saratoga Cty,Saratoga Springs,NY,USA,43.05126111,-73.86119444
5B3,Danielson,Danielson,CT,USA,41.81974056,-71.90096306
5B7,Rensselaer Air Park,Troy,NY,USA,42.69091194,-73.57956
5CD,Chandalar Shelf,Chandalar Camp,AK,USA,68.06543944,-149.5797392
5D3,Owosso Community,Owosso,MI,USA,42.99297222,-84.1389125
5F1,Post-Garza County Municipal,Post,TX,USA,33.20370556,-101.340415
5F4,Homer Municipal,Homer,LA,USA,32.78850806,-93.00366083
5G0,Leroy,Le Roy,NY,USA,42.98136667,-77.93751389
5G7,Bluffton,Bluffton,OH,USA,40.88544444,-83.86863889
5G8,Pittsburgh Boquet Airpark,Jeanette,PA,USA,40.37645722,-79.60837583
5G9,Toledo Suburban,Lambertville,MI,USA,41.7358775,-83.65541056
5HO,Hope,Hope,AK,USA,60.90415028,-149.6238389
5I4,Sheridan,Sheridan,IN,USA,40.17792583,-86.21729889
5J0,John Day State,John Day,OR,USA,44.40416667,-118.9625
5J9,Twin City,Loris,SC,USA,34.08848361,-78.86462028
5K2,Tribune Municipal,Tribune,KS,USA,38.45418222,-101.7462828
5M0,Rountree,Hartselle,AL,USA,34.40823444,-86.93295056
5M1,De Witt Municipal,De Witt,AR,USA,34.2626,-91.30984194
5M4,Fordyce Municipal,Fordyce,AR,USA,33.84593722,-92.36542861
5M9,Marion-Crittenden County,Marion,KY,USA,37.33616222,-88.11113611
5N8,Casselton Regional,Casselton,ND,USA,46.85469528,-97.20870028
5ND6,Hillsboro Municipal,Hillsboro,ND,USA,47.35940778,-97.06041639
5NI,Nikolai,Nikolai,AK,USA,63.0174475,-154.3639608
5NK,Naknek,Naknek,AK,USA,58.73288056,-157.0199197
5NN,Nondalton,Nondalton,AK,USA,59.97904306,-154.8396944
5R3,Rusty Allen,Lago Vista,TX,USA,30.498585,-97.96947222
5R4,Foley Municipal,Foley,AL,USA,30.42769722,-87.70082
5R5,Wharton Municipal,Wharton,TX,USA,29.25427778,-96.15438889
5R8,De Quincy Industrial Airpark,De Quincy,LA,USA,30.44117222,-93.47349722
5S8,St. Michael,St. Michael,AK,USA,63.49005056,-162.1103692
5T5,Hillsboro Municipal,Hillsboro,TX,USA,32.08348611,-97.09722722
5T6,Dona Ana County  At Santa Teresa,Santa Teresa,NM,USA,31.88098556,-106.7048131
5T9,Maverick County Meml Intl,Eagle Pass,TX,USA,28.85719361,-100.5122997
5TE,Tetlin,Tetlin,AK,USA,63.13382361,-142.5219339
5U3,Ennis - Big Sky,Ennis,MT,USA,45.27175833,-111.6486389
5U8,Geraldine,Geraldine,MT,USA,47.59664,-110.2660367
5V5,Shiprock Airstrip,Shiprock,NM,USA,36.6977775,-108.7011986
5V8,Kadoka Municipal,Kadoka,SD,USA,43.83332611,-101.4970881
5W8,Siler City Municipal,Siler City,NC,USA,35.7029175,-79.50529972
5Z1,Juneau Harbor,Juneau,AK,USA,58.29888889,-134.4077778
5Z5,Kantishna,Kantishna,AK,USA,63.54171472,-150.9939547
60F,Seymour Municipal,Seymour,TX,USA,33.64870417,-99.26063056
60J,Ocean Isle,Ocean Isle Beach,NC,USA,33.90850556,-78.43667222
61A,Camden Municipal,Camden,AL,USA,31.97987056,-87.33888056
61B,Boulder City Municipal,Boulder City,NV,USA,35.94748028,-114.8610967
61C,Fort Atkinson Municipal,Fort Atkinson,WI,USA,42.96320278,-88.81762806
61J,Portland Downtown Heliport,Portland,OR,USA,45.52527778,-122.6709289
61S,Cottage Grove State,Cottage Grove,OR,USA,43.79984528,-123.0289678
62D,Warren,Warren,OH,USA,41.26672278,-80.92897778
62H,Giddings-Lee County,Giddings,TX,USA,30.16927167,-96.98001083
62S,Christmas Valley,Christmas Valley,OR,USA,43.23653139,-120.6660967
63A,Lloyd R. Roundtree Seaplane Facility,Petersburg,AK,USA,56.81131972,-132.9600567
63C,Adams County Legion,Adams/Friendship,WI,USA,43.96117222,-89.78804889
63S,Colville Municipal,Colville,WA,USA,48.54156944,-117.8844247
65J,Wrens Memorial,Wrens,GA,USA,33.222645,-82.38373611
65S,Boundary County,Bonners Ferry,ID,USA,48.72632639,-116.2954761
66D,Sturgis Municipal,Sturgis,SD,USA,44.41761111,-103.3747778
67L,Mesquite,Mesquite,NV,USA,36.83497556,-114.0552453
68A,Wrangell SPB,Wrangell,AK,USA,56.466325,-132.3800181
68S,Davenport,Davenport,WA,USA,47.65404528,-118.1677519
6A1,Butler Municipal,Butler,GA,USA,32.56736694,-84.25074833
6A2,Griffin-Spaulding County,Griffin,GA,USA,33.22697222,-84.27494444
6A3,Andrews-Murphy,Andrews,NC,USA,35.19453167,-83.86490194
6A4,Johnson County,Mountain City,TN,USA,36.41789833,-81.82511528
6A8,Allakaket,Allakaket,AK,USA,66.55194444,-152.6222222
6B0,Middlebury State,Middlebury,VT,USA,43.98478278,-73.09594889
6B4,Frankfort-Highland,Utica/Frankfort,NY,USA,43.02090306,-75.17043861
6B6,Minute Man Airfield,Stow,MA,USA,42.46045361,-71.51791444
6B8,Caledonia County State,Lyndonville,VT,USA,44.56911417,-72.01797889
6B9,Skaneateles Aero Drome,Skaneateles,NY,USA,42.91395583,-76.44076889
6D6,Greenville Municipal,Greenville,MI,USA,43.14228139,-85.25380722
6D8,Barnes County Municipal,Valley City,ND,USA,46.94100778,-98.01762611
6F1,Talihina Municipal,Talihina,OK,USA,34.70777139,-95.07378583
6G1,Titusville,Titusville,PA,USA,41.60880861,-79.74133111
6G5,Barnesville - Bradfield,Barnesville,OH,USA,40.00243139,-81.19183
6I2,Lebanon-Springfield,Springfield,KY,USA,37.63355556,-85.24216667
6J0,Corporate,Pelion,SC,USA,33.79463889,-81.24586111
6J2,St George,St George,SC,USA,33.1955,-80.50847222
6J4,Saluda County,Saluda,SC,USA,33.92680111,-81.79455306
6K3,Creighton Municipal,Creighton,NE,USA,42.47083694,-97.88367778
6K4,Fairview Municipal,Fairview,OK,USA,36.29014667,-98.47582833
6K8,Tok Junction,Tok,AK,USA,63.32881806,-142.9536194
6L4,Logan County,Logan,WV,USA,37.85567778,-81.91589722
6M2,Horseshoe Bend,Horseshoe Bend,AR,USA,36.21673389,-91.75014556
6M6,Lewis County Regional,Monticello,MO,USA,40.12916667,-91.67833333
6M7,Lee County-Marianna,Marianna,AR,USA,34.78027778,-90.81055556
6M8,Marked Tree Municipal,Marked Tree,AR,USA,35.53341472,-90.40149028
6N5,E 34th St Heliport,New York,NY,USA,40.74260167,-73.97208306
6N7,New York Skyports Inc. SPB,New York,NY,USA,40.73399083,-73.97291639
6N8,Thomas County,Thedford,NE,USA,41.96217028,-100.5690139
6R3,Cleveland Municipal,Cleveland,TX,USA,30.35643,-95.00801472
6R7,Old Harbor (New),Old Harbor,AK,USA,57.21810306,-153.2697494
6R9,Llano Municipal,Llano,TX,USA,30.78450278,-98.66025083
6S0,Big Timber,Big Timber,MT,USA,45.80638889,-109.9811111
6S2,Florence Muni,Florence,OR,USA,43.97901,-124.1095631
6S3,Columbus,Columbus,MT,USA,45.6291075,-109.2507167
6S5,Ravalli County,Hamilton,MT,USA,46.25149444,-114.1255403
6S8,Laurel Municipal,Laurel,MT,USA,45.70308833,-108.7610886
6V0,Edgemont Municipal,Edgemont,SD,USA,43.29525056,-103.8435325
6V3,Tazewell County,Richlands,VA,USA,37.06374667,-81.79826944
6V4,Wall Municipal,Wall,SD,USA,43.99498861,-102.2504367
6V6,Hopkins,Nucla,CO,USA,38.23879833,-108.5632597
70J,Cairo-Grady County,Cairo,GA,USA,30.88797667,-84.15473528
71J,Blackwell,Ozark,AL,USA,31.43113889,-85.61922222
72S,Rosalia Municipal,Rosalia,WA,USA,47.23683778,-117.4210244
73C,Lancaster,Lancaster,WI,USA,42.78054722,-90.68096028
73J,Beaufort County,Beaufort,SC,USA,32.4121375,-80.63455083
74D,Marshall Cty,Moundsville,WV,USA,39.88083333,-80.73577778
74S,Anacortes,Anacortes,WA,USA,48.4989925,-122.6623956
74V,Roosevelt Municipal,Roosevelt,UT,USA,40.27829167,-110.0512619
75J,Turner County,Ashburn,GA,USA,31.68545833,-83.63211194
76G,Marine City,Marine City,MI,USA,42.72086583,-82.59574694
77G,Marlette Township,Marlette,MI,USA,43.31183,-83.09091444
77S,Hobby,Creswell,OR,USA,43.93206889,-123.0067483
78D,Caro Municipal,Caro,MI,USA,43.45908333,-83.44522222
79D,Philippi-Barbour County Regional,Philippi,WV,USA,39.16620778,-80.06258056
79J,Andalusia,Andalusia,AL,USA,31.30875278,-86.39376083
79S,Fort Benton,Fort Benton,MT,USA,47.84583333,-110.6336111
7A0,Greensboro Municipal,Greensboro,AL,USA,32.68147222,-87.66208333
7A2,Demopolis Municipal,Demopolis,AL,USA,32.46381944,-87.95406389
7A3,Lanett Municipal,Lanett,AL,USA,32.81204611,-85.22958111
7A5,Roanoke Municipal,Roanoke,AL,USA,33.12928722,-85.366615
7A8,Avery County/Morrison,Spruce Pine,NC,USA,35.94457028,-81.99566944
7B2,La Fleur,Northampton,MA,USA,42.32816806,-72.61151667
7D2,Troy-Oakland,Troy,MI,USA,42.54294389,-83.17790861
7F3,Caddo Mills Municipal,Caddo Mills,TX,USA,33.03622222,-96.24313889
7F6,Clarksville-Red River County,Clarksville,TX,USA,33.59316472,-95.06355528
7F7,Clifton Municipal,Clifton,TX,USA,31.81682333,-97.56696361
7F9,Comanche County-City,Comanche,TX,USA,31.91681306,-98.600325
7G0,Ledgedale Airpark,Brockport,NY,USA,43.18118194,-77.91362333
7G8,Geauga County,Middlefield,OH,USA,41.44960972,-81.06292972
7I7,Bellefontaine Municipal,Bellefontaine,OH,USA,40.41208333,-83.73686111
7K0,Pike County-Hatcher,Pikeville,KY,USA,37.56173889,-82.56660694
7K2,Skagway SPB,Skagway,AK,USA,59.44689528,-135.3226633
7K4,Ohio County,Hartford,KY,USA,37.45832417,-86.84995194
7K8,Martin,South Sioux City,NE,USA,42.45416111,-96.47253111
7KA,Tatitlek,Tatitlek,AK,USA,60.86890528,-146.6864653
7M1,McGehee Municipal,McGehee,AR,USA,33.62022111,-91.36484056
7M3,Bearce,Mount Ida,AR,USA,34.52926056,-93.52713472
7M4,Osceola Municipal,Osceola,AR,USA,35.69114639,-90.01012028
7M5,Ozark-Franklin County,Ozark,AR,USA,35.51069583,-93.8393075
7M7,Piggott Municipal,Piggott,AR,USA,36.37820556,-90.16624167
7N0,New Orleans Downtown Heliport,New Orleans,LA,USA,29.95194444,-90.08166667
7N1,Corning-Painted Post,Corning,NY,USA,42.17590722,-77.11219278
7N7,Spitfire Aerodrome,Pedrictown,NJ,USA,39.73556333,-75.39772111
7S0,Ronan,Ronan,MT,USA,47.57076861,-114.0967783
7S1,Twin Bridges,Twin Bridges,MT,USA,45.53325917,-112.3091656
7S5,Independence State,Independence,OR,USA,44.86676444,-123.1982475
7S6,White Sulphur Springs,White Sulphur Springs,MT,USA,46.50410722,-110.9132667
7S7,Valier,Valier,MT,USA,48.29997583,-112.2508711
7V1,Buena Vista Muni,Buena Vista,CO,USA,38.81416194,-106.1206939
7V7,Red Cloud Municipal,Red Cloud,NE,USA,40.08473556,-98.54061694
7W6,Hyde County,Englehard,NC,USA,35.5623925,-75.95518417
80F,Antlers Municipal,Antlers,OK,USA,34.19260083,-95.64985889
81B,Oxford County Regional,Norway,ME,USA,44.15742611,-70.48129583
82C,Mauston-New Lisbon Union,New Lisbon,WI,USA,43.83872167,-90.13768389
82V,Pine Bluffs Municipal,Pine Bluffs,WY,USA,41.15331528,-104.1302292
83D,Mackinac County,St Ignace,MI,USA,45.89029056,-84.73755083
84D,Cheyenne Eagle Butte,Eagle Butte,SD,USA,44.984375,-101.2510417
84K,Meyers Chuck SPB,Meyers Chuck,AK,USA,55.73963611,-132.2550183
84R,Smithville Municipal,Smithville,TX,USA,30.03048028,-97.16687194
85V,Ganado,Ganado,AZ,USA,35.70140278,-109.5103814
86F,Carnegie Municipal,Carnegie,OK,USA,35.12061417,-98.5806175
87I,Yazoo County,Yazoo City,MS,USA,32.883215,-90.4636475
87Y,Blackhawk Airfield,Madison,WI,USA,43.10491444,-89.18553833
88C,Palmyra Municipal,Palmyra,WI,USA,42.88355556,-88.59743056
88J,Allendale County,Allendale,SC,USA,32.99512944,-81.27024583
88M,Eureka,Eureka,MT,USA,48.96885444,-115.0704464
89D,Kelleys Island Land,Kelleys Island,OH,USA,41.60282583,-82.684625
8A0,Albertville Municipal,Albertville,AL,USA,34.22910972,-86.25575806
8A1,Guntersville Municipal,Guntersville,AL,USA,34.39944167,-86.27016111
8A3,Livingston Municipal,Livingston,TN,USA,36.41217389,-85.31154861
8B0,Rangeley Municipal,Rangeley,ME,USA,44.991895,-70.66462472
8D1,New Holstein Municipal,New Holstein,WI,USA,43.94424111,-88.1134775
8D3,Sisseton Municipal,Sisseton,SD,USA,45.67079278,-96.99619167
8D4,Sparta,Sparta,MI,USA,43.12860833,-85.67689778
8D7,Clark County,Clark,SD,USA,44.89570278,-97.71191361
8D9,Howard Municipal,Howard,SD,USA,44.02914056,-97.53784778
8F7,Decatur Municipal,Decatur,TX,USA,33.25463889,-97.58055556
8G2,Lawrence,Corry,PA,USA,41.90755611,-79.64105083
8G6,Harrison County,Cadiz,OH,USA,40.23820667,-81.01256917
8G7,Zelienople,Zelienople,PA,USA,40.80161944,-80.16072889
8K8,Cimarron Municipal,Cimarron,KS,USA,37.83057667,-100.3504222
8K9,Murphys Pullout SPB,Ketchikan,AK,USA,55.38965028,-131.7380742
8M1,Booneville-Baldwyn,Booneville,MS,USA,34.58981806,-88.64699861
8S1,Polson,Polson,MT,USA,47.69543861,-114.1851178
8S2,Cashmere-Dryden,Cashmere,WA,USA,47.51484611,-120.4848025
8S5,East Cooper,Mt Pleasant,SC,USA,32.89783333,-79.78286111
8U6,Terry,Terry,MT,USA,46.77917333,-105.3047083
8U8,Townsend,Townsend,MT,USA,46.33111111,-111.4813889
8V2,Stuart-Atkinson Municipal,Atkinson,NE,USA,42.56250167,-99.03787611
8Y2,Buffalo Municipal,Buffalo,MN,USA,45.15904694,-93.84330361
91C,Sauk - Prairie,Prairie Du Sac,WI,USA,43.2969325,-89.75595639
91F,Arrowhead,Canadian,OK,USA,35.15426444,-95.62026389
93B,Stonington,Stonington,ME,USA,44.17508056,-68.67863722
93C,Richland,Richland Center,WI,USA,43.28333333,-90.29827778
93F,Mignon Laird Municipal,Cheyenne,OK,USA,35.60393694,-99.70343889
93Y,David City Municipal,David City,NE,USA,41.23334583,-97.11698111
94K,Cassville Municipal,Cassville,MO,USA,36.69741667,-93.90052778
95F,Cleveland Municipal,Cleveland,OK,USA,36.28340306,-96.46418833
96D,Walhalla Municipal,Walhalla,ND,USA,48.94057222,-97.902775
96Z,North Whale SPB,North Whale Pass,AK,USA,56.11631056,-133.1217153
97M,Ekalaka,Ekalaka,MT,USA,45.87791444,-104.5375072
98D,Onida Municipal,Onida,SD,USA,44.70414917,-100.1087353
99N,Bamburg County,Bamburg,SC,USA,33.30515528,-81.10898917
99Y,Greeley Municipal,Greeley,NE,USA,41.55834528,-98.54618528
9A1,Covington Municipal,Covington,GA,USA,33.6324825,-83.84955806
9A3,Chuathbaluk,Chuathbaluk,AK,USA,61.58317306,-159.2359667
9A4,Lawrence County,Courtland,AL,USA,34.65938889,-87.34883333
9A5,Barwick-LaFayette,LaFayette,GA,USA,34.68896917,-85.29023333
9A6,Chester Municipal,Chester,SC,USA,34.78933333,-81.19577778
9A8,Ugashik,Ugashik,AK,USA,57.5278675,-157.3993056
9C8,Evart Municipal,Evart,MI,USA,43.8958525,-85.27920861
9D0,Highmore Municipal,Highmore,SD,USA,44.54165056,-99.44622306
9D1,Gregory Municipal,Gregory,SD,USA,43.22174722,-99.4033
9D2,Harding County,Buffalo,SD,USA,45.58055222,-103.5296356
9D7,Cando Municipal,Cando,ND,USA,48.4841675,-99.23680389
9D9,Hastings Municipal,Hastings,MI,USA,42.66361778,-85.34625944
9G0,Buffalo Airfield,Buffalo,NY,USA,42.86200306,-78.71658528
9G1,West Penn,Tarentum,PA,USA,40.60423333,-79.82060611
9G3,Akron,Akron,NY,USA,43.02108667,-78.48296778
9G5,Royalton,Gasport,NY,USA,43.18200222,-78.55780528
9G8,Ebensburg,Ebensburg,PA,USA,40.46121083,-78.77524389
9I0,Havana Regional,Havana,IL,USA,40.221155,-90.02289361
9I3,West Liberty,West Liberty,KY,USA,37.91453139,-83.25212111
9K2,Kokhanok,Kokhanok,AK,USA,59.43264556,-154.8027058
9K4,Skyhaven,Warrensburg,MO,USA,38.7842425,-93.80285417
9K7,Ellsworth Municipal,Ellsworth,KS,USA,38.74750889,-98.23061222
9K8,Kingman Municipal,Kingman,KS,USA,37.66660278,-98.12264722
9M4,Ackerman-Choctaw County,Ackerman,MS,USA,33.3034575,-89.22840028
9M6,Kelly,Oak Grove,LA,USA,32.84921361,-91.40390611
9M8,Sheridan-Grant County Regional,Sheridan,AR,USA,34.32842917,-92.35098583
9S2,Scobey,Scobey,MT,USA,48.80772722,-105.43947
9S4,Mineral County,Superior,MT,USA,47.16825944,-114.8537411
9S5,Three Forks,Three Forks,MT,USA,45.87852778,-111.5691389
9S7,Winifred,Winifred,MT,USA,47.55164778,-109.3776792
9S9,Lexington,Lexington,OR,USA,45.45263139,-119.6886361
9U0,Turner,Turner,MT,USA,48.85417361,-108.4090214
9U3,Austin,Austin,NV,USA,39.46798056,-117.1953703
9U4,Dixon,Dixon,WY,USA,41.03829806,-107.4972869
9V5,Modisett,Rushville,NE,USA,42.73748639,-102.4448947
9V6,Martin Municipal,Martin,SD,USA,43.16564083,-101.7126953
9V9,Chamberlain Municipal,Chamberlain,SD,USA,43.76612222,-99.32134
9W7,Currituck County,Currituck,NC,USA,36.39893194,-76.01631111
A04,Centre Municipal,Centre,AL,USA,34.15987361,-85.63512944
A14,Portage Creek,Portage Creek,AK,USA,58.906485,-157.7141078
A29,Sitka SPB,Sitka,AK,USA,57.05213778,-135.3462086
A30,Scott Valley,Fort Jones,CA,USA,41.55819444,-122.8553103
A32,Butte Valley,Dorris,CA,USA,41.88709222,-121.9755614
A61,Tuntutuliak,Tuntutuliak,AK,USA,60.33534556,-162.6670094
A63,Twin Hills,Twin Hills,AK,USA,59.07562167,-160.2730436
A79,Chignik Lake,Chignik Lake,AK,USA,56.25504722,-158.7753614
A85,Kwigillingok,Kwigillingok,AK,USA,59.87644778,-163.1675583
AAF,Apalachicola Municipal,Apalachicola,FL,USA,29.72754583,-85.02744778
AAO,Colonel James Jabara,Wichita,KS,USA,37.74755556,-97.22113889
AAS,Taylor County,Cambellsville,KY,USA,37.35827778,-85.30941667
AAT,Alturas Municipal,Alturas,CA,USA,41.483,-120.5653611
ABE,Lehigh Valley International,Allentown,PA,USA,40.65236278,-75.44040167
ABI,Abilene Regional,Abilene,TX,USA,32.41132,-99.68189722
ABO,Antonio (Nery) Juarbe Pol,Arecibo,PR,USA,18.45111111,-66.67555556
ABQ,Albuquerque International,Albuquerque,NM,USA,35.04022222,-106.6091944
ABR,Aberdeen Regional,Aberdeen,SD,USA,45.44905556,-98.42183333
ABY,Southwest Georgia Regional,Albany,GA,USA,31.535515,-84.19447333
ACB,Antrim County,Bellaire,MI,USA,44.98857611,-85.198355
ACJ,Souther,Americus,GA,USA,32.11079917,-84.18884806
ACK,Nantucket Memorial,Nantucket,MA,USA,41.25305194,-70.06018139
ACQ,Waseca Municipal,Waseca,MN,USA,44.07346389,-93.55294361
ACT,Waco Regional,Waco,TX,USA,31.61128833,-97.23051917
ACV,Arcata,Arcata/Eureka,CA,USA,40.97811528,-124.1086189
ACY,Atlantic City International,Atlantic City,NJ,USA,39.45758333,-74.57716667
ACZ,Henderson,Wallace,NC,USA,34.71789028,-78.00362444
ADC,Wadena Municipal,Wadena,MN,USA,46.45026972,-95.21095472
ADG,Lenawee County,Adrian,MI,USA,41.86943667,-84.07480528
ADH,Ada Municipal,Ada,OK,USA,34.80434056,-96.6712775
ADK,Adak,Adak,AK,USA,51.87796389,-176.6460306
ADM,Ardmore Municipal,Ardmore,OK,USA,34.30320667,-97.01952167
ADQ,Kodiak,Kodiak,AK,USA,57.74996778,-152.4938553
ADS,Addison,Dallas/Addison,TX,USA,32.96855944,-96.83644778
ADT,Atwood-Rawlins County City-County,Atwood,KS,USA,39.84013889,-101.0420278
ADU,Audubon Municipal,Audubon,IA,USA,41.70137556,-94.92054167
AEG,Double Eagle II,Albuquerque,NM,USA,35.14515278,-106.7951617
AEL,Albert Lea Municipal,Albert Lea,MN,USA,43.68151278,-93.36723778
AEX,Alexandria International,Alexandria,LA,USA,31.32737167,-92.54855611
AFE,Kake,Kake,AK,USA,56.96048139,-133.9082694
AFJ,Washington County,Washington,PA,USA,40.13648833,-80.29020083
AFK,Nebraska City Municipal,Nebraska City,NE,USA,40.60688889,-95.86569444
AFM,Ambler,Ambler,AK,USA,67.10610472,-157.8536203
AFN,Jaffrey Municipal Silver Ranch,Jaffrey,NH,USA,42.80513417,-72.00302194
AFO,Afton Municipal,Afton,WY,USA,42.71124583,-110.9421639
AFW,Fort Worth Alliance,Fort Worth,TX,USA,32.98763889,-97.31880556
AGC,Allegheny Cty,Pittsburgh,PA,USA,40.35440139,-79.93016889
AGN,Angoon SPB,Angoon,AK,USA,57.50355528,-134.5850939
AGO,Magnolia Municipal,Magnolia,AR,USA,33.22802111,-93.21696861
AGS,Bush,Augusta,GA,USA,33.369955,-81.96449611
AGZ,Wagner Municipal,Wagner,SD,USA,43.06332694,-98.29618972
AHH,Amery Municipal,Amery,WI,USA,45.28114833,-92.37539222
AHN,Athens Municipal,Athens,GA,USA,33.94859528,-83.32634694
AHP,Port Alexander SPB,Port Alexander,AK,USA,56.24684222,-134.6481539
AHQ,Wahoo Municipal,Wahoo,NE,USA,41.24133333,-96.59402778
AIA,Alliance Municipal,Alliance,NE,USA,42.05325,-102.8037222
AID,Anderson Municipal,Anderson,IN,USA,40.10862139,-85.61299472
AIG,Langlade County,Antigo,WI,USA,45.15419444,-89.11072222
AIK,Aiken Municipal,Aiken,SC,USA,33.64955556,-81.68447222
AIO,Atlantic Municipal,Atlantic,IA,USA,41.40726722,-95.04690639
AIT,Aitkin Municipal,Aitkin,MN,USA,46.5484225,-93.6768
AIV,George Downer,Aliceville,AL,USA,33.10706889,-88.19725167
AIY,Atlantic City Municipal,Atlantic City,NJ,USA,39.36002778,-74.45608333
AIZ,Lee C Fine Memorial,Kaiser/Lake Ozark,MO,USA,38.096035,-92.5494875
AJC,Chignik (Anchorage Bay),Chignik,AK,USA,56.3114625,-158.3732369
AJG,Mt Carmel Municipal,Mt Carmel,IL,USA,38.60654722,-87.72669417
AJO,Corona Municipal,Corona,CA,USA,33.89765389,-117.60244
AJR,Habersham County,Cornelia,GA,USA,34.50081944,-83.55487
AK5,Perryville,Perryville,AK,USA,55.90806056,-159.1585781
AKA,Atka,Atka,AK,USA,52.22034833,-174.2063503
AKH,Gastonia Municipal,Gastonia,NC,USA,35.20265944,-81.1498675
AKI,Akiak,Akiak,AK,USA,60.90481194,-161.2270189
AKK,Akhiok,Akhiok,AK,USA,56.93869083,-154.1825556
AKN,King Salmon,King Salmon,AK,USA,58.67680167,-156.6492175
AKO,Akron-Washington Co,Akron,CO,USA,40.17563333,-103.2220278
AKP,Anaktuvuk Pass,Anaktuvuk Pass,AK,USA,68.1343225,-151.74168
AKR,Akron Fulton Intl.,Akron,OH,USA,41.0375,-81.46693944
AKW,Klawock,Klawock,AK,USA,55.57923333,-133.0759972
AL08,Vaiden,Marion,AL,USA,32.51235611,-87.38555472
ALB,Albany Cty,Albany,NY,USA,42.74811944,-73.80297861
ALI,Alice International,Alice,TX,USA,27.74088889,-98.02694444
ALM,Alamogordo-White Sands Regional,Alamogordo,NM,USA,32.83994444,-105.9905833
ALN,St. Louis Regional,Alton/St. Louis,IL,USA,38.89029083,-90.04604306
ALO,Waterloo Municipal,Waterloo,IA,USA,42.55708139,-92.40034361
ALS,San Luis Valley Regional/Bergman,Alamosa,CO,USA,37.43491667,-105.8665556
ALW,Walla Walla Regional,Walla Walla,WA,USA,46.09456167,-118.2880367
ALX,Thomas C Russell,Alexander City,AL,USA,32.91475167,-85.96295611
AMA,Amarillo International,Amarillo,TX,USA,35.2193725,-101.7059272
AMG,Bacon County,Alma,GA,USA,31.53605556,-82.50655556
AMN,Gratiot Community,Alma,MI,USA,43.3221425,-84.68794917
AMT,Alexander Salamon,West Union,OH,USA,38.85148778,-83.56627778
AMW,Ames Municipal,Ames,IA,USA,41.99206972,-93.62180139
ANB,Anniston Metropolitan,Anniston,AL,USA,33.58816667,-85.85811111
ANC,Ted Stevens Anchorage International,Anchorage,AK,USA,61.17432028,-149.9961856
AND,Anderson County,Anderson,SC,USA,34.49494444,-82.70902778
ANE,Anoka County,Minneapolis,MN,USA,45.145,-93.21138889
ANI,Aniak,Aniak,AK,USA,61.58159694,-159.5430428
ANQ,Steuben County-Tri State,Angola,IN,USA,41.63969833,-85.08349333
ANV,Anvik,Anvik,AK,USA,62.64858333,-160.1898889
ANW,Ainsworth Municipal,Ainsworth,NE,USA,42.57922222,-99.99297222
ANY,Anthony Municipal,Anthony,KS,USA,37.15852194,-98.07964667
AOC,Arco-Butte County,Arco,ID,USA,43.60343056,-113.3340972
AOH,Allen County,Lima,OH,USA,40.70694444,-84.02666667
AOO,Altoona-Blair Cty,Altoona,PA,USA,40.29637222,-78.32002306
APA,Centennial,Denver,CO,USA,39.57012833,-104.8492942
APC,Napa County,Napa,CA,USA,38.21319444,-122.2806944
APF,Naples Municipal,Naples,FL,USA,26.15247222,-81.77544444
APN,Alpena County Regional,Alpena,MI,USA,45.0780675,-83.56028583
APT,Marion County-Brown,Jasper,TN,USA,35.06067778,-85.58531667
APV,Apple Valley,Apple Valley,CA,USA,34.57528944,-117.1861792
AQC,Klawock SPB,Klawock,AK,USA,55.5546575,-133.1016928
AQH,Kwinhagak,Quinhagak,AK,USA,59.75700722,-161.8794789
AQT,Nuiqsut,Nuiqsut,AK,USA,70.20995278,-151.0055611
AQW,Harriman And West,North Adams,MA,USA,42.69591417,-73.17038306
AQY,Girdwood,Girdwood,AK,USA,60.96609583,-149.1257892
ARA,Acadiana Regional,New Iberia,LA,USA,30.03775833,-91.88389611
ARB,Ann Arbor Municipal,Ann Arbor,MI,USA,42.22298361,-83.74560722
ARC,Arctic Village,Arctic Village,AK,USA,68.11608083,-145.5761114
ARG,Walnut Ridge Regional,Walnut Ridge,AR,USA,36.12534667,-90.92461944
ARR,Aurora Municipal,Chicago/Aurora,IL,USA,41.77192944,-88.47565917
ART,Watertown Intl,Watertown,NY,USA,43.99192222,-76.02173861
ARV,Lakeland,Minocqua-Woodruff,WI,USA,45.92792556,-89.73094278
ASD,Slidell,Slidell,LA,USA,30.345055,-89.82078833
ASE,Aspen-Pitkin Co/Sardy,Aspen,CO,USA,39.22316,-106.868845
ASG,Springdale Municipal,Springdale,AR,USA,36.17641056,-94.11925833
ASH,Boire,Nashua,NH,USA,42.78176306,-71.51477944
ASJ,Tri-County,Ahoskie,NC,USA,36.29752583,-77.17085556
ASL,Marshall - Harrison County,Marshall,TX,USA,32.5205,-94.30777778
ASN,Talladega Municipal,Talladega,AL,USA,33.56991111,-86.05085833
AST,Astoria Regional,Astoria,OR,USA,46.15797222,-123.8786944
ASW,Warsaw Municipal,Warsaw,IN,USA,41.2747,-85.84005556
ASX,John F Kennedy Memorial,Ashland,WI,USA,46.54852806,-90.91896639
ATA,Hall-Miller Municipal,Atlanta,TX,USA,33.101805,-94.19532694
ATK,Atqasuk,Atqasuk,AK,USA,70.46727611,-157.4357361
ATL,William B Hartsfield-Atlanta Intl,Atlanta,GA,USA,33.64044444,-84.42694444
ATS,Artesia Municipal,Artesia,NM,USA,32.85252806,-104.4676864
ATW,Outagamie County Regional,Appleton,WI,USA,44.25740806,-88.51947556
ATY,Watertown Municipal,Watertown,SD,USA,44.91398056,-97.15471944
AUG,Augusta State,Augusta,ME,USA,44.32064972,-69.79731806
AUH,Aurora Municipal,Aurora,NE,USA,40.89413889,-97.99455556
AUK,Alakanuk,Alakanuk,AK,USA,62.68004417,-164.6599253
AUM,Austin Municipal,Austin,MN,USA,43.66499083,-92.933385
AUN,Auburn Municipal,Auburn,CA,USA,38.95476944,-121.0820806
AUO,Auburn-Opelik,Auburn,AL,USA,32.61635417,-85.43355944
AUS,Austin-Bergstrom International,Austin,TX,USA,30.19453278,-97.66987194
AUW,Wausau Municipal,Wausau,WI,USA,44.92847222,-89.62661111
AVC,Mecklenburg-Brunswick Regional,South Hill,VA,USA,36.68827778,-78.05447222
AVK,Alva Regional,Alva,OK,USA,36.77317,-98.66994611
AVL,Asheville Regional,Asheville,NC,USA,35.43619444,-82.54180556
AVO,Avon Park Municipal,Avon Park,FL,USA,27.591145,-81.52785333
AVP,Wilkes-Barre/Scranton Intl,Wilkes-Barre/Scranton,PA,USA,41.33814944,-75.7242675
AVQ,Marana Northwest Regional,Marana,AZ,USA,32.40939028,-111.2185086
AVX,Catalina,Avalon,CA,USA,33.40494444,-118.4158611
AWG,Washington Municipal,Washington,IA,USA,41.27610083,-91.67344389
AWI,Wainwright,Wainwright,AK,USA,70.638,-159.99475
AWM,West Memphis Municipal,West Memphis,AR,USA,35.13505861,-90.23444639
AWO,Arlington Municipal,Arlington,WA,USA,48.16074833,-122.1590208
AXA,Algona Municipal,Algona,IA,USA,43.07791056,-94.27199278
AXN,Chandler,Alexandria,MN,USA,45.86629833,-95.39466806
AXS,Altus Municipal,Altus,OK,USA,34.69878194,-99.3381
AXV,Neil Armstrong,Wapakoneta,OH,USA,40.49338889,-84.29894444
AXX,Angel Fire,Angel Fire,NM,USA,36.42240972,-105.2892967
AYS,Waycross-Ware County,Waycross,GA,USA,31.24905556,-82.39530556
AZC,Colorado City Municipal,Colorado City,AZ,USA,36.95994444,-113.0138889
AZE,Hazelhurst,Hazelhurst,GA,USA,31.88465639,-82.64738778
AZO,Kalamazoo County,Kalamazoo,MI,USA,42.234875,-85.5520575
B01,Granville,Granville,NY,USA,43.42507111,-73.26205306
B08,Silver Springs,Silver Springs,NV,USA,39.40324917,-119.2518292
B16,Whitford,Weedsport,NY,USA,43.08027611,-76.53837556
B19,Biddeford Municipal,Biddeford,ME,USA,43.46411111,-70.47238889
B21,Sugarloaf Regional,Carrabasset,ME,USA,45.08616639,-70.21617778
BAF,Barnes Municipal,Westfield,MA,USA,42.15773111,-72.71562028
BAK,Columbus Municipal,Columbus,IN,USA,39.26191861,-85.89634556
BAM,Battle Mountain,Battle Mountain,NV,USA,40.59904583,-116.8743358
BAX,Huron County Memorial,Bad Axe,MI,USA,43.78091667,-82.98566667
BAZ,New Braunfels Municipal,New Braunfels,TX,USA,29.7045,-98.04222222
BBB,Benson Municipal,Benson,MN,USA,45.3319325,-95.650565
BBD,Curtis,Brady,TX,USA,31.17816667,-99.32463889
BBP,Marlboro County,Bennettsville,SC,USA,34.62170861,-79.73435944
BBW,Broken Bow Municipal,Broken Bow,NE,USA,41.43645056,-99.64216861
BCB,Virginia Tech,Blacksburg,VA,USA,37.20782361,-80.40832778
BCE,Bryce Canyon,Bryce Canyon,UT,USA,37.70637111,-112.1454725
BCK,Black River Falls Area,Black River Falls,WI,USA,44.25073861,-90.85528028
BCT,Boca Raton,Boca Raton,FL,USA,26.37848667,-80.10769667
BCV,Birchwood,Birchwood,AK,USA,61.41612444,-149.50888
BDE,Baudette International,Baudette,MN,USA,48.72741667,-94.61030556
BDG,Blanding Muni,Blanding,UT,USA,37.58303472,-109.4832889
BDL,Bradley International,Windsor Locks,CT,USA,41.93887417,-72.68322833
BDQ,Morrilton Municipal,Morrilton,AR,USA,35.13619528,-92.71349722
BDR,Igor I Sikorsky Memorial,Bridgeport,CT,USA,41.16348417,-73.12617861
BDX,Broadus,Broadus,MT,USA,45.433325,-105.4172133
BED,Laurence G Hanscom,Bedford,MA,USA,42.46995306,-71.28903
BEH,Southwest Michigan Regional,Benton Harbor,MI,USA,42.12858333,-86.4285
BET,Bethel,Bethel,AK,USA,60.77977639,-161.8379975
BFD,Bradford Reg,Bradford,PA,USA,41.80306778,-78.64012083
BFF,Scotts Bluff County,Scottsbluff,NE,USA,41.87402778,-103.5956389
BFI,Boeing Field/King County Intl,Seattle,WA,USA,47.52998917,-122.3019561
BFK,Buffalo Municipal,Buffalo,OK,USA,36.86330139,-99.61873056
BFL,Meadows,Bakersfield,CA,USA,35.43359806,-119.0567681
BFM,Mobile Downtown,Mobile,AL,USA,30.62646944,-88.06799861
BFR,Virgil I Grissom Municipal,Bedford,IN,USA,38.84003306,-86.44536361
BFW,Silver Bay Municipal,Silver Bay,MN,USA,47.24902778,-91.41558333
BGD,Hutchinson County,Borger,TX,USA,35.70004194,-101.3940536
BGE,Decatur County Industrial Airpark,Bainbridge,GA,USA,30.97152778,-84.63744444
BGF,Winchester Municipal,Winchester,TN,USA,35.17753417,-86.06616722
BGM,Binghamton Regional,Binghamton,NY,USA,42.20848278,-75.97961361
BGQ,Big Lake Strip Nr 2,Big Lake,AK,USA,61.53556806,-149.8138975
BGR,Bangor International,Bangor,ME,USA,44.80744444,-68.82813889
BHB,Hancock Co-Bar Harbor,Bar Harbor,ME,USA,44.44969444,-68.3615
BHC,Baxley Municipal,Baxley,GA,USA,31.71383333,-82.39377778
BHK,Baker Muni,Baker City,MT,USA,46.34763639,-104.2594475
BHM,Birmingham International,Birmingham,AL,USA,33.56294306,-86.75354972
BID,Block Island State,Block Island,RI,USA,41.16811889,-71.57784167
BIE,Beatrice Municipal,Beatrice,NE,USA,40.30127778,-96.75411111
BIG,Allen AAF,Delta Junction,AK,USA,63.99454722,-145.7216417
BIH,Bishop,Bishop,CA,USA,37.37309556,-118.3636089
BIL,Billings Logan Intl,Billings,MT,USA,45.8076625,-108.5428611
BIS,Bismarck Municipal,Bismarck,ND,USA,46.77411111,-100.7467222
BIV,Tulip City,Holland,MI,USA,42.74316667,-86.10502778
BJC,Jeffco,Denver,CO,USA,39.90878667,-105.1172158
BJI,Bemidji-Beltrami County,Bemidji,MN,USA,47.50942417,-94.93372333
BJJ,Wayne County,Wooster,OH,USA,40.87480556,-81.88825
BKD,Breckenridge Stephens County,Breckenridge,TX,USA,32.71904694,-98.89099972
BKE,Baker City Municipal,Baker City,OR,USA,44.83733333,-117.8090833
BKL,Burke Lakefront,Cleveland,OH,USA,41.5175,-81.68333333
BKV,Hernando County,Brooksville,FL,USA,28.47359722,-82.45542139
BKW,Raleigh Cty Memorial,Beckley,WV,USA,37.78732833,-81.12416417
BKX,Brookings Municipal,Brookings,SD,USA,44.30483333,-96.81694444
BLF,Mercer Cty,Bluefield,WV,USA,37.29579944,-81.20769056
BLH,Blythe,Blythe,CA,USA,33.61916278,-114.7168764
BLI,Bellingham Intl,Bellingham,WA,USA,48.79275,-122.5375278
BLM,Allaire Arpt,Belmar/Farmingdale,NJ,USA,40.18691806,-74.12488694
BLV,Scott AFB/MidAmerica,Belleville/St. Louis,IL,USA,38.54517861,-89.83518444
BMC,Brigham City,Brigham City,UT,USA,41.55239139,-112.0622625
BMG,Monroe County,Bloomington,IN,USA,39.14602139,-86.61668278
BMI,Central Illinois Regional,Bloomington,IL,USA,40.47798556,-88.91595278
BML,Berlin Municipal,Berlin,NH,USA,44.57537278,-71.17593167
BMQ,Burnet Muni-Kate Craddock,Burnet,TX,USA,30.73894444,-98.23858333
BMT,Beaumont Municipal,Beaumont,TX,USA,30.07044111,-94.21553806
BNA,Nashville International,Nashville,TN,USA,36.12447667,-86.67818222
BNF,Baranof Warm Springs SPB,Baranof Warm Springs,AK,USA,57.08882583,-134.8331414
BNG,Banning Municipal,Banning,CA,USA,33.92307111,-116.8505756
BNL,Barnwell County,Barnwell,SC,USA,33.25777778,-81.38833333
BNO,Burns Muni,Burns,OR,USA,43.59212778,-118.9549789
BNW,Boone Municipal,Boone,IA,USA,42.04956944,-93.84757222
BOI,Boise Air Terminal,Boise,ID,USA,43.56444444,-116.2227778
BOK,Brookings,Brookings,OR,USA,42.07455556,-124.2900939
BOS,Gen Edw L Logan Intl,Boston,MA,USA,42.3643475,-71.00517917
BOW,Bartow Municipal,Bartow,FL,USA,27.9433575,-81.78344167
BPI,Big Piney-Marbleton,Big Piney,WY,USA,42.58506972,-110.1111531
BPK,Baxter County Regional,Mountain Home,AR,USA,36.36894194,-92.47052806
BPT,Southeast Texas Regional,Beaumont/Port Arthur,TX,USA,29.95083333,-94.02069444
BQK,Glynco Jetport,Brunswick,GA,USA,31.25902778,-81.46630556
BQN,Rafael Hernandez,Aguadilla,PR,USA,18.49486111,-67.12944444
BRD,Brainerd-Crow Wing County Regional,Brainerd,MN,USA,46.39785806,-94.1372275
BRL,Burlington Municipal,Burlington,IA,USA,40.783225,-91.12550556
BRO,Brownsville/S.Padre Island International,Brownsville,TX,USA,25.90683333,-97.42586111
BRW,Wiley Post Will Rogers Memorial,Barrow,AK,USA,71.2854475,-156.7660019
BRY,Samuels,Bardstown,KY,USA,37.81432167,-85.49963806
BST,Belfast Municipal,Belfast,ME,USA,44.40966667,-69.01225
BTI,Barter Island,Kaktovik,AK,USA,70.13390278,-143.5770444
BTL,W K Kellogg Regional,Battle Creek,MI,USA,42.30727806,-85.25147972
BTM,Bert Mooney,Butte,MT,USA,45.95479528,-112.49746
BTN,Britton Municipal,Britton,SD,USA,45.81522222,-97.74313889
BTP,Butler Cty,Butler,PA,USA,40.77692611,-79.94972417
BTR,"Baton Rouge Metropolitan, Ryan",Baton Rouge,LA,USA,30.53316083,-91.14963444
BTT,Bettles,Bettles,AK,USA,66.91528667,-151.5280556
BTV,Burlington International,Burlington,VT,USA,44.47300361,-73.1503125
BTY,Beatty,Beatty,NV,USA,36.86105722,-116.7870036
BUB,Cram,Burwell,NE,USA,41.77669444,-99.14975
BUF,Buffalo Niagara Intl,Buffalo,NY,USA,42.94052472,-78.73216667
BUM,Butler Memorial,Butler,MO,USA,38.28977028,-94.34012694
BUR,Burbank-Glendale-Pasadena,Burbank,CA,USA,34.20061917,-118.3584969
BUY,Burlington Municipal,Burlington,NC,USA,36.04854333,-79.47488694
BVI,Beaver County,Beaver Falls,PA,USA,40.77248083,-80.39142556
BVK,Buckland,Buckland,AK,USA,65.98228611,-161.1519778
BVN,Albion Municipal,Albion,NE,USA,41.72857778,-98.05575972
BVO,Bartlesville Municipal,Bartlesville,OK,USA,36.76247611,-96.01115167
BVS,Skagit Regional/Bay View,Burlington/Mount Vernon,WA,USA,48.47088889,-122.4208611
BVX,Batesville Regional,Batesville,AR,USA,35.726105,-91.64736083
BVY,Beverly Municipal,Beverly,MA,USA,42.58417111,-70.91651833
BWC,Brawley Municipal,Brawley,CA,USA,32.9931,-115.5169325
BWD,Brownwood Municipal,Brownwood,TX,USA,31.79362222,-98.95649528
BWG,Bowling Green-Warren County,Bowling Green,KY,USA,36.96451667,-86.41967917
BWI,Baltimore-Washington International,Baltimore,MD,USA,39.17540167,-76.66819833
BWP,Harry Stern,Wahpeton,ND,USA,46.24640083,-96.6056825
BXA,George R Carr Memorial,Bogalusa,LA,USA,30.81368639,-89.86496444
BXG,Burke County,Waynesboro,GA,USA,33.04093056,-82.00397917
BXK,Buckeye Municipal,Buckeye,AZ,USA,33.42088556,-112.6863
BYA,Boundary,Boundary,AK,USA,64.07830278,-141.113375
BYG,Johnson County,Buffalo,WY,USA,44.38108528,-106.7217897
BYI,Burley Municipal,Burley,ID,USA,42.54260361,-113.7715442
BZN,Gallatin,Bozeman,MT,USA,45.77690139,-111.1530072
C00,Mercer County,Aledo,IL,USA,41.248645,-90.73708361
C05,Chenega Bay,Chenega,AK,USA,60.07730556,-147.9918889
C09,Morris Municipal,Morris,IL,USA,41.42541667,-88.41869444
C15,Pekin Municipal,Pekin,IL,USA,40.48820611,-89.67591083
C17,Marion,Marion,IA,USA,42.03111083,-91.52934222
C18,Frankfort,Chicago/Frankfort,IL,USA,41.4775,-87.84047222
C25,Waverly Municipal,Waverly,IA,USA,42.7419525,-92.50793528
C29,Morey,Middleton,WI,USA,43.11424444,-89.53073222
C34,Gibson City Municipal,Gibson City,IL,USA,40.48578389,-88.2672725
C35,Reedsburg Municipal,Reedsburg,WI,USA,43.52589944,-89.98322194
C47,Portage Municipal,Portage,WI,USA,43.5600925,-89.48309278
C52,Burlington Municipal,Burlington,WI,USA,42.69056389,-88.30464
C56,Sanger,Chicago/Monee,IL,USA,41.37756167,-87.68137528
C62,Kendallville Municipal,Kendallville,IN,USA,41.47271639,-85.26080833
C65,Plymouth Municipal,Plymouth,IN,USA,41.36513333,-86.30050417
C66,Monmouth Municipal,Monmouth,IL,USA,40.92970444,-90.63110722
C71,Crosby Municipal,Crosby,MS,USA,31.29600472,-91.05288167
C73,Dixon Muni-Charles R Walgreen,Dixon,IL,USA,41.83369889,-89.44621333
C75,Marshall County,Lacon,IL,USA,41.01928583,-89.38642222
C77,Poplar Grove,Poplar Grove,IL,USA,42.32268639,-88.83651833
C80,New Coalinga Municipal,Coalinga,CA,USA,36.16313889,-120.2938139
C81,Campbell,Chicago/Round Lake Park,IL,USA,42.32461111,-88.07408806
C83,Byron,Byron,CA,USA,37.8284525,-121.6258219
C91,Dowagiac Municipal,Dowagiac,MI,USA,41.99293417,-86.1280125
CAD,Wexford County,Cadillac,MI,USA,44.27531333,-85.41892694
CAE,Columbia Metropolitan,Columbia,SC,USA,33.93884,-81.11953944
CAG,Craig-Moffat,Craig,CO,USA,40.49522139,-107.5216467
CAK,Akron-Canton Regional,Akron,OH,USA,40.91631194,-81.44246556
CAO,Clayton Municipal Airpark,Clayton,NM,USA,36.44585972,-103.1546583
CAR,Caribou Municipal,Caribou,ME,USA,46.8715,-68.01791667
CAV,Clarion Municipal,Clarion,IA,USA,42.74194389,-93.75890944
CBE,Cumberland Regional,Cumberland,MD,USA,39.61541667,-78.76086361
CBF,Council Bluffs Municipal,Council Bluffs,IA,USA,41.25947222,-95.75997222
CBG,Cambridge Municipal,Cambridge,MN,USA,45.55854639,-93.26464361
CBK,Shaltz,Colby,KS,USA,39.42753083,-101.0465719
CCB,Cable,Upland,CA,USA,34.11154056,-117.6875897
CCO,Newnan-Coweta County,Newnan,GA,USA,33.31208333,-84.77027778
CCR,Buchanan,Concord,CA,USA,37.98965639,-122.0568972
CCY,Charles City Municipal,Charles City,IA,USA,43.07260861,-92.61077833
CDB,Cold Bay,Cold Bay,AK,USA,55.20559972,-162.7242628
CDC,Cedar City Muni,Cedar City,UT,USA,37.70097028,-113.098575
CDH,Harrell,Camden,AR,USA,33.62279917,-92.76339528
CDI,Cambridge Municipal,Cambridge,OH,USA,39.97504417,-81.57759528
CDK,George T Lewis,Cedar Key,FL,USA,29.137745,-83.04984361
CDN,Woodward,Camden,SC,USA,34.28358333,-80.56486111
CDR,Chadron Municipal,Chadron,NE,USA,42.83755556,-103.0954167
CDV,Merle K (Mudhole) Smith,Cordova,AK,USA,60.49183389,-145.4776503
CDW,Essex Cty Arpt,Caldwell,NJ,USA,40.87522278,-74.28135667
CEC,Jack McNamara,Crescent City,CA,USA,41.78015722,-124.2365333
CEF,Westover AFB,Chicopee,MA,USA,42.19826389,-72.53425833
CEK,Crete Municipal,Crete,NE,USA,40.61791667,-96.92488889
CEM,Central,Central,AK,USA,65.57380667,-144.7832908
CEU,Oconee County Regional,Clemson,SC,USA,34.67205556,-82.88644444
CEV,Mettel,Connersville,IN,USA,39.69803139,-85.13124528
CEW,Bob Sikes,Crestview,FL,USA,30.77883333,-86.52211111
CEY,Kyle-Oakley,Murray,KY,USA,36.66458333,-88.37277722
CEZ,Cortez Muni,Cortez,CO,USA,37.30299778,-108.6280658
CFD,Coulter,Bryan,TX,USA,30.71569444,-96.33136111
CFJ,Crawfordsville Municipal,Crawfordsville,IN,USA,39.97562861,-86.91986361
CFK,Chefornak,Chefornak,AK,USA,60.14922556,-164.2856325
CFT,Greenlee County,Clifton-Morenci,AZ,USA,32.95284306,-109.2103453
CFV,Coffeyville Municipal,Coffeyville,KS,USA,37.0940475,-95.57189417
CGA,Craig SPB,Craig,AK,USA,55.47883139,-133.1478011
CGC,Crystal River,Crystal River,FL,USA,28.86727778,-82.57130556
CGE,Cambridge-Dorchester,Cambridge,MD,USA,38.53930556,-76.03036111
CGF,Cuyahoga County,Cleveland,OH,USA,41.56512389,-81.48635389
CGI,Cape Girardeau Municipal,Cape Girardeau,MO,USA,37.22531694,-89.57075167
CGS,College Park,College Park,MD,USA,38.98058333,-76.92230556
CGX,Chicago Meigs,Chicago,IL,USA,41.85884389,-87.60791167
CGZ,Casa Grande Municipal,Casa Grande,AZ,USA,32.95488889,-111.7668333
CHA,Lovell,Chattanooga,TN,USA,35.03526833,-85.20378778
CHD,Chandler Municipal,Chandler,AZ,USA,33.26908333,-111.8111389
CHK,Chickasha Municipal,Chickasha,OK,USA,35.09614694,-97.96618361
CHO,Charlottesville-Albermarle,Charlottesville,VA,USA,38.13863889,-78.45286111
CHP,Circle Hot Springs,Circle Hot Springs,AK,USA,65.48547222,-144.6107836
CHS,Charleston AFB/International,Charleston,SC,USA,32.89864639,-80.04050583
CHT,Chillicothe Municipal,Chillicothe,MO,USA,39.78215278,-93.49568056
CHU,Houston County,Caledonia,MN,USA,43.59635861,-91.50394639
CIC,Chico Municipal,Chico,CA,USA,39.79538278,-121.8584231
CID,Eastern Iowa,Cedar Rapids,IA,USA,41.88458833,-91.71087222
CII,Choteau,Choteau,MT,USA,47.82528056,-112.1662136
CIK,Chalkyitsik,Chalkyitsik,AK,USA,66.64969083,-143.7359492
CIN,Arthur N Neu,Carroll,IA,USA,42.04619444,-94.789
CIR,Cairo,Cairo,IL,USA,37.06447222,-89.21961111
CIU,Chippewa County International,Sault Ste. Marie,MI,USA,46.25075194,-84.47238528
CJR,Culpeper Regional,Culpeper,VA,USA,38.5267075,-77.85885528
CJX,Crooked Creek,Crooked Creek,AK,USA,61.86902194,-158.1371178
CKB,Benedum,Clarksburg,WV,USA,39.29663889,-80.22808333
CKC,Grand Marais/Cook County,Grand Marais,MN,USA,47.83830556,-90.38313889
CKF,Crisp County - Cordele,Cordele,GA,USA,31.98883333,-83.77391667
CKI,Williamsburg County,Kingstree,SC,USA,33.71722222,-79.85697222
CKM,Fletcher,Clarksdale,MS,USA,34.29971,-90.51231611
CKN,Crookston Muni Kirkwood,Crookston,MN,USA,47.84169417,-96.62162028
CKP,Cherokee Municipal,Cherokee,IA,USA,42.73147222,-95.55613889
CKU,Cordova Muni,Cordova,AK,USA,60.54390333,-145.7267042
CKV,Outlaw,Clarksville,TN,USA,36.62188083,-87.41495361
CKX,Chicken,Chicken,AK,USA,64.07133833,-141.9522792
CLD,MC Clellan-Palomar Airport,NA,NA,USA,33.127231,-117.278727
CLE,Cleveland-Hopkins Intl,Cleveland,OH,USA,41.41089417,-81.84939667
CLI,Clintonville Municipal,Clintonville,WI,USA,44.61381306,-88.73126667
CLK,Clinton Municipal,Clinton,OK,USA,35.53832778,-98.932695
CLL,Easterwood,College Station,TX,USA,30.58858944,-96.36382417
CLM,William R Fairchild Intl,Port Angeles,WA,USA,48.12019444,-123.4996944
CLP,Clarks Point,Clarks Point,AK,USA,58.84230472,-158.5452331
CLS,Chehalis-Centralia,Chehalis,WA,USA,46.67649194,-122.9792967
CLT,Charlotte/Douglas International,Charlotte,NC,USA,35.21401111,-80.94312583
CLW,Clearwater Air Park,Clearwater,FL,USA,27.97668639,-82.75874028
CMA,Camarillo,Camarillo,CA,USA,34.21375472,-119.0943264
CMH,Port Columbus Intl,Columbus,OH,USA,39.99798528,-82.89188278
CMI,University of Illinois-Willard,Champaign/Urbana,IL,USA,40.03925,-88.27805556
CMX,Houghton County Memorial,Hancock,MI,USA,47.16841722,-88.48906083
CMY,Sparta/Fort McCoy,Sparta,WI,USA,43.95834806,-90.7378975
CNC,Chariton Municipal,Chariton,IA,USA,41.01962389,-93.35968028
CNH,Claremont Municipal,Claremont,NH,USA,43.37043194,-72.36867667
CNK,Blosser Municipal,Concordia,KS,USA,39.54925139,-97.65231667
CNM,Cavern City Air Terminal,Carlsbad,NM,USA,32.33747222,-104.2632778
CNO,Chino,Chino,CA,USA,33.97469444,-117.6366111
CNP,Billy G Ray,Chappell,NE,USA,41.07747222,-102.4640556
CNU,Chanute Martin Johnson,Chanute,KS,USA,37.66879722,-95.48506444
CNW,TSTC-Waco,Waco,TX,USA,31.63783139,-97.07413889
CNY,Canyonlands,Moab,UT,USA,38.75495611,-109.7548439
COD,Yellowstone Regional,Cody,WY,USA,44.52019417,-109.0237961
COE,Coeur D'Alene Air Terminal,Coeur D'Alene,ID,USA,47.77429167,-116.8196231
COI,Merritt Island,Merritt Island,FL,USA,28.34158944,-80.6854975
COM,Coleman Municipal,Coleman,TX,USA,31.84113889,-99.40361111
CON,Concord Municipal,Concord,NH,USA,43.20273278,-71.50228556
COQ,Cloquet-Carlton County,Cloquet,MN,USA,46.70016833,-92.50552861
COS,City of Colorado Springs Muni,Colorado Springs,CO,USA,38.80580556,-104.70025
COT,Cotulla-Lasalle County,Cotulla,TX,USA,28.45825583,-99.22016389
COU,Columbia Regional,Columbia,MO,USA,38.81809306,-92.21962917
CPC,Columbus County Municipal,Whiteville,NC,USA,34.27287278,-78.71499278
CPK,Chesapeake Municipal,Norfolk,VA,USA,36.66561833,-76.32066389
CPM,Compton/Woodley,Compton,CA,USA,33.89001611,-118.2436831
CPR,Natrona County Intl,Casper,WY,USA,42.90835556,-106.4644661
CPS,St. Louis Downtown,Cahokia/St. Louis,IL,USA,38.57072444,-90.15622111
CPX,Benjamin Rivera Noriega,Isla De Culebra,PR,USA,18.31328917,-65.30432444
CQA,Lakefield,Celina,OH,USA,40.48408333,-84.56011111
CQB,Chandler Municipal,Chandler,OK,USA,35.72381556,-96.82027306
CQX,Chatham Municipal,Chatham,MA,USA,41.68840028,-69.98952417
CRC,Circle City,Circle,AK,USA,65.83049389,-144.0758128
CRE,Grand Strand,North Myrtle Beach,SC,USA,33.81175,-78.72394444
CRG,Craig Municipal,Jacksonville,FL,USA,30.33633333,-81.51444444
CRO,Corcoran,Corcoran,CA,USA,36.10245111,-119.5948469
CRP,Corpus Christi International,Corpus Christi,TX,USA,27.77036083,-97.50121528
CRQ,McClellan-Palomar,Carlsbad,CA,USA,33.12822222,-117.2802222
CRS,C Davis Campbell -Corsicana Muni,Corsicana,TX,USA,32.02748861,-96.39803611
CRT,Crossett Municipal,Crossett,AR,USA,33.17833278,-91.88018806
CRW,Yeager,Charleston,WV,USA,38.37315083,-81.59318972
CRX,Roscoe Turner,Corinth,MS,USA,34.91496778,-88.60348361
CSB,Cambridge Municipal,Cambridge,NE,USA,40.30658333,-100.1620833
CSG,Columbus Metropolitan,Columbus,GA,USA,32.51633333,-84.93886111
CSM,Clinton-Sherman,Clinton,OK,USA,35.33983917,-99.20049944
CSQ,Creston Municipal,Creston,IA,USA,41.02146139,-94.36331917
CSV,Crossville Memorial,Crossville,TN,USA,35.95129194,-85.08497806
CTB,Cut Bank Muni,Cut Bank,MT,USA,48.60835444,-112.3761464
CTJ,West Georgia Regional,Carrollton,GA,USA,33.63102778,-85.15202778
CTK,Ingersoll,Canton,IL,USA,40.56909444,-90.07484
CTY,Cross City,Cross City,FL,USA,29.63552778,-83.10475
CTZ,Sampson County,Clinton,NC,USA,34.97561194,-78.36461528
CUB,Columbia Owens Downtown,Columbia,SC,USA,33.97047222,-80.99525
CUH,Cushing Municipal,Cushing,OK,USA,35.949925,-96.77305278
CUL,Carmi Municipal,Carmi,IL,USA,38.08947917,-88.12306111
CUT,Custer County,Custer,SD,USA,43.73331611,-103.6176947
CVG,Cincinnati Northern Kentucky Intl,Covington,KY,USA,39.04614278,-84.6621725
CVK,Sharp County Regional,Ash Flat,AR,USA,36.26487139,-91.56264111
CVN,Clovis Municipal,Clovis,NM,USA,34.42513889,-103.0792778
CVO,Corvallis Muni,Corvallis,OR,USA,44.49719361,-123.2898297
CVX,Charlevoix Municipal,Charlevoix,MI,USA,45.30477778,-85.27477778
CWA,Central Wisconsin,Mosinee,WI,USA,44.77761917,-89.66677944
CWF,Chennault International,Lake Charles,LA,USA,30.21059167,-93.14318944
CWI,Clinton Municipal,Clinton,IA,USA,41.8311125,-90.32913056
CWV,Claxton-Evans County,Claxton,GA,USA,32.19505556,-81.86955556
CXC,Chitina,Chitina,AK,USA,61.58285917,-144.4270969
CXE,Chase City Municipal,Chase City,VA,USA,36.78833556,-78.50155361
CXF,Coldfoot,Coldfoot,AK,USA,67.25163417,-150.2065672
CXL,Calexico International,Calexico,CA,USA,32.66950333,-115.5133281
CXO,Montgomery County,Conroe,TX,USA,30.35183333,-95.4144675
CXP,Carson,Carson City,NV,USA,39.19222972,-119.7343611
CXU,Camilla-Mitchell County,Camilla,GA,USA,31.21291667,-84.23680556
CXY,Capital City,Harrisburg,PA,USA,40.21713889,-76.85147222
CYO,Pickaway County Memorial,Circleville,OH,USA,39.51600611,-82.98215361
CYS,Cheyenne,Cheyenne,WY,USA,41.1557225,-104.8118381
CYW,Clay Center Municipal,Clay Center,KS,USA,39.38713889,-97.15721417
CZD,Cozad Municipal,Cozad,NE,USA,40.86911111,-100.0042222
CZG,Tri-Cities,Endicott,NY,USA,42.07853583,-76.09633306
CZL,Tom B David,Calhoun,GA,USA,34.45678278,-84.93949944
CZN,Chisana,Chisana,AK,USA,62.07118972,-142.0483742
CZT,Dimmit County,Carrizo Springs,TX,USA,28.52225111,-99.82363444
D04,Bowman Municipal,Bowman,ND,USA,46.18699111,-103.4280806
D05,Garrison Municipal,Garrison,ND,USA,47.65594444,-101.4372222
D07,Faith Municipal,Faith,SD,USA,45.03609417,-102.0198803
D09,Bottineau Municipal,Bottineau,ND,USA,48.83039167,-100.4171361
D19,Quentin Aanenson,Luverne,MN,USA,43.62080278,-96.21864028
D22,Angola,Angola,NY,USA,42.66010111,-78.99115556
D25,Manitowish Waters,Manitowish Waters,WI,USA,46.12197222,-89.88233333
D38,Canandaiga,Canandaiga,NY,USA,42.90718611,-77.32162639
D42,Springfield Municipal,Springfield,MN,USA,44.23107,-94.99893444
D50,Crosby Municipal,Crosby,ND,USA,48.92851556,-103.2972514
D55,Robertson,Langdon,ND,USA,48.75301778,-98.39333694
D57,Glen Ullin Municipal,Glen Ullin,ND,USA,46.81278306,-101.8601556
D60,Tioga Municipal,Tioga,ND,USA,48.3805325,-102.8979853
D73,Monroe-Walton County,Monroe,GA,USA,33.78149889,-83.69355389
D77,Lancaster,Lancaster,NY,USA,42.92228111,-78.61224889
D87,Harbor Springs,Harbor Springs,MI,USA,45.42556528,-84.91338389
D95,Dupont-Lapeer,Lapeer,MI,USA,43.06703333,-83.27244444
D98,Romeo,Romeo,MI,USA,42.79699083,-82.97526583
DAB,Daytona Beach International,Daytona Beach,FL,USA,29.17991667,-81.05805556
DAG,Barstow-Daggett,Daggett,CA,USA,34.85371333,-116.7866875
DAL,Dallas Love,Dallas,TX,USA,32.84711389,-96.85177222
DAN,Danville Regional,Danville,VA,USA,36.57286111,-79.33611111
DAW,Skyhaven,Rochester,NH,USA,43.28406194,-70.92925472
DAY,James M Cox Dayton Intl,Dayton,OH,USA,39.90237583,-84.219375
DBN,"W. H. ""Bud"" Barron",Dublin,GA,USA,32.56445806,-82.98525556
DBQ,Dubuque Municipal,Dubuque,IA,USA,42.40295944,-90.70916722
DCA,Ronald Reagan Washington National,Arlington,VA,USA,38.85208333,-77.03772222
DCK,Dahl Creek,Dahl Creek,AK,USA,66.94333806,-156.9046739
DCU,Pryor  Regional,Decatur,AL,USA,34.65264667,-86.94536778
DCY,Daviess County,Washington,IN,USA,38.70042333,-87.12973222
DDC,Dodge City Regional,Dodge City,KS,USA,37.76312194,-99.96542389
DDH,William H. Morse State,Bennington,VT,USA,42.8913325,-73.2464075
DEC,Decatur,Decatur,IL,USA,39.8345625,-88.86568917
DED,Deland Municipal-Taylor,Deland,FL,USA,29.06698056,-81.28394167
DEE,Deering,Deering,AK,USA,66.06820583,-162.7666028
DEH,Decorah Municipal,Decorah,IA,USA,43.27550139,-91.73937389
DEN,Denver Intl,Denver,CO,USA,39.85840806,-104.6670019
DEQ,J Lynn Helms Sevier County,De Queen,AR,USA,34.04699556,-94.39936556
DET,Detroit City,Detroit,MI,USA,42.40919444,-83.00986111
DEW,Deer Park,Deer Park,WA,USA,47.96663889,-117.4266667
DFI,Defiance Memorial,Defiance,OH,USA,41.3375,-84.42880556
DFW,Dallas-Fort Worth International,Dallas-Fort Worth,TX,USA,32.89595056,-97.0372
DGW,Converse County,Douglas,WY,USA,42.79725,-105.3857361
DHN,Dothan,Dothan,AL,USA,31.32133917,-85.44962889
DHT,Dalhart Municipal,Dalhart,TX,USA,36.022585,-102.5472775
DIK,Dickinson Municipal,Dickinson,ND,USA,46.79738889,-102.8019528
DKB,Dekalb-Taylor Municipal,Dekalb,IL,USA,41.93188111,-88.70829861
DKK,Dunkirk Municipal,Dunkirk,NY,USA,42.49333528,-79.27204167
DKX,Knoxville Downtown Island,Knoxville,TN,USA,35.96383361,-83.87365389
DLG,Dillingham,Dillingham,AK,USA,59.0454125,-158.5033389
DLH,Duluth International,Duluth,MN,USA,46.84209028,-92.19364861
DLL,Baraboo - Wisconsin Dells,Baraboo,WI,USA,43.52195389,-89.77090222
DLN,Dillon,Dillon,MT,USA,45.25536056,-112.5525067
DLO,Delano Municipal,Delano,CA,USA,35.74558056,-119.2365039
DLS,Columbia Gorge Regional,The Dalles,OR,USA,45.61854556,-121.1673439
DLZ,Delaware Municipal,Delaware,OH,USA,40.27970139,-83.11480167
DM2,Diomede Heliport,Diomede,AK,USA,65.75861111,-168.9530556
DMN,Deming Municipal,Deming,NM,USA,32.26230917,-107.7206397
DMO,Sedalia Memorial,Sedalia,MO,USA,38.70688889,-93.17611111
DMW,Carroll County,Westminster,MD,USA,39.60827778,-77.00766667
DNL,Daniel,Augusta,GA,USA,33.46663667,-82.03933917
DNN,Dalton Municipal,Dalton,GA,USA,34.72174833,-84.86910806
DNS,Denison Municipal,Denison,IA,USA,41.9864325,-95.38072083
DNV,Vermilion County,Danville,IL,USA,40.19946861,-87.59553528
DOV,Dover Air Force Base,Dover,DE,USA,39.1301125,-75.46631028
DPA,Du Page,Chicago/West Chicago,IL,USA,41.90688333,-88.24841722
DPL,P B Raiford,Kenansville,NC,USA,35.00006444,-77.981695
DQH,Douglas Municipal,Douglas,GA,USA,31.47780833,-82.85961556
DRI,Beauregard Parish,De Ridder,LA,USA,30.83152778,-93.33963889
DRO,Durango-La Plata County,Durango,CO,USA,37.15151667,-107.7537692
DRT,Del Rio International,Del Rio,TX,USA,29.37181222,-100.9232339
DSM,Des Moines International,Des Moines,IA,USA,41.53493306,-93.66068222
DSV,Dansville Muni,Dansville,NY,USA,42.57089972,-77.71305083
DTA,Delta Municipal,Delta,UT,USA,39.38328861,-112.5096683
DTL,Detroit Lakes -Wething,Detroit Lakes,MN,USA,46.82520861,-95.8856875
DTN,Shreveport Downtown,Shreveport,LA,USA,32.54021889,-93.7450225
DTO,Denton Municipal,Denton,TX,USA,33.20072167,-97.19797722
DTS,Destin-Ft. Walton Beach,Destin,FL,USA,30.40006111,-86.47147722
DTW,Detroit Metropolitan-Wayne County,Detroit,MI,USA,42.21205889,-83.34883583
DUA,Eaker,Durant,OK,USA,33.942265,-96.39451806
DUC,Halliburton,Duncan,OK,USA,34.470875,-97.95986111
DUG,Bisbee Douglas International,Douglas Bisbee,AZ,USA,31.46902778,-109.6036667
DUJ,Du Bois-Jefferson Cty,Du Bois,PA,USA,41.17826611,-78.89869778
DUT,Unalaska,Unalaska,AK,USA,53.90013889,-166.5435
DUX,Moore County,Dumas,TX,USA,35.85792833,-102.0130978
DUY,Kongiganak,Kongiganak,AK,USA,59.95950583,-162.8817231
DVK,Stuart Powell,Danville,KY,USA,37.57791667,-84.76969444
DVL,Devils Lake Municipal-Knoke,Devils Lake,ND,USA,48.11424528,-98.90877833
DVN,Davenport Municipal,Davenport,IA,USA,41.6102775,-90.58832528
DVO,Gnoss,Novato,CA,USA,38.14351944,-122.5572167
DVT,Phoenix-Deer Valley,Phoenix,AZ,USA,33.68831667,-112.0825614
DWH,David Wayne Hooks Memorial,Houston,TX,USA,30.06186111,-95.55277778
DWU,Ashland-Boyd County,Ashland,KY,USA,38.5545,-82.738
DXE,Dexter Municipal,Dexter,MO,USA,36.77747,-89.94117333
DXR,Danbury Municipal,Danbury,CT,USA,41.37153528,-73.48219056
DXX,Madison-Lac Qui Parle County,Madison,MN,USA,44.98624,-96.17773611
DYB,Summerville,Summerville,SC,USA,33.06344444,-80.27933333
DYL,Doylestown,Doylestown,PA,USA,40.33305028,-75.12233833
DYR,Dyersburg Municipal,Dyersburg,TN,USA,35.99850694,-89.40608333
DYT,Sky Harbor,Duluth,MN,USA,46.72186083,-92.04343889
E01,Monahans-Roy Hurd Memorial,Monahans,TX,USA,31.58246583,-102.9090428
E04,Eunice,Eunice,NM,USA,32.45679139,-103.2404708
E05,Hatch Muni,Hatch,NM,USA,32.66106083,-107.1979339
E06,Lea County-Zip Franklin Memorial,Lovington,NM,USA,32.95394444,-103.4087778
E07,Lea County/Tatum,Tatum,NM,USA,33.26122278,-103.2768939
E11,Andrews County,Andrews,TX,USA,32.33111111,-102.5295278
E15,Graham Municipal,Graham,TX,USA,33.11022222,-98.55527861
E19,Gruver Municipal,Gruver,TX,USA,36.23372611,-101.4321894
E24,Whiteriver,Whiteriver,AZ,USA,33.81255056,-109.9867658
E25,Wickenburg Municipal,Wickenburg,AZ,USA,33.96891833,-112.7985128
E26,Lea County,Jal,NM,USA,32.13107833,-103.1548506
E35,Fabens,Fabens,TX,USA,31.51567306,-106.1471978
E38,Alpine-Casparis Municipal,Alpine,TX,USA,30.38422222,-103.6835833
E42,Spearman Municipal,Spearman,TX,USA,36.221,-101.1945
E51,Bagdad,Bagdad,AZ,USA,34.59585278,-113.170195
E52,Oldham County,Vega,TX,USA,35.23199833,-102.3990931
E60,Eloy Municipal,Eloy,AZ,USA,32.80700583,-111.58679
E63,Gila Bend Municipal,Gila Bend,AZ,USA,32.95810083,-112.6782181
E80,Alexander Municipal,Belen,NM,USA,34.64519778,-106.8336958
E89,Conchas State Park,Conchas Dam,NM,USA,35.36671583,-104.1880314
E91,Chinle Municipal,Chinle,AZ,USA,36.11088056,-109.5754222
E94,Glenwood-Catron County,Glenwood,NM,USA,33.35283972,-108.8672858
E95,Benson Municipal,Benson,AZ,USA,31.99972222,-110.3572222
EAA,Eagle,Eagle,AK,USA,64.77639306,-141.1509206
EAN,Phifer Airfield,Wheatland,WY,USA,42.05552528,-104.9327492
EAR,Kearney Municipal,Kearney,NE,USA,40.72702778,-99.00677778
EAT,Pangborn Memorial,Wenatchee,WA,USA,47.39886111,-120.2068333
EAU,Chippewa Valley Regional,Eau Claire,WI,USA,44.86525722,-91.48507194
EBS,Webster City Municipal,Webster City,IA,USA,42.43663889,-93.86886111
ECG,Elizabeth City CG Air Station/Municipal,Elizabeth City,NC,USA,36.26057417,-76.17459778
ECS,Mondell,Newcastle,WY,USA,43.88545056,-104.3179178
EDE,Edenton Municipal,Edenton,NC,USA,36.027735,-76.56709333
EDN,Enterprise Municipal,Enterprise,AL,USA,31.29972222,-85.89986111
EED,Needles,Needles,CA,USA,34.76619444,-114.6232931
EEK,Eek,Eek,AK,USA,60.21590417,-162.0056092
EEN,Dillant-Hopkins,Keene,NH,USA,42.89839944,-72.27078111
EEO,Meeker,Meeker,CO,USA,40.04886222,-107.8859067
EET,Shelby County,Alabaster,AL,USA,33.17781083,-86.78323722
EFC,Belle Fourche Municipal,Belle Fourche,SD,USA,44.7342075,-103.8619925
EFD,Ellington,Houston,TX,USA,29.60733333,-95.15875
EFK,Newport State,Newport,VT,USA,44.88879722,-72.22915833
EFT,Monroe Municipal,Monroe,WI,USA,42.61493972,-89.59075583
EFW,Jefferson Municipal,Jefferson,IA,USA,42.01016667,-94.34258333
EGE,Eagle County Regional,Eagle,CO,USA,39.64256778,-106.9176953
EGQ,Emmetsburg Municipal,Emmetsburg,IA,USA,43.10202056,-94.704675
EGT,Wellington Municipal,Wellington,KS,USA,37.32441028,-97.38732333
EGV,Eagle River Union,Eagle River,WI,USA,45.93179639,-89.26906778
EHA,Elkhart-Morton County,Elkhart,KS,USA,37.00188194,-101.8821258
EHO,Shelby Municipal,Shelby,NC,USA,35.25555556,-81.60099722
EHR,Henderson City-County,Henderson,KY,USA,37.8078425,-87.68569
EII,Egegik,Egegik,AK,USA,58.18837472,-157.3809872
EIW,County Memorial,New Madrid,MO,USA,36.53531083,-89.59971722
EKA,Murray,Eureka,CA,USA,40.80338889,-124.1127917
EKM,Elkhart Municipal,Elkhart,IN,USA,41.71935833,-86.00168361
EKN,Elkins-Randolph Co-Jennings Randolph,Elkins,WV,USA,38.88944444,-79.85713889
EKO,Elko Regional,Elko,NV,USA,40.82492611,-115.7916964
EKQ,Wayne County,Monticello,KY,USA,36.85527778,-84.85613889
EKX,Elizabethtown,Elizabethtown,KY,USA,37.68694444,-85.92377778
EKY,Bessemer Municipal,Bessemer,AL,USA,33.31288444,-86.92591889
ELA,Eagle Lake Municipal,Eagle Lake,TX,USA,29.60301389,-96.32248444
ELD,South Arkansas Regional At Goodwin,El Dorado,AR,USA,33.2208625,-92.81325167
ELI,Elim,Elim,AK,USA,64.61400972,-162.2700681
ELK,Elk City Municipal,Elk City,OK,USA,35.42941083,-99.39425917
ELM,Elmira/Corning Regional,Elmira,NY,USA,42.15991361,-76.89144333
ELN,Bowers,Ellensburg,WA,USA,47.03302778,-120.5306944
ELO,Ely Municipal,Ely,MN,USA,47.82454639,-91.83073056
ELP,El Paso International,El Paso,TX,USA,31.80666667,-106.3778056
ELV,Elfin Cove SPB,Elfin Cove,AK,USA,58.19518417,-136.3473928
ELY,Ely Arpt (Yelland),Ely,NV,USA,39.29969444,-114.8418889
ELZ,Wellsville Muni Tarantine,Wellsville,NY,USA,42.10951194,-77.99194806
EMM,Kemmerer Municipal,Kemmerer,WY,USA,41.82494611,-110.5590586
EMP,Emporia Municipal,Emporia,KS,USA,38.33211111,-96.19116667
EMT,El Monte,El Monte,CA,USA,34.08600889,-118.0348453
EMV,Emporia-Greensville Regional,Emporia,VA,USA,36.68691667,-77.48280556
ENA,Kenai Municipal,Kenai,AK,USA,60.572,-151.2475278
ENL,Centralia Municipal,Centralia,IL,USA,38.51479889,-89.09217944
ENM,Emmonak,Emmonak,AK,USA,62.78518639,-164.4910461
ENN,Nenana Municipal,Nenana,AK,USA,64.54898167,-149.0735053
ENV,Wendover,Wendover,UT,USA,40.71869528,-114.03089
ENW,Kenosha Regional,Kenosha,WI,USA,42.5957075,-87.92780333
EOK,Keokuk Municipal,Keokuk,IA,USA,40.45990778,-91.42850111
EOS,Neosho Memorial,Neosho,MO,USA,36.81080556,-94.39169444
EPH,Ephrata Muni,Ephrata,WA,USA,47.30758333,-119.5158889
EPM,Eastport Municipal,Eastport,ME,USA,44.91011111,-67.01269444
EQA,Captain Jack Thomas,El Dorado,KS,USA,37.77410833,-96.81762778
EQY,Monroe,Monroe,NC,USA,35.01884306,-80.62023444
ERI,Erie Intl,Erie,PA,USA,42.08202139,-80.17621556
ERV,Kerrville Muni/Louis Schreiner,Kerrville,TX,USA,29.976735,-99.08567972
ERY,Luce County Hale,Newberry,MI,USA,46.31118694,-85.45731639
ESC,Delta County,Escanaba,MI,USA,45.72266972,-87.09373139
ESF,Esler Regional,Alexandria,LA,USA,31.3949025,-92.29577194
ESN,Easton /Newnam,Easton,MD,USA,38.80416667,-76.069
EST,Estherville Municipal,Estherville,IA,USA,43.40744444,-94.74641667
ETB,West Bend Municipal,West Bend,WI,USA,43.42219444,-88.12792667
ETC,Edgecombe County,Tarboro,NC,USA,35.93710083,-77.54663833
ETH,Wheaton Municipal,Wheaton,MN,USA,45.78046056,-96.54353972
ETN,Eastland Municipal,Eastland,TX,USA,32.41349167,-98.80975667
EUF,Weedon,Eufaula,AL,USA,31.95131917,-85.128925
EUG,Mahlon Sweet,Eugene,OR,USA,44.12326,-123.2186856
EUL,Caldwell Industrial,Caldwell (Boise),ID,USA,43.64186111,-116.6357778
EVB,New Smyrna Beach Municipal,New Smyrna Beach,FL,USA,29.05580556,-80.94836111
EVM,Eveleth-Virginia Muni,Eveleth,MN,USA,47.42507778,-92.49846944
EVU,Maryville Memorial,Maryville,MO,USA,40.35260167,-94.91552722
EVV,Evansville Regional,Evansville,IN,USA,38.03799139,-87.53062667
EVW,Evanston-Uinta County Burns,Evanston,WY,USA,41.27494528,-111.0321286
EVY,Summit Airpark,Middletown,DE,USA,39.52038889,-75.72044444
EWB,New Bedford Municipal,New Bedford,MA,USA,41.67614167,-70.95694167
EWK,Newton-City-County,Newton,KS,USA,38.05710528,-97.27522861
EWN,Craven County Regional,New Bern,NC,USA,35.07297222,-77.04294444
EWR,Newark Intl,Newark,NJ,USA,40.69249722,-74.16866056
EWU,Newtok,Newtok,AK,USA,60.93865417,-164.6412147
EXI,Excursion Inlet SPB,Excursion Inlet,AK,USA,58.42049861,-135.4490328
EXX,Davidson County,Lexington,NC,USA,35.78114028,-80.30378194
EYE,Eagle Creek Airpark,Indianapolis,IN,USA,39.83070944,-86.29438056
EYW,Key West International,Key West,FL,USA,24.55611111,-81.75955556
EZI,Kewanee Municipal,Kewanee,IL,USA,41.20520361,-89.96386
EZM,Eastman-Dodge County,Eastman,GA,USA,32.21425,-83.12802778
EZZ,Cameron Memorial,Cameron,MO,USA,39.72755972,-94.276375
F00,Jones,Bonham,TX,USA,33.61172222,-96.17938889
F01,Quanah Municipal,Quanah,TX,USA,34.27708306,-99.75926861
F05,Vernon - Wilbarger County,Vernon,TX,USA,34.22566806,-99.28375
F06,Marian Airpark,Wellington,TX,USA,34.84561083,-100.1959481
F08,Eufaula Municipal,Eufaula,OK,USA,35.29593194,-95.62526417
F10,Henryetta Municipal,Henryetta,OK,USA,35.40687972,-96.01583278
F12,Rusk County,Henderson,TX,USA,32.14172222,-94.85172222
F17,Center Municipal,Center,TX,USA,31.83158333,-94.15641667
F18,Cleburne Municipal,Cleburne,TX,USA,32.35376389,-97.43375
F21,Memphis Municipal,Memphis,TX,USA,34.73958944,-100.5297008
F22,Perry Municipal,Perry,OK,USA,36.38559583,-97.27721083
F24,Minden-Webster,Minden,LA,USA,32.64601,-93.29808556
F28,El Reno Municipal,El Reno,OK,USA,35.47163639,-98.00599444
F29,Clarence E. Page Municipal,Oklahoma City,OK,USA,35.4880825,-97.82354556
F30,Sulphur Municipal,Sulphur,OK,USA,34.52453278,-96.98973944
F31,Lake Texoma State Park,Kingston,OK,USA,33.99287639,-96.64249722
F32,Healdton Municipal,Healdton,OK,USA,34.24925806,-97.47391306
F36,Cordell Municipal,Cordell,OK,USA,35.30421917,-98.96702167
F37,Wauchula Municipal,Wauchula,FL,USA,27.51364889,-81.88063917
F39,Grayson County,Sherman/Denison,TX,USA,33.71411111,-96.67366667
F41,Ennis Municipal,Ennis,TX,USA,32.32969444,-96.66388889
F44,Athens Jones Municipal,Athens,TX,USA,32.16384778,-95.82835306
F45,North Palm Beach County General Aviation,West Palm Beach,FL,USA,26.84537306,-80.22148111
F46,Rockwall Municipal,Rockwall,TX,USA,32.93059444,-96.43548556
F49,Slaton Municipal,Slaton,TX,USA,33.48481,-101.6607158
F51,Winnsboro Municipal,Winnsboro,TX,USA,32.93884556,-95.27886083
F53,Franklin County,Mount Vernon,TX,USA,33.21530583,-95.2374925
F55,Granbury Municipal,Granbury,TX,USA,32.44441583,-97.8169475
F56,Arledge,Stamford,TX,USA,32.91019472,-99.73422972
F70,French Valley,Murieta/Temecula,CA,USA,33.57605556,-117.1279722
F80,Atoka Municipal,Atoka,OK,USA,34.39833889,-96.14805972
F81,Okemah Flying,Okemah,OK,USA,35.42925306,-96.28778361
F84,Stigler Municipal,Stigler,OK,USA,35.28910556,-95.09389722
F85,Morton-Cochran County,Morton,TX,USA,33.72926389,-102.7338183
F87,Farmerville,Farmerville,LA,USA,32.72495583,-92.33716583
F88,Jonesboro,Jonesboro,LA,USA,32.20199028,-92.73293028
F89,Winnsboro Municipal,Winnsboro,LA,USA,32.15431917,-91.70012472
F91,Thomas P Stafford,Weatherford,OK,USA,35.54482944,-98.66849028
F99,Holdenville Municipal,Holdenville,OK,USA,35.085875,-96.41666667
FAI,Fairbanks International,Fairbanks,AK,USA,64.8136775,-147.8596694
FAM,Farmington Regional,Farmington,MO,USA,37.76107917,-90.42859722
FAQ,Fitiuta,Fitiuta Village,AS,USA,14.21577583,-169.4239058
FAR,Hector International,Fargo,ND,USA,46.91934889,-96.81498889
FAT,Fresno Yosemite International,Fresno,CA,USA,36.77619444,-119.7181389
FAY,Fayetteville Municipal,Fayetteville,NC,USA,34.99147222,-78.88
FBL,Faribault Municipal,Faribault,MN,USA,44.32468556,-93.31082889
FBR,Fort Bridger,Fort Bridger,WY,USA,41.39193583,-110.4067961
FBY,Fairbury Municipal,Fairbury,NE,USA,40.18297222,-97.16927778
FCA,Glacier Park Intl,Kalispell,MT,USA,48.31140472,-114.2550694
FCH,Fresno-Chandler Downtown,Fresno,CA,USA,36.732365,-119.8198961
FCI,Chesterfield County,Richmond,VA,USA,37.4065375,-77.52498667
FCM,Flying Cloud,Minneapolis,MN,USA,44.82724111,-93.45714639
FCY,Forrest City Municipal,Forrest City,AR,USA,34.94199806,-90.77496611
FDK,Frederick Municipal,Frederick,MD,USA,39.41758333,-77.37430556
FDR,Frederick Municipal,Frederick,OK,USA,34.35219472,-98.98460222
FDW,Fairfield County,Winnsboro,SC,USA,34.31547222,-81.10880556
FDY,Findlay,Findlay,OH,USA,41.01352778,-83.66869444
FEP,Albertus,Freeport,IL,USA,42.24626722,-89.58223944
FET,Fremont Municipal,Fremont,NE,USA,41.44913889,-96.52019444
FFA,First Flight,Kill Devil Hills,NC,USA,36.01822278,-75.67128694
FFC,Peachtree City - Falcon,Atlanta,GA,USA,33.35725,-84.57183333
FFL,Fairfield Municipal,Fairfield,IA,USA,41.05332417,-91.97892333
FFM,Fergus Falls Muni-Einar Mickelson,Fergus Falls,MN,USA,46.28439389,-96.15668556
FFT,Capital City,Frankfort,KY,USA,38.18248861,-84.90470083
FFZ,Falcon,Mesa,AZ,USA,33.46083333,-111.7283333
FGX,Fleming-Mason,Flemingsburg,KY,USA,38.54180556,-83.74338889
FHR,Friday Harbor,Friday Harbor,WA,USA,48.52197222,-123.0243611
FHU,Libby AAF-Sierra Vista Municipal,Fort Huachuca-Sierra Vista,AZ,USA,31.58847222,-110.3443889
FIG,Clearfield-Lawrence,Clearfield,PA,USA,41.04861306,-78.41310306
FIT,Fitchburg Municipal,Fitchburg,MA,USA,42.55412194,-71.75895639
FKL,Chess-Lamberton,Franklin,PA,USA,41.37787361,-79.86036167
FKN,Franklin Municipal-John Beverly Rose,Franklin,VA,USA,36.69817806,-76.90312694
FKR,Frankfort Municipal,Frankfort,IN,USA,40.27343083,-86.56217028
FLD,Fond Du Lac County,Fond Du Lac,WI,USA,43.77117417,-88.48842917
FLG,Flagstaff Pulliam,Flagstaff,AZ,USA,35.13845472,-111.6712183
FLL,Fort Lauderdale-Hollywood Int'l,Ft. Lauderdale,FL,USA,26.07258333,-80.15275
FLO,Florence Regional,Florence,SC,USA,34.18536111,-79.72388889
FLP,Marion County Regional,Flippin,AR,USA,36.29087528,-92.59023417
FLT,Flat,Flat,AK,USA,62.45264889,-157.98907
FLX,Fallon Municipal,Fallon,NV,USA,39.499545,-118.7490197
FME,Tipton,Odenton,MD,USA,39.08538667,-76.75941444
FMN,Four Corners Regional,Farmington,NM,USA,36.74125,-108.2299444
FMY,Page,Ft. Myers,FL,USA,26.58661111,-81.86325
FMZ,Fairmont State,Fairmont,NE,USA,40.58569444,-97.57305556
FNB,Brenner,Falls City,NE,USA,40.07878611,-95.59199167
FNL,Fort Collins-Loveland,Fort Collins/Loveland,CO,USA,40.45182722,-105.0113356
FNR,Funter Bay SPB,Funter Bay,AK,USA,58.25438583,-134.8979067
FNT,Bishop,Flint,MI,USA,42.96550333,-83.74345639
FOA,Flora,Flora,IL,USA,38.66494528,-88.45299556
FOD,Fort Dodge Municipal,Fort Dodge,IA,USA,42.55145611,-94.19255111
FOE,Forbes,Topeka,KS,USA,38.95095194,-95.66361444
FOK,Francis Gabreski,Westhampton Beach,NY,USA,40.84365472,-72.63178917
FOT,Rohnerville,Fortuna,CA,USA,40.55393583,-124.1326589
FPR,St. Lucie County International,Ft. Pierce,FL,USA,27.49505556,-80.36827778
FQD,Rutherford County-Marchman,Rutherfordton,NC,USA,35.42822222,-81.93507778
FRG,Republic,Farmingdale,NY,USA,40.72878111,-73.41340722
FRH,French Lick Municipal,French Lick,IN,USA,38.50622139,-86.63693528
FRM,Fairmont Municipal,Fairmont,MN,USA,43.64394111,-94.41561556
FRR,Front Royal-Warren County,Front Royal,VA,USA,38.9175325,-78.25351472
FSD,Joe Foss,Sioux Falls,SD,USA,43.58135111,-96.74170028
FSE,Fosston Municipal,Fosston,MN,USA,47.59282028,-95.77349889
FSK,Fort Scott Municipal,Fort Scott,KS,USA,37.79843056,-94.76938111
FSM,Fort Smith Regional,Fort Smith,AR,USA,35.33659028,-94.36744111
FSO,Franklin County State,Highgate,VT,USA,44.94028083,-73.09746
FST,Fort Stockton - Pecos County,Fort Stockton,TX,USA,30.91566667,-102.9161389
FSU,Fort Sumner Municipal,Fort Sumner,NM,USA,34.48339944,-104.2171967
FSW,Fort Madison Municipal,Fort Madison,IA,USA,40.6592625,-91.3268175
FTG,Front Range,Denver,CO,USA,39.78525,-104.5431389
FTT,Elton Hensley Memorial,Fulton,MO,USA,38.83987472,-92.00421056
FTW,Fort Worth Meacham International,Fort Worth,TX,USA,32.81977778,-97.36244444
FTY,Fulton County - Brown,Atlanta,GA,USA,33.77913889,-84.52136111
FUL,Fullerton Municipal,Fullerton,CA,USA,33.87201417,-117.9797842
FVE,Northern Aroostook Regional,Frenchville,ME,USA,47.28550417,-68.31275
FVX,Farmville Municipal,Farmville,VA,USA,37.35752861,-78.43779806
FWA,Fort Wayne International,Fort Wayne,IN,USA,40.97846583,-85.19514639
FWC,Fairfield Municipal,Fairfield,IL,USA,38.37863306,-88.41265222
FWN,Sussex,Sussex,NJ,USA,41.20020667,-74.62305056
FWS,Spinks,Fort Worth,TX,USA,32.56522778,-97.30807778
FXE,Fort Lauderdale Executive,Ft. Lauderdale,FL,USA,26.19728,-80.17070833
FXY,Forest City Municipal,Forest City,IA,USA,43.23473417,-93.6241025
FYE,Fayette County,Somerville,TN,USA,35.20592,-89.39441667
FYM,Fayetteville Municipal,Fayetteville,TN,USA,35.05836278,-86.56441139
FYU,Fort Yukon,Fort Yukon,AK,USA,66.57149028,-145.2504169
FYV,Fayetteville Municipal,Fayetteville,AR,USA,36.00509472,-94.17005694
FZG,Fitzgerald Municipal,Fitzgerald,GA,USA,31.68368667,-83.27046056
FZI,Fostoria Metropolitan,Fostoria,OH,USA,41.19083111,-83.39453639
FZY,Oswego Cty,Fulton,NY,USA,43.35077528,-76.38805361
GAB,Gabbs,Gabbs,NV,USA,38.92409111,-117.9590072
GAD,Gadsden Municipal,Gadsden,AL,USA,33.97262528,-86.08900139
GAF,Grafton Municipal,Grafton,ND,USA,48.40469444,-97.37094444
GAG,Gage,Gage,OK,USA,36.29553889,-99.77642361
GAI,Montgomery Co Airpark,Gaithersburg,MD,USA,39.16833611,-77.166
GAL,Edward G. Pitka Sr.,Galena,AK,USA,64.73617806,-156.9374164
GAM,Gambell,Gambell,AK,USA,63.76676556,-171.7328236
GAS,Gallia - Meigs Regional,Gallipolis,OH,USA,38.83410833,-82.16342306
GBD,Great Bend Municipal,Great Bend,KS,USA,38.34441861,-98.85917028
GBG,Galesburg Municipal,Galesburg,IL,USA,40.93800194,-90.43112556
GBH,Galbraith Lake,Galbraith Lake,AK,USA,68.47906306,-149.4900214
GBR,Great Barrington,Great Barrington,MA,USA,42.18421417,-73.40324056
GCC,Gillette-Campbell County,Gillette,WY,USA,44.34889806,-105.5393614
GCK,Garden City Regional,Garden City,KS,USA,37.92751556,-100.7244147
GCM,Claremore Regional,Claremore,OK,USA,36.29441667,-95.47966667
GCN,Grand Canyon National Park,Grand Canyon,AZ,USA,35.95235389,-112.1469647
GCT,Guthrie County Regional,Guthrie Center,IA,USA,41.68776417,-94.43524611
GCY,Greeneville Municipal,Greeneville,TN,USA,36.19299083,-82.81507028
GDM,Gardner Municipal,Gardner,MA,USA,42.54986639,-72.01602194
GDV,Dawson Community,Glendive,MT,USA,47.13871861,-104.8071994
GDW,Gladwin,Gladwin,MI,USA,43.97063278,-84.47503861
GDY,Grundy Municipal,Grundy,VA,USA,37.23240111,-82.12499083
GED,Sussex Cty Arpt,Georgetown,DE,USA,38.68919444,-75.35888889
GEG,Spokane Intl,Spokane,WA,USA,47.61985556,-117.5338425
GEO,Brown County,Georgetown,OH,USA,38.88195778,-83.88273278
GEU,Glendale Municipal,Glendale,AZ,USA,33.52726278,-112.2951564
GEY,South Big Horn County,Greybull,WY,USA,44.51644444,-108.0831944
GEZ,Shelbyville Municipal,Shelbyville,IN,USA,39.58316583,-85.80481
GFK,Grand Forks International,Grand Forks,ND,USA,47.949255,-97.17611111
GFL,Floyd D. Bennett,Glens Falls,NY,USA,43.34121,-73.6103075
GFZ,Greenfield Municipal,Greenfield,IA,USA,41.32702778,-94.44572222
GGE,Georgetown County,Georgetown,SC,USA,33.31169444,-79.31958333
GGF,Grant Municipal,Grant,NE,USA,40.86952778,-101.7328611
GGG,Gregg County,Longview,TX,USA,32.38486111,-94.71171
GGI,Grinnell Municipal,Grinnell,IA,USA,41.70916083,-92.73491278
GGP,Logansport Municipal,Logansport,IN,USA,40.71126139,-86.37449917
GGW,Wokal Field/Glasgow Intl,Glasgow,MT,USA,48.21246417,-106.6148231
GHM,Centerville Municipal,Centerville,TN,USA,35.83742722,-87.445375
GHW,Glenwood Municipal,Glenwood,MN,USA,45.64389167,-95.32043056
GIF,Winter Havens Gilbert,Winter Haven,FL,USA,28.06291667,-81.75330556
GJT,Walker,Grand Junction,CO,USA,39.1224125,-108.5267347
GKJ,Port Meadville,Meadville,PA,USA,41.62652667,-80.2147275
GKN,Gulkana,Gulkana,AK,USA,62.15488889,-145.4566389
GKT,Gatlinburg-Pigeon Forge,Sevierville,TN,USA,35.85775889,-83.52870472
GKY,Arlington Municipal,Arlington,TX,USA,32.66241528,-97.09391139
GLD,Renner Field/Goodland Municipal,Goodland,KS,USA,39.37062194,-101.6989919
GLE,Gainesville Municipal,Gainesville,TX,USA,33.65136111,-97.19702778
GLH,Mid Delta Regional,Greenville,MS,USA,33.48288111,-90.98561389
GLR,Otsego County,Gaylord,MI,USA,45.01354806,-84.70318944
GLS,Galveston-Scholes,Galveston,TX,USA,29.26532333,-94.86040667
GLW,Glasgow Municipal,Glasgow,KY,USA,37.03205556,-85.95261111
GLY,Clinton Memorial,Clinton,MO,USA,38.35657306,-93.68417694
GMJ,Grove Municipal,Grove,OK,USA,36.60527056,-94.73856667
GMU,Greenville Downtown,Greenville,SC,USA,34.84794444,-82.35
GNB,Granby-Grand County,Granby,CO,USA,40.08970806,-105.9172367
GNF,Grenada Municipal,Grenada,MS,USA,33.83253,-89.79822806
GNG,Gooding Municipal,Gooding,ID,USA,42.91716639,-114.7651575
GNT,Grants-Milan Municipal,Grants,NM,USA,35.16531472,-107.9006142
GNU,Goodnews,Goodnews,AK,USA,59.11727556,-161.5813967
GNV,Gainesville Regional,Gainesville,FL,USA,29.69005556,-82.27177778
GOK,Guthrie Municipal,Guthrie,OK,USA,35.84980556,-97.41560833
GON,Groton-New London,Groton,CT,USA,41.33005778,-72.04513556
GPH,Clay County Regional,Mosby,MO,USA,39.33046528,-94.30997361
GPM,Grand Prairie Municipal,Grand Prairie,TX,USA,32.69858333,-97.04652778
GPT,Gulfport-Biloxi Regional,Gulfport-Biloxi,MS,USA,30.40728028,-89.07009278
GPZ,Grand Rapids-Itasca County,Grand Rapids,MN,USA,47.21110333,-93.50984472
GQQ,Galion Municipal,Galion,OH,USA,40.75338889,-82.72380556
GRB,Austin Straubel International,Green Bay,WI,USA,44.48507333,-88.12959
GRD,Greenwood County,Greenwood,SC,USA,34.24872222,-82.15908333
GRE,Greenville,Greenville,IL,USA,38.83615778,-89.37841111
GRI,Central Nebraska Regional,Grand Island,NE,USA,40.96747222,-98.30861111
GRK,Robert Gray AAF,Killeen,TX,USA,31.06489778,-97.82779778
GRN,Gordon Municipal,Gordon,NE,USA,42.80597222,-102.17525
GRO,Rota International,Rota Island,CQ,USA,14.1743075,-145.2425353
GRR,Kent County International,Grand Rapids,MI,USA,42.88081972,-85.52276778
GSH,Goshen Municipal,Goshen,IN,USA,41.52716028,-85.79210278
GSN,Saipan International,Obyan,CQ,USA,15.11900139,-145.7293561
GSO,Piedmont Triad International,Greensboro,NC,USA,36.09774694,-79.9372975
GSP,Greenville-Spartanburg,Greer,SC,USA,34.89566722,-82.21885833
GST,Gustavus,Gustavus,AK,USA,58.42438139,-135.7073814
GTF,Great Falls Intl,Great Falls,MT,USA,47.48200194,-111.3706853
GTR,Golden Triangle Regional,Columbus-Starkville-West Point,MS,USA,33.45033444,-88.59136861
GTU,Georgetown Municipal,Georgetown,TX,USA,30.67880889,-97.67938389
GUC,Gunnison County,Gunnison,CO,USA,38.53396333,-106.9331817
GUM,Guam International,Agana,GU,USA,13.48345,-144.7959825
GUP,Gallup Municipal,Gallup,NM,USA,35.51105833,-108.7893094
GUY,Guymon Municipal,Guymon,OK,USA,36.68507194,-101.5077817
GVL,Lee Gilmer Memorial,Gainesville,GA,USA,34.27290389,-83.82681333
GVQ,Genesee Cty,Batavia,NY,USA,43.03172639,-78.16759972
GVT,Majors,Greenville,TX,USA,33.06783889,-96.0653325
GWO,Greenwood-Leflore,Greenwood,MS,USA,33.49432667,-90.084705
GWR,Gwinner-Roger Melroe,Gwinner,ND,USA,46.21872222,-97.64325
GWW,Goldsboro-Wayne Municipal,Goldsboro,NC,USA,35.46055444,-77.96493306
GXY,Greeley-Weld County,Greeley,CO,USA,40.43561833,-104.6321156
GYH,Donaldson Center,Greenville,SC,USA,34.75831917,-82.376415
GYR,Phoenix Goodyear,Goodyear,AZ,USA,33.42281972,-112.3759919
GYY,Gary/Chicago,Gary,IN,USA,41.61627306,-87.41278806
GZH,Middleton,Evergreen,AL,USA,31.41580111,-87.04404333
GZS,Abernathy,Pulaski,TN,USA,35.15371972,-87.05681444
H04,Vinita Municipal,Vinita,OK,USA,36.63301806,-95.15136111
H05,Wilburton Municipal,Wilburton,OK,USA,34.91954278,-95.39469722
H19,Bowling Green Municipal,Bowling Green,MO,USA,39.36993361,-91.21925556
H21,Camdenton Memorial,Camdenton,MO,USA,37.97468528,-92.69161528
H30,Hamilton Municipal,Hamilton,NY,USA,42.84381889,-75.56140194
H35,Clarksville Municipal,Clarksville,AR,USA,35.47069417,-93.427155
H41,Memorial,Mexico,MO,USA,39.15751389,-91.81826667
H45,Seminole Municipal,Seminole,OK,USA,35.27467806,-96.67516194
H66,Nowata Municipal,Nowata,OK,USA,36.72092222,-95.62525583
H71,Mid-America Industrial,Pryor,OK,USA,36.22539389,-95.33006333
H79,Eldon Model Airpark,Eldon,MO,USA,38.36062611,-92.57157139
H88,Municipal,Fredericktown,MO,USA,37.605825,-90.28731389
H92,Hominy,Hominy,OK,USA,36.43340222,-96.38362861
H96,Benton Municipal,Benton,IL,USA,38.00675111,-88.93441528
H97,Pawnee Municipal,Pawnee,OK,USA,36.38338556,-96.8103125
HAB,Marion County,Hamilton,AL,USA,34.11757222,-87.99819583
HAE,Hannibal Municipal,Hannibal,MO,USA,39.72448944,-91.44367944
HAF,Half Moon Bay,Half Moon Bay,CA,USA,37.51382944,-122.5010892
HAI,Three Rivers Municipal,Three Rivers,MI,USA,41.95975,-85.59338889
HAO,Hamilton-Fairfield,Hamilton,OH,USA,39.36448861,-84.52457722
HAY,Haycock,Haycock,AK,USA,65.20098944,-161.1567792
HBC,Mohall Municipal,Mohall,ND,USA,48.76838333,-101.5369953
HBG,Bobby L. Chain Municipal,Hattiesburg,MS,USA,31.26506556,-89.2530325
HBR,Hobart Municipal,Hobart,OK,USA,34.9913075,-99.0513525
HBV,Jim Hogg County,Hebbronville,TX,USA,27.34955556,-98.73697222
HBZ,Heber Springs Municipal,Heber Springs,AR,USA,35.51169389,-92.01300944
HCD,Hutchinson Municipal,Hutchinson,MN,USA,44.85890667,-94.38178917
HCO,Hallock Municipal,Hallock,MN,USA,48.75273139,-96.94300306
HDC,Hammond Municipal,Hammond,LA,USA,30.52096889,-90.41762056
HDE,Brewster,Holdredge,NE,USA,40.45269444,-99.33733333
HDH,Dillingham Airfield,Mokuleia,HI,USA,21.57947361,-158.1972814
HDI,Hardwick,Cleveland,TN,USA,35.22007306,-84.83244333
HDN,Yampa Valley,Hayden,CO,USA,40.48118028,-107.2176597
HDO,Hondo Municipal,Hondo,TX,USA,29.35952778,-99.17666667
HEE,Thompson-Robbins,Helena-West Helena,AR,USA,34.57648972,-90.67588639
HEF,Manassas Reg./Harry P Davis,Manassas,VA,USA,38.72141667,-77.51544444
HEI,Hettinger Municipal,Hettinger,ND,USA,46.01494444,-102.6559722
HEQ,Holyoke,Holyoke,CO,USA,40.56943056,-102.2726875
HEZ,Natchez-Adams County,Natchez,MS,USA,31.61366111,-91.29733639
HFD,Hartford Brainard,Hartford,CT,USA,41.73626861,-72.65021389
HFY,Greenwood Municipal,Indianapolis/Greenwood,IN,USA,39.62841667,-86.08788889
HGR,Hagerstown Regional-Richard Henson,Hagerstown,MD,USA,39.70794444,-77.7295
HHF,Hemphill County,Canadian,TX,USA,35.89530778,-100.4036397
HHG,Huntington Municipal,Huntington,IN,USA,40.85299,-85.45941917
HHH,Hilton Head,NA,NA,USA,32.224384,-80.697629
HHR,Jack Northrop Field/Hawthorne Municipal,Hawthorne,CA,USA,33.92283972,-118.3351872
HHW,Stan Stamper Municipal,Hugo,OK,USA,34.03482556,-95.54190611
HI01,Princeville,Hanalei,HI,USA,22.20919,-159.4455339
HIB,Chisholm-Hibbing,Hibbing,MN,USA,47.38659917,-92.83899333
HIE,Mt Washington Regional,Whitefield,NH,USA,44.36761639,-71.54447111
HIG,Higginsville Industrial Municipal,Higginsville,MO,USA,39.07334639,-93.67716083
HII,Lake Havasu City,Lake Havasu City,AZ,USA,34.56816056,-114.3561783
HIO,Portland-Hillsboro,Hillsboro (Portland),OR,USA,45.54039389,-122.9498258
HJH,Hebron Municipal,Hebron,NE,USA,40.15225,-97.58697222
HJO,Hanford Municipal,Hanford,CA,USA,36.31852194,-119.6288675
HKA,Blytheville Municipal,Blytheville,AR,USA,35.94040667,-89.83080583
HKS,Hawkins,Jackson,MS,USA,32.3347725,-90.22253167
HKY,Hickory Municipal,Hickory,NC,USA,35.74114639,-81.38954889
HLC,Hill City Municipal,Hill City,KS,USA,39.37883611,-99.83149444
HLG,Wheeling-Ohio Cty,Wheeling,WV,USA,40.175,-80.64627778
HLN,Helena Regional,Helena,MT,USA,46.60681806,-111.9827503
HLX,Twin County,Galax,VA,USA,36.76611472,-80.82356556
HMT,Hemet-Ryan,Hemet,CA,USA,33.73398167,-117.0225258
HMZ,Bedford County,Bedford,PA,USA,40.08536861,-78.51221778
HNB,Huntingburg,Huntingburg,IN,USA,38.24902583,-86.95371833
HNH,Hoonah,Hoonah,AK,USA,58.09609139,-135.4096975
HNL,Honolulu International,Honolulu,HI,USA,21.31869111,-157.9224072
HNM,Hana,Hana,HI,USA,20.79563722,-156.0144378
HNR,Harlan Municipal,Harlan,IA,USA,41.58438889,-95.33963889
HNS,Haines,Haines,AK,USA,59.24522806,-135.5221086
HNZ,Henderson-Oxford,Oxford,NC,USA,36.36156111,-78.52916639
HOB,Lea County Regional,Hobbs,NM,USA,32.68752778,-103.2170278
HOC,Highland County,Hillsboro,OH,USA,39.18875944,-83.53880694
HOE,Homerville,Homerville,GA,USA,31.05591667,-82.77413889
HOM,Homer,Homer,AK,USA,59.64555556,-151.4765833
HON,Huron Regional,Huron,SD,USA,44.38520056,-98.2285425
HOT,Memorial,Hot Springs,AR,USA,34.47803389,-93.09620833
HOU,William P Hobby,Houston,TX,USA,29.64541861,-95.27888889
HPB,Hooper Bay,Hooper Bay,AK,USA,61.52418306,-166.1467797
HPN,Westchester Cty,White Plains,NY,USA,41.06695778,-73.70757444
HPT,Hampton Municipal,Hampton,IA,USA,42.72372361,-93.22634056
HQG,Hugoton Municipal,Hugoton,KS,USA,37.16308056,-101.3705267
HQM,Bowerman,Hoquiam,WA,USA,46.97120167,-123.9365581
HQU,Thomson-McDuffie County,Thomson,GA,USA,33.52972639,-82.51678556
HQZ,Mesquite Metro,Mesquite,TX,USA,32.74696278,-96.53041722
HRI,Hermiston Muni,Hermiston,OR,USA,45.82822222,-119.2591667
HRL,Valley International,Harlingen,TX,USA,26.22850611,-97.65439389
HRO,Boone County,Harrison,AR,USA,36.26152056,-93.15472889
HRR,Healy River,Healy,AK,USA,63.86620806,-148.9689842
HRU,Herington Municipal,Herington,KS,USA,38.68322389,-96.80800639
HRX,Hereford Municipal,Hereford,TX,USA,34.85761639,-102.3272017
HSA,Stennis International,Bay St Louis,MS,USA,30.36780778,-89.45461083
HSB,Harrisburg-Raleigh,Harrisburg,IL,USA,37.8115,-88.54913889
HSE,Billy Mitchell,Hatteras,NC,USA,35.2327875,-75.617795
HSI,Hastings Municipal,Hastings,NE,USA,40.60525,-98.42788889
HSL,Huslia,Huslia,AK,USA,65.70055556,-156.3875
HSP,Ingalls,Hot Springs,VA,USA,37.95144444,-79.83389444
HSR,Hot Springs Municipal,Hot Springs,SD,USA,43.36824528,-103.3881378
HSV,Huntsville International,Huntsville,AL,USA,34.6404475,-86.77310944
HTH,Hawthorne Municipal,Hawthorne,NV,USA,38.54436583,-118.6343003
HTL,Roscommon County,Houghton Lake,MI,USA,44.35980556,-84.67111111
HTO,East Hampton,East Hampton,NY,USA,40.95957778,-72.25185056
HTS,Tri-State/Walker-Long,Huntington,WV,USA,38.36666667,-82.55802778
HTW,"Lawrence County Airpark,Inc",Chesapeake,OH,USA,38.41924861,-82.4943225
HUF,Terre Haute International-Hulman,Terre Haute,IN,USA,39.45146361,-87.30756111
HUL,Houlton International,Houlton,ME,USA,46.12308333,-67.79205556
HUM,Houma-Terrebonne,Houma,LA,USA,29.5665,-90.66041667
HUS,Hughes,Hughes,AK,USA,66.04112167,-154.2631903
HUT,Hutchinson Municipal,Hutchinson,KS,USA,38.06548306,-97.86063361
HVC,Hopkinsville-Christian County,Hopkinsville,KY,USA,36.85658333,-87.45725
HVE,Hanksville,Hanksville,UT,USA,38.41803722,-110.7040378
HVN,Tweed-New Haven,New Haven,CT,USA,41.26389889,-72.8871
HVR,Havre City-County,Havre,MT,USA,48.542985,-109.7623419
HVS,Hartsville Municipal,Hartsville,SC,USA,34.40308333,-80.11922222
HWD,Hayward Executive,Hayward,CA,USA,37.65926528,-122.1224083
HWI,Hawk Inlet SPB,Hawk Inlet,AK,USA,58.12744139,-134.7559531
HWO,North Perry,Hollywood,FL,USA,26.00142417,-80.24052056
HWQ,Wheatland County  At Harlowton,Harlowton,MT,USA,46.4541225,-109.8549061
HWV,Brookhaven,Shirley,NY,USA,40.81676528,-72.86204722
HXD,Hilton Head,Hilton Head Island,SC,USA,32.22436111,-80.69747222
HXF,Hartford Municipal,Hartford,WI,USA,43.34927806,-88.39112528
HYA,Barnstable Mun Boardman/Polando,Hyannis,MA,USA,41.66933639,-70.28035583
HYG,Hydaburg SPB,Hydaburg,AK,USA,55.20631611,-132.8283131
HYI,San Marcos Municipal,San Marcos,TX,USA,29.89361111,-97.86469444
HYL,Hollis SPB,Hollis,AK,USA,55.48158833,-132.6460942
HYR,Sawyer County,Hayward,WI,USA,46.02585722,-91.44424278
HYS,Hays Municipal,Hays,KS,USA,38.84494167,-99.27403361
HYW,Conway-Horry County,Conway,SC,USA,33.8285,-79.12216667
HZD,Carroll County,Huntingdon,TN,USA,36.08930722,-88.46329778
HZE,Mercer County Regional,Hazen,ND,USA,47.28986111,-101.5809444
HZL,Hazleton Muni,Hazleton,PA,USA,40.98677778,-75.99488889
HZR,False River Air Park,New Roads,LA,USA,30.71832333,-91.47866972
HZY,Ashtabula County,Ashtabula,OH,USA,41.77797528,-80.69551333
I05,Sturgis Municipal,Sturgis,KY,USA,37.54083333,-87.95183333
I12,Sidney Municipal,Sidney,OH,USA,40.24127944,-84.15101167
I16,Kee,Pineville,WV,USA,37.60044444,-81.55927778
I18,Jackson County,Ravenswood,WV,USA,38.92977778,-81.81947222
I19,Greene County,Dayton,OH,USA,39.69172639,-83.99023806
I22,Randolph County,Winchester,IN,USA,40.16885083,-84.92585333
I23,Fayette County,Washington Court House,OH,USA,39.57040167,-83.42052444
I25,Welch Muni,Welch,WV,USA,37.41678056,-81.52899417
I32,Morehead-Rowan County,Morehead,KY,USA,38.13341472,-83.53796528
I34,Greensburg-Decatur County,Greensburg,IN,USA,39.32691111,-85.52252694
I35,Tucker-Guthrie Memorial,Harlan,KY,USA,36.85981028,-83.36101639
I39,Madison County,Richmond,KY,USA,37.63152778,-84.33244444
I40,Richard Downing,Coshocton,OH,USA,40.30918056,-81.85338194
I42,Paoli Municipal,Paoli,IN,USA,38.58338806,-86.46248778
I43,James A Rhodes,Jackson,OH,USA,38.98135194,-82.57785667
I50,Stanton,Stanton,KY,USA,37.85008167,-83.84575194
I57,Pike County,Waverly,OH,USA,39.16693333,-82.928175
I63,Mt. Sterling Municipal,Mt. Sterling,IL,USA,39.9875,-90.80416667
I66,Clinton,Wilmington,OH,USA,39.50286111,-83.86305556
I67,Cincinnati West,Harrison,OH,USA,39.25894444,-84.77430556
I68,Lebanon-Warren County,Lebanon,OH,USA,39.46217306,-84.25184722
I69,Clermont County,Batavia,OH,USA,39.07839722,-84.21020722
I74,Grimes,Urbana,OH,USA,40.12928306,-83.7548775
I75,Osceola Municipal,Osceola,IA,USA,41.05221889,-93.68966222
I76,Peru Municipal,Peru,IN,USA,40.78631889,-86.14638306
I78,Union County,Marysville,OH,USA,40.22469444,-83.35161111
I83,Salem Municipal,Salem,IN,USA,38.60200167,-86.13997889
I86,Perry County,New Lexington,OH,USA,39.69159667,-82.19778583
I88,Pontiac Municipal,Pontiac,IL,USA,40.92372222,-88.6255
I93,Breckinridge County,Hardinsburg,KY,USA,37.78505944,-86.44192194
I95,Hardin County,Kenton,OH,USA,40.61072,-83.64359694
IAD,Washington Dulles International,Chantilly,VA,USA,38.94453194,-77.45580972
IAG,Niagara Falls Intl,Niagara Falls,NY,USA,43.10725861,-78.94538139
IAH,George Bush Intercontinental,Houston,TX,USA,29.98047222,-95.33972222
IAN,Bob Baker Memorial,Kiana,AK,USA,66.97937611,-160.4358597
IBM,Robert E. Arraj,Kimball,NE,USA,41.18805556,-103.6773889
ICL,Schenck,Clarinda,IA,USA,40.72178361,-95.02642667
ICT,Wichita Mid-Continent,Wichita,KS,USA,37.64995889,-97.43304583
IDA,Idaho Falls Regional,Idaho Falls,ID,USA,43.51455556,-112.0701667
IDI,Indiana Cty/Jimmy Stewart,Indiana,PA,USA,40.63222222,-79.10552778
IDL,Indianola Municipal,Indianola,MS,USA,33.48574611,-90.67887611
IDP,Independence Municipal,Independence,KS,USA,37.15837222,-95.77838333
IEM,Whittier,Whittier,AK,USA,60.7772125,-148.7215775
IEN,Pine Ridge,Pine Ridge,SD,USA,43.02257694,-102.5110728
IER,Natchitoches Municipal,Natchitoches,LA,USA,31.73572,-93.09913639
IFA,Iowa Falls Municipal,Iowa Falls,IA,USA,42.47078639,-93.26995361
IFP,Laughlin/Bullhead International,Bullhead City,AZ,USA,35.15738889,-114.5595278
IGG,Igiugig,Igiugig,AK,USA,59.32373528,-155.9032733
IGM,Kingman,Kingman,AZ,USA,35.25947222,-113.9380556
IGQ,Lansing Municipal,Chicago/Lansing,IL,USA,41.53988889,-87.53216667
IGT,Nightmute,Nightmute,AK,USA,60.47032722,-164.6856414
IIB,Independence Municipal,Independence,IA,USA,42.45359833,-91.94761833
IIK,Kipnuk,Kipnuk,AK,USA,59.93295111,-164.0305131
IIY,Washington-Wilkes County,Washington,GA,USA,33.77987528,-82.81661639
IJD,Windham,Willimantic,CT,USA,41.74404028,-72.18023583
IJX,Jacksonville Municipal,Jacksonville,IL,USA,39.77429694,-90.23856583
IKK,Greater Kankakee,Kankakee,IL,USA,41.07140417,-87.84626861
IKV,Ankeny Regional,Ankeny,IA,USA,41.69128556,-93.56630333
ILE,Killeen Municipal,Killeen,TX,USA,31.08583333,-97.6865
ILG,New Castle County,Wilmington,DE,USA,39.67872222,-75.60652778
ILI,Iliamna,Iliamna,AK,USA,59.75380028,-154.9109597
ILM,Wilmington International,Wilmington,NC,USA,34.27061111,-77.90255556
IML,Imperial Municipal,Imperial,NE,USA,40.50930556,-101.6205278
IMM,Immokalee,Immokalee,FL,USA,26.43316667,-81.40102778
IMS,Madison Municipal,Madison,IN,USA,38.75888889,-85.46552778
IMT,Ford,Iron Mountain/Kingsford,MI,USA,45.81835417,-88.1145425
IN03,Indianapolis Downtown,Indianapolis,IN,USA,39.76587639,-86.148875
IND,Indianapolis International,Indianapolis,IN,USA,39.71732917,-86.29438417
INK,Winkler County,Wink,TX,USA,31.77962833,-103.2013619
INL,Falls International,International Falls,MN,USA,48.56618722,-93.40306667
INT,Smith Reynolds,Winston-Salem,NC,USA,36.13372222,-80.222
INW,Winslow-Lindbergh Regional,Winslow,AZ,USA,35.02191667,-110.7225278
IOB,Mt Sterling-Montgomery County,Mount Sterling,KY,USA,38.05813889,-83.97958333
IOW,Iowa City Municipal,Iowa City,IA,USA,41.63924389,-91.54650333
IPJ,Lincoln County,Lincolnton,NC,USA,35.48332889,-81.16125833
IPL,Imperial County,Imperial,CA,USA,32.83422028,-115.5787456
IPT,Williamsport-Lycoming Cty,Williamsport,PA,USA,41.24183583,-76.92109556
IRK,Kirksville Regional,Kirksville,MO,USA,40.09364444,-92.54496917
IRS,Kirsch Municipal,Sturgis,MI,USA,41.8128725,-85.43906111
ISM,Kissimmee Municipal,Orlando,FL,USA,28.28980556,-81.43708333
ISN,Sloulin Field International,Williston,ND,USA,48.17793861,-103.6423467
ISO,Kinston Regional Jetport At Stallin,Kinston,NC,USA,35.32807944,-77.61552611
ISP,Long Island - MacArthur,Islip,NY,USA,40.7952425,-73.10021194
ISQ,Schoolcraft County,Manistique,MI,USA,45.97464056,-86.17183056
ISW,Alexander,Wisconsin Rapids,WI,USA,44.36033833,-89.83897056
ISZ,Cincinnati-Blue Ash,Cincinnati,OH,USA,39.24669444,-84.38897222
ITH,Tompkins Cty,Ithaca,NY,USA,42.49102778,-76.45844444
ITO,Hilo International,Hilo,HI,USA,19.72026306,-155.0484703
ITR,Kit Carson County,Burlington,CO,USA,39.2425,-102.2853889
IWA,Williams Gateway,Phoenix,AZ,USA,33.30783333,-111.6554722
IWD,Gogebic County,Ironwood,MI,USA,46.52747472,-90.13139667
IWH,Wabash Municipal,Wabash,IN,USA,40.76195972,-85.79873417
IWI,Wiscasset,Wiscasset,ME,USA,43.96141667,-69.71255556
IWK,Wales,Wales,AK,USA,65.62394028,-168.0991719
IWS,West Houston,Houston,TX,USA,29.81819444,-95.67261111
IXD,New Century Aircenter,Olathe,KS,USA,38.83090472,-94.89030333
IYK,Inyokern,Inyokern,CA,USA,35.65884306,-117.8295122
IYS,Wasilla,Wasilla,AK,USA,61.57196083,-149.5405556
IZA,Santa Ynez,Santa Ynez,CA,USA,34.60682028,-120.0755617
IZG,Eastern Slopes Regional,Fryeburg,ME,USA,43.99114472,-70.94787444
JAC,Jackson Hole,Jackson,WY,USA,43.60732417,-110.7377389
JAN,Jackson International,Jackson,MS,USA,32.31116667,-90.07588889
JAS,Jasper County -Bell,Jasper,TX,USA,30.89058333,-94.03483333
JAU,Campbell County,Jacksboro,TN,USA,36.33457556,-84.16234472
JAX,Jacksonville International,Jacksonville,FL,USA,30.49405556,-81.68786111
JBR,Jonesboro Municipal,Jonesboro,AR,USA,35.83186111,-90.64616667
JCT,Kimble County,Junction,TX,USA,30.51126,-99.76345528
JDN,Jordan,Jordan,MT,USA,47.33333417,-106.9339564
JEF,Jefferson City Memorial,Jefferson City,MO,USA,38.59117917,-92.15614389
JER,Jerome County,Jerome,ID,USA,42.72663639,-114.4571506
JES,Jesup-Wayne County,Jesup,GA,USA,31.55408333,-81.88344444
JFK,John F Kennedy Intl,New York,NY,USA,40.63975111,-73.77892556
JFX,Walker County,Jasper,AL,USA,33.90199528,-87.31416639
JHM,Kapalua,Lahaina,HI,USA,20.96293639,-156.6730317
JHW,Chautauqua Cty,Jamestown,NY,USA,42.15336861,-79.258035
JKA,Jack Edwards,Gulf Shores,AL,USA,30.28951667,-87.67371472
JKJ,Moorhead Municipal,Moorhead,MN,USA,46.83919194,-96.66313028
JKL,Julian Carroll,Jackson,KY,USA,37.59386111,-83.31725
JLN,Joplin Regional,Joplin,MO,USA,37.15181361,-94.49826833
JMR,Mora Municipal,Mora,MN,USA,45.88609722,-93.27177833
JMS,Jamestown Municipal,Jamestown,ND,USA,46.92971944,-98.67819528
JNU,Juneau International,Juneau,AK,USA,58.35496194,-134.5762764
JNX,Johnston County,Smithfield,NC,USA,35.54094139,-78.39032944
JOT,Joliet Park District,Chicago/Joliet,IL,USA,41.51805833,-88.17525583
JQF,Concord Regional,Concord,NC,USA,35.38520694,-80.70971389
JRA,Port Authority-W 30th St Midtown Heliport,New York,NY,USA,40.75454583,-74.00708389
JRB,Downtown Manhattan/Wall St. Heliport,New York,NY,USA,40.70121361,-74.00902833
JRF,Kalaeloa (John Rodgers),Kapolei,HI,USA,21.30735389,-158.0703017
JSO,Jacksonville-Cherokee County,Jacksonville,TX,USA,31.86933667,-95.21739028
JST,Johnstown-Cambria Cty,Johnstown,PA,USA,40.31611111,-78.83394444
JVL,Rock County,Janesville,WI,USA,42.61958222,-89.04034028
JVY,Clark County,Jeffersonville,IN,USA,38.36562278,-85.73829639
JWG,Watonga,Watonga,OK,USA,35.86469444,-98.42075
JWN,John C. Tune,Nashville,TN,USA,36.18236194,-86.88672278
JXN,Jackson County Reynolds,Jackson,MI,USA,42.25978556,-84.45940361
JYG,St James Municipal,St James,MN,USA,43.98631833,-94.55793722
JYL,Plantation Airpark,Sylvania,GA,USA,32.64544861,-81.59649722
JYM,Hillsdale Municipal,Hillsdale,MI,USA,41.92126083,-84.5857625
JYO,Leesburg Executive,Leesburg,VA,USA,39.07797222,-77.5575
JYR,Municipal,York,NE,USA,40.89675,-97.62277778
JZI,Charleston Executive,Charleston,SC,USA,32.70086111,-80.00291667
JZP,Pickens County,Jasper,GA,USA,34.45147972,-84.45659278
JZZ,Koliganek,Koliganek,AK,USA,59.72664194,-157.2594722
K01,Farington,Auburn,NE,USA,40.38750167,-95.78916167
K02,Perryville Municipal,Perryville,MO,USA,37.86866667,-89.86213889
K06,Greater Beardstown,Beardstown,IL,USA,39.97338139,-90.40373556
K09,Piseco Muni,Piseco,NY,USA,43.45340222,-74.51765083
K15,Linn Creek-Grand Glaize Memorial,Osage Beach,MO,USA,38.11045,-92.68054583
K20,Wendell H. Ford,Hazard,KY,USA,37.38783833,-83.26205889
K22,Big Sandy Regional,Prestonburg,KY,USA,37.75102778,-82.63669444
K24,Russell County,Jamestown,KY,USA,37.00888889,-85.10277778
K29,Council,Council,AK,USA,64.89788278,-163.7034472
K33,Salem Memorial,Salem,MO,USA,37.61523333,-91.60444167
K34,Municipal,Gardner,KS,USA,38.80708333,-94.95602778
K39,St Clair Memorial,St Clair,MO,USA,38.37594333,-90.97073944
K46,Blair Municipal,Blair,NE,USA,41.41805139,-96.1136275
K54,Teller,Teller,AK,USA,65.24089806,-166.3360067
K57,Gould Peterson Municipal,Tarkio,MO,USA,40.44583139,-95.36275806
K59,Amelia Earhart,Atchison,KS,USA,39.57052472,-95.18033139
K61,Moritz Memorial,Beloit,KS,USA,39.47115222,-98.12878389
K62,Falmouth Pendleton County,Falmouth,KY,USA,38.70423611,-84.39160417
K67,Oswego Municipal,Oswego,KS,USA,37.15978667,-95.04246222
K68,Garnett Municipal,Garnett,KS,USA,38.27918833,-95.21691833
K78,Abilene Municipal,Abilene.,KS,USA,38.90405583,-97.23585389
K81,Miami County,Paola,KS,USA,38.53751389,-94.92524194
K82,Smith Center Municipal,Smith Center,KS,USA,39.76112278,-98.79343639
K83,Sabetha Municipal,Sabetha,KS,USA,39.90416667,-95.7794325
K88,Allen County,Iola,KS,USA,37.87008333,-95.38638889
K89,Macon-Fower Memorial,Macon,MO,USA,39.72870694,-92.464455
K96,Tuscola,Tuscola,IL,USA,39.78086528,-88.30616
KAE,Kake SPB,Kake,AK,USA,56.97299639,-133.9456147
KAL,Kaltag,Kaltag,AK,USA,64.32571917,-158.7441475
KCC,Coffman Cove SPB,Coffman Cove,AK,USA,56.00324444,-132.8419689
KCL,Chignik Lagoon,Chignik Flats,AK,USA,56.31116306,-158.5359264
KEB,English Bay,English Bay,AK,USA,59.35214833,-151.9251558
KEK,Ekwok,Ekwok,AK,USA,59.35399444,-157.4744092
KFP,False Pass,False Pass,AK,USA,54.84744583,-163.4103222
KGX,Grayling,Grayling,AK,USA,62.89456056,-160.0649042
KIB,Ivanof Bay SPB,Ivanof Bay,AK,USA,55.89753333,-159.4886689
KIC,Mesa Del Rey,King City,CA,USA,36.22802139,-121.1218614
KKA,Koyuk,Koyuk,AK,USA,64.93404056,-161.158145
KKB,Kitoi Bay SPB,Kitoi Bay,AK,USA,58.19094611,-152.3704875
KLG,Kalskag,Kalskag,AK,USA,61.53627389,-160.3413306
KLL,Levelock,Levelock,AK,USA,59.11816472,-156.8652169
KLS,Kelso-Longview,Kelso,WA,USA,46.118,-122.8983889
KNB,Kanab Muni,Kanab,UT,USA,37.01110583,-112.5311936
KNW,Stuyahok,New Stuyahok,AK,USA,59.44955333,-157.3271908
KOA,Kona International At Keahole,Kailua/Kona,HI,USA,19.73876583,-156.0456314
KPB,Point Baker SPB,Point Baker,AK,USA,56.35185972,-133.6225864
KPH,Pauloff Harbor SPB,Pauloff Harbor,AK,USA,54.45912028,-162.6936406
KQA,Akutan SPB,Akutan,AK,USA,54.13246694,-165.7853111
KSM,St. Mary's,St. Mary's,AK,USA,62.06048639,-163.3021108
KTB,Thorne Bay,Thorne Bay,AK,USA,55.68796194,-132.5366758
KTN,Ketchikan International,Ketchikan,AK,USA,55.35556861,-131.71374
KTS,Brevig Mission,Brevig Mission,AK,USA,65.33136111,-166.4631667
KVC,King Cove,King Cove,AK,USA,55.1163475,-162.2662272
KVL,Kivalina,Kivalina,AK,USA,67.73125333,-164.5518019
KWT,Kwethluk,Kwethluk,AK,USA,60.80425194,-161.44535
KXA,Kasaan SPB,Kasaan,AK,USA,55.53741389,-132.3975144
KYK,Karluk,Karluk,AK,USA,57.56706389,-154.4503714
KYU,Koyukuk,Koyukuk,AK,USA,64.87714278,-157.7158358
L04,Holtville,Holtville,CA,USA,32.84032361,-115.2674806
L05,Kern Valley,Kernville,CA,USA,35.72828472,-118.4198069
L06,Furnace Creek,Death Valley National Park,CA,USA,36.46383694,-116.8814425
L08,Borrego Valley,Borrego Springs,CA,USA,33.25902778,-116.3209722
L12,Redlands Municipal,Redlands,CA,USA,34.08526167,-117.1463789
L15,Henderson,Las Vegas,NV,USA,35.97636444,-115.1327708
L17,Taft-Kern County,Taft,CA,USA,35.14107806,-119.4412294
L18,Fallbrook Community Airpark,Fallbrook,CA,USA,33.35419806,-117.2508686
L19,Wasco-Kern County,Wasco,CA,USA,35.61967889,-119.3537242
L26,Hesperia,Hesperia,CA,USA,34.37722333,-117.3158783
L31,Greater St. Tammany Parish,Covington,LA,USA,30.44505417,-89.98887889
L35,Big Bear City,Big Bear,CA,USA,34.26361944,-116.854475
L38,Louisiana Regional,Gonzales,LA,USA,30.17135306,-90.94039583
L39,Leesville,Leesville,LA,USA,31.16819444,-93.34245833
L42,Allen Parish,Oakdale,LA,USA,30.75016667,-92.68847222
L45,Bakersfield Municipal,Bakersfield,CA,USA,35.32483333,-118.9958333
L49,South Lafourche,Galliano,LA,USA,29.44482222,-90.26111667
L52,Oceano County,Oceano,CA,USA,35.10136472,-120.6221153
L67,Rialto Municipal,Rialto,CA,USA,34.12934361,-117.4016303
L70,Agua Dulce Airpark,Agua Dulce,CA,USA,34.50415889,-118.3128561
L71,California City Municipal,California City,CA,USA,35.15125306,-118.0166667
L72,Trona,Trona,CA,USA,35.81245333,-117.3272783
L75,Southland,Sulphur,LA,USA,30.13138889,-93.37611111
L83,Thibodaux Municipal,Thibodaux,LA,USA,29.74779194,-90.83289889
L84,Lost Hills-Kern County,Lost Hills,CA,USA,35.62357083,-119.6862383
L92,Alamo Landing,Alamo,NV,USA,37.36246083,-115.1944622
LAA,Lamar Muni,Lamar,CO,USA,38.06969444,-102.6885
LAF,Purdue University,Lafayette,IN,USA,40.41231694,-86.93689889
LAL,Lakeland Linder Regional,Lakeland,FL,USA,27.98891667,-82.01855556
LAM,Los Alamos,Los Alamos,NM,USA,35.87980194,-106.2694153
LAN,Capital City,Lansing,MI,USA,42.7787,-84.58735806
LAR,Laramie Regional,Laramie,WY,USA,41.31205,-105.6749864
LAS,McCarran International,Las Vegas,NV,USA,36.08036111,-115.1523333
LAW,Lawton-Ft Sill Regional,Lawton,OK,USA,34.56771444,-98.41663667
LAX,Los Angeles International,Los Angeles,CA,USA,33.94253611,-118.4080744
LBB,Lubbock International,Lubbock,TX,USA,33.66363889,-101.8227778
LBE,Arnold Palmer Regional,Latrobe,PA,USA,40.27594,-79.40479722
LBF,North Platte Regional,North Platte,NE,USA,41.12621194,-100.6836542
LBL,Liberal Municipal,Liberal,KS,USA,37.04420944,-100.9598611
LBO,Floyd W Jones Lebanon,Lebanon,MO,USA,37.64718056,-92.65375778
LBT,Lumberton Municipal,Lumberton,NC,USA,34.60991667,-79.05944444
LBX,Brazoria County,Angleton,TX,USA,29.10863889,-95.46208056
LCG,Wayne Municipal,Wayne,NE,USA,42.24188889,-96.98141667
LCH,Lake Charles Regional,Lake Charles,LA,USA,30.1260975,-93.22340361
LCI,Laconia Municipal,Laconia,NH,USA,43.57272806,-71.41890028
LCK,Rickenbacker International,Columbus,OH,USA,39.81375917,-82.92786472
LCQ,Lake City Municipal,Lake City,FL,USA,30.18205556,-82.57686111
LDJ,Linden,Linden,NJ,USA,40.61744722,-74.24459417
LDM,Mason County,Ludington,MI,USA,43.96253278,-86.40791528
LEB,Lebanon Municipal,Lebanon,NH,USA,43.62637222,-72.30426722
LEE,Leesburg Regional,Leesburg,FL,USA,28.82274417,-81.80900722
LEM,Lemmon Municipal,Lemmon,SD,USA,45.91869722,-102.1061778
LEW,Auburn-Lewiston Municipal,Auburn-Lewiston,ME,USA,44.04847278,-70.2835075
LEX,Blue Grass,Lexington,KY,USA,38.03697222,-84.60538889
LFK,Lufkin-Angelina County,Lufkin,TX,USA,31.23401389,-94.75
LFT,Lafayette Regional,Lafayette,LA,USA,30.20527972,-91.987655
LGA,LaGuardia,New York,NY,USA,40.77724306,-73.87260917
LGB,Long Beach (Daugherty),Long Beach,CA,USA,33.81772222,-118.1516111
LGC,LaGrange-Callaway,Lagrange,GA,USA,33.00884694,-85.07260556
LGD,La Grande/Union County,La Grande,OR,USA,45.29020944,-118.0071108
LGU,Logan-Cache,Logan,UT,USA,41.78773083,-111.8526822
LHD,Lake Hood SPB,Anchorage,AK,USA,61.18000361,-149.9719322
LHM,Lincoln Regional,Lincoln,CA,USA,38.90916111,-121.3513361
LHQ,Fairfield County,Lancaster,OH,USA,39.75564722,-82.65711
LHV,Wm T Piper Memorial,Lock Haven,PA,USA,41.13618028,-77.42053556
LHX,La Junta Muni,La Junta,CO,USA,38.05134111,-103.5106908
LHZ,Franklin County,Louisburg,NC,USA,36.02334528,-78.33027139
LIC,Limon Municipal,Limon,CO,USA,39.272765,-103.6663392
LIH,Lihue,Lihue,HI,USA,21.97598306,-159.3389581
LIT,Adams,Little Rock,AR,USA,34.72939611,-92.22424556
LJF,Litchfield Municipal,Litchfield,MN,USA,45.09712889,-94.50726833
LKP,Lake Placid,Lake Placid,NY,USA,44.26447361,-73.96186639
LKR,Lancaster County,Lancaster,SC,USA,34.72291667,-80.85458333
LKU,Louisa County / Freeman,Louisa,VA,USA,38.00983333,-77.97013889
LKV,Lake County,Lakeview,OR,USA,42.16111111,-120.3990703
LLJ,Challis,Challis,ID,USA,44.52297806,-114.2175642
LLQ,Monticello Municipal,Monticello,AR,USA,33.6385525,-91.75101833
LLU,Lamar Municipal,Lamar,MO,USA,37.4894925,-94.31150444
LMS,Louisville-Winston County,Louisville,MS,USA,33.14620944,-89.06247917
LMT,Klamath Falls International,Klamath Falls,OR,USA,42.15614361,-121.7332081
LNA,Palm Beach County Park,Lantana,FL,USA,26.593,-80.08505556
LNC,Lancaster,Lancaster,TX,USA,32.57919111,-96.71905111
LND,Hunt,Lander,WY,USA,42.81523611,-108.7298392
LNK,Lincoln Municipal,Lincoln,NE,USA,40.85097222,-96.75925
LNL,Kings Land O' Lakes,Land O' Lakes,WI,USA,46.15387722,-89.21194417
LNN,Lost Nation,Willoughby,OH,USA,41.68391667,-81.39030556
LNP,Lonesome Pine,Wise,VA,USA,36.98743194,-82.53017361
LNS,Lancaster,Lancaster,PA,USA,40.12171528,-76.29609778
LNY,Lanai,Lanai City,HI,USA,20.78561111,-156.9514181
LOL,Derby,Lovelock,NV,USA,40.066405,-118.5651664
LOT,Lewis University,Chicago/Romeoville,IL,USA,41.60844444,-88.09094444
LOU,Bowman,Louisville,KY,USA,38.228,-85.66372222
LOZ,London-Corbin  Magee,London,KY,USA,37.08727778,-84.07677778
LPC,Lompoc,Lompoc,CA,USA,34.66561028,-120.4667883
LPR,Lorain Co Regional,Lorain/Elyria,OH,USA,41.34427778,-82.17763889
LQK,Pickens County,Pickens,SC,USA,34.80997222,-82.70288889
LQR,Larned-Pawnee County,Larned,KS,USA,38.20809667,-99.08607306
LRD,Laredo International,Laredo,TX,USA,27.54373861,-99.46154361
LRG,Lincoln Regional,Lincoln,ME,USA,45.36216083,-68.53474694
LRJ,Le Mars Municipal,Le Mars,IA,USA,42.77801778,-96.19368944
LRU,Las Cruces International,Las Cruces,NM,USA,32.28941667,-106.9219722
LSB,Lordsburg Municipal,Lordsburg,NM,USA,32.33278083,-108.6909742
LSE,La Crosse Municipal,La Crosse,WI,USA,43.87937972,-91.25653778
LSK,Lusk Muni,Lusk,WY,USA,42.75380806,-104.4045536
LSN,Los Banos Municipal,Los Banos,CA,USA,37.06290556,-120.8692511
LUG,Ellington,Lewisburg,TN,USA,35.506975,-86.80388611
LUK,Cincinnati Muni-Lunken,Cincinnati,OH,USA,39.10334417,-84.41861417
LUL,Hesler-Noble,Laurel,MS,USA,31.67255139,-89.17222417
LUP,Kalaupapa,Kalaupapa,HI,USA,21.21104028,-156.9735972
LVJ,Clover,Houston,TX,USA,29.52130556,-95.24216667
LVK,Livermore Municipal,Livermore,CA,USA,37.69339944,-121.8203519
LVM,Mission,Livingston,MT,USA,45.69938889,-110.4483056
LVN,Airlake,Minneapolis,MN,USA,44.62785361,-93.22810806
LVS,Las Vegas Municipal,Las Vegas,NM,USA,35.65422222,-105.1423889
LWB,Greenbrier Valley,Lewisburg,WV,USA,37.85830556,-80.39947222
LWC,Lawrence Municipal,Lawrence,KS,USA,39.01115222,-95.21657694
LWD,Lamoni Municipal,Lamoni,IA,USA,40.63333306,-93.90217028
LWL,Wells Municipal/Harriet,Wells,NV,USA,41.11853306,-114.9222661
LWM,Lawrence Municipal,Lawrence,MA,USA,42.71720944,-71.12343
LWS,Lewiston-Nez Perce County,Lewiston,ID,USA,46.37449806,-117.0153944
LWT,Lewistown Muni,Lewistown,MT,USA,47.04913944,-109.4666006
LWV,Lawrenceville-Vincennes Municipal,Lawrenceville,IL,USA,38.76429639,-87.60549556
LXL,Little Falls - Morrison County,Little Falls,MN,USA,45.94943778,-94.34708472
LXN,Lexington (Jim Kelly),Lexington,NE,USA,40.791,-99.77727778
LXT,Lee's Summit Municipal,Lee's Summit,MO,USA,38.95975,-94.37158333
LXV,Lake County,Leadville,CO,USA,39.2202675,-106.3166906
LXY,Mexia-Limestone County,Mexia,TX,USA,31.63983472,-96.51472222
LYH,Lynchburg Municipal-Preston Glenn,Lynchburg,VA,USA,37.32668528,-79.20043056
LYO,Lyons-Rice County Municipal,Lyons,KS,USA,38.34261472,-98.22709639
LZU,Gwinnett County,Lawrenceville,GA,USA,33.97807611,-83.96237722
M01,General Dewitt Spain,Memphis,TN,USA,35.20069278,-90.05397694
M02,Dickson Municipal,Dickson,TN,USA,36.12931722,-87.43007056
M03,Dennis F Cantrell,Conway,AR,USA,35.08080778,-92.42496167
M04,Covington Municipal,Covington,TN,USA,35.583365,-89.58722167
M05,Caruthersville Memorial,Caruthersville,MO,USA,36.17506917,-89.67508
M08,William L. Whitehurst,Bolivar,TN,USA,35.21445944,-89.04336222
M09,Piedmont Municipal,Piedmont,MO,USA,37.12671694,-90.7128975
M11,Copiah County,Crystal Springs,MS,USA,31.90293639,-90.36870222
M13,Poplarville-Pearl River County,Poplarville,MS,USA,30.78602056,-89.50450694
M15,Perry County,Linden,TN,USA,35.59590306,-87.87669361
M16,John Bell Williams,Raymond,MS,USA,32.30334111,-90.40848333
M17,Bolivar Municipal,Bolivar,MO,USA,37.59693194,-93.34765
M18,Hope Municipal,Hope,AR,USA,33.72008889,-93.65884556
M19,Newport Municipal,Newport,AR,USA,35.63771778,-91.17637556
M21,Muhlenberg County,Greenville,KY,USA,37.22561111,-87.15752778
M22,Russellville Municipal,Russellville,AL,USA,34.44953972,-87.71030833
M23,James H. Easom,Newton,MS,USA,32.31181111,-89.13589194
M24,Dean Griffin Memorial,Wiggins,MS,USA,30.84324389,-89.15977333
M25,Mayfield-Graves County,Mayfield,KY,USA,36.76911111,-88.58472222
M27,Waldron Municipal,Waldron,AR,USA,34.87509944,-94.10993056
M29,Hassel,Clifton,TN,USA,35.38507528,-87.96752833
M30,Metropolis Municipal,Metropolis,IL,USA,37.18588722,-88.75061
M32,Lake Village Municipal,Lake Village,AR,USA,33.3459775,-91.31569833
M33,Sumner County Regional,Gallatin,TN,USA,36.37684472,-86.40875861
M34,Kentucky Dam State Park,Gilbertsville,KY,USA,37.00950028,-88.29586639
M36,Frank Federer Memorial,Brinkley,AR,USA,34.88000194,-91.1764375
M37,Ruleville-Drew,Drew,MS,USA,33.77639167,-90.52500833
M39,Mena Intermountain Municipal,Mena,AR,USA,34.54539444,-94.20265278
M40,Monroe County,Aberdeen-Amory,MS,USA,33.87374861,-88.48967833
M41,Holly Springs-Marshall County,Holly Springs,MS,USA,34.80434611,-89.5211075
M43,Prentiss-Jefferson Davis County,Prentiss,MS,USA,31.59544583,-89.90619056
M44,Houston Municipal,Houston,MS,USA,33.89177944,-89.02367194
M46,Colstrip,Colstrip,MT,USA,45.85285,-106.7092722
M48,Houston Memorial,Houston,MO,USA,37.33009167,-91.97316944
M52,Franklin-Wilkins,Lexington,TN,USA,35.65131944,-88.37893444
M53,Humboldt Municipal,Humboldt,TN,USA,35.80218,-88.87494944
M54,Lebanon Municipal,Lebanon,TN,USA,36.19041667,-86.31569444
M58,Monett Municipal,Monett,MO,USA,36.90621528,-94.01275833
M59,Richton-Perry County,Richton,MS,USA,31.31739944,-88.93504778
M60,Woodruff County,Augusta,AR,USA,35.27175278,-91.27040417
M65,Wynne Municipal,Wynne,AR,USA,35.23160167,-90.76155111
M70,Pocahontas Municipal,Pocahontas,AR,USA,36.24551111,-90.95520444
M72,New Albany-Union County,New Albany,MS,USA,34.54722222,-89.02416667
M73,Almyra Municipal,Almyra,AR,USA,34.41232833,-91.46634722
M75,Malta,Malta,MT,USA,48.36694167,-107.9193444
M76,Picayune Municipal,Picayune,MS,USA,30.48748472,-89.65119306
M77,Howard County,Nashville,AR,USA,33.99673833,-93.83813583
M78,Malvern Municipal,Malvern,AR,USA,34.33331583,-92.76149944
M79,John H Hooks Jr Memorial,Rayville,LA,USA,32.48633611,-91.77087528
M82,Madison County Executive,Huntsville,AL,USA,34.85645028,-86.55621472
M83,McCharen,West Point,MS,USA,33.58403556,-88.66668694
M89,Dexter B. Florence Memorial,Arkadelphia,AR,USA,34.09984639,-93.06611694
M91,Springfield-Robertson County,Springfield,TN,USA,36.53726194,-86.92068917
M95,Richard Arthur,Fayette,AL,USA,33.71221972,-87.81504639
M97,Tunica Municipal,Tunica,MS,USA,34.69232306,-90.35065389
M99,Saline County/Watts,Benton,AR,USA,34.55656472,-92.60693972
MAC,Herbert Smart Downtown,Macon,GA,USA,32.82213889,-83.56202778
MAE,Madera Municipal,Madera,CA,USA,36.9857175,-120.1119844
MAF,Midland International,Midland,TX,USA,31.94252778,-102.2019139
MAI,Marianna Municipal,Marianna,FL,USA,30.83780556,-85.18188889
MAL,Malone-Dufort,Malone,NY,USA,44.85365722,-74.32894972
MAO,Marion County,Marion,SC,USA,34.18116667,-79.33472222
MAW,Malden Municipal,Malden,MO,USA,36.60055694,-89.99220278
MAZ,Eugenio Maria De Hostos,Mayaguez,PR,USA,18.25569444,-67.14847222
MBG,Mobridge Municipal,Mobridge,SD,USA,45.54650361,-100.4079192
MBL,Manistee County Blacker,Manistee,MI,USA,44.27319722,-86.2490025
MBO,Bruce Campbell,Madison,MS,USA,32.43866444,-90.10309222
MBS,Mbs International,Saginaw,MI,USA,43.53291472,-84.07964722
MBT,Murfreesboro Municipal,Murfreesboro,TN,USA,35.87748444,-86.37753222
MBY,Omar N Bradley,Moberly,MO,USA,39.46392583,-92.42759778
MCB,McComb-Pike County,McComb,MS,USA,31.17845444,-90.47187528
MCD,Mackinac Island,Mackinac Island,MI,USA,45.86493444,-84.63734444
MCE,Merced Municipal/MacReady,Merced,CA,USA,37.28472861,-120.5138858
MCG,McGrath,McGrath,AK,USA,62.95287361,-155.6057625
MCI,Kansas City International,Kansas City,MO,USA,39.29760528,-94.71390556
MCK,McCook Municipal,McCook,NE,USA,40.20638889,-100.5918056
MCN,Middle Georgia Regional,Macon,GA,USA,32.69284944,-83.64921083
MCO,Orlando International,Orlando,FL,USA,28.42888889,-81.31602778
MCW,Mason City Municipal,Mason City,IA,USA,43.1577925,-93.33126056
MCX,White County,Monticello,IN,USA,40.70881639,-86.76676139
MCZ,Martin County,Williamston,NC,USA,35.86219306,-77.17820278
MDD,Midland Airpark,Midland,TX,USA,32.03652444,-102.1010278
MDF,Mooreland Municipal,Mooreland,OK,USA,36.48475778,-99.19415778
MDH,Southern Illinois,Carbondale,IL,USA,37.77809583,-89.25203111
MDR,Medfra,Medfra,AK,USA,63.10577694,-154.7189806
MDS,Madison Municipal,Madison,SD,USA,44.01597222,-97.08593333
MDT,Harrisburg Intl,Harrisburg,PA,USA,40.19349528,-76.76340361
MDW,Chicago Midway,Chicago,IL,USA,41.7859825,-87.75242444
MDZ,Taylor County,Medford,WI,USA,45.10097556,-90.30341
MEB,Laurinburg-Maxton,Maxton,NC,USA,34.79193917,-79.36584778
MEI,Key,Meridian,MS,USA,32.33313333,-88.75120556
MEJ,Meade Municipal,Meade,KS,USA,37.27938889,-100.3563056
MEM,Memphis International,Memphis,TN,USA,35.04241667,-89.97666667
MER,Castle,Atwater,CA,USA,37.38048056,-120.5681889
MEV,Minden-Tahoe,Minden,NV,USA,39.00030889,-119.7508064
MEY,Mapleton Municipal,Mapleton,IA,USA,42.178295,-95.79364528
MFD,Mansfield Lahm Municipal,Mansfield,OH,USA,40.82141667,-82.51663889
MFE,McAllen Miller International,McAllen,TX,USA,26.17583333,-98.23861111
MFI,Marshfield Municipal,Marshfield,WI,USA,44.63687972,-90.18932667
MFR,Rogue Valley International,Medford,OR,USA,42.37422778,-122.8734978
MFV,Accomack County,Melfa,VA,USA,37.64688889,-75.76105556
MGC,Michigan City Municipal,Michigan City,IN,USA,41.70331694,-86.82124167
MGJ,Orange Cty,Montgomery,NY,USA,41.50998278,-74.26465056
MGM,Montgomery Regional Apt,Montgomery,AL,USA,32.30064417,-86.39397611
MGR,Moultrie Municipal,Moultrie,GA,USA,31.08490917,-83.80325528
MGW,Morgantown Muni-Walter L. Bill Hart Fld.,Morgantown,WV,USA,39.6429075,-79.91631417
MGY,Dayton Wright Brothers,Dayton,OH,USA,39.58897222,-84.22486111
MHE,Mitchell Municipal,Mitchell,SD,USA,43.77483333,-98.03861111
MHK,Manhattan Regional,Manhattan,KS,USA,39.14096722,-96.67083278
MHL,Marshall Memorial Municipal,Marshall,MO,USA,39.09575472,-93.20287889
MHM,Minchumina,Minchumina,AK,USA,63.880565,-152.3006756
MHP,Metter Municipal,Metter,GA,USA,32.37388889,-82.07919444
MHR,Sacramento Mather,Sacramento,CA,USA,38.55389694,-121.2975908
MHT,Manchester,Manchester,NH,USA,42.93451639,-71.43705583
MHV,Mojave,Mojave,CA,USA,35.05936472,-118.1518561
MIA,Miami International,Miami,FL,USA,25.79325,-80.29055556
MIB,Minot AFB,NA,NA,USA,48.415769,-101.358039
MIC,Crystal,Minneapolis,MN,USA,45.06198611,-93.3539375
MIE,Delaware County,Muncie,IN,USA,40.24234806,-85.39586
MIO,Miami Municipal,Miami,OK,USA,36.90922083,-94.88750028
MIT,Shafter-Minter,Shafter,CA,USA,35.50592944,-119.1915236
MIV,Millville Muni,Millville,NJ,USA,39.36780556,-75.07222222
MIW,Marshalltown Municipal,Marshalltown,IA,USA,42.11272639,-92.91778778
MJQ,Jackson Municipal,Jackson,MN,USA,43.65004111,-94.98654611
MJX,Robert J. Miller Airpark,Toms River,NJ,USA,39.92749806,-74.29237917
MKA,Miller Municipal,Miller,SD,USA,44.52524444,-98.95811444
MKC,Downtown,Kansas City,MO,USA,39.12324111,-94.592735
MKE,General Mitchell International,Milwaukee,WI,USA,42.94722222,-87.89658333
MKG,Muskegon County,Muskegon,MI,USA,43.16948806,-86.23822306
MKJ,Mountain Empire,Marion,VA,USA,36.8948525,-81.349955
MKK,Molokai,Kaunakakai,HI,USA,21.15288583,-157.0962561
MKL,McKellar-Sipes Regional,Jackson,TN,USA,35.59987944,-88.91561611
MKO,Davis,Muskogee,OK,USA,35.65773028,-95.36164889
MKT,Mankato Regional,Mankato,MN,USA,44.22164528,-93.91874333
MKV,Marksville Municipal,Marksville,LA,USA,31.09466,-92.06906861
MKY,Marco Island,Marco Island,FL,USA,25.99502778,-81.67252778
MLB,Melbourne International,Melbourne,FL,USA,28.10275,-80.64580556
MLC,McAlester Regional,McAlester,OK,USA,34.88240194,-95.78346278
MLE,Millard,Omaha,NE,USA,41.196,-96.11227778
MLF,Milford Municipal,Milford,UT,USA,38.4266325,-113.0124564
MLI,Quad City,Moline,IL,USA,41.44852639,-90.50753917
MLJ,Baldwin County,Milledgeville,GA,USA,33.15419444,-83.24061111
MLL,Marshall,Marshall,AK,USA,61.8659225,-162.0690456
MLS,Frank Wiley,Miles City,MT,USA,46.42795972,-105.8862397
MLT,Millinocket Municipal,Millinocket,ME,USA,45.64783611,-68.68556194
MLU,Monroe Regional,Monroe,LA,USA,32.51086556,-92.03768778
MLY,Manley Hot Springs,Manley Hot Springs,AK,USA,64.99756472,-150.6441297
MMH,Mammoth Yosemite,Mammoth Lakes,CA,USA,37.62404861,-118.8377722
MMI,McMinn County,Athens,TN,USA,35.39730333,-84.56256861
MMK,Meriden-Markham Municipal,Meriden,CT,USA,41.50871472,-72.82947833
MML,Marshall Muni - Ryan,Marshall,MN,USA,44.45006611,-95.82234028
MMU,Morristown Municipal,Morristown,NJ,USA,40.79935,-74.41487472
MMV,McMinnville Muni,McMinnville,OR,USA,45.19444444,-123.1359444
MNF,Mountain View,Mountain View,MO,USA,36.99282694,-91.71445611
MNI,Clarendon County,Manning,SC,USA,33.58711111,-80.20866667
MNM,Menominee-Marinette Twin County,Menominee,MI,USA,45.12665028,-87.63844056
MNN,Marion Municipal,Marion,OH,USA,40.61625,-83.06347222
MNV,Monroe County,Madisonville,TN,USA,35.54537222,-84.380235
MNZ,Hamilton Municipal,Hamilton,TX,USA,31.66592639,-98.1486375
MO6,Washington Memorial,Washington,MO,USA,38.59163472,-90.99761444
MO85,Lawrence Smith Memorial,Harrisonville,MO,USA,38.61102222,-94.34213056
MOB,Mobile Regional,Mobile,AL,USA,30.69141667,-88.24283333
MOD,Modesto City-County-Harry Sham,Modesto,CA,USA,37.62581722,-120.9544214
MOP,Mount Pleasant Municipal,Mount Pleasant,MI,USA,43.62166833,-84.737485
MOR,Moore-Murrell,Morristown,TN,USA,36.17939639,-83.37544944
MOT,Minot International,Minot,ND,USA,48.25937778,-101.2803339
MOU,Mountain Village,Mountain Village,AK,USA,62.09536222,-163.6820594
MOX,Morris Municipal,Morris,MN,USA,45.56651667,-95.96763611
MPE,Philadelphia Municipal,Philadelphia,MS,USA,32.7995775,-89.12589472
MPJ,Petit Jean Park,Morrilton,AR,USA,35.13886306,-92.90919694
MPO,Pocono Mountains Muni,Mount Pocono,PA,USA,41.1374775,-75.37887833
MPR,McPherson,McPherson,KS,USA,38.35243722,-97.69133028
MPV,Edward F Knapp State,Barre-Montpelier,VT,USA,44.203505,-72.56232944
MPZ,Mount Pleasant Municipal,Mount Pleasant,IA,USA,40.94661389,-91.511075
MQB,Macomb Municipal,Macomb,IL,USA,40.52034556,-90.65246389
MQI,Dare County Regional,Manteo,NC,USA,35.91898806,-75.69553944
MQJ,Mount Comfort,Indianapolis,IN,USA,39.84348556,-85.89706389
MQT,Marquette County Airport,NA,NA,USA,46.353639,-87.395361
MQW,Telfair-Wheeler,McRae,GA,USA,32.09577778,-82.88002778
MQY,Smyrna,Smyrna,TN,USA,36.00897944,-86.52007667
MRB,Eastern Wv Reg/Shephard,Martinsburg,WV,USA,39.40193278,-77.98458139
MRC,Maury County,Columbia-Mt Pleasant,TN,USA,35.55413889,-87.17891667
MRF,Marfa Municipal,Marfa,TX,USA,30.37147222,-104.0166944
MRH,Michael J. Smith,Beaufort,NC,USA,34.73355028,-76.66059611
MRI,Merrill,Anchorage,AK,USA,61.21437861,-149.8461614
MRJ,Iowa County,Mineral Point,WI,USA,42.88532917,-90.23198583
MRN,Morganton-Lenoir,Morganton,NC,USA,35.82149222,-81.61073639
MRY,Monterey Peninsula,Monterey,CA,USA,36.5869825,-121.8429478
MSA,Mount Pleasant Municipal,Mount Pleasant,TX,USA,33.12936111,-94.97563889
MSL,Northwest Alabama Regional,Muscle Shoals,AL,USA,34.74532028,-87.61023222
MSN,Dane County Regional,Madison,WI,USA,43.13985778,-89.33751361
MSO,Missoula International,Missoula,MT,USA,46.91630556,-114.0905556
MSP,Minneapolis-St Paul Intl,Minneapolis,MN,USA,44.88054694,-93.2169225
MSS,Massena Int'l-Richards,Massena,NY,USA,44.93582722,-74.84554583
MSV,Sullivan Cty Intl,Monticello,NY,USA,41.70164917,-74.79501389
MSY,New Orleans International,New Orleans,LA,USA,29.99338889,-90.25802778
MTH,Florida Keys Marathon,Marathon,FL,USA,24.72614083,-81.05137806
MTJ,Montrose Regional,Montrose,CO,USA,38.50886722,-107.8938333
MTM,Metlakatla SPB,Metlakatla,AK,USA,55.13104528,-131.5780675
MTN,Martin State,Baltimore,MD,USA,39.32566333,-76.41376556
MTO,Coles County Memorial,Mattoon-Charleston,IL,USA,39.47793722,-88.27923833
MTP,Montauk,Montauk,NY,USA,41.07694333,-71.92039972
MTV,Blue Ridge,Martinsville,VA,USA,36.63074861,-80.01834917
MTW,Manitowoc County,Manitowoc,WI,USA,44.1287725,-87.68058472
MUE,Waimea-Kohala,Kamuela,HI,USA,20.00132694,-155.6681072
MUT,Muscatine Municipal,Muscatine,IA,USA,41.36786333,-91.14821639
MVC,Monroe County,Monroeville,AL,USA,31.45805306,-87.35104028
MVE,Montevideo-Chippewa County,Montevideo,MN,USA,44.96905556,-95.71025
MVI,Monte Vista Muni,Monte Vista,CO,USA,37.52855833,-106.0460533
MVL,Morrisville-Stowe State,Morrisville,VT,USA,44.53460806,-72.61400444
MVM,Machias Valley,Machias,ME,USA,44.70311111,-67.47861111
MVN,Mt Vernon-Outland,Mt. Vernon,IL,USA,38.32335444,-88.85847917
MVY,Marthas Vineyard,Marthas Vineyard,MA,USA,41.39302583,-70.6143325
MWA,Williamson County,Marion,IL,USA,37.75313528,-89.01159694
MWC,Lawrence J Timmerman,Milwaukee,WI,USA,43.11092694,-88.03442194
MWH,Grant County,Moses Lake,WA,USA,47.20770806,-119.3201897
MWK,Mount Airy-Surry County,Mount Airy,NC,USA,36.459735,-80.55295722
MWL,Mineral Wells Municipal,Mineral Wells,TX,USA,32.78160556,-98.060175
MWM,Windom Municipal,Windom,MN,USA,43.91340167,-95.10940833
MWO,Hook Field Municipal,Middletown,OH,USA,39.53102778,-84.39527778
MXA,Manila Municipal,Manila,AR,USA,35.89444444,-90.15456944
MXO,Monticello Municipal,Monticello,IA,USA,42.22611111,-91.16708333
MYF,Montgomery,San Diego,CA,USA,32.81573306,-117.1395664
MYK,May Creek,May Creek,AK,USA,61.33567417,-142.686775
MYL,McCall,McCall,ID,USA,44.88879556,-116.1017497
MYR,Myrtle Beach International,Myrtle Beach,SC,USA,33.67975,-78.92833333
MYU,Mekoryuk,Mekoryuk,AK,USA,60.37142,-166.2706083
MYV,Yuba County,Marysville,CA,USA,39.09777278,-121.569825
MYZ,Marysville Municipal,Marysville,KS,USA,39.85416833,-96.63021389
MZJ,Pinal Airpark,Marana,AZ,USA,32.50984389,-111.3253339
MZZ,Marion Municipal,Marion,IN,USA,40.49037278,-85.67914389
N00,Maben,Lexington,NY,USA,42.27230778,-74.39403667
N03,Cortland Cty-Chase,Cortland,NY,USA,42.59264528,-76.2148825
N04,Griswold,Madison,CT,USA,41.27118222,-72.54972972
N07,Lincoln Park,Lincoln Park,NJ,USA,40.94752444,-74.31450139
N10,Perkiomen Valley,Collegeville,PA,USA,40.20404833,-75.43026306
N12,Lakewood,Lakewood,NJ,USA,40.0667825,-74.17764167
N13,Bloomsburg Muni,Bloomsburg,PA,USA,40.99778111,-76.43605583
N14,Flying W,Lumbrerton,NJ,USA,39.93427778,-74.80725
N23,Sidney Muni,Sidney,NY,USA,42.30258,-75.41595639
N24,Questa Municipal Nr 2,Questa,NM,USA,36.80030556,-105.5975
N25,Westport,"Westport, NY",NY,USA,44.15838611,-73.43290444
N27,Bradford County,Towanda,PA,USA,41.74324028,-76.44457083
N29,Magdalena,Magdalena,NM,USA,34.09450778,-107.2978142
N30,Cherry Ridge,Honesdale,PA,USA,41.51533861,-75.25148139
N35,Punxsutawney Muni,Punxsutawney,PA,USA,40.96667472,-78.93000528
N37,Monticello,Monticello,NY,USA,41.62249167,-74.70141111
N38,Grand Canyon State,Wellsboro,PA,USA,41.72790028,-77.39651139
N40,Sky Manor,Pittstown,NJ,USA,40.56626889,-74.97864139
N47,Pottstown Muni,Pottstown,PA,USA,40.26040083,-75.67085306
N51,Solberg-Hunterdon,Readington,NJ,USA,40.58286278,-74.73656222
N53,Stroudsburg-Pocono,East Stroudsburg,PA,USA,41.03587167,-75.16067889
N57,New Garden Flying,Toughkenamon,PA,USA,39.83052639,-75.76974472
N66,Oneonta Muni,Oneonta,NY,USA,42.52476694,-75.06446167
N67,Wings,Ambler,PA,USA,40.13647333,-75.26702972
N68,Chambersburg Muni,Chambersburg,PA,USA,39.97295167,-77.64326778
N69,Stormville,Stormville,NY,USA,41.57698222,-73.73235278
N72,Warwick Muni,Warwick,NY,USA,41.28759361,-74.28709472
N73,Red Lion,Vincentown,NJ,USA,39.90415167,-74.74954917
N79,Northumberland Cty,Shamokin,PA,USA,40.83692306,-76.55245611
N81,Hammonton Muni,Hammonton,NJ,USA,39.66746889,-74.75773444
N82,Wurtsboro-Sullivan Cty,Wurtsboro,NY,USA,41.59720444,-74.45840722
N85,Alexandria,Pittstown,NJ,USA,40.58757389,-75.01942056
N87,Trenton-Robbinsville,Robbinsville,NJ,USA,40.21394333,-74.60179472
N89,Joseph Y. Resnick,Ellenville,NY,USA,41.72787111,-74.37737583
N93,New Golovin,Golovin,AK,USA,64.55305556,-163.0088889
N99,Brandywine,West Chester,PA,USA,39.99472222,-75.58333333
NC14,Rockingham County NC Shiloh,Reidsville,NC,USA,36.43722083,-79.85101
NC67,Ashe County,West Jefferson,NC,USA,36.43243111,-81.41968472
ND06,Cavalier Municipal,Cavalier,ND,USA,48.78388139,-97.62981028
ND12,Ellendale Municipal,Ellendale,ND,USA,46.01247194,-98.51287889
ND17,Harvey Municipal,Harvey,ND,USA,47.79123306,-99.93174222
ND26,Kenmare Municipal,Kenmare,ND,USA,48.66758278,-102.0475944
ND28,Lakota Municipal,Lakota,ND,USA,48.0313875,-98.32788111
ND29,La Moure Rott Municipal,La Moure (New Site),ND,USA,46.34663556,-98.28371
ND33,Linton Municipal,Linton,ND,USA,46.21830472,-100.2450028
ND44,Mott Municipal,Mott,ND,USA,46.359725,-102.3229389
ND66,Washburn Municipal,Washburn,ND,USA,47.35305,-101.0273681
NEW,Lakefront,New Orleans,LA,USA,30.04242056,-90.02825694
NH12,Plymouth Municipal,Plymouth,NH,USA,43.77923806,-71.75369056
NK03,Kamp,Durhamville,NY,USA,43.13472111,-75.64890417
NQA,Millington Municipal,Millington,TN,USA,35.35666667,-89.87027778
NRN,Norton Municipal,Norton,KS,USA,39.84914444,-99.89320583
NUL,Nulato,Nulato,AK,USA,64.72981944,-158.0731889
NVD,Nevada Municipal,Nevada,MO,USA,37.85206528,-94.30486472
NY0,Fulton Cty,Johnstown,NY,USA,42.99821222,-74.32955111
O02,Nervino,Beckwourth,CA,USA,39.82073556,-120.3543767
O05,Rogers,Chester,CA,USA,40.28235278,-121.2411683
O08,Colusa County,Colusa,CA,USA,39.17903,-121.9933611
O09,Round Valley,Covelo,CA,USA,39.79015444,-123.2664025
O11,Cherokee Nation,Stilwell,OK,USA,35.75703083,-94.64994417
O15,Turlock Municipal,Turlock,CA,USA,37.48743556,-120.6968669
O16,Garberville,Garberville,CA,USA,40.08597806,-123.8136397
O17,Nevada County  Air Park,Grass Valley,CA,USA,39.22402778,-121.0030833
O19,Kneeland,Eureka,CA,USA,40.7193,-123.9275531
O21,Hoopa,Hoopa,CA,USA,41.04290778,-123.6683894
O22,Columbia,Columbia,CA,USA,38.03042306,-120.4145556
O24,Lee Vining,Lee Vining,CA,USA,37.95825861,-119.1065375
O26,Lone Pine,Lone Pine,CA,USA,36.58826667,-118.0520314
O27,Oakdale,Oakdale,CA,USA,37.75634472,-120.8002089
O28,Ells Field-Willits Municipal,Willits,CA,USA,39.45129778,-123.3722844
O31,Healdsburg Municipal,Healdsburg,CA,USA,38.65352083,-122.8994397
O32,Reedley Municipal,Reedley,CA,USA,36.66633917,-119.4498483
O35,Hollis Municipal,Hollis,OK,USA,34.70839417,-99.90871194
O37,Haigh,Orland,CA,USA,39.72124194,-122.1466508
O41,Watts-Woodland,Woodland,CA,USA,38.67387639,-121.8720772
O42,Woodlake,Woodlake,CA,USA,36.39883833,-119.1073289
O43,Yerington Municipal,Yerington,NV,USA,39.00408444,-119.1579303
O45,Hooker Municipal,Hooker,OK,USA,36.85708306,-101.2270903
O46,Weed,Weed,CA,USA,41.47487,-122.4530739
O47,Prague Municipal,Prague,OK,USA,35.48201417,-96.71862944
O48,Little River,Little River,CA,USA,39.26203778,-123.7537347
O52,Sutter County,Yuba City,CA,USA,39.12655889,-121.6091328
O53,Medford Municipal,Medford,OK,USA,36.79058417,-97.74899722
O54,Lonnie Pool /Weaverville,Weaverville,CA,USA,40.7457,-122.92197
O57,Bryant,Bridgeport,CA,USA,38.26241917,-119.2257094
O59,Cedarville,Cedarville,CA,USA,41.55267139,-120.1663339
O60,Cloverdale Municipal,Cloverdale,CA,USA,38.7743525,-122.9922217
O61,Cameron Airpark,Cameron Park,CA,USA,38.68407028,-120.9871642
O65,Okeene Municipal,Okeene,OK,USA,36.11253667,-98.3086825
O68,Mariposa-Yosemite,Mariposa,CA,USA,37.51077,-120.0418439
O69,Petaluma Municipal,Petaluma,CA,USA,38.2578325,-122.6055406
O70,Westover Field Amador County,Jackson,CA,USA,38.37680111,-120.7939075
O81,Tulelake Municipal,Tulelake,CA,USA,41.88738,-121.3594331
O85,Benton,Redding,CA,USA,40.57487278,-122.4080642
O86,Trinity Center,Trinity Center,CA,USA,40.98320111,-122.6941889
O88,Rio Vista Municipal,Rio Vista,CA,USA,38.1935,-121.7023889
O89,Fall River Mills,Fall River Mills,CA,USA,41.01877417,-121.4333136
OAJ,Albert J Ellis,Jacksonville,NC,USA,34.82916444,-77.61213778
OAK,Metropolitan Oakland International,Oakland,CA,USA,37.72129083,-122.2207167
OAR,Marina Municipal,Marina,CA,USA,36.68190278,-121.7624492
OBE,Okeechobee County,Okeechobee,FL,USA,27.26282306,-80.84978306
OBU,Kobuk,Kobuk,AK,USA,66.90917056,-156.8610575
OCF,Ocala Regional/Jim Taylor,Ocala,FL,USA,29.17261111,-82.22416667
OCH,Nacogdoches-A.L. Mangham Jr. Regional,Nacogdoches,TX,USA,31.57802778,-94.70954167
OCQ,Oconto Municipal,Oconto,WI,USA,44.8735825,-87.9090525
OCW,Warren,Washington,NC,USA,35.57046806,-77.04981306
ODO,Odessa-Schlemeyer,Odessa,TX,USA,31.92056722,-102.3870892
ODX,Evelyn Sharp,Ord,NE,USA,41.62425,-98.95236111
OEB,Branch County Memorial,Coldwater,MI,USA,41.93344861,-85.052585
OEL,Oakley Municipal,Oakley,KS,USA,39.10994444,-100.8164444
OEO,L. O. Simenstad Municipal,Osceola,WI,USA,45.30858944,-92.69008056
OFK,Karl Stefan Memorial,Norfolk,NE,USA,41.98546389,-97.43511111
OFP,Hanover County Municipal,Richmond,VA,USA,37.7080325,-77.43601028
OGA,Searle,Ogallala,NE,USA,41.11961111,-101.7689444
OGB,Orangeburg Municipal,Orangeburg,SC,USA,33.46094444,-80.85891667
OGD,Ogden-Hinckley,Ogden,UT,USA,41.19594417,-112.012175
OGG,Kahului,Kahului,HI,USA,20.89864972,-156.4304578
OGM,Ontonagon County,Ontonagon,MI,USA,46.84547028,-89.36708806
OGS,Ogdensburg Intl,Ogdensburg,NY,USA,44.68185361,-75.46549917
OH17,Henry County,Napoleon,OH,USA,41.37427778,-84.06791667
OH21,Huron County,Norwalk,OH,USA,41.24476583,-82.55122722
OH30,Put In Bay,Put In Bay,OH,USA,41.63674333,-82.82833333
OIC,Lt Warren Eaton,Norwich,NY,USA,42.56655417,-75.52411167
OIN,Oberlin Municipal,Oberlin,KS,USA,39.83378278,-100.5394236
OJC,Johnson County Executive,Olathe,KS,USA,38.84760194,-94.73758583
OKB,Oceanside Municipal,Oceanside,CA,USA,33.21797639,-117.3515075
OKC,Will Rogers World,Oklahoma City,OK,USA,35.39308833,-97.60073389
OKK,Kokomo Municipal,Kokomo,IN,USA,40.5281775,-86.05899
OKM,Okmulgee Municipal,Okmulgee,OK,USA,35.66813889,-95.94869444
OKS,Garden County,Oshkosh,NE,USA,41.40097222,-102.3550278
OKV,Winchester Regional,Winchester,VA,USA,39.14352139,-78.14444444
OKZ,Kaolin,Sandersville,GA,USA,32.96672222,-82.83816667
OLD,Dewitt Field-Old Town Municipal,Old Town,ME,USA,44.9525,-68.67433333
OLE,Olean Muni,Olean,NY,USA,42.24006611,-78.371685
OLF,L M Clayton,Wolf Point,MT,USA,48.09451778,-105.5750536
OLM,Olympia,Olympia,WA,USA,46.9705,-122.9022083
OLS,Nogales International,Nogales,AZ,USA,31.41772222,-110.8478889
OLU,Columbus Municipal,Columbus,NE,USA,41.448,-97.34263889
OLV,Olive Branch,Olive Branch,MS,USA,34.97875,-89.78683333
OLY,Olney-Noble,Olney-Noble,IL,USA,38.72182722,-88.17643278
OLZ,Oelwein Municipal,Oelwein,IA,USA,42.68084472,-91.97447833
OMA,Eppley Airfield,Omaha,NE,USA,41.30251861,-95.89417306
OME,Nome,Nome,AK,USA,64.51220222,-165.4452458
OMH,Orange County,Orange,VA,USA,38.24721639,-78.04561028
OMK,Omak,Omak,WA,USA,48.46440222,-119.5180503
OMN,Ormond Beach Municipal,Ormond Beach,FL,USA,29.30113889,-81.11380556
ONA,Winona Muni-Max Conrad,Winona,MN,USA,44.07721306,-91.70831694
ONL,O Neill Municipal,O Neill,NE,USA,42.46988889,-98.68805556
ONM,Socorro Municipal,Socorro,NM,USA,34.02247222,-106.9031389
ONO,Ontario Muni,Ontario,OR,USA,44.02052417,-117.013635
ONP,Newport Muni,Newport,OR,USA,44.58036111,-124.0579167
ONT,Ontario International,Ontario,CA,USA,34.056,-117.6011944
ONY,Olney Municipal,Olney,TX,USA,33.35088056,-98.81916667
ONZ,Grosse Ile Municipal,Detroit - Grosse Ile,MI,USA,42.09860472,-83.16105861
OOA,Oskaloosa Municipal,Oskaloosa,IA,USA,41.22614944,-92.49388278
OOH,Hoonah SPB,Hoonah,AK,USA,58.11215944,-135.451805
OOK,Toksook Bay,Toksook Bay,AK,USA,60.53337639,-165.1139636
OPF,Opa-Locka,Miami,FL,USA,25.907,-80.27838889
OPL,St Landry Parish - Ahart,Opelousas,LA,USA,30.55840556,-92.099375
OPN,Thomaston-Upton County,Thomaston,GA,USA,32.95458861,-84.26315222
OQU,Quonset State,North Kingstown,RI,USA,41.5971525,-71.41215333
OQW,Maquoketa Municipal,Maquoketa,IA,USA,42.050075,-90.73880472
OR33,Boardman,Boardman,OR,USA,45.814825,-119.8205006
ORB,Orr Regional,Orr,MN,USA,48.01592194,-92.85605139
ORC,Orange City Municipal,Orange City,IA,USA,42.99026444,-96.06279667
ORD,Chicago O'Hare International,Chicago,IL,USA,41.979595,-87.90446417
ORE,Orange Municipal,Orange,MA,USA,42.57011889,-72.28860667
ORF,Norfolk International,Norfolk,VA,USA,36.89461111,-76.20122222
ORG,Orange County,Orange,TX,USA,30.06916667,-93.80091667
ORH,Worcester Regional,Worcester,MA,USA,42.26733944,-71.87570944
ORI,Port Lions,Port Lions,AK,USA,57.8853775,-152.8461011
ORL,Executive,Orlando,FL,USA,28.54547222,-81.33294444
ORS,Orcas Island,Eastsound,WA,USA,48.70816,-122.9137961
ORT,Northway,Northway,AK,USA,62.96133361,-141.9291369
ORV,Robert(Bob) Curtis Memorial,Noorvik,AK,USA,66.82852667,-161.0277908
OSC,Oscoda - Wurtsmith,Oscoda,MI,USA,44.45260972,-83.38036389
OSH,Wittman Regional,Oshkosh,WI,USA,43.98436639,-88.55705944
OSU,Ohio State University,Columbus,OH,USA,40.07977778,-83.07302778
OSX,Kosciusko-Attala County,Kosciusko,MS,USA,33.09025889,-89.54201722
OTG,Worthington Municipal,Worthington,MN,USA,43.65506611,-95.57920917
OTH,North Bend Muni,North Bend,OR,USA,43.41713889,-124.2460278
OTM,Ottumwa Industrial,Ottumwa,IA,USA,41.10659611,-92.44793972
OTZ,Ralph Wien Memorial,Kotzebue,AK,USA,66.88467694,-162.5985497
OUN,University of Oklahoma Westheimer,Norman,OK,USA,35.24556444,-97.47212861
OVE,Oroville Municipal,Oroville,CA,USA,39.48775,-121.622
OVO,North Vernon,North Vernon,IN,USA,39.04563667,-85.60533
OVS,Boscobel,Boscobel,WI,USA,43.16063056,-90.67421833
OWA,Owatonna Degner Regional,Owatonna,MN,USA,44.12339722,-93.26061667
OWB,Owensboro-Daviess County,Owensboro,KY,USA,37.74011111,-87.16683333
OWD,Norwood Memorial,Norwood,MA,USA,42.19079694,-71.17310389
OWI,Ottawa Municipal,Ottawa,KS,USA,38.53866667,-95.25297222
OWK,Central Maine,Norridgewock,ME,USA,44.7155,-69.86647222
OWX,Putnam County,Ottawa,OH,USA,41.0355825,-83.98202444
OXB,Ocean City,Ocean City,MD,USA,38.31044444,-75.12397222
OXC,Waterbury-Oxford,Oxford,CT,USA,41.47855556,-73.13525
OXD,Miami University,Oxford,OH,USA,39.50203917,-84.7841425
OXI,Starke County,Knox,IN,USA,41.3301875,-86.66473194
OXR,Oxnard,Oxnard,CA,USA,34.20080083,-119.2072164
OXV,Knoxville Municipal,Knoxville,IA,USA,41.29888556,-93.11381556
OYM,St Marys Muni,St Marys,PA,USA,41.41247778,-78.50263139
OZA,Ozona Municipal,Ozona,TX,USA,30.73528028,-101.2029719
OZW,Livingston County,Howell,MI,USA,42.62950694,-83.98417361
P01,Ajo Municipal,Ajo,AZ,USA,32.45005694,-112.8673778
P04,Bisbee Municipal,Bisbee,AZ,USA,31.36399028,-109.8831286
P08,Coolidge Municipal,Coolidge,AZ,USA,32.93594444,-111.4265278
P13,San Carlos Apache,Globe,AZ,USA,33.35314722,-110.6673611
P14,Holbrook Municipal,Holbrook,AZ,USA,34.93891389,-110.1395656
P20,Avi Suquilla,Parker,AZ,USA,34.15063889,-114.2712222
P32,H.A. Clark Memorial,Williams,AZ,USA,35.30223222,-112.1940575
P33,Cochise County,Willcox,AZ,USA,32.24540278,-109.8946319
P45,Mount Pleasant-Scottdale,Mount Pleasant,PA,USA,40.10840556,-79.54142694
P52,Cottonwood,Cottonwood,AZ,USA,34.73002111,-112.0351569
P53,Rostraver,Monongahela,PA,USA,40.20972222,-79.83144444
PAE,Snohomish County,Everett,WA,USA,47.90762861,-122.2815892
PAH,Barkley Regional,Paducah,KY,USA,37.06083333,-88.77375
PAK,Port Allen,Hanapepe,HI,USA,21.89686833,-159.6033217
PAN,Payson,Payson,AZ,USA,34.25683639,-111.3392558
PAO,Palo Alto Arpt of Santa Clara Co,Palo Alto,CA,USA,37.46111944,-122.1150444
PAQ,Palmer Municipal,Palmer,AK,USA,61.59474194,-149.0888242
PBF,Grider,Pine Bluff,AR,USA,34.17498722,-91.93472028
PBH,Price County,Phillips,WI,USA,45.70895028,-90.40248472
PBI,Palm Beach International,West Palm Beach,FL,USA,26.68316194,-80.09559417
PBV,St. George,St. George,AK,USA,56.57735278,-169.6637361
PCK,Porcupine Creek,Porcupine Creek,AK,USA,67.23789833,-150.2860608
PCM,Plant City Municipal,Plant City,FL,USA,28.00021667,-82.16424167
PCW,Carl R. Keller,Port Clinton,OH,USA,41.51627778,-82.86869444
PCZ,Waupaca Municipal,Waupaca,WI,USA,44.33368778,-89.01549861
PDC,Prairie Du Chien Municipal,Prairie Du Chien,WI,USA,43.01928889,-91.12374722
PDK,Dekalb-Peachtree,Atlanta,GA,USA,33.87560444,-84.30196778
PDT,Eastern Oregon Regional At Pendleton,Pendleton,OR,USA,45.69505556,-118.8414444
PDX,Portland Intl,Portland,OR,USA,45.58872222,-122.5975
PEA,Pella Municipal,Pella,IA,USA,41.40006667,-92.94588333
PEC,Pelican SPB,Pelican,AK,USA,57.95517222,-136.2362733
PEO,Penn Yan,Penn Yan,NY,USA,42.63813556,-77.05306083
PEQ,Pecos Municipal,Pecos City,TX,USA,31.3823575,-103.5107017
PEZ,Pleasanton Municipal,Pleasanton,TX,USA,28.95419444,-98.51998917
PFN,Panama City-Bay County International,Panama City,FL,USA,30.21208333,-85.68280556
PGA,Page Municipal,Page,AZ,USA,36.92611111,-111.4483611
PGD,Charlotte County,Punta Gorda,FL,USA,26.92019444,-81.99052778
PGM,Port Graham,Port Graham,AK,USA,59.34825944,-151.8315389
PGR,Kirk,Paragould,AR,USA,36.06352944,-90.50986028
PGV,Pitt-Greenville,Greenville,NC,USA,35.63523944,-77.38532028
PHD,Harry Clever,New Philadelphia,OH,USA,40.47091667,-81.41975
PHF,Newport News/Williamsburg International,Newport News,VA,USA,37.13189556,-76.4929875
PHG,Phillipsburg Municipal,Phillipsburg,KS,USA,39.73530556,-99.31741667
PHH,Andrews Municipal,Andrews,SC,USA,33.45169472,-79.52620111
PHK,Palm Beach County Glades,Pahokee,FL,USA,26.78503861,-80.69335528
PHL,Philadelphia Intl,Philadelphia,PA,USA,39.87195278,-75.24114083
PHN,St Clair County International,Port Huron,MI,USA,42.91095778,-82.52886139
PHO,Point Hope,Point Hope,AK,USA,68.34877417,-166.7993086
PHP,Philip,Philip,SD,USA,44.04862722,-101.5990603
PHT,Henry County,Paris,TN,USA,36.33822472,-88.38287861
PHX,Phoenix Sky Harbor International,Phoenix,AZ,USA,33.43416667,-112.0080556
PIA,Greater Peoria Regional,Peoria,IL,USA,40.66424333,-89.69330556
PIB,Hattiesburg-Laurel Regional,Hattiesburg-Laurel,MS,USA,31.46714944,-89.33705778
PIE,St. Petersburg-Clearwater International,St. Petersburg,FL,USA,27.91076333,-82.68743944
PIH,Pocatello Regional,Pocatello,ID,USA,42.91130556,-112.5958611
PIL,Port Isabel-Cameron County,Port Isabel,TX,USA,26.16621,-97.34588611
PIM,Callaway Gardens-Harris County,Pine Mountain,GA,USA,32.84069444,-84.88244444
PIR,Pierre Regional,Pierre,SD,USA,44.38267694,-100.285965
PIT,Pittsburgh International,Pittsburgh,PA,USA,40.49146583,-80.23287083
PIZ,Point Lay Dew Station,Point Lay,AK,USA,69.732875,-163.0053417
PJY,Pinckneyville-Duquoin,Pinckneyville-Duquoin,IL,USA,37.97788417,-89.36044889
PKA,Napaskiak,Napaskiak,AK,USA,60.70369056,-161.7767367
PKB,Wood Cty/Gill Robb Wilson,Parkersburg,WV,USA,39.34510333,-81.43920194
PKD,Park Rapids Municipal,Park Rapids,MN,USA,46.90062583,-95.07313278
PKF,Park Falls Municipal,Park Falls,WI,USA,45.95502361,-90.42441806
PLB,Clinton Cty,Plattsburgh,NY,USA,44.68751861,-73.52452306
PLD,Portland Municipal,Portland,IN,USA,40.45076167,-84.99007917
PLN,Pellston Regional  of Emmet County,Pellston,MI,USA,45.5709275,-84.796715
PLR,St Clair County,Pell City,AL,USA,33.55883333,-86.24905556
PMB,Pembina Municipal,Pembina,ND,USA,48.9425,-97.24083333
PMD,Palmdale Production Flight,Palmdale,CA,USA,34.62938889,-118.0845528
PMH,Greater Portsmouth Regional,Portsmouth,OH,USA,38.84047,-82.84731361
PMP,Pompano Beach Airpark,Pompano Beach,FL,USA,26.24713889,-80.11105556
PMV,Plattsmouth Municipal,Plattsmouth,NE,USA,40.95025,-95.91788889
PMX,Metropolitan,Palmer,MA,USA,42.22328722,-72.31138694
PMZ,Plymouth Municipal,Plymouth,NC,USA,35.80843944,-76.75927694
PNA,Ralph Wenz,Pinedale,WY,USA,42.79549917,-109.8070944
PNC,Ponca City Municipal,Ponca City,OK,USA,36.73058417,-97.09976833
PNE,Northeast Philadelphia,Philadelphia,PA,USA,40.08194417,-75.01058667
PNM,Princeton Municipal,Princeton,MN,USA,45.55986778,-93.60821611
PNN,Princeton Municipal,Princeton,ME,USA,45.20066667,-67.56438889
PNP,Pilot Point,Pilot Point,AK,USA,57.58038056,-157.5674444
PNS,Pensacola Regional,Pensacola,FL,USA,30.47330556,-87.18744444
POC,Brackett,La Verne,CA,USA,34.09164833,-117.7817803
POF,Poplar Bluff Municipal,Poplar Bluff,MO,USA,36.77394444,-90.32484722
POH,Pocahontas Municipal,Pocahontas,IA,USA,42.74280556,-94.64730556
POU,Dutchess Cty,Poughkeepsie,NY,USA,41.62661111,-73.88411111
POY,Powell Muni,Powell,WY,USA,44.86797222,-108.793
PPA,Perry Lefors,Pampa,TX,USA,35.61298806,-100.9962608
PPC,Prospect Creek,Prospect Creek,AK,USA,66.81288139,-150.6437925
PPF,Tri City,Parsons,KS,USA,37.33125778,-95.50900667
PPG,Pago Pago International,Pago Pago,AS,USA,14.33102278,-170.7105258
PPO,La Porte Municipal,La Porte,IN,USA,41.57276194,-86.73413139
PPQ,Pittsfield Penstone Municipal,Pittsfield,IL,USA,39.63885556,-90.77843111
PQI,Northern Maine Regional,Presque Isle,ME,USA,46.68896,-68.04479972
PQL,Trent Lott International,Pascagoula,MS,USA,30.46278111,-88.52922778
PQN,Pipestone Municipal,Pipestone,MN,USA,43.98330333,-96.30031083
PR03,Fajardo Harbor Seaplane Base,Fajardo,PR,USA,18.339675,-65.62460583
PRB,Paso Robles Municipal,Paso Robles,CA,USA,35.67288611,-120.6270558
PRC,Ernest A. Love,Prescott,AZ,USA,34.65447222,-112.4195833
PRG,Edgar County,Paris,IL,USA,39.70015944,-87.66961861
PRN,Greenville Municipal,Greenville,AL,USA,31.84540222,-86.61044583
PRO,Perry Municipal,Perry,IA,USA,41.82801306,-94.15990361
PRX,Cox,Paris,TX,USA,33.63660667,-95.45073194
PSB,Mid-State,Philipsburg,PA,USA,40.88439139,-78.08734167
PSC,Tri-Cities,Pasco,WA,USA,46.26468028,-119.1190292
PSE,Mercedita,Ponce,PR,USA,18.00830278,-66.56301194
PSF,Pittsfield Municipal,Pittsfield,MA,USA,42.42684667,-73.29292806
PSG,James C. Johnson Petersburg,Petersburg,AK,USA,56.80165194,-132.9452781
PSK,New River Valley,Dublin,VA,USA,37.13734528,-80.67848167
PSM,Pease International Tradeport,Portsmouth,NH,USA,43.07795889,-70.82327333
PSN,Palestine Municipal,Palestine,TX,USA,31.77969444,-95.70630556
PSP,Palm Springs International,Palm Springs,CA,USA,33.82921556,-116.5062531
PSX,Palacios Municipal,Palacios,TX,USA,28.72751778,-96.2509675
PTB,Dinwiddie County,Petersburg,VA,USA,37.18375833,-77.50738889
PTD,Potsdam Muni-Damon,Potsdam,NY,USA,44.67666917,-74.94844639
PTH,Port Heiden,Port Heiden,AK,USA,56.95943333,-158.6318208
PTK,Oakland-Pontiac,Pontiac,MI,USA,42.66520389,-83.41870917
PTN,Harry P. Williams Memorial,Patterson,LA,USA,29.71081917,-91.33971778
PTS,Atkinson Municipal,Pittsburg,KS,USA,37.44855556,-94.73133333
PTT,Pratt Industrial,Pratt,KS,USA,37.7000175,-98.7462025
PTU,Platinum,Platinum,AK,USA,59.01135611,-161.8196661
PTV,Porterville Municipal,Porterville,CA,USA,36.02960778,-119.0627311
PTW,Pottstown Limerick,Pottstown,PA,USA,40.23957167,-75.55662528
PUB,Pueblo Memorial,Pueblo,CO,USA,38.28908722,-104.4965722
PUC,Carbon County,Price,UT,USA,39.61391556,-110.7514183
PUW,Pullman/Moscow Regional,"Pullman/Moscow,ID",WA,USA,46.74386111,-117.1095833
PVB,Platteville Municipal,Platteville,WI,USA,42.68935583,-90.44439278
PVC,Provincetown Municipal,Provincetown,MA,USA,42.07199833,-70.22137667
PVD,Theodore F Green State,Providence,RI,USA,41.72399917,-71.42822111
PVF,Placerville,Placerville,CA,USA,38.72421806,-120.753325
PVG,Hampton Roads Executive,Portsmouth,VA,USA,36.78014889,-76.44883472
PVJ,Pauls Valley Municipal,Pauls Valley,OK,USA,34.71105361,-97.22321694
PVU,Provo Muni,Provo,UT,USA,40.21919444,-111.7233611
PVW,Hale County,Plainview,TX,USA,34.16814722,-101.7173361
PWA,Wiley Post,Oklahoma City,OK,USA,35.53455,-97.64721556
PWC,Pine River Regional,Pine River,MN,USA,46.7247875,-94.3817
PWD,Sher-Wood,Plentywood,MT,USA,48.79030583,-104.533845
PWG,McGregor Exectuive,Waco,TX,USA,31.48491667,-97.31652778
PWK,Palwaukee,Chicago/Wheeling/Prospect Heights,IL,USA,42.11418083,-87.90148083
PWM,Portland International Jetport,Portland,ME,USA,43.64616667,-70.30875
PWT,Bremerton National,Bremerton,WA,USA,47.49275361,-122.7624286
PXE,Perry-Houston Couty,Perry,GA,USA,32.51058333,-83.76733333
PYG,Pageland,Pageland,SC,USA,34.74213889,-80.34519444
PYM,Plymouth Municipal,Plymouth,MA,USA,41.90902444,-70.72878778
PYX,Perryton Ochiltree County,Perryton,TX,USA,36.41200333,-100.7517883
PZQ,Presque Isle County,Rogers City,MI,USA,45.40709667,-83.81288556
Q00,Littlefield Municipal,Littlefield,TX,USA,33.92395306,-102.3866831
Q06,City of Tulia/Swisher County Municipal,Tulia,TX,USA,34.56682472,-101.7814611
Q14,San Juan Pueblo,Espanola,NM,USA,36.02502306,-106.0464114
Q16,Reserve,Reserve,NM,USA,33.70005472,-108.8506214
Q17,Boonville,Boonville,CA,USA,39.0126775,-123.3827864
Q21,Brownsville,Brownsville,CA,USA,39.45544417,-121.2913511
Q24,Levelland Municipal,Levelland,TX,USA,33.54980833,-102.3727333
Q25,Dinsmore,Dinsmore,CA,USA,40.49291944,-123.5997589
Q26,Terry County,Brownfield,TX,USA,33.173675,-102.1926208
Q31,Sequoia,Visalia,CA,USA,36.44856139,-119.3190056
Q34,Portales Municipal,Portales,NM,USA,34.14547222,-103.4103333
Q35,Springerville Babbitt,Springerville,AZ,USA,34.1286575,-109.3114756
Q37,Carrizozo Municipal,Carrizozo,NM,USA,33.64886139,-105.895685
Q41,Floydada Municipal,Floydada,TX,USA,34.00230056,-101.330435
Q42,Springer Municipal,Springer,NM,USA,36.32697806,-104.6197117
Q44,Beaver Municipal,Beaver,OK,USA,36.79891472,-100.5298708
Q49,Firebaugh,Firebaugh,CA,USA,36.85998861,-120.4644675
Q53,Franklin,Franklin,CA,USA,38.30491306,-121.4296736
Q55,Dimmitt Municipal,Dimmitt,TX,USA,34.56673556,-102.3226947
Q58,Santa Rosa Municipal,Santa Rosa,NM,USA,34.93442472,-104.643065
Q61,Georgetown,Georgetown,CA,USA,38.92111389,-120.8647944
Q68,Pine Mountain Lake,Groveland,CA,USA,37.86166667,-120.1778889
Q72,Hayfork,Hayfork,CA,USA,40.54708833,-123.1816953
Q84,Mendota,Mendota,CA,USA,36.75800528,-120.3712794
Q88,Paradise Skypark,Paradise,CA,USA,39.70960639,-121.6163617
Q94,Rio Linda,Rio Linda,CA,USA,38.67601389,-121.4455092
Q95,Ruth,Ruth,CA,USA,40.21125917,-123.2975231
Q99,South County  of Santa Clara Co,San Martin,CA,USA,37.08158611,-121.5968056
RAC,John H Batten,Racine,WI,USA,42.76119139,-87.81389806
RAL,Riverside Municipal,Riverside,CA,USA,33.95187528,-117.4451017
RAP,Rapid City Regional,Rapid City,SD,USA,44.04532139,-103.0573708
RBD,Redbird,Dallas,TX,USA,32.68086111,-96.86819444
RBE,Bassett Municipal,Bassett,NE,USA,42.56966667,-99.56836111
RBG,Roseburg Regional,Roseburg,OR,USA,43.23878306,-123.3558617
RBL,Red Bluff Municipal,Red Bluff,CA,USA,40.15065667,-122.2522903
RBW,Walterboro Municipal,Walterboro,SC,USA,32.92052778,-80.64125
RBY,Ruby,Ruby,AK,USA,64.72721556,-155.4698886
RCA,Ellsworth AFB,NA,NA,USA,44.145094,-103.103567
RCR,Fulton County,Rochester,IN,USA,41.06554833,-86.18170444
RCX,Rusk County,Ladysmith,WI,USA,45.49825694,-91.00186361
RDD,Redding Municipal,Redding,CA,USA,40.50898361,-122.2934019
RDG,"Reading Muni,Gen Carl A Spaatz",Reading,PA,USA,40.3785,-75.96525
RDK,Red Oak Municipal,Red Oak,IA,USA,41.01052778,-95.25986111
RDM,Roberts,Redmond,OR,USA,44.25406722,-121.1499633
RDR,Grand Forks AFB,NA,NA,USA,47.961167,-97.401167
RDU,Raleigh-Durham International,Raleigh,NC,USA,35.87763889,-78.78747222
RDV,Red Devil,Red Devil,AK,USA,61.78764333,-157.3479344
RED,Red Lodge,Red Lodge,MT,USA,45.18744472,-109.2673778
RFD,Greater Rockford,Rockford,IL,USA,42.19536389,-89.09721111
RFG,Refugio-Rooke,Refugio,TX,USA,28.29361694,-97.32304833
RGK,Red Wing Municipal,Red Wing,MN,USA,44.58935611,-92.48496889
RHI,Rhinelander-Oneida County,Rhinelander,WI,USA,45.63119306,-89.46745361
RHV,Reid-Hillview of Santa Clara Co,San Jose,CA,USA,37.33287306,-121.8197947
RIC,Richmond International,Richmond,VA,USA,37.50516667,-77.31966667
RID,Richmond Municipal,Richmond,IN,USA,39.75721528,-84.84282
RIF,Richfield Muni,Richfield,UT,USA,38.73643611,-112.0989444
RIL,Garfield County Regional,Rifle,CO,USA,39.526315,-107.7269403
RIU,Rancho Murieta,Rancho Murieta,CA,USA,38.4887975,-121.1024447
RIV,March,Riverside,CA,USA,33.88057333,-117.2594836
RIW,Riverton Regional,Riverton,WY,USA,43.064235,-108.4598411
RKD,Knox County Regional,Rockland,ME,USA,44.06008333,-69.09925
RKP,Aransas County,Rockport,TX,USA,28.08677778,-97.04461111
RKR,Robert S Kerr,Poteau,OK,USA,35.02162639,-94.6212525
RKS,Rock Springs-Sweetwater County,Rock Springs,WY,USA,41.5942175,-109.0651928
RKW,Rockwood Municipal,Rockwood,TN,USA,35.922295,-84.68966278
RLD,Richland,Richland,WA,USA,46.305635,-119.3041853
RME,Griffis Airpark,Rome,NY,USA,43.23379861,-75.40703333
RMG,Richard B Russell,Rome,GA,USA,34.35060111,-85.15801389
RMP,Rampart,Rampart,AK,USA,65.50786222,-150.1428047
RMY,Brooks,Marshall,MI,USA,42.25118111,-84.9554525
RNC,Warren County Memorial,McMinnville,TN,USA,35.69870944,-85.84381722
RNH,New Richmond Municipal,New Richmond,WI,USA,45.14831139,-92.53806139
RNM,Ramona,Ramona,CA,USA,33.038905,-116.9136392
RNO,Reno/Tahoe International,Reno,NV,USA,39.49857611,-119.7680647
RNT,Renton Municipal,Renton,WA,USA,47.49313889,-122.21575
RNV,Cleveland Municipal,Cleveland,MS,USA,33.76114056,-90.75787528
ROA,Roanoke Regional/ Woodrum,Roanoke,VA,USA,37.32546833,-79.97542833
ROC,Greater Rochester Int'l,Rochester,NY,USA,43.11886611,-77.67238389
ROG,Rogers Municipal-Carter,Rogers,AR,USA,36.37229667,-94.10686972
ROP,Prachinburi,NA,NA,Thailand,14.078333,101.378334
ROR,Babelthoup/Koror,NA,NA,Palau,7.367222,134.544167
ROS,Rush City Regional,Rush City,MN,USA,45.69801389,-92.95298972
ROW,Roswell Industrial Air Center,Roswell,NM,USA,33.30155556,-104.5305556
ROX,Roseau Municipal,Roseau,MN,USA,48.85603806,-95.69703861
RPB,Belleville Municipal,Belleville,KS,USA,39.81790861,-97.659625
RPD,Rice Lake Regional-Carl's,Rice Lake,WI,USA,45.41809056,-91.77365194
RPX,Roundup,Roundup,MT,USA,46.47357528,-108.5576333
RQB,Roben-Hood,Big Rapids,MI,USA,43.72263278,-85.50407333
RQE,Window Rock,Window Rock,AZ,USA,35.65205556,-109.0673889
RRL,Merrill Municipal,Merrill,WI,USA,45.19927083,-89.71143389
RRT,Warroad Intl Swede Carlson,Warroad,MN,USA,48.94138889,-95.34838889
RSH,Russian Mission,Russian Mission,AK,USA,61.77967583,-161.3194772
RSL,Russell Municipal,Russell,KS,USA,38.87212222,-98.81177611
RSN,Ruston Regional,Ruston,LA,USA,32.51444444,-92.58833333
RST,Rochester International,Rochester,MN,USA,43.90882639,-92.49798722
RSV,Robinson Municipal,Robinson,IL,USA,39.01604222,-87.649775
RSW,Southwest Florida International,Ft. Myers,FL,USA,26.53616667,-81.75516667
RTN,Raton Municipal/Crews,Raton,NM,USA,36.74152778,-104.5021833
RUE,Russellville Municipal,Russellville,AR,USA,35.25914667,-93.09326611
RUG,Rugby Municipal,Rugby,ND,USA,48.39035917,-100.0242739
RUQ,Rowan County,Salisbury,NC,USA,35.64588583,-80.52029306
RUT,Rutland State,Rutland,VT,USA,43.52990694,-72.949615
RVJ,Reidsville,Reidsville,GA,USA,32.05897222,-82.15172222
RVL,Mifflin Cty,Reedsville,PA,USA,40.67737417,-77.62682833
RVN,Hawkins County,Rogersville,TN,USA,36.45757917,-82.88503722
RVS,"Richard Lloyd Jones, Jr.",Tulsa,OK,USA,36.0396275,-95.984635
RWF,Redwood Falls Muni,Redwood Falls,MN,USA,44.54720389,-95.082255
RWI,Rocky Mount Wilson,Rocky Mount,NC,USA,35.85498861,-77.89295611
RWL,Rawlins Muni,Rawlins,WY,USA,41.8055975,-107.19994
RWN,Arens,Winamac,IN,USA,41.09226306,-86.61287111
RXE,Rexburg-Madison County,Rexburg,ID,USA,43.83391139,-111.805105
RYN,Ryan,Tucson,AZ,USA,32.14308333,-111.1728611
RYV,Watertown Municipal,Watertown,WI,USA,43.16963222,-88.72321222
RYY,Cobb County-McCollum,Marietta,GA,USA,34.01315611,-84.59854472
RZL,Jasper County,Rensselaer,IN,USA,40.94789861,-87.18257944
RZN,Burnett County,Siren,WI,USA,45.8227275,-92.37250083
RZT,Ross County,Chillicothe,OH,USA,39.44136778,-83.02251556
RZZ,Halifax County,Roanoke Rapids,NC,USA,36.43945583,-77.70934139
S01,Conrad,Conrad,MT,USA,48.16863889,-111.9764722
S03,Ashland Muni-Sumner Parker,Ashland,OR,USA,42.19028361,-122.6606283
S05,Bandon State,Bandon,OR,USA,43.08733083,-124.4095578
S07,Bend Muni,Bend,OR,USA,44.09483333,-121.2006389
S10,Chelan Muni,Chelan,WA,USA,47.86597139,-119.9427053
S12,Albany Municipal,Albany,OR,USA,44.63781639,-123.0594486
S18,Forks,Forks,WA,USA,47.94146583,-124.3929867
S21,Sunriver,Sunriver,OR,USA,43.87633333,-121.4530556
S23,Ione Municipal,Ione,WA,USA,48.70727528,-117.4126036
S24,Sandusky Co,Fremont,OH,USA,41.29570556,-83.03723056
S25,Watford City Municipal,Watford City,ND,USA,47.79569972,-103.2536992
S27,Kalispell City,Kalispell,MT,USA,48.17856944,-114.3037408
S28,International Peace Garden,Dunseith,ND,USA,48.99778194,-100.0434589
S30,Lebanon State,Lebanon,OR,USA,44.529845,-122.9295336
S31,Lopez Island,Lopez,WA,USA,48.48259944,-122.9368444
S32,Cooperstown Municipal,Cooperstown,ND,USA,47.42277361,-98.10587139
S33,City-County,Madras,OR,USA,44.66623139,-121.1631
S34,Plains,Plains,MT,USA,47.47243611,-114.900135
S39,Prineville,Prineville,OR,USA,44.28699389,-120.9038328
S40,Prosser,Prosser,WA,USA,46.212355,-119.7928122
S43,Harvey,Snohomish,WA,USA,47.90815306,-122.1054072
S45,Siletz Bay State,Siletz Bay (Gleneden Beach),OR,USA,44.87761139,-124.0284472
S47,Tillamook,Tillamook,OR,USA,45.41824194,-123.8143839
S50,Auburn Municipal,Auburn,WA,USA,47.32815583,-122.2265092
S52,Methow Valley State,Winthrop,WA,USA,48.42070056,-120.1470264
S59,Libby,Libby,MT,USA,48.28384528,-115.4902453
S60,Kenmore Air Harbor Inc,Kenmore,WA,USA,47.75482,-122.2592931
S64,Stanford,Stanford,MT,USA,47.14718944,-110.2299289
S66,Homedale Municipal,Homedale,ID,USA,43.61488056,-116.9215372
S67,Nampa Muni,Nampa,ID,USA,43.58133333,-116.5230556
S68,Orofino Municipal,Orofino,ID,USA,46.49129139,-116.2768061
S69,Lincoln,Lincoln,MT,USA,46.97494083,-112.6447606
S70,Othello Muni,Othello,WA,USA,46.79486278,-119.0802875
S71,Edgar G Obie,Chinook,MT,USA,48.59194444,-109.2488889
S72,St Maries Municipal,St Maries,ID,USA,47.32768722,-116.5773906
S73,Kamiah Municipal,Kamiah,ID,USA,46.21934028,-116.0134736
S80,Idaho County,Grangeville,ID,USA,45.94255806,-116.1234158
S83,Shoshone County,Kellogg,ID,USA,47.54769889,-116.1885008
S85,Big Sky,Culbertson,MT,USA,48.15333333,-104.5038889
S87,Weiser Municipal,Weiser,ID,USA,44.20683056,-116.9623869
S89,Craigmont Municipal,Craigmont,ID,USA,46.24710917,-116.4801447
S93,Cle Elum Municipal,Cle Elum,WA,USA,47.18317583,-120.884525
S94,Whitman County Memorial,Colfax,WA,USA,46.8584975,-117.4137964
S97,Anderson,Brewster,WA,USA,48.10486806,-119.7206128
SAA,Shively,Saratoga,WY,USA,41.44485944,-106.8235264
SAC,Sacramento Executive,Sacramento,CA,USA,38.51252389,-121.4934689
SAD,Safford Regional,Safford,AZ,USA,32.85331278,-109.6349708
SAF,Santa Fe Municipal,Santa Fe,NM,USA,35.61677778,-106.0881389
SAN,San Diego International-Lindbergh,San Diego,CA,USA,32.73355611,-117.1896567
SAR,Sparta Community-Hunter,Sparta,IL,USA,38.14893833,-89.69870972
SAT,San Antonio International,San Antonio,TX,USA,29.53369444,-98.46977778
SAV,Savannah International,Savannah,GA,USA,32.12758333,-81.20213889
SAW,Sawyer,Gwinn,MI,USA,46.35361111,-87.39583222
SAZ,Staples Municipal,Staples,MN,USA,46.38087944,-94.80660167
SBA,Santa Barbara Municipal,Santa Barbara,CA,USA,34.42621194,-119.8403733
SBD,San Bernardino International,San Bernardino,CA,USA,34.09535361,-117.2348742
SBM,Sheboygan County Memorial,Sheboygan,WI,USA,43.76949444,-87.85158944
SBN,South Bend Regional,South Bend,IN,USA,41.70895361,-86.31847417
SBO,Emanuel County,Swainsboro,GA,USA,32.60825,-82.36869444
SBP,San Luis Obispo Co-McChesney,San Luis Obispo,CA,USA,35.23705806,-120.6423931
SBS,Steamboat Springs,Steamboat Springs,CO,USA,40.51625944,-106.8663006
SBU,Blue Earth Municipal,Blue Earth,MN,USA,43.59534389,-94.09284833
SBX,Shelby,Shelby,MT,USA,48.54125278,-111.8720722
SBY,Salisbury-Ocean City: Wicomico Regional,Salisbury,MD,USA,38.34052611,-75.51028806
SCB,Scribner State,Scribner,NE,USA,41.61033333,-96.62986111
SCC,Deadhorse,Deadhorse,AK,USA,70.19475583,-148.4651608
SCD,Merkel Field Sylacauga Municipal,Sylacauga,AL,USA,33.17183583,-86.30553778
SCE,University Park,NA,NA,USA,40.851206,-77.846302
SCH,Schenectady Cty,Schenectady,NY,USA,42.85245556,-73.9288675
SCK,Stockton Metro,Stockton,CA,USA,37.89426694,-121.2386203
SCM,Scammon Bay,Scammon Bay,AK,USA,61.84454111,-165.5737492
SCX,Scott Municipal,Oneida,TN,USA,36.45569444,-84.58575
SD07,Bison Municipal,Bison,SD,USA,45.51859778,-102.4671042
SD10,Canton Municipal,Canton,SD,USA,43.30888889,-96.571
SD12,Wilder,De Smet,SD,USA,44.43080278,-97.56118861
SD16,Eureka Municipal,Eureka,SD,USA,45.79998111,-99.6420625
SD18,Flandreau Municipal,Flandreau,SD,USA,44.00386056,-96.59310139
SD22,Hoven Municipal,Hoven,SD,USA,45.25755861,-99.79783944
SD28,McLaughlin Municipal,McLaughlin,SD,USA,45.79680833,-100.7842503
SD32,Murdo Municipal,Murdo,SD,USA,43.85165639,-100.7120811
SD33,Parkston Municipal,Parkston,SD,USA,43.37915361,-97.97118278
SD34,Presho Municipal,Presho,SD,USA,43.90637833,-100.0370669
SDA,Shenandoah Municipal,Shenandoah,IA,USA,40.75148167,-95.41347222
SDF,Louisville International-Standiford,Louisville,KY,USA,38.17438889,-85.736
SDL,Scottsdale,Scottsdale,AZ,USA,33.622875,-111.9105333
SDM,Brown  Municipal,San Diego,CA,USA,32.57230556,-116.98025
SDP,Sand Point Municipal,Sand Point,AK,USA,55.31502778,-160.5176944
SDY,Sidney-Richland Municipal,Sidney,MT,USA,47.70685778,-104.1925544
SEA,Seattle-Tacoma Intl,Seattle,WA,USA,47.44898194,-122.3093131
SEE,Gillespie,San Diego (El Cajon),CA,USA,32.82623111,-116.9724497
SEF,Sebring  And Industrial Park,Sebring,FL,USA,27.45640278,-81.3424
SEG,Penn Valley,Selinsgrove,PA,USA,40.82052917,-76.86377611
SEM,Craig,Selma,AL,USA,32.34394667,-86.98780333
SEP,Clark Field Municipal,Stephenville,TX,USA,32.21532333,-98.17766722
SER,Freeman Municipal,Seymour,IN,USA,38.92355361,-85.90736556
SET,St Charles County Smart,St Charles,MO,USA,38.92969444,-90.42996111
SEZ,Sedona,Sedona,AZ,USA,34.84862889,-111.7884614
SFB,Orlando Sanford,Orlando,FL,USA,28.77764,-81.23748944
SFD,Bob Wiley,Winner,SD,USA,43.39058278,-99.84256194
SFF,Felts,Spokane,WA,USA,47.68281806,-117.3225583
SFM,Sanford Regional,Sanford,ME,USA,43.39386111,-70.70800028
SFO,San Francisco International,San Francisco,CA,USA,37.61900194,-122.3748433
SFQ,Suffolk Municipal,Suffolk,VA,USA,36.68235361,-76.60187333
SFY,Tri-Township,Savanna,IL,USA,42.04581972,-90.10760056
SFZ,North Central State,Pawtucket,RI,USA,41.92076333,-71.49138139
SGF,Springfield-Branson Regional,Springfield,MO,USA,37.24432611,-93.38685806
SGH,Springfield-Beckley Municipal,Springfield,OH,USA,39.84028194,-83.84015056
SGJ,St. Augustine,St. Augustine,FL,USA,29.95925,-81.33975
SGR,Sugar Land Municipal/Hull,Houston,TX,USA,29.62225306,-95.65652889
SGS,South St.Paul Municipal,South St Paul,MN,USA,44.85713278,-93.03285389
SGT,Stuttgart Municipal,Stuttgart,AR,USA,34.60054,-91.57457417
SGU,St George Muni,St George,UT,USA,37.09058333,-113.5930556
SGY,Skagway,Skagway,AK,USA,59.46006194,-135.3156636
SHD,Shenandoah Valley Regional,Staunton/Harrisonburg,VA,USA,38.26384333,-78.89643806
SHG,Shungnak,Shungnak,AK,USA,66.88916556,-157.1505119
SHH,Shishmaref,Shishmaref,AK,USA,66.24956861,-166.0895589
SHL,Sheldon Municipal,Sheldon,IA,USA,43.20839361,-95.83343306
SHN,Sanderson,Shelton,WA,USA,47.23355556,-123.1475556
SHR,Sheridan County,Sheridan,WY,USA,44.76919556,-106.9802794
SHV,Shreveport Regional,Shreveport,LA,USA,32.4466275,-93.82559833
SHX,Shageluk,Shageluk,AK,USA,62.69511944,-159.5690614
SIG,Fernando Luis Ribas Dominicci,San Juan,PR,USA,18.45675,-66.09883333
SIK,Sikeston Memorial Municipal,Sikeston,MO,USA,36.89888889,-89.56175
SIT,Sitka,Sitka,AK,USA,57.04713806,-135.3615983
SIV,Sullivan County,Sullivan,IN,USA,39.1147125,-87.44832917
SIY,Siskiyou County,Montague,CA,USA,41.78144167,-122.4681094
SJC,San Jose International,San Jose,CA,USA,37.36186194,-121.9290089
SJN,St Johns Industrial Air Park,St Johns,AZ,USA,34.51855556,-109.37875
SJT,San Angelo Regional /Mathis,San Angelo,TX,USA,31.35775,-100.4963056
SJU,Luis Munoz Marin International,San Juan,PR,USA,18.43941667,-66.00183333
SJX,Beaver Island,St James,MI,USA,45.69227778,-85.56630556
SKA,Fairchild AFB,NA,NA,USA,47.615058,-117.655803
SKI,Sac City Municipal,Sac City,IA,USA,42.37908333,-94.97958333
SKW,Skwentna,Skwentna,AK,USA,61.965295,-151.1913661
SKX,Taos Municipal,Taos,NM,USA,36.45819,-105.6724289
SLB,Storm Lake Municipal,Storm Lake,IA,USA,42.59719444,-95.24066667
SLC,Salt Lake City Intl,Salt Lake City,UT,USA,40.78838778,-111.9777731
SLE,McNary Fld,Salem,OR,USA,44.90952778,-123.0025
SLG,Smith,Siloam Springs,AR,USA,36.19060778,-94.49088306
SLK,Adirondack,Saranac Lake,NY,USA,44.38531,-74.20618472
SLN,Salina Municipal,Salina,KS,USA,38.7914825,-97.65060333
SLO,Salem-Leckrone,Salem,IL,USA,38.64287222,-88.96418528
SLQ,Sleetmute,Sleetmute,AK,USA,61.70931139,-157.1557008
SLR,Sulphur Springs Municipal,Sulphur Springs,TX,USA,33.15983333,-95.62113889
SMD,Smith,Fort Wayne,IN,USA,41.14335389,-85.15277694
SME,Somerset-Pulaski County,Somerset,KY,USA,37.05419722,-84.61494139
SMF,Sacramento International,Sacramento,CA,USA,38.69542167,-121.5907669
SMN,Lemhi County,Salmon,ID,USA,45.12047778,-113.8820103
SMO,Santa Monica Municipal,Santa Monica,CA,USA,34.01582194,-118.4512961
SMQ,Somerset,Somerville,NJ,USA,40.62599083,-74.67024333
SMS,Sumter Municipal,Sumter,SC,USA,33.99569444,-80.3615
SMX,Santa Maria Pub/Capt G Allan Hancock,Santa Maria,CA,USA,34.89924833,-120.4575825
SNA,John Wayne /Orange Co,Santa Ana,CA,USA,33.67565861,-117.8682225
SNH,Savannah Hardin County,Savannah,TN,USA,35.17036,-88.21587
SNK,Winston,Snyder,TX,USA,32.69338667,-100.9504525
SNL,Shawnee Municipal,Shawnee,OK,USA,35.35730333,-96.94282833
SNP,St. Paul,St. Paul,AK,USA,57.16733333,-170.2204444
SNS,Salinas Municipal,Salinas,CA,USA,36.66279222,-121.6063603
SNY,Sidney Municipal,Sidney,NE,USA,41.10133333,-102.9852778
SOP,Moore County,Pinehurst/Southern Pines,NC,USA,35.23735278,-79.39116944
SOV,Seldovia,Seldovia,AK,USA,59.44243917,-151.7040503
SOW,Show Low Municipal,Show Low,AZ,USA,34.26527194,-110.0054075
SPA,Spartanburg Downtown Memorial,Spartanburg,SC,USA,34.91572222,-81.9565
SPB,Scappoose Industrial Airpark,Scappoose,OR,USA,45.77250444,-122.8623611
SPF,Black Hills-Clyde Ice,Spearfish,SD,USA,44.48022222,-103.7768889
SPG,Albert Whitted Municipal,St. Petersburg,FL,USA,27.76511111,-82.62697222
SPH,Springhill,Springhill,LA,USA,32.98316472,-93.41081028
SPI,Capital,Springfield,IL,USA,39.84395194,-89.67761861
SPN,Tinian International Airport,NA,NA,N Mariana Islands,14.996111,145.621384
SPS,Sheppard AFB/Wichita Falls Municipal,Wichita Falls,TX,USA,33.98879611,-98.49189333
SPW,Spencer Municipal,Spencer,IA,USA,43.16552778,-95.20280556
SPX,Houston-Gulf,Houston,TX,USA,29.50836111,-95.05133333
SQI,Whiteside Co,Sterling Rockfalls,IL,USA,41.74284139,-89.67629028
SQL,San Carlos,San Carlos,CA,USA,37.511855,-122.2495236
SRB,Upper Cumberland Regional,Sparta,TN,USA,36.05593278,-85.5307475
SRC,Searcy Municipal,Searcy,AR,USA,35.21194639,-91.737165
SRQ,Sarasota Bradenton International,Sarasota,FL,USA,27.39533333,-82.55411111
SRR,Sierra Blanca Regional,Ruidoso,NM,USA,33.46285,-105.5347508
SRV,Stony River 2,Stony River,AK,USA,61.789875,-156.5881861
SSF,Stinson Municipal,San Antonio,TX,USA,29.3370075,-98.47114056
SSI,Malcolm McKinnon,Brunswick,GA,USA,31.1515925,-81.39134667
SSQ,Shell Lake Municipal,Shell Lake,WI,USA,45.73138139,-91.92066194
STC,St Cloud Regional,St Cloud,MN,USA,45.54532417,-94.05833667
STE,Stevens Point Municipal,Stevens Point,WI,USA,44.54513556,-89.53028444
STF,George M Bryan,Starkville,MS,USA,33.43381667,-88.84863806
STJ,Rosecrans Memorial,St Joseph,MO,USA,39.77194444,-94.90970556
STK,Crosson,Sterling,CO,USA,40.6152625,-103.2646556
STL,Lambert-St Louis International,St Louis,MO,USA,38.74768694,-90.35998972
STP,St Paul Downtown Holman,St Paul,MN,USA,44.9344725,-93.05999861
STS,Sonoma Co,Santa Rosa,CA,USA,38.50897694,-122.8128803
STT,Cyril E. King,Charlotte Amalie,VI,USA,18.33730556,-64.97336111
STX,Henry E. Rohlsen,Christiansted,VI,USA,17.70188889,-64.79855556
SUA,Witham,Stuart,FL,USA,27.18169444,-80.22108333
SUD,Stroud Municipal,Stroud,OK,USA,35.78756833,-96.65862861
SUE,Door County Cherryland,Sturgeon Bay,WI,USA,44.84366222,-87.42154111
SUN,Friedman Memorial,Hailey,ID,USA,43.50484139,-114.2965903
SUS,Spirit of St Louis,St Louis,MO,USA,38.66187028,-90.65123
SUT,Brunswick County,Southport,NC,USA,33.92925694,-78.07499167
SUW,Richard I Bong,Superior,WI,USA,46.6897175,-92.094655
SUX,Sioux Gateway,Sioux City,IA,USA,42.40260333,-96.38436694
SVA,Savoonga,Savoonga,AK,USA,63.68639444,-170.4926361
SVC,Grant County,Silver City,NM,USA,32.63654694,-108.1563853
SVE,Susanville Municipal,Susanville,CA,USA,40.37684111,-120.5730033
SVH,Statesville Municipal,Statesville,NC,USA,35.76526389,-80.95673611
SVS,Stevens Village,Stevens Village,AK,USA,66.00900528,-149.0959153
SWD,Seward,Seward,AK,USA,60.12693833,-149.4188122
SWF,Stewart,Newburgh,NY,USA,41.50409361,-74.10483833
SWO,Stillwater Regional,Stillwater,OK,USA,36.16025194,-97.08577028
SWT,Seward Municipal,Seward,NE,USA,40.86525806,-97.10931306
SWW,Avenger,Sweetwater,TX,USA,32.46736806,-100.4665508
SXL,Summersville,Summersville,WV,USA,38.23163889,-80.87080556
SXP,Sheldon Point,Sheldon Point,AK,USA,62.52055556,-164.8477778
SXQ,Soldotna,Soldotna,AK,USA,60.47613889,-151.0324444
SYF,Cheyenne County Municipal,St Francis,KS,USA,39.76104833,-101.7958414
SYI,Bomar Field-Shelbyville Municipal,Shelbyville,TN,USA,35.56009889,-86.44249333
SYR,Syracuse-Hancock Intl,Syracuse,NY,USA,43.11118694,-76.10631056
SYV,Sylvester,Sylvester,GA,USA,31.55851111,-83.89573389
SZP,Santa Paula,Santa Paula,CA,USA,34.34722167,-119.061215
SZT,Sandpoint,Sandpoint,ID,USA,48.29965139,-116.5597681
SZY,Robert Sibley,Selmer,TN,USA,35.20295,-88.49836139
T00,Chambers County,Anahauac,TX,USA,29.77,-94.66361194
T03,Tuba City,Tuba City,AZ,USA,36.09276972,-111.3826419
T08,Tomahawk Regional,Tomahawk,WI,USA,45.46913889,-89.80569444
T18,Brooks County,Falfurrias,TX,USA,27.20683333,-98.12117083
T28,Lampasas Municipal,Lampasas,TX,USA,31.10672694,-98.19600194
T35,Cameron Municipal Airpark,Cameron,TX,USA,30.87935556,-96.97109694
T36,Paul Pittman Memorial,Tylertown,MS,USA,31.14601111,-90.168145
T41,La Porte Municipal,La Porte,TX,USA,29.66925,-95.06419444
T44,Trident Basin,Kodiak,AK,USA,57.78083333,-152.3913889
T47,Kickapoo Downtown Airpark,Wichita Falls,TX,USA,33.86122222,-98.4904425
T49,Big Spring McMahon-Wrinkle,Big Spring,TX,USA,32.21261111,-101.5216389
T53,Robstown-Nueces County,Robstown,TX,USA,27.77854306,-97.69052389
T56,Crockett-Houston County,Crockett,TX,USA,31.30696111,-95.40383056
T57,Garland Heliport,Garland,TX,USA,32.887625,-96.6836075
T60,Stonewall County,Aspermont,TX,USA,33.17231861,-100.1976044
T65,Mid Valley,Weslaco,TX,USA,26.17763889,-97.97305556
T69,Sinton-San Patricio County,Sinton,TX,USA,28.03925,-97.54244444
T71,Cuero Municipal,Cuero,TX,USA,29.08358806,-97.26693417
T72,Hearne Municipal,Hearne,TX,USA,30.87182917,-96.62222639
T74,Taylor Municipal,Taylor,TX,USA,30.57194444,-97.44316667
T78,Liberty Municipal,Liberty,TX,USA,30.07780556,-94.69855556
T80,Kleberg County,Kingsville,TX,USA,27.55086111,-98.03091833
T82,Gillespie County,Fredericksburg,TX,USA,30.24369444,-98.90952778
T89,Castroville Municipal,Castroville,TX,USA,29.34192083,-98.85090056
T90,Chambers County,Winnie/Stowell,TX,USA,29.80411,-94.43102306
T97,Calhoun County,Port Lavaca,TX,USA,28.65405111,-96.6813125
TAD,Perry Stokes,Trinidad,CO,USA,37.25937778,-104.340675
TAL,Ralph M Calhoun Memorial,Tanana,AK,USA,65.17439528,-152.1093886
TAN,Taunton Municipal,Taunton,MA,USA,41.87460139,-71.01687583
TAZ,Taylorville Municipal,Taylorville,IL,USA,39.53418583,-89.32781222
TBN,Forney AAF,Fort Leonard Wood,MO,USA,37.74163111,-92.14073611
TBR,Statesboro Municipal,Statesboro,GA,USA,32.48316667,-81.73727778
TCC,Tucumcari Municipal,Tucumcari,NM,USA,35.18277806,-103.6031853
TCL,Tuscaloosa Municipal,Tuscaloosa,AL,USA,33.2206275,-87.61140139
TCS,Truth Or Consequences Municipal,Truth Or Consequences,NM,USA,33.23694444,-107.27175
TCT,Takotna,Takotna,AK,USA,62.99270417,-156.0681903
TCY,Tracy Municipal,Tracy,CA,USA,37.68910778,-121.4418172
TDF,Person County,Roxboro,NC,USA,36.28489194,-78.98422694
TDO,Toledo-Winlock Ed Carlson Memorial,Toledo,WA,USA,46.47709083,-122.80686
TDZ,Toledo Metcalf,Toledo,OH,USA,41.56487194,-83.48226139
TEB,Teterboro,Teterboro,NJ,USA,40.85010139,-74.06083611
TEL,Perry County Municipal,Tell City,IN,USA,38.01769694,-86.69093
TEW,Mason Jewett,Mason,MI,USA,42.56576833,-84.42321861
TEX,Telluride Regional,Telluride,CO,USA,37.95375861,-107.90848
TGC,Gibson County,Trenton,TN,USA,35.93245472,-88.84894028
TGI,Tangier Island,Tangier,VA,USA,37.82513889,-75.99777778
THA,Tullahoma Regional,Tullahoma,TN,USA,35.38015694,-86.24602333
THM,Thompson Falls,Thompson Falls,MT,USA,47.57493556,-115.2843164
THP,Hot Springs County-Thermopolis Municipal,Thermopolis,WY,USA,43.65828917,-108.2131542
THV,York,York,PA,USA,39.916995,-76.87302611
TIW,Tacoma Narrows,Tacoma,WA,USA,47.26793111,-122.5780997
TIX,Space Cost Regional,Titusville,FL,USA,28.51479944,-80.7992275
TKA,Talkeetna,Talkeetna,AK,USA,62.3205,-150.0936944
TKE,Tenakee SPB,Tenakee Springs,AK,USA,57.77965833,-135.2184439
TKI,McKinney Municipal,McKinney,TX,USA,33.17794778,-96.5905275
TKX,Kennett Memorial,Kennett,MO,USA,36.23087083,-90.03466806
TLH,Tallahassee Regional,Tallahassee,FL,USA,30.39652778,-84.35033333
TLR,Mefford,Tulare,CA,USA,36.15630556,-119.3261667
TLT,Tuluksak,Tuluksak,AK,USA,61.09676222,-160.9684167
TMA,Henry Tift Myers,Tifton,GA,USA,31.42879528,-83.48787167
TMB,Kendall-Tamiami Executive,Miami,FL,USA,25.64788889,-80.43277778
TNI,West Tinian,Peipeinimaru,CQ,USA,14.99685028,-145.6180383
TNP,Twentynine Palms,Twentynine Palms,CA,USA,34.13208528,-115.9458319
TNT,Dade Collier T And T,Miami,FL,USA,25.86180556,-80.897
TNU,Newton Municipal,Newton,IA,USA,41.67442972,-93.02172917
TOA,Zamperini,Torrance,CA,USA,33.8033775,-118.3396
TOB,Dodge Center,Dodge Center,MN,USA,44.018,-92.8315
TOC,"Toccoa, R G Le Tourneau",Toccoa,GA,USA,34.59376444,-83.2958
TOG,Togiak Village,Togiak,AK,USA,59.05284222,-160.3969339
TOI,Troy Municipal,Troy,AL,USA,31.86041667,-86.01213889
TOL,Toledo Express,Toledo,OH,USA,41.58680556,-83.80783333
TOP,Philip Billard Municipal,Topeka,KS,USA,39.0686575,-95.62248361
TOR,Torrington Muni,Torrington,WY,USA,42.0645475,-104.1526986
TPA,Tampa International,Tampa,FL,USA,27.97547222,-82.53325
TPF,Peter O. Knight,Tampa,FL,USA,27.91557833,-82.44926083
TPH,Tonopah,Tonopah,NV,USA,38.06020222,-117.0871536
TPL,Draughon-Miller Central Texas Regional,Temple,TX,USA,31.1525,-97.40777778
TPO,Port Alsworth,Port Alsworth,AK,USA,60.20433333,-154.3188728
TQE,Municipal,Tekamah,NE,USA,41.76352778,-96.17794444
TQH,Tahlequah Municipal,Tahlequah,OK,USA,35.92891667,-95.00452778
TQK,Scott City Municipal,Scott City,KS,USA,38.47427778,-100.8849444
TRI,Tri-Cities Regional,Bristol,TN,USA,36.47521417,-82.40742056
TRK,Truckee-Tahoe,Truckee,CA,USA,39.32004222,-120.1395628
TRL,Terrell Municipal,Terrell,TX,USA,32.71004667,-96.26742306
TRM,Desert Resorts Regional,Palm Springs,CA,USA,33.62789944,-116.1601194
TRX,Trenton Municipal,Trenton,MO,USA,40.08351333,-93.59063472
TSO,Carroll County-Tolson,Carrollton,OH,USA,40.56186833,-81.07748611
TSP,Tehachapi Municipal,Tehachapi,CA,USA,35.13497222,-118.43925
TT01,Pagan Airstrip,Shomu-Shon,CQ,USA,18.12444444,-145.7686111
TTA,Sanford-Lee County Regional,Sanford,NC,USA,35.58247222,-79.10136111
TTD,Portland-Troutdale,Portland,OR,USA,45.54936889,-122.4012519
TTF,Monroe Custer,Monroe,MI,USA,41.93990639,-83.43468306
TTN,Trenton-Mercer County,Trenton,NJ,USA,40.27669111,-74.81346833
TUL,Tulsa International,Tulsa,OK,USA,36.19837222,-95.88824167
TUP,Tupelo Municipal,Tupelo,MS,USA,34.26810833,-88.769895
TUS,Tucson International,Tucson,AZ,USA,32.11608333,-110.9410278
TVB,Cabool Memorial,Cabool,MO,USA,37.13244083,-92.08396167
TVC,Cherry Capital,Traverse City,MI,USA,44.74144472,-85.582235
TVF,Thief River Falls Regional,Thief River Falls,MN,USA,48.06550028,-96.18336083
TVI,Thomasville Municipal,Thomasville,GA,USA,30.90155194,-83.88133556
TVK,Centerville Municipal,Centerville,IA,USA,40.68390306,-92.90103333
TVL,Lake Tahoe,South Lake Tahoe,CA,USA,38.89388167,-119.9953347
TVR,Vicksburg Tallulah Regional,Tallulah,LA,USA,32.35160639,-91.02768917
TVY,Tooele Valley,Tooele,UT,USA,40.6122725,-112.3507719
TWF,Joslin Field - Magic Valley,Twin Falls,ID,USA,42.48180389,-114.4877356
TWM,Richard B. Helgeson,Two Harbors,MN,USA,47.049225,-91.74514167
TXK,Texarkana Regional-Webb,Texarkana,AR,USA,33.45370806,-93.99102
TYL,Taylor,Taylor,AZ,USA,34.45283333,-110.1148056
TYQ,Indianapolis Terry,Indianapolis,IN,USA,40.03064972,-86.2514375
TYR,Tyler Pounds,Tyler,TX,USA,32.35413889,-95.40238611
TYS,McGhee-Tyson,Knoxville,TN,USA,35.81248722,-83.99285583
TZR,Bolton,Columbus,OH,USA,39.90081778,-83.13719361
TZT,Belle Plaine Municipal,Belle Plaine,IA,USA,41.87877778,-92.28456944
TZV,Tompkinsville-Monroe County,Tompkinsville,KY,USA,36.72978,-85.65191556
U02,McCarley,Blackfoot,ID,USA,43.20925,-112.3495861
U03,Buhl Municipal,Buhl,ID,USA,42.59157139,-114.7967178
U05,Riddick,Philipsburg,MT,USA,46.31936972,-113.3050642
U08,Perkins,Overton,NV,USA,36.56803,-114.4433133
U10,Preston,Preston,ID,USA,42.10690806,-111.9125389
U14,Nephi Municipal,Nephi,UT,USA,39.73884333,-111.8716011
U25,Dubois Municipal,Dubois,WY,USA,43.54834722,-109.6902611
U30,Temple Bar,Temple Bar,AZ,USA,36.02054056,-114.3352461
U34,Green River Muni,Green River,UT,USA,38.96136167,-110.2273619
U36,Aberdeen Municipal,Aberdeen,ID,USA,42.92102222,-112.8811053
U42,Salt Lake City Municipal 2,Salt Lake City,UT,USA,40.61954,-111.9928858
U43,Monticello,Monticello,UT,USA,37.937215,-109.3465053
U52,Beaver Municipal,Beaver,UT,USA,38.23071,-112.6753497
U55,Panguitch Municipal,Panguitch,UT,USA,37.84523333,-112.3918731
U59,Driggs-Reed Memorial,Driggs,ID,USA,43.74193056,-111.0978608
U68,North Big Horn County,Cowley/Lovell/Byron,WY,USA,44.91167028,-108.4455092
U69,Duchesne Municipal,Duchesne,UT,USA,40.19190167,-110.3809886
U70,Cascade,Cascade,ID,USA,44.4937825,-116.0162422
U76,Mountain Home Municipal,Mountain Home,ID,USA,43.13125278,-115.7295944
U77,Spanish Fork-Springville,Spanish Fork,UT,USA,40.14162139,-111.6613125
U82,Council Municipal,Council,ID,USA,44.7498875,-116.4468092
U96,Cal Black Memorial,Halls Crossing,UT,USA,37.44221444,-110.5695836
UAO,Aurora State,Aurora,OR,USA,45.24713889,-122.7700556
UBE,Cumberland Municipal,Cumberland,WI,USA,45.50597028,-91.98108694
UBS,Columbus-Lowndes County,Columbus,MS,USA,33.46539667,-88.38031639
UBX,Cuba Municipal,Cuba,MO,USA,38.06877667,-91.42885694
UCA,Oneida Cty,Utica,NY,USA,43.14511944,-75.38385889
UCP,New Castle Muni,New Castle,PA,USA,41.02533778,-80.41337194
UCY,Everett-Stewart,Union City,TN,USA,36.38025,-88.98547778
UDD,Bermuda Dunes,Palm Springs,CA,USA,33.7484375,-116.2748133
UDG,Darlington County,Darlington,SC,USA,34.44919444,-79.89036111
UES,Waukesha County,Waukesha,WI,USA,43.04102778,-88.23705556
UGN,Waukegan Regional,Chicago/Waukegan,IL,USA,42.42216,-87.86790694
UIL,Quillayute,Forks,WA,USA,47.93714444,-124.5612497
UIN,Quincy Municipal-Baldwin,Quincy,IL,USA,39.94262417,-91.19445611
UIZ,Berz-Macomb,Utica,MI,USA,42.66389361,-82.96542583
UKF,Wilkes County,North Wilkesboro,NC,USA,36.22284028,-81.0983375
UKI,Ukiah Municipal,Ukiah,CA,USA,39.12595722,-123.200855
UKL,Coffey County,Burlington,KS,USA,38.30248472,-95.7249575
UKT,Quakertown,Quakertown,PA,USA,40.43521194,-75.38192861
ULM,New Ulm Municipal,New Ulm,MN,USA,44.31957306,-94.50230778
ULS,Ulysses,Ulysses,KS,USA,37.60375278,-101.3733889
UMP,Indianapolis Metropolitan,Indianapolis,IN,USA,39.9352025,-86.04495333
UNI,Ohio University,Athens/Albany,OH,USA,39.21096222,-82.23142583
UNK,Unalakleet,Unalakleet,AK,USA,63.88835917,-160.7989517
UNO,West Plains Municipal,West Plains,MO,USA,36.87813889,-91.90269444
UNU,Dodge County,Juneau,WI,USA,43.42658333,-88.70322222
UNV,University Park,State College,PA,USA,40.84927778,-77.84869444
UOS,Franklin County,Sewanee,TN,USA,35.20397028,-85.89858889
UOX,University-Oxford,Oxford,MS,USA,34.38431528,-89.53530972
UPP,Upolu,Hawi,HI,USA,20.26525583,-155.8599875
USE,Fulton County,Wauseon,OH,USA,41.61033333,-84.12552778
UTS,Huntsville Municipal,Huntsville,TX,USA,30.74688667,-95.58716667
UUO,Willow,Willow,AK,USA,61.75441667,-150.0516639
UUU,Newport State,Newport,RI,USA,41.53243972,-71.28154389
UUV,Sullivan Regional,Sullivan,MO,USA,38.23343056,-91.16433333
UVA,Garner,Uvalde,TX,USA,29.21135028,-99.74358306
UWL,New Castle-Henry Co,New Castle,IN,USA,39.87585167,-85.32646806
UYF,Madison County,London,OH,USA,39.93272694,-83.46200361
UZA,Rock Hill Municipal/Bryant,Rock Hill,SC,USA,34.98783333,-81.05716667
VAK,Chevak,Chevak,AK,USA,61.53363583,-165.5837322
VAY,South Jersey Reg,Mount Holly,NJ,USA,39.94289056,-74.84571944
VBT,Bentonville Municipal,Bentonville,AR,USA,36.34571528,-94.219345
VCB,Nut Tree,Vacaville,CA,USA,38.37675167,-121.962455
VCT,Victoria Regional,Victoria,TX,USA,28.85255556,-96.91848722
VCV,Southern California Logistic,Victorville,CA,USA,34.593225,-117.3794667
VDI,Vidalia Municipal,Vidalia,GA,USA,32.19255556,-82.37194444
VDZ,Valdez,Valdez,AK,USA,61.13395028,-146.24836
VEE,Venetie,Venetie,AK,USA,67.02269444,-146.4137753
VEL,Vernal,Vernal,UT,USA,40.44090167,-109.5099203
VER,Jesse Viertel Memorial,Boonville,MO,USA,38.94577556,-92.68277139
VES,Darke County,Versailles,OH,USA,40.20441667,-84.53191667
VGT,North Las Vegas,Las Vegas,NV,USA,36.21166667,-115.19575
VHN,Culberson County,Van Horn,TX,USA,31.05784417,-104.7838056
VIH,Rolla National,Rolla/Vichy,MO,USA,38.12743222,-91.7695225
VIQ,Neillsville Municipal,Neillsville,WI,USA,44.55812861,-90.51224694
VIS,Visalia Municipal,Visalia,CA,USA,36.31866667,-119.3928889
VJI,Virginia Highlands,Abingdon,VA,USA,36.68711028,-82.03333583
VLA,Vandalia Municipal,Vandalia,IL,USA,38.99130556,-89.16622222
VLD,Valdosta Regional,Valdosta,GA,USA,30.7825,-83.27672222
VMR,Harold Davidson,Vermillion,SD,USA,42.76528917,-96.93425472
VNC,Venice Municipal,Venice,FL,USA,27.07161111,-82.44033333
VNW,Van Wert County,Van Wert,OH,USA,40.86472222,-84.60944444
VNY,Van Nuys,Van Nuys,CA,USA,34.20980972,-118.4899733
VPC,Cartersville,Cartersville,GA,USA,34.12313889,-84.84869444
VPS,Eglin Air Force Base,Valparaiso,FL,USA,30.48325,-86.5254
VPZ,Porter County Municipal,Valparaiso,IN,USA,41.45396667,-87.00707139
VQQ,Cecil,Jacksonville,FL,USA,30.21867306,-81.87666444
VQS,Antonio Rivera Rodriguez,Isla De Vieques,PR,USA,18.13551806,-65.49182583
VRB,Vero Beach Municipal,Vero Beach,FL,USA,27.65555556,-80.41794444
VSF,Springfield State/Hartness,Springfield,VT,USA,43.34362889,-72.5173125
VTA,Newark-Heath,Newark,OH,USA,40.024675,-82.46182194
VTI,Vinton Veterans Memorial Airpark,Vinton,IA,USA,42.21862611,-92.02592806
VTN,Miller,Valentine,NE,USA,42.85767194,-100.547355
VUJ,Stanly County,Albemarle,NC,USA,35.41669472,-80.15079556
VUO,Pearson Airpark,Vancouver,WA,USA,45.6204525,-122.6564883
VVV,Ortonville Municipal,Ortonville,MN,USA,45.30566472,-96.42442278
VYS,Illinois Valley Regional,Peru/Lasalle,IL,USA,41.35186806,-89.15308417
W04,Ocean Shores Municipal,Ocean Shores,WA,USA,47.00369806,-124.143785
W05,Gettysburg  & Travel Center,Gettysburg,PA,USA,39.84092833,-77.27415139
W11,Menomonie Municipal - Score,Menomonie,WI,USA,44.89234639,-91.86777944
W22,Upshur County Regional,Buckhannon,WV,USA,39.00035833,-80.27392778
W29,Bay Bridge Industrial,Stevensville,MD,USA,38.97638889,-76.32963889
W31,Lunenburg County,Kenbridge,VA,USA,36.96015,-78.18499861
W33,Friday Harbor,Friday Harbor,WA,USA,48.53732194,-123.0096236
W40,Mt Olive Municipal,Mt Olive,NC,USA,35.22224722,-78.03779444
W41,Crisfield Municipal,Crisfield,MD,USA,38.01679028,-75.82882056
W44,Asheboro Municipal,Asheboro,NC,USA,35.6538825,-79.8950425
W45,Luray Caverns,Luray,VA,USA,38.66705556,-78.50058333
W66,Warrenton-Fauquier,Warrenton,VA,USA,38.58704667,-77.71138389
W78,William M Tuck,South Boston,VA,USA,36.710045,-78.84802028
W95,Ocracoke Island,Ocracoke,NC,USA,35.10117083,-75.96595278
W96,New Kent County,Quinton,VA,USA,37.50320139,-77.12552694
W97,Middle Peninsula Regional,West Point,VA,USA,37.52122778,-76.7646825
W99,Grant County,Petersburg,WV,USA,38.99419444,-79.14438889
WA10,Grove,Camas/Washougal,WA,USA,45.62777778,-122.4041667
WA21,Grand Coulee Dam,Electric City,WA,USA,47.92348361,-119.0805789
WA31,Whidbey Air Park,Langley,WA,USA,48.01814917,-122.4384789
WA43,Odessa Municipal,Odessa,WA,USA,47.3582025,-118.6733264
WAY,Greene Cty,Waynesburg,PA,USA,39.900075,-80.13311667
WBB,Stebbins,Stebbins,AK,USA,63.51591972,-162.2827394
WBQ,Beaver,Beaver,AK,USA,66.36155056,-147.4012186
WBW,Wilkes-Barre Wyoming Valley,Wilkes-Barre,PA,USA,41.29717222,-75.85120556
WCR,Chandalar Lake,Chandalar Lake,AK,USA,67.50451667,-148.4832222
WDG,Enid Woodring Municipal,Enid,OK,USA,36.37920333,-97.79111222
WDR,Winder,Winder,GA,USA,33.98227778,-83.66808333
WHP,Whiteman,Los Angeles,CA,USA,34.25932528,-118.4134331
WJF,General Wm. J. Fox Airfield,Lancaster,CA,USA,34.74095944,-118.2189489
WLD,Strother,Winfield/Arkansas City,KS,USA,37.16861556,-97.03752194
WLK,Selawik,Selawik,AK,USA,66.60002778,-159.9861944
WLW,Willows-Glenn County,Willows,CA,USA,39.51635389,-122.2175106
WMC,Winnemucca Municipal,Winnemucca,NV,USA,40.89661111,-117.8058889
WMO,White Mountain,White Mountain,AK,USA,64.68919444,-163.4125556
WNA,Napakiak,Napakiak,AK,USA,60.69118917,-161.9695161
WRG,Wrangell,Wrangell,AK,USA,56.48432583,-132.3698242
WRL,Worland Muni,Worland,WY,USA,43.96571306,-107.9508308
WSM,Wiseman,Wiseman,AK,USA,67.40457333,-150.1227417
WSN,South Naknek 2,South Naknek,AK,USA,58.70343611,-157.0082511
WST,Westerly State,Westerly,RI,USA,41.34961694,-71.80337778
WTK,Noatak,Noatak,AK,USA,67.56208333,-162.9752778
WVI,Watsonville Municipal,Watsonville,CA,USA,36.93573,-121.7896178
WVL,Waterville-Robert Lafleur,Waterville,ME,USA,44.53325,-69.67552778
WWD,Cape May Cty,Wildwood,NJ,USA,39.00850694,-74.90827389
WWR,West Woodward,Woodward,OK,USA,36.4367025,-99.5209975
WYS,Yellowstone,West Yellowstone,MT,USA,44.68839917,-111.1176375
X01,Everglades,Everglades,FL,USA,25.84871167,-81.39007944
X06,Arcadia Municipal,Arcadia,FL,USA,27.19199444,-81.83730472
X07,Lake Wales Municipal,Lake Wales,FL,USA,27.89380556,-81.62038889
X10,Belle Glade Municipal,Belle Glade,FL,USA,26.70089833,-80.66227972
X14,Labelle Municipal,Labelle,FL,USA,26.74423278,-81.43257556
X16,Vandenberg,Tampa,FL,USA,28.01398389,-82.34527917
X21,Arthur Dunn Airpark,Titusville,FL,USA,28.62234556,-80.835695
X23,Umatilla Municipal,Umatilla,FL,USA,28.922765,-81.65174111
X26,Sebastian Municipal,Sebastian,FL,USA,27.81280389,-80.49560833
X35,Dunnellon/Marion Co.,Dunellon,FL,USA,29.06177778,-82.37658333
X40,Inverness,Inverness,FL,USA,28.80859639,-82.31648167
X44,Watson Island Base,Miami,FL,USA,25.77833333,-80.17027778
X46,Opa-Locka West,Miami,FL,USA,25.94898194,-80.42338694
X47,Flagler County,Bunnell,FL,USA,29.46738889,-81.20633333
X51,Homestead General Aviation,Homestead,FL,USA,25.49872139,-80.55422528
X59,Valkaria,Valkaria,FL,USA,27.96196472,-80.55977556
X60,Williston Municipal,Williston,FL,USA,29.35422,-82.47288194
X63,Humacao,Humacao,PR,USA,18.13801667,-65.8007175
X66,Charlotte Amalie Harbor Seaplane Base,Charlotte Amalie,VI,USA,18.33856722,-64.94070111
X67,Christiansted Harbor Seaplane Base,Christiansted,VI,USA,17.74719528,-64.70486444
X95,Diego Jimenez Torres,Fajardo,PR,USA,18.30800972,-65.66182806
X96,Cruz Bay Harbor Seaplane Base,Cruz Bay,VI,USA,18.33689833,-64.79958306
XNA,Northwest Arkansas Regional,Fayetteville/Springdale/Rogers,AR,USA,36.28186944,-94.30681111
XVG,Longville Municipal,Longville,MN,USA,46.99016361,-94.20400222
Y03,Springfield Municipal,Springfield,SD,USA,42.87999833,-97.90117972
Y14,Marv Skie-Lincoln County,Tea,SD,USA,43.45747694,-96.80199528
Y15,Cheboygan City-County,Cheboygan,MI,USA,45.65371028,-84.51927306
Y19,Mandan Municipal,Mandan,ND,USA,46.76823667,-100.8943433
Y27,Standing Rock,Fort Yates,ND,USA,46.06638556,-100.6348492
Y31,West Branch Community,West Branch,MI,USA,44.244825,-84.17980472
Y37,Park River Municipal,Park River,ND,USA,48.39443778,-97.78147889
Y47,New Hudson,New Hudson,MI,USA,42.50311694,-83.62371667
Y50,Wautoma Municipal,Wautoma,WI,USA,44.04162556,-89.30448694
Y51,Viroqua Municipal,Viroqua,WI,USA,43.57913917,-90.90096333
Y55,Crandon Municipal,Crandon,WI,USA,45.51662972,-88.93344694
Y63,Elbow Lake Municipal,Elbow Lake,MN,USA,45.98607111,-95.99199861
Y66,Drummond Island,Drummond Island,MI,USA,46.00931139,-83.74393417
Y68,Tracy Municipal,Tracy,MN,USA,44.24995694,-95.60445389
Y70,Ionia County,Ionia,MI,USA,42.93769972,-85.06066722
Y74,Hankins,Parshall,ND,USA,47.93640083,-102.1421142
Y83,Sandusky City,Sandusky,MI,USA,43.45418694,-82.84938028
Y93,Atlanta Municipal,Atlanta,MI,USA,45.00000833,-84.13333667
YAK,Yakutat,Yakutat,AK,USA,59.50336056,-139.6602261
YAP,Yap International,NA,NA,Federated States of Micronesia,9.5167,138.1
YIP,Willow Run,Detroit,MI,USA,42.2379275,-83.53040889
YKM,Yakima Air Terminal,Yakima,WA,USA,46.56816972,-120.5440594
YKN,Chan Gurney Municipal,Yankton,SD,USA,42.91669444,-97.38594444
YNG,Youngstown-Warren Regional,Youngstown,OH,USA,41.26073556,-80.67909667
YUM,Yuma MCAS-Yuma International,Yuma,AZ,USA,32.65658333,-114.6059722
Z08,Ofu,Ofu Village,AS,USA,14.18435056,-169.6700236
Z09,Kasigluk,Kasigluk,AK,USA,60.87202194,-162.5248094
Z13,Akiachak,Akiachak,AK,USA,60.90453167,-161.42091
Z17,Ophir,Ophir,AK,USA,63.1460375,-156.529865
Z40,Goose Bay,Goose Bay,AK,USA,61.39445139,-149.8455556
Z55,Lake Louise,Lake Louise,AK,USA,62.29368944,-146.5794219
Z73,Nelson Lagoon,Nelson Lagoon,AK,USA,56.00753611,-161.1603672
Z84,Clear,Clear A.F.B.,AK,USA,64.30120361,-149.1201436
Z91,Birch Creek,Birch Creek,AK,USA,66.27399583,-145.8240381
Z95,Cibecue,Cibecue,AZ,USA,34.00333333,-110.4441667
ZEF,Elkin Municipal,Elkin,NC,USA,36.28002361,-80.78606861
ZER,Schuylkill Cty/Joe Zerbey,Pottsville,PA,USA,40.70644889,-76.37314667
ZPH,Zephyrhills Municipal,Zephyrhills,FL,USA,28.22806472,-82.15591639
ZUN,Black Rock,Zuni,NM,USA,35.08322694,-108.7917769
ZZV,Zanesville Municipal,Zanesville,OH,USA,39.94445833,-81.89210528
`;
let start = Date.now();
let result = csvParse(airportCSVString);
if (globalThis.document) {
  document.body.textContent = `Parsing CSV took ${(Date.now() - start).toFixed(
    2
  )}ms for ${result.length} rows`;
} else {
  console.log(
    `Parsing CSV took ${(Date.now() - start).toFixed(2)}ms for ${result.length} rows`
  );
}
