import {hacerArrastrable} from "../arrastrable.ts";
import {ElementoMER} from "../modelo/elementoMER.ts";
import {VistaEditorMER} from "./vistaEditorMER.ts";
import {coordenada, Posicion} from "../posicion.ts";

export abstract class VistaElementoMER<E extends ElementoMER> {
    protected readonly _elemento: E;
    protected readonly _vistaEditorMER: VistaEditorMER;

    protected constructor(elemento: E, vistaEditorMER: VistaEditorMER) {
        this._elemento = elemento;
        this._vistaEditorMER = vistaEditorMER;
    }

    abstract centro(): Posicion;

    protected hacerArrastrable(elementoDom: HTMLElement) {
        hacerArrastrable(elementoDom, {
            alAgarrar: () => {
                this._vistaEditorMER.cancelarInteracción();
                elementoDom.parentElement?.append(elementoDom);
            },
            alArrastrar: (_, delta) => {
                this._elemento.moverseHacia(delta);
                this.posicionarElemento(elementoDom);
                this._vistaEditorMER.reposicionarElementosSVG();
            },
            esArrastrable: () => !this._vistaEditorMER.hayUnaInteraccionEnProceso()
        });
    }

    protected posicionarElemento(elementoDom: HTMLElement) {
        elementoDom.style.translate = `${this._elemento.posicion().x}px ${this._elemento.posicion().y}px`;
    }

    protected calcularCentroBasadoEn(elementoDom: HTMLElement, posición: Posicion) {
        const boundingBox = elementoDom.getBoundingClientRect();
        return posición.plus(coordenada(boundingBox.width / 2, boundingBox.height / 2));
    }

    protected tamañoDeCampoParaTexto(texto: string) {
        return Math.max(1, texto.length);
    }
}