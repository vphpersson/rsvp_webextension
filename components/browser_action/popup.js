const use_heurisics_button = document.querySelector('.use-heuristics-button');
const select_element_button = document.querySelector('.select-element-button');

use_heurisics_button.addEventListener('click', () => {

});
select_element_button.addEventListener('click', () => {
    browser.runtime.sendMessage({message_type: 'receive_text'}).catch(err => console.error(err));
    window.close();
});

use_heurisics_button.disabled = false;
select_element_button.disabled = false;
