import Task from '../Task/Task';

export default {
  table: 'reports',
  typeName: 'Report',
  fields: {
    _id: 'MongoId',
    userId: 'MongoId',
    weekNumer: 'Int',
    year: 'Int',
  },
  relationships: {
    tasks: {
      get type() {
        return Task;
      },
      fkField: 'reportId',
      keyField: '_id',
      __isArray: false,
      __isObject: true,
    },
  },
};
