import {defineConfig} from "vitest/config";

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
          provider: "webdriverio",
          instances: [
            {
              browser: "chrome",
              capabilities: {
                "goog:chromeOptions": {
                  args: ["--remote-debugging-port=9229"],
                },
              },
            },
          ],
        },
      },
    }, {
      extends: true,
      test: {
        name: "model-side",
        include: ["test/model/*.test.ts"],
      },
    }],
  },
});
