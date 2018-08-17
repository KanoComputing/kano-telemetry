import { EventEmitter, subscribeDOM, Disposables } from '@kano/common/index.js';

const NAMES = Object.freeze({
    EXCEPTION: 'Exception',
    METRIC: 'Metric',
    TRACE: 'Trace',
    PAGE_VIEW: 'PageView',
});

export class TelemetryClient {
    constructor(opts = {}) {
        this._onDidTrackEvent = new EventEmitter();
        this.setScope(opts.scope);
        this._disposables = new Disposables();
        this._disposables.push(this._onDidTrackEvent);
        this._errorEmitter = window;
    }
    get onDidTrackEvent() {
        return this._onDidTrackEvent.event;
    }
    setScope(scope) {
        this._scope = scope;
    }
    collectExceptions() {
        this._collectsExceptions = true;
        subscribeDOM(this._errorEmitter, 'error', (e) => {
            if (e.error) {
                this.trackException({ exception: e });
            } else {
                this.trackException({
                    exception: new Error(e.message),
                });
            }
        }, null, this._disposables);
    }
    trackEvent(opts = {}) {
        if (!opts.name) {
            return;
        }
        let scope = opts.scope || [];
        scope = Array.isArray(scope) ? scope : [scope];
        if (this._scope) {
            scope.unshift(this._scope);
        }
        this._onDidTrackEvent.fire({
            name: opts.name,
            scope,
            properties: opts.properties || {},
        });
    }
    trackException(opts = {}) {
        if (!opts.exception || !(opts.exception instanceof Error)) {
            return;
        }
        this.trackEvent({
            name: NAMES.EXCEPTION,
            properties: {
                name: opts.exception.name,
                message: opts.exception.message,
                stack: opts.exception.stack,
            },
        });
    }
    trackMetric(opts = {}) {
        if (!opts.name) {
            return;
        }
        this.trackEvent({
            name: NAMES.METRIC,
            properties: {
                name: opts.name,
                value: opts.value,
            },
        });
    }
    trackTrace(opts = {}) {
        if (!opts.message) {
            return;
        }
        this.trackEvent({
            name: NAMES.TRACE,
            properties: {
                message: opts.message,
            },
        });
    }
    trackPageView(opts = {}) {
        if (!opts.page) {
            return;
        }
        this.trackEvent({
            name: NAMES.PAGE_VIEW,
            properties: {
                page: opts.page,
            },
        });
    }
    mount(client) {
        return client.onDidTrackEvent((event) => this.trackEvent(event));
    }
    dispose() {
        this._disposables.dispose();
    }
}
