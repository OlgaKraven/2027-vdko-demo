-- Подключитесь к corpdata_XY от имени администратора.
SELECT r.rolname,
       has_table_privilege(r.rolname, 'public.clients', 'SELECT') AS can_select,
       has_table_privilege(r.rolname, 'public.clients', 'INSERT') AS can_insert,
       has_table_privilege(r.rolname, 'public.clients', 'UPDATE') AS can_update,
       has_table_privilege(r.rolname, 'public.clients', 'DELETE') AS can_delete
FROM pg_roles AS r
WHERE r.rolname IN ('client01','client02','client03','client04','client05')
ORDER BY r.rolname;
