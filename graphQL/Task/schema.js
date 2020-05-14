export const type = `
  
  type Task {
    _id: String
    reportId: String
    isDone: Boolean
  }

  type TaskQueryResults {
    Tasks: [Task!]!
    Meta: QueryResultsMetadata!
  }

  type TaskSingleQueryResult {
    Task: Task
  }

  type TaskMutationResult {
    Task: Task
    success: Boolean!
    Meta: MutationResultInfo!
  }

  type TaskMutationResultMulti {
    Tasks: [Task]
    success: Boolean!
    Meta: MutationResultInfo!
  }

  type TaskBulkMutationResult {
    success: Boolean!
    Meta: MutationResultInfo!
  }

  input TaskInput {
    _id: String
    reportId: String
    isDone: Boolean
  }

  input TaskMutationInput {
    reportId: String
    isDone: Boolean
  }

  input TaskSort {
    _id: Int
    reportId: Int
    isDone: Int
  }

  input TaskFilters {
    _id: String
    _id_ne: String
    _id_in: [String]
    _id_nin: [String]
    reportId: String
    reportId_ne: String
    reportId_in: [String]
    reportId_nin: [String]
    isDone: Boolean
    isDone_ne: Boolean
    isDone_in: [Boolean]
    isDone_nin: [Boolean]
    OR: [TaskFilters]
  }
  
`;

export const mutation = `

  createTask (
    Task: TaskInput
  ): TaskMutationResult

  updateTask (
    _id: String,
    Updates: TaskMutationInput
  ): TaskMutationResult

  updateTasks (
    _ids: [String],
    Updates: TaskMutationInput
  ): TaskMutationResultMulti

  updateTasksBulk (
    Match: TaskFilters,
    Updates: TaskMutationInput
  ): TaskBulkMutationResult

  deleteTask (
    _id: String
  ): DeletionResultInfo

`;

export const query = `

  allTasks (
    _id: String,
    _id_ne: String,
    _id_in: [String],
    _id_nin: [String],
    reportId: String,
    reportId_ne: String,
    reportId_in: [String],
    reportId_nin: [String],
    isDone: Boolean,
    isDone_ne: Boolean,
    isDone_in: [Boolean],
    isDone_nin: [Boolean],
    OR: [TaskFilters],
    SORT: TaskSort,
    SORTS: [TaskSort],
    LIMIT: Int,
    SKIP: Int,
    PAGE: Int,
    PAGE_SIZE: Int
  ): TaskQueryResults!

  getTask (
    _id: String
  ): TaskSingleQueryResult!

`;
