import {beforeEach, describe, expect, it} from "vitest";
import {screen, fireEvent} from "@testing-library/dom";
import {init} from "../../src/vista";
import {Entidad} from "../../src/modelo/entidad";
import {coordenada} from "../../src/posicion";
import "../../src/style.css";

describe("[Módulos] Gestor de Navegación", () => {
    let elementoRaíz: HTMLElement;
    let entidad: Entidad;

    beforeEach(() => {
        document.body.innerHTML = "";
        elementoRaíz = document.createElement("div");
        document.body.appendChild(elementoRaíz);

        entidad = new Entidad("PIRATA", [], coordenada(10, 10));

        init(elementoRaíz, [entidad], []);
    });

    it("El gestor de módulos comienza con el MER activo", () => {
        const elementoEntidad = document.querySelector(".entidad");
        const contenedorMR = document.getElementById("vista-mr");
        const botonMER = screen.getByRole("button", {name: "MER"});

        expect(elementoEntidad).not.toHaveClass("vista-oculta");
        expect(contenedorMR).toHaveClass("vista-oculta");
        expect(botonMER).toHaveClass("activa");
    });

    it("El gestor sabe navegar al módulo de MR", () => {
        const botonMR = screen.getByRole("button", {name: "MR"});

        fireEvent.click(botonMR);

        const contenedorMER = document.getElementById("vista-mer");
        const contenedorMR = document.getElementById("vista-mr");

        expect(contenedorMER).toHaveClass("vista-oculta");
        expect(contenedorMR).not.toHaveClass("vista-oculta");
    });

    it("El gestor sabe segmentar la vista para todos los módulos.", () => {
        const botonSplit = screen.getByRole("button", {name: "MER/MR"});

        fireEvent.click(botonSplit);

        const contenedorMER = document.getElementById("vista-mer");
        const contenedorMR = document.getElementById("vista-mr");

        expect(contenedorMER).not.toHaveClass("vista-oculta");
        expect(contenedorMR).not.toHaveClass("vista-oculta");
        expect(elementoRaíz).toHaveClass("layout-mer-mr");
    });

    it("El gestor sabe marcar como 'activa' la sección seleccionada", () => {
        const botonMER = screen.getByRole("button", {name: "MER"});
        const botonMR = screen.getByRole("button", {name: "MR"});
        const botonSplit = screen.getByRole("button", {name: "MER/MR"});

        fireEvent.click(botonMR);
        expect(botonMR).toHaveClass("activa");
        expect(botonMER).not.toHaveClass("activa");

        fireEvent.click(botonSplit);
        expect(botonSplit).toHaveClass("activa");
        expect(botonMR).not.toHaveClass("activa");
    });

    it("El gestor sabe ocultar elementos entre navegaciones a módulos específicos", () => {
        const botonSplit = screen.getByRole("button", {name: "MER/MR"});
        const botonMER = screen.getByRole("button", {name: "MER"});

        fireEvent.click(botonSplit);
        fireEvent.click(botonMER);

        const contenedorMR = document.getElementById("vista-mr");
        expect(contenedorMR).toHaveClass("vista-oculta");
        expect(elementoRaíz).not.toHaveClass("layout-mer-mr");
    });
});