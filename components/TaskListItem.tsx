import { Reference } from "@apollo/client";
import Link from "next/link";
import React, { useEffect } from "react";
import { Task, useDeleteTaskMutation } from "../generated/graphql-frontend";

interface Props {
  task: Task;
}

const TaskListItem: React.FC<Props> = ({ task }) => {
  const [deleteTask, { loading, error }] = useDeleteTaskMutation({
    variables: { id: task.id },
    update: (cache, result) => {
      console.log(cache.extract());
      const deletedTask = result.data?.deleteTask;
      if (deletedTask) {
        cache.modify({
          fields: {
            tasks(taskRefs: Reference[], { readField }) {
              taskRefs.filter((taskRef) => {
                return readField("id", taskRef) !== deletedTask.id;
              });
            },
          },
        });
      }
    },
  });

  const handleDeleteClick: React.MouseEventHandler<
    HTMLButtonElement
  > = async () => {
    try {
      await deleteTask();
    } catch (error) {}
  };

  useEffect(() => {
    if (error) {
      alert("An error accrued, please try again.");
    }
  }, [error]);

  return (
    <li className="task-list-item" key={task.id}>
      <Link href="/update/[id]" as={`/update/${task.id}`}>
        <a className="task-list-item-title">{task.title}</a>
      </Link>
      <button
        className="task-list-item-delete"
        onClick={handleDeleteClick}
        disabled={loading}
      >
        &times;
      </button>
    </li>
  );
};

export default TaskListItem;
