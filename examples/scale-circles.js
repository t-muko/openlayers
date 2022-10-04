import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import ScaleCircles from '../src/ol/control/ScaleCircles.js';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';

const scaleBarOptionsContainer = document.getElementById('scaleBarOptions');
const unitsSelect = document.getElementById('units');
const typeSelect = document.getElementById('type');
const stepsRange = document.getElementById('steps');
const scaleTextCheckbox = document.getElementById('showScaleText');
const invertColorsCheckbox = document.getElementById('invertColors');

let control;

function scaleControl() {
  control = new ScaleCircles({
    units: unitsSelect.value,
    bar: true,
    steps: parseInt(stepsRange.value, 10),
    text: scaleTextCheckbox.checked,
    minWidth: 500,
  });
  onInvertColorsChange();
  scaleBarOptionsContainer.style.display = 'block';
  
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
function onInvertColorsChange() {
  control.element.classList.toggle(
    'ol-scale-bar-inverted',
    invertColorsCheckbox.checked
  );
}
unitsSelect.addEventListener('change', onChangeUnit);
typeSelect.addEventListener('change', reconfigureScaleLine);
stepsRange.addEventListener('input', reconfigureScaleLine);
scaleTextCheckbox.addEventListener('change', reconfigureScaleLine);
invertColorsCheckbox.addEventListener('change', onInvertColorsChange);
