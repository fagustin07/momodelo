import {beforeEach, describe, expect, it} from "vitest";
import {fireEvent, screen, within} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import {init} from "../../src/vista";
import {Entidad} from "../../src/modelo/entidad";
import {coordenada, Posicion} from "../../src/posicion";
import "../../src/style.css";
import {VistaEditorMER} from "../../src/vista/vistaEditorMER.ts";

export function getElementoEntidades() {
    return [...document.querySelectorAll<HTMLElement>(".entidad")];
}

function campoNombreDe(elementoEntidad: HTMLElement) {
    return within(elementoEntidad).getByTitle<HTMLInputElement>("Nombre Entidad");
}

function cambiarNombreEntidadPor(elementoEntidad: HTMLElement, nuevoValor: string) {
    const campoNombre = campoNombreDe(elementoEntidad);
    fireEvent.input(campoNombre, {target: {value: nuevoValor}});
}

function realizarGestoEliminarSobre(elemento: HTMLElement) {
    const botonBorrar = screen.getByRole('button', { name: /borrar/i });
    fireEvent.click(botonBorrar);
    fireEvent.click(elemento);
}

function agregarAtributoEn(elementoEntidad: HTMLElement, nombreAtributoNuevo: string) {
    const botonAgregarAtributo = within(elementoEntidad).getByTitle<HTMLButtonElement>("Agregar atributo");

    botonAgregarAtributo.click();

    const camposDeAtributos = within(elementoEntidad).getAllByTitle<HTMLInputElement>("Nombre de atributo");
    const nuevoAtributo = camposDeAtributos[camposDeAtributos.length - 1];
    fireEvent.input(nuevoAtributo, { target: { value: nombreAtributoNuevo } });
    return nuevoAtributo;
}

function realizarGestoParaAgregarEntidadEn(elementoRaiz: HTMLElement, posicion: Posicion) {
    const botonAgregarEntidad = screen.getByRole('button', {name: /\+entidad/i});

    botonAgregarEntidad.click();

    fireEvent.click(elementoRaiz, posicion);

    const entidades = getElementoEntidades();
    const nuevaEntidad = entidades[entidades.length - 1];
    const campoNombre = within(nuevaEntidad).getByTitle<HTMLInputElement>("Nombre Entidad");
    return {nuevaEntidad, campoNombre};
}

function realizarGestoParaAgregarEntidadLlamadaEn(nombreEntidad: string, elementoRaiz: HTMLElement, posicion: Posicion) {
    const {nuevaEntidad, campoNombre} = realizarGestoParaAgregarEntidadEn(elementoRaiz, posicion);
    fireEvent.input(campoNombre, { target: { value: nombreEntidad } });

    return nuevaEntidad;
}

function nombresDeLosAtributosDe(elementoEntidad: HTMLElement): HTMLInputElement[] {
    return within(elementoEntidad).getAllByTitle<HTMLInputElement>("Nombre de atributo");
}

describe("[MER] Vista Modelo tests", () => {
    let entidad: Entidad;
    let elementoRaiz: HTMLElement;
    let entidadesEnModelo: Entidad[];
    let vistaEditorMER: VistaEditorMER;

    beforeEach(() => {
        document.body.innerHTML = '';
        elementoRaiz = document.createElement('div');
        document.body.append(elementoRaiz);
        entidad = new Entidad("Pirata", [], coordenada(10, 10));
        entidadesEnModelo = [entidad];
        vistaEditorMER = init(elementoRaiz, entidadesEnModelo, []);
    });

    it("Dada una inicializacion con una entidad, entonces la misma se encuentra en el DOM", () => {
        const elementoEntidades = getElementoEntidades();
        expect(elementoEntidades.length).toEqual(1);

        const [elementoEntidad] = elementoEntidades;
        expect(campoNombreDe(elementoEntidad).value).toEqual("Pirata");
    });

    it('Dada una entidad, cuando su nombre es cambiado desde la vista, entonces el cambio se refleja en el modelo', () => {
        const [elementoEntidad] = getElementoEntidades();

        cambiarNombreEntidadPor(elementoEntidad, "Marinero");

        expect(vistaEditorMER.modelador.entidades[0].nombre()).toEqual("Marinero");
    });

    it("Cuando se escribe un nombre en la entidad creada, el modelo se actualiza correctamente", async () => {
        realizarGestoParaAgregarEntidadLlamadaEn("Marinero", elementoRaiz, coordenada(100, 100));
        const elementoEntidades = getElementoEntidades();
        expect(elementoEntidades.length).toBe(2);
        const nuevaEntidad = elementoEntidades[1];
        const campoNombre = campoNombreDe(nuevaEntidad);

        fireEvent.input(campoNombre, {target: {value: "Capitán"}});

        expect(campoNombre.value).toBe("Capitán");
    });

    it("Cuando se crea una entidad, se puede escribir el nombre en ella inmediatamente", async () => {
        realizarGestoParaAgregarEntidadLlamadaEn("Marinero", elementoRaiz, coordenada(100, 100));
        const elementoEntidad = getElementoEntidades()[1];

        const campoAtributo = within(elementoEntidad).getByTitle<HTMLButtonElement>("Nombre Entidad");
        expect(document.activeElement).toEqual(campoAtributo);
    });

    it("Cuando se crea una entidad, se puede escribir el nombre en ella inmediatamente y reemplaza el texto por defecto", async () => {
        realizarGestoParaAgregarEntidadEn(elementoRaiz, coordenada(100, 100));
        const campoNombre = document.activeElement as HTMLInputElement;

        await userEvent.type(campoNombre, "Capitán", {
            skipClick: true
        });

        expect(campoNombre.value).toBe("Capitán");
    });

    it("Se puede eliminar entidades del MER", () => {
        const elementoEntidades = getElementoEntidades();
        expect(elementoEntidades.length).toBe(1);

        const [elementoEntidad] = elementoEntidades;

        realizarGestoEliminarSobre(elementoEntidad);

        expect(getElementoEntidades().length).toBe(0);
        expect(vistaEditorMER.modelador.entidades.length).toBe(0);
    });

    it("Cuando se realiza el gesto de borrar sobre una entidad y luego se clickea en otra, entonces solo se borra la primer entidad", () => {
        const elementoEntidades = getElementoEntidades();
        const [elementoEntidad] = elementoEntidades;
        const elementoEntidadBarco = realizarGestoParaAgregarEntidadLlamadaEn("BARCO", elementoRaiz, coordenada(100, 100));
        realizarGestoEliminarSobre(elementoEntidad);

        fireEvent.click(elementoEntidadBarco);

        expect(elementoEntidadBarco).toBeInTheDocument();
        expect(vistaEditorMER.modelador.entidades.length).toBe(1);
    });

    it("Se puede agregar un atributo a una entidad existente", () => {
        const [elementoEntidad] = getElementoEntidades();

        agregarAtributoEn(elementoEntidad, "nombre");

        const nombreAtributosDOM = nombresDeLosAtributosDe(elementoEntidad)
            .map(nombreAtributoInput => nombreAtributoInput.value);

        expect(nombreAtributosDOM).toEqual(["nombre"]);
    });

    it("Cuando se agrega un atributo, se enfoca el campo para nombrarlo", () => {
        const [elementoEntidad] = getElementoEntidades();

        const botonAgregarAtributo = within(elementoEntidad).getByTitle<HTMLButtonElement>("Agregar atributo");
        botonAgregarAtributo.click();

        const [campoAtributo] = within(elementoEntidad).getAllByTitle<HTMLInputElement>("Nombre de atributo");
        expect(document.activeElement).toEqual(campoAtributo);
    });

    it("Cuando se elimina un atributo, este deja de existir en el MER", () => {
        const [elementoEntidad] = getElementoEntidades();
        agregarAtributoEn(elementoEntidad, "nombre");

        const [campoAtributo] = within(elementoEntidad).getAllByTitle<HTMLInputElement>("Nombre de atributo");

        realizarGestoEliminarSobre(campoAtributo);

        expect(entidad.atributos()).toHaveLength(0);
        expect(elementoEntidad).toBeInTheDocument();
    });

    it("Cuando se elimina un atributo y se clickea en otro, entonces solo se borra el primer atributo", () => {
        const [elementoEntidad] = getElementoEntidades();
        const atributoNombre = agregarAtributoEn(elementoEntidad, "nombre");
        const atributoApellido = agregarAtributoEn(elementoEntidad, "apellido");
        realizarGestoEliminarSobre(atributoNombre);

        fireEvent.click(atributoApellido);

        expect(entidad.atributos()).toHaveLength(1);
        expect(atributoApellido).toBeInTheDocument();
    });
});
