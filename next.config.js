// Transpile `ol` from ES Modules -> CommonJS
const withTM = require("next-transpile-modules")([
    "ol",
    "@ecocommons-australia/visualiser",
]);
module.exports = withTM();
