const { createServer } = require("http");
const { Server } = require("socket.io");

module.exports = (app) => {
    const httpServer = createServer(app);
    const io = new Server(httpServer, { /* options */ });

    io.on('connection', (socket) => {
        console.log(`New WebSocket(id=${socket.id}) connection (nb connected clients:${io.engine.clientsCount})`);

        socket.emit('message', {text: 'Welcome', createdAt : new Date().getTime()});    // emit ONLY to the connected socket

        socket.on('ping', ({time}, callback) => {
            // console.log(`WebSocket(id=${socket.id}) send ping(time=${time})`);
            const now = new Date().getTime();
            if(!time||time>now) return callback('Invalid request!');

            socket.emit('pong', {time});                              
            if(callback) callback();             
        })

        // -- disconnect --
        socket.on('disconnect', () => {
            console.log(`WebSocket(id=${socket.id}) disconnect (nb connected clients:${io.engine.clientsCount})`);
        })
    });

    io.engine.on('connection_error', (err) => {
        console.log(`WebSocket connection error`, err);
      });

    return httpServer;
}



