const { Pool } = require('sequelize-pool');
const pool = new Pool({
  name: 'test',
  create: () => Promise.resolve({ id: Math.random() }),
  destroy: () => Promise.resolve(),
  validate: async () => {
    console.log('validate called');
    return true;
  },
  max: 1,
  min: 1
});
pool.acquire().then(console.log);
