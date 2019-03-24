
function create_options_form(input, label, key) {
    const form = document.createElement('form');
    form.setAttribute('class', 'options-form');

    const button = document.createElement('button');
    button.setAttribute('class', 'options-form__save-button');
    button.textContent = browser.i18n.getMessage('save_button_text');

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(button);

    form.addEventListener('submit', event => {
        event.preventDefault();

        browser.storage.local.set({
           [key]: event.currentTarget.querySelector('input').value
        }).catch(err => console.error(err));
    });

    return form;
}

document.addEventListener('DOMContentLoaded', async () => {
    const config = await browser.runtime.sendMessage({message_type: 'get_config'});
    const input_attributes = await browser.runtime.sendMessage({message_type: 'get_input_attributes'});

    for (const [key, value] of Object.entries(config)) {
        if (key.startsWith('_'))
            continue;

        const input = document.createElement('input');
        Object.entries(input_attributes[key]).forEach(([attr_key, attr_value]) => input.setAttribute(attr_key, attr_value));
        input.value = value;

        const label = document.createElement('label');
        label.appendChild(document.createTextNode(browser.i18n.getMessage(key)));

        document.body.appendChild(create_options_form(input, label, key));
    }
});
