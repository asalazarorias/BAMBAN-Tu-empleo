const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const parseJsonField = (field) => {
  if (!field) return null;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch {
    return null;
  }
};

const stringifyJsonField = (field) => {
  if (!field) return null;
  return typeof field === 'object' ? JSON.stringify(field) : field;
};

// ========== JOB POSTS (Publicaciones de trabajo) ==========

// GET /api/jobs/posts - Obtener todas las publicaciones
router.get('/posts', async (req, res) => {
  try {
    const { city, type, modality, employerId } = req.query;
    const pool = await getConnection();

    let query = 'SELECT * FROM JobPosts WHERE 1=1';
    const request = pool.request();

    if (city) {
      query += ' AND city = @city';
      request.input('city', sql.NVarChar, city);
    }
    if (type) {
      query += ' AND type = @type';
      request.input('type', sql.NVarChar, type);
    }
    if (modality) {
      query += ' AND modality = @modality';
      request.input('modality', sql.NVarChar, modality);
    }
    if (employerId) {
      query += ' AND employerId = @employerId';
      request.input('employerId', sql.NVarChar, employerId);
    }

    query += ' ORDER BY createdAt DESC';

    const result = await request.query(query);

    const posts = result.recordset.map(post => ({
      ...post,
      requirements: parseJsonField(post.requirements) || [],
      obligations: parseJsonField(post.obligations) || []
    }));

    res.json(posts);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    res.status(500).json({ error: 'Error al obtener publicaciones' });
  }
});

// GET /api/jobs/posts/:id - Obtener publicación por ID
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM JobPosts WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    const post = result.recordset[0];
    post.requirements = parseJsonField(post.requirements) || [];
    post.obligations = parseJsonField(post.obligations) || [];

    res.json(post);
  } catch (error) {
    console.error('Error al obtener publicación:', error);
    res.status(500).json({ error: 'Error al obtener publicación' });
  }
});

// POST /api/jobs/posts - Crear nueva publicación
router.post('/posts', [
  authenticateToken,
  body('title').notEmpty().withMessage('El título es requerido'),
  body('description').notEmpty().withMessage('La descripción es requerida'),
  body('city').notEmpty().withMessage('La ciudad es requerida'),
  body('type').isIn(['fullTime', 'partTime']).withMessage('Tipo inválido'),
  body('modality').isIn(['onsite', 'remote', 'hybrid']).withMessage('Modalidad inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, city, type, modality, requirements, obligations } = req.body;
    const employerId = req.user.userId;

    const pool = await getConnection();
    const id = generateId();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('city', sql.NVarChar, city)
      .input('employerId', sql.NVarChar, employerId)
      .input('type', sql.NVarChar, type)
      .input('modality', sql.NVarChar, modality)
      .input('requirements', sql.NVarChar, stringifyJsonField(requirements || []))
      .input('obligations', sql.NVarChar, stringifyJsonField(obligations || []))
      .query(`
        INSERT INTO JobPosts (id, title, description, city, employerId, type, modality, requirements, obligations)
        VALUES (@id, @title, @description, @city, @employerId, @type, @modality, @requirements, @obligations)
      `);

    res.status(201).json({ message: 'Publicación creada exitosamente', id });
  } catch (error) {
    console.error('Error al crear publicación:', error);
    res.status(500).json({ error: 'Error al crear publicación' });
  }
});

// PUT /api/jobs/posts/:id - Actualizar publicación
router.put('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar que sea el dueño de la publicación
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT employerId FROM JobPosts WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    if (checkResult.recordset[0].employerId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta publicación' });
    }

    const { title, description, city, type, modality, requirements, obligations } = req.body;

    const updates = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    if (title !== undefined) {
      updates.push('title = @title');
      request.input('title', sql.NVarChar, title);
    }
    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar, description);
    }
    if (city !== undefined) {
      updates.push('city = @city');
      request.input('city', sql.NVarChar, city);
    }
    if (type !== undefined) {
      updates.push('type = @type');
      request.input('type', sql.NVarChar, type);
    }
    if (modality !== undefined) {
      updates.push('modality = @modality');
      request.input('modality', sql.NVarChar, modality);
    }
    if (requirements !== undefined) {
      updates.push('requirements = @requirements');
      request.input('requirements', sql.NVarChar, stringifyJsonField(requirements));
    }
    if (obligations !== undefined) {
      updates.push('obligations = @obligations');
      request.input('obligations', sql.NVarChar, stringifyJsonField(obligations));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updatedAt = GETDATE()');

    await request.query(`UPDATE JobPosts SET ${updates.join(', ')} WHERE id = @id`);

    res.json({ message: 'Publicación actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar publicación:', error);
    res.status(500).json({ error: 'Error al actualizar publicación' });
  }
});

// DELETE /api/jobs/posts/:id - Eliminar publicación
router.delete('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar que sea el dueño
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT employerId FROM JobPosts WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    if (checkResult.recordset[0].employerId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta publicación' });
    }

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM JobPosts WHERE id = @id');

    res.json({ message: 'Publicación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar publicación:', error);
    res.status(500).json({ error: 'Error al eliminar publicación' });
  }
});

// ========== JOB OPPORTUNITIES (Oportunidades de empleo) ==========

// GET /api/jobs/opportunities - Obtener todas las oportunidades
router.get('/opportunities', async (req, res) => {
  try {
    const { department, sector, city, search } = req.query;
    const pool = await getConnection();

    let query = 'SELECT * FROM JobOpportunities WHERE 1=1';
    const request = pool.request();

    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    if (sector) {
      query += ' AND sector = @sector';
      request.input('sector', sql.NVarChar, sector);
    }
    if (city) {
      query += ' AND city = @city';
      request.input('city', sql.NVarChar, city);
    }
    if (search) {
      query += ' AND (companyName LIKE @search OR position LIKE @search OR description LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY createdAt DESC';

    const result = await request.query(query);

    const opportunities = result.recordset.map(opp => ({
      ...opp,
      additionalData: parseJsonField(opp.additionalData) || {}
    }));

    res.json(opportunities);
  } catch (error) {
    console.error('Error al obtener oportunidades:', error);
    res.status(500).json({ error: 'Error al obtener oportunidades' });
  }
});

// GET /api/jobs/opportunities/:id - Obtener oportunidad por ID
router.get('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM JobOpportunities WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Oportunidad no encontrada' });
    }

    const opportunity = result.recordset[0];
    opportunity.additionalData = parseJsonField(opportunity.additionalData) || {};

    res.json(opportunity);
  } catch (error) {
    console.error('Error al obtener oportunidad:', error);
    res.status(500).json({ error: 'Error al obtener oportunidad' });
  }
});

// POST /api/jobs/opportunities - Crear nueva oportunidad
router.post('/opportunities', [
  authenticateToken,
  body('department').notEmpty().withMessage('El departamento es requerido'),
  body('sector').notEmpty().withMessage('El sector es requerido'),
  body('companyName').notEmpty().withMessage('El nombre de la empresa es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      department, sector, companyName, position, city, address, phone, email,
      website, description, requirements, salary, schedule, contractType,
      benefits, experience, contactPerson, additionalData
    } = req.body;

    const pool = await getConnection();
    const id = generateId();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('department', sql.NVarChar, department)
      .input('sector', sql.NVarChar, sector)
      .input('companyName', sql.NVarChar, companyName)
      .input('position', sql.NVarChar, position || null)
      .input('city', sql.NVarChar, city || null)
      .input('address', sql.NVarChar, address || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('email', sql.NVarChar, email || null)
      .input('website', sql.NVarChar, website || null)
      .input('description', sql.NVarChar, description || null)
      .input('requirements', sql.NVarChar, requirements || null)
      .input('salary', sql.NVarChar, salary || null)
      .input('schedule', sql.NVarChar, schedule || null)
      .input('contractType', sql.NVarChar, contractType || null)
      .input('benefits', sql.NVarChar, benefits || null)
      .input('experience', sql.NVarChar, experience || null)
      .input('contactPerson', sql.NVarChar, contactPerson || null)
      .input('additionalData', sql.NVarChar, stringifyJsonField(additionalData || {}))
      .query(`
        INSERT INTO JobOpportunities (
          id, department, sector, companyName, position, city, address, phone, email,
          website, description, requirements, salary, schedule, contractType,
          benefits, experience, contactPerson, additionalData
        ) VALUES (
          @id, @department, @sector, @companyName, @position, @city, @address, @phone, @email,
          @website, @description, @requirements, @salary, @schedule, @contractType,
          @benefits, @experience, @contactPerson, @additionalData
        )
      `);

    res.status(201).json({ message: 'Oportunidad creada exitosamente', id });
  } catch (error) {
    console.error('Error al crear oportunidad:', error);
    res.status(500).json({ error: 'Error al crear oportunidad' });
  }
});

// PUT /api/jobs/opportunities/:id - Actualizar oportunidad
router.put('/opportunities/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT id FROM JobOpportunities WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Oportunidad no encontrada' });
    }

    const updates = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    const fields = [
      'department', 'sector', 'companyName', 'position', 'city', 'address', 'phone', 
      'email', 'website', 'description', 'requirements', 'salary', 'schedule', 
      'contractType', 'benefits', 'experience', 'contactPerson'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = @${field}`);
        request.input(field, sql.NVarChar, req.body[field]);
      }
    });

    if (req.body.additionalData !== undefined) {
      updates.push('additionalData = @additionalData');
      request.input('additionalData', sql.NVarChar, stringifyJsonField(req.body.additionalData));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updatedAt = GETDATE()');

    await request.query(`UPDATE JobOpportunities SET ${updates.join(', ')} WHERE id = @id`);

    res.json({ message: 'Oportunidad actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar oportunidad:', error);
    res.status(500).json({ error: 'Error al actualizar oportunidad' });
  }
});

// DELETE /api/jobs/opportunities/:id - Eliminar oportunidad
router.delete('/opportunities/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM JobOpportunities WHERE id = @id');

    res.json({ message: 'Oportunidad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar oportunidad:', error);
    res.status(500).json({ error: 'Error al eliminar oportunidad' });
  }
});

module.exports = router;
