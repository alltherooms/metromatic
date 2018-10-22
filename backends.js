const Lynx = require('lynx');
const cloudwatchMetrics = require('cloudwatch-metrics');

module.exports = {
  custom: function createCustomBackend(config) {
    if (!config.send) {
      throw new Error('Custom backend must expose send(type, name, data) {} method');
    }
    return config;
  },
  statsd: function createStatsDBackend(config) {
    if (!config.host || !config.port) {
      throw new Error('StatsD backend must missing config params');
    }
    const client = new Lynx(config.host, config.port);
    return {
      send: (type, name, data) => {
        if (!client[type]) throw new Error(`StatsD backend does not support method '${type}'`);
        client[type](name, data);
      },
    };
  },
  cloudwatch: function createCloudwatchBackend(config) {
    if (!['region', 'groupName', 'accessKeyId', 'secretAccessKey'].every(key => config[key])) {
      throw new Error('Cloudwatch backend must provide all require config params');
    }

    const dimensions = Object.keys(config.dimensions || {})
      .map(key => ({ Name: key, Value: config.dimensions[key] }));
    cloudwatchMetrics.initialize({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });
    const countMetric = new cloudwatchMetrics.Metric(config.groupName, 'Count', dimensions, { enabled: true });
    const stringMetric = new cloudwatchMetrics.Metric(config.groupName, 'String', dimensions, { enabled: true });
    const client = {
      timing: (name, ms) => countMetric.put(ms, name),
      gauge: (name, data) => stringMetric.put(data, name),
    };
    return {
      send: (type, name, data) => {
        if (!client[type]) throw new Error(`Cloudwatch backend does not support method '${type}'`);
        client[type](name, data);
      },
    };
  },
};
