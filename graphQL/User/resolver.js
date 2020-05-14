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
const runHook = processHook.bind(this, hooksObj, 'User');
const {decontructGraphqlQuery, cleanUpResults, dataLoaderId} = queryUtilities;
const {setUpOneToManyRelationships, newObjectFromArgs} = insertUtilities;
const {getMongoProjection, parseRequestedFields} = projectUtilities;
const {getUpdateObject, setUpOneToManyRelationshipsForUpdate} = updateUtilities;
import {ObjectId} from 'mongodb';
import UserMetadata from './User';
import ReportMetadata from '../Report/Report';
import flatMap from 'lodash.flatmap';
import DataLoader from 'dataloader';

async function loadUsers(db, aggregationPipeline, root, args, context, ast) {
  await processHook(hooksObj, 'User', 'queryPreAggregate', aggregationPipeline, {db, root, args, context, ast});
  const Users = await dbHelpers.runQuery(db, 'users', aggregationPipeline);
  await processHook(hooksObj, 'User', 'adjustResults', Users);
  Users.forEach((o) => {
    if (o._id) {
      o._id = '' + o._id;
    }
  });
  return cleanUpResults(Users, UserMetadata);
}

export const User = {
  async reports(obj, args, context, ast) {
    if (obj.reports !== void 0) {
      await processHook(hooksObj, 'Report', 'adjustResults', [obj.reports]);
      cleanUpResults([obj.reports], ReportMetadata);
      return obj.reports;
    }

    const dataLoaderName = dataLoaderId(ast);
    if (context[dataLoaderName] == null) {
      const db = await context.__mongodb;
      context[dataLoaderName] = new DataLoader(async (keys) => {
        const $match = {_id: {$in: keys.filter((id) => id).map((id) => ObjectId(id))}};
        const queryPacket = decontructGraphqlQuery(args, ast, ReportMetadata, null);
        const {$project, $sort, $limit, $skip} = queryPacket;

        const aggregateItems = [{$match}, {$project}];
        const results = await dbHelpers.runQuery(db, 'reports', aggregateItems);
        cleanUpResults(results, ReportMetadata);

        const destinationMap = new Map([]);
        for (const result of results) {
          destinationMap.set('' + result._id, result);
        }
        const finalResult = keys.map((id) => destinationMap.get('' + id) || null);
        await processHook(hooksObj, 'Report', 'adjustResults', finalResult);
        return finalResult;
      });
    }
    return obj.userId == null ? null : context[dataLoaderName].load(obj.userId);
  },
};

export default {
  Query: {
    async getUser(root, args, context, ast) {
      const db = await (typeof root.db === 'function' ? root.db() : root.db);
      await runHook('queryPreprocess', {db, root, args, context, ast});
      context.__mongodb = db;
      const queryPacket = decontructGraphqlQuery(args, ast, UserMetadata, 'User');
      const {aggregationPipeline} = queryPacket;
      await runHook('queryMiddleware', queryPacket, {db, root, args, context, ast});
      const results = await loadUsers(db, aggregationPipeline, root, args, context, ast, 'User');

      return {
        User: results[0] || null,
      };
    },
    async allUsers(root, args, context, ast) {
      const db = await (typeof root.db === 'function' ? root.db() : root.db);
      await runHook('queryPreprocess', {db, root, args, context, ast});
      context.__mongodb = db;
      const queryPacket = decontructGraphqlQuery(args, ast, UserMetadata, 'Users');
      const {aggregationPipeline} = queryPacket;
      await runHook('queryMiddleware', queryPacket, {db, root, args, context, ast});
      const result = {};

      if (queryPacket.$project) {
        result.Users = await loadUsers(db, aggregationPipeline, root, args, context, ast);
      }

      if (queryPacket.metadataRequested.size) {
        result.Meta = {};

        if (queryPacket.metadataRequested.get('count')) {
          const $match = aggregationPipeline.find((item) => item.$match);
          const countResults = await dbHelpers.runQuery(db, 'users', [
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
    async createUser(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'User', UserMetadata, {
        create: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        let newObject = await newObjectFromArgs(args.User, UserMetadata, {...gqlPacket, db, session});
        const requestMap = parseRequestedFields(ast, 'User');
        const $project = requestMap.size ? getMongoProjection(requestMap, UserMetadata, args) : null;

        newObject = await dbHelpers.processInsertion(db, newObject, {
          ...gqlPacket,
          typeMetadata: UserMetadata,
          session,
        });
        if (newObject == null) {
          return {User: null, success: false};
        }
        await setUpOneToManyRelationships(newObject, args.User, UserMetadata, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ?
          (
            await loadUsers(
                db,
                [{$match: {_id: newObject._id}}, {$project}, {$limit: 1}],
                root,
                args,
                context,
                ast,
            )
          )[0] :
          null;
        return resolverHelpers.mutationSuccessResult({User: result, transaction, elapsedTime: 0});
      });
    },
    async updateUser(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'User', UserMetadata, {
        update: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        const {$match, $project} = decontructGraphqlQuery(args._id ? {_id: args._id} : {}, ast, UserMetadata, 'User');
        const updates = await getUpdateObject(args.Updates || {}, UserMetadata, {...gqlPacket, db, session});

        if ((await runHook('beforeUpdate', $match, updates, {...gqlPacket, db, session})) === false) {
          return resolverHelpers.mutationCancelled({transaction});
        }
        if (!$match._id) {
          throw 'No _id sent, or inserted in middleware';
        }
        await setUpOneToManyRelationshipsForUpdate([args._id], args, UserMetadata, {...gqlPacket, db, session});
        await dbHelpers.runUpdate(db, 'users', $match, updates, {session});
        await runHook('afterUpdate', $match, updates, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ?
          (await loadUsers(db, [{$match}, {$project}, {$limit: 1}], root, args, context, ast))[0] :
          null;
        return resolverHelpers.mutationSuccessResult({User: result, transaction, elapsedTime: 0});
      });
    },
    async updateUsers(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'User', UserMetadata, {
        update: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        const {$match, $project} = decontructGraphqlQuery({_id_in: args._ids}, ast, UserMetadata, 'Users');
        const updates = await getUpdateObject(args.Updates || {}, UserMetadata, {...gqlPacket, db, session});

        if ((await runHook('beforeUpdate', $match, updates, {...gqlPacket, db, session})) === false) {
          return resolverHelpers.mutationCancelled({transaction});
        }
        await setUpOneToManyRelationshipsForUpdate(args._ids, args, UserMetadata, {...gqlPacket, db, session});
        await dbHelpers.runUpdate(db, 'users', $match, updates, {session});
        await runHook('afterUpdate', $match, updates, {...gqlPacket, db, session});
        await resolverHelpers.mutationComplete(session, transaction);

        const result = $project ? await loadUsers(db, [{$match}, {$project}], root, args, context, ast) : null;
        return resolverHelpers.mutationSuccessResult({Users: result, transaction, elapsedTime: 0});
      });
    },
    async updateUsersBulk(root, args, context, ast) {
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'User', UserMetadata, {
        update: true,
      });
      return await resolverHelpers.runMutation(session, transaction, async () => {
        const {$match} = decontructGraphqlQuery(args.Match, ast, UserMetadata);
        const updates = await getUpdateObject(args.Updates || {}, UserMetadata, {...gqlPacket, db, session});

        if ((await runHook('beforeUpdate', $match, updates, {...gqlPacket, db, session})) === false) {
          return resolverHelpers.mutationCancelled({transaction});
        }
        await dbHelpers.runUpdate(db, 'users', $match, updates, {session});
        await runHook('afterUpdate', $match, updates, {...gqlPacket, db, session});

        return await resolverHelpers.finishSuccessfulMutation(session, transaction);
      });
    },
    async deleteUser(root, args, context, ast) {
      if (!args._id) {
        throw 'No _id sent';
      }
      const gqlPacket = {root, args, context, ast, hooksObj};
      const {db, session, transaction} = await resolverHelpers.startDbMutation(gqlPacket, 'User', UserMetadata, {
        delete: true,
      });
      try {
        const $match = {_id: ObjectId(args._id)};

        if ((await runHook('beforeDelete', $match, {...gqlPacket, db, session})) === false) {
          return {success: false};
        }
        await dbHelpers.runDelete(db, 'users', $match);
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
