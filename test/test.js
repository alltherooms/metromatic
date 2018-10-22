const chai = require('chai');

const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { EventEmitter } = require('events');
const Metromatic = require('../index');
const { createMetromatic } = require('./utils');

const { expect } = chai;

chai.use(sinonChai);

describe('Metromatic', () => {
  let object;

  beforeEach(() => {
    object = new EventEmitter();
  });

  describe('instrumentation', () => {
    it('can instrument multiple objects', () => {
      const e1 = new EventEmitter();
      const e2 = new EventEmitter();
      createMetromatic(e1, [{
        name: 'e1_foo',
        type: 'timing',
        eventStart: 'far',
        eventStop: 'baz',
      }]);
      createMetromatic(e2, [{
        name: 'e2_foo',
        type: 'timing',
        eventStart: 'bob',
        eventStop: 'fam',
      }]);
      expect(Object.keys(e1._events)).to.deep.eq(['far', 'baz']);
      expect(Object.keys(e2._events)).to.deep.eq(['bob', 'fam']);
    });

    it('does not allow the same emitter to be instrumented more than once', () => {
      const e1 = new EventEmitter();
      createMetromatic(e1, [{
        name: 'e1_foo',
        type: 'timing',
        eventStart: 'far',
        eventStop: 'baz',
      }]);
      expect(() => {
        createMetromatic(e1, [{
          name: 'e2_foo',
          type: 'timing',
          eventStart: 'bob',
          eventStop: 'fam',
        }]);
      }).to.throw('EventEmitter already instrumented');
    });
  });

  describe('timed metrics', () => {
    let clock;
    let timings;

    beforeEach(() => {
      if (clock) clock.restore();
      if (timings) timings.forEach(timing => timing.restore());
    });

    it('reports a timed metric between the start and stop events', () => {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar',
      }]);
      clock = sinon.useFakeTimers();
      timings = Metromatic.backends.map(be => sinon.spy(be, 'send'));

      object.emit('foo');
      clock.tick(500);
      object.emit('bar');

      timings.forEach((timing) => {
        expect(timing).to.have.been.calledOnce;
        expect(timing).to.have.been.calledWithExactly('timing', 'time_foo_bar', 500);
      });
    });

    it('reports non-overlapping timed metrics', () => {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar',
      }]);
      clock = sinon.useFakeTimers();
      timings = Metromatic.backends.map(be => sinon.spy(be, 'send'));

      object.emit('foo', 'first-metric');
      clock.tick(500);
      object.emit('foo', 'second-metric');
      clock.tick(100);
      object.emit('bar', 'second-metric');
      clock.tick(100);
      object.emit('bar', 'first-metric');

      timings.forEach((timing) => {
        expect(timing).to.have.been.calledTwice;
        expect(timing).to.have.been.calledWithExactly('timing', 'time_foo_bar', 100);
        expect(timing).to.have.been.calledWithExactly('timing', 'time_foo_bar', 700);
      });
    });
  });

  describe('gauged metrics', () => {
    let gauges;

    beforeEach(() => {
      if (gauges) gauges.forEach(gauge => gauge.restore());
    });

    it('reports a gauged metric on each gauge event', () => {
      createMetromatic(object, [{
        name: 'gauge_foo',
        type: 'gauge',
        eventGauge: 'hey',
      }]);

      const data = {
        foo: 'bar',
        sample: 100,
      };

      gauges = Metromatic.backends.map(be => sinon.spy(be, 'send'));

      object.emit('hey', data);
      gauges.forEach((gauge) => {
        expect(gauge).to.have.been.calledOnce;
        expect(gauge).to.have.been.calledWithExactly('gauge', 'gauge_foo', data);
      });
    });
  });

  describe('wrapping and restore', () => {
    it('listens to specified events', () => {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar',
      }, {
        name: 'gauge_foo',
        type: 'gauge',
        eventGauge: 'hey',
      }]);

      expect(object.listeners('foo')).have.length(1);
      expect(object.listeners('bar')).have.length(1);
      expect(object.listeners('hey')).have.length(1);
    });

    it('stops listening events on the object', () => {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar',
      }, {
        name: 'gauge_foo',
        type: 'gauge',
        eventGauge: 'hey',
      }]);

      Metromatic.restore(object);

      expect(object.listeners('foo')).have.length(0);
      expect(object.listeners('bar')).have.length(0);
      expect(object.listeners('hey')).have.length(0);
    });
  });
});
