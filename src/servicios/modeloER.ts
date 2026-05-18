import {Entidad} from "../modelo/entidad";
import {Atributo} from "../modelo/atributo";
import {Relacion} from "../modelo/relacion";
import {coordenada, coordenadaInicial, Posicion} from "../posicion";
import {
    CicloDeRelacionesDébilesError,
    EliminarRelacionIdentificadoraError,
    EntidadDébilConMúltiplesRelacionesIdentificadorasError,
    InvertirRelacionFuerteError,
    MomodeloLogicaError,
    RelaciónExistenteError,
    RelaciónRecursivaError
} from "./errores";
import {Cardinalidad, TipoAtributo, TipoRelacion} from "../tipos/tipos.ts";

export class ModeloER {
    entidades: Entidad[] = [];
    relaciones: Relacion[] = [];

    constructor(entidades: Entidad[] = [], relaciones: Relacion[] = []) {
        entidades.forEach(ent => this._registrarEntidad(ent));
        relaciones.forEach(rel => {
            this._realizarValidacionesParaCrearRelaciónEntre(rel.entidadOrigen(), rel.entidadDestino());
            this.relaciones.push(rel);
        });
    }

    // ========= ENTIDADES =========

    generarEntidadUbicadaEn(posicion: Posicion): Entidad {
        const nueva = new Entidad("ENTIDAD", [], posicion);
        this.entidades.push(nueva);
        return nueva;
    }

    renombrarEntidad(nuevoNombre: string, entidad: Entidad) {
        entidad.cambiarNombre(nuevoNombre);
    }


    eliminarEntidad(entidad: Entidad) {
        const relacionesAfectadas = this._quitarDependenciaDeEntidadesAsociadasA(entidad);
        this._eliminarRelaciones(relacionesAfectadas);
        this._eliminarEntidad(entidad);
        return relacionesAfectadas;
    }

// ========= ATRIBUTOS =========

    renombrarAtributo(nuevoNombre: string, atributo: Atributo, entidad: Entidad) {
        entidad.renombrarAtributo(atributo, nuevoNombre);
    }

    eliminarAtributo(atributo: Atributo, entidad: Entidad) {
        entidad.eliminarAtributo(atributo);
    }

    cambiarTipoDeAtributo(entidad: Entidad, atributo: Atributo, tipo: TipoAtributo) {
        if (!entidad.posee(atributo)) {
            throw new MomodeloLogicaError("El atributo no pertenece a la entidad seleccionada.");
        }
        entidad.cambiarTipoDeAtributo(atributo, tipo);
    }

    // ========= RELACIONES =========

    crearRelacion(
        entidadOrigen: Entidad, entidadDestino: Entidad, nombre: string = "RELACION",
        cardinalidadOrigen: Cardinalidad = ['0', 'N'], cardinalidadDestino: Cardinalidad = ['0', 'N'],
        posicion: Posicion = coordenadaInicial()
    ) {

        this._realizarValidacionesParaCrearRelaciónEntre(entidadOrigen, entidadDestino);

        const nuevaRelacion = new Relacion(entidadOrigen, entidadDestino, nombre, cardinalidadOrigen, cardinalidadDestino, coordenada(posicion.x, posicion.y));

        this.relaciones.push(nuevaRelacion);
        return nuevaRelacion;
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }) {
        relacion.posicionarseEn(coordenada(centro.x, centro.y));
    }

    eliminarRelación(relacion: Relacion) {
        if (relacion.esDebil()) {
            throw new EliminarRelacionIdentificadoraError();
        }
        this.relaciones = this.relaciones.filter(rel => rel !== relacion);
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion) {
        relacion.cambiarNombre(nuevoNombre);
    }

    cambiarCardinalidadOrigenA(relacion: Relacion, nuevaCardinalidad: Cardinalidad) {
        relacion.cambiarCardinalidadOrigenA(nuevaCardinalidad);
    }

    cambiarCardinalidadDestinoA(relacion: Relacion, nuevaCardinalidad: Cardinalidad) {
        relacion.cambiarCardinalidadDestinoA(nuevaCardinalidad);
    }

    agregarAtributoPara(entidad: Entidad, nombreAtributo: string = "Atributo", posicion: Posicion) {
        return entidad.agregarAtributo(nombreAtributo, posicion);
    }

    cambiarTipoDeRelacionA(relacion: Relacion, nuevoTipo: TipoRelacion): Relacion {
        if (nuevoTipo === 'débil') {
            const entidadOrigen = relacion.entidadOrigen();
            const entidadDestino = relacion.entidadDestino();

            const origenPuedeSerDebil = !this._tieneRelacionIdentificatoria(entidadOrigen, relacion);

            if (!origenPuedeSerDebil) {
                return this._intentarInversiónDeRelación(relacion, entidadDestino, entidadOrigen);
            }

            this._validarYMarcarComoDebil(entidadOrigen, entidadDestino);
        } else {
            this._actualizarEstadoEntidadAlCambiarAFuerte(relacion);
        }

        relacion.cambiarTipoRelacionA(nuevoTipo);
        return relacion;
    }

    invertirRelacionDebil(relacion: Relacion) {
        if (!relacion.esDebil()) {
            throw new InvertirRelacionFuerteError();
        }

        const antiguaDebil = relacion.entidadOrigen();
        const antiguaFuerte = relacion.entidadDestino();

        if (this._tieneRelacionIdentificatoria(antiguaFuerte, relacion)) {
            throw new EntidadDébilConMúltiplesRelacionesIdentificadorasError();
        }

        const cardinalidadFuerte = relacion.cardinalidadDestino();
        const nuevaRelacion = new Relacion(
            antiguaFuerte,
            antiguaDebil,
            relacion.nombre(),
            ['1', '1'],
            cardinalidadFuerte,
            relacion.posicion(),
            'débil'
        );

        if (!this._tieneRelacionIdentificatoria(antiguaDebil, relacion)) {
            antiguaDebil.marcarComoFuerte();
        }

        antiguaFuerte.marcarComoDebil();

        const index = this.relaciones.indexOf(relacion);
        this.relaciones[index] = nuevaRelacion;

        return nuevaRelacion;
    }

    private _realizarValidacionesParaCrearRelaciónEntre(entidadOrigen: Entidad, entidadDestino: Entidad) {
        this._validarSiEsRelaciónRecursiva(entidadOrigen, entidadDestino);
        this._validarSiExisteRelaciónEntre(entidadOrigen, entidadDestino);
    }

    private _registrarEntidad(entidad: Entidad) {
        this.entidades.push(entidad);
    }

    private _relacionesAsociadasA(entidad: Entidad): Relacion[] {
        return this.relaciones.filter(r => r.contieneA(entidad));
    }

    private _eliminarRelaciones(relacionesAEliminar: Relacion[]): void {
        this.relaciones = this.relaciones.filter(r => !relacionesAEliminar.includes(r));
    }

    private _eliminarEntidad(entidad: Entidad): void {
        this.entidades = this.entidades.filter(e => e !== entidad);
    }

    private _existeRelaciónEntre(entidadOrigen: Entidad, entidadDestino: Entidad) {
        return this.relaciones.some(rel => rel.contieneA(entidadOrigen) && rel.contieneA(entidadDestino));
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

    private _tieneRelacionIdentificatoria(entidad: Entidad, relacionActual: Relacion): boolean {
        return this.relaciones.some(
            rel => rel.esDebil() && rel.entidadOrigen() === entidad && rel !== relacionActual
        );
    }

    private _intentarInversiónDeRelación(
        relacion: Relacion,
        nuevaEntidadDebil: Entidad,
        nuevaEntidadFuerte: Entidad
    ): Relacion {
        if (this._tieneRelacionIdentificatoria(nuevaEntidadDebil, relacion)) {
            throw new EntidadDébilConMúltiplesRelacionesIdentificadorasError();
        }

        if (this._seFormaCicloDeRelacionesDebiles(nuevaEntidadDebil, nuevaEntidadFuerte)) {
            throw new CicloDeRelacionesDébilesError();
        }

        const relacionInvertida = this._crearRelacionDébilInvertida(relacion, nuevaEntidadDebil, nuevaEntidadFuerte);
        this._reemplazarRelacion(relacion, relacionInvertida);
        nuevaEntidadDebil.marcarComoDebil();
        return relacionInvertida;
    }

    private _seFormaCicloDeRelacionesDebiles(
        entidadHija: Entidad,
        entidadPadreActual: Entidad,
        visitados: Set<Entidad> = new Set()
    ): boolean {
        if (entidadPadreActual === entidadHija) {
            return true;
        }

        if (visitados.has(entidadPadreActual)){
            return false;
        }

        visitados.add(entidadPadreActual);

        const relacionesDondePadreEsDebil = this.relaciones.filter(r =>
            r.esDebil() && r.entidadOrigen() === entidadPadreActual
        );

        return relacionesDondePadreEsDebil.some(rel =>
            this._seFormaCicloDeRelacionesDebiles(entidadHija, rel.entidadDestino(), visitados)
        );
    }

    private _crearRelacionDébilInvertida(
        relacionOriginal: Relacion,
        nuevaEntidadDebil: Entidad,
        nuevaEntidadFuerte: Entidad
    ): Relacion {
        const cardinalidadFuerte = relacionOriginal.cardinalidadOrigen();
        return new Relacion(
            nuevaEntidadDebil,
            nuevaEntidadFuerte,
            relacionOriginal.nombre(),
            ['1', '1'],
            cardinalidadFuerte,
            relacionOriginal.posicion(),
            'débil'
        );
    }

    private _validarYMarcarComoDebil(entidadDebil: Entidad, entidadFuerte: Entidad): void {
        if (this._seFormaCicloDeRelacionesDebiles(entidadDebil, entidadFuerte)) {
            throw new CicloDeRelacionesDébilesError();
        }

        entidadDebil.marcarComoDebil();
    }

    private _actualizarEstadoEntidadAlCambiarAFuerte(relacion: Relacion): void {
        const entidadOrigen = relacion.entidadOrigen();
        if (!this._tieneRelacionIdentificatoria(entidadOrigen, relacion)) {
            entidadOrigen.marcarComoFuerte();
        }
    }

    private _reemplazarRelacion(relacionVieja: Relacion, relacionNueva: Relacion): void {
        const index = this.relaciones.indexOf(relacionVieja);
        this.relaciones[index] = relacionNueva;
    }

    private _quitarDependenciaDeEntidadesAsociadasA(entidad: Entidad) {
        const relacionesAfectadas = this._relacionesAsociadasA(entidad);

        relacionesAfectadas
            .filter(r => r.esDebil())
            .forEach(r => this._actualizarEstadoEntidadAlCambiarAFuerte(r));
        return relacionesAfectadas;
    }
}
