# leaflet-heat-es

> A modular heatmap plugin for Leaflet. Modified from [`leaflet.heat`](https://github.com/Leaflet/Leaflet.heat)

## Quick Start

```typescript
import { heatLayer } from 'leaflet-heat-es';

const map = #leaflet map instance#;

const points = [
  [50.5, 30.5, 0.2], // lat, lng, intensity
  [50.6, 30.4, 0.5],
  ...
];

const heat = heatLayer(points);
heat.addTo(map);
```

## Demo

- [10,000 points →](https://liyuanqiu.github.io/leaflet-heat/packages/demo/dist/index.html)
- [Adding points dynamically →](https://liyuanqiu.github.io/leaflet-heat/packages/demo/dist/draw.html)
