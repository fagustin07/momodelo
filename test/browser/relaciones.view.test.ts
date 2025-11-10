import {beforeEach, describe, expect, it} from "vitest";
import userEvent from "@testing-library/user-event";
import {init} from "../../src/vista";
import {Entidad} from "../../src/modelo/entidad";
import {coordenada} from "../../src/posicion";
import "../../src/style.css";
import {fireEvent, screen} from "@testing-library/dom";
import {VistaEditorMER} from "../../src/vista/vistaEditorMER.ts";

function getElementoEntidades() {
    return [...document.querySelectorAll<HTMLElement>(".entidad")];
}

function getInputRelaciones(): HTMLInputElement[] {
    return [...document.querySelectorAll<HTMLInputElement>('input[title="Nombre Relacion"]')!];
}

function realizarGestoParaRelacionarA(elementoOrigen: HTMLElement, elementoDestino: HTMLElement, nombreRelacion: string = "RELACION") {
    const botonCrearRelacion = screen.getByRole('button', { name: /\+relacion/i });
    fireEvent.click(botonCrearRelacion);
    fireEvent.click(elementoOrigen);
    fireEvent.click(elementoDestino);

    const nuevaRelacion = getInputRelaciones()[getInputRelaciones().length - 1];
    fireEvent.input(nuevaRelacion, { target: { value: nombreRelacion } });

    return nuevaRelacion;
}

function realizarGestoEliminarSobre(elemento: HTMLElement) {
    const botonBorrar = screen.getByRole('button', { name: /borrar/i });
    fireEvent.click(botonBorrar);
    fireEvent.click(elemento);
}

describe("[MER] Vista Relaciones", () => {
    let personaje: Entidad;
    let humorista: Entidad;
    let entidades: Entidad[];
    let vistaEditorMER: VistaEditorMER;

    beforeEach(() => {
        document.body.innerHTML = "";
        const raiz = document.createElement("div");
        document.body.appendChild(raiz);

        personaje = new Entidad("PERSONAJE", [], coordenada(100, 100));
        humorista = new Entidad("HUMORISTA", [], coordenada(300, 500));
        entidades = [personaje, humorista];

        vistaEditorMER = init(raiz, entidades, []);
    });

    it("Dado dos entidades, cuando se seleccionan ambas, entonces se crea una relación entre ellas", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();

        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);

        const [relacion] = vistaEditorMER.modelador.relaciones;
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

        expect(vistaEditorMER.modelador.relaciones[0].nombre()).toBe("IMITA");
    });

    it("Se puede crear más de una relación", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();
        const elementoRelacionRepresenta = realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista, "REPRESENTA");
        const elementoRelacionAma = realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista, "AMA");

        expect(elementoRelacionRepresenta).toBeInTheDocument();
        expect(elementoRelacionAma).toBeInTheDocument();
        expect(vistaEditorMER.modelador.relaciones.length).toBe(2);
    });

    it("Al eliminar una relacion, entonces no queda referencia de la misma, tanto en la vista como en el modelo", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();
        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);

        const campoNombreRelacion = document.activeElement as HTMLInputElement;
        realizarGestoEliminarSobre(campoNombreRelacion);

        expect(getInputRelaciones().length).toBe(0);
        expect(vistaEditorMER.modelador.relaciones.length).toBe(0);
    });

    it("Al eliminar una relacion y clickear en otra, solo se elimina la primer relacion", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();
        const elementoRelacionRepresenta = realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista, "REPRESENTA");
        const elementoRelacionAma = realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista, "AMA");
        realizarGestoEliminarSobre(elementoRelacionRepresenta);

        fireEvent.click(elementoRelacionAma);

        expect(elementoRelacionRepresenta).not.toBeInTheDocument();
        expect(elementoRelacionAma).toBeInTheDocument();
        expect(vistaEditorMER.modelador.relaciones.length).toBe(1);
    });

    it("Al eliminar una entidad, entonces no quedan relaciones de la misma, tanto en la vista como en el modelo", async () => {
        const [elementoPersonaje, elementoHumorista] = getElementoEntidades();
        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);
        realizarGestoParaRelacionarA(elementoPersonaje, elementoHumorista);

        realizarGestoEliminarSobre(elementoPersonaje);

        expect(getInputRelaciones().length).toBe(0);
        expect(vistaEditorMER.modelador.relaciones.length).toBe(0);
    });

    it("No se puede crear una relación recursiva", async () => {
        const [elementoPersonaje] = getElementoEntidades();

        const botonCrearRelacion = screen.getByRole('button', { name: /\+relacion/i });
        fireEvent.click(botonCrearRelacion);
        fireEvent.click(elementoPersonaje);
        fireEvent.click(elementoPersonaje);

        expect(getInputRelaciones().length).toBe(0);
        expect(vistaEditorMER.modelador.relaciones.length).toBe(0);
    });
});
