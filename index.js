const EventEmitter = require('events');
const backendFactories = require('./backends');
const metricFactories = require('./metrics');

const instrumented = new WeakMap();

function Metromatic() {}

Metromatic.instrument = function instrument(ee, options) {
  const self = this;
  const { backends = [], statsd, metrics = [] } = options;

  if (!(ee instanceof EventEmitter)) {
    throw new Error('Instrumented objects must be instances of EventEmitter');
  }

  if (instrumented.has(ee)) {
    throw new Error('EventEmitter already instrumented');
  }

  self.backends = backends.map((config) => {
    if (!backendFactories[config.type]) {
      throw new Error(`Invalid or missing backend type, supported types ${Object.keys(backendFactories).join()}`);
    }
    return backendFactories[config.type](config);
  });

  // backward compatibility
  if (statsd) {
    self.backends.push(backendFactories.statsd(statsd));
  }

  if (!self.backends.length) {
    throw new Error('No backends could be configured, ensure all required config values are specified');
  }

  const boundSend = self.send.bind(self);
  const installedMetrics = metrics.map((metric) => {
    if (!metricFactories[metric.type]) throw new Error(`Unsupported metric type '${metric.type}'`);
    metricFactories[metric.type].install(ee, metric, boundSend);
    return Object.assign({}, metric);
  });

  instrumented.set(ee, installedMetrics);
};

/*
* Send a metric
*
* @param {string} type - The metric type to send
* @param {string} name - The metric name
* @param {*} data - Whatever payload data the metric requires
*/
Metromatic.send = function send(type, name, data) {
  const args = [type, name].concat(data);
  this.backends.forEach(be => be.send(...args));
};

/*
* Restores the object back to its original form by
* removing all attached values and event listeners from the object.
*/
Metromatic.restore = function restore(ee) {
  if (!instrumented.has(ee)) return;
  instrumented.get(ee)
    .forEach(installedMetric => metricFactories[installedMetric.type].uninstall(ee, installedMetric));
  instrumented.delete(ee);
};

module.exports = Metromatic;
