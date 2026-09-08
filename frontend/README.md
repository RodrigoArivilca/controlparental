# Frontend Control Parental

Angular standalone con TypeScript estricto. La ruta `/dispositivos` consulta la API real mediante `HttpClient`; `/` y las rutas desconocidas redirigen a esa pantalla.

## PowerShell

```powershell
npm ci
npm start
```

Abrir http://localhost:4200/dispositivos. Iniciar antes el backend aislado siguiendo [el README principal](../README.md). `proxy.conf.json` conserva `/api/**` y lo envía a Spring Boot en el puerto 8080.

```powershell
npm run build
npm test -- --watch=false
```

Las pruebas unitarias usan HTTP simulado y cubren carga, lista vacía, error/reintento y representación segura de campos nulos y texto. No prueban conectividad real.

## Estructura

- `src/app/app.*`: contenedor y navegación.
- `src/app/app.routes.ts`: rutas, con carga diferida de dispositivos.
- `src/app/app.config.ts`: HttpClient y configuración regional en español.
- `src/app/devices/device.ts`: contrato de Device, incluidos campos anulables y fechas ISO.
- `src/app/devices/device-service.ts`: GET relativo `/api/v1/devices`, con tiempo de espera.
- `src/app/devices/devices-page.*`: pantalla, estilos y estados.

No hay credenciales, datos de muestra, UUID fijos ni direcciones Ngrok en el código de la aplicación. Los datos ficticios para integración se cargan en PostgreSQL separado, desde los scripts de la raíz. El token FCM forma parte del contrato existente, pero no se muestra.
