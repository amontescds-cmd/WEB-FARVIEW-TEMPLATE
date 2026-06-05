# Strategic Vision Planner - TODO

## Base de Datos y Schema
- [ ] Tabla `clients` (id, name, industry, timeHorizon, description, status, createdAt)
- [ ] Tabla `insights` (id, clientId, type, title, content, fileUrl, fileKey, fileName, createdAt)
- [ ] Tabla `vision_versions` (id, clientId, versionNumber, content, prompt, isFinal, notes, createdAt)
- [ ] Generar migración y aplicar SQL

## Backend (tRPC Procedures)
- [ ] Router `clients`: create, list, getById, update, delete
- [ ] Router `insights`: create (text), upload (file), list, delete
- [ ] Router `vision`: generate (IA), list versions, setFinal, update notes, delete version
- [ ] Integración LLM con prompt de consultor experto personalizado por cliente

## Frontend - Layout y Navegación
- [ ] Aplicar colores institucionales FARVIEW (rojo primario #DC2626) en index.css
- [ ] Configurar tipografías Montserrat + Lato en index.html
- [ ] Crear DashboardLayout con sidebar (logo FV, navegación, usuario)
- [ ] Rutas: /, /clients, /clients/:id, /clients/:id/insights, /clients/:id/vision

## Dashboard Principal
- [ ] Tarjetas de resumen: total clientes, con visión generada, en proceso
- [ ] Lista de clientes activos con estado de avance de visión
- [ ] Acceso rápido a clientes recientes

## Módulo de Clientes
- [ ] Listado de clientes con búsqueda y filtros
- [ ] Formulario crear/editar cliente (nombre, industria, horizonte de tiempo, descripción)
- [ ] Vista detalle de cliente con tabs (Insights, Visión, Historial)
- [ ] Indicador de estado (Sin iniciar / En proceso / Visión lista)

## Módulo de Insights
- [ ] Subir documentos (PDF, DOCX, TXT) por cliente
- [ ] Agregar texto libre como insight
- [ ] Listado de insights con tipo, título y fecha
- [ ] Eliminar insight
- [ ] Extracción de texto de archivos para procesamiento IA

## Módulo de Generación de Visión con IA
- [ ] Botón "Generar Visión" usando todos los insights del cliente
- [ ] Prompt personalizado con contexto: nombre, industria, horizonte, insights
- [ ] Mostrar declaración de visión generada con formato de consultor
- [ ] Campo de instrucciones adicionales para refinamiento
- [ ] Botón "Regenerar" con instrucciones de ajuste
- [ ] Guardar cada versión generada automáticamente

## Historial de Versiones
- [ ] Lista de versiones con número, fecha y preview
- [ ] Comparar versiones (lado a lado)
- [ ] Marcar versión como "Final"
- [ ] Agregar notas a cada versión
- [ ] Eliminar versiones no deseadas

## Exportación a Word
- [ ] Exportar visión final a .docx con formato profesional
- [ ] Incluir nombre del cliente, industria, horizonte y fecha
- [ ] Estilo limpio listo para proyectar en plenaria

## Pruebas
- [ ] Tests unitarios para procedures de clients
- [ ] Tests unitarios para procedures de vision

## Entrega
- [ ] Checkpoint guardado
- [ ] Sincronización con GitHub

## Eliminar Autenticación
- [x] Convertir todos los protectedProcedure a publicProcedure en routers.ts
- [x] Usar un userId fijo (1) en todos los queries que lo requieran
- [x] Eliminar pantalla de login del AppLayout
- [x] Remover referencias a useAuth y getLoginUrl del layout
- [x] Simplificar header del sidebar (sin usuario/logout)
