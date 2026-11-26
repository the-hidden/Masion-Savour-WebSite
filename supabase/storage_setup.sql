-- =====================================================================
-- Mansion Savour · Imágenes de platos en Supabase Storage
--
-- Cómo usarlo: Supabase -> SQL Editor -> New query -> pegar TODO -> Run.
-- Ejecútalo DESPUÉS de supabase/admin_setup.sql. Es seguro repetirlo.
--
-- Qué deja configurado:
--   * Un bucket PÚBLICO llamado "platos": cualquiera puede VER una imagen si
--     tiene su enlace (necesario para que se muestre en tu página), pero nadie
--     puede listar ni modificar archivos sin ser empleado.
--   * Solo los EMPLEADOS pueden subir, reemplazar y borrar imágenes.
--   * El servidor rechaza archivos de más de 2 MB o que no sean WebP/JPEG,
--     aunque alguien se salte las validaciones del navegador.
--
-- ¿Bucket privado? Para contenido que NO debe ser público (comprobantes,
-- documentos) pon public = false y entrega las imágenes con enlaces firmados:
--   supabase.storage.from('bucket').createSignedUrl(ruta, 3600)
-- =====================================================================


-- 0) Por si no ejecutaste antes admin_setup.sql (no cambia nada si ya existe) ---
create or replace function public.es_empleado()
returns boolean
language sql
stable
as $$
    select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'empleado', false);
$$;


-- 1) Bucket ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'platos',
    'platos',
    true,                                   -- público: la web muestra las fotos con su URL
    2097152,                                -- 2 MB por archivo (la app ya las reduce a ~100-300 KB)
    array['image/webp', 'image/jpeg']       -- lo único que genera el panel; añade 'image/png' si lo necesitas
)
on conflict (id) do update
    set public             = excluded.public,
        file_size_limit    = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;


-- 2) Políticas sobre storage.objects (quién puede hacer qué con los archivos) ---
-- Leer una imagen por su enlace público NO necesita política (es un bucket público).
-- Estas políticas controlan lo que se hace a través de la API (subir, borrar, listar).
drop policy if exists "Empleados ven imágenes de platos"      on storage.objects;
drop policy if exists "Empleados suben imágenes de platos"    on storage.objects;
drop policy if exists "Empleados editan imágenes de platos"   on storage.objects;
drop policy if exists "Empleados borran imágenes de platos"   on storage.objects;

create policy "Empleados ven imágenes de platos"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'platos' and (select public.es_empleado()));

create policy "Empleados suben imágenes de platos"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'platos' and (select public.es_empleado()));

create policy "Empleados editan imágenes de platos"
    on storage.objects for update
    to authenticated
    using      (bucket_id = 'platos' and (select public.es_empleado()))
    with check (bucket_id = 'platos' and (select public.es_empleado()));

create policy "Empleados borran imágenes de platos"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'platos' and (select public.es_empleado()));
