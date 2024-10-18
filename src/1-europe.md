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
      titre = "Volume en milliers de tonnes";
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
      titre = "Volume en milliers de tonnes ";
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
    display(`Centroid not found for ${id}`);
  }
});
```



```js
const codeMapping = {
  "EL":"GR",
  "UK":"GB",
  "GE":"DE"
};
// display(transformedData);

// Remplacez les codes dans transformedData avec ceux de la carte
const correctedData = transformedData.map(d => ({
  ...d,
  geo: codeMapping[d.geo] || d.geo // Utilise le code corrigé ou laisse tel quel
}));
// display(correctedData);

const filteredData = correctedData.filter(d => d.unit === unit_choix).filter(d => d.tot > 0);
//display(filteredData);

```

```js
//display(filteredData);
//display(filteredData);
function createPlot_carte(width){

// Ajuster la taille du graphique en fonction de la largeur de l'écran
const adjustedWidth = Math.max(300, width); // Limite la largeur entre 300px et 600px pour les petits écrans
const adjustedHeight = width * 0.8; // Hauteur proportionnelle, réduite pour les petits écrans

// Réduire le rayon pour les petits écrans
const radius = d3.scaleSqrt([0, d3.max(filteredData, d => d.tot)], [1, adjustedWidth * 0.1]); // Ajuste la plage du rayon

const plot_carte = Plot.plot({
    width: adjustedWidth,
    height: adjustedHeight,
    projection: {
        type: "azimuthal-equidistant",
        domain: pays
    },
    r: { range: [0, 20] }, // Limite le rayon max à 20 pour les petits écrans
    marks: [
        Plot.geo(pays, {fill: "currentColor", fillOpacity: 0.4, stroke: "var(--theme-background-alt)"}),
        Plot.dot(filteredData, {
            x: d => centroids.get(d.geo)[0], 
            y: d => centroids.get(d.geo)[1], 
            r: d => radius(d.tot), 
            fill: "#206095", 
            stroke: "#ccc",
            title: d => {
                // Si d.unit est "EUR_T", afficher "€/kg", sinon ajouter "k" devant d.unit
                const unit_affiche = d.unit === "EUR_T" ? "€/kg" : "k" + d.unit;

                // Formater d.tot avec des séparateurs de milliers
                const formattedTot = d.tot.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                // Formater le texte pour l'info-bulle
                return d.label + " : " + formattedTot + " " + unit_affiche;
            }
        })
    ]
});
return plot_carte;
}
```

```js
function createChoroCarte(width) {
    // Ajuster la taille du graphique en fonction de la largeur de l'écran
    const adjustedWidth = Math.max(300, width); // Limite la largeur entre 300px et 600px pour les petits écrans
    const adjustedHeight = width * 0.8; // Hauteur proportionnelle, réduite pour les petits écrans

    // Créer une échelle de couleur pour les prix
const colorScale = d3.scaleSequential(d3.interpolateCividis)
  .domain([0, d3.max(filteredData, d => d.tot)]);
//display(filteredData);
    const plot_carte = Plot.plot({
        width: adjustedWidth,
        height: adjustedHeight,
        projection: {
            type: "azimuthal-equidistant",
            domain: pays
        },
        color: {
            type: "quantize",
            n: 9,
            domain: [0, d3.max(filteredData, d => d.tot)], // Définit le domaine basé sur les valeurs de 'tot'
            scheme: "cividis",
            label: "Prix de vente (€/kg)",
            legend: true // Ajoute la légende
        },
        marks: [
            Plot.geo(pays, {
                fill: d => {
                    const matchingData = filteredData.find(data => data.geo === d.id); // Utilise d.id pour faire correspondre avec filteredData
                    return matchingData ? colorScale(matchingData.tot) : "gainsboro"; // Couleur par défaut si aucune donnée
                },
                fillOpacity: 0.8,
                stroke: "white", // Couleur bleue foncée pour les contours
                strokeWidth: 1.2 // Épaisseur des contours
            }),
        ]
    });

    return plot_carte;
}
//display(filteredData);
//display(pays);
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
<div class="card">

## Production en Europe 

${
  resize((width) => {
    if (choix_variable === "Prix") {
      return createChoroCarte(width); // Appel de createChoroCarte si choix_variable est "Prix"
    } else {
      return createPlot_carte(width); // Sinon, appel de createPlot_carte
    }
  })
}
*Source : Eurostat* 

</div>
<div class="card">${
    resize((width) => createEChartsFromData2(width, option))
  }

*Source : Eurostat* 
</div>
</div>
