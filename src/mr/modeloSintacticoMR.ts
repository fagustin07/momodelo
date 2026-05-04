export type ValorMR = string | number | boolean;

export class FilaMR {
    constructor(public readonly valores: ValorMR[]) {}
}

export abstract class SentenciaMR {
    esDefinición(): boolean {
        return false;
    }

    esInserción(): boolean {
        return false;
    }
}

export class DefiniciónRelación extends SentenciaMR {
    constructor(public readonly relacion: RelacionMR) {
        super();
    }

    esDefinición(): boolean {
        return true;
    }
}

export class InsertarEn extends SentenciaMR {
    constructor(
        public readonly nombreRelacion: string,
        public readonly filas: FilaMR[]
    ) {
        super();
    }

    esInserción(): boolean {
        return true;
    }
}

export class ProgramaMR {
    constructor(public readonly sentencias: SentenciaMR[]) {
    }

    relaciones(): RelacionMR[] {
        return this.sentencias
            .filter(s => s.esDefinición())
            .map(s => (s as DefiniciónRelación).relacion);
    }

    inserciones(): InsertarEn[] {
        return this.sentencias
            .filter(s => s.esInserción()) as InsertarEn[];
    }
}

export class RelacionMR {
    constructor(public readonly nombre: string, public readonly atributos: AtributoMR[]) {}

    clavesPrimarias(): AtributoPK[] {
        return this.atributos.filter(atr => atr.esClavePrimaria()) as AtributoPK[];
    }

    atributosSimples(): AtributoSimple[] {
        return this.atributos.filter(atr => !atr.esClavePrimaria()) as AtributoSimple[];
    }
}

export abstract class AtributoMR {
    constructor(public readonly nombre: string) {}

    esClavePrimaria(): boolean {
        return false;
    }
}

export class AtributoSimple extends AtributoMR { }

export class AtributoPK extends AtributoMR {
    esClavePrimaria(): boolean {
        return true;
    }
}