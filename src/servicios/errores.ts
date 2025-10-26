export class RelacionRecursivaError extends Error {
    constructor() {
        super("No se puede crear una relación recursiva");
    }
}
