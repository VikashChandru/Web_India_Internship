from flask import Flask, request, jsonify, render_template
import pyodbc
import re
from datetime import datetime

app = Flask(__name__)

# Database configuration
server = r"VIKASH_CHANDRU\SQLEXPRESS"
database = "AssetManagement"
username = "sa"
password = "sql123"
driver = "ODBC Driver 17 for SQL Server"

def get_db_connection():
    try:
        return pyodbc.connect(
            f'DRIVER={{{driver}}};SERVER={server};PORT=1433;DATABASE={database};UID={username};PWD={password}'
        )
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def create_server_table():
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed during table creation.")
        return
    cursor = conn.cursor()
    try:
        cursor.execute("""
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'server' AND TABLE_SCHEMA = 'dbo'
            )
            BEGIN
                CREATE TABLE server (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    server_name NVARCHAR(100) UNIQUE NOT NULL,
                    type NVARCHAR(50) NOT NULL,
                    cpu NVARCHAR(50) NOT NULL,
                    ram NVARCHAR(50) NOT NULL,
                    disk_space NVARCHAR(50),
                    created_by NVARCHAR(100),
                    created_at DATETIME DEFAULT GETDATE()
                );
            END
        """)
        conn.commit()
        print("✅ 'server' table created or verified.")
    except Exception as e:
        print(f"Table creation error: {e}")
    finally:
        cursor.close()
        conn.close()

@app.route('/')
def index():
    return render_template("physical_server_management.html")

# Add new server
@app.route('/api/servers', methods=['POST'])
def add_server():
    # Log the raw request data
    raw_data = request.data  # Get the raw request body
    print("📦 Raw Request Data:", raw_data)  # Log the raw request body

    # Parse JSON data
    data = request.get_json()
    print("📦 Parsed Payload:", data)  # Log the parsed data

    # Check if the necessary fields are present
    server_name = data.get("server_name")
    cpu = data.get("cpu")
    ram = data.get("ram")
    disk = data.get("disk_space", "")
    created_by = data.get("created_by", "Unknown")

    # Log if any field is missing
    if not server_name:
        print("🚨 'server_name' is missing")
    if not cpu:
        print("🚨 'cpu' is missing")
    if not ram:
        print("🚨 'ram' is missing")

    # Check if required fields are provided
    if not server_name or not cpu or not ram:
        return jsonify({"success": False, "message": "Server name, CPU, and RAM are required."}), 400

    # Clean disk_space to ensure it's numeric and formatted correctly
    disk = re.sub(r"[^\d/]", "", disk)

    # Log the processed data
    print("✅ Processed data:", {
        "server_name": server_name,
        "cpu": cpu,
        "ram": ram,
        "disk_space": disk,
        "created_by": created_by
    })

    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "DB connection failed."}), 500

    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO server (server_name, type, cpu, ram, disk_space, created_by)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?)
        """, (server_name, "Physical", cpu, ram, disk, created_by))
        new_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({
            "success": True,
            "message": "Server added successfully!",
            "server": {
                "id": new_id,
                "server_name": server_name,
                "cpu": cpu,
                "ram": ram,
                "disk": disk,
                "created_by": created_by,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        })
    except Exception as e:
        print(f"🚨 Insert error: {e}")
        return jsonify({"success": False, "message": f"Insert failed: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

# Get all servers
@app.route('/api/servers', methods=['GET'])
def get_all_servers():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "DB connection failed."}), 500

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM server")
        columns = [column[0] for column in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify({"success": True, "servers": rows})
    except Exception as e:
        print(f"🚨 Fetch error: {e}")
        return jsonify({"success": False, "message": f"Fetch failed: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

# Get next server ID (read-only, display only)
@app.route('/api/servers/next-id')
def get_next_id():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"nextId": ""})
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT ISNULL(MAX(id), 0) + 1 FROM server")
        next_id = cursor.fetchone()[0]
        return jsonify({"nextId": next_id})
    except Exception as e:
        print(f"ID lookup error: {e}")
        return jsonify({"nextId": ""})
    finally:
        cursor.close()
        conn.close()

# Update existing server
@app.route('/api/servers/<int:id>', methods=['PUT'])
def update_server(id):
    data = request.get_json()
    print("📦 Received update:", data)

    server_name = data.get("server_name")
    cpu = data.get("cpu")
    ram = data.get("ram")
    disk = data.get("disk_space", "")
    created_by = data.get("created_by", "Unknown")

    if not server_name or not cpu or not ram:
        return jsonify({"success": False, "message": "Server name, CPU, and RAM are required."}), 400

    disk = re.sub(r"[^\d/]", "", disk)

    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "DB connection failed."}), 500

    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE server
            SET server_name=?, type=?, cpu=?, ram=?, disk_space=?, created_by=?
            WHERE id=?
        """, (server_name, "Physical", cpu, ram, disk, created_by, id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": f"No server with id {id} found."}), 404
        return jsonify({"success": True, "message": "Server updated successfully."})
    except Exception as e:
        print(f"🚨 Update error: {e}")
        return jsonify({"success": False, "message": f"Update failed: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

# Delete a server
@app.route('/api/servers/<int:id>', methods=['DELETE'])
def delete_server(id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "DB connection failed."}), 500

    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM server WHERE id=?", (id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Server not found."}), 404
        return jsonify({"success": True, "message": "Server deleted successfully!"})
    except Exception as e:
        print(f"🚨 Delete error: {e}")
        return jsonify({"success": False, "message": f"Delete failed: {e}"}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_server_table()
    app.run(debug=True)
