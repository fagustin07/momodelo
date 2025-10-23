import {Entidad} from "../modelo/entidad.ts";
import {createElement} from "./dom/createElement.ts";
import {Atributo} from "../modelo/atributo.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {hacerArrastrable} from "../arrastrable.ts";

export class VistaAtributo {
    private _atributo: Atributo;
    private _entidad: Entidad;
    private _elementoDom: HTMLElement;
    private _campoNombre!: HTMLInputElement;
    private vistaEditorMER: VistaEditorMER;

    constructor(atributo: Atributo, vistaEditorMER: VistaEditorMER, entidad: Entidad) {
        this._atributo = atributo;
        this._entidad = entidad;
        this.vistaEditorMER = vistaEditorMER;
        this._elementoDom = this._crearElementoDom();
    }

    representarseEn(contenedor: HTMLElement) {
        contenedor.append(this._elementoDom);
        this._campoNombre.focus();
        this._campoNombre.select();
    }

    borrarse() {
        this._elementoDom.remove();
    }

    private _crearElementoDom() {
        let elementoDom = createElement("div", {
            className: "atributo",
            onclick: evento => {
                evento.stopPropagation();
                this.vistaEditorMER.emitirSeleccionDeAtributo(this._entidad, this._atributo);
            }
        }, [
            this._campoNombre = createElement("input", {
                value: this._atributo.nombre(),
                title: "Nombre de atributo",
                oninput: () => this._cambiarNombreEnModelo()
            })
        ]);

        hacerArrastrable(elementoDom, {
            alAgarrar: () => {
                // TODO: esto parece ser innecesario
                elementoDom.classList.add("moviendose");
                elementoDom.parentElement?.append(elementoDom);
            },
            alArrastrar: (_, delta) => {
                this._atributo.moverseHacia(delta);
                this.posicionarElemento(elementoDom);
                this.vistaEditorMER.actualizarRelacionesVisuales();
            },
            alSoltar: () => elementoDom.classList.remove("moviendose"),
        });

        this.posicionarElemento(elementoDom);

        return elementoDom;
    }

    private posicionarElemento(elementoDOMAtributo: HTMLElement) {
        elementoDOMAtributo.style.translate = `${this._atributo.posicion().x}px ${this._atributo.posicion().y}px`;
    }

    private _cambiarNombreEnModelo() {
        this.vistaEditorMER.renombrarAtributo(this._valorCampoNombre(), this._atributo, this._entidad);
    }

    private _valorCampoNombre() {
        return this._campoNombre.value;
    }
}