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
import {RelacionRecursivaError} from "../servicios/errores";
import {hacerArrastrable} from "../arrastrable.ts";
import {ElementoMER} from "../modelo/elementoMER.ts";
import {InteracciónMER, CreandoEntidad, SinInteracción} from "./interacciones";

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
            alArrastrar: (_posicionCursor, delta) => {
                this.cancelarInteracción();
                this._cambiarPosiciónActual(this._posicionActualVista.plus(delta));
            }
        });

        elementoRaiz.addEventListener("click", (evento: PointerEvent) => {
            if (evento.target !== elementoRaiz) return;
            if (!this.puedoCrearUnaEntidad()) {
                return;
            }
            const posicion = coordenada(evento.offsetX, evento.offsetY);
            this.solicitudCrearEntidad();
            this.agregarEntidadEn(posicion, this._posicionActualVista);
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

    puedoCrearUnaEntidad(): boolean {
        return this._interacciónEnProceso === InteraccionEnProceso.CrearEntidad;
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

    agregarEntidadEn(posicion: Posicion, posicionActualVista: Posicion): void {
        this._interacción.clickEnDiagrama(this, posicion, posicionActualVista);
    }

    atributoEliminado(_entidad: Entidad, atributo: Atributo) {
        this._atributosVisuales.get(atributo)!.borrarse();
        this._atributosVisuales.delete(atributo);
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

    desplegarEvento(nombreEvento: string) {
        const evento = new CustomEvent(nombreEvento);
        this._elementoRaíz.dispatchEvent(evento);
    }

    emitirCreacionDeAtributoEn(entidad: Entidad, nombreAtributo: string = "Atributo"): void {
        const nuevo = this.modelador.agregarAtributoPara(entidad, nombreAtributo, coordenada(12, -75));
        this._atributoCreado(entidad, nuevo);
        this.deseleccionar();
        this.emitirSeleccionDeAtributo(entidad, nuevo);
    }

    emitirSeleccionDeAtributo(entidad: Entidad, atributo: Atributo): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarAtributo(atributo, entidad);
            this.finalizarInteracción();
        }
        if (this._interacciónEnProceso === InteraccionEnProceso.SinInteracciones) {
            this._elementoSeleccionado = atributo;
            this._actualizarSelección(atributo);
        }
    }

    emitirSeleccionDeEntidad(entidad: Entidad): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarEntidad(entidad);
            this.finalizarInteracción();
            return;
        }
        if (this._interacciónEnProceso === InteraccionEnProceso.CrearRelacion) {
            this.seleccionarEntidad(entidad);
        } else if (this._interacciónEnProceso === InteraccionEnProceso.SinInteracciones) {
            this._elementoSeleccionado = entidad;
            this._actualizarSelección(entidad);
        }
    }

    emitirSeleccionDeRelacion(relación: Relacion): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarRelacion(relación);
            this.finalizarInteracción();
        }
        if (this._interacciónEnProceso === InteraccionEnProceso.SinInteracciones) {
            this._elementoSeleccionado = relación;
            this._actualizarSelección(relación);
        }
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
        if (!this.seEstáCreandoUnElemento() && document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }

        this._interacciónEnProceso = InteraccionEnProceso.SinInteracciones;
        this._elementoRaíz.classList.remove("accion-en-curso");
        this._elementoRaíz.dataset.interaccionEnCurso = this._interacciónEnProceso;
        this.notificarFinalizaciónDeInteracción();

        this._elementoRaíz.querySelectorAll<HTMLElement>(".entidad")
            .forEach(e => e.style.pointerEvents = "auto");
    }

    iniciarInteracción(interacciónAComenzar: InteraccionEnProceso) {
        this._interacciónEnProceso = interacciónAComenzar;
        this._elementoRaíz.classList.add("accion-en-curso");
        this._elementoRaíz.dataset.interaccionEnCurso = this._interacciónEnProceso;

        if (interacciónAComenzar === InteraccionEnProceso.CrearRelacion || interacciónAComenzar === InteraccionEnProceso.Borrado) {
            this._elementoRaíz.querySelectorAll<HTMLElement>(".entidad")
                .forEach(e => e.style.pointerEvents = "auto");
        } else {
            this._elementoRaíz.querySelectorAll<HTMLElement>(".entidad")
                .forEach(e => e.style.pointerEvents = "none");
        }

        this.deseleccionar();
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }): void {
        this.modelador.posicionarRelacionEn(relacion, centro);
    }

    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[]): void {
        this.limpiarVistaDelUsuario();
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

    // =================== PRIVATE ===================
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
        this.iniciarInteracción(InteraccionEnProceso.Borrado);
        const evento = new CustomEvent("momodelo-borrar-elemento");
        this._elementoRaíz.dispatchEvent(evento);
    }

    private seEstáCreandoUnElemento() {
        return this._interacciónEnProceso === InteraccionEnProceso.CrearEntidad ||
            this._interacciónEnProceso === InteraccionEnProceso.CrearRelacion;
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

    private limpiarVistaDelUsuario() {
        this.reiniciarVisual();
        this.reiniciarDiccionarios();
    }

    private notificarFinalizaciónDeInteracción() {
        this._elementoRaíz.dispatchEvent(new CustomEvent("fin-interaccion-mer"));
        this.deseleccionar();
    }

    private reiniciarDiccionarios() {
        this._entidadesVisuales.clear();
        this._atributosVisuales.clear();
        this._relacionesVisuales.clear();
    }

    private reiniciarVisual() {
        this._entidadesVisuales.forEach(entVisual => entVisual.borrarse());
        this._atributosVisuales.forEach(atrVisual => atrVisual.borrarse());
        this._relacionesVisuales.forEach(relVisual => relVisual.borrarse());
        this._cambiarPosiciónActual(coordenada(0, 0));
    }

    private seleccionarEntidad(entidad: Entidad): void {
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
            if (error instanceof RelacionRecursivaError) {
                renderizarToast(this._elementoRaíz, error.message, {variante: "error"});
                this.finalizarInteracción();
            } else {
                throw error;
            }
        }
    }
}