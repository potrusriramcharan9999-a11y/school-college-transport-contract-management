const { query } = require("../config/db");

async function create({ full_name, email, password_hash, role }) {
  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role, is_active, created_at`,
    [full_name, email, password_hash, role]
  );

  return result.rows[0];
}

async function findByEmail(email) {
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    "SELECT id, full_name, email, role, is_active, last_login, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

async function updateLastLogin(id) {
  await query("UPDATE users SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}

async function updateRoleAndName(id, { role, full_name }) {
  const result = await query(
    `UPDATE users
     SET role = $2,
         full_name = COALESCE($3, full_name),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, full_name, email, role, is_active, last_login, created_at`,
    [id, role, full_name || null]
  );

  return result.rows[0] || null;
}

module.exports = {
  create,
  findByEmail,
  findById,
  updateLastLogin,
  updateRoleAndName
};
