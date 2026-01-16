const getMonthlySales = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get monthly sales endpoint' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMonthlySales
};
