import {describe, expect, it} from "vitest";
import {esperarAnálisisSintácticoAR, esperarErrorSintácticoAR} from "./helpers.ts";
import {ExpresiónPrograma, ExpresiónProyección,ExpresiónRenombre, ExpresiónSelección, NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";
import {Intersección, Resta, Unión} from "../../src/ar/modeloSintactico/operadorDeConjuntos.ts";
import {División} from "../../src/ar/modeloSintactico/operadorDeDivisión.ts";
import {JoinCondicional, JoinNatural, ProductoCartesiano} from "../../src/ar/modeloSintactico/operadorDeCombinación.ts";
import {analizarSintácticamente} from "../../src/ar/parserAR.ts";

describe("[Álgebra Relacional] Parser AR", () => {
    it("un nombre de relación solo se parsea como NombreDeRelación con ese nombre", () => {
        esperarAnálisisSintácticoAR("PERSONA", NombreDeRelación, {nombre: "PERSONA"});
    });

    it("los espacios alrededor del nombre no afectan el resultado", () => {
        esperarAnálisisSintácticoAR("  CLIENTE  ", NombreDeRelación, {nombre: "CLIENTE"});
    });

    it("una consulta vacía lanza una excepción", () => {
        esperarErrorSintácticoAR("", "La consulta está vacía.");
    });

    it("se levanta una excepción cuando hay dos nombres sin operadores", () => {
        esperarErrorSintácticoAR(
            "PERSONA PEDIDO",
            "Se esperaba fin de consulta pero se encontró 'PEDIDO'.",
        );
    });

    it("un carácter desconocido levanta una excepción", () => {
        esperarErrorSintácticoAR("@", "Se esperaba una expresión pero se encontró '@'.");
    });

    it("una selección con comparación de igualdad es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<marca='Quilmes'>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {nombre: "marca"},
                op: "=",
                der: {valor: "Quilmes"},
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con comparación numérica mayor-que es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<grad>4.6>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {nombre: "grad"},
                op: ">",
                der: {valor: 4.6},
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con comparación de atributo contra atributo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<precioMin<precioMax>Producto", ExpresiónSelección, {
            condición: {
                izq: {nombre: "precioMin"},
                op: "<",
                der: {nombre: "precioMax"},
            },
            subexpr: {nombre: "Producto"},
        });
    });

    it("una selección con comparación booleana es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<activo=TRUE>Usuario", ExpresiónSelección, {
            condición: {
                izq: {nombre: "activo"},
                op: "=",
                der: {valor: true},
            },
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con atributo booleano directo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<activo>Usuario", ExpresiónSelección, {
            condición: {operando: {nombre: "activo"}},
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con literal booleano directo es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<TRUE>Usuario", ExpresiónSelección, {
            condición: {operando: {valor: true}},
            subexpr: {nombre: "Usuario"},
        });
    });

    it("una selección con condición compuesta por intersección es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<variedad='Lager' ∧ grad>4.6>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Lager"},
                },
                der: {
                    izq: {nombre: "grad"},
                    op: ">",
                    der: {valor: 4.6},
                },
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("una selección con condición compuesta por disyunción es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<variedad='Lager' ∨ variedad='Stout'>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Lager"},
                },
                der: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Stout"},
                },
            },
            subexpr: {nombre: "Cerveza"},
        });
    });

    it("se pueden anidar selecciones", () => {
        esperarAnálisisSintácticoAR("σ<grad>4.6>σ<variedad='Lager'>Cerveza", ExpresiónSelección, {
            condición: {
                izq: {nombre: "grad"},
                op: ">",
                der: {valor: 4.6},
            },
            subexpr: {
                condición: {
                    izq: {nombre: "variedad"},
                    op: "=",
                    der: {valor: "Lager"},
                },
                subexpr: {nombre: "Cerveza"},
            },
        });
    });

    it("una selección sin condición informa que no tiene la estructura correcta", () => {
        esperarErrorSintácticoAR("σ<>Cerveza", "σ: se esperaba '<condición>expresión'.");
    });

    it("una selección sin cierre de condición levanta una excepción que no tiene la estructura correcta", () => {
        esperarErrorSintácticoAR(
            "σ<marca='Quilmes'Cerveza",
            "σ: se esperaba '<condición>expresión'.",
        );
    });

    it("la condición de una selección puede escribirse entre paréntesis", () => {
        esperarAnálisisSintácticoAR("σ<(edad>23)>CLIENTE", ExpresiónSelección, {
            condición: {
                izq: {nombre: "edad"},
                op: ">",
                der: {valor: 23},
            },
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("se pueden reconocer conjunciones en una condición de selección", () => {
        esperarAnálisisSintácticoAR("σ<(a=1 ∧ b=2)>CLIENTE", ExpresiónSelección, {
            condición: {
                izq: {izq: {nombre: "a"}, op: "=", der: {valor: 1}},
                der: {izq: {nombre: "b"}, op: "=", der: {valor: 2}},
            },
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("una condición con paréntesis al inicio y disyunciones subsiguientes asocia a izquierda", () => {
        esperarAnálisisSintácticoAR(
            "σ<(edad>23 ∧ ciudad='Buenos Aires') ∨ edad>50 ∨ apellido='Sanchez'>CLIENTE",
            ExpresiónSelección,
            {
                condición: {
                    izq: {
                        izq: {
                            izq: {izq: {nombre: "edad"}, op: ">", der: {valor: 23}},
                            der: {izq: {nombre: "ciudad"}, op: "=", der: {valor: "Buenos Aires"}},
                        },
                        der: {izq: {nombre: "edad"}, op: ">", der: {valor: 50}},
                    },
                    der: {izq: {nombre: "apellido"}, op: "=", der: {valor: "Sanchez"}},
                },
                subexpr: {nombre: "CLIENTE"},
            },
        );
    });

    it("se puede combinar una disyunción entre conjunciones con paréntesis", () => {
        esperarAnálisisSintácticoAR(
            "σ<edad>23 ∧ (ciudad='Buenos Aires' ∨ edad>50) ∧ apellido='Sánchez'>CLIENTE",
            ExpresiónSelección,
            {
                condición: {
                    izq: {
                        izq: {izq: {nombre: "edad"}, op: ">", der: {valor: 23}},
                        der: {
                            izq: {izq: {nombre: "ciudad"}, op: "=", der: {valor: "Buenos Aires"}},
                            der: {izq: {nombre: "edad"}, op: ">", der: {valor: 50}},
                        },
                    },
                    der: {izq: {nombre: "apellido"}, op: "=", der: {valor: "Sánchez"}},
                },
                subexpr: {nombre: "CLIENTE"},
            },
        );
    });

    it("se pueden generar condiciones complejas", () => {
        esperarAnálisisSintácticoAR("σ<(a=1 ∨ b=2) ∧ (c=3 ∨ d=4)>CLIENTE", ExpresiónSelección, {
            condición: {
                izq: {
                    izq: {izq: {nombre: "a"}, op: "=", der: {valor: 1}},
                    der: {izq: {nombre: "b"}, op: "=", der: {valor: 2}},
                },
                der: {
                    izq: {izq: {nombre: "c"}, op: "=", der: {valor: 3}},
                    der: {izq: {nombre: "d"}, op: "=", der: {valor: 4}},
                },
            },
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("se puede reconocer una proyección", () => {
        esperarAnálisisSintácticoAR("π<nombre>PERSONA", ExpresiónProyección, {
            atributos: ["nombre"],
            subexpr: {nombre: "PERSONA"},
        });
    });

    it("se puede reconocer una proyección con múltiples atributos", () => {
        esperarAnálisisSintácticoAR("π<nombre,edad,ciudad>PERSONA", ExpresiónProyección, {
            atributos: ["nombre", "edad", "ciudad"],
            subexpr: {nombre: "PERSONA"},
        });
    });

    it("se reconocen selecciones y proyecciones combinadas en una consulta", () => {
        esperarAnálisisSintácticoAR("π<nombre>σ<edad>30>PERSONA", ExpresiónProyección, {
            atributos: ["nombre"],
            subexpr: {
                condición: {izq: {nombre: "edad"}, op: ">", der: {valor: 30}},
                subexpr: {nombre: "PERSONA"},
            },
        });
    });

    it("una proyección malformada levanta una excepción", () => {
        esperarErrorSintácticoAR("π<PERSONA", "π: se esperaba '<listaDeAtributos>expresión'.");
    });

    it("una proyección sin cierre levanta una excepción", () => {
        esperarErrorSintácticoAR("π<nombre PERSONA", "π: se esperaba '<listaDeAtributos>expresión'.");
    });

    it("una expresión entre paréntesis parsea correctamente", () => {
        esperarAnálisisSintácticoAR("(CLIENTE)", NombreDeRelación, {nombre: "CLIENTE"});
    });

    it("se reconocen expresiones entre paréntesis", () => {
        esperarAnálisisSintácticoAR("( CLIENTE )", NombreDeRelación, {nombre: "CLIENTE"});
    });

    it("se reconoce una selección aplicada a una expresión entre paréntesis", () => {
        esperarAnálisisSintácticoAR("σ<edad>30>(CLIENTE)", ExpresiónSelección, {
            condición: {izq: {nombre: "edad"}, op: ">", der: {valor: 30}},
            subexpr: {nombre: "CLIENTE"},
        });
    });

    it("una unión de dos relaciones es una consulta válida", () => {
        esperarAnálisisSintácticoAR("NARUTO ∪ SASUKE", Unión, {
            izq: {nombre: "NARUTO"},
            der: {nombre: "SASUKE"},
        });
    });

    it("una intersección de dos relaciones es una consulta válida", () => {
        esperarAnálisisSintácticoAR("GOKU ∩ VEGETA", Intersección, {
            izq: {nombre: "GOKU"},
            der: {nombre: "VEGETA"},
        });
    });

    it("una resta de dos relaciones es una consulta válida", () => {
        esperarAnálisisSintácticoAR("LUFFY - ZORO", Resta, {
            izq: {nombre: "LUFFY"},
            der: {nombre: "ZORO"},
        });
    });

    it("las operaciones de conjunto encadenan hacia la izquierda", () => {
        esperarAnálisisSintácticoAR("ICHIGO ∪ RUKIA ∩ RENJI", Intersección, {
            izq: {izq: {nombre: "ICHIGO"}, der: {nombre: "RUKIA"}},
            der: {nombre: "RENJI"},
        });
    });

    it("una selección compuesta con unión es una consulta válida", () => {
        esperarAnálisisSintácticoAR("σ<chakra>100>NARUTO ∪ σ<chakra>100>SASUKE", Unión, {
            izq: {
                condición: {izq: {nombre: "chakra"}, op: ">", der: {valor: 100}},
                subexpr: {nombre: "NARUTO"},
            },
            der: {
                condición: {izq: {nombre: "chakra"}, op: ">", der: {valor: 100}},
                subexpr: {nombre: "SASUKE"},
            },
        });
    });

    it("los paréntesis agrupan operaciones de conjunto", () => {
        esperarAnálisisSintácticoAR("GOKU ∪ (VEGETA ∩ GOHAN)", Unión, {
            izq: {nombre: "GOKU"},
            der: {izq: {nombre: "VEGETA"}, der: {nombre: "GOHAN"}},
        });
    });

    it("la selección tiene precedencia sobre los operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("σ<ki>9000>GOKU ∪ VEGETA", Unión, {
            izq: {
                condición: {izq: {nombre: "ki"}, op: ">", der: {valor: 9000}},
                subexpr: {nombre: "GOKU"},
            },
            der: {nombre: "VEGETA"},
        });
    });

    it("la proyección tiene precedencia sobre los operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("π<aldea>NARUTO ∩ SASUKE", Intersección, {
            izq: {
                atributos: ["aldea"],
                subexpr: {nombre: "NARUTO"},
            },
            der: {nombre: "SASUKE"},
        });
    });

    it("los operadores unarios tienen precedencia sobre la resta", () => {
        esperarAnálisisSintácticoAR("σ<recompensa>1000000>LUFFY - π<recompensa>ZORO", Resta, {
            izq: {
                condición: {izq: {nombre: "recompensa"}, op: ">", der: {valor: 1000000}},
                subexpr: {nombre: "LUFFY"},
            },
            der: {
                atributos: ["recompensa"],
                subexpr: {nombre: "ZORO"},
            },
        });
    });

    it("tres operaciones de conjunto se asocian hacia la izquierda", () => {
        esperarAnálisisSintácticoAR("GOKU ∪ VEGETA ∩ GOHAN - PICCOLO", Resta, {
            izq: {
                izq: {izq: {nombre: "GOKU"}, der: {nombre: "VEGETA"}},
                der: {nombre: "GOHAN"},
            },
            der: {nombre: "PICCOLO"},
        });
    });

    it("una selección con conjunción y una proyección anidada se combinan con unión", () => {
        esperarAnálisisSintácticoAR("σ<ki>8000 ∧ chakra>500>NARUTO ∪ π<rango>σ<ninjutsu>100>SASUKE", Unión, {
            izq: {
                condición: {
                    izq: {izq: {nombre: "ki"}, op: ">", der: {valor: 8000}},
                    der: {izq: {nombre: "chakra"}, op: ">", der: {valor: 500}},
                },
                subexpr: {nombre: "NARUTO"},
            },
            der: {
                atributos: ["rango"],
                subexpr: {
                    condición: {izq: {nombre: "ninjutsu"}, op: ">", der: {valor: 100}},
                    subexpr: {nombre: "SASUKE"},
                },
            },
        });
    });

    it("una combinación compleja de proyecciones, uniones e intersecciones respeta paréntesis y precedencia", () => {
        esperarAnálisisSintácticoAR("π<fruta>LUFFY ∪ π<espada>ZORO ∩ (π<clima>NAMI ∪ π<medicina>σ<recompensa='300'>CHOPPER)", Intersección, {
            izq: {
                izq: {
                    atributos: ["fruta"],
                    subexpr: {nombre: "LUFFY"},
                },
                der: {
                    atributos: ["espada"],
                    subexpr: {nombre: "ZORO"},
                },
            },
            der: {
                izq: {
                    atributos: ["clima"],
                    subexpr: {nombre: "NAMI"},
                },
                der: {
                    atributos: ["medicina"],
                    subexpr: {
                        condición: {izq: {nombre: "recompensa"}, op: "=", der: {valor: "300"}},
                        subexpr: {nombre: "CHOPPER"},
                    },
                },
            },
        });
    });

    it("una selección puede aplicarse a una unión agrupada entre paréntesis", () => {
        esperarAnálisisSintácticoAR("σ<ki>9000>(GOKU ∪ VEGETA)", ExpresiónSelección, {
            condición: {izq: {nombre: "ki"}, op: ">", der: {valor: 9000}},
            subexpr: {
                izq: {nombre: "GOKU"},
                der: {nombre: "VEGETA"},
            },
        });
    });

    it("una proyección puede aplicarse a una intersección agrupada entre paréntesis", () => {
        esperarAnálisisSintácticoAR("π<aldea>(NARUTO ∩ SASUKE)", ExpresiónProyección, {
            atributos: ["aldea"],
            subexpr: {
                izq: {nombre: "NARUTO"},
                der: {nombre: "SASUKE"},
            },
        });
    });

    it("un producto cartesiano de dos relaciones es una consulta válida", () => {
        esperarAnálisisSintácticoAR("PERSONA × PEDIDO", ProductoCartesiano, {
            izq: {nombre: "PERSONA"},
            der: {nombre: "PEDIDO"},
        });
    });

    it("el producto cartesiano asocia hacia la izquierda", () => {
        esperarAnálisisSintácticoAR("CLIENTE × PEDIDO × FACTURA", ProductoCartesiano, {
            izq: {izq: {nombre: "CLIENTE"}, der: {nombre: "PEDIDO"}},
            der: {nombre: "FACTURA"},
        });
    });

    it("el producto cartesiano levanta una excepción si no recibo dos expresiones", () => {
        esperarErrorSintácticoAR("×PERSONA", "×: se esperaba 'expresión × expresión'.");
    });

    it("la selección tiene precedencia sobre el producto cartesiano", () => {
        esperarAnálisisSintácticoAR("σ<ki>9000>GOKU × VEGETA", ProductoCartesiano, {
            izq: {
                condición: {izq: {nombre: "ki"}, op: ">", der: {valor: 9000}},
                subexpr: {nombre: "GOKU"},
            },
            der: {nombre: "VEGETA"},
        });
    });

    it("la proyección tiene precedencia sobre el producto cartesiano", () => {
        esperarAnálisisSintácticoAR("π<aldea>NARUTO × SASUKE", ProductoCartesiano, {
            izq: {
                atributos: ["aldea"],
                subexpr: {nombre: "NARUTO"},
            },
            der: {nombre: "SASUKE"},
        });
    });

    it("el producto cartesiano tiene precedencia sobre la unión", () => {
        esperarAnálisisSintácticoAR("CLIENTE × PEDIDO ∪ FACTURA", Unión, {
            izq: {izq: {nombre: "CLIENTE"}, der: {nombre: "PEDIDO"}},
            der: {nombre: "FACTURA"},
        });
    });

    it("el producto cartesiano tiene precedencia sobre la intersección", () => {
        esperarAnálisisSintácticoAR("CLIENTE × PEDIDO ∩ FACTURA", Intersección, {
            izq: {izq: {nombre: "CLIENTE"}, der: {nombre: "PEDIDO"}},
            der: {nombre: "FACTURA"},
        });
    });

    it("el producto cartesiano tiene precedencia sobre la resta", () => {
        esperarAnálisisSintácticoAR("CLIENTE × PEDIDO - FACTURA", Resta, {
            izq: {izq: {nombre: "CLIENTE"}, der: {nombre: "PEDIDO"}},
            der: {nombre: "FACTURA"},
        });
    });

    it("el producto cartesiano y los operadores de conjunto se combinan con precedencia correcta", () => {
        esperarAnálisisSintácticoAR("σ<edad>30>CLIENTE × π<producto>PEDIDO ∪ FACTURA", Unión, {
            izq: {
                izq: {
                    condición: {izq: {nombre: "edad"}, op: ">", der: {valor: 30}},
                    subexpr: {nombre: "CLIENTE"},
                },
                der: {
                    atributos: ["producto"],
                    subexpr: {nombre: "PEDIDO"},
                },
            },
            der: {nombre: "FACTURA"},
        });
    });

    it("un join condicional es una consulta válida", () => {
        esperarAnálisisSintácticoAR("EMPLEADO ⋈<sueldo>5000>DEPARTAMENTO", JoinCondicional, {
            izq: {nombre: "EMPLEADO"},
            condición: {izq: {nombre: "sueldo"}, op: ">", der: {valor: 5000}},
            der: {nombre: "DEPARTAMENTO"},
        });
    });

    it("el join condicional con condición de igualdad es una consulta válida", () => {
        esperarAnálisisSintácticoAR("CLIENTE ⋈<ciudad='CABA'>PEDIDO", JoinCondicional, {
            izq: {nombre: "CLIENTE"},
            condición: {izq: {nombre: "ciudad"}, op: "=", der: {valor: "CABA"}},
            der: {nombre: "PEDIDO"},
        });
    });

    it("el join condicional con condición compuesta es una consulta válida", () => {
        esperarAnálisisSintácticoAR("EMPLEADO ⋈<sueldo>3000 ∧ antigüedad>5>DEPARTAMENTO", JoinCondicional, {
            izq: {nombre: "EMPLEADO"},
            condición: {
                izq: {izq: {nombre: "sueldo"}, op: ">", der: {valor: 3000}},
                der: {izq: {nombre: "antigüedad"}, op: ">", der: {valor: 5}},
            },
            der: {nombre: "DEPARTAMENTO"},
        });
    });

    it("el join condicional malformado levanta una excepción", () => {
        esperarErrorSintácticoAR("⋈<sueldo>5000>", "⋈: se esperaba 'expresión ⋈<condición> expresión'.");
    });

    it("el join condicional y el producto cartesiano asocian hacia la izquierda con mismo nivel de precedencia", () => {
        esperarAnálisisSintácticoAR("EMPLEADO ⋈<sueldo>5000>DEPARTAMENTO × PROYECTO", ProductoCartesiano, {
            izq: {
                izq: {nombre: "EMPLEADO"},
                condición: {izq: {nombre: "sueldo"}, op: ">", der: {valor: 5000}},
                der: {nombre: "DEPARTAMENTO"},
            },
            der: {nombre: "PROYECTO"},
        });
    });

    it("la selección tiene precedencia sobre el join condicional", () => {
        esperarAnálisisSintácticoAR("σ<sueldo>3000>EMPLEADO ⋈<antigüedad>2>DEPARTAMENTO", JoinCondicional, {
            izq: {
                condición: {izq: {nombre: "sueldo"}, op: ">", der: {valor: 3000}},
                subexpr: {nombre: "EMPLEADO"},
            },
            condición: {izq: {nombre: "antigüedad"}, op: ">", der: {valor: 2}},
            der: {nombre: "DEPARTAMENTO"},
        });
    });

    it("el join condicional por clave foránea es una consulta válida", () => {
        esperarAnálisisSintácticoAR("EMPLEADO ⋈<codigo_departamento=codigo>DEPARTAMENTO", JoinCondicional, {
            izq: {nombre: "EMPLEADO"},
            condición: {izq: {nombre: "codigo_departamento"}, op: "=", der: {nombre: "codigo"}},
            der: {nombre: "DEPARTAMENTO"},
        });
    });

    it("el join condicional tiene precedencia sobre los operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("EMPLEADO ⋈<sueldo>5000>DEPARTAMENTO ∪ PROYECTO", Unión, {
            izq: {
                izq: {nombre: "EMPLEADO"},
                condición: {izq: {nombre: "sueldo"}, op: ">", der: {valor: 5000}},
                der: {nombre: "DEPARTAMENTO"},
            },
            der: {nombre: "PROYECTO"},
        });
    });

    it("el join natural es un operador binario", () => {
        esperarAnálisisSintácticoAR("EMPLEADO * DEPARTAMENTO", JoinNatural, {
            izq: {nombre: "EMPLEADO"},
            der: {nombre: "DEPARTAMENTO"},
        });
    });

    it("el join natural sin una expresión levanta una excepción", () => {
        esperarErrorSintácticoAR("*", "*: se esperaba 'expresión * expresión'.");
    });

    it("el join natural asocia hacia la izquierda", () => {
        esperarAnálisisSintácticoAR("EMPLEADO * DEPARTAMENTO * PROYECTO", JoinNatural, {
            izq: {
                izq: {nombre: "EMPLEADO"},
                der: {nombre: "DEPARTAMENTO"},
            },
            der: {nombre: "PROYECTO"},
        });
    });

    it("el join natural tiene precedencia sobre los operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("EMPLEADO * DEPARTAMENTO ∪ PROYECTO", Unión, {
            izq: {
                izq: {nombre: "EMPLEADO"},
                der: {nombre: "DEPARTAMENTO"},
            },
            der: {nombre: "PROYECTO"},
        });
    });

    it("una división es una operación binaria", () => {
        esperarAnálisisSintácticoAR("SUMINISTRA ÷ PROYECTOS", División, {
            izq: {nombre: "SUMINISTRA"},
            der: {nombre: "PROYECTOS"},
        });
    });

    it("la división se asocia hacia la izquierda con otros operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("SUMINISTRA ÷ PROYECTOS ∪ EMPLEADO", Unión, {
            izq: {
                izq: {nombre: "SUMINISTRA"},
                der: {nombre: "PROYECTOS"},
            },
            der: {nombre: "EMPLEADO"},
        });
    });

    it("la división tiene precedencia sobre los operadores de conjunto", () => {
        esperarAnálisisSintácticoAR("σ<proveedor='P1'>SUMINISTRA ÷ PROYECTOS", División, {
            izq: {
                condición: {izq: {nombre: "proveedor"}, op: "=", der: {valor: "P1"}},
                subexpr: {nombre: "SUMINISTRA"},
            },
            der: {nombre: "PROYECTOS"},
        });
    });

    it("el renombre por nombre y el posicional producen el árbol sintáctico correspondiente", () => {
        esperarAnálisisSintácticoAR("ρ<bodega ← marca>Vino", ExpresiónRenombre, {
            pares: [{nuevo: "bodega", viejo: "marca"}],
            subexpr: {nombre: "Vino"},
        });
        esperarAnálisisSintácticoAR("ρ<a, b, c>R", ExpresiónRenombre, {
            nombres: ["a", "b", "c"],
            subexpr: {nombre: "R"},
        });
    });

    it("el renombre compuesto con otros operadores respeta la precedencia y el anidamiento", () => {
        esperarAnálisisSintácticoAR("R × ρ<a ← x>S", ProductoCartesiano, {
            izq: {nombre: "R"},
            der: {
                pares: [{nuevo: "a", viejo: "x"}],
                subexpr: {nombre: "S"},
            },
        });
        esperarAnálisisSintácticoAR("π<bodega>(ρ<bodega ← marca>Vino)", ExpresiónProyección, {
            atributos: ["bodega"],
            subexpr: {
                pares: [{nuevo: "bodega", viejo: "marca"}],
                subexpr: {nombre: "Vino"},
            },
        });
    });

    it("la validación de aridad del renombre posicional es semántica, no sintáctica", () => {
        expect(() => analizarSintácticamente("ρ<a, b>R")).not.toThrow();
    });

    it("un renombre sin argumentos lanza error de sintaxis", () => {
        esperarErrorSintácticoAR("ρ", "ρ: se esperaba '<mapeo>expresión'.");
    });

    it("un renombre con la flecha pero sin nombre a su izquierda lanza error de sintaxis", () => {
        esperarErrorSintácticoAR("ρ<← x>R", "ρ: se esperaba '<mapeo>expresión'.");
    });

    it("asignaciones seguidas de una expresión final producen el programa con las subconsultas y la expresión", () => {
        const expr = analizarSintácticamente("PIRATA ← SHANKS MARINO ← AKAINU σ<recompensa = rango>(PIRATA × MARINO)");
        expect(expr).toBeInstanceOf(ExpresiónPrograma);
        const prog = expr as ExpresiónPrograma;
        expect(prog.asignaciones).toHaveLength(2);
        expect(prog.asignaciones[0].nombre).toBe("PIRATA");
        expect(prog.expresiónFinal).toBeInstanceOf(ExpresiónSelección);
    });

    it("sin asignaciones previas la expresión no se envuelve en un programa", () => {
        const expr = analizarSintácticamente("SHANKS");
        expect(expr).toBeInstanceOf(NombreDeRelación);
    });

    it("una flecha sin nombre a la izquierda al inicio del programa lanza error de sintaxis", () => {
        esperarErrorSintácticoAR("← SHANKS \n SHANKS", "←: ¿quisiste definir una subconsulta (nombre ← expresión) o renombrar un atributo (ρ<nuevo ← viejo>(...))?");
    });

    it("una flecha sola sin expresión ni nombre lanza error de sintaxis", () => {
        esperarErrorSintácticoAR("←", "←: ¿quisiste definir una subconsulta (nombre ← expresión) o renombrar un atributo (ρ<nuevo ← viejo>(...))?");
    });
});