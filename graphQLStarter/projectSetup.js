import {dataTypes} from 'mongo-graphql-starter';

const {
  MongoIdType,
  StringType,
  BoolType,
  IntType,
} = dataTypes;

export const Report = {
  table: 'reports',
  fields: {
    _id: MongoIdType,
    userId: MongoIdType,
    weekNumer: IntType,
    year: IntType,
  },
  relationships: {
    tasks: {
      get type() {
        return Task;
      },
      fkField: 'reportId',
    },
  },
};

export const Task = {
  table: 'tasks',
  fields: {
    _id: MongoIdType,
    reportId: MongoIdType,
    isDone: BoolType,
  },
};

export const User = {
  table: 'users',
  fields: {
    _id: MongoIdType,
    name: StringType,
    isLead: BoolType,
  },
  relationships: {
    reports: {
      get type() {
        return Report;
      },
      fkField: 'userId',
    },
  },
};
