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
const runHook = processHook.bind(this, hooksObj, 'Task');
const {decontructGraphqlQuery, cleanUpResults, dataLoaderId} = queryUtilities;
const {setUpOneToManyRelationships, newObjectFromArgs} = insertUtilities;
const {getMongoProjection, parseRequestedFields} = projectUtilities;
const {getUpdateObject, setUpOneToManyRelationshipsForUpdate} = updateUtilities;
import {ObjectId} from 'mongodb';
import TaskMetadata from './Task';

async function loadTasks(db, aggregationPipeline, root, args, context, ast) {
  await processHook(hooksObj, 'Task', 'queryPreAggregate', aggregationPipeline, {db, root, args, context, ast});
  const Tasks = await dbHelpers.runQuery(db, 'tasks', aggregationPipeline);
  await processHook(hooksObj, 'Task', 'adjustResults', Tasks);
  Tasks.forEach((o) => {
    if (o._id) {
      o._id = '' + o._id;
    }
  });
  return cleanUpResults(Tasks, TaskMetadata);
}

export const Task = {};

export default {
  Query: {
    async getTask(root, args, context, ast) {
      const db = await (typeof root.db === 'function' ? root.db() : root.db);
      await runHook('queryPreprocess', {db, root, args, context, ast});
      context.__mongodb = db;
      const queryPacket = decontructGraphqlQuery(args, ast, TaskMetadata, 'Task');
      const {aggregationPipeline} = queryPacket;
      await runHook('queryMiddleware', queryPacket, {db, root, args, context, ast});
      const results = await loadTasks(db, aggregationPipeline, root, args, context, ast, 'Task');

      return {
        Task: results[0] || null,
      };
    },
    async allTasks(root, args, context, ast) {
      const db = await (typeof root.db === 'function' ? root.db() : root.db);
      await runHook('queryPreprocess', {db, root, args, context, ast});
      context.__mongodb = db;
      const queryPacket = decontructGraphqlQuery(args, ast, TaskMetadata, 'Tasks');
      const {aggregationPipeline} = queryPacket;
      await runHook('queryMiddleware', queryPacket, {db, root, args, context, ast});
      const result = {};

      if (queryPacket.$project) {
        result.Tasks = await loadTasks(db, aggregationPipeline, root, args, context, ast);
      }

      if (queryPacket.metadataRequested.size) {
        result.Meta = {};

        if (queryPacket.metadataRequested.get('count')) {
          const $match = aggregationPipeline.find((item) => item.$match);
          const countResults = await dbHelpers.runQuery(db, 'tasks', [
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
    async createTask(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Task', TaskMetadata, {
        create: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        let newObject = await newObjectFromArgs(args.Task, TaskMetadata, {...gqlPacket, db, session});
        const requestMap = parseRequestedFields(ast, 'Task');
        const $project = requestMap.size ? getMongoProjection(requestMap, TaskMetadata, args) : null;

        newObject = await dbHelpers.processInsertion(db, newObject, {
          ...gqlPacket,
          typeMetadata: TaskMetadata,
          session,
        });
        if (newObject == null) {
          return {Task: null, success: false};
        }
        await setUpOneToManyRelationships(newObject, args.Task, TaskMetadata, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ?
          (
            await loadTasks(
                db,
                [{$match: {_id: newObject._id}}, {$project}, {$limit: 1}],
                root,
                args,
                context,
                ast,
            )
          )[0] :
          null;
        return resolverHelpers.mutationSuccessResult({Task: result, transaction, elapsedTime: 0});
      });
    },
    async updateTask(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Task', TaskMetadata, {
        update: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        const {$match, $project} = decontructGraphqlQuery(args._id ? {_id: args._id} : {}, ast, TaskMetadata, 'Task');
        const updates = await getUpdateObject(args.Updates || {}, TaskMetadata, {...gqlPacket, db, session});

        if ((await runHook('beforeUpdate', $match, updates, {...gqlPacket, db, session})) === false) {
          return resolverHelpers.mutationCancelled({transaction});
        }
        if (!$match._id) {
          throw 'No _id sent, or inserted in middleware';
        }
        await setUpOneToManyRelationshipsForUpdate([args._id], args, TaskMetadata, {...gqlPacket, db, session});
        await dbHelpers.runUpdate(db, 'tasks', $match, updates, {session});
        await runHook('afterUpdate', $match, updates, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ?
          (await loadTasks(db, [{$match}, {$project}, {$limit: 1}], root, args, context, ast))[0] :
          null;
        return resolverHelpers.mutationSuccessResult({Task: result, transaction, elapsedTime: 0});
      });
    },
    async updateTasks(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Task', TaskMetadata, {
        update: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        const {$match, $project} = decontructGraphqlQuery({_id_in: args._ids}, ast, TaskMetadata, 'Tasks');
        const updates = await getUpdateObject(args.Updates || {}, TaskMetadata, {...gqlPacket, db, session});

        if ((await runHook('beforeUpdate', $match, updates, {...gqlPacket, db, session})) === false) {
          return resolverHelpers.mutationCancelled({transaction});
        }
        await setUpOneToManyRelationshipsForUpdate(args._ids, args, TaskMetadata, {...gqlPacket, db, session});
        await dbHelpers.runUpdate(db, 'tasks', $match, updates, {session});
        await runHook('afterUpdate', $match, updates, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ? await loadTasks(db, [{$match}, {$project}], root, args, context, ast) : null;
        return resolverHelpers.mutationSuccessResult({Tasks: result, transaction, elapsedTime: 0});
      });
    },
    async updateTasksBulk(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Task', TaskMetadata, {
        update: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        const {$match} = decontructGraphqlQuery(args.Match, ast, TaskMetadata);
        const updates = await getUpdateObject(args.Updates || {}, TaskMetadata, {...gqlPacket, db, session});

        if ((await runHook('beforeUpdate', $match, updates, {...gqlPacket, db, session})) === false) {
          return resolverHelpers.mutationCancelled({transaction});
        }
        await dbHelpers.runUpdate(db, 'tasks', $match, updates, {session});
        await runHook('afterUpdate', $match, updates, {...gqlPacket, db, session});

        return await resolverHelpers.finishSuccessfulMutation(session, transaction);
      });
    },
    async deleteTask(root, args, context, ast) {
      if (!args._id) {
        throw 'No _id sent';
      }
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'Task', TaskMetadata, {
        delete: true,
      });
      try {
        const $match = {_id: ObjectId(args._id)};

        if ((await runHook('beforeDelete', $match, {...gqlPacket, db, session})) === false) {
          return {success: false};
        }
        await dbHelpers.runDelete(db, 'tasks', $match);
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
