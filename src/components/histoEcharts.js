import * as echarts from "npm:echarts";
import {extractColumns} from "./extractColumns.js";

// Fonction pour créer le graphique ECharts
export function createOptionsEChartsFromData(data, width, unit_choix, titleChart = "") {
    // Utilisation de la fonction extractColumns pour obtenir les colonnes
    const columns = extractColumns(data);

    // Vérifie que les colonnes label et tot existent
    if (!columns.label || !columns.tot) {
        console.error('Les colonnes "label" et "tot" sont requises');
        return;
    }
    
    function unit_affiche(unit_choix) {
        let unit_aff;
        switch (unit_choix) {
          case 'EUR':
            unit_aff = 'k€';
            break;
          case 'TLW':
            unit_aff = 'kT';
            break;
          case 'EUR_T':
            unit_aff = '€/kg';
            break;
          default:
            unit_aff = 'kT';
        }
        return unit_aff;
      } 
    const unit_a_afficher = unit_affiche(unit_choix);

    // Combine les colonnes en un tableau pour le dataset ECharts
    const filteredColumns = columns.label.map((label, index) => {
        if (columns.unit[index] === unit_choix) {
          return [label, columns.tot[index]];
        }
      }).filter(Boolean); // Filtrer les valeurs nulles
      
    const datasetSource = filteredColumns;
    const option = {        title: {
        text: titleChart
      },

        dataset: [
            {
                dimensions: ['label', 'tot'],
                source: datasetSource // Utilise les données extraites
            },
            {
                transform: {
                    type: 'sort',
                    config: { dimension: 'tot', order: 'desc' }
                }
            }
        ],
        xAxis: {
            type: 'category',
            axisLabel: { interval: 0, rotate: 30 } // label sur l'axe X
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function (value) {
                  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Ajouter des séparateurs de milliers avec des espaces
                }
              }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#206095'
              }
            },
            formatter: function (params) {
                let result = params[0].name + '<br/>';
                const value = parseFloat(params[0].value.toString().split(',')[1]);
                const formattedValue = value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                result += formattedValue + " " + unit_a_afficher;
                return result;
              }
        },
        series: {
            type: 'bar',
            encode: { x: 'label', y: 'tot' }, // label sur X, Tot sur Y
            datasetIndex: 1
        }
    };

    return option;
}
