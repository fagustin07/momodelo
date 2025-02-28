import {Atributo} from "./src/modelo/atributo.ts";
import {Entidad} from "./src/modelo/entidad.ts";
import {Relacion} from "./src/modelo/relacion.ts";

declare interface SolicitudCrearRelacion {
    idEntidadOrigen: string;
    idEntidadDestino: string;
    minimaOrigen: Minima; // OBJETO CARDINALIDAD.
    minimaDestingo: Minima;
    maximaOrigen: Maxima; // OBJETO CARDINALIDAD.
    maximaDestino: Maxima;
}
declare interface MER {
    entidades: Entidad[];
    relaciones: Relacion[];
    agregarAtributo: (nombreDeAtributoNuevo: string, entidadExistente: Entidad, esMultivaluado: boolean) => Atributo;
    hacerAtributoCompuesto: (nombreDeAtributoNuevo: string, _atributoExistente: Atributo) => Atributo;
    renombrarAtributo: (nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad) => Atributo;
    eliminarAtributo: (atributo: Atributo, entidad: Entidad) => void;

    conectarEntidades: (nombreDeRelacion:string, solicitud: SolicitudCrearRelacion) => Relacion;
    renombrarRelacion: (nuevoNombre: string, relacion: Relacion) => Relacion;
    agregarAtributoARelacion: (nombreAtributo: string, relacionExistente: Relacion, esMultivaluado: boolean) => Relacion;
    eliminarRelacion: (relacion: Relacion) => void;
}