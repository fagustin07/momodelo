export abstract class MomodeloErrorImplementaciónPlanificada extends Error {
    constructor(mensaje: string) {
        super(mensaje);
    }
}

export class RelaciónRecursivaError extends MomodeloErrorImplementaciónPlanificada {
    constructor() {
        super("La creación de relaciones recursivas aún no está disponible.");
    }
}

export class RelaciónExistenteError extends MomodeloErrorImplementaciónPlanificada {
    constructor() {
        super("La creación de más de una relación entre dos entidades aún no está disponible.");
    }
}
