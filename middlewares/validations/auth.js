const jwt = require('jsonwebtoken');
const db = require('../db/mysql_connect');
const APIError = require('../utils/erros');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new APIError('Bu işlem için giriş yapmalısınız', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
        
        if (rows.length === 0) {
            return next(new APIError('Kullanıcı bulunamadı', 404));
        }

        req.user = rows[0];
        next();
    } catch (err) {
        return next(new APIError('Geçersiz token', 401));
    }
};

module.exports = { protect };