
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./leaflet-heat-es.cjs.production.min.js')
} else {
  module.exports = require('./leaflet-heat-es.cjs.development.js')
}
