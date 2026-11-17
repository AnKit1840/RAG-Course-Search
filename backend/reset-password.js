import bcrypt from 'bcrypt';
import { query, pool } from './db.js';

const newPassword = process.argv[2];
const username = process.argv[3] || 'admin';

if (!newPassword) {
  console.log('Usage: node reset-password.js <new_password> [username]');
  console.log('Example: node reset-password.js MySuperSecretPassword admin');
  process.exit(1);
}

async function resetPassword() {
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [hash, username]
    );

    if (result.rowCount === 0) {
      // If user does not exist yet, insert them as admin
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [username, hash, 'admin']
      );
      console.log(`User '${username}' created with the new password!`);
    } else {
      console.log(`Password for '${username}' updated successfully in PostgreSQL!`);
    }

    console.log(`\nGenerated bcrypt hash:\n${hash}`);
    console.log(`\n(If updating 001_auth_tables.sql, replace the old hash with the one above)`);
  } catch (err) {
    console.error('Error updating password:', err.message);
  } finally {
    await pool.end();
  }
}

resetPassword();
