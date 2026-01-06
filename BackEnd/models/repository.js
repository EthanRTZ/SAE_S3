const { v4: uuidv4 } = require('uuid');

class Repository {
  constructor(initial = []) {
    this.items = initial.slice();
  }

  async findAll() {
    return this.items;
  }

  async findById(id) {
    return this.items.find(i => i.id === id) || null;
  }

  async create(data) {
    const item = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
    this.items.push(item);
    return item;
  }

  async update(id, data) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...data, updatedAt: new Date().toISOString() };
    return this.items[idx];
  }

  async remove(id) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }
}

module.exports = Repository;

