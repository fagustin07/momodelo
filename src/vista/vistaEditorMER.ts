import { Entidad } from "../modelo/entidad";
import { Atributo } from "../modelo/atributo";
import { Relacion } from "../modelo/relacion";
import { Posicion } from "../posicion";
import {Modelador} from "../servicios/modelador.ts";
import {VistaEntidad} from "./vistaEntidad.ts";

// ToDo: ELEMENTOS RAIZ y SVG REQUIRED
export class VistaEditorMER {
    readonly modelador: Modelador;

    constructor(modelador: Modelador) {
        this.modelador = modelador;
    }

    // ENTIDADES
    seleccionarEntidad(entidad: Entidad): void {
        this.modelador.seleccionarEntidad(entidad);
    }

    renombrarEntidad(nuevoNombre: string, entidad: Entidad): void {
        this.modelador.renombrarEntidad(nuevoNombre, entidad);
    }

    eliminarEntidad(entidad: Entidad): void {
        this.modelador.eliminarEntidad(entidad);
    }

    // ATRIBUTOS
    agregarAtributo(nombreDeAtributoNuevo: string, entidadExistente: Entidad, esMultivaluado: boolean): Atributo {
        return this.modelador.agregarAtributo(nombreDeAtributoNuevo, entidadExistente, esMultivaluado);
    }

    renombrarAtributo(nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad): void {
        this.modelador.renombrarAtributo(nuevoNombre, atributoExistente, entidad);
    }

    eliminarAtributo(atributo: Atributo, entidad: Entidad): void {
        this.modelador.eliminarAtributo(atributo, entidad);
    }

    // RELACIONES
    crearRelacion(entidadOrigen: Entidad, entidadDestino: Entidad, nombre: string = "RELACION", pos: { x: number, y: number } = { x: 0, y: 0 }): void {
        this.modelador.crearRelacion(entidadOrigen, entidadDestino, nombre, pos);
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }): void {
        this.modelador.posicionarRelacionEn(relacion, centro);
    }

    eliminarRelacion(relacion: Relacion): void {
        this.modelador.eliminarRelacion(relacion);
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion): void {
        this.modelador.renombrarRelacion(nuevoNombre, relacion);
    }

    actualizarRelacionesVisuales(): void {
        this.modelador.actualizarRelacionesVisuales();
    }

    // IMPORT
    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[], contenedor: HTMLElement): void {
        this.modelador.reemplazarModelo(nuevasEntidades, nuevasRelaciones, contenedor);
    }

    // SOLICITUDES DE ACCIONES
    solicitudCrearEntidad(posicion: Posicion): void {
        const nuevaEntidad = this.modelador.generarEntidadUbicadaEn(posicion);
        const vistaEntidad = new VistaEntidad(nuevaEntidad, this.modelador);
        vistaEntidad.representarseEn(this.modelador.elementoRaiz()!);
    }

    solicitudDeBorrado(): void {
        this.modelador.solicitudDeBorrado();
    }

    solicitudCrearRelacion(): void {
        this.modelador.solicitudCrearRelacion();
    }

    // EVENTOS
    generarEntidadUbicadaEn(posicion: Posicion): Entidad {
        return this.modelador.generarEntidadUbicadaEn(posicion);
    }

    emitirSeleccionDeRelacion(relacion: Relacion, callbackEliminar: () => void): void {
        this.modelador.emitirSeleccionDeRelacion(relacion, callbackEliminar);
    }

    emitirCreacionDeAtributoEn(contenedor: HTMLElement, entidad: Entidad, nombreAtributo: string = "Atributo"): void {
        this.modelador.emitirCreacionDeAtributoEn(contenedor, entidad, nombreAtributo);
    }

    emitirSeleccionDeEntidad(entidad: Entidad, callback: () => void): void {
        this.modelador.emitirSeleccionDeEntidad(entidad, callback);
    }

    emitirSeleccionDeAtributo(entidad: Entidad, atributo: Atributo, callbackEliminar: () => void): void {
        this.modelador.emitirSeleccionDeAtributo(entidad, atributo, callbackEliminar);
    }

    // CONSULTAS DE ESTADO
    puedoCrearUnaEntidad(): boolean {
        return this.modelador.puedoCrearUnaEntidad();
    }
}