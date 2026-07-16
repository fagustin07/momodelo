import {beforeEach, describe, expect, it} from "vitest";
import {fireEvent, screen} from "@testing-library/dom";
import {init} from "../../src/vista.ts";
import {Entidad} from "../../src/modelo/entidad.ts";
import {coordenada} from "../../src/posicion.ts";
import "../../src/style.css";

function toggle() {
    return document.querySelector<HTMLElement>(".mr-toggle-ar")!;
}

function panelAR() {
    return document.querySelector<HTMLElement>(".mr-editor-panel:last-of-type")!;
}

function divisorAR() {
    return document.querySelector<HTMLElement>(".mr-editores-divisor")!;
}

describe("[AR] VistaEditorAR", () => {
    let elementoRaíz: HTMLElement;
    beforeEach(() => {
        document.body.innerHTML = "";
        elementoRaíz = document.createElement("div");
        document.body.appendChild(elementoRaíz);
        init(elementoRaíz, [new Entidad("CLIENTE", [], coordenada(10, 10))], []);
        fireEvent.click(screen.getByRole("button", {name: "MR"}));
    });

    it("El editor de consultas relacionales comienza oculto", () => {
        expect(panelAR().style.display).toBe("none");
        expect(divisorAR().style.display).toBe("none");
    });

    it("Las consultas relacionales comienzan desactivadas", () => {
        expect(toggle()).not.toHaveClass("mr-toggle-ar--activo");
    });

    it("Al activar las consultas relacionales, se muestra el editor de texto", () => {
        fireEvent.click(toggle());

        expect(panelAR().style.display).not.toBe("none");
        expect(divisorAR().style.display).not.toBe("none");
    });

    it("Se pueden activar las consultas relacionales", () => {
        fireEvent.click(toggle());

        expect(toggle()).toHaveClass("mr-toggle-ar--activo");
    });

    it("Al desactivar Las consultas relacionales se oculta la vista de las mismas", () => {
        fireEvent.click(toggle());
        fireEvent.click(toggle());

        expect(panelAR().style.display).toBe("none");
        expect(divisorAR().style.display).toBe("none");
        expect(toggle()).not.toHaveClass("mr-toggle-ar--activo");
    });

    it("El estado visible de las consultas relacionales es consistente tras múltiples activaciones y desactivaciones", () => {
        fireEvent.click(toggle());
        expect(toggle()).toHaveClass("mr-toggle-ar--activo");
        expect(panelAR().style.display).not.toBe("none");

        fireEvent.click(toggle());
        expect(toggle()).not.toHaveClass("mr-toggle-ar--activo");
        expect(panelAR().style.display).toBe("none");

        fireEvent.click(toggle());
        expect(toggle()).toHaveClass("mr-toggle-ar--activo");
        expect(panelAR().style.display).not.toBe("none");
    });

    it("En modo MER/MR, activar las consultas relacionales oculta el MER", () => {
        fireEvent.click(screen.getByRole("button", {name: "MER/MR"}));
        const contenedorMER = document.getElementById("vista-mer")!;

        fireEvent.click(toggle());

        expect(contenedorMER).toHaveClass("vista-oculta");
        expect(elementoRaíz).toHaveClass("layout-mer-mr--mr-ar");
    });

    it("En modo MER/MR, desactivar las consultas relacionales vuelve a mostrar el MER", () => {
        fireEvent.click(screen.getByRole("button", {name: "MER/MR"}));
        const contenedorMER = document.getElementById("vista-mer")!;

        fireEvent.click(toggle());
        fireEvent.click(toggle());

        expect(contenedorMER).not.toHaveClass("vista-oculta");
        expect(elementoRaíz).not.toHaveClass("layout-mer-mr--mr-ar");
    });

    it("Al volver al modo MER/MR con AR activo, el MER permanece oculto", () => {
        fireEvent.click(toggle());
        fireEvent.click(screen.getByRole("button", {name: "MER"}));
        fireEvent.click(screen.getByRole("button", {name: "MER/MR"}));

        const contenedorMER = document.getElementById("vista-mer")!;
        expect(contenedorMER).toHaveClass("vista-oculta");
    });
});