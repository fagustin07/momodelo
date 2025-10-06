import {beforeEach, describe, expect, it} from "vitest";
import {Entidad} from "../../src/modelo/entidad.ts";
import {Atributo} from "../../src/modelo/atributo.ts";
import {Modelador} from "../../src/servicios/modelador.ts";
import {VistaEditorMER} from "../../src/vista/vistaEditorMER.ts";
import {coordenada} from "../../src/posicion.ts";
import "../../src/style.css";

describe("[MER] VistaEditor", () => {
    let elementoRaiz: HTMLElement;
    let elementoSvg: SVGElement;
    let modelador: Modelador;

    beforeEach(() => {
        document.body.innerHTML = "";
        elementoRaiz = document.createElement("div");
        elementoSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        document.body.append(elementoRaiz);
        elementoRaiz.append(elementoSvg);
    });

    it("Dada una entidad con atributos preexistentes, entonces la vista se inicializa sin errores", () => {
        const entidad = new Entidad("Cliente", [new Atributo("nombre"), new Atributo("dni")]);
        modelador = new Modelador([entidad], []);

        expect(() => new VistaEditorMER(modelador, elementoRaiz, elementoSvg)).not.toThrow();
    });

    it("Dada una entidad con atributos preexistentes, entonces los atributos se renderizan en el DOM", () => {
        const entidad = new Entidad(
            "Cliente",
            [new Atributo("nombre"), new Atributo("dni")]
        );
        modelador = new Modelador([entidad], []);

        new VistaEditorMER(modelador, elementoRaiz, elementoSvg);

        const atributos = elementoRaiz.querySelectorAll<HTMLInputElement>('[title="Nombre de atributo"]');
        const nombresDeAtributosRenderizados = Array.from(atributos).map(a => a.value);

        expect(nombresDeAtributosRenderizados).toEqual(["nombre", "dni"]);
    });

});
