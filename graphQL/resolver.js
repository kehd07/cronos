import GraphQLJSON from 'graphql-type-json';

import Report, {Report as ReportRest} from './Report/resolver';
import Task, {Task as TaskRest} from './Task/resolver';
import User, {User as UserRest} from './User/resolver';

const {Query: ReportQuery, Mutation: ReportMutation} = Report;
const {Query: TaskQuery, Mutation: TaskMutation} = Task;
const {Query: UserQuery, Mutation: UserMutation} = User;

export default {
  JSON: GraphQLJSON,
  Query: Object.assign({}, ReportQuery, TaskQuery, UserQuery),
  Mutation: Object.assign({}, ReportMutation, TaskMutation, UserMutation),
  Report: {...ReportRest},
  Task: {...TaskRest},
  User: {...UserRest},
};
