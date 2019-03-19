document.addEventListener('DOMContentLoaded', async () => {
    let last_colored_element = null;

    function onmousemove_event(event) {
        if (last_colored_element !== null) {
            last_colored_element.style.backgroundColor = last_colored_element.dataset.background_color;
        }

        last_colored_element = event.target;
        last_colored_element.dataset.background_color = event.target.style.backgroundColor;
        event.target.style.backgroundColor = 'green';
    }
    document.addEventListener('mousemove', onmousemove_event);

    document.addEventListener('click', async event  => {
        const text_contents = [];

        const node_iterator = document.createNodeIterator(
            event.target,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );

        for (let node = node_iterator.nextNode(); node !== null; node = node_iterator.nextNode())
            for (const word_segment of node.textContent.split(/\s+/).filter(x => x.trim() !== ''))
                text_contents.push(word_segment);

        last_colored_element.dataset.background_color = event.target.style.backgroundColor;

        await browser.runtime.sendMessage({text: text_contents.join(' '), message_type: 'receive_text'});

    }, {once: true});
});
