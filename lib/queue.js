import { EventEmitter, Disposables, subscribeInterval } from '@kano/common/index.js';

/**
 * Represents a batch of telemetry events ready to be saved
 */
class EventBatch {
    /**
     *
     * @param {QueueReporter} reporter The reporter from which this Event was created
     * @param {Array} events A list of events to be sent
     */
    constructor(reporter, events) {
        this._reporter = reporter;
        this.events = events;
    }
    /**
     * Mark the batch as sent and unlock the reporter for it to send more events
     */
    flush() {
        if (!this._reporter) {
            return;
        }
        this._reporter._lastBatch = null;
        if (this._reporter._isWaitingForLastBatchToFlush) {
            this._reporter._isWaitingForLastBatchToFlush = false;
            this._reporter._flush();
        }
        this.dispose();
    }
    /**
     * Mark the batch as failed and send back the events to the reporter to be sent
     * on next timeout
     */
    fail() {
        if (!this._reporter) {
            return;
        }
        this._reporter._lastBatch = null;
        if (this._reporter._isWaitingForLastBatchToFlush) {
            this._reporter._isWaitingForLastBatchToFlush = false;
        }
        this._reporter._queue = this.events.concat(this._reporter._queue);
        this.dispose();
    }
    /**
     * Deletes the batch. If events were waiting to be sent they will be discarded.
     * If the reporter that originated this batch was waiting for it to flush or fail,
     * it will stay stuck in that state
     */
    dispose() {
        this._reporter = null;
        this.events = null;
    }
}

/**
 * Queues up events from a telemetry client and emit batches of events to be saved
 */
export class QueueReporter {
    /**
     * @param {Object} opts Reporter options
     * @param {Number} opts.fireInterval Interval at which the reporter should emit events
     * @param {Number} opts.maxBatchSize The maximum number of events for a single batch
     */
    constructor(opts = {}) {
        this._onDidBatchEvents = new EventEmitter();
        this._disposables = new Disposables();
        this._disposables.push(this._onDidBatchEvents);
        this._queue = [];

        this.setFireInterval(opts.fireInterval || 1000);
        this.setMaxBatchSize(opts.maxBatchSize || 50);
    }
    get onDidBatchEvents() {
        return this._onDidBatchEvents.event;
    }
    setFireInterval(interval) {
        this._fireInterval = interval;
    }
    setMaxBatchSize(size) {
        this._maxBatchSize = size;
    }
    /**
     * Starts listening to events and batching them
     * @param {TelemetryClient} client Will listen to this client's events ad batch them
     */
    start(client) {
        this._client = client;
        this._client.onDidTrackEvent((event) => {
            this._queueEvent(event);
        }, null, this._disposables);
        subscribeInterval(() => {
            this._flush();
        }, this._fireInterval, this, this._disposables);
    }
    _queueEvent(event) {
        this._queue.push(event);
    }
    _flush() {
        if (this._lastBatch) {
            this._isWaitingForLastBatchToFlush = true;
            return;
        }
        const events = this._queue.splice(0, Math.min(this._maxBatchSize, this._queue.length));
        if (!events.length) {
            return;
        }
        this._lastBatch = new EventBatch(this, events);
        this.fire(this._lastBatch);
    }
    flush() {
        const events = this._queue.slice(0);
        this._queue.length = 0;
        this.fire(new EventBatch(this, events));
    }
    fire(batch) {
        this._onDidBatchEvents.fire(batch);
    }
    dispose() {
        this._disposables.dispose();
    }
}

export default QueueReporter;
