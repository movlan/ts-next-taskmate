CREATE TABLE IF NOT EXISTS tasks (
    id INT UNSIGNED AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    task_status VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
)