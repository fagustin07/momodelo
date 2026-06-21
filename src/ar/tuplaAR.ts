import {Valor} from "../mr/modeloSintacticoMR.ts";

export type TuplaAR = Record<string, Valor>;

export function claveDeTupla(tupla: TuplaAR, esquema: readonly string[]): string {
    return JSON.stringify(esquema.map(a => tupla[a]));
}

export function proyectarTupla(tupla: TuplaAR, esquema: readonly string[]): TuplaAR {
    return Object.fromEntries(esquema.map(a => [a, tupla[a]]));
}

export function mismaTupla(a: TuplaAR, b: TuplaAR, atributos: readonly string[]): boolean {
    return atributos.every(attr => a[attr] === b[attr]);
}
