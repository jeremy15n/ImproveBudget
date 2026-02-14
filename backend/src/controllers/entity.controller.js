import dbService from '../services/database.service.js';

/**
 * Generic entity controller for CRUD operations
 * Handles list, create, read, update, delete for all entity types
 */

/**
 * List entities with filtering and sorting
 * GET /api/{entity}?sort_by=field&sort_order=desc&limit=100&field=value
 */
export const listEntities = (req, res, next) => {
  try {
    const { table } = req;
    const { sort_by, sort_order, limit, page, ...filters } = req.query;

    const pagination = page ? { page, limit: limit || 50 } : null;
    const results = dbService.list(table, filters, { sort_by, sort_order }, pagination ? null : limit, pagination);

    res.json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single entity by ID
 * GET /api/{entity}/{id}
 */
export const getEntity = (req, res, next) => {
  try {
    const { table } = req;
    const { id } = req.params;

    const result = dbService.getById(table, id);

    if (!result) {
      return res.status(404).json({
        error: true,
        message: `${table} not found`,
        id
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a single entity
 * POST /api/{entity}
 */
export const createEntity = (req, res, next) => {
  try {
    const { table } = req;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Request body is required'
      });
    }

    const result = dbService.create(table, data);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create multiple entities in bulk
 * POST /api/{entity}/bulk
 * Body: { items: [...] }
 */
export const bulkCreateEntities = (req, res, next) => {
  try {
    const { table } = req;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: true,
        message: 'Body must contain items array'
      });
    }

    if (items.length === 0) {
      return res.json({ created: 0, ids: [] });
    }

    const result = dbService.bulkCreate(table, items);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an entity
 * PUT /api/{entity}/{id}
 */
export const updateEntity = (req, res, next) => {
  try {
    const { table } = req;
    const { id } = req.params;
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Update data is required'
      });
    }

    // Check if entity exists
    const existing = dbService.getById(table, id);
    if (!existing) {
      return res.status(404).json({
        error: true,
        message: `${table} not found`,
        id
      });
    }

    const result = dbService.update(table, id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update entities
 * PUT /api/{entity}/bulk-update
 * Body: { ids: [...], data: { field: value } }
 */
export const bulkUpdateEntities = (req, res, next) => {
  try {
    const { table } = req;
    const { ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'ids array is required'
      });
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Update data is required'
      });
    }

    const result = dbService.bulkUpdate(table, ids, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete entities
 * POST /api/{entity}/bulk-delete
 * Body: { ids: [...] }
 */
export const bulkDeleteEntities = (req, res, next) => {
  try {
    const { table } = req;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'ids array is required'
      });
    }

    const result = dbService.bulkDelete(table, ids);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an entity
 * DELETE /api/{entity}/{id}
 */
export const deleteEntity = (req, res, next) => {
  try {
    const { table } = req;
    const { id } = req.params;

    // Check if entity exists
    const existing = dbService.getById(table, id);
    if (!existing) {
      return res.status(404).json({
        error: true,
        message: `${table} not found`,
        id
      });
    }

    dbService.delete(table, id);

    res.json({ deleted: true, id });
  } catch (error) {
    next(error);
  }
};
