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

    return new Metromatic(object, options);
  }

  beforeEach(function () {
    object = new EventEmitter();
  });

  describe('timed metrics', function () {
    it('reports a timed metric between the start and stop events', function () {
      var metromatic = createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);
      var clock = sinon.useFakeTimers();

      sinon.spy(metromatic, 'send');

      object.emit('foo');
      clock.tick(500);
      object.emit('bar');

      expect(metromatic.send).to.have.been.calledOnce;
      expect(metromatic.send).to.have.been.calledWithExactly('timing', 'time_foo_bar', 500);

      clock.restore();
    });
  });

  describe('wrapping and restore', function () {
    it('listens to specified events', function () {
      var metromatic = createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);

      expect(object.listeners('foo')).have.length(1);
      expect(object.listeners('bar')).have.length(1);
    });

    it('stops listening events on the object', function () {
      var metromatic = createMetromatic(object, [{
        name: 'time_foo_bar',
        type: 'timing',
        eventStart: 'foo',
        eventStop: 'bar'
      }]);

      metromatic.restore();

      expect(object.listeners('foo')).have.length(0);
      expect(object.listeners('bar')).have.length(0);
    });
  });
});
