(() => {
    function* make_sibling_iterator(element) {
        while (element !== null) {
            yield element;
            element = element.nextSibling;
        }
    }

    class RsvpHandler {
        constructor(word_display_element, display_time_ms = 150, word_color = 'red', done_text = 'DONE!') {
            this.word_display_element = word_display_element;
            this.word_elements_iterator = null;

            this._display_time_ms = display_time_ms;
            this._word_color = word_color;
            this.done_text = done_text;

            this._current_timeout_id = null;
            this._previous_element = null;
        }

        get is_active() {
            return this._current_timeout_id !== null;
        }

        get display_time_ms() {
            return this._display_time_ms;
        }

        set display_time_ms(ms_time) {
            // TODO: Fix the case where the delay is 0.
            this._display_time_ms = ms_time === Infinity ? 0 : (ms_time || 0);
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
            // TODO: Make nicer?
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
                return void console.warn('The word elements iterator is `null`.');

            const {value: iter_word_element, done} = this.word_elements_iterator.next();

            this._uncolor_word_element(this._previous_element);

            if (done)
                return void this.set_display_text(this.done_text);

            this._color_word_element(iter_word_element);
            this.set_display_text(iter_word_element.textContent);

            this._previous_element = iter_word_element;
            // TODO: Fix the case where the delay is 0. Add an if statement?
            this._current_timeout_id = window.setTimeout(this.run.bind(this), this.display_time_ms);
        }

        pause() {
            window.clearTimeout(this._current_timeout_id);
            this._current_timeout_id = null;
        }
    }

    function register_rsvp_event_handlers(rsvp_handler, word_color_input, wpm_input, text_container, topbar) {
        word_color_input.addEventListener('change', event => {
            rsvp_handler.word_color = event.target.value;
        });

        wpm_input.addEventListener('change', event => {
            rsvp_handler.display_time_ms = 60000 / event.target.value;
        });

        window.onkeydown = event => {
            switch (event.code) {
                case 'Space': {
                    rsvp_handler.word_display_element.classList.toggle('hidden');
                    text_container.classList.toggle('hidden');
                    topbar.classList.toggle('hidden');

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
    }

    function populate_text_container(text_container, text, word_element_tag_name) {
        for (const word_segment of text.split(/\s+/)) {
            const word_element = document.createElement(word_element_tag_name);
            word_element.appendChild(document.createTextNode(`${word_segment} `));

            text_container.appendChild(word_element);
        }
    }

    function set_default_input_values(input_value_entries) {
        for (const [input, value] of input_value_entries) {
            input.value = value;
        }
    }

    return new Promise(async resolve => {
        const {text} = await new Promise(resolve_message => {
            function accept_message(message) {
                browser.runtime.onMessage.removeListener(accept_message);
                resolve_message(message);
            }

            browser.runtime.onMessage.addListener(accept_message);
            // Let the `executeScript` running this file in the background script return.
            resolve();
        });

        const config = await browser.runtime.sendMessage({message_type: 'get_config'});

        const text_container = document.querySelector(config.text_container_selector);
        const word_display_element = document.querySelector(config.word_display_element_selector);
        const topbar = document.querySelector(config.topbar_selector);
        const word_color_input = document.querySelector(config.word_color_input_selector);
        const wpm_input = document.querySelector(config.wpm_input_selector);

        set_default_input_values([
            [word_color_input, config.word_color],
            [wpm_input, config.words_per_minute]
        ]);

        populate_text_container(text_container, text, config.word_element_tag_name);

        const rsvp_handler = new RsvpHandler(
            word_display_element, (60000 / config.words_per_minute),
            config.word_color,
            config.done_text
        );
        rsvp_handler.word_elements_iterator = make_sibling_iterator(text_container.firstElementChild);

        register_rsvp_event_handlers(rsvp_handler, word_color_input, wpm_input, text_container, topbar);
    });
})();
