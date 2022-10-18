import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import ScaleCircles from '../src/ol/control/ScaleCircles.js';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';

const scaleCircleOptionsContainer = document.getElementById('scaleCircleOptions');
const unitsSelect = document.getElementById('units');
const stepsRange = document.getElementById('steps');
const invertColorsCheckbox = document.getElementById('invertColors');

let control;

function scaleControl() {
  control = new ScaleCircles({
    units: unitsSelect.value,
    steps: parseInt(stepsRange.value, 10),
    minWidth: 500,
  });
  scaleCircleOptionsContainer.style.display = 'block';
  
  return control;
}
const map = new Map({
  controls: defaultControls().extend([scaleControl()]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

function reconfigureScaleLine() {
  map.removeControl(control);
  map.addControl(scaleControl());
}
function onChangeUnit() {
  control.setUnits(unitsSelect.value);
}

unitsSelect.addEventListener('change', onChangeUnit);
stepsRange.addEventListener('input', reconfigureScaleLine);

