import { Sequelize } from './packages/core/src/index.js';
import { Model, DataTypes } from './packages/core/src/index.js';

const sequelize = new Sequelize('sqlite::memory:', { logging: console.log });

class User extends Model {}
User.init({ name: DataTypes.STRING }, { sequelize });

async function test() {
  await sequelize.sync();

  await sequelize.transaction(async () => {
    await Promise.all([
      (async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        await User.create({ name: 'Alice' });
      })()
    ]);
  });

  const users = await User.findAll();
  console.log(users.map(u => u.toJSON()));
}

test().catch(console.error);