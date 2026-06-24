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

export class PuntoDeBordeNoImplementadoError extends MomodeloErrorImplementaciónPlanificada {
    constructor(figura: string) {
        super(`puntoDeBorde no implementado para ${figura}`);
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

export class EliminarRelacionIdentificadoraError extends MomodeloLogicaError {
    constructor() {
        super("No se puede eliminar una relación identificadora porque una entidad depende de ella.");
    }
}

export class ErrorSintácticoMR extends MomodeloError {
    constructor(
        public readonly fila: number,
        public readonly columna: number,
        public readonly esperado: string
    ) {
        super(`Se esperaba ${esperado} en la fila ${fila}, posición ${columna}`);
    }
}

export class ErroresValidación extends MomodeloError {
    constructor(public readonly errores: string[]) {
        super(errores.join('\n'));
    }
}

export class ErrorSintácticoAR extends MomodeloError {
    constructor(
        mensaje: string,
        public readonly desdePosicion: number,
        public readonly hastaPosicion: number
    ) {
        super(mensaje);
    }
}

export class ErrorPKDuplicada extends MomodeloLogicaError {
    constructor(nombreRelacion: string, valoresPK: (string | number | boolean)[]) {
        super(`Clave primaria duplicada en '${nombreRelacion}': (${valoresPK.join(', ')}).`);
    }
}

export class ErrorFKInvalida extends MomodeloLogicaError {
    constructor(
        nombreRelacion: string,
        nombresFK: string[],
        valoresFK: string[],
        nombreRelacionReferenciada: string
    ) {
        const fks = nombresFK.join(', ');
        const valores = valoresFK.join(', ');
        const mensaje = nombresFK.length > 1
            ? `Violación de integridad referencial en '${nombreRelacion}': la combinación de las claves foráneas '${fks}' con valores '${valores}' no existe como PK compuesta en '${nombreRelacionReferenciada}'.`
            : `Violación de integridad referencial en '${nombreRelacion}': el valor '${valores}' de la clave foránea '${fks}' no existe en '${nombreRelacionReferenciada}'.`;
        super(mensaje);
    }
}

export class ErrorSemánticoAR extends MomodeloLogicaError {
    constructor(mensaje: string) {
        super(mensaje);
    }
}