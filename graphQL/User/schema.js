export const type = `
  
  type User {
    _id: String
    name: String
    isLead: Boolean
    reports: Report
  }

  type UserQueryResults {
    Users: [User!]!
    Meta: QueryResultsMetadata!
  }

  type UserSingleQueryResult {
    User: User
  }

  type UserMutationResult {
    User: User
    success: Boolean!
    Meta: MutationResultInfo!
  }

  type UserMutationResultMulti {
    Users: [User]
    success: Boolean!
    Meta: MutationResultInfo!
  }

  type UserBulkMutationResult {
    success: Boolean!
    Meta: MutationResultInfo!
  }

  input UserInput {
    _id: String
    name: String
    isLead: Boolean
    reports: ReportInput
  }

  input UserMutationInput {
    name: String
    isLead: Boolean
    reports_SET: ReportInput
  }

  input UserSort {
    _id: Int
    name: Int
    isLead: Int
  }

  input UserFilters {
    _id: String
    _id_ne: String
    _id_in: [String]
    _id_nin: [String]
    name_contains: String
    name_startsWith: String
    name_endsWith: String
    name_regex: String
    name: String
    name_ne: String
    name_in: [String]
    name_nin: [String]
    isLead: Boolean
    isLead_ne: Boolean
    isLead_in: [Boolean]
    isLead_nin: [Boolean]
    OR: [UserFilters]
  }
  
`;

export const mutation = `

  createUser (
    User: UserInput
  ): UserMutationResult

  updateUser (
    _id: String,
    Updates: UserMutationInput
  ): UserMutationResult

  updateUsers (
    _ids: [String],
    Updates: UserMutationInput
  ): UserMutationResultMulti

  updateUsersBulk (
    Match: UserFilters,
    Updates: UserMutationInput
  ): UserBulkMutationResult

  deleteUser (
    _id: String
  ): DeletionResultInfo

`;

export const query = `

  allUsers (
    _id: String,
    _id_ne: String,
    _id_in: [String],
    _id_nin: [String],
    name_contains: String,
    name_startsWith: String,
    name_endsWith: String,
    name_regex: String,
    name: String,
    name_ne: String,
    name_in: [String],
    name_nin: [String],
    isLead: Boolean,
    isLead_ne: Boolean,
    isLead_in: [Boolean],
    isLead_nin: [Boolean],
    OR: [UserFilters],
    SORT: UserSort,
    SORTS: [UserSort],
    LIMIT: Int,
    SKIP: Int,
    PAGE: Int,
    PAGE_SIZE: Int
  ): UserQueryResults!

  getUser (
    _id: String
  ): UserSingleQueryResult!

`;
