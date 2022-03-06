import { ApolloServer, gql, UserInputError } from "apollo-server-micro";
import mysql from "serverless-mysql";
import { OkPacket } from "mysql";
import { Resolvers, TaskStatus } from "../../generated/graphql-backend";
import { NextApiRequest, NextApiResponse } from "next";

const typeDefs = gql`
  enum TaskStatus {
    active
    completed
  }

  type Task {
    id: Int!
    title: String!
    status: TaskStatus!
  }

  input CreateTaskInput {
    title: String!
  }

  input UpdateTaskInput {
    id: Int!
    title: String
    status: TaskStatus
  }

  type Query {
    tasks(status: TaskStatus): [Task!]!
    task(id: Int!): Task
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task
    updateTask(input: UpdateTaskInput!): Task
    deleteTask(id: Int!): Task
  }
`;

interface ApolloContext {
  db: mysql.ServerlessMysql;
}

interface DbTaskRow {
  id: number;
  title: string;
  task_status: TaskStatus;
}
type DbTasksQueryResult = DbTaskRow[];
type DbTaskQueryResult = DbTaskRow[];

const getTaskById = async (id: number, db: mysql.ServerlessMysql) => {
  const task = await db.query<DbTaskQueryResult>(
    "SELECT * FROM tasks WHERE id = ?",
    [id]
  );
  return task.length
    ? {
        id: task[0].id,
        title: task[0].title,
        status: task[0].task_status,
      }
    : null;
};

const resolvers: Resolvers<ApolloContext> = {
  Query: {
    async tasks(parent, args, context) {
      const { status } = args;
      let query = "SELECT id, title, task_status FROM tasks";
      const queryParams: string[] = [];

      if (status) {
        query += " WHERE task_status = ?";
        queryParams.push(status);
      }
      const tasks = await context.db.query<DbTasksQueryResult>(
        query,
        queryParams
      );
      await context.db.end();
      return tasks.map(({ id, title, task_status }) => ({
        id,
        title,
        status: task_status,
      }));
    },
    async task(parent, args, context) {
      return await getTaskById(args.id, context.db);
    },
  },
  Mutation: {
    async createTask(parent, args, context) {
      const result = await context.db.query<OkPacket>(
        "INSERT INTO tasks (title, task_status) VALUES (?, ?)",
        [args.input.title, TaskStatus.Active]
      );
      return {
        id: result.insertId,
        title: args.input.title,
        status: TaskStatus.Active,
      };
    },
    async updateTask(parent, args, context) {
      const columns: string[] = [];
      const sqlParams: any[] = [];
      const { id, title, status } = args.input;
      if (title) {
        columns.push("title = ?");
        sqlParams.push(title);
      }
      if (status) {
        columns.push("task_status = ?");
        sqlParams.push(status);
      }
      sqlParams.push(id);
      await context.db.query(
        `UPDATE tasks SET ${columns.join(", ")} WHERE id = ?`,
        sqlParams
      );

      return await getTaskById(id, context.db);
    },
    async deleteTask(parent, args, context) {
      const task = await getTaskById(args.id, context.db);

      if (!task) {
        throw new UserInputError("Could not find your task.");
      }

      await context.db.query("DELETE FROM tasks WHERE id = ?", [args.id]);

      return task;
    },
  },
};

const db = mysql({
  config: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
});

const apolloServer = new ApolloServer({ typeDefs, resolvers, context: { db } });

const startServer = apolloServer.start();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://studio.apollographql.com"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
