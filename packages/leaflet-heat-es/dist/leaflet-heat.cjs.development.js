'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var leaflet = require('leaflet');
var simpleheat = _interopDefault(require('simpleheat'));

var HeatLayerClass =
/*#__PURE__*/
leaflet.Layer.extend({
  initialize: function initialize(latlngs, options) {
    this._latlngs = latlngs;
    leaflet.Util.setOptions(this, options);
  },
  setLatLngs: function setLatLngs(latlngs) {
    this._latlngs = latlngs;
    return this.redraw();
  },
  addLatLng: function addLatLng(latlng) {
    this._latlngs.push(latlng);

    return this.redraw();
  },
  setOptions: function setOptions(options) {
    leaflet.Util.setOptions(this, options);

    if (this._heat) {
      this._updateOptions();
    }

    return this.redraw();
  },
  redraw: function redraw() {
    if (this._heat && !this._frame && this._map && !this._map._animating) {
      this._frame = leaflet.Util.requestAnimFrame(this._redraw, this);
    }

    return this;
  },
  onAdd: function onAdd(map) {
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

    if (map.options.zoomAnimation && leaflet.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  },
  onRemove: function onRemove(map) {
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
  addTo: function addTo(map) {
    map.addLayer(this);
    return this;
  },
  _initCanvas: function _initCanvas() {
    this._canvas = leaflet.DomUtil.create('canvas', 'leaflet-heatmap-layer leaflet-layer');
    var canvas = this._canvas;
    var originProp = leaflet.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin']);

    if (originProp !== false) {
      canvas.style[originProp] = '50% 50%';
    }

    var size = this._map.getSize();

    canvas.width = size.x;
    canvas.height = size.y;
    var animated = this._map.options.zoomAnimation && leaflet.Browser.any3d;
    leaflet.DomUtil.addClass(canvas, "leaflet-zoom-" + (animated ? 'animated' : 'hide'));
    this._heat = simpleheat(canvas);

    this._updateOptions();
  },
  _updateOptions: function _updateOptions() {
    this._heat.radius(this.options.radius || this._heat.defaultRadius, this.options.blur);

    if (this.options.gradient) {
      this._heat.gradient(this.options.gradient);
    }

    if (this.options.max) {
      this._heat.max(this.options.max);
    }
  },
  _reset: function _reset() {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);

    leaflet.DomUtil.setPosition(this._canvas, topLeft);

    var size = this._map.getSize();

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
  _redraw: function _redraw() {
    if (!this._map) {
      return;
    }

    var data = [];
    var r = this._heat._r;

    var size = this._map.getSize();

    var bounds = new leaflet.Bounds(leaflet.point([-r, -r]), size.add([r, r]));
    var max = this.options.max === undefined ? 1 : this.options.max;
    var maxZoom = this.options.maxZoom === undefined ? this._map.getMaxZoom() : this.options.maxZoom;
    var v = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12)));
    var cellSize = r / 2;
    var grid = [];

    var panePos = this._map._getMapPanePos();

    var offsetX = panePos.x % cellSize;
    var offsetY = panePos.y % cellSize;
    var i;
    var len;
    var p;
    var cell;
    var x;
    var y;
    var j;
    var len2;
    var k; // console.time('process');

    for (i = 0, len = this._latlngs.length; i < len; i += 1) {
      p = this._map.latLngToContainerPoint(this._latlngs[i]);

      if (bounds.contains(p)) {
        x = Math.floor((p.x - offsetX) / cellSize) + 2;
        y = Math.floor((p.y - offsetY) / cellSize) + 2;
        var alt = 1;

        if (this._latlngs[i].alt !== undefined) {
          alt = this._latlngs[i].alt;
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
            data.push([Math.round(cell[0]), Math.round(cell[1]), Math.min(cell[2], max)]);
          }
        }
      }
    } // console.timeEnd('process');
    // console.time('draw ' + data.length);


    this._heat.data(data).draw(this.options.minOpacity); // console.timeEnd('draw ' + data.length);


    this._frame = null;
  },
  _animateZoom: function _animateZoom(e) {
    var scale = this._map.getZoomScale(e.zoom);

    var offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

    if (leaflet.DomUtil.setTransform) {
      leaflet.DomUtil.setTransform(this._canvas, offset, scale);
    }
  }
});
function heatLayer(latlngs, options) {
  // @ts-ignore
  return new HeatLayerClass(latlngs, options);
}

exports.heatLayer = heatLayer;
//# sourceMappingURL=leaflet-heat.cjs.development.js.map
