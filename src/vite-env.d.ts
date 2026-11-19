/// <reference types="vite/client" />

declare module "virtual:events-index" {
  const events: import("./data/schema").EventIndex[];
  export default events;
}
