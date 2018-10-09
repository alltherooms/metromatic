const chai = require('chai');

const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { EventEmitter } = require('events');
const cloudwatchMetrics = require('cloudwatch-metrics');
const Metromatic = require('../index');
const { createMetromatic } = require('./utils');

const { expect } = chai;

chai.use(sinonChai);

describe('Metromatic', () => {
  let object;

  beforeEach(() => {
    object = new EventEmitter();
  });

  describe('backends', () => {
    it('initializes Cloudwatch metrics', () => {
      const spy = sinon.spy(cloudwatchMetrics, 'initialize');
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar',
      }]);
      expect(spy).to.have.been.calledWithExactly({ accessKeyId: 'keyid', region: 'us', secretAccessKey: 'secret' });
    });

    it('throws error when non-eventemitter is passed as arg', () => {
      expect(() => {
        Metromatic.instrument({}, {});
      }).to.throw('Instrumented objects must be instances of EventEmitter');
    });

    it('throws error when custom backend is missing methods', () => {
      expect(() => {
        const options = {
          backends: [
            { type: 'custom' },
          ],
          metrics: [],
        };
        Metromatic.instrument(object, options);
      }).to.throw('Custom backend must expose send(type, name, data) {} method');
    });

    it('throws error when Cloudwatch backend is missing params', () => {
      expect(() => {
        const options = {
          backends: [
            { type: 'cloudwatch' },
          ],
          metrics: [],
        };
        Metromatic.instrument(object, options);
      }).to.throw('Cloudwatch backend must provide all require config params');
    });

    it('throws error when unknown backend is passed', () => {
      expect(() => {
        const options = {
          backends: [
            { type: 'potato' },
          ],
          metrics: [],
        };
        Metromatic.instrument(object, options);
      }).to.throw('Invalid or missing backend type');
    });
  });
});
