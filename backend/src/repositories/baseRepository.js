class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async findAll(options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at DESC' } = options;
    const query = `
      SELECT * FROM ${this.tableName} 
      ORDER BY ${orderBy} 
      LIMIT $1 OFFSET $2
    `;
    const result = await this.db.query(query, [limit, offset]);
    return result.rows;
  }

  async create(data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(data)];
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = BaseRepository;
