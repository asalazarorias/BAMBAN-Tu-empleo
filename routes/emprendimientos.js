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

// GET /api/emprendimientos - Obtener todos los emprendimientos
router.get('/', async (req, res) => {
  try {
    const { ownerId, search } = req.query;
    const pool = await getConnection();

    let query = 'SELECT * FROM Emprendimientos WHERE 1=1';
    const request = pool.request();

    if (ownerId) {
      query += ' AND ownerId = @ownerId';
      request.input('ownerId', sql.NVarChar, ownerId);
    }
    if (search) {
      query += ' AND (name LIKE @search OR description LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY createdAt DESC';

    const result = await request.query(query);

    const emprendimientos = result.recordset.map(emp => ({
      ...emp,
      products: parseJsonField(emp.products) || []
    }));

    res.json(emprendimientos);
  } catch (error) {
    console.error('Error al obtener emprendimientos:', error);
    res.status(500).json({ error: 'Error al obtener emprendimientos' });
  }
});

// GET /api/emprendimientos/:id - Obtener emprendimiento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Emprendimientos WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Emprendimiento no encontrado' });
    }

    const emprendimiento = result.recordset[0];
    emprendimiento.products = parseJsonField(emprendimiento.products) || [];

    res.json(emprendimiento);
  } catch (error) {
    console.error('Error al obtener emprendimiento:', error);
    res.status(500).json({ error: 'Error al obtener emprendimiento' });
  }
});

// POST /api/emprendimientos - Crear nuevo emprendimiento
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('El nombre es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, products, phone, image1Url, image2Url } = req.body;
    const ownerId = req.user.userId;

    const pool = await getConnection();
    const id = generateId();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('products', sql.NVarChar, stringifyJsonField(products || []))
      .input('phone', sql.NVarChar, phone || null)
      .input('ownerId', sql.NVarChar, ownerId)
      .input('image1Url', sql.NVarChar, image1Url || null)
      .input('image2Url', sql.NVarChar, image2Url || null)
      .query(`
        INSERT INTO Emprendimientos (
          id, name, description, products, phone, ownerId, image1Url, image2Url
        ) VALUES (
          @id, @name, @description, @products, @phone, @ownerId, @image1Url, @image2Url
        )
      `);

    res.status(201).json({ message: 'Emprendimiento creado exitosamente', id });
  } catch (error) {
    console.error('Error al crear emprendimiento:', error);
    res.status(500).json({ error: 'Error al crear emprendimiento' });
  }
});

// PUT /api/emprendimientos/:id - Actualizar emprendimiento
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar que sea el dueño
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT ownerId FROM Emprendimientos WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Emprendimiento no encontrado' });
    }

    if (checkResult.recordset[0].ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar este emprendimiento' });
    }

    const { name, description, products, phone, image1Url, image2Url } = req.body;

    const updates = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    if (name !== undefined) {
      updates.push('name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar, description);
    }
    if (products !== undefined) {
      updates.push('products = @products');
      request.input('products', sql.NVarChar, stringifyJsonField(products));
    }
    if (phone !== undefined) {
      updates.push('phone = @phone');
      request.input('phone', sql.NVarChar, phone);
    }
    if (image1Url !== undefined) {
      updates.push('image1Url = @image1Url');
      request.input('image1Url', sql.NVarChar, image1Url);
    }
    if (image2Url !== undefined) {
      updates.push('image2Url = @image2Url');
      request.input('image2Url', sql.NVarChar, image2Url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updatedAt = GETDATE()');

    await request.query(`UPDATE Emprendimientos SET ${updates.join(', ')} WHERE id = @id`);

    res.json({ message: 'Emprendimiento actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar emprendimiento:', error);
    res.status(500).json({ error: 'Error al actualizar emprendimiento' });
  }
});

// DELETE /api/emprendimientos/:id - Eliminar emprendimiento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Verificar que sea el dueño
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT ownerId FROM Emprendimientos WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Emprendimiento no encontrado' });
    }

    if (checkResult.recordset[0].ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este emprendimiento' });
    }

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Emprendimientos WHERE id = @id');

    res.json({ message: 'Emprendimiento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar emprendimiento:', error);
    res.status(500).json({ error: 'Error al eliminar emprendimiento' });
  }
});

module.exports = router;
