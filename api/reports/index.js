const { reports } = require('../_shared/handlers.js');
const { createRequest, sendResponse } = require('../_shared/adapter.js');

module.exports = async function (context, req) {
  const response = await reports(createRequest(req, context), context);
  sendResponse(context, response);
};
