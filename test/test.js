'use strict';

var Metromatic = require('../index');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var EventEmitter = require("events").EventEmitter;

chai.use(sinonChai);

describe('Metromatic', function () {
  var object;

  function createMetromatic (object, metrics) {
    var options = {
      statsd: {
        host: 'localhost',
        port: 8125
      },
      metrics: metrics
    };

    Metromatic.instrument(object, options);
  }

  beforeEach(function () {
    object = new EventEmitter();
  });

  describe('timed metrics', function () {
    var clock;
    var timing;

    beforeEach(function () {
      if (clock) clock.restore();
      if (timing) timing.restore();
    });

    it('reports a timed metric between the start and stop events', function () {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);
      clock = sinon.useFakeTimers();
      timing = sinon.spy(Metromatic.statsd, 'timing');

      object.emit('foo');
      clock.tick(500);
      object.emit('bar');

      expect(timing).to.have.been.calledOnce;
      expect(timing).to.have.been.calledWithExactly('time_foo_bar', 500);
    });

    it('reports non-overlapping timed metrics', function () {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);
      clock = sinon.useFakeTimers();
      timing = sinon.spy(Metromatic.statsd, 'timing');

      object.emit('foo', 'first-metric');
      clock.tick(500);
      object.emit('foo', 'second-metric');
      clock.tick(100);
      object.emit('bar', 'second-metric');
      clock.tick(100);
      object.emit('bar', 'first-metric');

      expect(timing).to.have.been.calledTwice;
      expect(timing).to.have.been.calledWithExactly('time_foo_bar', 100);
      expect(timing).to.have.been.calledWithExactly('time_foo_bar', 700);
    });

    it('keeps no track of temporal data to measure', function () {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);
      clock = sinon.useFakeTimers();
      timing = sinon.spy(Metromatic.statsd, 'timing');

      object.emit('foo', 'first-metric');
      clock.tick(500);
      object.emit('foo', 'second-metric');
      object.emit('bar', 'second-metric');
      object.emit('bar', 'first-metric');

      object._metrics.forEach(function (metric) {
        expect(metric.events).to.be.empty;
      });
    });
  });

  describe('wrapping and restore', function () {
    it('listens to specified events', function () {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);

      expect(object.listeners('foo')).have.length(1);
      expect(object.listeners('bar')).have.length(1);
      expect(object._metrics).to.not.be.empty;
    });

    it('stops listening events on the object', function () {
      createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);

      Metromatic.restore(object);

      expect(object.listeners('foo')).have.length(0);
      expect(object.listeners('bar')).have.length(0);
      expect(object._metrics).to.not.exist;
    });
  });
});
