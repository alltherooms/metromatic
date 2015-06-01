# metromatic

Report [StatsD](https://github.com/etsy/statsd) metrics based on events shouted by a given object

## Installation

Install using npm

```
npm install metromatic
```

## Usage

```
var Metromatic = require('metromatic');
Metromatic.instrument(myAPIClient, {
  statsd: {
    host: 'localhost',
    port: 8125
  },
  metrics: [{
    name: 'request_time',
    type: 'timing', // as per lynx methods
    eventStart: 'request',
    eventStop: 'response'
  }]
});
```

Eventually, a timing StatsD metric will be send when `myAPIClient` emits the `request` and `response` events.

If you just want to stop listening the object:

```
Metromatic.restore(myAPIClient);
```

## Running tests

Run the tests using

```
npm test
```

## Contributing

At the moment the `timing` metric type is the only one supported. You're more than welcome to express some code love in a Pull Request to make it even more awesome.

Also, if you feel like something is quite not right or want to suggest something, leave us an open issue.

### Future enhancements

* Add more [metric types](https://github.com/etsy/statsd/blob/master/docs/metric_types.md)

## License (MIT)