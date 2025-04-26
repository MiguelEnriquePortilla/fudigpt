# ADR-0002: Arquitectura para FUDIVERSE

## Fecha: 2025-04-26

## Estado

Aceptada

## Contexto

FudiGPT está evolucionando de ser una aplicación independiente a formar parte de un ecosistema más amplio llamado FUDIVERSE, que incluirá otras soluciones como FudiBuk (sistema de reservas), FudiPOS (sistema de punto de venta propio) y potencialmente integraciones de delivery. Esta expansión requiere reconsiderar la arquitectura técnica para garantizar que los desarrollos actuales puedan escalar y adaptarse a este ecosistema.

Al mismo tiempo, existe la necesidad de mantener el impulso actual y lanzar el prototipo de FudiGPT lo antes posible, sin que las consideraciones arquitectónicas a largo plazo retrasen significativamente el desarrollo.

## Opciones Consideradas

### Opción 1: Mantener la arquitectura actual

Continuar con el desarrollo de FudiGPT como una aplicación independiente, abordando la integración con otras aplicaciones del ecosistema FUDIVERSE en el futuro.

**Pros:**
- Desarrollo más rápido a corto plazo
- Sin cambios en el código existente
- Enfoque completo en funcionalidades específicas de FudiGPT

**Contras:**
- Mayor deuda técnica a largo plazo
- Posibles duplicaciones de código entre aplicaciones
- Dificultad futura para compartir datos y funcionalidades
- Mayor esfuerzo de refactorización en el futuro

### Opción 2: Reestructuración completa inmediata

Reorganizar completamente el código para adoptar una arquitectura modular centrada en el ecosistema FUDIVERSE antes de continuar con el desarrollo de nuevas funcionalidades.

**Pros:**
- Base arquitectónica sólida desde el principio
- Clara separación de responsabilidades
- Mejor preparación para futuras aplicaciones
- Reutilización de código optimizada

**Contras:**
- Retraso significativo en el lanzamiento del prototipo
- Mayor complejidad inicial
- Riesgo de sobre-arquitectura para necesidades actuales
- Posible desaprovechamiento de trabajo ya realizado

### Opción 3: Enfoque pragmático incremental

Implementar ajustes arquitectónicos estratégicos y limitados que preparen el camino para FUDIVERSE sin retrasar significativamente el desarrollo actual, creando una hoja de ruta clara para evolucionar gradualmente hacia la arquitectura objetivo.

**Pros:**
- Balance entre desarrollo inmediato y preparación futura
- Identificación clara de "puntos de extensión" estratégicos
- Posibilidad de validar el modelo de negocio con menos inversión inicial
- Refactorización progresiva basada en aprendizajes reales

**Contras:**
- Necesidad de gestionar cuidadosamente la deuda técnica
- Algunas duplicaciones temporales inevitables
- Necesidad de documentación más detallada durante la transición

## Decisión

Hemos elegido la **Opción 3: Enfoque pragmático incremental** para equilibrar la necesidad de avanzar con el prototipo de FudiGPT y la preparación para el ecosistema FUDIVERSE.

La implementación se realizará mediante:

1. Refactorización inmediata del conector de Poster POS para aislarlo completamente
2. Creación de modelos de datos comunes independientes del proveedor
3. Documentación detallada de la arquitectura objetivo
4. Plan de transición gradual post-lanzamiento del prototipo

## Consecuencias

### Positivas

- Permite continuar el desarrollo de FudiGPT sin retrasos significativos
- Establece fundamentos para la arquitectura FUDIVERSE
- Mejora la organización del código existente
- Facilita la incorporación de nuevos desarrolladores al proyecto
- Reduce el riesgo de grandes reescrituras futuras

### Negativas

- Requiere gestionar una arquitectura en transición
- Algunas partes del código mantendrán el enfoque anterior temporalmente
- Necesidad de mayor documentación durante el periodo de transición
- Posible inconsistencia temporal en patrones de diseño

### Neutrales

- Necesidad de revisar esta decisión después del lanzamiento del prototipo
- Proceso de refactorización continuo pero controlado

## Implementación

La implementación seguirá estos pasos:

1. **Refactorización inmediata (Corto plazo)**
   - Reorganizar el conector de Poster en tres componentes: `PosterConnector`, `PosterAuthService` y `PosterDataService`
   - Crear modelos de datos comunes: `Restaurant`, `MenuItem`, `Transaction`
   - Documentar claramente la arquitectura objetivo con este ADR

2. **Objetivo arquitectónico (Documentación para futuro)**
   ```
   FUDIVERSE/
   ├── core/                      # Núcleo compartido 
   │   ├── data/                  # Procesamiento de datos común
   │   ├── ai/                    # Servicios de IA compartidos
   │   ├── auth/                  # Autenticación y gestión de usuarios
   │   └── analytics/             # Telemetría y análisis
   ├── connectors/                # Adaptadores para sistemas externos
   │   ├── poster/                # Conector para Poster POS
   │   └── [otros conectores]     # Futuros conectores
   ├── applications/              # Aplicaciones específicas
   │   ├── fudigpt/               # Asistente conversacional
   │   └── [otras aplicaciones]   # Futuras aplicaciones
   └── shared/                    # Utilidades compartidas
   ```

3. **Plan post-lanzamiento (Mediano plazo)**
   - Migración gradual del código a la nueva estructura
   - Implementación de interfaces consistentes para todos los conectores
   - Creación de componentes UI compartidos

## Referencias

- [Patrón de Arquitectura Hexagonal](https://alistair.cockburn.us/hexagonal-architecture/)
- [Patrón de Adaptador](https://refactoring.guru/design-patterns/adapter)
- [ADR-0001: Integración con Poster POS](./0001-integracion-con-poster-pos.md)

## Notas Adicionales

Esta decisión se basa en la necesidad de equilibrar el avance a corto plazo con la visión a largo plazo del ecosistema FUDIVERSE. La refactorización incremental nos permite establecer bases sólidas sin comprometer el impulso actual del desarrollo.