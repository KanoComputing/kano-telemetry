import { EventEmitter, Disposables } from '@kano/common/index.js';

function subscribeTimeout(callback, timeout, thisArg, disposables) {
    const cb = !thisArg ? callback : callback.bind(thisArg);
    const id = setTimeout(cb, timeout);
    const result = {
        dispose() {
            clearTimeout(id);
        },
    };
    if (Array.isArray(disposables)) {
        disposables.push(result);
    }
    return result;
}

function subscribeInterval(callback, timeout, thisArg, disposables) {
    const cb = !thisArg ? callback : callback.bind(thisArg);
    const id = setInterval(cb, timeout);
    const result = {
        dispose() {
            clearInterval(id);
        },
    };
    if (Array.isArray(disposables)) {
        disposables.push(result);
    }
    return result;
}

class EventBatch {
    constructor(reporter, events) {
        this._reporter = reporter;
        this.events = events;
    }
    flush() {
        if (!this._reporter) {
            return;
        }
        this._reporter._lastBatch = null;
        if (this._reporter._isWaitingForLastBatchToFlush) {
            this._reporter._isWaitingForLastBatchToFlush = false;
            this._reporter._flush();
        }
        this.dispoe();
    }
    fail() {
        if (!this._reporter) {
            return;
        }
        this._reporter._lastBatch = null;
        if (this._reporter._isWaitingForLastBatchToFlush) {
            this._reporter._isWaitingForLastBatchToFlush = false;
        }
        this._reporter._queue = this.events.concat(this._reporter._queue);
        this.dispoe();
    }
    dispoe() {
        this._reporter = null;
        this.events = null;
    }
}

export class QueueReporter {
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
    fire(batch) {
        this._onDidBatchEvents.fire(batch);
    }
    dispose() {
        this._disposables.dispose();
    }
}
