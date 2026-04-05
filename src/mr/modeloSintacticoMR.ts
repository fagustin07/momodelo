export class ModeloRelacional {
    constructor(public readonly relaciones: RelacionMR[]) { }
}

export class RelacionMR {
    constructor(public readonly nombre: string, public readonly atributos: AtributoMR[]) {}

    clavesPrimarias(): AtributoPK[] {
        return this.atributos.filter(atr => atr.esClavePrimaria()) as AtributoPK[];
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