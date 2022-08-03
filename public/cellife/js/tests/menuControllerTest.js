import { tat } from "./../../../js/modules/test.js";
import { dom } from '../utils/general.js';
import { MenuController, MenuView, MenuModel, MenuItem, properties } from "./../menu.js";

tat('Cellife / Module MenuController', (assert) => {

    // creation of the virtual dom
    const rootElt = dom(`<div id="main-content" />`);
    const menuElt = dom(`<section id="section-menu" />`);
    const section1Elt = dom(`<section id="section-1" />`);
    const section2Elt = dom(`<section id="section-2" />`);
    rootElt.insertAdjacentElement('beforeend', menuElt);
    rootElt.insertAdjacentElement('beforeend', section1Elt);
    rootElt.insertAdjacentElement('beforeend', section2Elt);
    
    // initialise the controller and the view
    const menuController = MenuController(MenuModel);
    const menuView = MenuView(menuController, undefined, undefined, undefined, rootElt, menuElt);

    // add 2 sections
    const section1 = MenuItem('Section 1', 'section-1', undefined, undefined, properties.STATE_VISIBLE);
    const section2 = MenuItem('Section 2', 'section-2', undefined, undefined, properties.STATE_VISIBLE);
    menuController.addMenuItem(section1);
    menuController.addMenuItem(section2);

    // check nb of menu btn created
    assert.equals([...rootElt.querySelectorAll('div.menuItem')].length, 2);
    // check if all sections are closed
    assert.equals([...rootElt.querySelectorAll('section.close-section')].length, 2);
    // simulate click on menu btn for section 1 and check if the section only is open
    menuElt.querySelector('#MENUITEM_1').parentNode.dispatchEvent(new Event("click"));
    assert.equals(rootElt.querySelector('#section-1').classList.contains('close-section'), false);
    assert.equals(rootElt.querySelector('#section-2').classList.contains('close-section'), true);
    // simulate click on menu btn for section 2 and check if the section only is open
    menuElt.querySelector('#MENUITEM_2').parentNode.dispatchEvent(new Event("click"));
    assert.equals(rootElt.querySelector('#section-1').classList.contains('close-section'), true);
    assert.equals(rootElt.querySelector('#section-2').classList.contains('close-section'), false);

}, true);