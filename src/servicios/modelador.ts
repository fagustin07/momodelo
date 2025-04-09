import {Entidad} from "../modelo/entidad.ts";
import {Atributo} from "../modelo/atributo.ts";
import {SolicitudCrearRelacion} from "../../types";
import {VistaRelacion} from "../vista/vistaRelacion.ts";
import {Relacion} from "../modelo/relacion.ts";

export class Modelador {
    entidades: Entidad[];
    relaciones: Relacion[] = [];
    private _entidadSeleccionada: Entidad | null = null;
    private _relacionesVisuales: VistaRelacion[] = [];

    constructor(entidades: Entidad[]) {
        this.entidades = entidades;
    }

    seleccionarEntidad(entidad: Entidad) {
        if (this._entidadSeleccionada && this._entidadSeleccionada !== entidad) {
            this.crearRelacion(this._entidadSeleccionada, entidad);
            this._entidadSeleccionada = null;
        } else {
            this._entidadSeleccionada = entidad;
        }
    }

    eliminarEntidad(entidad: Entidad) {
        this.entidades.splice(this.entidades.indexOf(entidad));
        // TODO ¿Cómo manejamos el caso borde de "Borro una entidad con alguna relación/atributo"?
        //  Tal vez, al detectar que se quiere borrar una entidad con relaciones/atributos, advertir al usuario paso previo
        this._checkDeseleccionDe(entidad);
    }

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

    eliminarAtributo(atributo: Atributo, entidad: Entidad): void {
        entidad.eliminarAtributo(atributo);
    }

    eliminarRelacion(_relacion: Relacion): void {
        throw new Error("Sin implementar");
    }

    hacerAtributoCompuesto(_nombreDeAtributoNuevo: string, _atributoExistente: Atributo): Atributo {
        throw new Error("Sin implementar");
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion): Relacion {
        return relacion.cambiarNombre(nuevoNombre)
    }

    crearRelacion(entidadOrigen: Entidad, entidadDestino: Entidad) {
        const nuevaVista = new VistaRelacion(entidadOrigen, entidadDestino, this);
        nuevaVista.representarse();
        this._relacionesVisuales.push(nuevaVista);
    }

    actualizarRelacionesVisuales() {
        this._relacionesVisuales.forEach(rel => {
            rel.reposicionarRelacion();
        });
    }

    private deseleccionarEntidad() {
        this._entidadSeleccionada = null;
    }

    private _checkDeseleccionDe(entidad: Entidad) {
        if (this._entidadSeleccionada === entidad) { // TODO: TEST
            this.deseleccionarEntidad();
        }
    }

}
