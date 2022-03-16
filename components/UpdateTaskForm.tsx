import { useRouter } from "next/router";
import React, { useState } from "react";
import { useUpdateTaskMutation } from "../generated/graphql-frontend";

interface Values {
  title: string;
}

interface Props {
  id: number;
  initialValues: Values;
}

const UpdateTaskForm: React.FC<Props> = ({ initialValues, id }) => {
  const [values, setValues] = useState<Values>(initialValues);
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    setValues((prevValues) => ({ ...prevValues, [name]: value }));
  };
  const [updateTask, { loading, error }] = useUpdateTaskMutation();
  const router = useRouter();
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      const result = await updateTask({
        variables: { input: { title: values.title, id } },
      });
      if (result.data?.updateTask) {
        router.push("/");
      }
    } catch (error) {
      // if(isApolloError(error)) {}
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="alert-error">{error.message}</p>}
      <p>
        <label className="filed-label">Title</label>
        <input
          type="text"
          name="title"
          className="text-input"
          value={values.title}
          onChange={handleChange}
        />
      </p>
      <button className="button" type="submit" disabled={loading}>
        {loading ? "Loading" : "Save"}
      </button>
    </form>
  );
};

export default UpdateTaskForm;
