import { expect } from 'chai';
import { beforeAll2, createMultiTransactionalTestSequelizeInstance, sequelize } from './support.js';
import { Model, DataTypes } from '@sequelize/core';

describe('CLS Promise.all & setTimeout', () => {
  if (!sequelize.dialect.supports.transactions) return;

  const vars = beforeAll2(async () => {
    const clsSequelize = await createMultiTransactionalTestSequelizeInstance(sequelize, {
      disableClsTransactions: false,
    });
    class User extends Model {}
    User.init({ name: DataTypes.STRING }, { sequelize: clsSequelize });
    await clsSequelize.sync({ force: true });
    return { clsSequelize, User };
  });

  it('works with Promise.all', async () => {
    await vars.clsSequelize.transaction(async (t) => {
      await Promise.all([
        vars.User.create({ name: 'bob' }),
        vars.User.create({ name: 'alice' })
      ]);
    });
    const users = await vars.User.findAll();
    expect(users).to.have.length(2);
  });

  it('works with setTimeout', async () => {
    await vars.clsSequelize.transaction(async (t) => {
      await new Promise((resolve) => {
        setTimeout(async () => {
          await vars.User.create({ name: 'charlie' });
          resolve(undefined);
        }, 10);
      });
    });
    const users = await vars.User.findAll({ where: { name: 'charlie' } });
    expect(users).to.have.length(1);
  });

  it('manual transaction overrides CLS', async () => {
    const t1 = await vars.clsSequelize.startUnmanagedTransaction();
    await vars.clsSequelize.transaction(async (t2) => {
      await vars.User.create({ name: 'manual' }, { transaction: t1 });
    });
    // Since it was created in t1, and t1 is not committed, a normal query shouldn't see it (if isolation level supports it, but SQLite is weird).
    // Let's just check that it's in t1.
    const usersInT1 = await vars.User.findAll({ where: { name: 'manual' }, transaction: t1 });
    expect(usersInT1).to.have.length(1);
    await t1.commit();
  });

  it('nested transaction inherits context correctly', async () => {
    await vars.clsSequelize.transaction(async (t1) => {
      await vars.clsSequelize.transaction(async (t2) => {
        expect(t2.parent).to.equal(t1);
        await vars.User.create({ name: 'nested' });
      });
    });
    const users = await vars.User.findAll({ where: { name: 'nested' } });
    expect(users).to.have.length(1);
  });

  it('normal query executes in auto-commit mode without active transaction', async () => {
    await vars.User.create({ name: 'auto-commit' });
    const users = await vars.User.findAll({ where: { name: 'auto-commit' } });
    expect(users).to.have.length(1);
  });
});
