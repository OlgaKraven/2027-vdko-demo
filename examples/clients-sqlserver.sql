-- Выполнить в новой пустой базе SQL Server.
CREATE TABLE dbo.clients (
    id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name varchar(100) NOT NULL,
    email varchar(254) NOT NULL,
    reg_date date NOT NULL
);
GO

SET IDENTITY_INSERT dbo.clients ON;
INSERT INTO dbo.clients (id, name, email, reg_date)
VALUES (1, 'Client A', 'a@example.test', '20270110'),
       (2, 'Client B', 'b@example.test', '20270111');
SET IDENTITY_INSERT dbo.clients OFF;
GO
