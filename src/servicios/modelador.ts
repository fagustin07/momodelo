import {Entidad} from "../modelo/entidad";
import {Atributo} from "../modelo/atributo";
import {Relacion} from "../modelo/relacion";
import {coordenada, coordenadaInicial, Posicion} from "../posicion";
import type {VistaEditorMER} from "../vista/vistaEditorMER";
import {RelaciónExistenteError, RelaciónRecursivaError} from "./errores";

export class Modelador {
    entidades: Entidad[] = [];
    relaciones: Relacion[] = [];

    private _vista: VistaEditorMER | null = null;

    constructor(entidades: Entidad[] = [], relaciones: Relacion[] = []) {
        entidades.forEach(ent => this._registrarEntidad(ent));
        relaciones.forEach(rel =>
            this.crearRelacion(rel.entidadOrigen(), rel.entidadDestino(), rel.nombre(), rel.posicion())
        );
    }

    conectarVista(vistaEditorMER: VistaEditorMER) {
        this._vista = vistaEditorMER;
    }

    // ========= ENTIDADES =========

    generarEntidadUbicadaEn(posicion: Posicion): Entidad {
        const nueva = new Entidad("ENTIDAD", [], posicion);
        this.entidades.push(nueva);
        return nueva;
    }

    renombrarEntidad(nuevoNombre: string, entidad: Entidad) {
        entidad.cambiarNombre(nuevoNombre);
        this._vista?.entidadRenombrada(entidad);
    }


    eliminarEntidad(entidad: Entidad) {
        const relacionesAfectadas = this._relacionesAsociadasA(entidad);

        this._eliminarRelaciones(relacionesAfectadas);
        this._eliminarEntidadDelModelo(entidad);
        this._notificarEliminacionEntidad(entidad, relacionesAfectadas);
    }

    // ========= ATRIBUTOS =========

    renombrarAtributo(nuevoNombre: string, atributo: Atributo, entidad: Entidad) {
        entidad.renombrarAtributo(atributo, nuevoNombre);
    }

    eliminarAtributo(atributo: Atributo, entidad: Entidad) {
        entidad.eliminarAtributo(atributo);
        this._vista?.atributoEliminado(entidad, atributo);
    }

    // ========= RELACIONES =========

    crearRelacion(entidadOrigen: Entidad, entidadDestino: Entidad, nombre: string = "RELACION", posicion: Posicion = coordenadaInicial()) {
        this._realizarValidacionesParaCrearRelaciónEntre(entidadOrigen, entidadDestino);
        const nuevaRelacion = new Relacion(nombre, entidadOrigen, entidadDestino, coordenada(posicion.x, posicion.y));
        this.relaciones.push(nuevaRelacion);
        return nuevaRelacion;
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }) {
        relacion.posicionarseEn(coordenada(centro.x, centro.y));
        this._vista?.relacionReposicionada(relacion);
    }

    eliminarRelación(relacion: Relacion) {
        this.relaciones = this.relaciones.filter(rel => rel !== relacion);
        this._vista?.relacionEliminada(relacion);
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion) {
        relacion.cambiarNombre(nuevoNombre);
        this._vista?.relacionRenombrada(relacion);
    }

    agregarAtributoPara(entidad: Entidad, nombreAtributo: string = "Atributo", posicion: Posicion) {
        return entidad.agregarAtributo(nombreAtributo, posicion);
    }

    private _realizarValidacionesParaCrearRelaciónEntre(entidadOrigen: Entidad, entidadDestino: Entidad) {
        this._validarSiEsRelaciónRecursiva(entidadOrigen, entidadDestino);
        this._validarSiExisteRelaciónEntre(entidadOrigen, entidadDestino);
    }

    private _registrarEntidad(entidad: Entidad) {
        this.entidades.push(entidad);
        this._vista?.entidadCreada(entidad);
    }

    private _relacionesAsociadasA(entidad: Entidad): Relacion[] {
        return this.relaciones.filter(r => r.contieneA(entidad));
    }

    private _eliminarRelaciones(relacionesAEliminar: Relacion[]): void {
        this.relaciones = this.relaciones.filter(r => !relacionesAEliminar.includes(r));
        relacionesAEliminar.forEach(r => this._vista?.relacionEliminada(r));
    }

    private _eliminarEntidadDelModelo(entidad: Entidad): void {
        this.entidades = this.entidades.filter(e => e !== entidad);
    }

    private _existeRelaciónEntre(entidadOrigen: Entidad, entidadDestino: Entidad) {
        return this.relaciones.some(rel => rel.contieneA(entidadOrigen) && rel.contieneA(entidadDestino));
    }


    private _notificarEliminacionEntidad(entidad: Entidad, relacionesEliminadas: Relacion[]): void {
        this._vista?.entidadEliminada(entidad, relacionesEliminadas);
    }

    private _validarSiEsRelaciónRecursiva(entidadOrigen: Entidad, entidadDestino: Entidad) {
        if (entidadOrigen === entidadDestino) {
            throw new RelaciónRecursivaError();
        }
    }

    private _validarSiExisteRelaciónEntre(entidadOrigen: Entidad, entidadDestino: Entidad) {
        if (this._existeRelaciónEntre(entidadOrigen, entidadDestino)) {
            throw new RelaciónExistenteError();
        }
    }

}
