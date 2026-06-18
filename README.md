# Rifally
 
**Rifally** es una aplicación web para crear y gestionar rifas de forma sencilla. Permite organizar los números, compartir una página pública con los compradores, agregar colaboradores y realizar el sorteo con una ruleta integrada.
 
---
 
## Funcionalidades
 
### Para el organizador
- **Crear rifas** con nombre, premio, precio por número, fecha de cierre y colaboradores
- **Gestionar números** — apartar, editar o liberar números desde un grid interactivo
- **Editar la rifa** — modificar nombre, premio, precio y fecha después de crearla
- **Colaboradores** — agregar co-gestores que puedan apartar números; el creador no puede modificar lo que un colaborador apartó
- **Sorteo con ruleta** — selecciona uno o varios ganadores aleatoriamente entre los números apartados, con soporte para regiros y registro del motivo
- **Página pública compartible** — enlace único para que los compradores vean los números disponibles y el ganador
### Para el comprador (vista pública)
- Ver todos los números de la rifa y cuáles están disponibles o apartados
- Ver el ganador cuando la rifa esté finalizada
- Sin necesidad de cuenta
---
 
## Stack tecnológico
 
| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| Routing | React Router v7 |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Estilos | CSS puro con variables (`global.css`) |
| Fuentes | Inter + Space Grotesk (Google Fonts) |
 
---
 
## Estructura del proyecto
 
```
rifally/
├── index.html
├── vite.config.ts
├── package.json
├── .env                        # Variables de entorno (no subir al repo)
├── .env.example
└── src/
    ├── main.jsx                # Entrada de la app
    ├── App.jsx                 # Router principal y layouts
    ├── index.css               # Estilos base y #root
    ├── App.css                 # Estilos del counter/hero (Vite default, reusado)
    ├── lib/
    │   └── supabaseClient.ts   # Cliente de Supabase
    ├── hooks/
    │   └── useToast.jsx        # Hook para notificaciones
    ├── components/
    │   ├── Icons.jsx           # Todos los iconos SVG de la app
    │   ├── NumeroGrid.jsx      # Grid de números reutilizable
    │   ├── Toast.jsx           # Componente de notificación
    │   ├── Portal.jsx          # Portal React (modales sobre transform)
    │   └── modals/
    │       ├── ModalNumero.jsx         # Apartar / editar / liberar número
    │       ├── ModalColaboradores.jsx  # Gestionar colaboradores
    │       └── ModalRuleta.jsx         # Sorteo con ruleta
    ├── pages/
    │   ├── Landing.jsx         # Página de inicio (sin sesión)
    │   ├── Auth.jsx            # Login y registro
    │   ├── Dashboard.jsx       # Mis rifas y rifas donde colaboro
    │   ├── CrearRifa.jsx       # Formulario de creación
    │   ├── VistaRifa.jsx       # Gestión de rifa (creador/colaborador)
    │   └── VistaPublica.jsx    # Página pública de la rifa
    └── styles/
        └── global.css          # Sistema de diseño completo (variables, componentes)
```
 
---
 
## Esquema de base de datos (Supabase)
 
### `rifas`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `creador_id` | uuid | FK → `auth.users` |
| `creador_nombre` | text | Nombre del creador (desnormalizado para vista pública) |
| `creador_email` | text | Email del creador |
| `nombre` | text | Nombre de la rifa |
| `premio` | text | Descripción del premio |
| `precio` | numeric | Precio por número (opcional) |
| `total_numeros` | int | Cantidad total de números |
| `estado` | text | `activa` \| `finalizada` |
| `fecha_cierre` | date | Fecha tentativa de cierre (opcional) |
| `motivos_regiro` | jsonb | Historial de regiros `[{motivo}]` |
| `created_at` | timestamptz | Fecha de creación |
 
### `numeros`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `rifa_id` | uuid | FK → `rifas` |
| `numero` | int | Número (1 al total) |
| `apartado` | bool | Si está apartado |
| `nombre` | text | Nombre del comprador |
| `telefono` | text | Teléfono del comprador |
| `apartado_at` | timestamptz | Cuándo se apartó |
| `apartado_por` | uuid | FK → `auth.users` (quién lo apartó) |
| `ganador` | bool | Si es número ganador |
 
### `colaboradores`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `rifa_id` | uuid | FK → `rifas` |
| `email` | text | Email del colaborador |
| `nombre` | text | Nombre del colaborador |
 
### `profiles`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | FK → `auth.users` |
| `email` | text | Email del usuario |
| `name` | text | Nombre completo |

### Vistas públicas (lectura anónima)
La página pública nunca lee las tablas base; consume estas vistas, que solo exponen columnas no sensibles:

| Vista | Expone | Oculta |
|---|---|---|
| `rifas_publicas` | id, nombre, premio, precio, total_numeros, creador_nombre, estado, fecha_cierre, motivos_regiro, created_at | `creador_email`, `creador_id` |
| `numeros_publicos` | id, rifa_id, numero, apartado, ganador | `nombre`, `telefono`, `apartado_por`, `apartado_at` |
 
---
 
## Configuración inicial
 
### 1. Clonar el repositorio
 
```bash
git clone https://github.com/wllmvg/rifally.git
cd rifally
npm install
```
 
### 2. Crear el proyecto en Supabase
 
1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. En **SQL Editor**, ejecuta las migraciones en orden (ver sección siguiente)
3. Copia la **URL** y la **anon key** desde *Project Settings → API*
### 3. Variables de entorno
 
Crea un archivo `.env` en la raíz del proyecto:
 
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
 
### 4. Ejecutar en desarrollo
 
```bash
npm run dev
```
 
### 5. Build para producción
 
```bash
npm run build
```
 
Los archivos estáticos quedan en `/dist` listos para desplegar en Vercel, Netlify, o cualquier hosting estático.
 
---
 
## Migraciones SQL
 
Ejecuta estos scripts en el **SQL Editor de Supabase** en el orden indicado.
 
### Migración 1 — Tablas base
 
```sql
-- Tabla de rifas
CREATE TABLE rifas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creador_nombre  TEXT,
  creador_email   TEXT,
  nombre          TEXT NOT NULL,
  premio          TEXT NOT NULL,
  precio          NUMERIC,
  total_numeros   INT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'activa',
  fecha_cierre    DATE,
  motivos_regiro  JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
 
-- Tabla de números
CREATE TABLE numeros (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id      UUID REFERENCES rifas(id) ON DELETE CASCADE,
  numero       INT NOT NULL,
  apartado     BOOL DEFAULT FALSE,
  nombre       TEXT,
  telefono     TEXT,
  apartado_at  TIMESTAMPTZ,
  apartado_por UUID REFERENCES auth.users(id),
  ganador      BOOL DEFAULT FALSE
);
 
-- Tabla de colaboradores
CREATE TABLE colaboradores (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id  UUID REFERENCES rifas(id) ON DELETE CASCADE,
  email    TEXT NOT NULL,
  nombre   TEXT
);
 
-- Tabla de perfiles públicos
CREATE TABLE profiles (
  id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email  TEXT,
  name   TEXT,
  nombre TEXT
);
```
 
### Migración 2 — RLS, vistas públicas y políticas

> **Privacidad:** las tablas base **no** son legibles por sesiones anónimas.
> La página pública lee de vistas (`rifas_publicas`, `numeros_publicos`) que
> solo exponen columnas no sensibles, de modo que el nombre/teléfono de los
> compradores y el email del organizador nunca salen del servidor.

```sql
-- Habilitar RLS
ALTER TABLE rifas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE numeros       ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────
-- Vistas públicas: SOLO columnas no sensibles. La vista pública
-- (anónima) lee de aquí, nunca de las tablas base.
-- security_invoker = off  -> la vista corre como su owner, así anon
-- puede leerla sin tener acceso RLS a la tabla base.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.rifas_publicas
WITH (security_invoker = off) AS
  SELECT id, nombre, premio, precio, total_numeros,
         creador_nombre, estado, fecha_cierre, motivos_regiro, created_at
  FROM public.rifas;           -- omite creador_email y creador_id

CREATE OR REPLACE VIEW public.numeros_publicos
WITH (security_invoker = off) AS
  SELECT id, rifa_id, numero, apartado, ganador
  FROM public.numeros;         -- omite nombre, telefono, apartado_por, apartado_at

GRANT SELECT ON public.rifas_publicas, public.numeros_publicos TO anon, authenticated;

-- Las tablas base NO son legibles por sesiones anónimas
REVOKE SELECT ON public.rifas   FROM anon;
REVOKE SELECT ON public.numeros FROM anon;

-- ────────────────────────────────────────────────────────────────
-- Funciones de pertenencia (SECURITY DEFINER): se saltan la RLS de
-- las tablas que consultan -> evitan la recursión infinita entre las
-- policies de rifas y colaboradores (error 42P17).
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_collaborator(_rifa_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE c.rifa_id = _rifa_id AND lower(c.email) = lower(auth.email())
  );
$$;
REVOKE ALL ON FUNCTION public.is_collaborator(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_collaborator(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_rifa_member(_rifa_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rifas r
    WHERE r.id = _rifa_id AND r.creador_id = auth.uid()
  ) OR public.is_collaborator(_rifa_id);
$$;
REVOKE ALL ON FUNCTION public.is_rifa_member(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_rifa_member(uuid) TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- rifas: el dueño se comprueba con la COLUMNA directa (creador_id).
-- Es clave para que .insert().select() funcione: la fila del
-- RETURNING aún no es visible para una subconsulta a la propia tabla
-- vía función STABLE (si no, daría 42501).
-- ────────────────────────────────────────────────────────────────
CREATE POLICY "rifas_select" ON rifas FOR SELECT TO authenticated
  USING (creador_id = auth.uid() OR public.is_collaborator(id));
CREATE POLICY "rifas_insert" ON rifas FOR INSERT TO authenticated
  WITH CHECK (creador_id = auth.uid());
CREATE POLICY "rifas_update" ON rifas FOR UPDATE TO authenticated
  USING (creador_id = auth.uid() OR public.is_collaborator(id))
  WITH CHECK (creador_id = auth.uid() OR public.is_collaborator(id));
CREATE POLICY "rifas_delete" ON rifas FOR DELETE TO authenticated
  USING (creador_id = auth.uid());

-- numeros: dueño o colaborador de la rifa (lectura con PII incluida)
CREATE POLICY "numeros_select" ON numeros FOR SELECT TO authenticated
  USING (public.is_rifa_member(rifa_id));
CREATE POLICY "numeros_insert" ON numeros FOR INSERT TO authenticated
  WITH CHECK (public.is_rifa_member(rifa_id));
CREATE POLICY "numeros_update" ON numeros FOR UPDATE TO authenticated
  USING (public.is_rifa_member(rifa_id))
  WITH CHECK (public.is_rifa_member(rifa_id));
CREATE POLICY "numeros_delete" ON numeros FOR DELETE TO authenticated
  USING (public.is_rifa_member(rifa_id));

-- colaboradores: lectura para el dueño o el propio colaborador; escritura solo dueño
CREATE POLICY "colabs_select" ON colaboradores FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rifas WHERE rifas.id = colaboradores.rifa_id AND rifas.creador_id = auth.uid())
    OR lower(colaboradores.email) = lower(auth.email())
  );
CREATE POLICY "colabs_write_creador" ON colaboradores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM rifas WHERE rifas.id = colaboradores.rifa_id AND rifas.creador_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM rifas WHERE rifas.id = colaboradores.rifa_id AND rifas.creador_id = auth.uid()));

-- profiles: lectura solo para autenticados (búsqueda de colaboradores).
-- anon NO puede leer emails. Escritura solo del propio perfil.
REVOKE SELECT ON public.profiles FROM anon;
CREATE POLICY "profiles_select_auth" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_write_own"   ON profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```
 
### Migración 3 — Trigger para sincronizar profiles
 
```sql
-- Sincronizar nombre al registrarse
CREATE OR REPLACE FUNCTION public.sync_profile_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name  = COALESCE(EXCLUDED.name, profiles.name);
  RETURN NEW;
END;
$$;
 
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_on_signup();
 
-- Rellenar profiles para usuarios ya existentes
INSERT INTO profiles (id, email, name)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'nombre',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  )
FROM auth.users
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name  = COALESCE(EXCLUDED.name, profiles.name);
```
 
---
 
## Rutas de la aplicación
 
| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Landing page | Público |
| `/app` | Dashboard — mis rifas | Autenticado |
| `/app/crear` | Crear nueva rifa | Autenticado |
| `/app/gestionar/:id` | Gestionar rifa | Autenticado (creador/colaborador) |
| `/rifa/:id` | Página pública de la rifa | Público |
 
---
 
## Despliegue
 
### Vercel
 
```bash
npm i -g vercel
vercel
```
 
Agrega las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` desde el dashboard de Vercel.
 
Como es una SPA con React Router, agrega un archivo `vercel.json`:
 
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
 
### Netlify
 
Agrega un archivo `public/_redirects`:
 
```
/*  /index.html  200
```
 
---
 
## Notas técnicas
 
**Portal para modales** — todos los modales se renderizan con `ReactDOM.createPortal` directamente en el `document.body`. Esto evita el bug donde `position: fixed` queda confinado dentro de ancestros con `transform` (la animación `pageEnter` de `.page` usaba `translateY`).
 
**Nombre del organizador en vista pública** — el nombre del creador se guarda directamente en la tabla `rifas` (`creador_nombre`) al momento de crear la rifa. Esto evita depender de una query a `profiles` que falla por RLS cuando el visitante no tiene sesión iniciada.
 
**Restricción creador/colaborador** — la columna `apartado_por` en `numeros` guarda el `user.id` de quien apartó el número. Si el creador intenta editar un número que fue apartado por un colaborador (distinto `user.id`), se abre el modal de solo lectura.

**Privacidad de datos en la vista pública** — `nombre`/`telefono` de los compradores y `creador_email` del organizador son PII. Las tablas base tienen `REVOKE SELECT ... FROM anon`, así que una sesión anónima no puede leerlas ni siquiera llamando directamente al REST API con la anon key. La página pública (`VistaPublica.jsx`) consume las vistas `rifas_publicas` / `numeros_publicos`, que no contienen esas columnas. Anular los campos en el cliente no sirve: el JSON crudo viajaría igual y sería visible en DevTools.

**RLS sin recursión y `.insert().select()`** — las comprobaciones de pertenencia van en funciones `SECURITY DEFINER` (`is_collaborator`, `is_rifa_member`) para no caer en recursión entre las policies de `rifas` y `colaboradores` (error `42P17`). Además, la policy de `SELECT` de `rifas` comprueba al dueño con la columna directa `creador_id = auth.uid()` (no re-consultando la tabla), porque la fila recién insertada por `.insert().select()` no es visible para una subconsulta `STABLE` dentro del mismo `RETURNING` (error `42501`).
