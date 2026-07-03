import {ModeloRelacionalMaterializado, RelacionMaterializada} from "../mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "./resultadoConsulta.ts";
import {Valor} from "../mr/modeloSintacticoMR.ts";
import {proyectarTupla, TuplaAR} from "./tuplaAR.ts";
import {ErrorSemánticoAR} from "../servicios/errores.ts";

export abstract class ExpresiónAR {
    abstract interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta;
}

export class NombreDeRelación extends ExpresiónAR {
    constructor(readonly nombre: string) {
        super();
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const relación = modelo.obtenerRelacion(this.nombre);
        return new ResultadoConsulta(
            relación.nombre,
            relación.esquema.atributos.map(a => a.nombre),
            relación.tuplas.map(t => t.aRegistro()));
    }
}

export abstract class Operando {
    abstract resolverCon(tupla: TuplaAR): Valor;
    nombresDeAtributos(): string[] { return []; }
}

export class NombreAtributo extends Operando {
    constructor(readonly nombre: string) { super(); }
    resolverCon(tupla: TuplaAR): Valor { return tupla[this.nombre]; }
    nombresDeAtributos(): string[] { return [this.nombre]; }
}

export class Literal extends Operando {
    constructor(readonly valor: Valor) { super(); }
    resolverCon(_tupla: TuplaAR): Valor { return this.valor; }
}

export abstract class CondiciónAR {
    abstract evaluarCon(tupla: TuplaAR): boolean;
    abstract atributos(): string[];
}

export class ComparaciónPrimitiva extends CondiciónAR {
    constructor(
        readonly izq: Operando,
        readonly op: string,
        readonly der: Operando,
    ) { super(); }

    evaluarCon(tupla: TuplaAR): boolean {
        const a = this.izq.resolverCon(tupla);
        const b = this.der.resolverCon(tupla);
        switch (this.op) {
            case "=":  return a === b;
            case "!=": return a !== b;
            case "<":  return (a as number) < (b as number);
            case ">":  return (a as number) > (b as number);
            case "<=": return (a as number) <= (b as number);
            case ">=": return (a as number) >= (b as number);
            default:   return false;
        }
    }

    atributos(): string[] {
        return [...this.izq.nombresDeAtributos(), ...this.der.nombresDeAtributos()];
    }
}

export class CondiciónAtómica extends CondiciónAR {
    constructor(readonly operando: Operando) { super(); }
    evaluarCon(tupla: TuplaAR): boolean {
        const val = this.operando.resolverCon(tupla);
        if (typeof val === "boolean") {
            return val;
        }

        throw new ErrorSemánticoAR("La condición de selección debe evaluar a un valor de verdad.");
    }
    atributos(): string[] {
        return this.operando.nombresDeAtributos();
    }
}

export class Conjunción extends CondiciónAR {
    constructor(readonly izq: CondiciónAR, readonly der: CondiciónAR) { super(); }
    evaluarCon(tupla: TuplaAR): boolean {
        return this.izq.evaluarCon(tupla) && this.der.evaluarCon(tupla);
    }
    atributos(): string[] {
        return [...this.izq.atributos(), ...this.der.atributos()];
    }
}

export class Disyunción extends CondiciónAR {
    constructor(readonly izq: CondiciónAR, readonly der: CondiciónAR) { super(); }
    evaluarCon(tupla: TuplaAR): boolean {
        return this.izq.evaluarCon(tupla) || this.der.evaluarCon(tupla);
    }
    atributos(): string[] {
        return [...this.izq.atributos(), ...this.der.atributos()];
    }
}

export class ExpresiónSelección extends ExpresiónAR {
    constructor(readonly condición: CondiciónAR, readonly subexpr: ExpresiónAR) { super(); }
    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const resultado = this.subexpr.interpretarseCon(modelo);

        this.condición.atributos().forEach(attr => {
            if (!resultado.atributos.includes(attr)) {
                throw new ErrorSemánticoAR(
                    `El atributo '${attr}' no existe en la relación.`,
                );
            }
        });

        return resultado.filtrar(t => this.condición.evaluarCon(t));
    }
}
export class ExpresiónProyección extends ExpresiónAR {
    constructor(readonly atributos: string[], readonly subexpr: ExpresiónAR) { super(); }
    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const resultado = this.subexpr.interpretarseCon(modelo);

        this.atributos.forEach(attr => {
            if (!resultado.atributos.includes(attr)) {
                throw new ErrorSemánticoAR(
                    `El atributo '${attr}' no existe en la relación.`,
                );
            }
        });

        const tuplasProyectadas = resultado.tuplas.map(tupla => proyectarTupla(tupla, this.atributos));

        return new ResultadoConsulta("", [...this.atributos], tuplasProyectadas);
    }
}

export class ExpresiónRenombre extends ExpresiónAR {
    readonly pares: ReadonlyArray<{ nuevo: string; viejo: string }> | null;
    readonly nombres: ReadonlyArray<string> | null;

    constructor(
        pares: ReadonlyArray<{ nuevo: string; viejo: string }> | null,
        nombres: ReadonlyArray<string> | null,
        readonly subexpr: ExpresiónAR
    ) {
        super();
        this.pares = pares;
        this.nombres = nombres;
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const resultado = this.subexpr.interpretarseCon(modelo);
        const mapeo = this._construirMapeo(resultado);
        return resultado
            .asertarAtributosExistentes(mapeo.keys())
            .renombrarAtributos(mapeo);
    }

    private _construirMapeo(resultado: ResultadoConsulta): Map<string, string> {
        if (this.nombres !== null) {
            return this._mapeoPosicional(resultado);
        }
        return this._mapeoPorNombre(resultado);
    }

    private _mapeoPosicional(resultado: ResultadoConsulta): Map<string, string> {
        const nombres = this.nombres!;
        if (nombres.length !== resultado.atributos.length) {
            throw new ErrorSemánticoAR(
                `El renombre posicional requiere ${resultado.atributos.length} ` +
                `${resultado.atributos.length === 1 ? "atributo" : "atributos"} ` +
                `pero se ${nombres.length === 1 ? "proporcionó" : "proporcionaron"} ${nombres.length}.`
            );
        }
        return new Map(nombres.map((nombre, i) => [resultado.atributos[i], nombre]));
    }

    private _mapeoPorNombre(resultado: ResultadoConsulta): Map<string, string> {
        const mapeo = new Map(this.pares!.map(({ nuevo, viejo }) => [viejo, nuevo]));

        const colisión = this.pares!.find(({ nuevo }) =>
            resultado.atributos.includes(nuevo) && !mapeo.has(nuevo)
        );

        if (colisión !== undefined) {
            throw new ErrorSemánticoAR(
                `El nombre '${colisión.nuevo}' ya existe en la relación y no se renombra.`
            );
        }

        return mapeo;
    }
}

export class ExpresiónAsignación extends ExpresiónAR {
    constructor(
        readonly nombre: string,
        readonly subexpr: ExpresiónAR
    ) { super(); }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const resultado = this.subexpr.interpretarseCon(modelo);
        modelo.registrarRelacion(
            RelacionMaterializada.desdeResultadoConsulta(resultado, this.nombre)
        );
        return resultado;
    }
}

export class ExpresiónPrograma extends ExpresiónAR {
    constructor(
        readonly asignaciones: ReadonlyArray<ExpresiónAsignación>,
        readonly expresiónFinal: ExpresiónAR
    ) { super(); }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        this.asignaciones.forEach(a => a.interpretarseCon(modelo));
        return this.expresiónFinal.interpretarseCon(modelo);
    }
}