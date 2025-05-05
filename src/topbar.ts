import {Modelador} from "./servicios/modelador.ts";
import {createElement} from "./vista/dom/createElement.ts";
import {Exportador} from "./servicios/exportador.ts";
import {Importador} from "./servicios/importador.ts";

export function generarTopbar(modelador: Modelador, elementoRaiz: HTMLElement) {
    const inputJson = createElement("input", {
        type: "file",
        accept: ".json",
        style: { display: "none" },
        onchange: async (event: Event) => {
            const input = event.target as HTMLInputElement;
            if (!input.files?.length) return;

            const file = input.files[0];
            const text = await file.text();
            const json = JSON.parse(text);

            const { entidades, relaciones } = new Importador().importar(json);
            modelador.reemplazarModelo(entidades, relaciones, elementoRaiz);

            input.value = "";
        }
    });

    return createElement("div", {
        id: "topbar",
        style: {
            position: "fixed",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fafafa",
            border: "1px solid #ccc",
            borderRadius: "0 0 8px 8px",
            padding: "8px 16px",
            zIndex: "9999",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            display: "flex",
            gap: "12px"
        }
    }, [
        createElement("button", {
            textContent: "Exportar",
            onclick: () => {
                const json = new Exportador().exportar(modelador);
                const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                // Generar timestamp formateado
                const timestamp = new Date().toISOString()
                    .replace(/T/, "_")
                    .replace(/:/g, "-")
                    .replace(/\..+/, "");

                const nombreSugerido = `MER_${timestamp}`;
                const nombreSinExtension = prompt("Elegí el nombre del archivo:", nombreSugerido);

                if (!nombreSinExtension) return;

                const a = document.createElement("a");
                a.href = url;
                a.download = `${nombreSinExtension}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        }),

        createElement("button", {
            textContent: "Importar",
            onclick: () => inputJson.click()
        }),
        inputJson
    ]);
}
