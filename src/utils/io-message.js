
const constants = Object.freeze({
  "m_info": 1,
  "m_warning": 2,
  "m_error": 3,
  "m_animation": 4,
});

// message callBack
const createResponse = (data, error) => {
  if(error!=undefined) return({ error, data:{}});
  else return({ error, data});
};

const createMessage = (message, type=constants.m_info) => {
return {message, type, createdAt : new Date().getTime()};
}; 

module.exports = { createResponse, createMessage}