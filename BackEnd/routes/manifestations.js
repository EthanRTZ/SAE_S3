const express = require('express');
const Repository = require('../models/repository');
const { manifestations } = require('../models/initData');
const makeController = require('../controllers/genericController');
const repo = new Repository(manifestations);
const ctrl = makeController(repo);
const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;

