# FudiGPT - Documentación Principal

*Última actualización: 2025-04-27*

Este documento proporciona un resumen actualizado del estado del proyecto FudiGPT.

# FudiGPT

FudiGPT es un gerente operativo con superpoderes, listo para actuar 24/7 en el corazón del restaurante.

## ¿Qué es FudiGPT?

FudiGPT es un asistente AI entrenado para conversar, entender y resolver problemas reales en restaurantes — desde costos de insumos hasta desempeño de platillos. Se conecta directo al POS (como Poster), analiza datos reales tal como vienen, y responde con empatía, claridad y estrategia.

Donde otros bots se rompen, FudiGPT propone.
Donde otros exigen datos limpios, FudiGPT se adapta.
Donde otros entregan dashboards, FudiGPT conversa con inteligencia.

## Decisiones Arquitectónicas Recientes

- **Sin fecha**: [ADR-[número]: [Título de la Decisión]](docs/adr/adr-template.md)
- **2025-04-26**: [ADR-0002: Arquitectura para FUDIVERSE](docs/adr/0002-arquitectura-para-fudiverse.md)
- **2025-02-15**: [ADR-001: Integración con Poster POS](docs/adr/0001-integracion-con-poster-pos.md)

[Ver todas las decisiones arquitectónicas](docs/adr/README.md)

## Reportes de Sesión Recientes

- **2025-04-27**: [Mejoras de UI en FudiGPT](docs/session-reports/2025-04-27-mejoras-ui-fudigpt.md)
- **2025-04-27**: [Implementación de Automatización de Documentación](docs/session-reports/2025-04-27-implementacion-automatizacion-documentacion.md)
- **2025-04-26**: [2025-04-26-refactorizacion-arquitectura-fudiverse](docs/session-reports/2025-04-26-refactorizacion-arquitectura-fudiverse.md)

[Ver todos los reportes de sesión](docs/session-reports/README.md)

## Estructura del Proyecto

- **src/**: Código fuente de la aplicación React
  - **components/**: Componentes reutilizables de UI
  - **contexts/**: Contextos de React (autenticación, tema, etc.)
  - **pages/**: Páginas principales de la aplicación
  - **services/**: Servicios para integración con APIs externas
  - **utils/**: Utilidades y funciones auxiliares
- **docs/**: Documentación del proyecto
  - **adr/**: Registro de Decisiones Arquitectónicas
  - **session-reports/**: Reportes de sesiones de desarrollo
- **functions/**: Cloud Functions para Firebase
- **poster-sync/**: Servicios para sincronización con Poster POS

## Despliegue

El proyecto se despliega automáticamente en Firebase Hosting a través de GitHub Actions cuando se hace push a la rama master.

URL de producción: https://fudigpt.com

## Próximos Pasos

Consulta los siguientes archivos para obtener información detallada sobre los próximos pasos:

- [Próximos pasos generales](docs/next-steps.md)
- [Plan de integración con Poster](docs/poster-integration.md)

---

Para contribuir al proyecto, por favor consulta [CONTRIBUTING.md](.github/CONTRIBUTING.md).
