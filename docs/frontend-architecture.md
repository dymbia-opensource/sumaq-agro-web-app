# Organización del frontend

Este proyecto usa bounded contexts con capas de frontend. Los stores de aplicación
usan signals de Angular y llaman a las fachadas API de infraestructura; no se está
aplicando una arquitectura hexagonal estricta con un puerto por cada petición.

## Responsabilidades

- `domain/`: modelos, comandos y reglas independientes de Angular, HTTP y navegador.
  Puede reutilizar el dominio compartido. Referencia otros contextos por identidad.
- `application/`: stores, estado de casos de uso y proyecciones de sesión. No importa
  componentes ni servicios de Angular Router.
- `infrastructure/`: contratos HTTP, endpoints, assemblers, fachadas API,
  almacenamiento del navegador, interceptores y adaptadores del router.
- `presentation/components/`: componentes de interfaz reutilizables.
- `presentation/views/<vista>/`: componente, HTML y CSS propios de una vista,
  con el mismo nombre base y una referencia local mediante `styleUrl`.
  Los estilos de cada vista se mantienen junto a su componente. Los componentes
  reutilizables, como `auth-layout`, poseen sus propios estilos dentro de su carpeta.
- `tests/unit/` y `tests/integration/`: pruebas. No son código de producción.
- `<contexto>.routes.ts`: composición de rutas del contexto.

El archivo raíz `app.spec.ts` prueba el arranque de la aplicación. Los `.spec.ts`
no deben borrarse para preparar un despliegue: `tsconfig.app.json` ya los excluye
de la compilación de producción. `tsconfig.spec.json` descubre sus nuevas rutas.

## Propiedad de los servicios

- IAM expone `activeUser` y `hasActiveUser` desde `IamStore`: proyectan la identidad
  y el rol activo para los demás contextos, sin un servicio de sesión duplicado.
- IAM posee `AuthNavigationService` en infraestructura: adapta destinos de acceso
  a `UrlTree` y Angular Router.
- Field Management posee `PlotSelectionService`: selección de parcela para la
  sesión actual. Crop Health consume ese servicio al compartir la parcela elegida.
- `shared/domain` contiene únicamente modelos compartidos; no depende de IAM ni
  de otro contexto. Los componentes del shell en `shared/presentation` sí componen
  las capacidades de la aplicación.
- La selección de endpoints y el modo de vista previa quedan en infraestructura,
  no en el store de recuperación.

## Integración entre contextos

Actualmente hay integración directa mediante fachadas, modelos de lectura,
stores y componentes entre Field Management, Crop Health y Profiles; Harvest
Certification también consulta Profiles. No son módulos desplegables de forma
independiente. Convertir esas integraciones a puertos o contratos publicados sería
una refactorización adicional, no una simple reorganización de carpetas.

## Verificación

```bash
npm run check:architecture
npm test -- --watch=false
npm run build
```

El chequeo recorre todos los archivos TypeScript de `src/app`, incluidos imports
dinámicos y recursos de componentes. Detecta imports locales rotos, ciclos entre
archivos, dependencias indebidas del dominio, adaptadores del router fuera de
infraestructura y archivos sueltos en `presentation/views`.

Es una revisión estática de estructura y dependencias: no sustituye la revisión de
reglas de negocio, permisos efectivos del backend o comportamiento visual.
