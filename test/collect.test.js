import { TelemetryClient } from '../index.js';
import { setup, test, assert, suite, teardown } from '/test/util/tools.js';

suite('TelemetryClient', () => {
    suite('#collect', () => {
        let client;
        setup(() => {
            client = new TelemetryClient();
        });
        test('should collect exceptions when asked', (done) => {
            client._errorEmitter = document.createElement('div');
            client.collectExceptions();
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'Exception', 'Emitted event is not an Exception');
                assert.equal(event.properties.message, 'TestError', 'Emitted event does not have correct message');
                done();
            });
            client._errorEmitter.dispatchEvent(new ErrorEvent('error', {
                message: 'TestError',
                filename: 'test.js',
                lineno: 1,
                colno: 1,
            }));
        });
        test('should collect exceptions when error object is here', (done) => {
            client._errorEmitter = document.createElement('div');
            client.collectExceptions();
            client.onDidTrackEvent((event) => {
                assert.equal(event.name, 'Exception', 'Emitted event is not an Exception');
                assert.equal(event.properties.message, 'TestError', 'Emitted event does not have correct message');
                done();
            });
            client._errorEmitter.dispatchEvent(new ErrorEvent('error', {
                error: new Error('TestError')
            }));
        });
        teardown(() => {
            client.dispose();
        });
    });
});
