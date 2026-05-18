import {ModeloER} from "./modeloER.ts";
import {Cardinalidad, TipoAtributo, TipoRelacion} from "../tipos/tipos.ts";

type JsonEntidad = {
    id: number;
    nombre: string;
    posicion: { x: number; y: number };
    atributos: number[];
    esDebil: boolean;
};

type JsonRelacion = {
    id: number;
    nombre: string;
    posicion: { x: number; y: number };
    entidadOrigen: number;
    entidadDestino: number;
    cardinalidadOrigen: Cardinalidad;
    cardinalidadDestino: Cardinalidad;
    tipo: TipoRelacion;
};

type JsonAtributo = {
    id: number;
    nombre: string;
    posicion: { x: number; y: number };
    tipo: TipoAtributo;
};

export type JsonModelo = {
    entidades: JsonEntidad[];
    relaciones: JsonRelacion[];
    atributos: JsonAtributo[];
};

export function exportar(modeloER: ModeloER): JsonModelo {
    const atributosJson: JsonAtributo[] = modeloER.entidades.flatMap(entidad =>
        entidad.atributos().map(atributo => ({
            id: atributo.id(),
            nombre: atributo.nombre(),
            posicion: atributo.posicion(),
            tipo: atributo.tipo()
        }))
    );

    const entidadesJson: JsonEntidad[] = modeloER.entidades.map(entidad => ({
            id: entidad.id(),
            nombre: entidad.nombre(),
            posicion: entidad.posicion(),
            atributos: entidad.atributos().map(atributo => atributo.id()),
            esDebil: entidad.esDebil()
        }));

    const relacionesJson: JsonRelacion[] = modeloER.relaciones.map(relacion => ({
            id: relacion.id(),
            nombre: relacion.nombre(),
            posicion: relacion.posicion(),
            entidadOrigen: relacion.entidadOrigen().id(),
            entidadDestino: relacion.entidadDestino().id(),
            cardinalidadOrigen: relacion.cardinalidadOrigen(),
            cardinalidadDestino: relacion.cardinalidadDestino(),
            tipo: relacion.tipoRelacion()
        }));

    return {
        entidades: entidadesJson,
        relaciones: relacionesJson,
        atributos: atributosJson
    };
}
