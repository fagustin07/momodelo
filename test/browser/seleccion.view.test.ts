import {beforeEach, describe, expect, it} from "vitest";
import {VistaEditorMER} from "../../src/vista/vistaEditorMER.ts";
import {Entidad} from "../../src/modelo/entidad.ts";
import {fireEvent, screen, within} from "@testing-library/dom";
import {coordenada} from "../../src/posicion.ts";
import {init} from "../../src/vista.ts";
import "../../src/style.css";

function getEntidadesDOM() {
    return [...document.querySelectorAll<HTMLElement>(".entidad")];
}

function getRelacionesDOM() {
    return [...document.querySelectorAll("g.relacion")] as SVGGElement[];
}

describe("[MER] Interacciones y selección", () => {
    let elementoRaiz: HTMLElement;
    let vistaEditorMER: VistaEditorMER;
    let personaje: Entidad;
    let humorista: Entidad;

    beforeEach(() => {
        document.body.innerHTML = "";
        elementoRaiz = document.createElement("div");
        document.body.appendChild(elementoRaiz);

        personaje = new Entidad("PERSONAJE", [], coordenada(100, 100));
        humorista = new Entidad("HUMORISTA", [], coordenada(300, 300));

        vistaEditorMER = init(elementoRaiz, [personaje, humorista], []);
    });

    it("cuando se crea una entidad, entonces queda seleccionada", () => {
        const botón = screen.getByRole("button", { name: /\+entidad/i });
        fireEvent.click(botón);

        fireEvent.click(elementoRaiz, { clientX: 200, clientY: 200 });

        const entidades = getEntidadesDOM();
        const nuevaEntidad = entidades[entidades.length - 1];
        expect(nuevaEntidad).toHaveClass("seleccionado");
    });

    it("cuando se crea un atributo, entonces queda seleccionado", () => {
        const [elemEntidad] = getEntidadesDOM();
        const botón = within(elemEntidad).getByTitle("Agregar atributo");

        fireEvent.click(botón);

        const inputsDeAtributos = within(elemEntidad).getAllByTitle<HTMLInputElement>("Nombre de atributo");
        const elementoInputAtributoBuscado = inputsDeAtributos[inputsDeAtributos.length - 1];
        expect(elementoInputAtributoBuscado.closest('.atributo')).toHaveClass("seleccionado");
    });

    it("cuando se crea una relación, entonces queda seleccionada", () => {
        const [elementoHumorista, elementoPersonaje] = getEntidadesDOM();
        const boton = screen.getByRole("button", { name: /\+relacion/i });
        fireEvent.click(boton);
        fireEvent.click(elementoPersonaje);
        fireEvent.click(elementoHumorista);

        const [relaciónNueva] = getRelacionesDOM();

        expect(relaciónNueva).toHaveClass("seleccionado");
        expect(elementoHumorista).not.toHaveClass("seleccionado");
        expect(elementoPersonaje).not.toHaveClass("seleccionado");
    });

});