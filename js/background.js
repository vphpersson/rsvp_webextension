
const CONFIG = {
    text_container_selector: '.main',
    rsvp_html_file_path: '/components/rsvp.html',
    rsvp_js_file_path: '/js/rsvp.js',
    word_element_tag_name: 'span',
    word_display_element_selector: '.word_display'
};

async function handle_message(message) {
    const {message_type} = message;

    switch (message_type) {
        case 'receive_text': {
            const tab = await browser.tabs.create({url: CONFIG.rsvp_html_file_path});

            await browser.tabs.executeScript(tab.id, {
                file: CONFIG.rsvp_js_file_path
            });

            await browser.tabs.sendMessage(tab.id, {
                text_container_selector: CONFIG.text_container_selector,
                word_display_element_selector: CONFIG.word_display_element_selector,
                word_element_tag_name: CONFIG.word_element_tag_name,
                text: message.text,
            });

            break;
        }
        default: {
            return void console.error(`Unsupported message type: ${message_type}`);
        }
    }
}

browser.runtime.onMessage.addListener(handle_message);
