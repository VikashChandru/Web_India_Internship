from flask import Flask, request, jsonify, render_template, url_for
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import pyodbc
from flask_mail import Mail, Message

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-very-secret-key'  # Replace with a strong random key

# ==================== Flask-Mail Configuration ====================
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'vichand2004@gmail.com'
app.config['MAIL_PASSWORD'] = ''  # Use app password 
app.config['MAIL_DEFAULT_SENDER'] = 'webindia@gmail.com'

mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

def get_db_connection():
    conn = pyodbc.connect(
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'SERVER=VIKASH_CHANDRU\\SQLEXPRESS;'
        'DATABASE=AssetManagement;'
        'UID=sa;'
        'PWD=sql123'
    )
    return conn

# ==================== Routes ====================

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/users')
def get_users_with_roles():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT u.id, u.email, u.status, r.name AS role_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    """
    cursor.execute(query)
    users = [{
        'id': row.id,
        'email': row.email,
        'status': row.status,
        'role': row.role_name
    } for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(users)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
        SELECT u.password, u.status, r.name AS role_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.email = ?
        """
        cursor.execute(query, (email,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            db_password = user.password
            if password == db_password:
                message = f"Login successful! Role: {user.role_name}, Status: {user.status}"
            else:
                message = "Incorrect password"
        else:
            message = "User not found"

        return render_template("login.html", message=message)

    return render_template("login.html")

# ==================== Forgot Password ====================
@app.route('/forgot', methods=['GET', 'POST'])
def forgot():
    message = None
    if request.method == 'POST':
        email = request.form.get('email').strip().lower()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE LOWER(TRIM(email)) = ?", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            token = serializer.dumps(email, salt='password-reset-salt')
            reset_link = url_for('reset_password', token=token, _external=True)

            try:
                msg = Message("Reset Your Password", recipients=[email])
                msg.body = f"""
Hi,

We received a request to reset your password.
Click the link below to reset it:

{reset_link}

If you didn’t request this, you can ignore this email.

Thanks,
Asset Management Team
                """
                mail.send(msg)
                message = "A password reset link has been sent to your email address."
            except Exception as e:
                print("Email sending failed:", e)
                message = "Failed to send email. Contact admin."

        else:
            message = "Email address not found."

    return render_template('forgot.html', message=message)

# ==================== Password Reset ====================
@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
    except SignatureExpired:
        return render_template('reset_password.html', message="The reset link has expired.", token=token)
    except BadSignature:
        return render_template('reset_password.html', message="Invalid or tampered token.", token=token)

    if request.method == 'POST':
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if new_password != confirm_password:
            return render_template('reset_password.html', message="Passwords do not match.", token=token)

        conn = get_db_connection()
        cursor = conn.cursor()
        update_query = "UPDATE users SET password = ? WHERE LOWER(TRIM(email)) = ?"
        cursor.execute(update_query, (new_password, email))
        conn.commit()
        cursor.close()
        conn.close()

        return render_template('reset_password.html', message="Password has been reset successfully.")

    return render_template('reset_password.html', token=token)

# ==================== Run App ====================
if __name__ == '__main__':
    app.run(debug=True)
