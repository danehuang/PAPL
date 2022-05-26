
This directory has the SQL lesson. It lets you run SQL commands in Jupyter Lab.
These commands hit an in-memory SQLite database that's constructed by the code
in the notebook. If you wreck the database, run all the notebook code again
from the top.

To set up this directory after cloning the repo:

    % python3 -m venv venv
    % source venv/bin/activate
    (sql) % rehash
    (sql) % pip install -r requirements.txt
    (sql) % rehash

To run the notebook:

    % source venv/bin/activate
    (sql) % rehash
    (sql) % jupyter lab

To create this directory from scratch (from the `csc600` directory):

    % mkdir sql
    % cd sql
    % python3 -m venv venv
    % source venv/bin/activate
    (sql) % rehash
    (sql) % pip install jupyterlab ipython-sql
    (sql) % pip freeze > requirements.txt

