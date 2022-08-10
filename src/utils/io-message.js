/**
 * @module io-message
 * create standard response and message objects 
 */

/**
 * message type could be 'info', 'warning', 'error' and 'animation' (to run a specific animation on client side)
 */
const constants = Object.freeze({
  m_info: 1,
  m_warning: 2,
  m_error: 3,
  m_animation: 4,
});

/**
 * Create a callback object which will be return to the client as callback argument
 * 
 * Note : io-socket acknowledgments feature give possibility to add a callback as the last argument of the emit(), and this callback will be called once the other side acknowledges the event
 * 
 * @param {Object} data 
 * @param {String} [error] 
 * @returns {Object} { error, data }
 */
const createResponse = (data, error) => {
  if (error != undefined) return { error, data: {} };
  else return { error, data };
};

/**
 * Create a message object sent to the clients
 * @param {String} message 
 * @param {number} [type] 
 * @returns {Object} { message, type, createdAt }
 */
const createMessage = (message, type = constants.m_info) => {
  return { message, type, createdAt: new Date().getTime() };
};

module.exports = { createResponse, createMessage };
