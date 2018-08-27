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
