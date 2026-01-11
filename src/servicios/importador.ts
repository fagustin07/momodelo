import {Entidad} from "../modelo/entidad.ts";
import {Atributo} from "../modelo/atributo.ts";
import {Relacion} from "../modelo/relacion.ts";
import {coordenada} from "../posicion.ts";
import type {JsonModelo} from "./exportador.ts";

export function importar(json: JsonModelo): { entidades: Entidad[]; relaciones: Relacion[] } {
    const atributosMap = new Map<number, Atributo>();
    const entidadesMap = new Map<number, Entidad>();
    const relaciones: Relacion[] = [];

    json.atributos.forEach(attr => {
        const atributo = new Atributo(attr.nombre, coordenada(attr.posicion.x, attr.posicion.y));
        atributosMap.set(attr.id, atributo);
    });

    json.entidades.forEach(entJson => {
        const atributos = entJson.atributos.map(id => {
            const a = atributosMap.get(id);
            if (!a) throw new Error(`Atributo con ID ${id} no encontrado`);
            return a;
        });

        const entidad = new Entidad(entJson.nombre, atributos, coordenada(entJson.posicion.x, entJson.posicion.y));
        entidadesMap.set(entJson.id, entidad);
    });

    json.relaciones.forEach(relJson => {
        const origen = entidadesMap.get(relJson.entidadOrigen);
        const destino = entidadesMap.get(relJson.entidadDestino);

        if (!origen || !destino) {
            throw new Error(`Entidad origen o destino no encontrada para la relación ${relJson.nombre.toUpperCase()}`);
        }

        const relacion = new Relacion(
            origen, destino, relJson.nombre,
            relJson.cardinalidadOrigen, relJson.cardinalidadDestino,
            coordenada(relJson.posicion.x, relJson.posicion.y));

        relaciones.push(relacion);
    });

    return {
        entidades: Array.from(entidadesMap.values()),
        relaciones
    };
}
