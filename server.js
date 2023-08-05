// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

// Thay đổi thông tin kết nối MySQL phù hợp với máy tính của bạn
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Thay 'your_mysql_user' bằng tên user của bạn
    password: '', // Thay 'your_mysql_password' bằng mật khẩu của bạn
    database: 'github', // Thay 'notification_app' bằng tên database bạn đã tạo
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL successfully');
});

// Bạn có thể sử dụng các API dưới đây để thao tác với cơ sở dữ liệu
// API để cập nhật thông tin người dùng
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const {
        machine_name,
        UID,
        date_of_birth,
        timezone_id,
        account_status,
        adtrust_dsl,
        amount_spent,
        currency,
    } = req.body;

    connection.query(
        'UPDATE users SET machine_name=?, UID=?, date_of_birth=?, timezone_id=?, account_status=?, adtrust_dsl=?, amount_spent=?, currency=?, update_time=NOW() WHERE id=?',
        [
            machine_name,
            UID,
            date_of_birth,
            timezone_id,
            account_status,
            adtrust_dsl,
            amount_spent,
            currency,
            userId,
        ],
        (err, result) => {
            if (err) {
                res.status(400).json({ message: err.message });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json({ id: userId, ...req.body, update_time: new Date() });
        }
    );
});

// API để lấy tất cả người dùng
app.get('/users', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            res.status(500).json({ message: err.message });
            return;
        }
        res.json(results);
    });
});

// API để tạo một người dùng mới
app.post('/users', (req, res) => {
    const {
        id,
        UID,
        machine_name,
        date_of_birth,
        timezone_id,
        account_status,
        adtrust_dsl,
        amount_spent,
        currency,
    } = req.body;

    // Kiểm tra xem người dùng có tồn tại dựa vào ID và UID
    connection.query(
        'SELECT * FROM users WHERE id=? AND UID=?',
        [id, UID],
        (err, results) => {
            if (err) {
                res.status(500).json({ message: err.message });
                return;
            }

            if (results.length > 0) {
                // Nếu người dùng tồn tại, thực hiện cập nhật thông tin người dùng
                connection.query(
                    'UPDATE users SET machine_name=?, date_of_birth=?, timezone_id=?, account_status=?, adtrust_dsl=?, amount_spent=?, currency=?, update_time=NOW() WHERE id=? AND UID=?',
                    [
                        machine_name,
                        date_of_birth,
                        timezone_id,
                        account_status,
                        adtrust_dsl,
                        amount_spent,
                        currency,
                        id,
                        UID,
                    ],
                    (updateErr, updateResult) => {
                        if (updateErr) {
                            res.status(500).json({ message: updateErr.message });
                            return;
                        }
                        res.json({
                            id: id,
                            UID: UID,
                            ...req.body,
                            update_time: new Date(),
                            message: 'User information updated successfully',
                        });
                    }
                );
            } else {
                // Nếu người dùng không tồn tại, thực hiện tạo mới người dùng
                connection.query(
                    'INSERT INTO users (id, UID, machine_name, date_of_birth, timezone_id, account_status, adtrust_dsl, amount_spent, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        id,
                        UID,
                        machine_name,
                        date_of_birth,
                        timezone_id,
                        account_status,
                        adtrust_dsl,
                        amount_spent,
                        currency,
                    ],
                    (insertErr, insertResult) => {
                        if (insertErr) {
                            res.status(500).json({ message: insertErr.message });
                            return;
                        }
                        res.json({
                            id: insertResult.insertId,
                            UID: UID,
                            ...req.body,
                            update_time: new Date(),
                            message: 'New user created successfully',
                        });
                    }
                );
            }
        }
    );
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
