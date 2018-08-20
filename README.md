# Telemetry

Provides a unified telemetry API reporting API usages, user actions and custom events.

## Installation

```sh
yarn add @kano/telemetry
```

## Usage

### Simple

```js

import { TelemetryClient } from '@kano/telemetry/index.js';

const client = new TelemetryClient();

const subscription = client.onDidTrackEvent((event) => {
    // Add to a message queue or send to server
    const message = [
        event.timestamp,
        event.scope,
        event.name,
        event.properties,
    ];
});

// You can track different type of telemetry events
client.trackEvent({ name: 'MyEvent', properties: {} });
client.trackException({ exception: new Error('Something went wrong') });
client.trackMetric({ name: 'my metric', value: 3 });
client.trackTrace({ message: 'Tracing...' });
client.trackPageView({ page: '/login' });

// When done
subscription.dispose();

```

### Mounting Clients

You can mount clients to reconciliate events accross multiple telemetry clients.
A usual pattern would be to create a master client in your app and mount the clients provided by your dependencies.

```js
import { TelemetryClient } from '@kano/telemetry/index.js';

const client = new TelemetryClient({ scope: 'my-app' });
const otherClient = new TelemetryClient({ scope: 'auth' });

client.mount(otherClient);

// From now on all events from the otheClient will be available under the client. Scopes will be nested

client.onDidTrackEvent((event) => {
    console.log(event.scope);
    //> ['my-app', 'auth']
});

otherClient.trackEvent({ name: 'MyEvent', properties: {} });
```

### Default collections

```js
import { TelemetryClient } from '@kano/telemetry/index.js';

const client = new TelemetryClient();

// Automatically collects all unhandled exceptions and page views
client.collectExceptions();
```

## Reporting

You can either subscribe to a client and manage the events yourself or use a readymade reporter to store all your events

### Queue

The queue will stack events until a configurable timeout is reached or a max number of events is reached.

```js
import { QueueReporter, TelemetryClient } from '@kano/telemetry/index.js';

const client = new TelemetryClient();

const reporter = new QueueReporter({
    maxBatchSize: 20,
    fireInterval: 3000,
});

reporter.onDidBatchEvents((batch) => {
    // batch has an events property containing the last batch of events
    // More events can be created while the batch is being saved. Call flush when you successfully
    // reported the events, no more events will be fired until flush or failed is called
    fetch('api.host.me/telemetry', {
        method: 'POST',
        body: JSON.stringify(bash.events),
    }).then((r) => {
        if (r.status !== 200) {
            bash.fail();
        } else {
            bash.flush();
        }
    });
});

reporter.start(client);
```

Alternatively, you can extend a reporter and override the fire method.

```js
import { QueueReporter } from '@kano/telemetry/index.js';

class MyReporter extends QueueReporter {
    fire(batch) {
        // save, then flush or fail
    }
}

const reporter = new MyReporter({
    maxBatchSize: 20,
    fireInterval: 3000,
});

reporter.start(client);
```

## Development

### Tests

Using polymer cli, serve the contents of the directory

```
polymer serve
```

Then browse to the promted url at `/test`
