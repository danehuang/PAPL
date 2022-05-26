import * as tslab from 'tslab';
import * as util from 'util';
import { v4 as uuidv4 } from 'uuid';

import * as list from './list';
import * as tree from './tree';
import * as introspect from './introspect';



/* ************************************************************************** */
/* Requiring CSS */
/* ************************************************************************** */

export function requireCarbon() {
  tslab.display.html(`
  <link rel="stylesheet" href="node_modules/carbon-components/css/carbon-components.css">
  `);
}

export function requireCytoscape() {
  tslab.display.html(`
<script>
require.config({
     paths: {
     cytoscape: 'https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.19.0/cytoscape.min'
}});
</script>
  `);
}


/* ************************************************************************** */
/* Draw Data-Structure Functions */
/* ************************************************************************** */

export const nodeStyle = `
{
  selector: 'node',
  css: {
    'class': ".bx--tree",
    'label': 'data(label)',
    'height': '10px',
    'width': '10px',
  }
},
{
  selector: 'edge',
  css: {
    'width': 3,
    // 'line-color': '#ccc123',
    'curve-style': 'bezier',
    'target-arrow-shape': 'triangle',
    'target-arrow-fill': 'filled',
    'arrow-scale': 1,
  }
}
`;

export function draw(elems, width=800, height=350, layout=listLayout) {
  const divId = "mydiv" + uuidv4();
tslab.display.html(`
<style>
    #${divId} {
        width: ${width}px;
        height: ${height}px;
        top: 0px;
        left: 0px;
    }
</style>
<div id="${divId}"></div>
`);
tslab.display.html(`
<script>
 (function(element) {
     require(['cytoscape'], function(cytoscape) {   
        var cy = cytoscape({
         container: document.getElementById('${divId}'),
         style: [${nodeStyle}],
         layout: ${layout},
         elements: ${elems}
         });
     });
 })(this.element);
</script>
`);
}


/* -------------------------------------------------------- */
/* Draw List */
/* -------------------------------------------------------- */

export const listLayout = `{}`;

export function drawList<T>(ls: list.List<T>, width=800, height=350) {
  return draw(list.cytoscapify(ls), width, height, listLayout);
}


/* -------------------------------------------------------- */
/* Draw Tree */
/* -------------------------------------------------------- */

export const treeLayout = `
{
  name: 'preset'
}
`;

export function drawTree<T>(t: tree.Tree<T>, width=800, height=350) {
  return draw(tree.cytoscapify(t), width, height, treeLayout);
}


/* -------------------------------------------------------- */
/* Draw Memory */
/* -------------------------------------------------------- */

export const memLayout = `
{
  name: 'breadthfirst',
  directed: true,
  padding: 10
}
`;

export function drawMemTrace(memTrace: introspect.MemoryTrace, i, width=800, height=350) {
  return draw(introspect.cytoscapifyMemTrace(memTrace.memory[i], memTrace.refId), width, height, memLayout);
}


/* -------------------------------------------------------- */
/* Draw Call Stack */
/* -------------------------------------------------------- */

export const callStackLayout = `
{
  name: 'breadthfirst',
  directed: true,
  padding: 10
}
`;

export function drawCallStack(stk: [string, number, any][], width=800, height=350) {
  draw(introspect.cytoscapifyCallStack(stk), width, height, callStackLayout);
}

export function drawStackTrace(stk: [string, number, any][], drawFn, width=800, height=550) {
  let iter = 0;
  for (const x of stk) {
      if (x[0] == "CALL") {
          console.log(`CALL[${iter}]` );
          drawFn(x[2][0][1])
      } else {
          console.log(`RET[${iter}]: ${x[2]}`)
      }
      iter += 1;
  }
}


/* ************************************************************************** */
/* Display line plot */
/* ************************************************************************** */

export function linePlot(xs, ys, chartTitles=[], width=800, height=350): void {
  const divId = "mydiv" + uuidv4();
 
  const colors = [
      "rgb(44, 62, 80)",
      "rgb(231, 76, 60)",
      "rgb(236, 240, 241)",
      "rgb(52, 152, 219)"
  ];

  let datasets = "";
  if (Array.isArray(ys)) {
    if (Array.isArray(ys[0])) {
      datasets = ys.map((x, i) => {
        let title = `${i}`
        if (i in chartTitles) {
          title = chartTitles[i];
        }
        return `{
        label: "${title}",
        backgroundColor: '${colors[i % 4]}',
        borderColor: '${colors[i % 4]}',
        data: ${util.inspect(x)},
      }`}).join(", ");
    } else {
      datasets = `{
        label: "${"data"}",
        backgroundColor: '${colors[0]}',
        borderColor: '${colors[0]}',
        data: ${util.inspect(ys)},
      }`
    }
  }

  tslab.display.html(`
  <style>
    #${divId} {
        width: ${width}px;
        height: ${height}px;
        top: 0px;
        left: 0px;
    }
  </style>

  <div>
    <canvas id="${divId}"></canvas>
  </div>

  <script>
    (function(element) {
        require(['./node_modules/chart.js/dist/chart.js'], function(Chart) {   
          const labels = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
          ];
          const data = {
            labels: ${util.inspect(xs)},
            datasets: [${datasets}]
          };
          const config = {
            type: 'line',
            data: data,
            options: {}
          };
          var myChart = new Chart(
              document.getElementById("${divId}"),
              config
            );
        });
    })(this.element);
</script>
 `);
}


/* ************************************************************************** */
/* Display React */
/* ************************************************************************** */

export function displayReact(components): void {
  const divId = "mydiv" + uuidv4();
  tslab.display.html(`
<div id="${divId}"></div>
<script>
(function(element) {

  requirejs.config({
      paths: {
          'react': 'https://unpkg.com/react@15.3.2/dist/react',
          'react-dom': 'https://unpkg.com/react-dom@15.3.2/dist/react-dom'
      }
  });

  requirejs(['react', 'react-dom'], function(React, ReactDOM) {
      console.log(React)
      ${components.map((cls) => cls.toString().replace(/exports\./g, '')).join("\n\n")}

      ReactDOM.render(
        React.createElement(${components[0].name}, {}),
        document.getElementById("${divId}")
      );
  });
})(this.element)
</script>
`)
}