
function* make_sibling_iterator(element) {
    while (element !== null) {
        yield element;
        element = element.nextSibling;
    }
}

class RsvpHandler {
    constructor(word_display_element_selector, text_container_selector, display_time_ms = 150, word_color = 'red', done_text = 'DONE!') {
        this._word_display_element = document.querySelector(word_display_element_selector);
        this._text_container_element = document.querySelector(text_container_selector);

        this._current_timeout_id = null;
        this._word_elements_iterator = make_sibling_iterator(this._text_container_element.firstElementChild);
        this._previous_element = null;

        this.display_time_ms = display_time_ms;
        this.word_color = word_color;
        this.done_text = done_text;

        this._register_event_listener();
    }

    get is_active() {
        return this._current_timeout_id !== null;
    }

    set_display_text(text) {
        this._word_display_element.textContent = text;
    }

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
        let [iter_res, last_iter_element] = (() => {
            let i, iter, iter_element;
            for (i = 0, iter = make_sibling_iterator(this._previous_element), iter_element = this._previous_element; i < num_steps; i++) {
                if (iter_element[direction_attribute_name] === null)
                    return [iter,  iter_element];

                iter_element = iter_element[direction_attribute_name];
                iter = make_sibling_iterator(iter_element);
            }
            return [iter, iter_element];
        })();

        this._word_elements_iterator = iter_res;

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
        const {value: iter_word_element, done} = this._word_elements_iterator.next();

        this._uncolor_word_element(this._previous_element);

        if (done)
            return void this.set_display_text(this.done_text);

        this._color_word_element(iter_word_element);
        this.set_display_text(iter_word_element.textContent);

        this._previous_element = iter_word_element;
        this._current_timeout_id = window.setTimeout(this.run.bind(this), this.display_time_ms);
    }

    pause() {
        window.clearTimeout(this._current_timeout_id);
        this._current_timeout_id = null;
    }

    _register_event_listener() {
        window.onkeydown = event => {
            switch (event.code) {
                case 'Space': {
                    this._word_display_element.classList.toggle('hidden');
                    this._text_container_element.classList.toggle('hidden');

                    if (this.is_active)
                        this.pause();
                    else
                        this.run();

                    break;
                }
                case 'ArrowLeft': {
                    this.rewind();
                    break;
                }
                case 'ArrowRight': {
                    this.forward();
                    break;
                }
            }
        };
    }
}

(() => {
    function accept_text(message) {
        browser.runtime.onMessage.removeListener(accept_text);

        const {text_container_selector, text, word_element_tag_name, word_display_element_selector} = message;

        const text_container = document.querySelector(text_container_selector);
        for (const word_segment of text.split(/\s+/)) {
            const word_element = document.createElement(word_element_tag_name);
            word_element.appendChild(document.createTextNode(`${word_segment} `));

            text_container.appendChild(word_element);
        }

        new RsvpHandler(word_display_element_selector, text_container_selector);
    }

    browser.runtime.onMessage.addListener(accept_text);
})();
