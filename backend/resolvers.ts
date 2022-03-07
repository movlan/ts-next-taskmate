import { UserInputError } from "apollo-server-micro";
import { OkPacket } from "mysql";
import serverlessMysql from "serverless-mysql";
import { Resolvers, TaskStatus } from "../generated/graphql-backend";

interface ApolloContext {
  db: serverlessMysql.ServerlessMysql;
}

interface DbTaskRow {
  id: number;
  title: string;
  task_status: TaskStatus;
}
type DbTasksQueryResult = DbTaskRow[];
type DbTaskQueryResult = DbTaskRow[];

const getTaskById = async (id: number, db: serverlessMysql.ServerlessMysql) => {
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

export const resolvers: Resolvers<ApolloContext> = {
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
