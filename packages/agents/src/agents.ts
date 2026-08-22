import { compile } from "./compile.js";
import { detect } from "./detect.js";
import { validate } from "./validate.js";
import {
  getAdapter,
  listAdapters,
  registerAdapter,
  resetRegistry,
} from "./registry.js";

export const Agents = {
  detect,
  compile,
  validate,
  register: registerAdapter,
  list: listAdapters,
  get: getAdapter,
  reset: resetRegistry,
};
