import {Entidad} from "../modelo/entidad";
import {Atributo} from "../modelo/atributo";
import {Relacion} from "../modelo/relacion";
import {Posicion} from "../posicion";
import {Modelador} from "../servicios/modelador";
import {InteraccionEnProceso} from "../servicios/accionEnProceso";
import {VistaEntidad} from "./vistaEntidad";
import {VistaRelacion} from "./vistaRelacion";
import {VistaAtributo} from "./vistaAtributo";
import {renderizarToast} from "../componentes/toast";
import {RelacionRecursivaError} from "../servicios/errores";

export class VistaEditorMER {
    readonly modelador: Modelador;

    private _interacciónEnProceso: InteraccionEnProceso = InteraccionEnProceso.SinInteracciones;
    private _entidadSeleccionada: Entidad | null = null;

    private readonly _elementoRaíz: HTMLElement;
    private readonly _elementoSvg: SVGElement;

    private _entidadesVisuales: Map<Entidad, VistaEntidad> = new Map();
    private _relacionesVisuales: Map<Relacion, VistaRelacion> = new Map();
    private _atributosVisuales: Map<Atributo, VistaAtributo> = new Map();

    constructor(modelador: Modelador, elementoRaiz: HTMLElement, elementoSvg: SVGElement) {
        this.modelador = modelador;
        this._elementoRaíz = elementoRaiz;
        this._elementoSvg = elementoSvg;

        this.modelador.conectarVista(this);

        this._elementoRaíz.addEventListener('keydown', (evento: KeyboardEvent) => {
            if (evento.key === "Escape") {
                this._finalizarInteracción();
            }
        });

        this.modelador.entidades.forEach(e => this._crearVistaEntidad(e));
        this.modelador.relaciones.forEach(r => this._crearVistaRelacion(r));

        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }
    }

    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[]): void {
        this.limpiarVistaDelUsuario();
        this.modelador.reemplazarModelo(nuevasEntidades, nuevasRelaciones);
        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }
    }

    cancelarInteracción() {
        this._finalizarInteracción();
    }

    agregarEntidadEn(posicion: Posicion, posicionActualVista: Posicion): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.CrearEntidad) {
            const entidadNueva = this.modelador.generarEntidadUbicadaEn(posicion.minus(posicionActualVista));

            this._entidadesVisuales.get(entidadNueva)!.elementoDom()
                .style.transform = `translate(${posicionActualVista.x}px, ${posicionActualVista.y}px)`;
            this._finalizarInteracción();
        }
    }

    renombrarEntidad(nuevoNombre: string, entidad: Entidad): void {
        this.modelador.renombrarEntidad(nuevoNombre, entidad);
    }

    renombrarAtributo(nuevoNombre: string, atributoExistente: Atributo, entidad: Entidad): void {
        this.modelador.renombrarAtributo(nuevoNombre, atributoExistente, entidad);
    }

    posicionarRelacionEn(relacion: Relacion, centro: { x: number; y: number }): void {
        this.modelador.posicionarRelacionEn(relacion, centro);
    }

    renombrarRelacion(nuevoNombre: string, relacion: Relacion): void {
        this.modelador.renombrarRelacion(nuevoNombre, relacion);
    }

    reposicionarElementosSVG(): void {
        this._relacionesVisuales.forEach(relVisual => relVisual.reposicionarRelacion());
        this._atributosVisuales.forEach(atrVisual => atrVisual.reposicionarConexión());
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

    solicitudCrearEntidad(): void {
        this._iniciarInteracción(InteraccionEnProceso.CrearEntidad);
        const evento = new CustomEvent("momodelo-crear-entidad");
        this._elementoRaíz.dispatchEvent(evento);
    }

    solicitudDeBorrado(): void {
        this._iniciarInteracción(InteraccionEnProceso.Borrado);
        const evento = new CustomEvent("momodelo-borrar-elemento");
        this._elementoRaíz.dispatchEvent(evento);
    }

    solicitudCrearRelacion(): void {
        this._iniciarInteracción(InteraccionEnProceso.CrearRelacion);
        const evento = new CustomEvent("momodelo-relacion-origen");
        this._elementoRaíz.dispatchEvent(evento);
    }

    emitirSeleccionDeRelacion(relacion: Relacion): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarRelacion(relacion);
            this._finalizarInteracción();
        }
    }

    emitirCreacionDeAtributoEn(entidad: Entidad, nombreAtributo: string = "Atributo"): void {
        this.modelador.agregarAtributoPara(entidad, nombreAtributo);
    }

    emitirSeleccionDeEntidad(entidad: Entidad): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarEntidad(entidad);
            this._finalizarInteracción();
            return;
        }
        if (this._interacciónEnProceso === InteraccionEnProceso.CrearRelacion) {
            this.seleccionarEntidad(entidad);
        }
    }

    emitirSeleccionDeAtributo(entidad: Entidad, atributo: Atributo): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarAtributo(atributo, entidad);
            this._finalizarInteracción();
        }
    }

    puedoCrearUnaEntidad(): boolean {
        return this._interacciónEnProceso === InteraccionEnProceso.CrearEntidad;
    }

    hayUnaInteraccionEnProceso() {
        return this._interacciónEnProceso !== InteraccionEnProceso.SinInteracciones;
    }

    entidadCreada(entidad: Entidad) {
        if (!this._entidadesVisuales.has(entidad)) {
            this._crearVistaEntidad(entidad);
        }
    }

    entidadRenombrada(entidad: Entidad) {
        this._entidadesVisuales.get(entidad)?.actualizarNombre?.();
        this.reposicionarElementosSVG();
    }

    entidadEliminada(entidad: Entidad, relacionesEliminadas: Relacion[]) {
        const vistaEntidadElementoMER = this._entidadesVisuales.get(entidad);
        vistaEntidadElementoMER?.borrarse();
        entidad.atributos().forEach( atr => this.modelador.eliminarAtributo(atr, entidad));
        this._entidadesVisuales.delete(entidad);
        relacionesEliminadas.forEach(rel => this.relacionEliminada(rel));
    }

    atributoCreado(entidad: Entidad, atributo: Atributo) {
        if (!this._atributosVisuales.has(atributo)){
            const vistaEntidad = this._entidadesVisuales.get(entidad)!;
            const atrVisual = new VistaAtributo(atributo, this, entidad);
            atrVisual.representarseEn(vistaEntidad.contenedorDeAtributos());
            this._atributosVisuales.set(atributo, atrVisual);
        }
    }

    atributoEliminado(_entidad: Entidad, atributo: Atributo) {
        this._atributosVisuales.get(atributo)!.borrarse();
        this._atributosVisuales.delete(atributo);
    }

    relacionCreada(relacion: Relacion) {
        this._crearVistaRelacion(relacion);
    }

    relacionRenombrada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.actualizarNombre?.();
    }

    relacionReposicionada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.reposicionarRelacion();
    }

    relacionEliminada(relacion: Relacion) {
        this._relacionesVisuales.get(relacion)?.borrarse();
        this._relacionesVisuales.delete(relacion);
    }

    // =================== PRIVATE ===================
    private seleccionarEntidad(entidad: Entidad): void {
        if (this._interacciónEnProceso === InteraccionEnProceso.CrearRelacion) {
            if (!this._entidadSeleccionada) {
                this._entidadSeleccionada = entidad;
                const evento = new CustomEvent("momodelo-relacion-destino");
                this._elementoRaíz.dispatchEvent(evento);
            } else {
                try {
                    this.modelador.crearRelacion(this._entidadSeleccionada, entidad);
                } catch (error) {
                    if (error instanceof RelacionRecursivaError) {
                        renderizarToast(this._elementoRaíz, error.message, {variante: "error"});
                    } else {
                        throw error;
                    }
                }
                this._finalizarInteracción();
            }
        }
    }

    private _crearVistaEntidad(entidad: Entidad) {
        const vista = new VistaEntidad(entidad, this);
        vista.representarseEn(this._elementoRaíz);
        this._entidadesVisuales.set(entidad, vista);

        entidad.atributos().forEach((atr) => {
            this.atributoCreado(entidad, atr)
        });
    }

    private _crearVistaRelacion(relacion: Relacion) {
        const [entidadOrigen, entidadDestino] = relacion.entidades();

        const vista = new VistaRelacion(entidadOrigen, entidadDestino, relacion, this);
        vista.representarse();
        this._relacionesVisuales.set(relacion, vista);
    }

    private _iniciarInteracción(interacciónAComenzar: InteraccionEnProceso) {
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
    }


    private _finalizarInteracción() {
        if (!this.seEstáCreandoUnElemento() && document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }

        this._interacciónEnProceso = InteraccionEnProceso.SinInteracciones;
        this._entidadSeleccionada = null;
        this._elementoRaíz.classList.remove("accion-en-curso");
        this._elementoRaíz.dataset.interaccionEnCurso = this._interacciónEnProceso;
        this.notificarFinalizaciónDeInteracción();

        this._elementoRaíz.querySelectorAll<HTMLElement>(".entidad")
            .forEach(e => e.style.pointerEvents = "auto");
    }

    private seEstáCreandoUnElemento() {
        return this._interacciónEnProceso === InteraccionEnProceso.CrearEntidad ||
            this._interacciónEnProceso === InteraccionEnProceso.CrearRelacion;
    }

    private notificarFinalizaciónDeInteracción() {
        this._elementoRaíz.dispatchEvent(new CustomEvent("fin-interaccion-mer"));
    }

    private limpiarVistaDelUsuario() {
        this.reiniciarVisual();
        this.reiniciarDiccionarios();
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
    }
}