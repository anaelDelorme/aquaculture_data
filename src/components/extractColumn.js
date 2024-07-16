import * as echarts from "npm:echarts";
const listColor =   [ '#37A2FF', '#FFBF00','#80FFA5','#FF0087','#00DDFF'];
const listRgbColor = [
                        'rgb(55, 162, 255)', 'rgb(0,230,215)',
                        'rgb(255,95,93)', 'rgb(252,230,102)', 
                        'rgb(128, 255, 165)', 'rgb(52,203,106)', 
                        'rgb(255, 0, 135)', 'rgb(135, 0, 157)', 
                       'rgb(0, 221, 255)',  'rgb(77, 119, 255)',
                    ]

// Fonction pour extraire toutes les colonnes d'un DataFrame
function extractColumns(dataFrame) {
    const columns = {};
    for (const field of dataFrame.schema.fields) {
      columns[field.name] = [];
    }
    for (const batch of dataFrame.batches) {
      for (const field of dataFrame.schema.fields) {
        const tempColumn = batch.getChild(field.name);
        for (let i = 0; i < tempColumn.length; i++) {
          columns[field.name].push(tempColumn.get(i));
        }
      }
    }
    return columns;
  }
  
  // Fonction pour créer le graphique ECharts
export  function createOptionsEChartsFromData(data, width, colonneX,titleChart="") {
    const columns = extractColumns(data);
    //console.log("columns: ",columns);
    const colX = columns[colonneX];
    //console.log("colX: ",colX);
    const series = [];
    let num_color_rgb = 0
    // Créer les séries pour chaque colonne sauf TIME_PERIOD
    for (const [key, values] of Object.entries(columns)) {
      if (key !== colonneX) {
        series.push({
          name: key,
          type: 'line',
          stack: 'Total',
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 0
          },
          areaStyle: {
            opacity: 0.8,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: listRgbColor[num_color_rgb] },
              { offset: 1, color: listRgbColor[num_color_rgb+1] }
            ])
          },
          emphasis: {
            focus: 'series'
          },
          data: values
        });
        num_color_rgb = num_color_rgb +2;
      }
    }
    //console.log("series: ",series);

    // Options du graphique ECharts
    const option = {
      color: listColor,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function (params) {
          let result = params[0].name + '<br/>';
          params.forEach(item => {
            const value = Math.round(item.value / 100) * 100; // Arrondir aux centaines
            const formattedValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Ajouter des séparateurs de milliers
            result += item.marker + item.seriesName + ': ' + formattedValue + '<br/>';
          });
          return result;
        }
      },
      title: {
        text: titleChart
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      legend: {
        data: Object.keys(columns).filter(key => key !== colonneX)
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: colX
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function (value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Ajouter des séparateurs de milliers avec des espaces
          }
        }
      },
      series: series
    };
    
    //console.log("option",option);
    return option;

  }
  
