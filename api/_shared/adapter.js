function createHeaders(headers) {
  const normalized = new Map();
  for (const [key, value] of Object.entries(headers || {})) {
    normalized.set(String(key).toLowerCase(), Array.isArray(value) ? value[0] : value);
  }
  return {
    get(name) {
      return normalized.get(String(name).toLowerCase()) || null;
    },
  };
}

function createRequest(req, context) {
  return {
    headers: createHeaders(req.headers),
    params: req.params || context.bindingData || {},
    query: req.query || {},
    async json() {
      if (req.body === undefined || req.body === null || req.body === '') {
        return {};
      }
      if (typeof req.body === 'string') {
        return JSON.parse(req.body);
      }
      return req.body;
    },
  };
}

function sendResponse(context, response) {
  const res = {
    status: response?.status || 200,
    headers: { ...(response?.headers || {}) },
  };

  if (response && Object.prototype.hasOwnProperty.call(response, 'jsonBody')) {
    res.headers['Content-Type'] = 'application/json; charset=utf-8';
    res.body = JSON.stringify(response.jsonBody);
  } else if (response && Object.prototype.hasOwnProperty.call(response, 'body')) {
    res.body = response.body;
  } else {
    res.body = response;
  }

  context.res = res;
}

module.exports = { createRequest, sendResponse };
