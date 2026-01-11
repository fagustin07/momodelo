import {beforeEach, describe, expect, it} from "vitest";
import {fireEvent, within} from "@testing-library/dom";
import {init} from "../../src/vista";
import {Entidad} from "../../src/modelo/entidad";
import {coordenada} from "../../src/posicion";
import {Relacion} from "../../src/modelo/relacion";
import "../../src/style.css";


function getElementoEntidades(): HTMLElement[] {
    return [...document.querySelectorAll<HTMLElement>(".entidad")];
}

function getInputRelaciones(): HTMLInputElement[] {
    return [...document.querySelectorAll<HTMLInputElement>('input[title="Nombre Relacion"]')!];
}

function campoNombreDe(elementoEntidad: HTMLElement): HTMLInputElement {
    return within(elementoEntidad).getByTitle<HTMLInputElement>("Nombre Entidad");
}

function getAtributoVisualDe(elementoEntidad: HTMLElement): HTMLElement[] {
    return within(elementoEntidad).getAllByTitle<HTMLInputElement>("Nombre de atributo").map(i => i.closest('.atributo')!);
}

function getAtributoInputDe(elementoAtributo: HTMLElement): HTMLInputElement {
    return within(elementoAtributo).getByTitle<HTMLInputElement>("Nombre de atributo");
}

function agregarAtributoEn(elementoEntidad: HTMLElement, nombreAtributoNuevo: string): HTMLInputElement {
    const botonAgregarAtributo = within(elementoEntidad).getByTitle<HTMLButtonElement>("Agregar atributo");

    botonAgregarAtributo.click();

    const camposDeAtributos = within(elementoEntidad).getAllByTitle<HTMLInputElement>("Nombre de atributo");
    const nuevoAtributo = camposDeAtributos[camposDeAtributos.length - 1];
    fireEvent.input(nuevoAtributo, { target: { value: nombreAtributoNuevo } });
    return nuevoAtributo;
}

function getInputInspector(): HTMLInputElement {
    const inspector = document.getElementById("panel-inspector");
    if (!inspector) throw new Error("Panel inspector no encontrado");
    return within(inspector).getByTitle<HTMLInputElement>("Nombre Elemento Inspeccionado");
}

function getTítuloInspector(): string {
    const inspector = document.getElementById("panel-inspector");
    if (!inspector) throw new Error("Panel inspector no encontrado");
    return within(inspector).getByTitle<HTMLElement>("Tipo Elemento Inspeccionado").textContent!;
}

function elInspectorEstáVisible(): boolean {
    const inspector = document.getElementById("panel-inspector");
    if (!inspector) return false;
    return inspector.style.display === "block";
}


describe("[MER] Inspector de Elementos", () => {
    let elementoRaíz: HTMLElement;
    let entidadPirata: Entidad;
    let entidadBarco: Entidad;
    let relacionNavega: Relacion;

    beforeEach(() => {
        document.body.innerHTML = '';
        elementoRaíz = document.createElement('div');
        document.body.append(elementoRaíz);

        entidadPirata = new Entidad("Pirata", [], coordenada(10, 10));
        entidadBarco = new Entidad("Barco", [], coordenada(300, 10));
        relacionNavega = new Relacion(entidadPirata, entidadBarco, "Navega");

        init(elementoRaíz, [entidadPirata, entidadBarco], [relacionNavega]);
    });

    it("Al seleccionar una Entidad el Inspector muestra las propiedades del elemento", () => {
        const [elementoPirata] = getElementoEntidades();
        fireEvent.click(elementoPirata);

        expect(elInspectorEstáVisible()).toBeTruthy;
        expect(getTítuloInspector()).toBe("Entidad");
        expect(getInputInspector().value).toBe("Pirata");
    });

    it("Al seleccionar un Atributo el Inspector muestra las propiedades del elemento", () => {
        const [elementoPirata] = getElementoEntidades();
        const inputAtributo = agregarAtributoEn(elementoPirata, "Parche");

        fireEvent.click(inputAtributo);

        expect(elInspectorEstáVisible()).toBeTruthy;
        expect(getTítuloInspector()).toBe("Atributo");
        expect(getInputInspector().value).toBe("Parche");
    });

    it("Al seleccionar una Relación, el Inspector muestra las propiedades del elemento", () => {
        const [inputRelacion] = getInputRelaciones();
        fireEvent.click(inputRelacion);

        const inspector = document.getElementById("panel-inspector")!;

        expect(elInspectorEstáVisible()).toBeTruthy;
        expect(getTítuloInspector()).toBe("Relación");
        expect(getInputInspector().value).toBe("Navega");
        expect(inspector.innerHTML).toContain("Pirata");
        expect(inspector.innerHTML).toContain("Barco");
    });

    it("Al seleccionar una relación por primera vez, entonces la participación de ambas entidades es la menos restrictiva", () => {
        const [inputRelacion] = getInputRelaciones();
        fireEvent.click(inputRelacion);

        const inspector = document.getElementById("panel-inspector")!;

        const contenedorOrigen = within(inspector).getByTestId("Cardinalidad origen");
        const contenedorDestino = within(inspector).getByTestId("Cardinalidad destino");

        const participaciónMínimaOpcionalOrigen = within(contenedorOrigen).getByLabelText(/Puede/i) as HTMLInputElement;
        const participaciónMínimaObligatoriaOrigen = within(contenedorOrigen).getByLabelText(/Debe/i) as HTMLInputElement;

        const participaciónMáximaRestringidaOrigen = within(contenedorOrigen).getByLabelText(/Una vez/i) as HTMLInputElement;
        const participaciónMáximaLibreOrigen = within(contenedorOrigen).getByLabelText(/Muchas/i) as HTMLInputElement;

        const participaciónMínimaOpcionalDestino = within(contenedorDestino).getByLabelText(/Puede/i) as HTMLInputElement;
        const participaciónMínimaObligatoriaDestino = within(contenedorDestino).getByLabelText(/Debe/i) as HTMLInputElement;

        const participaciónMáximaRestringidaDestino = within(contenedorDestino).getByLabelText(/Una vez/i) as HTMLInputElement;
        const participaciónMáximaLibreDestino = within(contenedorDestino).getByLabelText(/Muchas/i) as HTMLInputElement;

        expect(participaciónMínimaOpcionalOrigen.checked).toBe(true);
        expect(participaciónMínimaObligatoriaOrigen.checked).toBe(false);
        expect(participaciónMáximaLibreOrigen.checked).toBe(true);
        expect(participaciónMáximaRestringidaOrigen.checked).toBe(false);

        expect(participaciónMínimaOpcionalDestino.checked).toBe(true);
        expect(participaciónMínimaObligatoriaDestino.checked).toBe(false);
        expect(participaciónMáximaLibreDestino.checked).toBe(true);
        expect(participaciónMáximaRestringidaDestino.checked).toBe(false);
    })

    it("Al deseleccionar un elemento, el Inspector se oculta", () => {
        const [elementoPirata] = getElementoEntidades();
        fireEvent.click(elementoPirata);

        fireEvent.keyDown(elementoRaíz, { key: 'Escape' });

        expect(elInspectorEstáVisible()).toBeFalsy;
    });

    it("Renombrar Entidad desde el Inspector actualiza la Vista y el Modelo", () => {
        const [elementoPirata] = getElementoEntidades();
        fireEvent.click(elementoPirata);

        const inputInspector = getInputInspector();
        const nuevoNombre = "Capitán";

        fireEvent.input(inputInspector, { target: { value: nuevoNombre } });

        expect(campoNombreDe(elementoPirata).value).toBe(nuevoNombre);
        expect(entidadPirata.nombre()).toBe(nuevoNombre);
        expect(inputInspector.value).toBe(nuevoNombre);
    });

    it("Renombrar Atributo desde el Inspector actualiza la Vista y el Modelo", () => {
        const [elementoPirata] = getElementoEntidades();
        const inputAtributo = agregarAtributoEn(elementoPirata, "Parche");
        fireEvent.click(inputAtributo);

        const inputInspector = getInputInspector();
        const nuevoNombre = "Garfio";

        fireEvent.input(inputInspector, { target: { value: nuevoNombre } });

        const atributoPirata = entidadPirata.atributos()[0];

        expect(getAtributoInputDe(getAtributoVisualDe(elementoPirata)[0]).value).toBe(nuevoNombre);
        expect(atributoPirata.nombre()).toBe(nuevoNombre);
        expect(inputInspector.value).toBe(nuevoNombre);
    });

    it("Renombrar Entidad desde la Figura actualiza el Modelo y el Inspector", () => {
        const [elementoPirata] = getElementoEntidades();
        fireEvent.click(elementoPirata);

        const inputFigura = campoNombreDe(elementoPirata);
        const nuevoNombre = "Marinero";

        fireEvent.input(inputFigura, { target: { value: nuevoNombre } });

        expect(entidadPirata.nombre()).toBe(nuevoNombre);

        expect(getInputInspector().value).toBe(nuevoNombre);
    });

    it("Renombrar Atributo desde la Figura actualiza el Modelo y el Inspector", () => {
        const [elementoPirata] = getElementoEntidades();
        agregarAtributoEn(elementoPirata, "Parche");
        const elementoAtributoVisual = getAtributoVisualDe(elementoPirata)[0];
        fireEvent.click(elementoAtributoVisual);

        const inputFigura = getAtributoInputDe(elementoAtributoVisual);
        const nuevoNombre = "Espada";

        fireEvent.input(inputFigura, { target: { value: nuevoNombre } });

        const atributoPirata = entidadPirata.atributos()[0];

        expect(atributoPirata.nombre()).toBe(nuevoNombre);
        expect(getInputInspector().value).toBe(nuevoNombre);
    });

    it("Cambiar la selección entre tipos de Elementos actualiza correctamente el contenido del inspector", () => {
        const [elementoPirata] = getElementoEntidades();
        const [inputRelacion] = getInputRelaciones();
        fireEvent.click(elementoPirata);

        fireEvent.click(inputRelacion);

        expect(getTítuloInspector()).toBe("Relación");
        expect(getInputInspector().value).toBe("Navega");
    });
});