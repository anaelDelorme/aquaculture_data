---
theme: dashboard
title: Europe
toc: false
---
```js
import {extractColumns} from "./components/extractColumns.js";
```
# Production aquacole européenne 🚀

<!-- Load and transform the data -->

```js
const launches = FileAttachment("data/launches.csv").csv({typed: true});
const list_geo = FileAttachment("data/liste_geo.parquet").parquet();
const list_annee = FileAttachment("data/liste_annee.parquet").parquet();
const list_espece = FileAttachment("data/liste_espece.parquet").parquet();

```  
```js
const data_europe = FileAttachment("data/detailaq2a_eur.parquet").parquet();
const allData = DuckDBClient.of({data_europe});
``` 
```js
const list_geo_extract = extractColumns(list_geo)["geo"].sort();
const choix_list_geo = view(Inputs.select(list_geo_extract, { label: "Liste des pays", value: "EU27_2020"}));

const list_espece_extract = extractColumns(list_espece)["species"].sort();
const choix_list_espece = view(Inputs.select(list_espece_extract, { label: "Liste des espèces", value: "F00"}));

function convertirEnVarchar(tableau) {
    return tableau.map((valeur) => valeur.toString());
};
const list_annee_extract = convertirEnVarchar(extractColumns(list_annee)["TIME_PERIOD"].sort());
const dateJour = new Date();
const annee_precedente   = (dateJour.getUTCFullYear() - 2).toString(); 
const choix_list_annee = view(Inputs.select(list_annee_extract, { label: "Choix de l'année", value: annee_precedente}));
```

```js
const data_europe_complet = allData.query(`SELECT sum(OBS_VALUE) as tot, unit
                                FROM data_europe
                                WHERE species = ?
                                  AND geo = ?
                                  AND TIME_PERIOD = ?
                                  AND aquaenv = 'TOTAL'
                                  AND fishreg = '0'
                                GROUP BY unit`, [choix_list_espece, choix_list_geo, choix_list_annee]);
```
```js
const valeur_tot = extractColumns(data_europe_complet)["tot"][0].toLocaleString("fr-FR").toString() + " " + extractColumns(data_europe_complet)["unit"][0];

const pu_tot = extractColumns(data_europe_complet)["tot"][1].toLocaleString("fr-FR").toString() + " " + extractColumns(data_europe_complet)["unit"][1];

const volume_tot = extractColumns(data_europe_complet)["tot"][2].toLocaleString("fr-FR").toString() + " " + extractColumns(data_europe_complet)["unit"][2];
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

<div class="grid grid-cols-3">
  <div class="card">

## Volume 🛒
    
  <span class="big">${volume_tot}</span>
  </div>
  <div class="card">

## Valeur  💰
  <span class="big">${valeur_tot}</span>
  </div>
  <div class="card">

## Prix moyen 🏷️
    
  <span class="big">${pu_tot}</span>
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
