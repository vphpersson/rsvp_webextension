
function save_option(event) {
    event.preventDefault();

    const input_value = event.currentTarget.querySelector('input').value;
    const key = event.currentTarget.dataset['keyName'];

    browser.storage.local.set({
        [key]: key === 'stored_file_types' ? input_value.split(', ') : input_value
    });
}

async function initialize() {
    const config = await browser.runtime.sendMessage({message_type: 'get_config'});

    const {stored_file_types, stored_num_page_results} = await browser.storage.local.get();

    document.querySelector('#file-types-input').value = (stored_file_types || config.file_types).join(', ');
    document.querySelector('#num-page-results-input').value = stored_num_page_results || config.num_page_results;
}

document.addEventListener('DOMContentLoaded', initialize);

document.querySelectorAll('form').forEach(form => form.addEventListener('submit', save_option));