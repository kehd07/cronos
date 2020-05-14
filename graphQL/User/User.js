import Report from '../Report/Report';

export default {
  table: 'users',
  typeName: 'User',
  fields: {
    _id: 'MongoId',
    name: 'String',
    isLead: 'Boolean',
  },
  relationships: {
    reports: {
      get type() {
        return Report;
      },
      fkField: 'userId',
      keyField: '_id',
      __isArray: false,
      __isObject: true,
    },
  },
};
