import React, { useState } from "react";

interface Values {
  title: string;
}

interface Props {
  initialValues: Values;
}

const UpdateTaskForm: React.FC<Props> = ({ initialValues }) => {
  const [values, setValues] = useState<Values>(initialValues);
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    setValues((prevValues) => ({ ...prevValues, [name]: value }));
  };
  return (
    <form>
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
      <button className="button" type="submit">
        Save
      </button>
    </form>
  );
};

export default UpdateTaskForm;
