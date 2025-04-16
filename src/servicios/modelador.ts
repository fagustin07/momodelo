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

    renombrarEntidad(nuevoNombre: string, entidad: Entidad) {
        const nuevaEntidad = entidad.cambiarNombre(nuevoNombre);

        this.entidades[this.entidades.indexOf(entidad)] = nuevaEntidad;

        this._relacionesVisuales.forEach((vr => {
            this.relaciones[this.relaciones.indexOf(vr.relacion())] = vr.actualizarReferenciaA(entidad);
        }))

        return nuevaEntidad;
    }

    eliminarEntidad(entidad: Entidad) {
        this.entidades.splice(this.entidades.indexOf(entidad));
        this._checkDeseleccionDe(entidad);
        const relacionesAEliminar = this.relaciones.filter(relacion => relacion.contieneA(entidad));
        relacionesAEliminar.forEach((relacionAEliminar) => {
            this.relaciones.splice(this.relaciones.indexOf(relacionAEliminar));
            const vistaRelacion = this._relacionesVisuales.find(vr => vr.representaA(relacionAEliminar))!;
            vistaRelacion.borrarse();
            this._relacionesVisuales.splice(this._relacionesVisuales.indexOf(vistaRelacion), 1);
        });
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

    eliminarRelacion(relacion: Relacion): void {
        this.relaciones.splice(this.relaciones.indexOf(relacion));
        const vistaRelacion = this._relacionesVisuales.find(vr => vr.representaA(relacion))
        this._relacionesVisuales.splice(this._relacionesVisuales.indexOf(vistaRelacion!));
    }

    hacerAtributoCompuesto(_nombreDeAtributoNuevo: string, _atributoExistente: Atributo): Atributo {
        throw new Error("Sin implementar");
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion): Relacion {
        const nuevaRelacion = relacion.cambiarNombre(nuevoNombre);

        this.relaciones[this.relaciones.indexOf(relacion)] = nuevaRelacion;

        return nuevaRelacion;
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
