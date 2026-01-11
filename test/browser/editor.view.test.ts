import {beforeEach, describe, expect, it} from "vitest";
import {Entidad} from "../../src/modelo/entidad.ts";
import {Relacion} from "../../src/modelo/relacion.ts";
import {coordenada} from "../../src/posicion.ts";
import {Modelador} from "../../src/servicios/modelador.ts";
import {VistaEditorMER} from "../../src/vista/vistaEditorMER.ts";
import "../../src/style.css";

describe("[MER] VistaEditor", () => {
    let elementoRaiz: HTMLElement;
    let elementoSvg: SVGElement;
    let modelador: Modelador;
    let vistaEditorMER: VistaEditorMER;

    beforeEach(() => {
        document.body.innerHTML = "";
        elementoRaiz = document.createElement("div");
        elementoSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        document.body.append(elementoRaiz);
        elementoRaiz.append(elementoSvg);
    });

    it("Dado un modelo con entidades y un vista editor, cuando se inicializa la vista, todas se renderizan", () => {
        const cliente = new Entidad("CLIENTE", [], coordenada(100, 100));
        const producto = new Entidad("PRODUCTO", [], coordenada(400, 100));
        modelador = new Modelador([cliente, producto], []);
        vistaEditorMER = new VistaEditorMER(modelador, elementoRaiz, elementoSvg);

        const entidadesDOM = elementoRaiz.querySelectorAll(".entidad");
        expect(entidadesDOM.length).toBe(2);
    });

    it("Dado un modelo con relaciones y un vista editor, cuando se inicializa la vista, se renderizan correctamente", () => {
        const cliente = new Entidad("CLIENTE", [], coordenada(100, 100));
        const pedido = new Entidad("PEDIDO", [], coordenada(400, 100));
        const relacion = new Relacion(cliente, pedido, "REALIZA");

        modelador = new Modelador([cliente, pedido], [relacion]);
        vistaEditorMER = new VistaEditorMER(modelador, elementoRaiz, elementoSvg);

        expect(vistaEditorMER.modelador.relaciones).toHaveLength(1);
        expect(vistaEditorMER.modelador.relaciones[0].nombre()).toBe("REALIZA");
    });

    it("Dado un vista editor, cuando se reemplaza el modelo completo, se actualizan las vistas correctamente", () => {
        const cliente = new Entidad("CLIENTE", []);
        const pedido = new Entidad("PEDIDO", []);
        modelador = new Modelador([cliente], []);
        vistaEditorMER = new VistaEditorMER(modelador, elementoRaiz, elementoSvg);

        const nuevasEntidades = [cliente, pedido];
        vistaEditorMER.reemplazarModelo(nuevasEntidades, []);
        const entidadesDOM = elementoRaiz.querySelectorAll(".entidad");

        expect(entidadesDOM).toHaveLength(2);
    });

});
