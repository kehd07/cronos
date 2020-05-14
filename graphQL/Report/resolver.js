/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable no-invalid-this */
/* eslint-disable no-throw-literal */
/* eslint-disable max-len */

import {
  insertUtilities,
  queryUtilities,
  projectUtilities,
  updateUtilities,
  processHook,
  dbHelpers,
  resolverHelpers,
} from 'mongo-graphql-starter';
import hooksObj from '../hooks';
const runHook = processHook.bind(this, hooksObj, 'Report');
const {decontructGraphqlQuery, cleanUpResults, dataLoaderId} = queryUtilities;
const {setUpOneToManyRelationships, newObjectFromArgs} = insertUtilities;
const {getMongoProjection, parseRequestedFields} = projectUtilities;
const {getUpdateObject, setUpOneToManyRelationshipsForUpdate} = updateUtilities;
import {ObjectId} from 'mongodb';
import ReportMetadata from './Report';
import TaskMetadata from '../Task/Task';
import flatMap from 'lodash.flatmap';
import DataLoader from 'dataloader';

async function loadReports(db, aggregationPipeline, root, args, context, ast) {
  await processHook(hooksObj, 'Report', 'queryPreAggregate', aggregationPipeline, {db, root, args, context, ast});
  const Reports = await dbHelpers.runQuery(db, 'reports', aggregationPipeline);
  await processHook(hooksObj, 'Report', 'adjustResults', Reports);
  Reports.forEach((o) => {
    if (o._id) {
      o._id = '' + o._id;
    }
  });
  return cleanUpResults(Reports, ReportMetadata);
}

export const Report = {
  async tasks(obj, args, context, ast) {
    if (obj.tasks !== void 0) {
      await processHook(hooksObj, 'Task', 'adjustResults', [obj.tasks]);
      cleanUpResults([obj.tasks], TaskMetadata);
      return obj.tasks;
    }

    const dataLoaderName = dataLoaderId(ast);
    if (context[dataLoaderName] == null) {
      const db = await context.__mongodb;
      context[dataLoaderName] = new DataLoader(async (keys) => {
        const $match = {_id: {$in: keys.filter((id) => id).map((id) => ObjectId(id))}};
        const queryPacket = decontructGraphqlQuery(args, ast, TaskMetadata, null);
        const {$project, $sort, $limit, $skip} = queryPacket;

        const aggregateItems = [{$match}, {$project}];
        const results = await dbHelpers.runQuery(db, 'tasks', aggregateItems);
        cleanUpResults(results, TaskMetadata);

        const destinationMap = new Map([]);
        for (const result of results) {
          destinationMap.set('' + result._id, result);
        }
        const finalResult = keys.map((id) => destinationMap.get('' + id) || null);
        await processHook(hooksObj, 'Task', 'adjustResults', finalResult);
        return finalResult;
      });
    }
    return obj.reportId == null ? null : context[dataLoaderName].load(obj.reportId);
  },
};

export default {
  Query: {
    async getReport(root, args, context, ast) {
      const db = await (typeof root.db === 'function' ? root.db() : root.db);
      await runHook('queryPreprocess', {db, root, args, context, ast});
      context.__mongodb = db;
      const queryPacket = decontructGraphqlQuery(args, ast, ReportMetadata, 'Report');
      const {aggregationPipeline} = queryPacket;
      await runHook('queryMiddleware', queryPacket, {db, root, args, context, ast});
      const results = await loadReports(db, aggregationPipeline, root, args, context, ast, 'Report');

      return {
        Report: results[0] || null,
      };
    },
    async allReports(root, args, context, ast) {
      const db = await (typeof root.db === 'function' ? root.db() : root.db);
      await runHook('queryPreprocess', {db, root, args, context, ast});
      context.__mongodb = db;
      const queryPacket = decontructGraphqlQuery(args, ast, ReportMetadata, 'Reports');
      const {aggregationPipeline} = queryPacket;
      await runHook('queryMiddleware', queryPacket, {db, root, args, context, ast});
      const result = {};

      if (queryPacket.$project) {
        result.Reports = await loadReports(db, aggregationPipeline, root, args, context, ast);
      }

      if (queryPacket.metadataRequested.size) {
        result.Meta = {};

        if (queryPacket.metadataRequested.get('count')) {
          const $match = aggregationPipeline.find((item) => item.$match);
          const countResults = await dbHelpers.runQuery(db, 'reports', [
            $match,
            {$group: {_id: null, count: {$sum: 1}}},
          ]);
          result.Meta.count = countResults.length ? countResults[0].count : 0;
        }
      }

      return result;
    },
  },
  Mutation: {
    async createReport(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Report', ReportMetadata, {
        create: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        let newObject = await newObjectFromArgs(args.Report, ReportMetadata, {...gqlPacket, db, session});
        const requestMap = parseRequestedFields(ast, 'Report');
        const $project = requestMap.size ? getMongoProjection(requestMap, ReportMetadata, args) : null;

        newObject = await dbHelpers.processInsertion(db, newObject, {
          ...gqlPacket,
          typeMetadata: ReportMetadata,
          session,
        });
        if (newObject == null) {
          return {Report: null, success: false};
        }
        await setUpOneToManyRelationships(newObject, args.Report, ReportMetadata, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ?
          (
            await loadReports(
                db,
                [{$match: {_id: newObject._id}}, {$project}, {$limit: 1}],
                root,
                args,
                context,
                ast,
            )
          )[0] :
          null;
        return resolverHelpers.mutationSuccessResult({Report: result, transaction, elapsedTime: 0});
      });
    },
    async updateReport(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Report', ReportMetadata, {
        update: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        const {$match, $project} = decontructGraphqlQuery(
          args._id ? {_id: args._id} : {},
          ast,
          ReportMetadata,
          'Report',
        );
        const updates = await getUpdateObject(args.Updates || {}, ReportMetadata, {...gqlPacket, db, session});

        if ((await runHook('beforeUpdate', $match, updates, {...gqlPacket, db, session})) === false) {
          return resolverHelpers.mutationCancelled({transaction});
        }
        if (!$match._id) {
          throw 'No _id sent, or inserted in middleware';
        }
        await setUpOneToManyRelationshipsForUpdate([args._id], args, ReportMetadata, {...gqlPacket, db, session});
        await dbHelpers.runUpdate(db, 'reports', $match, updates, {session});
        await runHook('afterUpdate', $match, updates, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ?
          (await loadReports(db, [{$match}, {$project}, {$limit: 1}], root, args, context, ast))[0] :
          null;
        return resolverHelpers.mutationSuccessResult({Report: result, transaction, elapsedTime: 0});
      });
    },
    async deleteReport(root, args, context, ast) {
      if (!args._id) {
        throw 'No _id sent';
      }
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Report', ReportMetadata, {
        delete: true,
      });
      try {
        const $match = {_id: ObjectId(args._id)};

        if ((await runHook('beforeDelete', $match, {...gqlPacket, db, session})) === false) {
          return {success: false};
        }
        await dbHelpers.runDelete(db, 'reports', $match);
        await runHook('afterDelete', $match, {...gqlPacket, db, session});
        return await resolverHelpers.finishSuccessfulMutation(session, transaction);
      } catch (err) {
        await resolverHelpers.mutationError(err, session, transaction);
        return {success: false};
      } finally {
        resolverHelpers.mutationOver(session);
      }
    },
  },
};
