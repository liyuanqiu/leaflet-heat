import {
  Bounds,
  point,
  Browser,
  Layer,
  LatLng,
  ZoomAnimEvent,
  Map,
  Util,
  DomUtil,
  LayerOptions,
} from 'leaflet';
// @ts-ignore
import simpleheat from 'simpleheat';

interface Options {
  minOpacity: number;
  maxZoom: number;
  radius: number;
  blur: number;
  max: number;
  gradient: {
    [n: number]: string;
  };
}

export type HeatOptions = LayerOptions & Options;

const HeatLayerClass = Layer.extend({
  initialize(latlngs: LatLng[], options?: HeatOptions) {
    this._latlngs = latlngs;
    Util.setOptions(this, options);
  },

  setLatLngs(latlngs: LatLng[]) {
    this._latlngs = latlngs;
    return this.redraw();
  },

  addLatLng(latlng: LatLng) {
    this._latlngs.push(latlng);
    return this.redraw();
  },

  setOptions(options: Options) {
    Util.setOptions(this, options);
    if (this._heat) {
      this._updateOptions();
    }
    return this.redraw();
  },

  redraw() {
    if (this._heat && !this._frame && this._map && !this._map._animating) {
      this._frame = Util.requestAnimFrame(this._redraw, this);
    }
    return this;
  },

  onAdd(map: Map) {
    this._map = map;

    if (!this._canvas) {
      this._initCanvas();
    }

    if (this.options.pane) {
      this.getPane().appendChild(this._canvas);
    } else {
      map.getPanes().overlayPane.appendChild(this._canvas);
    }

    map.on('moveend', this._reset, this);

    if (map.options.zoomAnimation && Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  },

  onRemove(map: Map) {
    if (this.options.pane) {
      this.getPane().removeChild(this._canvas);
    } else {
      map.getPanes().overlayPane.removeChild(this._canvas);
    }

    map.off('moveend', this._reset, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
  },

  addTo(map: Map) {
    map.addLayer(this);
    return this;
  },

  _initCanvas() {
    this._canvas = DomUtil.create(
      'canvas',
      'leaflet-heatmap-layer leaflet-layer'
    );

    const canvas = this._canvas;

    const originProp = DomUtil.testProp([
      'transformOrigin',
      'WebkitTransformOrigin',
      'msTransformOrigin',
    ]);
    if (originProp !== false) {
      canvas.style[originProp] = '50% 50%';
    }

    const size = this._map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const animated = this._map.options.zoomAnimation && Browser.any3d;
    DomUtil.addClass(canvas, `leaflet-zoom-${animated ? 'animated' : 'hide'}`);

    this._heat = simpleheat(canvas);
    this._updateOptions();
  },

  _updateOptions() {
    this._heat.radius(
      this.options.radius || this._heat.defaultRadius,
      this.options.blur
    );

    if (this.options.gradient) {
      this._heat.gradient(this.options.gradient);
    }
    if (this.options.max) {
      this._heat.max(this.options.max);
    }
  },

  _reset() {
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    DomUtil.setPosition(this._canvas, topLeft);

    const size = this._map.getSize();

    if (this._heat._width !== size.x) {
      this._heat._width = size.x;
      this._canvas.width = size.x;
    }
    if (this._heat._height !== size.y) {
      this._heat._height = size.y;
      this._canvas.height = size.y;
    }

    this._redraw();
  },

  _redraw() {
    if (!this._map) {
      return;
    }
    const data = [];

    const r = this._heat._r;

    const size = this._map.getSize();

    const bounds = new Bounds(point([-r, -r]), size.add([r, r]));

    const max = this.options.max === undefined ? 1 : this.options.max;

    const maxZoom =
      this.options.maxZoom === undefined
        ? this._map.getMaxZoom()
        : this.options.maxZoom;

    const v = 1 / 2 ** Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12));

    const cellSize = r / 2;

    const grid: [number, number, number][][] = [];

    const panePos = this._map._getMapPanePos();

    const offsetX = panePos.x % cellSize;

    const offsetY = panePos.y % cellSize;

    let i;

    let len;

    let p;

    let cell;

    let x;

    let y;

    let j;

    let len2;

    let k;

    // console.time('process');
    for (i = 0, len = this._latlngs.length; i < len; i += 1) {
      p = this._map.latLngToContainerPoint(this._latlngs[i]);
      if (bounds.contains(p)) {
        x = Math.floor((p.x - offsetX) / cellSize) + 2;
        y = Math.floor((p.y - offsetY) / cellSize) + 2;

        let alt = 1;
        if (this._latlngs[i].alt !== undefined) {
          ({ alt } = this._latlngs[i]);
        } else if (this._latlngs[i][2] !== undefined) {
          alt = +this._latlngs[i][2];
        }

        k = alt * v;

        grid[y] = grid[y] || [];
        cell = grid[y][x];

        if (!cell) {
          grid[y][x] = [p.x, p.y, k];
        } else {
          cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k); // x
          cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k); // y
          cell[2] += k; // cumulated intensity value
        }
      }
    }

    for (i = 0, len = grid.length; i < len; i += 1) {
      if (grid[i]) {
        for (j = 0, len2 = grid[i].length; j < len2; j += 1) {
          cell = grid[i][j];
          if (cell) {
            data.push([
              Math.round(cell[0]),
              Math.round(cell[1]),
              Math.min(cell[2], max),
            ]);
          }
        }
      }
    }
    // console.timeEnd('process');

    // console.time('draw ' + data.length);
    this._heat.data(data).draw(this.options.minOpacity);
    // console.timeEnd('draw ' + data.length);

    this._frame = null;
  },

  _animateZoom(e: ZoomAnimEvent) {
    const scale = this._map.getZoomScale(e.zoom);

    const offset = this._map
      ._getCenterOffset(e.center)
      ._multiplyBy(-scale)
      .subtract(this._map._getMapPanePos());

    if (DomUtil.setTransform) {
      DomUtil.setTransform(this._canvas, offset, scale);
    }
  },
});

export interface HeatLayer extends Layer {
  setOptions(options: HeatOptions): HeatLayer;
  addLatLng(latlng: LatLng): HeatLayer;
  setLatLngs(latlngs: LatLng[]): HeatLayer;
  redraw(): HeatLayer;
}

export function heatLayer(latlngs: LatLng[], options?: HeatOptions): HeatLayer {
  // @ts-ignore
  return new HeatLayerClass(latlngs, options);
}
