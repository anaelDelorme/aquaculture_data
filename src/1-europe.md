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
const volume_tot_init = 0;
const list_geo = FileAttachment("data/liste_geo.parquet").parquet();
const list_annee = FileAttachment("data/liste_annee.parquet").parquet();
const list_espece = FileAttachment("data/liste_espece.parquet").parquet();
```  
```js
const data_europe = FileAttachment("data/detailaq2a_eur.parquet").parquet();
const allData = DuckDBClient.of({data_europe});
``` 
```js
const list_code_geo_dans_data = allData.sql`SELECT DISTINCT geo FROM data_europe`;
const list_code_espece_dans_data = allData.sql`SELECT DISTINCT species FROM data_europe`;
``` 
```js
const tab_list_code_geo_dans_data = extractColumns(list_code_geo_dans_data);
const tab_list_code_espece_dans_data = extractColumns(list_code_espece_dans_data);
```
```js
const list_geo_extract = extractColumns(list_geo);
const codes_geo = list_geo_extract["CODE"];
const labels_geo = list_geo_extract["Label - French"];
const geoOptions = codes_geo
.map((code, index) => ({
  value: code,
  label: `${code} - ${labels_geo[index]}`
}))
.filter(item => tab_list_code_geo_dans_data["geo"].includes(item.value))
.sort((a, b) => {
    const aStartsWithEU = a.value.startsWith("EU");
    const bStartsWithEU = b.value.startsWith("EU");

    // Place 'EU' codes first
    if (aStartsWithEU && !bStartsWithEU) return -1;
    if (!aStartsWithEU && bStartsWithEU) return 1;

    // If both are the same type (both EU or both not EU), sort alphabetically
    return a.value.localeCompare(b.value);

  });
const choix_list_geo = view(Inputs.select(geoOptions, { label: "Liste des pays", format: d => d.label }));

const list_espece_extract = extractColumns(list_espece);
const codes_espece = list_espece_extract["CODE"];
const labels_espece = list_espece_extract["Label - French"];
const especeOptions = codes_espece
.map((code, index) => ({
  value: code,
  label: `${code} - ${labels_espece[index]}`
}))
.filter(item => tab_list_code_espece_dans_data["species"].includes(item.value)).sort((a, b) => {
    const regexFNumber = /^F\d/;
    const aStartsWithFNumber = regexFNumber.test(a.value);
    const bStartsWithFNumber = regexFNumber.test(b.value);

    // Place codes starting with 'F' followed by a number first
    if (aStartsWithFNumber && !bStartsWithFNumber) return -1;
    if (!aStartsWithFNumber && bStartsWithFNumber) return 1;

    // If both are the same type (both F followed by a number or neither), sort alphabetically
    return a.value.localeCompare(b.value);
  });
const choix_list_espece = view(Inputs.select(especeOptions, { label: "Liste des espèces", format: d => d.label }));

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
                                  AND aquameth = 'TOTAL'
                                GROUP BY unit`, [choix_list_espece.value, choix_list_geo.value, choix_list_annee]);
```
```js
const columns = extractColumns(data_europe_complet);
const isDataEmpty = columns["tot"].length === 0;

const formatValue = (index) => {
  if (isDataEmpty) return "0";
  
  let unit = columns["unit"][index];
  let valeur = columns["tot"][index];
  if (unit === "TLW"){
    unit = "Tonnes";
    valeur = parseFloat(valeur).toFixed(1);
  };
  if (unit === "EUR"){
    unit = "€";
    valeur = parseFloat(valeur).toFixed(1);
  };
  if (unit === "EUR_T"){
    unit = "€/kg";
    valeur = parseFloat(valeur/1000).toFixed(2);
  }; 

  valeur = parseFloat(valeur).toLocaleString("fr-FR");

  return valeur + " " + unit;
};

const valeur_tot = formatValue(0);
const pu_tot = formatValue(1);
const volume_tot = formatValue(2);
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

