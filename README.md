# Hipoglucemia RN · Hospital de Montilla

Guía interactiva y calculadora del **Protocolo de hipoglucemia en recién nacidos** del Servicio de Pediatría del Hospital de Montilla (Edición 01, 06/10/2026).

Aplicación web estática (HTML + CSS + JavaScript), **sin dependencias ni proceso de compilación**. Funciona en móvil y en ordenador, se puede instalar como app y funciona sin conexión una vez abierta.

## Qué incluye

- **Guía paso a paso** del algoritmo de actuación ante la hipoglucemia precoz (apartado 6), con dosis calculadas por peso, avisos (recordatorio de confirmación en sangre completa, criterios de paso a tratamiento IV del Anexo 2, contraindicaciones del glucagón…) y temporizador para los controles.
- **Hipoglucemia persistente (≥72 h)**: muestra crítica (Anexo 3) y tratamiento IV.
- **Calculadoras**: dosis rápidas por peso, aportes de glucosa (mg/kg/min), ritmo para un aporte deseado, ajuste de la perfusión según la glucemia (Tabla 4), tabla de aportes (Tabla 5) y concentración máxima por acceso vascular (Tabla 6).
- **Protocolo completo** con buscador.

Ningún dato introducido sale del dispositivo ni se guarda.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `hipoglucemia-rn`).
2. Sube el contenido de esta carpeta a la raíz del repositorio:

   ```bash
   git init
   git add .
   git commit -m "Primera versión"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/hipoglucemia-rn.git
   git push -u origin main
   ```

3. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)` → **Save**.
4. En uno o dos minutos estará disponible en `https://TU_USUARIO.github.io/hipoglucemia-rn/`.

## Actualizar

Tras modificar cualquier archivo, sube el número de `VERSION` en `sw.js` (por ejemplo `hipo-rn-v2`) antes de publicar, para que los móviles que ya la tienen instalada descarguen la versión nueva.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Estilos (claro/oscuro, móvil/escritorio) |
| `app.js` | Lógica del algoritmo, calculadoras y texto del protocolo |
| `sw.js` | Funcionamiento sin conexión |
| `manifest.webmanifest`, `img/` | Instalación como app e iconos |

Los valores del protocolo (umbrales, dosis, límites) están reunidos al principio de `app.js`, en el objeto `PR`, para que cualquier cambio del protocolo se haga en un único sitio.

## Aviso

Herramienta de apoyo basada en el protocolo del Servicio. No sustituye al juicio clínico.
