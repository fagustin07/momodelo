import {describe, expect, it} from "vitest";
import {IntérpreteAR} from "../../src/ar/intérpreteAR.ts";
import {NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";
import {ModeloRelacionalMaterializado} from "../../src/mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "../../src/ar/resultadoConsulta.ts";
import {ErrorSemánticoAR} from "../../src/servicios/errores.ts";
import {definición, fila, fk, inserción, pk, pkfk, programa, relación, simple} from "../mr/helpers.ts";
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
        expect(resultado.tuplas.every(t => t["marca"] === "Quilmes")).toBeTruthy();
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
            insertar en USUARIO {
                <1, 'Ana', veRDadero>,
                <2, 'Luis', falso>,
                <3, 'Pedro', TRUE>,
                <4, 'Marta', true>
            }
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

    it("una selección con un literal numérico como condición levanta una excepción", () => {
        const modelo = modeloConRelaciones(
            definición(relación("USUARIO", pk("id"), simple("nombre"))),
            inserción("USUARIO", fila(1, "Ana")),
        );

        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("σ<1>USUARIO"), modelo)
        ).toThrow(ErrorSemánticoAR);
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("σ<1>USUARIO"), modelo)
        ).toThrow("La condición de selección debe evaluar a un valor de verdad.");
    });

    it("una selección con un literal de cadena como condición levanta una excepción", () => {
        const modelo = modeloConRelaciones(
            definición(relación("USUARIO", pk("id"), simple("nombre"))),
            inserción("USUARIO", fila(1, "Ana")),
        );

        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("σ<'texto'>USUARIO"), modelo)
        ).toThrow("La condición de selección debe evaluar a un valor de verdad.");
    });

    it("una selección con un atributo no booleano como condición levanta una excepción", () => {
        const modelo = modeloConRelaciones(
            definición(relación("USUARIO", pk("id"), simple("nombre"))),
            inserción("USUARIO", fila(1, "Ana")),
        );

        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("σ<nombre>USUARIO"), modelo)
        ).toThrow("La condición de selección debe evaluar a un valor de verdad.");
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

    it("el producto cartesiano combina todas las tuplas de ambas relaciones", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("idP"), simple("nombre"))),
            definición(relación("PEDIDO", pk("idPed"), simple("producto"), simple("cantidad"))),
            inserción("PERSONA", fila(1, "Ana")),
            inserción("PERSONA", fila(2, "Luis")),
            inserción("PEDIDO", fila(101, "A", 3)),
            inserción("PEDIDO", fila(102, "B", 5)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("PERSONA × PEDIDO"), modelo);
        expect(resultado.tuplas).toHaveLength(4);
        expect(resultado.atributos).toEqual(["idP", "nombre", "idPed", "producto", "cantidad"]);
    });

    it("el producto cartesiano genera el esquema N+M sin duplicar atributos", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("legajo"), simple("nombre"))),
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("ciudad"))),
            inserción("EMPLEADO", fila(1, "Ana")),
            inserción("DEPARTAMENTO", fila(10, "CABA")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("EMPLEADO × DEPARTAMENTO"), modelo);
        expect(resultado.atributos).toEqual(["legajo", "nombre", "codigo", "ciudad"]);
        esperarResultadoConsulta(resultado, [{legajo: 1, nombre: "Ana", codigo: 10, ciudad: "CABA"}]);
    });

    it("el producto cartesiano lanza error si hay atributos con el mismo nombre", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("id"), simple("nombre"))),
            definición(relación("PROYECTO", pk("id"), simple("presupuesto"))),
            inserción("EMPLEADO", fila(1, "Ana")),
            inserción("PROYECTO", fila(10, 100000)),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("EMPLEADO × PROYECTO"), modelo)
        ).toThrow("Ambigüedad en producto cartesiano: el atributo 'id' existe en ambas relaciones.");
    });

    it("las proyecciones pueden usarse para evitar colisión de nombres en el producto cartesiano", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("id"), simple("nombre"))),
            definición(relación("PROYECTO", pk("id"), simple("presupuesto"))),
            inserción("EMPLEADO", fila(1, "Ana")),
            inserción("PROYECTO", fila(10, 100000)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<nombre>EMPLEADO × π<presupuesto>PROYECTO"), modelo);
        expect(resultado.atributos).toEqual(["nombre", "presupuesto"]);
        esperarResultadoConsulta(resultado, [{nombre: "Ana", presupuesto: 100000}]);
    });

    it("la selección sobre un producto cartesiano filtra las combinaciones", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("legajo"), simple("sueldo"))),
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("nombre"))),
            inserción("EMPLEADO", fila(1, 4000)),
            inserción("EMPLEADO", fila(2, 6000)),
            inserción("DEPARTAMENTO", fila(1, "Ventas")),
            inserción("DEPARTAMENTO", fila(2, "IT")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("σ<sueldo>5000>EMPLEADO × DEPARTAMENTO"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
    });

    it("el producto cartesiano y la proyección combinados producen el esquema esperado", () => {
        const modelo = modeloConRelaciones(
            definición(relación("GOKU", pk("id"), simple("ki"))),
            definición(relación("VEGETA", pk("idV"), simple("kiV"))),
            inserción("GOKU", fila(1, 9000)),
            inserción("VEGETA", fila(2, 8000)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("π<ki>GOKU × π<kiV>VEGETA"), modelo);
        expect(resultado.atributos).toEqual(["ki", "kiV"]);
        expect(resultado.tuplas).toHaveLength(1);
        esperarResultadoConsulta(resultado, [{ki: 9000, kiV: 8000}]);
    });

    it("el join condicional combina las tuplas que satisfacen la condición", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("legajo"), simple("nombre"), simple("sueldo"))),
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("ciudad"))),
            inserción("EMPLEADO", fila(1, "Ana", 4000)),
            inserción("EMPLEADO", fila(2, "Luis", 6000)),
            inserción("DEPARTAMENTO", fila(10, "CABA")),
            inserción("DEPARTAMENTO", fila(20, "Córdoba")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("EMPLEADO ⋈<sueldo>5000>DEPARTAMENTO"), modelo);
        expect(resultado.tuplas).toHaveLength(2);
        expect(resultado.atributos).toEqual(["legajo", "nombre", "sueldo", "codigo", "ciudad"]);
        expect(resultado.tuplas.every(t => (t["sueldo"] as number) > 5000)).toBeTruthy();
    });

    it("el join condicional retorna vacío si ninguna tupla satisface la condición", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("legajo"), simple("sueldo"))),
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("ciudad"))),
            inserción("EMPLEADO", fila(1, 3000)),
            inserción("DEPARTAMENTO", fila(10, "CABA")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("EMPLEADO ⋈<sueldo>5000>DEPARTAMENTO"), modelo);
        expect(resultado.tuplas).toHaveLength(0);
    });

    it("el join condicional levanta una excepción si hay atributos con el mismo nombre", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("id"), simple("nombre"))),
            definición(relación("DEPARTAMENTO", pk("id"), simple("ciudad"))),
            inserción("EMPLEADO", fila(1, "Ana")),
            inserción("DEPARTAMENTO", fila(10, "CABA")),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("EMPLEADO ⋈<nombre='Ana'>DEPARTAMENTO"), modelo)
        ).toThrow("Ambigüedad en join condicional: el atributo 'id' existe en ambas relaciones.");
    });

    it("el join condicional con condición compuesta filtra correctamente", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("legajo"), simple("sueldo"), simple("antigüedad"))),
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("nombre"))),
            inserción("EMPLEADO", fila(1, 4000, 3)),
            inserción("EMPLEADO", fila(2, 6000, 6)),
            inserción("EMPLEADO", fila(3, 5000, 1)),
            inserción("DEPARTAMENTO", fila(10, "Ventas")),
            inserción("DEPARTAMENTO", fila(20, "IT")),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("EMPLEADO ⋈<sueldo>3000 ∧ antigüedad>2>DEPARTAMENTO"), modelo);
        expect(resultado.tuplas).toHaveLength(4);
        expect(resultado.atributos).toEqual(["legajo", "sueldo", "antigüedad", "codigo", "nombre"]);
    });

    it("el join condicional por igualdad combina correctamente dos relaciones", () => {
        const modelo = modeloConRelaciones(
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("nombreDepto"), simple("ciudad"))),
            definición(relación("EMPLEADO", pk("legajo"), simple("nombre"), simple("sueldo"), fk("codigo_departamento"))),
            inserción("DEPARTAMENTO", fila(10, "Ventas", "CABA")),
            inserción("DEPARTAMENTO", fila(20, "IT", "Córdoba")),
            inserción("EMPLEADO", fila(1, "Ana", 4000, 10)),
            inserción("EMPLEADO", fila(2, "Luis", 6000, 20)),
            inserción("EMPLEADO", fila(3, "María", 5500, 10)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("EMPLEADO ⋈<codigo_departamento=codigo>DEPARTAMENTO"), modelo);
        expect(resultado.tuplas).toHaveLength(3);
        expect(resultado.atributos).toEqual(["legajo", "nombre", "sueldo", "codigo_departamento", "codigo", "nombreDepto", "ciudad"]);
        esperarResultadoConsulta(resultado, [
            {legajo: 1, nombre: "Ana", sueldo: 4000, codigo_departamento: 10, codigo: 10, nombreDepto: "Ventas", ciudad: "CABA"},
            {legajo: 2, nombre: "Luis", sueldo: 6000, codigo_departamento: 20, codigo: 20, nombreDepto: "IT", ciudad: "Córdoba"},
            {legajo: 3, nombre: "María", sueldo: 5500, codigo_departamento: 10, codigo: 10, nombreDepto: "Ventas", ciudad: "CABA"},
        ]);
    });

    it("el join natural combina correctamente dos relaciones por coincidencia de atributos", () => {
        const modelo = modeloConRelaciones(
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("nombreDepto"), simple("ciudad"))),
            definición(relación("EMPLEADO", pk("legajo"), simple("nombre"), simple("sueldo"), fk("codigo"))),
            inserción("DEPARTAMENTO", fila(10, "Ventas", "CABA")),
            inserción("DEPARTAMENTO", fila(20, "IT", "Córdoba")),
            inserción("EMPLEADO", fila(1, "Ana", 4000, 10)),
            inserción("EMPLEADO", fila(2, "Luis", 6000, 20)),
            inserción("EMPLEADO", fila(3, "María", 5500, 10)),
        );
        const resultado = intérprete.ejecutar(analizarSintácticamente("EMPLEADO * DEPARTAMENTO"), modelo);
        expect(resultado.tuplas).toHaveLength(3);
        expect(resultado.atributos).toEqual(["legajo", "nombre", "sueldo", "codigo", "nombreDepto", "ciudad"]);
        esperarResultadoConsulta(resultado, [
            {codigo: 10, legajo: 1, nombre: "Ana", sueldo: 4000, nombreDepto: "Ventas", ciudad: "CABA"},
            {codigo: 20, legajo: 2, nombre: "Luis", sueldo: 6000, nombreDepto: "IT", ciudad: "Córdoba"},
            {codigo: 10, legajo: 3, nombre: "María", sueldo: 5500, nombreDepto: "Ventas", ciudad: "CABA"},
        ]);
    });

    it("el join natural sin atributos en común levanta una excepción", () => {
        const modelo = modeloConRelaciones(
            definición(relación("EMPLEADO", pk("legajo"), simple("nombre"))),
            definición(relación("DEPARTAMENTO", pk("codigo"), simple("ciudad"))),
            inserción("EMPLEADO", fila(1, "Ana")),
            inserción("DEPARTAMENTO", fila(10, "CABA")),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("EMPLEADO * DEPARTAMENTO"), modelo)
        ).toThrow("Falta ambigüedad en join natural: las relaciones no tienen atributos en común.");
    });

    it("la división retorna las tuplas del dividendo cuyos últimos atributos contienen todos los valores de las tuplas del divisor", () => {
        const modelo = modeloConRelaciones(
            definición(relación("SUMINISTRA", pk("proveedor"), pk("parte"), pk("proyecto"))),
            definición(relación("PROYECTOS", pkfk("proyecto"))),
            inserción("SUMINISTRA", fila("P1", "tornillo", "ProyA")),
            inserción("SUMINISTRA", fila("P1", "tornillo", "ProyB")),
            inserción("SUMINISTRA", fila("P2", "martillo", "ProyA")),
            inserción("PROYECTOS", fila("ProyA")),
            inserción("PROYECTOS", fila("ProyB")),
        );

        intérprete.ejecutar(analizarSintácticamente("SUMINISTRA ÷ PROYECTOS"), modelo);

        const resultado = intérprete.ejecutar(analizarSintácticamente("SUMINISTRA ÷ PROYECTOS"), modelo);
        expect(resultado.atributos).toEqual(["proveedor", "parte"]);
        expect(resultado.tuplas).toHaveLength(1);
        esperarResultadoConsulta(resultado, [
            {proveedor: "P1", parte: "tornillo"},
        ]);
    });

    it("la división retorna vacío cuando ninguna tupla del dividendo cubre todas las del divisor", () => {
        const modelo = modeloConRelaciones(
            definición(relación("SUMINISTRA", pk("proveedor"), pk("parte"), pk("proyecto"))),
            definición(relación("PROYECTOS", pkfk("proyecto"))),
            inserción("SUMINISTRA", fila("P1", "tornillo", "ProyA")),
            inserción("PROYECTOS", fila("ProyA")),
            inserción("PROYECTOS", fila("ProyC")),
        );

        const resultado = intérprete.ejecutar(analizarSintácticamente("SUMINISTRA ÷ PROYECTOS"), modelo);
        expect(resultado.atributos).toEqual(["proveedor", "parte"]);
        expect(resultado.tuplas).toHaveLength(0);
    });

    it("la división con divisor de igual o mayor grado que el dividendo levanta una excepción", () => {
        const modelo = modeloConRelaciones(
            definición(relación("R", pk("a"), pk("b"))),
            definición(relación("S", pk("c"), pk("d"))),
            inserción("R", fila(1, 2)),
            inserción("S", fila(3, 4)),
        );
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("R ÷ S"), modelo)
        ).toThrow(ErrorSemánticoAR);
        expect(() =>
            intérprete.ejecutar(analizarSintácticamente("R ÷ S"), modelo)
        ).toThrow("División: el esquema del divisor no puede tener el mismo/mayor grado que el esquema del dividendo.");
    });

    it("la división con divisor de múltiples atributos empareja posicionalmente los últimos del dividendo", () => {
        const modelo = modeloConRelaciones(
            definición(relación("SUMINISTRA", pk("proveedor"), pk("parte"), pk("proyecto"), pk("ciudad"))),
            definición(relación("PROYECTOS_CIUDADES", pkfk("proyecto"), pkfk("ciudad"))),
            inserción("SUMINISTRA", fila("P1", "tornillo", "ProyA", "CABA")),
            inserción("SUMINISTRA", fila("P1", "tornillo", "ProyB", "Rosario")),
            inserción("SUMINISTRA", fila("P2", "martillo", "ProyA", "CABA")),
            inserción("PROYECTOS_CIUDADES", fila("ProyA", "CABA")),
            inserción("PROYECTOS_CIUDADES", fila("ProyB", "Rosario")),
        );

        const resultado = intérprete.ejecutar(
            analizarSintácticamente("SUMINISTRA ÷ PROYECTOS_CIUDADES"), modelo,
        );
        expect(resultado.atributos).toEqual(["proveedor", "parte"]);
        expect(resultado.tuplas).toHaveLength(1);
        esperarResultadoConsulta(resultado, [
            {proveedor: "P1", parte: "tornillo"},
        ]);
    });

    it("la división puede combinarse con otros operadores", () => {
        const modelo = modeloConRelaciones(
            definición(relación("SUMINISTRA", pk("proveedor"), pk("parte"), pk("proyecto"))),
            definición(relación("PROYECTOS", pkfk("proyecto"))),
            inserción("SUMINISTRA", fila("P1", "tornillo", "ProyA")),
            inserción("SUMINISTRA", fila("P1", "tornillo", "ProyB")),
            inserción("SUMINISTRA", fila("P2", "tornillo", "ProyA")),
            inserción("SUMINISTRA", fila("P2", "tornillo", "ProyB")),
            inserción("PROYECTOS", fila("ProyA")),
            inserción("PROYECTOS", fila("ProyB")),
        );

        const resultado = intérprete.ejecutar(
            analizarSintácticamente("σ<proveedor='P1'>SUMINISTRA ÷ PROYECTOS"), modelo,
        );
        expect(resultado.atributos).toEqual(["proveedor", "parte"]);
        expect(resultado.tuplas).toHaveLength(1);
        esperarResultadoConsulta(resultado, [
            {proveedor: "P1", parte: "tornillo"},
        ]);
    });
});