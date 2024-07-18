---
theme: dashboard
title: Europe
toc: false
---
```js
import {extractColumns} from "./components/extractColumns.js";
```
# Rocket launches 🚀

<!-- Load and transform the data -->

```js
const launches = FileAttachment("data/launches.csv").csv({typed: true});
const data_europe = FileAttachment("data/detailaq2a_eur.parquet").parquet();
const allData = DuckDBClient.of({data_europe});
```

```js
const col_geo = await allData.sql`SELECT DISTINCT geo FROM data_europe`;
const col_geo_extract = extractColumns(col_geo);

const col_species = await allData.sql`SELECT DISTINCT species FROM data_europe`;
const col_species_extract = extractColumns(col_species);

const col_time = await allData.sql`SELECT DISTINCT TIME_PERIOD FROM data_europe`;
const col_time_extract = extractColumns(col_time);
```           

```js
const choix_list_geo = view(Inputs.select(col_geo_extract["geo"].sort(), { label: "Liste des pays" }));
const choix_list_species = view(Inputs.select(col_species_extract["species"].sort(), { label: "Liste des espèces" }));
function convertirEnVarchar(tableau) {
    return tableau.map((valeur) => valeur.toString());
};
const annee_string = convertirEnVarchar(col_time_extract["TIME_PERIOD"]).sort();
const choix_list_anneee = view(Inputs.select(annee_string, { label: "Choix de l'année" }));



Inputs.table(data_europe)
```

```js
const color = Plot.scale({
  color: {
    type: "categorical",
    domain: d3.groupSort(launches, (D) => -D.length, (d) => d.state).filter((d) => d !== "Other"),
    unknown: "var(--theme-foreground-muted)"
  }
});
```

<!-- Cards with big numbers -->

<div class="grid grid-cols-4">
  <div class="card">
    <h2>EUROPE 🇺🇸</h2>
    <span class="big">${launches.filter((d) => d.stateId === "US").length.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Russia 🇷🇺 <span class="muted">/ Soviet Union</span></h2>
    <span class="big">${launches.filter((d) => d.stateId === "SU" || d.stateId === "RU").length.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>China 🇨🇳</h2>
    <span class="big">${launches.filter((d) => d.stateId === "CN").length.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Other</h2>
    <span class="big">${launches.filter((d) => d.stateId !== "US" && d.stateId !== "SU" && d.stateId !== "RU" && d.stateId !== "CN").length.toLocaleString("en-US")}</span>
  </div>
</div>

<!-- Plot of launch history -->

```js
function launchTimeline(data, {width} = {}) {
  return Plot.plot({
    title: "Launches over the years",
    width,
    height: 300,
    y: {grid: true, label: "Launches"},
    color: {...color, legend: true},
    marks: [
      Plot.rectY(data, Plot.binX({y: "count"}, {x: "date", fill: "state", interval: "year", tip: true})),
      Plot.ruleY([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => launchTimeline(launches, {width}))}
  </div>
</div>

<!-- Plot of launch vehicles -->

```js
function vehicleChart(data, {width}) {
  return Plot.plot({
    title: "Popular launch vehicles",
    width,
    height: 300,
    marginTop: 0,
    marginLeft: 50,
    x: {grid: true, label: "Launches"},
    y: {label: null},
    color: {...color, legend: true},
    marks: [
      Plot.rectX(data, Plot.groupY({x: "count"}, {y: "family", fill: "state", tip: true, sort: {y: "-x"}})),
      Plot.ruleX([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => vehicleChart(launches, {width}))}
  </div>
</div>

Data: Jonathan C. McDowell, [General Catalog of Artificial Space Objects](https://planet4589.org/space/gcat)
