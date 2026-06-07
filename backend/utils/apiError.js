function sendServerError(res, error, fallbackMessage = "Server Error") {
  console.error("Server Error:", error);
  return res.status(500).json({
    message: fallbackMessage,
  });
}

module.exports = {
  sendServerError,
};
