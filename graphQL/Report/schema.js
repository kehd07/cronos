export const type = `
  
  type Report {
    _id: String
    userId: String
    weekNumer: Int
    year: Int
    tasks: Task
  }

  type ReportQueryResults {
    Reports: [Report!]!
    Meta: QueryResultsMetadata!
  }

  type ReportSingleQueryResult {
    Report: Report
  }

  type ReportMutationResult {
    Report: Report
    success: Boolean!
    Meta: MutationResultInfo!
  }

  input ReportInput {
    userId: String
    weekNumer: Int
    year: Int
  }

  input ReportMutationInput {
    userId: String
    weekNumer: Int
    weekNumer_INC: Int
    weekNumer_DEC: Int
    year: Int
    year_INC: Int
    year_DEC: Int
    tasks_SET: TaskInput
  }

  input ReportSort {
    _id: Int
    userId: Int
    weekNumer: Int
    year: Int
  }

  input ReportFilters {
    _id: String
    _id_ne: String
    _id_in: [String]
    _id_nin: [String]
    userId: String
    userId_ne: String
    userId_in: [String]
    userId_nin: [String]
    weekNumer_lt: Int
    weekNumer_lte: Int
    weekNumer_gt: Int
    weekNumer_gte: Int
    weekNumer: Int
    weekNumer_ne: Int
    weekNumer_in: [Int]
    weekNumer_nin: [Int]
    year_lt: Int
    year_lte: Int
    year_gt: Int
    year_gte: Int
    year: Int
    year_ne: Int
    year_in: [Int]
    year_nin: [Int]
    OR: [ReportFilters]
  }
  
`;

export const mutation = `

  createReport (
    Report: ReportInput
  ): ReportMutationResult

  updateReport (
    _id: String,
    Updates: ReportMutationInput
  ): ReportMutationResult

  deleteReport (
    _id: String
  ): DeletionResultInfo

`;

export const query = `

  allReports (
    _id: String,
    _id_ne: String,
    _id_in: [String],
    _id_nin: [String],
    userId: String,
    userId_ne: String,
    userId_in: [String],
    userId_nin: [String],
    weekNumer_lt: Int,
    weekNumer_lte: Int,
    weekNumer_gt: Int,
    weekNumer_gte: Int,
    weekNumer: Int,
    weekNumer_ne: Int,
    weekNumer_in: [Int],
    weekNumer_nin: [Int],
    year_lt: Int,
    year_lte: Int,
    year_gt: Int,
    year_gte: Int,
    year: Int,
    year_ne: Int,
    year_in: [Int],
    year_nin: [Int],
    OR: [ReportFilters],
    SORT: ReportSort,
    SORTS: [ReportSort],
    LIMIT: Int,
    SKIP: Int,
    PAGE: Int,
    PAGE_SIZE: Int
  ): ReportQueryResults!

  getReport (
    _id: String
  ): ReportSingleQueryResult!

`;
