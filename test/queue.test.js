import { TelemetryClient, QueueReporter } from '../index.js';

suite('QueueReporter', () => {
    suite('#batch', () => {
        let client;
        let reporter;
        setup(() => {
            client = new TelemetryClient();
            reporter = new QueueReporter();
        });
        test('should emit events after timeout', (done) => {
            reporter.setFireInterval(500);
            const started = Date.now();
            reporter.onDidBatchEvents(() => {
                const elapsed = Date.now() - started;
                assert(elapsed < 600 && elapsed > 400, 'Did not emit event with right interval configuration');
                assert.equal(reporter._queue.length, 0, 'Event queue not emptied after batch emitted');
                done();
            });
            reporter.start(client);
            for (let i = 0; i < 10; i += 1) {
                client.trackEvent({ name: 'TestEvent' });
            }
        });
        test('should not emit while batch is not flushed', (done) => {
            reporter.setFireInterval(10);
            let sub = reporter.onDidBatchEvents(() => {
                sub.dispose();
                sub = reporter.onDidBatchEvents(() => {
                    sub.dispose();
                    done(new Error('Should not have received second batch while first one is not flushed'));
                });
                setTimeout(() => {
                    done();
                }, 20);
                client.trackEvent({ name: 'TestEvent' });
            });
            reporter.start(client);
            client.trackEvent({ name: 'TestEvent' });
        });
        test('should emit after batch is flushed', (done) => {
            reporter.setFireInterval(10);
            let sub = reporter.onDidBatchEvents((batch) => {
                batch.flush();
                sub.dispose();
                sub = reporter.onDidBatchEvents(() => {
                    sub.dispose();
                    done();
                });
                client.trackEvent({ name: 'TestEvent' });
            });
            reporter.start(client);
            client.trackEvent({ name: 'TestEvent' });
        });
        test('should put back in the queue after batch failed', (done) => {
            reporter.setFireInterval(10);
            let sub = reporter.onDidBatchEvents((batch) => {
                sub.dispose();
                client.trackEvent({ name: 'TestEvent2' });
                batch.fail();
                assert.equal(reporter._queue.length, 2, 'Failed batch did not put back events in the queue');
                done();
            });
            reporter.start(client);
            client.trackEvent({ name: 'TestEvent1' });
        });
        test('should not make batches bigger than the maxBatchSize', (done) => {
            reporter.setFireInterval(10);
            reporter.setMaxBatchSize(50);
            let sub = reporter.onDidBatchEvents((batch) => {
                assert.equal(batch.events.length, 50, 'Batch size does not match maxBatchSize');
                assert.equal(reporter._queue.length, 50, 'Queue does not match expected size');
                done();
            });
            reporter.start(client);
            for (let i = 0; i < 100; i += 1) {
                client.trackEvent({ name: 'TestEvent' });
            }
        });
        test('should get right properties from constructor', () => {
            const otherReporter = new QueueReporter({
                fireInterval: 20,
                maxBatchSize: 1000,
            });
            assert.equal(otherReporter._fireInterval, 20, 'Reporter did not update fire interval');
            assert.equal(otherReporter._maxBatchSize, 1000, 'Reporter did not update max batch size');
        });
        test('should emit one big batch when asked to flush', (done) => {
            reporter.onDidBatchEvents((batch) => {
                assert.equal(batch.events.length, 100, 'Did not flush all events when asked');
                done();
            });
            reporter.start(client);
            for (let i = 0; i < 100; i += 1) {
                client.trackEvent({ name: 'TestEvent' });
            }
            reporter.flush();
        });
        teardown(() => {
            client.dispose();
            reporter.dispose();
        });
    });
});
