new Promise(resolve => {
    let last_colored_element = null;

    function onmousemove_event(event) {
        if (last_colored_element !== null)
            last_colored_element.style.backgroundColor = last_colored_element.dataset.background_color;

        last_colored_element = event.target;
        last_colored_element.dataset.background_color = event.target.style.backgroundColor;
        event.target.style.backgroundColor = 'green';
    }

    function onkeydown_event(event) {
        switch (event.code) {
            case 'Escape': {
                stop_hovering();
                break;
            }
        }
    }

    function stop_hovering() {
        document.removeEventListener('keydown', onmousemove_event);
        document.removeEventListener('mousemove', onmousemove_event);
        if (last_colored_element !== null) {
            last_colored_element.style.backgroundColor = last_colored_element.dataset.background_color;
        }
    }

    document.addEventListener('mousemove', onmousemove_event);
    document.addEventListener('keydown', onkeydown_event);
    document.addEventListener('click', event  => {
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

        stop_hovering();

        resolve(text_contents.join(' '));
    }, {once: true});
});
