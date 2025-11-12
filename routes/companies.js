const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// GET /api/companies - Obtener todas las empresas
router.get('/', async (req, res) => {
  try {
    const { department, city, sector, region, search } = req.query;
    const pool = await getConnection();

    let query = 'SELECT * FROM Companies WHERE 1=1';
    const request = pool.request();

    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    if (city) {
      query += ' AND city = @city';
      request.input('city', sql.NVarChar, city);
    }
    if (sector) {
      query += ' AND sector = @sector';
      request.input('sector', sql.NVarChar, sector);
    }
    if (region) {
      query += ' AND region = @region';
      request.input('region', sql.NVarChar, region);
    }
    if (search) {
      query += ' AND (name LIKE @search OR description LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
});

// GET /api/companies/:id - Obtener empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Companies WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener empresa:', error);
    res.status(500).json({ error: 'Error al obtener empresa' });
  }
});

// POST /api/companies - Crear nueva empresa
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('El nombre es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, region, department, city, address, sector, phone, email,
      website, description, employeeCount, foundedYear
    } = req.body;

    const pool = await getConnection();
    const id = generateId();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('region', sql.NVarChar, region || null)
      .input('department', sql.NVarChar, department || null)
      .input('city', sql.NVarChar, city || null)
      .input('address', sql.NVarChar, address || null)
      .input('sector', sql.NVarChar, sector || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('email', sql.NVarChar, email || null)
      .input('website', sql.NVarChar, website || null)
      .input('description', sql.NVarChar, description || null)
      .input('employeeCount', sql.NVarChar, employeeCount || null)
      .input('foundedYear', sql.NVarChar, foundedYear || null)
      .query(`
        INSERT INTO Companies (
          id, name, region, department, city, address, sector, phone, email,
          website, description, employeeCount, foundedYear
        ) VALUES (
          @id, @name, @region, @department, @city, @address, @sector, @phone, @email,
          @website, @description, @employeeCount, @foundedYear
        )
      `);

    res.status(201).json({ message: 'Empresa creada exitosamente', id });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

// PUT /api/companies/:id - Actualizar empresa
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT id FROM Companies WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const updates = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    const fields = [
      'name', 'region', 'department', 'city', 'address', 'sector', 'phone',
      'email', 'website', 'description', 'employeeCount', 'foundedYear'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = @${field}`);
        request.input(field, sql.NVarChar, req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updatedAt = GETDATE()');

    await request.query(`UPDATE Companies SET ${updates.join(', ')} WHERE id = @id`);

    res.json({ message: 'Empresa actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
});

// DELETE /api/companies/:id - Eliminar empresa
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Companies WHERE id = @id');

    res.json({ message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
});

module.exports = router;
