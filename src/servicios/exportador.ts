import {Modelador} from "./modelador.ts";

type JsonEntidad = {
    id: number;
    nombre: string;
    posicion: { x: number; y: number };
    atributos: number[];
};

type JsonRelacion = {
    id: number;
    nombre: string;
    posicion: { x: number; y: number };
    entidadOrigen: number;
    entidadDestino: number;
};

type JsonAtributo = {
    id: number;
    nombre: string;
    posicion: { x: number; y: number };
};

export type JsonModelo = {
    entidades: JsonEntidad[];
    relaciones: JsonRelacion[];
    atributos: JsonAtributo[];
};

export class Exportador {
    exportar(modelador: Modelador): JsonModelo {
        const atributosJson: JsonAtributo[] = modelador.entidades.flatMap(entidad =>
            entidad.atributos().map(atributo => ({
                id: atributo.id(),
                nombre: atributo.nombre(),
                posicion: atributo.posicion()
            }))
        );

        const entidadesJson: JsonEntidad[] = modelador.entidades.map(entidad => ({
            id: entidad.id(),
            nombre: entidad.nombre(),
            posicion: entidad.posicion(),
            atributos: entidad.atributos().map(atributo => atributo.id())
        }));

        const relacionesJson: JsonRelacion[] = modelador.relaciones.map(relacion => ({
            id: relacion.id(),
            nombre: relacion.nombre(),
            posicion: relacion.posicion(),
            entidadOrigen: relacion.entidadOrigen().id(),
            entidadDestino: relacion.entidadDestino().id()
        }));

        return {
            entidades: entidadesJson,
            relaciones: relacionesJson,
            atributos: atributosJson
        };
    }
}
