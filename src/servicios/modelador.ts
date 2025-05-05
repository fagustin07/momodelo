import {Entidad} from "../modelo/entidad.ts";
import {Atributo} from "../modelo/atributo.ts";
import {VistaRelacion} from "../vista/vistaRelacion.ts";
import {Relacion} from "../modelo/relacion.ts";
import {VistaEntidad} from "../vista/vistaEntidad.ts";

export class Modelador {
    entidades: Entidad[];
    relaciones: Relacion[] = [];
    private _entidadSeleccionada: Entidad | null = null;
    private _relacionesVisuales: VistaRelacion[] = [];

    constructor(entidades: Entidad[] = [], relaciones: Relacion[] = []) {
        this.entidades = entidades;
        this.relaciones = relaciones;
    }

    // ENTIDADES
    seleccionarEntidad(entidad: Entidad) {
        if (this._entidadSeleccionada && this._entidadSeleccionada !== entidad) {
            this.crearRelacion(this._entidadSeleccionada, entidad);
            this._entidadSeleccionada = null;
        } else {
            this._entidadSeleccionada = entidad;
        }
    }

    renombrarEntidad(nuevoNombre: string, entidad: Entidad) {
        entidad.cambiarNombre(nuevoNombre);
    }

    eliminarEntidad(entidad: Entidad) {
        this._checkDeseleccionDe(entidad);
        this.entidades = this.entidades.filter(e => e !== entidad);
        this._eliminarRelacionesQueContienenA(entidad);
    }

// ATRIBUTOS

    agregarAtributo(_nombreDeAtributoNuevo: string, _entidadExistente: Entidad, _esMultivaluado: boolean): Atributo {
        throw new Error("Sin implementar");
    }

    renombrarAtributo(nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad) {
        entidad.renombrarAtributo(atributoExistente, nuevoNombre);
    }

    eliminarAtributo(atributo: Atributo, entidad: Entidad): void {
        entidad.eliminarAtributo(atributo);
    }

    // RELACIONES

    crearRelacion(entidadOrigen: Entidad, entidadDestino: Entidad, nombre: string = "RELACION") {
        const nuevaVista = new VistaRelacion(entidadOrigen, entidadDestino, nombre, this);
        nuevaVista.representarse();
        this._relacionesVisuales.push(nuevaVista);
    }

    eliminarRelacion(relacion: Relacion): void {
        this.relaciones = this.relaciones.filter(r => r !== relacion);
        const vistaRelacion = this._relacionesVisuales.find(vr => vr.representaA(relacion))!;
        this._relacionesVisuales = this._relacionesVisuales.filter(vr => vr !== vistaRelacion);
        vistaRelacion.borrarse();
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion) {
        relacion.cambiarNombre(nuevoNombre);
    }

    actualizarRelacionesVisuales() {
        this._relacionesVisuales.forEach(rel => {
            rel.reposicionarRelacion();
        });
    }

    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[], contenedor: HTMLElement) {
        Array.from(contenedor.querySelectorAll(".entidad")).forEach(e => e.remove());
        Array.from(document.querySelectorAll("svg line, svg polygon")).forEach(el => el.remove());
        Array.from(document.querySelectorAll("body > input[title='Nombre Relacion']")).forEach(el => el.remove());

        this.entidades = [];
        this.relaciones = [];
        this._relacionesVisuales = [];

        nuevasEntidades.forEach(entidad => {
            this.entidades.push(entidad);
            const vista = new VistaEntidad(entidad, this);
            vista.representarseEn(contenedor);
        });

        nuevasRelaciones.forEach(relacion => {
            const vista = new VistaRelacion(
                relacion.entidades()[0],
                relacion.entidades()[1],
                relacion.nombre(),
                this
            );
            vista.representarse();
            this._relacionesVisuales.push(vista);
        });
    }

    private _eliminarRelacionesQueContienenA(entidad: Entidad) {
        this.relaciones
            .filter(r => r.contieneA(entidad))
            .forEach(rel => this.eliminarRelacion(rel));
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
