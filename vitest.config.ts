import {defineConfig} from "vitest/config";
import {webdriverio} from "@vitest/browser-webdriverio";

export default defineConfig({
  test: {
    watch: true,
    projects: [{
      extends: true,
      test: {
        name: "client-side",
        include: ["test/browser/*.test.ts"],
        browser: {
          enabled: true,
          api: {host: "0.0.0.0"},
          provider: webdriverio({
            logLevel: 'info',
            capabilities: {
              "goog:chromeOptions": {
                args: ["--remote-debugging-port=9229"],
              },
            },
          }),
          instances: [{ browser: "chrome" }],
        },
      },
    }, {
      extends: true,
      test: {
        name: "model-side",
        include: ["test/modelo/*.test.ts", "test/servicios/*.test.ts"],
      },
    }],
  },
});
