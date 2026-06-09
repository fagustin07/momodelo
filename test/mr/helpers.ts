import {
    AtributoFK,
    AtributoMR,
    AtributoMultivaluado,
    AtributoPK,
    AtributoPKFK,
    AtributoSimple,
    Fila,
    ProgramaMR,
    RelacionMR,
} from "../../src/mr/modeloSintacticoMR";
import {DefiniciónRelación, InsertarEn, SentenciaMR} from "../../src/mr/sentenciaMR.ts";
import {ModeloER} from "../../src/servicios/modeloER.ts";
import {Entidad} from "../../src/modelo/entidad.ts";
import {coordenada} from "../../src/posicion.ts";

export function pk(nombre: string): AtributoPK {
    return new AtributoPK(nombre);
}

export function fk(nombre: string): AtributoFK {
    return new AtributoFK(nombre);
}

export function pkfk(nombre: string): AtributoPKFK {
    return new AtributoPKFK(nombre);
}

export function simple(nombre: string): AtributoSimple {
    return new AtributoSimple(nombre);
}

export function multivaluado(nombre: string): AtributoMultivaluado {
    return new AtributoMultivaluado(nombre);
}

export function relación(nombre: string, ...atributos: AtributoMR[]): RelacionMR {
    return new RelacionMR(nombre, atributos);
}

export function definición(r: RelacionMR): DefiniciónRelación {
    return new DefiniciónRelación(r);
}

export function inserción(nombre: string, ...filas: Fila[]): InsertarEn {
    return new InsertarEn(nombre, filas);
}

export function fila(...valores: (string | number | boolean)[]): Fila {
    return new Fila(valores);
}

export function programa(...sentencias: SentenciaMR[]): ProgramaMR {
    return new ProgramaMR(sentencias);
}

export function entidad(nombre: string, pks: string[] = [], simples: string[] = [], multivaluados: string[] = []): Entidad {
    const e = new Entidad(nombre);
    pks.forEach(p => {
        const a = e.agregarAtributo(p, coordenada(0, 0));
        e.cambiarTipoDeAtributo(a, 'pk');
    });
    simples.forEach(s => {
        const a = e.agregarAtributo(s, coordenada(0, 0));
        e.cambiarTipoDeAtributo(a, 'simple');
    });
    multivaluados.forEach(m => {
        const a = e.agregarAtributo(m, coordenada(0, 0));
        e.cambiarTipoDeAtributo(a, 'multivaluado');
    });
    return e;
}

export function mer(...entidades: Entidad[]): ModeloER {
    return new ModeloER(entidades);
}