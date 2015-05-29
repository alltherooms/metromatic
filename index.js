'use strict';

var lynx = require('lynx');

function Metromatic (object, options) {
  var self = this;
  var statsd = options.statsd;
  var metrics = options.metrics || [];

  if (!statsd || !statsd.host || !statsd.port) {
    throw new Error('A StatsD host and port are required');
  }

  metrics.forEach(function (metric) {
    if (metric.type === 'timing') {
      object.on(metric.eventStart, function () {
        metric.startTime = new Date().getTime();
      });

      object.on(metric.eventStop, function () {
        var elapsed = new Date().getTime() - metric.startTime;
        self.send(metric.type, metric.name, elapsed);
      });
    }
  });

  this.statsd = new lynx(statsd.host, statsd.port);
  this.object = object;
  this.metrics = metrics;
}

/*
* Send a metric to StatsD
*
* @param {string} type - The StatsD metric type to send
* @param {string} name - The metric name
* @param {*} data - Whatever payload data the metric requires
*/
Metromatic.prototype.send = function (type, name, data) {
  var args = [name].concat(data);
  this.statsd[type].call(this.statsd, args);
};

/*
* Restores the object back to its original form by
* removing all attached event listeners from the object.
*/
Metromatic.prototype.restore = function () {
  var self = this;

  this.metrics.forEach(function (metric) {
    if (metric.type === 'timing') {
      self.object.removeAllListeners(metric.eventStart);
      self.object.removeAllListeners(metric.eventStop);
    }
  });
};

module.exports = Metromatic;
