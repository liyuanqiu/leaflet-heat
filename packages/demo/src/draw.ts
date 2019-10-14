import { map as leafletMap, tileLayer, latLng } from 'leaflet';
import { heatLayer } from 'leaflet-heat-es';

import 'leaflet/dist/leaflet.css';

import './common.css';

const container = document.createElement('div');
container.id = 'map-container';
document.body.append(container);

const map = leafletMap(container).setView([-37.82109, 175.2193], 16);

tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

fetch('realworld.388.json')
  .then(res => res.json())
  .then(addressPoints => {
    const points = (addressPoints as [number, number, string][]).map(p =>
      latLng(p[0], p[1])
    );
    const heat = heatLayer(points);
    heat.addTo(map);

    let draw = true;
    map.on({
      movestart() {
        draw = false;
      },
      moveend() {
        draw = true;
      },
      mousemove(e) {
        if (draw) {
          heat.addLatLng(e.latlng);
        }
      },
    });
  });
