const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper para parsear JSON arrays/objects
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

// GET /api/users - Obtener todos los usuarios (con filtros)
router.get('/', async (req, res) => {
  try {
    const { role, city, isProfilePublic, search } = req.query;
    const pool = await getConnection();

    let query = 'SELECT * FROM Users WHERE 1=1';
    const request = pool.request();

    if (role) {
      query += ' AND role = @role';
      request.input('role', sql.NVarChar, role);
    }

    if (city) {
      query += ' AND city = @city';
      request.input('city', sql.NVarChar, city);
    }

    if (isProfilePublic !== undefined) {
      query += ' AND isProfilePublic = @isProfilePublic';
      request.input('isProfilePublic', sql.Bit, isProfilePublic === 'true');
    }

    if (search) {
      query += ' AND (name LIKE @search OR email LIKE @search OR career LIKE @search OR specialty LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);

    // Remover passwords y parsear JSON fields
    const users = result.recordset.map(user => {
      delete user.password;
      return {
        ...user,
        languages: parseJsonField(user.languages),
        certificates: parseJsonField(user.certificates),
        skills: parseJsonField(user.skills),
        experiences: parseJsonField(user.experiences),
        serviceCategories: parseJsonField(user.serviceCategories),
        previousWorks: parseJsonField(user.previousWorks),
        reviews: parseJsonField(user.reviews)
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.recordset[0];
    delete user.password;

    // Parsear JSON fields
    user.languages = parseJsonField(user.languages);
    user.certificates = parseJsonField(user.certificates);
    user.skills = parseJsonField(user.skills);
    user.experiences = parseJsonField(user.experiences);
    user.serviceCategories = parseJsonField(user.serviceCategories);
    user.previousWorks = parseJsonField(user.previousWorks);
    user.reviews = parseJsonField(user.reviews);

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// PUT /api/users/:id - Actualizar perfil de usuario
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario solo pueda editar su propio perfil (o ser admin en el futuro)
    if (req.user.userId !== id) {
      return res.status(403).json({ error: 'No tienes permiso para editar este perfil' });
    }

    const {
      name, phoneIntl, city, career, specialty, summary,
      languages, certificates, skills, experiences, serviceCategories,
      isProfilePublic, previousWorks, companyName, taxId
    } = req.body;

    const pool = await getConnection();

    // Construir query dinámica
    const updates = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    if (name !== undefined) {
      updates.push('name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (phoneIntl !== undefined) {
      updates.push('phoneIntl = @phoneIntl');
      request.input('phoneIntl', sql.NVarChar, phoneIntl);
    }
    if (city !== undefined) {
      updates.push('city = @city');
      request.input('city', sql.NVarChar, city);
    }
    if (career !== undefined) {
      updates.push('career = @career');
      request.input('career', sql.NVarChar, career);
    }
    if (specialty !== undefined) {
      updates.push('specialty = @specialty');
      request.input('specialty', sql.NVarChar, specialty);
    }
    if (summary !== undefined) {
      updates.push('summary = @summary');
      request.input('summary', sql.NVarChar, summary);
    }
    if (languages !== undefined) {
      updates.push('languages = @languages');
      request.input('languages', sql.NVarChar, stringifyJsonField(languages));
    }
    if (certificates !== undefined) {
      updates.push('certificates = @certificates');
      request.input('certificates', sql.NVarChar, stringifyJsonField(certificates));
    }
    if (skills !== undefined) {
      updates.push('skills = @skills');
      request.input('skills', sql.NVarChar, stringifyJsonField(skills));
    }
    if (experiences !== undefined) {
      updates.push('experiences = @experiences');
      request.input('experiences', sql.NVarChar, stringifyJsonField(experiences));
    }
    if (serviceCategories !== undefined) {
      updates.push('serviceCategories = @serviceCategories');
      request.input('serviceCategories', sql.NVarChar, stringifyJsonField(serviceCategories));
    }
    if (isProfilePublic !== undefined) {
      updates.push('isProfilePublic = @isProfilePublic');
      request.input('isProfilePublic', sql.Bit, isProfilePublic);
    }
    if (previousWorks !== undefined) {
      updates.push('previousWorks = @previousWorks');
      request.input('previousWorks', sql.NVarChar, stringifyJsonField(previousWorks));
    }
    if (companyName !== undefined) {
      updates.push('companyName = @companyName');
      request.input('companyName', sql.NVarChar, companyName);
    }
    if (taxId !== undefined) {
      updates.push('taxId = @taxId');
      request.input('taxId', sql.NVarChar, taxId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updatedAt = GETDATE()');

    await request.query(`UPDATE Users SET ${updates.join(', ')} WHERE id = @id`);

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// POST /api/users/:id/reviews - Agregar reseña a un usuario
router.post('/:id/reviews', authenticateToken, [
  body('comment').notEmpty().withMessage('El comentario es requerido'),
  body('rating').isFloat({ min: 0, max: 5 }).withMessage('La calificación debe estar entre 0 y 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { comment, rating } = req.body;
    const pool = await getConnection();

    // Obtener usuario actual
    const userResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT reviews, rating FROM Users WHERE id = @id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener nombre del autor
    const authorResult = await pool.request()
      .input('authorId', sql.NVarChar, req.user.userId)
      .query('SELECT name FROM Users WHERE id = @authorId');

    const authorName = authorResult.recordset[0]?.name || 'Anónimo';

    // Agregar nueva reseña
    let reviews = parseJsonField(userResult.recordset[0].reviews) || [];
    reviews.push({
      author: authorName,
      comment,
      rating: rating.toString(),
      date: new Date().toISOString()
    });

    // Calcular nuevo rating promedio
    const totalRating = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0);
    const avgRating = totalRating / reviews.length;

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('reviews', sql.NVarChar, JSON.stringify(reviews))
      .input('rating', sql.Float, avgRating)
      .query('UPDATE Users SET reviews = @reviews, rating = @rating, updatedAt = GETDATE() WHERE id = @id');

    res.json({ message: 'Reseña agregada exitosamente', avgRating });
  } catch (error) {
    console.error('Error al agregar reseña:', error);
    res.status(500).json({ error: 'Error al agregar reseña' });
  }
});

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario solo pueda eliminar su propio perfil
    if (req.user.userId !== id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este perfil' });
    }

    const pool = await getConnection();

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Users WHERE id = @id');

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
