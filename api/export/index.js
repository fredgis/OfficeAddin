const { exportPage } = require('../_shared/handlers.js');
const { createRequest, sendResponse } = require('../_shared/adapter.js');

module.exports = async function (context, req) {
  const response = await exportPage(createRequest(req, context), context);
  sendResponse(context, response);
};
