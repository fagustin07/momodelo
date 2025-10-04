import {Entidad} from "../modelo/entidad";
import {Atributo} from "../modelo/atributo";
import {Relacion} from "../modelo/relacion";
import {Posicion} from "../posicion";
import {Modelador} from "../servicios/modelador";
import {InteraccionEnProceso} from "../servicios/accionEnProceso";
import {VistaEntidad} from "./vistaEntidad";
import {VistaRelacion} from "./vistaRelacion";
import {VistaAtributo} from "./vistaAtributo";

export class VistaEditorMER {
    readonly modelador: Modelador;

    private _interaccionEnProceso: InteraccionEnProceso = InteraccionEnProceso.SinInteracciones;
    private _entidadSeleccionada: Entidad | null = null;

    private readonly _elementoRaíz: HTMLElement;
    private readonly _elementoSvg: SVGElement;

    private _entidadesVisuales: Map<Entidad, VistaEntidad> = new Map();
    private _relacionesVisuales: Map<Relacion, VistaRelacion> = new Map();

    constructor(modelador: Modelador, elementoRaiz: HTMLElement, elementoSvg: SVGElement) {
        this.modelador = modelador;
        this._elementoRaíz = elementoRaiz;
        this._elementoSvg = elementoSvg;

        this.modelador.conectarVista(this);

        this.modelador.entidades.forEach(e => this._crearVistaEntidad(e));
        this.modelador.relaciones.forEach(r => this._crearVistaRelacion(r));
    }

    reemplazarModelo(nuevasEntidades: Entidad[], nuevasRelaciones: Relacion[], contenedor: HTMLElement): void {
        this._entidadesVisuales.forEach(entVisual => entVisual.borrarse());
        this._relacionesVisuales.forEach(relVisual => relVisual.borrarse());

        this.modelador.reemplazarModelo(nuevasEntidades, nuevasRelaciones);
    }

    agregarEntidadEn(posicion: Posicion): void {
        if (this._interaccionEnProceso === InteraccionEnProceso.CrearEntidad) {
            this.modelador.generarEntidadUbicadaEn(posicion);
            this._finalizarInteraccion();
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

    actualizarRelacionesVisuales(): void {
        this._relacionesVisuales.forEach(relVisual => relVisual.reposicionarRelacion());
    }

    solicitudCrearEntidad(): void {
        this._iniciarInteraccion(InteraccionEnProceso.CrearEntidad);
    }

    solicitudDeBorrado(): void {
        this._iniciarInteraccion(InteraccionEnProceso.Borrado);
    }

    solicitudCrearRelacion(): void {
        this._iniciarInteraccion(InteraccionEnProceso.CrearRelacion);
    }

    emitirSeleccionDeRelacion(relacion: Relacion): void {
        if (this._interaccionEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarRelacion(relacion);
            this._finalizarInteraccion();
        }
    }

    emitirCreacionDeAtributoEn(entidad: Entidad, nombreAtributo: string = "Atributo"): void {
        this.modelador.agregarAtributoPara(entidad, nombreAtributo);
    }

    emitirSeleccionDeEntidad(entidad: Entidad): void {
        if (this._interaccionEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarEntidad(entidad);
            this._finalizarInteraccion();
            return;
        }
        if (this._interaccionEnProceso === InteraccionEnProceso.CrearRelacion) {
            this.seleccionarEntidad(entidad);
        }
    }

    emitirSeleccionDeAtributo(entidad: Entidad, atributo: Atributo, callbackEliminar: () => void): void {
        if (this._interaccionEnProceso === InteraccionEnProceso.Borrado) {
            this.modelador.eliminarAtributo(atributo, entidad);
            callbackEliminar();
            this._finalizarInteraccion();
        }
    }

    puedoCrearUnaEntidad(): boolean {
        return this._interaccionEnProceso === InteraccionEnProceso.CrearEntidad;
    }

    entidadCreada(entidad: Entidad) {
        if (!this._entidadesVisuales.has(entidad)) this._crearVistaEntidad(entidad);
    }

    entidadRenombrada(entidad: Entidad) {
        this._entidadesVisuales.get(entidad)?.actualizarNombre?.();
    }

    entidadEliminada(entidad: Entidad, relacionesEliminadas: Relacion[]) {
        this._entidadesVisuales.get(entidad)?.borrarse();
        this._entidadesVisuales.delete(entidad);
        relacionesEliminadas.forEach(rel => this.relacionEliminada(rel));
    }

    atributoCreado(entidad: Entidad, atributo: Atributo) {
        // ToDo: guardar el atributo creado
        new VistaAtributo(atributo, this, entidad)
            .representarseEn(this._entidadesVisuales.get(entidad)!.contenedorDeAtributos());
    }

    atributoEliminado(_entidad: Entidad, _atributo: Atributo) {
        // ToDo: que el manager avise a la vistaAtributo que debe eliminarse
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
        if (this._interaccionEnProceso === InteraccionEnProceso.CrearRelacion) {
            if (!this._entidadSeleccionada) {
                this._entidadSeleccionada = entidad;
            } else {
                this.modelador.crearRelacion(this._entidadSeleccionada, entidad);
                this._finalizarInteraccion();
            }
        }
    }

    private _crearVistaEntidad(entidad: Entidad) {
        const vista = new VistaEntidad(entidad, this);
        vista.representarseEn(this._elementoRaíz);
        this._entidadesVisuales.set(entidad, vista);
    }

    private _crearVistaRelacion(relacion: Relacion) {
        const [entidadOrigen, entidadDestino] = relacion.entidades();
        const entVisualOrigen = this._entidadesVisuales.get(entidadOrigen)!;
        const entVisualDestino = this._entidadesVisuales.get(entidadDestino)!;

        const vista = new VistaRelacion(entVisualOrigen, entVisualDestino, relacion, this, this._elementoRaíz, this._elementoSvg);
        vista.representarse();
        this._relacionesVisuales.set(relacion, vista);
    }

    private _iniciarInteraccion(interaccionAComenzar: InteraccionEnProceso) {
        this._interaccionEnProceso = interaccionAComenzar;
        this._elementoRaíz.classList.add("accion-en-curso");
        if (interaccionAComenzar !== InteraccionEnProceso.CrearRelacion) {
            this._entidadSeleccionada = null;
        }
    }

    private _finalizarInteraccion() {
        this._interaccionEnProceso = InteraccionEnProceso.SinInteracciones;
        this._entidadSeleccionada = null;
        this._elementoRaíz.classList.remove("accion-en-curso");
    }
}