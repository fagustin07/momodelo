import {describe, expect, it} from "vitest";
import {IntérpreteAR} from "../../src/ar/intérpreteAR.ts";
import {NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";
import {ModeloRelacionalMaterializado} from "../../src/mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "../../src/ar/resultadoConsulta.ts";
import {ErrorSemánticoAR} from "../../src/servicios/errores.ts";
import {definición, fila, inserción, pk, programa, relación, simple} from "../mr/helpers.ts";
import {IntérpreteMR} from "../../src/mr/interpretadorMR.ts";
import {ValidadorSemánticoMR} from "../../src/mr/validadorSemanticoMR.ts";
import {SentenciaMR} from "../../src/mr/sentenciaMR.ts";
import {analizarSintácticamente} from "../../src/ar/parserAR.ts";
import {AnalizadorSintácticoMR} from "../../src/mr/analizadorSintacticoMR.ts";
import {esperarResultadoConsulta} from "./helpers.ts";

describe("[Álgebra Relacional] Intérprete AR", () => {
    function modeloDesdeMR(textoMR: string): ModeloRelacionalMaterializado {
        const prog = new AnalizadorSintácticoMR().analizarSintaxisDe(textoMR);
        return new IntérpreteMR().ejecutar(
            new ValidadorSemánticoMR().ejecutarsePara(prog, null)
        );
    }

    function modeloConRelaciones(...sentencias: SentenciaMR[]): ModeloRelacionalMaterializado {
        return new IntérpreteMR().ejecutar(
            new ValidadorSemánticoMR().ejecutarsePara(programa(...sentencias), null)
        );
    }

    const intérprete = new IntérpreteAR();

    it("un NombreDeRelación retorna un resultado con las tuplas de la relación", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"))),
            inserción("PERSONA", fila(1, "Ana")),
        );
        const resultado = intérprete.ejecutar(new NombreDeRelación("PERSONA"), modelo);
        expect(resultado).toBeInstanceOf(ResultadoConsulta);
        expect(resultado.nombre).toBe("PERSONA");
        expect(resultado.tuplas).toHaveLength(1);
    });

    it("la búsqueda por nombre es insensible a mayúsculas y minúsculas", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CLIENTE", pk("id"))),
        );
        const resultado = intérprete.ejecutar(new NombreDeRelación("cliente"), modelo);
        expect(resultado.nombre).toBe("CLIENTE");
    });

    it("un nombre de relación inexistente lanza una excepción", () => {
        const modelo = new ModeloRelacionalMaterializado();
        expect(() =>
            intérprete.ejecutar(new NombreDeRelación("INEXISTENTE"), modelo)
        ).toThrow(ErrorSemánticoAR);
    });

    it("una selección retorna solo las tuplas que satisfacen la condición de igualdad", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("marca"), simple("grad"))),
            inserción("CERVEZA", fila(1, "Quilmes", 4.9)),
            inserción("CERVEZA", fila(2, "Stella", 5.2)),
            inserción("CERVEZA", fila(3, "Quilmes", 5.0)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<marca='Quilmes'>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
        expect(resultado.tuplas.every(t => t["marca"] === "Quilmes")).toBe(true);
    });

    it("una selección con condición que no satisface ninguna tupla retorna resultado vacío", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("marca"))),
            inserción("CERVEZA", fila(1, "Quilmes")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<marca='Corona'>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(0);
    });

    it("una selección con comparación numérica retorna las tuplas cuyo atributo supera el umbral", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("marca"), simple("grad"))),
            inserción("CERVEZA", fila(1, "Baja", 3.5)),
            inserción("CERVEZA", fila(2, "Media", 4.6)),
            inserción("CERVEZA", fila(3, "Alta", 6.0)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<grad>4.6>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(1);
        expect(resultado.tuplas[0]["marca"]).toBe("Alta");
    });

    it("una selección con condición booleana retorna solo las tuplas con ese valor", () => {
        const modelo = modeloConRelaciones(
            definición(relación("USUARIO", pk("id"), simple("nombre"), simple("activo"))),
            inserción("USUARIO", fila(1, "Ana", true)),
            inserción("USUARIO", fila(2, "Luis", false)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<activo=TRUE>USUARIO"), modelo);
        expect(resultado.tuplas).toHaveLength(1);
        expect(resultado.tuplas[0]["nombre"]).toBe("Ana");
    });

    it("una selección con conjunción retorna solo las tuplas que satisfacen ambas condiciones", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("variedad"), simple("grad"))),
            inserción("CERVEZA", fila(1, "Lager", 4.9)),
            inserción("CERVEZA", fila(2, "Stout", 5.5)),
            inserción("CERVEZA", fila(3, "Lager", 3.8)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<variedad='Lager' ∧ grad>4.0>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(1);
        expect(resultado.tuplas[0]["grad"]).toBe(4.9);
    });

    it("una selección con disyunción retorna las tuplas que satisfacen al menos una condición", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CERVEZA", pk("id"), simple("variedad"))),
            inserción("CERVEZA", fila(1, "Lager")),
            inserción("CERVEZA", fila(2, "Stout")),
            inserción("CERVEZA", fila(3, "IPA")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<variedad='Lager' ∨ variedad='Stout'>CERVEZA"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
    });

    it("una selección con atributo booleano directo retorna las tuplas donde es verdadero", () => {
        const modelo = modeloDesdeMR(`
            USUARIO < id(pk), nombre, activo >
            insertar en USUARIO <
                (1, 'Ana', veRDadero),
                (2, 'Luis', falso),
                (3, 'Pedro', TRUE),
                (4, 'Marta', true)
            >
        `);
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<activo>USUARIO"), modelo);
        expect(resultado.tuplas).toHaveLength(3);
        const nombres = resultado.tuplas.map(t => t["nombre"]);
        expect(nombres).toContain("Ana");
        expect(nombres).toContain("Pedro");
        expect(nombres).toContain("Marta");
        expect(nombres).not.toContain("Luis");
    });

    it("una selección con literal booleano directo retorna todas las tuplas que satisfacen la condición", () => {
        const modelo = modeloConRelaciones(
            definición(relación("USUARIO", pk("id"), simple("nombre"))),
            inserción("USUARIO", fila(1, "Ana")),
            inserción("USUARIO", fila(2, "Luis")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<verdadero>USUARIO"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
    });

    it("una selección con condiciones compuestas filtra correctamente las tuplas", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CLIENTE", pk("id"), simple("edad"), simple("ciudad"), simple("apellido"))),
            inserción("CLIENTE", fila(1, 30, "Buenos Aires", "Pérez")),
            inserción("CLIENTE", fila(2, 18, "Córdoba", "Gómez")),
            inserción("CLIENTE", fila(3, 60, "Rosario", "López")),
            inserción("CLIENTE", fila(4, 40, "Mendoza", "Sanchez")),
            inserción("CLIENTE", fila(5, 22, "Salta", "Sanchez")),
        );
        const resultado = intérprete.ejecutar(
            analizarSintácticamente("σ<(edad>23 ∧ ciudad='Buenos Aires') ∨ edad>50 ∨ apellido='Sanchez'>CLIENTE"),
            modelo,
        );
        expect(resultado.tuplas).toHaveLength(4);
    });

    it("una proyección retorna solo los atributos especificados", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"), simple("edad"))),
            inserción("PERSONA", fila(1, "Ana", 30)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>PERSONA"), modelo);
        expect(resultado.atributos).toEqual(["nombre"]);
        esperarResultadoConsulta(resultado, [{nombre: "Ana"}]);
    });

    it("una proyección no posee tuplas duplicadas", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"), simple("ciudad"))),
            inserción("PERSONA", fila(1, "Ana", "CABA")),
            inserción("PERSONA", fila(2, "Ana", "CABA")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>PERSONA"), modelo);
        esperarResultadoConsulta(resultado, [{nombre: "Ana"}]);
    });

    it("una proyección con atributo inexistente levanta una excepción", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"))),
            inserción("PERSONA", fila(1, "Ana")),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("π<apellido>PERSONA"), modelo)
        ).toThrow(ErrorSemánticoAR);
    });

    it("una proyección sobre una selección retorna el resultado proyectado y filtrado", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"), simple("edad"))),
            inserción("PERSONA", fila(1, "Ana", 30)),
            inserción("PERSONA", fila(2, "Luis", 20)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>σ<edad>25>PERSONA"), modelo);
        expect(resultado.atributos).toEqual(["nombre"]);
        esperarResultadoConsulta(resultado, [{nombre: "Ana"}]);
    });

    it("se puede realizar una proyección sobre una expresión entre paréntesis", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"))),
            inserción("PERSONA", fila(1, "Ana")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>(PERSONA)"), modelo);
        esperarResultadoConsulta(resultado, [{nombre: "Ana"}]);
    });

    it("una proyección con múltiples atributos retorna una relación con las columnas proyectadas", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"), simple("edad"), simple("ciudad"))),
            inserción("PERSONA", fila(1, "Ana", 30, "CABA")),
            inserción("PERSONA", fila(2, "Luis", 20, "Córdoba")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre,edad>PERSONA"), modelo);
        expect(resultado.atributos).toEqual(["nombre", "edad"]);
        esperarResultadoConsulta(resultado, [
            {nombre: "Ana", edad: 30},
            {nombre: "Luis", edad: 20},
        ]);
    });

    it("una selección sobre una proyección que no incluye el atributo referenciado lanza error", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"), simple("edad"))),
            inserción("PERSONA", fila(1, "Ana", 30)),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("σ<edad>25>π<nombre>PERSONA"), modelo)
        ).toThrow("El atributo 'edad' no existe en la relación");
    });

    it("la unión de dos relaciones retorna todas las tuplas sin duplicados", () => {
        const modelo = modeloConRelaciones(
            definición(relación("NARUTO", pk("id"), simple("aldea"))),
            definición(relación("SASUKE", pk("id"), simple("aldea"))),
            inserción("NARUTO", fila(1, "Konoha")),
            inserción("NARUTO", fila(2, "Suna")),
            inserción("SASUKE", fila(3, "Konoha")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("NARUTO ∪ SASUKE"), modelo);
        esperarResultadoConsulta(resultado, [
            {id: 1, aldea: "Konoha"},
            {id: 2, aldea: "Suna"},
            {id: 3, aldea: "Konoha"},
        ]);
    });

    it("la intersección retorna solo las tuplas comunes", () => {
        const modelo = modeloConRelaciones(
            definición(relación("GOKU", pk("id"), simple("nombre"))),
            definición(relación("VEGETA", pk("id"), simple("nombre"))),
            inserción("GOKU", fila(1, "Goku")),
            inserción("GOKU", fila(2, "Gohan")),
            inserción("VEGETA", fila(3, "Goku")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>GOKU ∩ π<nombre>VEGETA"), modelo);
        esperarResultadoConsulta(resultado, [
            {nombre: "Goku"},
        ]);
    });

    it("la resta retorna las tuplas del primero que no están en el segundo", () => {
        const modelo = modeloConRelaciones(
            definición(relación("LUFFY", pk("id"), simple("nombre"))),
            definición(relación("ZORO", pk("id"), simple("nombre"))),
            inserción("LUFFY", fila(1, "Luffy")),
            inserción("LUFFY", fila(2, "Ace")),
            inserción("ZORO", fila(3, "Luffy")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>LUFFY - π<nombre>ZORO"), modelo);
        esperarResultadoConsulta(resultado, [
            {nombre: "Ace"},
        ]);
    });

    it("la resta entre relaciones con mismo esquema retorna las tuplas que no comparte el conjunto izquierdo", () => {
        const modelo = modeloConRelaciones(
            definición(relación("LUFFY", pk("id"), simple("nombre"))),
            definición(relación("ZORO", pk("id"), simple("nombre"))),
            inserción("LUFFY", fila(1, "Luffy")),
            inserción("LUFFY", fila(2, "Ace")),
            inserción("ZORO", fila(1, "Luffy")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("LUFFY - ZORO"), modelo);
        esperarResultadoConsulta(resultado, [
            {id: 2, nombre: "Ace"},
        ]);
    });

    it("la unión de relaciones con grado incompatible lanza error", () => {
        const modelo = modeloConRelaciones(
            definición(relación("NARUTO", pk("id"), simple("aldea"))),
            definición(relación("SASUKE", pk("id"), simple("aldea"), simple("chakra"))),
            inserción("NARUTO", fila(1, "Konoha")),
            inserción("SASUKE", fila(2, "Konoha", 200)),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("NARUTO ∪ SASUKE"), modelo)
        ).toThrow("Unión: las relaciones tienen grado incompatible.");
    });

    it("la intersección de relaciones con grados distintos lanza error", () => {
        const modelo = modeloConRelaciones(
            definición(relación("GOKU", pk("id"), simple("nombre"))),
            definición(relación("VEGETA", pk("id"), simple("nombre"), simple("ki"))),
            inserción("GOKU", fila(1, "Goku")),
            inserción("VEGETA", fila(2, "Vegeta", 9000)),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("GOKU ∩ VEGETA"), modelo)
        ).toThrow("Intersección: las relaciones tienen grado incompatible.");
    });

    it("la resta de relaciones con grado incompatible lanza error", () => {
        const modelo = modeloConRelaciones(
            definición(relación("LUFFY", pk("id"), simple("nombre"))),
            definición(relación("ZORO", pk("id"), simple("nombre"), simple("recompensa"))),
            inserción("LUFFY", fila(1, "Luffy")),
            inserción("ZORO", fila(2, "Zoro", 320000)),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("LUFFY - ZORO"), modelo)
        ).toThrow("Resta: las relaciones tienen grado incompatible.");
    });

    it("la intersección compara valores posicionalmente cuando los nombres de atributo difieren", () => {
        const modelo = modeloConRelaciones(
            definición(relación("ICHIGO", pk("id"), simple("zanpakuto"))),
            definición(relación("RUKIA", pk("id"), simple("bankai"))),
            inserción("ICHIGO", fila(1, "Zangetsu")),
            inserción("ICHIGO", fila(2, "Mugetsu")),
            inserción("RUKIA", fila(3, "Zangetsu")),
            inserción("RUKIA", fila(4, "Sode no Shirayuki")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<zanpakuto>ICHIGO ∩ π<bankai>RUKIA"), modelo);
        esperarResultadoConsulta(resultado, [
            {zanpakuto: "Zangetsu"},
        ]);
    });

    it("dos selecciones unidas respetan la precedencia sobre el operador de conjunto", () => {
        const modelo = modeloConRelaciones(
            definición(relación("GOKU", pk("id"), simple("nombre"), simple("ki"))),
            definición(relación("VEGETA", pk("id"), simple("nombre"), simple("ki"))),
            inserción("GOKU", fila(1, "Goku", 9000)),
            inserción("GOKU", fila(2, "Gohan", 5000)),
            inserción("VEGETA", fila(3, "Vegeta", 8500)),
            inserción("VEGETA", fila(4, "Trunks", 4000)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<ki>8000>GOKU ∪ σ<ki>8000>VEGETA"), modelo);
        esperarResultadoConsulta(resultado, [
            {id: 1, nombre: "Goku", ki: 9000},
            {id: 3, nombre: "Vegeta", ki: 8500},
        ]);
    });

    it("una selección sobre una unión sin paréntesis aplica la selección solo al primer operando", () => {
        const modelo = modeloConRelaciones(
            definición(relación("NARUTO", pk("id"), simple("aldea"))),
            definición(relación("SASUKE", pk("id"), simple("aldea"))),
            inserción("NARUTO", fila(1, "Konoha")),
            inserción("NARUTO", fila(2, "Suna")),
            inserción("SASUKE", fila(3, "Kumo")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<aldea='Konoha'>NARUTO ∪ SASUKE"), modelo);
        esperarResultadoConsulta(resultado, [
            {id: 1, aldea: "Konoha"},
            {id: 3, aldea: "Kumo"},
        ]);
    });

    it("una proyección sobre una intersección entre paréntesis retorna las columnas proyectadas", () => {
        const modelo = modeloConRelaciones(
            definición(relación("LUFFY", pk("id"), simple("nombre"))),
            definición(relación("ZORO", pk("id"), simple("nombre"))),
            inserción("LUFFY", fila(1, "Luffy")),
            inserción("LUFFY", fila(2, "Ace")),
            inserción("ZORO", fila(3, "Luffy")),
            inserción("ZORO", fila(4, "Sabo")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>LUFFY ∩ π<nombre>ZORO"), modelo);
        expect(resultado.atributos).toEqual(["nombre"]);
        esperarResultadoConsulta(resultado, [{nombre: "Luffy"}]);
    });

    it("tres operaciones de conjunto encadenadas se evalúan con asociatividad izquierda", () => {
        const modelo = modeloConRelaciones(
            definición(relación("GOKU", pk("id"), simple("ki"))),
            definición(relación("VEGETA", pk("id"), simple("ki"))),
            definición(relación("GOHAN", pk("id"), simple("ki"))),
            inserción("GOKU", fila(1, 9000)),
            inserción("GOKU", fila(2, 8000)),
            inserción("VEGETA", fila(3, 8000)),
            inserción("VEGETA", fila(4, 7000)),
            inserción("GOHAN", fila(5, 8000)),
            inserción("GOHAN", fila(6, 6000)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<ki>GOKU ∪ π<ki>VEGETA ∩ π<ki>GOHAN"), modelo);
        esperarResultadoConsulta(resultado, [{ki: 8000}]);
    });

    it("la intersección con proyecciones de distinto nombre de atributo conservan el nombre del primer operando", () => {
        const modelo = modeloConRelaciones(
            definición(relación("AKUMA", pk("id"), simple("fruta"))),
            definición(relación("USUARIO", pk("id"), simple("poder"))),
            inserción("AKUMA", fila(1, "Gomu Gomu")),
            inserción("AKUMA", fila(2, "Mera Mera")),
            inserción("AKUMA", fila(3, "Hana Hana")),
            inserción("USUARIO", fila(4, "Gomu Gomu")),
            inserción("USUARIO", fila(5, "Yami Yami")),
            inserción("USUARIO", fila(6, "Hana Hana")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<fruta>AKUMA ∩ π<poder>USUARIO"), modelo);
        expect(resultado.atributos).toEqual(["fruta"]);
        esperarResultadoConsulta(resultado, [
            {fruta: "Gomu Gomu"},
            {fruta: "Hana Hana"},
        ]);
    });
});