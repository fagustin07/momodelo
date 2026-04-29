import {defineConfig} from "vitest/config";
import {webdriverio} from "@vitest/browser-webdriverio";

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8'
    },
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
            logLevel: 'warn',
            capabilities: {
              "goog:chromeOptions": {
                args: [
                  "--no-sandbox",
                  "--disable-dev-shm-usage",
                  "--disable-gpu",
                ],
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
        include: ["test/modelo/*.test.ts", "test/servicios/*.test.ts", "test/mr/*.test.ts"],
      },
    }],
  },
});
