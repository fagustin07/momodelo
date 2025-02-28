import {Atributo} from "../modelo/atributo";
import {Entidad} from "../modelo/entidad";
import {Relacion} from "../modelo/relacion";
import {MER, SolicitudCrearRelacion} from "../../types";


export class Modelador implements MER {
    entidades: Entidad[] = [];
    relaciones: Relacion[] = [];
    renombrarAtributo(nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad): Atributo {
        return entidad.renombrarAtributo(atributoExistente, nuevoNombre);
    }

    conectarEntidades(_nombre: string, _solicitud: SolicitudCrearRelacion): Relacion {
        throw new Error("Sin implementar");
    }

    agregarAtributo(_nombreDeAtributoNuevo: string, _entidadExistente: Entidad, _esMultivaluado: boolean): Atributo {
        throw new Error("Sin implementar");
    }

    agregarAtributoARelacion(_nombreAtributo: string, _relacionExistente: Relacion, _esMultivaluado: boolean): Relacion {
        throw new Error("Sin implementar");
    }

    eliminarAtributo(_atributo: Atributo, _entidad: Entidad): void {
    }

    eliminarRelacion(_relacion: Relacion): void {
    }

    hacerAtributoCompuesto(_nombreDeAtributoNuevo: string, _atributoExistente: Atributo): Atributo {
        throw new Error("Sin implementar");
    }

    renombrarRelacion(_nuevoNombre: string, _relacion: Relacion): Relacion {
        throw new Error("Sin implementar");
    }

}