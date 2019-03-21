
const CONFIG = {
    text_container_selector: '.main',
    rsvp_html_file_path: '/components/rsvp.html',
    rsvp_js_file_path: '/js/rsvp.js',
    content_select_element_js_file_path: '/js/content_select_element.js',
    content_heuristic_select_element_js_file_path: '/js/content_heuristic_select_element.js',
    word_element_tag_name: 'span',
    word_display_element_selector: '.word_display',
    topbar_selector: '.topbar',
    word_color_input_selector: '.word_color_input',
    wpm_input_selector: '.wpm_input',
    words_per_minute: 400,
    word_color: '#FF0000',
    done_text: 'DONE!'
};

async function handle_message(message) {
    const {message_type} = message;

    switch (message_type) {
        case 'get_config': {
            // TODO: Add lookups in `storage`.
            return CONFIG;
        }
        case 'receive_text': {
            const text = await (async () => {
                const {mode} = message;

                // NOTE: This code relies on `executeScript` returning a `Promise`. This does not appear to be supported by
                // the webextension polyfill, and thus this web extension is _unusable in Chrome_.

                switch (mode) {
                    case 'heuristic_select_element': {
                        return (await browser.tabs.executeScript({file: CONFIG.content_heuristic_select_element_js_file_path}))[0];
                    }
                    case 'select_element': {
                        return (await browser.tabs.executeScript({file: CONFIG.content_select_element_js_file_path}))[0];
                    }
                    default: {
                        throw Error(`Unsupported receive_text mode: ${mode}`);
                    }
                }
            })();

            if (text === null)
                return void console.warn('The selected text is `null`.');

            const extension_tab = await browser.tabs.create({url: CONFIG.rsvp_html_file_path});
            await browser.tabs.executeScript(extension_tab.id, {file: CONFIG.rsvp_js_file_path});
            await browser.tabs.sendMessage(extension_tab.id, {text});

            break;
        }
        default: {
            return void console.error(`Unsupported message type: ${message_type}`);
        }
    }
}

browser.runtime.onMessage.addListener(handle_message);
