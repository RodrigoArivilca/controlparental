# Cierre de la primera etapa · 8 de septiembre de 2026

Directorio: `C:\Users\ACER\IdeaProjects\controlparental`.

## Resultado

Frontend Angular standalone en español con navegación a `/dispositivos`, HttpClient, contrato TypeScript de `Device`, GET relativo `/api/v1/devices`, actualización manual y estados de carga, lista vacía y error/reintento. El proxy conecta Angular en `localhost:4200` con Spring Boot en el puerto 8080.

La integración en ejecución se comprobó contra PostgreSQL real **aislado**, con dos dispositivos ficticios persistidos. No se utilizaron respuestas simuladas para acreditar esa integración. Las pruebas unitarias sí simulan HTTP y se identifican por separado.

## Versiones comprobadas

| Herramienta | Versión |
| --- | --- |
| Java / release del proyecto | Oracle JDK 21.0.6 / 21 |
| Spring Boot | 4.0.4 |
| Maven Wrapper | 3.9.14 |
| Node.js | 22.17.1 |
| npm instalado y usado en la instalación final | 10.9.2 |
| Angular core | 21.2.22 |
| Angular CLI y build | 21.2.23 |
| TypeScript | 5.9.3 |
| RxJS | 7.8.2 |
| Vitest | 4.1.11 |
| Vite, fijado a la versión de Angular build | 7.3.6 |
| Playwright Test | 1.58.2 |
| PostgreSQL aislado | 18.3 |

## Verificaciones finales

| Comprobación | Resultado observado |
| --- | --- |
| Lectura estricta UTF-8 de `application.properties` | Correcta |
| `.\mvnw.cmd -B -DskipTests compile` | `BUILD SUCCESS`, código 0; fase normal de recursos completada |
| `npm run build` | Código 0; producción, 262.31 kB iniciales y 9.11 kB de carga diferida |
| `npm test -- --watch=false` | Código 0; 1 archivo y 4 pruebas aprobadas con Vitest 4.1.11 |
| Estados verificados por esas pruebas | Carga, lista vacía, error y reintento; campos nulos y escape de HTML |
| Arranque `spring-boot:run` | Aplicación iniciada en 8080 contra el clúster separado |
| GET directo antes de cargar datos | HTTP 200 y `[]` |
| Carga SQL aislada | `INSERT 0 2`, UUID generados por PostgreSQL |
| `npm start` | Angular iniciado en `http://localhost:4200/` con el proxy configurado |
| GET por `http://localhost:4200/api/v1/devices` | HTTP 200, dos dispositivos ficticios de PostgreSQL |
| `npm run test:integration` | Código 0; 1 prueba aprobada en Microsoft Edge, sin interceptar ni simular HTTP |
| Verificación de navegador | Redirección a `/dispositivos`, solicitud GET real, tarjetas correspondientes a la respuesta, vista móvil sin desbordamiento horizontal |
| Revisión visual | Capturas de escritorio y móvil inspeccionadas |
| `npm audit --json` final | Código 0; 0 vulnerabilidades en todas las categorías |
| Reglas `.gitignore` | Presentes para todas las rutas solicitadas y para resultados locales de pruebas |
| Búsqueda de secretos en archivos publicables | 0 candidatos literales en el escaneo; configuración revisada con referencias a variables |
| `git status --short` y `git rev-parse --show-toplevel` | `fatal: not a git repository (or any of the parent directories): .git` |

La compilación Java inicial mostró advertencias preexistentes de Lombok (`Device` sin `@Builder.Default`) y conversiones no comprobadas de `VisitaService`. No impidieron compilar y no se corrigieron fuera del alcance.

La instalación inicial tuvo reintentos de red y un error interno de npm (`edgesOut`). Se probaron revisiones temporales de npm sin modificar su instalación global. El árbol final se instaló con npm 10.9.2, Vitest corregido y Vite 7.3.6 fijado; el lockfile conserva ese resultado. Se retiraron Forms y Prettier del scaffolding porque esta pantalla no los necesita. La vulnerabilidad detectada afectaba a Vitest 4.0.18; esa versión no queda como dependencia final.

## Aislamiento y apagado

- Clúster exclusivo: `.local/postgres-stage1`.
- Base exclusiva: `controlparental_stage1`, puerto `55432`, escucha `127.0.0.1`.
- Los scripts comprobaron `SHOW data_directory` antes de crear la base o insertar datos.
- Las credenciales fueron generadas para este clúster y quedaron en `.local/stage1-credentials.json`, excluido de Git; no se imprimen ni se incluyen aquí.
- Angular se detuvo con interrupción de su terminal. Para verificar el apagado explícito de Spring Boot se completó un ciclo `spring-boot:start` / `spring-boot:stop`: los registros confirmaron `Graceful shutdown complete`, cierre de JPA y `HikariPool-1 - Shutdown completed`.
- PostgreSQL se detuvo con `pg_ctl -D ... -m fast -w stop`: `server stopped` y `database system is shut down` en el registro.
- Comprobación final: sin escuchas en 4200, 8080, 55432 ni en el puerto administrativo temporal 9001; `pg_ctl status` indica `no server running`.
- El clúster se conserva en disco para repetir la demostración.
- No se conectó ni modificó la base original. No se modificó `relengcorp`.

## Inventario de archivos

Modificados:

- `.gitignore`: credenciales locales, clúster, dependencias y artefactos excluidos; `.idea/` explícito.
- `src/main/resources/application.properties`: conversión a UTF-8, variables de entorno sin credenciales originales; el significado de las demás propiedades se conserva. `DB_DDL_AUTO` mantiene `update` como valor predeterminado.

Creados (archivos publicables):

```text
README.md                                Guía de PowerShell, configuración y límites
VERIFICACION_ETAPA1.md                    Este informe
scripts/
  Start-IsolatedPostgres.ps1              Inicialización y variables del clúster separado
  Seed-IsolatedDevices.ps1                Verificación del clúster y ejecución de datos
  seed-isolated-devices.sql               Dos dispositivos ficticios, sin UUID fijos
frontend/
  .editorconfig                          Convenciones del editor
  .gitignore                             Artefactos de Angular y pruebas
  angular.json                           Construcción, proxy y ejecutor de pruebas
  package.json                           Dependencias y comandos npm
  package-lock.json                      Versiones reproducibles
  proxy.conf.json                        /api/** hacia 127.0.0.1:8080
  README.md                              Guía del frontend
  tsconfig.json                          TypeScript estricto
  tsconfig.app.json                      Compilación de la aplicación
  tsconfig.spec.json                     Compilación de pruebas
  playwright.config.ts                   Prueba real en Edge, sin arrancar servidores
  integration/devices.spec.ts            GET real, tarjetas y diseño móvil
  public/favicon.svg                     Icono de SaludPlus
  src/index.html                         Documento en español
  src/main.ts                            Bootstrap standalone
  src/styles.css                         Estilos globales
  src/app/app.ts                         Componente raíz
  src/app/app.html                       Navegación y contenedor
  src/app/app.css                        Diseño adaptable
  src/app/app.config.ts                  Router, HttpClient y locale español
  src/app/app.routes.ts                  Ruta de dispositivos y redirecciones
  src/app/devices/device.ts              Contrato de respuesta del backend
  src/app/devices/device-service.ts      GET relativo, tiempo de espera de 10 segundos
  src/app/devices/devices-page.ts         Estados y carga de dispositivos
  src/app/devices/devices-page.html       Plantilla segura, sin iframe ni innerHTML
  src/app/devices/devices-page.css        Presentación de tarjetas y estados
  src/app/devices/devices-page.spec.ts    Cuatro pruebas unitarias con HTTP simulado
```

También se generaron artefactos locales excluidos: `.local/`, `target/`, `frontend/node_modules/`, `frontend/dist/`, `frontend/.angular/`, `frontend/test-results/` y los archivos de ayuda del editor en `frontend/.vscode/`. Las páginas HTML antiguas y las fuentes Java conservan sus archivos sin cambios. No se inicializó un repositorio Git ni se hizo commit o push.

## Repetición y siguiente etapa

Los comandos exactos, las variables requeridas y el apagado están en [README.md](README.md). URL después del arranque: **http://localhost:4200/dispositivos**.

Quedan pendientes autenticación/autorización por dispositivo, validación y contratos DTO, revisión de exposición del token FCM en la API, paginación y definición del estado de conexión. El frontend muestra el estado registrado, no comprueba presencia en vivo. El proxy es solo de desarrollo. No se implementaron mapas, llamadas, audio ni rastreo.
