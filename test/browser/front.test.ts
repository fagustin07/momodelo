import {beforeEach, describe, expect, it} from "vitest";
import {within, fireEvent} from "@testing-library/dom";
import {init} from "../../src/vista";
import {Entidad} from "../../src/entidad";
import {point} from "../../src/posicion";
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

describe("[MER] Vista Modelo tests", () => {
    let entidad: Entidad;

    beforeEach(() => {
        document.body.innerHTML = '';
        entidad = new Entidad("Pirata", [], point(10, 10));
        init(document.body, [entidad]);
    })

    it("[test01] Dada una inicializacion con una entidad, entonces la misma se encuentra en el DOM", () => {
        const elementoEntidades = getElementoEntidades();
        expect(elementoEntidades.length).toEqual(1);

        const [elementoEntidad] = elementoEntidades;
        expect(campoNombreDe(elementoEntidad).value).toEqual("Pirata");
    });

    it('[test02] Dada una entidad, cuando su nombre es cambiado desde la vista, entonces el cambio se refleja en el modelo', () => {
        const [elementoEntidad] = getElementoEntidades();

        cambiarNombreEntidadPor(elementoEntidad, "Marinero");

        expect(entidad.nombre()).toEqual("Marinero");
    });
});
