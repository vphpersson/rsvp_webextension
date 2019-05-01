(() => {
    return new Promise(async resolve => {
        let last_colored_element = null;
        const {selection_color} = await browser.runtime.sendMessage({message_type: 'get_config'});

        function onmousemove_event(event) {
            if (last_colored_element !== null)
                last_colored_element.style.backgroundColor = last_colored_element.dataset.background_color;

            last_colored_element = event.target;
            last_colored_element.dataset.background_color = event.target.style.backgroundColor;
            event.target.style.backgroundColor = selection_color;
        }

        function onkeydown_event(event) {
            switch (event.code) {
                case 'Escape': {
                    stop_hovering();
                    resolve(null);
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
            stop_hovering();
            resolve({title: document.title, text: event.target.innerText});
        }, {once: true});
    });
})();

