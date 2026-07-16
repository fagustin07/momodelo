import {Entidad} from "../modelo/entidad";
import {Atributo} from "../modelo/atributo";
import {Relacion} from "../modelo/relacion";
import {coordenada, coordenadaInicial, Posicion} from "../posicion";
import {ModeloER} from "../servicios/modeloER.ts";
import {VistaEntidad} from "./vistaEntidad";
import {VistaRelacion} from "./vistaRelacion";
import {VistaAtributo} from "./vistaAtributo";
import {renderizarToast} from "../componentes/toast";
import {hacerArrastrable} from "../arrastrable.ts";
import {ElementoMER} from "../modelo/elementoMER.ts";
import {InteracciónMER} from "./interacciones/interaccion.ts";
import {SinInteracción} from "./interacciones/sinInteraccion.ts";
import {CreandoEntidad} from "./interacciones/creandoEntidad.ts";
import {BorrandoElemento} from "./interacciones/borrandoElemento.ts";
import {SeleccionandoEntidadOrigenRelación} from "./interacciones/seleccionandoEntidadOrigenRelación.ts";
import {SeleccionandoEntidadDestinoRelación} from "./interacciones/seleccionandoEntidadDestinoRelación.ts";
import {handlearError} from "../servicios/handlearError.ts";
import {generarBarraDeInteracciones} from "../topbar.ts";
import {InspectorElementos} from "./inspectorElementos.ts";
import {MenuHamburguesa, ProveedorDeTrabajo} from "../componentes/menuHamburguesa.ts";
import {Cardinalidad, TipoAtributo, TipoRelacion} from "../tipos/tipos.ts";
import {EliminarRelacionIdentificadoraError, MomodeloLogicaError} from "../servicios/errores.ts";
import {VistaLineaCreandoRelacion} from "./vistaLineaCreandoRelacion.ts";
import {SeleccionandoEntidadParaAtributo} from "./interacciones/seleccionandoEntidadParaAtributo.ts";
import {mostrarConfirmaciónParaEliminarEntidad} from "../componentes/modalConfirmacionEliminarEntidad.ts";
import {createElement} from "./dom/createElement.ts";

export class VistaEditorMER {
    modeloER: ModeloER;
    private _elementoSeleccionado: ElementoMER | null = null;
    private _posicionActualVista = coordenadaInicial();
    private _inspector: InspectorElementos;
    private _alCambiarModelo: Array<() => void> = [];

    private readonly _elementoRaíz: HTMLElement;
    private readonly _elementoSvg: SVGElement;
    private readonly _topbar: HTMLElement;
    private readonly _etiqueta: HTMLElement;
    private readonly _menuHamburguesa: MenuHamburguesa;

    private _entidadesVisuales: Map<Entidad, VistaEntidad> = new Map();
    private _relacionesVisuales: Map<Relacion, VistaRelacion> = new Map();
    private _atributosVisuales: Map<Atributo, VistaAtributo> = new Map();
    private _interacción: InteracciónMER;

    private _lineaCreandoRelacion: VistaLineaCreandoRelacion | null = null;

    constructor(modelador: ModeloER, elementoRaiz: HTMLElement, elementoSvg: SVGElement, proveedorMenu: ProveedorDeTrabajo) {
        this.modeloER = modelador;
        this._elementoRaíz = elementoRaiz;
        this._elementoSvg = elementoSvg;
        this._inspector = new InspectorElementos(this._elementoRaíz, this);

        document.addEventListener('keydown', (evento: KeyboardEvent) => {
            if (evento.key === "Escape") {
                this.finalizarInteracción();
                this.desenfocarElementoInput();
            }
        });

        this._dibujarModelo();

        elementoRaiz.classList.add("diagrama-mer");
        elementoRaiz.prepend(this._elementoSvg);

        hacerArrastrable(this._elementoSvg as any, {
            alAgarrar: () => {
                this.desenfocarElementoInput();
            },
            alArrastrar: (_posicionCursor, delta) => {
                this._cambiarPosiciónActual(this._posicionActualVista.plus(delta));
            }
        });

        elementoRaiz.addEventListener("click", (evento: PointerEvent) => {
            if (evento.target !== elementoRaiz) return;
            this._interacción.clickEnDiagrama(this, coordenada(evento.offsetX, evento.offsetY), this._posicionActualVista);
        });

        const resizeObserver = new ResizeObserver(() => this._actualizarViewBoxSvg());
        resizeObserver.observe(this._elementoSvg);

        this.desenfocarElementoInput();

        this._topbar = generarBarraDeInteracciones(this, this._elementoRaíz);
        elementoRaiz.prepend(this._topbar);

        this._etiqueta = createElement("div", {
            className: "editor-panel-label mer-editor-label",
            textContent: "Modelo Entidad Relación",
            style: {display: "none"}
        });
        elementoRaiz.prepend(this._etiqueta);

        this._menuHamburguesa = new MenuHamburguesa(proveedorMenu);
        this._menuHamburguesa.representarseEn(elementoRaiz);

        this._interacción = new SinInteracción(this);
    }

    hayUnaInteraccionEnProceso() {
        return this._interacción.estáEnProceso();
    }

    get elementoContenedor(): HTMLElement {
        return this._elementoRaíz;
    }

    activarModoLectura(): void {
        this.finalizarInteracción();
        this.deseleccionar();
        this._topbar.style.display = "none";
        this._etiqueta.style.display = "";
        this._menuHamburguesa.setVisible(false);
        this._elementoRaíz.classList.add("mer-solo-lectura");
    }

    desactivarModoLectura(): void {
        this._topbar.style.display = "";
        this._etiqueta.style.display = "none";
        this._menuHamburguesa.setVisible(true);
        this._elementoRaíz.classList.remove("mer-solo-lectura");
    }

    vistaDeEntidad(entidad: Entidad): VistaEntidad {
        const vistaEntidad = this._entidadesVisuales.get(entidad);
        if (!vistaEntidad) {
            throw new MomodeloLogicaError(`No se encontró vista para la entidad ${entidad.nombre()}`);
        }
        return vistaEntidad;
    }

    vistaDeRelacion(relacion: Relacion): VistaRelacion {
        const vistaRelacion = this._relacionesVisuales.get(relacion);
        if (!vistaRelacion) {
            throw new MomodeloLogicaError(`No se encontró vista para la relación ${relacion.nombre()}`);
        }
        return vistaRelacion;
    }

    centroDeEntidad(entidad: Entidad): Posicion {
        return this.vistaDeEntidad(entidad).centro();
    }

    agregarElementoSvg(...elementos: SVGElement[]): void {
        elementos.forEach(elemento => this._elementoSvg.appendChild(elemento));
    }

    atributoEliminado(entidad: Entidad, atributo: Atributo) {
        this.modeloER.eliminarAtributo(atributo, entidad);
        this._atributosVisuales.get(atributo)!.borrarse();
        this._atributosVisuales.delete(atributo);
    }

    solicitarConfirmaciónParaBorrarEntidad(entidad: Entidad): void {
        const tieneAtributos = entidad.atributos().length > 0;
        const tieneRelaciones = this.modeloER.relaciones.some(relacion => relacion.contieneA(entidad));

        if (!tieneAtributos && !tieneRelaciones) {
            this._borrarEntidad(entidad);
            this.finalizarInteracción();
            return;
        }

        mostrarConfirmaciónParaEliminarEntidad(
            entidad,
            this.modeloER.relaciones,
            () => {
                this._borrarEntidad(entidad);
                this.finalizarInteracción();
            },
            () => this.finalizarInteracción(),
        );
    }

    borrarAtributo(atributo: Atributo, entidad: Entidad) {
        this.atributoEliminado(entidad, atributo);
    }

    borrarRelación(relación: Relacion) {
        try {
            this.modeloER.eliminarRelación(relación);
            this._relacionesVisuales.get(relación)?.borrarse();
            this._relacionesVisuales.delete(relación);
        } catch (error) {
            if (error instanceof EliminarRelacionIdentificadoraError) {
                this.cambiarTipoDeRelacion(relación, 'fuerte');
                this.modeloER.eliminarRelación(relación);
                this._relacionesVisuales.get(relación)?.borrarse();
                this._relacionesVisuales.delete(relación);
                renderizarToast(this._elementoRaíz, `${(relación.entidadOrigen().nombre())} se convirtió en una entidad fuerte al perder su relación identificadora.`, 'warning');
            } else {
                handlearError(error, this);
            }
        }
    }

    cancelarInteracción() {
        this.finalizarInteracción();
    }

    crearVistaEntidad(entidad: Entidad) {
        const vista = new VistaEntidad(entidad, this);
        vista.representarseEn(this._elementoRaíz);
        this._entidadesVisuales.set(entidad, vista);

        entidad.atributos().forEach((atr) => {
            this._atributoCreado(entidad, atr)
        });

        this._entidadesVisuales.get(entidad)!.elementoDom()
            .style.transform = `translate(${this._posicionActualVista.x}px, ${this._posicionActualVista.y}px)`;
    }

    crearVistaRelación(relación: Relacion) {
        const [entidadOrigen, entidadDestino] = relación.entidades();

        const vistaEntidadOrigen = this._entidadesVisuales.get(entidadOrigen);
        const vistaEntidadDestino = this._entidadesVisuales.get(entidadDestino);

        if (!vistaEntidadOrigen || !vistaEntidadDestino) {
            throw new MomodeloLogicaError(`No se encontró vista para las entidades de la relación "${relación.nombre()}"`);
        }

        const vista = new VistaRelacion(vistaEntidadOrigen, vistaEntidadDestino, relación, this);
        vista.representarse();
        this._relacionesVisuales.set(relación, vista);
    }

    crearRelaciónConDestinoEn(entidad: Entidad) {
        this._limpiarLineaFeedback();
        return this.modeloER.crearRelacion(this._elementoSeleccionado as Entidad, entidad);
    }

    deseleccionar() {
        this._elementoSeleccionado = null;
        this._actualizarSelección(null);
        this.notificarInteracción('fin-inspector');
    }

    desenfocarElementoInput() {
        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }
    }

    notificarInteracción(nombreInteracción: string) {
        this._elementoRaíz.dispatchEvent(new CustomEvent(nombreInteracción));
    }

    emitirCreacionDeAtributoEn(entidad: Entidad, nombreAtributo: string = "Atributo"): void {
        const nuevo = this.modeloER.agregarAtributoPara(entidad, nombreAtributo, coordenada(12, -75));
        this._atributoCreado(entidad, nuevo);
        this.deseleccionar();
        this.emitirSeleccionDeAtributo(entidad, nuevo);
    }

    emitirSeleccionDeAtributo(entidad: Entidad, atributo: Atributo): void {
        this._interacción.clickEnAtributo(entidad, atributo, this);
    }

    emitirSeleccionDeEntidad(entidad: Entidad): void {
        try {
            this._interacción.clickEnEntidad(entidad, this);
        } catch (error) {
            handlearError(error, this);
        }
    }

    emitirSeleccionDeRelación(relación: Relacion): void {
        this._interacción.clickEnRelación(relación, this);
    }

    entidadEliminada(entidad: Entidad, relacionesEliminadas: Relacion[]) {
        const vistaEntidadElementoMER = this._entidadesVisuales.get(entidad);
        vistaEntidadElementoMER?.borrarse();
        entidad.atributos().forEach(atr => this.atributoEliminado(entidad, atr));
        this._entidadesVisuales.delete(entidad);
        relacionesEliminadas.forEach(rel => this.relacionEliminada(rel));
        relacionesEliminadas.forEach(rel => {
            const [origen, destino] = rel.entidades();
            this._entidadesVisuales.get(origen)?.actualizarEstilo();
            this._entidadesVisuales.get(destino)?.actualizarEstilo();
        });
    }

    generarEntidadUbicadaEn(posicion: Posicion) {
        return this.modeloER.generarEntidadUbicadaEn(posicion);
    }

    finalizarInteracción() {
        this._limpiarLineaFeedback();
        this._interacción = new SinInteracción(this);
        this._elementoRaíz.classList.remove("accion-en-curso");
        this._elementoRaíz.dataset.interaccionEnCurso = this._interacción.nombre();
        this.notificarInteracción("fin-interaccion-mer")

        this.capturarEventosDesdeEntidadesVisuales();
    }

    iniciarInteracciónPara(interacciónInicializando: InteracciónMER) {
        this._elementoRaíz.classList.add("accion-en-curso");
        this._elementoRaíz.dataset.interaccionEnCurso = interacciónInicializando.nombre();
    }

    capturarEventosDesdeEntidadesVisuales() {
        this._setPointerEventsEnElementosEntidades(true);
    }

    ignorarEventosDesdeEntidadesVisuales() {
        this._setPointerEventsEnElementosEntidades(false);
    }

    private _setPointerEventsEnElementosEntidades(habilitado: boolean) {
        this._entidadesVisuales.forEach(
            vista => vista.elementoDom().style.pointerEvents = habilitado ? "auto" : "none"
        );
    }

    marcarEntidadOrigen(entidad: Entidad) {
        this._elementoSeleccionado = entidad;
        this._iniciarLineaFeedback(entidad);
        this._interacción = new SeleccionandoEntidadDestinoRelación(this);
    }

    mostrarMensajeDeError(mensaje: string) {
        this.finalizarInteracción();
        this.deseleccionar();
        renderizarToast(this._elementoRaíz, mensaje);
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }): void {
        this.modeloER.posicionarRelacionEn(relacion, centro);
        this.relacionReposicionada(relacion);
    }

    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[]): void {
        this._limpiarVistaDelUsuario();
        this.modeloER = new ModeloER(nuevasEntidades, nuevasRelaciones);
        this._dibujarModelo();
        this.desenfocarElementoInput();
        this._alCambiarModelo.forEach(callback => callback());
    }

    relacionEliminada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.borrarse();
        this._relacionesVisuales.delete(relacion);
    }

    relacionReposicionada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.reposicionarRelacion();
    }

    renombrarAtributo(nuevoNombre: string, atributoExistente: Atributo): void {
        this.modeloER.renombrarAtributo(nuevoNombre, atributoExistente, this._getEntidadDelAtributo(atributoExistente));
        this._atributoRenombrado(atributoExistente);
    }

    renombrarEntidad(nuevoNombre: string, entidad: Entidad): void {
        this.modeloER.renombrarEntidad(nuevoNombre, entidad);
        this._entidadRenombrada(entidad);
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion): void {
        this.modeloER.renombrarRelacion(nuevoNombre, relacion);
        this._relacionRenombrada(relacion);
    }

    cambiarCardinalidadOrigenA(relacion: Relacion, nuevaCardinalidad: Cardinalidad) {
        this.modeloER.cambiarCardinalidadOrigenA(relacion, nuevaCardinalidad);
    }

    cambiarCardinalidadDestinoA(relacion: Relacion, nuevaCardinalidad: Cardinalidad) {
        this.modeloER.cambiarCardinalidadDestinoA(relacion, nuevaCardinalidad);
    }

    reposicionarElementosSVG(): void {
        this._relacionesVisuales.forEach(relVisual => relVisual.reposicionarRelacion());
        this._atributosVisuales.forEach(atrVisual => atrVisual.reposicionarConexión());
    }

    redibujar(): void {
        this._entidadesVisuales.forEach((vista, entidad) => {
            const posicion = entidad.posicion();
            vista.elementoDom().style.translate = `${posicion.x}px ${posicion.y}px`;
        });
        this.reposicionarElementosSVG();
    }

    seleccionarA(elementoMER: ElementoMER) {
        this._elementoSeleccionado = elementoMER;
        this._actualizarSelección(elementoMER);
        this.notificarInteracción('inicio-inspector');
    }

    solicitudCrearEntidad(): void {
        this._interacción = new CreandoEntidad(this);
    }

    solicitudCrearAtributo(): void {
        this._interacción = new SeleccionandoEntidadParaAtributo(this);
    }

    solicitudCrearRelacion(): void {
        this._interacción = new SeleccionandoEntidadOrigenRelación(this);
    }

    solicitudDeBorrado(): void {
        this._interacción = new BorrandoElemento(this);
    }

    cambiarTipoDeAtributo(atributo: Atributo, tipo: TipoAtributo) {
        this.modeloER.cambiarTipoDeAtributo(this._getEntidadDelAtributo(atributo), atributo, tipo);
    }

    cambiarTipoDeRelacion(relacion: Relacion, nuevoTipo: TipoRelacion): Relacion | null {
        try {
            const relacionFinal = this.modeloER.cambiarTipoDeRelacionA(relacion, nuevoTipo);
            if (relacionFinal !== relacion) {
                this._relacionesVisuales.get(relacion)?.borrarse();
                this._relacionesVisuales.delete(relacion);
                this.crearVistaRelación(relacionFinal);
            } else {
                this._relacionesVisuales.get(relacion)?.reposicionarRelacion();
            }
            const entidadOrigen = relacionFinal.entidadOrigen();
            const entidadDestino = relacionFinal.entidadDestino();
            this._entidadesVisuales.get(entidadOrigen)?.actualizarEstilo();
            this._entidadesVisuales.get(entidadDestino)?.actualizarEstilo();
            return relacionFinal;
        } catch (error) {
            handlearError(error, this);
            return null;
        }
    }

    invertirRelacionDebil(relacion: Relacion): Relacion {
        const nuevaRelacion = this.modeloER.invertirRelacionDebil(relacion);
        this._relacionesVisuales.get(relacion)?.borrarse();
        this._relacionesVisuales.delete(relacion);
        this.crearVistaRelación(nuevaRelacion);

        const entidadOrigen = nuevaRelacion.entidadOrigen();
        const entidadDestino = nuevaRelacion.entidadDestino();
        this._entidadesVisuales.get(entidadOrigen)?.actualizarEstilo();
        this._entidadesVisuales.get(entidadDestino)?.actualizarEstilo();

        this.seleccionarA(nuevaRelacion);
        return nuevaRelacion;
    }

    alCambiarModelo(callback: () => void): void {
        this._alCambiarModelo.push(callback);
    }

    private _borrarEntidad(entidad: Entidad) {
        const relacionesAfectadas = this.modeloER.eliminarEntidad(entidad);
        this.entidadEliminada(entidad, relacionesAfectadas);
        const habíaDébilesDependientes = relacionesAfectadas.some(r => r.esDebil() && r.entidadDestino() === entidad);
        if (habíaDébilesDependientes) {
            renderizarToast(this._elementoRaíz, "Las entidades débiles asociadas se transformaron en fuertes al perder su dependencia.", 'warning');
        }
    }

    private _iniciarLineaFeedback(entidadOrigen: Entidad) {
        const vistaOrigen = this._entidadesVisuales.get(entidadOrigen)!;
        this._lineaCreandoRelacion = new VistaLineaCreandoRelacion(
            vistaOrigen,
            this._elementoRaíz,
            this._elementoSvg as SVGSVGElement,
        );
        this._lineaCreandoRelacion.representarse();
    }

    private _limpiarLineaFeedback() {
        this._lineaCreandoRelacion?.borrarse();
        this._lineaCreandoRelacion = null;
    }

    private _todasLasVistas() {
        return [
            ...this._entidadesVisuales.values(),
            ...this._relacionesVisuales.values(),
            ...this._atributosVisuales.values(),
        ];
    }

    private _actualizarSelección(elementoMER: ElementoMER | null) {
        this._todasLasVistas().forEach(v => v.actualizarSelección(elementoMER));
        this._inspector.mostrar(elementoMER);
    }

    private _actualizarViewBoxSvg() {
        const svgBoundingBox = this._elementoSvg.getBoundingClientRect();
        this._elementoSvg.setAttribute("viewBox", `${-this._posicionActualVista.x} ${-this._posicionActualVista.y} ${svgBoundingBox.width} ${svgBoundingBox.height}`);
    }

    private _atributoCreado(entidad: Entidad, atributo: Atributo) {
        this._atributosVisuales.set(
            atributo,
            this._entidadesVisuales.get(entidad)!.generarVistaPara(atributo)
        );
    }

    private _atributoRenombrado(atributoExistente: Atributo) {
        this._atributosVisuales.get(atributoExistente)!.actualizarNombre();
        this._inspector.actualizarInput(atributoExistente.nombre());
    }

    private _cambiarPosiciónActual(nuevaPosición: Posicion) {
        this._posicionActualVista = nuevaPosición;
        for (const elementoHijo of this._elementoRaíz.children) {
            if (elementoHijo instanceof HTMLElement && elementoHijo.classList.contains("entidad")) {
                elementoHijo.style.transform = `translate(${this._posicionActualVista.x}px, ${this._posicionActualVista.y}px)`
            }
        }
        this._actualizarViewBoxSvg();
    }

    private _dibujarModelo() {
        this.modeloER.entidades.forEach(e => this.crearVistaEntidad(e));
        this.modeloER.relaciones.forEach(r => this.crearVistaRelación(r));
    }

    private _entidadRenombrada(entidad: Entidad) {
        this._entidadesVisuales.get(entidad)?.actualizarNombre?.();
        this.reposicionarElementosSVG();
        this._inspector.actualizarInput(entidad.nombre());
    }

    private _getEntidadDelAtributo(atributo: Atributo): Entidad {
        return [...this._entidadesVisuales.keys()].find(entidad => entidad.posee(atributo))!;
    }

    private _limpiarVistaDelUsuario() {
        this._reiniciarVisual();
        this._reiniciarDiccionarios();
    }

    private _reiniciarDiccionarios() {
        this._entidadesVisuales.clear();
        this._atributosVisuales.clear();
        this._relacionesVisuales.clear();
    }

    private _reiniciarVisual() {
        this._entidadesVisuales.forEach(entVisual => entVisual.borrarse());
        this._atributosVisuales.forEach(atrVisual => atrVisual.borrarse());
        this._relacionesVisuales.forEach(relVisual => relVisual.borrarse());
        this._cambiarPosiciónActual(coordenadaInicial());
    }

    private _relacionRenombrada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.actualizarNombre?.();
        this._inspector.actualizarInput(relacion.nombre());
    }
}