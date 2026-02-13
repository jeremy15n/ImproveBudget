import express from 'express';
import {
  listEntities,
  getEntity,
  createEntity,
  bulkCreateEntities,
  updateEntity,
  deleteEntity
} from '../controllers/entity.controller.js';

const router = express.Router();

// Valid entity names
const VALID_ENTITIES = [
  'transaction',
  'account',
  'budget',
  'categoryrule',
  'financialgoal',
  'investment',
  'networthsnapshot'
];

/**
 * Middleware to validate entity parameter and attach table name to request
 */
const validateEntity = (req, res, next) => {
  const { entity } = req.params;
  const validEntity = VALID_ENTITIES.includes(entity.toLowerCase());

  if (!validEntity) {
    return res.status(400).json({
      error: true,
      message: 'Invalid entity',
      valid_entities: VALID_ENTITIES
    });
  }

  req.table = entity.toLowerCase();
  next();
};

/**
 * Generic entity routes
 * Supports all CRUD operations for all entity types
 */

// List/Filter entities
router.get('/:entity', validateEntity, listEntities);

// Get single entity by ID
router.get('/:entity/:id', validateEntity, getEntity);

// Create single entity
router.post('/:entity', validateEntity, createEntity);

// Bulk create entities
router.post('/:entity/bulk', validateEntity, bulkCreateEntities);

// Update entity
router.put('/:entity/:id', validateEntity, updateEntity);

// Delete entity
router.delete('/:entity/:id', validateEntity, deleteEntity);

export default router;
