import {beforeEach, describe, expect, it} from "vitest";
import userEvent from "@testing-library/user-event";
import {init} from "../../src/vista";
import {Entidad} from "../../src/modelo/entidad";
import {coordenada} from "../../src/posicion";
import "../../src/style.css";
import {fireEvent, screen} from "@testing-library/dom";
import {Modelador} from "../../src/servicios/modelador.ts";

function getElementoEntidades() {
    return [...document.querySelectorAll<HTMLElement>(".entidad")];
}

function getInputRelaciones(): HTMLInputElement[] {
    return [...document.querySelectorAll<HTMLInputElement>('input[title="Nombre Relacion"]')!];
}

function realizarGestoParaRelacionarA(elementoOrigen: HTMLElement, elementoDestino: HTMLElement) {
    const botonCrearRelacion = screen.getByRole('button', { name: /\+relacion/i });
    fireEvent.click(botonCrearRelacion);
    fireEvent.click(elementoOrigen);
    fireEvent.click(elementoDestino);
}

function realizarGestoEliminarSobre(elemento: HTMLElement) {
    fireEvent.click(elemento, {ctrlKey: true, shiftKey: true});
}

function realizarGestoEliminarSobreEntidad(elemento: HTMLElement) {
    const botonBorrar = screen.getByRole('button', { name: /borrar/i });
    fireEvent.click(botonBorrar);
    fireEvent.click(elemento);
}

describe("[MER] Vista Relaciones", () => {
    let personaje: Entidad;
    let humorista: Entidad;
    let entidades: Entidad[];
    let modelador: Modelador;

    beforeEach(() => {
        document.body.innerHTML = "";
        const raiz = document.createElement("div");
        document.body.appendChild(raiz);

        personaje = new Entidad("PERSONAJE", [], coordenada(100, 100));
        humorista = new Entidad("HUMORISTA", [], coordenada(300, 500));
        entidades = [personaje, humorista];

        modelador = init(raiz, entidades, []);
    });

    it("Dado dos entidades, cuando se seleccionan ambas, entonces se crea una relación entre ellas", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();

        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);

        const [relacion] = modelador.relaciones;
        const [inputRelacion] = getInputRelaciones();

        expect(inputRelacion.value).toBe("RELACION");
        expect(relacion.contieneA(personaje)).toBe(true);
        expect(relacion.contieneA(humorista)).toBe(true);
    });

    it("Cuando se cambia el nombre a una relación, entonces se refleja en el modelo", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();

        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);

        const campoNombre = document.activeElement as HTMLInputElement;

        await userEvent.type(campoNombre, "IMITA", {
            skipClick: true
        });

        expect(modelador.relaciones[0].nombre()).toBe("IMITA");
    });

    it("Al eliminar una relacion, entonces no queda referencia de la misma, tanto en la vista como en el modelo", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();
        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);

        const campoNombre = document.activeElement as HTMLInputElement;
        realizarGestoEliminarSobre(campoNombre);

        expect(getInputRelaciones().length).toBe(0);
        expect(modelador.relaciones.length).toBe(0);
    });

    it("Al eliminar una entidad, entonces no quedan relaciones de la misma, tanto en la vista como en el modelo", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();
        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);
        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);

        realizarGestoEliminarSobreEntidad(elementoPersonaje);

        expect(getInputRelaciones().length).toBe(0);
        expect(modelador.relaciones.length).toBe(0);
    });
});
