# Página de Login

Esta carpeta contiene los componentes para el proceso de inicio de sesión de FudiGPT, incluyendo la autenticación de usuarios y la sincronización de datos con Poster.

## 🎯 Objetivo

Proporcionar una experiencia de inicio de sesión segura y eficiente para usuarios existentes, verificando credenciales y sincronizando automáticamente datos actualizados desde Poster POS al iniciar sesión.

## 📁 Estructura de Archivos

```
src/pages/login/
├── LoginPage.jsx          # Contenedor principal de la página de login
├── LoginForm.jsx          # Formulario de inicio de sesión
├── SyncStatusBar.jsx      # Barra de estado de sincronización
├── ForgotPassword.jsx     # Componente para recuperación de contraseña
├── LoginContext.jsx       # Contexto para manejar estado del login
└── styles.module.css      # Estilos específicos del login
```

## 🔄 Flujo de Usuario

1. **Entrada de Credenciales**: El usuario introduce email y contraseña
2. **Autenticación**: Se verifica la identidad del usuario contra Firebase Auth
3. **Verificación de Datos**:
   - Se comprueba cuándo fue la última sincronización de datos con Poster
   - Si han pasado más de 24 horas, se inicia sincronización automática
4. **Sincronización** (si es necesaria):
   - Se muestra indicador de progreso
   - Se obtienen datos actualizados de Poster
5. **Redirección**: Se envía al usuario al Dashboard o Chat principal

![Diagrama de Flujo de Login](../../docs/assets/login-flow.png)

## 🧩 Componentes Principales

### LoginPage

Componente principal que organiza la página de login:

```jsx
// Ejemplo de uso
import LoginPage from './LoginPage';

function App() {
  return (
    <Router>
      <Route path="/login" element={<LoginPage />} />
    </Router>
  );
}
```

### LoginForm

Formulario para introducir credenciales:

```jsx
// Ejemplo de uso
import { LoginForm } from './LoginForm';

function LoginComponent() {
  const handleLogin = (credentials) => {
    // Procesar inicio de sesión
  };
  
  return (
    <LoginForm 
      onSubmit={handleLogin}
      isLoading={isAuthenticating}
    />
  );
}
```

### SyncStatusBar

Muestra el estado de sincronización durante el login:

```jsx
// Ejemplo de uso
import { SyncStatusBar } from './SyncStatusBar';

function LoginComponent() {
  return (
    <SyncStatusBar 
      isSyncing={isSyncing}
      progress={syncProgress}
      lastSyncDate={lastSyncDate}
    />
  );
}
```

## 🔒 Seguridad y Validación

- Implementación de reCAPTCHA para prevenir ataques automatizados
- Limitación de intentos de login fallidos
- Validación del formato de correo electrónico
- Requisitos de complejidad para contraseñas
- Manejo seguro de tokens y credenciales

## 📊 Sincronización de Datos

El proceso de sincronización durante el login incluye:

1. **Verificación de Token**: Se comprueba si el token de Poster sigue siendo válido
2. **Sincronización Selectiva**:
   - Productos y menú: Siempre se sincronizan
   - Inventario: Se sincroniza si han pasado >12 horas
   - Transacciones: Se sincronizan las últimas 48 horas
3. **Almacenamiento**: Los datos se guardan en la estructura correspondiente en Firestore
4. **Registro**: Se actualiza el timestamp de última sincronización

## 🧪 Testing

Para ejecutar pruebas específicas del módulo de login:

```bash
npm run test:login
```

## 📱 Responsividad

La página está optimizada para diferentes tamaños de pantalla:
- **Mobile**: Diseño simplificado con elementos apilados
- **Tablet**: Adaptación a pantalla media con espaciado optimizado
- **Desktop**: Layout completo con elementos adicionales

## 🌙 Modos de Tema

Se soportan modo claro y oscuro, siguiendo:
- Preferencias del sistema
- Elección manual del usuario (persistente)
- Cambio dinámico sin recarga

## 📝 Notas de Implementación

- La sincronización ocurre en segundo plano, permitiendo navegación inmediata
- Los errores de sincronización no bloquean el acceso (fallan graciosamente)
- Se implementa "Remember me" para persistencia de sesión
- Soporte para login con proveedores externos (Google, Facebook)

## 🌐 Internacionalización

La página de login soporta múltiples idiomas:
- Español (default)
- Inglés
- Portugués

La detección de idioma es automática según la configuración del navegador.

## 📚 Recursos Relacionados

- [Diseños en Figma](https://figma.com/file/your-design-file)
- [Documentación de autenticación](../../docs/authentication.md)
- [Manejo de errores](../../docs/error-handling.md)
- [Flujo de integración con Poster](../../docs/poster-integration.md)