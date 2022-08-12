===============================================
project description
===============================================

The project is to create a multi-players game named cellife.
The goal of this game is to fight again Virus.

The user can create or join an existing party.
When we game is stated, the user use the left and right arrow keys to change the direction of the cell and can drop poison with the space key 
in order to kill virus and increase his score.

The best scores are listed in the highscore list.
Users can communicate between them using the chatRoom.

Users can change their settings (turn the sound on/off)
The Game has also a hidden admin section in order to change the game properties without having to release a new build (press Ctrl A in the HELP section)


===============================================
project source code
===============================================

The whole repository contains CAS Web Applikationen homeworks (including the end-of-study application: cellife).

The source code specific to the cellife application (on the end-of-study project) are located at :

front-end client :
    /public/cellife/*
    /public/cellife/css/*                       
    /public/cellife/img/*
    /public/cellife/js/client-dist/*
    /public/cellife/js/projectors/*
    /public/cellife/js/tests/*
    /public/cellife/js/utils/*
    /public/cellife/sound/*

back-end servers :
    /src/server.js                      // start the node and socket.io servers
    /src/server-io.js                   // start the different socket.io servers
    /src/servers/game.js                // the cellife socket.io server, initialise the partyController, hallOfFame and dataPool services
    /src/game/*                         // the cellife services

start : npm run start_nodemon

===============================================
project features
===============================================

usage of socket.io
 - Features provided by Socket.IO over plain WebSockets:
   - reliability (fallback to HTTP long-polling in case the WebSocket connection cannot be established)
   - automatic reconnection
   - packet buffering
   - acknowledgments : possibility to add a callback as the last argument of the emit(), and this callback will be called once the other side acknowledges the event
   - broadcasting to all clients or to a subset of clients (called "Room")
   - multiplexing (called "Namespace") : A Namespace is a communication channel that allows you to split the logic of your application over a single shared connection

usage of observables and attributes ( new Observables : ObservableObject and ObservableObjectProperties )
usage of controller pattern : DataPoolController, MenuController, SplashController, HelpController, HallOfFameController, GameController, PartyController, ChatController, SelectionController
usage of projector pattern : ChatProjector, HallOfFameProjector, MenuProjector, PartyProjector, PartySelectionProjector
master detail pattern : PartyProjector, PartySelectionProjector
test case : MenuController
usage of scheduler (to synchronise animation and dialog display)
usage of dialog htmlelement

divers:
- extend Error exception
- prevent all input fields from html injection
- persistence all user settings (in localstorage)
- the partyController on server side is generic and can be used to handle different type of games

===============================================
issues
===============================================

- data synchronization issue in a client-server architecture : the 'update devil loop'
    cause : the client is desynchronized with the server when it sent several updates before receiving the acknowledge.
    work-around : reduce the frequency of the updates (bind on onchange event instead of oninput, bind on form submit ...)
    solution : (?) universal time to ignored expired acknowledge message

- play sound when the animation start (without user interaction)

===============================================
Game logic:
===============================================

 - The Bullets are refilled every 10 seconds
 - Every 5 seconds the game is faster
 - The game boundaries is a square of 20x20 units  
 - Bombs are dropped every 5 seconds by the game engine or by the players
 - The bonus are : 1 point if the player move to an unexplored position, 5 points every 5 seconds and 50% of the score of the players killed
 - The players are located in a battlefield. For futur versions, the battlefield could contains special items (traps, walls, ...)
 - On every turn for all plyers : move in game boundaries, detection collision with bombs, detection collision with players, handle player action, increment score


===============================================
Protocols :
===============================================

connection & subscription protocol
-----------------------------------

Client                                GameServer    PartyServer     HoFServer       DataPoolServer 
         - - connection - - - - - - - - >
         <--- init ----------------------

         -- dataPoolSubscribe --------------------------------------------------------> register the Subscription
         <--- dataPoolValue ----------------------------------------------------------- onChange()

         -- hofSubscribe ---------------------------------------------> register the Subscription
         <--- hallOfFame ---------------------------------------------- onChange()

         -- partiesInfoSubscribe ---------------------> register the Subscription
         <--- partiesInfo ----------------------------- onChange()

        - - disconnection - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -> remove the Subscription
        - - disconnection - - - - - - - - - - - - - - - - - - - - - - -> remove the Subscription
        - - disconnection - - - - - - - - - - - - - - -> remove the Subscription


Protocol client to DataPoolServer
----------------------------------

Client                                DataPoolServer 
         -- dataPoolSubscribe ---------------> register the Subscription
         <--- dataPoolValue ------------------ onChange() ---> persist

         -- setDataPoolValue ----------------> update either the dataSet (persistent) or the dataSetTmp


Protocol client to HallOfFameServer
----------------------------------

Client                                HallOfFameServer 
         -- hofSubscribe --------------------> register the Subscription
         <--- hallOfFame --------------------- onChange() ---> persist

         -- hofReset ------------------------> 
         -- hofAddComment -------------------> 


Protocol client to PartyServer
----------------------------------

Client                                PartyServer 
         -- partiesInfoSubscribe ------------> register the Subscription
         <--- partiesInfo -------------------- onChange() 

         -- newParty ------------------------> 
         <--- { partyId, playerId } ----------

         -- joinParty -----------------------> 
         <--- { playerId, partyName } --------

         -- leaveParty ----------------------> 

         <--- partyTimeOut ------------------- 
         <--- partyLocked -------------------- 

Note : the PartyController create a partyItem which has his own gameController instance for the game logic
       the player is created by the gameController (specific)

party state : 'open' <-> 'closed'


Protocol client to the GameServer (gameCellife)
----------------------------------

Client ( render )                        GameServer (gameCellife)
         -- ping ---------------------------->
         <--- pong ---------------------------
         <--- message ------------------------
         <--- gameStarted --------------------
         -- playerTurn ---------------------->
         -- playerDropBomb ------------------>
         <--- nextBoard ---------------------- onChange() 
         <--- bomb --------------------------- onChange() 
         <--- gameData ----------------------- onChange() 
         <--- gameOver -----------------------


game state :  
    'init' ->  'join' -> 'locked' -> 'run' -> 'gameOver' or 'highScore' 
                  ^   -> 'cancel'                             |
                  |         |                                 |
                  ----------|---------------------------------|

===============================================
Controllers
===============================================

menuController : 
---------------
- Build the menu corresponding to differents sections of the page and close or open them according to menu interaction or dynamically 
- Allow to hide/display the whole menu or a single menu item
- When a section is open or close, a dedicated script could be configured to initialise of reset it.


dataPoolController : 
---------------
- Synchronize object in a multiClients-server architecture (data concerned : nbPlayerBullets, nbBombs, gameDuration, gameTimeOut, welcomeText, chatMsg)
- Usage : in the 'admin' section 
- The dataPoolController structure : usage of 2 Observable Lists /in/out)

    // server->client
    dataPoolController.getObsIn("chatMsg").onChange((val) => {
        const data = JSON.parse(val);
        chatController.addChatItem(data);
    }
    
    // client->server
    chatMsgElt.onchange = (e) => {
        dataPoolController.getObsOut("chatMsg").setValue(JSON.stringify({ userName: '', createdAt: '', text: '' }));
    };


===============================================
Ressources & Links
===============================================

tutorials :

    http://buildnewgames.com/real-time-multiplayer/#some-notes-on-developing-real-time-games
    https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking
    https://florian-lepretre.herokuapp.com/teaching/web/tp12
    http://buildnewgames.com/real-time-multiplayer/#some-notes-on-developing-real-time-games


example of virus games :

    https://www.youtube.com/watch?v=Xq7daS2tD9E
    https://github.com/pranavbharadwaj007/corona-warrior


example of splash screens :

    https://css-tricks.com/snippets/css/star-wars-crawl-text        // star wars
    https://codepen.io/Karottes/pen/ndovMQ                          // star wars
    https://www.youtube.com/watch?v=52rKp7P3gIs                     // animated eyeballs
    https://codepen.io/Chrislion_me/pen/rVqwbO                      // storm lightning effect


example of title : 

    https://www.webdesignerdepot.com/2014/12/3-tricks-for-adding-texture-to-your-text-with-css-and-svg


doc :

    https://ably.com/topic/socketio
    https://axios-http.com/docs/example


css & html :

    https://css-tricks.com/snippets/css/complete-guide-grid/
    https://www.transparenttextures.com/
    https://unsplash.com
    https://www.iconpacks.net
    https://ionic.io/ionicons
    https://mateam.net/html-escape-characters
    https://yeun.github.io/open-color
    https://developer.mozilla.org/fr/docs/Web/CSS/CSS_Animations/Using_CSS_animations
    https://alvarotrigo.com/shadow-gradients/
    https://www.smashingmagazine.com/2020/02/magic-flip-cards-common-sizing-problem
    https://www.w3schools.com/howto/howto_css_flip_card.asp
    https://www.codewithrandom.com/2022/01/08/page-flip-animation-css-page-flip-using-html-css

