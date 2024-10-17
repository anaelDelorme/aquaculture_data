---
theme: dashboard
title: Europe
toc: false
sql:
  allData: ./data/detailaq2a_eur.parquet
  data_geo: ./data/liste_geo.parquet
  data_annee: ./data/liste_annee.parquet
  data_espece: ./data/liste_espece.parquet
---

```js
import {extractColumns} from "./components/extractColumns.js";
```

```sql id=list_geo_dans_data
SELECT DISTINCT geo as label
FROM allData
```

```sql id=list_code_espece_dans_data
SELECT DISTINCT species FROM allData
```
```sql id=list_geo
SELECT DISTINCT dg.CODE as code, 
  dg."Label - French" as label,
  CONCAT(dg.CODE, ' - ', dg."Label - French") as code_label
FROM data_geo dg
JOIN allData ad ON dg.CODE = ad.geo
ORDER BY
  CASE 
    WHEN dg.CODE LIKE 'EU%' THEN 0
    ELSE 1
  END,
  dg.CODE
```

```sql id=list_espece
SELECT DISTINCT de.CODE as code, 
  de."Label - French" as label,
  CONCAT(de.CODE, ' - ', de."Label - French") as code_label
FROM data_espece de
JOIN allData ad ON de.CODE = ad.species
ORDER BY
  CASE 
    WHEN de.CODE ~ '^(F[0-9]+)$' THEN 0
    ELSE 1
  END,
  code_label
```
```sql id=list_annee
SELECT DISTINCT TIME_PERIOD 
FROM data_annee
ORDER BY TIME_PERIOD DESC
```
```sql id=data_europe_complet
SELECT sum(OBS_VALUE) as tot, unit
                                FROM allData
                                WHERE species = ${choix_list_espece.code}
                                  AND geo = ${choix_list_geo.code}
                                  AND TIME_PERIOD = ${choix_list_annee.TIME_PERIOD}
                                  AND aquaenv = 'TOTAL'
                                  AND fishreg = '0'
                                  AND aquameth = 'TOTAL'
                                GROUP BY unit
``` 


# Production aquacole européenne 🇪🇺

<!-- affichage des listes -->
```js
const choix_list_geo = view(Inputs.select(list_geo, { label: "Liste des pays", format: d => d.code_label }));
const choix_list_espece = view(Inputs.select(list_espece, { label: "Liste des espèces", format: d => d.code_label}));
const choix_list_annee = view(Inputs.select(list_annee, { label: "Choix de l'année", format: d => d.TIME_PERIOD}));
```
<!-- Cards with big numbers -->

```js
const columns = extractColumns(data_europe_complet);
const isDataEmpty = columns["tot"].length === 0 || columns["tot"].every(value => value === 0 || value === null);

const formatValue = (index) => {
  if (isDataEmpty) return "--";
  
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
<div class="grid grid-cols-3">

<!-- Card Volume -->
  <div class="card">

## Volume 🛒
  <span class="big">${volume_tot}</span>
  </div>

<!-- Card Valeur -->
  <div class="card">

## Valeur  💰
  <span class="big">${valeur_tot}</span>
  </div>
  
<!-- Card Prix moyen -->

  <div class="card">

## Prix moyen 🏷️
  <span class="big">${pu_tot}</span>
  </div>
</div>


## *${choix_list_espece.label}* en *${choix_list_annee.TIME_PERIOD}*
```js
const choix_variable = view(Inputs.radio(["Volume", "Valeur", "Prix"], {label: "", value: "Volume"}));

```

```js
function fc_unit_choix(type) {
  let unit;
  let titre;
  switch (type) {
    case 'Volume':
      unit = 'TLW';
      titre = "Volume en milliers de tonnes équivalent poids vif";
      break;
    case 'Valeur':
      unit = 'EUR';
      titre = "Valeur des ventes en k€";
      break;
    case 'Prix':
      unit = 'EUR_T';
      titre = "Prix de vente en €/kg";
      break;
    default:
      unit = 'TLW';
      titre = "Volume en tonnes équivalent poids vif";
  }
  return [unit, titre];
} 
const [unit_choix, titre_choix] = fc_unit_choix(choix_variable);
```
<!--Carte de la production par pays-->

```sql id=data_europe_espece 
SELECT DISTINCT 
  al.geo, 
  sum(OBS_VALUE)/1000 as tot, 
  unit, 
  da."Label - French" as label
FROM 
  allData al
JOIN 
  data_geo da ON al.geo = da.CODE
WHERE 
  species = ${choix_list_espece.code} 
  AND TIME_PERIOD = ${choix_list_annee.TIME_PERIOD} 
  AND aquaenv = 'TOTAL' 
  AND fishreg = '0' 
  AND aquameth = 'TOTAL' 
  AND geo NOT IN ('EU', 'EU28', 'EU27_2020')
GROUP BY 
  unit, al.geo, da."Label - French"
``` 



```js
const fond_carte_europe = FileAttachment("data/europe.topojson").json();
```

```js
const pays = topojson.feature(fond_carte_europe, fond_carte_europe.objects.europe);
```

```js

const data = extractColumns(data_europe_espece);
const transformedData = data.geo.map((geo, index) => ({
  geo: geo,
  tot: data.tot[index],
  unit: data.unit[index],
  label: data.label[index]
}));

const centroid = d3.geoPath().centroid;
const centroids = new Map();
pays.features.forEach(feature => {
  const id = feature.id;
  const [lng, lat] = centroid(feature);
  if (lng && lat) {
    centroids.set(id, [lng, lat]);
  } else {
    console.log(`Centroid not found for ${id}`);
  }
});
```



```js
const codeMapping = {
  "EL":"GR"
};

// Remplacez les codes dans transformedData avec ceux de la carte
const correctedData = transformedData.map(d => ({
  ...d,
  geo: codeMapping[d.geo] || d.geo // Utilise le code corrigé ou laisse tel quel
}));

const filteredData = correctedData.filter(d => d.unit === unit_choix);

```

```js
const radius = d3.scaleSqrt([0, d3.max(filteredData, d => d.tot)], [3, 40]);

const plot_carte = Plot.plot({
    width,
    height: width * 0.67,
    projection: {
      type: "azimuthal-equidistant",
      domain: pays
    },
  r: { range: [0, 40] },
  marks: [
  Plot.geo(pays, {fill: "currentColor", fillOpacity: 0.4, stroke: "var(--theme-background-alt)"}),
Plot.dot(filteredData, {
      x: d => centroids.get(d.geo)[0], 
      y: d => centroids.get(d.geo)[1], 
      r: d => radius(d.tot), 
      fill: "#206095", 
      stroke: "#ccc",
      title: d => d.label
    })
  ]
})
```
```js
import {createOptionsEChartsFromData} from "./components/histoEcharts.js";
function createEChartsFromData2(width, option) {
    // Initialiser le graphique ECharts
    const container = display(html`<div style="width: ${width}px; height:400px;"></div>`);
    const myChart = echarts.init(container);
    myChart.setOption(option);
    return container;
}
```

```js
const option = createOptionsEChartsFromData(data_europe_espece, width, unit_choix, titre_choix);
```

<div class="grid grid-cols-2">
<div class="card">${
    plot_carte
  }
</div>
<div class="card">${
    resize((width) => createEChartsFromData2(width, option))
  }
</div>
</div>
