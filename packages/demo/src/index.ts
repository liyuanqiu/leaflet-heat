import { map as leafletMap, tileLayer, latLng } from 'leaflet';
import { heatLayer } from 'leaflet-heat-es';

import 'leaflet/dist/leaflet.css';

import './common.css';

const container = document.createElement('div');
container.id = 'map-container';
document.body.append(container);

const map = leafletMap(container).setView([-37.87, 175.475], 12);

tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

fetch('realworld.10000.json')
  .then(res => res.json())
  .then(addressPoints => {
    const points = (addressPoints as [number, number, string][]).map(p =>
      latLng(p[0], p[1])
    );
    heatLayer(points).addTo(map);
  });
