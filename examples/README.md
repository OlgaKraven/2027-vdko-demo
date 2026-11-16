# Примеры выполнения · Оператор технической поддержки

Распакуйте ZIP в отдельную папку. Откройте `index.html` в браузере. Для просмотра отчётов и снимков внутри архива интернет не нужен.

Для задания 1 откройте `examples/tickets-solved.xlsx` в Excel или Calc. В нём десять заявок. В `examples/client-responses.docx` находятся пять ответов, а в `examples/tech-cards.docx` — две карты на отдельных страницах. Для задания 3 откройте `examples/diagnostic-report.html` и `examples/diagnostic-stand.html`. Данные там приведены для разбора. На своём стенде фиксируйте фактический журнал, замеры и результат проверки.

## Как импортировать базу без интернета

Заранее установите одну СУБД с клиентом из раздела 0 сайта. Для PostgreSQL потребуется `psql`, для MySQL — `mysql`, для SQL Server — `sqlcmd` или SSMS. Проверьте, что локальный сервер запущен, порт известен и вы можете подключиться как администратор. После этого подключение к интернету для импорта не нужно. В комплекте отчёты и SQL-выгрузки.

В pgAdmin, Workbench или SSMS создайте **новую пустую базу `de_check`**. Если имя занято, выберите другое и подставьте его во всех командах. В Проводнике откройте распакованную папку, введите `powershell` в её адресную строку и нажмите Enter. Проверьте командой `Get-ChildItem`, что видите `README.md`, `index.html` и папку `examples`.

### PostgreSQL

Выполните в PowerShell. Укажите путь к `psql.exe` вашей версии, свой порт и имя администратора. Пароль вводится по запросу. Ключ `ON_ERROR_STOP=1` прекращает импорт при первой ошибке.

```powershell
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
& $psql -h 127.0.0.1 -p 5432 -U postgres -d de_check -v ON_ERROR_STOP=1 -f .\examples\clients.sql
& $psql -h 127.0.0.1 -p 5432 -U postgres -d de_check -c 'SELECT id, name, email, reg_date FROM public.clients ORDER BY id;'
```

Чтобы отдельно проверить права пяти ролей, используйте чистый учебный экземпляр. Файл `examples/setup.sql` сам создаёт `corpdata_07`, заполняет таблицу и выдаёт разрешения. Запускайте его через `psql` из базы `postgres`. Перед первым входом задайте каждой роли свой пароль командой `\password client01`, повторив её для `client02`–`client05`. Матрицу можно вывести файлом `examples/verify.sql` в подключении к `corpdata_07`.

```powershell
& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v seat=07 -f .\examples\setup.sql
& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres
```

Выйдите из сеанса администратора командой `\q`. Откройте новое подключение и введите пароль `client03`.

```powershell
& $psql -h 127.0.0.1 -p 5432 -U client03 -d corpdata_07
```

В `psql` выполните `SELECT id, email FROM public.clients ORDER BY id;`. Вы увидите две строки. Затем `UPDATE public.clients SET name = name WHERE 1 = 0;` должен вернуть отказ в праве `UPDATE`.

### MySQL 8.4 LTS

Откройте клиент из той же распакованной папки. Путь к `mysql.exe` и порт возьмите из своей установки. Введите пароль администратора по запросу.

```powershell
$mysql = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
& $mysql -h 127.0.0.1 -P 3306 -u root -p --default-character-set=utf8mb4 de_check
```

После входа выполните в `mysql`. `SOURCE` читает файл относительно папки, из которой запущен клиент.

```sql
SOURCE ./examples/clients-mysql.sql;
SELECT id, name, email, reg_date FROM clients ORDER BY id;
```

В `examples/database-report-mysql.html` есть матрица ролей и подтверждения проверки. Импорт восстанавливает таблицу и данные. Учётные записи `client01`–`client05` создаются на своём сервере. Укажите хост учётной записи, из которого будет выполнено подключение, и выдайте права только на `de_check.clients`.

### SQL Server Express

Для локального экземпляра с Windows Authentication проверьте его имя в SSMS. В командах указаны именованный экземпляр `.\SQLEXPRESS` и локальный самоподписанный сертификат. `-b` останавливает импорт с ошибкой, если SQL Server отклонил команду.

```powershell
sqlcmd -S '.\SQLEXPRESS' -E -C -b -d de_check -i .\examples\clients-sqlserver.sql
sqlcmd -S '.\SQLEXPRESS' -E -C -b -d de_check -Q 'SELECT id, name, email, reg_date FROM dbo.clients ORDER BY id;'
```

Через SSMS подключитесь к своему локальному экземпляру, откройте `examples/clients-sqlserver.sql` через **File → Open → File**. В списке баз над редактором выберите `de_check` и нажмите **Execute**. Откройте новый запрос в той же базе и выполните `SELECT id, name, email, reg_date FROM dbo.clients ORDER BY id;`.

В `examples/database-report-sqlserver.html` есть матрица ролей и подтверждения проверки. Для отдельного входа каждой роли создайте серверный логин и сопоставьте ему пользователя в `de_check`. Права выдаются на таблицу `dbo.clients`.

## Что должно получиться

Запрос после импорта возвращает две строки с `a@example.test` и `b@example.test`. Даты регистрации — `2027-01-10` и `2027-01-11`. Для проверки прав войдите под отдельной учебной учётной записью. Под `client03` чтение обеих строк должно пройти, а запрос `UPDATE` — получить отказ даже при условии `WHERE 1 = 0`.
