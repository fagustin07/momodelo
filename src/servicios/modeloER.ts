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
import {
    CambioDeRelacionIdentificadora,
    Cardinalidad,
    NombreCompletable,
    TipoAtributo,
    TipoRelacion
} from "../tipos/tipos.ts";

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

    relacionesAsociadasA(entidad: Entidad): Relacion[] {
        return this.relaciones.filter(relacion => relacion.contieneA(entidad));
    }

    relacionDebilDe(entidad: Entidad): Relacion | null {
        return this.relaciones.find(relacion =>
            relacion.esDebil() && relacion.entidadOrigen() === entidad
        ) ?? null;
    }

    configurarDependenciaDe(
        entidad: Entidad,
        relacionDebil: Relacion | null
    ): CambioDeRelacionIdentificadora {
        const relacionAnterior = this.relacionDebilDe(entidad);

        if (relacionDebil === null) {
            this._convertirEnFuerte(entidad, relacionAnterior);
            return this._resultadoDependencia(relacionAnterior, null, null);
        }

        this._validarRelacionDebil(entidad, relacionDebil);
        if (relacionAnterior === relacionDebil) {
            return this._resultadoDependencia(
                relacionAnterior,
                relacionDebil,
                relacionDebil
            );
        }

        const entidadFuerte = this._otraEntidadDe(relacionDebil, entidad);
        this._validarNuevaDependencia(entidad, entidadFuerte, relacionAnterior, relacionDebil);

        relacionAnterior?.cambiarTipoRelacionA('fuerte');
        const antiguaEntidadDebil = this._entidadDebilDe(relacionDebil);
        const relacionFinal = this._convertirEnRelacionDebilPara(
            relacionDebil,
            entidad,
            entidadFuerte
        );

        this._actualizarAntiguaEntidadDebil(antiguaEntidadDebil, entidad, relacionDebil);
        entidad.marcarComoDebil();

        return this._resultadoDependencia(
            relacionAnterior,
            relacionDebil,
            relacionFinal
        );
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

    nombresConocidosDelModelo(): NombreCompletable[] {
        return [
            ...this.entidades.map(e => ({label: e.nombre(), type: "namespace"})),
            ...this.relaciones.map(r => ({label: r.nombre(), type: "namespace"})),
            ...this.entidades.flatMap(e =>
                e.atributos().map(a => ({label: a.nombre(), type: "class"}))
            ),
        ];
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

            const origenPuedeSerDebil = !this._tieneRelacionDebil(entidadOrigen, relacion);

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

        if (this._tieneRelacionDebil(antiguaFuerte, relacion)) {
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

        if (!this._tieneRelacionDebil(antiguaDebil, relacion)) {
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

    private _tieneRelacionDebil(entidad: Entidad, relacionActual: Relacion): boolean {
        return this.relaciones.some(
            rel => rel.esDebil() && rel.entidadOrigen() === entidad && rel !== relacionActual
        );
    }

    private _intentarInversiónDeRelación(
        relacion: Relacion,
        nuevaEntidadDebil: Entidad,
        nuevaEntidadFuerte: Entidad
    ): Relacion {
        if (this._tieneRelacionDebil(nuevaEntidadDebil, relacion)) {
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
        visitados: Set<Entidad> = new Set(),
        relacionesQueSeránReemplazadas: Set<Relacion> = new Set()
    ): boolean {
        if (entidadPadreActual === entidadHija) {
            return true;
        }

        if (visitados.has(entidadPadreActual)){
            return false;
        }

        visitados.add(entidadPadreActual);

        return this.relaciones
            .filter(r =>
                r.esDebil() && r.entidadOrigen() === entidadPadreActual && !relacionesQueSeránReemplazadas.has(r)
            )
            .some(rel =>
                this._seFormaCicloDeRelacionesDebiles(
                    entidadHija,
                    rel.entidadDestino(),
                    visitados,
                    relacionesQueSeránReemplazadas
                )
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
        if (!this._tieneRelacionDebil(entidadOrigen, relacion)) {
            entidadOrigen.marcarComoFuerte();
        }
    }

    private _reemplazarRelacion(relacionVieja: Relacion, relacionNueva: Relacion): void {
        const index = this.relaciones.indexOf(relacionVieja);
        this.relaciones[index] = relacionNueva;
    }

    private _quitarDependenciaDeEntidadesAsociadasA(entidad: Entidad) {
        const relacionesAfectadas = this.relacionesAsociadasA(entidad);

        relacionesAfectadas
            .filter(r => r.esDebil())
            .forEach(r => this._actualizarEstadoEntidadAlCambiarAFuerte(r));
        return relacionesAfectadas;
    }

    private _convertirEnFuerte(entidad: Entidad, relacionAnterior: Relacion | null): void {
        relacionAnterior?.cambiarTipoRelacionA('fuerte');
        entidad.marcarComoFuerte();
    }

    private _validarRelacionDebil(entidad: Entidad, relacion: Relacion): void {
        if (!this.relaciones.includes(relacion) || !relacion.contieneA(entidad)) {
            throw new MomodeloLogicaError(
                "La relación identificadora debe estar asociada a la entidad."
            );
        }
    }

    private _otraEntidadDe(relacion: Relacion, entidad: Entidad): Entidad {
        return relacion.entidadOrigen() === entidad
            ? relacion.entidadDestino()
            : relacion.entidadOrigen();
    }

    private _validarNuevaDependencia(
        entidadDebil: Entidad,
        entidadFuerte: Entidad,
        relacionAnterior: Relacion | null,
        relacionSeleccionada: Relacion
    ): void {
        const relacionesQueSeránReemplazadas = new Set([relacionSeleccionada]);
        if (relacionAnterior) relacionesQueSeránReemplazadas.add(relacionAnterior);

        if (this._seFormaCicloDeRelacionesDebiles(
            entidadDebil,
            entidadFuerte,
            new Set(),
            relacionesQueSeránReemplazadas
        )) {
            throw new CicloDeRelacionesDébilesError();
        }
    }

    private _entidadDebilDe(relacion: Relacion): Entidad | null {
        return relacion.esDebil() ? relacion.entidadOrigen() : null;
    }

    private _convertirEnRelacionDebilPara(
        relacion: Relacion,
        entidadDebil: Entidad,
        entidadFuerte: Entidad
    ): Relacion {
        if (relacion.entidadOrigen() === entidadDebil) {
            relacion.cambiarTipoRelacionA('débil');
            return relacion;
        }

        const relacionInvertida = this._crearRelacionDébilInvertida(
            relacion,
            entidadDebil,
            entidadFuerte
        );
        this._reemplazarRelacion(relacion, relacionInvertida);
        return relacionInvertida;
    }

    private _actualizarAntiguaEntidadDebil(
        antiguaEntidadDebil: Entidad | null,
        nuevaEntidadDebil: Entidad,
        relacionReemplazada: Relacion
    ): void {
        if (antiguaEntidadDebil && antiguaEntidadDebil !== nuevaEntidadDebil &&
            !this._tieneRelacionDebil(antiguaEntidadDebil, relacionReemplazada)) {
            antiguaEntidadDebil.marcarComoFuerte();
        }
    }

    private _resultadoDependencia(
        relacionAnterior: Relacion | null,
        relacionSeleccionada: Relacion | null,
        relacionFinal: Relacion | null
    ): CambioDeRelacionIdentificadora {
        return {
            relacionIdentificadoraAnterior: relacionAnterior,
            nuevaRelacionIdentificadoraSeleccionada: relacionSeleccionada,
            relacionIdentificadoraActual: relacionFinal,
        };
    }
}
