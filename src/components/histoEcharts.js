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
    //  console.log(columns);
    // Combine les colonnes en un tableau pour le dataset ECharts
    const filteredColumns = columns.label.map((label, index) => {
        if (columns.unit[index] === unit_choix) {
          return [label, columns.tot[index]];
        }
      }).filter(Boolean).sort((a, b) => b[1] - a[1]).slice(0, 10); // Filtrer les valeurs nulles
    
        // Ajuster les marges et l'affichage en fonction de la largeur
        let dynamicLeftMargin;
        let dynamicbottomMargin = '10%';
        let rotateLabels = 30;
        let intervalLabels = 0;

        if (width > 1500) {
            dynamicLeftMargin = '10%'; // Fixe à 13% si width > 1500px
        } else if (width <= 700) {
            dynamicLeftMargin = '25%'; 
            rotateLabels = 50; 
            intervalLabels = 0; 
            dynamicbottomMargin = '20%';
        } else {
            rotateLabels = 40; 
            dynamicbottomMargin = '15%';
            dynamicLeftMargin = `${Math.max(50, width * 0.13)}px`; // Ajuster dynamiquement pour les tailles moyennes
        }
    const datasetSource = filteredColumns;
    const option = {        title: {
        text: titleChart,
        subtext: '10 principaux pays producteurs' // Ajout du sous-titre
      },
      grid: {
        left: dynamicLeftMargin, 
        right: '10%', 
        bottom: dynamicbottomMargin, 
        top: '20%'
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
          axisLabel: { 
              interval: intervalLabels, // Intervalle des étiquettes
              rotate: rotateLabels // Rotation des étiquettes
          }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function (value) {
                  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + unit_a_afficher; // Ajouter des séparateurs de milliers avec des espaces
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
