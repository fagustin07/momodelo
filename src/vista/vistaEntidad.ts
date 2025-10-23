import {Entidad} from "../modelo/entidad";
import {hacerArrastrable} from "../arrastrable";
import {createElement} from "./dom/createElement";
import {coordenada} from "../posicion.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";

export class VistaEntidad {
    private readonly _entidad: Entidad;
    private readonly vistaEditorMER: VistaEditorMER;
    private readonly _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;
    private _contenedorDeAtributos!: HTMLElement;

    constructor(entidad: Entidad, vistaEditorMER: VistaEditorMER) {
        this._entidad = entidad;
        this.vistaEditorMER = vistaEditorMER;
        this._elementoDom = this._crearElementoDom();
    }

    representarseEn(contenedor: HTMLElement) {
        contenedor.append(this._elementoDom);
        this._campoNombre.focus();
        this._campoNombre.select();
    }

    actualizarNombre() {
        this._campoNombre.value = this._entidad.nombre();
    }

    private _crearElementoDom() {
        this._contenedorDeAtributos = createElement("div");
        this._campoNombre = this._crearInputCampoNombre();

        const elementoDOMEntidad = this._crearElementoDOMEntidad();

        this.posicionarElemento(elementoDOMEntidad);
        hacerArrastrable(elementoDOMEntidad, {
            alAgarrar: () => {
                elementoDOMEntidad.parentElement?.append(elementoDOMEntidad);
            },
            alArrastrar: (_, delta) => {
                this._entidad.moverseHacia(delta);
                this.posicionarElemento(elementoDOMEntidad);
                this.vistaEditorMER.actualizarRelacionesVisuales();
            },
        });

        return elementoDOMEntidad;
    }

    private _crearInputCampoNombre() {
        return createElement("input", {
            title: "Nombre Entidad",
            value: this._entidad.nombre(),
            oninput: () => {
                this.vistaEditorMER.renombrarEntidad(this._campoNombre.value, this._entidad);
            },
        }, []);
    }

    private _crearElementoDOMEntidad() {
        return createElement("div", {
            className: "entidad",
            onclick: () => {
                this.vistaEditorMER.emitirSeleccionDeEntidad(this._entidad);
            }
        }, [
            this._campoNombre,
            createElement("button", {
                textContent: "+",
                title: "Agregar atributo",
                onclick: () => {
                    this.vistaEditorMER.emitirCreacionDeAtributoEn(this._entidad);
                }
            }, []),
            this._contenedorDeAtributos
        ]);
    }

    borrarse() {
        this._eliminarEntidad();
    }

    private _eliminarEntidad() {
        this._elementoDom.remove();
    }

    private posicionarElemento(elementoDOMEntidad: HTMLElement) {
        elementoDOMEntidad.style.translate = `${this._entidad.posicion().x}px ${this._entidad.posicion().y}px`;
    }

    entidad() {
        return this._entidad;
    }

    centro() {
        const boundingBox = this._elementoDom.getBoundingClientRect();
        return this._entidad.posicion().plus(coordenada(boundingBox.width / 2, boundingBox.height / 2));
    }

    contenedorDeAtributos() {
        return this._contenedorDeAtributos;
    }
}