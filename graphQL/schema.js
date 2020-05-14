/* eslint-disable max-len */
import {query as ReportQuery, mutation as ReportMutation, type as ReportType} from './Report/schema';
import {query as TaskQuery, mutation as TaskMutation, type as TaskType} from './Task/schema';
import {query as UserQuery, mutation as UserMutation, type as UserType} from './User/schema';

export default `

  scalar JSON

  type DeletionResultInfo {
    success: Boolean!,
    Meta: MutationResultInfo!
  }

  type MutationResultInfo {
    transaction: Boolean!,
    elapsedTime: Int!
  }

  type QueryResultsMetadata {
    count: Int!
  }

  type QueryRelationshipResultsMetadata {
    count: Int!
  }

  input StringArrayUpdate {
    index: Int!,
    value: String!
  }

  input IntArrayUpdate {
    index: Int!,
    value: Int!
  }

  input FloatArrayUpdate {
    index: Int!,
    value: Float!
  }


  ${ReportType}

  ${TaskType}

  ${UserType}

  type Query {
    ${ReportQuery}

    ${TaskQuery}

    ${UserQuery}
  }

  type Mutation {
    ${ReportMutation}

    ${TaskMutation}

    ${UserMutation}
  }

`;
