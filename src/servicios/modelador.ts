import {Atributo} from "../modelo/atributo";
import {Entidad} from "../modelo/entidad";
import {Relacion} from "../modelo/relacion";
import {IdAtributo, MER, SolicitudCrearRelacion} from "../../types";


export class Modelador implements MER {
    entidades: Entidad[] = [];
    relaciones: Relacion[] = [];
    private _maxID: number = 1;

    private _proximoID(): number {
        return this._maxID++;
    };

    agregarAtributo(nombre: string, idEntidad: string, esMultivaluado: boolean): Atributo {
        throw new Error("Sin implementar");
    }

    hacerAtributoCompuesto(nombre: string, idAtributo: string): Atributo {
        throw new Error("Sin implementar");
    }

    renombrarAtributo(nuevoNombre: string, [entidad, indiceAtributo]: IdAtributo): Atributo {
        entidad.renombrarAtributo(
            indiceAtributo,
            nuevoNombre
        );

        // FIXME: Ojo, devolver el atributo nuevo!
        return undefined as unknown as Atributo;
    }

    eliminarAtributo(idAtributo: string): void {
        throw new Error("Sin implementar");
    }

    conectarEntidades(nombre: string, solicitud: SolicitudCrearRelacion): Relacion {
        throw new Error("Sin implementar");
    }

    renombrarRelacion(nuevoNombre: string, idRelacion: string): Relacion {
        throw new Error("Sin implementar");
    }

    eliminarRelacion(idRelacion: string): void {
        throw new Error("Sin implementar");
    }

}