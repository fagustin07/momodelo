# Momodelo

Momodelo es una herramienta web interactiva desarrollada para acompañar el aprendizaje de Bases de Datos en la
Universidad Nacional de Quilmes (UNQ). Permite trabajar de forma integrada con los tres primeros tópicos de la materia:

* Modelo Entidad-Relación (MER)
* Modelo Relacional (MR)
* Álgebra Relacional (AR)

La plataforma ofrece validación automática y feedback inmediato para facilitar la comprensión de los conceptos vistos en
clase.

---

## Stack

Momodelo se desarrolla sobre TypeScript Vanilla con Vite como empaquetador, CodeMirror 6 como editor de texo y Vitest
para la escritura de tests.

---

## Arquitectura

La aplicación tiene la particularidad de no tener backend porque toda la lógica del sistema corre en el navegador para
garantizar tener todas las funcionalidades de la herramienta con un mínimo de conexión a internet.

Esta herramienta se organiza en tres módulos utilizando MVC, utilizando objetos y patrones de diseño. Para el MER se usa
una arquitectura típica del patrón de arquitectura mencionado, mientras que para MR y AR también, pero dentro del modelo
se utiliza una parte de la estructura clásica de los compiladores: tokenizador, analizador sintáctico, analizador semántico (solo en MR) e
intérprete. Los módulos se representan como:

### MER: Modelo Entidad-Relación

Es un editor de diagramas que manipula el DOM para modelar el esquema conceptual de un dominio específico.
Permite crear y manipular entidades (fuertes y débiles), atributos (simples, multivaluados
y clave primaria) y relaciones con cardinalidades (0/1 a 1/N). Incluye un inspector de propiedades para cada
elemento, facilitando así la edición de los mismos.

### MR: Modelo Relacional

Lenguaje para la definición y manipulación del esquema lógico. Soporta creación de relaciones con claves primarias,
inserción de tuplas, validación semántica y comparación del MR descripto con el MER creado previamente. La sintaxis de
inserción de datos fue creada con esta herramienta, ya que no existía previo a la herramienta, pero posee una sintaxis
cercana a la utilizada para describir relaciones en MR.

Un ejemplo de cómo describir e insertar datos es:

```
CLIENTE < id(PK), nombre, edad >

insertar en CLIENTE {
    <1, 'Ana', 9>,
    <2, 'Luis', 32>
}
```

### AR: Álgebra Relacional

Lenguaje de consultas algebráicas sobre el Modelo Relacional y los datos que posee, generando un primer acercamiento a
la base matemática de las consultas SQL.

Un ejemplo simple de uso es:

```
σ<edad > 25>
    π<nombre, edad> CLIENTE
```

---

### Requerimientos

Para ejecutar Momodelo localmente es necesario contar con:

* Node.js 20+
* npm 10+

### Comandos útiles

```bash
  npm install

  npm run dev      # http://localhost:5173/momodelo

  npm run test     # vitest
```

### Versión productiva

Momodelo se encuentra desplegado en https://fagustin07.github.io/momodelo 