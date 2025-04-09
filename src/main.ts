// @ts-ignore
import "./style.css";
import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {init} from "./vista.ts";
import {Atributo} from "./modelo/atributo.ts";

init(document.body, [new Entidad("Mi Entidad", [new Atributo("a"), new Atributo("b")], coordenada(10, 10))]);
// Crear un SVG para dibujar relaciones (líneas)
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.style.position = "absolute";
svg.style.top = "0";
svg.style.left = "0";
svg.style.width = "100%";
svg.style.height = "100%";
svg.style.pointerEvents = "none";
document.body.appendChild(svg);
// TODO: Agregar un topbar para poder exportar e importar