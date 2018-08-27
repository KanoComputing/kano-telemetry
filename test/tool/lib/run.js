import 'mocha/mocha.js';

function loadStylesheet(src) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = src;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });
}

function loadTest(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export const loadTests = (tests) => {
    mocha.setup('tdd');
    if (window.onMochaEvent) {
        mocha.reporter('xunit');
    }
    const tasks = tests.map(t => loadTest(t));
    tasks.push(loadStylesheet('/node_modules/mocha/mocha.css'));
    return Promise.all(tasks)
        .then(() => {
            const container = document.createElement('div');
            container.setAttribute('id', 'mocha');
            document.body.appendChild(container);
            mocha.globals(['onMochaEvent']);
            mocha.checkLeaks();
            const runner = mocha.run();
            // Added by puppeteer test automation
            if (window.onMochaEvent) {
                mocha._reporter.prototype.write = (line) => {
                    window.onMochaEvent(line);
                };
                runner.once('end', () => {
                    window.onMochaEnd();
                });
            }
        });
};


/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @api private
 * @param {Object} test
 * @return {Object}
 */
function clean(test) {
    var err = test.err || {};
    if (err instanceof Error) {
        err = errorJSON(err);
    }

    return {
        title: test.title,
        fullTitle: test.fullTitle(),
        duration: test.duration,
        currentRetry: test.currentRetry(),
        err: cleanCycles(err),
    };
}

/**
 * Replaces any circular references inside `obj` with '[object Object]'
 *
 * @api private
 * @param {Object} obj
 * @return {Object}
 */
function cleanCycles(obj) {
    var cache = [];
    return JSON.parse(
        JSON.stringify(obj, function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Instead of going in a circle, we'll print [object Object]
                    return '' + value;
                }
                cache.push(value);
            }

            return value;
        })
    );
}

/**
 * Transform an Error object into a JSON object.
 *
 * @api private
 * @param {Error} err
 * @return {Object}
 */
function errorJSON(err) {
    var res = {};
    Object.getOwnPropertyNames(err).forEach(function (key) {
        res[key] = err[key];
    }, err);
    return res;
}
