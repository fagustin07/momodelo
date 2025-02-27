import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
    {
        test: {
            name: 'client-side',
            include: ['test/browser/*.test.ts'],
            browser: {
                enabled: true,
                api: {
                    host: '0.0.0.0',
                },
                name: 'chrome',
                provider: 'webdriverio',
                providerOptions: {
                    capabilities: {
                        browserName: 'chrome',
                        'goog:chromeOptions': {
                            args: ['--remote-debugging-port=9229'],
                        },
                    },
                },
            },
            globalSetup: "test/setup.webdriverio.ts"
    },
    },
    {
        test: {
            name: 'model-side',
            include: ['test/model/*.test.ts'],
        },
    },
]);