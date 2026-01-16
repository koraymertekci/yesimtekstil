const db = require('../db/mysql_connect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const APIError = require('../utils/erros');
const Response = require('../utils/response');

const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        
        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            throw new APIError("Bu email adresi zaten kayıtlı", 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'user']
        );

        new Response({ id: result.insertId, email }, "Kayıt başarılı").success(res);
    } catch (error) {
        next(new APIError(error.message, 500));
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            throw new APIError("Kullanıcı bulunamadı", 404);
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new APIError("Hatalı şifre", 401);
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' }
        );

        new Response({ token, user: { id: user.id, username: user.username, email: user.email } }, "Giriş başarılı").success(res);
    } catch (error) {
        next(new APIError(error.message, 500));
    }
};

const getMe = async (req, res, next) => {
    try {
        const [users] = await db.execute('SELECT id, username, email, role FROM users WHERE id = ?', [req.user.id]);
        new Response(users[0], "Kullanıcı bilgileri getirildi").success(res);
    } catch (error) {
        next(new APIError(error.message, 500));
    }
};

module.exports = {
    register,
    login,
    getMe
};