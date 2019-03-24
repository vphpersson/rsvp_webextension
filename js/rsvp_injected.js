(() => {
    function* make_sibling_iterator(element) {
        while (element !== null) {
            yield element;
            element = element.nextSibling;
        }
    }

    class RsvpHandler {
        constructor(word_display_element, words_per_minute, word_color, done_text) {
            this.word_display_element = word_display_element;
            this.word_elements_iterator = null;

            this.words_per_minute = words_per_minute;
            this._word_color = word_color;
            this.done_text = done_text;

            this._current_timeout_id = null;
            this._previous_element = null;
        }

        get is_active() {
            return this._current_timeout_id !== null;
        }

        get word_color() {
            return this._word_color;
        }

        set word_color(color) {
            this._word_color = color;
            this._color_word_element(this._previous_element);
        }

        set_display_text(text) {
            this.word_display_element.textContent = text;
        }

        // TODO: Make static?
        _uncolor_word_element(element) {
            if (element) {
                element.style.color = '';
            }
        }

        _color_word_element(element) {
            if (element) {
                element.style.color = this.word_color;
            }
        }

        _rewind_or_forward(direction_attribute_name, num_steps) {
            const [iter_res, last_iter_element] = (() => {
                let i, iter, iter_element;
                for (i = 0, iter = make_sibling_iterator(this._previous_element), iter_element = this._previous_element; i < num_steps; i++) {
                    if (iter_element[direction_attribute_name] === null)
                        return [iter,  iter_element];

                    iter_element = iter_element[direction_attribute_name];
                    iter = make_sibling_iterator(iter_element);
                }
                return [iter, iter_element];
            })();

            this.word_elements_iterator = iter_res;

            this._uncolor_word_element(this._previous_element);
            this._color_word_element(last_iter_element);
            this.set_display_text(last_iter_element.textContent);

            this._previous_element = last_iter_element;
        }

        rewind(num_steps = 8) {
            return this._rewind_or_forward('previousElementSibling', num_steps);

        }

        forward(num_steps = 8) {
            return this._rewind_or_forward('nextElementSibling', num_steps);
        }

        run() {
            if (this.word_elements_iterator === null)
                return void console.warn(browser.i18n.getMessage('word_elements_iterator_is_null'));

            const {value: iter_word_element, done} = this.word_elements_iterator.next();

            this._uncolor_word_element(this._previous_element);

            if (done)
                return void this.set_display_text(this.done_text);

            this._color_word_element(iter_word_element);
            this.set_display_text(iter_word_element.textContent);

            this._previous_element = iter_word_element;

            if (this.words_per_minute <= 0)
                return;

            this._current_timeout_id = window.setTimeout(this.run.bind(this), 60000 / this.words_per_minute);
        }

        pause() {
            window.clearTimeout(this._current_timeout_id);
            this._current_timeout_id = null;
        }
    }
    function populate_text_container(text_container, text, word_element_tag_name) {
        for (const word_segment of text.split(/\s+/)) {
            const word_element = document.createElement(word_element_tag_name);
            word_element.appendChild(document.createTextNode(`${word_segment} `));

            text_container.appendChild(word_element);
        }
    }

    return new Promise(async resolve => {
        const {text, title} = await new Promise(resolve_message => {
            function accept_message(message) {
                browser.runtime.onMessage.removeListener(accept_message);
                resolve_message(message);
            }

            browser.runtime.onMessage.addListener(accept_message);
            // Let the `executeScript` running this file in the background script return.
            resolve();
        });

        const config = await browser.runtime.sendMessage({message_type: 'get_config'});
        const input_attributes = await browser.runtime.sendMessage({message_type: 'get_input_attributes'});

        function make_labelled_input(input_key) {
            const input = document.createElement('input');
            Object.entries(input_attributes[input_key]).forEach(([attr_key, attr_value]) => input.setAttribute(attr_key, attr_value));
            input.value = config[input_key];

            const label = document.createElement('label');
            label.appendChild(document.createTextNode(`${browser.i18n.getMessage(input_key)}: `));
            label.appendChild(input);

            return [input, label];
        }

        // Create references to document elements.

        const [wpm_input, wpm_label] = make_labelled_input('words_per_minute');
        const [word_color_input, word_color_label] = make_labelled_input('word_color');
        const [background_color_input, background_color_label] = make_labelled_input('background_color');
        const [text_color_input, text_color_label] = make_labelled_input('text_color');

        const options_bar_container = document.createElement('options-bar-container');
        const options_bar = document.createElement('options-bar');
        const text_container = document.createElement('text-container');
        const word_display_element = document.createElement('word-display');

        const rsvp_handler = new RsvpHandler(
            word_display_element,
            config.words_per_minute,
            config.word_color,
            config.done_text
        );

        function set_word_color(value) {
            rsvp_handler.word_color = value;
        }

        function set_words_per_minute(value) {
            rsvp_handler.words_per_minute = value;
        }

        function set_background_color(value) {
            document.body.style.backgroundColor = value;
            options_bar_container.style.backgroundColor = value;
            options_bar.style.backgroundColor = value;
        }

        function set_text_color(value) {
            document.body.style.color = value;
        }

        // Add content to the document.

        document.title = `RSVP: ${title}`;

        set_background_color(config.background_color);
        set_text_color(config.text_color);
        [wpm_label, word_color_label, background_color_label, text_color_label].forEach(label => options_bar.appendChild(label));
        populate_text_container(text_container, text, config._word_element_tag_name);

        options_bar_container.appendChild(options_bar);
        options_bar_container.appendChild(document.createElement('hr'));

        document.body.appendChild(options_bar_container);
        document.body.appendChild(text_container);
        word_display_element.setAttribute('class', 'hidden');
        document.body.appendChild(word_display_element);

        // Have the RSVP handler start from the first element in the text container.
        rsvp_handler.word_elements_iterator = make_sibling_iterator(text_container.firstElementChild);

        // Register event listeners.

        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local')
                return;

            for (const [key, change] of Object.entries(changes)) {
                const {newValue: new_value} = change;
                if (new_value === null)
                    continue;

                switch (key) {
                    case 'word_color': {
                        word_color_input.value = new_value;
                        set_word_color(new_value);
                        break;
                    }
                    case 'words_per_minute': {
                        wpm_input.value = new_value;
                        set_words_per_minute(new_value);
                        break;
                    }
                    case 'background_color': {
                        background_color_input.value = new_value;
                        set_background_color(new_value);
                        break;
                    }
                    case 'text_color': {
                        text_color_input.value = new_value;
                        set_text_color(new_value);
                        break;
                    }
                    default: {
                        console.log(browser.i18n.getMessage('unused_change_key', key));
                    }
                }
            }
        });

        word_color_input.addEventListener('change', event => set_word_color(event.target.value));
        wpm_input.addEventListener('change', event => set_words_per_minute(event.target.value));
        background_color_input.addEventListener('change', event => set_background_color(event.target.value));
        text_color_input.addEventListener('change', event => set_text_color(event.target.value));

        window.onkeydown = event => {
            // TODO: Add support for user-specified control buttons?
            switch (event.code) {
                case 'Space': {
                    rsvp_handler.word_display_element.classList.toggle('hidden');
                    text_container.classList.toggle('hidden');
                    options_bar_container.classList.toggle('hidden');

                    if (rsvp_handler.is_active)
                        rsvp_handler.pause();
                    else
                        rsvp_handler.run();

                    break;
                }
                case 'ArrowLeft': {
                    rsvp_handler.rewind();
                    break;
                }
                case 'ArrowRight': {
                    rsvp_handler.forward();
                    break;
                }
            }
        };
    });
})();
