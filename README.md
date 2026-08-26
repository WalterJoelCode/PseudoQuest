# KeplerCode

> Reconstruye el código. Recupera el conocimiento. Reinicia el futuro.

KeplerCode es la nueva identidad narrativa de **PseudoQuest**, una experiencia educativa para aprender pensamiento lógico, algoritmos y pseudocódigo mediante misiones breves, práctica guiada y retroalimentación inmediata.

La historia ocurre en el año 2187. Tras abandonar la Tierra, la humanidad llegó a Kepler con tecnología que ya no sabe mantener. El estudiante asume el rol de **Reconstructor** y recupera progresivamente el conocimiento tecnológico perdido.

[Abrir KeplerCode](https://walterjoelcode.github.io/PseudoQuest/)

## Características

- 15 misiones educativas organizadas en tres niveles progresivos.
- 30 ejercicios adicionales en la Terminal Kepler.
- Preguntas con retroalimentación inmediata y puntuación máxima de 8.
- XP, rachas, mejores resultados y distinciones de la colonia.
- Desbloqueo progresivo de sectores y misiones.
- Centro de operaciones con próxima misión y porcentaje recuperado.
- Onboarding narrativo reproducible y personalizado con el alias local.
- Temas orbitales claro y oscuro con escenas espaciales diferenciadas.
- Atmósfera sonora procedural y efectos opcionales.
- Diseño responsive para escritorio, tablet y móvil.
- Compatibilidad con `prefers-reduced-motion`.
- Funcionamiento estático, sin cuentas, backend ni telemetría.

## Privacidad y persistencia

El perfil y todo el progreso se guardan exclusivamente en el navegador mediante `localStorage`, bajo la clave `pseudoquest-progress`.

Esto incluye:

- nombre y alias;
- XP y racha;
- misiones completadas;
- mejores puntuaciones;
- distinciones desbloqueadas;
- volumen de música y efectos.

KeplerCode no envía esta información a ningún servidor. Limpiar los datos del sitio o utilizar la opción de reinicio elimina el progreso local.

## Stack

- [Astro 7](https://astro.build/)
- TypeScript
- CSS nativo
- Web Audio API
- `localStorage`
- Sharp

No se utiliza un framework de interfaz en tiempo de ejecución ni se requieren servicios externos para las funciones principales.

## Desarrollo local

Requisitos:

- Node.js compatible con Astro 7
- npm

```bash
git clone https://github.com/walterjoelcode/PseudoQuest.git
cd PseudoQuest
npm install
npm run dev
```

El servidor local estará disponible normalmente en `http://localhost:4321/PseudoQuest/`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run check` | Ejecuta las validaciones de Astro y TypeScript. |
| `npm run build` | Genera el sitio estático en `dist/`. |
| `npm run preview` | Previsualiza localmente el build generado. |

Antes de publicar cambios se recomienda ejecutar:

```bash
npm run check
npm run build
```

## Estructura principal

```text
PseudoQuest/
├─ public/
│  ├─ app.js                 # Estado, perfil, audio y controles globales
│  └─ music/                 # Recursos musicales heredados
├─ src/
│  ├─ data/
│  │  ├─ course.ts           # Niveles y misiones
│  │  ├─ question-banks.ts   # Bancos de preguntas
│  │  └─ laboratory.ts       # Ejercicios de la Terminal Kepler
│  ├─ layouts/
│  │  └─ AppLayout.astro     # Navegación, footer, modales y ambientación
│  ├─ pages/                 # Rutas de la aplicación
│  └─ styles/                # Sistema visual y componentes CSS
├─ astro.config.mjs
└─ package.json
```

## Contenido pedagógico

La capa narrativa y visual está separada de los datos pedagógicos. Los ejercicios, preguntas, respuestas, orden de las misiones, dificultad y evaluación viven principalmente en `src/data/`.

Al trabajar en UI/UX deben conservarse:

- el contenido de preguntas y respuestas;
- la lógica de evaluación;
- el orden y los requisitos de desbloqueo;
- los identificadores de misiones;
- la clave y estructura de progreso existente.

Esto evita invalidar el avance guardado de estudiantes actuales.

## Audio

La ambientación espacial global se genera con Web Audio API después de la primera interacción del usuario, respetando las restricciones de reproducción automática del navegador.

Los controles permiten ajustar por separado:

- efectos de interfaz y respuestas;
- volumen de la atmósfera sonora.

La preferencia se recuerda localmente. El audio puede silenciarse por completo.

## Accesibilidad

- Navegación mediante teclado y etiquetas accesibles.
- Estados comunicados con regiones `aria-live`.
- Contraste diferenciado para los temas claro y oscuro.
- Diseño adaptable a pantallas pequeñas.
- Animaciones reducidas o eliminadas cuando el sistema solicita `prefers-reduced-motion`.
- Feedback incorrecto orientado al aprendizaje, sin mensajes punitivos.

## Despliegue

El proyecto genera archivos estáticos y está configurado para publicarse bajo:

```text
https://walterjoelcode.github.io/PseudoQuest/
```

La configuración relevante se encuentra en `astro.config.mjs`:

```js
export default defineConfig({
  output: "static",
  site: "https://walterjoelcode.github.io",
  base: "/PseudoQuest",
});
```

## Autor

Desarrollado por [@walterjoelcode](https://github.com/walterjoelcode).

## Licencia

Este proyecto se distribuye bajo la licencia [MIT](./LICENSE).
