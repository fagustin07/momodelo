import {Valor} from "../mr/modeloSintacticoMR.ts";

export type TuplaAR = Record<string, Valor>;

export function mismoAtributo(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
}

export function valorDe(tupla: TuplaAR, nombre: string): Valor {
    const clave = Object.keys(tupla).find(key => mismoAtributo(key, nombre));
    return (clave === undefined ? undefined : tupla[clave]) as Valor;
}

export function valoresDeTuplaDesdeEsquema(tupla: TuplaAR, esquema: readonly string[]): string {
    return JSON.stringify(esquema.map(a => valorDe(tupla, a)));
}

export function proyectarTupla(tupla: TuplaAR, esquema: readonly string[]): TuplaAR {
    return Object.fromEntries(esquema.map(a => [a, valorDe(tupla, a)])) as TuplaAR;
}

export function mismaTupla(a: TuplaAR, b: TuplaAR, atributos: readonly string[]): boolean {
    return atributos.every(attr => valorDe(a, attr) === valorDe(b, attr));
}
