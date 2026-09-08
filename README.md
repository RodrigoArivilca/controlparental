# Control Parental · primera etapa Angular

Backend Spring Boot y frontend Angular independiente en `frontend/`. Esta etapa permite consultar los dispositivos existentes; no registra ni modifica dispositivos desde Angular. Las cuatro páginas anteriores permanecen en `src/main/resources/static/`.

## Versiones

- Java del proyecto: 21; entorno comprobado: Oracle JDK 21.0.6.
- Spring Boot: 4.0.4; Maven Wrapper: 3.9.14.
- Node.js: 22.17.1; npm: 10.9.2.
- Angular: 21.2.22; Angular CLI y build: 21.2.23. Versiones exactas resueltas en `frontend/package-lock.json`.
- TypeScript: 5.9.3; RxJS: 7.8.2.
- PostgreSQL utilizado para el entorno aislado: 18.3.

Se eligió Angular 21 porque admite Node 22.17.1. Angular 22 requiere un Node más reciente. Referencia: https://angular.dev/reference/versions. Para reproducir dependencias utilizar `npm ci`, conservando el lockfile.

Las pruebas utilizan Vitest 4.1.11, que incluye la corrección de [GHSA-5xrq-8626-4rwp](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp). `overrides.vite=7.3.6` conserva la versión que usa Angular build y evita que npm intente resolver una rama distinta por los peers de Vitest. No se utilizó `--force` ni `--legacy-peer-deps`. El resultado final de `npm audit` fue cero vulnerabilidades. No se cambió npm global ni la versión principal de Angular.

## Compilar sin iniciar conexiones a PostgreSQL

Desde PowerShell:

```powershell
Set-Location 'C:\Users\ACER\IdeaProjects\controlparental'
.\mvnw.cmd -DskipTests compile
Set-Location .\frontend
npm ci
npm run build
npm test -- --watch=false
```

Las pruebas Angular usan `HttpTestingController`: no acceden a PostgreSQL ni sustituyen la prueba de integración real. El `contextLoads()` del backend carga el datasource: no ejecutar `mvn test` sin configurar primero un entorno aislado.

## Arranque local aislado: terminal 1, PostgreSQL y backend

Se necesita PostgreSQL instalado (no se requiere Docker). El script utiliza los binarios, pero **no utiliza el servicio ni el directorio de datos originales**. Crea su propio clúster en `.local/postgres-stage1`, escucha exclusivamente en `127.0.0.1:55432`, y verifica `SHOW data_directory` antes de crear la base. Si el puerto está ocupado por otro servidor, se detiene.

```powershell
Set-Location 'C:\Users\ACER\IdeaProjects\controlparental'
. .\scripts\Start-IsolatedPostgres.ps1
.\mvnw.cmd spring-boot:run
```

El punto seguido de espacio antes del script importa: exporta variables a la terminal actual. Si PostgreSQL está en otra carpeta:

```powershell
. .\scripts\Start-IsolatedPostgres.ps1 -PostgresBin 'C:\Program Files\PostgreSQL\18\bin'
```

No proporcionar argumentos adicionales de datasource ni archivos externos de configuración al comando Maven: podrían prevalecer sobre el entorno aislado. El backend escucha en `127.0.0.1:8080`, accesible mediante `http://localhost:8080`.

## Datos ficticios y Angular: terminal 2

Después de que Spring Boot indique que arrancó:

```powershell
Set-Location 'C:\Users\ACER\IdeaProjects\controlparental'
.\scripts\Seed-IsolatedDevices.ps1
Set-Location .\frontend
npm ci
npm start
```

Abrir http://localhost:4200/dispositivos. El script de datos inserta dos dispositivos ficticios con UUID generados por PostgreSQL; puede repetirse sin duplicar sus nombres. Verifica el directorio del clúster antes de escribir. No utiliza el endpoint de registro ni la base original.

Angular solicita `GET /api/v1/devices`. El proxy de desarrollo envía `/api/**` a `http://127.0.0.1:8080`, conservando la ruta. No hay Ngrok, UUID fijo ni credenciales en el frontend. Documentación del proxy: https://angular.dev/tools/cli/serve.

Con ambos procesos activos se puede comprobar también el proxy desde otra terminal:

```powershell
Invoke-RestMethod 'http://localhost:4200/api/v1/devices'
```

El proxy es exclusivo de `ng serve`. Un despliegue futuro necesitará servir `/api` mediante un reverse proxy o desde el mismo origen; no se configura despliegue en esta etapa.

La prueba de navegador requiere Microsoft Edge instalado. Con ambos servidores activos:

```powershell
Set-Location 'C:\Users\ACER\IdeaProjects\controlparental\frontend'
npm run test:integration
```

Esta prueba utiliza Playwright con Edge en modo headless. No inicia servidores ni intercepta respuestas: compara los dispositivos de la API real a través del proxy con las tarjetas que presenta Angular, y comprueba el diseño móvil. Sus capturas quedan en `frontend/test-results/`, excluido de Git.

## Credenciales locales

`application.properties` está en UTF-8 y conserva las propiedades anteriores, sustituyendo valores sensibles por variables obligatorias:

| Variable | Uso |
| --- | --- |
| `DB_URL` | URL JDBC PostgreSQL, sin conexión por defecto |
| `DB_USERNAME` | Usuario PostgreSQL |
| `DB_PASSWORD` | Contraseña PostgreSQL |
| `APP_SECURITY_USERNAME` | Usuario de la configuración Spring Security existente |
| `APP_SECURITY_PASSWORD` | Contraseña de esa configuración |
| `DB_DDL_AUTO` | Modo Hibernate; se conserva `update` como valor por defecto |

El script de aislamiento genera credenciales nuevas y las guarda únicamente en `.local/stage1-credentials.json`, excluido por `.gitignore`. No imprime contraseñas. `.local/`, `.env`, `.env.*` y `*.local.ps1` están excluidos; nunca subir esos archivos ni colocar secretos en `frontend/`. Spring Boot no lee un archivo `.env` automáticamente.

Para configuración manual, establecer las variables `$env:...` en la terminal donde se ejecuta Maven. Introducir contraseñas con `Read-Host -AsSecureString` y convertirlas a variables de entorno dentro de un script privado, evitando escribirlas en el historial. No usar los datos de conexión originales para pruebas. `update` puede modificar el esquema de la base seleccionada; el script proporcionado lo usa solamente con el clúster separado.

Externalizar las credenciales no habilita autenticación: se conserva `SecurityConfig` y su acceso público para no ampliar esta etapa. El estado mostrado es el valor registrado por la API, no una comprobación de conexión en vivo.

## Detener

Detener Angular y Spring Boot con `Ctrl+C` en sus terminales. Después:

```powershell
Set-Location 'C:\Users\ACER\IdeaProjects\controlparental'
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D "$PWD\.local\postgres-stage1" -m fast -w stop
```

Los datos aislados quedan en `.local/` para el siguiente arranque. No se detiene el servicio PostgreSQL original.

## Archivos relevantes

- `src/main/resources/application.properties`: UTF-8 y referencias a variables de entorno.
- `.gitignore`: exclusiones locales y artefactos frontend.
- `scripts/`: inicio y carga segura del clúster separado.
- `frontend/src/app/app.*`: estructura y navegación standalone.
- `frontend/src/app/devices/`: tipos, servicio HTTP, pantalla y pruebas.
- `frontend/proxy.conf.json`, `angular.json`: proxy y construcción Angular.
- `frontend/package.json`, `package-lock.json`: dependencias reproducibles.

No se migran llamadas, audio, seguimiento real ni las demás pantallas en esta etapa.

Resultados e inventario completo de esta etapa: [VERIFICACION_ETAPA1.md](VERIFICACION_ETAPA1.md).
