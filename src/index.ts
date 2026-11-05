import { envConfig } from "@config";
import app from "./app.ts";

app.listen(envConfig.PORT);
