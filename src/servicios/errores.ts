export class RelacionRecursivaError extends Error {
    constructor() {
        super("La creación de relaciones recursivas aún no está disponible.");
    }
}
