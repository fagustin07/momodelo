import {DefiniciónRelación, InsertarEn, SentenciaMR} from "./sentenciaMR.ts";

export type Valor = string | number | boolean;

export class Fila {
    constructor(public readonly valores: Valor[]) {}
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

    clavesPrimarias(): (AtributoPK | AtributoPKFK)[] {
        return this.atributos.filter(atr => atr.esClavePrimaria());
    }

    clavesForáneas(): AtributoMR[] {
        return this.atributos.filter(atr => atr.esForánea());
    }

    atributosSimples(): AtributoSimple[] {
        return this.atributos.filter(atr => !atr.esClavePrimaria() && !atr.esForánea() && !atr.esMultivaluado()) as AtributoSimple[];
    }

    atributosMultivaluados(): AtributoMultivaluado[] {
        return this.atributos.filter(atr => atr.esMultivaluado()) as AtributoMultivaluado[];
    }

    tieneAtributosMultivaluados(): boolean {
        return this.atributos.some(atr => atr.esMultivaluado());
    }

    atributosDuplicados(): string[] {
        return this.atributos
            .filter((atr, índiceActual) =>
                this.atributos.slice(0, índiceActual)
                    .some(prev => prev.nombre.toLowerCase() === atr.nombre.toLowerCase())
            )
            .map(atr => atr.nombre);
    }
}

export abstract class AtributoMR {
    constructor(public readonly nombre: string) {}

    esClavePrimaria(): boolean {
        return false;
    }

    esForánea(): boolean {
        return false;
    }

    esMultivaluado(): boolean {
        return false;
    }
}

export class AtributoSimple extends AtributoMR { }

export class AtributoPK extends AtributoMR {
    esClavePrimaria(): boolean {
        return true;
    }
}

export class AtributoFK extends AtributoMR {
    esForánea(): boolean {
        return true;
    }
}

export class AtributoPKFK extends AtributoMR {
    esClavePrimaria(): boolean {
        return true;
    }

    esForánea(): boolean {
        return true;
    }
}

export class AtributoMultivaluado extends AtributoMR {
    esMultivaluado(): boolean {
        return true;
    }
}

export class ProgramaMRValidado {
    constructor(private readonly _programa: ProgramaMR) {}

    get sentencias() {
        return this._programa.sentencias;
    }
}
