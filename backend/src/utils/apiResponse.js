function success(res, data = {}, statusCode = 200, messageText = "Success") {
  return res.status(statusCode).json({
    success: true,
    message: messageText,
    data
  });
}

function failure(res, messageText = "Error", statusCode = 400, error = {}) {
  return res.status(statusCode).json({
    success: false,
    message: messageText,
    error
  });
}

function message(res, messageText = "Done", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message: messageText
  });
}

module.exports = {
  success,
  failure,
  message
};

