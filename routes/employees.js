const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ========== EMPLOYEES ==========

// GET /api/employees - Obtener todos los empleados
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const pool = await getConnection();

    let query = 'SELECT * FROM Employees WHERE 1=1';
    const request = pool.request();

    if (department) {
      query += ' AND department = @department';
      request.input('department', sql.NVarChar, department);
    }
    if (status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar, status);
    }
    if (search) {
      query += ' AND (name LIKE @search OR email LIKE @search OR position LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

// GET /api/employees/:id - Obtener empleado por ID con memorandums y reconocimientos
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Obtener empleado
    const employeeResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Employees WHERE id = @id');

    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const employee = employeeResult.recordset[0];

    // Obtener memorandums
    const memorandumsResult = await pool.request()
      .input('employeeId', sql.NVarChar, id)
      .query('SELECT * FROM Memorandums WHERE employeeId = @employeeId ORDER BY date DESC');

    // Obtener reconocimientos
    const recognitionsResult = await pool.request()
      .input('employeeId', sql.NVarChar, id)
      .query('SELECT * FROM Recognitions WHERE employeeId = @employeeId ORDER BY date DESC');

    employee.memorandums = memorandumsResult.recordset;
    employee.recognitions = recognitionsResult.recordset;

    res.json(employee);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
});

// POST /api/employees - Crear nuevo empleado
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('position').notEmpty().withMessage('La posición es requerida'),
  body('email').isEmail().withMessage('Email inválido'),
  body('hireDate').isISO8601().withMessage('Fecha de contratación inválida'),
  body('department').notEmpty().withMessage('El departamento es requerido'),
  body('salary').isFloat({ min: 0 }).withMessage('Salario inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, position, email, phone, hireDate, department, salary,
      status, photoUrl, address
    } = req.body;

    const pool = await getConnection();
    const id = generateId();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('position', sql.NVarChar, position)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone || null)
      .input('hireDate', sql.DateTime, new Date(hireDate))
      .input('department', sql.NVarChar, department)
      .input('salary', sql.Float, salary)
      .input('status', sql.NVarChar, status || 'active')
      .input('photoUrl', sql.NVarChar, photoUrl || null)
      .input('address', sql.NVarChar, address || null)
      .query(`
        INSERT INTO Employees (
          id, name, position, email, phone, hireDate, department, salary,
          status, photoUrl, address
        ) VALUES (
          @id, @name, @position, @email, @phone, @hireDate, @department, @salary,
          @status, @photoUrl, @address
        )
      `);

    res.status(201).json({ message: 'Empleado creado exitosamente', id });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

// PUT /api/employees/:id - Actualizar empleado
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT id FROM Employees WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const updates = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    const fields = {
      name: sql.NVarChar,
      position: sql.NVarChar,
      email: sql.NVarChar,
      phone: sql.NVarChar,
      department: sql.NVarChar,
      salary: sql.Float,
      status: sql.NVarChar,
      photoUrl: sql.NVarChar,
      address: sql.NVarChar
    };

    Object.entries(fields).forEach(([field, type]) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = @${field}`);
        request.input(field, type, req.body[field]);
      }
    });

    if (req.body.hireDate !== undefined) {
      updates.push('hireDate = @hireDate');
      request.input('hireDate', sql.DateTime, new Date(req.body.hireDate));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updatedAt = GETDATE()');

    await request.query(`UPDATE Employees SET ${updates.join(', ')} WHERE id = @id`);

    res.json({ message: 'Empleado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
});

// DELETE /api/employees/:id - Eliminar empleado
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Employees WHERE id = @id');

    res.json({ message: 'Empleado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});

// ========== MEMORANDUMS ==========

// GET /api/employees/:employeeId/memorandums - Obtener memorandums de un empleado
router.get('/:employeeId/memorandums', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('employeeId', sql.NVarChar, employeeId)
      .query('SELECT * FROM Memorandums WHERE employeeId = @employeeId ORDER BY date DESC');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener memorandums:', error);
    res.status(500).json({ error: 'Error al obtener memorandums' });
  }
});

// POST /api/employees/:employeeId/memorandums - Crear memorandum
router.post('/:employeeId/memorandums', [
  authenticateToken,
  body('title').notEmpty().withMessage('El título es requerido'),
  body('description').notEmpty().withMessage('La descripción es requerida'),
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('severity').isIn(['leve', 'grave', 'muy_grave']).withMessage('Severidad inválida'),
  body('issuedBy').notEmpty().withMessage('El emisor es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId } = req.params;
    const { title, description, date, severity, issuedBy } = req.body;

    const pool = await getConnection();
    const id = generateId();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('employeeId', sql.NVarChar, employeeId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('date', sql.DateTime, new Date(date))
      .input('severity', sql.NVarChar, severity)
      .input('issuedBy', sql.NVarChar, issuedBy)
      .query(`
        INSERT INTO Memorandums (id, employeeId, title, description, date, severity, issuedBy)
        VALUES (@id, @employeeId, @title, @description, @date, @severity, @issuedBy)
      `);

    res.status(201).json({ message: 'Memorandum creado exitosamente', id });
  } catch (error) {
    console.error('Error al crear memorandum:', error);
    res.status(500).json({ error: 'Error al crear memorandum' });
  }
});

// DELETE /api/employees/:employeeId/memorandums/:id - Eliminar memorandum
router.delete('/:employeeId/memorandums/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Memorandums WHERE id = @id');

    res.json({ message: 'Memorandum eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar memorandum:', error);
    res.status(500).json({ error: 'Error al eliminar memorandum' });
  }
});

// ========== RECOGNITIONS ==========

// GET /api/employees/:employeeId/recognitions - Obtener reconocimientos de un empleado
router.get('/:employeeId/recognitions', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('employeeId', sql.NVarChar, employeeId)
      .query('SELECT * FROM Recognitions WHERE employeeId = @employeeId ORDER BY date DESC');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener reconocimientos:', error);
    res.status(500).json({ error: 'Error al obtener reconocimientos' });
  }
});

// POST /api/employees/:employeeId/recognitions - Crear reconocimiento
router.post('/:employeeId/recognitions', [
  authenticateToken,
  body('title').notEmpty().withMessage('El título es requerido'),
  body('description').notEmpty().withMessage('La descripción es requerida'),
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('type').notEmpty().withMessage('El tipo es requerido'),
  body('issuedBy').notEmpty().withMessage('El emisor es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId } = req.params;
    const { title, description, date, type, issuedBy } = req.body;

    const pool = await getConnection();
    const id = generateId();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('employeeId', sql.NVarChar, employeeId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('date', sql.DateTime, new Date(date))
      .input('type', sql.NVarChar, type)
      .input('issuedBy', sql.NVarChar, issuedBy)
      .query(`
        INSERT INTO Recognitions (id, employeeId, title, description, date, type, issuedBy)
        VALUES (@id, @employeeId, @title, @description, @date, @type, @issuedBy)
      `);

    res.status(201).json({ message: 'Reconocimiento creado exitosamente', id });
  } catch (error) {
    console.error('Error al crear reconocimiento:', error);
    res.status(500).json({ error: 'Error al crear reconocimiento' });
  }
});

// DELETE /api/employees/:employeeId/recognitions/:id - Eliminar reconocimiento
router.delete('/:employeeId/recognitions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Recognitions WHERE id = @id');

    res.json({ message: 'Reconocimiento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar reconocimiento:', error);
    res.status(500).json({ error: 'Error al eliminar reconocimiento' });
  }
});

module.exports = router;
