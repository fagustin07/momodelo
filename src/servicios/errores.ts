export abstract class MomodeloError extends Error {
    protected constructor(mensaje: string) {
        super(mensaje);
    }
}

export class MomodeloLogicaError extends MomodeloError {
    constructor(mensaje: string) {
        super(mensaje);
    }
}

export class MomodeloErrorImplementaciónPlanificada extends MomodeloError {
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

export class EntidadDébilConMúltiplesRelacionesIdentificadorasError extends MomodeloLogicaError {
    constructor() {
        super("Una entidad débil no puede tener más de una relación identificadora.");
    }
}

export class InvertirRelacionFuerteError extends MomodeloLogicaError {
    constructor() {
        super("No pueden invertirse relaciones fuertes.");
    }
}

export class CicloDeRelacionesDébilesError extends MomodeloLogicaError {
    constructor() {
        super("Ciclo de relaciones débiles no permitido.");
    }
}
