# VelaVida Frontend

Landing page y sitio web de recetas para VelaVida. Aplicación Node.js con Express que sirve contenido dinámico usando Pug como motor de plantillas.

## Arquitectura

El proyecto tiene **dos tipos de frontend diferentes**:

### 1. Landing Pages y Recetas (`/public/js/`)
**Este es el código principal en uso.**

Archivos JavaScript vanilla que se cargan en las páginas de recetas y landing:
- `recipes.js`: Carga recetas desde la API GraphQL y las renderiza
- `app.js`: Lógica general de la aplicación
- `theme.js`: Manejo de temas (actualmente vacío)
- `video.js`: Reproductor de videos de recetas

Las vistas Pug (`home.pug`, `video.pug`) cargan estos scripts directamente:
```pug
script(src='/js/app.js')
script(src='/js/recipes.js')
```

### 2. WebApp Admin (`/public/public/`)
Bundles de Webpack para la sección de administración.

Solo se usa en rutas `/admin/*` a través de `webapp.pug`:
```pug
script(src='/public/bundle.js.gz')
```

## Estructura de Rutas

### Rutas Públicas
- `/` - Homepage con recetas aleatorias
- `/:categoria` - Recetas por categoría (desayunos, principales, etc.)
- `/receta/:nombre-id` - Detalle de receta individual
- `/descargar` - Página de descarga de apps

### Rutas Admin
- `/admin/*` - Panel administrativo (usa bundles de Webpack)

## Flujo de Datos

1. **Server.js** configura Express y define rutas
2. Para recetas, hace peticiones GraphQL a: `https://3bvjulkoul.execute-api.us-east-1.amazonaws.com/prod`
3. Renderiza plantillas Pug con datos server-side
4. **Cliente** (`recipes.js`) hace peticiones adicionales para cargar más recetas
5. Maneja SEO con Open Graph y Twitter Cards dinámicos

## Dependencias

- **express**: Servidor web
- **pug**: Motor de plantillas
- **superagent**: Cliente HTTP para API
- **pg**: Cliente PostgreSQL
- **aws-sdk**: Integración con AWS

## Ejecución

```bash
npm install
node server.js
```

Servidor corre en puerto 3004.

## Conclusión

**El código de frontend activo es `/public/js/`**, específicamente `recipes.js` y `app.js`. Los bundles en `/public/public/` solo se usan para el admin panel.
