import { TelemetryClient } from '../index.js';
import { setup, test, assert, suite, teardown } from '/test/util/tools.js';

suite('TelemetryClient', () => {
    suite('#subscribe', () => {
        let client;
        setup(() => {
            client = new TelemetryClient();
        });
        test('should notify when event is emitted', (done) => {
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'TestEvent', 'Event emitted does not match');
                assert.exists(event.date, 'Event emitted does not have a date');
                done();
            });
            client.trackEvent({ name: 'TestEvent' });
        });
        test('should notify exception', (done) => {
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'Exception', 'Event emitted does not match');
                assert(event.properties, 'Event does not have properties');
                assert.equal(event.properties.name, 'Error', 'Event does not have correct name in properties');
                assert.equal(event.properties.message, 'Test Error', 'Event does not have correct message in properties');
                done();
            });
            client.trackException({ exception: new Error('Test Error') });
        });
        test('should notify metrics', (done) => {
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'Metric', 'Event emitted does not match');
                assert(event.properties, 'Event does not have properties');
                assert.equal(event.properties.name, 'TestMetric', 'Event does not have correct name in properties');
                assert.equal(event.properties.value, 7, 'Event does not have correct value in properties');
                done();
            });
            client.trackMetric({ name: 'TestMetric', value: 7 });
        });
        test('should notify traces', (done) => {
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'Trace', 'Event emitted does not match');
                assert(event.properties, 'Event does not have properties');
                assert.equal(event.properties.message, 'TestTrace', 'Event does not have correct message in properties');
                done();
            });
            client.trackTrace({ message: 'TestTrace'});
        });
        test('should notify page views', (done) => {
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'PageView', 'Event emitted does not match');
                assert(event.properties, 'Event does not have properties');
                assert.equal(event.properties.page, '/test', 'Event does not have correct page in properties');
                done();
            });
            client.trackPageView({ page: '/test'});
        });
        teardown(() => {
            client.dispose();
        });
    });
    suite('#scope', () => {
        let client;
        setup(() => {
            client = new TelemetryClient();
        });
        test('should notify with scope', (done) => {
            client.onDidTrackEvent((event) => {
                assert(event.scope, 'Event missing scope property');
                assert.deepEqual(event.scope, ['TestScope'], 'Event scope is incorrect');
                done();
            });
            client.trackEvent({ name: 'TestEvent', scope: 'TestScope' });
        });
        test('should notify with scope, including client scope', (done) => {
            client.setScope('TestClientScope');
            client.onDidTrackEvent((event) => {
                assert.deepEqual(event.scope, ['TestClientScope', 'TestScope'], 'Event scope is incorrect');
                done();
            });
            client.trackEvent({ name: 'TestEvent', scope: 'TestScope' });
        });
        test('should allow to set the scope with the constructor', (done) => {
            const otherClient = new TelemetryClient({ scope: 'OtherClientScope' });
            otherClient.onDidTrackEvent((event) => {
                assert.deepEqual(event.scope, ['OtherClientScope', 'TestScope'], 'Event scope is incorrect');
                done();
            });
            otherClient.trackEvent({ name: 'TestEvent', scope: 'TestScope' });
            otherClient.dispose();
        });
        teardown(() => {
            client.dispose();
        });
    });
    suite('#mount', () => {
        let client;
        setup(() => {
            client = new TelemetryClient();
        });
        test('should notify mounted client\'s events', (done) => {
            const other = new TelemetryClient();
            client.mount(other);
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'OtherClient', 'Name is incorrect');
                assert(event.scope);
                assert(event.properties);
                done();
            });
            other.trackEvent({ name: 'OtherClient' });
        });
        test('should stop notify mounted client event after disposal of mount subscription', (done) => {
            const other = new TelemetryClient();
            const mountSub = client.mount(other);
            client.onDidTrackEvent((event) => {
                done(new Error('Should not have received event'));
            });
            mountSub.dispose();
            other.trackEvent({ name: 'OtherClient' });
            // Give a chance for the test to fail
            setTimeout(() => {
                done();
            });
        });
        test('should allow nested mounts', (done) => {
            const otherA = new TelemetryClient();
            const otherB = new TelemetryClient();
            client.mount(otherA);
            client.mount(otherB);
            let sub = client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'OtherA');
                sub.dispose();
                sub = client.onDidTrackEvent((event) => {
                    assert.equal(event.name, 'OtherB');
                    sub.dispose();
                    done();
                });
                otherB.trackEvent({ name: 'OtherB' });
            });
            otherA.trackEvent({ name: 'OtherA' });
        });
        teardown(() => {
            client.dispose();
        });
    });
});
