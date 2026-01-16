const getDashboardStats = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get dashboard stats endpoint' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats
};
