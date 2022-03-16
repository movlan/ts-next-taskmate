import { GetServerSideProps } from "next";
import Error from "next/error";
import { useRouter } from "next/router";
import React from "react";
import UpdateTaskForm from "../../components/UpdateTaskForm";
import {
  TaskDocument,
  TaskQuery,
  TaskQueryVariables,
  useTaskQuery,
} from "../../generated/graphql-frontend";
import { initializeApollo } from "../../lib/client";

const UpdateTask = () => {
  const router = useRouter();
  const id =
    typeof router.query.id === "string" ? parseInt(router.query.id, 10) : NaN;
  if (!id) {
    console.log(id);
    return <Error statusCode={404} />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data, loading, error } = useTaskQuery({ variables: { id } });
  const task = data?.task;
  return loading ? (
    <p>Loading...</p>
  ) : error ? (
    <p>An error occurred.</p>
  ) : task ? (
    <UpdateTaskForm id={task.id} initialValues={{ title: task.title }} />
  ) : (
    <p>Task not found.</p>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id =
    typeof context.params?.id === "string"
      ? parseInt(context.params?.id, 10)
      : NaN;
  if (id) {
    const apolloClient = initializeApollo();
    await apolloClient.query<TaskQuery, TaskQueryVariables>({
      query: TaskDocument,
      variables: { id },
    });
    return { props: { initialApolloState: apolloClient.cache.extract() } };
  }

  return { props: {} };
};

export default UpdateTask;
