import {DefiniciónRelación, InsertarEn, SentenciaMR} from "./sentenciaMR.ts";

export type ValorMR = string | number | boolean;

export class FilaMR {
    constructor(public readonly valores: ValorMR[]) {}
}

export class ProgramaMR {
    constructor(private readonly _sentencias: SentenciaMR[]) {
    }

    get sentencias(): SentenciaMR[] {
        return this._sentencias;
    }

    relaciones(): RelacionMR[] {
        return this._sentencias
            .filter(s => s.esDefinición())
            .map(s => (s as DefiniciónRelación).relacion);
    }

    inserciones(): InsertarEn[] {
        return this._sentencias
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

export class ProgramaMRValidado {
    constructor(private readonly _programa: ProgramaMR) {}

    get sentencias() {
        return this._programa.sentencias;
    }
}