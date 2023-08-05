const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const WebSocket = require('ws');

const app = express();
const port = 8080;

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

    // Khởi tạo WebSocket server sau khi đã kết nối thành công đến MySQL
    const wss = new WebSocket.Server({
        server: app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        })
    });

    // Khi có client kết nối tới WebSocket
    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');

        // Gửi thông báo khi có thay đổi dữ liệu trong cơ sở dữ liệu
        function sendUpdate(data) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        }

        // Các API và xử lý cập nhật dữ liệu nằm ở đây...
        // (phần code để xử lý API và các sự kiện từ client)
        // ...

        // API để cập nhật thông tin người dùng
        app.put('/users/:id', (req, res) => {
            // Xử lý cập nhật thông tin người dùng
            // ...

            // Sau khi cập nhật, gửi thông báo cập nhật tới client qua WebSocket
            sendUpdate({ action: 'update', user: updatedUser });
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

            res.json(results);
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
                                const updatedUser = {
                                    id,
                                    machine_name,
                                    UID,
                                    date_of_birth,
                                    timezone_id,
                                    account_status,
                                    adtrust_dsl,
                                    amount_spent,
                                    currency,
                                    update_time: new Date(),
                                };
                                res.json({
                                    ...updatedUser,
                                    message: 'User information updated successfully',
                                });

                                // Sau khi cập nhật, gửi thông báo cập nhật tới client qua WebSocket
                                sendUpdate({ action: 'update', user: updatedUser });
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
                                const newUser = {
                                    id: insertResult.insertId,
                                    machine_name,
                                    UID,
                                    date_of_birth,
                                    timezone_id,
                                    account_status,
                                    adtrust_dsl,
                                    amount_spent,
                                    currency,
                                    update_time: new Date(),
                                };
                                res.json({
                                    ...newUser,
                                    message: 'New user created successfully',
                                });

                                // Sau khi tạo mới, gửi thông báo cập nhật tới client qua WebSocket
                                sendUpdate({ action: 'create', user: newUser });
                            }
                        );
                    }
                }
            );
        });

        // ... (các API khác, phần code đã giữ nguyên)
    });
});
