import * as Log from './utils/log4js.js';
import { properties as menuProperties } from './menu.js';

export { SplashController };

Log.setLogLevel(Log.LEVEL_ERROR);

const properties = {
    splashDuration: 40 * 1000,
}

const SplashController = (menuController, rootElt) => {
    let timeOutAnimationId;
    let preludeElt = rootElt.querySelector('#prelude');
    let introContentElt = rootElt.querySelector('#introContent');

    const nextScreen = () => {
        // open the game section and show the menu
        menuController.open(menuProperties.SECTION_GAME);        
        menuController.state.setValue(menuProperties.STATE_VISIBLE);    
        document.querySelector("#username").focus();   
    }

    const handleKeyBoard = (e) => { 
        Log.debug(`SplashController.handleKeyBoard()`);
        clearTimeout(timeOutAnimationId);
        nextScreen();
    };

    const openSection = () => {
        Log.debug(`SplashController.openSection()`);

        document.querySelector("header").classList.add("hidden");
        document.querySelector("footer").classList.add("hidden");
        // add handleKeyBoard
        window.addEventListener("click", handleKeyBoard);
        // start the animation  
        document.body.classList.add("splash");
        preludeElt.style.animation = "prelude 7s linear 0s 1";
        introContentElt.style.animation = "introContent 60s linear 2s 1";

        // timeOut actions
        timeOutAnimationId = setTimeout(nextScreen, properties.splashDuration);
    }

    const closeSection = () => {
        Log.debug(`SplashController.closeSection()`);
        
        document.querySelector("header").classList.remove("hidden");
        document.querySelector("footer").classList.remove("hidden");
        // remove handleKeyBoard
        window.removeEventListener("click", handleKeyBoard);
        // close the animation
        document.body.classList.remove("splash");
        preludeElt.style.animation = "";
        introContentElt.style.animation = "";

    }

    return {
        openSection,
        closeSection,
    }
};


