class GeneradorDeIDs {
    private _counter = 1;

    private constructor() {}

    private static _instance: GeneradorDeIDs;

    static get(): GeneradorDeIDs {
        if (!this._instance) {
            this._instance = new GeneradorDeIDs();
        }
        return this._instance;
    }

    tomarID(): number {
        return this._counter++;
    }
}

export const generadorDeIDs = GeneradorDeIDs.get();
