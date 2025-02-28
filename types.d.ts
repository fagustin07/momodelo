import {Atributo} from "./src/modelo/atributo.ts";
import {Entidad} from "./src/modelo/entidad.ts";

declare interface SolicitudCrearRelacion {
    idEntidadOrigen: string;
    idEntidadDestino: string;
    minimaOrigen: Minima; // OBJETO CARDINALIDAD.
    minimaDestingo: Minima;
    maximaOrigen: Maxima; // OBJETO CARDINALIDAD.
    maximaDestino: Maxima;
}

declare type IdAtributo = [Entidad, number];

// Retornar el metamodelo o la vista... lo veremos con desarrollo.
declare interface MER {
    entidades: Entidad[];
    relaciones: Relacion[];
    // cada objeto tiene su propia identidad.
    agregarAtributo: (nombreDeAtributoNuevo: string, idEntidadExistente: string, esMultivaluado: boolean) => Atributo;
    hacerAtributoCompuesto: (nombreDeAtributoNuevo: string, idAtributoExistente: string) => Atributo;
    renombrarAtributo: (nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad) => Atributo;
    eliminarAtributo: (idAtributoExistente: string) => void;

    conectarEntidades: (nombreDeRelacion:string, solicitud: SolicitudCrearRelacion) => Relacion;
    renombrarRelacion: (nuevoNombre: string, idRelacion: string) => Relacion;
    eliminarRelacion: (idRelacion: string) => void;
}