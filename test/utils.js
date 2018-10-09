const Metromatic = require('../index');

function createMetromatic(emitter, metrics) {
  const options = {
    statsd: {
      host: 'localhost',
      port: 8125,
    },
    backends: [
      {
        type: 'cloudwatch', region: 'us', groupName: 'MyService', accessKeyId: 'keyid', secretAccessKey: 'secret',
      },
      { type: 'custom', send: () => {} },
    ],
    metrics,
  };

  Metromatic.instrument(emitter, options);
}

module.exports = { createMetromatic };
