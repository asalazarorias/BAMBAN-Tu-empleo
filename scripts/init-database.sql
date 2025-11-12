-- ============================================
-- Script de Inicialización de Base de Datos
-- Aplicación: Chambita - Bolivia
-- Base de Datos: chambita_db
-- ============================================

USE master;
GO

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'chambita_db')
BEGIN
    CREATE DATABASE chambita_db;
    PRINT '✅ Base de datos chambita_db creada';
END
ELSE
BEGIN
    PRINT '⚠️ La base de datos chambita_db ya existe';
END
GO

USE chambita_db;
GO

-- ============================================
-- TABLA: Users (Perfiles de Usuario)
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        id NVARCHAR(255) PRIMARY KEY,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('seeker', 'serviceSeeker', 'employer')),
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        phoneIntl NVARCHAR(50),
        city NVARCHAR(100),
        career NVARCHAR(255),
        specialty NVARCHAR(255),
        summary NVARCHAR(MAX),
        languages NVARCHAR(MAX), -- JSON array
        certificates NVARCHAR(MAX), -- JSON array
        skills NVARCHAR(MAX), -- JSON array
        experiences NVARCHAR(MAX), -- JSON array
        serviceCategories NVARCHAR(MAX), -- JSON array
        isProfilePublic BIT DEFAULT 1,
        previousWorks NVARCHAR(MAX), -- JSON array
        reviews NVARCHAR(MAX), -- JSON array of objects
        rating FLOAT,
        companyName NVARCHAR(255),
        taxId NVARCHAR(100),
        isEmployerVerified BIT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla Users creada';
END
GO

-- ============================================
-- TABLA: Companies (Empresas)
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Companies' AND xtype='U')
BEGIN
    CREATE TABLE Companies (
        id NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        region NVARCHAR(100),
        department NVARCHAR(100),
        city NVARCHAR(100),
        address NVARCHAR(500),
        sector NVARCHAR(255),
        phone NVARCHAR(50),
        email NVARCHAR(255),
        website NVARCHAR(500),
        description NVARCHAR(MAX),
        employeeCount NVARCHAR(50),
        foundedYear NVARCHAR(10),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla Companies creada';
END
GO

-- ============================================
-- TABLA: JobPosts (Publicaciones de Trabajo)
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='JobPosts' AND xtype='U')
BEGIN
    CREATE TABLE JobPosts (
        id NVARCHAR(255) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        city NVARCHAR(100) NOT NULL,
        employerId NVARCHAR(255) NOT NULL,
        type NVARCHAR(50) NOT NULL CHECK (type IN ('fullTime', 'partTime')),
        modality NVARCHAR(50) NOT NULL CHECK (modality IN ('onsite', 'remote', 'hybrid')),
        requirements NVARCHAR(MAX), -- JSON array
        obligations NVARCHAR(MAX), -- JSON array
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (employerId) REFERENCES Users(id)
    );
    PRINT '✅ Tabla JobPosts creada';
END
GO

-- ============================================
-- TABLA: JobOpportunities (Oportunidades de Empleo)
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='JobOpportunities' AND xtype='U')
BEGIN
    CREATE TABLE JobOpportunities (
        id NVARCHAR(255) PRIMARY KEY,
        department NVARCHAR(100) NOT NULL,
        sector NVARCHAR(255) NOT NULL,
        companyName NVARCHAR(255) NOT NULL,
        position NVARCHAR(255),
        city NVARCHAR(100),
        address NVARCHAR(500),
        phone NVARCHAR(50),
        email NVARCHAR(255),
        website NVARCHAR(500),
        description NVARCHAR(MAX),
        requirements NVARCHAR(MAX),
        salary NVARCHAR(100),
        schedule NVARCHAR(100),
        contractType NVARCHAR(100),
        benefits NVARCHAR(MAX),
        experience NVARCHAR(255),
        contactPerson NVARCHAR(255),
        additionalData NVARCHAR(MAX), -- JSON object
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla JobOpportunities creada';
END
GO

-- ============================================
-- TABLA: Employees (Empleados)
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Employees' AND xtype='U')
BEGIN
    CREATE TABLE Employees (
        id NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        position NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        hireDate DATETIME NOT NULL,
        department NVARCHAR(100) NOT NULL,
        salary FLOAT NOT NULL,
        status NVARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        photoUrl NVARCHAR(500),
        address NVARCHAR(500),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla Employees creada';
END
GO

-- ============================================
-- TABLA: Memorandums (Amonestaciones)
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Memorandums' AND xtype='U')
BEGIN
    CREATE TABLE Memorandums (
        id NVARCHAR(255) PRIMARY KEY,
        employeeId NVARCHAR(255) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        date DATETIME NOT NULL,
        severity NVARCHAR(50) NOT NULL CHECK (severity IN ('leve', 'grave', 'muy_grave')),
        issuedBy NVARCHAR(255) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (employeeId) REFERENCES Employees(id) ON DELETE CASCADE
    );
    PRINT '✅ Tabla Memorandums creada';
END
GO

-- ============================================
-- TABLA: Recognitions (Reconocimientos)
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Recognitions' AND xtype='U')
BEGIN
    CREATE TABLE Recognitions (
        id NVARCHAR(255) PRIMARY KEY,
        employeeId NVARCHAR(255) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        date DATETIME NOT NULL,
        type NVARCHAR(100) NOT NULL,
        issuedBy NVARCHAR(255) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (employeeId) REFERENCES Employees(id) ON DELETE CASCADE
    );
    PRINT '✅ Tabla Recognitions creada';
END
GO

-- ============================================
-- TABLA: Emprendimientos
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Emprendimientos' AND xtype='U')
BEGIN
    CREATE TABLE Emprendimientos (
        id NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        products NVARCHAR(MAX), -- JSON array
        phone NVARCHAR(50),
        ownerId NVARCHAR(255),
        image1Url NVARCHAR(500),
        image2Url NVARCHAR(500),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ownerId) REFERENCES Users(id)
    );
    PRINT '✅ Tabla Emprendimientos creada';
END
GO

PRINT '';
PRINT '🎉 ¡Base de datos inicializada exitosamente!';
PRINT '';
PRINT '📋 Tablas creadas:';
PRINT '   - Users (Usuarios y perfiles)';
PRINT '   - Companies (Empresas)';
PRINT '   - JobPosts (Publicaciones de trabajo)';
PRINT '   - JobOpportunities (Oportunidades de empleo)';
PRINT '   - Employees (Empleados)';
PRINT '   - Memorandums (Amonestaciones)';
PRINT '   - Recognitions (Reconocimientos)';
PRINT '   - Emprendimientos';
PRINT '';
PRINT '🔑 Roles de usuario disponibles:';
PRINT '   - seeker (Buscador de trabajo)';
PRINT '   - serviceSeeker (Proveedor de servicios)';
PRINT '   - employer (Empresa)';
PRINT '';
PRINT '📝 Para insertar datos de ejemplo, ejecuta:';
PRINT '   npm run seed';
PRINT '';
