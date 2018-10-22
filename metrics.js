const timing = {
  install: (ee, metric, send) => {
    const events = {};
    ee.on(metric.eventStart, (id = '') => {
      events[id] = {
        startTime: Date.now(),
      };
    });

    ee.on(metric.eventStop, (id = '') => {
      if (events[id]) {
        const elapsed = Date.now() - events[id].startTime;
        delete events[id];
        send(metric.type, metric.name, elapsed);
      }
    });
  },
  uninstall: (ee, metric) => {
    ee.removeAllListeners(metric.eventStart);
    ee.removeAllListeners(metric.eventStop);
  },
};

const gauge = {
  install: (ee, metric, send) => {
    ee.on(metric.eventGauge, (data) => {
      send(metric.type, metric.name, data || {});
    });
  },
  uninstall: (ee, metric) => {
    ee.removeAllListeners(metric.eventGauge);
  },
};

module.exports = {
  timing,
  gauge,
};
