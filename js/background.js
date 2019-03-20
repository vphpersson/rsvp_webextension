
const CONFIG = {
    text_container_selector: '.main',
    rsvp_html_file_path: '/components/rsvp.html',
    rsvp_js_file_path: '/js/rsvp.js',
    word_element_tag_name: 'span',
    word_display_element_selector: '.word_display',
    words_per_minute: 400,
    word_color: '#FF0000',
    done_text: 'DONE!'
};

async function handle_message(message) {
    const {message_type} = message;

    switch (message_type) {
        case 'receive_text': {
            // NOTE: This code relies on `executeScript` returning a `Promise`. This does not appear to be supported by
            // the webextension polyfill, and thus this web extension is _unusable in Chrome_.
            const [text] = await browser.tabs.executeScript({file: '/js/content_select_element.js'});
            if (text === null)
                return;

            const extension_tab = await browser.tabs.create({url: CONFIG.rsvp_html_file_path});

            await browser.tabs.executeScript(extension_tab.id, {
                file: CONFIG.rsvp_js_file_path
            });

            await browser.tabs.sendMessage(extension_tab.id, {
                text_container_selector: CONFIG.text_container_selector,
                word_display_element_selector: CONFIG.word_display_element_selector,
                word_element_tag_name: CONFIG.word_element_tag_name,
                words_per_minute: CONFIG.words_per_minute,
                word_color: CONFIG.word_color,
                done_text: CONFIG.done_text,
                text,
            });

            break;
        }
        default: {
            return void console.error(`Unsupported message type: ${message_type}`);
        }
    }
}

browser.runtime.onMessage.addListener(handle_message);
