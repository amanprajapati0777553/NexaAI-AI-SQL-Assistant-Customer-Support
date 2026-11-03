import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "demo.db"

def initialize_database():
    with sqlite3.connect(DB_PATH) as con:
        con.executescript(
            "CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, name TEXT, course TEXT, marks INTEGER);"
            "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer TEXT, product TEXT, status TEXT, total REAL);"
        )
        if con.execute("SELECT COUNT(*) FROM students").fetchone()[0] == 0:
            con.executemany("INSERT INTO students(name,course,marks) VALUES(?,?,?)", [
                ("Aarav","Computer Science",91), ("Priya","IT",88), ("Kabir","Computer Science",76),
                ("Sara","AI",95), ("Rohan","IT",82)
            ])
        if con.execute("SELECT COUNT(*) FROM orders").fetchone()[0] == 0:
            con.executemany("INSERT INTO orders(customer,product,status,total) VALUES(?,?,?,?)", [
                ("Neha","Headphones","Shipped",1499), ("Arjun","Keyboard","Processing",2499),
                ("Meera","Mouse","Delivered",799)
            ])
