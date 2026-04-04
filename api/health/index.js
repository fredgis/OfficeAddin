const { health } = require('../_shared/handlers.js');
const { createRequest, sendResponse } = require('../_shared/adapter.js');

module.exports = async function (context, req) {
  const response = await health(createRequest(req, context), context);
  sendResponse(context, response);
};
