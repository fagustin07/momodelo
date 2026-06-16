import {ResultadoConsulta} from "../resultadoConsulta.ts";
import {ModeloRelacionalMaterializado} from "../../mr/modeloRelacionalMaterializado.ts";
import {ErrorSemánticoAR} from "../../servicios/errores.ts";
import {CondiciónAR, ExpresiónAR} from "../modeloSintácticoAR.ts";
import {Valor} from "../../mr/modeloSintacticoMR.ts";

export abstract class OperadorDeCombinación extends ExpresiónAR {
    constructor(readonly izq: ExpresiónAR, readonly der: ExpresiónAR) {
        super();
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const izqRes = this.izq.interpretarseCon(modelo);
        const derRes = this.der.interpretarseCon(modelo);

        this._validarQueNoExistaAmbigüedad(izqRes, derRes);

        return this._combinar(izqRes, derRes);
    }

    protected _validarQueNoExistaAmbigüedad(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): void {
        izqRes.atributos.forEach(attr => {
            if (derRes.atributos.includes(attr)) {
                throw new ErrorSemánticoAR(
                    `Ambigüedad en ${this._nombre()}: el atributo '${attr}' existe en ambas relaciones.`,
                );
            }
        });
    }

    protected abstract _nombre(): string;

    protected abstract _combinar(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): ResultadoConsulta;
}

export class ProductoCartesiano extends OperadorDeCombinación {
    protected _nombre(): string {
        return "producto cartesiano";
    }

    protected _combinar(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): ResultadoConsulta {
        const tuplas = izqRes.tuplas.flatMap(tR =>
            derRes.tuplas.map(tS => ({ ...tR, ...tS })),
        );

        return new ResultadoConsulta("", [...izqRes.atributos, ...derRes.atributos], tuplas);
    }
}

export class JoinCondicional extends OperadorDeCombinación {
    constructor(izq: ExpresiónAR, readonly condición: CondiciónAR, der: ExpresiónAR) {
        super(izq, der);
    }

    protected _nombre(): string {
        return "join condicional";
    }

    protected _combinar(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): ResultadoConsulta {
        const combinadas = izqRes.tuplas.flatMap(tR =>
            derRes.tuplas.map(tS => ({ ...tR, ...tS })),
        );

        const tuplas = combinadas.filter(t => this.condición.evaluarCon(t));

        return new ResultadoConsulta("", [...izqRes.atributos, ...derRes.atributos], tuplas);
    }
}

export class JoinNatural extends OperadorDeCombinación {
    constructor(izq: ExpresiónAR, der: ExpresiónAR) {
        super(izq, der);
    }

    protected _nombre(): string {
        return "join natural";
    }

    protected _validarQueNoExistaAmbigüedad(_izqRes: ResultadoConsulta, _derRes: ResultadoConsulta): void {
    }

    protected _combinar(izqRes: ResultadoConsulta, derRes: ResultadoConsulta): ResultadoConsulta {
        const comunes = this._atributosComunes(izqRes.atributos, derRes.atributos);
        this._validarQueHayaAtributosEnComún(comunes);

        const noComunesDer = this._atributosNoComunes(derRes.atributos, comunes);

        return new ResultadoConsulta(
            "",
            [...izqRes.atributos, ...noComunesDer],
            this._combinarConCoincidencias(
                derRes.tuplas,
                this._indexarPorClaveComun(izqRes.tuplas, comunes),
                comunes,
                noComunesDer
            )
        );
    }

    private _atributosComunes(izq: ReadonlyArray<string>, der: ReadonlyArray<string>): string[] {
        return izq.filter(attr => der.includes(attr));
    }

    private _atributosNoComunes(todos: ReadonlyArray<string>, comunes: string[]): string[] {
        return todos.filter(attr => !comunes.includes(attr));
    }

    private _validarQueHayaAtributosEnComún(comunes: string[]): void {
        if (comunes.length === 0) {
            throw new ErrorSemánticoAR(
                `Falta ambigüedad en ${this._nombre()}: las relaciones no tienen atributos en común.`,
            );
        }
    }

    private _claveComun(tupla: Record<string, Valor>, comunes: string[]): string {
        return comunes.map(a => JSON.stringify(tupla[a])).join("|");
    }

    private _combinarConCoincidencias(
        tuplasDer: ReadonlyArray<Record<string, Valor>>,
        indiceIzq: Map<string, Record<string, Valor>[]>,
        comunes: string[],
        noComunesDer: string[],
    ): Record<string, Valor>[] {
        return tuplasDer.flatMap(tuplaDer => {
            const coincidencias = indiceIzq.get(this._claveComun(tuplaDer, comunes)) ?? [];
            return coincidencias.map(tuplaIzq => this._combinarTupla(tuplaIzq, tuplaDer, noComunesDer));
        });
    }

    private _indexarPorClaveComun(
        tuplas: ReadonlyArray<Record<string, Valor>>,
        comunes: string[],
    ): Map<string, Record<string, Valor>[]> {
        return tuplas.reduce((indice, tupla) => {
            const clave = this._claveComun(tupla, comunes);
            const grupo = indice.get(clave) ?? [];
            indice.set(clave, [...grupo, tupla]);
            return indice;
        }, new Map<string, Record<string, Valor>[]>());
    }

    private _combinarTupla(
        tuplaIzq: Record<string, Valor>,
        tuplaDer: Record<string, Valor>,
        noComunesDer: string[],
    ): Record<string, Valor> {
        const atributosNoComunesDer = Object.fromEntries(noComunesDer.map(a => [a, tuplaDer[a]]));
        return {...tuplaIzq, ...atributosNoComunesDer};
    }
}