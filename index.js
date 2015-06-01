'use strict';

var lynx = require('lynx');

function Metromatic () {}

Metromatic.instrument = function (object, options) {
  var self = this;
  var statsd = options.statsd;
  var metrics = options.metrics || [];

  if (!statsd || !statsd.host || !statsd.port) {
    throw new Error('A StatsD host and port are required');
  }

  metrics.forEach(function (metric) {
    if (metric.type === 'timing') {
      metric.events = metric.events || {};
      object.on(metric.eventStart, function (id) {
        id = id || '';
        metric.events[id] = {
          startTime: new Date().getTime()
        };
      });

      object.on(metric.eventStop, function (id) {
        id = id || '';
        var elapsed = new Date().getTime() - metric.events[id].startTime;
        self.send(metric.type, metric.name, elapsed);
      });
    }
  });

  this.statsd = new lynx(statsd.host, statsd.port);
  object.metrics = metrics;
};

/*
* Send a metric to StatsD
*
* @param {string} type - The StatsD metric type to send
* @param {string} name - The metric name
* @param {*} data - Whatever payload data the metric requires
*/
Metromatic.send = function (type, name, data) {
  var args = [name].concat(data);
  this.statsd[type].apply(this.statsd, args);
};

/*
* Restores the object back to its original form by
* removing all attached values and event listeners from the object.
*/
Metromatic.restore = function (object) {
  object.metrics.forEach(function (metric) {
    if (metric.type === 'timing') {
      object.removeAllListeners(metric.eventStart);
      object.removeAllListeners(metric.eventStop);
    }
  });

  delete object.metrics;
};

module.exports = Metromatic;
