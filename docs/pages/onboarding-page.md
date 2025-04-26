# Página de Onboarding

Esta carpeta contiene los componentes para el proceso de onboarding de nuevos restaurantes en FudiGPT, incluyendo el registro inicial y la conexión con Poster POS.

## 🎯 Objetivo

Proporcionar una experiencia fluida para el registro de nuevos restaurantes, recopilando información básica y estableciendo la conexión inicial con el sistema Poster POS.

## 📁 Estructura de Archivos

```
src/pages/onboarding/
├── OnboardingPage.jsx         # Contenedor principal de la página
├── RegisterForm.jsx           # Formulario de registro de restaurante
├── PosterConnect.jsx          # Componente para iniciar conexión con Poster
├── SuccessScreen.jsx          # Pantalla de éxito post-registro
├── OnboardingContext.jsx      # Contexto para manejar estado del onboarding
└── styles.module.css          # Estilos específicos del onboarding
```

## 🔄 Flujo de Usuario

1. **Registro**: El usuario completa el formulario con información básica del restaurante
2. **Conexión con Poster**: Inicia el flujo OAuth para conectar con Poster
3. **Sincronización Inicial**: Se sincronizan los datos básicos del restaurante
4. **Confirmación**: Se muestra pantalla de éxito y se redirige al dashboard

![Diagrama de Flujo](../../docs/assets/onboarding-flow.png)

## 🧩 Componentes Principales

### RegisterForm

Formulario para recopilar información básica del restaurante:
- Nombre del restaurante
- Información de contacto
- Detalles del propietario
- Tipo de cocina/establecimiento

```jsx
// Ejemplo de uso
import { RegisterForm } from './RegisterForm';

const MyComponent = () => {
  const handleSubmit = (formData) => {
    // Procesar datos del formulario
  };
  
  return <RegisterForm onSubmit={handleSubmit} />;
};
```

### PosterConnect

Componente que implementa el botón de conexión con Poster y maneja el flujo OAuth:

```jsx
// Ejemplo de uso
import { PosterConnect } from './PosterConnect';

const MyComponent = () => {
  const handleSuccess = (connectionData) => {
    // Manejar conexión exitosa
  };
  
  return (
    <PosterConnect 
      restaurantId={restaurantId}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
};
```

### SuccessScreen

Pantalla mostrada después de completar el registro:

```jsx
// Ejemplo de uso
import { SuccessScreen } from './SuccessScreen';

const MyComponent = () => {
  return (
    <SuccessScreen 
      restaurantName={restaurantName}
      onContinue={handleContinue}
    />
  );
};
```

## 🔒 Consideraciones de Seguridad

- Los tokens de Poster se almacenan encriptados
- La información sensible no se guarda en localStorage
- Se utilizan técnicas anti-CSRF para el callback OAuth

## 🧪 Testing

Para ejecutar pruebas específicas del módulo de onboarding:

```bash
npm run test:onboarding
```

## 📝 Notas de Implementación

- La página de onboarding es completamente independiente del resto de la aplicación
- Se muestra solo a usuarios no autenticados o durante el proceso de registro
- El diseño sigue los principios de UX para formularios de multi-step
- Se implementa validación en tiempo real de los campos
- Los datos se van guardando en localStorage para evitar pérdidas

## 📚 Recursos Relacionados

- [Diseños en Figma](https://figma.com/file/your-design-file)
- [Documentación de integración con Poster](../../docs/poster-integration.md)
- [Flujo de autenticación](../../docs/authentication.md)
