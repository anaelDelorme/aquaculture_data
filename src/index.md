---
toc: false
---
```js
import {createOptionsEChartsFromData} from "./components/graphHisto.js";
function createEChartsFromData2(width, option) {
    // Initialiser le graphique ECharts
    const container = display(html`<div style="width: ${width}px; height:400px;"></div>`);
    const myChart = echarts.init(container);
    myChart.setOption(option);
    return container;
}
```

```js
//const data_europe = FileAttachment("data/fishaq2a.parquet").parquet();
const data_europe = FileAttachment("data/totalaq2a_eur.parquet").parquet();
const data_fr = FileAttachment("data/totalaq2a_fr.parquet").parquet();
const data_europe_old = FileAttachment("data/totalaq_q_eur.parquet").parquet();
const data_fr_old = FileAttachment("data/totalaq_q_fr.parquet").parquet();
const data_europe_oldest = FileAttachment("data/totalaq_qh_eur.parquet").parquet();
const data_fr_oldest = FileAttachment("data/totalaq_qh_fr.parquet").parquet();


const db_data_europe = DuckDBClient.of({data_europe, data_europe_old, data_europe_oldest});
const db_data_fr = DuckDBClient.of({data_fr, data_fr_old, data_fr_oldest});

```
```js
const data_europe_complet = db_data_europe.sql`SELECT * FROM data_europe 
                                          UNION ALL SELECT * FROM data_europe_old 
                                          UNION ALL SELECT * FROM data_europe_oldest
                                          ORDER BY TIME_PERIOD`;
const data_fr_complet = db_data_fr.sql`SELECT * FROM data_fr 
                                          UNION ALL SELECT * FROM data_fr_old 
                                          UNION ALL SELECT * FROM data_fr_oldest
                                          ORDER BY TIME_PERIOD`;
```

```js
//console.log('LA',data_europe_complet);
const optionEUR = createOptionsEChartsFromData(data_europe_complet, width, "TIME_PERIOD");
const optionFR = createOptionsEChartsFromData(data_fr_complet, width, "TIME_PERIOD");
```


<div class="hero">
  <h1>Aquaculture</h1>
  <h2>Bienvenue sur le site de présentation des statistiques de l'aquaculture en France et en Europe.</h2>


</div>

<div class="grid grid-cols-2" style="grid-auto-rows: 504px;">
  <div class="card">
  <h1>Production aquacole - Europe à 27</h1>
  ${
    resize((width) => createEChartsFromData2(width, optionEUR))
  }
<center><span style="font-size: X-small;">Volume en tonnes équivalent poids vif (TLW)</span></center>
<center><i style="font-size: X-small;">Source: Eurostat fish_aq2a, fish_aq_q, fish_aq_qh</i></center>

  </div>
  <div class="card">
     <h1>Production aquacole en France</h1>
  ${
    resize((width) => createEChartsFromData2(width, optionFR))
  }
<center><span style="font-size: X-small;">Volume en tonnes équivalent poids vif (TLW)</span></center>
<center><i style="font-size: X-small;">Source: Eurostat fish_aq2a, fish_aq_q, fish_aq_qh</i></center>

  </div>
</div>

---

## Données détaillées

En savoir plus sur l'aquaculture...

<div class="grid grid-cols-2">
  
  <div class="card">
    <h1>  En Europe</h1>
    <a href="./1-europe">
      <img src="./img/europe.jfif" width="100%" alt = "Europe"/>
    </a>
  </div>

  <div class="card">
    <h1>  En France</h1>
    <a href="./2-france">
      <img src="./img/france.jfif" width="100%" alt = "France"/>
    </a>
  </div>  
</div>
<br/>
<center>
  <a href="https://agreste.agriculture.gouv.fr/agreste-web/">+ de données sur Agreste 🇫🇷</a><br/>
    <a href="https://ec.europa.eu/eurostat/web/fisheries/database">et sur le site d'Eurostat 🇪🇺</a>
    </center>

<style>

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 8rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

</style>
