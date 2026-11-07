import {beforeEach, describe, expect, it} from "vitest";
import {fireEvent, screen} from "@testing-library/dom";
import {init} from "../../src/vista";
import {Entidad} from "../../src/modelo/entidad";
import {coordenada} from "../../src/posicion";
import "../../src/style.css";

const MENSAJE_DE_ERROR = "No se pudo importar el trabajo porque el archivo no es válido.";

function importarArchivoCon(contenido: string): void {
    const input = document.querySelector<HTMLInputElement>("#vista-mr .menu-hamburguesa-input")!;
    const archivo = new File([contenido], "trabajo.json", {type: "application/json"});
    fireEvent.change(input, {target: {files: [archivo]}});
}

describe("[Trabajos] Importación de un archivo inválido", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const elementoRaíz = document.createElement("div");
        document.body.appendChild(elementoRaíz);

        init(elementoRaíz, [new Entidad("PIRATA", [], coordenada(10, 10))], []);
    });

    it("Informa el error si el archivo no contiene un JSON", async () => {
        importarArchivoCon("esto no es un JSON");

        expect(await screen.findByText(MENSAJE_DE_ERROR)).toBeVisible();
    });

    it("Informa el error si el JSON no tiene la estructura de un trabajo", async () => {
        importarArchivoCon("{}");

        expect(await screen.findByText(MENSAJE_DE_ERROR)).toBeVisible();
    });

    it("Conserva el diagrama si el modelo del archivo no se puede construir", async () => {
        const entidad = (id: number) => ({id, nombre: `E${id}`, atributos: [], posicion: {x: 0, y: 0}});
        const relación = {
            nombre: "R",
            entidadOrigen: 1,
            entidadDestino: 2,
            cardinalidadOrigen: ["1", "1"],
            cardinalidadDestino: ["1", "N"],
            posicion: {x: 0, y: 0},
        };

        importarArchivoCon(JSON.stringify({
            atributos: [],
            entidades: [entidad(1), entidad(2)],
            relaciones: [relación, relación],
        }));

        await screen.findByText(MENSAJE_DE_ERROR);
        expect(document.querySelectorAll(".entidad")).toHaveLength(1);
    });
});
