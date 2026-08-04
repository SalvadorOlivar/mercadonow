const { isAbsolute } = require("node:path");

module.exports = (options) => ({
  ...options,
  externals: [({ request }, callback) => {
    if (
      request === undefined ||
      request === "@mercadonow/shared" ||
      request.startsWith(".") ||
      isAbsolute(request)
    ) {
      callback();
      return;
    }

    callback(null, `commonjs ${request}`);
  }],
});
