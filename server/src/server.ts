import app from "./app";
import { ENVIRONMENT, connectToDatabase } from "./common/configs";

const port = ENVIRONMENT.APP.PORT || 3000;

// Connect once at startup so warm requests never pay a connect in the
// request path. The middleware guard in app.ts remains as a fallback for
// serverless cold starts and reconnects after a dropped connection.
connectToDatabase()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Local Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB at startup:", error);
    process.exit(1);
  });
