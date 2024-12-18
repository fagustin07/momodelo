import {beforeEach, describe, expect, it} from "vitest";
import {fireEvent, within} from "@testing-library/dom";
import {init} from "../../src/vista";
import {Entidad} from "../../src/entidad";
import {coordenada} from "../../src/posicion";
import "../../src/style.css";

function getElementoEntidades() {
    return [...document.querySelectorAll<HTMLElement>(".entidad")];
}

function campoNombreDe(elementoEntidad: HTMLElement) {
    return within(elementoEntidad).getByTitle<HTMLInputElement>("nombre Entidad");
}

function cambiarNombreEntidadPor(elementoEntidad: HTMLElement, nuevoValor: string) {
    const campoNombre = campoNombreDe(elementoEntidad);
    fireEvent.input(campoNombre, {target: {value: nuevoValor}});
}

function realizarGestoEliminarSobre(elemento: HTMLElement) {
    fireEvent.click(elemento, {ctrlKey: true, shiftKey: true});
}

function agregarAtributoEn(elementoEntidad: HTMLElement, nombreAtributoNuevo: string) {
    const botonAgregarAtributo = within(elementoEntidad).getByTitle<HTMLButtonElement>("Agregar atributo");

    botonAgregarAtributo.click();

    const campoAtributo = within(elementoEntidad).getByTitle<HTMLInputElement>("Nombre de atributo");
    fireEvent.input(campoAtributo, {target: {value: nombreAtributoNuevo}});
}

describe("[MER] Vista Modelo tests", () => {
    let entidad: Entidad;
    let elementoRaiz: HTMLElement;
    let entidadesEnModelo: Entidad[];

    beforeEach(() => {
        document.body.innerHTML = '';
        elementoRaiz = document.createElement('div');
        document.body.append(elementoRaiz);
        entidad = new Entidad("Pirata", [], coordenada(10, 10));
        entidadesEnModelo = [entidad];
        init(elementoRaiz, entidadesEnModelo);
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

        expect(entidad.nombre()).toEqual("Marinero");
    });

    it("Cuando se escribe un nombre en la entidad creada, el modelo se actualiza correctamente", async () => {
        fireEvent.dblClick(elementoRaiz, { clientX: 100, clientY: 100 });

        const elementoEntidades = getElementoEntidades();
        expect(elementoEntidades.length).toBe(2);

        const nuevaEntidad = elementoEntidades[1];
        const campoNombre = campoNombreDe(nuevaEntidad);

        fireEvent.input(campoNombre, { target: { value: "Capitán" } });


        expect(campoNombre.value).toBe("Capitán");
    });

    it("Se puede eliminar entidades del MER", () => {
        const elementoEntidades = getElementoEntidades();
        expect(elementoEntidades.length).toBe(1);

        const [elementoEntidad] = elementoEntidades;

        realizarGestoEliminarSobre(elementoEntidad);

        expect(getElementoEntidades().length).toBe(0);
        expect(entidadesEnModelo.length).toBe(0);
    });

    it("Se puede agregar un atributo a una entidad existente", () => {
        const [elementoEntidad] = getElementoEntidades();

        agregarAtributoEn(elementoEntidad, "nombre");

        expect(entidad.atributos()).toEqual(["nombre"]);
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
    });
});
