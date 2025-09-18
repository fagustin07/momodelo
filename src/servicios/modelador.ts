import {Entidad} from "../modelo/entidad.ts";
import {Atributo} from "../modelo/atributo.ts";
import {VistaRelacion} from "../vista/vistaRelacion.ts";
import {Relacion} from "../modelo/relacion.ts";
import {VistaEntidad} from "../vista/vistaEntidad.ts";
import {coordenada, Posicion} from "../posicion.ts";
import {AccionEnProceso} from "./accionEnProceso.ts";
import {VistaAtributo} from "../vista/vistaAtributo.ts";

export class Modelador {
    entidades: Entidad[] = [];
    relaciones: Relacion[] = [];
    private _entidadSeleccionada: Entidad | null = null;

    private _entidadesVisuales: Map<Entidad, VistaEntidad> = new Map();
    private _relacionesVisuales: Map<Relacion, VistaRelacion> = new Map();

    accionEnProceso: AccionEnProceso = AccionEnProceso.SinAcciones;
    private readonly _elementoRaiz: HTMLElement | null;
    private readonly _elementoSvg: SVGElement | null;

    constructor(entidades: Entidad[] = [], relaciones: Relacion[] = [], elementoRaiz: HTMLElement | null = null, elementoSvg: SVGElement | null = null) {
        this._elementoRaiz = elementoRaiz;
        this._elementoSvg = elementoSvg;

        entidades.forEach(entidad => this._registrarEntidad(entidad));
        relaciones.forEach(rel => this.crearRelacion(rel.entidadOrigen(), rel.entidadDestino(), rel.nombre(), rel.posicion()));
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
        this.entidades = this.entidades.filter(e => e !== entidad);
        this._entidadesVisuales.delete(entidad);
        this._eliminarRelacionesQueContienenA(entidad);
        this._finalizarAccion();
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
        this._finalizarAccion();
    }

    // RELACIONES
    crearRelacion(entidadOrigen: Entidad, entidadDestino: Entidad, nombre: string = "RELACION", pos: {x: number, y: number} = {x: 0, y: 0}) {
        const nuevaRelacion = new Relacion(nombre, entidadOrigen, entidadDestino, coordenada(pos.x, pos.y));
        this._registrarRelacion(nuevaRelacion);

        if (this._elementoSvg !== null && this._elementoRaiz !== null) {
            const nuevaVista = new VistaRelacion(
                this._vistaDeEntidad(entidadOrigen),
                this._vistaDeEntidad(entidadDestino),
                nuevaRelacion, this, this._elementoRaiz, this._elementoSvg
            );
            nuevaVista.representarse();
            this._relacionesVisuales.set(nuevaRelacion, nuevaVista);
        }
        this._finalizarAccion();
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }) {
        relacion.posicionarseEn(coordenada(centro.x, centro.y));
    }

    eliminarRelacion(relacion: Relacion): void {
        this.relaciones = this.relaciones.filter(r => r !== relacion);

        this._relacionesVisuales.get(relacion)!.borrarse();
        this._relacionesVisuales.delete(relacion);

        this._finalizarAccion();
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion) {
        relacion.cambiarNombre(nuevoNombre);
    }

    actualizarRelacionesVisuales() {
        this._relacionesVisuales.forEach(vista => {
            vista.reposicionarRelacion();
        });
    }

    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[], contenedor: HTMLElement) {
        Array.from(contenedor.querySelectorAll(".entidad")).forEach(e => e.remove());
        Array.from(document.querySelectorAll("svg line, svg polygon")).forEach(el => el.remove());
        Array.from(document.querySelectorAll("body > input[title='Nombre Relacion']")).forEach(el => el.remove());

        this.entidades = [];
        this.relaciones = [];

        this._entidadesVisuales = new Map();
        this._relacionesVisuales = new Map();

        nuevasEntidades.forEach(entidad => {
            this.entidades.push(entidad);
            const vista = new VistaEntidad(entidad, this);
            vista.representarseEn(contenedor);
            this._entidadesVisuales.set(entidad, vista);
        });

        nuevasRelaciones.forEach(relacion => {
            const vista = new VistaRelacion(
                this._vistaDeEntidad(relacion.entidades()[0]),
                this._vistaDeEntidad(relacion.entidades()[1]),
                relacion,
                this,
                this._elementoRaiz!,
                this._elementoSvg!
            );
            vista.representarse();

            this._relacionesVisuales.set(relacion, vista);
            this.relaciones.push(relacion);
        });
    }

    solicitudCrearEntidad() {
        this.accionEnProceso = AccionEnProceso.CrearEntidad;
    }

    solicitudDeBorrado() {
        this.accionEnProceso = AccionEnProceso.Borrado;
    }

    solicitudCrearRelacion() {
        this.accionEnProceso = AccionEnProceso.CrearRelacion;
    }

    generarEntidadUbicadaEn(posicion: Posicion) {
        if (this.accionEnProceso === AccionEnProceso.CrearEntidad) {
            return this._registrarEntidad(new Entidad("Entidad", [], posicion));
        } else {
            return null;
        }
    }

    emitirSeleccionDeRelacion(relacion: Relacion, callbackEliminar: () => void) {
        if (this.accionEnProceso === AccionEnProceso.Borrado) {
            this.eliminarRelacion(relacion);
            callbackEliminar();
        }
    }

    emitirCreacionDeAtributoEn(contenedor: HTMLElement, entidad: Entidad, nombreAtributo: string = "Atributo") {
        const entidadBuscada = this.entidades.find( (ent) => ent === entidad)!;
        const nuevoAtributo = entidadBuscada.agregarAtributo(nombreAtributo);

        const vistaAtributo = new VistaAtributo(nuevoAtributo, this, entidadBuscada);
        vistaAtributo.representarseEn(contenedor);
    }

    emitirSeleccionDeEntidad(entidad: Entidad, callback: () => void) {
        if (this.accionEnProceso === AccionEnProceso.Borrado) {
            this.eliminarEntidad(entidad);
            callback();
        }
        if (this.accionEnProceso === AccionEnProceso.CrearRelacion) {
            this._procesarSeleccionParaRelacionarA(entidad);
        }
    }

    emitirSeleccionDeAtributo(entidad: Entidad, atributo: Atributo, callbackEliminar: () => void) {
        if (this.accionEnProceso === AccionEnProceso.Borrado) {
            this.eliminarAtributo(atributo, entidad);
            callbackEliminar();
        }
    }

    puedoCrearUnaEntidad() {
        return this.accionEnProceso === AccionEnProceso.CrearEntidad;
    }

    private _registrarEntidad(nuevaEntidad: Entidad) {
        this.entidades.push(nuevaEntidad);
        this._finalizarAccion();
        if (this._elementoRaiz !== null) {
            const vistaEntidad = new VistaEntidad(nuevaEntidad, this);
            vistaEntidad.representarseEn(this._elementoRaiz);
            this._entidadesVisuales.set(nuevaEntidad, vistaEntidad);
        }
        return nuevaEntidad;
    }

    private _registrarRelacion(rel: Relacion) {
        this.relaciones.push(rel);
    }

    private _finalizarAccion() {
        this.accionEnProceso = AccionEnProceso.SinAcciones;
        this._entidadSeleccionada = null;
    }

    private _procesarSeleccionParaRelacionarA(entidad: Entidad) {
        if (!this._entidadSeleccionada) {
            this.seleccionarEntidad(entidad);
        } else {
            this.crearRelacion(this._entidadSeleccionada, entidad);
        }
    }

    private _eliminarRelacionesQueContienenA(entidad: Entidad) {
        this.relaciones
            .filter(r => r.contieneA(entidad))
            .forEach(rel => this.eliminarRelacion(rel));
    }

    private _vistaDeEntidad(entidadOrigen: Entidad) {
        const vista = this._entidadesVisuales.get(entidadOrigen);
        if (!vista)
            throw new Error("La entidad no existe");
        return vista;
    }
}
