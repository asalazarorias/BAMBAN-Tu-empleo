const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    const pool = await getConnection();

    console.log('🔧 Iniciando creación de tablas...\n');

    // Tabla de Usuarios (UserProfile)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
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
    `);
    console.log('✅ Tabla Users creada');

    // Tabla de Empresas (Company)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Companies' AND xtype='U')
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
    `);
    console.log('✅ Tabla Companies creada');

    // Tabla de Publicaciones de Trabajo (JobPost)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='JobPosts' AND xtype='U')
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
    `);
    console.log('✅ Tabla JobPosts creada');

    // Tabla de Oportunidades de Empleo (JobOpportunity)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='JobOpportunities' AND xtype='U')
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
    `);
    console.log('✅ Tabla JobOpportunities creada');

    // Tabla de Empleados (Employee)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Employees' AND xtype='U')
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
    `);
    console.log('✅ Tabla Employees creada');

    // Tabla de Memorandums
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Memorandums' AND xtype='U')
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
    `);
    console.log('✅ Tabla Memorandums creada');

    // Tabla de Reconocimientos (Recognition)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Recognitions' AND xtype='U')
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
    `);
    console.log('✅ Tabla Recognitions creada');

    // Tabla de Emprendimientos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Emprendimientos' AND xtype='U')
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
    `);
    console.log('✅ Tabla Emprendimientos creada');

    console.log('\n✨ ¡Base de datos inicializada exitosamente!');
    
    // Preguntar si desea insertar datos de ejemplo
    console.log('\n📊 ¿Deseas insertar datos de ejemplo?');
    console.log('Para insertar datos de ejemplo, ejecuta: npm run seed');
    
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
    throw error;
  }
};

// Función para insertar datos de ejemplo (seed)
const seedDatabase = async () => {
  try {
    const pool = await getConnection();
    
    console.log('🌱 Insertando datos de ejemplo...\n');

    // Hash de contraseña por defecto
    const defaultPassword = await bcrypt.hash('123456', 10);

    // Insertar usuarios de ejemplo
    const users = [
      {
        id: 'user-ana-perez',
        role: 'seeker',
        name: 'Ana Pérez',
        email: 'ana@example.com',
        password: defaultPassword,
        city: 'La Paz',
        career: 'Ingeniería de Sistemas',
        specialty: 'Frontend React',
        phoneIntl: '59171234567',
        summary: 'Desarrolladora Frontend con 5+ años de experiencia creando aplicaciones web modernas y escalables. Apasionada por la experiencia de usuario y el código limpio.',
        languages: JSON.stringify(['Español (nativo)', 'Inglés (avanzado)', 'Portugués (intermedio)']),
        certificates: JSON.stringify([
          'React Developer Certification - Meta',
          'AWS Certified Cloud Practitioner',
          'Scrum Master Certified - Scrum Alliance'
        ]),
        skills: JSON.stringify(['React', 'TypeScript', 'Flutter', 'Next.js', 'Node.js', 'Git', 'Docker']),
        experiences: JSON.stringify([
          'Tech Solutions SRL · 2021-2024 · Senior Frontend Developer',
          'StartUp Innova · 2019-2021 · Frontend Developer',
          'Freelance · 2018-2019 · Web Developer'
        ]),
        serviceCategories: JSON.stringify(['Desarrollo web', 'Consultoría técnica'])
      },
      {
        id: 'user-luis-garcia',
        role: 'seeker',
        name: 'Luis García',
        email: 'luis@example.com',
        password: defaultPassword,
        city: 'Santa Cruz de la Sierra',
        career: 'Diseño Gráfico',
        specialty: 'UI/UX',
        phoneIntl: '59176543210',
        summary: 'Diseñador UI/UX con enfoque en crear experiencias digitales memorables. Especializado en diseño de interfaces modernas, branding y sistemas de diseño.',
        languages: JSON.stringify(['Español (nativo)', 'Inglés (intermedio)']),
        certificates: JSON.stringify([
          'Google UX Design Professional Certificate',
          'Adobe Certified Expert - Photoshop',
          'Figma Advanced Certification'
        ]),
        skills: JSON.stringify(['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Branding', 'UI Design', 'Prototyping']),
        experiences: JSON.stringify([
          'Agencia Creativa Plus · 2020-2024 · Senior UI/UX Designer',
          'Marketing Digital SCZ · 2018-2020 · Diseñador Gráfico'
        ]),
        serviceCategories: JSON.stringify(['Diseño gráfico', 'Diseño UI/UX'])
      },
      {
        id: 'user-maria-rodriguez',
        role: 'seeker',
        name: 'María Rodríguez',
        email: 'maria@example.com',
        password: defaultPassword,
        city: 'Cochabamba',
        career: 'Ingeniería Informática',
        specialty: 'Backend Python',
        phoneIntl: '59144321098',
        summary: 'Backend Developer especializada en Python y arquitecturas escalables. Experiencia en microservicios, APIs RESTful y bases de datos relacionales y no relacionales.',
        languages: JSON.stringify(['Español (nativo)', 'Inglés (avanzado)', 'Francés (básico)']),
        certificates: JSON.stringify([
          'Python Institute PCAP Certification',
          'AWS Solutions Architect Associate',
          'MongoDB Certified Developer',
          'Docker Certified Associate'
        ]),
        skills: JSON.stringify(['Python', 'Django', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS']),
        experiences: JSON.stringify([
          'CloudTech Bolivia · 2022-2024 · Senior Backend Engineer',
          'SoftDev CBBA · 2020-2022 · Backend Developer',
          'Internship Tech Company · 2019-2020 · Junior Developer'
        ]),
        serviceCategories: JSON.stringify(['Desarrollo web', 'Arquitectura de software'])
      },
      {
        id: 'user-carlos-mendoza',
        role: 'seeker',
        name: 'Carlos Mendoza',
        email: 'carlos@example.com',
        password: defaultPassword,
        city: 'La Paz',
        career: 'Marketing Digital',
        specialty: 'Community Manager',
        phoneIntl: '59172345678',
        summary: 'Especialista en Marketing Digital y Community Management con 4 años de experiencia. Experto en estrategias de contenido, gestión de redes sociales y analítica digital.',
        languages: JSON.stringify(['Español (nativo)', 'Inglés (avanzado)']),
        certificates: JSON.stringify([
          'Google Digital Marketing Certificate',
          'Facebook Blueprint Certification',
          'HubSpot Content Marketing',
          'Google Analytics Certification'
        ]),
        skills: JSON.stringify(['Social Media', 'Content Strategy', 'SEO', 'Google Ads', 'Analytics', 'Copywriting']),
        experiences: JSON.stringify([
          'Agencia Marketing 360 · 2021-2024 · Social Media Manager',
          'Empresa Retail Boliviana · 2020-2021 · Community Manager'
        ]),
        serviceCategories: JSON.stringify(['Marketing digital', 'Redacción y traducción'])
      },
      {
        id: 'user-sofia-vargas',
        role: 'seeker',
        name: 'Sofía Vargas',
        email: 'sofia@example.com',
        password: defaultPassword,
        city: 'Santa Cruz de la Sierra',
        career: 'Administración de Empresas',
        specialty: 'Project Manager',
        phoneIntl: '59177654321',
        summary: 'Project Manager certificada con experiencia liderando equipos multidisciplinarios en proyectos tecnológicos. Enfoque en metodologías ágiles y entrega de valor.',
        languages: JSON.stringify(['Español (nativo)', 'Inglés (avanzado)', 'Alemán (básico)']),
        certificates: JSON.stringify([
          'PMP - Project Management Professional',
          'Certified Scrum Master (CSM)',
          'SAFe Agilist Certification',
          'PRINCE2 Foundation'
        ]),
        skills: JSON.stringify(['Scrum', 'Agile', 'JIRA', 'Confluence', 'Risk Management', 'Team Leadership']),
        experiences: JSON.stringify([
          'Tech International Corp · 2021-2024 · Senior Project Manager',
          'Consulting Group SCZ · 2019-2021 · Project Coordinator',
          'Startup TechHub · 2018-2019 · Scrum Master'
        ]),
        serviceCategories: JSON.stringify(['Consultoría', 'Project Management'])
      },
      {
        id: 'user-diego-flores',
        role: 'seeker',
        name: 'Diego Flores',
        email: 'diego@example.com',
        password: defaultPassword,
        city: 'Cochabamba',
        career: 'Ingeniería de Sistemas',
        specialty: 'Full Stack Developer',
        phoneIntl: '59144998877',
        summary: 'Full Stack Developer con pasión por crear soluciones innovadoras. Experiencia en aplicaciones web y móviles, desde el diseño hasta el despliegue en producción.',
        languages: JSON.stringify(['Español (nativo)', 'Inglés (intermedio)']),
        certificates: JSON.stringify([
          'Meta Full Stack Engineer Certificate',
          'AWS Certified Developer',
          'MongoDB University Certification'
        ]),
        skills: JSON.stringify(['React', 'Node.js', 'Express', 'Flutter', 'PostgreSQL', 'MongoDB', 'GraphQL', 'TypeScript']),
        experiences: JSON.stringify([
          'Software House CBBA · 2020-2024 · Full Stack Developer',
          'Freelance · 2018-2020 · Web Developer'
        ]),
        serviceCategories: JSON.stringify(['Desarrollo web', 'Desarrollo móvil'])
      },
      // Proveedores de servicios técnicos
      {
        id: 'user-roberto-plomero',
        role: 'serviceSeeker',
        name: 'Roberto Plomero',
        email: 'roberto.plomero@example.com',
        password: defaultPassword,
        city: 'La Paz',
        phoneIntl: '59171111111',
        summary: 'Plomero con 10 años de experiencia. Reparaciones, instalaciones y mantenimiento.',
        serviceCategories: JSON.stringify(['Plomería']),
        skills: JSON.stringify(['Instalación de cañerías', 'Reparación de fugas', 'Mantenimiento de tanques']),
        rating: 4.8,
        previousWorks: JSON.stringify([
          'Reparación de tubería en Edificio Los Pinos',
          'Instalación de sistema de agua caliente en Casa Familia Pérez',
          'Mantenimiento preventivo en Condominio El Alto'
        ]),
        reviews: JSON.stringify([
          {author: 'María López', comment: 'Excelente trabajo, muy rápido y limpio.', rating: '5'},
          {author: 'Juan García', comment: 'Muy profesional, resolvió el problema en una hora.', rating: '5'},
          {author: 'Carla Ruiz', comment: 'Buen servicio, pero llegó un poco tarde.', rating: '4'}
        ])
      },
      {
        id: 'user-carlos-electricista',
        role: 'serviceSeeker',
        name: 'Carlos Electricista',
        email: 'carlos.electrico@example.com',
        password: defaultPassword,
        city: 'Santa Cruz de la Sierra',
        phoneIntl: '59172222222',
        summary: 'Electricista certificado. Instalaciones, reparaciones y revisiones técnicas.',
        serviceCategories: JSON.stringify(['Electricidad']),
        skills: JSON.stringify(['Instalación de paneles', 'Reparación de cortocircuitos', 'Mantenimiento eléctrico']),
        rating: 4.9,
        previousWorks: JSON.stringify([
          'Instalación eléctrica completa en Casa Nueva SCZ',
          'Reparación de cortocircuito en Oficinas CentralTech',
          'Revisión técnica en Restaurante El Buen Sabor'
        ]),
        reviews: JSON.stringify([
          {author: 'Pedro Fernández', comment: 'Muy responsable, trabajo impecable.', rating: '5'},
          {author: 'Ana Morales', comment: 'Rápido y eficiente, lo recomiendo.', rating: '5'},
          {author: 'Luis Méndez', comment: 'Excelente atención y calidad.', rating: '5'}
        ])
      },
      {
        id: 'user-sofia-chef',
        role: 'serviceSeeker',
        name: 'Sofía Chef',
        email: 'sofia.chef@example.com',
        password: defaultPassword,
        city: 'Cochabamba',
        phoneIntl: '59173333333',
        summary: 'Chef profesional con 8 años de experiencia en cocina nacional e internacional.',
        serviceCategories: JSON.stringify(['Cocina']),
        skills: JSON.stringify(['Cocina boliviana', 'Repostería', 'Catering para eventos']),
        rating: 4.7,
        previousWorks: JSON.stringify([
          'Catering para boda de 150 personas',
          'Clases de cocina privadas para familia Rodríguez',
          'Chef a domicilio para cena corporativa'
        ]),
        reviews: JSON.stringify([
          {author: 'Martha Sánchez', comment: 'La comida estuvo deliciosa, todos felices.', rating: '5'},
          {author: 'Ricardo Paz', comment: 'Muy creativa, platos espectaculares.', rating: '5'},
          {author: 'Gloria Herrera', comment: 'Buena sazón, pero un poco caro.', rating: '4'}
        ])
      },
      {
        id: 'user-elena-limpieza',
        role: 'serviceSeeker',
        name: 'Elena Limpieza',
        email: 'elena.limpieza@example.com',
        password: defaultPassword,
        city: 'La Paz',
        phoneIntl: '59174444444',
        summary: 'Servicio de limpieza profesional para casas y oficinas. Productos ecológicos.',
        serviceCategories: JSON.stringify(['Limpieza']),
        skills: JSON.stringify(['Limpieza profunda', 'Desinfección', 'Organización de espacios']),
        rating: 4.9,
        previousWorks: JSON.stringify([
          'Limpieza profunda de Oficina MegaCorp',
          'Desinfección post-mudanza en Depto. Obrajes',
          'Limpieza semanal en Casa Familia Vargas'
        ]),
        reviews: JSON.stringify([
          {author: 'Daniel Castro', comment: 'Impecable, dejó todo brillando.', rating: '5'},
          {author: 'Patricia Rojas', comment: 'Muy detallista y puntual.', rating: '5'},
          {author: 'Miguel Torres', comment: 'Excelente servicio, muy recomendable.', rating: '5'}
        ])
      },
      {
        id: 'user-fernando-carpintero',
        role: 'serviceSeeker',
        name: 'Fernando Carpintero',
        email: 'fernando.carpintero@example.com',
        password: defaultPassword,
        city: 'Santa Cruz de la Sierra',
        phoneIntl: '59175555555',
        summary: 'Carpintero especializado en muebles a medida y reparaciones de todo tipo.',
        serviceCategories: JSON.stringify(['Carpintería']),
        skills: JSON.stringify(['Muebles a medida', 'Reparación de puertas', 'Restauración de madera']),
        rating: 4.6,
        previousWorks: JSON.stringify([
          'Fabricación de mueble de TV en Casa Martínez',
          'Reparación de puerta principal en Casa López',
          'Restauración de mesa antigua para Familia Roca'
        ]),
        reviews: JSON.stringify([
          {author: 'Silvia Navarro', comment: 'Hermoso trabajo, quedó perfecto.', rating: '5'},
          {author: 'Alberto Díaz', comment: 'Buen acabado, pero tardó más de lo previsto.', rating: '4'},
          {author: 'Carmen Flores', comment: 'Muy hábil, lo volvería a contratar.', rating: '5'}
        ])
      },
      {
        id: 'user-javier-jardinero',
        role: 'serviceSeeker',
        name: 'Javier Jardinero',
        email: 'javier.jardinero@example.com',
        password: defaultPassword,
        city: 'Cochabamba',
        phoneIntl: '59176666666',
        summary: 'Jardinero profesional. Diseño, mantenimiento y poda de jardines.',
        serviceCategories: JSON.stringify(['Jardinería']),
        skills: JSON.stringify(['Diseño de jardines', 'Poda de árboles', 'Mantenimiento de césped']),
        rating: 4.8,
        previousWorks: JSON.stringify([
          'Diseño e instalación de jardín en Quinta Los Olivos',
          'Poda de árboles en Parque Residencial',
          'Mantenimiento mensual en Casa Familia Suárez'
        ]),
        reviews: JSON.stringify([
          {author: 'Rosa Gutiérrez', comment: 'El jardín quedó hermoso, muy profesional.', rating: '5'},
          {author: 'Andrés Silva', comment: 'Excelente servicio, muy cuidadoso.', rating: '5'},
          {author: 'Lucía Campos', comment: 'Buen trabajo, pero faltó comunicación.', rating: '4'}
        ])
      },
      {
        id: 'user-marta-pintora',
        role: 'serviceSeeker',
        name: 'Marta Pintora',
        email: 'marta.pintora@example.com',
        password: defaultPassword,
        city: 'La Paz',
        phoneIntl: '59177777777',
        summary: 'Pintora con 12 años de experiencia en pintura de interiores y exteriores.',
        serviceCategories: JSON.stringify(['Pintura']),
        skills: JSON.stringify(['Pintura de interiores', 'Pintura de exteriores', 'Texturas decorativas']),
        rating: 4.7,
        previousWorks: JSON.stringify([
          'Pintura completa de Casa Familia Quispe',
          'Pintura de fachada en Edificio Mirador',
          'Decoración de habitación infantil con murales'
        ]),
        reviews: JSON.stringify([
          {author: 'Eduardo Molina', comment: 'Quedó perfecto, colores vibrantes.', rating: '5'},
          {author: 'Beatriz Cordero', comment: 'Muy prolija, recomendable al 100%.', rating: '5'},
          {author: 'Raúl Bermúdez', comment: 'Buen trabajo, pero se demoró un día extra.', rating: '4'}
        ])
      },
      {
        id: 'user-carla-compras',
        role: 'serviceSeeker',
        name: 'Carla Compras',
        email: 'carla@example.com',
        password: defaultPassword,
        city: 'Cochabamba'
      },
      {
        id: 'user-empresa-rrhh',
        role: 'employer',
        name: 'Recursos Humanos SRL',
        email: 'rrhh@example.com',
        password: defaultPassword,
        city: 'Cochabamba',
        companyName: 'RRHH SRL',
        taxId: '123456789',
        isEmployerVerified: true
      }
    ];

    // Insertar usuarios
    for (const user of users) {
      await pool.request()
        .input('id', sql.NVarChar, user.id)
        .input('role', sql.NVarChar, user.role)
        .input('name', sql.NVarChar, user.name)
        .input('email', sql.NVarChar, user.email)
        .input('password', sql.NVarChar, user.password)
        .input('phoneIntl', sql.NVarChar, user.phoneIntl || null)
        .input('city', sql.NVarChar, user.city || null)
        .input('career', sql.NVarChar, user.career || null)
        .input('specialty', sql.NVarChar, user.specialty || null)
        .input('summary', sql.NVarChar, user.summary || null)
        .input('languages', sql.NVarChar, user.languages || null)
        .input('certificates', sql.NVarChar, user.certificates || null)
        .input('skills', sql.NVarChar, user.skills || null)
        .input('experiences', sql.NVarChar, user.experiences || null)
        .input('serviceCategories', sql.NVarChar, user.serviceCategories || null)
        .input('previousWorks', sql.NVarChar, user.previousWorks || null)
        .input('reviews', sql.NVarChar, user.reviews || null)
        .input('rating', sql.Float, user.rating || null)
        .input('companyName', sql.NVarChar, user.companyName || null)
        .input('taxId', sql.NVarChar, user.taxId || null)
        .input('isEmployerVerified', sql.Bit, user.isEmployerVerified || false)
        .query(`
          INSERT INTO Users (
            id, role, name, email, password, phoneIntl, city, career, specialty,
            summary, languages, certificates, skills, experiences, serviceCategories,
            previousWorks, reviews, rating, companyName, taxId, isEmployerVerified
          ) VALUES (
            @id, @role, @name, @email, @password, @phoneIntl, @city, @career, @specialty,
            @summary, @languages, @certificates, @skills, @experiences, @serviceCategories,
            @previousWorks, @reviews, @rating, @companyName, @taxId, @isEmployerVerified
          )
        `);
    }
    console.log(`✅ ${users.length} usuarios insertados`);

    // Insertar trabajos de ejemplo
    const jobs = [
      {
        id: 'job-frontend-flutter',
        title: 'Frontend Flutter Jr',
        description: 'Buscamos desarrollador/a Flutter Jr para app móvil. Conocimiento básico en Dart.',
        city: 'La Paz',
        employerId: 'user-empresa-rrhh',
        type: 'fullTime',
        modality: 'hybrid',
        requirements: JSON.stringify(['Flutter/Dart básico', 'Git básico', 'Trabajo en equipo']),
        obligations: JSON.stringify(['Cumplir sprints', 'Revisiones de código', 'Asistir a dailies'])
      },
      {
        id: 'job-disenador-grafico',
        title: 'Diseñador/a Gráfico',
        description: 'Creación de piezas para redes sociales y branding.',
        city: 'Santa Cruz de la Sierra',
        employerId: 'user-empresa-rrhh',
        type: 'partTime',
        modality: 'remote',
        requirements: JSON.stringify(['Portafolio', 'Figma/Adobe', 'Creatividad']),
        obligations: JSON.stringify(['Entregas semanales', 'Reuniones de seguimiento'])
      }
    ];

    for (const job of jobs) {
      await pool.request()
        .input('id', sql.NVarChar, job.id)
        .input('title', sql.NVarChar, job.title)
        .input('description', sql.NVarChar, job.description)
        .input('city', sql.NVarChar, job.city)
        .input('employerId', sql.NVarChar, job.employerId)
        .input('type', sql.NVarChar, job.type)
        .input('modality', sql.NVarChar, job.modality)
        .input('requirements', sql.NVarChar, job.requirements)
        .input('obligations', sql.NVarChar, job.obligations)
        .query(`
          INSERT INTO JobPosts (id, title, description, city, employerId, type, modality, requirements, obligations)
          VALUES (@id, @title, @description, @city, @employerId, @type, @modality, @requirements, @obligations)
        `);
    }
    console.log(`✅ ${jobs.length} trabajos insertados`);

    console.log('\n🎉 ¡Datos de ejemplo insertados exitosamente!');
    console.log('📧 Todos los usuarios tienen la contraseña: 123456');
    console.log('\n👥 Usuarios creados:');
    console.log('   - ana@example.com (Buscador de trabajo)');
    console.log('   - luis@example.com (Buscador de trabajo)');
    console.log('   - maria@example.com (Buscador de trabajo)');
    console.log('   - roberto.plomero@example.com (Proveedor de servicios)');
    console.log('   - rrhh@example.com (Empresa)');
    console.log('   ... y más!');
    
  } catch (error) {
    console.error('❌ Error al insertar datos de ejemplo:', error);
    throw error;
  }
};

// Si se ejecuta directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--seed')) {
    // Inicializar y poblar con datos
    initDatabase()
      .then(() => seedDatabase())
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    // Solo inicializar tablas
    initDatabase()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

module.exports = { initDatabase, seedDatabase };
