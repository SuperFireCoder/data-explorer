// Transpile `ol` from ES Modules -> CommonJS
const withTM = require("next-transpile-modules")([
    "ol",
    "@ecocommons-australia/visualiser-client-geospatial",
]);
module.exports = withTM();

// map process.env.NEXT_PUBLIC_* to publicRuntimeConfig so it is available at runtime.
module.exports.publicRuntimeConfig = Object.fromEntries(
    Object.entries(process.env).filter(
        ([key]) => key.startsWith('NEXT_PUBLIC_')
        )
    );