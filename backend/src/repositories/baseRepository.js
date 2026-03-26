class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async findAll(options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at DESC' } = options;
    const query = `
      SELECT * FROM ${this.tableName} 
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    const result = await this.db.query(query, [parseInt(limit) || 10, parseInt(offset) || 0]);
    return result.rows;
  }

  async create(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns}) 
      VALUES (${placeholders})
    `;
    const result = await this.db.query(query, values);
    // SQLite doesn't have RETURNING, so return the inserted data
    if (data.id) {
      return this.findById(data.id);
    }
    return result.rows[0];
  }

  async update(id, data) {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), id];
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause} 
      WHERE id = ?
    `;
    const result = await this.db.query(query, values);
    return this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = BaseRepository;
