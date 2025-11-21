import {Entidad} from "../modelo/entidad";
import {Atributo} from "../modelo/atributo";
import {Relacion} from "../modelo/relacion";
import {coordenada, Posicion} from "../posicion";
import {Modelador} from "../servicios/modelador";
import {InteraccionEnProceso} from "../servicios/accionEnProceso";
import {VistaEntidad} from "./vistaEntidad";
import {VistaRelacion} from "./vistaRelacion";
import {VistaAtributo} from "./vistaAtributo";
import {renderizarToast} from "../componentes/toast";
import {MomodeloErrorImplementaciónPlanificada} from "../servicios/errores";
import {hacerArrastrable} from "../arrastrable.ts";
import {ElementoMER} from "../modelo/elementoMER.ts";
import {InteracciónMER} from "./interacciones/interaccion.ts";
import {SinInteracción} from "./interacciones/sinInteraccion.ts";
import {CreandoEntidad} from "./interacciones/creandoEntidad.ts";
import {SeleccionandoEntidadOrigenRelación} from "./interacciones/seleccionandoEntidadOrigenRelación.ts";
import {BorrandoElemento} from "./interacciones/borrandoElemento.ts";

export class VistaEditorMER {
    modelador: Modelador;

    private _interacciónEnProceso: InteraccionEnProceso = InteraccionEnProceso.SinInteracciones;
    private _elementoSeleccionado: ElementoMER | null = null;
    private _posicionActualVista = coordenada(0, 0);
    private readonly _elementoRaíz: HTMLElement;
    private readonly _elementoSvg: SVGElement;

    private _entidadesVisuales: Map<Entidad, VistaEntidad> = new Map();
    private _relacionesVisuales: Map<Relacion, VistaRelacion> = new Map();
    private _atributosVisuales: Map<Atributo, VistaAtributo> = new Map();
    private _interacción: InteracciónMER;

    constructor(modelador: Modelador, elementoRaiz: HTMLElement, elementoSvg: SVGElement) {
        this.modelador = modelador;
        this._elementoRaíz = elementoRaiz;
        this._elementoSvg = elementoSvg;


        document.addEventListener('keydown', (evento: KeyboardEvent) => {
            if (evento.key === "Escape") {
                this.finalizarInteracción();
            }
        });

        this._dibujarModelo();

        elementoRaiz.classList.add("diagrama-mer");
        elementoRaiz.prepend(this._elementoSvg);

        hacerArrastrable(this._elementoSvg as any, {
            alAgarrar: () => {
                this.cancelarInteracción();
                this.desenfocarElementoInput();
            },
            alArrastrar: (_posicionCursor, delta) => {
                this.cancelarInteracción();
                this._cambiarPosiciónActual(this._posicionActualVista.plus(delta));
            }
        });

        elementoRaiz.addEventListener("click", (evento: PointerEvent) => {
            if (evento.target !== elementoRaiz) return;
            this._interacción.clickEnDiagrama(this, coordenada(evento.offsetX, evento.offsetY), this._posicionActualVista);
        });

        const resizeObserver = new ResizeObserver(() => this._actualizarViewBoxSvg());
        resizeObserver.observe(this._elementoSvg);

        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }

        this._interacción = new SinInteracción(this);
    }

    hayUnaInteraccionEnProceso() {
        return this._interacciónEnProceso !== InteraccionEnProceso.SinInteracciones;
    }

    centroDeEntidad(entidad: Entidad): Posicion {
        const vistaEntidad = this._entidadesVisuales.get(entidad);
        if (!vistaEntidad) {
            throw new Error(`No se encontró vista para la entidad ${entidad.nombre()}`);
        }
        return vistaEntidad.centro();
    }

    agregarElementoSvg(...elementos: SVGElement[]): void {
        elementos.forEach(elemento => this._elementoSvg.appendChild(elemento));
    }

    atributoEliminado(_entidad: Entidad, atributo: Atributo) {
        this._atributosVisuales.get(atributo)!.borrarse();
        this._atributosVisuales.delete(atributo);
    }

    borrarEntidad(entidad: Entidad) {
        this.modelador.eliminarEntidad(entidad);
    }

    borrarAtributo(atributo: Atributo, entidad: Entidad) {
        this.modelador.eliminarAtributo(atributo, entidad);
    }

    borrarRelación(relación: Relacion) {
        this.modelador.eliminarRelación(relación);
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

    deseleccionar() {
        this._elementoSeleccionado = null;
        this._actualizarSelección(null);
    }

    desenfocarElementoInput() {
        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }
    }

    notificarInteracción(nombreInteracción: string) {
        const evento = new CustomEvent(nombreInteracción);
        this._elementoRaíz.dispatchEvent(evento);
    }

    emitirCreacionDeAtributoEn(entidad: Entidad, nombreAtributo: string = "Atributo"): void {
        const nuevo = this.modelador.agregarAtributoPara(entidad, nombreAtributo, coordenada(12, -75));
        this._atributoCreado(entidad, nuevo);
        this.deseleccionar();
        this.emitirSeleccionDeAtributo(entidad, nuevo);
    }

    emitirSeleccionDeAtributo(entidad: Entidad, atributo: Atributo): void {
        this._interacción.clickEnAtributo(entidad, atributo, this);
    }

    emitirSeleccionDeEntidad(entidad: Entidad): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.CrearRelacion) {
            this._seleccionarEntidadCreandoRelación(entidad);
        } else {
            this._interacción.clickEnEntidad(entidad, this);
        }
    }

    emitirSeleccionDeRelacion(relación: Relacion): void {
        this._interacción.clickEnRelación(relación, this);
    }

    entidadCreada(entidad: Entidad) {
        this.crearVistaEntidad(entidad);
    }

    entidadEliminada(entidad: Entidad, relacionesEliminadas: Relacion[]) {
        const vistaEntidadElementoMER = this._entidadesVisuales.get(entidad);
        vistaEntidadElementoMER?.borrarse();
        entidad.atributos().forEach(atr => this.modelador.eliminarAtributo(atr, entidad));
        this._entidadesVisuales.delete(entidad);
        relacionesEliminadas.forEach(rel => this.relacionEliminada(rel));
    }

    entidadRenombrada(entidad: Entidad) {
        this._entidadesVisuales.get(entidad)?.actualizarNombre?.();
        this.reposicionarElementosSVG();
    }

    generarEntidadUbicadaEn(posicion: Posicion) {
        return this.modelador.generarEntidadUbicadaEn(posicion);
    }

    finalizarInteracción() {
        this._interacciónEnProceso = InteraccionEnProceso.SinInteracciones;
        this._elementoRaíz.classList.remove("accion-en-curso");
        this._elementoRaíz.dataset.interaccionEnCurso = this._interacciónEnProceso;
        this._elementoRaíz.dispatchEvent(new CustomEvent("fin-interaccion-mer"));

        this._elementoRaíz.querySelectorAll<HTMLElement>(".entidad")
            .forEach(e => e.style.pointerEvents = "auto");
        this._interacción = new SinInteracción(this);
    }

    iniciarInteracción(interacciónAComenzar: InteraccionEnProceso) {
        this._interacciónEnProceso = interacciónAComenzar;
        this._elementoRaíz.classList.add("accion-en-curso");
        this._elementoRaíz.dataset.interaccionEnCurso = this._interacciónEnProceso;

        if (interacciónAComenzar === InteraccionEnProceso.CrearRelacion) {
            this.capturarEventosDesdeEntidadesVisuales();
        }
    }

    capturarEventosDesdeEntidadesVisuales() {
        this._elementoRaíz.querySelectorAll<HTMLElement>(".entidad")
            .forEach(e => e.style.pointerEvents = "auto");
    }

    ignorarEventosDesdeEntidadesVisuales() {
        this._elementoRaíz.querySelectorAll<HTMLElement>(".entidad")
            .forEach(e => e.style.pointerEvents = "none");
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }): void {
        this.modelador.posicionarRelacionEn(relacion, centro);
    }

    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[]): void {
        this._limpiarVistaDelUsuario();
        this.modelador = new Modelador(nuevasEntidades, nuevasRelaciones);
        this._dibujarModelo();

        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }
    }

    relacionEliminada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.borrarse();
        this._relacionesVisuales.delete(relacion);
    }

    relacionRenombrada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.actualizarNombre?.();
    }

    relacionReposicionada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.reposicionarRelacion();
    }

    renombrarAtributo(nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad): void {
        this.modelador.renombrarAtributo(nuevoNombre, atributoExistente, entidad);
    }

    renombrarEntidad(nuevoNombre: string, entidad: Entidad): void {
        this.modelador.renombrarEntidad(nuevoNombre, entidad);
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion): void {
        this.modelador.renombrarRelacion(nuevoNombre, relacion);
    }

    reposicionarElementosSVG(): void {
        this._relacionesVisuales.forEach(relVisual => relVisual.reposicionarRelacion());
        this._atributosVisuales.forEach(atrVisual => atrVisual.reposicionarConexión());
    }

    seleccionarA(elementoMER: ElementoMER) {
        this._elementoSeleccionado = elementoMER;
        this._actualizarSelección(elementoMER);
    }

    solicitudCrearEntidad(): void {
        this._interacción = new CreandoEntidad(this);
    }

    solicitudCrearRelacion(): void {
        this.iniciarInteracción(InteraccionEnProceso.CrearRelacion);
        const evento = new CustomEvent("momodelo-relacion-origen");
        this._elementoRaíz.dispatchEvent(evento);
    }

    solicitudDeBorrado(): void {
        this._interacción = new BorrandoElemento(this);
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

    private _cambiarPosiciónActual(nuevaPosición: Posicion) {
        this._posicionActualVista = nuevaPosición;
        for (const elementoHijo of this._elementoRaíz.children) {
            if (elementoHijo instanceof HTMLElement && elementoHijo.classList.contains("entidad")) {
                elementoHijo.style.transform = `translate(${this._posicionActualVista.x}px, ${this._posicionActualVista.y}px)`
            }
        }
        this._actualizarViewBoxSvg();
    }

    private _crearVistaRelacion(relacion: Relacion) {
        const [entidadOrigen, entidadDestino] = relacion.entidades();

        const vista = new VistaRelacion(entidadOrigen, entidadDestino, relacion, this);
        vista.representarse();
        this._relacionesVisuales.set(relacion, vista);
    }

    private _dibujarModelo() {
        this.modelador.conectarVista(this);
        this.modelador.entidades.forEach(e => this.crearVistaEntidad(e));
        this.modelador.relaciones.forEach(r => this._crearVistaRelacion(r));
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
        this._cambiarPosiciónActual(coordenada(0, 0));
    }

    private _seleccionarEntidadCreandoRelación(entidad: Entidad): void {
        try {
            if (this._interacciónEnProceso === InteraccionEnProceso.CrearRelacion) {
                if (this._elementoSeleccionado === null) {
                    this._elementoSeleccionado = entidad;
                    const evento = new CustomEvent("momodelo-relacion-destino");
                    this._elementoRaíz.dispatchEvent(evento);
                } else {
                    const relacion = this.modelador.crearRelacion(this._elementoSeleccionado as Entidad, entidad);
                    this._crearVistaRelacion(relacion);
                    this.finalizarInteracción();
                    this.emitirSeleccionDeRelacion(relacion);
                }
            }
        } catch (error) {
            if (error instanceof MomodeloErrorImplementaciónPlanificada) {
                renderizarToast(this._elementoRaíz, error.message);
                this.finalizarInteracción();
            } else {
                throw error;
            }
        }
    }
}