import { render, html } from 'lit-html';
import { scroll } from 'lit-virtualizer/lib/scroll.js';
import { Layout1d, scrollerRef } from 'lit-virtualizer';

const example = (contacts) => html`
    <section>
        ${scroll({
            items: contacts,
            renderItem: ({ mediumText }) => html`<p>${mediumText}</p>`,
            layout: Layout1d,
            scrollTarget: window
        })}
    </section>
`;

(async function go() { 
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.body);

    const distance = 10000;
    const duration = 5000;

    let frames = 0;
    let start;

    let scroller;

    function onFrame() {
        frames++;
        const stamp = window.performance.now();
        if (start === undefined) {
            start = stamp;
        }
        const elapsed = stamp - start;
        if (window.pageYOffset < distance || elapsed < duration) {
            window.scroll(0, Math.min(distance, Math.ceil(elapsed / duration * distance)));
            window.requestAnimationFrame(onFrame);
            // setTimeout(onFrame, 0);
        }
        else {
            console.log(frames, stamp - start, 1000 / ((stamp - start) / frames));
            const { timeElapsed, virtualizationTime } = scroller.stopBenchmarking();
            console.log(timeElapsed, virtualizationTime, virtualizationTime / frames);
        }
    }

    setTimeout(function() {
        scroller = document.querySelector('section')[scrollerRef];
        scroller.startBenchmarking();
        window.requestAnimationFrame(onFrame);
    }, 5000);
})();