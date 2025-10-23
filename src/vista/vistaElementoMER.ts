import {hacerArrastrable} from "../arrastrable.ts";
import {ElementoMER} from "../modelo/elementoMER.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";

export abstract class VistaElementoMER<E extends ElementoMER> {
    protected readonly _elemento: E;
    protected readonly _vistaEditorMER: VistaEditorMER;

    constructor(elemento: E, vistaEditorMER: VistaEditorMER) {
        this._elemento = elemento;
        this._vistaEditorMER = vistaEditorMER;
    }

    protected hacerArrastrable(elementoDom: HTMLElement) {
        hacerArrastrable(elementoDom, {
            alAgarrar: () => {
                elementoDom.parentElement?.append(elementoDom);
            },
            alArrastrar: (_, delta) => {
                this._elemento.moverseHacia(delta);
                this.posicionarElemento(elementoDom);
                this._vistaEditorMER.actualizarRelacionesVisuales();
            },
        });
    }

    protected posicionarElemento(elementoDOMAtributo: HTMLElement) {
        elementoDOMAtributo.style.translate = `${this._elemento.posicion().x}px ${this._elemento.posicion().y}px`;
    }
}