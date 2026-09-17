"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const configs_1 = require("./common/configs");
const port = configs_1.ENVIRONMENT.APP.PORT || 3000;
// Connect once at startup so warm requests never pay a connect in the
// request path. The middleware guard in app.ts remains as a fallback for
// serverless cold starts and reconnects after a dropped connection.
(0, configs_1.connectToDatabase)()
    .then(() => {
    app_1.default.listen(port, "0.0.0.0", () => {
        console.log(`Local Server running at http://localhost:${port}`);
    });
})
    .catch((error) => {
    console.error("Failed to connect to MongoDB at startup:", error);
    process.exit(1);
});
