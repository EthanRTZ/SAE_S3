const makeController = (repo) => ({
  list: async (req, res, next) => {
    try { res.json(await repo.findAll()); } catch (e) { next(e); }
  },
  get: async (req, res, next) => {
    try {
      const item = await repo.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try { const created = await repo.create(req.body); res.status(201).json(created); } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try {
      const updated = await repo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      const ok = await repo.remove(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch (e) { next(e); }
  }
});

module.exports = makeController;

