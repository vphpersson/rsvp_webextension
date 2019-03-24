
const CONFIG = {
    _rsvp_html_file_path: '/components/rsvp_page/rsvp.html',
    _rsvp_js_file_path: '/js/rsvp_injected.js',
    _content_select_element_js_file_path: '/js/content_select_element.js',
    _content_heuristic_select_element_js_file_path: '/js/content_heuristic_select_element.js',
    _rsvp_options_ui_shared_js_file_path: '/js/rsvp_options_ui_shared.js',
    _word_element_tag_name: 'span',
    words_per_minute: 400,
    word_color: '#FF0000',
    background_color: '#333333',
    text_color: '#FFFFFF',
    done_text: 'DONE!'
};

const INPUT_ATTRIBUTES = {
    words_per_minute: {
        type: 'number',
        step: 25,
        min: 0
    },
    word_color: {
        type: 'color',
    },
    done_text: {
        type: 'text'
    },
    background_color: {
        type: 'color'
    },
    text_color: {
        type: 'color'
    }
};

async function handle_message(message) {
    const {message_type} = message;

    switch (message_type) {
        case 'get_config': {
            return browser.storage.local.get(CONFIG);
        }
        case 'get_input_attributes': {
            return INPUT_ATTRIBUTES;
        }
        case 'receive_text': {
            const retrieved_data = await (async () => {
                const {mode} = message;

                // NOTE: This code relies on `executeScript` returning a `Promise`. This does not appear to be supported by
                // the webextension polyfill, and thus this web extension is _unusable in Chrome_.

                switch (mode) {
                    case 'heuristic_select_element': {
                        return (await browser.tabs.executeScript({file: CONFIG._content_heuristic_select_element_js_file_path}))[0];
                    }
                    case 'select_element': {
                        return (await browser.tabs.executeScript({file: CONFIG._content_select_element_js_file_path}))[0];
                    }
                    default: {
                        throw Error(browser.i18n.getMessage('unsupported_receive_text_mode', mode));
                    }
                }
            })();

            if (retrieved_data === null)
                return void console.warn(browser.i18n.getMessage('retrieved_text_is_null'));

            const {title, text} = retrieved_data;

            const extension_tab = await browser.tabs.create({url: CONFIG._rsvp_html_file_path});
            await browser.tabs.executeScript(extension_tab.id, {file: CONFIG._rsvp_js_file_path});
            await browser.tabs.sendMessage(extension_tab.id, {title, text});

            break;
        }
        default: {
            return void console.error(browser.i18n.getMessage('unsupported_message_type', message_type));
        }
    }
}

browser.runtime.onMessage.addListener(handle_message);
