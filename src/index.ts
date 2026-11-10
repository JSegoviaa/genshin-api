import { createApp } from "./app";
import type { Dataset } from "./core/store";
import data from "./generated/data.json";

export default createApp(data as unknown as Dataset);
