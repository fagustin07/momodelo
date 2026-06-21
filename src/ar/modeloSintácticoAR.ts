import {ModeloRelacionalMaterializado} from "../mr/modeloRelacionalMaterializado.ts";
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

        return false;
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